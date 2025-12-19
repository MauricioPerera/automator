
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
  MarkerType,
  OnNodesDelete,
  OnEdgesDelete,
} from 'reactflow';
import { INITIAL_NODES, INITIAL_EDGES } from './constants';
import { NodeType, CustomNode, NodeData } from './types';
import CustomNodeComponent from './components/CustomNode';
import EditorPanel from './components/EditorPanel';
import NodeLibrary from './components/NodeLibrary';
import { 
  Play, 
  Share2, 
  Save, 
  MoreVertical, 
  Github, 
  Zap, 
  Undo2, 
  Redo2, 
  FolderOpen, 
  Trash2, 
  Clock, 
  Edit2, 
  Check,
  Download,
  Settings,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  ShieldAlert,
  FilePlus,
  Copy,
  CheckCircle,
  X,
  // Added missing Info icon import
  Info
} from 'lucide-react';
import { runGeminiTask } from './services/geminiService';

const nodeTypes = {
  customNode: CustomNodeComponent,
};

interface HistoryState {
  nodes: CustomNode[];
  edges: Edge[];
}

interface SavedWorkflow {
  id: string;
  name: string;
  version: number;
  nodes: CustomNode[];
  edges: Edge[];
  timestamp: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const STORAGE_KEY = 'n8n-clone-storage';
const DRAFT_KEY = 'n8n-clone-draft';
const SETTINGS_KEY = 'n8n-clone-settings';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<CustomNode[]>(INITIAL_NODES as CustomNode[]);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [workflowName, setWorkflowName] = useState('Gemini Story Generator');
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadMenuOpen, setIsLoadMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Settings State
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30); // seconds
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const workflowNameRef = useRef(workflowName);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    workflowNameRef.current = workflowName;
  }, [nodes, edges, workflowName]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Initial Load
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedWorkflows(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved workflows", e);
      }
    }

    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const s = JSON.parse(storedSettings);
        setAutoSaveEnabled(s.autoSaveEnabled ?? true);
        setAutoSaveInterval(s.autoSaveInterval ?? 30);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setNodes(d.nodes);
        setEdges(d.edges);
        setWorkflowName(d.name || 'Untitled Workflow');
        if (d.id) setCurrentWorkflowId(d.id);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Save Settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoSaveEnabled, autoSaveInterval }));
  }, [autoSaveEnabled, autoSaveInterval]);

  // Auto-Save Logic
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      const draftData = {
        id: currentWorkflowId,
        name: workflowNameRef.current,
        nodes: nodesRef.current,
        edges: edgesRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setLastAutoSave(Date.now());
    }, autoSaveInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSaveEnabled, autoSaveInterval, currentWorkflowId]);

  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const takeSnapshot = useCallback(() => {
    setPast((prev) => [...prev, { nodes: [...nodesRef.current], edges: [...edgesRef.current] }]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture((prev) => [{ nodes: [...nodesRef.current], edges: [...edgesRef.current] }, ...prev]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setPast(newPast);
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [...prev, { nodes: [...nodesRef.current], edges: [...edgesRef.current] }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture(newFuture);
  }, [future]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveWorkflow();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        exportWorkflow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as CustomNode[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodesRef.current.find((n) => n.id === connection.source);
    const targetNode = nodesRef.current.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;
    if (sourceNode.id === targetNode.id) return false;

    if (targetNode.data.type === NodeType.TRIGGER) {
      setValidationError("Trigger nodes cannot receive inputs.");
      setTimeout(() => setValidationError(null), 3000);
      return false;
    }

    if (sourceNode.data.type === NodeType.LOG && targetNode.data.type === NodeType.AI_GENERATE) {
      setValidationError("Incompatible nodes: Log output cannot feed back into AI generation.");
      setTimeout(() => setValidationError(null), 3000);
      return false;
    }

    return true;
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } }, eds));
    },
    [takeSnapshot]
  );

  const onNodeDragStop = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodesDelete: OnNodesDelete = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onEdgesDelete: OnEdgesDelete = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: CustomNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setIsLoadMenuOpen(false);
    setIsSettingsOpen(false);
  }, []);

  const handleUpdateNodeConfig = useCallback((id: string, config: Record<string, any>) => {
    takeSnapshot();
    setNodes((nds) => 
      nds.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, config } } : node
      )
    );
  }, [takeSnapshot]);

  const addNode = useCallback((type: NodeType) => {
    takeSnapshot();
    const newNode: CustomNode = {
      id: `node-${Date.now()}`,
      type: 'customNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `New ${type.replace('_', ' ')}`,
        type,
        config: { retryCount: 0, continueOnError: 'false' },
        status: 'idle',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);
  }, [takeSnapshot]);

  const clearCanvas = useCallback(() => {
    if (confirm("Clear current canvas? Unsaved changes will be lost.")) {
      setNodes([]);
      setEdges([]);
      setWorkflowName('Untitled Workflow');
      setCurrentWorkflowId(null);
      addToast("Canvas cleared", "info");
    }
  }, []);

  const saveWorkflow = useCallback((saveAs = false) => {
    let name = workflowName;
    let id = currentWorkflowId;
    let updatedWorkflows = [...savedWorkflows];

    // If "Save As" or no ID exists, prompt for a name
    if (saveAs || !id) {
      const promptedName = window.prompt("Enter a name for this workflow:", name);
      if (promptedName === null) return; // User cancelled
      name = promptedName || 'Untitled Workflow';
      setWorkflowName(name);
      
      // If we are saving as a NEW workflow (id becomes null)
      if (saveAs) id = null;
    }

    if (id) {
      // OVERWRITE EXISTING
      updatedWorkflows = updatedWorkflows.map(wf => 
        wf.id === id 
          ? { ...wf, name, nodes: nodesRef.current, edges: edgesRef.current, timestamp: Date.now() } 
          : wf
      );
      addToast(`Updated workflow: ${name}`);
    } else {
      // CREATE NEW
      const newId = `wf-${Date.now()}`;
      const newWorkflow: SavedWorkflow = {
        id: newId,
        name,
        version: 1,
        nodes: nodesRef.current,
        edges: edgesRef.current,
        timestamp: Date.now(),
      };
      updatedWorkflows = [newWorkflow, ...updatedWorkflows];
      setCurrentWorkflowId(newId);
      addToast(`Saved new workflow: ${name}`);
    }

    setSavedWorkflows(updatedWorkflows);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkflows));
  }, [savedWorkflows, workflowName, currentWorkflowId]);

  const exportWorkflow = useCallback(() => {
    const data = {
      name: workflowName,
      nodes: nodesRef.current,
      edges: edgesRef.current,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '_')}_workflow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Workflow exported as JSON");
  }, [workflowName]);

  const loadWorkflow = useCallback((wf: SavedWorkflow) => {
    takeSnapshot();
    setNodes(wf.nodes);
    setEdges(wf.edges);
    setWorkflowName(wf.name);
    setCurrentWorkflowId(wf.id);
    setIsLoadMenuOpen(false);
    addToast(`Loaded workflow: ${wf.name}`, "info");
  }, [takeSnapshot]);

  const deleteSavedWorkflow = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved workflow?")) return;
    const updated = savedWorkflows.filter(wf => wf.id !== id);
    setSavedWorkflows(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (currentWorkflowId === id) setCurrentWorkflowId(null);
    addToast("Workflow deleted", "info");
  }, [savedWorkflows, currentWorkflowId]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const executeNode = async (nodeId: string, inputData: any) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    const maxRetries = Number(node.data.config.retryCount) || 0;
    const continueOnError = node.data.config.continueOnError === 'true';
    
    let currentAttempt = 0;
    let success = false;
    let result = null;
    let lastError = "";
    let branchToFollow: string | null = null;

    setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'running', errorDetails: undefined } } : n));

    while (currentAttempt <= maxRetries && !success) {
      try {
        if (currentAttempt > 0) {
          await new Promise(r => setTimeout(r, 1000 * currentAttempt));
        }

        switch (node.data.type) {
          case NodeType.TRIGGER:
            result = { triggeredAt: new Date().toISOString() };
            break;
          case NodeType.AI_GENERATE:
            const rawPrompt = node.data.config.prompt || "Hello";
            const processedPrompt = rawPrompt.replace(/\{\{input\}\}/g, typeof inputData === 'string' ? inputData : JSON.stringify(inputData));
            const model = node.data.config.model || 'gemini-3-flash-preview';
            result = await runGeminiTask(processedPrompt, model);
            break;
          case NodeType.LOG:
            console.log(`WORKFLOW LOG [${node.data.config.prefix || 'Result'}]:`, inputData);
            result = inputData;
            break;
          case NodeType.HTTP_REQUEST:
            if (node.data.config.url?.includes('fail')) throw new Error("Mocked HTTP 500 Internal Server Error");
            result = { status: 200, url: node.data.config.url, data: "Response Body Mocked" };
            break;
          case NodeType.CONDITIONAL:
            const val = typeof inputData === 'string' ? inputData : JSON.stringify(inputData);
            const target = node.data.config.value || "";
            const op = node.data.config.operator || "contains";
            
            let isTrue = false;
            if (op === 'contains') isTrue = val.toLowerCase().includes(target.toLowerCase());
            else if (op === 'not_contains') isTrue = !val.toLowerCase().includes(target.toLowerCase());
            else if (op === 'equals') isTrue = val === target;
            
            branchToFollow = isTrue ? 'true' : 'false';
            result = inputData;
            break;
          default:
            result = "No action defined";
        }
        success = true;
      } catch (error) {
        currentAttempt++;
        lastError = error instanceof Error ? error.message : "Execution failed";
      }
    }

    if (success) {
      setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'success', lastResult: result } } : n));
      const nextEdges = edgesRef.current.filter(e => e.source === node.id);
      for (const edge of nextEdges) {
        if (node.data.type === NodeType.CONDITIONAL) {
          if (edge.sourceHandle === branchToFollow) {
            await executeNode(edge.target, result);
          }
        } else {
          await executeNode(edge.target, result);
        }
      }
    } else {
      const finalStatus = continueOnError ? 'warning' : 'error';
      setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: finalStatus, errorDetails: lastError } } : n));

      if (continueOnError) {
        const nextEdges = edgesRef.current.filter(e => e.source === node.id);
        for (const edge of nextEdges) {
          await executeNode(edge.target, { _error: lastError, _failedNode: node.id });
        }
      } else {
        throw new Error(`Execution stopped at node ${node.id}`);
      }
    }
  };

  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', lastResult: null, errorDetails: undefined } })));

    const triggerNode = nodes.find(n => n.data.type === NodeType.TRIGGER);
    if (!triggerNode) {
      addToast("No Trigger node found!", "error");
      setIsExecuting(false);
      return;
    }

    try {
      await executeNode(triggerNode.id, null);
      addToast("Workflow execution completed successfully");
    } catch (err) {
      console.warn("Workflow Execution Halted:", err);
      addToast("Workflow execution failed", "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRetryNode = async (nodeId: string) => {
    if (isExecuting) return;
    setIsExecuting(true);
    try {
      const incomingEdge = edgesRef.current.find(e => e.target === nodeId);
      const predecessorNode = incomingEdge ? nodesRef.current.find(n => n.id === incomingEdge.source) : null;
      const input = predecessorNode?.data.lastResult || null;
      await executeNode(nodeId, input);
    } catch (err) {
      console.warn("Manual Retry Failed:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <NodeLibrary onAddNode={addNode} />

      <div className="flex-1 flex flex-col relative h-full">
        {/* Toast Notification Container */}
        <div className="fixed bottom-12 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div 
              key={toast.id} 
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto
                animate-in slide-in-from-right duration-300
                ${toast.type === 'success' ? 'bg-white border-green-100 text-slate-800' : 
                  toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
                  'bg-blue-50 border-blue-200 text-blue-800'}
              `}
            >
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-2 p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Transient Validation Error Alert */}
        {validationError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full shadow-lg">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold">{validationError}</span>
            </div>
          </div>
        )}

        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">n8n Clone <span className="text-blue-500">AI</span></h1>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div 
              className="flex flex-col group cursor-pointer"
              onClick={() => !isRenaming && setIsRenaming(true)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none">Workflow</span>
                {autoSaveEnabled && lastAutoSave && (
                  <span className="text-[10px] text-green-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    • Auto-saved {new Date(lastAutoSave).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {isRenaming ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      className="text-sm font-medium text-slate-700 leading-tight border-b border-blue-400 bg-transparent focus:outline-none w-48 py-0 px-0"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      onBlur={() => setIsRenaming(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsRenaming(false);
                        if (e.key === 'Escape') setIsRenaming(false);
                      }}
                    />
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" onClick={(e) => { e.stopPropagation(); setIsRenaming(false); }} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-[150px]">
                    <span className="text-sm font-medium text-slate-700 leading-tight">{workflowName}</span>
                    <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-slate-100 rounded-lg">
              <button 
                onClick={undo}
                disabled={past.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button 
                onClick={redo}
                disabled={future.length === 0}
                title="Redo (Ctrl+Y)"
                className="p-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={clearCanvas}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent"
              title="New Workflow (Clear Canvas)"
            >
              <FilePlus className="w-5 h-5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => { setIsLoadMenuOpen(!isLoadMenuOpen); setIsSettingsOpen(false); }}
                className={`p-2 rounded-lg transition-all border ${isLoadMenuOpen ? 'bg-slate-100 border-slate-300 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-transparent'}`}
                title="Open Saved Workflows"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              
              {isLoadMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saved Workflows</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{savedWorkflows.length}</span>
                  </div>
                  <div className="overflow-y-auto flex-1 py-1">
                    {savedWorkflows.length === 0 ? (
                      <div className="p-8 text-center">
                        <FolderOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 italic">No saved workflows yet</p>
                      </div>
                    ) : (
                      savedWorkflows.map(wf => (
                        <div 
                          key={wf.id}
                          onClick={() => loadWorkflow(wf)}
                          className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none flex flex-col group transition-colors ${currentWorkflowId === wf.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 truncate mr-2">
                              <span className={`text-sm font-semibold truncate ${currentWorkflowId === wf.id ? 'text-blue-700' : 'text-slate-700 group-hover:text-blue-600'}`}>{wf.name}</span>
                              <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">v{wf.version}</span>
                            </div>
                            <button 
                              onClick={(e) => deleteSavedWorkflow(wf.id, e)}
                              className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-400">{new Date(wf.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsLoadMenuOpen(false); }}
                className={`p-2 rounded-lg transition-all border ${isSettingsOpen ? 'bg-slate-100 border-slate-300 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-transparent'}`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {isSettingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Application Settings</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">Auto-save Draft</span>
                        <span className="text-[10px] text-slate-400">Save progress automatically</span>
                      </div>
                      <button 
                        onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        className={`transition-colors ${autoSaveEnabled ? 'text-blue-600' : 'text-slate-300'}`}
                      >
                        {autoSaveEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interval (seconds)</label>
                        <span className="text-xs font-bold text-blue-600">{autoSaveInterval}s</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="300" 
                        step="5"
                        value={autoSaveInterval} 
                        onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        disabled={!autoSaveEnabled}
                      />
                    </div>

                    <div className="p-2 bg-blue-50 rounded-lg flex gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700 leading-normal">
                        Drafts are stored in your browser's local storage and restored automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={exportWorkflow}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"
              title="Export Workflow as JSON"
            >
              <Download className="w-5 h-5" />
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => saveWorkflow(false)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${currentWorkflowId ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                title={currentWorkflowId ? "Quick Save (Overwrite)" : "Save Workflow"}
              >
                <Save className="w-3.5 h-3.5" />
                {currentWorkflowId ? 'Save' : 'Save Workflow'}
              </button>
              {currentWorkflowId && (
                <button 
                  onClick={() => saveWorkflow(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all ml-1"
                  title="Save As New Workflow"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button 
              onClick={executeWorkflow}
              disabled={isExecuting}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-md active:scale-95 ${isExecuting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              <Play className={`w-4 h-4 fill-current ${isExecuting ? 'animate-pulse' : ''}`} />
              {isExecuting ? 'Executing...' : 'Run'}
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 bg-slate-50" onClick={onPaneClick}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              isValidConnection={isValidConnection}
              fitView
            >
              <Background color="#cbd5e1" gap={20} size={1} />
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <div className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-4 text-[10px] text-slate-400 font-medium z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> System Online</span>
            <span>Cloudflare Region: FRA-1</span>
          </div>
          <div className="flex items-center gap-4 uppercase tracking-widest">
            <span>Nodes: {nodes.length}</span>
            <span>Edges: {edges.length}</span>
            <span className="flex items-center gap-1 text-slate-800"><Github className="w-3 h-3" /> v1.0.4-edge</span>
          </div>
        </div>
      </div>

      <EditorPanel 
        node={selectedNode} 
        onUpdate={handleUpdateNodeConfig} 
        onClose={() => setSelectedNodeId(null)} 
        onRetry={handleRetryNode}
      />
    </div>
  );
};

export default App;
