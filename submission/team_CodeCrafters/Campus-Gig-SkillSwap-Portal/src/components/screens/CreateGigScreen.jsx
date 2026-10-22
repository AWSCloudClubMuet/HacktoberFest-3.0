import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle,
  Coins,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export function CreateGigScreen() {
  const { createGig, setCurrentScreen, currentUser } = useApp();

  const [type, setType] = useState('Offering');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Programming');
  const [paymentType, setPaymentType] = useState('Paid');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState(['React', 'Tailwind CSS']);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim().replace(',', '');
      if (val && !skillsList.includes(val)) {
        setSkillsList(prev => [...prev, val]);
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 8) {
      newErrors.title = 'Title should be at least 8 characters';
    }

    if (!category) {
      newErrors.category = 'Please choose a category';
    }

    if (paymentType === 'Paid') {
      if (!budget || Number(budget) <= 0) {
        newErrors.budget = 'Please specify a positive budget (e.g. ₹500 or more)';
      }
    }

    if (!deadline) {
      newErrors.deadline = 'Please set an expected deadline';
    } else {
      const selected = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        newErrors.deadline = 'Deadline must be a future date';
      }
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide details about what needs to be done';
    } else if (description.trim().length < 25) {
      newErrors.description = 'Please write at least 25 characters to provide clear context';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (isSubmitting) return;
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createGig({
      title,
      type,
      category,
      payment_type: paymentType,
      budget: paymentType === 'Paid' ? budget : null,
      deadline,
      description,
      skills_required: skillsList.length > 0 ? skillsList : [category]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('explore')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel & Back</span>
        </button>
        <span className="text-xs text-[var(--text-muted)]">
          Posting as <span className="font-bold text-[var(--text-primary)]">{currentUser.name}</span>
        </span>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle p-6 sm:p-10 space-y-8 transition-colors duration-200">
        
        {/* Title & Introduction */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Create a New Campus Gig
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Offer your skills or request help from fellow university students.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Offering vs Requesting Toggle */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Gig Intent <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-[var(--bg-surface-secondary)] rounded-2xl max-w-md border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setType('Offering')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  type === 'Offering'
                    ? 'bg-[var(--primary-emerald)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Offering My Skill
              </button>
              <button
                type="button"
                onClick={() => setType('Requesting')}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  type === 'Requesting'
                    ? 'bg-[var(--primary-emerald)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Requesting Help
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              {type === 'Offering'
                ? "You have a skill or service you'd like to share or teach to others."
                : "You need assistance with coursework, code debugging, design, or project tasks."}
            </p>
          </div>

          {/* Gig Title */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }}
              placeholder="e.g. Build responsive React portfolio, or 1-on-1 Calculus tutoring..."
              className={`w-full px-4 py-3 rounded-xl border text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--text-muted)] ${
                errors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-[var(--border-color)] focus:border-[var(--primary-emerald)] focus:ring-[var(--focus-outline)]/30'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Category & Payment Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Academic Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-emerald)] focus:ring-2 focus:ring-[var(--focus-outline)]/30"
              >
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
                <option value="Tutoring">Tutoring</option>
              </select>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Compensation Model <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentType}
                onChange={(e) => {
                  setPaymentType(e.target.value);
                  if (errors.budget) setErrors(prev => ({ ...prev, budget: null }));
                }}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-emerald)] focus:ring-2 focus:ring-[var(--focus-outline)]/30"
              >
                <option value="Paid">Paid (Cash / Stipend)</option>
                <option value="Skill Swap">Skill Swap (Barter)</option>
                <option value="Free">Free (Community / Peer Study)</option>
              </select>
            </div>

          </div>

          {/* Budget (Conditional if Paid) & Deadline Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Budget */}
            {paymentType === 'Paid' ? (
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                  Budget (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      if (errors.budget) setErrors(prev => ({ ...prev, budget: null }));
                    }}
                    placeholder="e.g. 1500"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--text-muted)] ${
                      errors.budget
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-[var(--border-color)] focus:border-[var(--primary-emerald)] focus:ring-[var(--focus-outline)]/30'
                    }`}
                  />
                </div>
                {errors.budget && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.budget}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-center gap-3">
                <Coins className="w-5 h-5 text-[var(--accent-indigo)]" />
                <div className="text-xs">
                  <span className="font-bold text-[var(--text-primary)]">
                    {paymentType === 'Skill Swap' ? 'Skill Swap' : 'Free Collaboration'}
                  </span>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    No monetary transaction required.
                  </p>
                </div>
              </div>
            )}

            {/* Deadline */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Target Deadline <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  if (errors.deadline) setErrors(prev => ({ ...prev, deadline: null }));
                }}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:ring-2 transition-all ${
                  errors.deadline
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-[var(--border-color)] focus:border-[var(--primary-emerald)] focus:ring-[var(--focus-outline)]/30'
                }`}
              />
              {errors.deadline && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.deadline}</span>
                </p>
              )}
            </div>

          </div>

          {/* Skills Required Tags */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
              Relevant Skills / Tags (Press Enter to add)
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-[var(--bg-surface-secondary)] rounded-xl border border-[var(--border-color)] min-h-[46px] items-center">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] shadow-2xs"
                >
                  <span>#{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-[var(--text-muted)] hover:text-rose-500 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type skill & press Enter..."
                className="flex-1 min-w-[140px] bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none px-2"
              />
            </div>
          </div>

          {/* Full Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Full Description & Deliverables <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                {description.length} chars
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: null }));
              }}
              placeholder="Detail your requirements, project scope, tech stack, and what you're looking for..."
              className={`w-full p-4 rounded-xl border text-sm text-[var(--text-primary)] bg-[var(--bg-input)] focus:outline-none focus:ring-2 transition-all placeholder:text-[var(--text-muted)] ${
                errors.description
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-[var(--border-color)] focus:border-[var(--primary-emerald)] focus:ring-[var(--focus-outline)]/30'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setCurrentScreen('explore')}
              className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing Gig...' : 'Publish Gig'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
