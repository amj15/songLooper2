import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AudioControls from "../components/AudioControls";
import BarsGrid from "../components/BarsGrid";
import SectionEditorDrawer from "../components/SectionEditorDrawer";
import BarNotationDrawer from "../components/BarNotationDrawer";
import { useAudioPlayback } from "../hooks/useAudioPlayBack";
import { useBarsData } from "../hooks/useBarsData";
import { useLoopControl } from "../hooks/useLoopControls";
import { useSectionEditor } from "../hooks/useSectionEditor";
import { useBarNotationEditor } from "../hooks/useBarNotationEditor";
import { supabase } from "../services/supabase";

export default function Daw() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [click, setClick] = useState(false);
    const [displayBars] = useState(4);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    
    // Estado para el editor de notación de compases
    const [selectedBarForEditing, setSelectedBarForEditing] = useState<number | null>(null);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const currentTimeRef = useRef(0);
    
    const barsData = useBarsData(project, audioRef);
    
    // Custom hooks para separar la lógica
    const { isPlaying, currentTime, play, pause, stop, seekTo, updateLoopData } = useAudioPlayback(audioRef, currentTimeRef);
    const { 
        isLoopActive, 
        selectedBars, 
        loopStart, 
        loopEnd,
        rangeStart,
        handleBarClick, 
        toggleLoop
    } = useLoopControl(barsData);
    
    // Nuevo hook para manejo de secciones
    const {
        sections,
        editorState,
        toggleEditMode,
        handleBarSelection,
        updateFormData,
        saveSection,
        getSectionForBar,
        loadSections
    } = useSectionEditor(id);

    // Hook para el editor de notación de compases
    const {
        isPlaying: isBarPlaying,
        currentTime: barCurrentTime,
        playBar,
        stopBar,
        closeEditor: closeBarEditor,
        cloneBar,
        deleteBar
    } = useBarNotationEditor({
        barIndex: selectedBarForEditing,
        barsData,
        onClose: () => setSelectedBarForEditing(null),
        audioRef
    });

    // Actualizar los datos del loop cuando cambien
    useEffect(() => {
        if (updateLoopData) {
            updateLoopData(isLoopActive, loopStart, loopEnd);
        }
    }, [isLoopActive, loopStart, loopEnd, updateLoopData]);

    // Manejar clicks en compases dependiendo del modo
    const handleBarClickUnified = (barIndex: number) => {
        if (editorState.isEditing) {
            // Modo edición: seleccionar para secciones
            handleBarSelection(barIndex);
        } else {
            // Modo normal: seleccionar para loops
            handleBarClick(barIndex);
        }
    };

    // Función para saltar la reproducción a un compás específico
    const handleSeekToBar = (barIndex: number) => {
        if (barsData[barIndex]) {
            const targetTime = barsData[barIndex].start;
            seekTo(targetTime); // Usar la nueva función seekTo
            console.log(`Saltando al compás ${barIndex + 1} en tiempo ${targetTime.toFixed(3)}s`);
        }
    };

    // Función para cambiar la velocidad de reproducción
    const handlePlaybackRateChange = (rate: number) => {
        setPlaybackRate(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    // Funciones para las acciones del SpeedDial
    const handleEditBar = (barIndex: number) => {
        setSelectedBarForEditing(barIndex);
    };

    const handleCloneBar = (barIndex: number) => {
        cloneBar(barIndex);
    };

    const handleDeleteBar = (barIndex: number) => {
        deleteBar(barIndex);
    };

    // Aplicar playback rate cuando cambie el audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [audioUrl, playbackRate]);


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

    // Cargar secciones cuando el proyecto esté disponible
    useEffect(() => {
        if (project && id) {
            loadSections();
        }
    }, [project, id, loadSections]);

    return (
        <>
            <audio ref={audioRef} src={audioUrl ?? undefined} preload="auto" />
            <Box sx={{ 
                display: "flex", 
                flexDirection: "column", 
                height: "100vh",
                transition: "margin-right 0.3s ease",
                marginRight: editorState.isEditing ? "350px" : "0px"
            }}>
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
                            handlePlay={() => isPlaying ? pause() : play(isLoopActive, loopStart, loopEnd)}
                            handleStop={() => stop(isLoopActive, loopStart)}
                            handleLoop={toggleLoop}
                            onToggleEditSections={toggleEditMode}
                            isEditingSections={editorState.isEditing}
                            click={click}
                            setClick={setClick}
                            playbackRate={playbackRate}
                            onPlaybackRateChange={handlePlaybackRateChange}
                            audioRef={audioRef}
                            sections={sections}
                            barsData={barsData}
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
                            {editorState.isEditing && (
                                <Box sx={{ 
                                    padding: "4px 12px", 
                                    backgroundColor: "#9c27b0", 
                                    color: "white", 
                                    borderRadius: "16px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    Editando secciones
                                </Box>
                            )}
                            {!editorState.isEditing && selectedBars.length > 0 && (
                                <Box sx={{ fontSize: "12px", color: "#666" }}>
                                    Loop: {selectedBars.length} compases
                                </Box>
                            )}
                            {editorState.isEditing && editorState.selectedBars.length > 0 && (
                                <Box sx={{ fontSize: "12px", color: "#9c27b0" }}>
                                    Selección: {editorState.selectedBars.length} compases
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
                        backgroundColor: editorState.isEditing ? "#fff3e0" : "#e3f2fd", 
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: editorState.isEditing ? "#ef6c00" : "#1565c0"
                    }}>
                        {editorState.isEditing ? (
                            <>
                                <strong>Modo Edición de Secciones:</strong> Click en compases para seleccionar rango | 
                                {editorState.selectedBars.length === 1 && " Selecciona segundo compás para completar rango |"}
                                {editorState.selectedBars.length > 1 && ` Rango: ${editorState.selectedBars.length} compases |`}
                                {" "}Se puede reproducir pero sin loops visuales
                            </>
                        ) : (
                            <>
                                <strong>Modo Normal:</strong> Click en barra LOOP = Seleccionar rango (2 clicks) | Botón Loop = Activar/Desactivar
                                {rangeStart !== null && " | Selecciona el segundo compás para completar el rango"}
                            </>
                        )}
                    </Box>
                    
                    {barsData.length > 0 && (
                        <BarsGrid
                            barsData={barsData}
                            currentTime={currentTime}
                            displayBars={displayBars}
                            selectedBars={editorState.isEditing ? editorState.selectedBars : selectedBars}
                            rangeStart={editorState.isEditing ? null : rangeStart}
                            onBarClick={handleBarClickUnified}
                            onBarMouseDown={() => {}} // Desactivar en modo edición
                            onBarMouseEnter={() => {}} // Desactivar en modo edición
                            onBarMouseUp={() => {}} // Desactivar en modo edición
                            isLoopActive={editorState.isEditing ? false : isLoopActive}
                            sections={sections}
                            getSectionForBar={getSectionForBar}
                            isDragging={false} // No dragging en modo edición
                            dragStart={null}
                            dragEnd={null}
                            isEditingMode={editorState.isEditing}
                            onSeekToBar={handleSeekToBar}
                            enableAutoScroll={true}
                            onEditBar={handleEditBar}
                            onCloneBar={handleCloneBar}
                            onDeleteBar={handleDeleteBar}
                        />
                    )}
                </Box>

                <SectionEditorDrawer
                    open={editorState.isEditing}
                    onClose={toggleEditMode}
                    onSave={saveSection}
                    formData={editorState.formData}
                    onUpdateFormData={updateFormData}
                    selectedBars={editorState.selectedBars}
                    isEditingExisting={editorState.currentSection !== null}
                />

                <BarNotationDrawer
                    open={selectedBarForEditing !== null}
                    onClose={closeBarEditor}
                    barIndex={selectedBarForEditing}
                    section={selectedBarForEditing !== null ? getSectionForBar(selectedBarForEditing) : undefined}
                    barNumber={selectedBarForEditing !== null && getSectionForBar(selectedBarForEditing) 
                        ? selectedBarForEditing - getSectionForBar(selectedBarForEditing)!.startBar + 1 
                        : selectedBarForEditing !== null ? selectedBarForEditing + 1 : 1
                    }
                    globalBarNumber={selectedBarForEditing !== null ? selectedBarForEditing + 1 : 1}
                    isPlaying={isBarPlaying}
                    onPlayBar={playBar}
                    onStopBar={stopBar}
                    currentTime={barCurrentTime}
                    barsData={barsData}
                    projectId={id}
                    timeSignature={project?.time_signature || "4/4"}
                    subdivisionResolution={16}
                />
            </Box>
        </>
    );
}