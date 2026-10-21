import React, { useState } from 'react';
import { Listing, Crop, Market, User, PriceRecord } from '../types';
import { ListingCard } from '../components/ListingCard';
import { ListingDetailModal } from '../components/ListingDetailModal';
import { ListingFormModal } from '../components/ListingFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Search, Plus, RotateCcw } from 'lucide-react';

interface MarketplacePageProps {
  listings: Listing[];
  crops: Crop[];
  markets: Market[];
  users: User[];
  allPrices: PriceRecord[];
  currentUser: User;
  onCreateListing: (listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateListing: (id: string, updates: Partial<Omit<Listing, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteListing: (id: string) => Promise<void>;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  listings,
  crops,
  markets,
  users,
  allPrices,
  currentUser,
  onCreateListing,
  onUpdateListing,
  onDeleteListing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropId, setSelectedCropId] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Modals state
  const [viewListing, setViewListing] = useState<Listing | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);

  const isFarmer = currentUser.role === 'farmer';

  // Distinct districts from listings and markets
  const allDistricts = Array.from(
    new Set([...markets.map((m) => m.district), ...listings.map((l) => l.district)])
  );

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const crop = crops.find((c) => c.id === item.cropId);
    const seller = users.find((u) => u.id === item.sellerId);

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = crop?.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchDistrict = item.district.toLowerCase().includes(q);
      const matchSeller = seller?.displayName.toLowerCase().includes(q);
      const matchGrade = item.grade.toLowerCase().includes(q);

      if (!matchName && !matchDesc && !matchDistrict && !matchSeller && !matchGrade) {
        return false;
      }
    }

    if (selectedCropId !== 'all' && item.cropId !== selectedCropId) return false;
    if (selectedDistrict !== 'all' && item.district !== selectedDistrict) return false;
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

    if (minPrice !== '' && !isNaN(Number(minPrice)) && item.askingPricePerUnit < Number(minPrice)) {
      return false;
    }
    if (maxPrice !== '' && !isNaN(Number(maxPrice)) && item.askingPricePerUnit > Number(maxPrice)) {
      return false;
    }

    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCropId('all');
    setSelectedDistrict('all');
    setSelectedStatus('all');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCropId !== 'all' ||
    selectedDistrict !== 'all' ||
    selectedStatus !== 'all' ||
    minPrice !== '' ||
    maxPrice !== '';

  const handleFormSubmit = async (
    data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingListing) {
      await onUpdateListing(editingListing.id, data);
    } else {
      await onCreateListing(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingListing) {
      await onDeleteListing(deletingListing.id);
      setDeletingListing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8E7DF]">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D452B]">
              Sindh Produce Marketplace
            </h2>
            <p className="text-xs text-[#767B70] mt-0.5">
              Verified demo farm produce lots directly available from Sindh growers
            </p>
          </div>

          {isFarmer && (
            <button
              type="button"
              onClick={() => {
                setEditingListing(null);
                setIsFormOpen(true);
              }}
              className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>List Your Produce</span>
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3 pt-4 border-t border-[#E8E7DF]">
          {/* Top Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#767B70] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce variety, district, or farmer name..."
              className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#4A6B42]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-[#767B70] text-xs hover:text-[#2F332C]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter dropdowns row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#767B70] mb-1">
                Crop
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2.5 py-1.5 text-xs text-[#2F332C] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                <option value="all">All Crops</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#767B70] mb-1">
                District Location
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2.5 py-1.5 text-xs text-[#2F332C] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                <option value="all">All Districts</option>
                {allDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#767B70] mb-1">
                Availability Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2.5 py-1.5 text-xs text-[#2F332C] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="sold">Sold Out</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#767B70] mb-1">
                Price Range (PKR / 40kg)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2 py-1.5 text-xs text-[#2F332C] tabular-nums focus:outline-none focus:border-[#4A6B42]"
                />
                <span className="text-[#767B70] text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2 py-1.5 text-xs text-[#2F332C] tabular-nums focus:outline-none focus:border-[#4A6B42]"
                />
              </div>
            </div>
          </div>

          {/* Active filters summary & reset */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-[#767B70]">
              Showing <strong className="text-[#2F332C] tabular-nums">{filteredListings.length}</strong> produce listings
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[#B3261E] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Produce Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E8E7DF] text-center max-w-md mx-auto">
          <span className="text-3xl block mb-2">🌾</span>
          <h4 className="font-bold text-base text-[#2D452B] mb-1">
            No Produce Listings Found
          </h4>
          <p className="text-xs text-[#767B70] mb-5">
            No listings match your selected crop, district, or price criteria.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="bg-[#2D452B] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#4A6B42] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => {
            const crop = crops.find((c) => c.id === listing.cropId);
            const market = markets.find((m) => m.id === listing.marketId);
            const seller = users.find((u) => u.id === listing.sellerId);

            return (
              <ListingCard
                key={listing.id}
                listing={listing}
                crop={crop}
                market={market}
                seller={seller}
                allPrices={allPrices}
                currentUser={currentUser}
                onViewDetails={(l) => setViewListing(l)}
                onEdit={(l) => {
                  setEditingListing(l);
                  setIsFormOpen(true);
                }}
                onDelete={(l) => setDeletingListing(l)}
              />
            );
          })}
        </div>
      )}

      {/* Listing Detail Modal */}
      <ListingDetailModal
        isOpen={Boolean(viewListing)}
        onClose={() => setViewListing(null)}
        listing={viewListing}
        crop={crops.find((c) => c.id === viewListing?.cropId)}
        market={markets.find((m) => m.id === viewListing?.marketId)}
        seller={users.find((u) => u.id === viewListing?.sellerId)}
        allPrices={allPrices}
      />

      {/* Add / Edit Listing Form Modal */}
      <ListingFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingListing(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingListing}
        crops={crops}
        markets={markets}
        currentUser={currentUser}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingListing)}
        title="Delete Produce Listing"
        message="Are you sure you want to remove this produce listing? This action will remove it from the public Sindh produce marketplace."
        confirmLabel="Yes, Delete Listing"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingListing(null)}
      />
    </div>
  );
};
