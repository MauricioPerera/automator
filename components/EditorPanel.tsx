
import React from 'react';
import { CustomNode, NodeType } from '../types';
import { NODE_CONFIG_MAP } from '../constants';
import { X, Settings2, Info } from 'lucide-react';

interface EditorPanelProps {
  node: CustomNode | null;
  onUpdate: (id: string, config: Record<string, any>) => void;
  onClose: () => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ node, onUpdate, onClose }) => {
  if (!node) return null;

  const fields = NODE_CONFIG_MAP[node.data.type] || [];

  const handleFieldChange = (fieldId: string, value: any) => {
    onUpdate(node.id, { ...node.data.config, [fieldId]: value });
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl z-20 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700">Node Settings</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
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

        {node.data.lastResult && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Last Execution Output</h4>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-[10px] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(node.data.lastResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
