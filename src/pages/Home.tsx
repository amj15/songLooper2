import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

interface Project {
    id: string;
    name: string;
    time_signature: string;
    tempo: number;
}

export default function Home() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchProjects = async () => {
        setLoading(true);
  
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
  
        if (userError || !user) {
          console.error("No se pudo obtener el usuario", userError);
          setProjects([]);
          setLoading(false);
          return;
        }
  
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
  
        if (error) {
          console.error("Error al cargar proyectos:", error);
          setProjects([]);
        } else {
          setProjects(data);
        }
  
        setLoading(false);
      };
  
      fetchProjects();
    }, []);
  
    return (
      <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Tus proyectos</h2>
  
        {loading ? (
          <p>Cargando proyectos...</p>
        ) : projects.length === 0 ? (
          <p>No hay proyectos guardados todavía.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="border p-3 rounded hover:bg-gray-50 transition">
                <Link to={`/daw/${project.id}`} className="text-blue-600 hover:underline">
                  {project.name || "Sin nombre"} ({project.time_signature}, {project.tempo} BPM)
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
}