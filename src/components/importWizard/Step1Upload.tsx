import { CloudUpload } from "@mui/icons-material";
import {
    Alert,
    Box,
    Button,
    Paper,
    styled,
    TextField,
    Typography
} from "@mui/material";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface SongData {
  id: string | null;
  name: string;
  audioFile: File | null;
  [key: string]: any;
}

interface Step1UploadProps {
  next: () => void;
  songData: SongData;
  setSongData: (data: SongData) => void;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Step1Upload({ next, songData, setSongData }: Step1UploadProps) {
  const [name, setName] = useState(songData.name || "");
  const [error, setError] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo de audio
    if (!file.type.startsWith('audio/')) {
      setError("Por favor selecciona un archivo de audio válido");
      return;
    }

    setError("");
    const id = songData.id || uuidv4();
    setSongData({
      ...songData,
      id,
      name,
      audioFile: file,
    });
  };

  const handleNext = () => {
    if (!songData.audioFile) {
      setError("Por favor, selecciona un archivo de audio");
      return;
    }
    if (!name.trim()) {
      setError("Por favor, pon un nombre para el proyecto");
      return;
    }
    
    setError("");
    setSongData({ ...songData, name });
    next();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Carga una canción y ponle un nombre
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Nombre del proyecto"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Mi primer loop"
          variant="outlined"
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUpload />}
            size="large"
            sx={{ minHeight: 56 }}
          >
            Seleccionar archivo de audio
            <VisuallyHiddenInput
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
            />
          </Button>

          {songData.audioFile && (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                backgroundColor: 'success.light',
                color: 'success.contrastText',
                textAlign: 'center',
                width: '100%'
              }}
            >
              <Typography variant="body1">
                Archivo seleccionado: {songData.audioFile.name}
              </Typography>
              <Typography variant="body2">
                Tamaño: {(songData.audioFile.size / (1024 * 1024)).toFixed(2)} MB
              </Typography>
            </Paper>
          )}
        </Box>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleNext}
            size="large"
            disabled={!songData.audioFile || !name.trim()}
          >
            Siguiente
          </Button>
        </Box>
      </Box>
    </Box>
  );
}