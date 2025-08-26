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

    const handleBarClick = useCallback((barIndex: number) => {
        if (!barsData[barIndex]) return;
        
        setSelectedBars(prev => {
            if (prev.length === 0) {
                // Primer compás seleccionado
                return [barIndex];
            } else if (prev.length === 1) {
                // Segundo compás - crear rango
                const start = Math.min(prev[0], barIndex);
                const end = Math.max(prev[0], barIndex);
                const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                
                // Configurar loop
                setLoopStart(barsData[start].start);
                setLoopEnd(barsData[end].end);
                setIsLoopActive(true);
                
                return range;
            } else {
                // Ya hay selección - resetear
                setSelectedBars([barIndex]);
                setLoopStart(null);
                setLoopEnd(null);
                setIsLoopActive(false);
                return [barIndex];
            }
        });
    }, [barsData]);

    const handleLoop = useCallback(() => {
        if (selectedBars.length >= 2) {
            setIsLoopActive(!isLoopActive);
        } else {
            alert("Selecciona al menos 2 compases para crear un loop");
        }
    }, [isLoopActive, selectedBars.length]);

    const clearLoop = useCallback(() => {
        setSelectedBars([]);
        setLoopStart(null);
        setLoopEnd(null);
        setIsLoopActive(false);
    }, []);

    return {
        isLoopActive,
        loopStart,
        loopEnd,
        selectedBars,
        handleBarClick,
        handleLoop,
        clearLoop
    };
};