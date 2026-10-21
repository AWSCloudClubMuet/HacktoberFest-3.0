// client/src/components/CreateProfileModal.jsx
import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Sparkles, Check, Plus } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const POPULAR_MAJORS = [
  "Software Engineering",
  "Computer Science",
  "Computer Systems Engineering",
  "Data Science & AI",
  "Electrical Engineering",
  "Information Technology",
  "Graphic & Digital Design",
  "Business Administration & Marketing",
  "English & Linguistics",
  "Architecture & Visual Arts",
  "Mathematics & Computing",
  "Mechanical Engineering"
];

const SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
  "Graduate / Alumni"
];

const SUGGESTED_SKILLS = [
  "React",
  "Python",
  "UI/UX Design",
  "Figma",
  "Data Structures",
  "Tailwind CSS",
  "Node.js",
  "C++",
  "Technical Writing",
  "Calculus",
  "Machine Learning",
  "MATLAB"
];

export default function CreateProfileModal({ isOpen, onClose, onShowToast }) {
  const { createUserProfile } = useUser();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('5th Semester');
  const [bio, setBio] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;
    if (!skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError("Please provide a valid full name (at least 2 characters).");
      return;
    }

    if (!major.trim()) {
      setError("Please select or specify your major / department.");
      return;
    }

    if (!semester.trim()) {
      setError("Please specify your current semester.");
      return;
    }

    try {
      setSubmitting(true);
      const newProfile = await createUserProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        major: major.trim(),
        department: major.trim(),
        semester: semester.trim(),
        bio: bio.trim(),
        skills
      });

      if (onShowToast) {
        onShowToast(`Welcome, ${newProfile.name}! Your student profile has been created.`, "success");
      }

      onClose();
      navigate(`/profile/${newProfile.id}`);
    } catch (err) {
      setError(err.message || "Failed to create profile. Please check your information.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#E3E9E4] relative animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#68746D] hover:text-[#202923] p-1.5 rounded-md hover:bg-[#F2F6F3] transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-lg bg-[#DCEBE3] text-[#176B52] flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[#176B52] uppercase tracking-wider bg-[#EEF5F1] px-2 py-0.5 rounded border border-[#DCEBE3]">
              New Student Registration
            </span>
            <h2 className="text-lg font-bold text-[#202923] mt-1 tracking-tight">
              Create Student Profile
            </h2>
            <p className="text-xs text-[#68746D] mt-0.5">
              Register your verified student persona to post gigs, barter skills, or apply for peer campus opportunities.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 mb-4 rounded-md bg-[#FDF1F1] border border-[#B93838]/20 text-[#B93838] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#202923] mb-1">
              Full Name <span className="text-[#B93838]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fatima Zahra or Ali Raza"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
              required
            />
          </div>

          {/* Email (Optional, Duplicate-Checked) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#202923]">
                Campus Email <span className="text-[11px] text-[#68746D] font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-[#68746D]">Enforces uniqueness</span>
            </div>
            <input
              type="email"
              placeholder="e.g. fatima.student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
            />
          </div>

          {/* Major / Department & Semester Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Department / Major <span className="text-[#B93838]">*</span>
              </label>
              <input
                list="majors-list"
                type="text"
                placeholder="e.g. Software Engineering"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
                required
              />
              <datalist id="majors-list">
                {POPULAR_MAJORS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Current Semester <span className="text-[#B93838]">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#202923]">
                Short Bio / Introduction
              </label>
              <span className="text-[10px] text-[#68746D]">{bio.length} characters</span>
            </div>
            <textarea
              rows="3"
              placeholder="Highlight your academic focus, projects you've worked on, or what skills you love collaborating on..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
            />
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-[#202923] mb-1">
              Skills & Expertise
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Type a skill and press Enter or comma..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDownSkill}
                className="flex-1 text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#176B52] bg-[#EEF5F1] border border-[#DCEBE3] hover:bg-[#DCEBE3] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Added Skills Badges */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 rounded-md bg-[#F8FAF8] border border-[#E3E9E4]">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-white text-[#176B52] border border-[#DCEBE3]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="text-[#68746D] hover:text-[#B93838]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Skills Suggestions */}
            <div>
              <p className="text-[10px] text-[#68746D] mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#176B52]" />
                Quick suggestions (click to add):
              </p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).slice(0, 7).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2F6F3] text-[#202923] hover:bg-[#DCEBE3] hover:text-[#176B52] transition-colors border border-transparent"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3E9E4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !major.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] disabled:opacity-50 transition-standard shadow-xs"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
