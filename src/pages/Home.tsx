import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  MusicNote as MusicNoteIcon,
  Folder as FolderIcon
} from "@mui/icons-material";

interface Project {
    id: string;
    name: string;
    category: string;
    time_signature: string;
    tempo: number;
    created_at: string;
}

interface ProjectsByCategory {
  [category: string]: Project[];
}

export default function Home() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectsByCategory, setProjectsByCategory] = useState<ProjectsByCategory>({});
  
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
          setProjects(data || []);
          
          // Agrupar proyectos por categoría
          const grouped = (data || []).reduce((acc: ProjectsByCategory, project: Project) => {
            const category = project.category || 'General';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(project);
            return acc;
          }, {});
          
          setProjectsByCategory(grouped);
        }
  
        setLoading(false);
      };
  
      fetchProjects();
    }, []);
  
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MusicNoteIcon color="primary" />
            Tus Proyectos
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : projects.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Typography variant="h6" color="text.secondary">
                No hay proyectos guardados todavía
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Crea tu primer proyecto para comenzar
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" color="text.secondary" mb={2}>
                {projects.length} proyecto{projects.length !== 1 ? 's' : ''} organizados por categoría
              </Typography>
              
              {Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
                <Accordion key={category} defaultExpanded sx={{ mb: 1 }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: 'action.hover',
                      '&:hover': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <FolderIcon color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        {category}
                      </Typography>
                      <Chip 
                        label={categoryProjects.length} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List dense>
                      {categoryProjects.map((project) => (
                        <ListItem
                          key={project.id}
                          component={Link}
                          to={`/daw/${project.id}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' },
                            borderRadius: 1,
                            m: 0.5
                          }}
                        >
                          <ListItemIcon>
                            <MusicNoteIcon color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={project.name || "Sin nombre"}
                            secondary={`${project.time_signature} • ${project.tempo} BPM • ${new Date(project.created_at).toLocaleDateString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Paper>
      </Container>
    );
}