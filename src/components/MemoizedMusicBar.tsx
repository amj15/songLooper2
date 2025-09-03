import React, { memo } from "react";
import MusicBar from "./MusicBar";
import type { Section } from "../types/sections";

interface MemoizedMusicBarProps {
    barIndex: number;
    active: boolean;
    isSelected: boolean;
    isLoopActive: boolean;
    section?: Section;
    isEditingMode: boolean;
    isLoopSelectionActive: boolean;
    showLoopButton: boolean;
    isInActiveLoop: boolean;
    barNumber: number;
    onBarClick: (barIndex: number) => void;
    onBarMouseDown: (barIndex: number, event: React.MouseEvent) => void;
    onBarMouseEnter: (barIndex: number) => void;
    onBarMouseUp: (event: React.MouseEvent) => void;
    onEditBar?: (barIndex: number) => void;
    onCloneBar?: (barIndex: number) => void;
    onDeleteBar?: (barIndex: number) => void;
}

const MemoizedMusicBar = memo<MemoizedMusicBarProps>(({
    barIndex,
    active,
    isSelected,
    isLoopActive,
    section,
    isEditingMode,
    isLoopSelectionActive,
    showLoopButton,
    isInActiveLoop,
    barNumber,
    onBarClick,
    onBarMouseDown,
    onBarMouseEnter,
    onBarMouseUp,
    onEditBar,
    onCloneBar,
    onDeleteBar
}) => {
    return (
        <MusicBar
            barIndex={barIndex}
            active={active}
            isSelected={isSelected}
            isLoopActive={isLoopActive}
            onClick={() => onBarClick(barIndex)}
            onMouseDown={(e) => onBarMouseDown(barIndex, e)}
            onMouseEnter={() => onBarMouseEnter(barIndex)}
            onMouseUp={onBarMouseUp}
            section={section}
            isEditingMode={isEditingMode}
            isLoopSelectionActive={isLoopSelectionActive}
            showLoopButton={showLoopButton}
            isInActiveLoop={isInActiveLoop}
            barNumber={barNumber}
            onEditBar={onEditBar}
            onCloneBar={onCloneBar}
            onDeleteBar={onDeleteBar}
        />
    );
}, (prevProps, nextProps) => {
    // Custom equality check - solo re-render si las props importantes cambian
    return (
        prevProps.barIndex === nextProps.barIndex &&
        prevProps.active === nextProps.active &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isLoopActive === nextProps.isLoopActive &&
        prevProps.isEditingMode === nextProps.isEditingMode &&
        prevProps.isLoopSelectionActive === nextProps.isLoopSelectionActive &&
        prevProps.isInActiveLoop === nextProps.isInActiveLoop &&
        prevProps.barNumber === nextProps.barNumber &&
        prevProps.section?.id === nextProps.section?.id &&
        prevProps.section?.color === nextProps.section?.color &&
        prevProps.section?.label === nextProps.section?.label
    );
});

MemoizedMusicBar.displayName = "MemoizedMusicBar";

export default MemoizedMusicBar;