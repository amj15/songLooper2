import { useState, useCallback, useEffect } from 'react';
import { StaveNote } from 'vexflow';
import type { 
  DrumNote, 
  DrumInstrument, 
  BarNotation,
  DrumInstrumentConfig
} from '../types/drumNotation';
import { 
  DRUM_INSTRUMENTS, 
  getSubdivisionsPerBar, 
  createEmptyBarNotation,
  generateNoteId
} from '../types/drumNotation';

// Usar el tipo BarNotation de drumNotation.ts

interface UseMusicalNotationProps {
  projectId?: string;
  barIndex: number | null;
}

export const useMusicalNotation = ({ projectId, barIndex }: UseMusicalNotationProps) => {
  const [notation, setNotation] = useState<BarNotation | null>(null);
  const [drumNotes, setDrumNotes] = useState<DrumNote[]>([]);
  const [vexFlowNotes, setVexFlowNotes] = useState<StaveNote[]>([]);
  const [selectedDrumElement, setSelectedDrumElement] = useState<DrumInstrument>('snare');
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // En semicorcheas
  const [timeSignature, setTimeSignature] = useState<[number, number]>([4, 4]);
  const [totalSubdivisions, setTotalSubdivisions] = useState<number>(16);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar subdivisiones cuando cambie el compás
  useEffect(() => {
    const subdivisions = getSubdivisionsPerBar(timeSignature);
    setTotalSubdivisions(subdivisions);
  }, [timeSignature]);

  // Convertir drum notes a VexFlow StaveNotes
  const updateVexFlowNotes = useCallback((notes: DrumNote[]) => {
    const vexNotes: StaveNote[] = [];
    
    // Crear un array de todas las posiciones (semicorcheas)
    const positions: (DrumNote | null)[] = new Array(totalSubdivisions).fill(null);
    
    // Colocar las notas en sus posiciones
    notes.forEach(note => {
      for (let i = 0; i < note.duration; i++) {
        if (note.timing + i < totalSubdivisions) {
          positions[note.timing + i] = note;
        }
      }
    });
    
    // Convertir a VexFlow - por simplicidad, crear grupos de negras
    for (let i = 0; i < totalSubdivisions; i += 4) {
      const quarterNotes: StaveNote[] = [];
      
      for (let j = 0; j < 4 && i + j < totalSubdivisions; j++) {
        const note = positions[i + j];
        if (note) {
          const drumConfig = DRUM_INSTRUMENTS[note.instrument];
          const vexNote = new StaveNote({
            keys: [drumConfig.vexFlowNote],
            duration: '16', // Semicorchea
          });
          quarterNotes.push(vexNote);
        } else {
          // Silencio
          const restNote = new StaveNote({
            keys: ['d/5'],
            duration: '16r'
          });
          quarterNotes.push(restNote);
        }
      }
      
      vexNotes.push(...quarterNotes);
    }
    
    setVexFlowNotes(vexNotes);
  }, [totalSubdivisions]);

  // Cargar notación cuando cambie el barIndex o projectId
  useEffect(() => {
    if (projectId && barIndex !== null) {
      loadNotation();
    }
  }, [projectId, barIndex]);

  const loadNotation = async () => {
    if (!projectId || barIndex === null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implementar llamada a la API para cargar la notación
      // Por ahora usamos datos de ejemplo con el nuevo sistema
      const mockNotation = createEmptyBarNotation(projectId, barIndex, timeSignature);
      
      setNotation(mockNotation);
      setTimeSignature([mockNotation.timeSignatureNumerator, mockNotation.timeSignatureDenominator]);
      setDrumNotes(mockNotation.notes);
      
      // Convertir drum notes a VexFlow notes
      updateVexFlowNotes(mockNotation.notes);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando notación');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotation = useCallback(async () => {
    if (!projectId || barIndex === null || !notation) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNotation: BarNotation = {
        ...notation,
        notes: notes.map(note => ({
          keys: note.keys,
          duration: note.duration,
          // Serializar solo las propiedades necesarias
        })),
        time_signature_numerator: timeSignature.numerator,
        time_signature_denominator: timeSignature.denominator,
        updated_at: new Date().toISOString()
      };
      
      // TODO: Implementar llamada a la API para guardar
      console.log('Guardando notación:', updatedNotation);
      
      setNotation(updatedNotation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando notación');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, barIndex, notation, drumNotes, timeSignature]);

  // Verificar si se puede colocar una nota en una posición
  const canPlaceNote = useCallback((startPosition: number, duration: number): boolean => {
    const endPosition = startPosition + duration;
    
    // Verificar límites del compás
    if (endPosition > totalSubdivisions) return false;
    
    // Verificar conflictos con otras notas
    const hasConflict = drumNotes.some(note => {
      const noteEnd = note.timing + note.duration;
      return (note.timing < endPosition && noteEnd > startPosition);
    });
    
    return !hasConflict;
  }, [drumNotes, totalSubdivisions]);

  // Encontrar la mejor posición para colocar una nota (drag & drop inteligente)
  const findBestPosition = useCallback((targetPosition: number, duration: number): number => {
    // Primero intentar la posición exacta
    if (canPlaceNote(targetPosition, duration)) {
      return targetPosition;
    }
    
    // Buscar la posición más cercana válida
    let bestDistance = Infinity;
    let bestPosition = 0;
    
    for (let pos = 0; pos <= totalSubdivisions - duration; pos++) {
      if (canPlaceNote(pos, duration)) {
        const distance = Math.abs(pos - targetPosition);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPosition = pos;
        }
      }
    }
    
    return bestPosition;
  }, [canPlaceNote, totalSubdivisions]);

  // Añadir nota con posicionamiento inteligente
  const addDrumNote = useCallback((
    instrument: DrumInstrument, 
    targetPosition: number, 
    duration: number = selectedDuration
  ): boolean => {
    const bestPosition = findBestPosition(targetPosition, duration);
    
    if (!canPlaceNote(bestPosition, duration)) {
      return false; // No se pudo colocar
    }
    
    const newNote: DrumNote = {
      id: generateNoteId(),
      instrument,
      timing: bestPosition,
      duration,
      velocity: 100,
      modifiers: []
    };
    
    const updatedNotes = [...drumNotes, newNote];
    setDrumNotes(updatedNotes);
    updateVexFlowNotes(updatedNotes);
    
    return true;
  }, [drumNotes, selectedDuration, findBestPosition, canPlaceNote, updateVexFlowNotes]);

  // Eliminar nota
  const removeDrumNote = useCallback((noteId: string) => {
    const updatedNotes = drumNotes.filter(note => note.id !== noteId);
    setDrumNotes(updatedNotes);
    updateVexFlowNotes(updatedNotes);
  }, [drumNotes, updateVexFlowNotes]);

  // Limpiar todas las notas
  const clearAllNotes = useCallback(() => {
    setDrumNotes([]);
    updateVexFlowNotes([]);
  }, [updateVexFlowNotes]);

  // Auto-save cuando cambien las notas (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (drumNotes.length > 0 && notation) {
        saveNotation();
      }
    }, 1000); // Guardar después de 1 segundo de inactividad

    return () => clearTimeout(timeoutId);
  }, [drumNotes, saveNotation, notation]);

  return {
    // Nuevo sistema de batería
    notation,
    drumNotes,
    vexFlowNotes,
    selectedDrumElement,
    selectedDuration,
    timeSignature,
    totalSubdivisions,
    isLoading,
    error,
    
    // Acciones principales
    setSelectedDrumElement,
    setSelectedDuration,
    addDrumNote,
    removeDrumNote,
    clearAllNotes,
    canPlaceNote,
    findBestPosition,
    
    // Funciones de gestión
    saveNotation,
    loadNotation,
    
    // Legacy compatibility (para el componente actual)
    notes: vexFlowNotes,
    selectedNoteType: selectedDuration.toString(),
    setSelectedNoteType: (duration: string) => setSelectedDuration(parseInt(duration) || 1),
    addNote: (noteKey: string) => {
      // Convertir noteKey a drum instrument (simplificado)
      const instrument = noteKey.includes('c/4') ? 'kick' : 
                        noteKey.includes('c/5') ? 'snare' : 'hihat';
      return addDrumNote(instrument as DrumInstrument, 0);
    },
    clearNotes: clearAllNotes
  };
};