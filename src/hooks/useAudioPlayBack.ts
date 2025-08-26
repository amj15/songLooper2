import { useCallback, useEffect, useRef, useState } from "react";

export const useAudioPlayback = (audioRef: React.RefObject<HTMLAudioElement>, currentTimeRef: React.MutableRefObject<number>) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef(0);
    const loopDataRef = useRef<{ isLoopActive: boolean; loopStart: number | null; loopEnd: number | null }>({
        isLoopActive: false,
        loopStart: null,
        loopEnd: null
    });

    const updateTime = useCallback(() => {
        if (audioRef.current && isPlaying) {
            const newTime = audioRef.current.currentTime;
            const { isLoopActive, loopStart, loopEnd } = loopDataRef.current;
            
            // Si el loop está activo y llegamos al final, volver al inicio
            if (isLoopActive && loopEnd !== null && newTime >= loopEnd) {
                const targetTime = loopStart || 0;
                audioRef.current.currentTime = targetTime;
                currentTimeRef.current = targetTime;
                setCurrentTime(targetTime);
            } else {
                // Optimización: actualizar solo si hay cambio significativo o cambio de subdivisión
                const timeDiff = Math.abs(newTime - lastUpdateTimeRef.current);
                const shouldUpdate = timeDiff > 0.001 && (
                    timeDiff > 0.01 || // Cambio mayor a 10ms
                    Math.floor(newTime * 4) !== Math.floor(lastUpdateTimeRef.current * 4) // Cambio de 16th note
                );
                
                if (shouldUpdate) {
                    currentTimeRef.current = newTime;
                    lastUpdateTimeRef.current = newTime;
                    setCurrentTime(newTime);
                }
            }
            
            rafRef.current = requestAnimationFrame(updateTime);
        }
    }, [audioRef, currentTimeRef, isPlaying]);

    // Función para actualizar los datos del loop
    const updateLoopData = useCallback((isLoopActive: boolean, loopStart: number | null, loopEnd: number | null) => {
        loopDataRef.current = { isLoopActive, loopStart, loopEnd };
    }, []);

    const play = useCallback(async (isLoopActive: boolean, loopStart: number | null, loopEnd: number | null) => {
        if (!audioRef.current) return;
        
        // Actualizar los datos del loop
        updateLoopData(isLoopActive, loopStart, loopEnd);
        
        // Si el loop está activo y estamos fuera del rango, ir al inicio del loop
        if (isLoopActive && loopStart !== null && loopEnd !== null) {
            const currentTime = audioRef.current.currentTime;
            if (currentTime < loopStart || currentTime >= loopEnd) {
                audioRef.current.currentTime = loopStart;
                currentTimeRef.current = loopStart;
            }
        }
        
        await audioRef.current.play();
        
        // Sincronizar inmediatamente currentTimeRef con el tiempo real del audio
        currentTimeRef.current = audioRef.current.currentTime;
        setCurrentTime(audioRef.current.currentTime);
        lastUpdateTimeRef.current = audioRef.current.currentTime;
        
        setIsPlaying(true);
    }, [audioRef, currentTimeRef, updateLoopData]);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            // Mantener sincronización al pausar
            currentTimeRef.current = audioRef.current.currentTime;
            setCurrentTime(audioRef.current.currentTime);
            setIsPlaying(false);
        }
    }, [audioRef]);

    const stop = useCallback((isLoopActive: boolean, loopStart: number | null) => {
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            
            // Si hay loop activo, ir al inicio del loop, sino ir al principio
            const targetTime = isLoopActive && loopStart !== null ? loopStart : 0;
            audioRef.current.currentTime = targetTime;
            currentTimeRef.current = targetTime;
        }
    }, [audioRef, currentTimeRef]);

    // Sincronización inicial cuando se carga el audio
    useEffect(() => {
        if (audioRef.current) {
            const handleLoadedMetadata = () => {
                if (audioRef.current) {
                    currentTimeRef.current = audioRef.current.currentTime;
                    setCurrentTime(audioRef.current.currentTime);
                    lastUpdateTimeRef.current = audioRef.current.currentTime;
                }
            };
            
            audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
            
            return () => {
                if (audioRef.current) {
                    audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
                }
            };
        }
    }, [audioRef]);

    // Iniciar/detener el requestAnimationFrame basado en isPlaying
    useEffect(() => {
        if (isPlaying) {
            rafRef.current = requestAnimationFrame(updateTime);
        } else if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, updateTime]);

    return {
        isPlaying,
        currentTime, // Exponemos currentTime para que otros componentes no necesiten RAF
        play,
        pause,
        stop,
        updateLoopData // Exponemos esta función para actualizar loop data
    };
};