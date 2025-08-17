import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './lib/db';

import authRouter from './routes/auth';
import ownersRouter from './routes/owners';
import animalsRouter from './routes/animals';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/owners', ownersRouter);
app.use('/animals', animalsRouter);

const PORT = Number(process.env.PORT || 4000);
const MONGO_URL = process.env.MONGO_URL as string;

connectDB(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`🚀 API: http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('❌ DB error', e);
    process.exit(1);
  });
