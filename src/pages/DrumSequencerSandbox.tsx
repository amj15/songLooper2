import { Close as CloseIcon } from '@mui/icons-material';
import { Box, Button, Chip, Grid, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import DrumScorePreview from '../components/DrumScorePreview';

const DRUM_SOUNDS = [
  { id: 'kick', name: 'Kick', color: '#e74c3c', vexKey: 'f/4', inherentModifiers: [] },
  { id: 'snare', name: 'Snare', color: '#3498db', vexKey: 'c/5', inherentModifiers: [] },
  { id: 'hihat', name: 'Hi-Hat', color: '#f39c12', vexKey: 'g/5', inherentModifiers: ['closed'] },
  { id: 'openhat', name: 'Open Hat', color: '#e67e22', vexKey: 'g/5', inherentModifiers: ['open'] },
  { id: 'crash', name: 'Crash', color: '#9b59b6', vexKey: 'a/5', inherentModifiers: [] },
  { id: 'ride', name: 'Ride', color: '#2ecc71', vexKey: 'f/5', inherentModifiers: [] },
];

const STEPS = 16;

interface DrumNote {
  start: number;
  duration: number;
  key: string; // VexFlow key directa (ej: 'f/4', 'c/5')
  modifiers: string[];
}

interface DrumPattern {
  [key: string]: DrumNote[];
}

// Definir los modifiers disponibles para cada instrumento
const DRUM_MODIFIERS: { [key: string]: { id: string; name: string; symbol: string; color: string }[] } = {
  kick: [
    { id: 'accent', name: 'Accent', symbol: '>', color: '#ff6b6b' },
    { id: 'ghost', name: 'Ghost', symbol: '( )', color: '#95a5a6' }
  ],
  snare: [
    { id: 'accent', name: 'Accent', symbol: '>', color: '#ff6b6b' },
    { id: 'ghost', name: 'Ghost', symbol: '( )', color: '#95a5a6' },
    { id: 'rimshot', name: 'Rimshot', symbol: 'X', color: '#e74c3c' },
    { id: 'sidestick', name: 'Sidestick', symbol: '+', color: '#f39c12' }
  ],
  hihat: [
    { id: 'accent', name: 'Accent', symbol: '>', color: '#ff6b6b' },
    { id: 'ghost', name: 'Ghost', symbol: '( )', color: '#95a5a6' },
    { id: 'open', name: 'Open', symbol: 'O', color: '#3498db' },
    { id: 'pedal', name: 'Pedal', symbol: '+', color: '#9b59b6' }
  ],
  openhat: [
    { id: 'accent', name: 'Accent', symbol: '>', color: '#ff6b6b' },
    { id: 'ghost', name: 'Ghost', symbol: '( )', color: '#95a5a6' }
  ],
  crash: [
    { id: 'accent', name: 'Accent', symbol: '>', color: '#ff6b6b' },
    { id: 'ghost', name: 'Ghost', symbol: '( )', color: '#95a5a6' }
  ],
  ride: [
    { id: 'accent', name: 'Accent', symbol: '>', color: '#ff6b6b' },
    { id: 'ghost', name: 'Ghost', symbol: '( )', color: '#95a5a6' },
    { id: 'bell', name: 'Bell', symbol: '◊', color: '#2ecc71' }
  ]
};

interface DragState {
  isDragging: boolean;
  soundId: string | null;
  startStep: number | null;
  currentStep: number | null;
}

interface DrumSequencerSandboxProps {}

const DrumSequencerSandbox: React.FC<DrumSequencerSandboxProps> = () => {
  const [pattern, setPattern] = useState<DrumPattern>(() => {
    const initialPattern: DrumPattern = {};
    DRUM_SOUNDS.forEach(sound => {
      initialPattern[sound.id] = [];
    });
    return initialPattern;
  });

  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    soundId: null,
    startStep: null,
    currentStep: null
  });

  const [selectedNote, setSelectedNote] = useState<{ soundId: string; noteIndex: number } | null>(null);

  // Verificar si un step está ocupado por una nota
  const isStepOccupied = useCallback((soundId: string, stepIndex: number) => {
    return pattern[soundId].some(note => 
      stepIndex >= note.start && stepIndex < note.start + note.duration
    );
  }, [pattern]);

  // Obtener la nota que ocupa un step específico
  const getNoteAtStep = useCallback((soundId: string, stepIndex: number) => {
    return pattern[soundId].find(note => 
      stepIndex >= note.start && stepIndex < note.start + note.duration
    );
  }, [pattern]);

  // Verificar si un step es el inicio de una nota
  const isNoteStart = useCallback((soundId: string, stepIndex: number) => {
    return pattern[soundId].some(note => note.start === stepIndex);
  }, [pattern]);

  const handleMouseDown = useCallback((soundId: string, stepIndex: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const existingNote = getNoteAtStep(soundId, stepIndex);
    
    if (existingNote) {
      // Si es clic derecho o shift+clic, seleccionar para modificar
      if (event.button === 2 || event.shiftKey) {
        const noteIndex = pattern[soundId].findIndex(note => note === existingNote);
        setSelectedNote({ soundId, noteIndex });
        return;
      }
      
      // Si clickeamos en una nota existente, la eliminamos
      setPattern(prev => ({
        ...prev,
        [soundId]: prev[soundId].filter(note => note !== existingNote)
      }));
      setSelectedNote(null);
    } else {
      // Solo empezar drag si no es shift+clic
      if (!event.shiftKey) {
        setDragState({
          isDragging: true,
          soundId,
          startStep: stepIndex,
          currentStep: stepIndex
        });
      }
      setSelectedNote(null);
    }
  }, [getNoteAtStep, pattern]);

  const handleMouseEnter = useCallback((soundId: string, stepIndex: number) => {
    if (dragState.isDragging && dragState.soundId === soundId && dragState.startStep !== null) {
      setDragState(prev => ({
        ...prev,
        currentStep: stepIndex
      }));
    }
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.soundId && dragState.startStep !== null && dragState.currentStep !== null) {
      const start = Math.min(dragState.startStep, dragState.currentStep);
      const end = Math.max(dragState.startStep, dragState.currentStep);
      const duration = end - start + 1;

      // Crear la nueva nota
      const sound = DRUM_SOUNDS.find(s => s.id === dragState.soundId);
      const newNote: DrumNote = {
        start,
        duration,
        key: sound?.vexKey || 'c/5',
        modifiers: []
      };

      setPattern(prev => ({
        ...prev,
        [dragState.soundId!]: [...prev[dragState.soundId!], newNote]
      }));
    }

    setDragState({
      isDragging: false,
      soundId: null,
      startStep: null,
      currentStep: null
    });
  }, [dragState]);

  const clearPattern = useCallback(() => {
    const clearedPattern: DrumPattern = {};
    DRUM_SOUNDS.forEach(sound => {
      clearedPattern[sound.id] = [];
    });
    setPattern(clearedPattern);
  }, []);

  const generateRandomPattern = useCallback(() => {
    const randomPattern: DrumPattern = {};
    DRUM_SOUNDS.forEach(sound => {
      const notes: DrumNote[] = [];
      for (let i = 0; i < STEPS; i++) {
        if (Math.random() > 0.8) {
          const maxDuration = Math.min(4, STEPS - i);
          const duration = Math.floor(Math.random() * maxDuration) + 1;
          const modifiers: string[] = [];
          
          // Añadir modifiers aleatorios ocasionalmente
          if (Math.random() > 0.7 && DRUM_MODIFIERS[sound.id]) {
            const availableModifiers = DRUM_MODIFIERS[sound.id];
            if (availableModifiers.length > 0) {
              const randomModifier = availableModifiers[Math.floor(Math.random() * availableModifiers.length)];
              modifiers.push(randomModifier.id);
            }
          }
          
          notes.push({ 
            start: i, 
            duration, 
            key: sound.vexKey,
            modifiers 
          });
          i += duration - 1; // Skip covered steps
        }
      }
      randomPattern[sound.id] = notes;
    });
    setPattern(randomPattern);
  }, []);

  // Convertir el patrón del secuenciador directamente a estructura VexFlow
  const vexFlowNotes = useMemo(() => {
    const totalSteps = STEPS;
    
    // Mapear duración del secuenciador a VexFlow
    function mapDurationToVexFlow(sequencerDuration: number) {
      if (sequencerDuration >= 16) return { vexDuration: 'w', stepsOccupied: 16 };
      else if (sequencerDuration >= 8) return { vexDuration: 'h', stepsOccupied: 8 };
      else if (sequencerDuration >= 4) return { vexDuration: 'q', stepsOccupied: 4 };
      else if (sequencerDuration >= 2) return { vexDuration: '8', stepsOccupied: 2 };
      else return { vexDuration: '16', stepsOccupied: 1 };
    }
    
    // Crear array de 16 posiciones
    const finalNotes = Array.from({ length: totalSteps }, (_, index) => ({
      position: index + 1,
      notes: [] as Array<{
        duration: string;
        key: string;
        instrument: string;
        modifiers: string[];
      }>
    }));
    
    // Rastrear posiciones ocupadas POR INSTRUMENTO
    const occupiedPositions: { [instrumentId: string]: boolean[] } = {};
    DRUM_SOUNDS.forEach(sound => {
      occupiedPositions[sound.id] = new Array(totalSteps).fill(false);
    });
    
    // Procesar todas las notas del secuenciador - cada instrumento mantiene su duración
    DRUM_SOUNDS.forEach(sound => {
      pattern[sound.id].forEach(note => {
        if (!note.key) {
          console.warn('Note missing key:', note, 'for instrument:', sound.id);
          return;
        }
        
        const { vexDuration, stepsOccupied } = mapDurationToVexFlow(note.duration);
        
        // Verificar solo si ESTE INSTRUMENTO tiene la posición ocupada
        if (note.start >= 0 && note.start < totalSteps && !occupiedPositions[sound.id][note.start]) {
          const allModifiers = [...sound.inherentModifiers, ...note.modifiers];

          finalNotes[note.start].notes.push({
            duration: vexDuration, // ← Cada nota mantiene SU propia duración
            key: note.key,
            instrument: sound.id,   // ← Añadir el ID del instrumento
            modifiers: allModifiers
          });
          
          // Marcar posiciones ocupadas SOLO para este instrumento
          for (let i = 0; i < stepsOccupied && (note.start + i) < totalSteps; i++) {
            occupiedPositions[sound.id][note.start + i] = true;
          }
        }
      });
    });
    
    return finalNotes;
  }, [pattern]);

  const getSequencerData = () => {
    return vexFlowNotes;
  };

  // Función para agregar/quitar modifiers de una nota
  const toggleModifier = useCallback((soundId: string, noteIndex: number, modifierId: string) => {
    setPattern(prev => {
      const newPattern = { ...prev };
      const note = newPattern[soundId][noteIndex];
      const hasModifier = note.modifiers.includes(modifierId);
      
      if (hasModifier) {
        note.modifiers = note.modifiers.filter(m => m !== modifierId);
      } else {
        note.modifiers = [...note.modifiers, modifierId];
      }
      
      return newPattern;
    });
  }, []);

  // Función para determinar el estilo de un step durante el drag
  const getStepStyle = useCallback((soundId: string, stepIndex: number) => {
    const sound = DRUM_SOUNDS.find(s => s.id === soundId)!;
    const isOccupied = isStepOccupied(soundId, stepIndex);
    const isStart = isNoteStart(soundId, stepIndex);
    const note = getNoteAtStep(soundId, stepIndex);
    
    // Verificar si la nota está seleccionada
    const isSelected = selectedNote && 
                      selectedNote.soundId === soundId && 
                      note && 
                      pattern[soundId][selectedNote.noteIndex] === note;
    
    // Si estamos arrastrando y este step está en el rango
    const isDragPreview = dragState.isDragging && 
                          dragState.soundId === soundId && 
                          dragState.startStep !== null && 
                          dragState.currentStep !== null &&
                          stepIndex >= Math.min(dragState.startStep, dragState.currentStep) &&
                          stepIndex <= Math.max(dragState.startStep, dragState.currentStep);

    let backgroundColor = 'transparent';
    let borderColor = sound.color;
    let opacity = 1;
    let boxShadow = undefined;

    if (isDragPreview) {
      backgroundColor = `${sound.color}60`; // Semi-transparente durante drag
      borderColor = sound.color;
    } else if (isOccupied) {
      backgroundColor = sound.color;
      borderColor = sound.color;
    }

    if (isSelected) {
      boxShadow = `0 0 0 2px #ffd700`; // Golden border for selection
    }

    return {
      backgroundColor,
      borderColor,
      opacity,
      cursor: isOccupied ? 'pointer' : 'crosshair',
      borderWidth: isStart ? '2px' : '1px',
      borderStyle: 'solid',
      boxShadow
    };
  }, [dragState, isStepOccupied, isNoteStart, selectedNote, getNoteAtStep, pattern]);

  return (
    <Box 
      sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Typography variant="h4" gutterBottom>
        Drum Sequencer Sandbox
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
        Sandbox para pruebas de conversión de secuenciador a partitura
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
        Instrucciones: Haz clic y arrastra para crear notas con duración. Clic izquierdo para eliminar. Shift+Clic para editar modifiers.
      </Typography>

      {/* Control Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant={isPlaying ? "contained" : "outlined"}
          color={isPlaying ? "secondary" : "primary"}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
        <Button variant="outlined" onClick={clearPattern}>
          Clear
        </Button>
        <Button variant="outlined" onClick={generateRandomPattern}>
          Random
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Sequencer Grid */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sequencer (1 compás - 16 pasos)
            </Typography>
            
            {/* Step Numbers */}
            <Box sx={{ display: 'flex', mb: 1, pl: 8 }}>
              {Array.from({ length: STEPS }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: currentStep === i ? 'bold' : 'normal',
                    color: currentStep === i ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {i + 1}
                </Box>
              ))}
            </Box>

            {/* Drum Rows */}
            {DRUM_SOUNDS.map(sound => (
              <Box key={sound.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip
                  label={sound.name}
                  sx={{
                    width: 80,
                    mr: 1,
                    backgroundColor: sound.color,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Box sx={{ display: 'flex', flex: 1 }}>
                  {Array.from({ length: STEPS }, (_, stepIndex) => {
                    const stepStyle = getStepStyle(sound.id, stepIndex);
                    const isOccupied = isStepOccupied(sound.id, stepIndex);
                    const isStart = isNoteStart(sound.id, stepIndex);
                    const note = getNoteAtStep(sound.id, stepIndex);
                    
                    return (
                      <Box
                        key={stepIndex}
                        sx={{
                          flex: 1,
                          mx: 0.125,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          ...stepStyle,
                          '&:hover': {
                            opacity: 0.8,
                          },
                          // Destacar el step actual durante playback
                          ...(currentStep === stepIndex && {
                            boxShadow: '0 0 0 2px #000',
                          })
                        }}
                        onMouseDown={(e) => handleMouseDown(sound.id, stepIndex, e)}
                        onMouseEnter={() => handleMouseEnter(sound.id, stepIndex)}
                        onContextMenu={(e) => e.preventDefault()} // Prevent default right-click menu
                      >
                        {isStart && note && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: isOccupied ? 'white' : sound.color,
                                fontWeight: 'bold',
                                fontSize: '0.6rem',
                                lineHeight: 1
                              }}
                            >
                              {note.duration}
                            </Typography>
                            {note.modifiers.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.25 }}>
                                {note.modifiers.map(modifierId => {
                                  const modifier = DRUM_MODIFIERS[sound.id]?.find(m => m.id === modifierId);
                                  return modifier ? (
                                    <Typography
                                      key={modifierId}
                                      variant="caption"
                                      sx={{
                                        color: isOccupied ? 'white' : modifier.color,
                                        fontSize: '0.5rem',
                                        fontWeight: 'bold',
                                        lineHeight: 1
                                      }}
                                    >
                                      {modifier.symbol}
                                    </Typography>
                                  ) : null;
                                })}
                              </Box>
                            )}
                          </Box>
                        )}
                        {isOccupied && !isStart && (
                          <Box sx={{ 
                            width: '100%', 
                            height: '2px', 
                            backgroundColor: 'white',
                            opacity: 0.7
                          }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* JSON Output */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              JSON Output
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.75rem',
                maxHeight: 400,
                border: '1px solid #ddd'
              }}
            >
              {JSON.stringify(getSequencerData(), null, 2)}
            </Box>
          </Paper>
        </Grid>

        {/* Score Preview */}
        <Grid size={{ xs: 12, md: 8 }}>
          <DrumScorePreview
            vexFlowNotes={vexFlowNotes}
            timeSignature="4/4"
            subdivisionResolution={16}
            width={600}
            height={250}
          />
        </Grid>

        {/* Modifier Panel */}
        {selectedNote && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 2, backgroundColor: '#fff9c4' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Editando modifiers - {DRUM_SOUNDS.find(s => s.id === selectedNote.soundId)?.name}
                </Typography>
                <IconButton onClick={() => setSelectedNote(null)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {DRUM_MODIFIERS[selectedNote.soundId]?.map(modifier => {
                  const note = pattern[selectedNote.soundId][selectedNote.noteIndex];
                  const isActive = note.modifiers.includes(modifier.id);
                  
                  return (
                    <Tooltip key={modifier.id} title={modifier.name} arrow>
                      <Chip
                        label={`${modifier.symbol} ${modifier.name}`}
                        variant={isActive ? "filled" : "outlined"}
                        color={isActive ? "primary" : "default"}
                        sx={{
                          backgroundColor: isActive ? modifier.color : 'transparent',
                          borderColor: modifier.color,
                          color: isActive ? 'white' : modifier.color,
                          '&:hover': {
                            backgroundColor: isActive ? modifier.color : `${modifier.color}20`,
                          }
                        }}
                        onClick={() => toggleModifier(selectedNote.soundId, selectedNote.noteIndex, modifier.id)}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
              
              {(!DRUM_MODIFIERS[selectedNote.soundId] || DRUM_MODIFIERS[selectedNote.soundId].length === 0) && (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No hay modifiers disponibles para este instrumento
                </Typography>
              )}
            </Paper>
          </Grid>
        )}

      </Grid>
    </Box>
  );
};

export default DrumSequencerSandbox;