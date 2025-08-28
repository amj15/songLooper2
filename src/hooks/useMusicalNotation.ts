import { useState, useCallback, useEffect } from 'react';
import { StaveNote } from 'vexflow';

interface BarNotation {
  id: string;
  project_id: string;
  bar_index: number;
  time_signature_numerator: number;
  time_signature_denominator: number;
  notes: any[];
  created_at: string;
  updated_at: string;
}

interface UseMusicalNotationProps {
  projectId?: string;
  barIndex: number | null;
}

export const useMusicalNotation = ({ projectId, barIndex }: UseMusicalNotationProps) => {
  const [notation, setNotation] = useState<BarNotation | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNoteType, setSelectedNoteType] = useState<string>('q');
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Por ahora usamos datos de ejemplo
      const mockNotation: BarNotation = {
        id: `notation-${projectId}-${barIndex}`,
        project_id: projectId,
        bar_index: barIndex,
        time_signature_numerator: 4,
        time_signature_denominator: 4,
        notes: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setNotation(mockNotation);
      setNotes(mockNotation.notes);
      setTimeSignature({
        numerator: mockNotation.time_signature_numerator,
        denominator: mockNotation.time_signature_denominator
      });
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
  }, [projectId, barIndex, notation, notes, timeSignature]);

  const addNote = useCallback((noteKey: string, duration?: string) => {
    const noteToAdd = new StaveNote({
      keys: [noteKey],
      duration: duration || selectedNoteType
    });
    
    setNotes(prevNotes => [...prevNotes, noteToAdd]);
  }, [selectedNoteType]);

  const removeNote = useCallback((index: number) => {
    setNotes(prevNotes => prevNotes.filter((_, i) => i !== index));
  }, []);

  const clearNotes = useCallback(() => {
    setNotes([]);
  }, []);

  const updateTimeSignature = useCallback((numerator: number, denominator: number) => {
    setTimeSignature({ numerator, denominator });
  }, []);

  const insertNote = useCallback((noteKey: string, position: number, duration?: string) => {
    const noteToInsert = new StaveNote({
      keys: [noteKey],
      duration: duration || selectedNoteType
    });
    
    setNotes(prevNotes => {
      const newNotes = [...prevNotes];
      newNotes.splice(position, 0, noteToInsert);
      return newNotes;
    });
  }, [selectedNoteType]);

  const moveNote = useCallback((fromIndex: number, toIndex: number) => {
    setNotes(prevNotes => {
      const newNotes = [...prevNotes];
      const [movedNote] = newNotes.splice(fromIndex, 1);
      newNotes.splice(toIndex, 0, movedNote);
      return newNotes;
    });
  }, []);

  // Auto-save cuando cambien las notas (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (notes.length > 0 && notation) {
        saveNotation();
      }
    }, 1000); // Guardar después de 1 segundo de inactividad

    return () => clearTimeout(timeoutId);
  }, [notes, saveNotation, notation]);

  return {
    notation,
    notes,
    selectedNoteType,
    timeSignature,
    isLoading,
    error,
    setSelectedNoteType,
    addNote,
    removeNote,
    clearNotes,
    insertNote,
    moveNote,
    updateTimeSignature,
    saveNotation,
    loadNotation
  };
};