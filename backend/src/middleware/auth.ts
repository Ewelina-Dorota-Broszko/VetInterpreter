import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const { JWT_SECRET, JWT_EXPIRES } = process.env;
if (!JWT_SECRET) throw new Error('Brak JWT_SECRET w .env');

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

const SECRET: Secret = JWT_SECRET;
const EXPIRES_SECONDS = JWT_EXPIRES ? Number(JWT_EXPIRES) : 60 * 60 * 24 * 7;

/** Tworzenie tokenu */
export function signToken(payload: { id: string; email: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_SECONDS });
}

/** Weryfikacja Bearer token */
export function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  const [, token] = hdr.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing Authorization header' });
  try {
    const decoded = jwt.verify(token, SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
