export type Tool = 'select' | 'rectangle' | 'circle' | 'line' | 'pen' | 'text' | 'eraser';

export interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'line' | 'path' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
}

export interface CanvasState {
  shapes: Shape[];
  users: Map<string, User>;
  currentTool: Tool;
  currentUser: User | null;
}