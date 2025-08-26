import { Box, Typography } from "@mui/material";
import React, { memo } from "react";

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
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    };

    const getBorderColor = () => {
        if (inNewSection) return "#9c27b0"; // Morado cuando está creando sección
        if (isSelected && isLoopActive) return "#4caf50"; // Verde cuando está en loop activo
        if (isSelected) return "#ff9800"; // Naranja cuando está seleccionado
        return "#ddd"; // Gris por defecto
    };

    const getBackgroundColor = () => {
        if (inNewSection) return "#f3e5f5"; // Morado claro cuando está creando sección
        if (isSelected && isLoopActive) return "#e8f5e8"; // Verde claro cuando está en loop activo
        if (isSelected) return "#fff3e0"; // Naranja claro cuando está seleccionado
        return "white"; // Blanco por defecto
    };

    return (
        <Box
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseUp={onMouseUp}
            sx={{
                border: `3px solid ${getBorderColor()}`,
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: getBackgroundColor(),
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
                    {formatTime(startTime)}
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
                {Array.from({ length: subdivisions }, (_, index) => (
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
                            justifyContent: "center"
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: "#666",
                                fontSize: "12px"
                            }}
                        >
                            {index + 1}
                        </Typography>
                    </Box>
                ))}
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