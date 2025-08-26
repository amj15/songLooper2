import { Box, Paper, Step, StepLabel, Stepper } from "@mui/material";
import { useEffect, useState } from "react";
import Step1Upload from "../components/importWizard/Step1Upload";
import Step2Tempo from "../components/importWizard/Step2Tempo";
import Step3TimeSignature from "../components/importWizard/Step3Signature";
import Step4Summary from "../components/importWizard/Step4Summary";

const STORAGE_KEY = "songData";

const steps = [
  "Subir canción",
  "Detectar tempo", 
  "Compás y downbeats",
  "Guardar proyecto"
];

interface SongData {
  audioFile: File | null;
  audioBuffer: AudioBuffer | null;
  tempo: number | null;
  timeSignature: string;
  downbeats: number[];
  name: string;
  id: string | null;
  bars: number[];
  duration: number;
}

export default function ImportWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [songData, setSongData] = useState<SongData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // No restaurar el audioFile desde localStorage (no se puede serializar)
        return {
          ...parsed,
          audioFile: null
        };
      } catch {
        return getInitialSongData();
      }
    }
    return getInitialSongData();
  });

  function getInitialSongData(): SongData {
    return {
      audioFile: null,
      audioBuffer: null,
      tempo: null,
      timeSignature: "4/4",
      downbeats: [],
      name: "",
      id: null,
      bars: [],
      duration: 0,
    };
  }

  // Guardar cada vez que songData cambie (excepto audioFile)
  useEffect(() => {
    const dataToSave = {
      ...songData,
      audioFile: null // No serializar el archivo
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [songData]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Step1Upload
            next={handleNext}
            songData={songData}
            setSongData={setSongData}
          />
        );
      case 1:
        return (
          <Step2Tempo
            next={handleNext}
            back={handleBack}
            songData={songData}
            setSongData={setSongData}
          />
        );
      case 2:
        return (
          <Step3TimeSignature
            next={handleNext}
            back={handleBack}
            songData={songData}
            setSongData={setSongData}
          />
        );
      case 3:
        return (
          <Step4Summary
            back={handleBack}
            songData={songData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>
      </Paper>
    </Box>
  );
}