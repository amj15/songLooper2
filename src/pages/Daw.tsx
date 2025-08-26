import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as Tone from "tone";
import AudioControls from "../components/AudioControls";
import BarsGrid from "../components/BarsGrid";
import SectionDialog from "../components/SectionDialog";
import { useAudioPlayback } from "../hooks/useAudioPlayBack";
import { useBarsData } from "../hooks/useBarsData";
import { useLoopControl } from "../hooks/useLoopControls";
import { useSectionManager } from "../hooks/useSectionManager";
import { supabase } from "../services/supabase";

export default function Daw() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [click, setClick] = useState(false);
    const [displayBars, setDisplayBars] = useState(4);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTimeRef = useRef(0);
    
    const barsData = useBarsData(project, audioRef);
    
    // Custom hooks para separar la lógica
    const { isPlaying, currentTime, play, stop, updateLoopData } = useAudioPlayback(audioRef, currentTimeRef);
    const { 
        isLoopActive, 
        selectedBars, 
        loopStart, 
        loopEnd,
        handleBarClick, 
        handleLoop, 
        clearLoop 
    } = useLoopControl(barsData);
    
    const {
        sections,
        showSectionDialog,
        isCreatingSection,
        isDragging,
        dragStart,
        dragEnd,
        handleBarMouseDown,
        handleBarMouseEnter,
        handleBarMouseUp,
        createSection,
        cancelSectionCreation,
        getSectionForBar,
        sectionFormData
    } = useSectionManager();

    // Actualizar los datos del loop cuando cambien
    useEffect(() => {
        if (updateLoopData) {
            updateLoopData(isLoopActive, loopStart, loopEnd);
        }
    }, [isLoopActive, loopStart, loopEnd, updateLoopData]);
    
    // Grid para el step sequencer
    const [grid, setGrid] = useState(
        Array(4).fill(null).map(() => Array(16).fill(false))
    );

    const metronomeSynth = useRef(
        new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
        }).toDestination()
    );

    useEffect(() => {
        async function fetchProject() {
            try {
                const { data: projectLoaded, error } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                const { data: signedUrlData, error: signedUrlError } = await supabase
                    .storage
                    .from("user.songs")
                    .createSignedUrl(projectLoaded.audio_url, 60 * 60 * 24);

                if (signedUrlError) throw signedUrlError;

                setProject({
                    ...projectLoaded,
                    audioUrl: signedUrlData.signedUrl,
                });
                setAudioUrl(signedUrlData.signedUrl);
            } catch {
                alert("No se pudo cargar el proyecto.");
            }
        }

        if (id) {
            fetchProject();
        }
    }, [id]);

    return (
        <>
            <audio ref={audioRef} src={audioUrl ?? undefined} preload="auto" />
            <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
                {/* Top Bar */}
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1000,
                        backgroundColor: "white",
                        borderBottom: "1px solid #ccc",
                        padding: "8px 16px",
                    }}
                >
                    {project && (
                        <AudioControls
                            project={project}
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            handlePlay={() => play(isLoopActive, loopStart, loopEnd)}
                            handleStop={() => stop(isLoopActive, loopStart)}
                            handleLoop={handleLoop}
                            click={click}
                            setClick={setClick}
                        />
                    )}
                </Box>

                {/* Bars Grid */}
                <Box sx={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#f5f5f5" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 className="text-lg">Compases y Subdivisiones</h2>
                        <Box sx={{ display: "flex", gap: "16px", alignItems: "center" }}>
                            {isLoopActive && (
                                <Box sx={{ 
                                    padding: "4px 12px", 
                                    backgroundColor: "#4caf50", 
                                    color: "white", 
                                    borderRadius: "16px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    Loop activo ({selectedBars.length} compases)
                                </Box>
                            )}
                            {isCreatingSection && (
                                <Box sx={{ 
                                    padding: "4px 12px", 
                                    backgroundColor: "#9c27b0", 
                                    color: "white", 
                                    borderRadius: "16px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    Creando sección
                                </Box>
                            )}
                            {selectedBars.length > 0 && (
                                <Box sx={{ fontSize: "12px", color: "#666" }}>
                                    Seleccionados: {selectedBars.length} compases
                                </Box>
                            )}
                            {sections.length > 0 && (
                                <Box sx={{ fontSize: "12px", color: "#666" }}>
                                    Secciones: {sections.length}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ 
                        marginBottom: "16px", 
                        padding: "8px 12px", 
                        backgroundColor: "#e3f2fd", 
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#1565c0"
                    }}>
                        <strong>Controles:</strong> Click izquierdo = Loop | Click derecho + arrastar = Crear sección | 
                        {isCreatingSection ? " Suelta para finalizar la sección" : ""}
                    </Box>
                    
                    {barsData.length > 0 && (
                        <BarsGrid
                            barsData={barsData}
                            currentTime={currentTime}
                            displayBars={displayBars}
                            selectedBars={selectedBars}
                            onBarClick={handleBarClick}
                            onBarMouseDown={handleBarMouseDown}
                            onBarMouseEnter={handleBarMouseEnter}
                            onBarMouseUp={handleBarMouseUp}
                            isLoopActive={isLoopActive}
                            sections={sections}
                            getSectionForBar={getSectionForBar}
                            isDragging={isDragging}
                            dragStart={dragStart}
                            dragEnd={dragEnd}
                        />
                    )}
                </Box>

                <SectionDialog
                    open={showSectionDialog}
                    onClose={cancelSectionCreation}
                    onCreate={createSection}
                    formData={sectionFormData}
                />
            </Box>
        </>
    );
}