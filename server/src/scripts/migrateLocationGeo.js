/**
 * Migration script to populate locationGeo field for existing users
 * Run with: node src/scripts/migrateLocationGeo.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { config } from '../config/env.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Find users with legacy location but no locationGeo
    const users = await User.find({
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null },
      $or: [
        { locationGeo: { $exists: false } },
        { 'locationGeo.coordinates': { $exists: false } },
        { 'locationGeo.coordinates': null },
      ],
    });

    console.log(`Found ${users.length} users to migrate`);

    let updated = 0;
    for (const user of users) {
      const { latitude, longitude } = user.location;
      
      user.locationGeo = {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
      };
      
      await user.save();
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`Migrated ${updated}/${users.length} users`);
      }
    }

    console.log(`Migration complete! Updated ${updated} users.`);

    // Verify index exists
    const indexes = await User.collection.indexes();
    const has2dsphere = indexes.some(idx => 
      idx.key && idx.key.locationGeo === '2dsphere'
    );
    
    if (has2dsphere) {
      console.log('✓ 2dsphere index exists on locationGeo');
    } else {
      console.log('⚠ 2dsphere index NOT found - creating...');
      await User.collection.createIndex({ locationGeo: '2dsphere' });
      console.log('✓ 2dsphere index created');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

migrate();