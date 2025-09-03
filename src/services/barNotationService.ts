import { supabase } from './supabase';

export interface DrumNote {
  instrument: string;
  start: number;
  duration: number;
  modifiers?: string[];
  group?: string;
}

export interface BarNotation {
  id?: string;
  project_id: string;
  bar_index: number;
  time_signature_numerator: number;
  time_signature_denominator: number;
  subdivision_resolution: number;
  notes: DrumNote[];
}

export interface ProjectDrumTracks {
  id?: string;
  project_id: string;
  instruments_used: string[];
  total_bars: number;
  subdivision_resolution: number;
}

class BarNotationService {
  
  
  // Cargar notación de un compás específico
  async loadBarNotation(projectId: string, barIndex: number): Promise<DrumNote[]> {
    try {
      const { data, error } = await supabase
        .from('bar_notations')
        .select('*')
        .eq('project_id', projectId)
        .eq('bar_index', barIndex)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay notación para este compás, devolver array vacío
          return [];
        }
        throw error;
      }

      return data?.notes || [];
    } catch (error) {
      console.error('Error loading bar notation:', error);
      return [];
    }
  }


  // Guardar notación de un compás
  async saveBarNotation(
    projectId: string, 
    barIndex: number, 
    notes: DrumNote[], 
    timeSignature: string = "4/4",
    subdivisionResolution: number = 16
  ): Promise<void> {
    try {
      const [numerator, denominator] = timeSignature.split('/').map(Number);
      
      const notationData: Omit<BarNotation, 'id'> = {
        project_id: projectId,
        bar_index: barIndex,
        time_signature_numerator: numerator,
        time_signature_denominator: denominator,
        subdivision_resolution: subdivisionResolution,
        notes: notes
      };

      // Intentar insertar primero, luego actualizar si existe
      const { data: existingData, error: checkError } = await supabase
        .from('bar_notations')
        .select('id')
        .eq('project_id', projectId)
        .eq('bar_index', barIndex)
        .single();

      let result;
      if (checkError && checkError.code === 'PGRST116') {
        // No existe, insertar nuevo
        result = await supabase
          .from('bar_notations')
          .insert(notationData)
          .select();
      } else if (existingData) {
        // Ya existe, actualizar
        result = await supabase
          .from('bar_notations')
          .update(notationData)
          .eq('project_id', projectId)
          .eq('bar_index', barIndex)
          .select();
      } else {
        throw checkError;
      }

      const { data, error } = result;

      if (error) {
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      // Actualizar el track header después de guardar
      try {
        await this.updateProjectDrumTracks(projectId, subdivisionResolution);
      } catch (trackError) {
        // Silenciar error del track header, lo importante es que se guardó la notación
      }
      
    } catch (error) {
      console.error('Error saving bar notation:', error);
      throw error;
    }
  }

  // Cargar todas las notaciones de un proyecto
  async loadProjectNotations(projectId: string): Promise<BarNotation[]> {
    try {
      const { data, error } = await supabase
        .from('bar_notations')
        .select('*')
        .eq('project_id', projectId)
        .order('bar_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading project notations:', error);
      return [];
    }
  }

  // Actualizar track header con instrumentos utilizados
  private async updateProjectDrumTracks(projectId: string, subdivisionResolution: number = 16): Promise<void> {
    try {
      // Obtener todas las notaciones del proyecto
      const notations = await this.loadProjectNotations(projectId);
      
      // Extraer todos los instrumentos utilizados
      const instrumentsUsed = new Set<string>();
      let totalBars = 0;
      
      notations.forEach(notation => {
        notation.notes.forEach(note => {
          instrumentsUsed.add(note.instrument);
        });
        totalBars = Math.max(totalBars, notation.bar_index + 1);
      });

      // Crear o actualizar el track header
      const trackData: Omit<ProjectDrumTracks, 'id'> = {
        project_id: projectId,
        instruments_used: Array.from(instrumentsUsed),
        total_bars: totalBars,
        subdivision_resolution: subdivisionResolution
      };

      const { error } = await supabase
        .from('project_drum_tracks')
        .upsert(trackData, {
          onConflict: 'project_id'
        });

      if (error) throw error;
      
      
    } catch (error) {
      console.error('Error updating project drum tracks:', error);
      throw error;
    }
  }

  // Obtener track header de un proyecto
  async getProjectDrumTracks(projectId: string): Promise<ProjectDrumTracks | null> {
    try {
      const { data, error } = await supabase
        .from('project_drum_tracks')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No existe track header, devolver null
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting project drum tracks:', error);
      return null;
    }
  }

  // Eliminar notación de un compás
  async deleteBarNotation(projectId: string, barIndex: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('bar_notations')
        .delete()
        .eq('project_id', projectId)
        .eq('bar_index', barIndex);

      if (error) throw error;

      // Actualizar track header después de eliminar
      await this.updateProjectDrumTracks(projectId);
      
    } catch (error) {
      console.error('Error deleting bar notation:', error);
      throw error;
    }
  }
}

export const barNotationService = new BarNotationService();