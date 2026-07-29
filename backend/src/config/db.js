import mongoose from 'mongoose';
import env from './env.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);

    await createIndexes();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function createIndexes() {
  const db = mongoose.connection.db;

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('services').createIndex({ isActive: 1, lastCheckedAt: 1 });
  await db.collection('checkResults').createIndex({ serviceId: 1, checkedAt: -1 });
  await db.collection('checkResults').createIndex({ checkedAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });
  await db.collection('incidents').createIndex({ serviceId: 1, status: 1 });
  await db.collection('maintenanceWindows').createIndex({ serviceId: 1, startAt: 1, endAt: 1 });
}

export function getDB() {
  return mongoose.connection.db;
}