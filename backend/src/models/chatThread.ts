// models/ChatThread.ts
import { Schema, model, Types } from 'mongoose';

export type ThreadStatus = 'pending' | 'active' | 'expired' | 'closed';

const windowSchema = new Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { _id: false }
);

const chatThreadSchema = new Schema(
  {
    vetId: { type: Types.ObjectId, ref: 'Vet', required: true },
    ownerId: { type: Types.ObjectId, ref: 'Owner', required: true },

    // kto zainicjował pierwszy kontakt
    initiatedBy: { type: String, enum: ['vet', 'owner'], required: true },

    // dla „owner -> vet”: wniosek i okna akceptacji
    pending: { type: Boolean, default: false },     // oczekuje na decyzję veta
    windows: { type: [windowSchema], default: [] }, // każde okno 3-dniowe

    // wygoda: cachowany status (ale i tak liczymy w locie)
    status: { type: String, enum: ['pending', 'active', 'expired', 'closed'], default: 'pending' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

chatThreadSchema.index({ vetId: 1, ownerId: 1 }, { unique: true });

export default model('ChatThread', chatThreadSchema, 'chat_threads');
