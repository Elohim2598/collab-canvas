'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Canvas from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { useCanvasStore } from '@/store/useCanvasStore';
import { v4 as uuidv4 } from 'uuid';
import { Copy, Check, Heart } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { setCurrentUser } = useCanvasStore();

  useEffect(() => {
    setMounted(true);
    
    // Generate random user color
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Set current user
    setCurrentUser({
      id: uuidv4(),
      name: 'Anonymous',
      color: randomColor,
      cursorX: 0,
      cursorY: 0,
    });
  }, [setCurrentUser]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-full h-screen">
      <Toolbar />
      <Canvas />
      
      {/* Room Info with Copy ID */}
      <div className="fixed bottom-6 left-6 z-10">
        <div className="bg-zinc-800/40 backdrop-blur-2xl rounded-xl shadow-2xl border border-zinc-700/50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 tracking-wider mb-1">ROOM ID</p>
              <p className="font-mono text-sm font-medium text-zinc-200">{roomId}</p>
            </div>
            <button
              onClick={copyRoomId}
              className="p-2 rounded-lg hover:bg-white/5 transition-all duration-150"
              title="Copy Room ID"
            >
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-zinc-400 hover:text-zinc-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 right-6 z-10">
        <div className="bg-zinc-800/40 backdrop-blur-2xl rounded-xl shadow-2xl border border-zinc-700/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-400">Made by</p>
            <p className="text-xs font-semibold text-zinc-200">Sebastian Elohim Perrone</p>
          </div>
        </div>
      </div>
    </div>
  );
}