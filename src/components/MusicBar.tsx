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

    // Memoizar el grid de subdivisiones (solo cambia cuando cambia activeSubdivision)
    const subdivisionsGrid = useMemo(() => (
        Array.from({ length: subdivisions }, (_, index) => (
            <Box
                key={index}
                sx={{
                    height: "32px",
                    backgroundColor: "#f0f0f0",
                    border: active && activeSubdivision === index 
                        ? "2px solid #ff4444" 
                        : "1px solid #ccc",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // Optimización: usar transform para la animación en lugar de cambiar border
                    transform: active && activeSubdivision === index ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.05s ease-out" // Transición muy rápida
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: active && activeSubdivision === index ? "#ff4444" : "#666",
                        fontSize: "12px",
                        fontWeight: active && activeSubdivision === index ? "bold" : "normal"
                    }}
                >
                    {index + 1}
                </Typography>
            </Box>
        ))
    ), [subdivisions, active, activeSubdivision]);

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

    // Modo normal: mostrar subdivisiones y controles de loop
    return (
        <Box
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseUp={onMouseUp}
            sx={{
                border: `3px solid ${borderColor}`,
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: backgroundColor,
                cursor: "pointer",
                userSelect: "none"
            }}
        >
            {/* Header con número de compás */}
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
                paddingX: "4px"
            }}>
                <Typography 
                    variant="caption" 
                    sx={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#666"
                    }}
                >
                    #{barNumber}
                </Typography>
            </Box>

            {/* Grid de subdivisiones */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${subdivisions}, 1fr)`,
                    gap: "4px",
                    marginBottom: "8px"
                }}
            >
                {subdivisionsGrid}
            </Box>

            {/* Footer con barra de loop y SpeedDial */}
            {showLoopButton && (
                <Box sx={{ 
                    display: "flex", 
                    alignItems: "center",
                    gap: "4px",
                    borderTop: "1px solid #eee",
                    paddingTop: "8px",
                    marginTop: "8px",
                    minHeight: "28px" // Asegurar altura mínima
                }}>
                    {/* Barra de loop */}
                    <Box 
                        onMouseEnter={() => setIsLoopButtonHovered(true)}
                        onMouseLeave={() => setIsLoopButtonHovered(false)}
                        sx={{
                            flexGrow: 1,
                            minWidth: 0, // Permite que se encoja si es necesario
                            height: "24px",
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
                            transition: "all 0.2s ease",
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
                            e.stopPropagation(); // Evitar trigger del onClick del compás
                            onClick();
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
                    
                    {/* SpeedDial fijo a la derecha */}
                    {(onEditBar || onCloneBar || onDeleteBar) && (
                        <Box sx={{ 
                            flexShrink: 0, // No se encoge
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
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
                                        width: 28,
                                        height: 28,
                                        backgroundColor: '#1976d2',
                                        '&:hover': {
                                            backgroundColor: '#1565c0'
                                        }
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