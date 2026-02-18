const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Important for Railway
const port = process.env.PORT || 3000; // Railway sets PORT env variable

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: new Map(),
          shapes: [],
        });
      }

      const room = rooms.get(roomId);
      room.users.set(socket.id, user);

      socket.emit('room-state', {
        shapes: room.shapes,
        users: Array.from(room.users.values()),
      });

      socket.to(roomId).emit('user-joined', user);
      
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('shape-added', ({ roomId, shape }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.shapes.push(shape);
        socket.to(roomId).emit('shape-added', shape);
      }
    });

    socket.on('shape-updated', ({ roomId, shapeId, updates }) => {
      const room = rooms.get(roomId);
      if (room) {
        const shapeIndex = room.shapes.findIndex(s => s.id === shapeId);
        if (shapeIndex !== -1) {
          room.shapes[shapeIndex] = { ...room.shapes[shapeIndex], ...updates };
          socket.to(roomId).emit('shape-updated', { shapeId, updates });
        }
      }
    });

    socket.on('shape-deleted', ({ roomId, shapeId }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.shapes = room.shapes.filter(s => s.id !== shapeId);
        socket.to(roomId).emit('shape-deleted', shapeId);
      }
    });

    socket.on('canvas-cleared', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        room.shapes = [];
        socket.to(roomId).emit('canvas-cleared');
      }
    });

    socket.on('cursor-move', ({ roomId, x, y }) => {
      socket.to(roomId).emit('cursor-move', {
        userId: socket.id,
        x,
        y,
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          const user = room.users.get(socket.id);
          room.users.delete(socket.id);
          io.to(roomId).emit('user-left', socket.id);
          
          if (room.users.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});