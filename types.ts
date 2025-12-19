
import { Node, Edge } from 'reactflow';

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  AI_GENERATE = 'ai_generate',
  HTTP_REQUEST = 'http_request',
  LOG = 'log',
}

export interface NodeData {
  label: string;
  type: NodeType;
  config: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
  lastResult?: any;
}

export type CustomNode = Node<NodeData>;

export interface WorkflowState {
  nodes: CustomNode[];
  edges: Edge[];
}

export interface NodeConfigField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: any;
}
