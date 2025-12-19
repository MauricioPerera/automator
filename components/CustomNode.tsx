
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
  Loader2,
  AlertTriangle,
  GitBranch
} from 'lucide-react';

const NodeTypeIcon = ({ type }: { type: NodeType }) => {
  switch (type) {
    case NodeType.TRIGGER: return <Zap className="w-4 h-4 text-orange-500" />;
    case NodeType.AI_GENERATE: return <Bot className="w-4 h-4 text-purple-500" />;
    case NodeType.HTTP_REQUEST: return <Globe className="w-4 h-4 text-blue-500" />;
    case NodeType.LOG: return <Terminal className="w-4 h-4 text-slate-500" />;
    case NodeType.CONDITIONAL: return <GitBranch className="w-4 h-4 text-amber-500" />;
    default: return <Play className="w-4 h-4 text-green-500" />;
  }
};

const CustomNode = ({ data, selected }: NodeProps<NodeData>) => {
  const isRunning = data.status === 'running';
  const isConditional = data.type === NodeType.CONDITIONAL;
  const isTrigger = data.type === NodeType.TRIGGER;
  
  const statusConfig = {
    idle: {
      container: 'bg-white border-slate-200',
      icon: 'bg-white border-slate-100',
    },
    running: {
      container: 'bg-blue-50/50 border-blue-400 node-executing',
      icon: 'bg-blue-100 border-blue-200',
    },
    success: {
      container: 'bg-green-50/30 border-green-400',
      icon: 'bg-green-100 border-green-200',
    },
    warning: {
      container: 'bg-amber-50/30 border-amber-400',
      icon: 'bg-amber-100 border-amber-200',
    },
    error: {
      container: 'bg-red-50/30 border-red-400',
      icon: 'bg-red-100 border-red-200',
    },
  }[data.status || 'idle'];

  return (
    <div className={`
      relative px-4 py-3 rounded-xl border-2 shadow-sm transition-all duration-300 min-w-[200px]
      ${statusConfig.container}
      ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    `}>
      {/* Hide target handle for trigger nodes */}
      {!isTrigger && (
        <Handle type="target" position={Position.Left} className="!bg-slate-400 !border-white !w-2.5 !h-2.5 !-left-[6px]" />
      )}
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border shadow-sm transition-colors duration-300 ${statusConfig.icon}`}>
          <NodeTypeIcon type={data.type} />
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-xs font-bold text-slate-800 truncate">{data.label}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-none">
              {data.type.replace('_', ' ')}
            </span>
            {isRunning && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
            )}
          </div>
        </div>
        
        <div className="ml-1 shrink-0">
          {data.status === 'running' && (
            <div className="relative flex items-center justify-center">
               <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          )}
          {data.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 transition-all scale-110" />}
          {data.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 transition-all scale-110" />}
          {data.status === 'error' && <XCircle className="w-5 h-5 text-red-500 transition-all scale-110" />}
        </div>
      </div>

      {isConditional ? (
        <>
          <div className="absolute -right-1 top-1/4 translate-y-1">
            <Handle 
              type="source" 
              position={Position.Right} 
              id="true"
              className="!bg-green-500 !border-white !w-2.5 !h-2.5" 
            />
            <span className="absolute left-3 -top-1.5 text-[8px] font-bold text-green-600 uppercase">True</span>
          </div>
          <div className="absolute -right-1 bottom-1/4 -translate-y-1">
            <Handle 
              type="source" 
              position={Position.Right} 
              id="false"
              className="!bg-red-500 !border-white !w-2.5 !h-2.5" 
            />
            <span className="absolute left-3 -top-1.5 text-[8px] font-bold text-red-600 uppercase">False</span>
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="!bg-slate-400 !border-white !w-2.5 !h-2.5 !-right-[6px]" />
      )}
      
      {isRunning && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl">
          <div className="h-full bg-blue-500 transition-all duration-500 ease-in-out" style={{ width: '100%', animation: 'shimmer 2s infinite linear', backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', backgroundSize: '200% 100%' }}></div>
        </div>
      )}
    </div>
  );
};

export default memo(CustomNode);
