import { useState, useCallback, useRef, useEffect } from 'react';

interface UseBarNotationEditorProps {
    barIndex: number | null;
    barsData: Array<{
        id: number;
        start: number;
        end: number;
        beatDuration: number;
        totalBeats: number;
    }>;
    onClose: () => void;
    audioRef?: React.RefObject<HTMLAudioElement | null>; // Referencia al audio original
}

export const useBarNotationEditor = ({ 
    barIndex, 
    barsData, 
    onClose,
    audioRef 
}: UseBarNotationEditorProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    
    // Referencias para controlar la reproducción
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);

    // Función para reproducir el compás en bucle
    const playBar = useCallback(async () => {
        if (barIndex === null || !barsData[barIndex] || !audioRef?.current || isPlaying) return;

        try {
            const bar = barsData[barIndex];
            const audio = audioRef.current;
            
            // Configurar el tiempo inicial
            audio.currentTime = bar.start;
            
            // Marcar como reproduciendo antes de empezar
            setIsPlaying(true);
            
            // Crear función para hacer loop del compás
            const loopBar = () => {
                if (!audio || audio.paused) return;
                
                const currentTime = audio.currentTime;
                if (currentTime >= bar.end) {
                    // Volver al inicio del compás
                    audio.currentTime = bar.start;
                }
            };

            // Reproducir el audio
            await audio.play();

            // Configurar el loop
            intervalRef.current = setInterval(loopBar, 50); // Revisar cada 50ms para más precisión

            // Actualizar el tiempo actual con requestAnimationFrame para máxima fluidez
            const updateTime = () => {
                if (audio && !audio.paused) {
                    setCurrentTime(audio.currentTime);
                    animationRef.current = requestAnimationFrame(updateTime);
                } else if (audio && audio.paused) {
                    setIsPlaying(false);
                }
            };
            
            // Iniciar la animación inmediatamente
            animationRef.current = requestAnimationFrame(updateTime);

        } catch (error) {
            console.error('Error al reproducir compás:', error);
            setIsPlaying(false);
        }
    }, [barIndex, barsData, audioRef, isPlaying]);

    // Función para parar la reproducción
    const stopBar = useCallback(() => {
        if (audioRef?.current) {
            audioRef.current.pause();
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        setIsPlaying(false);
        setCurrentTime(0);
    }, [audioRef]);

    // Función para cerrar el editor
    const closeEditor = useCallback(() => {
        stopBar();
        onClose();
    }, [stopBar, onClose]);

    // Función para clonar un compás
    const cloneBar = useCallback((sourceBarIndex: number) => {
        console.log(`Clonando compás ${sourceBarIndex + 1}`);
        // Por ahora solo log, implementaremos la lógica de clonado más adelante
    }, []);

    // Función para borrar un compás
    const deleteBar = useCallback((targetBarIndex: number) => {
        console.log(`Borrando compás ${targetBarIndex + 1}`);
        // Por ahora solo log, implementaremos la lógica de borrado más adelante
    }, []);

    // Limpiar al desmontar o cambiar barIndex
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [barIndex]);

    // Parar la reproducción cuando se cierre el editor
    useEffect(() => {
        if (barIndex === null) {
            stopBar();
        }
    }, [barIndex, stopBar]);

    return {
        isPlaying,
        currentTime,
        playBar,
        stopBar,
        closeEditor,
        cloneBar,
        deleteBar
    };
};