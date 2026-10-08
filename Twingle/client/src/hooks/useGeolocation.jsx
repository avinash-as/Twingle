import { useState, useCallback, useEffect, useRef } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = new Error('Geolocation is not supported by your browser');
        setError(err);
        reject(err);
        return;
      }

      if (loading) return;

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          setError(err);
          setLoading(false);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    }); // Close the Promise callback
  }, [loading]);

  const watchLocation = useCallback((onUpdate) => {
    if (!navigator.geolocation) return null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(coords);
        onUpdate?.(coords);
      },
      (err) => setError(err),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      getCurrentLocation().catch(() => {});
    }
  }, []);

  return { location, error, loading, getCurrentLocation, watchLocation };
}

export function useLocationPermission() {
  const [permission, setPermission] = useState('prompt');

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch {
      return 'prompt';
    }
  }, []);

  useEffect(() => {
    checkPermission().then((state) => {
      setPermission(state);
    });
  }, []);

  return { permission, checkPermission: () => permission };
}