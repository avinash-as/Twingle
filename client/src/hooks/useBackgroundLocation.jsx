import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for background location tracking.
 * Uses navigator.geolocation.watchPosition to track location in the background
 * and periodically sends location batches to the server.
 */
export function useBackgroundLocation() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const watchIdRef = useRef(null);
  const batchRef = useRef([]);
  const batchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const BATCH_INTERVAL = 60000; // Send batch every 60 seconds
  const MAX_BATCH_SIZE = 20; // Max locations per batch

  // Check if background geolocation is supported
  const isSupported = useCallback(() => {
    return !!navigator.geolocation;
  }, []);

  // Check background location permission
  const checkBackgroundPermission = useCallback(async () => {
    if (!navigator.permissions) return 'prompt';
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch {
      return 'prompt';
    }
  }, []);

  // Send batch of locations to server
  const sendBatch = useCallback(async (locations) => {
    if (!user || locations.length === 0) return;

    try {
      const response = await api.post('/users/location/batch', { locations });
      return response.data;
    } catch (err) {
      console.error('Background location batch error:', err);
      throw err;
    }
  }, [user]);

  // Flush accumulated locations to server
  const flushBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    const batch = [...batchRef.current];
    batchRef.current = [];

    try {
      await sendBatch(batch);
    } catch (err) {
      // Re-queue failed locations
      batchRef.current = [...batch, ...batchRef.current];
      // Keep only last MAX_BATCH_SIZE to avoid unbounded growth
      if (batchRef.current.length > MAX_BATCH_SIZE) {
        batchRef.current = batchRef.current.slice(-MAX_BATCH_SIZE);
      }
    }
  }, [sendBatch, user]);

  // Start background location tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }

    // Check permission
    const permission = await checkBackgroundPermission();
    if (permission === 'denied') {
      setError('Location permission is denied. Please enable it in browser settings.');
      return false;
    }

    try {
      // Start watching location
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMountedRef.current) return;

          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || null,
            speed: position.coords.speed || null,
            heading: position.coords.heading || null,
            timestamp: position.timestamp,
          };

          setLastLocation(coords);
          batchRef.current.push(coords);

          // Auto-flush when batch is full
          if (batchRef.current.length >= MAX_BATCH_SIZE) {
            flushBatch();
          }
        },
        (err) => {
          setError(err.message);
          console.error('Background location watch error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );

      // Set up periodic batch flush
      batchTimeoutRef.current = setInterval(() => {
        flushBatch();
      }, BATCH_INTERVAL);

      setIsTracking(true);
      setError(null);

      // Store tracking state
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('twingle_background_location', 'true');
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [checkBackgroundPermission, flushBatch, sendBatch, user]);

  // Stop background location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (batchTimeoutRef.current !== null) {
      clearInterval(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Flush remaining locations
    flushBatch();

    setIsTracking(false);
    setError(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('twingle_background_location');
    }
  }, [flushBatch]);

  // Resume tracking on mount if previously enabled
  useEffect(() => {
    isMountedRef.current = true;

    const wasTracking = typeof localStorage !== 'undefined'
      ? localStorage.getItem('twingle_background_location') === 'true'
      : false;

    if (wasTracking && user) {
      startTracking();
    }

    return () => {
      isMountedRef.current = false;
      // Don't stop tracking on unmount - we want background tracking to continue
    };
  }, [startTracking, user]);

  // Cleanup on unmount - flush any remaining locations
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (batchRef.current.length > 0) {
        // Can't await in cleanup, just fire and forget
        flushBatch();
      }
    };
  }, [flushBatch]);

  return {
    isTracking,
    error,
    lastLocation,
    isSupported: isSupported(),
    startTracking,
    stopTracking,
    checkPermission: checkBackgroundPermission,
    flushBatch,
  };
}

export default useBackgroundLocation;