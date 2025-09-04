import { Schema, model, Types } from 'mongoose';

// Schemat pojedynczego wydarzenia w kalendarzu
const OwnerCalendarItemSchema = new Schema(
  {
    date: { type: String, required: true }, // np. '2025-09-01'
    title: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    animalId: { type: Types.ObjectId, ref: 'Animal' }, // opcjonalnie
    animalName: { type: String, trim: true }           // opcjonalnie
  },
  { _id: true } // chcemy mieć _id subdokumentów (do DELETE)
);

const OwnerSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true },
    name:   { type: String, required: true, trim: true },
    email:  { type: String, trim: true, lowercase: true },
    phone:  { type: String, trim: true },

    // ⬇️ NOWE pole
    calendar: { type: [OwnerCalendarItemSchema], default: [] }
  },
  { timestamps: true }
);


export const Owner = model('Owner', OwnerSchema);
export default Owner;
