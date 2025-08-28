import {
    Box,
    Button,
    Drawer,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Chip,
    Divider
} from "@mui/material";
import React from "react";
import type { 
    SectionFormData, 
    SectionType
} from "../types/sections";
import { 
    SECTION_TYPES, 
    SECTION_LETTERS, 
    SECTION_LABELS
} from "../types/sections";

interface SectionEditorDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    formData: SectionFormData;
    onUpdateFormData: (updates: Partial<SectionFormData>) => void;
    selectedBars: number[];
    isEditingExisting: boolean;
}

const SectionEditorDrawer: React.FC<SectionEditorDrawerProps> = ({
    open,
    onClose,
    onSave,
    formData,
    onUpdateFormData,
    selectedBars,
    isEditingExisting
}) => {
    const handleTypeChange = (type: SectionType) => {
        onUpdateFormData({ 
            type,
            label: SECTION_LABELS[type] // Auto-actualizar label por defecto
        });
    };

    const canSave = formData.startBar !== null && 
                   formData.endBar !== null && 
                   formData.type && 
                   formData.letter &&
                   formData.label.trim();

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="persistent"
            PaperProps={{
                sx: { 
                    width: 350,
                    padding: 3
                }
            }}
        >
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Header */}
                <Typography variant="h6" gutterBottom>
                    {isEditingExisting ? "Editar Sección" : "Nueva Sección"}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {/* Compases seleccionados */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Compases seleccionados:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {selectedBars.length > 0 ? (
                            selectedBars.map(barIndex => (
                                <Chip 
                                    key={barIndex}
                                    label={barIndex + 1}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            ))
                        ) : (
                            <Typography variant="body2" color="textSecondary">
                                Selecciona compases en la vista principal
                            </Typography>
                        )}
                    </Box>
                    {formData.startBar !== null && formData.endBar !== null && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                            Rango: Compás {formData.startBar + 1} - {formData.endBar + 1}
                        </Typography>
                    )}
                </Box>

                {/* Tipo de sección */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Tipo de sección</InputLabel>
                    <Select
                        value={formData.type}
                        onChange={(e) => handleTypeChange(e.target.value as SectionType)}
                        label="Tipo de sección"
                    >
                        {SECTION_TYPES.map(type => (
                            <MenuItem key={type} value={type}>
                                {SECTION_LABELS[type]}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Letra de sección */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Letra</InputLabel>
                    <Select
                        value={formData.letter}
                        onChange={(e) => onUpdateFormData({ letter: e.target.value })}
                        label="Letra"
                    >
                        {SECTION_LETTERS.map(letter => (
                            <MenuItem key={letter} value={letter}>
                                {letter}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Label personalizado */}
                <TextField
                    fullWidth
                    label="Label personalizado"
                    value={formData.label}
                    onChange={(e) => onUpdateFormData({ label: e.target.value })}
                    placeholder="Ej: Estrofa 1, Coro Principal..."
                    sx={{ mb: 3 }}
                    helperText="Puedes personalizar el nombre de la sección"
                />

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                    <Button 
                        variant="outlined" 
                        onClick={onClose}
                        fullWidth
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={onSave}
                        disabled={!canSave}
                        fullWidth
                    >
                        Guardar
                    </Button>
                </Box>

                {/* Ayuda */}
                <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    backgroundColor: "grey.50", 
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.300"
                }}>
                    <Typography variant="caption" color="textSecondary">
                        <strong>Cómo usar:</strong><br />
                        1. Selecciona compases haciendo click en ellos<br />
                        2. Elige el tipo y letra de la sección<br />
                        3. Personaliza el label si quieres<br />
                        4. Guarda los cambios
                    </Typography>
                </Box>
            </Box>
        </Drawer>
    );
};

export default SectionEditorDrawer;