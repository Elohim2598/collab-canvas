import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollabCanvas - Real-time Collaborative Whiteboard",
  description: "A modern real-time collaborative whiteboard built with Next.js, Socket.io, and Konva. Draw, design, and collaborate with others instantly with live cursors and elegant dark UI.",
  keywords: ["whiteboard", "collaborative", "real-time", "drawing", "canvas", "next.js", "socket.io", "konva"],
  authors: [{ name: "Sebastian Elohim Perrone" }],
  creator: "Sebastian Elohim Perrone",
  openGraph: {
    title: "CollabCanvas - Real-time Collaborative Whiteboard",
    description: "Draw and collaborate in real-time with an elegant, modern whiteboard application",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CollabCanvas - Real-time Collaborative Whiteboard",
    description: "Draw and collaborate in real-time with an elegant, modern whiteboard application",
    creator: "@yourtwitterhandle", // Replace with your Twitter handle if you have one
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}