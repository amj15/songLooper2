import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { useBarNotations } from '../hooks/useBarNotations';
import { type DrumNote, barNotationService } from '../services/barNotationService';

interface DrumNotationTestProps {
  projectId: string;
  timeSignature?: string;
}

const DrumNotationTest: React.FC<DrumNotationTestProps> = ({ 
  projectId, 
  timeSignature = "4/4" 
}) => {
  const { loadBarNotation, saveBarNotation, getProjectDrumTracks, isLoading, error } = useBarNotations();
  const [status, setStatus] = useState<string>('');

  const checkTable = async () => {
    setStatus('Checking table structure...');
    await barNotationService.checkTableStructure();
    setStatus('Check completed - see console for details');
  };

  const testSimpleSave = async () => {
    setStatus('Testing simple save...');
    
    const testNotes: DrumNote[] = [
      { instrument: "kick_kick_1", start: 1, duration: 1 },
    ];

    try {
      await barNotationService.saveBarNotationSimple(projectId, 99, testNotes); // Use bar 99 for testing
      setStatus('Simple save successful!');
    } catch (error) {
      setStatus(`Simple save failed: ${error}`);
    }
  };

  const testSaveLoad = async () => {
    setStatus('Testing save/load...');
    
    // Test data based on time signature
    const parseTimeSignature = (sig: string) => {
      const [numerator] = sig.split('/').map(Number);
      return numerator;
    };
    
    const numerator = parseTimeSignature(timeSignature);
    const totalCells = numerator * 4; // Para 1/16
    
    const testNotes: DrumNote[] = [
      { instrument: "kick_kick_1", start: 1, duration: 1 },
      { instrument: "snare_acoustic", start: Math.min(5, totalCells), duration: 1 },
    ];

    // Only add more notes if we have enough cells (4/4 vs 3/4)
    if (totalCells >= 12) {
      testNotes.push({ instrument: "hihat_closed", start: Math.min(9, totalCells), duration: 1 });
    }

    const saveSuccess = await saveBarNotation(projectId, 0, testNotes, timeSignature, 16);
    if (!saveSuccess) {
      setStatus(`Save failed: ${error}`);
      return;
    }
    
    const loadedNotes = await loadBarNotation(projectId, 0);
    setStatus(`Save/Load successful! Loaded ${loadedNotes.length} notes`);
    
    // Test track header
    const tracks = await getProjectDrumTracks(projectId);
    if (tracks) {
      setStatus(prev => prev + `\nTrack header: ${tracks.instruments_used.length} instruments used`);
    }
  };

  const clearTest = async () => {
    setStatus('Clearing test data...');
    const saveSuccess = await saveBarNotation(projectId, 0, [], timeSignature, 16);
    if (saveSuccess) {
      setStatus('Test data cleared');
    } else {
      setStatus(`Clear failed: ${error}`);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Drum Notation Test - {timeSignature}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          onClick={checkTable} 
          disabled={isLoading}
          size="small"
        >
          Check Table
        </Button>
        <Button 
          variant="outlined" 
          onClick={testSimpleSave} 
          disabled={isLoading}
          size="small"
        >
          Simple Save
        </Button>
        <Button 
          variant="contained" 
          onClick={testSaveLoad} 
          disabled={isLoading}
          size="small"
        >
          Full Test
        </Button>
        <Button 
          variant="outlined" 
          onClick={clearTest} 
          disabled={isLoading}
          size="small"
        >
          Clear Test
        </Button>
      </Box>

      {isLoading && <Typography>Loading...</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      {status && (
        <Alert severity="success">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{status}</pre>
        </Alert>
      )}
    </Box>
  );
};

export default DrumNotationTest;