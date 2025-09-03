import React, { useEffect, useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Divider,
    Alert
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import DrumSequencer from './DrumSequencer';
import DrumScorePreview from './DrumScorePreview';
import type { Section } from '../types/sections';
import { barNotationService, type DrumNote } from '../services/barNotationService';

// DrumNote type ya está importado desde barNotationService

interface BarNotationDrawerProps {
    open: boolean;
    onClose: () => void;
    barIndex: number;
    section?: Section;
    barNumber?: number;
    globalBarNumber?: number;
    isPlaying?: boolean;
    onPlayBar?: () => void;
    onStopBar?: () => void;
    currentTime?: number;
    barsData?: Array<{ start: number; end: number; totalBeats: number; beatDuration: number }>;
    projectId?: string;
    timeSignature?: string;
    subdivisionResolution?: number;
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
    projectId,
    timeSignature = "4/4",
    subdivisionResolution = 16
}) => {
    const [notes, setNotes] = useState<DrumNote[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Cargar notas existentes cuando se abre el drawer
    useEffect(() => {
        if (open && projectId) {
            loadNotation();
        }
    }, [open, projectId, barIndex]);

    const loadNotation = async () => {
        try {
            if (!projectId) {
                setNotes([]);
                return;
            }
            
            const loadedNotes = await barNotationService.loadBarNotation(projectId, barIndex);
            setNotes(loadedNotes);
        } catch (error) {
            console.error('Error loading notation:', error);
            setNotes([]);
        }
    };

    const handleNotesChange = (newNotes: DrumNote[]) => {
        setNotes(newNotes);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!projectId) return;
        
        setIsSaving(true);
        try {
            await barNotationService.saveBarNotation(
                projectId, 
                barIndex, 
                notes, 
                timeSignature, 
                subdivisionResolution
            );
            
            setHasChanges(false);
            console.log('Notation saved successfully for bar', barIndex);
        } catch (error) {
            console.error('Error saving notation:', error);
            alert('Error al guardar la notación');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (hasChanges) {
            const confirmClose = window.confirm('¿Cerrar sin guardar? Se perderán los cambios.');
            if (!confirmClose) return;
        }
        setHasChanges(false);
        onClose();
    };

    const handleClear = () => {
        const confirmClear = window.confirm('¿Borrar toda la notación del compás?');
        if (confirmClear) {
            setNotes([]);
            setHasChanges(true);
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={handleClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', md: '80%', lg: '70%' },
                    maxWidth: '1200px'
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid #e0e0e0',
                    background: section?.color ? `${section.color}15` : '#f5f5f5'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Editor de Batería
                        </Typography>
                        <IconButton onClick={handleClose} size="large">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body1">
                            <strong>Compás:</strong> {barNumber || barIndex + 1}
                            {globalBarNumber && ` (Global: ${globalBarNumber})`}
                        </Typography>
                        
                        {section && (
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                px: 2,
                                py: 0.5,
                                borderRadius: '16px',
                                background: section.color,
                                color: 'white'
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {section.type.charAt(0).toUpperCase() + section.type.slice(1)} {section.letter}
                                </Typography>
                                <Typography variant="body2">
                                    {section.label}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {hasChanges && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            Hay cambios sin guardar
                        </Alert>
                    )}
                </Box>

                {/* Controls */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleClear}
                            disabled={notes.length === 0}
                        >
                            Limpiar Todo
                        </Button>

                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                        {onPlayBar && (
                            <Button
                                variant={isPlaying ? "contained" : "outlined"}
                                color="success"
                                onClick={isPlaying ? onStopBar : onPlayBar}
                            >
                                {isPlaying ? 'Detener' : 'Reproducir Compás'}
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Main Content - Drum Sequencer */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    <DrumSequencer
                        barIndex={barIndex}
                        notes={notes}
                        onNotesChange={handleNotesChange}
                        timeSignature={timeSignature}
                        subdivisionResolution={subdivisionResolution}
                    />

                    {/* Score Preview */}
                    <Box sx={{ mt: 3 }}>
                        <DrumScorePreview
                            notes={notes}
                            timeSignature={timeSignature}
                            subdivisionResolution={subdivisionResolution}
                            width={500}
                            height={150}
                        />
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', background: '#f9f9f9' }}>
                    <Typography variant="caption" color="textSecondary">
                        💡 <strong>Tips:</strong> Click para crear/borrar notas • Arrastra horizontalmente para notas largas • 
                        Click derecho para modificadores • Las líneas doradas marcan los tiempos principales
                    </Typography>
                </Box>
            </Box>
        </Drawer>
    );
};

export default BarNotationDrawer;