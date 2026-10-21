// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import GigCard from '../components/GigCard';
import StatusBadge from '../components/StatusBadge';
import { 
  Briefcase, 
  Send, 
  PlayCircle, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  Star,
  GraduationCap
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('posted');
  const [myGigs, setMyGigs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [gigsData, appsData] = await Promise.all([
          api.getGigs({ user_id: currentUser.id }),
          api.getApplications({ applicant_id: currentUser.id })
        ]);
        setMyGigs(gigsData);
        setMyApplications(appsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [currentUser]);

  const activeCollaborations = myGigs.filter(g => g.status === 'In Progress');
  const completedGigs = myGigs.filter(g => g.status === 'Completed');

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Student Overview Card */}
      <div className="bg-white rounded-lg border border-[#E3E9E4] p-5 sm:p-7 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-5 border-b border-[#E3E9E4]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#DCEBE3] text-[#176B52] font-bold text-xl flex items-center justify-center shrink-0">
              {currentUser?.name?.split(' ').map(n=>n[0]).join('') || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl text-[#202923]">{currentUser?.name}</h1>
                {currentUser?.average_rating > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C48D35] bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
                    <Star className="w-3.5 h-3.5 fill-[#E5AD52] text-[#E5AD52]" />
                    {currentUser.average_rating}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#68746D] mt-0.5 flex items-center gap-1.5 font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-[#176B52]" />
                <span>{currentUser?.department || currentUser?.major} • {currentUser?.semester} Semester</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/gigs/create"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] transition-standard shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Post Opportunity
            </Link>
            <Link
              to={`/profile/${currentUser?.id}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3.5 py-2 rounded-md text-xs font-semibold text-[#202923] bg-white hover:bg-[#F8FAF8] border border-[#E3E9E4] transition-standard"
            >
              View Public Profile
            </Link>
          </div>
        </div>

        {/* Dashboard Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="text-[11px] text-[#68746D] flex items-center gap-1.5 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-[#176B52]" />
              Postings Active
            </span>
            <span className="text-lg font-bold text-[#202923]">{myGigs.length}</span>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="text-[11px] text-[#68746D] flex items-center gap-1.5 mb-1">
              <Send className="w-3.5 h-3.5 text-[#176B52]" />
              Applications Sent
            </span>
            <span className="text-lg font-bold text-[#202923]">{myApplications.length}</span>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="text-[11px] text-[#68746D] flex items-center gap-1.5 mb-1">
              <PlayCircle className="w-3.5 h-3.5 text-[#C48D35]" />
              In Progress
            </span>
            <span className="text-lg font-bold text-[#202923]">{activeCollaborations.length}</span>
          </div>

          <div className="bg-[#F8FAF8] p-3 rounded-md border border-[#E3E9E4]">
            <span className="text-[11px] text-[#68746D] flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#287653]" />
              Completed Works
            </span>
            <span className="text-lg font-bold text-[#202923]">{completedGigs.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-[#E3E9E4] mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('posted')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-standard flex items-center gap-1.5 ${
            activeTab === 'posted'
              ? 'border-[#176B52] text-[#176B52]'
              : 'border-transparent text-[#68746D] hover:text-[#202923]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          My Postings ({myGigs.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-standard flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-[#176B52] text-[#176B52]'
              : 'border-transparent text-[#68746D] hover:text-[#202923]'
          }`}
        >
          <Send className="w-4 h-4" />
          My Applications ({myApplications.length})
        </button>

        <button
          onClick={() => setActiveTab('collaborations')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-standard flex items-center gap-1.5 ${
            activeTab === 'collaborations'
              ? 'border-[#176B52] text-[#176B52]'
              : 'border-transparent text-[#68746D] hover:text-[#202923]'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          In Progress ({activeCollaborations.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-standard flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'border-[#176B52] text-[#176B52]'
              : 'border-transparent text-[#68746D] hover:text-[#202923]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completed ({completedGigs.length})
        </button>
      </div>

      {/* Tab 1: My Posted Gigs */}
      {activeTab === 'posted' && (
        <div>
          {myGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGigs.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-12 text-center">
              <p className="text-xs text-[#68746D] mb-3">You haven't posted any opportunities yet.</p>
              <Link to="/gigs/create" className="px-4 py-2 rounded-md bg-[#176B52] hover:bg-[#10513F] text-white text-xs font-semibold shadow-xs">
                Post Your First Opportunity
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-3">
          {myApplications.length > 0 ? (
            myApplications.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-lg border border-[#E3E9E4] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-standard hover:border-[#176B52]/40"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.gig?.status || 'Open'} />
                    <span className="text-[11px] text-[#68746D]">• Applied on {formatDate(app.created_at)}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-[#202923]">
                    {app.gig?.title || 'Gig Opportunity'}
                  </h3>
                  <p className="text-xs text-[#202923] bg-[#F8FAF8] p-2.5 rounded-md border border-[#E3E9E4] leading-relaxed">
                    "{app.message}"
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                    app.status === 'Accepted' ? 'bg-[#EEF5F1] text-[#176B52] border border-[#DCEBE3]' :
                    app.status === 'Rejected' ? 'bg-[#FDF1F1] text-[#B93838] border border-[#B93838]/20' : 
                    'bg-[#FEF8EE] text-[#C48D35] border border-[#E5AD52]/30'
                  }`}>
                    {app.status}
                  </span>

                  <Link
                    to={`/gigs/${app.gig_id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#176B52] hover:text-[#10513F]"
                  >
                    View Gig
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-12 text-center text-xs text-[#68746D]">
              You haven't submitted applications to any gigs yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: In Progress Collaborations */}
      {activeTab === 'collaborations' && (
        <div>
          {activeCollaborations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCollaborations.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-12 text-center text-xs text-[#68746D]">
              No active collaborations currently in progress.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Completed */}
      {activeTab === 'completed' && (
        <div>
          {completedGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGigs.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-12 text-center text-xs text-[#68746D]">
              No completed gigs yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
