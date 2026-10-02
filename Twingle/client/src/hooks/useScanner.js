import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function useScanner() {
  const { user } = useAuth();
  const { emit, on, off } = useSocket();
  const [scanning, setScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [scanCount, setScanCount] = useState(0);
  const scanTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  const startScan = useCallback(async (location) => {
    if (scanning || !location) return;

    setScanning(true);
    setNearbyUsers([]);
    setScanCount(0);

    try {
      await api.post('/users/location', {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const response = await api.get('/users/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistance: 5000,
        },
      });

      setNearbyUsers(response.data);
      setScanCount(response.data.length);

      emit('update_location', {
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(false);
    }
  }, [scanning, emit]);

  const stopScan = useCallback(() => {
    setScanning(false);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleUserOnline = (data) => {
      setNearbyUsers((prev) => {
        if (prev.some((u) => u.id === data.userId)) return prev;
        return [...prev, { id: data.userId, name: data.name, avatar: data.avatar, distance: 0, isOnline: true }];
      });
    };

    const handleUserOffline = (data) => {
      setNearbyUsers((prev) => prev.filter((u) => u.id !== data.userId));
    };

    on('user_online', handleUserOnline);
    on('user_offline', handleUserOffline);

    return () => {
      off('user_online', handleUserOnline);
      off('user_offline', handleUserOffline);
    };
  }, [on, off]);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return {
    scanning,
    nearbyUsers,
    scanCount,
    startScan,
    stopScan,
    setNearbyUsers,
  };
}