import { Router } from 'express';
import { Types } from 'mongoose';
import { auth, AuthedRequest } from '../middleware/auth';
import Vet from '../models/vet';
import Animal from '../models/animal';
import Owner from '../models/owner';

const router = Router();
router.use(auth);

const oid = (s: string) => new Types.ObjectId(s);
const valid = (s: string) => Types.ObjectId.isValid(s);

/* =========================================================
 *  PRZYPISYWANIE ZWIERZĄT DO WETA (OWNER moze przypiąć/odpiąć)
 * ======================================================= */

// POST /vets/assign  { animalId, vetId }
router.post('/assign', async (req: AuthedRequest, res) => {
  try {
    const { animalId, vetId } = (req.body as { animalId?: string; vetId?: string }) || {};
    if (!animalId || !vetId) return res.status(400).json({ error: 'animalId and vetId are required' });
    if (!valid(animalId) || !valid(vetId)) return res.status(400).json({ error: 'Invalid ids' });

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    // tylko właściciel zwierzaka może przypisać veta
    const isOwner = await Owner.findOne({ _id: animal.ownerId, userId: req.user!.id }).lean();
    if (!isOwner) return res.status(403).json({ error: 'Not your animal' });

    const vet = await Vet.findById(vetId).lean();
    if (!vet) return res.status(404).json({ error: 'Vet not found' });

    animal.vetId = oid(vetId);
    await animal.save();

    return res.json({ message: 'Assigned', animalId, vetId });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /vets/unassign  { animalId }
router.post('/unassign', async (req: AuthedRequest, res) => {
  try {
    const { animalId } = (req.body as { animalId?: string }) || {};
    if (!animalId) return res.status(400).json({ error: 'animalId is required' });
    if (!valid(animalId)) return res.status(400).json({ error: 'Invalid animalId' });

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const isOwner = await Owner.findOne({ _id: animal.ownerId, userId: req.user!.id }).lean();
    if (!isOwner) return res.status(403).json({ error: 'Not your animal' });

    (animal as any).vetId = null;
    await animal.save();

    return res.json({ message: 'Unassigned', animalId });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* =========================================================
 *  PROFIL VETA (me)
 * ======================================================= */

// GET /vets/me
router.get('/me', async (req: AuthedRequest, res) => {
  const vet = await Vet.findOne({ userId: req.user!.id })
    .populate('userId', 'name fullName firstName lastName email')
    .lean({ virtuals: true });

  if (!vet) return res.status(404).json({ error: 'Brak profilu weterynarza' });

  return res.json({
    ...vet,
    id: String(vet._id),
    userId: String((vet as any).userId?._id ?? (vet as any).userId)
  });
});

// PATCH /vets/me
router.patch('/me', async (req: AuthedRequest, res) => {
  const vet = await Vet.findOneAndUpdate(
    { userId: req.user!.id },
    req.body,
    { new: true, upsert: true }
  )
    .populate('userId', 'name fullName firstName lastName email')
    .lean({ virtuals: true });

  return res.json({
    ...vet,
    id: String(vet!._id),
    userId: String((vet as any).userId?._id ?? (vet as any).userId)
  });
});

/* =========================================================
 *  PACJENCI DLA ZALOGOWANEGO VETA (opcjonalnie: tylko przypięci)
 * ======================================================= */

// GET /vets/me/patients    -> właściciele, którzy mają przynajmniej 1 zwierzę przypięte do tego veta
router.get('/me/patients', async (req: AuthedRequest, res) => {
  try {
    const vet = await Vet.findOne({ userId: req.user!.id }).lean();
    if (!vet) return res.status(404).json({ error: 'Vet profile not found' });

    const animals = await Animal.find({ vetId: vet._id }).lean();
    const byOwner = new Map<string, { ownerId: Types.ObjectId; animals: any[] }>();
    for (const a of animals) {
      const k = String(a.ownerId);
      if (!byOwner.has(k)) byOwner.set(k, { ownerId: a.ownerId as any, animals: [] });
      byOwner.get(k)!.animals.push(a);
    }

    const ownerIds = Array.from(byOwner.values()).map(x => x.ownerId);
    const owners = ownerIds.length ? await Owner.find({ _id: { $in: ownerIds } }).lean() : [];

    const ownersMap = new Map(owners.map(o => [String(o._id), o]));
    const result = Array.from(byOwner.entries()).map(([key, g]) => ({
      owner: ownersMap.get(key) || { _id: g.ownerId, name: '—' },
      animalsCount: g.animals.length
    }));

    result.sort((a, b) => (a.owner.name || '').localeCompare(b.owner.name || ''));
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* =========================================================
 *  GLOBALNA LISTA PACJENTÓW (wet widzi wszystkich)
 * ======================================================= */

// GET /vets/patients?search=...
router.get('/patients', async (req: AuthedRequest, res) => {
  try {
    const { search } = req.query as { search?: string };

    const filter: any = {};
    if (search && String(search).trim().length) {
      const rx = new RegExp(String(search).trim(), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const owners = await Owner.find(filter)
      .select('_id name email phone createdAt')
      .sort({ name: 1 })
      .lean();

    return res.json(owners);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /vets/patients/:ownerId  -> profil pacjenta + WSZYSTKIE jego zwierzęta (niezależnie od przypisania)
router.get('/patients/:ownerId', async (req: AuthedRequest, res) => {
  try {
    const { ownerId } = req.params;
    if (!Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ error: 'Invalid ownerId' });
    }

    const owner = await Owner.findById(ownerId).lean();
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    const animals = await Animal.find({ ownerId }).lean();
    return res.json({ owner, animals });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* =========================================================
 *  LISTA WETÓW + SZCZEGÓŁY
 * ======================================================= */

// GET /vets
router.get('/', async (_req, res) => {
  try {
    const vets = await Vet.find()
      .populate('userId', 'name fullName firstName lastName email')
      .lean({ virtuals: true });
    return res.json(vets);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /vets/:id  (UWAGA: na samym końcu pliku; ID walidujemy w handlerze)
router.get('/:id', async (req, res) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Vet not found' });
    }
    const vet = await Vet.findById(req.params.id)
      .populate('userId', 'name fullName firstName lastName email')
      .lean({ virtuals: true });
    if (!vet) return res.status(404).json({ error: 'Vet not found' });
    return res.json(vet);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
