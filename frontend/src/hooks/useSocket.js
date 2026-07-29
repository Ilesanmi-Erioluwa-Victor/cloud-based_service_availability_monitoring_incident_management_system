import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribe = (event, callback) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, callback);
    }
    return () => {
      if (socket) socket.off(event, callback);
    };
  };

  return { socket: socketRef.current, subscribe };
}