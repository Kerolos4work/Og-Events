'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import TicketToolbar from './designer/TicketToolbar';
import TicketPropertiesPanel from './designer/TicketPropertiesPanel';
import TicketCanvas from './designer/TicketCanvas';
import { TicketSaveDialog, TicketLoadDialog } from './designer/TicketDialogs';
import { useTicketDesigner } from './designer/useTicketDesigner';
import { useCanvasInteraction } from './designer/useCanvasInteraction';
import { useTicketRenderer } from './designer/useTicketRenderer';
import { TicketElementKey, TicketSize, CustomTextElement } from './designer/types';

export default function TicketDesigner() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!); // For export

  // 1. Core State Management Hook
  const {
    ticketDetails,
    setTicketDetails,
    ticketSize,
    handleTicketSizeChange,
    ticketElements,
    setTicketElements,
    activeElement,
    setActiveElement,
    handleDetailChange,
    addCustomTextElement,
    updateCustomTextElement,
    deleteCustomTextElement,
    toggleElementVisibility,
    updateElementPosition
  } = useTicketDesigner();

  // 2. Interaction Hook (Drag & Resize)
  const {
    isDragging,
    handleElementMouseDown,
    handleResizeMouseDown,
    // We don't expose mousemove/up handlers directly as they are attached to window in the hook
  } = useCanvasInteraction({
    ticketElements,
    activeElement,
    setActiveElement,
    updateElementPosition,
    // Removed ticketSize as it was causing type error and not used
  });

  // 3. Additional Local State
  const [templateName, setTemplateName] = useState('New Ticket Template');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Dialog State
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 4. Renderer Hook (for export)
  const { generateTicket } = useTicketRenderer({
    canvasRef,
    ticketElements,
    ticketDetails,
    ticketSize,
    selectedImage,
    imagePreview,
  });

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      // Mock categories - replace with real DB fetch if available
      const mockCategories = [
        { name: 'VIP', price: 150, color: '#FFD700', templates: [] },
        { name: 'General Admission', price: 50, color: '#4CAF50', templates: [] },
      ];
      setCategories(mockCategories);
      if (mockCategories.length > 0) setSelectedCategory(mockCategories[0].name);
    };
    fetchCategories();
  }, []);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setSelectedImage(null);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateElement = (key: TicketElementKey, updates: Partial<any>) => {
    setTicketElements(prev => ({
      ...prev,
      [key]: {
        ...prev[key as 'backgroundImage' | 'qrCode'],
        ...updates
      }
    }));
  };

  const handleQrColorChange = (type: 'foreground' | 'background', color: string) => {
    handleUpdateElement('qrCode', type === 'foreground' ? { foregroundColor: color } : { backgroundColor: color });
  };

  const saveToDatabase = async () => {
    console.log('Saving template:', { templateName, selectedCategory, ticketElements, ticketSize, ticketDetails });
    // Simulate save
    setShowSaveDialog(false);
  };

  const loadFromDatabase = (template: any) => {
    console.log('Loading template', template);
    // Simulate load
    if (template.ticketElements) setTicketElements(template.ticketElements);
    if (template.ticketSize) {
      handleTicketSizeChange('width', template.ticketSize.width);
      handleTicketSizeChange('height', template.ticketSize.height);
    }
    if (template.ticketDetails) setTicketDetails(template.ticketDetails);

    setShowLoadDialog(false);
  };

  const exportJSON = () => {
    const data = JSON.stringify({ ticketElements, ticketSize, ticketDetails }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const exportImage = () => {
    generateTicket();
    setTimeout(() => {
      if (canvasRef.current) {
        const url = canvasRef.current.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateName.replace(/\s+/g, '_')}.png`;
        a.click();
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TicketToolbar
        templateName={templateName}
        setTemplateName={setTemplateName}
        onSave={() => setShowSaveDialog(true)}
        onLoad={() => setShowLoadDialog(true)}
        onExport={exportJSON}
        onExportImage={exportImage}
        onAddText={addCustomTextElement}
        onImageUpload={handleImageUpload}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        fileInputRef={fileInputRef}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
        <TicketCanvas
          ticketSize={ticketSize}
          // ticketDetails removed as it is not a prop of TicketCanvas
          ticketElements={ticketElements}
          activeElement={activeElement}
          selectedImage={selectedImage}
          imagePreview={imagePreview}
          imageUploading={imageUploading}
          onElementMouseDown={handleElementMouseDown}
          onResizeMouseDown={handleResizeMouseDown}
          isDragging={isDragging}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Right Sidebar Properties */}
        <TicketPropertiesPanel
          activeElement={activeElement}
          onSelectElement={setActiveElement}
          ticketElements={ticketElements}
          ticketDetails={ticketDetails}
          ticketSize={ticketSize}
          onDetailChange={handleDetailChange}
          onSizeChange={(dim, val) => handleTicketSizeChange(dim, val.toString())}
          onToggleVisibility={(name) => toggleElementVisibility(name as TicketElementKey)}
          onUpdateCustomText={updateCustomTextElement}
          onDeleteCustomText={deleteCustomTextElement}
          onUpdateElement={handleUpdateElement}
          qrForegroundColor={ticketElements.qrCode.foregroundColor}
          setQrForegroundColor={(c) => handleQrColorChange('foreground', c)}
          qrBackgroundColor={ticketElements.qrCode.backgroundColor}
          setQrBackgroundColor={(c) => handleQrColorChange('background', c)}
        />
      </div>

      <TicketSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={saveToDatabase}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        templateName={templateName}
        onTemplateNameChange={setTemplateName}
      />

      <TicketLoadDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={loadFromDatabase}
        categories={categories}
      />
    </div>
  );
}
