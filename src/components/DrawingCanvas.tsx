import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Pen, 
  Square, 
  Circle, 
  Minus, 
  RotateCcw, 
  Palette, 
  Download, 
  Upload,
  Eraser,
  MousePointer,
  Triangle,
  Maximize2,
  Type,
  Hexagon,
  Star,
  Heart,
  ArrowRight
} from 'lucide-react';

interface DrawingCanvasProps {
  onSave?: (dataUrl: string) => void;
  initialData?: string;
  className?: string;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

type Tool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'select' | 'text' | 'hexagon' | 'star' | 'heart' | 'arrow';

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  type: Tool;
  points: Point[];
  color: string;
  lineWidth: number;
  startPoint?: Point;
  endPoint?: Point;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

export function DrawingCanvas({ onSave, initialData, className, isFullscreen = false, onFullscreenToggle }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(2);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');

  const colors = [
    '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
    '#FFC0CB', '#A52A2A', '#808080', '#87CEEB', '#F0E68C',
    '#000000'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }

    redraw();
  }, [elements]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (element.type === 'pen' || element.type === 'eraser') {
        if (element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      } else if (element.type === 'line' && element.startPoint && element.endPoint) {
        ctx.beginPath();
        ctx.moveTo(element.startPoint.x, element.startPoint.y);
        ctx.lineTo(element.endPoint.x, element.endPoint.y);
        ctx.stroke();
      } else if (element.type === 'rectangle' && element.startPoint && element.endPoint) {
        const width = element.endPoint.x - element.startPoint.x;
        const height = element.endPoint.y - element.startPoint.y;
        ctx.strokeRect(element.startPoint.x, element.startPoint.y, width, height);
      } else if (element.type === 'circle' && element.startPoint && element.endPoint) {
        const radius = Math.sqrt(
          Math.pow(element.endPoint.x - element.startPoint.x, 2) +
          Math.pow(element.endPoint.y - element.startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(element.startPoint.x, element.startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (element.type === 'triangle' && element.startPoint && element.endPoint) {
        const width = element.endPoint.x - element.startPoint.x;
        const height = element.endPoint.y - element.startPoint.y;
        ctx.beginPath();
        ctx.moveTo(element.startPoint.x + width / 2, element.startPoint.y);
        ctx.lineTo(element.startPoint.x, element.startPoint.y + height);
        ctx.lineTo(element.startPoint.x + width, element.startPoint.y + height);
        ctx.closePath();
        ctx.stroke();
      } else if (element.type === 'text' && element.startPoint && element.text) {
        ctx.fillStyle = element.color;
        ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
        ctx.fillText(element.text, element.startPoint.x, element.startPoint.y);
      }
    });
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      const newElement: DrawingElement = {
        type: tool,
        points: [point],
        color: tool === 'eraser' ? '#000000' : color,
        lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth
      };
      setCurrentElement(newElement);
    } else if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newElement: DrawingElement = {
          type: tool,
          points: [],
          color,
          lineWidth,
          startPoint: point,
          text,
          fontSize,
          fontFamily
        };
        setElements(prev => [...prev, newElement]);
      }
    } else if (['line', 'rectangle', 'circle', 'triangle', 'hexagon', 'star', 'heart', 'arrow'].includes(tool)) {
      const newElement: DrawingElement = {
        type: tool as Tool,
        points: [],
        color,
        lineWidth,
        startPoint: point,
        endPoint: point
      };
      setCurrentElement(newElement);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;

    const point = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      setCurrentElement(prev => prev ? {
        ...prev,
        points: [...prev.points, point]
      } : null);
    } else if (['line', 'rectangle', 'circle', 'triangle', 'hexagon', 'star', 'heart', 'arrow'].includes(tool)) {
      setCurrentElement(prev => prev ? {
        ...prev,
        endPoint: point
      } : null);
    }
  };

  const handleMouseUp = () => {
    if (currentElement) {
      setElements(prev => [...prev, currentElement]);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setElements([]);
    setCurrentElement(null);
  };

  const undo = () => {
    setElements(prev => prev.slice(0, -1));
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataUrl);
    }

    // Also trigger download
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const loadDrawing = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setElements([]); // Clear current elements when loading new image
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openFullscreen = () => {
    setIsFullscreenDialogOpen(true);
  };

  const canvasContent = (
    <div className={`border rounded-lg bg-black ${className} ${isFullscreen ? 'h-full' : ''}`}>
      {/* Toolbar */}
      <div className="p-3 border-b bg-gray-900 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={tool === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('select')}
              className="p-2"
            >
              <MousePointer className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pen')}
              className="p-2"
            >
              <Pen className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('eraser')}
              className="p-2"
            >
              <Eraser className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Shape Tools */}
          <div className="flex items-center gap-1">
            <Button
              variant={tool === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('line')}
              className="p-2"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
              className="p-2"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
              className="p-2"
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              variant={tool === 'triangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('triangle')}
              className="p-2"
            >
              <Triangle className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Tool */}
          <div className="flex items-center gap-1">
            <Button
              variant={tool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('text')}
              className="p-2"
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Line Width & Text Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">Width:</span>
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm bg-gray-800 text-white border-gray-600"
            >
              <option value={1}>1px</option>
              <option value={2}>2px</option>
              <option value={3}>3px</option>
              <option value={5}>5px</option>
              <option value={8}>8px</option>
              <option value={12}>12px</option>
            </select>
          </div>
          
          {tool === 'text' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">Font:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm bg-gray-800 text-white border-gray-600"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={24}>24px</option>
                <option value={32}>32px</option>
                <option value={48}>48px</option>
              </select>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="border rounded px-2 py-1 text-sm bg-gray-800 text-white border-gray-600"
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times</option>
                <option value="Courier New">Courier</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
          )}

          <Separator orientation="vertical" className="h-6" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-white" />
            {colors.slice(0, 8).map((c) => (
              <button
                key={c}
                className={`w-6 h-6 rounded border-2 ${
                  color === c ? 'border-blue-400' : 'border-gray-500'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded border border-gray-500 cursor-pointer"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={elements.length === 0}
              className="p-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              disabled={elements.length === 0}
              className="p-2"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveDrawing}
              className="p-2"
            >
              <Download className="w-4 h-4" />
            </Button>
            <label className="cursor-pointer">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="p-2"
              >
                <span>
                  <Upload className="w-4 h-4" />
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={loadDrawing}
                className="hidden"
              />
            </label>
            {!isFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={openFullscreen}
                className="p-2"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );

  if (isFullscreen) {
    return canvasContent;
  }

  return (
    <>
      {canvasContent}
      
      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenDialogOpen} onOpenChange={setIsFullscreenDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <DialogHeader>
            <DialogTitle>Drawing Canvas - Fullscreen</DialogTitle>
          </DialogHeader>
          <div className="h-[80vh]">
            <DrawingCanvas
              onSave={onSave}
              initialData={initialData}
              className="h-full"
              isFullscreen={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}