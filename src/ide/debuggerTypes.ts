export interface VariableItem {
  name: string;
  value: string;
  type: string;
  category: 'number' | 'string' | 'list' | 'dict' | 'set' | 'boolean' | 'none' | 'other';
}

export interface VariableChange {
  name: string;
  before: string | null;
  after: string;
  type: string;
  category: string;
}

export interface CallStackFrame {
  func: string;
  line: number;
  file: string;
}

export interface DebugStep {
  step: number;
  line: number;
  func: string;
  event: 'line' | 'call' | 'return' | 'exception';
  locals: Record<string, VariableItem>;
  globals: Record<string, VariableItem>;
  callStack: CallStackFrame[];
  changedVars: Record<string, VariableChange>;
  stdout: string;
  returnValue?: string;
  exception?: string;
}

export type DebuggerMode = 'idle' | 'running' | 'paused' | 'stopped' | 'finished' | 'error';
