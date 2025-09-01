import { Box, Typography, SpeedDial, SpeedDialAction } from "@mui/material";
import { 
    MusicNote as MusicNoteIcon, 
    Edit as EditIcon,
    ContentCopy as CopyIcon,
    Delete as DeleteIcon
} from "@mui/icons-material";
import React, { memo, useMemo, useState } from "react";
import type { Section } from "../types/sections";

// La interfaz Section ahora viene del import de types/sections

interface MusicBarProps {
    barIndex: number;
    subdivisions: number;
    active: boolean;
    activeSubdivision: number | null;
    isSelected: boolean;
    isLoopActive: boolean;
    onClick: () => void;
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseUp: (event: React.MouseEvent) => void;
    section?: Section;
    isEditingMode?: boolean; // Modo edición de secciones
    isLoopSelectionActive?: boolean; // Si hay una selección de loop en progreso
    showLoopButton?: boolean; // Controlar si mostrar el botón de loop individual
    isInActiveLoop?: boolean; // Si este compás está en un loop activo
    barNumber?: number; // Número del compás (relativo a sección o absoluto)
    onEditBar?: (barIndex: number) => void; // Función para editar notación del compás
    onCloneBar?: (barIndex: number) => void; // Función para clonar compás
    onDeleteBar?: (barIndex: number) => void; // Función para borrar compás
}

const MusicBar = memo(({ 
    barIndex, 
    subdivisions, 
    active, 
    activeSubdivision,
    isSelected,
    isLoopActive,
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    section,
    isEditingMode = false,
    isLoopSelectionActive = false,
    showLoopButton = true,
    isInActiveLoop = false,
    barNumber = 1,
    onEditBar,
    onCloneBar,
    onDeleteBar
}: MusicBarProps) => {
    
    // Estado para controlar hover del botón loop
    const [isLoopButtonHovered, setIsLoopButtonHovered] = useState(false);
    
    // Estado para controlar el SpeedDial
    const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
    

    // Colores estándar para todos los compases
    const borderColor = "#ddd";
    const backgroundColor = "white";

    // Colores para el compás activo
    const activeBorderColor = active ? "#ff4444" : "#ddd";
    const activeBoxShadow = active ? "0 0 16px rgba(255, 68, 68, 0.5)" : "none";

    if (isEditingMode) {
        // Modo edición: solo mostrar número de compás
        return (
            <Box
                onClick={onClick}
                sx={{
                    border: `3px solid ${borderColor}`,
                    borderRadius: "8px",
                    padding: "20px",
                    backgroundColor: backgroundColor,
                    cursor: "pointer",
                    userSelect: "none",
                    minHeight: "100px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                        transform: "scale(1.02)",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                    }
                }}
            >
                <Typography 
                    variant="h4" 
                    sx={{ 
                        fontWeight: "bold",
                        color: isSelected ? "white" : "#333",
                        mb: 1
                    }}
                >
                    {barIndex + 1}
                </Typography>
                
                {/* Mostrar sección existente si la hay */}
                {section && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: isSelected ? "white" : section.color,
                            fontWeight: "bold",
                            fontSize: "10px",
                            textAlign: "center"
                        }}
                    >
                        {section.letter} - {section.label}
                    </Typography>
                )}
            </Box>
        );
    }

    // Modo normal: solo mostrar compás con borde activo - SIN animaciones
    return (
        <Box
            sx={{
                border: `3px solid ${activeBorderColor}`,
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: backgroundColor,
                userSelect: "none",
                minHeight: "80px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: activeBoxShadow
                // SIN transition para mejor sincronía
            }}
        >
            {/* Número de compás - SIN animaciones */}
            <Typography 
                variant="h3" 
                sx={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: active ? "#ff4444" : "#666",
                    mb: 1
                }}
            >
                {barNumber}
            </Typography>
            
            {/* Mostrar sección si existe */}
            {section && (
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: section.color,
                        fontWeight: "bold",
                        fontSize: "10px",
                        textAlign: "center"
                    }}
                >
                    {section.letter} - {section.label}
                </Typography>
            )}

            {/* Footer con barra de loop y SpeedDial */}
            {showLoopButton && (
                <Box sx={{ 
                    display: "flex", 
                    alignItems: "center",
                    gap: "4px",
                    borderTop: "1px solid #eee",
                    paddingTop: "8px",
                    marginTop: "8px",
                    width: "100%",
                    height: "28px", // Altura fija
                    minHeight: "28px" // Evitar que se encoja
                }}>
                    {/* Barra de loop - flex: 3 para 75% */}
                    <Box 
                        onMouseEnter={() => {
                            setIsLoopButtonHovered(true);
                            onMouseEnter();
                        }}
                        onMouseLeave={() => setIsLoopButtonHovered(false)}
                        sx={{
                            flex: "3", // 75% usando flex
                            height: "24px",
                            minHeight: "24px",
                            backgroundColor: (() => {
                                if (isInActiveLoop) return "#4caf50"; // Verde - compás en loop activo
                                if (isLoopSelectionActive || isLoopButtonHovered) return "#e0e0e0"; // Visible cuando hay selección activa o hover
                                return "transparent"; // Invisible por defecto
                            })(),
                            borderRadius: "12px", // Siempre redondeado individualmente
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: (() => {
                                if (isInActiveLoop) return 1; // Completamente visible si está en loop activo
                                if (!isLoopActive && isLoopButtonHovered) return 1; // Visible con hover si no hay loop activo
                                if (isLoopSelectionActive) return 1; // Visible durante selección
                                return 0; // Invisible por defecto cuando hay loop pero este compás no está en él
                            })(),
                            "&:hover": {
                                backgroundColor: (() => {
                                    if (isInActiveLoop) return "#45a049"; // Verde más oscuro para loops activos
                                    return "#bdbdbd"; // Gris más oscuro para hover
                                })(),
                                opacity: 1
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            onMouseDown(e);
                        }}
                        onMouseUp={(e) => {
                            e.stopPropagation();
                            onMouseUp(e);
                        }}
                    >
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: (() => {
                                    if (isInActiveLoop) return "white"; // Texto blanco en verde
                                    return "#666"; // Texto gris en fondo gris
                                })(),
                                fontSize: "11px",
                                fontWeight: "bold",
                                letterSpacing: "0.5px"
                            }}
                        >
                            {isInActiveLoop ? "LOOPED" : (isLoopSelectionActive ? "LOOP END" : "LOOP START")}
                        </Typography>
                    </Box>
                    
                    {/* SpeedDial fijo a la derecha - flex: 1 para 25% */}
                    {(onEditBar || onCloneBar || onDeleteBar) && (
                        <Box sx={{ 
                            flex: "1", // 25% usando flex
                            height: "24px",
                            minHeight: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0 // No permitir que se encoja
                        }}>
                            <SpeedDial
                                ariaLabel="Acciones del compás"
                                icon={<MusicNoteIcon />}
                                open={isSpeedDialOpen}
                                onOpen={() => setIsSpeedDialOpen(true)}
                                onClose={() => setIsSpeedDialOpen(false)}
                                direction="up"
                                sx={{
                                    '& .MuiSpeedDial-fab': {
                                        width: 20,
                                        height: 20,
                                        minHeight: 20,
                                        backgroundColor: '#1976d2',
                                        '&:hover': {
                                            backgroundColor: '#1565c0'
                                        }
                                    },
                                    '& .MuiSpeedDial-fab svg': {
                                        fontSize: '14px'
                                    }
                                }}
                            >
                                {onEditBar && (
                                    <SpeedDialAction
                                        icon={<EditIcon />}
                                        title="Editar notación"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsSpeedDialOpen(false);
                                            onEditBar(barIndex);
                                        }}
                                    />
                                )}
                                {onCloneBar && (
                                    <SpeedDialAction
                                        icon={<CopyIcon />}
                                        title="Clonar compás"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsSpeedDialOpen(false);
                                            onCloneBar(barIndex);
                                        }}
                                    />
                                )}
                                {onDeleteBar && (
                                    <SpeedDialAction
                                        icon={<DeleteIcon />}
                                        title="Borrar compás"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsSpeedDialOpen(false);
                                            onDeleteBar(barIndex);
                                        }}
                                    />
                                )}
                            </SpeedDial>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
});

MusicBar.displayName = "MusicBar";

export default MusicBar;