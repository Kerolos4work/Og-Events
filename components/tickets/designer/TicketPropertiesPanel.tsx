import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  EyeOff,
  Layers,
  Settings2,
  Type,
  Palette,
  Layout,
  QrCode,
  ChevronDown,
  Trash2
} from 'lucide-react';
import LayerList from './LayerList';
import { TicketElements, TicketDetails, TicketSize, TicketElementKey, CustomTextElement } from './types';
import { useState } from 'react';

interface TicketPropertiesPanelProps {
  activeElement: TicketElementKey | string | null;
  onSelectElement: (id: TicketElementKey | string | null) => void;
  ticketElements: TicketElements;
  ticketDetails: TicketDetails;
  ticketSize: TicketSize;
  onDetailChange: (field: keyof TicketDetails, value: string) => void;
  onSizeChange: (dimension: 'width' | 'height', value: string) => void;
  onToggleVisibility: (elementName: TicketElementKey | string) => void;
  onUpdateCustomText: (id: string, updates: Partial<CustomTextElement>) => void;
  onDeleteCustomText: (id: string) => void;
  onUpdateElement: (elementName: TicketElementKey, updates: Partial<any>) => void;
  qrForegroundColor: string;
  setQrForegroundColor: (color: string) => void;
  qrBackgroundColor: string;
  setQrBackgroundColor: (color: string) => void;
}

export default function TicketPropertiesPanel({
  activeElement,
  onSelectElement,
  ticketElements,
  ticketDetails,
  ticketSize,
  onDetailChange,
  onSizeChange,
  onToggleVisibility,
  onUpdateCustomText,
  onDeleteCustomText,
  onUpdateElement,
  qrForegroundColor,
  setQrForegroundColor,
  qrBackgroundColor,
  setQrBackgroundColor,
}: TicketPropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    settings: true,
    typography: true,
    appearance: true,
    layers: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderFontFamilyOptions = () => (
    <>
      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
      <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
      <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
      <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
      <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Inspector</h2>
        </div>
        {activeElement && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-red-400"
            onClick={() => onSelectElement(null)}
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {!activeElement ? (
          <div className="space-y-6">
            {/* Global Ticket Settings */}
            <div className="space-y-4">
              <div onClick={() => toggleSection('settings')} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Canvas Settings</span>
                </div>
                <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform ${expandedSections.settings ? '' : '-rotate-90'}`} />
              </div>

              {expandedSections.settings && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Width (px)</Label>
                    <Input
                      type="number"
                      value={ticketSize.width || 0}
                      onChange={e => onSizeChange('width', e.target.value)}
                      className="h-9 bg-slate-800/50 border-slate-700/50 text-slate-200 focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Height (px)</Label>
                    <Input
                      type="number"
                      value={ticketSize.height || 0}
                      onChange={e => onSizeChange('height', e.target.value)}
                      className="h-9 bg-slate-800/50 border-slate-700/50 text-slate-200 focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-slate-500 bg-slate-800/30 p-3 rounded-lg border border-slate-800/50 italic">
                Select an element on the canvas to view and edit its specific properties.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Active Element Title */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                {activeElement.toString().startsWith('text-') ? <Type className="h-4 w-4 text-indigo-400" /> : <Layers className="h-4 w-4 text-purple-400" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  {activeElement.toString().startsWith('text-') ? 'Text Layer' : activeElement.toString().replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Active Element</p>
              </div>
            </div>

            {/* Position & Size Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 uppercase">X Position</Label>
                  <Input
                    type="number"
                    value={activeElement.toString().startsWith('text-')
                      ? ticketElements.customTexts.find(t => t.id === activeElement)?.position.x || 0
                      : (ticketElements as any)[activeElement]?.x || 0}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (activeElement.toString().startsWith('text-')) {
                        onUpdateCustomText(activeElement as string, { position: { ...ticketElements.customTexts.find(t => t.id === activeElement)!.position, x: val } });
                      } else {
                        onUpdateElement(activeElement as TicketElementKey, { x: val });
                      }
                    }}
                    className="h-9 bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 uppercase">Y Position</Label>
                  <Input
                    type="number"
                    value={activeElement.toString().startsWith('text-')
                      ? ticketElements.customTexts.find(t => t.id === activeElement)?.position.y || 0
                      : (ticketElements as any)[activeElement]?.y || 0}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (activeElement.toString().startsWith('text-')) {
                        onUpdateCustomText(activeElement as string, { position: { ...ticketElements.customTexts.find(t => t.id === activeElement)!.position, y: val } });
                      } else {
                        onUpdateElement(activeElement as TicketElementKey, { y: val });
                      }
                    }}
                    className="h-9 bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 uppercase">Width</Label>
                  <Input
                    type="number"
                    value={activeElement.toString().startsWith('text-')
                      ? ticketElements.customTexts.find(t => t.id === activeElement)?.position.width || 0
                      : (ticketElements as any)[activeElement]?.width || 0}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (activeElement.toString().startsWith('text-')) {
                        onUpdateCustomText(activeElement as string, { position: { ...ticketElements.customTexts.find(t => t.id === activeElement)!.position, width: val } });
                      } else {
                        onUpdateElement(activeElement as TicketElementKey, { width: val });
                      }
                    }}
                    className="h-9 bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-500 uppercase">Height</Label>
                  <Input
                    type="number"
                    value={activeElement.toString().startsWith('text-')
                      ? ticketElements.customTexts.find(t => t.id === activeElement)?.position.height || 0
                      : (ticketElements as any)[activeElement]?.height || 0}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (activeElement.toString().startsWith('text-')) {
                        onUpdateCustomText(activeElement as string, { position: { ...ticketElements.customTexts.find(t => t.id === activeElement)!.position, height: val } });
                      } else {
                        onUpdateElement(activeElement as TicketElementKey, { height: val });
                      }
                    }}
                    className="h-9 bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Typography Section for Text Elements */}
            {activeElement.toString().startsWith('text-') && (() => {
              const textElement = ticketElements.customTexts.find(t => t.id === activeElement);
              if (!textElement) return null;

              return (
                <div className="space-y-6">
                  {/* Text Content */}
                  <div className="space-y-2">
                    <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Content</Label>
                    <Textarea
                      value={textElement.content || ""}
                      onChange={e => onUpdateCustomText(textElement.id, { content: e.target.value })}
                      className="bg-slate-800/50 border-slate-700/50 text-sm h-24 focus:ring-indigo-500/50"
                      placeholder="Enter text..."
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['{ZONE}', '{ROW}', '{SEAT}', '{NAME}', '{TNAME}', '{EMAIL}', '{PHONE}', '{PRICE}', '{BOOKING_ID}', '{SEAT_ID}'].map(ph => (
                        <button
                          key={ph}
                          onClick={() => onUpdateCustomText(textElement.id, { content: (textElement.content || "") + ph })}
                          className="text-[9px] px-2 py-1 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors text-slate-400 hover:text-white font-mono"
                        >
                          {ph}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography Settings */}
                  <div className="space-y-4">
                    <div onClick={() => toggleSection('typography')} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Typography</span>
                      </div>
                      <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform ${expandedSections.typography ? '' : '-rotate-90'}`} />
                    </div>

                    {expandedSections.typography && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-500 uppercase">Font Family</Label>
                          <Select
                            value={textElement.position.fontFamily}
                            onValueChange={val => onUpdateCustomText(textElement.id, { position: { ...textElement.position, fontFamily: val } })}
                          >
                            <SelectTrigger className="h-9 bg-slate-800/50 border-slate-700/50 text-xs text-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                              {renderFontFamilyOptions()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase">Font Size</Label>
                            <Input
                              type="number"
                              value={textElement.position.fontSize || 0}
                              onChange={e => onUpdateCustomText(textElement.id, { position: { ...textElement.position, fontSize: parseInt(e.target.value) || 12 } })}
                              className="h-9 bg-slate-800/50 border-slate-700/50"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase">Color</Label>
                            <div className="flex gap-2">
                              <div className="relative w-9 h-9 flex-shrink-0">
                                <Input
                                  type="color"
                                  value={textElement.position.fontColor || "#ffffff"}
                                  onChange={e => onUpdateCustomText(textElement.id, { position: { ...textElement.position, fontColor: e.target.value } })}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div
                                  className="w-full h-full rounded-lg border border-slate-700"
                                  style={{ backgroundColor: textElement.position.fontColor || "#ffffff" }}
                                />
                              </div>
                              <Input
                                type="text"
                                value={textElement.position.fontColor || "#ffffff"}
                                onChange={e => onUpdateCustomText(textElement.id, { position: { ...textElement.position, fontColor: e.target.value } })}
                                className="h-9 bg-slate-800/50 border-slate-700/50 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase">Weight</Label>
                            <Select
                              value={textElement.position.fontWeight || 'normal'}
                              onValueChange={val => onUpdateCustomText(textElement.id, { position: { ...textElement.position, fontWeight: val } })}
                            >
                              <SelectTrigger className="h-9 bg-slate-800/50 border-slate-700/50 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                                <SelectItem value="300">Light</SelectItem>
                                <SelectItem value="900">Black</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-500 uppercase">Alignment</Label>
                            <Select
                              value={textElement.position.textAlign || 'left'}
                              onValueChange={val => onUpdateCustomText(textElement.id, { position: { ...textElement.position, textAlign: val } })}
                            >
                              <SelectTrigger className="h-9 bg-slate-800/50 border-slate-700/50 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-700">
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Appearance Section for QR */}
            {activeElement === 'qrCode' && (
              <div className="space-y-4">
                <div onClick={() => toggleSection('appearance')} className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">QR Styles</span>
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform ${expandedSections.appearance ? '' : '-rotate-90'}`} />
                </div>

                {expandedSections.appearance && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-slate-800/50">
                      <Label className="text-xs text-slate-300">Default Styles</Label>
                      <Button variant="outline" size="sm" onClick={() => onToggleVisibility('qrCode')} className="h-7 text-[10px] bg-slate-800 border-slate-700">
                        {ticketElements.qrCode.visible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                        {ticketElements.qrCode.visible ? 'Visible' : 'Hidden'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 uppercase">Foreground</Label>
                        <div className="flex gap-2">
                          <div className="relative w-9 h-9 flex-shrink-0">
                            <Input
                              type="color"
                              value={qrForegroundColor || "#000000"}
                              onChange={e => setQrForegroundColor(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full rounded-lg border border-slate-700" style={{ backgroundColor: qrForegroundColor || "#000000" }} />
                          </div>
                          <Input type="text" value={qrForegroundColor || "#000000"} onChange={e => setQrForegroundColor(e.target.value)} className="h-9 bg-slate-800/50 border-slate-700/50 text-[10px] font-mono" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-slate-500 uppercase">Background</Label>
                        <div className="flex gap-2">
                          <div className="relative w-9 h-9 flex-shrink-0">
                            <Input
                              type="color"
                              value={qrBackgroundColor || "#ffffff"}
                              onChange={e => setQrBackgroundColor(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="w-full h-full rounded-lg border border-slate-700" style={{ backgroundColor: qrBackgroundColor || "#ffffff" }} />
                          </div>
                          <Input type="text" value={qrBackgroundColor || "#ffffff"} onChange={e => setQrBackgroundColor(e.target.value)} className="h-9 bg-slate-800/50 border-slate-700/50 text-[10px] font-mono" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete Element Button for Text Elements */}
            {activeElement.toString().startsWith('text-') && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                onClick={() => onDeleteCustomText(activeElement as string)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Layer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Integrated Layer List */}
      <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div onClick={() => toggleSection('layers')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Layers</span>
          </div>
          <ChevronDown className={`h-3 w-3 text-slate-600 transition-transform ${expandedSections.layers ? '' : '-rotate-90'}`} />
        </div>

        {expandedSections.layers && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
            <LayerList
              ticketElements={ticketElements}
              activeElement={activeElement}
              onSelectElement={onSelectElement}
              onToggleVisibility={onToggleVisibility}
              onDeleteElement={onDeleteCustomText}
            />
          </div>
        )}
      </div>
    </div>
  );
}
