import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Auto-save the user's location (if permission already granted) so they are
  // discoverable by nearby Twingle users even before running a scan.
  useEffect(() => {
    if (!user) return;
    if (!navigator.geolocation) return;

    const saveLocation = async (coords) => {
      try {
        await api.post('/users/location', {
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      } catch (e) {
        console.error('Auto location save failed', e);
      }
    };

    const tryAutoLocation = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state !== 'granted') return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            saveLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      } catch {}
    };

    tryAutoLocation();
  }, [user]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = response.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { accessToken, user: userData } = response.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...userData } : null;
      if (userData && updated) {
        localStorage.setItem('user', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}