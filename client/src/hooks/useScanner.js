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
  const [scanError, setScanError] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const scanTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scanningRef = useRef(false);
  const progressIntervalRef = useRef(null);

  const SCAN_DURATION = 30000; // 30 seconds

  const startScan = useCallback(async (location) => {
    if (scanningRef.current || !location) return;

    scanningRef.current = true;
    setScanning(true);
    setNearbyUsers([]);
    setScanCount(0);
    setScanError(null);
    setScanProgress(0);

    // Simulate progress over SCAN_DURATION
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / SCAN_DURATION) * 100, 100);
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, 100);

    try {
      console.log('Starting scan with location:', location);
      
      await api.post('/users/location', {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      console.log('Location updated successfully');

      // Do the actual search but don't show results until scan completes
      const response = await api.get('/users/nearby', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          maxDistance: 5000,
        },
      });
      console.log('Nearby users response:', response.data);

      emit('update_location', {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Store results but wait for scan duration to complete
      const scanResults = response.data;

      // Wait for scan duration to complete before showing results
      scanTimeoutRef.current = setTimeout(() => {
        setNearbyUsers(scanResults);
        setScanCount(scanResults.length);
        setScanProgress(100);
        scanningRef.current = false;
        setScanning(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }, SCAN_DURATION);
    } catch (error) {
      console.error('Scan error:', error);
      setScanError(error.response?.data?.message || error.message || 'Scan failed');
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      scanningRef.current = false;
      setScanning(false);
    }
  }, [emit]);

  const stopScan = useCallback(() => {
    setScanning(false);
    setScanProgress(0);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    scanningRef.current = false;
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
    scanError,
    scanProgress,
  };
}