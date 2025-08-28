import { useCallback, useEffect, useRef, useState } from "react";

export const useAudioPlayback = (audioRef: React.RefObject<HTMLAudioElement | null>, currentTimeRef: React.MutableRefObject<number>) => {
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
            
            // Loop preciso sin solapamiento
            if (isLoopActive && loopEnd !== null && loopStart !== null) {
                // Usar umbral más pequeño para mayor precisión
                const threshold = 0.010; // 10ms de umbral
                
                if (newTime >= (loopEnd - threshold)) {
                    // Salto inmediato y preciso al inicio del loop
                    audioRef.current.currentTime = loopStart;
                    currentTimeRef.current = loopStart;
                    setCurrentTime(loopStart);
                    
                    console.log(`Loop jump: ${newTime.toFixed(3)}s -> ${loopStart.toFixed(3)}s (end was ${loopEnd.toFixed(3)}s)`);
                }
            }
            
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
        
        // Buffer predictivo: pre-sincronizar antes del play
        const prePlayTime = audioRef.current.currentTime;
        
        // Iniciar animación antes del play para mejor sincronización
        setIsPlaying(true);
        
        // Promise para esperar el evento 'playing' (audio realmente empezando)
        const playingPromise = new Promise<void>((resolve) => {
            const handlePlaying = () => {
                audioRef.current?.removeEventListener('playing', handlePlaying);
                resolve();
            };
            audioRef.current?.addEventListener('playing', handlePlaying);
        });
        
        // Iniciar reproducción
        const playPromise = audioRef.current.play();
        
        // Esperar ambos eventos
        await Promise.all([playPromise, playingPromise]);
        
        // Sincronización post-play con compensación de latencia
        requestAnimationFrame(() => {
            if (audioRef.current) {
                const actualTime = audioRef.current.currentTime;
                currentTimeRef.current = actualTime;
                setCurrentTime(actualTime);
                lastUpdateTimeRef.current = actualTime;
                
                console.log(`Play sync: pre=${prePlayTime.toFixed(3)}s, actual=${actualTime.toFixed(3)}s, diff=${(actualTime - prePlayTime).toFixed(3)}s`);
            }
        });
        
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

    // Sincronización inicial y optimizaciones de audio
    useEffect(() => {
        if (audioRef.current) {
            const audio = audioRef.current;
            
            // Configurar audio para máxima precisión
            audio.preload = 'auto';
            
            // Optimizaciones para reducir latencia
            if ('preservesPitch' in audio) {
                (audio as any).preservesPitch = false;
            }
            if ('mozPreservesPitch' in audio) {
                (audio as any).mozPreservesPitch = false;
            }
            
            const handleLoadedMetadata = () => {
                if (audioRef.current) {
                    currentTimeRef.current = audioRef.current.currentTime;
                    setCurrentTime(audioRef.current.currentTime);
                    lastUpdateTimeRef.current = audioRef.current.currentTime;
                    console.log('Audio metadata loaded and synchronized');
                }
            };
            
            const handleCanPlayThrough = () => {
                console.log('Audio buffer ready for smooth playback');
            };
            
            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('canplaythrough', handleCanPlayThrough);
            
            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('canplaythrough', handleCanPlayThrough);
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