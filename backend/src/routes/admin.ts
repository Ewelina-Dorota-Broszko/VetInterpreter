import { Router } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

import { auth, AuthedRequest } from '../middleware/auth';
import User from '../models/user';
import Vet from '../models/vet';
import Owner from '../models/owner';
import Animal from '../models/animal';

const router = Router();

// wszystkie trasy admina wymagają logowania
router.use(auth);

// prosta weryfikacja roli admina
function adminOnly(req: AuthedRequest, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

const isOid = (s: string) => Types.ObjectId.isValid(s);
const oid = (s: string) => new Types.ObjectId(s);

/* =========================================
   VETS
========================================= */

// GET /admin/vets?search=...&page=1&limit=50
router.get('/vets', adminOnly, async (req, res) => {
  const { search = '', page = '1', limit = '50' } = req.query as Record<string, string>;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

  const q: any = {};
  if (search && String(search).trim()) {
    const rx = new RegExp(String(search).trim(), 'i');
    q.$or = [
      { clinicName: rx },
      { licenseNo: rx },
      { phone: rx },
      { email: rx }, // jeżeli Vet ma własny email
    ];
  }

  // pobierz profile vetów
  const vets = await Vet.find(q)
    .sort({ clinicName: 1 })
    .skip((p - 1) * l)
    .limit(l)
    .lean();

  // dociągnij userów (email, lastLoginAt)
  const userIds = vets.map(v => v.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }, { email: 1, lastLoginAt: 1 }).lean();
  const byId = new Map(users.map(u => [String(u._id), u]));

  const rows = vets.map(v => ({
    vetId: String(v._id),
    clinicName: v.clinicName,
    licenseNo: v.licenseNo,
    phone: v.phone,
    email: v.email || byId.get(String(v.userId))?.email || '',
    userId: String(v.userId),
    lastLoginAt: byId.get(String(v.userId))?.lastLoginAt || null,
  }));

  const total = await Vet.countDocuments(q);
  res.json({ page: p, limit: l, total, rows });
});

// DELETE /admin/vets/:vetId  — usuwa profil veta i powiązanego usera, oraz odpina zwierzaki od veta
router.delete('/vets/:vetId', adminOnly, async (req, res) => {
  const { vetId } = req.params;
  if (!isOid(vetId)) return res.status(400).json({ error: 'Invalid vetId' });

  const vet = await Vet.findById(vetId);
  if (!vet) return res.status(404).json({ error: 'Vet not found' });

  // odpinka zwierzaków z tego weta (jeśli masz pole vetId w Animal)
  await Animal.updateMany({ vetId: vet._id }, { $unset: { vetId: '' } });

  const userId = vet.userId;
  await vet.deleteOne();

  // usuń usera (jeśli chcesz zostawić konto usera – zakomentuj linię poniżej)
  if (userId) await User.deleteOne({ _id: userId });

  res.json({ message: 'Vet deleted' });
});

// POST /admin/vets/:vetId/reset-password { newPassword }
router.post('/vets/:vetId/reset-password', adminOnly, async (req, res) => {
  const { vetId } = req.params;
  const { newPassword } = req.body || {};
  if (!isOid(vetId)) return res.status(400).json({ error: 'Invalid vetId' });
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'newPassword min 8 znaków' });
  }
  const vet = await Vet.findById(vetId).lean();
  if (!vet) return res.status(404).json({ error: 'Vet not found' });

  const hash = await bcrypt.hash(String(newPassword), 10);
  await User.updateOne({ _id: vet.userId }, { $set: { passwordHash: hash } });

  res.json({ message: 'Password reset' });
});

/* =========================================
   OWNERS
========================================= */

// GET /admin/owners?search=...&page=1&limit=50&includeAnimals=1
router.get('/owners', adminOnly, async (req, res) => {
  const { search = '', page = '1', limit = '50', includeAnimals = '1' } = req.query as Record<string, string>;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

  const q: any = {};
  if (search && String(search).trim()) {
    const rx = new RegExp(String(search).trim(), 'i');
    q.$or = [
      { name: rx },
      { phone: rx },
      { email: rx },
    ];
  }

  const owners = await Owner.find(q)
    .sort({ name: 1 })
    .skip((p - 1) * l)
    .limit(l)
    .lean();

  const userIds = owners.map(o => o.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }, { email: 1, lastLoginAt: 1 }).lean();
  const byId = new Map(users.map(u => [String(u._id), u]));

  let rows: any[] = owners.map(o => ({
    ownerId: String(o._id),
    name: o.name || '',
    phone: o.phone || '',
    email: o.email || byId.get(String(o.userId))?.email || '',
    userId: String(o.userId),
    lastLoginAt: byId.get(String(o.userId))?.lastLoginAt || null,
    animals: [] as any[],
    animalsCount: 0,
  }));

  if (includeAnimals === '1') {
    const ownerIds = owners.map(o => o._id);
    const animals = await Animal.find({ ownerId: { $in: ownerIds } }, {
      name: 1, species: 1, breed: 1, sex: 1, weightKg: 1, birthDate: 1, ownerId: 1
    }).lean();
    const byOwner = new Map<string, any[]>();
    for (const a of animals) {
      const k = String(a.ownerId);
      if (!byOwner.has(k)) byOwner.set(k, []);
      byOwner.get(k)!.push({ _id: String(a._id), name: a.name, species: a.species, breed: a.breed, sex: a.sex, weightKg: a.weightKg, birthDate: a.birthDate });
    }
    rows = rows.map(r => {
      const list = byOwner.get(r.ownerId) || [];
      r.animals = list;
      r.animalsCount = list.length;
      return r;
    });
  }

  const total = await Owner.countDocuments(q);
  res.json({ page: p, limit: l, total, rows });
});

// DELETE /admin/owners/:ownerId — usuwa właściciela, jego zwierzaki i powiązanego usera
router.delete('/owners/:ownerId', adminOnly, async (req, res) => {
  const { ownerId } = req.params;
  if (!isOid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });

  const owner = await Owner.findById(ownerId);
  if (!owner) return res.status(404).json({ error: 'Owner not found' });

  // usuń zwierzaki właściciela
  await Animal.deleteMany({ ownerId: owner._id });

  const userId = owner.userId;
  await owner.deleteOne();

  // usuń usera
  if (userId) await User.deleteOne({ _id: userId });

  res.json({ message: 'Owner deleted' });
});

// POST /admin/owners/:ownerId/reset-password { newPassword }
router.post('/owners/:ownerId/reset-password', adminOnly, async (req, res) => {
  const { ownerId } = req.params;
  const { newPassword } = req.body || {};
  if (!isOid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: 'newPassword min 8 znaków' });
  }
  const owner = await Owner.findById(ownerId).lean();
  if (!owner) return res.status(404).json({ error: 'Owner not found' });

  const hash = await bcrypt.hash(String(newPassword), 10);
  await User.updateOne({ _id: owner.userId }, { $set: { passwordHash: hash } });

  res.json({ message: 'Password reset' });
});

export default router;
