import { useCallback, useState } from "react";

interface BarData {
    id: number;
    start: number;
    end: number;
    beatDuration: number;
    totalBeats: number;
}

export const useLoopControl = (barsData: BarData[]) => {
    const [isLoopActive, setIsLoopActive] = useState(false);
    const [loopStart, setLoopStart] = useState<number | null>(null);
    const [loopEnd, setLoopEnd] = useState<number | null>(null);
    const [selectedBars, setSelectedBars] = useState<number[]>([]);
    const [rangeStart, setRangeStart] = useState<number | null>(null); // Primer click del rango

    const handleBarClick = useCallback((barIndex: number) => {
        if (!barsData[barIndex]) return;
        
        setSelectedBars(prev => {
            if (rangeStart === null) {
                // Primer click: iniciar rango
                setRangeStart(barIndex);
                return [barIndex];
            } else {
                // Segundo click: completar rango y activar loop automáticamente
                const start = Math.min(rangeStart, barIndex);
                const end = Math.max(rangeStart, barIndex);
                const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                
                // Configurar datos del loop y activarlo automáticamente
                const loopStartTime = barsData[start].start;
                // Ajustar loopEnd para evitar solapamiento - restar un frame de audio (~1ms)
                const adjustedLoopEnd = barsData[end].end - 0.001;
                
                console.log(`Creating loop: bars ${start}-${end}, start=${loopStartTime.toFixed(3)}s, end=${adjustedLoopEnd.toFixed(3)}s (original end=${barsData[end].end.toFixed(3)}s)`);
                
                setLoopStart(loopStartTime);
                setLoopEnd(adjustedLoopEnd);
                setIsLoopActive(true); // Auto-activar el loop
                setRangeStart(null); // Reset para próxima selección
                
                return range;
            }
        });
    }, [barsData, rangeStart]);

    const toggleLoop = useCallback(() => {
        if (selectedBars.length >= 2) {
            setIsLoopActive(!isLoopActive);
        } else {
            console.log("Selecciona al menos 2 compases para activar el loop");
        }
    }, [isLoopActive, selectedBars.length]);

    const clearLoop = useCallback(() => {
        setSelectedBars([]);
        setLoopStart(null);
        setLoopEnd(null);
        setIsLoopActive(false);
        setRangeStart(null);
    }, []);

    return {
        isLoopActive,
        loopStart,
        loopEnd,
        selectedBars,
        rangeStart, // Expo este estado para mostrar el primer click
        handleBarClick,
        toggleLoop, // Cambié el nombre de handleLoop a toggleLoop
        clearLoop
    };
};