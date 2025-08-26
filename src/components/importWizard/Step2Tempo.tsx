import { Pause, PlayArrow, SkipPrevious } from "@mui/icons-material";
import {
    Alert,
    Box,
    Button,
    LinearProgress,
    Paper,
    Typography
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

interface SongData {
  audioFile: File | null;
  tempo: number | null;
  [key: string]: any;
}

interface Step2TempoProps {
  next: () => void;
  back: () => void;
  songData: SongData;
  setSongData: (data: SongData) => void;
}

export default function Step2Tempo({ next, back, songData, setSongData }: Step2TempoProps) {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!songData.audioFile) return;

    const audio = new Audio(URL.createObjectURL(songData.audioFile));
    audioRef.current = audio;

    const updateProgress = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.pause();
      audioRef.current = null;
    };
  }, [songData.audioFile]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTap = useCallback(() => {
    const now = performance.now();

    // Animación de pulso
    setPulse(true);
    setTimeout(() => setPulse(false), 200);

    setTaps((prev) => {
      const updated = [...prev, now];
      if (updated.length < 2) return updated;

      // Calcular intervalos válidos
      const intervals = updated
        .slice(1)
        .map((t, i) => t - updated[i])
        .filter((i) => i > 200 && i < 2000); // Entre 30-300 BPM

      if (intervals.length === 0) return updated;

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);

      setBpm(newBpm);

      // Auto-avance cuando tengamos suficientes taps estables
      if (intervals.length >= 20 && isStable(intervals)) {
        setSongData({ ...songData, tempo: newBpm });
        if (audioRef.current) {
          audioRef.current.pause();
        }
        next();
      }

      return updated;
    });
  }, [next, setSongData, songData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTap]);

  const tapCount = taps.length;
  const minTaps = 20;
  const tapProgress = Math.min((tapCount / minTaps) * 100, 100);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Detectar el tempo
      </Typography>
      
      <Typography variant="body1" textAlign="center" sx={{ maxWidth: 500 }}>
        Reproduce la canción y pulsa la barra espaciadora o el botón al ritmo del beat.
        Detectaremos el tempo automáticamente.
      </Typography>

      {/* Controls de audio */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<SkipPrevious />}
          onClick={back}
        >
          Atrás
        </Button>
        
        <Button
          variant="contained"
          startIcon={isPlaying ? <Pause /> : <PlayArrow />}
          onClick={togglePlayback}
          size="large"
        >
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </Button>
      </Box>

      {/* Progress bar del audio */}
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {/* Círculo del BPM */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper
          elevation={pulse ? 8 : 4}
          sx={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease-out',
            transform: pulse ? 'scale(1.1)' : 'scale(1)',
            backgroundColor: bpm ? 'primary.main' : 'grey.300',
            color: bpm ? 'primary.contrastText' : 'text.secondary',
            '&:hover': {
              backgroundColor: bpm ? 'primary.dark' : 'grey.400',
            }
          }}
          onClick={handleTap}
        >
          <Box textAlign="center">
            <Typography variant="h3" component="div" fontWeight="bold">
              {bpm || '...'}
            </Typography>
            <Typography variant="caption" display="block">
              BPM
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Progress de taps */}
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Typography variant="body2" gutterBottom>
          Taps: {tapCount}/{minTaps} ({Math.round(tapProgress)}%)
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={tapProgress} 
          color={tapProgress >= 100 ? "success" : "primary"}
        />
      </Box>

      {tapCount >= minTaps && bpm && (
        <Alert severity="info">
          Tempo detectado: {bpm} BPM. Continúa marcando para mayor precisión o avanza al siguiente paso.
        </Alert>
      )}

      {/* Manual next button */}
      {bpm && tapCount >= 8 && (
        <Button
          variant="contained"
          onClick={() => {
            setSongData({ ...songData, tempo: bpm });
            if (audioRef.current) {
              audioRef.current.pause();
            }
            next();
          }}
        >
          Continuar con {bpm} BPM
        </Button>
      )}
    </Box>
  );
}

function isStable(intervals: number[]): boolean {
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const deviations = intervals.map((i) => Math.abs(i - avg));
  const maxDev = Math.max(...deviations);
  return maxDev < 50; // Tolerancia de 50ms
}