import { Graph } from '../types/graph';

const STORAGE_KEY = 'calendar-graphs';

export const graphStorage = {
  getGraphs: (): Graph[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveGraphs: (graphs: Graph[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graphs));
  },

  addGraph: (graph: Omit<Graph, 'id' | 'createdAt'>): Graph => {
    const graphs = graphStorage.getGraphs();
    const newGraph: Graph = {
      ...graph,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    graphs.push(newGraph);
    graphStorage.saveGraphs(graphs);
    return newGraph;
  },

  getGraphsForDate: (date: string): Graph[] => {
    const graphs = graphStorage.getGraphs();
    return graphs.filter(graph => graph.date === date);
  },
  
  deleteGraph: (graphId: string): boolean => {
    try {
      const graphs = graphStorage.getGraphs();
      const filteredGraphs = graphs.filter(graph => graph.id !== graphId);
      
      // If no graphs were removed, return false
      if (filteredGraphs.length === graphs.length) {
        return false;
      }
      
      graphStorage.saveGraphs(filteredGraphs);
      return true;
    } catch (error) {
      console.error('Error deleting graph:', error);
      return false;
    }
  },
};