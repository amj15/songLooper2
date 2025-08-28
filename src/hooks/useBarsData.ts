import { useMemo } from "react";

export const useBarsData = (project: any, audioRef: React.RefObject<HTMLAudioElement | null>) => {
    return useMemo(() => {
        if (!project?.bars || !project.tempo || !project.time_signature) return [];
        
        const bpm = project.tempo;
        const beatsPerBar = Number(project.time_signature.split("/")[0]);
        const beatDuration = 60 / bpm;
        
        // Debug: Log solo una vez
        const debugKey = `${bpm}-${beatsPerBar}-${project.bars[0]}`;
        if (!(window as any).debuggedProjects?.has?.(debugKey)) {
            (window as any).debuggedProjects = (window as any).debuggedProjects || new Set();
            (window as any).debuggedProjects.add(debugKey);
            console.log('Project data:', {
                bpm,
                beatsPerBar,
                beatDuration,
                firstBarMs: project.bars[0],
                secondBarMs: project.bars[1]
            });
        }
        
        // Calcular el offset basado en la primera barra para alinear el downbeat
        const firstBarMs = project.bars[0];
        const firstBarSeconds = firstBarMs / 1000;
        
        // El offset debe ser la diferencia para que la primera barra empiece con el downbeat real
        // Calculamos cuántos beats completos hay antes del primer downbeat marcado
        const offsetBeats = Math.round(firstBarSeconds / beatDuration);
        const correctedOffset = offsetBeats * beatDuration;
        
        if (!(window as any).debuggedProjects?.has?.(debugKey)) {
            console.log(`Timing correction: firstBar=${firstBarSeconds.toFixed(3)}s, offset=${correctedOffset.toFixed(3)}s`);
        }
        
        return project.bars.map((barStartMs: number, index: number) => {
            const originalBarStart = barStartMs / 1000;
            const barStart = originalBarStart - correctedOffset; // Aplicar corrección
            const nextBarMs = project.bars[index + 1];
            const barEnd = nextBarMs ? (nextBarMs / 1000) - correctedOffset : (barStart + (beatDuration * beatsPerBar));
            
            const barData = {
                id: index,
                start: Math.max(0, barStart), // No permitir tiempos negativos
                end: barEnd,
                beatDuration,
                totalBeats: beatsPerBar
            };
            
            // Debug: Log solo las primeras barras y solo una vez
            if (index < 3 && !(window as any).debuggedProjects?.has?.(debugKey)) {
                console.log(`Bar ${index} corrected:`, barData, `(original: ${originalBarStart.toFixed(3)}s)`);
            }
            
            return barData;
        });
    }, [project?.bars, project?.tempo, project?.time_signature]);
};