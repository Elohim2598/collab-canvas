# CollabCanvas

A real-time collaborative whiteboard application built with Next.js, Socket.io, and Konva. Draw, design, and collaborate with others in real-time with an elegant dark UI.

## Features

- **Real-time Collaboration** - Multiple users can draw simultaneously in the same room
- **Live Cursors** - See other users' cursor positions in real-time
- **Rich Drawing Tools**
  - Freehand pen
  - Shapes (Rectangle, Circle, Line)
  - Text tool
  - Select & move objects
  - Delete shapes
- **Modern UI/UX**
  - Elegant dark theme with animated gradients
  - Professional glassmorphism design
  - Smooth animations and transitions
  - Tooltips for better usability
- **Room Management**
  - Create or join rooms with unique IDs
  - Easy room sharing via ID copy
  - Automatic room cleanup
- **Performance Optimized**
  - Throttled cursor updates
  - Efficient WebSocket communication
  - Smooth drawing even with multiple users

## Tech Stack

**Frontend:**

- [Next.js 16](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Konva](https://konvajs.org/) & React-Konva - Canvas rendering
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Socket.io Client](https://socket.io/) - WebSocket client
- [Lucide React](https://lucide.dev/) - Icons
- [Lodash](https://lodash.com/) - Utility functions

**Backend:**

- [Node.js](https://nodejs.org/) - Runtime
- [Socket.io](https://socket.io/) - Real-time WebSocket server
- Custom Next.js server for WebSocket integration

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**

```bash
   git clone https://github.com/yourusername/collab-canvas.git
   cd collab-canvas
```

2. **Install dependencies**

```bash
   npm install
```

3. **Run the development server**

```bash
   npm run dev
```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Usage

1. **Create a Room**
   - Click "Create New Room" on the homepage
   - You'll be redirected to a unique room

2. **Share the Room**
   - Copy the Room ID from the bottom-left corner
   - Share it with collaborators
   - They can join by entering the ID on the homepage

3. **Start Drawing**
   - Select tools from the toolbar
   - Choose colors from the palette
   - Draw and collaborate in real-time

## Project Structure

```
collab-canvas/
├── app/
│   ├── page.tsx              # Home page (create/join room)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── room/
│       └── [roomId]/
│           └── page.tsx      # Room page (canvas)
├── components/
│   ├── Canvas.tsx            # Main canvas component
│   └── Toolbar.tsx           # Tools & color picker
├── store/
│   └── useCanvasStore.ts     # Zustand state management
├── lib/
│   └── socket.ts             # Socket.io client setup
├── types/
│   └── index.ts              # TypeScript types
├── server.js                 # Custom Next.js + Socket.io server
└── package.json
```

## Key Features Explained

### Real-time Synchronization

- Uses Socket.io for bidirectional communication
- All drawing actions are broadcasted to room participants
- Optimized with throttling to prevent network congestion

### Performance Optimizations

- Cursor updates throttled to 100ms intervals
- Only final shapes sent to network (not intermediate drawing states)
- Konva's `perfectDrawEnabled={false}` for better rendering performance
- Event listeners disabled on non-interactive shapes

### State Management

- Zustand store manages canvas state (shapes, tools, colors)
- Local state for drawing in progress
- WebSocket events sync state across clients

## Design Philosophy

- **Dark Elegance** - Inspired by modern design tools like Figma
- **Subtle Details** - Animated gradient orbs, glassmorphism effects
- **UX First** - Intuitive tooltips, smooth transitions, responsive feedback

## Configuration

The WebSocket server runs on port 3000 by default. To change:

```javascript
// server.js
const port = 3000; // Change this
```

## Scripts

```bash
npm run dev      # Start development server (with WebSocket)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import project to Vercel
3. Deploy

### Railway/Render (WebSocket Server)

1. Create new service
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Deploy

**Note:** You'll need to update the Socket.io client URL in `lib/socket.ts` to your production WebSocket server URL.

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**Sebastian Elohim Perrone**

Made with passion for clean code and great UX.

## Acknowledgments

- Next.js team for the amazing framework
- Socket.io for real-time capabilities
- Konva for powerful canvas rendering
- The open-source community

---

If you find this project helpful, please give it a star on GitHub!
