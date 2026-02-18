'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const createRoom = () => {
    const newRoomId = uuidv4();
    router.push(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elegant background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      
      <div className="relative bg-zinc-800/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-zinc-700/50 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            CollabCanvas
          </h1>
          <p className="text-zinc-400 text-sm">
            Real-time collaborative whiteboard
          </p>
        </div>

        {/* Create Room */}
        <div className="mb-4">
          <button
            onClick={createRoom}
            className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create New Room
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700/50"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-zinc-800/40 text-zinc-500 tracking-wide">OR JOIN EXISTING</span>
          </div>
        </div>

        {/* Join Room */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            className="w-full px-4 py-3.5 bg-white/5 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
          />
          <button
            onClick={joinRoom}
            disabled={!roomId.trim()}
            className="w-full bg-white/5 hover:bg-white/10 border border-zinc-700/50 text-zinc-300 font-medium py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            Join Room
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl">
          <p className="text-xs text-zinc-400 text-center">
            Share the room ID with others to collaborate in real-time
          </p>
        </div>
      </div>
    </main>
  );
}