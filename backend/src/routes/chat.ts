import { Router } from 'express';
import { Types } from 'mongoose';
import { auth, AuthedRequest } from '../middleware/auth';
import Vet from '../models/vet';
import Owner from '../models/owner';
import ChatThread from '../models/chatThread';
import ChatMessage from '../models/chatMessage';

const router = Router();
router.use(auth as any);

const OID = (s: string) => (Types.ObjectId.isValid(s) ? new Types.ObjectId(s) : null);
const in3Days = (d: Date) => new Date(d.getTime() + 3 * 24 * 60 * 60 * 1000);

async function whoAmI(aReq: AuthedRequest) {
  const userId = aReq.user!.id;
  const vet = await Vet.findOne({ $or: [{ userId }, ...(OID(userId) ? [{ userId: OID(userId)! }] : [])] }).lean();
  if (vet) return { role: 'vet' as const, vet, owner: null };
  const owner = await Owner.findOne({ $or: [{ userId }, ...(OID(userId) ? [{ userId: OID(userId)! }] : [])] }).lean();
  if (owner) return { role: 'owner' as const, vet: null, owner };
  throw new Error('User has neither Vet nor Owner profile');
}

function computeStatus(thread: any): 'pending' | 'active' | 'expired' | 'closed' {
  if (thread.initiatedBy === 'vet') return 'active'; // bez limitu
  if (thread.pending) return 'pending';
  if (!thread.windows || !thread.windows.length) return 'expired';
  const now = new Date();
  const last = thread.windows[thread.windows.length - 1];
  return now <= new Date(last.to) ? 'active' : 'expired';
}

/* ============ CLIENT: szuka veta i prosi o zgodę ============ */
// POST /chat/client/request  { vetId }
router.post('/client/request', async (req: AuthedRequest, res) => {
  try {
    const me = await whoAmI(req);
    if (me.role !== 'owner') return res.status(403).json({ error: 'Only owners can request' });

    const { vetId } = (req.body as any) || {};
    if (!vetId || !Types.ObjectId.isValid(vetId)) return res.status(400).json({ error: 'Invalid vetId' });

    const vet = await Vet.findById(vetId).lean();
    if (!vet) return res.status(404).json({ error: 'Vet not found' });

    let thread = await ChatThread.findOne({ vetId, ownerId: me.owner!._id });

    if (!thread) {
      thread = await ChatThread.create({
        vetId,
        ownerId: me.owner!._id,
        initiatedBy: 'owner',
        pending: true,
        windows: [],
        status: 'pending',
      });
    } else {
      // odśwież prośbę jeśli kiedyś istniała
      thread.pending = true;
      thread.status = 'pending';
      await thread.save();
    }

    return res.json({ ok: true, threadId: String(thread._id) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ============ VET: lista próśb + akcept/odrzuć ============ */
// GET /chat/vet/requests
router.get('/vet/requests', async (req: AuthedRequest, res) => {
  try {
    const me = await whoAmI(req);
    if (me.role !== 'vet') return res.status(403).json({ error: 'Only vets' });

    const threads = await ChatThread.find({ vetId: me.vet!._id, pending: true })
      .populate('ownerId', 'name email phone')
      .lean();

    return res.json(threads.map(t => ({
      id: String(t._id),
      owner: t.ownerId,
      createdAt: t.createdAt,
    })));
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /chat/vet/requests/:id/accept
router.post('/vet/requests/:id/accept', async (req: AuthedRequest, res) => {
  try {
    const me = await whoAmI(req);
    if (me.role !== 'vet') return res.status(403).json({ error: 'Only vets' });

    const { id } = req.params;
    const thread = await ChatThread.findOne({ _id: id, vetId: me.vet!._id });
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (thread.initiatedBy === 'vet') return res.json({ ok: true }); // i tak aktywne

    // nowy 3-dniowy window + systemowy divider
    const from = new Date();
    const to = in3Days(from);
    thread.pending = false;
    thread.windows.push({ from, to });
    thread.status = 'active';
    await thread.save();

    await ChatMessage.create({
      threadId: thread._id,
      authorRole: 'system',
      authorUserId: me.vet!.userId as any,
      kind: 'window-start',
      text: `Akceptacja rozmowy – okno do ${to.toISOString()}`,
    });

    return res.json({ ok: true, from, to });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /chat/vet/requests/:id/decline
router.post('/vet/requests/:id/decline', async (req: AuthedRequest, res) => {
  try {
    const me = await whoAmI(req);
    if (me.role !== 'vet') return res.status(403).json({ error: 'Only vets' });

    const { id } = req.params;
    const thread = await ChatThread.findOne({ _id: id, vetId: me.vet!._id });
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    thread.pending = false;
    thread.status = 'expired';
    await thread.save();

    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ============ Vet może zainicjować rozmowę bez akceptacji ============ */
// POST /chat/vet/start  { ownerId, text? }
router.post('/vet/start', async (req: AuthedRequest, res) => {
  try {
    const me = await whoAmI(req);
    if (me.role !== 'vet') return res.status(403).json({ error: 'Only vets' });

    const { ownerId, text } = (req.body as any) || {};
    if (!ownerId || !Types.ObjectId.isValid(ownerId)) return res.status(400).json({ error: 'Invalid ownerId' });

    let thread = await ChatThread.findOne({ vetId: me.vet!._id, ownerId });
    if (!thread) {
      thread = await ChatThread.create({
        vetId: me.vet!._id,
        ownerId,
        initiatedBy: 'vet',
        pending: false,
        windows: [],  // niepotrzebne okna
        status: 'active',
      });
    } else {
      thread.status = 'active';
      thread.pending = false;
      await thread.save();
    }

    if (text && String(text).trim()) {
      await ChatMessage.create({
        threadId: thread._id,
        authorRole: 'vet',
        authorUserId: me.vet!.userId as any,
        text: String(text),
      });
      thread.lastMessageAt = new Date();
      await thread.save();
    }

    return res.json({ ok: true, threadId: String(thread._id) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ============ Listy w panelach ============ */
// GET /chat/me/threads  -> dla zalogowanego (vet lub owner)
router.get('/me/threads', async (req: AuthedRequest, res) => {
  try {
    const me = await whoAmI(req);
    const q = me.role === 'vet' ? { vetId: me.vet!._id } : { ownerId: me.owner!._id };
    const threads = await ChatThread.find(q)
      .populate('vetId', 'clinicName email phone')
      .populate('ownerId', 'name email phone')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    const now = new Date();
    const data = threads.map(t => {
      const status = computeStatus(t);
      let windowTo: Date | null = null;
      if (status === 'active' && t.windows?.length) {
        const last = t.windows[t.windows.length - 1];
        windowTo = new Date(last.to);
      }
      return {
        id: String(t._id),
        vet: t.vetId,
        owner: t.ownerId,
        initiatedBy: t.initiatedBy,
        pending: t.pending,
        status,
        windowTo,
        lastMessageAt: t.lastMessageAt,
        canSend:
          t.initiatedBy === 'vet' ? true :
          (status === 'active' && windowTo! > now),
        hadMessages: Boolean(t.lastMessageAt),
      };
    });

    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ============ Wiadomości ============ */
// GET /chat/threads/:id/messages?limit=50&before=<ISO>
router.get('/threads/:id/messages', async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid thread id' });

    const thread = await ChatThread.findById(id).lean();
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const me = await whoAmI(req);
    const allowed =
      (me.role === 'vet' && String(thread.vetId) === String(me.vet!._id)) ||
      (me.role === 'owner' && String(thread.ownerId) === String(me.owner!._id));
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const limit = Math.min(Number(req.query.limit || 50), 200);
    const before = req.query.before ? new Date(String(req.query.before)) : null;

    const msgs = await ChatMessage.find({
      threadId: thread._id,
      ...(before ? { sentAt: { $lt: before } } : {})
    })
      .sort({ sentAt: -1 })
      .limit(limit)
      .lean();

    return res.json(msgs.reverse()); // rosnąco
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /chat/threads/:id/messages  { text }
router.post('/threads/:id/messages', async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { text } = (req.body as any) || {};
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid thread id' });
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'Empty text' });

    const thread = await ChatThread.findById(id);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const me = await whoAmI(req);
    const isVet = me.role === 'vet' && String(thread.vetId) === String(me.vet!._id);
    const isOwner = me.role === 'owner' && String(thread.ownerId) === String(me.owner!._id);
    if (!isVet && !isOwner) return res.status(403).json({ error: 'Forbidden' });

    // reguły wysyłania
    let canSend = false;
    if (thread.initiatedBy === 'vet') {
      canSend = true; // bez limitu
    } else {
      const status = computeStatus(thread);
      if (status === 'active' && thread.windows?.length) {
        const last = thread.windows[thread.windows.length - 1];
        canSend = new Date() <= new Date(last.to);
      }
    }
    if (!canSend) return res.status(403).json({ error: 'Window closed' });

    const msg = await ChatMessage.create({
      threadId: thread._id,
      authorRole: isVet ? 'vet' : 'owner',
      authorUserId: OID(req.user!.id)!,
      text: String(text),
    });
    thread.lastMessageAt = msg.get('sentAt');
    await thread.save();

    return res.status(201).json(msg);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
