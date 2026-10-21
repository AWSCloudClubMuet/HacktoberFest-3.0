// client/src/pages/MarketplacePage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import FilterSidebar from '../components/FilterSidebar';
import GigCard from '../components/GigCard';
import api from '../services/api';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  PlusCircle, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Initialize filters
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'all',
    type: searchParams.get('type') || 'all',
    payment_type: searchParams.get('payment_type') || 'all',
    status: searchParams.get('status') || 'all',
    min_budget: searchParams.get('min_budget') || '',
    max_budget: searchParams.get('max_budget') || '',
    sort: searchParams.get('sort') || 'latest'
  });

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const data = await api.getGigs(filters);
      setGigs(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch gigs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      type: 'all',
      payment_type: 'all',
      status: 'all',
      min_budget: '',
      max_budget: '',
      sort: 'latest'
    });
  };

  const handleQuickTab = (paymentType) => {
    setFilters(prev => ({
      ...prev,
      payment_type: paymentType
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Header & Search Bar */}
      <div className="mb-6 pb-6 border-b border-[#E3E9E4]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#202923] tracking-tight">
              Campus Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-[#68746D] mt-0.5">
              Peer-to-peer student marketplace for freelance gigs, skill exchanges, and academic tutoring.
            </p>
          </div>

          <Link
            to="/gigs/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#176B52] hover:bg-[#10513F] text-white text-xs font-semibold shadow-xs transition-standard shrink-0 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post an Opportunity</span>
          </Link>
        </div>

        {/* Quick Compensation Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { label: 'All Opportunities', value: 'all' },
              { label: 'Paid Gigs', value: 'Paid' },
              { label: 'SkillSwaps', value: 'SkillSwap' },
              { label: 'Free Volunteer', value: 'Free' }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => handleQuickTab(tab.value)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-standard ${
                  (filters.payment_type || 'all') === tab.value
                    ? 'bg-[#176B52] text-white shadow-xs'
                    : 'bg-white text-[#68746D] hover:text-[#202923] border border-[#E3E9E4] hover:border-[#BCD7CA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative sm:w-80">
            <input
              type="text"
              placeholder="Search by title, description, or skill..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full text-xs pl-8 pr-8 py-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923] placeholder-[#68746D]/60 transition-standard"
            />
            <Search className="w-3.5 h-3.5 text-[#68746D] absolute left-2.5 top-2.5" />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-2.5 text-[#68746D] hover:text-[#202923]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <FilterSidebar 
            filters={filters} 
            setFilters={setFilters} 
            onReset={handleResetFilters} 
          />
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between pb-2">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E3E9E4] bg-white text-xs font-medium text-[#202923]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#176B52]" />
            Filters & Sorting
          </button>
          <span className="text-xs text-[#68746D] font-medium">
            {gigs.length} {gigs.length === 1 ? 'opportunity' : 'opportunities'}
          </span>
        </div>

        {/* Mobile Filter Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3E9E4] mb-4">
                <h3 className="font-semibold text-sm text-[#202923]">Filter Opportunities</h3>
                <button 
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-md text-[#68746D] hover:text-[#202923]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterSidebar 
                filters={filters} 
                setFilters={setFilters} 
                onReset={handleResetFilters} 
              />
              <div className="mt-4 pt-3 border-t border-[#E3E9E4]">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-2 rounded-md bg-[#176B52] text-white text-xs font-semibold"
                >
                  Apply Filters ({gigs.length} results)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings Content */}
        <div className="lg:col-span-3">
          {/* Status bar */}
          <div className="hidden lg:flex items-center justify-between mb-4 text-xs text-[#68746D]">
            <span>
              Showing <strong className="text-[#202923]">{gigs.length}</strong> {gigs.length === 1 ? 'opportunity' : 'opportunities'}
            </span>
            {(filters.search || filters.category !== 'all' || filters.type !== 'all' || filters.payment_type !== 'all' || filters.status !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-[#176B52] hover:text-[#10513F] font-medium transition-colors"
              >
                Clear all active filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#176B52] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-[#68746D] font-medium">Loading opportunities...</p>
            </div>
          ) : error ? (
            <div className="bg-[#FDF1F1] rounded-lg border border-[#B93838]/20 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-[#B93838] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#B93838] mb-1">Failed to load opportunities</h3>
              <p className="text-xs text-[#68746D] mb-4">{error}</p>
              <button
                onClick={fetchGigs}
                className="px-3 py-1.5 rounded-md bg-white border border-[#E3E9E4] text-xs font-medium text-[#202923] hover:bg-[#F8FAF8]"
              >
                Try Again
              </button>
            </div>
          ) : gigs.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EEF5F1] text-[#176B52] flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#202923] mb-1">No matching opportunities</h3>
              <p className="text-xs text-[#68746D] max-w-sm mx-auto mb-6">
                No gigs or skill swaps match your current filter criteria. Try adjusting your search keywords, category, or compensation filters.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-md bg-[#176B52] text-white text-xs font-medium hover:bg-[#10513F] transition-standard"
                >
                  Clear All Filters
                </button>
                <Link
                  to="/gigs/create"
                  className="px-4 py-2 rounded-md border border-[#E3E9E4] bg-white text-xs font-medium text-[#202923] hover:bg-[#F8FAF8] transition-standard"
                >
                  Post New Opportunity
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gigs.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
