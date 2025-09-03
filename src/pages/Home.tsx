import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
import ConfirmDialog from "../components/ConfirmDialog";
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
  Chip,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  MusicNote as MusicNoteIcon,
  Folder as FolderIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
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
    
    // Estados para el menú de opciones
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    
    // Estados para el diálogo de confirmación
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
  
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

    // Funciones para manejar el menú
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
      event.preventDefault();
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedProject(project);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
      setSelectedProject(null);
    };

    // Funciones para manejar la eliminación
    const handleDeleteClick = () => {
      if (selectedProject) {
        setDeletingProject(selectedProject);
        setShowDeleteDialog(true);
        handleMenuClose();
      }
    };

    const handleDeleteCancel = () => {
      setShowDeleteDialog(false);
      setDeletingProject(null);
    };

    const handleDeleteConfirm = async () => {
      if (!deletingProject) return;
      
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', deletingProject.id);

        if (error) throw error;

        // Actualizar la lista de proyectos
        const updatedProjects = projects.filter(p => p.id !== deletingProject.id);
        setProjects(updatedProjects);
        
        // Reagrupar proyectos por categoría
        const grouped = updatedProjects.reduce((acc: ProjectsByCategory, project: Project) => {
          const category = project.category || 'General';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(project);
          return acc;
        }, {});
        
        setProjectsByCategory(grouped);
        
        setShowDeleteDialog(false);
        setDeletingProject(null);
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setIsDeleting(false);
      }
    };
  
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
                          sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { backgroundColor: 'action.hover' },
                            borderRadius: 1,
                            m: 0.5,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Box
                            component={Link}
                            to={`/daw/${project.id}`}
                            sx={{
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              flex: 1
                            }}
                          >
                            <ListItemIcon>
                              <MusicNoteIcon color="secondary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={project.name || "Sin nombre"}
                              secondary={`${project.time_signature} • ${project.tempo} BPM • ${new Date(project.created_at).toLocaleDateString()}`}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, project)}
                            sx={{ ml: 1 }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Paper>

        {/* Menú de opciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon sx={{ mr: 1 }} color="error" />
            <Typography color="error">Eliminar proyecto</Typography>
          </MenuItem>
        </Menu>

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          open={showDeleteDialog}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Eliminar Proyecto"
          message={`¿Estás seguro de que quieres eliminar el proyecto "${deletingProject?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          severity="error"
          isLoading={isDeleting}
        />
      </Container>
    );
}