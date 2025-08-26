import LoopIcon from "@mui/icons-material/Loop";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { AppBar, Box, Button, ButtonGroup, Container, IconButton, styled, Toolbar } from "@mui/material";
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
}

const AudioControls: React.FC<AudioControlsProps & { click: boolean; setClick: React.Dispatch<React.SetStateAction<boolean>> }> = ({ 
    project,
    handlePlay,
    handleStop,
    handleLoop,
    isPlaying,
    currentTime,
    click,
    setClick,
}) => {
    // Memoizamos el formateo del tiempo para evitar cálculos innecesarios
    const formattedTime = React.useMemo(() => {
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const decimals = Math.floor((currentTime * 10) % 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${decimals}`;
    }, [currentTime]);

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
                                onClick={() => setClick(!click)}
                                sx={{
                                    backgroundColor: click ? "primary.main" : "default",
                                }}
                            >
                                <MusicNoteIcon />
                            </IconButton>
                        </ButtonGroup>
                
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