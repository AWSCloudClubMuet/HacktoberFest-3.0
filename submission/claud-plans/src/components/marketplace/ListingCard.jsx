import React, { useState } from 'react';
import { MapPin, Phone, Calendar, User, Edit3, Trash2, CheckCircle2, MessageSquare } from 'lucide-react';
import { formatPKR, formatDate } from '../../utils/formatters';
import { CategoryBadge, StatusBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

export const ListingCard = ({ listing, onEdit, onDelete, onStatusToggle }) => {
  const { currentUser } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);

  const {
    id,
    userId,
    farmerName,
    farmerPhone,
    cropName,
    category,
    variety,
    quantity,
    unit,
    pricePerUnit,
    district,
    marketLocation,
    description,
    harvestDate,
    status
  } = listing;

  const isOwner = currentUser?.id === userId;
  const isAvailable = status === 'available';
  const totalValue = Number(quantity) * Number(pricePerUnit);

  return (
    <>
      <div className={`bg-white rounded-2xl border transition-all flex flex-col justify-between ${
        isAvailable 
          ? 'border-earth-300/90 shadow-card hover:shadow-card-hover' 
          : 'border-slate-200 bg-slate-50/70 opacity-80'
      } p-4 sm:p-5`}>
        {/* Card Header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">
                  {cropName}
                </h3>
                <CategoryBadge category={category} />
              </div>
              {variety && (
                <p className="text-xs text-agri-800 font-semibold mt-0.5">
                  Variety: {variety}
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Quantity & Asking Rate */}
          <div className="mt-3.5 p-3 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Offered Quantity
              </span>
              <span className="text-base font-extrabold text-slate-800">
                {quantity.toLocaleString()} <span className="text-xs text-slate-500 font-normal">{unit}</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Asking Rate
              </span>
              <span className="text-lg font-extrabold text-agri-800">
                {formatPKR(pricePerUnit)}
              </span>
              <span className="text-[10px] text-slate-500 block">/ {unit}</span>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-slate-600 mt-3 line-clamp-2 italic">
              "{description}"
            </p>
          )}

          {/* Metadata: Farmer, Location, Harvest Date */}
          <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 border-t border-earth-200/80 pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" /> {farmerName}
              </span>
              {harvestDate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" /> Harvested {formatDate(harvestDate)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-earth-600 shrink-0" />
              <span className="truncate">{marketLocation}, {district}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-earth-200 flex items-center justify-between gap-2">
          {isOwner ? (
            /* Farmer Owner Controls: Toggle Sold, Edit, Delete */
            <div className="flex items-center justify-between w-full gap-2">
              <button
                onClick={() => onStatusToggle(id, status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  isAvailable
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isAvailable ? 'Mark Sold' : 'Relist Active'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onEdit(listing)}
                  className="p-1.5 text-slate-600 hover:text-agri-800 hover:bg-earth-200 rounded-lg transition-colors"
                  title="Edit Listing"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(id)}
                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Buyer View: Direct Contact & Inquiry */
            <div className="flex items-center justify-between w-full gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Est. Batch Value</span>
                <span className="text-xs font-bold text-slate-700">{formatPKR(totalValue)}</span>
              </div>
              <button
                onClick={() => setShowContactModal(true)}
                disabled={!isAvailable}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                  isAvailable
                    ? 'bg-agri-700 hover:bg-agri-800 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Phone className="w-3.5 h-3.5" /> Contact Farmer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Direct Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Farmer for Purchase"
        subtitle={`Listing: ${cropName} (${quantity} ${unit})`}
      >
        <div className="space-y-4 text-sm">
          <div className="p-3.5 rounded-xl bg-earth-50 border border-earth-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Seller Name:</span>
              <span className="font-bold text-slate-900">{farmerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Phone Number:</span>
              <span className="font-bold text-agri-800">{farmerPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Dispatch Location:</span>
              <span className="font-semibold text-slate-700 text-right">{marketLocation}, {district}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Total Asking Amount:</span>
              <span className="font-extrabold text-agri-900">{formatPKR(totalValue)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Directly connect with the grower via phone call or WhatsApp to confirm quality inspection, delivery schedule, and mandi weighing.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={`tel:${farmerPhone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-agri-700 hover:bg-agri-800 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              <Phone className="w-4 h-4" /> Call Farmer
            </a>
            <a
              href={`https://wa.me/${farmerPhone.replace(/[^0-9]/g, '')}?text=Assalam-o-Alaikum, I am interested in your ${cropName} listed on KisanMandi (${quantity} ${unit} at ${formatPKR(pricePerUnit)}).`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
};
