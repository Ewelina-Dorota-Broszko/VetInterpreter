// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const { JWT_SECRET, JWT_EXPIRES } = process.env;
if (!JWT_SECRET) throw new Error('Brak JWT_SECRET w .env');

export type UserRole = 'owner' | 'vet' | 'admin';

export interface AuthedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthedRequest extends Request {
  user?: AuthedUser;
}

const SECRET: Secret = JWT_SECRET;
const EXPIRES_SECONDS = JWT_EXPIRES ? Number(JWT_EXPIRES) : 60 * 60 * 24 * 7;

/** Tworzenie tokenu z rolą */
export function signToken(payload: AuthedUser) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_SECONDS });
}

/** Weryfikacja Bearer token + rola */
export function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  const [, token] = hdr.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing Authorization header' });

  try {
    const decoded = jwt.verify(token, SECRET) as Partial<AuthedUser> & { sub?: string };
    const id = decoded.id || decoded.sub;
    const email = decoded.email;
    const role = (decoded.role as UserRole) || 'owner';
    if (!id || !email) throw new Error('Malformed token');
    req.user = { id: String(id), email: String(email), role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Tylko admin */
export function adminOnly(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}

/** Wymagana jedna z ról */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
