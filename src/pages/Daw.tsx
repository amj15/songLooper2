import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as Tone from "tone";
import AudioControls from "../components/AudioControls";
import MusicBar from "../components/MusicBar";
import { supabase } from "../services/supabase";

export default function Daw() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [click, setClick] = useState(false);
    const [bpm, setBpm] = useState(0);
    const [beatsPerBar, setBeatsPerBar] = useState(0);
    const [displayBars, setDisplayBars] = useState(8);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const metronomeSynth = useRef(
      new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
      }).toDestination()
    );
    const [currentTime, setCurrentTime] = React.useState(0);
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (audioRef.current) {
                setCurrentTime(Math.floor(audioRef.current.currentTime * 10) / 10);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [audioRef]);
  
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
          setBpm(projectLoaded.tempo);
          setBeatsPerBar(Number(projectLoaded.time_signature.split("/")[0]));
        } catch {
          alert("No se pudo cargar el proyecto.");
        }
      }
  
      if (id) {
        fetchProject();
      }
    }, [id]);

    const play = async () => {
      if (!audioRef.current) return;
      // await Tone.start();
      // startMetronome();
      audioRef.current.play();
      setIsPlaying(true);
      // rafRef.current = requestAnimationFrame(updateCursor);
    };

    const handlePlay = () => {
      if (audioRef.current) {

          if (isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
          } else {
              play();
          }
      }
    };

    const handleStop = () => {
      setIsPlaying(false);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
    };

    console.log(project);
    

    return (
      <>
        <audio ref={audioRef} src={audioUrl} preload="auto" />
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
                audioRef={audioRef}
                isPlaying={isPlaying}
                handlePlay={handlePlay}
                handleStop={handleStop}
                click={click}
                setClick={setClick}
              />
            )}
          </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, overflowY: "auto", padding: "16px" }}>

            {/* Add the main content here */}
            {project?.bars && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {project.bars.map((bar: number, index: number) => {
                  const barStart = bar / 1000; // convertir a segundos
                  const barEnd = (project.bars[index + 1] ?? Infinity) / 1000;
                  const isActive = currentTime >= barStart && currentTime < barEnd;

                  // calcular subdivisión activa
                  let activeSubdivision: number | null = null;
                  if (isActive && bpm && beatsPerBar) {
                    const beatDuration = 60 / bpm; // duración de un beat en segundos
                    const barDuration = beatsPerBar * beatDuration;
                    const elapsedInBar = currentTime - barStart;
                    activeSubdivision = Math.floor(elapsedInBar / beatDuration) % beatsPerBar;
                  }

                  return (
                    <Box
                      key={index}
                      sx={{
                        flex: `0 0 calc(${100 / displayBars}% - 16px)`,
                        boxSizing: "border-box",
                      }}
                    >
                      <MusicBar
                        subdivisions={beatsPerBar}
                        active={isActive}
                        activeSubdivision={activeSubdivision}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
        </Box>
      </Box>
    </>
  );
}