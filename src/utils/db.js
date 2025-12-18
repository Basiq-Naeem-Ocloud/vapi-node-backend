import mongoose from 'mongoose';
import { logger } from './logger.js';

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    logger.info('✅ Successfully connected to MongoDB');
  } catch (error) {
    logger.error({ error }, '❌ MongoDB connection error');
    throw error;
  }
}

export async function disconnectFromMongoDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from MongoDB');
    throw error;
  }
}

