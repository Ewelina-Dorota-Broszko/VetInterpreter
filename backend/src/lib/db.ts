import mongoose from 'mongoose';

export async function connectDB(uri: string) {
  if (!uri) throw new Error('Brak MONGO_URL w .env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('✅ Połączono z MongoDB');
}
