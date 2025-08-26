import { useMemo } from "react";

export const useBarsData = (project: any, audioRef: React.RefObject<HTMLAudioElement>) => {
    return useMemo(() => {
        if (!project?.bars || !project.tempo || !project.time_signature) return [];
        
        const bpm = project.tempo;
        const beatsPerBar = Number(project.time_signature.split("/")[0]);
        
        return project.bars.map((barStartMs: number, index: number) => {
            const barStart = barStartMs / 1000;
            const nextBarMs = project.bars[index + 1];
            const barEnd = nextBarMs ? nextBarMs / 1000 : Infinity;
            const beatDuration = 60 / bpm;
            
            return {
                id: index,
                start: barStart,
                end: barEnd,
                beatDuration,
                totalBeats: beatsPerBar
            };
        });
    }, [project?.bars, project?.tempo, project?.time_signature]);
};