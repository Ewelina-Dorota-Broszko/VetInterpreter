import { Schema, model, Types } from 'mongoose';

const clinicalFileSchema = new Schema(
  {
    vetId: { type: Types.ObjectId, ref: 'Vet', required: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },

    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    note: { type: String, default: '' },
    path: { type: String, required: true },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

// Wirtualny URL do pobrania
clinicalFileSchema.virtual('url').get(function (this: any) {
  return `/vet-files/${this._id}/download`;
});

export default model('ClinicalFile', clinicalFileSchema, 'clinical_files');
