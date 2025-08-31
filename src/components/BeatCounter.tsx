import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import * as React from "react";

const PulsingCircle = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isFirstBeat'
})<{ isActive: boolean; isFirstBeat: boolean }>(({ theme, isActive, isFirstBeat }) => ({
  width: isFirstBeat ? '24px' : '16px',
  height: isFirstBeat ? '24px' : '16px',
  borderRadius: '50%',
  backgroundColor: isActive 
    ? (isFirstBeat ? '#ff4444' : '#2196f3')
    : 'rgba(255,255,255,0.3)',
  border: `2px solid ${isActive 
    ? (isFirstBeat ? '#ff6666' : '#42a5f5') 
    : 'rgba(255,255,255,0.5)'}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.1s ease-out',
  boxShadow: isActive 
    ? `0 0 16px ${isFirstBeat ? '#ff4444' : '#2196f3'}, 0 0 32px ${isFirstBeat ? '#ff4444' : '#2196f3'}`
    : 'none',
  transform: isActive ? (isFirstBeat ? 'scale(1.2)' : 'scale(1.1)') : 'scale(1)',
}));

const CounterContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(0,0,0,0.7)',
  borderRadius: '12px',
  padding: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  minWidth: '200px'
}));

interface BeatCounterProps {
  currentTime: number;
  bpm: number;
  timeSignature: string; // e.g., "4/4"
  sections?: Array<{
    id: string;
    startBar: number;
    endBar: number;
    label: string;
    letter: string;
    color: string;
  }>;
}

const BeatCounter: React.FC<BeatCounterProps> = ({ 
  currentTime, 
  bpm, 
  timeSignature,
  sections = []
}) => {
  // Parse time signature
  const [beatsPerMeasure] = timeSignature.split('/').map(Number);
  
  // Calculate beat duration in seconds
  const beatDuration = 60 / bpm;
  const measureDuration = beatDuration * beatsPerMeasure;
  
  // Calculate current position
  const totalBeats = Math.floor(currentTime / beatDuration);
  const currentBeatInMeasure = (totalBeats % beatsPerMeasure) + 1;
  const currentMeasure = Math.floor(totalBeats / beatsPerMeasure) + 1;
  
  // Find current section
  const currentSection = sections.find(section => 
    currentMeasure >= section.startBar && currentMeasure <= section.endBar
  );
  
  const currentMeasureInSection = currentSection 
    ? currentMeasure - currentSection.startBar + 1 
    : null;

  return (
    <CounterContainer>
      {/* Beat visualization */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: 1
      }}>
        {Array.from({ length: beatsPerMeasure }, (_, index) => (
          <PulsingCircle
            key={index}
            isActive={currentBeatInMeasure === index + 1}
            isFirstBeat={index === 0}
          />
        ))}
      </Box>
      
      {/* Section measure (most important) */}
      {currentSection && currentMeasureInSection && (
        <Box sx={{ textAlign: 'center', mr: 1 }}>
          <Typography variant="h5" sx={{ 
            color: currentSection.color, 
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textShadow: `0 0 8px ${currentSection.color}`,
            lineHeight: 1
          }}>
            {currentMeasureInSection}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: currentSection.color, 
            fontSize: '8px',
            fontWeight: 'bold',
            opacity: 0.8
          }}>
            {currentSection.letter}
          </Typography>
        </Box>
      )}
      
      {/* Global measure (smaller) */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ 
          color: 'rgba(255,255,255,0.6)', 
          fontWeight: 'bold',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {currentMeasure}
        </Typography>
        <Typography variant="caption" sx={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: '7px'
        }}>
          GLOBAL
        </Typography>
      </Box>
    </CounterContainer>
  );
};

export default BeatCounter;