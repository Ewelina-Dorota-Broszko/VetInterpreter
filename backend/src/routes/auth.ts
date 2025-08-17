import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import Owner from '../models/owner';
import { auth, AuthedRequest, signToken } from '../middleware/auth';

const router = Router();

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isPhone(s: string) {
  return /^(\+?\d[\d\s-]{5,})$/.test(s);
}

async function ensureOwnerForUser(user: { _id: any; email: string; firstName: string; lastName: string; phone: string }) {
  let owner = await Owner.findOne({ userId: user._id });
  if (!owner) {
    owner = await Owner.create({
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`.trim(),
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

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email już zarejestrowany' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email, passwordHash, firstName, lastName, phone, isVet: Boolean(isVet)
    });

    const owner = await ensureOwnerForUser(user);
    const token = signToken({ id: user._id.toString(), email: user.email });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isVet: user.isVet
      },
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone
      }
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** POST /auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email i password są wymagane' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });

    const owner = await ensureOwnerForUser(user);
    const token = signToken({ id: user._id.toString(), email: user.email });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isVet: user.isVet
      },
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone
      }
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
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isVet: user.isVet,
    ownerId: owner._id,
    createdAt: user.createdAt
  });
});

export default router;
