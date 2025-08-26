import { useCallback, useEffect, useRef, useState } from "react";

export const useAudioPlayback = (audioRef: React.RefObject<HTMLAudioElement>, currentTimeRef: React.MutableRefObject<number>) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [, forceUpdate] = useState({});
    const rafRef = useRef<number | null>(null);
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
                audioRef.current.currentTime = loopStart || 0;
                currentTimeRef.current = loopStart || 0;
            } else {
                if (Math.abs(newTime - currentTimeRef.current) > 0.01) {
                    currentTimeRef.current = newTime;
                    forceUpdate({}); // Esto mantiene las animaciones
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
        setIsPlaying(true);
    }, [audioRef, currentTimeRef, updateLoopData]);

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
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
        play,
        pause,
        stop,
        updateLoopData // Exponemos esta función para actualizar loop data
    };
};