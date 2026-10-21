import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    major: { type: String, required: true },
    semester: { type: Number, required: true },
    skills: [{ type: String }],
    password: { type: String },
    role: { type: String, default: 'student', enum: ['student', 'admin'] },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
