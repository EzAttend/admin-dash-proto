import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });
    // await mongoose.connect(ENV.MONGODB_URI);
    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[DB] MongoDB disconnected gracefully');
}
