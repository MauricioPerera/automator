
import { NodeType, NodeConfigField } from './types';
import { MarkerType } from 'reactflow';

export const INITIAL_NODES = [
  {
    id: 'node-1',
    type: 'customNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'On Click',
      type: NodeType.TRIGGER,
      config: {},
      status: 'idle',
    },
  },
  {
    id: 'node-2',
    type: 'customNode',
    position: { x: 400, y: 100 },
    data: {
      label: 'Gemini AI',
      type: NodeType.AI_GENERATE,
      config: {
        prompt: 'Generate a short creative story about a robot.',
        model: 'gemini-3-flash-preview',
      },
      status: 'idle',
    },
  },
  {
    id: 'node-3',
    type: 'customNode',
    position: { x: 700, y: 100 },
    data: {
      label: 'Log Output',
      type: NodeType.LOG,
      config: {},
      status: 'idle',
    },
  },
];

export const INITIAL_EDGES = [
  {
    id: 'e1-2',
    source: 'node-1',
    target: 'node-2',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
  {
    id: 'e2-3',
    source: 'node-2',
    target: 'node-3',
    animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
];

export const NODE_CONFIG_MAP: Record<NodeType, NodeConfigField[]> = {
  [NodeType.TRIGGER]: [
    { id: 'event', label: 'Trigger Event', type: 'select', options: [{ label: 'Manual Execution', value: 'manual' }], defaultValue: 'manual' }
  ],
  [NodeType.AI_GENERATE]: [
    { id: 'model', label: 'Model', type: 'select', options: [{ label: 'Gemini 3 Flash', value: 'gemini-3-flash-preview' }, { label: 'Gemini 3 Pro', value: 'gemini-3-pro-preview' }], defaultValue: 'gemini-3-flash-preview' },
    { id: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Enter your AI prompt...', defaultValue: '' }
  ],
  [NodeType.HTTP_REQUEST]: [
    { id: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com', defaultValue: '' },
    { id: 'method', label: 'Method', type: 'select', options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }], defaultValue: 'GET' }
  ],
  [NodeType.LOG]: [
    { id: 'prefix', label: 'Log Prefix', type: 'text', placeholder: 'Result:', defaultValue: 'Result:' }
  ],
  [NodeType.ACTION]: []
};
