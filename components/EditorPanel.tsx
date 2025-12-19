
import React from 'react';
import { CustomNode, NodeType } from '../types';
import { NODE_CONFIG_MAP } from '../constants';
import { X, Settings2, Info, RefreshCw, AlertCircle } from 'lucide-react';

interface EditorPanelProps {
  node: CustomNode | null;
  onUpdate: (id: string, config: Record<string, any>) => void;
  onClose: () => void;
  onRetry?: (id: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ node, onUpdate, onClose, onRetry }) => {
  if (!node) return null;

  const fields = NODE_CONFIG_MAP[node.data.type] || [];

  const handleFieldChange = (fieldId: string, value: any) => {
    // Convert string number inputs to actual numbers
    const finalValue = fields.find(f => f.id === fieldId)?.type === 'number' ? Number(value) : value;
    onUpdate(node.id, { ...node.data.config, [fieldId]: finalValue });
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl z-20 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700">Node Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          {node.data.status === 'error' && onRetry && (
            <button 
              onClick={() => onRetry(node.id)}
              className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Node
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">{node.data.label}</h3>
          <p className="text-xs text-slate-400">ID: {node.id}</p>
        </div>

        {fields.length > 0 ? (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {field.label}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={node.data.config[field.id] || ''}
                    placeholder={field.placeholder}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={node.data.config[field.id] || 0}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                )}
                {field.type === 'textarea' && (
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    value={node.data.config[field.id] || ''}
                    placeholder={field.placeholder}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                )}
                {field.type === 'select' && (
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
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
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex gap-3">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500 italic">No configuration options available for this node type.</p>
          </div>
        )}

        {(node.data.lastResult || node.data.status === 'error') && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Execution History</h4>
            
            {node.data.status === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-700">Node Failed</p>
                  <p className="text-[10px] text-red-600 leading-normal">{node.data.errorDetails || 'Unknown error occurred during execution.'}</p>
                </div>
              </div>
            )}

            {node.data.lastResult && (
              <pre className={`p-3 rounded-md text-[10px] overflow-x-auto whitespace-pre-wrap ${node.data.status === 'error' ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-slate-100'}`}>
                {JSON.stringify(node.data.lastResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
