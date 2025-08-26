import { useCallback, useState } from "react";

export interface Section {
    id: string;
    startBar: number;
    endBar: number;
    type: string;
    letter: string;
    name: string;
    displayName: string;
    color: string;
}

export interface SectionType {
    value: string;
    label: string;
    color: string;
    letter: string;
}

export const SECTION_TYPES: SectionType[] = [
    { value: 'intro', label: 'Intro', color: '#ff6b6b', letter: 'I' },
    { value: 'verse', label: 'Verse', color: '#4ecdc4', letter: 'V' },
    { value: 'prechorus', label: 'Pre-Chorus', color: '#45b7d1', letter: 'P' },
    { value: 'chorus', label: 'Chorus', color: '#f9ca24', letter: 'C' },
    { value: 'postchorus', label: 'Post-Chorus', color: '#f0932b', letter: 'PC' },
    { value: 'bridge', label: 'Bridge', color: '#eb4d4b', letter: 'B' },
    { value: 'breakdown', label: 'Breakdown', color: '#6c5ce7', letter: 'BD' },
    { value: 'instrumental', label: 'Instrumental Break / Solo', color: '#a29bfe', letter: 'S' },
    { value: 'hook', label: 'Hook', color: '#fd79a8', letter: 'H' },
    { value: 'drop', label: 'Drop', color: '#e17055', letter: 'D' },
    { value: 'outro', label: 'Outro', color: '#81ecec', letter: 'O' },
    { value: 'tag', label: 'Tag / Refrain Tag', color: '#fab1a0', letter: 'T' },
    { value: 'interlude', label: 'Interlude', color: '#55a3ff', letter: 'IL' },
    { value: 'versevar', label: 'Verse Variation', color: '#00b894', letter: 'VV' },
    { value: 'refrain', label: 'Refrain', color: '#fdcb6e', letter: 'R' }
];

export const useSectionManager = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [isCreatingSection, setIsCreatingSection] = useState(false);
    const [newSectionStart, setNewSectionStart] = useState<number | null>(null);
    const [newSectionEnd, setNewSectionEnd] = useState<number | null>(null);
    const [showSectionDialog, setShowSectionDialog] = useState(false);
    const [selectedSectionType, setSelectedSectionType] = useState('');
    const [sectionName, setSectionName] = useState('');

    // Estados para drag
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);

    const generateSectionLetter = useCallback((sectionType: string) => {
        const existingSectionsOfType = sections.filter(s => s.type === sectionType);
        if (existingSectionsOfType.length === 0) {
            return 'A';
        }
        
        const usedLetters = existingSectionsOfType.map(s => s.letter);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < alphabet.length; i++) {
            if (!usedLetters.includes(alphabet[i])) {
                return alphabet[i];
            }
        }
        
        return 'Z';
    }, [sections]);

    const handleBarMouseDown = useCallback((barIndex: number, event: React.MouseEvent) => {
        if (event.button === 2) { // Right click
            event.preventDefault();
            setIsDragging(true);
            setDragStart(barIndex);
            setDragEnd(barIndex);
            setIsCreatingSection(true);
        }
    }, []);

    const handleBarMouseEnter = useCallback((barIndex: number) => {
        if (isDragging && dragStart !== null) {
            setDragEnd(barIndex);
        }
    }, [isDragging, dragStart]);

    const handleBarMouseUp = useCallback((event: React.MouseEvent) => {
        if (isDragging && dragStart !== null && dragEnd !== null) {
            event.preventDefault();
            setIsDragging(false);
            setNewSectionStart(Math.min(dragStart, dragEnd));
            setNewSectionEnd(Math.max(dragStart, dragEnd));
            setShowSectionDialog(true);
        }
    }, [isDragging, dragStart, dragEnd]);

    const createSection = useCallback(() => {
        if (newSectionStart === null || newSectionEnd === null || !selectedSectionType) return;
        
        const sectionType = SECTION_TYPES.find(t => t.value === selectedSectionType);
        if (!sectionType) return;

        const letter = generateSectionLetter(selectedSectionType);
        const displayName = `${sectionType.label} ${letter}`;

        const newSection: Section = {
            id: Date.now().toString(),
            startBar: Math.min(newSectionStart, newSectionEnd),
            endBar: Math.max(newSectionStart, newSectionEnd),
            type: selectedSectionType,
            letter: letter,
            name: sectionName || displayName,
            displayName: displayName,
            color: sectionType.color
        };

        setSections(prev => [...prev, newSection]);
        resetSectionForm();
    }, [newSectionStart, newSectionEnd, selectedSectionType, sectionName, generateSectionLetter]);

    const resetSectionForm = useCallback(() => {
        setIsCreatingSection(false);
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setNewSectionStart(null);
        setNewSectionEnd(null);
        setShowSectionDialog(false);
        setSelectedSectionType('');
        setSectionName('');
    }, []);

    const cancelSectionCreation = useCallback(() => {
        resetSectionForm();
    }, [resetSectionForm]);

    const getSectionForBar = useCallback((barIndex: number) => {
        return sections.find(section => 
            barIndex >= section.startBar && barIndex <= section.endBar
        );
    }, [sections]);

    return {
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
        sectionFormData: {
            newSectionStart,
            newSectionEnd,
            selectedSectionType,
            setSelectedSectionType,
            sectionName,
            setSectionName
        }
    };
};