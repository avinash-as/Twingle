import { z } from 'zod';

// Reusable schemas
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Auth validations
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name cannot exceed 50 characters').trim(),
    email: z.string().email('Please provide a valid email').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

// User validations
export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }),
});

export const getNearbyUsersSchema = z.object({
  query: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    maxDistance: z.coerce.number().int().min(100).max(50000).default(5000),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    ageMin: z.coerce.number().int().min(18).max(120).optional(),
    ageMax: z.coerce.number().int().min(18).max(120).optional(),
    interests: z.string().optional(), // comma-separated list
    genderPreference: z.enum(['male', 'female', 'other', 'any', 'prefer_not_to_say']).optional(),
  }).merge(paginationSchema),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).trim().optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
    bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
    isDiscoverable: z.boolean().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    age: z.coerce.number().int().min(18).max(120).optional(),
    interests: z.array(z.string().max(50)).max(10).optional(),
    photos: z.array(z.string().url()).max(6).optional(),
    genderPreference: z.enum(['male', 'female', 'other', 'any', 'prefer_not_to_say']).optional(),
    agePreferenceMin: z.coerce.number().int().min(18).max(120).optional(),
    agePreferenceMax: z.coerce.number().int().min(18).max(120).optional(),
  }).refine(data => {
    if (data.agePreferenceMin && data.agePreferenceMax && data.agePreferenceMin > data.agePreferenceMax) {
      return false;
    }
    return true;
  }, {
    message: 'agePreferenceMin must be less than or equal to agePreferenceMax',
  }),
});

export const setDiscoverableSchema = z.object({
  body: z.object({
    isDiscoverable: z.boolean(),
  }),
});

export const getUserProfileSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Connection validations
export const sendConnectionRequestSchema = z.object({
  body: z.object({
    receiverId: objectIdSchema,
  }),
});

export const connectionIdParamSchema = z.object({
  params: z.object({
    connectionId: objectIdSchema,
    id: objectIdSchema, // for accept/reject routes
  }),
});

export const getPendingRequestsSchema = z.object({
  query: paginationSchema,
});

// Message validations
export const sendMessageSchema = z.object({
  body: z.object({
    receiverId: objectIdSchema,
    content: z.string().max(2000, 'Message cannot exceed 2000 characters').optional(),
    messageType: z.enum(['text', 'image', 'file', 'voice', 'video']).optional().default('text'),
    mediaUrl: z.string().url('Media URL must be valid').optional(),
    mediaMetadata: z.object({
      fileName: z.string().optional(),
      fileSize: z.number().min(0).optional(),
      mimeType: z.string().optional(),
      duration: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    }).optional(),
    replyTo: objectIdSchema.optional(),
  }).refine((data) => {
    if (data.messageType === 'text' && !data.content) {
      return false;
    }
    if (data.messageType !== 'text' && !data.mediaUrl) {
      return false;
    }
    return true;
  }, {
    message: 'Content is required for text messages, media URL is required for non-text messages',
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  query: paginationSchema,
});

export const markAsReadSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});

export const getConversationsSchema = z.object({
  query: paginationSchema,
});

// Socket event validations (for runtime validation)
export const socketEvents = {
  update_location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  set_discoverable: z.boolean(),
  send_connection_request: z.object({
    receiverId: objectIdSchema,
  }),
  accept_connection: z.object({
    connectionId: objectIdSchema,
  }),
  reject_connection: z.object({
    connectionId: objectIdSchema,
  }),
  send_message: z.object({
    receiverId: objectIdSchema,
    content: z.string().max(2000).optional(),
    messageType: z.enum(['text', 'image', 'file', 'voice', 'video']).optional().default('text'),
    mediaUrl: z.string().url('Media URL must be valid').optional(),
    mediaMetadata: z.object({
      fileName: z.string().optional(),
      fileSize: z.number().min(0).optional(),
      mimeType: z.string().optional(),
      duration: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
    }).optional(),
    replyTo: objectIdSchema.optional(),
  }).refine((data) => {
    if (data.messageType === 'text' && !data.content) {
      return false;
    }
    if (data.messageType !== 'text' && !data.mediaUrl) {
      return false;
    }
    return true;
  }, {
    message: 'Content is required for text messages, media URL is required for non-text messages',
  }),
  typing: z.object({
    receiverId: objectIdSchema,
  }),
  stop_typing: z.object({
    receiverId: objectIdSchema,
  }),
  mark_as_read: z.object({
    receiverId: objectIdSchema,
  }),
};

// Background location validations
export const batchLocationSchema = z.object({
  body: z.object({
    locations: z.array(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        accuracy: z.number().min(0).optional(),
        altitude: z.number().optional(),
        speed: z.number().min(0).optional(),
        heading: z.number().min(0).max(360).optional(),
        timestamp: z.string().datetime().optional(),
      })
    ).min(1).max(100),
  }),
});

// Message reaction validations
export const addReactionSchema = z.object({
  params: z.object({
    messageId: objectIdSchema,
  }),
  body: z.object({
    emoji: z.string().min(1).max(10, 'Emoji must be between 1 and 10 characters'),
  }),
});

// Message edit validations
export const editMessageSchema = z.object({
  params: z.object({
    messageId: objectIdSchema,
  }),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(2000, 'Message cannot exceed 2000 characters'),
  }),
});