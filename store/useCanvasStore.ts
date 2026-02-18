import { create } from 'zustand';
import { Shape, User, Tool } from '@/types';

interface CanvasStore {
  shapes: Shape[];
  users: Map<string, User>;
  currentTool: Tool;
  currentUser: User | null;
  selectedColor: string;
  
  // Actions
  setCurrentTool: (tool: Tool) => void;
  setCurrentUser: (user: User) => void;
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  setShapes: (shapes: Shape[]) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  setUsers: (users: Map<string, User>) => void;
  setSelectedColor: (color: string) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  shapes: [],
  users: new Map(),
  currentTool: 'pen',
  currentUser: null,
  selectedColor: '#FFFFFF', // Changed to white as default
  
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  addShape: (shape) => set((state) => ({ 
    shapes: [...state.shapes, shape] 
  })),
  
  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map(shape => 
      shape.id === id ? { ...shape, ...updates } : shape
    )
  })),
  
  deleteShape: (id) => set((state) => ({
    shapes: state.shapes.filter(shape => shape.id !== id)
  })),
  
  setShapes: (shapes) => set({ shapes }),
  
  updateUser: (userId, updates) => set((state) => {
    const newUsers = new Map(state.users);
    const user = newUsers.get(userId);
    if (user) {
      newUsers.set(userId, { ...user, ...updates });
    }
    return { users: newUsers };
  }),
  
  removeUser: (userId) => set((state) => {
    const newUsers = new Map(state.users);
    newUsers.delete(userId);
    return { users: newUsers };
  }),
  
  setUsers: (users) => set({ users }),
  
  setSelectedColor: (color) => set({ selectedColor: color }),
  
  clearCanvas: () => set({ shapes: [] }),
}));