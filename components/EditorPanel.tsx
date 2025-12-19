
import React from 'react';
import { CustomNode, NodeType, NodeConfigField } from '../types';
import { NODE_CONFIG_MAP } from '../constants';
import { X, Settings2, Info, RefreshCw, AlertCircle, Database, Layout, AlignLeft } from 'lucide-react';

interface EditorPanelProps {
  node: CustomNode | null;
  onUpdate: (id: string, config: Record<string, any>) => void;
  onClose: () => void;
  onRetry?: (id: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ node, onUpdate, onClose, onRetry }) => {
  if (!node) return null;

  const allFields = NODE_CONFIG_MAP[node.data.type] || [];
  
  // Group fields for better UX
  const metadataFields = allFields.filter(f => f.id === 'description');
  const schemaFields = allFields.filter(f => f.id === 'inputSchema' || f.id === 'outputSchema');
  const parameterFields = allFields.filter(f => f.id !== 'inputSchema' && f.id !== 'outputSchema' && f.id !== 'description');

  const handleFieldChange = (fieldId: string, value: any) => {
    const field = allFields.find(f => f.id === fieldId);
    const finalValue = field?.type === 'number' ? Number(value) : value;
    onUpdate(node.id, { ...node.data.config, [fieldId]: finalValue });
  };

  const renderField = (field: NodeConfigField) => (
    <div key={field.id} className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {field.label}
      </label>
      {field.type === 'text' && (
        <input
          type="text"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={node.data.config[field.id] || ''}
          placeholder={field.placeholder}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
        />
      )}
      {field.type === 'number' && (
        <input
          type="number"
          min="0"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          value={node.data.config[field.id] || 0}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
        />
      )}
      {field.type === 'textarea' && (
        <textarea
          rows={field.id === 'description' ? 2 : field.id.includes('Schema') ? 3 : 6}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-sans"
          style={field.id.includes('Schema') ? { fontFamily: 'monospace' } : {}}
          value={node.data.config[field.id] || ''}
          placeholder={field.placeholder}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
        />
      )}
      {field.type === 'select' && (
        <select
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition-all cursor-pointer"
          value={node.data.config[field.id] || field.defaultValue}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div className="w-96 bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl z-20 overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Settings2 className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-bold text-slate-800 text-sm">Node Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          {node.data.status === 'error' && onRetry && (
            <button 
              onClick={() => onRetry(node.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div>
          <h3 className="text-base font-black text-slate-900 mb-1">{node.data.label}</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-tighter">
            {node.id}
          </span>
        </div>

        {metadataFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">General</span>
            </div>
            {metadataFields.map(renderField)}
          </div>
        )}

        {parameterFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Layout className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Parameters</span>
            </div>
            {parameterFields.map(renderField)}
          </div>
        )}

        {schemaFields.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Data Schemas</span>
            </div>
            {schemaFields.map(renderField)}
          </div>
        )}

        {metadataFields.length === 0 && parameterFields.length === 0 && schemaFields.length === 0 && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 italic leading-relaxed">No configuration options available for this node type.</p>
          </div>
        )}

        {(node.data.lastResult || node.data.status === 'error') && (
          <div className="pt-8 border-t border-slate-100">
             <div className="flex items-center justify-between mb-4">
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Execution Info</span>
               {node.data.status && (
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                   node.data.status === 'success' ? 'bg-green-100 text-green-700' : 
                   node.data.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                 }`}>
                   {node.data.status}
                 </span>
               )}
             </div>
            
            {node.data.status === 'error' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700">Execution Error</p>
                  <p className="text-[10px] text-red-600 leading-normal mt-1">{node.data.errorDetails || 'Unknown error occurred during execution.'}</p>
                </div>
              </div>
            )}

            {node.data.lastResult && (
              <div className="relative group">
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">JSON</span>
                </div>
                <pre className="p-4 rounded-xl text-[10px] overflow-x-auto whitespace-pre-wrap bg-slate-900 text-blue-300 font-mono leading-relaxed border border-slate-800 shadow-inner max-h-64 scrollbar-thin scrollbar-thumb-slate-700">
                  {JSON.stringify(node.data.lastResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
