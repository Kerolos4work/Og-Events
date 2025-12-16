import { useState } from 'react';
import {
  TicketDetails,
  TicketSize,
  ElementPosition,
  TextElementProperties,
  CustomTextElement,
  TicketElements,
  TicketElementKey,
} from './types';

export function useTicketDesigner() {
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>({
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={SEAT_ID}',
  });

  const [ticketSize, setTicketSize] = useState<TicketSize>({ width: 600, height: 300 });

  const [ticketElements, setTicketElements] = useState<TicketElements>({
    backgroundImage: { x: 0, y: 0, width: 600, height: 300, visible: true },
    qrCode: {
      x: 480,
      y: 180,
      width: 100,
      height: 100,
      visible: true,
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      transparentBackground: false,
    },
    customTexts: [],
  });

  const [activeElement, setActiveElement] = useState<TicketElementKey | string | null>(null);

  const handleDetailChange = (field: keyof TicketDetails, value: string) => {
    setTicketDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTicketSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 100;
    setTicketSize(prev => ({
      ...prev,
      [dimension]: numValue,
    }));

    // Update background image size to match ticket size
    setTicketElements(prev => ({
      ...prev,
      backgroundImage: {
        ...prev.backgroundImage,
        width: dimension === 'width' ? numValue : prev.backgroundImage.width,
        height: dimension === 'height' ? numValue : prev.backgroundImage.height,
      },
    }));
  };

  const toggleElementVisibility = (elementName: TicketElementKey) => {
    setTicketElements(prev => {
      // Custom texts are handled individually, cannot toggle visibility of the entire array
      if (elementName === 'customTexts') return prev;

      return {
        ...prev,
        [elementName]: {
          // @ts-ignore - dynamic access to union type
          ...prev[elementName],
          // @ts-ignore
          visible: !prev[elementName].visible,
        },
      };
    });
  };

  const addCustomTextElement = () => {
    const newId = `text-${Date.now()}`;
    const newTextElement: CustomTextElement = {
      id: newId,
      content: 'Custom Text',
      position: {
        x: 50,
        y: 50,
        width: 200,
        height: 50,
        fontFamily: 'Arial',
        fontSize: 14,
        fontColor: '#000000',
        backgroundColor: '#ffffff',
        backgroundOpacity: 0,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textTransform: 'none',
        textAlign: 'left',
        letterSpacing: 0,
        lineHeight: 1.4,
        textShadowX: 0,
        textShadowY: 0,
        textShadowBlur: 0,
        textShadowColor: '#000000',
      },
    };

    setTicketElements(prev => ({
      ...prev,
      customTexts: [...prev.customTexts, newTextElement],
    }));
    setActiveElement(newId);
  };

  const deleteCustomTextElement = (id: string) => {
    setTicketElements(prev => ({
      ...prev,
      customTexts: prev.customTexts.filter(text => text.id !== id),
    }));
    if (activeElement === id) {
      setActiveElement(null);
    }
  };

  const updateCustomTextElement = (id: string, updates: Partial<CustomTextElement>) => {
    setTicketElements(prev => ({
      ...prev,
      customTexts: prev.customTexts.map(text => (text.id === id ? { ...text, ...updates } : text)),
    }));
  };

  const updateElementPosition = (
    elementName: string,
    position: Partial<ElementPosition & TextElementProperties>
  ) => {
    if (elementName.startsWith('text-')) {
      updateCustomTextElement(elementName, {
        // @ts-ignore - position update is complex due to union types
        position: {
          ...ticketElements.customTexts.find(t => t.id === elementName)?.position,
          ...position,
        },
      });
    } else {
      // @ts-ignore - dynamic key access
      setTicketElements(prev => ({
        ...prev,
        [elementName]: {
          ...prev[elementName as TicketElementKey],
          ...position,
        },
      }));
    }
  };

  return {
    ticketDetails,
    ticketSize,
    ticketElements,
    setTicketElements,
    activeElement,
    setActiveElement,
    handleDetailChange,
    handleTicketSizeChange,
    toggleElementVisibility,
    addCustomTextElement,
    deleteCustomTextElement,
    updateCustomTextElement,
    updateElementPosition,
    setTicketDetails,
    setTicketSize,
  };
}
