import { Box, Typography } from "@mui/material";
import React, { memo, useCallback, useMemo } from "react";
import MusicBar from "./MusicBar";

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
}

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

const BarsGrid = memo(({ 
    barsData, 
    currentTime,
    displayBars, 
    selectedBars, 
    onBarClick, 
    onBarMouseDown,
    onBarMouseEnter,
    onBarMouseUp,
    isLoopActive, 
    sections, 
    getSectionForBar, 
    isDragging,
    dragStart,
    dragEnd 
}: BarsGridProps) => {
    
    // Función para encontrar el compás activo y subdivisión - ahora memoizada
    const getActiveBarAndBeat = useMemo(() => {
        for (let i = 0; i < barsData.length; i++) {
            const bar = barsData[i];
            if (currentTime >= bar.start && currentTime < bar.end) {
                const elapsedInBar = currentTime - bar.start;
                const activeSubdivision = Math.floor(elapsedInBar / bar.beatDuration);
                
                // Debug: Log reducido para evitar spam en console
                if (i < 2 && activeSubdivision === 0) { // Solo bar 0 y 1, solo en subdivision 0
                    console.log(`Bar ${i}: time=${currentTime.toFixed(3)}s, subdivision=${activeSubdivision}`);
                }
                
                return {
                    activeBarIndex: i,
                    activeSubdivision: activeSubdivision >= 0 ? activeSubdivision : null
                };
            }
        }
        
        return { activeBarIndex: null, activeSubdivision: null };
    }, [barsData, currentTime]);

    const { activeBarIndex, activeSubdivision } = getActiveBarAndBeat;

    // Determinar si un compás está en proceso de selección para sección
    const isInNewSection = useCallback((barIndex: number) => {
        if (!isDragging || dragStart === null || dragEnd === null) return false;
        
        const start = Math.min(dragStart, dragEnd);
        const end = Math.max(dragStart, dragEnd);
        return barIndex >= start && barIndex <= end;
    }, [isDragging, dragStart, dragEnd]);

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

        return (
            <Box
                key={`section-${section.id}-row-${rowStartIndex}`}
                sx={{
                    position: "absolute",
                    top: "-24px",
                    left: `${startPosition}%`,
                    width: `${width}%`,
                    height: "20px",
                    backgroundColor: section.color,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    paddingX: "8px",
                    zIndex: 5,
                    overflow: "hidden"
                }}
            >
                {isFirstRow && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "11px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {section.displayName}
                    </Typography>
                )}
            </Box>
        );
    }, [displayBars]);

    const rows = createRows();

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "32px" }}>
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
                    <Box sx={{ display: "flex", gap: "8px" }}>
                        {row.bars.map((bar, localIndex) => {
                            const globalIndex = row.startIndex + localIndex;
                            const section = getSectionForBar(globalIndex);
                            const inNewSection = isInNewSection(globalIndex);
                            
                            return (
                                <Box
                                    key={bar.id}
                                    sx={{
                                        flex: `0 0 calc(${100 / displayBars}% - 8px)`,
                                        boxSizing: "border-box",
                                        minWidth: "180px"
                                    }}
                                >
                                    <MusicBar
                                        barIndex={globalIndex}
                                        barId={bar.id}
                                        subdivisions={bar.totalBeats}
                                        active={activeBarIndex === globalIndex}
                                        activeSubdivision={activeBarIndex === globalIndex ? activeSubdivision : null}
                                        startTime={bar.start}
                                        endTime={bar.end}
                                        isSelected={selectedBars.includes(globalIndex)}
                                        isLoopActive={isLoopActive}
                                        onClick={() => onBarClick(globalIndex)}
                                        onMouseDown={(e) => onBarMouseDown(globalIndex, e)}
                                        onMouseEnter={() => onBarMouseEnter(globalIndex)}
                                        onMouseUp={onBarMouseUp}
                                        section={section}
                                        inNewSection={inNewSection}
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
                                .map(section => (
                                    <Box
                                        key={`label-${section.id}-row-${rowIndex}`}
                                        sx={{
                                            backgroundColor: section.color,
                                            color: "white",
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            fontSize: "10px",
                                            fontWeight: "bold",
                                            textAlign: "center"
                                        }}
                                    >
                                        {section.displayName}
                                    </Box>
                                ))
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