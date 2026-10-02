import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/twingle';

async function dropUsersCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await mongoose.connection.db.collection('users').drop();
    console.log('Users collection dropped');
    
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

dropUsersCollection();