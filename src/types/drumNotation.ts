// Tipos para la notación de batería

export type DrumInstrument = 
  | 'kick'           // Bombo
  | 'snare'          // Caja/redoblante
  | 'hihat'          // Hi-hat
  | 'hihat_open'     // Hi-hat abierto
  | 'crash'          // Crash cymbal
  | 'ride'           // Ride cymbal
  | 'tom1'           // Tom agudo
  | 'tom2'           // Tom medio
  | 'tom3'           // Tom grave/floor tom
  | 'splash';        // Splash cymbal

export type DrumModifierType = 
  | 'accent'         // Acento (>)
  | 'ghost'          // Nota fantasma (())
  | 'flam'           // Flam
  | 'roll'           // Redoble
  | 'rimshot'        // Rimshot
  | 'cross_stick';   // Cross stick

export interface DrumModifier {
  type: DrumModifierType;
  value?: number;    // Para intensidad o duración específica
}

export interface DrumNote {
  id: string;
  instrument: DrumInstrument;
  timing: number;    // Posición en semicorcheas (0-15 para compás 4/4)
  duration: number;  // Duración en semicorcheas (1 = semicorchea, 2 = corchea, etc.)
  velocity: number;  // Intensidad (0-127, como MIDI)
  modifiers: DrumModifier[];
}

export interface BarNotation {
  id?: string;
  projectId: string;
  barIndex: number;
  timeSignatureNumerator: number;  // 4 en 4/4
  timeSignatureDenominator: number; // 4 en 4/4
  notes: DrumNote[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Configuración de instrumentos para VexFlow
export interface DrumInstrumentConfig {
  name: string;
  displayName: string;
  vexFlowNote: string;  // Nota VexFlow (ej: "b/4")
  stavePosition: number; // Posición en el pentagrama
  noteHead: string;     // Tipo de cabeza de nota
  color: string;        // Color para visualización
  category: 'drums' | 'cymbals';
}

// Configuración de modificadores para VexFlow
export interface DrumModifierConfig {
  name: DrumModifierType;
  displayName: string;
  symbol: string;       // Símbolo visual
  vexFlowType?: string; // Tipo de articulación en VexFlow
}

// Configuraciones predefinidas
export const DRUM_INSTRUMENTS: Record<DrumInstrument, DrumInstrumentConfig> = {
  kick: {
    name: 'kick',
    displayName: 'Bombo',
    vexFlowNote: 'f/4',
    stavePosition: 0,
    noteHead: 'x',
    color: '#2E7D32',
    category: 'drums'
  },
  snare: {
    name: 'snare',
    displayName: 'Caja',
    vexFlowNote: 'c/5',
    stavePosition: 3,
    noteHead: 'normal',
    color: '#D32F2F',
    category: 'drums'
  },
  hihat: {
    name: 'hihat',
    displayName: 'Hi-Hat',
    vexFlowNote: 'g/5',
    stavePosition: 6,
    noteHead: 'x',
    color: '#F57C00',
    category: 'cymbals'
  },
  hihat_open: {
    name: 'hihat_open',
    displayName: 'Hi-Hat Abierto',
    vexFlowNote: 'g/5',
    stavePosition: 6,
    noteHead: 'circle',
    color: '#FF9800',
    category: 'cymbals'
  },
  crash: {
    name: 'crash',
    displayName: 'Crash',
    vexFlowNote: 'a/5',
    stavePosition: 7,
    noteHead: 'x',
    color: '#7B1FA2',
    category: 'cymbals'
  },
  ride: {
    name: 'ride',
    displayName: 'Ride',
    vexFlowNote: 'f/5',
    stavePosition: 5,
    noteHead: 'x',
    color: '#303F9F',
    category: 'cymbals'
  },
  tom1: {
    name: 'tom1',
    displayName: 'Tom 1',
    vexFlowNote: 'e/5',
    stavePosition: 4,
    noteHead: 'normal',
    color: '#689F38',
    category: 'drums'
  },
  tom2: {
    name: 'tom2',
    displayName: 'Tom 2',
    vexFlowNote: 'd/5',
    stavePosition: 3.5,
    noteHead: 'normal',
    color: '#8BC34A',
    category: 'drums'
  },
  tom3: {
    name: 'tom3',
    displayName: 'Floor Tom',
    vexFlowNote: 'a/4',
    stavePosition: 1,
    noteHead: 'normal',
    color: '#4CAF50',
    category: 'drums'
  },
  splash: {
    name: 'splash',
    displayName: 'Splash',
    vexFlowNote: 'b/5',
    stavePosition: 8,
    noteHead: 'x',
    color: '#E91E63',
    category: 'cymbals'
  }
};

export const DRUM_MODIFIERS: Record<DrumModifierType, DrumModifierConfig> = {
  accent: {
    name: 'accent',
    displayName: 'Acento',
    symbol: '>',
    vexFlowType: 'a>'
  },
  ghost: {
    name: 'ghost',
    displayName: 'Fantasma',
    symbol: '( )',
    vexFlowType: 'a('
  },
  flam: {
    name: 'flam',
    displayName: 'Flam',
    symbol: 'ꜰ',
    vexFlowType: 'a^'
  },
  roll: {
    name: 'roll',
    displayName: 'Redoble',
    symbol: '≈',
    vexFlowType: 'a/'
  },
  rimshot: {
    name: 'rimshot',
    displayName: 'Rimshot',
    symbol: '◯',
    vexFlowType: 'ao'
  },
  cross_stick: {
    name: 'cross_stick',
    displayName: 'Cross Stick',
    symbol: '+',
    vexFlowType: 'a+'
  }
};

// Helper functions
export const createEmptyBarNotation = (
  projectId: string, 
  barIndex: number,
  timeSignature: [number, number] = [4, 4]
): BarNotation => ({
  projectId,
  barIndex,
  timeSignatureNumerator: timeSignature[0],
  timeSignatureDenominator: timeSignature[1],
  notes: []
});

export const generateNoteId = (): string => {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getSubdivisionsPerBar = (timeSignature: [number, number]): number => {
  // Cada beat se divide en 4 semicorcheas
  return timeSignature[0] * 4;
};