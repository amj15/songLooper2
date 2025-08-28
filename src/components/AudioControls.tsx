import EditIcon from "@mui/icons-material/Edit";
import LoopIcon from "@mui/icons-material/Loop";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { AppBar, Box, Button, ButtonGroup, Container, IconButton, styled, Toolbar, Typography, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import * as React from 'react';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderRadius: theme.shape.borderRadius,
    backdropFilter: 'blur(24px)',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    padding: theme.spacing(1, 1.5),
}));

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
    onPlaybackRateChange
}) => {
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

    // Manejar input directo de BPM
    const handleBPMInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && value > 0) {
            handleBPMChange(value);
        }
    };

    return (
        <AppBar
            position="fixed"
            enableColorOnDark
            sx={{
                boxShadow: 0,
                bgcolor: 'transparent',
                backgroundImage: 'none',
                mt: 'calc(var(--template-frame-height, 0px) + 28px)',
            }}
        >
            <Container maxWidth="lg">
                <StyledToolbar variant="dense" disableGutters>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
                        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <Button variant="text" color="info" size="small">
                                {project?.name || 'Project Name'}
                            </Button>
                            <Button variant="text" color="info" size="small">
                                Testimonials
                            </Button>
                            <Button variant="text" color="info" size="small">
                                Highlights
                            </Button>
                            <Button variant="text" color="info" size="small">
                                Pricing
                            </Button>
                            <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }}>
                                FAQ
                            </Button>
                            <Button variant="text" color="info" size="small" sx={{ minWidth: 0 }}>
                                Bloggg
                            </Button>
                        </Box>
                    </Box>
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        <ButtonGroup>
                            <IconButton
                                onClick={handlePlay}
                                sx={{
                                    backgroundColor: "default",
                                }}
                            >
                                { isPlaying ? <PauseIcon /> : <PlayArrowIcon /> }
                            </IconButton>
                            <IconButton
                                onClick={handleStop}
                                sx={{
                                    backgroundColor: "error.main",
                                }}
                            >
                                <StopIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleLoop}
                                sx={{
                                    backgroundColor: "warning.main",
                                }}
                            >
                                <LoopIcon />
                            </IconButton>
                            <IconButton
                                onClick={onToggleEditSections}
                                sx={{
                                    backgroundColor: isEditingSections ? "secondary.main" : "default",
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setClick(!click)}
                                sx={{
                                    backgroundColor: click ? "primary.main" : "default",
                                }}
                            >
                                <MusicNoteIcon />
                            </IconButton>
                        </ButtonGroup>

                        {/* Control de BPM para bateristas */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            minWidth: '180px',
                            mx: 2 
                        }}>
                            <Typography variant="caption" sx={{ fontSize: '10px', mb: 0.5 }}>
                                BPM (Original: {originalBPM})
                            </Typography>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1 
                            }}>
                                <IconButton
                                    onClick={handleBPMDecrement}
                                    size="small"
                                    sx={{ 
                                        width: 28, 
                                        height: 28,
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
                                    }}
                                >
                                    <RemoveIcon fontSize="small" />
                                </IconButton>
                                
                                <TextField
                                    value={currentBPM}
                                    onChange={handleBPMInputChange}
                                    variant="outlined"
                                    size="small"
                                    type="number"
                                    slotProps={{
                                        htmlInput: {
                                            min: Math.round(originalBPM * 0.5),
                                            max: Math.round(originalBPM * 2.0),
                                            style: { 
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                width: '50px'
                                            }
                                        }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '32px',
                                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                            '& fieldset': {
                                                borderColor: '#2196F3',
                                            },
                                        }
                                    }}
                                />
                                
                                <IconButton
                                    onClick={handleBPMIncrement}
                                    size="small"
                                    sx={{ 
                                        width: 28, 
                                        height: 28,
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
                                    }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                height: '40px',
                                backgroundColor: '#000000',
                                borderRadius: '8px',
                                fontFamily: 'Courier New, Courier, monospace',
                                fontSize: '20px',
                                color: '#00FF00',
                                textShadow: '0 0 10px #00FF00, 0 0 20px #00FF00',
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden', // Ensures content respects border radius
                            }}
                        >
                            {formattedTime}
                        </Box>
                    </Box>
                </StyledToolbar>
            </Container>
        </AppBar>
    );
};

export default AudioControls;