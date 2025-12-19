
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, NodeType } from '../types';
import { 
  Play, 
  Zap, 
  Bot, 
  Globe, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from 'lucide-react';

const NodeTypeIcon = ({ type }: { type: NodeType }) => {
  switch (type) {
    case NodeType.TRIGGER: return <Zap className="w-4 h-4 text-orange-500" />;
    case NodeType.AI_GENERATE: return <Bot className="w-4 h-4 text-purple-500" />;
    case NodeType.HTTP_REQUEST: return <Globe className="w-4 h-4 text-blue-500" />;
    case NodeType.LOG: return <Terminal className="w-4 h-4 text-slate-500" />;
    default: return <Play className="w-4 h-4 text-green-500" />;
  }
};

const CustomNode = ({ data, selected }: NodeProps<NodeData>) => {
  const statusColor = {
    idle: 'bg-white',
    running: 'bg-blue-50 ring-2 ring-blue-400',
    success: 'bg-green-50 ring-2 ring-green-400',
    error: 'bg-red-50 ring-2 ring-red-400',
  }[data.status || 'idle'];

  return (
    <div className={`px-4 py-3 rounded-xl border-2 shadow-sm transition-all duration-200 min-w-[180px] ${statusColor} ${selected ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !border-white !w-2 !h-2" />
      
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
          <NodeTypeIcon type={data.type} />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-xs font-semibold text-slate-800 truncate">{data.label}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {data.type.replace('_', ' ')}
          </span>
        </div>
        
        <div className="ml-auto">
          {data.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          {data.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          {data.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-400 !border-white !w-2 !h-2" />
    </div>
  );
};

export default memo(CustomNode);
