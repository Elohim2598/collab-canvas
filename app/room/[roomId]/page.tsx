'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Canvas from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { useCanvasStore } from '@/store/useCanvasStore';
import { Copy, Check } from 'lucide-react';
import { getSocket } from '@/lib/socket';

// ─── Random display name generator ───
const ADJECTIVES = ['Swift', 'Bright', 'Calm', 'Bold', 'Keen', 'Warm', 'Cool', 'Wild'];
const ANIMALS = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lynx', 'Puma', 'Deer'];

function generateDisplayName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

const USER_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { setCurrentUser, currentUser } = useCanvasStore();

  useEffect(() => {
    setMounted(true);

    // Wait for socket connection to get the real socket.id,
    // then use it as the user's id so cursor events match up.
    const socket = getSocket();

    const initUser = () => {
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      setCurrentUser({
        id: socket.id!, // Use socket.id so server cursor broadcasts match
        name: generateDisplayName(),
        color,
        cursorX: 0,
        cursorY: 0,
      });
    };

    if (socket.connected) {
      initUser();
    } else {
      socket.on('connect', initUser);
    }

    // Handle reconnections — re-register with new socket.id
    socket.on('reconnect', () => {
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      setCurrentUser({
        id: socket.id!,
        name: currentUser?.name ?? generateDisplayName(),
        color: currentUser?.color ?? color,
        cursorX: 0,
        cursorY: 0,
      });
    });

    return () => {
      socket.off('connect', initUser);
      socket.off('reconnect');
    };
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