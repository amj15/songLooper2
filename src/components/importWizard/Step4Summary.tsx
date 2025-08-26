import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Paper,
    Typography
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../../services/supabase";

interface SongData {
  audioFile: File | null;
  name: string;
  tempo: number | null;
  timeSignature: string;
  bars: number[];
  downbeats: number[];
  [key: string]: any;
}

interface Step4SummaryProps {
  back: () => void;
  songData: SongData;
}

export default function Step4Summary({ back, songData }: Step4SummaryProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!songData.audioFile) {
      setError("Falta el archivo de audio");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("No se pudo obtener el usuario. Asegúrate de haber iniciado sesión.");
      }

      // 2. Subir archivo a Supabase Storage
      const songId = uuidv4();
      const fileExt = songData.audioFile.name.split('.').pop() || 'mp3';
      const filePath = `${songId}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user.songs")
        .upload(filePath, songData.audioFile);

      if (uploadError) {
        throw new Error("Error subiendo el archivo de audio: " + uploadError.message);
      }

      const { error: insertError } = await supabase.from("projects").insert({
        user_id: user.id,
        name: songData.name,
        tempo: songData.tempo,
        time_signature: songData.timeSignature,
        bars: songData.bars,
        audio_url: filePath,
      });

      if (insertError) {
        throw new Error("Error al guardar el proyecto: " + insertError.message);
      }

      setIsSaved(true);
      navigate("/"); // redirección tras guardar
    } catch (err: any) {
      console.error("Fallo al guardar el proyecto:", err);
      setError("Error: " + (err?.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4" component="h2" fontWeight="bold">
        Resumen del proyecto
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          backgroundColor: "grey.100", 
          display: "flex", 
          flexDirection: "column", 
          gap: 1 
        }}
      >
        <Typography variant="body2">
          <strong>Nombre:</strong> {songData.name}
        </Typography>
        <Typography variant="body2">
          <strong>BPM estimado:</strong> {songData.tempo}
        </Typography>
        <Typography variant="body2">
          <strong>Compás:</strong> {songData.timeSignature}
        </Typography>
        <Typography variant="body2">
          <strong>Número de compases:</strong> {songData.downbeats?.length || 0}
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={isSaved || saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
          sx={{ px: 3, py: 1.5 }}
        >
          {saving ? "Guardando..." : isSaved ? "Guardado" : "Guardar proyecto"}
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          onClick={back}
          disabled={saving}
          sx={{ px: 3, py: 1.5 }}
        >
          Volver
        </Button>
      </Box>
    </Box>
  );
}