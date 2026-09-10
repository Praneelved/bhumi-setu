import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let globalSocket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = getAuthToken();
  if (!token) {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }
    return null;
  }

  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    globalSocket.on('connect', () => {
      console.log('⚡ Connected to BhoomiSetu Real-Time Socket.IO Server:', globalSocket?.id);
    });

    globalSocket.on('authenticated', (data) => {
      console.log('🔒 Socket authenticated:', data);
    });

    globalSocket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });
  }

  return globalSocket;
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}

/**
 * Custom React Hook to subscribe to real-time BhoomiSetu events.
 */
export function useSocket(eventHandlers?: Record<string, (data: any) => void>) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setIsConnected(false);
      return;
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    // Register dynamic event handlers
    const registered: Array<{ event: string; fn: (data: any) => void }> = [];
    if (handlersRef.current) {
      Object.entries(handlersRef.current).forEach(([event, handler]) => {
        const wrapped = (data: any) => handler(data);
        socket.on(event, wrapped);
        registered.push({ event, fn: wrapped });
      });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      registered.forEach(({ event, fn }) => {
        socket.off(event, fn);
      });
    };
  }, []);

  return { isConnected, socket: globalSocket };
}
