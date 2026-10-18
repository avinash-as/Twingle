import webpush from 'web-push';
import { config } from '../config/env.js';

// VAPID key pair for push notification encryption
// Generate new keys with: web-push generate-vapid-keys --json
// Store these in environment variables: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

let isConfigured = false;

// Configure webpush only if keys are available
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@twingle.app',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    isConfigured = true;
    console.log('Push notifications: VAPID keys configured');
  } catch (error) {
    console.warn('Push notifications: Failed to configure VAPID keys:', error.message);
  }
} else {
  console.warn('WARNING: VAPID keys not configured. Push notifications will not work.');
  console.warn('Generate keys with: web-push generate-vapid-keys --json');
  console.warn('Then set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
}

/**
 * Send push notification to a subscription
 */
export const sendPushNotification = async (subscription, payload, options = {}) => {
  if (!isConfigured) {
    throw new Error('VAPID keys not configured');
  }

  const pushPayload = JSON.stringify({
    title: payload.title || 'Twingle',
    body: payload.body || '',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    data: payload.data || {},
    actions: payload.actions || [],
    vibrate: payload.vibrate || [100, 50, 100],
    timestamp: Date.now(),
    ...options,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      pushPayload,
      {
        TTL: options.ttl || 86400, // 24 hours
      }
    );
    return { success: true };
  } catch (error) {
    // If subscription is expired/invalid, return error so caller can clean up
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true, error: error.message };
    }
    throw error;
  }
};

/**
 * Generate new VAPID key pair
 */
export const generateVapidKeys = () => {
  return webpush.generateVAPIDKeys();
};

/**
 * Check if push notifications are configured
 */
export const isPushConfigured = () => {
  return isConfigured;
};