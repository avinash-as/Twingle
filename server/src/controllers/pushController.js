import PushSubscription from '../models/PushSubscription.js';
import { sendPushNotification, isPushConfigured } from '../utils/push.js';
import { AppError, ERROR_CODES, asyncHandler } from '../utils/errors.js';

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body;

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid push subscription', 400);
  }

  // Check if subscription already exists
  let subscription = await PushSubscription.findOne({
    user: req.user._id,
    endpoint,
  });

  if (subscription) {
    // Update existing subscription
    subscription.keys = keys;
    subscription.isActive = true;
    subscription.userAgent = req.get('user-agent') || undefined;
    subscription.updatedAt = new Date();
    await subscription.save();
  } else {
    // Create new subscription
    subscription = await PushSubscription.create({
      user: req.user._id,
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      userAgent: req.get('user-agent') || undefined,
    });
  }

  res.json({
    message: 'Subscribed to push notifications',
    subscriptionId: subscription._id,
  });
});

/**
 * Unsubscribe from push notifications
 * POST /api/push/unsubscribe
 */
export const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Endpoint is required', 400);
  }

  await PushSubscription.findOneAndUpdate(
    { user: req.user._id, endpoint },
    { isActive: false, updatedAt: new Date() }
  );

  res.json({
    message: 'Unsubscribed from push notifications',
  });
});

/**
 * Get user's push subscription status
 * GET /api/push/status
 */
export const getStatus = asyncHandler(async (req, res) => {
  const subscription = await PushSubscription.findOne({
    user: req.user._id,
    isActive: true,
  });

  res.json({
    subscribed: !!subscription,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
  });
});

/**
 * Send test push notification (for development)
 * POST /api/push/test
 */
export const sendTest = asyncHandler(async (req, res) => {
  if (!isPushConfigured()) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Push notifications not configured', 400);
  }

  const subscription = await PushSubscription.findOne({
    user: req.user._id,
    isActive: true,
  });

  if (!subscription) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'No active push subscription', 400);
  }

  const result = await sendPushNotification(subscription, {
    title: 'Twingle Test Notification',
    body: 'Push notifications are working!',
    data: { type: 'test' },
  });

  if (!result.success) {
    if (result.expired) {
      await PushSubscription.findOneAndUpdate(
        { user: req.user._id, endpoint: subscription.endpoint },
        { isActive: false, updatedAt: new Date() }
      );
    }
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, result.error, 500);
  }

  res.json({
    message: 'Test push notification sent',
  });
});

/**
 * Send push notification to a user (internal helper)
 */
export const sendPushToUser = async (userId, payload) => {
  if (!isPushConfigured()) {
    return;
  }

  try {
    const subscription = await PushSubscription.findOne({
      user: userId,
      isActive: true,
    });

    if (!subscription) {
      return;
    }

    const result = await sendPushNotification(subscription, payload);

    if (!result.success && result.expired) {
      await PushSubscription.findOneAndUpdate(
        { user: userId, endpoint: subscription.endpoint },
        { isActive: false, updatedAt: new Date() }
      );
    }
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

export default {
  subscribe,
  unsubscribe,
  getStatus,
  sendTest,
  sendPushToUser,
};