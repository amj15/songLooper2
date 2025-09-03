// Mapping completo para traducir entre instrumentos de batería, MIDI, y VexFlow
export interface DrumMappingEntry {
  midi: number;
  note: string; // Notación tipo C4, D#2, etc.
  vexflow: {
    line: number; // Posición en el pentagrama (0 = abajo, 5 = arriba)
    notehead: 'normal' | 'x' | 'diamond' | 'triangle';
    articulation?: string; // Articulación VexFlow
    text?: string; // Texto adicional si es necesario
  };
}

export interface ModifierMapping {
  vexflow: {
    notation?: string;
    articulation?: string;
    grace?: number;
    tremolo?: number;
    text?: string;
    parentheses?: boolean;
  };
  description: string;
}

// Mapping principal de instrumentos
export const DRUM_INSTRUMENT_MAP: Record<string, DrumMappingEntry> = {
  // KICK DRUMS (línea inferior del pentagrama)
  'kick': {
    midi: 36,
    note: 'C2',
    vexflow: { line: -2, notehead: 'normal' }
  },
  'kick_kick_1': {
    midi: 36,
    note: 'C2',
    vexflow: { line: -2, notehead: 'normal' }
  },
  'kick_2': {
    midi: 35,
    note: 'B1',
    vexflow: { line: -2, notehead: 'normal' }
  },

  // SNARE DRUMS (línea central del pentagrama)
  'snare': {
    midi: 38,
    note: 'D2',
    vexflow: { line: 1, notehead: 'normal' }
  },
  'snare_acoustic': {
    midi: 38,
    note: 'D2',
    vexflow: { line: 1, notehead: 'normal' }
  },
  'snare_electric': {
    midi: 40,
    note: 'E2',
    vexflow: { line: 1, notehead: 'normal' }
  },
  'snare_rimshot': {
    midi: 37,
    note: 'C#2',
    vexflow: { line: 2, notehead: 'normal', text: 'RS' }
  },
  'snare_sidestick': {
    midi: 39,
    note: 'D#2',
    vexflow: { line: 2, notehead: 'x', text: 'X-stick' }
  },

  // HI-HATS (línea superior del pentagrama)
  'hihat_closed': {
    midi: 42,
    note: 'F#2',
    vexflow: { line: 3, notehead: 'x' }
  },
  'hihat': {
    midi: 42,
    note: 'F#2',
    vexflow: { line: 3, notehead: 'x' }
  },
  'hihat_pedal': {
    midi: 44,
    note: 'G#2',
    vexflow: { line: 3, notehead: 'x', articulation: 'a+' }
  },
  'hihat_open': {
    midi: 46,
    note: 'A#2',
    vexflow: { line: 3, notehead: 'x', articulation: 'a@' }
  },

  // TOMS
  'tom_floor_low': {
    midi: 41,
    note: 'F2',
    vexflow: { line: 1, notehead: 'normal' }
  },
  'tom_floor_high': {
    midi: 43,
    note: 'G2',
    vexflow: { line: 1, notehead: 'normal' }
  },
  'tom_low': {
    midi: 45,
    note: 'A2',
    vexflow: { line: 1, notehead: 'normal' }
  },
  'tom_mid_low': {
    midi: 47,
    note: 'B2',
    vexflow: { line: 3, notehead: 'normal' }
  },
  'tom_mid_high': {
    midi: 48,
    note: 'C3',
    vexflow: { line: 3, notehead: 'normal' }
  },
  'tom_high': {
    midi: 50,
    note: 'D3',
    vexflow: { line: 4, notehead: 'normal' }
  },

  // CYMBALS
  'crash': {
    midi: 49,
    note: 'C#3',
    vexflow: { line: 5, notehead: 'x' }
  },
  'crash_2': {
    midi: 57,
    note: 'A3',
    vexflow: { line: 5, notehead: 'x' }
  },
  'ride': {
    midi: 51,
    note: 'D#3',
    vexflow: { line: 4, notehead: 'x' }
  },
  'ride_2': {
    midi: 59,
    note: 'B3',
    vexflow: { line: 4, notehead: 'x' }
  },
  'ride_bell': {
    midi: 53,
    note: 'F3',
    vexflow: { line: 4, notehead: 'diamond' }
  },
  'splash': {
    midi: 55,
    note: 'G3',
    vexflow: { line: 5, notehead: 'x' }
  },
  'china': {
    midi: 52,
    note: 'E3',
    vexflow: { line: 5, notehead: 'x' }
  },

  // PERCUSSION
  'clap': {
    midi: 39,
    note: 'D#2',
    vexflow: { line: 3, notehead: 'triangle', text: 'Clap' }
  },
  'cowbell': {
    midi: 56,
    note: 'G#3',
    vexflow: { line: 4, notehead: 'triangle' }
  },
  'tambourine': {
    midi: 54,
    note: 'F#3',
    vexflow: { line: 5, notehead: 'diamond' }
  },
  'triangle': {
    midi: 81,
    note: 'A5',
    vexflow: { line: 5, notehead: 'triangle' }
  }
};

// Mapping de modificadores
export const DRUM_MODIFIER_MAP: Record<string, ModifierMapping> = {
  'ghost': {
    vexflow: { parentheses: true },
    description: 'Nota fantasma (suave)'
  },
  'accent': {
    vexflow: { articulation: 'a>' },
    description: 'Acento fuerte'
  },
  'flam': {
    vexflow: { grace: 1 },
    description: 'Flam (nota de gracia antes)'
  },
  'drag': {
    vexflow: { grace: 2 },
    description: 'Drag (dos notas de gracia)'
  },
  'roll': {
    vexflow: { tremolo: 3 },
    description: 'Redoble (tremolo)'
  },
  'buzz': {
    vexflow: { tremolo: 2 },
    description: 'Buzz roll'
  },
  'open': {
    vexflow: { articulation: 'a@' },
    description: 'Abierto (charles)'
  },
  'choke': {
    vexflow: { articulation: 'a+' },
    description: 'Choke (ahogar)'
  },
  'rimshot': {
    vexflow: { text: 'RS' },
    description: 'Rimshot'
  },
  'cross_stick': {
    vexflow: { text: 'X-stick' },
    description: 'Cross stick'
  },
  'half_open': {
    vexflow: { text: '½o' },
    description: 'Medio abierto'
  }
};

// Utilidades para el mapping
export class DrumNotationService {
  
  // Obtener info de instrumento por nombre
  static getInstrumentInfo(instrumentName: string): DrumMappingEntry | null {
    return DRUM_INSTRUMENT_MAP[instrumentName] || null;
  }

  // Obtener info de modificador
  static getModifierInfo(modifierName: string): ModifierMapping | null {
    return DRUM_MODIFIER_MAP[modifierName] || null;
  }

  // Convertir nota MIDI a nombre de nota
  static midiToNoteName(midiNumber: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return `${noteNames[noteIndex]}${octave}`;
  }

  // Buscar instrumento por número MIDI
  static getInstrumentByMidi(midiNumber: number): string | null {
    for (const [instrument, info] of Object.entries(DRUM_INSTRUMENT_MAP)) {
      if (info.midi === midiNumber) {
        return instrument;
      }
    }
    return null;
  }

  // Obtener todos los instrumentos disponibles
  static getAllInstruments(): string[] {
    return Object.keys(DRUM_INSTRUMENT_MAP);
  }

  // Obtener todos los modificadores disponibles
  static getAllModifiers(): string[] {
    return Object.keys(DRUM_MODIFIER_MAP);
  }

  // Convertir DrumNote del secuenciador a formato VexFlow
  static convertToVexFlowNote(instrument: string, modifiers: string[] = []) {
    const instrumentInfo = this.getInstrumentInfo(instrument);
    if (!instrumentInfo) return null;

    const vexflowNote = {
      line: instrumentInfo.vexflow.line,
      notehead: instrumentInfo.vexflow.notehead,
      articulations: [] as string[],
      annotations: [] as string[],
      grace: 0,
      tremolo: 0,
      parentheses: false
    };

    // Aplicar modificadores
    modifiers.forEach(modifier => {
      const modifierInfo = this.getModifierInfo(modifier);
      if (modifierInfo) {
        const vf = modifierInfo.vexflow;
        
        if (vf.articulation) vexflowNote.articulations.push(vf.articulation);
        if (vf.text) vexflowNote.annotations.push(vf.text);
        if (vf.grace) vexflowNote.grace = Math.max(vexflowNote.grace, vf.grace);
        if (vf.tremolo) vexflowNote.tremolo = Math.max(vexflowNote.tremolo, vf.tremolo);
        if (vf.parentheses) vexflowNote.parentheses = true;
      }
    });

    // Agregar articulaciones del instrumento base
    if (instrumentInfo.vexflow.articulation) {
      vexflowNote.articulations.push(instrumentInfo.vexflow.articulation);
    }
    if (instrumentInfo.vexflow.text) {
      vexflowNote.annotations.push(instrumentInfo.vexflow.text);
    }

    return vexflowNote;
  }

  // Validar si un instrumento existe
  static isValidInstrument(instrument: string): boolean {
    return instrument in DRUM_INSTRUMENT_MAP;
  }

  // Validar si un modificador existe
  static isValidModifier(modifier: string): boolean {
    return modifier in DRUM_MODIFIER_MAP;
  }
}

export default DrumNotationService;