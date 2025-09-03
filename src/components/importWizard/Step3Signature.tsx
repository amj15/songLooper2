import { PlayArrow, SkipPrevious, Stop } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

const REQUIRED_TAPS = 5;
const TIME_SIGNATURES = ["4/4", "3/4", "6/8", "2/4", "12/4", "12/8"];
const SEMICORCHEA = 1 / 16;

interface SongData {
  audioFile: File | null;
  tempo: number | null;
  timeSignature: string;
  duration: number;
  downbeats: number[];
  bars: number[];
  [key: string]: any;
}

interface Step3TimeSignatureProps {
  next: () => void;
  back: () => void;
  songData: SongData;
  setSongData: (data: SongData) => void;
}

export default function Step3TimeSignature({ next, back, songData, setSongData }: Step3TimeSignatureProps) {
  const [selected, setSelected] = useState(songData.timeSignature || "4/4");
  const [validTaps, setValidTaps] = useState<number[]>([]);
  const [listening, setListening] = useState(false);
  const [duration, setDuration] = useState(songData.duration || 0);
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!songData.audioFile) return;

    const audio = new Audio(URL.createObjectURL(songData.audioFile));
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration * 1000);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [songData.audioFile]);

  const startListening = () => {
    if (!audioRef.current) return;
    
    setValidTaps([]);
    setErrorMsg("");
    setListening(true);
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const stopListening = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setListening(false);
  };

  const handleTap = useCallback(() => {
    if (!listening || !audioRef.current) return;

    const now = audioRef.current.currentTime * 1000;
    const bpm = songData.tempo;
    
    if (!bpm) {
      setErrorMsg("Define el tempo en el paso anterior.");
      return;
    }

    const beatsPerBar = parseInt(selected.split("/")[0]);
    const beatDuration = 60000 / bpm;
    const barDuration = beatDuration * beatsPerBar;
    const tolerance = barDuration * SEMICORCHEA;

    if (validTaps.length === 0) {
      setValidTaps([now]);
      setErrorMsg("");
    } else {
      const firstTap = validTaps[0];
      const expectedNext = firstTap + validTaps.length * barDuration;
      const diff = Math.abs(now - expectedNext);

      if (diff <= tolerance) {
        setValidTaps((prev) => [...prev, now]);
        setErrorMsg("");
      } else {
        setValidTaps([]);
        setErrorMsg("Desajuste detectado. Reiniciando las pulsaciones.");
      }
    }

    if (validTaps.length + 1 >= REQUIRED_TAPS) {
      stopListening();
    }
  }, [listening, validTaps, selected, songData.tempo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      }
    };

    if (listening) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [listening, handleTap]);

  function calcularBars(refTime: number, bpm: number, timeSignature: string, duration: number) {
    const beatsPerBar = parseInt(timeSignature.split("/")[0]);
    const beatDuration = 60000 / bpm;
    const barDuration = beatDuration * beatsPerBar;

    const bars = [];

    // Hacia atrás
    let t = refTime;
    while (t > 0) {
      t -= barDuration;
      if (t > 0) bars.unshift(t);
    }

    // Referencia
    bars.push(refTime);

    // Hacia adelante
    t = refTime + barDuration;
    while (t < duration) {
      bars.push(t);
      t += barDuration;
    }

    return bars;
  }

  const onFinish = () => {
    if (!songData.tempo) {
      setErrorMsg("Falta definir el tempo en el paso anterior.");
      return;
    }

    if (validTaps.length < REQUIRED_TAPS) {
      setErrorMsg(`Marca al menos ${REQUIRED_TAPS} veces el primer tiempo del compás.`);
      return;
    }

    const referenceTap = validTaps[2]; // Usar el tercer tap como referencia
    const bars = calcularBars(referenceTap, songData.tempo, selected, duration);

    setSongData({
      ...songData,
      timeSignature: selected,
      downbeats: validTaps,
      bars,
      duration,
    });

    next();
  };

  const progress = (validTaps.length / REQUIRED_TAPS) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Compás y primer tiempo
      </Typography>

      <Typography variant="body1">
        Selecciona el compás de la canción y marca {REQUIRED_TAPS} veces el primer tiempo del compás.
      </Typography>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Compás</InputLabel>
        <Select
          value={selected}
          label="Compás"
          onChange={(e) => setSelected(e.target.value)}
          disabled={listening}
        >
          {TIME_SIGNATURES.map((ts) => (
            <MenuItem key={ts} value={ts}>
              {ts}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<SkipPrevious />}
          onClick={back}
          disabled={listening}
        >
          Atrás
        </Button>

        {!listening ? (
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={startListening}
            color="success"
          >
            Reproducir y empezar a marcar
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<Stop />}
            onClick={stopListening}
            color="error"
          >
            Parar reproducción
          </Button>
        )}
      </Box>

      {listening && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Alert severity="info">
            Pulsa la barra espaciadora cuando escuches el primer tiempo del compás.
            Marca {REQUIRED_TAPS} veces.
          </Alert>

          {errorMsg && (
            <Alert severity="warning">
              {errorMsg}
            </Alert>
          )}

          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              size={120}
              thickness={4}
              color="success"
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" component="div" color="text.secondary">
                {validTaps.length}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary">
            {validTaps.length}/{REQUIRED_TAPS} marcaciones
          </Typography>
        </Box>
      )}

      {!listening && validTaps.length >= REQUIRED_TAPS && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Alert severity="success">
            Marcaciones completadas correctamente. Compás: {selected}
          </Alert>
          
          <Button
            variant="contained"
            onClick={onFinish}
            size="large"
          >
            Calcular compases y continuar
          </Button>
        </Box>
      )}
    </Box>
  );
}