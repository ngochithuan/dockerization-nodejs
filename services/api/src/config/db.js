import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

export async function connectMongo() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('[api] MongoDB connected');
}

export function mongoReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
