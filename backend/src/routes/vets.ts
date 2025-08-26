import { Router } from 'express';
import { auth, AuthedRequest } from '../middleware/auth';
import Vet from '../models/vet';

const router = Router();
router.use(auth);

// GET /vets/me – profil zalogowanego veta
router.get('/me', async (req: AuthedRequest, res) => {
  const vet = await Vet.findOne({ userId: req.user!.id }).lean();
  if (!vet) return res.status(404).json({ error: 'Brak profilu weterynarza' });

  // Zwróć także "id" (string) oprócz _id – wygodne dla frontu
  const out = {
    ...vet,
    id: vet._id?.toString?.() || String(vet._id),
    userId: vet.userId?.toString?.() || String(vet.userId),
  };

  return res.json(out);
});

// PATCH /vets/me – aktualizacja profilu veta
router.patch('/me', async (req: AuthedRequest, res) => {
  const vet = await Vet.findOneAndUpdate(
    { userId: req.user!.id },
    req.body,
    { new: true, upsert: true }
  ).lean();

  // po zapisie też dołóż "id" dla spójności frontu
  const out = {
    ...vet,
    id: vet._id?.toString?.() || String(vet._id),
    userId: vet.userId?.toString?.() || String(vet.userId),
  };

  return res.json(out);
});

export default router;
