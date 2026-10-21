import React, { useState } from 'react';
import { Listing, Crop, Market, User, PriceRecord } from '../types';
import { formatPKR, formatDate } from '../lib/formatters';
import { calculateMarketPositionBadge } from '../lib/calculations';
import { MarketPositionBadge } from './MarketPositionBadge';
import { MapPin, User as UserIcon, Calendar, Phone, Copy, Check, Info } from 'lucide-react';

interface ListingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing | null;
  crop?: Crop;
  market?: Market;
  seller?: User;
  allPrices: PriceRecord[];
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  isOpen,
  onClose,
  listing,
  crop,
  market,
  seller,
  allPrices,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !listing) return null;

  const marketBadge = calculateMarketPositionBadge(
    listing.askingPricePerUnit,
    listing.cropId,
    allPrices
  );

  const contactPhone = seller?.phone || '0300-1234001';

  const handleCopyContact = () => {
    navigator.clipboard.writeText(contactPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#E8E7DF] relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#767B70] hover:text-[#2F332C] text-sm p-1 cursor-pointer"
        >
          ✕
        </button>

        {/* Top identity */}
        <div className="flex items-center gap-3.5 mb-5">
          <span className="text-3xl shrink-0">
            {crop?.symbol || '🌾'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#2D452B]">
                {crop?.name || 'Produce Listing'}
              </h3>
              <span className="text-xs text-[#767B70] bg-[#FAF9F5] border border-[#E8E7DF] px-2 py-0.5 rounded">
                {listing.grade}
              </span>
            </div>
            <p className="text-xs text-[#767B70]">
              Posted on {formatDate(listing.createdAt)}
            </p>
          </div>
        </div>

        {/* Price & Quantity highlight */}
        <div className="bg-[#FAF9F5] rounded-xl p-4 border border-[#E8E7DF] mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[11px] text-[#767B70]">Asking Price</div>
              <div className="text-2xl font-bold text-[#2D452B] tabular-nums">
                {formatPKR(listing.askingPricePerUnit)}
                <span className="text-xs font-normal text-[#767B70]"> / {listing.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#767B70]">Lot Volume</div>
              <div className="text-base font-bold text-[#2F332C] tabular-nums">
                {listing.quantity} {listing.unit}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E7DF] flex items-center justify-between">
            <span className="text-xs text-[#767B70]">Market Position:</span>
            <MarketPositionBadge
              position={marketBadge.position}
              label={marketBadge.label}
              percentDiff={marketBadge.percentDiff}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <h4 className="text-[11px] font-bold text-[#767B70] uppercase tracking-wider mb-1.5">
            Harvest Notes & Description
          </h4>
          <p className="text-xs text-[#2F332C] bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E7DF] leading-relaxed">
            {listing.description || 'No additional grower notes provided for this batch.'}
          </p>
        </div>

        {/* Location & Seller info */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3 rounded-xl border border-[#E8E7DF] bg-[#FAF9F5]">
            <div className="text-[11px] text-[#767B70] flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#4A6B42]" />
              Pickup Location
            </div>
            <div className="font-semibold text-[#2F332C]">
              {listing.district} District
            </div>
            <div className="text-[11px] text-[#767B70]">
              Near {market?.name || 'Sindh Mandi'}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[#E8E7DF] bg-[#FAF9F5]">
            <div className="text-[11px] text-[#767B70] flex items-center gap-1 mb-1">
              <UserIcon className="w-3.5 h-3.5 text-[#4A6B42]" />
              Seller
            </div>
            <div className="font-semibold text-[#2F332C]">
              {seller?.displayName || 'Demo Farmer'}
            </div>
            <div className="text-[11px] text-[#767B70]">
              Verified Demo Identity
            </div>
          </div>
        </div>

        {/* Demo Contact Box */}
        <div className="p-4 bg-[#EEF2E8] rounded-xl border border-[#DCE8D3] mb-5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div>
              <div className="font-semibold text-xs text-[#2D452B] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#4A6B42]" />
                Direct Farmer Contact (Demo)
              </div>
              <div className="text-xs text-[#767B70] mt-0.5">
                Phone: <span className="font-mono font-medium text-[#2F332C] tabular-nums">{contactPhone}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyContact}
              className="bg-white hover:bg-[#FAF9F5] border border-[#DCE8D3] text-[#2D452B] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#186F43]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-[#4A6B42] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Direct demo contact. No payment processing or escrow involved in this prototype.</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#2D452B] text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-[#4A6B42] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
