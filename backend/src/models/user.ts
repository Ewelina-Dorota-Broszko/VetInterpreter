// backend/src/models/user.ts
import { Schema, model, Document } from 'mongoose';

export type UserRole = 'owner' | 'vet' | 'admin';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  lastLoginAt: Date | null;
  isVet: boolean; // legacy/compat
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },

    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    phone:        { type: String, required: true, trim: true },

    role:         { type: String, enum: ['owner', 'vet', 'admin'], default: 'owner', index: true },
    lastLoginAt:  { type: Date, default: null },

    // zgodność wstecz: możesz to w przyszłości usunąć
    isVet:        { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

const User = model<IUser>('User', UserSchema);
export default User;
