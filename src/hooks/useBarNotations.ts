import { useState, useCallback } from 'react';
import { barNotationService, type DrumNote, type ProjectDrumTracks } from '../services/barNotationService';

export const useBarNotations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBarNotation = useCallback(async (projectId: string, barIndex: number): Promise<DrumNote[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const notes = await barNotationService.loadBarNotation(projectId, barIndex);
      return notes;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading bar notation';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveBarNotation = useCallback(async (
    projectId: string, 
    barIndex: number, 
    notes: DrumNote[], 
    timeSignature: string = "4/4",
    subdivisionResolution: number = 16
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await barNotationService.saveBarNotation(projectId, barIndex, notes, timeSignature, subdivisionResolution);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saving bar notation';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProjectDrumTracks = useCallback(async (projectId: string): Promise<ProjectDrumTracks | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tracks = await barNotationService.getProjectDrumTracks(projectId);
      return tracks;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading project drum tracks';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBarNotation = useCallback(async (projectId: string, barIndex: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await barNotationService.deleteBarNotation(projectId, barIndex);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error deleting bar notation';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    loadBarNotation,
    saveBarNotation,
    getProjectDrumTracks,
    deleteBarNotation,
    isLoading,
    error
  };
};