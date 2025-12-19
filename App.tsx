
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Node,
} from 'reactflow';
import { INITIAL_NODES, INITIAL_EDGES } from './constants';
import { NodeType, CustomNode, NodeData } from './types';
import CustomNodeComponent from './components/CustomNode';
import EditorPanel from './components/EditorPanel';
import NodeLibrary from './components/NodeLibrary';
import { Play, Share2, Save, MoreVertical, Github, Zap, Undo2, Redo2 } from 'lucide-react';
import { runGeminiTask } from './services/geminiService';

const nodeTypes = {
  customNode: CustomNodeComponent,
};

interface HistoryState {
  nodes: CustomNode[];
  edges: Edge[];
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<CustomNode[]>(INITIAL_NODES as CustomNode[]);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // History State
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const takeSnapshot = useCallback(() => {
    setPast((prev) => [...prev, { nodes: [...nodes], edges: [...edges] }]);
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prev) => [{ nodes: [...nodes], edges: [...edges] }, ...prev]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setPast(newPast);
  }, [past, nodes, edges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, { nodes: [...nodes], edges: [...edges] }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture(newFuture);
  }, [future, nodes, edges]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        redo();
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
        config: {},
        status: 'idle',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);
  }, [takeSnapshot]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Workflow Execution Engine
  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);

    // Reset status
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', lastResult: null } })));

    // Find trigger node
    const triggerNode = nodes.find(n => n.data.type === NodeType.TRIGGER);
    if (!triggerNode) {
      alert("No Trigger node found!");
      setIsExecuting(false);
      return;
    }

    const executeNode = async (node: CustomNode, inputData: any) => {
      setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n));
      
      let result = null;
      try {
        switch (node.data.type) {
          case NodeType.TRIGGER:
            result = { triggeredAt: new Date().toISOString() };
            break;
          case NodeType.AI_GENERATE:
            const prompt = node.data.config.prompt || "Hello";
            const model = node.data.config.model || 'gemini-3-flash-preview';
            result = await runGeminiTask(prompt, model);
            break;
          case NodeType.LOG:
            console.log("WORKFLOW LOG:", inputData);
            result = inputData;
            break;
          case NodeType.HTTP_REQUEST:
            result = { status: 200, message: "Request successful (Mocked)" };
            break;
          default:
            result = "No action defined";
        }

        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'success', lastResult: result } } : n));
        
        const nextEdges = edges.filter(e => e.source === node.id);
        for (const edge of nextEdges) {
          const nextNode = nodes.find(n => n.id === edge.target);
          if (nextNode) {
            await executeNode(nextNode, result);
          }
        }
      } catch (error) {
        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'error', lastResult: error instanceof Error ? error.message : "Error" } } : n));
        throw error;
      }
    };

    try {
      await executeNode(triggerNode, null);
    } catch (err) {
      console.error("Workflow Execution Failed", err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      <NodeLibrary onAddNode={addNode} />

      <div className="flex-1 flex flex-col relative h-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <h1 className="font-bold text-lg tracking-tight">n8n Clone <span className="text-blue-500">AI</span></h1>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none">Workflow</span>
              <span className="text-sm font-medium text-slate-700 leading-tight">Gemini Story Generator</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo Buttons */}
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

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button 
              onClick={executeWorkflow}
              disabled={isExecuting}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-md active:scale-95 ${isExecuting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            >
              <Play className={`w-4 h-4 fill-current ${isExecuting ? 'animate-pulse' : ''}`} />
              {isExecuting ? 'Executing...' : 'Run Workflow'}
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

        <div className="flex-1 bg-slate-50">
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
      />
    </div>
  );
};

export default App;
