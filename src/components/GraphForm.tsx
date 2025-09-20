import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import { Graph } from '../types/graph';
import * as math from 'mathjs';
import { format } from 'date-fns';
import { addStyles as addMathquillStyles, EditableMathField, StaticMathField } from 'react-mathquill';
import { parseTex } from 'tex-math-parser';

interface GraphFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { equation: string; date: string }) => void;
  initialDate?: Date;
  initialGraph?: Graph;
  onDelete?: (graphId: string) => void;
}

const GraphForm = ({ open, onOpenChange, onSave, initialDate, initialGraph, onDelete }: GraphFormProps) => {
  const isViewMode = !!initialGraph;
  const [equation, setEquation] = useState(initialGraph?.equation || '');
  const [date, setDate] = useState<Date>(initialGraph ? new Date(initialGraph.date) : initialDate || new Date());
  const [data, setData] = useState<{ x: number; y: number | null }[]>([]);
  const [asymptotes, setAsymptotes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-10);
  const [yMax, setYMax] = useState<number>(10);
  const [initialPlot, setInitialPlot] = useState<boolean>(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const [plotted, setPlotted] = useState<boolean>(false);

  useEffect(() => {
    addMathquillStyles();
  }, []);

  useEffect(() => {
    if (isViewMode) {
      handlePlot();
    }
  }, [equation, isViewMode]);

  useEffect(() => {
    setDate(initialDate ?? new Date());
  }, [initialDate]);

  useEffect(() => {
    setInitialPlot(true);
    setXMin(-10);
    setXMax(10);
    setYMin(-10);
    setYMax(10);
    setPlotted(false);
  }, [equation]);

  useEffect(() => {
    if (plotted && equation) handlePlot();
  }, [plotted, equation, xMin, xMax, yMin, yMax]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const chartX = xMin + (mouseX / rect.width) * (xMax - xMin);
      const chartY = yMax - (mouseY / rect.height) * (yMax - yMin);
      const isZoomIn = e.deltaY < 0;
      const factor = isZoomIn ? 0.8 : 1.25;
      const newXMin = chartX - (chartX - xMin) * factor;
      const newXMax = chartX + (xMax - chartX) * factor;
      const newYMin = chartY - (chartY - yMin) * factor;
      const newYMax = chartY + (yMax - chartY) * factor;
      setXMin(newXMin);
      setXMax(newXMax);
      setYMin(newYMin);
      setYMax(newYMax);
    };
    const chart = chartRef.current;
    if (chart) {
      chart.addEventListener('wheel', handleWheel as EventListener);
    }
    return () => {
      if (chart) {
        chart.removeEventListener('wheel', handleWheel as EventListener);
      }
    };
  }, [xMin, xMax, yMin, yMax]);

  const handlePlot = () => {
    try {
      const node = parseTex(equation);
      const compiled = node.compile();
      const asympts = computeAsymptotes(equation, xMin, xMax);
      const sortedAsympts = asympts.sort((a, b) => a - b);
      const numPoints = 1000;
      const step = (xMax - xMin) / numPoints;
      const newData: { x: number; y: number | null }[] = [];
      for (let x = xMin; x <= xMax + step / 2; x += step) {
        let y;
        try {
          y = compiled.evaluate({ x });
        } catch (e) {
          y = null;
        }
        if (!isFinite(y)) y = null;
        newData.push({ x, y });
      }
      // Insert null points at exact asymptote positions to break the line
      sortedAsympts.forEach(asymp => {
        newData.push({ x: asymp, y: null });
      });
      // Sort by x
      newData.sort((a, b) => a.x - b.x);
      setData(newData);
      setAsymptotes(sortedAsympts);

      if (initialPlot && newData.length > 0) {
        const finiteY = newData.filter(d => d.y !== null && isFinite(d.y)).map(d => d.y);
        if (finiteY.length > 0) {
          const minY = Math.min(...finiteY);
          const maxY = Math.max(...finiteY);
          const padding = (maxY - minY) * 0.1 || 1;
          setYMin(minY - padding);
          setYMax(maxY + padding);
        }
        setInitialPlot(false);
      }

      setPlotted(true);
      setError(null);
    } catch (error) {
      console.error('Invalid equation', error);
      setData([]);
      setError(error instanceof Error ? error.message : 'Invalid equation');
    }
  };

  const handleSubmit = () => {
    if (date) {
      onSave({ equation, date: format(date, 'yyyy-MM-dd') });
      onOpenChange(false);
    }
  };

  const zoomIn = () => {
    const factor = 0.8;
    const centerX = (xMin + xMax) / 2;
    const centerY = (yMin + yMax) / 2;
    setXMin(centerX - (centerX - xMin) * factor);
    setXMax(centerX + (xMax - centerX) * factor);
    setYMin(centerY - (centerY - yMin) * factor);
    setYMax(centerY + (yMax - centerY) * factor);
  };

  const zoomOut = () => {
    const factor = 1.25;
    const centerX = (xMin + xMax) / 2;
    const centerY = (yMin + yMax) / 2;
    setXMin(centerX - (centerX - xMin) * factor);
    setXMax(centerX + (xMax - centerX) * factor);
    setYMin(centerY - (centerY - yMin) * factor);
    setYMax(centerY + (yMax - centerY) * factor);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95%] mx-auto">
        <DialogHeader>
          <DialogTitle>{isViewMode ? 'View Graph' : 'Create Graph'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="equation" className="text-right">
              Equation
            </Label>
            <div className="col-span-3 border rounded-md p-2">
              {isViewMode ? (
                <StaticMathField latex={equation} />
              ) : (
                <EditableMathField
                  latex={equation}
                  onChange={(mathField) => setEquation(mathField.latex())}
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Date</Label>
            <div className="col-span-3">{date ? format(date, 'yyyy-MM-dd') : 'No date selected'}</div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          {!isViewMode && <Button onClick={handlePlot}>Plot Graph</Button>}
          {data.length > 0 && (
            <>
              <div ref={chartRef} style={{ userSelect: 'none' }}>
                <LineChart width={400} height={300} data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" domain={[xMin, xMax]} />
                  <YAxis domain={[yMin, yMax]} />
                  <Tooltip />
                  <Legend />
                  {asymptotes.map((asymp, index) => (
                    <ReferenceLine key={index} x={asymp} stroke="red" strokeDasharray="5 5" />
                  ))}
                  <Line type="monotone" dataKey="y" stroke="#8884d8" connectNulls={false} />
                </LineChart>
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="icon" onClick={zoomIn}>
                  <Plus size={16} />
                </Button>
                <Button variant="outline" size="icon" onClick={zoomOut}>
                  <Minus size={16} />
                </Button>
              </div>
            </>
          )}
          <DialogFooter>
            {!isViewMode && <Button onClick={handleSubmit}>Finish</Button>}
            {isViewMode && onDelete && initialGraph && (
              <Button variant="destructive" onClick={() => {
                onDelete(initialGraph.id);
                onOpenChange(false);
              }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Graph
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GraphForm;

function computeAsymptotes(eq: string, minX: number, maxX: number): number[] {
  let node;
  try {
    node = parseTex(eq);
  } catch (e) {
    return [];
  }
  if (node.type !== 'FunctionNode') return [];
  const funcNode = node as math.FunctionNode;
  const funcName = funcNode.fn.name;
  if (!['tan', 'cot', 'sec', 'csc'].includes(funcName)) return [];
  const arg = funcNode.args[0];
  const argCompiled = arg.compile();
  const evalAt = (x: number) => argCompiled.evaluate({x});
  const b = evalAt(0);
  const at1 = evalAt(1);
  const a = at1 - b;
  const at2 = evalAt(2);
  const expected = a*2 + b;
  if (Math.abs(at2 - expected) > 1e-10) return []; // not linear, tightened tolerance
  if (Math.abs(a) < 1e-10) return []; // constant
  let offset, period;
  if (funcName === 'tan' || funcName === 'sec') {
    offset = Math.PI / 2;
    period = Math.PI;
  } else {
    offset = 0;
    period = Math.PI;
  }
  const minArg = Math.min(evalAt(minX), evalAt(maxX));
  const maxArg = Math.max(evalAt(minX), evalAt(maxX));
  const kStart = Math.floor((minArg - offset) / period);
  const kEnd = Math.ceil((maxArg - offset) / period);
  const asymptotes: number[] = [];
  for (let k = kStart; k <= kEnd; k++) {
    const argVal = offset + k * period;
    const x = (argVal - b) / a;
    if (x >= minX && x <= maxX) {
      asymptotes.push(x);
    }
  }
  return asymptotes.sort((p, q) => p - q);
}