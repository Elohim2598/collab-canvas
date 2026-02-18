'use client';

import { useCanvasStore } from '@/store/useCanvasStore';
import { Tool } from '@/types';
import { 
  MousePointer2, 
  Pencil, 
  Type, 
  Square, 
  Circle, 
  Minus,
  Trash2
} from 'lucide-react';
import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useParams } from 'next/navigation';

const tools: { name: Tool; icon: any; label: string; shortcut?: string }[] = [
  { name: 'select', icon: MousePointer2, label: 'Select & Move', shortcut: 'V' },
  { name: 'pen', icon: Pencil, label: 'Freehand Draw', shortcut: 'P' },
  { name: 'text', icon: Type, label: 'Add Text', shortcut: 'T' },
  { name: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { name: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { name: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
  { name: 'eraser', icon: Trash2, label: 'Delete Shape', shortcut: 'E' },
];

const colors = [
  { value: '#FFFFFF', name: 'White' },
  { value: '#EF4444', name: 'Red' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#10B981', name: 'Green' },
  { value: '#F59E0B', name: 'Yellow' },
  { value: '#8B5CF6', name: 'Purple' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#6B7280', name: 'Gray' },
];

export default function Toolbar() {
  const { currentTool, setCurrentTool, selectedColor, setSelectedColor, clearCanvas } = useCanvasStore();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const params = useParams();
  const roomId = params?.roomId as string;

  const handleClearCanvas = () => {
    clearCanvas();
    // Emit to other users
    if (roomId) {
      const socket = getSocket();
      socket.emit('canvas-cleared', { roomId });
    }
  };

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-zinc-800/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-zinc-700/50 p-2.5 flex items-center gap-2">
        {/* Tools */}
        <div className="flex gap-1 border-r border-zinc-700/50 pr-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div 
                key={tool.name}
                className="relative"
                onMouseEnter={() => setHoveredTool(tool.name)}
                onMouseLeave={() => setHoveredTool(null)}
              >
                <button
                  onClick={() => setCurrentTool(tool.name)}
                  className={`
                    relative p-2.5 rounded-lg transition-all duration-150
                    ${currentTool === tool.name 
                      ? 'bg-white/10 text-white ring-1 ring-white/20' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }
                  `}
                >
                  <Icon size={18} strokeWidth={2} />
                </button>
                
                {/* Tooltip */}
                {hoveredTool === tool.name && (
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-50">
                    <div className="text-xs font-medium text-white">{tool.label}</div>
                    {tool.shortcut && (
                      <div className="text-[10px] text-zinc-500 mt-0.5">Press {tool.shortcut}</div>
                    )}
                    {tool.name === 'eraser' && (
                      <div className="text-[10px] text-zinc-500 mt-0.5">Click shapes to delete</div>
                    )}
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-zinc-900/95 border-l border-t border-zinc-700/50 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Color Picker */}
        <div className="flex gap-1.5 items-center border-r border-zinc-700/50 pr-2 pl-1">
          <div className="flex gap-1">
            {colors.map((color) => (
              <div
                key={color.value}
                className="relative"
                onMouseEnter={() => setHoveredColor(color.value)}
                onMouseLeave={() => setHoveredColor(null)}
              >
                <button
                  onClick={() => setSelectedColor(color.value)}
                  className={`
                    w-7 h-7 rounded-lg transition-all duration-150
                    ${selectedColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-offset-zinc-800 ring-white/40 scale-110' 
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }
                    ${color.value === '#FFFFFF' ? 'border border-zinc-700' : ''}
                  `}
                  style={{ backgroundColor: color.value }}
                />
                
                {/* Color Tooltip */}
                {hoveredColor === color.value && (
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-50">
                    <div className="text-xs font-medium text-white">{color.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{color.value}</div>
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-zinc-900/95 border-l border-t border-zinc-700/50 rotate-45"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clear Canvas */}
        <div className="relative group">
          <button
            onClick={handleClearCanvas}
            className="px-3 py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-600/30 text-red-400 rounded-lg transition-all duration-150 flex items-center gap-2"
          >
            <Trash2 size={16} strokeWidth={2} />
            <span className="text-xs font-medium tracking-wide">CLEAR</span>
          </button>
          
          {/* Clear Tooltip */}
          <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            <div className="text-xs font-medium text-white">Clear Canvas</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Remove all drawings</div>
            {/* Arrow */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-zinc-900/95 border-l border-t border-zinc-700/50 rotate-45"></div>
          </div>
        </div>
      </div>
    </div>
  );
}