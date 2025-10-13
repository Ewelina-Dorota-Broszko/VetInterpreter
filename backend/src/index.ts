import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './lib/db';

import authRouter from './routes/auth';
import ownersRouter from './routes/owners';
import animalsRouter from './routes/animals';
import vetRoutes from './routes/vets';
import adminRoutes from './routes/admin';
import vetFiles from './routes/vetFiles';

const app = express();

// 🔒 Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Prosty endpoint do testów
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routing
app.use('/auth', authRouter);
app.use('/owners', ownersRouter);
app.use('/animals', animalsRouter);
app.use('/vets', vetRoutes); 
app.use('/admin', adminRoutes);
app.use('/vet-files', vetFiles);
// app.use((req, _res, next) => {
//   console.log('[APP]', req.method, req.url);
//   next();
// });

// Konfiguracja serwera
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0'; // ważne: nasłuchuj na wszystkich interfejsach
const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URI;

if (!MONGO_URL) {
  console.error('❌ Brak MONGO_URL/MONGO_URI w pliku .env');
  process.exit(1);
}

// Start aplikacji
connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`🚀 API listening on http://${HOST}:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('❌ DB connection error:', e);
    process.exit(1);
  });
