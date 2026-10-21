import React from 'react';
import { Listing, Crop, Market, User, PriceRecord } from '../types';
import { formatPKR, formatDate } from '../lib/formatters';
import { calculateMarketPositionBadge } from '../lib/calculations';
import { MarketPositionBadge } from './MarketPositionBadge';
import { MapPin, User as UserIcon, Calendar, Edit2, Trash2, Phone } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  crop?: Crop;
  market?: Market;
  seller?: User;
  allPrices: PriceRecord[];
  currentUser: User;
  onViewDetails: (listing: Listing) => void;
  onEdit?: (listing: Listing) => void;
  onDelete?: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  crop,
  market,
  seller,
  allPrices,
  currentUser,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const isOwner = currentUser.role === 'farmer' && listing.sellerId === currentUser.id;

  const marketBadge = calculateMarketPositionBadge(
    listing.askingPricePerUnit,
    listing.cropId,
    allPrices
  );

  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'text-[#186F43] bg-[#EEF5EB]', text: 'Available', label: 'Available' },
    reserved: { bg: 'text-[#8A4C07] bg-[#FDF5E6]', text: 'Reserved', label: 'Reserved' },
    sold: { bg: 'text-[#767B70] bg-[#FAF9F5]', text: 'Sold Out', label: 'Sold' },
  };

  const statusInfo = statusStyles[listing.status] || statusStyles.available;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E7DF] hover:border-[#4A6B42] transition-all flex flex-col justify-between group">
      <div>
        {/* Header: Crop Symbol & Name & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl group-hover:scale-105 transition-transform shrink-0">
              {crop?.symbol || '🌾'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base text-[#2F332C] group-hover:text-[#4A6B42] transition-colors">
                  {crop?.name || 'Produce Listing'}
                </h4>
                <span className="text-xs text-[#767B70]">
                  {listing.grade}
                </span>
              </div>
              <p className="text-xs text-[#767B70]">
                Volume: <strong className="text-[#2F332C] font-semibold tabular-nums">{listing.quantity} {listing.unit}</strong>
              </p>
            </div>
          </div>

          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize shrink-0 ${statusInfo.bg}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Asking Price & Market Comparison */}
        <div className="pt-3 pb-3 border-y border-[#E8E7DF] my-3">
          <div className="text-[11px] text-[#767B70] mb-0.5">Asking Price</div>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="text-xl font-bold text-[#2D452B] tabular-nums">
              {formatPKR(listing.askingPricePerUnit)}
              <span className="text-xs font-normal text-[#767B70]"> / {listing.unit}</span>
            </div>
            <MarketPositionBadge
              position={marketBadge.position}
              label={marketBadge.label}
              percentDiff={marketBadge.percentDiff}
            />
          </div>
        </div>

        {/* Location & Seller info */}
        <div className="space-y-1.5 text-xs text-[#767B70] mb-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#4A6B42] shrink-0" />
            <span className="truncate">
              {listing.district} · Near {market?.name || 'Sindh Mandi'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-[#4A6B42] shrink-0" />
            <span className="truncate">
              Farmer: <strong className="text-[#2F332C] font-semibold">{seller?.displayName || 'Demo Farmer'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#8B9185] shrink-0" />
            <span>Listed {formatDate(listing.createdAt)}</span>
          </div>
        </div>

        {listing.description && (
          <p className="text-xs text-[#666B60] p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E8E7DF] line-clamp-2 mb-4 leading-relaxed">
            "{listing.description}"
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#E8E7DF] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(listing)}
          className="flex-1 bg-[#EEF2E8] hover:bg-[#E3EAD9] text-[#2D452B] py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
        >
          <Phone className="w-3.5 h-3.5 text-[#4A6B42]" />
          <span>View Produce & Contact</span>
        </button>

        {isOwner && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(listing)}
                className="p-2 text-[#4A6B42] hover:bg-[#EEF2E8] rounded-xl border border-[#E8E7DF] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Edit this listing"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(listing)}
                className="p-2 text-[#B3261E] hover:bg-[#FDE8E8] rounded-xl border border-[#E8E7DF] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Delete this listing"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
