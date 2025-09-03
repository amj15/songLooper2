import React, { useState, useCallback, useRef, useEffect } from "react";
import { Box, Typography, IconButton, Tooltip, Menu, MenuItem, Button, Collapse } from "@mui/material";
import { styled } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { type DrumNote } from "../services/barNotationService";

interface DrumSequencerProps {
  barIndex: number;
  notes: DrumNote[];
  onNotesChange: (notes: DrumNote[]) => void;
  timeSignature?: string;
  subdivisionResolution?: number; // 16 para 1/16, 32 para 1/32, etc.
}

// Instrumentos principales - siempre visibles
const MAIN_INSTRUMENTS = [
  { id: "kick", name: "Kick", midi: 36, color: "#e74c3c", modifiers: [] },
  { 
    id: "snare", 
    name: "Snare", 
    midi: 38, 
    color: "#f39c12", 
    modifiers: [
      { key: "rimshot", name: "Rimshot", midi: 37 }
    ]
  },
  { 
    id: "hihat", 
    name: "Hi-Hat", 
    midi: 42, 
    color: "#3498db", 
    modifiers: [
      { key: "open", name: "Open", midi: 46 },
      { key: "pedal", name: "Pedal", midi: 44 }
    ]
  },
  { id: "ride", name: "Ride", midi: 51, color: "#48c9b0", modifiers: [] },
  { id: "crash", name: "Crash", midi: 49, color: "#1abc9c", modifiers: [] },
  { id: "tom1", name: "Tom 1", midi: 50, color: "#9b59b6", modifiers: [] },
  { id: "tom2", name: "Tom 2", midi: 48, color: "#8e44ad", modifiers: [] },
  { id: "floor_tom", name: "Floor Tom", midi: 41, color: "#4a235a", modifiers: [] }
];

// Instrumentos adicionales - mostrar en desplegable
const EXTRA_INSTRUMENTS = [
  { id: "kick_2", name: "Kick 2", midi: 35, color: "#c0392b", modifiers: [] },
  { id: "e_snare", name: "E-Snare", midi: 40, color: "#d68910", modifiers: [] },
  { id: "sidestick", name: "Sidestick", midi: 39, color: "#ca6f1e", modifiers: [] },
  { id: "high_mid_tom", name: "High-Mid Tom", midi: 48, color: "#8e44ad", modifiers: [] },
  { id: "low_mid_tom", name: "Low-Mid Tom", midi: 47, color: "#7d3c98", modifiers: [] },
  { id: "low_tom", name: "Low Tom", midi: 45, color: "#6c3483", modifiers: [] },
  { id: "high_floor", name: "High Floor", midi: 43, color: "#5b2c6f", modifiers: [] },
  { id: "crash_2", name: "Crash 2", midi: 57, color: "#16a085", modifiers: [] },
  { id: "ride_bell", name: "Ride Bell", midi: 53, color: "#45b7b8", modifiers: [] },
  { id: "splash", name: "Splash", midi: 55, color: "#58d68d", modifiers: [] },
  { id: "china", name: "China", midi: 52, color: "#52c41a", modifiers: [] },
  { id: "clap", name: "Clap", midi: 39, color: "#95a5a6", modifiers: [] },
  { id: "cowbell", name: "Cowbell", midi: 56, color: "#7f8c8d", modifiers: [] },
  { id: "tambourine", name: "Tambourine", midi: 54, color: "#bdc3c7", modifiers: [] }
];

const MODIFIERS = {
  // Modificadores generales
  ghost: "Nota fantasma, muy suave",
  accent: "Acento fuerte", 
  roll: "Redoble",
  flam: "Flam",
  drag: "Drag",
  buzz: "Buzz roll",
  choke: "Corte repentino",
  cross_stick: "Cross stick",
  
  // Modificadores específicos para hi-hat
  open: "Hi-hat abierto",
  pedal: "Hi-hat pedal",
  
  // Modificadores específicos para snare
  rimshot: "Rimshot"
};

// Styled components
const SequencerContainer = styled(Box)(({ theme }) => ({
  background: '#1a1a1a',
  borderRadius: '8px',
  padding: '16px',
  maxHeight: '70vh',
  overflow: 'auto'
}));

const GridContainer = styled(Box)<{ totalCells: number }>(({ theme, totalCells }) => ({
  display: 'grid',
  gridTemplateColumns: `150px repeat(${totalCells}, 1fr)`,
  gap: '1px',
  background: '#333',
  border: '2px solid #444',
  borderRadius: '4px',
  overflow: 'hidden'
}));

const InstrumentLabel = styled(Box)(({ theme }) => ({
  background: '#2c3e50',
  color: '#ffffff',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '13px',
  fontWeight: '600',
  borderRight: '1px solid #444',
  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
}));

const GridCell = styled(Box, {
  shouldForwardProp: (prop) => !['isActive', 'isStart', 'isMiddle', 'isEnd', 'instrumentColor', 'isHovered'].includes(prop as string)
})<{
  isActive: boolean;
  isStart?: boolean;
  isMiddle?: boolean; 
  isEnd?: boolean;
  instrumentColor?: string;
  isHovered?: boolean;
}>(({ theme, isActive, isStart, isMiddle, isEnd, instrumentColor, isHovered }) => ({
  height: '32px',
  background: isActive 
    ? (instrumentColor || '#4CAF50')
    : (isHovered ? '#666' : '#444'),
  cursor: 'pointer',
  transition: 'all 0.1s ease',
  position: 'relative',
  
  // Sistema de bordes para agrupación visual
  ...(isActive ? {
    // Bordes superiores e inferiores siempre presentes en notas activas
    borderTop: `2px solid ${instrumentColor || '#4CAF50'}`,
    borderBottom: `2px solid ${instrumentColor || '#4CAF50'}`,
    
    // Borde izquierdo: solo en inicio de nota
    borderLeft: isStart 
      ? `3px solid rgba(255,255,255,0.9)`
      : `1px solid ${instrumentColor || '#4CAF50'}`,
    
    // Borde derecho: solo en final de nota  
    borderRight: isEnd 
      ? `3px solid rgba(255,255,255,0.9)`
      : `1px solid ${instrumentColor || '#4CAF50'}`,
  } : {
    // Celdas inactivas: bordes normales
    border: '1px solid #555'
  }),
  
  '&:hover': {
    background: isActive 
      ? instrumentColor 
        ? `${instrumentColor}DD` 
        : '#45a049'
      : '#666',
    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
    zIndex: 10
  }
}));

const TimelineHeader = styled(Box)<{ totalCells: number }>(({ theme, totalCells }) => ({
  display: 'grid',
  gridTemplateColumns: `150px repeat(${totalCells}, 1fr)`,
  gap: '1px',
  marginBottom: '8px',
  padding: '0 2px'
}));

const TimelineCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isBeat'
})<{ isBeat?: boolean }>(({ theme, isBeat }) => ({
  textAlign: 'center',
  fontSize: '11px',
  color: isBeat ? '#ffffff' : '#cccccc',
  fontWeight: isBeat ? '600' : '500',
  padding: '4px 2px',
  background: isBeat ? 'rgba(33, 150, 243, 0.3)' : 'transparent',
  borderRadius: isBeat ? '4px' : '0'
}));

const DrumSequencer: React.FC<DrumSequencerProps> = ({
  barIndex,
  notes = [],
  onNotesChange,
  timeSignature = "4/4",
  subdivisionResolution = 16
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<number | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<number | null>(null);
  const [dragInstrument, setDragInstrument] = useState<string | null>(null);
  const [modifierMenuAnchor, setModifierMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{instrument: string, position: number} | null>(null);
  const [showExtraInstruments, setShowExtraInstruments] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  // Obtener instrumentos a mostrar
  const visibleInstruments = showExtraInstruments 
    ? [...MAIN_INSTRUMENTS, ...EXTRA_INSTRUMENTS]
    : MAIN_INSTRUMENTS;

  // Calcular número de celdas basado en time signature y resolución
  const parseTimeSignature = (sig: string) => {
    const [numerator, denominator] = sig.split('/').map(Number);
    return { numerator, denominator };
  };

  const { numerator, denominator } = parseTimeSignature(timeSignature);
  
  // Calcular celdas: numerator * (subdivisionResolution / 4)
  // Para 4/4 con 1/16: 4 * (16/4) = 16 celdas
  // Para 3/4 con 1/16: 3 * (16/4) = 12 celdas
  const totalCells = numerator * (subdivisionResolution / 4);
  const cellsPerBeat = subdivisionResolution / 4; // 4 para 1/16, 8 para 1/32

  // Generar timeline dinámico
  const timelineNumbers = Array.from({ length: totalCells }, (_, i) => {
    const position = i + 1;
    const beatNumber = Math.floor(i / cellsPerBeat) + 1;
    const isBeat = i % cellsPerBeat === 0;
    return { position, beatNumber, isBeat };
  });

  // Verificar si una celda está activa y obtener su info
  const getCellInfo = useCallback((instrument: string, position: number) => {
    const note = notes.find(n => 
      n.instrument === instrument && 
      position >= n.start && 
      position < n.start + n.duration
    );
    
    if (!note) return { isActive: false };
    
    return {
      isActive: true,
      isStart: position === note.start,
      isEnd: position === note.start + note.duration - 1,
      isMiddle: position > note.start && position < note.start + note.duration - 1,
      note
    };
  }, [notes]);

  // Manejar click en celda
  const handleCellClick = useCallback((instrument: string, position: number, event: React.MouseEvent) => {
    // Solo procesar el click si no se estaba draggeando
    if (isDragging) return;
    
    const cellInfo = getCellInfo(instrument, position);
    
    if (cellInfo.isActive && cellInfo.note) {
      // Si la celda está activa, borrar la nota
      const newNotes = notes.filter(n => n !== cellInfo.note);
      onNotesChange(newNotes);
    } else {
      // Si está vacía, crear nueva nota de 1 semicorchea
      const newNote: DrumNote = {
        instrument,
        start: position,
        duration: 1
      };
      onNotesChange([...notes, newNote]);
    }
  }, [notes, onNotesChange, getCellInfo, isDragging]);

  // Manejar inicio de drag
  const handleMouseDown = useCallback((instrument: string, position: number, event: React.MouseEvent) => {
    event.preventDefault();
    const cellInfo = getCellInfo(instrument, position);
    
    if (!cellInfo.isActive) {
      setIsDragging(true);
      setDragStartPos(position);
      setDragCurrentPos(position);
      setDragInstrument(instrument);
    }
  }, [getCellInfo]);

  // Manejar drag
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !dragInstrument || dragStartPos === null) return;
    
    const gridElement = gridRef.current;
    if (!gridElement) return;

    const rect = gridElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const cellWidth = (rect.width - 150) / totalCells; // 150px para labels, resto dividido según totalCells
    const position = Math.floor((x - 150) / cellWidth) + 1;
    
    if (position >= 1 && position <= totalCells && position !== dragCurrentPos) {
      setDragCurrentPos(position);
    }
  }, [isDragging, dragInstrument, dragStartPos, dragCurrentPos]);

  // Finalizar drag
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragInstrument && dragStartPos !== null && dragCurrentPos !== null) {
      // Solo crear nota si se movió el drag (más de una posición)
      if (Math.abs(dragCurrentPos - dragStartPos) > 0) {
        const start = Math.min(dragStartPos, dragCurrentPos);
        const end = Math.max(dragStartPos, dragCurrentPos);
        const duration = end - start + 1;

        const newNote: DrumNote = {
          instrument: dragInstrument,
          start,
          duration
        };

        onNotesChange([...notes, newNote]);
      }
    }

    setIsDragging(false);
    setDragStartPos(null);
    setDragCurrentPos(null);
    setDragInstrument(null);
  }, [isDragging, dragInstrument, dragStartPos, dragCurrentPos, notes, onNotesChange]);

  // Event listeners para drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Manejar menú de modificadores
  const handleModifierMenu = (event: React.MouseEvent, noteIndex: number) => {
    event.stopPropagation();
    setSelectedNoteIndex(noteIndex);
    setModifierMenuAnchor(event.currentTarget as HTMLElement);
  };

  const handleModifierSelect = (modifier: string) => {
    if (selectedNoteIndex !== null) {
      const updatedNotes = [...notes];
      const selectedNote = updatedNotes[selectedNoteIndex];
      
      // Aplicar modificador a toda la nota (todas las celdas de su duración)
      if (selectedNote.modifiers?.includes(modifier)) {
        // Remover modificador de toda la nota
        selectedNote.modifiers = selectedNote.modifiers.filter(m => m !== modifier);
        if (selectedNote.modifiers.length === 0) {
          delete selectedNote.modifiers;
        }
      } else {
        // Añadir modificador a toda la nota
        selectedNote.modifiers = selectedNote.modifiers || [];
        selectedNote.modifiers.push(modifier);
      }
      
      onNotesChange(updatedNotes);
    }
    
    setModifierMenuAnchor(null);
    setSelectedNoteIndex(null);
  };

  // Manejar hover en celdas - simplificado sin tooltips problemáticos
  const handleCellMouseEnter = useCallback((instrument: string, position: number) => {
    if (!isDragging) {
      setHoveredCell({ instrument, position });
    }
  }, [isDragging]);

  const handleCellMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredCell(null);
    }
  }, [isDragging]);

  // Obtener modificadores disponibles para un instrumento
  const getAvailableModifiers = useCallback((instrumentId: string) => {
    const allModifiers = Object.entries(MODIFIERS);
    
    // Filtrar modificadores según el instrumento
    return allModifiers.filter(([key, description]) => {
      if (instrumentId === 'hihat') {
        // Hi-hat puede tener: open, pedal, y modificadores generales (excepto rimshot)
        return !['rimshot'].includes(key);
      } else if (instrumentId === 'snare') {
        // Snare puede tener: rimshot y modificadores generales (excepto open, pedal)
        return !['open', 'pedal'].includes(key);
      } else {
        // Otros instrumentos solo modificadores generales
        return !['open', 'pedal', 'rimshot'].includes(key);
      }
    });
  }, []);

  return (
    <SequencerContainer>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          Compás {barIndex + 1} - Editor de Batería
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1 }}>
          Click para crear/borrar notas • Arrastra para crear notas largas • Click derecho para modificadores
        </Typography>
        
        {/* Botón para mostrar/ocultar instrumentos adicionales */}
        <Button
          onClick={() => setShowExtraInstruments(!showExtraInstruments)}
          startIcon={showExtraInstruments ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          size="small"
          sx={{ 
            color: '#888', 
            textTransform: 'none',
            '&:hover': { color: 'white' }
          }}
        >
          {showExtraInstruments ? 'Ocultar' : 'Mostrar más'} instrumentos ({EXTRA_INSTRUMENTS.length})
        </Button>
      </Box>

      {/* Timeline header */}
      <TimelineHeader totalCells={totalCells}>
        <Box sx={{ color: '#888', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
          Instrumento
        </Box>
        {timelineNumbers.map(({ position, beatNumber, isBeat }) => (
          <TimelineCell key={position} isBeat={isBeat}>
            {isBeat ? beatNumber : position}
          </TimelineCell>
        ))}
      </TimelineHeader>

      {/* Grid */}
      <GridContainer ref={gridRef} totalCells={totalCells}>
        {visibleInstruments.map(instrument => (
          <React.Fragment key={instrument.id}>
            {/* Label del instrumento */}
            <InstrumentLabel sx={{ background: `${instrument.color}22` }}>
              <Box sx={{ color: instrument.color }}>
                {instrument.name}
              </Box>
            </InstrumentLabel>
            
            {/* Celdas de la grilla (16 semicorcheas) */}
            {timelineNumbers.map(({ position }) => {
              const cellInfo = getCellInfo(instrument.id, position);
              const isDragPreview = isDragging && 
                dragInstrument === instrument.id && 
                dragStartPos !== null && 
                dragCurrentPos !== null &&
                position >= Math.min(dragStartPos, dragCurrentPos) &&
                position <= Math.max(dragStartPos, dragCurrentPos);
              
              const isHovered = hoveredCell?.instrument === instrument.id && 
                hoveredCell?.position === position;

              return (
                <GridCell
                  key={`${instrument.id}-${position}`}
                  isActive={cellInfo.isActive || isDragPreview}
                  isStart={cellInfo.isStart || (isDragPreview && position === Math.min(dragStartPos!, dragCurrentPos!))}
                  isMiddle={cellInfo.isMiddle || (isDragPreview && position > Math.min(dragStartPos!, dragCurrentPos!) && position < Math.max(dragStartPos!, dragCurrentPos!))}
                  isEnd={cellInfo.isEnd || (isDragPreview && position === Math.max(dragStartPos!, dragCurrentPos!))}
                  instrumentColor={instrument.color}
                  isHovered={isHovered}
                  onClick={(e) => handleCellClick(instrument.id, position, e)}
                  onMouseDown={(e) => handleMouseDown(instrument.id, position, e)}
                  onMouseEnter={() => handleCellMouseEnter(instrument.id, position)}
                  onMouseLeave={handleCellMouseLeave}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (cellInfo.note) {
                      const noteIndex = notes.indexOf(cellInfo.note);
                      handleModifierMenu(e, noteIndex);
                    }
                  }}
                  title={cellInfo.isActive 
                    ? `${instrument.name} - Click: borrar, Right-click: modificadores` 
                    : `${instrument.name} - Click: crear nota, Drag: nota larga`
                  }
                >
                  {/* Indicador de modificadores */}
                  {cellInfo.note?.modifiers && cellInfo.isStart && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#ffeb3b',
                        border: '1px solid #fff',
                        fontSize: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#333'
                      }}
                    >
                      M
                    </Box>
                  )}
                </GridCell>
              );
            })}
          </React.Fragment>
        ))}
      </GridContainer>

      {/* Menú de modificadores para notas existentes */}
      <Menu
        anchorEl={modifierMenuAnchor}
        open={Boolean(modifierMenuAnchor)}
        onClose={() => setModifierMenuAnchor(null)}
      >
        {selectedNoteIndex !== null && 
          getAvailableModifiers(notes[selectedNoteIndex]?.instrument || '').map(([key, description]) => {
            const isActive = selectedNoteIndex !== null && 
              notes[selectedNoteIndex]?.modifiers?.includes(key);
            
            return (
              <MenuItem
                key={key}
                onClick={() => handleModifierSelect(key)}
                sx={{ 
                  background: isActive ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                  '&:hover': { background: 'rgba(76, 175, 80, 0.1)' }
                }}
              >
                <Tooltip title={description} placement="left">
                  <Typography sx={{ textTransform: 'capitalize' }}>
                    {isActive ? '✓ ' : ''}{key.replace('_', ' ')}
                  </Typography>
                </Tooltip>
              </MenuItem>
            );
          })
        }
      </Menu>

    </SequencerContainer>
  );
};

export default DrumSequencer;