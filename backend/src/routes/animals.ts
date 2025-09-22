// backend/src/routes/animals.ts
import { Router } from 'express';
import { Types } from 'mongoose';
import Animal from '../models/animal';
import Owner from '../models/owner';
import Vet from '../models/vet';
import { auth, AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(auth);

const oid = (s: string) => new Types.ObjectId(s);
const valid = (s: string) => Types.ObjectId.isValid(s);

/** Sprawdź, czy zwierzak należy do zalogowanego ownera (używane głównie przy GET-ach) */
async function ensureOwnership(animalId: string, userId: string) {
  if (!valid(animalId)) return null;
  const animal = await Animal.findById(animalId).lean();
  if (!animal) return null;
  const owner = await Owner.findOne({ _id: animal.ownerId, userId }).lean();
  return owner ? animal : null;
}

/** Zwróć _id profilu weta (albo undefined) */
async function currentVetId(userId: string) {
  const vet = await Vet.findOne({ userId }).lean();
  return vet?._id;
}

/** NOWE: zapis/usuń może zrobić właściciel ALBO zalogowany wet (dowolny) */
async function ensureOwnerOrVet(animalId: string, userId: string) {
  if (!valid(animalId)) return null;
  const animal = await Animal.findById(animalId);
  if (!animal) return null;

  // 1) właściciel?
  const isOwner = await Owner.findOne({ _id: animal.ownerId, userId }).lean();
  if (isOwner) return animal;

  // 2) ma profil veta?
  const isVet = await Vet.findOne({ userId }).lean();
  if (isVet) return animal;

  return null;
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

/** NOWE: helper, który stempluje meta (owner/vet) i zwraca ostatni dodany element */
async function addAndReturnLast(
  req: AuthedRequest,
  res: any,
  id: string,
  path: keyof any,
  body: any
) {
  // uprawnienia: owner lub wet
  const can = await ensureOwnerOrVet(id, req.user!.id);
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  // ustal, czy zalogowany user ma profil weterynarza
  const vet = await Vet.findOne({ userId: req.user!.id }).lean();
  const stamp = vet
    ? { addedBy: 'vet', addedByVetId: vet._id, addedAt: new Date() }
    : { addedBy: 'owner', addedAt: new Date() };

  (can as any)[path].push({ ...body, ...stamp });
  await (can as any).save();

  const arr = (can as any)[path] as any[];
  const last = arr[arr.length - 1];
  return res.status(201).json(last);
}

/** pull subdocument by id (owner lub wet) */
/** pull subdocument by id (owner lub wet) – wet może usuwać TYLKO swoje wpisy */
async function pullById(
  req: AuthedRequest,
  res: any,
  id: string,
  path: string,
  subId: string,
  notFoundMsg: string
) {
  const can = await ensureOwnerOrVet(id, req.user!.id);
  if (!can) return res.status(403).json({ error: 'Forbidden' });

  // Jeśli zalogowany to WET – ograniczamy usuwanie do jego własnych wpisów
  const vetId = await currentVetId(req.user!.id);
  const match = vetId
    ? { _id: oid(subId), addedBy: 'vet', addedByVetId: vetId }
    : { _id: oid(subId) }; // owner może usunąć cokolwiek w danym path

  const result = await Animal.updateOne(
    { _id: id },
    { $pull: { [path]: match } }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ error: notFoundMsg });
  }
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
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'bloodTests', req.body)
);
router.delete('/:id/blood-tests/:testId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'bloodTests', req.params.testId, 'Blood test not found')
);

/* ========= Urine ========= */
router.get('/:id/urine-tests', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.urineTests || []);
});
router.post('/:id/urine-tests', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'urineTests', req.body)
);
router.delete('/:id/urine-tests/:testId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'urineTests', req.params.testId, 'Urine test not found')
);

/* ========= Stool ========= */
router.get('/:id/stool-tests', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.stoolTests || []);
});
router.post('/:id/stool-tests', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'stoolTests', req.body)
);
router.delete('/:id/stool-tests/:testId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'stoolTests', req.params.testId, 'Stool test not found')
);

/* ========= Temperature ========= */
// router.get('/:id/temperature-logs', async (req: AuthedRequest, res) => {
//   const can = await ensureOwnership(req.params.id, req.user!.id);
//   if (!can) return res.status(404).json({ error: 'Animal not found' });
//   const animal = await Animal.findById(req.params.id).lean();
//   res.json(animal?.temperatureLogs || []);
// });
// router.post('/:id/temperature-logs', (req, res) =>
//   addAndReturnLast(req as AuthedRequest, res, req.params.id, 'temperatureLogs', req.body)
// );
// router.delete('/:id/temperature-logs/:logId', (req, res) =>
//   pullById(req as AuthedRequest, res, req.params.id, 'temperatureLogs', req.params.logId, 'Temperature log not found')
// );

/* ========= Temperature ========= */

// GET /animals/:id/temperature-logs?mine=1
router.get('/:id/temperature-logs', async (req: AuthedRequest, res) => {
  // wet też ma mieć wgląd (nie tylko owner), więc używamy ensureOwnerOrVet
  const can = await ensureOwnerOrVet(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });

  const animal = await Animal.findById(req.params.id, { temperatureLogs: 1 }).lean();
  let logs: any[] = animal?.temperatureLogs || [];

  // mine=1 => jeśli zalogowany to wet, filtrujemy po jego wpisach
  if (req.query.mine === '1') {
    const vetId = await currentVetId(req.user!.id);
    if (vetId) {
      const v = String(vetId);
      logs = logs.filter(x => x.addedBy === 'vet' && String(x.addedByVetId) === v);
    } else {
      // jeśli owner poda mine=1 – nic nie zwracamy
      logs = [];
    }
  }

  // sort: najnowsze na górze (po addedAt, a jak brak to po date+time)
  logs.sort((a, b) => {
    const aa = a.addedAt ? new Date(a.addedAt).getTime() : 0;
    const bb = b.addedAt ? new Date(b.addedAt).getTime() : 0;
    if (aa && bb) return bb - aa;
    return (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time);
  });

  res.json(logs);
});

// POST /animals/:id/temperature-logs  — zapis jednego pomiaru
router.post('/:id/temperature-logs', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'temperatureLogs', req.body)
);

// DELETE /animals/:id/temperature-logs/:logId — usuwanie jednego wpisu
router.delete('/:id/temperature-logs/:logId', (req, res) =>
  pullById(
    req as AuthedRequest,
    res,
    req.params.id,
    'temperatureLogs',
    req.params.logId,
    'Temperature log not found'
  )
);

/* ========= Diabetes ========= */
router.get('/:id/diabetes-logs', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.diabetesLogs || []);
});
router.post('/:id/diabetes-logs', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'diabetesLogs', req.body)
);
router.delete('/:id/diabetes-logs/:entryId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'diabetesLogs', req.params.entryId, 'Diabetes log not found')
);

/* ========= Weight history ========= */
router.get('/:id/weight-history', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.weightHistory || []);
});
router.post('/:id/weight-history', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'weightHistory', req.body)
);
router.delete('/:id/weight-history/:entryId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'weightHistory', req.params.entryId, 'Weight entry not found')
);

/* ========= Vaccinations ========= */
router.get('/:id/vaccinations', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.vaccinations || []);
});
router.post('/:id/vaccinations', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'vaccinations', req.body)
);
router.delete('/:id/vaccinations/:vaccId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'vaccinations', req.params.vaccId, 'Vaccination not found')
);

/* ========= Medications ========= */
router.get('/:id/medications', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.medications || []);
});
router.post('/:id/medications', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'medications', req.body)
);
router.delete('/:id/medications/:medId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'medications', req.params.medId, 'Medication not found')
);

/** UPDATE jednego leku */
router.patch('/:id/medications/:medId', async (req: AuthedRequest, res) => {
  try {
    // zapis może owner lub wet
    const can = await ensureOwnerOrVet(req.params.id, req.user!.id);
    if (!can) return res.status(403).json({ error: 'Forbidden' });

    const allowed = [
      'name','dose','frequency','timesOfDay','startDate','endDate','isActive','notes'
    ] as const;

    const update: Record<string, any> = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) update[`medications.$.${k}`] = req.body[k];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updatable fields in body' });
    }

    const result = await Animal.updateOne(
      { _id: req.params.id, 'medications._id': oid(req.params.medId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const fresh = await Animal.findById(req.params.id).lean();
    const updated = fresh?.medications?.find((m: any) => String(m._id) === String(req.params.medId));
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
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'symptoms', req.body)
);
router.delete('/:id/symptoms/:symptomId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'symptoms', req.params.symptomId, 'Symptom not found')
);

/* ========= Visit history ========= */
router.get('/:id/visit-history', async (req: AuthedRequest, res) => {
  const can = await ensureOwnership(req.params.id, req.user!.id);
  if (!can) return res.status(404).json({ error: 'Animal not found' });
  const animal = await Animal.findById(req.params.id).lean();
  res.json(animal?.visitHistory || []);
});
router.post('/:id/visit-history', (req, res) =>
  addAndReturnLast(req as AuthedRequest, res, req.params.id, 'visitHistory', req.body)
);
router.delete('/:id/visit-history/:visitId', (req, res) =>
  pullById(req as AuthedRequest, res, req.params.id, 'visitHistory', req.params.visitId, 'Visit not found')
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
    { new: true, projection: { calendar: { $slice: -1 } } }
  ).lean();

  if (!updated) return res.status(404).json({ error: 'Owner not found' });

  const last = updated.calendar?.[0];
  res.status(201).json(last ?? {});
});

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
