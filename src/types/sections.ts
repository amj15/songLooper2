// Tipos de sección musical estándar
export const SECTION_TYPES = [
    'verse',      // Estrofa
    'chorus',     // Estribillo/Coro
    'bridge',     // Puente
    'intro',      // Introducción
    'outro',      // Conclusión/Outro
    'instrumental', // Instrumental/Solo
    'pre-chorus', // Pre-estribillo
    'breakdown',  // Breakdown
    'buildup',    // Buildup
    'drop',       // Drop
    'custom'      // Personalizado
] as const;

export type SectionType = typeof SECTION_TYPES[number];

// Letras disponibles para secciones (A-Z)
export const SECTION_LETTERS = Array.from({ length: 26 }, (_, i) => 
    String.fromCharCode(65 + i) // A, B, C, ..., Z
);

// Interfaz principal de una sección
export interface Section {
    id: string;           // UUID único
    startBar: number;     // Compás de inicio (0-indexed)
    endBar: number;       // Compás de fin (0-indexed) 
    type: SectionType;    // Tipo de sección
    letter: string;       // Letra asignada (A, B, C, etc.)
    label: string;        // Label personalizado (requerido, no opcional)
    color: string;        // Color hex para visualización
    createdAt: Date;      // Fecha de creación
    updatedAt: Date;      // Fecha de última actualización
}

// Colores por defecto para cada tipo de sección
export const SECTION_COLORS: Record<SectionType, string> = {
    'verse': '#2196F3',      // Azul
    'chorus': '#FF5722',     // Naranja
    'bridge': '#9C27B0',     // Púrpura
    'intro': '#4CAF50',      // Verde
    'outro': '#607D8B',      // Azul gris
    'instrumental': '#FF9800', // Ámbar
    'pre-chorus': '#E91E63',  // Rosa
    'breakdown': '#795548',   // Marrón
    'buildup': '#FFEB3B',     // Amarillo
    'drop': '#F44336',        // Rojo
    'custom': '#9E9E9E'       // Gris
};

// Labels por defecto para cada tipo
export const SECTION_LABELS: Record<SectionType, string> = {
    'verse': 'Estrofa',
    'chorus': 'Coro',
    'bridge': 'Puente', 
    'intro': 'Intro',
    'outro': 'Outro',
    'instrumental': 'Instrumental',
    'pre-chorus': 'Pre-Coro',
    'breakdown': 'Breakdown',
    'buildup': 'Buildup',
    'drop': 'Drop',
    'custom': 'Personalizado'
};

// Datos para crear/editar una sección
export interface SectionFormData {
    startBar: number | null;
    endBar: number | null;
    type: SectionType;
    letter: string;
    label: string;
}

// Estado del editor de secciones
export interface SectionEditorState {
    isEditing: boolean;           // Si está en modo edición
    selectedBars: number[];       // Compases seleccionados
    currentSection: Section | null; // Sección siendo editada
    isDrawerOpen: boolean;        // Si el drawer está abierto
    formData: SectionFormData;    // Datos del formulario
}