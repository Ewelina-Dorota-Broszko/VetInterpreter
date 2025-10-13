import path from 'path';
import fs from 'fs';
import { Router, Request, Response, RequestHandler } from 'express';
// Jeśli NIE używasz "esModuleInterop": true -> użyj wersji z gwiazdką:
// import * as multer from 'multer';
import multer from 'multer';
import { Types } from 'mongoose';
import { auth, AuthedRequest } from '../middleware/auth';
import Vet from '../models/vet';
import ClinicalFile from '../models/clinicalFile';

const router = Router();
router.use(auth as any);

// --- katalog uploadów ---
const uploadDir = path.resolve(process.cwd(), 'uploads', 'clinical-files');
fs.mkdirSync(uploadDir, { recursive: true });

// --- konfiguracja Multer ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
    const safe = file.originalname.replace(/[^\w.\-()+\s]/g, '_');
    cb(null, `${unique}__${safe}`);
  }
});
const upload = multer({ storage });

// --- helpery ---
const toObjId = (id: string) => (Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null);
async function getRequesterVet(userId: string) {
  const variants = [{ userId }, ...(toObjId(userId) ? [{ userId: toObjId(userId)! }] : [])];
  return Vet.findOne({ $or: variants }).lean();
}

/* =========================================================
 *  GET /vet-files/me  -> lista plików weta
 * ======================================================= */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const aReq = req as AuthedRequest;
    const vet = await getRequesterVet(aReq.user!.id);
    if (!vet) return res.status(404).json({ error: 'Vet profile not found' });

    const files = await ClinicalFile.find({ vetId: vet._id }).sort({ uploadedAt: -1 }).lean();
    const result = files.map((f: any) => ({
      _id: String(f._id),
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      note: f.note || '',
      uploadedAt: f.uploadedAt,
      url: `/vet-files/${String(f._id)}/download`,
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
 *  POST /vet-files/me  (multipart: file, note?)
 * ======================================================= */
router.post(
  '/me',
  (upload.single('file') as unknown as RequestHandler), // ✅ typ OK dla TS
  async (req: Request, res: Response) => {
    try {
      const aReq = req as AuthedRequest & {
        file?: Express.Multer.File;
        body: { note?: string };
      };

      if (!aReq.file) {
        return res.status(400).json({ error: 'File is required (field: file)' });
      }

      const vet = await getRequesterVet(aReq.user!.id);
      if (!vet) {
        return res.status(404).json({ error: 'Vet profile not found' });
      }

      const userIdObj = toObjId(aReq.user!.id) ?? aReq.user!.id;

      const doc = await ClinicalFile.create({
        vetId: vet._id,
        userId: userIdObj,
        originalName: aReq.file.originalname,
        mimeType: aReq.file.mimetype,
        size: aReq.file.size,
        note: aReq.body?.note || '',
        path: aReq.file.path,
      });

      return res.status(201).json({
        _id: String(doc._id),
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        note: doc.note || '',
        uploadedAt: doc.get('uploadedAt'),
        url: `/vet-files/${String(doc._id)}/download`,
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
);

/* =========================================================
 *  GET /vet-files/:id/download
 * ======================================================= */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const aReq = req as AuthedRequest;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const file = await ClinicalFile.findById(id).lean();
    if (!file) return res.status(404).json({ error: 'File not found' });

    const requesterVet = await getRequesterVet(aReq.user!.id);
    if (!requesterVet) return res.status(403).json({ error: 'Forbidden' });

    if (!fs.existsSync(file.path)) return res.status(410).json({ error: 'File is gone' });

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.sendFile(path.resolve(file.path));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================
 *  DELETE /vet-files/:id
 * ======================================================= */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const aReq = req as AuthedRequest;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const doc = await ClinicalFile.findById(id);
    if (!doc) return res.status(404).json({ error: 'File not found' });

    const vet = await getRequesterVet(aReq.user!.id);
    if (!vet || String(vet._id) !== String(doc.vetId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try { if (fs.existsSync(doc.path)) fs.unlinkSync(doc.path); } catch {}
    await doc.deleteOne();

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
