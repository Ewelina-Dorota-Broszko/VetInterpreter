// models/ChatMessage.ts
import { Schema, model, Types } from 'mongoose';

const chatMessageSchema = new Schema(
  {
    threadId: { type: Types.ObjectId, ref: 'ChatThread', required: true },
    authorRole: { type: String, enum: ['vet', 'owner', 'system'], required: true },
    authorUserId: { type: Types.ObjectId, required: true },

    text: { type: String, default: '' },
    // znacznik systemowy (np. divider dla nowych okien)
    kind: { type: String, enum: ['text', 'window-start'], default: 'text' },
  },
  { timestamps: { createdAt: 'sentAt', updatedAt: false } }
);

chatMessageSchema.index({ threadId: 1, sentAt: 1 });

export default model('ChatMessage', chatMessageSchema, 'chat_messages');
