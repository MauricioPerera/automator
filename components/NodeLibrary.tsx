
import React from 'react';
import { NodeType } from '../types';
import { 
  Plus, 
  Zap, 
  Bot, 
  Globe, 
  Terminal, 
  Search,
  LayoutGrid
} from 'lucide-react';

interface NodeLibraryProps {
  onAddNode: (type: NodeType) => void;
}

const NodeLibrary: React.FC<NodeLibraryProps> = ({ onAddNode }) => {
  const nodeTypes = [
    { type: NodeType.TRIGGER, label: 'Trigger', icon: <Zap className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { type: NodeType.AI_GENERATE, label: 'Gemini AI', icon: <Bot className="w-4 h-4" />, color: 'text-purple-500', bg: 'bg-purple-50' },
    { type: NodeType.HTTP_REQUEST, label: 'HTTP Request', icon: <Globe className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: NodeType.LOG, label: 'Log', icon: <Terminal className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shadow-sm z-20">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-800">Node Library</h2>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search nodes..." 
            className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodeTypes.map((node) => (
          <button
            key={node.type}
            onClick={() => onAddNode(node.type)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
          >
            <div className={`p-2 rounded-lg ${node.bg} ${node.color} group-hover:scale-110 transition-transform`}>
              {node.icon}
            </div>
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
              {node.label}
            </span>
            <Plus className="w-3.5 h-3.5 ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-blue-600 rounded-xl p-4 text-white">
          <p className="text-xs font-bold mb-1">Cloudflare Deployment</p>
          <p className="text-[10px] opacity-80 leading-relaxed">
            Workflows are executed as distributed Workers on the edge.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeLibrary;
