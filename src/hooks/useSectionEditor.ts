import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
    Section, 
    SectionFormData, 
    SectionEditorState, 
    SectionType
} from '../types/sections';
import { 
    SECTION_COLORS, 
    SECTION_LABELS 
} from '../types/sections';
import { supabase } from '../services/supabase';

const initialFormData: SectionFormData = {
    startBar: null,
    endBar: null,
    type: 'verse',
    letter: 'A',
    label: SECTION_LABELS.verse
};

export const useSectionEditor = (projectId?: string) => {
    const [sections, setSections] = useState<Section[]>([]);
    const [editorState, setEditorState] = useState<SectionEditorState>({
        isEditing: false,
        selectedBars: [],
        currentSection: null,
        isDrawerOpen: false,
        formData: { ...initialFormData }
    });

    // Entrar/salir del modo edición
    const toggleEditMode = useCallback(() => {
        setEditorState(prev => {
            if (prev.isEditing) {
                // Salir del modo edición - limpiar todo
                return {
                    isEditing: false,
                    selectedBars: [],
                    currentSection: null,
                    isDrawerOpen: false,
                    formData: { ...initialFormData }
                };
            } else {
                // Entrar en modo edición
                return {
                    isEditing: true,
                    selectedBars: [],
                    currentSection: null,
                    isDrawerOpen: true,
                    formData: { ...initialFormData }
                };
            }
        });
    }, []);

    // Seleccionar compases (rango como DatePicker)
    const handleBarSelection = useCallback((barIndex: number) => {
        if (!editorState.isEditing) return;

        setEditorState(prev => {
            const { selectedBars } = prev;
            
            if (selectedBars.length === 0) {
                // Primer click: seleccionar inicio
                return {
                    ...prev,
                    selectedBars: [barIndex],
                    formData: {
                        ...prev.formData,
                        startBar: barIndex,
                        endBar: barIndex
                    }
                };
            } else if (selectedBars.length === 1) {
                // Segundo click: completar rango
                const start = Math.min(selectedBars[0], barIndex);
                const end = Math.max(selectedBars[0], barIndex);
                const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                
                return {
                    ...prev,
                    selectedBars: range,
                    formData: {
                        ...prev.formData,
                        startBar: start,
                        endBar: end
                    }
                };
            } else {
                // Ya hay rango: empezar nuevo rango
                return {
                    ...prev,
                    selectedBars: [barIndex],
                    formData: {
                        ...prev.formData,
                        startBar: barIndex,
                        endBar: barIndex
                    }
                };
            }
        });
    }, [editorState.isEditing]);

    // Actualizar datos del formulario
    const updateFormData = useCallback((updates: Partial<SectionFormData>) => {
        setEditorState(prev => ({
            ...prev,
            formData: { 
                ...prev.formData, 
                ...updates,
                // Si cambia el tipo, actualizar el label por defecto
                ...(updates.type && { label: SECTION_LABELS[updates.type] })
            }
        }));
    }, []);

    // Cargar sección existente para editar
    const editExistingSection = useCallback((section: Section) => {
        if (!editorState.isEditing) return;

        const range = Array.from(
            { length: section.endBar - section.startBar + 1 }, 
            (_, i) => section.startBar + i
        );

        setEditorState(prev => ({
            ...prev,
            selectedBars: range,
            currentSection: section,
            formData: {
                startBar: section.startBar,
                endBar: section.endBar,
                type: section.type,
                letter: section.letter,
                label: section.label || SECTION_LABELS[section.type]
            }
        }));
    }, [editorState.isEditing]);

    // Función para detectar solapamientos y resolverlos
    const resolveOverlaps = useCallback((newSection: Section, existingSections: Section[]) => {
        const overlappingSections = existingSections.filter(section => {
            // No comparar con la sección que se está editando
            if (newSection.id === section.id) return false;
            
            // Detectar solapamiento
            return !(newSection.endBar < section.startBar || newSection.startBar > section.endBar);
        });

        if (overlappingSections.length === 0) {
            return existingSections;
        }

        // Resolver solapamientos: actualizar las secciones solapadas
        return existingSections.map(section => {
            if (!overlappingSections.includes(section)) {
                return section;
            }

            // Si la nueva sección contiene completamente a la existente, eliminarla
            if (newSection.startBar <= section.startBar && newSection.endBar >= section.endBar) {
                return null; // Marcar para eliminación
            }

            // Si la nueva sección está completamente contenida, dividir la existente
            if (section.startBar < newSection.startBar && section.endBar > newSection.endBar) {
                // Por simplicidad, mantener solo la parte izquierda
                return {
                    ...section,
                    endBar: newSection.startBar - 1,
                    updatedAt: new Date()
                };
            }

            // Solapamiento parcial - ajustar bordes
            if (newSection.startBar <= section.startBar) {
                // Nueva sección empieza antes o en el mismo lugar
                return {
                    ...section,
                    startBar: newSection.endBar + 1,
                    updatedAt: new Date()
                };
            } else {
                // Nueva sección empieza después
                return {
                    ...section,
                    endBar: newSection.startBar - 1,
                    updatedAt: new Date()
                };
            }
        }).filter(Boolean) as Section[]; // Eliminar secciones marcadas como null
    }, []);

    // Guardar sección (crear o actualizar)
    const saveSection = useCallback(async () => {
        const { formData, currentSection } = editorState;
        
        if (formData.startBar === null || formData.endBar === null) {
            console.error('Faltan datos para guardar la sección');
            return;
        }

        if (!projectId) {
            console.error('projectId es necesario para guardar secciones');
            return;
        }

        const sectionData: Section = {
            id: currentSection?.id || uuidv4(),
            startBar: formData.startBar,
            endBar: formData.endBar,
            type: formData.type,
            letter: formData.letter,
            label: formData.label,
            color: SECTION_COLORS[formData.type],
            createdAt: currentSection?.createdAt || new Date(),
            updatedAt: new Date()
        };

        try {
            // Resolver solapamientos antes de guardar
            const resolvedSections = resolveOverlaps(sectionData, sections);
            
            // Actualizar estado local primero
            let updatedSections: Section[];
            if (currentSection) {
                // Editando sección existente
                updatedSections = resolvedSections.map(s => s.id === currentSection.id ? sectionData : s);
            } else {
                // Creando nueva sección
                updatedSections = [...resolvedSections, sectionData];
            }
            
            setSections(updatedSections);

            // Preparar datos para guardar en projects.sections usando las secciones resueltas
            const sectionsForSave = updatedSections.map(section => ({
                id: section.id,
                startBar: section.startBar,
                endBar: section.endBar,
                type: section.type,
                letter: section.letter,
                label: section.label,
                color: section.color,
                createdAt: section.createdAt.toISOString(),
                updatedAt: section.updatedAt.toISOString()
            }));

            // Actualizar proyecto en Supabase
            const { error } = await supabase
                .from('projects')
                .update({ sections: sectionsForSave })
                .eq('id', projectId);

            if (error) throw error;

            // Limpiar estado del editor pero mantener modo edición
            setEditorState(prev => ({
                ...prev,
                selectedBars: [],
                currentSection: null,
                formData: { ...initialFormData }
            }));

        } catch (error) {
            console.error('Error guardando sección:', error);
            alert('Error al guardar la sección');
        }
    }, [editorState, projectId, sections]);

    // Eliminar sección
    const deleteSection = useCallback(async (sectionId: string) => {
        if (!projectId) {
            console.error('projectId es necesario para eliminar secciones');
            return;
        }

        try {
            // Actualizar estado local
            const updatedSections = sections.filter(s => s.id !== sectionId);
            setSections(updatedSections);

            // Preparar datos para guardar en projects.sections
            const sectionsForSave = updatedSections.map(section => ({
                id: section.id,
                startBar: section.startBar,
                endBar: section.endBar,
                type: section.type,
                letter: section.letter,
                label: section.label,
                color: section.color,
                createdAt: section.createdAt.toISOString(),
                updatedAt: section.updatedAt.toISOString()
            }));

            // Actualizar proyecto en Supabase
            const { error } = await supabase
                .from('projects')
                .update({ sections: sectionsForSave })
                .eq('id', projectId);

            if (error) throw error;
            
            // Si estábamos editando esta sección, limpiar
            if (editorState.currentSection?.id === sectionId) {
                setEditorState(prev => ({
                    ...prev,
                    selectedBars: [],
                    currentSection: null,
                    formData: { ...initialFormData }
                }));
            }
        } catch (error) {
            console.error('Error eliminando sección:', error);
            alert('Error al eliminar la sección');
        }
    }, [editorState.currentSection, projectId, sections]);

    // Obtener sección que contiene un compás
    const getSectionForBar = useCallback((barIndex: number): Section | undefined => {
        return sections.find(section => 
            barIndex >= section.startBar && barIndex <= section.endBar
        );
    }, [sections]);


    // Cargar secciones desde Supabase
    const loadSections = useCallback(async () => {
        if (!projectId) {
            console.error('projectId es necesario para cargar secciones');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('sections')
                .eq('id', projectId)
                .single();

            if (error) throw error;

            // Convertir datos de Supabase al formato local
            const sectionsData: Section[] = (data?.sections || []).map((item: any) => ({
                id: item.id,
                startBar: item.startBar,
                endBar: item.endBar,
                type: item.type,
                letter: item.letter,
                label: item.label,
                color: item.color,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt)
            }));

            setSections(sectionsData);
        } catch (error) {
            console.error('Error cargando secciones:', error);
        }
    }, [projectId]);

    return {
        sections,
        editorState,
        toggleEditMode,
        handleBarSelection,
        updateFormData,
        editExistingSection,
        saveSection,
        deleteSection,
        getSectionForBar,
        loadSections
    };
};