import React, { useEffect, useRef } from 'react';
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
    
    // Usar el hook de notación musical
    const {
        notes,
        selectedNoteType,
        timeSignature,
        setSelectedNoteType,
        addNote,
        clearNotes
    } = useMusicalNotation({ projectId, barIndex });

    // Calcular la posición de la barra roja
    const calculateProgressPosition = () => {
        if (!isPlaying || !barsData || barIndex === null || !barsData[barIndex]) return 0;
        
        const bar = barsData[barIndex];
        const relativeTime = currentTime - bar.start;
        const barDuration = bar.end - bar.start;
        const progressPercentage = Math.max(0, Math.min(100, (relativeTime / barDuration) * 100));
        
        
        return progressPercentage;
    };

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
        
        // Crear el renderer SVG
        const renderer = new Renderer(svgRef.current, Renderer.Backends.SVG);
        renderer.resize(500, 200);
        const context = renderer.getContext();
        
        // Crear el pentagrama
        const stave = new Stave(10, 40, 400);
        stave.addClef('treble').addTimeSignature(`${timeSignature.numerator}/${timeSignature.denominator}`);
        stave.setContext(context).draw();
        
        // Crear notas de ejemplo si no hay notas guardadas
        const staveNotes = notes.length > 0 ? notes : [
            new StaveNote({ keys: ['c/4'], duration: 'q' }),
            new StaveNote({ keys: ['d/4'], duration: 'q' }),
            new StaveNote({ keys: ['e/4'], duration: 'q' }),
            new StaveNote({ keys: ['f/4'], duration: 'q' })
        ];
        
        // Crear la voz y añadir las notas
        const voice = new Voice({ numBeats: timeSignature.numerator, beatValue: timeSignature.denominator });
        voice.addTickables(staveNotes);
        
        // Formatear y renderizar
        new Formatter().joinVoices([voice]).format([voice], 350);
        voice.draw(context, stave);
    };

    // Las funciones addNote y clearNotes ya están disponibles desde el hook

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
                    
                    {/* VexFlow Notation Area */}
                    <Box
                        ref={svgRef}
                        sx={{
                            border: '2px solid #ddd',
                            borderRadius: 2,
                            backgroundColor: '#ffffff',
                            minHeight: 200,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mb: 2,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    />
                    
                    {/* Piano-style note selector */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5'].map((note) => (
                            <Button
                                key={note}
                                variant="outlined"
                                size="small"
                                onClick={() => addNote(note)}
                                sx={{ 
                                    minWidth: '60px',
                                    backgroundColor: note.includes('#') ? '#333' : '#fff',
                                    color: note.includes('#') ? '#fff' : '#000',
                                    '&:hover': {
                                        backgroundColor: note.includes('#') ? '#555' : '#f0f0f0'
                                    }
                                }}
                            >
                                {note.replace('/', '').toUpperCase()}
                            </Button>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Drawer>
    );
};

export default BarNotationDrawer;