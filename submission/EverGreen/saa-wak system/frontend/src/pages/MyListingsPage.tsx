import React, { useState } from 'react';
import { Listing, Crop, Market, User, PriceRecord } from '../types';
import { formatPKR, formatDate } from '../lib/formatters';
import { calculateMarketPositionBadge } from '../lib/calculations';
import { MarketPositionBadge } from '../components/MarketPositionBadge';
import { ListingFormModal } from '../components/ListingFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

interface MyListingsPageProps {
  listings: Listing[];
  crops: Crop[];
  markets: Market[];
  currentUser: User;
  allPrices: PriceRecord[];
  onCreateListing: (listingData: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateListing: (id: string, updates: Partial<Omit<Listing, 'id' | 'createdAt'>>) => Promise<void>;
  onDeleteListing: (id: string) => Promise<void>;
}

export const MyListingsPage: React.FC<MyListingsPageProps> = ({
  listings,
  crops,
  markets,
  currentUser,
  allPrices,
  onCreateListing,
  onUpdateListing,
  onDeleteListing,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);

  // Filter listings owned by this farmer
  const myListings = listings.filter((l) => l.sellerId === currentUser.id);

  const availableCount = myListings.filter((l) => l.status === 'available').length;
  const reservedCount = myListings.filter((l) => l.status === 'reserved').length;
  const soldCount = myListings.filter((l) => l.status === 'sold').length;

  const handleStatusChange = async (listingId: string, newStatus: 'available' | 'reserved' | 'sold') => {
    await onUpdateListing(listingId, { status: newStatus });
  };

  const handleFormSubmit = async (data: Omit<Listing, 'id' | 'createdAt' | 'updatedAt'>) => {
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
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D452B]">
              My Produce Batches
            </h2>
            <p className="text-xs text-[#767B70] mt-0.5">
              Manage your agricultural lots, update reservation statuses, and adjust asking prices
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingListing(null);
              setIsFormOpen(true);
            }}
            className="bg-[#2D452B] hover:bg-[#4A6B42] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Produce</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-[#E8E7DF]">
          <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
            <div className="text-[11px] text-[#767B70]">Available for Sale</div>
            <div className="text-xl font-bold text-[#186F43] mt-0.5 tabular-nums">{availableCount}</div>
          </div>
          <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
            <div className="text-[11px] text-[#767B70]">Reserved / Under Offer</div>
            <div className="text-xl font-bold text-[#8A4C07] mt-0.5 tabular-nums">{reservedCount}</div>
          </div>
          <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E8E7DF]">
            <div className="text-[11px] text-[#767B70]">Sold Out</div>
            <div className="text-xl font-bold text-[#767B70] mt-0.5 tabular-nums">{soldCount}</div>
          </div>
        </div>
      </div>

      {/* Listings List */}
      {myListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#E8E7DF] text-center max-w-md mx-auto">
          <span className="text-3xl block mb-2">🌾</span>
          <h4 className="font-bold text-base text-[#2D452B] mb-1">
            No Active Produce Batches
          </h4>
          <p className="text-xs text-[#767B70] mb-5">
            Post your harvested wheat, rice, onions, or chillies to make them discoverable to buyers across Sindh.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingListing(null);
              setIsFormOpen(true);
            }}
            className="bg-[#2D452B] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#4A6B42] transition-colors cursor-pointer"
          >
            Post Produce Now
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {myListings.map((listing) => {
            const crop = crops.find((c) => c.id === listing.cropId);
            const market = markets.find((m) => m.id === listing.marketId);
            const marketBadge = calculateMarketPositionBadge(
              listing.askingPricePerUnit,
              listing.cropId,
              allPrices
            );

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl p-5 border border-[#E8E7DF] hover:border-[#4A6B42] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Identity & Info */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <span className="text-2xl shrink-0">
                    {crop?.symbol || '🌾'}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-[#2F332C]">
                        {crop?.name || 'Produce Listing'}
                      </h4>
                      <span className="text-xs text-[#767B70]">
                        · {listing.grade}
                      </span>
                      <MarketPositionBadge
                        position={marketBadge.position}
                        label={marketBadge.label}
                        percentDiff={marketBadge.percentDiff}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#767B70] mt-1">
                      <span>Volume: <strong className="text-[#2F332C] tabular-nums font-semibold">{listing.quantity} {listing.unit}</strong></span>
                      <span className="text-[#C5C4BA]" aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#4A6B42]" />
                        {listing.district} ({market?.name})
                      </span>
                      <span className="text-[#C5C4BA]" aria-hidden="true">·</span>
                      <span>Listed {formatDate(listing.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Asking Price */}
                <div className="md:text-right shrink-0">
                  <div className="text-[11px] text-[#767B70]">Asking Price</div>
                  <div className="text-lg font-bold text-[#2D452B] tabular-nums">
                    {formatPKR(listing.askingPricePerUnit)}
                    <span className="text-xs font-normal text-[#767B70]"> / {listing.unit}</span>
                  </div>
                </div>

                {/* Right: Status Switcher & Edit / Delete Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#E8E7DF] shrink-0">
                  <select
                    value={listing.status}
                    onChange={(e) => handleStatusChange(listing.id, e.target.value as any)}
                    className="bg-[#FAF9F5] border border-[#E8E7DF] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2F332C] focus:outline-none focus:border-[#4A6B42] cursor-pointer"
                  >
                    <option value="available">Status: Available</option>
                    <option value="reserved">Status: Reserved</option>
                    <option value="sold">Status: Sold</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingListing(listing);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-[#4A6B42] hover:bg-[#EEF2E8] rounded-xl border border-[#E8E7DF] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Edit listing"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingListing(listing)}
                    className="p-2 text-[#B3261E] hover:bg-[#FDE8E8] rounded-xl border border-[#E8E7DF] transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingListing)}
        title="Delete Produce Listing"
        message="Are you sure you want to delete this produce listing?"
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingListing(null)}
      />
    </div>
  );
};
