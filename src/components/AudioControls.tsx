import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import LoopIcon from "@mui/icons-material/Loop";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { Box, Button, IconButton, Typography, TextField, Slider } from "@mui/material";
import * as React from 'react';
import { supabase } from '../services/supabase';
import BeatCounter from './BeatCounter';
import { metronomeService } from '../services/metronomeService';
import { volumeService } from '../services/volumeService';

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
    audioRef?: React.RefObject<HTMLAudioElement>; // Nueva prop para el audio element
    sections?: Array<{
        id: string;
        startBar: number;
        endBar: number;
        label: string;
        letter: string;
        color: string;
    }>;
    barsData?: Array<{
        start: number;
        end: number;
        totalBeats: number;
        beatDuration: number;
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
    audioRef,
    sections = [],
    barsData
}) => {
    // Estados para edición de nombre y categoría
    const [isEditing, setIsEditing] = React.useState(false);
    const [editName, setEditName] = React.useState(project?.name || '');
    const [editCategory, setEditCategory] = React.useState(project?.category || 'General');
    const [isSaving, setIsSaving] = React.useState(false);
    
    // Estados para el metrónomo - con persistencia
    const [isMetronomeEnabled, setIsMetronomeEnabled] = React.useState(() => {
        try {
            const saved = localStorage.getItem('daw-metronomeEnabled');
            return saved !== null ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });
    
    // Estados para los volúmenes - inicializados desde volumeService
    const [trackVolume, setTrackVolume] = React.useState(() => volumeService.getTrackVolume());
    const [clickVolume, setClickVolume] = React.useState(() => volumeService.getClickVolume());
    const [masterVolume, setMasterVolume] = React.useState(() => volumeService.getMasterVolume());
    
    // Estado para el offset del metrónomo
    const [metronomeOffset, setMetronomeOffset] = React.useState(() => metronomeService.getManualOffset());

    // Actualizar estados cuando cambie el proyecto
    React.useEffect(() => {
        if (project) {
            setEditName(project.name || '');
            setEditCategory(project.category || 'General');
        }
    }, [project]);

    // Conectar audioRef con volumeService
    React.useEffect(() => {
        if (audioRef?.current) {
            volumeService.setAudioElement(audioRef.current);
        }
    }, [audioRef]);

    // Inicializar volúmenes y metrónomo
    React.useEffect(() => {
        volumeService.setTrackVolume(trackVolume);
        volumeService.setClickVolume(clickVolume);
        volumeService.setMasterVolume(masterVolume);
        metronomeService.setEnabled(isMetronomeEnabled); // Sincronizar estado del metrónomo
        metronomeService.refreshVolume();
    }, [trackVolume, clickVolume, masterVolume, isMetronomeEnabled]);

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

    // Funciones del metrónomo
    const handleMetronomeToggle = () => {
        const newEnabled = !isMetronomeEnabled;
        setIsMetronomeEnabled(newEnabled);
        metronomeService.setEnabled(newEnabled);
        
        // Persistir estado del metrónomo
        try {
            localStorage.setItem('daw-metronomeEnabled', JSON.stringify(newEnabled));
        } catch (error) {
            console.warn('Error saving metronome state:', error);
        }
    };

    // Funciones de volumen
    const handleTrackVolumeChange = (event: Event, newValue: number | number[]) => {
        const volume = Array.isArray(newValue) ? newValue[0] : newValue;
        setTrackVolume(volume);
    };

    const handleClickVolumeChange = (event: Event, newValue: number | number[]) => {
        const volume = Array.isArray(newValue) ? newValue[0] : newValue;
        setClickVolume(volume);
    };

    const handleMasterVolumeChange = (event: Event, newValue: number | number[]) => {
        const volume = Array.isArray(newValue) ? newValue[0] : newValue;
        setMasterVolume(volume);
    };

    // Funciones para el offset del metrónomo
    const handleOffsetDecrease = () => {
        metronomeService.adjustOffset(-5);
        setMetronomeOffset(metronomeService.getManualOffset());
    };

    const handleOffsetIncrease = () => {
        metronomeService.adjustOffset(5);
        setMetronomeOffset(metronomeService.getManualOffset());
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
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            placeholder="Categoría"
                            sx={{ width: '100px' }}
                        />
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
                barsData={barsData}
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

            {/* Volume Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Track Volume */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '10px', minWidth: '35px' }}>
                        Track:
                    </Typography>
                    <Slider
                        value={trackVolume}
                        onChange={handleTrackVolumeChange}
                        min={0}
                        max={1}
                        step={0.05}
                        size="small"
                        sx={{ width: 50 }}
                        title={`Track: ${Math.round(trackVolume * 100)}%`}
                    />
                    <Typography variant="caption" sx={{ fontSize: '9px', minWidth: '25px', color: '#666' }}>
                        {Math.round(trackVolume * 100)}%
                    </Typography>
                </Box>

                {/* Click Volume */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                        onClick={handleMetronomeToggle}
                        size="small"
                        color={isMetronomeEnabled ? 'primary' : 'default'}
                        title={isMetronomeEnabled ? 'Desactivar claqueta' : 'Activar claqueta'}
                    >
                        {isMetronomeEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                    </IconButton>
                    
                    <Slider
                        value={clickVolume}
                        onChange={handleClickVolumeChange}
                        min={0}
                        max={1}
                        step={0.05}
                        size="small"
                        sx={{ width: 50 }}
                        title={`Click: ${Math.round(clickVolume * 100)}%`}
                        disabled={!isMetronomeEnabled}
                    />
                    <Typography variant="caption" sx={{ fontSize: '9px', minWidth: '25px', color: isMetronomeEnabled ? '#666' : '#999' }}>
                        {Math.round(clickVolume * 100)}%
                    </Typography>
                </Box>

                {/* Metronome Offset Control */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '9px', minWidth: '30px', color: '#666' }}>
                        Offset:
                    </Typography>
                    <IconButton onClick={handleOffsetDecrease} size="small" sx={{ minWidth: '20px', width: '20px', height: '20px' }}>
                        <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ 
                        fontSize: '9px', 
                        minWidth: '35px', 
                        textAlign: 'center', 
                        color: metronomeOffset !== 0 ? '#ff6600' : '#666',
                        fontWeight: metronomeOffset !== 0 ? 'bold' : 'normal'
                    }}>
                        {metronomeOffset >= 0 ? '+' : ''}{metronomeOffset}ms
                    </Typography>
                    <IconButton onClick={handleOffsetIncrease} size="small" sx={{ minWidth: '20px', width: '20px', height: '20px' }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Master Volume */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontSize: '10px', minWidth: '40px', fontWeight: 'bold' }}>
                        Master:
                    </Typography>
                    <Slider
                        value={masterVolume}
                        onChange={handleMasterVolumeChange}
                        min={0}
                        max={1}
                        step={0.05}
                        size="small"
                        sx={{ width: 50 }}
                        title={`Master: ${Math.round(masterVolume * 100)}%`}
                    />
                    <Typography variant="caption" sx={{ fontSize: '9px', minWidth: '25px', color: '#333', fontWeight: 'bold' }}>
                        {Math.round(masterVolume * 100)}%
                    </Typography>
                </Box>
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