import { Box, Typography } from "@mui/material";
import React, { memo, useMemo } from "react";

interface Section {
    id: string;
    startBar: number;
    endBar: number;
    type: string;
    letter: string;
    name: string;
    displayName: string;
    color: string;
}

interface MusicBarProps {
    barIndex: number;
    barId: number;
    subdivisions: number;
    active: boolean;
    activeSubdivision: number | null;
    startTime: number;
    endTime: number;
    isSelected: boolean;
    isLoopActive: boolean;
    onClick: () => void;
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseUp: (event: React.MouseEvent) => void;
    section?: Section;
    inNewSection: boolean;
}

const MusicBar = memo(({ 
    barIndex, 
    barId, 
    subdivisions, 
    active, 
    activeSubdivision,
    startTime,
    endTime,
    isSelected,
    isLoopActive,
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseUp,
    section,
    inNewSection
}: MusicBarProps) => {
    
    // Memoizar el formato de tiempo (no cambia durante la reproducción)
    const formattedTime = useMemo(() => {
        const minutes = Math.floor(startTime / 60);
        const seconds = Math.floor(startTime % 60);
        const milliseconds = Math.floor((startTime % 1) * 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }, [startTime]);

    // Memoizar colores para evitar cálculos en cada render
    const { borderColor, backgroundColor } = useMemo(() => {
        let borderColor, backgroundColor;
        
        if (inNewSection) {
            borderColor = "#9c27b0";
            backgroundColor = "#f3e5f5";
        } else if (isSelected && isLoopActive) {
            borderColor = "#4caf50";
            backgroundColor = "#e8f5e8";
        } else if (isSelected) {
            borderColor = "#ff9800";
            backgroundColor = "#fff3e0";
        } else {
            borderColor = "#ddd";
            backgroundColor = "white";
        }
        
        return { borderColor, backgroundColor };
    }, [inNewSection, isSelected, isLoopActive]);

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
            {/* Header del compás */}
            <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "8px" 
            }}>
                <Typography 
                    variant="subtitle2" 
                    sx={{ 
                        fontWeight: "bold",
                        color: inNewSection ? "#7b1fa2" :
                               isSelected ? "#f57c00" : "#666"
                    }}
                >
                    {inNewSection ? "🎵 " : ""}
                    {isSelected && isLoopActive ? "🔁 " : ""}
                    Compás {barIndex + 1}
                </Typography>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: "#999",
                        fontFamily: "monospace"
                    }}
                >
                    {formattedTime}
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

            {/* Footer con información adicional */}
            <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
            }}>
                <Typography 
                    variant="caption" 
                    sx={{ 
                        color: "#999",
                        fontSize: "10px"
                    }}
                >
                    {subdivisions}/{subdivisions}
                </Typography>
                {inNewSection && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: "#7b1fa2",
                            fontWeight: "bold",
                            fontSize: "10px"
                        }}
                    >
                        🎵 NUEVA SECCIÓN
                    </Typography>
                )}
                {isSelected && !inNewSection && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: isLoopActive ? "#4caf50" : "#f57c00",
                            fontWeight: "bold",
                            fontSize: "10px"
                        }}
                    >
                        {isLoopActive ? "🔁 LOOP" : "📍 SELECCIONADO"}
                    </Typography>
                )}
            </Box>
        </Box>
    );
});

MusicBar.displayName = "MusicBar";

export default MusicBar;