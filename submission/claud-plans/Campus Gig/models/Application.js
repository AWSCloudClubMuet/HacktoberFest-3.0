import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    gig_id: { type: String, required: true, ref: 'Gig' },
    applicant_id: { type: String, required: true, ref: 'User' },
    message: { type: String, required: true },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Accepted', 'Rejected'],
    },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const ApplicationModel = mongoose.models.Application || mongoose.model('Application', applicationSchema);
