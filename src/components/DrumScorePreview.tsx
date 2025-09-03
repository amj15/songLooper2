import { Box, Paper, Typography } from '@mui/material';
import React, { useEffect, useRef } from 'react';

// Definir la interfaz localmente para evitar conflictos de importación
interface DrumNote {
  instrument: string;
  start: number;
  duration: number;
  modifiers?: string[];
  group?: string;
}

interface VexFlowPosition {
  position: number;
  notes: Array<{
    duration: string;
    key: string;
    modifiers: string[];
    instrument: string;
  }>;
}

interface DrumScorePreviewProps {
  vexFlowNotes: VexFlowPosition[];
  timeSignature?: string;
  subdivisionResolution?: number;
  width?: number;
  height?: number;
}

const DrumScorePreview: React.FC<DrumScorePreviewProps> = ({
  vexFlowNotes,
  timeSignature = '4/4',
  subdivisionResolution = 16,
  width = 400,
  height = 200
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  console.log(vexFlowNotes);

  // Ya no necesitamos mapear desde MIDI ni instrumentos complejos

  // Renderizar VexFlow cuando cambien las notas
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Limpiar SVG anterior
    svgRef.current.innerHTML = '';
    
    if (vexFlowNotes.length === 0) return;

    try {
      renderVexFlowScore();
    } catch (error) {
      console.error('Error rendering VexFlow score:', error);
    }
  }, [vexFlowNotes, timeSignature, subdivisionResolution]);

  const renderVexFlowScore = async () => {
    try {
      // Importar VexFlow dinámicamente
      const VF = await import('vexflow');
      
      if (!svgRef.current) return;

      // Crear renderer SVG
      const renderer = new VF.Renderer(svgRef.current as any, VF.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();
      
      // Crear pentagrama de percusión
      const stave = new VF.Stave(10, 10, width - 20);
      stave.addClef('percussion');
      //stave.addTimeSignature(timeSignature);
      stave.setContext(context).draw();

      // Convertir notas a formato VexFlow
      const { voices, staveNotes } = convertNotesToVexFlow(VF);
      
      if (voices.length === 0 || staveNotes.length === 0) return;

      try {
        // Formatear todas las voces juntas
        const formatter = new VF.Formatter();
        formatter.joinVoices(voices).format(voices, width - 40);
        
        // Dibujar cada voz
        voices.forEach(voice => {
          voice.draw(context, stave);
        });
      } catch (e) {
        console.error('VexFlow voice error:', e);
        
        // Fallback: crear una voz más simple con una sola nota
        try {
          
          // Solo tomar la primera nota y crear un compás simple
          const singleNote = new VF.StaveNote({
            clef: 'percussion',
            keys: ['c/5'], // snare position
            duration: 'wr' // whole rest para llenar el compás completo
          });
          
          const fallbackVoice = new VF.Voice({
            numBeats: 4,
            beatValue: 4
          } as any);
          
          fallbackVoice.setStrict(false);
          fallbackVoice.addTickables([singleNote]);
          
          const formatter = new VF.Formatter();
          formatter.joinVoices([fallbackVoice]).format([fallbackVoice], width - 40);
          fallbackVoice.draw(context, stave);
      
        } catch (fallbackError) {
          console.error('Simple fallback also failed:', fallbackError);
        }
      }
      
    } catch (error) {
      console.error('VexFlow rendering error:', error);
    }
  };

  const convertNotesToVexFlow = (VF: any) => {
    if (vexFlowNotes.length === 0) {
      return {
        voices: [],
        staveNotes: [new VF.StaveNote({
          clef: 'percussion',
          keys: ['c/5'],
          duration: 'wr'
        })]
      };
    }

    // Agrupar notas por instrumento para crear voces separadas
    const instrumentGroups: { [instrumentId: string]: any[] } = {};
    const totalSteps = 16;
    
    vexFlowNotes.forEach((position, stepIndex) => {
      position.notes.forEach(note => {
        console.log(note);
        if (!note.key || !note.duration || !note.instrument) return;
        
        // Agrupar por instrumento, no por key/tono
        if (!instrumentGroups[note.instrument]) {
          instrumentGroups[note.instrument] = new Array(totalSteps).fill(null);
        }
        
        instrumentGroups[note.instrument][stepIndex] = note;
      });
    });

    console.log('Instrument groups:', instrumentGroups);

    // Crear voces separadas para cada instrumento (para permitir duraciones diferentes)
    const voices: any[] = [];
    const allStaveNotes: any[] = [];

    Object.keys(instrumentGroups).forEach(instrumentKey => {
      const instrumentNotes = instrumentGroups[instrumentKey];
      const voiceNotes: any[] = [];
      
      let step = 0;
      while (step < totalSteps) {
        const note = instrumentNotes[step];
        
        if (note) {
          // Hay una nota en este step - usar su duración original
          const staveNote = new VF.StaveNote({
            clef: 'percussion',
            keys: [note.key],
            duration: note.duration,
            stem_direction: note.key.includes('/5') ? -1 : 1 // Hi-hat arriba, kick/snare abajo
          });
          
          voiceNotes.push(staveNote);
          
          // Avanzar por el número de steps que ocupa esta nota
          const durationSteps = getDurationInSteps(note.duration);
          step += durationSteps;
        } else {
          // No hay nota - calcular cuánto silencio necesitamos hasta la próxima nota de este instrumento
          let nextNoteStep = totalSteps; // Por defecto, hasta el final
          
          // Buscar la próxima nota de este instrumento específico
          for (let searchStep = step + 1; searchStep < totalSteps; searchStep++) {
            if (instrumentNotes[searchStep] !== null) {
              nextNoteStep = searchStep;
              break;
            }
          }
          
          // Calcular la duración del silencio
          const restSteps = nextNoteStep - step;
          const restDuration = getStepsToDuration(restSteps);
          
          // Buscar una nota anterior de este instrumento para obtener la key correcta
          const previousNote = instrumentNotes.slice(0, step).reverse().find(n => n !== null);
          const restKey = previousNote ? previousNote.key : 'c/5';
          
          const restNote = new VF.StaveNote({
            clef: 'percussion',
            keys: [restKey],
            duration: restDuration + 'r'
          });
          
          voiceNotes.push(restNote);
          step += restSteps;
        }
      }
      
      // Solo crear voz si tiene notas
      if (voiceNotes.length > 0) {
        const voice = new VF.Voice({ numBeats: 4, beatValue: 4 } as any);
        voice.setStrict(false);
        voice.addTickables(voiceNotes);
        voices.push(voice);
        
        allStaveNotes.push(...voiceNotes);
      }
    });

    // Función helper para convertir duración VexFlow a steps
    function getDurationInSteps(duration: string): number {
      switch (duration) {
        case 'w': return 16;
        case 'h': return 8;
        case 'q': return 4;
        case '8': return 2;
        case '16': return 1;
        default: return 1;
      }
    }

    // Función helper para convertir steps a duración VexFlow
    function getStepsToDuration(steps: number): string {
      if (steps >= 16) return 'w';
      if (steps >= 8) return 'h';
      if (steps >= 4) return 'q';
      if (steps >= 2) return '8';
      return '16';
    }

    return { voices, staveNotes: allStaveNotes };
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        mt: 2, 
        backgroundColor: '#f9f9f9',
        border: '1px solid #e0e0e0'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>
        Vista Previa de Partitura
      </Typography>
      
      {vexFlowNotes.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4, 
          color: '#666',
          fontStyle: 'italic' 
        }}>
          Añade notas en el secuenciador para ver la partitura
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          p: 1
        }}>
          <svg 
            ref={svgRef} 
            width={width} 
            height={height}
            style={{ 
              maxWidth: '100%', 
              height: 'auto' 
            }}
          />
        </Box>
      )}
      
      {/* Información de debug solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && vexFlowNotes.length > 0 && (
        <Box sx={{ mt: 2, fontSize: '12px', color: '#666' }}>
          <Typography variant="caption">
            Debug: {vexFlowNotes.length} positions • {timeSignature} • {subdivisionResolution} subdivisions
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DrumScorePreview;