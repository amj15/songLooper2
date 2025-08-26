import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField
} from "@mui/material";
import React from "react";
import { SECTION_TYPES } from "../hooks/useSectionManager";

interface SectionDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: () => void;
    formData: {
        newSectionStart: number | null;
        newSectionEnd: number | null;
        selectedSectionType: string;
        setSelectedSectionType: (type: string) => void;
        sectionName: string;
        setSectionName: (name: string) => void;
    };
}

const SectionDialog: React.FC<SectionDialogProps> = ({
    open,
    onClose,
    onCreate,
    formData
}) => {
    const {
        newSectionStart,
        newSectionEnd,
        selectedSectionType,
        setSelectedSectionType,
        sectionName,
        setSectionName
    } = formData;

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle>Crear Nueva Sección</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Box sx={{ fontSize: '14px', color: '#666' }}>
                        Compases: {newSectionStart !== null && newSectionEnd !== null 
                            ? `${Math.min(newSectionStart, newSectionEnd) + 1} - ${Math.max(newSectionStart, newSectionEnd) + 1}`
                            : ''}
                    </Box>
                    
                    <FormControl fullWidth>
                        <InputLabel>Tipo de Sección</InputLabel>
                        <Select
                            value={selectedSectionType}
                            label="Tipo de Sección"
                            onChange={(e) => setSelectedSectionType(e.target.value)}
                        >
                            {SECTION_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box 
                                            sx={{ 
                                                width: 16, 
                                                height: 16, 
                                                backgroundColor: type.color,
                                                borderRadius: '50%'
                                            }}
                                        />
                                        {type.label} ({type.letter})
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Nombre personalizado (opcional)"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder={selectedSectionType ? SECTION_TYPES.find(t => t.value === selectedSectionType)?.label : ''}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancelar
                </Button>
                <Button 
                    onClick={onCreate} 
                    variant="contained" 
                    disabled={!selectedSectionType}
                >
                    Crear Sección
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SectionDialog;