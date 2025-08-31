import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Card,
    CardContent,
    Chip,
    ButtonGroup
} from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayIcon, Stop as StopIcon } from '@mui/icons-material';
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import type { Section } from '../types/sections';
import { useMusicalNotation } from '../hooks/useMusicalNotation';
import { DRUM_INSTRUMENTS } from '../types/drumNotation';
import type { DrumInstrument } from '../types/drumNotation';

// Fallback en caso de que la importación falle
const FALLBACK_INSTRUMENTS = {
    kick: { displayName: 'Kick', color: '#2E7D32' },
    snare: { displayName: 'Snare', color: '#D32F2F' },
    hihat: { displayName: 'Hi-Hat', color: '#F57C00' },
    crash: { displayName: 'Crash', color: '#7B1FA2' },
    ride: { displayName: 'Ride', color: '#303F9F' },
    tom1: { displayName: 'Tom 1', color: '#689F38' },
};

interface BarNotationDrawerProps {
    open: boolean;
    onClose: () => void;
    barIndex: number | null;
    section?: Section;
    barNumber: number;
    globalBarNumber: number;
    isPlaying: boolean;
    onPlayBar: () => void;
    onStopBar: () => void;
    currentTime?: number; // Tiempo actual de reproducción
    barsData?: Array<{ start: number; end: number; totalBeats: number; beatDuration: number }>; // Datos de los compases
    projectId?: string; // ID del proyecto para persistencia
}

const BarNotationDrawer: React.FC<BarNotationDrawerProps> = ({
    open,
    onClose,
    barIndex,
    section,
    barNumber,
    globalBarNumber,
    isPlaying,
    onPlayBar,
    onStopBar,
    currentTime = 0,
    barsData,
    projectId
}) => {
    const svgRef = useRef<HTMLDivElement>(null);
    const dropZonesRef = useRef<HTMLDivElement>(null);
    
    // Estado para drag & drop
    const [draggedElement, setDraggedElement] = useState<DrumInstrument | null>(null);
    const [draggedDuration, setDraggedDuration] = useState<number>(1);
    const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
    
    // Usar el hook de notación musical
    const {
        notes,
        selectedNoteType,
        timeSignature,
        totalSubdivisions,
        setSelectedNoteType,
        addNote,
        clearNotes,
        addDrumNote,
        canPlaceNote
    } = useMusicalNotation({ projectId, barIndex });


    // Inicializar VexFlow cuando se abra el drawer
    useEffect(() => {
        if (open && svgRef.current) {
            renderNotation();
        }
    }, [open, notes]);

    const renderNotation = () => {
        if (!svgRef.current) return;
        
        // Limpiar el contenido anterior
        svgRef.current.innerHTML = '';
        
        // Crear el renderer SVG más amplio
        const renderer = new Renderer(svgRef.current, Renderer.Backends.SVG);
        renderer.resize(800, 250);
        const context = renderer.getContext();
        
        // Crear el pentagrama más largo
        const stave = new Stave(20, 50, 720);
        stave.addClef('treble').addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
        stave.setContext(context).draw();
        
        // Usar las notas del hook o crear notas de ejemplo si está vacío
        const staveNotes = notes.length > 0 ? notes : [
            new StaveNote({ keys: ['c/4'], duration: 'qr' }),
            new StaveNote({ keys: ['c/4'], duration: 'qr' }),
            new StaveNote({ keys: ['c/4'], duration: 'qr' }),
            new StaveNote({ keys: ['c/4'], duration: 'qr' })
        ];
        
        // Verificar que tengamos notas válidas
        if (staveNotes.length === 0) return;
        
        // Crear la voz y añadir las notas
        const voice = new Voice({ numBeats: timeSignature[0], beatValue: timeSignature[1] });
        voice.addTickables(staveNotes);
        
        // Formatear y renderizar con más espacio
        new Formatter().joinVoices([voice]).format([voice], 650);
        voice.draw(context, stave);
    };

    // Funciones para drag & drop
    const handleDragStart = useCallback((drumElement: DrumInstrument, duration: number) => {
        setDraggedElement(drumElement);
        setDraggedDuration(duration);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, position: number) => {
        e.preventDefault();
        if (draggedElement && canPlaceNote(position, draggedDuration)) {
            setHoveredPosition(position);
        }
    }, [draggedElement, draggedDuration, canPlaceNote]);

    const handleDrop = useCallback((e: React.DragEvent, position: number) => {
        e.preventDefault();
        if (draggedElement && addDrumNote) {
            const success = addDrumNote(draggedElement, position, draggedDuration);
            if (success) {
                console.log(`Añadida nota ${draggedElement} en posición ${position}`);
            }
        }
        setDraggedElement(null);
        setHoveredPosition(null);
    }, [draggedElement, draggedDuration, addDrumNote]);

    const handleDragEnd = useCallback(() => {
        setDraggedElement(null);
        setHoveredPosition(null);
    }, []);

    // Verificar que barIndex no sea null antes de renderizar
    if (barIndex === null) return null;

    return (
        <Drawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    height: '60vh',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    padding: 2
                }
            }}
            ModalProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Editor de Notación - Compás {globalBarNumber}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Información del Compás
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip 
                                label={`Global: ${globalBarNumber}`} 
                                variant="outlined" 
                                size="small" 
                            />
                            {section && (
                                <Chip 
                                    label={`Sección ${section.letter}: ${barNumber}`}
                                    variant="outlined" 
                                    size="small"
                                    sx={{ 
                                        backgroundColor: section.color + '20',
                                        borderColor: section.color
                                    }}
                                />
                            )}
                        </Box>
                        {section && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>{section.type.charAt(0).toUpperCase() + section.type.slice(1)}</strong> - {section.label}
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Reproducción
                        </Typography>
                        <Button
                            variant={isPlaying ? "outlined" : "contained"}
                            startIcon={isPlaying ? <StopIcon /> : <PlayIcon />}
                            onClick={isPlaying ? onStopBar : onPlayBar}
                            color={isPlaying ? "secondary" : "primary"}
                        >
                            {isPlaying ? 'Parar' : 'Reproducir en Bucle'}
                        </Button>
                    </CardContent>
                </Card>
            </Box>

            {/* Área principal para la notación musical */}
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1">
                            Notación Musical - Compás {globalBarNumber}
                        </Typography>
                        
                        {/* Controles de edición */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
                                Duración:
                            </Typography>
                            <ButtonGroup size="small" variant="outlined">
                                <Button 
                                    variant={selectedNoteType === 'w' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedNoteType('w')}
                                >
                                    Redonda
                                </Button>
                                <Button 
                                    variant={selectedNoteType === 'h' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedNoteType('h')}
                                >
                                    Blanca
                                </Button>
                                <Button 
                                    variant={selectedNoteType === 'q' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedNoteType('q')}
                                >
                                    Negra
                                </Button>
                                <Button 
                                    variant={selectedNoteType === '8' ? 'contained' : 'outlined'}
                                    onClick={() => setSelectedNoteType('8')}
                                >
                                    Corchea
                                </Button>
                            </ButtonGroup>
                            <Button 
                                variant="outlined" 
                                color="secondary" 
                                onClick={clearNotes}
                                size="small"
                            >
                                Limpiar
                            </Button>
                        </Box>
                    </Box>
                    
                    {/* VexFlow Notation Area with Drop Zones */}
                    <Box sx={{ position: 'relative', mb: 2 }}>
                        <Box
                            ref={svgRef}
                            sx={{
                                border: '2px solid #ddd',
                                borderRadius: 2,
                                backgroundColor: '#ffffff',
                                minHeight: 280,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        />
                        
                        {/* Drop Zones Overlay */}
                        <Box
                            ref={dropZonesRef}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                pointerEvents: draggedElement ? 'auto' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingX: '50px' // Alinear con el área del pentagrama
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    width: '720px', // Mismo ancho que el pentagrama
                                    height: '100px',
                                    position: 'relative'
                                }}
                            >
                                {Array.from({ length: totalSubdivisions }, (_, index) => (
                                    <Box
                                        key={index}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        sx={{
                                            flex: 1,
                                            height: '100%',
                                            border: draggedElement ? '1px dashed #ccc' : 'none',
                                            backgroundColor: 
                                                hoveredPosition === index && canPlaceNote(index, draggedDuration) 
                                                    ? 'rgba(76, 175, 80, 0.2)' 
                                                    : hoveredPosition === index 
                                                        ? 'rgba(244, 67, 54, 0.2)'
                                                        : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onDragLeave={() => setHoveredPosition(null)}
                                    >
                                        {draggedElement && hoveredPosition === index && (
                                            <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)' }}>
                                                {canPlaceNote(index, draggedDuration) ? '✓' : '✗'}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                    
                    {/* Drum Elements Selector */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
                            Arrastra los elementos de batería al pentagrama:
                        </Typography>
                        
                        {/* Duración selector */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                            <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
                                Duración:
                            </Typography>
                            <ButtonGroup size="small" variant="outlined">
                                <Button 
                                    variant={draggedDuration === 4 ? 'contained' : 'outlined'}
                                    onClick={() => setDraggedDuration(4)}
                                >
                                    Negra (4)
                                </Button>
                                <Button 
                                    variant={draggedDuration === 2 ? 'contained' : 'outlined'}
                                    onClick={() => setDraggedDuration(2)}
                                >
                                    Corchea (2)
                                </Button>
                                <Button 
                                    variant={draggedDuration === 1 ? 'contained' : 'outlined'}
                                    onClick={() => setDraggedDuration(1)}
                                >
                                    Semicorchea (1)
                                </Button>
                            </ButtonGroup>
                        </Box>
                        
                        {/* Drum elements */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {Object.entries(DRUM_INSTRUMENTS || FALLBACK_INSTRUMENTS).map(([key, config]) => (
                                <Box
                                    key={key}
                                    draggable
                                    onDragStart={() => handleDragStart(key as DrumInstrument, draggedDuration)}
                                    onDragEnd={handleDragEnd}
                                    sx={{
                                        padding: '8px 16px',
                                        border: '2px solid',
                                        borderColor: config.color,
                                        borderRadius: 2,
                                        backgroundColor: config.color + '20',
                                        cursor: 'grab',
                                        userSelect: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        '&:hover': {
                                            backgroundColor: config.color + '40',
                                            transform: 'scale(1.05)'
                                        },
                                        '&:active': {
                                            cursor: 'grabbing'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: config.color
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: config.color }}>
                                        {config.displayName}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Drawer>
    );
};

export default BarNotationDrawer;