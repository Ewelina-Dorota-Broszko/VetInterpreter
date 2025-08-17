import { Router } from 'express';
import Owner from '../models/owner';
import Animal from '../models/animal';
import { auth, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(auth); // wszystko poniżej wymaga tokenu

/** GET /owners/me -> zwróć (albo załóż) Owner dla zalogowanego usera */
router.get('/me', async (req: AuthedRequest, res) => {
  let owner = await Owner.findOne({ userId: req.user!.id });
  if (!owner) {
    owner = await Owner.create({
      userId: req.user!.id,
      name: 'Nowy właściciel',
      email: '',
      phone: ''
    });
  }
  res.json(owner);
});

/** CREATE owner (dodatkowi właściciele – jeśli kiedyś potrzebne) */
router.post('/', async (req: AuthedRequest, res) => {
  try {
    if (!req.body.name) return res.status(400).json({ error: 'name is required' });
    const owner = await Owner.create({ ...req.body, userId: req.user!.id });
    res.status(201).json(owner);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/** LIST owners (tylko bieżącego usera) */
router.get('/', async (req: AuthedRequest, res) => {
  const owners = await Owner.find({ userId: req.user!.id }).sort({ createdAt: -1 });
  res.json(owners);
});

/** OWNER profile */
router.get('/:id', async (req: AuthedRequest, res) => {
  const owner = await Owner.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!owner) return res.status(404).json({ error: 'Owner not found' });
  res.json(owner);
});

/** UPDATE owner */
router.patch('/:id', async (req: AuthedRequest, res) => {
  const owner = await Owner.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    req.body,
    { new: true }
  );
  if (!owner) return res.status(404).json({ error: 'Owner not found' });
  res.json(owner);
});

/** PATCH /owners/me – edycja bez ID (wygodne na froncie) */
router.patch('/me', async (req: AuthedRequest, res) => {
  let owner = await Owner.findOne({ userId: req.user!.id });
  if (!owner) {
    owner = await Owner.create({
      userId: req.user!.id,
      name: 'Nowy właściciel',
      email: '',
      phone: ''
    });
  }
  owner.set(req.body);
  await owner.save();
  res.json(owner);
});

/** DELETE owner (usuń również jego zwierzęta) */
router.delete('/:id', async (req: AuthedRequest, res) => {
  const owner = await Owner.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!owner) return res.status(404).json({ error: 'Owner not found' });
  await Animal.deleteMany({ ownerId: owner._id });
  res.json({ message: 'Owner and animals deleted' });
});

/** Animals of owner */
router.get('/:id/animals', async (req: AuthedRequest, res) => {
  const exists = await Owner.findOne({ _id: req.params.id, userId: req.user!.id }).lean();
  if (!exists) return res.status(404).json({ error: 'Owner not found' });
  const animals = await Animal.find({ ownerId: req.params.id }).sort({ createdAt: -1 });
  res.json(animals);
});

export default router;
