// client/src/pages/CreateProfilePage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Sparkles, Check, Plus, X, AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { useUser } from '../context/UserContext';

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

export default function CreateProfilePage({ onShowToast }) {
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
        onShowToast(`Welcome to Campus Gig, ${newProfile.name}! Your student profile has been created.`, "success");
      }

      navigate(`/profile/${newProfile.id}`);
    } catch (err) {
      setError(err.message || "Failed to create profile. Please check your information.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/profiles"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#68746D] hover:text-[#176B52] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Student Directory
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#E3E9E4] p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#E3E9E4]">
          <div className="w-12 h-12 rounded-xl bg-[#DCEBE3] text-[#176B52] flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[#176B52] uppercase tracking-wider bg-[#EEF5F1] px-2 py-0.5 rounded border border-[#DCEBE3]">
              Join the Campus Marketplace
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202923] mt-1 tracking-tight">
              Create Student Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#68746D] mt-1 leading-relaxed">
              Create a personalized peer profile to post student opportunities, propose skill swaps, or earn peer reviews on campus.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-6 rounded-md bg-[#FDF1F1] border border-[#B93838]/20 text-[#B93838] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-[#202923] mb-1.5">
              Full Name <span className="text-[#B93838]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Fatima Zahra or Ali Raza"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
              required
            />
          </div>

          {/* Email (Optional, Duplicate-Checked) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#202923]">
                Campus Email <span className="text-[11px] text-[#68746D] font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-[#68746D]">Enforces duplicate prevention</span>
            </div>
            <input
              type="email"
              placeholder="e.g. fatima.student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
            />
          </div>

          {/* Major / Department & Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Department / Major <span className="text-[#B93838]">*</span>
              </label>
              <input
                list="majors-list-page"
                type="text"
                placeholder="e.g. Software Engineering"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
                required
              />
              <datalist id="majors-list-page">
                {POPULAR_MAJORS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Current Semester <span className="text-[#B93838]">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
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
              className="w-full text-xs sm:text-sm p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
            />
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-[#202923] mb-1.5">
              Skills & Expertise
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                placeholder="Type a skill and press Enter..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDownSkill}
                className="flex-1 text-xs sm:text-sm p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] focus:outline-hidden focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] transition-standard"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                className="px-4 py-2 rounded-md text-xs font-medium text-[#176B52] bg-[#EEF5F1] border border-[#DCEBE3] hover:bg-[#DCEBE3] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Added Skills Badges */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-md bg-[#F8FAF8] border border-[#E3E9E4]">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white text-[#176B52] border border-[#DCEBE3]"
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

            {/* Quick Suggestions */}
            <div>
              <p className="text-[11px] text-[#68746D] mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#176B52]" />
                Recommended skills (click to add):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.filter(s => !skills.includes(s)).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#F2F6F3] text-[#202923] hover:bg-[#DCEBE3] hover:text-[#176B52] transition-colors border border-transparent"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E3E9E4]">
            <Link
              to="/profiles"
              className="px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-[#68746D] hover:text-[#202923] hover:bg-[#F2F6F3] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !major.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs sm:text-sm font-semibold text-white bg-[#176B52] hover:bg-[#10513F] disabled:opacity-50 transition-standard shadow-xs"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
