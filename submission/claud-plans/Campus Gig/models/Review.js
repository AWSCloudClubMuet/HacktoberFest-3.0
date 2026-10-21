import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    gig_id: { type: String, required: true, ref: 'Gig' },
    reviewer_id: { type: String, required: true, ref: 'User' },
    reviewee_id: { type: String, required: true, ref: 'User' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);
