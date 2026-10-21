// client/src/components/FilterSidebar.jsx
import React from 'react';
import { Search, Filter, X, ArrowDownUp, DollarSign } from 'lucide-react';

export default function FilterSidebar({ filters, setFilters, onReset }) {
  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Programming', value: 'Programming' },
    { label: 'Design', value: 'Design' },
    { label: 'Writing', value: 'Writing' },
    { label: 'Tutoring', value: 'Tutoring' }
  ];

  const types = [
    { label: 'All', value: 'all' },
    { label: 'Offering', value: 'Offering' },
    { label: 'Requesting', value: 'Requesting' }
  ];

  const paymentTypes = [
    { label: 'All Models', value: 'all' },
    { label: 'Paid', value: 'Paid' },
    { label: 'SkillSwap', value: 'SkillSwap' },
    { label: 'Free / Volunteer', value: 'Free' }
  ];

  const statuses = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Expired', value: 'Expired' }
  ];

  const sortOptions = [
    { label: 'Latest Posted', value: 'latest' },
    { label: 'Approaching Deadline', value: 'deadline' },
    { label: 'Highest Budget', value: 'budget_desc' },
    { label: 'Lowest Budget', value: 'budget_asc' }
  ];

  const handleChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const hasActiveFilters = 
    Boolean(filters.search) || 
    (filters.category && filters.category !== 'all') ||
    (filters.type && filters.type !== 'all') ||
    (filters.payment_type && filters.payment_type !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    Boolean(filters.min_budget) ||
    Boolean(filters.max_budget);

  return (
    <aside className="bg-white rounded-lg border border-[#E3E9E4] p-4 sm:p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E3E9E4]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#176B52]" />
          <h2 className="text-xs font-semibold text-[#202923] uppercase tracking-wider">Filter Opportunities</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-[#176B52] hover:text-[#10513F] font-medium flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5">Keywords & Skills</label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. React, Python, UI..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-[#E3E9E4] bg-[#F8FAF8] text-[#202923] placeholder-[#68746D]/60 transition-standard"
          />
          <Search className="w-3.5 h-3.5 text-[#68746D] absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Opportunity Type (Offering vs Requesting) */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5">Opportunity Type</label>
        <div className="grid grid-cols-3 gap-1 bg-[#F8FAF8] p-1 rounded-md border border-[#E3E9E4]">
          {types.map(t => (
            <button
              key={t.value}
              onClick={() => handleChange('type', t.value)}
              className={`text-xs py-1 rounded font-medium transition-standard text-center ${
                (filters.type || 'all') === t.value
                  ? 'bg-white text-[#176B52] font-semibold shadow-xs border border-[#E3E9E4]'
                  : 'text-[#68746D] hover:text-[#202923]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5">Category</label>
        <div className="space-y-1">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => handleChange('category', cat.value)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-standard flex items-center justify-between ${
                (filters.category || 'all') === cat.value
                  ? 'bg-[#EEF5F1] text-[#176B52] font-medium border border-[#DCEBE3]'
                  : 'text-[#68746D] hover:bg-[#F8FAF8]'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compensation Model */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5">Compensation Model</label>
        <div className="space-y-1">
          {paymentTypes.map(pt => (
            <button
              key={pt.value}
              onClick={() => handleChange('payment_type', pt.value)}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-standard flex items-center justify-between ${
                (filters.payment_type || 'all') === pt.value
                  ? 'bg-[#EEF5F1] text-[#176B52] font-medium border border-[#DCEBE3]'
                  : 'text-[#68746D] hover:bg-[#F8FAF8]'
              }`}
            >
              <span>{pt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5 flex items-center gap-1">
          <ArrowDownUp className="w-3.5 h-3.5 text-[#68746D]" />
          Sort Order
        </label>
        <select
          value={filters.sort || 'latest'}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] transition-standard"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5">Status</label>
        <select
          value={filters.status || 'all'}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full text-xs px-2.5 py-1.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923] transition-standard"
        >
          {statuses.map(st => (
            <option key={st.value} value={st.value}>{st.label}</option>
          ))}
        </select>
      </div>

      {/* Budget Range (for Paid gigs) */}
      <div>
        <label className="block text-xs font-medium text-[#202923] mb-1.5 flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-[#68746D]" />
          Budget Range ($)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            min="0"
            value={filters.min_budget || ''}
            onChange={(e) => handleChange('min_budget', e.target.value)}
            className="w-1/2 text-xs px-2.5 py-1.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
          />
          <span className="text-[#68746D] text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            min="0"
            value={filters.max_budget || ''}
            onChange={(e) => handleChange('max_budget', e.target.value)}
            className="w-1/2 text-xs px-2.5 py-1.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
          />
        </div>
      </div>
    </aside>
  );
}
