import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Check, X } from 'lucide-react';

export function ManageApplicationsScreen() {
  const {
    userPostedGigs,
    applications,
    gigs,
    acceptApplicant,
    rejectApplicant,
    viewGig,
    viewProfile,
    setCurrentScreen
  } = useApp();

  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedGigFilter, setSelectedGigFilter] = useState('All');

  // Gigs owned by current user
  const userGigIds = userPostedGigs.map(g => g.id);

  // Applications received for current user's gigs
  const receivedApplications = applications.filter(a => userGigIds.includes(a.gig_id));

  // Filtered by status and gig
  const filteredApps = receivedApplications.filter(a => {
    if (activeTab !== 'All' && a.status !== activeTab) return false;
    if (selectedGigFilter !== 'All' && a.gig_id !== selectedGigFilter) return false;
    return true;
  });

  const pendingCount = receivedApplications.filter(a => a.status === 'Pending').length;
  const acceptedCount = receivedApplications.filter(a => a.status === 'Accepted').length;
  const rejectedCount = receivedApplications.filter(a => a.status === 'Rejected').length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Manage Applications
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Review student pitches for your gigs. Accepting an applicant automatically transitions your gig to In Progress.
          </p>
        </div>

        {/* Filter by Gig dropdown */}
        {userPostedGigs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] hidden sm:inline">Filter by Gig:</span>
            <select
              value={selectedGigFilter}
              onChange={(e) => setSelectedGigFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] cursor-pointer"
            >
              <option value="All">All My Gigs ({userPostedGigs.length})</option>
              {userPostedGigs.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('Pending')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'Pending' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Pending</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            pendingCount > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)]'
          }`}>
            {pendingCount}
          </span>
          {activeTab === 'Pending' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('Accepted')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'Accepted' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Accepted</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)]">
            {acceptedCount}
          </span>
          {activeTab === 'Accepted' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('Rejected')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'Rejected' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Rejected</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--bg-surface-secondary)] text-[var(--text-muted)]">
            {rejectedCount}
          </span>
          {activeTab === 'Rejected' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
          )}
        </button>
      </div>

      {/* Applications List */}
      {filteredApps.length > 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle overflow-hidden transition-colors duration-200">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-4 pl-6">Gig Title</th>
                  <th className="p-4">Applicant</th>
                  <th className="p-4">Proposal / Pitch</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredApps.map(app => {
                  const gig = gigs.find(g => g.id === app.gig_id);
                  const isPending = app.status === 'Pending';

                  return (
                    <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      {/* Gig Title */}
                      <td className="p-4 pl-6 font-bold text-[var(--text-primary)] max-w-[200px]">
                        {gig ? (
                          <div
                            onClick={() => viewGig(gig.id)}
                            className="hover:text-[var(--primary-emerald)] cursor-pointer line-clamp-2"
                            title={gig.title}
                          >
                            {gig.title}
                          </div>
                        ) : (
                          "Opportunity"
                        )}
                        <span className="text-[10px] text-[var(--text-muted)] font-normal block mt-0.5">
                          {gig?.payment_type === 'Paid' ? `₹${gig.budget}` : gig?.payment_type}
                        </span>
                      </td>

                      {/* Applicant Profile */}
                      <td className="p-4 min-w-[180px]">
                        <div
                          onClick={() => viewProfile(app.applicant_id)}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-85"
                        >
                          <img
                            src={app.applicant_avatar}
                            alt={app.applicant_name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border-color)]"
                          />
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block">{app.applicant_name}</span>
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              {app.applicant_major} • {app.applicant_semester}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pitch Message */}
                      <td className="p-4 text-[var(--text-secondary)] max-w-xs">
                        <p className="line-clamp-2 leading-relaxed">{app.message}</p>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <Badge variant={app.status}>{app.status}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right shrink-0">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => acceptApplicant(app.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => rejectApplicant(app.id)}
                              className="px-3.5 py-1.5 rounded-xl border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 active:scale-95 text-xs font-semibold transition-all flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden divide-y divide-[var(--border-color)]">
            {filteredApps.map(app => {
              const gig = gigs.find(g => g.id === app.gig_id);
              const isPending = app.status === 'Pending';

              return (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={app.status}>{app.status}</Badge>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Gig</span>
                    <h4
                      onClick={() => gig && viewGig(gig.id)}
                      className="font-bold text-[var(--text-primary)] text-sm hover:text-[var(--primary-emerald)] cursor-pointer"
                    >
                      {gig?.title}
                    </h4>
                  </div>

                  {/* Applicant Info */}
                  <div
                    onClick={() => viewProfile(app.applicant_id)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface-secondary)] cursor-pointer"
                  >
                    <img
                      src={app.applicant_avatar}
                      alt={app.applicant_name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-[var(--text-primary)] block">{app.applicant_name}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block truncate">
                        {app.applicant_major} • {app.applicant_semester}
                      </span>
                    </div>
                  </div>

                  {/* Proposal text */}
                  <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-secondary)] p-3 rounded-xl border border-[var(--border-color)] italic leading-relaxed">
                    "{app.message}"
                  </p>

                  {/* Mobile Actions */}
                  {isPending && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => acceptApplicant(app.id)}
                        className="py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => rejectApplicant(app.id)}
                        className="py-2.5 rounded-xl border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      ) : (
        <EmptyState
          title={`No ${activeTab.toLowerCase()} applications`}
          description={
            activeTab === 'Pending'
              ? "When students submit pitches for your gigs, you'll review and accept them right here."
              : "No applications found in this category."
          }
          actionText="Create Another Opportunity"
          onAction={() => setCurrentScreen('create-gig')}
        />
      )}

    </div>
  );
}
