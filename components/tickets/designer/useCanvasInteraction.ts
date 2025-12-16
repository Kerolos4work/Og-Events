import { useState, useEffect, useCallback, useRef } from 'react';
import { TicketElementKey, TicketElements, ElementPosition, TextElementProperties } from './types';

interface DragStart {
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
}

interface ResizeStart {
  startX: number; // Mouse X
  startY: number; // Mouse Y
  originalX: number; // Element X
  originalY: number; // Element Y
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
}

interface UseCanvasInteractionProps {
  ticketElements: TicketElements;
  activeElement: TicketElementKey | string | null;
  setActiveElement: (id: TicketElementKey | string | null) => void;
  updateElementPosition: (
    id: string,
    position: Partial<ElementPosition & TextElementProperties>
  ) => void;
}

export function useCanvasInteraction({
  ticketElements,
  activeElement,
  setActiveElement,
  updateElementPosition,
}: UseCanvasInteractionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Use refs to store start state to avoid re-triggering effects
  const dragStartRef = useRef<DragStart | null>(null);
  const resizeStartRef = useRef<ResizeStart | null>(null);

  // Store the update function in a ref to call it without adding it to dependency array if it's unstable
  const updateElementPositionRef = useRef(updateElementPosition);
  useEffect(() => {
    updateElementPositionRef.current = updateElementPosition;
  }, [updateElementPosition]);

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementName: TicketElementKey | string) => {
      if (e.button !== 0) return; // Only left click
      e.preventDefault();
      e.stopPropagation();

      setActiveElement(elementName);
      setIsDragging(true);

      let elementX = 0;
      let elementY = 0;

      if (elementName.startsWith('text-')) {
        const customText = ticketElements.customTexts.find(t => t.id === elementName);
        if (customText) {
          elementX = customText.position.x;
          elementY = customText.position.y;
        }
      } else {
        // @ts-ignore
        const element = ticketElements[elementName as TicketElementKey];
        if (element && !Array.isArray(element)) {
          elementX = element.x;
          elementY = element.y;
        }
      }

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originalX: elementX,
        originalY: elementY,
      };
    },
    [ticketElements, setActiveElement]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, elementName: TicketElementKey | string, handle: string) => {
      e.preventDefault();
      e.stopPropagation();

      setActiveElement(elementName);
      setIsResizing(true);
      setResizeHandle(handle);

      let width = 0;
      let height = 0;
      let x = 0;
      let y = 0;

      if (elementName.startsWith('text-')) {
        const customText = ticketElements.customTexts.find(t => t.id === elementName);
        if (customText) {
          width = customText.position.width;
          height = customText.position.height;
          x = customText.position.x;
          y = customText.position.y;
        }
      } else {
        // @ts-ignore
        const element = ticketElements[elementName as TicketElementKey];
        if (element && !Array.isArray(element)) {
          width = element.width;
          height = element.height;
          x = element.x;
          y = element.y;
        }
      }

      resizeStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originalX: x,
        originalY: y,
        originalWidth: width,
        originalHeight: height,
        aspectRatio: width / height,
      };
    },
    [ticketElements, setActiveElement]
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && activeElement && dragStartRef.current) {
        const deltaX = e.clientX - dragStartRef.current.startX;
        const deltaY = e.clientY - dragStartRef.current.startY;

        const newX = dragStartRef.current.originalX + deltaX;
        const newY = dragStartRef.current.originalY + deltaY;

        updateElementPositionRef.current(activeElement, { x: newX, y: newY } as any);
      }

      if (isResizing && activeElement && resizeStartRef.current && resizeHandle) {
        const { startX, startY, originalWidth, originalHeight, originalX, originalY, aspectRatio } =
          resizeStartRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const isShiftPressed = e.shiftKey;

        let newWidth = originalWidth;
        let newHeight = originalHeight;
        let newX = originalX;
        let newY = originalY;

        switch (resizeHandle) {
          case 'se': // southeast
            newWidth = Math.max(20, originalWidth + deltaX);
            newHeight = Math.max(20, originalHeight + deltaY);
            break;
          case 'sw': // southwest
            newWidth = Math.max(20, originalWidth - deltaX);
            newHeight = Math.max(20, originalHeight + deltaY);
            newX = originalX + (originalWidth - newWidth); // Shift X as width changes
            break;
          case 'ne': // northeast
            newWidth = Math.max(20, originalWidth + deltaX);
            newHeight = Math.max(20, originalHeight - deltaY);
            newY = originalY + (originalHeight - newHeight); // Shift Y as height changes
            break;
          case 'nw': // northwest
            newWidth = Math.max(20, originalWidth - deltaX);
            newHeight = Math.max(20, originalHeight - deltaY);
            newX = originalX + (originalWidth - newWidth);
            newY = originalY + (originalHeight - newHeight);
            break;
          case 'n': // north
            newHeight = Math.max(20, originalHeight - deltaY);
            newY = originalY + (originalHeight - newHeight);
            break;
          case 's': // south
            newHeight = Math.max(20, originalHeight + deltaY);
            break;
          case 'e': // east
            newWidth = Math.max(20, originalWidth + deltaX);
            break;
          case 'w': // west
            newWidth = Math.max(20, originalWidth - deltaX);
            newX = originalX + (originalWidth - newWidth);
            break;
        }

        // Aspect ratio preservation
        if (isShiftPressed && ['ne', 'nw', 'se', 'sw'].includes(resizeHandle)) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Width dominates
            const targetHeight = newWidth / aspectRatio;
            // We need to re-adjust Y if it was a North resize
            if (resizeHandle.includes('n')) {
              newY = originalY + (originalHeight - targetHeight);
            }
            newHeight = targetHeight;
          } else {
            // Height dominates
            const targetWidth = newHeight * aspectRatio;
            // We need to re-adjust X if it was a West resize
            if (resizeHandle.includes('w')) {
              newX = originalX + (originalWidth - targetWidth);
            }
            newWidth = targetWidth;
          }
        }

        updateElementPositionRef.current(activeElement, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        } as any);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      dragStartRef.current = null;
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, activeElement, resizeHandle]);

  return {
    handleElementMouseDown,
    handleResizeMouseDown,
    isDragging,
    isResizing,
    resizeHandle,
  };
}
