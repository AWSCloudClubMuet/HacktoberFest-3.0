import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Programming', 'Design', 'Writing', 'Tutoring'],
    },
    type: {
      type: String,
      required: true,
      enum: ['Offering', 'Requesting'],
    },
    payment_type: {
      type: String,
      required: true,
      enum: ['Paid', 'SkillSwap', 'Free'],
    },
    budget: { type: Number, default: null },
    deadline: { type: String, required: true },
    status: {
      type: String,
      default: 'Open',
      enum: ['Open', 'In Progress', 'Completed', 'Cancelled', 'Expired'],
    },
    owner_id: { type: String, required: true, ref: 'User' },
    accepted_applicant_id: { type: String, default: null, ref: 'User' },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const GigModel = mongoose.models.Gig || mongoose.model('Gig', gigSchema);
