// src/db/connectDB.ts
import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL;
  if (!uri) {
    console.error('❌ Brak MONGO_URI/MONGO_URL w .env');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
    } as any);
    console.log('✅ MongoDB Atlas: connected');
  } catch (err) {
    console.error('❌ DB error', err);
    process.exit(1);
  }
}
