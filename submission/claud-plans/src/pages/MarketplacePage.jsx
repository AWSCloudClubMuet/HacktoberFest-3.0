import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getListings, getCrops, getPrices, getUsers, updateListing, deleteListing } from '../api.js';
import { marketLabel, validateOwnership } from '../logic.js';
import { useAuth } from '../context/AuthContext';
import { SINDH_DISTRICTS } from '../utils/sindhLocations';
import {
  Search,
  Filter,
  Phone,
  MessageSquare,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  ArrowUpDown,
  ShoppingBag,
  MapPin,
  Calendar
} from 'lucide-react';

export const MarketplacePage = () => {
  const { currentUser, isFarmer } = useAuth();

  const [listings, setListings] = useState([]);
  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc'

  // Details Modal
  const [activeModalListing, setActiveModalListing] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allListings, allCrops, allPrices, allUsers] = await Promise.all([
        getListings(),
        getCrops(),
        getPrices(),
        getUsers()
      ]);
      setListings(allListings || []);
      setCrops(allCrops || []);
      setPrices(allPrices || []);
      setUsers(allUsers || []);
    } catch (err) {
      console.error('Failed to load marketplace:', err);
      setError(err.message || 'Failed to load marketplace data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine latest date in prices ("Today")
  const todayDate = useMemo(() => {
    return prices.reduce((max, p) => (p.date > max ? p.date : max), prices[0]?.date || '');
  }, [prices]);

  // Compute market average for each crop across all markets on todayDate
  const cropAverages = useMemo(() => {
    if (!todayDate) return new Map();
    const map = new Map();
    for (const crop of crops) {
      const todayRecords = prices.filter(
        (p) => p.crop_id === crop.id && p.date === todayDate
      );
      if (todayRecords.length > 0) {
        const sum = todayRecords.reduce((acc, r) => acc + Number(r.price), 0);
        map.set(crop.id, Math.round(sum / todayRecords.length));
      } else {
        map.set(crop.id, 0);
      }
    }
    return map;
  }, [crops, prices, todayDate]);

  // Format Pakistani phone to WhatsApp wa.me/92XXXXXXXXXX (convert leading 0 to 92)
  const formatWhatsAppUrl = (phone, cropName, price) => {
    if (!phone) return '#';
    const digits = String(phone).replace(/\D/g, '');
    const waNumber = digits.startsWith('0')
      ? '92' + digits.slice(1)
      : digits.startsWith('92')
      ? digits
      : '92' + digits;
    const text = encodeURIComponent(
      `Assalam-o-Alaikum, I am contacting you regarding your ${cropName} listed on KisanMandi at Rs. ${price}.`
    );
    return `https://wa.me/${waNumber}?text=${text}`;
  };

  const formatTelLink = (phone) => {
    if (!phone) return '#';
    return `tel:${String(phone).replace(/\s+/g, '')}`;
  };

  // 1. Show only listings with status Active (Sold listings are hidden)
  const activeListings = useMemo(() => {
    return listings.filter((l) => l.status === 'Active');
  }, [listings]);

  // 2. Filter by search, crop, district, grade
  const filteredListings = useMemo(() => {
    return activeListings.filter((listing) => {
      const crop = crops.find((c) => c.id === listing.crop_id);
      const cropName = crop?.name || '';

      // Search by crop name
      const query = searchQuery.trim().toLowerCase();
      if (query && !cropName.toLowerCase().includes(query)) {
        return false;
      }

      // Filter by crop
      if (selectedCropId !== 'All' && listing.crop_id !== selectedCropId) {
        return false;
      }

      // Filter by district
      if (selectedDistrict !== 'All' && listing.district !== selectedDistrict) {
        return false;
      }

      // Filter by grade
      if (selectedGrade !== 'All' && listing.grade !== selectedGrade) {
        return false;
      }

      return true;
    });
  }, [activeListings, crops, searchQuery, selectedCropId, selectedDistrict, selectedGrade]);

  // 3. Sort: Newest (id descending) or Price low to high
  const sortedListings = useMemo(() => {
    const list = [...filteredListings];
    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.asking_price) - Number(b.asking_price));
    } else {
      // Newest: id descending
      list.sort((a, b) => {
        const idA = String(a.id || '');
        const idB = String(b.id || '');
        return idB.localeCompare(idA);
      });
    }
    return list;
  }, [filteredListings, sortBy]);

  // Actions for owner listings only
  const handleMarkSold = async (listingId) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!validateOwnership(listing, currentUser?.id)) {
      alert('Unauthorized');
      return;
    }
    try {
      await updateListing(listingId, { status: 'Sold' });
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status: 'Sold' } : l)));
      if (activeModalListing?.id === listingId) {
        setActiveModalListing(null);
      }
    } catch (err) {
      alert(`Failed to mark sold: ${err.message}`);
    }
  };

  const handleDeleteListing = async (listingId) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!validateOwnership(listing, currentUser?.id)) {
      alert('Unauthorized');
      return;
    }
    if (!window.confirm('Delete this listing?')) return;
    try {
      await deleteListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      if (activeModalListing?.id === listingId) {
        setActiveModalListing(null);
      }
    } catch (err) {
      alert(`Failed to delete listing: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Marketplace</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {sortedListings.length} Active Batches
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Browse verified farm produce with fair market rate valuation labels
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          id="marketplace-search-input"
          placeholder="Search crop name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-earth-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Filters & Sort Controls Bar */}
      <div className="bg-white rounded-2xl border border-earth-300 p-3 shadow-sm space-y-2.5 text-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Crop Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Crop
            </label>
            <select
              id="filter-crop-select"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-earth-300 bg-white font-semibold text-slate-700 text-xs"
            >
              <option value="All">All Crops</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              District
            </label>
            <select
              id="filter-district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-earth-300 bg-white font-semibold text-slate-700 text-xs"
            >
              <option value="All">All Districts</option>
              {SINDH_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Grade
            </label>
            <select
              id="filter-grade-select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-earth-300 bg-white font-semibold text-slate-700 text-xs"
            >
              <option value="All">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </div>
        </div>

        {/* Sort Options: Newest and Price low to high */}
        <div className="flex items-center justify-between pt-2 border-t border-earth-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" /> Sort By:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="sort-newest-btn"
              onClick={() => setSortBy('newest')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                sortBy === 'newest'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-earth-100 text-slate-600 hover:bg-earth-200'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              id="sort-price-btn"
              onClick={() => setSortBy('price_asc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                sortBy === 'price_asc'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-earth-100 text-slate-600 hover:bg-earth-200'
              }`}
            >
              Price: Low to High
            </button>
          </div>
        </div>
      </div>

      {/* Listings List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : sortedListings.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-500">
          <p className="font-bold text-slate-700">No active produce listings match your criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCropId('All');
              setSelectedDistrict('All');
              setSelectedGrade('All');
            }}
            className="text-emerald-700 font-bold underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedListings.map((listing) => {
            const crop = crops.find((c) => c.id === listing.crop_id);
            const user = users.find((u) => u.id === listing.user_id);
            const cropAvg = cropAverages.get(listing.crop_id) || 0;
            const label = marketLabel(listing.asking_price, cropAvg);
            const isOwner = currentUser?.id === listing.user_id;

            return (
              <div
                key={listing.id}
                id={`marketplace-card-${listing.id}`}
                onClick={() => setActiveModalListing(listing)}
                className="p-3.5 bg-white rounded-2xl border border-earth-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer space-y-2"
              >
                {/* Header row: Crop, Grade & Market Label */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-slate-900 text-sm">
                        {crop?.name || 'Produce'}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Grade {listing.grade}
                      </span>
                      {/* Price Label Badge */}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          label === 'At market'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : label === 'Below market'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {label}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {listing.district} • {listing.quantity} units (40 kg)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-emerald-900 leading-tight">
                      Rs. {Number(listing.asking_price).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">per 40 kg</div>
                  </div>
                </div>

                {/* Farmer / seller note & Available date */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-earth-100">
                  <span className="truncate max-w-[160px]">
                    Grower: <strong className="text-slate-700">{user?.name || 'Farmer'}</strong>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Avail: {listing.available_from}
                  </span>
                </div>

                {/* Owner controls row (Farmer owner only, never buyer) */}
                {isOwner && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between pt-2 border-t border-earth-200 text-xs"
                  >
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Your Listing
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMarkSold(listing.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        Mark Sold
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(listing.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Listing Details Modal (With Call & WhatsApp buttons) */}
      {activeModalListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-3xl p-5 shadow-2xl border border-earth-300 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Produce Details</h2>
                <p className="text-[11px] text-slate-500">
                  Connect directly with the grower to arrange deal
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalListing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-earth-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Produce Information Card */}
            {(() => {
              const crop = crops.find((c) => c.id === activeModalListing.crop_id);
              const user = users.find((u) => u.id === activeModalListing.user_id);
              const cropAvg = cropAverages.get(activeModalListing.crop_id) || 0;
              const label = marketLabel(activeModalListing.asking_price, cropAvg);
              const isOwner = currentUser?.id === activeModalListing.user_id;
              const phone = activeModalListing.phone || user?.phone || '0300-1234501';

              return (
                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-earth-50 border border-earth-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-slate-900">
                        {crop?.name}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          label === 'At market'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : label === 'Below market'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Asking Rate
                        </span>
                        <span className="font-black text-emerald-900 text-sm">
                          Rs. {Number(activeModalListing.asking_price).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Offered Quantity
                        </span>
                        <span className="font-bold text-slate-800">
                          {activeModalListing.quantity} units (40 kg)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-earth-200/80">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Quality Grade
                        </span>
                        <span className="font-bold text-slate-800">
                          Grade {activeModalListing.grade}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Available From
                        </span>
                        <span className="font-bold text-slate-800">
                          {activeModalListing.available_from}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seller Contact Info */}
                  <div className="p-3 rounded-2xl bg-white border border-earth-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Seller / Hari:</span>
                      <span className="font-bold text-slate-900">{user?.name || 'Farmer'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">District:</span>
                      <span className="font-semibold text-slate-700">
                        {activeModalListing.district}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-bold text-emerald-800">{phone}</span>
                    </div>
                  </div>

                  {/* Direct Connect Buttons: Call & WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={formatTelLink(phone)}
                      id="contact-call-btn"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow transition-colors text-xs"
                    >
                      <Phone className="w-4 h-4" /> Call Farmer
                    </a>
                    <a
                      href={formatWhatsAppUrl(phone, crop?.name, activeModalListing.asking_price)}
                      id="contact-whatsapp-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow transition-colors text-xs"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </a>
                  </div>

                  {/* Owner Controls in Modal (Only if owner) */}
                  {isOwner && (
                    <div className="flex items-center justify-between pt-2 border-t border-earth-200">
                      <button
                        type="button"
                        onClick={() => handleMarkSold(activeModalListing.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Sold
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(activeModalListing.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
