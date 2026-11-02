import { useState, type DragEvent } from 'react';
import { hasItemDragData, readItemDragData } from '../utils/dragData';

/** Lets a whole element accept dragged skill cards, and reports when one is over it. */
export function useDropTarget(disabled: boolean, onDropItem: (id: string) => void) {
  const [isOver, setIsOver] = useState(false);

  const dropHandlers = {
    onDragOver(event: DragEvent<HTMLElement>) {
      if (disabled || !hasItemDragData(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      if (!isOver) setIsOver(true);
    },
    onDragLeave(event: DragEvent<HTMLElement>) {
      // Moving between child elements fires dragleave too; only reset when leaving the target.
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
      setIsOver(false);
    },
    onDrop(event: DragEvent<HTMLElement>) {
      event.preventDefault();
      setIsOver(false);
      const id = readItemDragData(event.dataTransfer);
      if (id && !disabled) onDropItem(id);
    },
  };

  return { isOver, dropHandlers };
}
