import { Schema, model, Types } from 'mongoose';

const OwnerSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true }, // powiązanie z userem
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true }
  },
  { timestamps: true }
);

export const Owner = model('Owner', OwnerSchema);
export default Owner;
