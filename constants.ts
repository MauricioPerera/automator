
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
      config: { 
        retryCount: 0, 
        continueOnError: 'false', 
        inputSchema: '', 
        outputSchema: '{"event": "string"}',
        description: 'Starts the workflow when manually triggered.'
      },
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
        prompt: 'Generate a short creative story about a robot. Previous input: {{input}}',
        model: 'gemini-3-flash-preview',
        retryCount: 1,
        continueOnError: 'false',
        inputSchema: '{"text": "string"}',
        outputSchema: '{"story": "string"}',
        description: 'Uses Gemini Flash to generate creative text based on context.'
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
      config: { 
        retryCount: 0, 
        continueOnError: 'false', 
        inputSchema: 'any', 
        outputSchema: 'any',
        description: 'Prints the node result to the browser console.'
      },
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

const DESCRIPTION_FIELD: NodeConfigField = { 
  id: 'description', 
  label: 'Node Description', 
  type: 'textarea', 
  placeholder: 'What does this node do?', 
  defaultValue: '' 
};

const SCHEMA_FIELDS: NodeConfigField[] = [
  { id: 'inputSchema', label: 'Input Schema (JSON)', type: 'textarea', placeholder: 'e.g. {"userId": "number"}', defaultValue: '' },
  { id: 'outputSchema', label: 'Output Schema (JSON)', type: 'textarea', placeholder: 'e.g. {"success": "boolean"}', defaultValue: '' },
];

const ERROR_HANDLING_FIELDS: NodeConfigField[] = [
  { id: 'retryCount', label: 'Max Retries', type: 'number', defaultValue: 0 },
  { id: 'continueOnError', label: 'Continue on Fail', type: 'select', options: [{ label: 'No', value: 'false' }, { label: 'Yes', value: 'true' }], defaultValue: 'false' }
];

export const NODE_CONFIG_MAP: Record<NodeType, NodeConfigField[]> = {
  [NodeType.TRIGGER]: [
    DESCRIPTION_FIELD,
    { id: 'event', label: 'Trigger Event', type: 'select', options: [{ label: 'Manual Execution', value: 'manual' }], defaultValue: 'manual' },
    ...SCHEMA_FIELDS,
    ...ERROR_HANDLING_FIELDS
  ],
  [NodeType.AI_GENERATE]: [
    DESCRIPTION_FIELD,
    { id: 'model', label: 'Model', type: 'select', options: [{ label: 'Gemini 3 Flash', value: 'gemini-3-flash-preview' }, { label: 'Gemini 3 Pro', value: 'gemini-3-pro-preview' }], defaultValue: 'gemini-3-flash-preview' },
    { id: 'prompt', label: 'Prompt', type: 'textarea', placeholder: 'Enter your AI prompt... Use {{input}} to inject data from the previous node.', defaultValue: '' },
    ...SCHEMA_FIELDS,
    ...ERROR_HANDLING_FIELDS
  ],
  [NodeType.HTTP_REQUEST]: [
    DESCRIPTION_FIELD,
    { id: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com', defaultValue: '' },
    { id: 'method', label: 'Method', type: 'select', options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }], defaultValue: 'GET' },
    ...SCHEMA_FIELDS,
    ...ERROR_HANDLING_FIELDS
  ],
  [NodeType.LOG]: [
    DESCRIPTION_FIELD,
    { id: 'prefix', label: 'Log Prefix', type: 'text', placeholder: 'Result:', defaultValue: 'Result:' },
    ...SCHEMA_FIELDS,
    ...ERROR_HANDLING_FIELDS
  ],
  [NodeType.CONDITIONAL]: [
    DESCRIPTION_FIELD,
    { id: 'operator', label: 'Operator', type: 'select', options: [{ label: 'Contains', value: 'contains' }, { label: 'Not Contains', value: 'not_contains' }, { label: 'Equals', value: 'equals' }], defaultValue: 'contains' },
    { id: 'value', label: 'Value to compare', type: 'text', placeholder: 'Search for this text...', defaultValue: '' },
    ...SCHEMA_FIELDS,
    ...ERROR_HANDLING_FIELDS
  ],
  [NodeType.ACTION]: [DESCRIPTION_FIELD, ...SCHEMA_FIELDS, ...ERROR_HANDLING_FIELDS]
};
