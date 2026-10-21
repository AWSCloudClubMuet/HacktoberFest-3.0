// client/src/pages/ProfilesDirectoryPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Search, Star, Users, ArrowRight, GraduationCap, X, UserPlus } from 'lucide-react';
import CreateProfileModal from '../components/CreateProfileModal';

export default function ProfilesDirectoryPage({ onShowToast }) {
  const { users, currentUser } = useUser();
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.major && u.major.toLowerCase().includes(q)) ||
      (u.skills && u.skills.some(s => s.toLowerCase().includes(q))) ||
      (u.bio && u.bio.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-[#E3E9E4]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#202923] tracking-tight">
              Student Directory
            </h1>
            <span className="text-xs bg-[#EEF5F1] text-[#176B52] font-semibold px-2 py-0.5 rounded-full border border-[#DCEBE3]">
              {users.length} Students
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#68746D] mt-0.5">
            Browse verified campus students, skills, and ratings across departments.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Search by student, skill, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-8 py-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923] placeholder-[#68746D]/60 transition-standard"
            />
            <Search className="w-3.5 h-3.5 text-[#68746D] absolute left-2.5 top-2.5" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[#68746D] hover:text-[#202923]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Create Profile Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] transition-colors shadow-xs shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Profile</span>
          </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(u => {
          const isCurrent = currentUser?.id === u.id;
          return (
            <div
              key={u.id}
              className="bg-white rounded-lg border border-[#E3E9E4] hover:border-[#176B52]/50 hover:shadow-card p-5 transition-standard flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-[#DCEBE3] text-[#176B52] font-semibold flex items-center justify-center text-sm shrink-0">
                      {u.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#202923] flex items-center gap-1.5 leading-tight">
                        {u.name}
                        {isCurrent && (
                          <span className="text-[9px] bg-[#EEF5F1] text-[#176B52] font-semibold px-1 py-0.2 rounded">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-[#68746D] flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 text-[#176B52]" />
                        <span>{u.department || u.major} • {u.semester}</span>
                      </p>
                    </div>
                  </div>

                  {u.average_rating > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#C48D35] bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
                      <Star className="w-3 h-3 fill-[#E5AD52] text-[#E5AD52]" />
                      <span>{u.average_rating}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#68746D]">New</span>
                  )}
                </div>

                <p className="text-xs text-[#68746D] line-clamp-2 mb-3 leading-relaxed min-h-[2.5rem]">
                  {u.bio || "Campus student on Campus Gig & SkillSwap."}
                </p>

                {/* Skills Tags */}
                {u.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {u.skills.slice(0, 4).map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAF8] text-[#202923] border border-[#E3E9E4]"
                      >
                        {skill}
                      </span>
                    ))}
                    {u.skills.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F8FAF8] text-[#68746D]">
                        +{u.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-[#E3E9E4] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#68746D]">
                  {u.gigs_posted || 0} {u.gigs_posted === 1 ? 'posting' : 'postings'}
                </span>
                <Link
                  to={`/profile/${u.id}`}
                  className="inline-flex items-center gap-1 font-medium text-xs text-[#176B52] hover:text-[#10513F] transition-colors"
                >
                  View Profile
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-lg border border-[#E3E9E4] p-12 text-center text-xs text-[#68746D]">
          No students match "{search}".
        </div>
      )}

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
}
