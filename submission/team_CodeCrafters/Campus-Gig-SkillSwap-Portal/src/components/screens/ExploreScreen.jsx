import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { GigCard } from '../cards/GigCard';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  RotateCcw,
  X,
  ChevronDown
} from 'lucide-react';

export function ExploreScreen() {
  const { gigs, globalSearch, setGlobalSearch, setCurrentScreen, isGigExpired, isLoading } = useApp();

  // Filter States
  const [category, setCategory] = useState('All');
  const [type, setType] = useState('All');
  const [paymentType, setPaymentType] = useState('All');
  const [budgetRange, setBudgetRange] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Clear all filters
  const resetFilters = () => {
    setCategory('All');
    setType('All');
    setPaymentType('All');
    setBudgetRange('All');
    setStatusFilter('All');
    setSortBy('newest');
    setGlobalSearch('');
  };

  // Filter & Sort Logic
  const filteredGigs = useMemo(() => {
    return gigs.filter(gig => {
      // Global Search
      if (globalSearch.trim()) {
        const query = globalSearch.toLowerCase();
        const matchesTitle = gig.title.toLowerCase().includes(query);
        const matchesDesc = gig.description.toLowerCase().includes(query);
        const matchesCat = gig.category.toLowerCase().includes(query);
        const matchesPoster = gig.poster_name.toLowerCase().includes(query);
        const matchesSkills = (gig.skills_required || []).some(s => s.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesPoster && !matchesSkills) {
          return false;
        }
      }

      // Category
      if (category !== 'All' && gig.category !== category) return false;

      // Type
      if (type !== 'All' && gig.type !== type) return false;

      // Payment Type
      if (paymentType !== 'All' && gig.payment_type !== paymentType) return false;

      // Budget Range
      if (budgetRange !== 'All') {
        const b = gig.budget || 0;
        if (budgetRange === 'under1000' && (b >= 1000 || gig.payment_type !== 'Paid')) return false;
        if (budgetRange === '1000to2000' && (b < 1000 || b > 2000 || gig.payment_type !== 'Paid')) return false;
        if (budgetRange === '2000plus' && (b <= 2000 || gig.payment_type !== 'Paid')) return false;
      }

      // Status
      if (statusFilter !== 'All') {
        if (statusFilter === 'Open' && (gig.status !== 'Open' || isGigExpired(gig))) return false;
        if (statusFilter === 'Expired' && !isGigExpired(gig)) return false;
        if (statusFilter === 'In Progress' && gig.status !== 'In Progress') return false;
        if (statusFilter === 'Completed' && gig.status !== 'Completed') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'budget-high') {
        return (b.budget || 0) - (a.budget || 0);
      }
      if (sortBy === 'budget-low') {
        return (a.budget || 0) - (b.budget || 0);
      }
      if (sortBy === 'deadline') {
        return new Date(a.deadline || '2099-01-01') - new Date(b.deadline || '2099-01-01');
      }
      return 0;
    });
  }, [gigs, globalSearch, category, type, paymentType, budgetRange, statusFilter, sortBy, isGigExpired]);

  const activeFilterCount = [
    category !== 'All',
    type !== 'All',
    paymentType !== 'All',
    budgetRange !== 'All',
    statusFilter !== 'All',
    globalSearch.trim() !== ''
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Explore Campus Gigs
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Discover peer projects, freelance opportunities, and skill swaps
          </p>
        </div>

        <button
          onClick={() => setCurrentScreen('create-gig')}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
        >
          + Post an Opportunity
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] p-4 shadow-subtle space-y-3 transition-colors duration-200">
        
        {/* Search input in explore */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search by keywords, titles, skills, e.g. React, Python, Logo, Proofreading..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[var(--bg-input)] border border-[var(--border-color)] focus:bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline)]/30 focus:border-[var(--primary-emerald)] text-[var(--text-primary)] transition-all placeholder:text-[var(--text-muted)]"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Select */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
                <option value="Tutoring">Tutoring</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Type Select */}
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Offering">Offering</option>
                <option value="Requesting">Requesting</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Payment Type */}
            <div className="relative">
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] cursor-pointer"
              >
                <option value="All">All Payment Types</option>
                <option value="Paid">Paid</option>
                <option value="Skill Swap">Skill Swap</option>
                <option value="Free">Free</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Budget Range */}
            <div className="relative">
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] cursor-pointer"
              >
                <option value="All">Budget Range</option>
                <option value="under1000">Under ₹1,000</option>
                <option value="1000to2000">₹1,000 - ₹2,000</option>
                <option value="2000plus">₹2,000+</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-emerald)] cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Open">Status: Open</option>
                <option value="In Progress">Status: In Progress</option>
                <option value="Completed">Status: Completed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({activeFilterCount})</span>
              </button>
            )}

          </div>

          {/* Sort By on the right */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Sort:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
                <option value="deadline">Deadline: Soonest</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

      </div>

      {/* Results Count & Active Pills */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1">
        <div>
          Showing <span className="font-bold text-[var(--text-primary)]">{filteredGigs.length}</span> {filteredGigs.length === 1 ? 'opportunity' : 'opportunities'}
          {activeFilterCount > 0 && ` (filtered)`}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs font-semibold text-[var(--primary-emerald)] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Gigs Card Grid (Fluid multi-column responsive) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] overflow-hidden animate-pulse flex flex-col h-[380px]">
              <div className="h-44 w-full bg-[var(--bg-surface-secondary)]" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--bg-surface-secondary)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-surface-secondary)] rounded w-full" />
                  <div className="h-3 bg-[var(--bg-surface-secondary)] rounded w-5/6" />
                </div>
                <div className="h-8 bg-[var(--bg-surface-secondary)] rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredGigs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredGigs.map(gig => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No opportunities match your criteria"
          description="Try broadening your category or budget filters, or search for another skill or keyword."
          actionText="Reset All Filters"
          onAction={resetFilters}
          secondaryActionText="Post an Opportunity"
          onSecondaryAction={() => setCurrentScreen('create-gig')}
        />
      )}

    </div>
  );
}
