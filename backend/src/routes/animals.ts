import { Router } from 'express';
import { Types } from 'mongoose';
import Animal from '../models/animal';
import Owner from '../models/owner';
import { auth, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(auth);

const oid = (s: string) => new Types.ObjectId(s);
const valid = (s: string) => Types.ObjectId.isValid(s);

/** Upewnij się, że zwierzak należy do zalogowanego usera (opcjonalnie użyj w GET/POST/DELETE poniżej) */
async function ensureOwnership(animalId: string, userId: string) {
  if (!valid(animalId)) return null;
  const animal = await Animal.findById(animalId).lean();
  if (!animal) return null;
  const owner = await Owner.findOne({ _id: animal.ownerId, userId }).lean();
  return owner ? animal : null;
}

/* ========= Animals (CRUD) ========= */

// POST /owners/:ownerId/animals
router.post('/owners/:ownerId/animals', async (req: AuthedRequest, res) => {
  try {
    const { ownerId } = req.params;
    if (!valid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });

    const owner = await Owner.findOne({ _id: ownerId, userId: req.user!.id });
    if (!owner) return res.status(404).json({ error: 'Owner not found' });

    const { name, species, sex, birthDate } = req.body;
    if (!name || !species || !sex || !birthDate) {
      return res.status(400).json({ error: 'name, species, sex, birthDate są wymagane' });
    }

    const animal = await Animal.create({
      ownerId: owner._id,
      name,
      species,
      breed: req.body.breed ?? '',
      sex,
      weightKg: req.body.weightKg ?? 0,
      birthDate
    });

    res.status(201).json(animal);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// GET /owners/:ownerId/animals
router.get('/owners/:ownerId/animals', async (req: AuthedRequest, res) => {
  const { ownerId } = req.params;

  if (!valid(ownerId)) {
    return res.status(400).json({ error: 'Invalid ownerId' });
  }

  // Upewnij się, że owner należy do zalogowanego użytkownika
  const owner = await Owner.findOne({ _id: ownerId, userId: req.user!.id }).lean();
  if (!owner) {
    return res.status(404).json({ error: 'Owner not found' });
  }

  const animals = await Animal.find({ ownerId: owner._id }).lean();
  return res.json(animals);
});


// GET /animals/:id
router.get('/:id', async (req: AuthedRequest, res) => {
  const animal = await ensureOwnership(req.params.id, req.user!.id);
  if (!animal) return res.status(404).json({ error: 'Animal not found' });
  res.json(animal);
});

// PATCH /animals/:id
router.patch('/:id', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });

  const allowed = ['name','species','breed','sex','weightKg','birthDate','diet'];
  const update: any = {};
  for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

  const animal = await Animal.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(animal);
});

// DELETE /animals/:id
router.delete('/:id', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });

  await Animal.findByIdAndDelete(req.params.id);
  res.json({ message: 'Animal deleted' });
});

/* ========= Helpers ========= */
async function addAndReturnLast(id: string, path: keyof any, body: any, res: any) {
  const animal = await Animal.findById(id);
  if (!animal) return res.status(404).json({ error: 'Animal not found' });
  (animal as any)[path].push(body);
  await animal.save();
  const arr = (animal as any)[path] as any[];
  const last = arr[arr.length - 1];
  return res.status(201).json(last);
}
async function pullById(id: string, path: string, subId: string, res: any, notFoundMsg: string) {
  const result = await Animal.updateOne(
    { _id: id },
    { $pull: { [path]: { _id: oid(subId) } } }
  );
  if (result.modifiedCount === 0) return res.status(404).json({ error: notFoundMsg });
  return res.json({ message: 'Deleted' });
}

/* ========= Blood ========= */
router.get('/:id/blood-tests', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.bloodTests || []);
});
router.post('/:id/blood-tests', (req, res) =>
  addAndReturnLast(req.params.id, 'bloodTests', req.body, res)
);
router.delete('/:id/blood-tests/:testId', (req, res) =>
  pullById(req.params.id, 'bloodTests', req.params.testId, res, 'Blood test not found')
);

/* ========= Urine ========= */
router.get('/:id/urine-tests', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.urineTests || []);
});
router.post('/:id/urine-tests', (req, res) =>
  addAndReturnLast(req.params.id, 'urineTests', req.body, res)
);
router.delete('/:id/urine-tests/:testId', (req, res) =>
  pullById(req.params.id, 'urineTests', req.params.testId, res, 'Urine test not found')
);

/* ========= Stool ========= */
router.get('/:id/stool-tests', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.stoolTests || []);
});
router.post('/:id/stool-tests', (req, res) =>
  addAndReturnLast(req.params.id, 'stoolTests', req.body, res)
);
router.delete('/:id/stool-tests/:testId', (req, res) =>
  pullById(req.params.id, 'stoolTests', req.params.testId, res, 'Stool test not found')
);

/* ========= Temperature ========= */
router.get('/:id/temperature-logs', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.temperatureLogs || []);
});
router.post('/:id/temperature-logs', (req, res) =>
  addAndReturnLast(req.params.id, 'temperatureLogs', req.body, res)
);
router.delete('/:id/temperature-logs/:logId', (req, res) =>
  pullById(req.params.id, 'temperatureLogs', req.params.logId, res, 'Temperature log not found')
);

/* ========= Diabetes ========= */
router.get('/:id/diabetes-logs', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.diabetesLogs || []);
});
router.post('/:id/diabetes-logs', (req, res) =>
  addAndReturnLast(req.params.id, 'diabetesLogs', req.body, res)
);
router.delete('/:id/diabetes-logs/:entryId', (req, res) =>
  pullById(req.params.id, 'diabetesLogs', req.params.entryId, res, 'Diabetes log not found')
);

/* ========= Weight history ========= */
router.get('/:id/weight-history', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.weightHistory || []);
});
router.post('/:id/weight-history', (req, res) =>
  addAndReturnLast(req.params.id, 'weightHistory', req.body, res)
);
router.delete('/:id/weight-history/:entryId', (req, res) =>
  pullById(req.params.id, 'weightHistory', req.params.entryId, res, 'Weight entry not found')
);

/* ========= Vaccinations ========= */
router.get('/:id/vaccinations', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.vaccinations || []);
});
router.post('/:id/vaccinations', (req, res) =>
  addAndReturnLast(req.params.id, 'vaccinations', req.body, res)
);
router.delete('/:id/vaccinations/:vaccId', (req, res) =>
  pullById(req.params.id, 'vaccinations', req.params.vaccId, res, 'Vaccination not found')
);

/* ========= Medications ========= */
router.get('/:id/medications', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.medications || []);
});
router.post('/:id/medications', (req, res) =>
  addAndReturnLast(req.params.id, 'medications', req.body, res)
);
router.delete('/:id/medications/:medId', (req, res) =>
  pullById(req.params.id, 'medications', req.params.medId, res, 'Medication not found')
);
/* ========= Medications ========= */
router.get('/:id/medications', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.medications || []);
});

router.post('/:id/medications', (req, res) =>
  addAndReturnLast(req.params.id, 'medications', req.body, res)
);

router.delete('/:id/medications/:medId', (req, res) =>
  pullById(req.params.id, 'medications', req.params.medId, res, 'Medication not found')
);

/** ⬇️ DODAJ TO: UPDATE jednego leku */
router.patch('/:id/medications/:medId', async (req: AuthedRequest, res) => {
  try {
    const { id, medId } = req.params;

    // 1) autoryzacja właściciela
    const can = await ensureOwnership(id, req.user!.id);
    if (!can) return res.status(404).json({ error: 'Animal not found' });

    // 2) whitelist pól, które wolno aktualizować
    const allowed = [
      'name',
      'dose',
      'frequency',
      'timesOfDay',   // string[]
      'startDate',
      'endDate',
      'isActive',
      'notes'
    ] as const;

    const update: Record<string, any> = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        // budujemy ścieżki typu "medications.$.isActive"
        update[`medications.$.${k}`] = req.body[k];
      }
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updatable fields in body' });
    }

    // 3) aktualizacja subdokumentu po _id z użyciem operatora pozycyjnego $
    const result = await Animal.updateOne(
      { _id: id, 'medications._id': oid(medId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    // 4) zwróć aktualny stan z bazy (tylko ten lek)
    const fresh = await Animal.findById(id).lean();
    const updated = fresh?.medications?.find((m: any) => String(m._id) === String(medId));
    return res.json(updated ?? { message: 'Updated' });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});


/* ========= Symptoms ========= */
router.get('/:id/symptoms', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.symptoms || []);
});
router.post('/:id/symptoms', (req, res) =>
  addAndReturnLast(req.params.id, 'symptoms', req.body, res)
);
router.delete('/:id/symptoms/:symptomId', (req, res) =>
  pullById(req.params.id, 'symptoms', req.params.symptomId, res, 'Symptom not found')
);

/* ========= Visit history ========= */
router.get('/:id/visit-history', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.visitHistory || []);
});
router.post('/:id/visit-history', (req, res) =>
  addAndReturnLast(req.params.id, 'visitHistory', req.body, res)
);
router.delete('/:id/visit-history/:visitId', (req, res) =>
  pullById(req.params.id, 'visitHistory', req.params.visitId, res, 'Visit not found')
);

/* ========= Owner Calendar (globalny) ========= */
router.get('/owners/:ownerId/calendar', async (req: AuthedRequest, res) => {
  const { ownerId } = req.params;
  if (!valid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });

  const owner = await Owner.findOne({ _id: ownerId, userId: req.user!.id }).lean();
  if (!owner) return res.status(404).json({ error: 'Owner not found' });

  res.json(owner.calendar || []);
});

router.post('/owners/:ownerId/calendar', async (req: AuthedRequest, res) => {
  const { ownerId } = req.params;
  if (!valid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });

  const { date, title, note, animalId, animalName } = req.body || {};
  if (!date || !title) return res.status(400).json({ error: 'date i title są wymagane' });

  const updated = await Owner.findOneAndUpdate(
    { _id: ownerId, userId: req.user!.id },
    { $push: { calendar: { date, title, note, animalId, animalName } } },
    { new: true, projection: { calendar: { $slice: -1 } } } // zwróć tylko ostatnio dodany
  ).lean();

  if (!updated) return res.status(404).json({ error: 'Owner not found' });

  const last = updated.calendar?.[0];
  res.status(201).json(last ?? {});
});

// DELETE /owners/:ownerId/calendar/:eventId
router.delete('/owners/:ownerId/calendar/:eventId', async (req: AuthedRequest, res) => {
  const { ownerId, eventId } = req.params;
  if (!valid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });

  const result = await Owner.updateOne(
    { _id: ownerId, userId: req.user!.id },
    { $pull: { calendar: { _id: oid(eventId) } } }
  );

  if (result.modifiedCount === 0)
    return res.status(404).json({ error: 'Calendar event not found' });

  res.json({ message: 'Deleted' });
});


/* ========= Diet ========= */
router.get('/:id/diet', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.diet || {});
});
router.patch('/:id/diet', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findByIdAndUpdate(req.params.id, { diet: req.body }, { new: true });
  res.json(animal?.diet || {});
});

export default router;
