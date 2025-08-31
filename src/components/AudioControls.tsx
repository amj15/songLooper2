import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import LoopIcon from "@mui/icons-material/Loop";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { Box, Button, IconButton, Typography, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import * as React from 'react';
import { supabase } from '../services/supabase';
import BeatCounter from './BeatCounter';

interface AudioControlsProps {
    project: any;
    handlePlay: () => void;
    handleStop: () => void;
    handleLoop?: () => void;
    isPlaying: boolean;
    currentTime: number;
    onToggleEditSections?: () => void;
    isEditingSections?: boolean;
    playbackRate?: number;
    onPlaybackRateChange?: (rate: number) => void;
    sections?: Array<{
        id: string;
        startBar: number;
        endBar: number;
        label: string;
        letter: string;
        color: string;
    }>;
}

const AudioControls: React.FC<AudioControlsProps & { click: boolean; setClick: React.Dispatch<React.SetStateAction<boolean>> }> = ({ 
    project,
    handlePlay,
    handleStop,
    handleLoop,
    isPlaying,
    currentTime,
    onToggleEditSections,
    isEditingSections = false,
    click,
    setClick,
    playbackRate = 1.0,
    onPlaybackRateChange,
    sections = []
}) => {
    // Estados para edición de nombre y categoría
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(project?.name || '');
    const [editCategory, setEditCategory] = React.useState(project?.category || 'General');
    const [isSaving, setIsSaving] = React.useState(false);

    // Actualizar estados cuando cambie el proyecto
    React.useEffect(() => {
        if (project) {
            setEditName(project.name || '');
            setEditCategory(project.category || 'General');
        }
    }, [project]);

    // Función para guardar cambios
    const handleSaveChanges = async () => {
        if (!project?.id) return;
        
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ 
                    name: editName,
                    category: editCategory
                })
                .eq('id', project.id);

            if (error) throw error;
            
            setIsEditing(false);
            // Recargar la página o actualizar el estado del proyecto padre
            window.location.reload();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Error al guardar los cambios');
        } finally {
            setIsSaving(false);
        }
    };

    // Función para cancelar edición
    const handleCancelEdit = () => {
        setEditName(project?.name || '');
        setEditCategory(project?.category || 'General');
        setIsEditing(false);
    };

    // Memoizamos el formateo del tiempo para evitar cálculos innecesarios
    const formattedTime = React.useMemo(() => {
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const decimals = Math.floor((currentTime * 10) % 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${decimals}`;
    }, [currentTime]);

    // BPM actual basado en el playbackRate
    const currentBPM = React.useMemo(() => {
        if (project?.tempo) {
            return Math.round(project.tempo * playbackRate);
        }
        return 120; // BPM por defecto
    }, [project?.tempo, playbackRate]);

    // BPM original del proyecto
    const originalBPM = project?.tempo || 120;

    // Manejar cambio de BPM
    const handleBPMChange = (newBPM: number) => {
        if (originalBPM > 0) {
            const newRate = newBPM / originalBPM;
            // Limitar el rate entre 0.5x y 2.0x
            const clampedRate = Math.max(0.5, Math.min(2.0, newRate));
            if (onPlaybackRateChange) {
                onPlaybackRateChange(clampedRate);
            }
        }
    };

    // Funciones para botones +/-
    const handleBPMIncrement = () => {
        handleBPMChange(currentBPM + 5);
    };

    const handleBPMDecrement = () => {
        handleBPMChange(currentBPM - 5);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            padding: 1, 
            width: '100%',
            flexWrap: 'wrap'
        }}>
            {/* Project Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isEditing ? (
                    <>
                        <TextField
                            size="small"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Proyecto"
                            sx={{ width: '120px' }}
                        />
                        <IconButton size="small" onClick={handleSaveChanges} disabled={isSaving}>
                            <SaveIcon fontSize="small" />
                        </IconButton>
                        <Button size="small" onClick={handleCancelEdit} disabled={isSaving}>
                            Cancelar
                        </Button>
                    </>
                ) : (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {editCategory} &gt; {editName}
                        </Typography>
                        <IconButton size="small" onClick={() => setIsEditing(true)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </>
                )}
            </Box>

            {/* Transport Controls */}
            <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                    onClick={handlePlay}
                    color={isPlaying ? 'success' : 'primary'}
                    size="small"
                >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton onClick={handleStop} color="warning" size="small">
                    <StopIcon />
                </IconButton>
                {handleLoop && (
                    <IconButton onClick={handleLoop} size="small">
                        <LoopIcon />
                    </IconButton>
                )}
            </Box>

            {/* Beat Counter with section info */}
            <BeatCounter
                currentTime={currentTime}
                bpm={currentBPM}
                timeSignature={project?.time_signature || "4/4"}
                sections={sections}
            />

            {/* BPM Control */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontSize: '10px' }}>
                    BPM:
                </Typography>
                <IconButton onClick={handleBPMDecrement} size="small">
                    <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>
                    {currentBPM}
                </Typography>
                <IconButton onClick={handleBPMIncrement} size="small">
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Time Display */}
            <Typography 
                variant="h6" 
                sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    minWidth: '80px',
                    textAlign: 'center',
                    backgroundColor: '#000',
                    color: '#0f0',
                    padding: '4px 8px',
                    borderRadius: '4px'
                }}
            >
                {formattedTime}
            </Typography>

            {/* Additional Controls */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onToggleEditSections && (
                    <IconButton
                        onClick={onToggleEditSections}
                        color={isEditingSections ? 'secondary' : 'default'}
                        size="small"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                )}
                <IconButton
                    onClick={() => setClick(!click)}
                    color={click ? 'primary' : 'default'}
                    size="small"
                >
                    <MusicNoteIcon fontSize="small" />
                </IconButton>
            </Box>
        </Box>
    );
};

export default AudioControls;