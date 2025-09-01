import { Box, Typography } from "@mui/material";
import React, { memo, useCallback, useMemo, useEffect, useRef } from "react";
import type { Section } from "../types/sections";
import MemoizedMusicBar from "./MemoizedMusicBar";

interface BarData {
    id: number;
    start: number;
    end: number;
    beatDuration: number;
    totalBeats: number;
}

interface BarsGridProps {
    barsData: BarData[];
    currentTime: number;
    displayBars: number;
    selectedBars: number[];
    rangeStart: number | null; // Agregamos rangeStart
    onBarClick: (barIndex: number) => void;
    onBarMouseDown: (barIndex: number, event: React.MouseEvent) => void;
    onBarMouseEnter: (barIndex: number) => void;
    onBarMouseUp: (event: React.MouseEvent) => void;
    isLoopActive: boolean;
    sections: Section[];
    getSectionForBar: (barIndex: number) => Section | undefined;
    isDragging: boolean;
    dragStart: number | null;
    dragEnd: number | null;
    isEditingMode?: boolean;
    onSeekToBar?: (barIndex: number) => void; // Nueva función para saltar a un compás específico
    enableAutoScroll?: boolean; // Habilitar auto-scroll
    onEditBar?: (barIndex: number) => void; // Función para editar notación del compás
    onCloneBar?: (barIndex: number) => void; // Función para clonar compás
    onDeleteBar?: (barIndex: number) => void; // Función para borrar compás
}

// La interfaz Section ahora viene del import de types/sections

const BarsGrid = memo(({ 
    barsData, 
    currentTime,
    displayBars, 
    selectedBars,
    rangeStart,
    onBarClick, 
    onBarMouseDown,
    onBarMouseEnter,
    onBarMouseUp,
    isLoopActive, 
    sections, 
    getSectionForBar, 
    isDragging,
    dragStart,
    dragEnd,
    isEditingMode = false,
    onSeekToBar,
    enableAutoScroll = false,
    onEditBar,
    onCloneBar,
    onDeleteBar
}: BarsGridProps) => {
    
    // Función para encontrar el compás activo y subdivisión - ahora memoizada
    const getActiveBarAndBeat = useMemo(() => {
        for (let i = 0; i < barsData.length; i++) {
            const bar = barsData[i];
            if (currentTime >= bar.start && currentTime < bar.end) {
                const elapsedInBar = currentTime - bar.start;
                const activeSubdivision = Math.floor(elapsedInBar / bar.beatDuration);
                
                // Debug logs removidos para mejor rendimiento
                
                return {
                    activeBarIndex: i,
                    activeSubdivision: activeSubdivision >= 0 ? activeSubdivision : null
                };
            }
        }
        
        return { activeBarIndex: null, activeSubdivision: null };
    }, [barsData, currentTime]);

    const { activeBarIndex, activeSubdivision } = getActiveBarAndBeat;


    // Función para determinar si un color es claro y necesita texto oscuro
    const isLightColor = useCallback((color: string) => {
        // Convertir hex a RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Calcular luminancia usando la fórmula estándar
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5; // Si la luminancia es > 0.5, es un color claro
    }, []);

    // Función para crear variaciones de color para diferentes letras
    const getVariatedColor = useCallback((baseColor: string, letter: string) => {
        const letterIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, etc.
        
        // Convertir hex a RGB
        const hex = baseColor.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        // Aplicar variaciones según la letra
        const variations = [
            { r: 0, g: 0, b: 0 },      // A - Color original
            { r: -30, g: -30, b: -30 }, // B - Más oscuro
            { r: 20, g: 20, b: 20 },    // C - Más claro
            { r: -20, g: 10, b: 10 },   // D - Variación rojiza
            { r: 10, g: -20, b: 10 },   // E - Variación verdosa
            { r: 10, g: 10, b: -20 },   // F - Variación azulada
        ];
        
        const variation = variations[letterIndex % variations.length] || variations[0];
        
        // Aplicar variación y mantener en rango 0-255
        r = Math.max(0, Math.min(255, r + variation.r));
        g = Math.max(0, Math.min(255, g + variation.g));
        b = Math.max(0, Math.min(255, b + variation.b));
        
        // Convertir de vuelta a hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }, []);


    // Crear filas de compases para el renderizado
    const createRows = useCallback(() => {
        const rows = [];
        for (let i = 0; i < barsData.length; i += displayBars) {
            const rowBars = barsData.slice(i, i + displayBars);
            rows.push({
                startIndex: i,
                bars: rowBars
            });
        }
        return rows;
    }, [barsData, displayBars]);


    // Renderizar barra de sección sobre los compases
    const renderSectionBar = useCallback((section: Section, rowStartIndex: number) => {
        const sectionStart = Math.max(section.startBar, rowStartIndex);
        const sectionEnd = Math.min(section.endBar, rowStartIndex + displayBars - 1);
        
        if (sectionStart > rowStartIndex + displayBars - 1 || sectionEnd < rowStartIndex) {
            return null;
        }

        const startPosition = ((sectionStart - rowStartIndex) / displayBars) * 100;
        const width = ((sectionEnd - sectionStart + 1) / displayBars) * 100;
        const isFirstRow = section.startBar >= rowStartIndex && section.startBar < rowStartIndex + displayBars;
        const isStartOfRow = sectionStart === rowStartIndex; // Sección empieza en esta fila
        const variatedColor = getVariatedColor(section.color, section.letter);
        const textColor = isLightColor(variatedColor) ? "#333" : "white";

        return (
            <Box
                key={`section-${section.id}-row-${rowStartIndex}`}
                sx={{
                    position: "absolute",
                    top: "-24px",
                    left: `${startPosition}%`,
                    width: `${width}%`,
                    height: "20px",
                    backgroundColor: variatedColor,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    paddingX: "8px",
                    zIndex: 5,
                    overflow: "hidden"
                }}
            >
                {(isFirstRow || isStartOfRow) && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: textColor,
                            fontSize: "11px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        <span style={{ fontWeight: "bold" }}>
                            {section.type.charAt(0).toUpperCase() + section.type.slice(1)} - {section.letter}
                        </span>
                        {" - "}{section.label}
                    </Typography>
                )}
            </Box>
        );
    }, [displayBars, getVariatedColor, isLightColor]);

    const rows = useMemo(() => createRows(), [createRows]);
    
    // Referencias para auto-scroll
    const containerRef = useRef<HTMLDivElement>(null);
    const activeBarRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Auto-scroll cuando cambie el compás activo
    useEffect(() => {
        if (enableAutoScroll && activeBarIndex !== null && containerRef.current) {
            const activeBarElement = activeBarRefs.current[activeBarIndex];
            if (activeBarElement) {
                activeBarElement.scrollIntoView({
                    behavior: 'auto', // Cambiado de 'smooth' a 'auto' para mejor timing
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeBarIndex, enableAutoScroll]);


    return (
        <Box 
            ref={containerRef}
            sx={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "32px",
                overflowX: enableAutoScroll ? "auto" : "visible",
                paddingTop: "16px" // Espacio normal ya que AudioControls está en el layout
            }}
        >
            {rows.map((row, rowIndex) => (
                <Box key={`row-${rowIndex}`} sx={{ position: "relative" }}>
                    {/* Renderizar barras de secciones para esta fila */}
                    {sections.map((section) => renderSectionBar(section, row.startIndex))}
                    
                    
                    {/* Renderizar barra de nueva sección si se está creando */}
                    {isDragging && dragStart !== null && dragEnd !== null && (
                        <Box
                            sx={{
                                position: "absolute",
                                top: "-24px",
                                left: `${((Math.min(Math.max(dragStart, row.startIndex), row.startIndex + displayBars - 1) - row.startIndex) / displayBars) * 100}%`,
                                width: `${((Math.min(Math.max(dragEnd, row.startIndex), row.startIndex + displayBars - 1) - Math.min(Math.max(dragStart, row.startIndex), row.startIndex + displayBars - 1) + 1) / displayBars) * 100}%`,
                                height: "20px",
                                backgroundColor: "#9c27b0",
                                borderRadius: "4px",
                                border: "2px dashed white",
                                zIndex: 10,
                                opacity: 0.8
                            }}
                        />
                    )}

                    {/* Grid de compases */}
                    <Box sx={{ display: "flex", gap: "16px" }}>
                        {row.bars.map((bar, localIndex) => {
                            const globalIndex = row.startIndex + localIndex;
                            const section = getSectionForBar(globalIndex);
                            
                            // Calcular propiedades del loop para este compás
                            const isInLoop = selectedBars.includes(globalIndex) && isLoopActive;
                            
                            // Calcular número de compás relativo a sección o absoluto
                            const barNumberInSection = section ? (globalIndex - section.startBar + 1) : (globalIndex + 1);
                            
                            return (
                                <Box
                                    key={bar.id}
                                    ref={(el: HTMLDivElement | null) => {
                                        if (activeBarRefs.current) {
                                            activeBarRefs.current[globalIndex] = el;
                                        }
                                    }}
                                    sx={{
                                        flex: `0 0 calc(${100 / displayBars}% - 16px)`,
                                        boxSizing: "border-box",
                                        minWidth: "150px",
                                        position: "relative"
                                    }}
                                >
                                    {/* Marcador de posición único */}
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: "-8px",
                                            top: "0",
                                            width: "6px",
                                            height: "100%",
                                            backgroundColor: "transparent",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            zIndex: 10,
                                            "&:hover": {
                                                backgroundColor: "#2196F3",
                                                boxShadow: "0 0 12px rgba(33, 150, 243, 0.6)"
                                            }
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Click salta al inicio del compás
                                            if (onSeekToBar) {
                                                onSeekToBar(globalIndex);
                                            }
                                        }}
                                    />
                                    
                                    <MemoizedMusicBar
                                        barIndex={globalIndex}
                                        subdivisions={bar.totalBeats}
                                        active={activeBarIndex === globalIndex}
                                        activeSubdivision={activeBarIndex === globalIndex ? activeSubdivision : null}
                                        isSelected={selectedBars.includes(globalIndex)}
                                        isLoopActive={isLoopActive}
                                        onBarClick={onBarClick}
                                        onBarMouseDown={onBarMouseDown}
                                        onBarMouseEnter={onBarMouseEnter}
                                        onBarMouseUp={onBarMouseUp}
                                        section={section}
                                        isEditingMode={isEditingMode}
                                        isLoopSelectionActive={rangeStart !== null}
                                        showLoopButton={true}
                                        isInActiveLoop={isInLoop}
                                        barNumber={barNumberInSection}
                                        onEditBar={onEditBar}
                                        onCloneBar={onCloneBar}
                                        onDeleteBar={onDeleteBar}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                    

                    {/* Etiquetas de sección al inicio de cada fila */}
                    {row.startIndex % displayBars === 0 && (
                        <Box sx={{ 
                            position: "absolute", 
                            left: "-120px", 
                            top: "0", 
                            width: "100px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px"
                        }}>
                            {sections
                                .filter(section => 
                                    section.startBar <= row.startIndex + displayBars - 1 && 
                                    section.endBar >= row.startIndex
                                )
                                .map(section => {
                                    const variatedColor = getVariatedColor(section.color, section.letter);
                                    const textColor = isLightColor(variatedColor) ? "#333" : "white";
                                    return (
                                        <Box
                                            key={`label-${section.id}-row-${rowIndex}`}
                                            sx={{
                                                backgroundColor: variatedColor,
                                                color: textColor,
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                fontSize: "10px",
                                                textAlign: "center"
                                            }}
                                        >
                                            <span style={{ fontWeight: "bold" }}>
                                                {section.type.charAt(0).toUpperCase() + section.type.slice(1)} {section.letter}
                                            </span>
                                            <br />
                                            {section.label}
                                        </Box>
                                    );
                                })
                            }
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );


});

BarsGrid.displayName = "BarsGrid";

export default BarsGrid;