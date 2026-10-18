import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for push notifications.
 * Handles subscription, permission management, and sending notifications.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vapidPublicKey, setVapidPublicKey] = useState(null);

  // Check if push notifications are supported
  useEffect(() => {
    setIsSupported(
      'serviceWorker' in navigator && 'PushManager' in window
    );
  }, []);

  // Get push subscription status from server
  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      try {
        const response = await api.get('/push/status');
        setIsSubscribed(response.data.subscribed);
        setVapidPublicKey(response.data.vapidPublicKey);
      } catch (err) {
        console.error('Push status check error:', err);
      }
    };

    checkStatus();
  }, [user]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user || !navigator.serviceWorker || !navigator.pushManager) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const statusResponse = await api.get('/push/status');
      const publicKey = statusResponse.data.vapidPublicKey;

      if (!publicKey) {
        setError('Push notifications not configured on server');
        setIsLoading(false);
        return false;
      }

      // Convert VAPID public key to Uint8Array
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
      };

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to server
      await api.post('/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode(...new Uint8Array(subscription.keys.p256dh))
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.keys.auth))
          ),
        },
      });

      setIsSubscribed(true);
      setError(null);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      setError(err.message || 'Failed to subscribe to push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      await api.post('/push/unsubscribe', {
        endpoint: subscription?.endpoint,
      });

      setIsSubscribed(false);
      setError(null);
      return true;
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Send test notification
  const sendTest = useCallback(async () => {
    if (!user) return false;

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/push/test');
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send test notification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSubscribed,
    isSupported,
    isLoading,
    error,
    vapidPublicKey,
    subscribe,
    unsubscribe,
    sendTest,
  };
}

export default usePushNotifications;