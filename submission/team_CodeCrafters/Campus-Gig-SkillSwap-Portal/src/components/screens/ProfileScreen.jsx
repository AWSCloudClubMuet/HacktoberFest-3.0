import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RatingStars } from '../common/RatingStars';
import { GigCard } from '../cards/GigCard';
import {
  GraduationCap,
  Edit3,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export function ProfileScreen() {
  const {
    selectedProfileId,
    users,
    currentUser,
    gigs,
    reviews,
    switchUser,
    setCurrentScreen,
    addToast
  } = useApp();

  const profileUser = users.find(u => u.id === selectedProfileId) || currentUser;
  const isMe = profileUser.id === currentUser.id;

  const [activeTab, setActiveTab] = useState('gigs');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(profileUser.bio);

  // User gigs
  const userGigs = gigs.filter(g => g.user_id === profileUser.id);

  // User reviews
  const reviewsReceived = reviews.filter(r => r.reviewee_id === profileUser.id);
  const reviewsGiven = reviews.filter(r => r.reviewer_id === profileUser.id);

  const handleSaveBio = () => {
    profileUser.bio = bioText;
    setIsEditingBio(false);
    addToast("Profile bio updated!", 'success');
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Profile Header Hero Card */}
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle overflow-hidden transition-colors duration-200">
        
        {/* Cover pattern */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-[#008F72] via-[#00765E] to-[#5146D8] relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Campus Verified</span>
            </span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-[var(--bg-surface)] shadow-lg bg-[var(--bg-surface)]"
                />
                <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[var(--primary-emerald)] ring-4 ring-[var(--bg-surface)]" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {profileUser.name}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--primary-emerald)]" />
                  <span>{profileUser.major}</span>
                  <span>•</span>
                  <span>{profileUser.semester}</span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <RatingStars rating={profileUser.rating || 5.0} size="sm" />
                  <span className="text-xs font-extrabold text-[var(--text-primary)]">{profileUser.rating || 5.0}</span>
                  <span className="text-xs text-[var(--text-muted)]">({reviewsReceived.length} reviews)</span>
                </div>
              </div>
            </div>

            {/* Profile CTA Buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              {isMe ? (
                <button
                  onClick={() => setIsEditingBio(prev => !prev)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] transition-all flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingBio ? "Done" : "Edit Bio"}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentScreen('messages')}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={() => switchUser(profileUser.id)}
                    className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-xs font-semibold transition-all"
                    title="Switch session to this user"
                  >
                    Login as {profileUser.name.split(' ')[0]}
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-center mb-6">
            <div>
              <span className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] block">
                {profileUser.gigs_posted || userGigs.length}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Gigs Posted</span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold text-[var(--primary-emerald)] block">
                {profileUser.gigs_completed || 0}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Completed</span>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold text-amber-500 block">
                {profileUser.rating || 5.0} ★
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Average Rating</span>
            </div>
          </div>

          {/* Bio & Skills */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                About Student
              </h3>
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline)]/30 focus:border-[var(--primary-emerald)]"
                  />
                  <button
                    onClick={handleSaveBio}
                    className="px-4 py-1.5 rounded-lg bg-[var(--primary-emerald)] text-white text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {profileUser.bio}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Core Skill Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {profileUser.skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-semibold"
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Tabs Section: Gigs / Reviews Received / Reviews Given */}
      <div className="space-y-4">
        
        <div className="flex border-b border-[var(--border-color)] gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('gigs')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'gigs' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Opportunities by {profileUser.name.split(' ')[0]} ({userGigs.length})</span>
            {activeTab === 'gigs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews-received')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'reviews-received' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Reviews Received ({reviewsReceived.length})</span>
            {activeTab === 'reviews-received' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews-given')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'reviews-given' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Reviews Given ({reviewsGiven.length})</span>
            {activeTab === 'reviews-given' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Gigs */}
        {activeTab === 'gigs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {userGigs.length > 0 ? (
              userGigs.map(g => (
                <GigCard key={g.id} gig={g} />
              ))
            ) : (
              <div className="col-span-full p-8 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] text-xs">
                No active gigs posted yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reviews Received */}
        {activeTab === 'reviews-received' && (
          <div className="space-y-3">
            {reviewsReceived.length > 0 ? (
              reviewsReceived.map(r => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle space-y-2 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={r.reviewer_avatar}
                        alt={r.reviewer_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-xs text-[var(--text-primary)] block">{r.reviewer_name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <RatingStars rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic pt-1">
                    "{r.comment}"
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] text-xs">
                No reviews received yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews Given */}
        {activeTab === 'reviews-given' && (
          <div className="space-y-3">
            {reviewsGiven.length > 0 ? (
              reviewsGiven.map(r => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle space-y-2 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      Reviewed for Peer: {r.reviewee_name}
                    </span>
                    <RatingStars rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                    "{r.comment}"
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] text-xs">
                No reviews written yet.
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
