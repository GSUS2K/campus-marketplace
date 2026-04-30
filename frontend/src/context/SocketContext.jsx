import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connect to the Node.js backend
    const newSocket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`, {
      transports: ['websocket', 'polling'] // Try WebSocket first
    });
    
    setSocket(newSocket);

    // Default systemic listeners for your dissertation features
    newSocket.on('smart_alert', (data) => {
      console.log('Smart Alert Received:', data);
      setAlerts(prev => [...prev, data]);
      // Note: Ideally, bind this strictly to a Toast Notification system later
    });

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, alerts }}>
      {children}
    </SocketContext.Provider>
  );
};
