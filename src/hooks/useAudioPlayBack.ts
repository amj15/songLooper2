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
                    
                }
            }
            
            // Optimización ultra-precisa: actualizar en cambios de subdivisión o tiempos críticos
            const timeDiff = Math.abs(newTime - lastUpdateTimeRef.current);
            const currentSubdivision = Math.floor(newTime * 16); // 16th note precision
            const lastSubdivision = Math.floor(lastUpdateTimeRef.current * 16);
            
            const shouldUpdate = timeDiff > 0.001 && (
                currentSubdivision !== lastSubdivision || // Cambio de 16th note
                timeDiff > 0.008 // Cambio mayor a 8ms para suavidad visual
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
            
            // STOP siempre va a 0, no al loop start
            const targetTime = 0;
            audioRef.current.currentTime = targetTime;
            currentTimeRef.current = targetTime;
            setCurrentTime(targetTime); // Actualizar inmediatamente el estado
            lastUpdateTimeRef.current = targetTime;
            
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
                }
            };
            
            const handleCanPlayThrough = () => {
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

    // Función para saltar a un tiempo específico (seeking)
    const seekTo = useCallback((targetTime: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = targetTime;
            currentTimeRef.current = targetTime;
            setCurrentTime(targetTime); // Actualizar inmediatamente el estado
            lastUpdateTimeRef.current = targetTime;
            
        }
    }, [audioRef, currentTimeRef]);

    return {
        isPlaying,
        currentTime, // Exponemos currentTime para que otros componentes no necesiten RAF
        play,
        pause,
        stop,
        seekTo, // Nueva función para seeking
        updateLoopData // Exponemos esta función para actualizar loop data
    };
};