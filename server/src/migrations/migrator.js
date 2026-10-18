import mongoose from 'mongoose';

const migrationLogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  executedAt: {
    type: Date,
    default: Date.now,
  },
});

const MigrationLog = mongoose.model('MigrationLog', migrationLogSchema);

/**
 * Run all pending migrations
 */
export async function runMigrations() {
  console.log('Running database migrations...');

  // Ensure MigrationLog collection exists
  await MigrationLog.createCollection();

  // Get list of already-run migrations
  const runMigrations = await MigrationLog.find().distinct('name');
  const runMigrationNames = new Set(runMigrations);

  // List of available migrations (add new ones here)
  const migrations = [
    addLocationGeoField,
    addDiscoverabilityFields,
    addMessageMetadataFields,
    addProfileFields,
  ];

  for (const migration of migrations) {
    const migrationName = migration.name;

    if (runMigrationNames.has(migrationName)) {
      console.log(`  Skipping already applied migration: ${migrationName}`);
      continue;
    }

    console.log(`  Running migration: ${migrationName}...`);
    try {
      await migration();
      await MigrationLog.create({ name: migrationName });
      console.log(`    ✓ Migration completed: ${migrationName}`);
    } catch (error) {
      console.error(`    ✗ Migration failed: ${migrationName}`);
      console.error(error);
      throw error;
    }
  }

  console.log('Database migrations completed.');
}

/**
 * Migration: Add locationGeo field to User model
 */
async function addLocationGeoField() {
  const User = mongoose.model('User');
  const users = await User.find({
    'location.latitude': { $ne: null },
    'location.longitude': { $ne: null },
    $or: [
      { locationGeo: { $exists: false } },
      { 'locationGeo.coordinates': { $exists: false } },
    ],
  });

  for (const user of users) {
    user.locationGeo = {
      type: 'Point',
      coordinates: [user.location.longitude, user.location.latitude],
    };
    await user.save();
  }

  console.log(`    Migrated ${users.length} users to GeoJSON location format.`);
}

/**
 * Migration: Add discoverability fields
 */
async function addDiscoverabilityFields() {
  const User = mongoose.model('User');
  const result = await User.updateMany(
    {
      isDiscoverable: { $exists: false },
    },
    {
      isDiscoverable: true,
    },
  );

  console.log(`    Updated ${result.modifiedCount} users with default discoverability.`);
}

/**
 * Migration: Add message metadata fields
 */
async function addMessageMetadataFields() {
  const Message = mongoose.model('Message');
  const result = await Message.updateMany(
    {
      messageType: { $exists: false },
    },
    {
      messageType: 'text',
    },
  );

  console.log(`    Updated ${result.modifiedCount} messages with default message type.`);
}

/**
 * Migration: Add profile enhancement fields
 */
async function addProfileFields() {
  const User = mongoose.model('User');

  // Add photos field
  await User.updateMany(
    {
      photos: { $exists: false },
    },
    {
      photos: [],
    },
  );

  // Add isVerified field
  await User.updateMany(
    {
      isVerified: { $exists: false },
    },
    {
      isVerified: false,
    },
  );

  // Add verificationBadge field
  await User.updateMany(
    {
      verificationBadge: { $exists: false },
    },
    {
      verificationBadge: 'none',
    },
  );

  console.log('    Updated all users with profile enhancement fields.');
}

export default {
  runMigrations,
  migrations: [
    addLocationGeoField,
    addDiscoverabilityFields,
    addMessageMetadataFields,
    addProfileFields,
  ],
};