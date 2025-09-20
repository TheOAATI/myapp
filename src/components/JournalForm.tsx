import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DrawingCanvas } from './DrawingCanvas';
import { toast } from "sonner";
import { JournalEntry, JournalFormData } from '../types/journal';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Palette,
  FileText,
  Brush,
  Camera,
  Upload,
  X,
  Plus,
  Hash
} from 'lucide-react';

interface JournalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: JournalFormData) => void;
  onUpdate?: (id: string, entry: JournalFormData) => void;
  entry?: JournalEntry | null;
  initialDate?: string;
}

export function JournalForm({ isOpen, onClose, onSubmit, onUpdate, entry, initialDate }: JournalFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [drawings, setDrawings] = useState<{url: string}[]>([]);
  const [photos, setPhotos] = useState<{url: string, caption?: string}[]>([]);
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setTags(entry.tags || []);
      const decodedContent = decodeHtml(entry.content || '');
      setContent(decodedContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = decodedContent;
      }
      setDrawings(entry.drawings || []);
      setPhotos(entry.photos || []);
      setMood(entry.mood || '');
      setDate(entry.date || '');
    } else {
      setTitle('');
      setTags([]);
      setContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setDrawings([]); 
      setPhotos([]);
      setMood('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
    }
  }, [entry, initialDate, isOpen]);

const handleEditorInput = () => {
  if (editorRef.current) {
    setContent(editorRef.current.innerHTML);
  }
};

useEffect(() => {
  const editor = editorRef.current;
  if (!editor) return;

  const updatePlaceholder = () => {
    if (editor.innerHTML.trim() === '') {
      editor.classList.add('empty');
    } else {
      editor.classList.remove('empty');
    }
  };

  updatePlaceholder();
  editor.addEventListener('input', updatePlaceholder);
  return () => editor.removeEventListener('input', updatePlaceholder);
}, []);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title for your journal entry');
      return;
    }

    if (!content.trim() && (!editorRef.current || !editorRef.current.innerText.trim())) {
      toast.error('Please write some content for your journal entry');
      return;
    }

    const finalContent = editorRef.current?.innerHTML || content;
    
    const journalData = {
      title: title.trim(),
      content: finalContent,
      date,
      drawings,
      photos,
      mood: mood.trim(),
      tags: tags.filter(tag => tag.trim().length > 0)
    };

    if (entry && onUpdate) {
      onUpdate(entry.id, journalData);
    } else {
      onSubmit(journalData);
    }

    toast.success(entry ? 'Journal entry updated!' : 'Journal entry created!');
    onClose();
  };

  const handleDrawingSave = (drawingData: string) => {
    setDrawings(prev => [...prev, {url: drawingData}]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setPhotos(prev => [...prev, {url: result}]);
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Update toolbarButtons to use proper typing for icons
  interface ToolbarButton {
    command: string;
    icon?: React.ComponentType<{ className?: string }>;
    label?: string;
    value?: string;
  }
  
  const toolbarButtons: ToolbarButton[] = [
    { command: 'bold', icon: Bold, label: 'Bold' },
    { command: 'italic', icon: Italic, label: 'Italic' },
    { command: 'underline', icon: Underline, label: 'Underline' },
    { command: 'separator' },
    { command: 'justifyLeft', icon: AlignLeft, label: 'Align Left' },
    { command: 'justifyCenter', icon: AlignCenter, label: 'Align Center' },
    { command: 'justifyRight', icon: AlignRight, label: 'Align Right' },
    { command: 'separator' },
    { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' },
    { command: 'formatBlock', icon: Quote, label: 'Quote', value: 'blockquote' },
    { command: 'separator' },
    { command: 'undo', icon: Undo, label: 'Undo' },
    { command: 'redo', icon: Redo, label: 'Redo' },
  ];

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95%] max-h-[90vh] overflow-auto flex flex-col mx-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? 'Edit Journal Entry' : 'Create Journal Entry'}
          </DialogTitle>
          <DialogDescription>
            {entry ? 'Edit your journal entry with rich text formatting options.' : 'Create a new journal entry with rich text formatting options.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter journal title..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mood">Mood (optional)</Label>
                <Input
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="How are you feeling?"
                />
              </div>
              <div className="space-y-2">
                <Label>Photos</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full"
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add tags..."
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
                    >
                      <Hash className="w-3 h-3" />
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Content Tabs */}
          <Tabs defaultValue="text" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Text Editor
              </TabsTrigger>
              <TabsTrigger value="drawing" className="flex items-center gap-2">
                <Brush className="w-4 h-4" />
                Drawing Canvas
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="flex-1 flex flex-col overflow-hidden mt-4">
              {/* Rich Text Editor Toolbar */}
              <div className="border rounded-t-lg p-2 bg-muted/30">
                <div className="flex flex-wrap items-center gap-1">
                  // In the toolbar section, replace the map with proper JSX component rendering
                  {toolbarButtons.map((button, index) => {
                  if (button.command === 'separator') {
                  return <Separator key={index} orientation="vertical" className="h-6 mx-1" />;
                  }
                  if (!button.icon) return null;
                  const Icon = button.icon;
                  return (
                  <Button
                  key={button.command}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => executeCommand(button.command, button.value)}
                  title={button.label}
                  className="h-8 w-8 p-0"
                  >
                  <Icon className="w-4 h-4" />
                  </Button>
                  );
                  })}
                </div>
              </div>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="w-full flex-1 min-h-[300px] p-4 focus:outline-none bg-background overflow-y-auto relative empty:before:content-['Start_writing_your_journal_entry...'] empty:before:text-muted-foreground empty:before:absolute empty:before:top-4 empty:before:left-4 empty:before:pointer-events-none"
                style={{ lineHeight: '1.6', fontFamily: 'inherit' }}
                suppressContentEditableWarning={true}
              />
            </TabsContent>
            
            <TabsContent value="drawing" className="flex-1 overflow-hidden mt-4">
              <DrawingCanvas 
                onSave={handleDrawingSave}
                className="h-full"
              />
              
              {/* Saved Drawings */}
              {drawings.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                  <h4 className="text-sm font-medium mb-3">Saved Drawings ({drawings.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {drawings.map((drawing, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={drawing.url} 
                          alt={`Drawing ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                          onClick={() => setDrawings(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="flex-1 overflow-hidden mt-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Photo Gallery</h3>
                  <div className="relative">
                    <Button type="button" variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Add Photos
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {photos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No photos added yet</p>
                    <p className="text-sm">Click "Add Photos" to upload images</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            // Create a modal to view full image
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                            modal.innerHTML = `<img src="${photo.url}" class="max-w-full max-h-full object-contain" />`;
                            modal.onclick = () => document.body.removeChild(modal);
                            document.body.appendChild(modal);
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {entry ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}