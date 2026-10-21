// client/src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import GigCard from '../components/GigCard';
import { 
  Star, 
  Briefcase, 
  CheckCircle2, 
  Edit3, 
  Save, 
  X, 
  ArrowLeft, 
  GraduationCap, 
  AlertCircle
} from 'lucide-react';

export default function UserProfilePage({ onShowToast }) {
  const { id } = useParams();
  const { currentUser, refreshCurrentUser, reloadUsers } = useUser();
  const [user, setUser] = useState(null);
  const [userGigs, setUserGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    semester: '',
    bio: '',
    skills: ''
  });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentUser?.id === id;

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [userData, gigsData] = await Promise.all([
        api.getUser(id),
        api.getGigs({ user_id: id })
      ]);
      setUser(userData);
      setUserGigs(gigsData);
      setEditForm({
        name: userData.name || '',
        department: userData.department || userData.major || '',
        semester: userData.semester || '',
        bio: userData.bio || '',
        skills: userData.skills ? userData.skills.join(', ') : ''
      });
      setError(null);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!editForm.name.trim()) {
      setFormError("Student name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: editForm.name.trim(),
        department: editForm.department.trim(),
        major: editForm.department.trim(),
        semester: editForm.semester.trim(),
        bio: editForm.bio.trim(),
        skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      };

      const updated = await api.updateUser(user.id, payload, currentUser.id);

      setUser(prev => ({ ...prev, ...updated }));
      setIsEditing(false);
      await refreshCurrentUser();
      await reloadUsers();
      if (onShowToast) onShowToast("Student profile successfully updated.", "success");
    } catch (err) {
      setFormError(err.message || "Failed to update profile.");
      if (onShowToast) onShowToast(`Failed to update profile: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#176B52] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-[#68746D] font-medium">Loading student profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[#FDF1F1] text-[#B93838] flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-semibold text-base text-[#202923] mb-1">Student Not Found</h2>
        <p className="text-xs text-[#68746D] mb-6">{error || "This student profile does not exist."}</p>
        <Link 
          to="/profiles" 
          className="px-4 py-2 rounded-md bg-[#176B52] hover:bg-[#10513F] text-white text-xs font-semibold"
        >
          View Student Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        to="/profiles"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#68746D] hover:text-[#176B52] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Student Directory
      </Link>

      {/* Main Profile Card */}
      <div className="bg-white rounded-lg border border-[#E3E9E4] p-5 sm:p-7 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-[#E3E9E4]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-[#DCEBE3] text-[#176B52] font-bold text-2xl flex items-center justify-center shrink-0">
              {user.name?.split(' ').map(n=>n[0]).join('') || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-xl sm:text-2xl text-[#202923]">{user.name}</h1>
                {user.average_rating > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C48D35] bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
                    <Star className="w-3.5 h-3.5 fill-[#E5AD52] text-[#E5AD52]" />
                    {user.average_rating} ({user.review_count} {user.review_count === 1 ? 'review' : 'reviews'})
                  </span>
                ) : (
                  <span className="text-[11px] text-[#68746D] bg-[#F8FAF8] border border-[#E3E9E4] px-2 py-0.5 rounded">
                    No reviews yet
                  </span>
                )}
              </div>
              <p className="text-xs text-[#68746D] mt-1 flex items-center gap-1.5 font-medium">
                <GraduationCap className="w-4 h-4 text-[#176B52]" />
                <span>{user.department || user.major} • {user.semester} Semester</span>
              </p>
            </div>
          </div>

          {isOwnProfile && !isEditing && (
            <button
              onClick={() => {
                setIsEditing(true);
                setFormError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-[#176B52] bg-[#EEF5F1] hover:bg-[#DCEBE3] transition-standard border border-[#DCEBE3]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 bg-[#F8FAF8] p-5 rounded-md border border-[#E3E9E4]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E9E4]">
              <h3 className="text-xs font-semibold text-[#202923] uppercase tracking-wide">Edit Student Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[#68746D] hover:text-[#202923]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-md bg-[#FDF1F1] border border-[#B93838]/20 text-xs text-[#B93838]">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">
                  Full Name <span className="text-[#B93838]">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Department / Major</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                  placeholder="e.g. Software Engineering"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Current Semester</label>
                <input
                  type="text"
                  value={editForm.semester}
                  onChange={(e) => setEditForm(prev => ({ ...prev, semester: e.target.value }))}
                  className="w-full text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                  placeholder="e.g. 6th"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.skills}
                  onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g. React, Python, UI Design"
                  className="w-full text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#202923] mb-1">Bio & Overview</label>
              <textarea
                rows="3"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Briefly describe your experience, what you study, and what skills you can offer or are seeking..."
                className="w-full text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#68746D] hover:bg-[#E3E9E4]/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] transition-standard shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Bio */}
            <div>
              <h3 className="text-xs font-semibold text-[#68746D] uppercase tracking-wider mb-1.5">About</h3>
              <p className="text-xs sm:text-sm text-[#202923] leading-relaxed max-w-3xl">
                {user.bio || "No biography provided yet."}
              </p>
            </div>

            {/* Skills */}
            {user.skills?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#68746D] uppercase tracking-wider mb-2">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-md bg-[#F8FAF8] text-[#202923] border border-[#E3E9E4] text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Real Dynamic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E3E9E4] text-center">
          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="block text-lg font-bold text-[#202923]">{user.gigs_posted || 0}</span>
            <span className="text-[11px] text-[#68746D]">Opportunities Posted</span>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="block text-lg font-bold text-[#202923]">{user.gigs_completed || 0}</span>
            <span className="text-[11px] text-[#68746D]">Completed Works</span>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="block text-lg font-bold text-[#202923]">{user.average_rating > 0 ? `${user.average_rating} ★` : '—'}</span>
            <span className="text-[11px] text-[#68746D]">Average Rating</span>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="block text-lg font-bold text-[#202923]">{user.review_count || 0}</span>
            <span className="text-[11px] text-[#68746D]">Verified Reviews</span>
          </div>
        </div>
      </div>

      {/* Tabs: Opportunities Posted & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Gigs Posted */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-[#176B52]" />
            <h2 className="font-semibold text-sm sm:text-base text-[#202923]">
              Postings by {user.name} ({userGigs.length})
            </h2>
          </div>

          {userGigs.length > 0 ? (
            <div className="space-y-3">
              {userGigs.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-8 text-center text-xs text-[#68746D]">
              No active postings listed by this student yet.
            </div>
          )}
        </div>

        {/* Right: Reviews Received */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#E5AD52] fill-[#E5AD52]" />
            <h2 className="font-semibold text-sm sm:text-base text-[#202923]">
              Verified Reviews ({user.reviews_received?.length || 0})
            </h2>
          </div>

          {user.reviews_received?.length > 0 ? (
            <div className="space-y-3">
              {user.reviews_received.map(rev => (
                <div key={rev.id} className="bg-white rounded-lg border border-[#E3E9E4] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#DCEBE3] text-[#176B52] font-semibold flex items-center justify-center text-xs">
                        {rev.reviewer?.name?.split(' ').map(n=>n[0]).join('') || 'S'}
                      </div>
                      <span className="text-xs font-semibold text-[#202923]">{rev.reviewer?.name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-medium text-[#C48D35] bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
                      <Star className="w-3 h-3 fill-[#E5AD52] text-[#E5AD52]" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#202923] leading-relaxed">
                    "{rev.comment}"
                  </p>
                  <p className="text-[10px] text-[#68746D]">Gig: {rev.gig_title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-8 text-center text-xs text-[#68746D]">
              No reviews received yet. Reviews appear automatically after gigs reach Completed status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
