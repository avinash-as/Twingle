/**
 * Migration runner script
 * Run with: node src/migrations/run-migrations.js
 * Requires MONGODB_URI environment variable
 */

import dotenv from 'dotenv';
import { runMigrations } from './migrator.js';

dotenv.config({ path: '.env' });

async function main() {
  try {
    await runMigrations();
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();