// client/src/pages/CreateEditGigPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import GigCard from '../components/GigCard';
import { 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  Code2, 
  Palette, 
  PenTool, 
  GraduationCap, 
  AlertCircle,
  Save,
  Check
} from 'lucide-react';

export default function CreateEditGigPage({ onShowToast }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Requesting',
    category: 'Programming',
    payment_type: 'Paid',
    budget: '50',
    skills: 'React, Tailwind CSS',
    deadline: ''
  });

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set default deadline to 14 days in the future
  useEffect(() => {
    if (!isEdit) {
      const future = new Date();
      future.setDate(future.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        deadline: future.toISOString().split('T')[0]
      }));
    }
  }, [isEdit]);

  // Load existing gig if in edit mode
  useEffect(() => {
    if (isEdit) {
      const loadGig = async () => {
        try {
          setLoading(true);
          const data = await api.getGig(id);
          if (data.user_id !== currentUser?.id) {
            setError("You can only edit opportunities you created.");
            return;
          }
          if (data.status !== 'Open') {
            setError(`Cannot edit opportunity while status is '${data.status}'. Only Open opportunities can be edited.`);
            return;
          }
          setFormData({
            title: data.title || '',
            description: data.description || '',
            type: data.type || 'Requesting',
            category: data.category || 'Programming',
            payment_type: data.payment_type || 'Paid',
            budget: data.budget !== null && data.budget !== undefined ? String(data.budget) : '',
            skills: Array.isArray(data.skills_required) ? data.skills_required.join(', ') : '',
            deadline: data.deadline ? data.deadline.split('T')[0] : ''
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadGig();
    }
  }, [id, isEdit, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title || formData.title.trim().length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }
    if (!formData.description || formData.description.trim().length < 10) {
      setError("Description must be at least 10 characters long.");
      return;
    }
    if (formData.payment_type === 'Paid') {
      const b = Number(formData.budget);
      if (isNaN(b) || b <= 0) {
        setError("Paid opportunities require a valid budget greater than $0.");
        return;
      }
    }
    if (!formData.deadline) {
      setError("Please select a valid deadline.");
      return;
    }
    const d = new Date(formData.deadline);
    if (d <= new Date()) {
      setError("Deadline must be a future date.");
      return;
    }

    try {
      setSubmitting(true);
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        category: formData.category,
        payment_type: formData.payment_type,
        budget: formData.payment_type === 'Paid' ? Number(formData.budget) : null,
        skills_required: skillsArray,
        skills_offered: skillsArray,
        deadline: new Date(formData.deadline).toISOString(),
        user_id: currentUser.id
      };

      if (isEdit) {
        await api.updateGig(id, payload, currentUser.id);
        if (onShowToast) onShowToast("Opportunity updated successfully.", "success");
        navigate(`/gigs/${id}`);
      } else {
        const created = await api.createGig(payload, currentUser.id);
        if (onShowToast) onShowToast("New campus opportunity posted successfully.", "success");
        navigate(`/gigs/${created.id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to save opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  const previewGig = {
    id: 'preview',
    user_id: currentUser?.id,
    title: formData.title || 'Opportunity Title Preview',
    description: formData.description || 'Description will appear here as you write your opportunity proposal...',
    type: formData.type,
    category: formData.category,
    payment_type: formData.payment_type,
    budget: formData.payment_type === 'Paid' ? (Number(formData.budget) || 0) : null,
    skills_required: formData.skills ? formData.skills.split(',').map(s=>s.trim()).filter(Boolean) : [],
    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : new Date().toISOString(),
    status: 'Open',
    owner: currentUser,
    applications: []
  };

  const categories = [
    { id: 'Programming', label: 'Programming', icon: Code2 },
    { id: 'Design', label: 'Design', icon: Palette },
    { id: 'Writing', label: 'Writing', icon: PenTool },
    { id: 'Tutoring', label: 'Tutoring', icon: GraduationCap }
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#176B52] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-[#68746D] font-medium">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        to={isEdit ? `/gigs/${id}` : '/'}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#68746D] hover:text-[#176B52] mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {isEdit ? 'Cancel & Return' : 'Back to Marketplace'}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#202923] tracking-tight">
          {isEdit ? 'Edit Opportunity' : 'Post an Opportunity or SkillSwap'}
        </h1>
        <p className="text-xs sm:text-sm text-[#68746D] mt-0.5">
          Share a paid gig, propose a skill exchange barter, or request student project assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#E3E9E4] p-5 sm:p-7 space-y-5">
            {error && (
              <div className="p-3.5 rounded-md bg-[#FDF1F1] border border-[#B93838]/20 text-[#B93838] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Opportunity Type */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Listing Type <span className="text-[#B93838]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'Requesting' }))}
                  className={`p-3 rounded-md border text-left transition-standard ${
                    formData.type === 'Requesting' 
                      ? 'bg-[#EEF5F1] border-[#176B52] ring-1 ring-[#176B52]' 
                      : 'border-[#E3E9E4] hover:bg-[#F8FAF8]'
                  }`}
                >
                  <span className="block text-xs font-semibold text-[#202923]">Requesting Help</span>
                  <span className="text-[11px] text-[#68746D]">Looking for a classmate to assist you</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'Offering' }))}
                  className={`p-3 rounded-md border text-left transition-standard ${
                    formData.type === 'Offering' 
                      ? 'bg-[#EEF5F1] border-[#176B52] ring-1 ring-[#176B52]' 
                      : 'border-[#E3E9E4] hover:bg-[#F8FAF8]'
                  }`}
                >
                  <span className="block text-xs font-semibold text-[#202923]">Offering Services</span>
                  <span className="text-[11px] text-[#68746D]">Offering your tutoring or technical skills</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Opportunity Title <span className="text-[#B93838]">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Build Full-Stack React & Node Web Portal for Capstone"
                className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Category <span className="text-[#B93838]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`p-2.5 rounded-md border flex items-center gap-2 transition-standard text-xs ${
                        isSelected 
                          ? 'bg-[#EEF5F1] text-[#176B52] border-[#176B52] font-semibold' 
                          : 'border-[#E3E9E4] text-[#68746D] hover:bg-[#F8FAF8]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compensation Model */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1.5">
                Compensation Arrangement <span className="text-[#B93838]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Paid', label: 'Paid Project', desc: 'Monetary budget' },
                  { id: 'SkillSwap', label: 'SkillSwap Barter', desc: 'Exchange skills' },
                  { id: 'Free', label: 'Volunteer / Free', desc: 'Academic help' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, payment_type: m.id }))}
                    className={`p-2.5 rounded-md border text-left transition-standard ${
                      formData.payment_type === m.id
                        ? 'bg-[#EEF5F1] border-[#176B52] ring-1 ring-[#176B52]'
                        : 'border-[#E3E9E4] hover:bg-[#F8FAF8]'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-[#202923]">{m.label}</span>
                    <span className="text-[10px] text-[#68746D]">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget if Paid */}
            {formData.payment_type === 'Paid' && (
              <div>
                <label className="block text-xs font-semibold text-[#202923] mb-1">
                  Budget ($ USD) <span className="text-[#B93838]">*</span>
                </label>
                <div className="relative w-44">
                  <input
                    type="number"
                    name="budget"
                    min="1"
                    value={formData.budget}
                    onChange={handleChange}
                    className="w-full text-xs pl-7 pr-3 py-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                    required
                  />
                  <DollarSign className="w-3.5 h-3.5 text-[#68746D] absolute left-2.5 top-2.5" />
                </div>
              </div>
            )}

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Relevant Skills (comma-separated)
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. React, Node.js, Python, Figma"
                className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Detailed Scope & Expectations <span className="text-[#B93838]">*</span>
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe project details, deliverables, tech stack, and any deadlines..."
                className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                required
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Completion Deadline <span className="text-[#B93838]">*</span>
              </label>
              <div className="relative w-56">
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                  required
                />
                <Calendar className="w-3.5 h-3.5 text-[#68746D] absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-[#E3E9E4] flex items-center justify-end gap-3">
              <Link
                to="/"
                className="px-4 py-2 rounded-md text-xs font-medium text-[#68746D] hover:bg-[#E3E9E4]/40"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] transition-standard shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {submitting ? 'Saving...' : isEdit ? 'Update Opportunity' : 'Publish Opportunity'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-xs font-semibold text-[#68746D] uppercase tracking-wider">
            Card Preview
          </p>
          <GigCard gig={previewGig} />
          <p className="text-[11px] text-[#68746D] leading-relaxed">
            This preview simulates how your opportunity will appear in the main campus marketplace list.
          </p>
        </div>
      </div>
    </div>
  );
}
