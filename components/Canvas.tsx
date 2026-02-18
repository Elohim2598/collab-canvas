'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { Shape, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getSocket } from '@/lib/socket';
import { useParams } from 'next/navigation';

// ─── Performance: stable throttle outside component ───
function createThrottle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    const remaining = ms - (now - lastCall);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      lastCall = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

// ─── Memoized shape renderer ───
const ShapeRenderer = ({
  shape,
  currentTool,
  onSelect,
}: {
  shape: Shape;
  currentTool: string;
  onSelect: (id: string) => void;
}) => {
  const isInteractive = currentTool === 'select' || currentTool === 'eraser';

  const shapeProps = useMemo(
    () => ({
      id: shape.id,
      onClick: () => currentTool === 'select' && onSelect(shape.id),
      draggable: currentTool === 'select',
      listening: isInteractive,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      hitStrokeWidth: currentTool === 'eraser' ? 20 : 0,
    }),
    [shape.id, currentTool, isInteractive, onSelect]
  );

  switch (shape.type) {
    case 'rect':
      return (
        <Rect
          key={shape.id}
          {...shapeProps}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
    case 'circle':
      return (
        <Circle
          key={shape.id}
          {...shapeProps}
          x={shape.x}
          y={shape.y}
          radius={shape.radius}
          fill={shape.fill}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
    case 'path':
      return (
        <Line
          key={shape.id}
          {...shapeProps}
          x={shape.x}
          y={shape.y}
          points={shape.points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
        />
      );
    case 'line':
      return (
        <Line
          key={shape.id}
          {...shapeProps}
          x={shape.x}
          y={shape.y}
          points={shape.points}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
        />
      );
    case 'text':
      return (
        <Text
          key={shape.id}
          {...shapeProps}
          x={shape.x}
          y={shape.y}
          text={shape.text}
          fontSize={shape.fontSize}
          fill={shape.fill}
        />
      );
    default:
      return null;
  }
};

// ─── Remote cursor component ───
const RemoteCursor = ({
  x,
  y,
  color,
  name,
}: {
  x: number;
  y: number;
  color: string;
  name: string;
}) => (
  <Group x={x} y={y} listening={false} perfectDrawEnabled={false}>
    <Line
      points={[0, 0, 0, 16, 4, 12, 8, 20, 11, 19, 7, 11, 12, 11]}
      fill={color}
      stroke="#000"
      strokeWidth={0.5}
      closed
      listening={false}
      perfectDrawEnabled={false}
    />
    <Rect
      x={14}
      y={10}
      width={name.length * 7 + 12}
      height={18}
      fill={color}
      cornerRadius={4}
      listening={false}
      perfectDrawEnabled={false}
    />
    <Text
      x={20}
      y={12}
      text={name}
      fontSize={11}
      fill="#fff"
      fontFamily="system-ui, sans-serif"
      listening={false}
      perfectDrawEnabled={false}
    />
  </Group>
);

// ─── Custom hook: window dimensions ───
function useWindowSize() {
  const [size, setSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();

    let rafId: number;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return size;
}

// ═══════════════════════════════════════════════════════════
// ─── MAIN CANVAS COMPONENT ───
// ═══════════════════════════════════════════════════════════

interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
}

export default function Canvas() {
  const stageRef = useRef<any>(null);
  const isDrawingRef = useRef(false);
  const currentShapeRef = useRef<Shape | null>(null);
  const rafRef = useRef<number | null>(null);

  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorData>>({});

  const params = useParams();
  const roomId = params?.roomId as string;
  const { width, height } = useWindowSize();

  const {
    shapes,
    currentTool,
    selectedColor,
    currentUser,
    addShape,
    deleteShape,
    setShapes,
  } = useCanvasStore();

  const currentToolRef = useRef(currentTool);
  useEffect(() => { currentToolRef.current = currentTool; }, [currentTool]);

  const selectedColorRef = useRef(selectedColor);
  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);

  // ─── Throttled cursor emission ───
  const emitCursorMove = useRef(
    createThrottle((roomId: string, x: number, y: number) => {
      const socket = getSocket();
      socket.emit('cursor-move', { roomId, x, y });
    }, 80)
  ).current;

  // ─── WebSocket setup ───
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const socket = getSocket();
    socket.emit('join-room', { roomId, user: currentUser });

    socket.on('room-state', ({ shapes: roomShapes }) => {
      setShapes(roomShapes);
    });

    socket.on('shape-added', (shape: Shape) => {
      addShape(shape);
    });

    socket.on('shape-deleted', (shapeId: string) => {
      deleteShape(shapeId);
    });

    socket.on('canvas-cleared', () => {
      setShapes([]);
    });

    // Batch cursor updates with rAF
    let cursorBatch: Record<string, { userId: string; x: number; y: number; name: string; color: string }> = {};
    let cursorRaf: number | null = null;

    const flushCursors = () => {
      cursorRaf = null;
      const batch = cursorBatch;
      cursorBatch = {};

      setRemoteCursors((prev) => {
        const next = { ...prev };
        for (const [userId, data] of Object.entries(batch)) {
          next[userId] = {
            x: data.x,
            y: data.y,
            name: data.name,
            color: data.color,
          };
        }
        return next;
      });
    };

    // Server now sends name + color with every cursor event
    const handleCursorMove = ({
      userId,
      x,
      y,
      name,
      color,
    }: {
      userId: string;
      x: number;
      y: number;
      name: string;
      color: string;
    }) => {
      cursorBatch[userId] = { userId, x, y, name, color };
      if (!cursorRaf) {
        cursorRaf = requestAnimationFrame(flushCursors);
      }
    };

    socket.on('cursor-move', handleCursorMove);

    socket.on('user-joined', (user: User) => {
      console.log('User joined:', user.name);
    });

    socket.on('user-left', (userId: string) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      if (cursorRaf) cancelAnimationFrame(cursorRaf);
      socket.off('room-state');
      socket.off('shape-added');
      socket.off('shape-deleted');
      socket.off('canvas-cleared');
      socket.off('cursor-move');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [roomId, currentUser, addShape, deleteShape, setShapes]);

  // ─── Cursor style ───
  const cursorStyle = useMemo(() => {
    if (currentTool === 'select') return isDragging ? 'grabbing' : 'grab';
    if (currentTool === 'eraser') return 'pointer';
    if (currentTool === 'text') return 'text';
    if (['pen', 'line', 'rectangle', 'circle'].includes(currentTool)) return 'crosshair';
    return 'default';
  }, [currentTool, isDragging]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // ─── Mouse handlers ───
  const handleMouseDown = useCallback(
    (e: any) => {
      const tool = currentToolRef.current;
      const color = selectedColorRef.current;
      const clickedOnEmpty = e.target === e.target.getStage();
      const clickedShape = e.target;

      if (tool === 'select') {
        if (clickedOnEmpty) setSelectedId(null);
        else setIsDragging(true);
        return;
      }

      if (tool === 'eraser') {
        if (!clickedOnEmpty && clickedShape.attrs.id) {
          deleteShape(clickedShape.attrs.id);
          const socket = getSocket();
          socket.emit('shape-deleted', { roomId, shapeId: clickedShape.attrs.id });
        }
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      if (tool === 'text') {
        setTextPosition({ x: pos.x, y: pos.y });
        setIsAddingText(true);
        setTextValue('');
        return;
      }

      const newShape: Shape = {
        id: uuidv4(),
        type:
          tool === 'pen' ? 'path'
            : tool === 'rectangle' ? 'rect'
            : tool === 'circle' ? 'circle'
            : 'line',
        x: pos.x,
        y: pos.y,
        stroke: color,
        strokeWidth: 2,
        fill: tool === 'pen' ? undefined : color + '40',
      };

      if (tool === 'pen') newShape.points = [0, 0];
      else if (tool === 'circle') newShape.radius = 0;
      else if (tool === 'rectangle') { newShape.width = 0; newShape.height = 0; }
      else if (tool === 'line') newShape.points = [0, 0, 0, 0];

      isDrawingRef.current = true;
      currentShapeRef.current = newShape;
      setCurrentShape(newShape);
    },
    [roomId, deleteShape]
  );

  const handleMouseMove = useCallback(
    (e: any) => {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      if (!pos) return;

      if (!isDrawingRef.current) {
        emitCursorMove(roomId, pos.x, pos.y);
      }

      if (!isDrawingRef.current || !currentShapeRef.current) return;

      const tool = currentToolRef.current;
      const shape = currentShapeRef.current;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        let updated: Shape;

        if (tool === 'pen') {
          const points = shape.points || [];
          updated = { ...shape, points: [...points, pos.x - shape.x, pos.y - shape.y] };
        } else if (tool === 'circle') {
          const radius = Math.sqrt(Math.pow(pos.x - shape.x, 2) + Math.pow(pos.y - shape.y, 2));
          updated = { ...shape, radius };
        } else if (tool === 'rectangle') {
          updated = { ...shape, width: pos.x - shape.x, height: pos.y - shape.y };
        } else if (tool === 'line') {
          updated = { ...shape, points: [0, 0, pos.x - shape.x, pos.y - shape.y] };
        } else {
          return;
        }

        currentShapeRef.current = updated;
        setCurrentShape(updated);
      });
    },
    [roomId, emitCursorMove]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current && currentShapeRef.current) {
      const finalShape = currentShapeRef.current;
      addShape(finalShape);
      const socket = getSocket();
      socket.emit('shape-added', { roomId, shape: finalShape });
    }

    isDrawingRef.current = false;
    currentShapeRef.current = null;
    setCurrentShape(null);
    setIsDragging(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [roomId, addShape]);

  // ─── Text handling ───
  const handleTextSubmit = useCallback(() => {
    if (textValue.trim()) {
      const textShape: Shape = {
        id: uuidv4(),
        type: 'text',
        x: textPosition.x,
        y: textPosition.y,
        text: textValue,
        fill: selectedColor,
        fontSize: 24,
      };
      addShape(textShape);
      const socket = getSocket();
      socket.emit('shape-added', { roomId, shape: textShape });
    }
    setIsAddingText(false);
    setTextValue('');
  }, [textValue, textPosition, selectedColor, roomId, addShape]);

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextSubmit();
      } else if (e.key === 'Escape') {
        setIsAddingText(false);
        setTextValue('');
      }
    },
    [handleTextSubmit]
  );

  const cursorEntries = useMemo(() => Object.entries(remoteCursors), [remoteCursors]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && currentTool === 'select') {
        deleteShape(selectedId);
        const socket = getSocket();
        socket.emit('shape-deleted', { roomId, shapeId: selectedId });
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, currentTool, roomId, deleteShape]);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Dark elegant background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-900">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Canvas layer */}
      <div className="relative z-10 w-full h-full" style={{ cursor: cursorStyle }}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Layer listening={currentTool === 'select' || currentTool === 'eraser'}>
            {shapes.map((shape) => (
              <ShapeRenderer
                key={shape.id}
                shape={shape}
                currentTool={currentTool}
                onSelect={handleSelect}
              />
            ))}
          </Layer>

          <Layer listening={false}>
            {currentShape && (
              <ShapeRenderer
                shape={currentShape}
                currentTool={currentTool}
                onSelect={handleSelect}
              />
            )}
          </Layer>

          <Layer listening={false}>
            {cursorEntries.map(([userId, cursor]) => (
              <RemoteCursor
                key={userId}
                x={cursor.x}
                y={cursor.y}
                color={cursor.color}
                name={cursor.name}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Text Input Modal */}
      {isAddingText && (
        <div
          className="fixed bg-zinc-800/90 backdrop-blur-xl border border-zinc-700/50 rounded-xl p-3 shadow-2xl"
          style={{ left: textPosition.x, top: textPosition.y, zIndex: 1000 }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            className="px-2 py-1 border-none outline-none min-w-[200px] bg-transparent text-white placeholder-zinc-500"
            style={{
              color: selectedColor === '#000000' || selectedColor === '#FFFFFF' ? '#FFFFFF' : selectedColor,
              fontSize: '24px',
            }}
            placeholder="Type here..."
          />
          <div className="text-xs text-zinc-500 mt-1">
            Press Enter to confirm, Esc to cancel
          </div>
        </div>
      )}
    </div>
  );
}