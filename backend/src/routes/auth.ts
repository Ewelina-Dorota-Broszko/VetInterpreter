// backend/src/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import Owner from '../models/owner';
import { auth, AuthedRequest, signToken } from '../middleware/auth';

const router = Router();

function isEmail(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function isPhone(s: string) { return /^(\+?\d[\d\s-]{5,})$/.test(s); }
function escapeRegExp(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function ciEmail(email: string) { return new RegExp(`^${escapeRegExp(String(email).trim())}$`, 'i'); }

async function ensureOwnerForUser(user: any) {
  let owner = await Owner.findOne({ userId: user._id });
  if (!owner) {
    owner = await Owner.create({
      userId: user._id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      email: user.email,
      phone: user.phone
    });
  }
  return owner;
}

/** POST /auth/register */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, isVet } = req.body;

    if (!email || !password || !firstName || !lastName || !phone || isVet === undefined) {
      return res.status(400).json({ error: 'email, password, firstName, lastName, phone, isVet są wymagane' });
    }
    if (!isEmail(email)) return res.status(400).json({ error: 'Nieprawidłowy email' });
    if (!isPhone(phone)) return res.status(400).json({ error: 'Nieprawidłowy numer telefonu' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Hasło musi mieć min. 6 znaków' });

    // ✅ duplikaty e-mail — case-insensitive
    const exists = await User.findOne({ email: ciEmail(email) });
    if (exists) return res.status(409).json({ error: 'Email już zarejestrowany' });

    const passwordHash = await bcrypt.hash(password, 12);
    const role = Boolean(isVet) ? 'vet' : 'owner';

    const user = await User.create({
      email, passwordHash, firstName, lastName, phone,
      isVet: Boolean(isVet),
      role
    });

    const owner = await ensureOwnerForUser(user);
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        phone: user.phone, isVet: user.isVet, role: user.role, lastLoginAt: user.lastLoginAt || null
      },
      owner: { id: owner._id, name: owner.name, email: owner.email, phone: owner.phone }
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** POST /auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email i password są wymagane' });

    // ✅ login — case-insensitive
    const user = await User.findOne({ email: ciEmail(email) });
    if (!user) return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });

    // ✅ lastLoginAt
    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    const owner = await ensureOwnerForUser(user);
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        phone: user.phone, isVet: user.isVet, role: user.role, lastLoginAt: user.lastLoginAt
      },
      owner: { id: owner._id, name: owner.name, email: owner.email, phone: owner.phone }
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** GET /auth/me */
router.get('/me', auth, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const owner = await ensureOwnerForUser(user);
  res.json({
    id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName,
    phone: user.phone, isVet: user.isVet, role: user.role, lastLoginAt: user.lastLoginAt || null,
    ownerId: owner._id, createdAt: user.createdAt
  });
});

/** POST /auth/logout */
router.post('/logout', (_req, res) => res.json({ message: 'Logged out' }));

/** POST /auth/check-email */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !isEmail(email)) return res.status(400).json({ error: 'Podaj prawidłowy email' });
    // ✅ case-insensitive
    const exists = await User.findOne({ email: ciEmail(email) }).lean();
    return res.json({ available: !exists });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

/** POST /auth/change-password */
router.post('/change-password', auth, async (req: AuthedRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'oldPassword i newPassword są wymagane' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Nowe hasło musi mieć min. 6 znaków' });
    }

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Nieprawidłowe stare hasło' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: 'Hasło zmienione' });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

/** POST /auth/refresh */
router.post('/refresh', auth, async (req: AuthedRequest, res) => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = signToken({ id: String(user._id), email: user.email, role: user.role });
    return res.json({ token });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;
