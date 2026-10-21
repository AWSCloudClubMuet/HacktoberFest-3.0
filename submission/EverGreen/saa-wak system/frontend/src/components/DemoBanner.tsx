import React, { useState } from 'react';
import { Info, RotateCcw, Check } from 'lucide-react';

interface DemoBannerProps {
  onResetData: () => Promise<void>;
  lastRefreshedAt?: Date;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onResetData, lastRefreshedAt }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleReset = async () => {
    if (confirm('Reset all demo data (prices, listings, alerts) back to the initial 336 seed records?')) {
      setIsResetting(true);
      await onResetData();
      setIsResetting(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <>
      <div className="bg-[#FAF9F5] border-b border-[#E8E7DF] px-4 sm:px-6 py-2 text-[11px] text-[#555A50]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#2D452B] tracking-wider uppercase text-[10px]">
              Demo Mode
            </span>
            <span className="text-[#C5C4BA]" aria-hidden="true">·</span>
            <span className="font-medium text-[#2F332C]">
              Sample demo prices — not live market data.
            </span>
            <span className="text-[#C5C4BA] hidden md:inline" aria-hidden="true">·</span>
            <span className="hidden md:inline text-[#767B70]">
              Simulated agricultural quotations for Hyderabad, Sukkur & Mirpur Khas.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshedAt && (
              <span className="text-[#767B70] hidden sm:inline tabular-nums">
                Synced {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => setShowInfoModal(true)}
              className="text-[#4A6B42] hover:text-[#2D452B] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-3 h-3" />
              <span>Dataset Spec</span>
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D452B] bg-white border border-[#E8E7DF] hover:bg-[#EEF2E8] px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
              title="Reset all prices, listings, and alerts back to default seed"
            >
              {resetSuccess ? (
                <>
                  <Check className="w-3 h-3 text-[#1B7F4B]" />
                  <span>Reset Done</span>
                </>
              ) : (
                <>
                  <RotateCcw className={`w-3 h-3 text-[#4A6B42] ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Reset Seed</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8E7DF]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌾</span>
                <div>
                  <h3 className="font-bold text-base text-[#2D452B]">saa-wak Dataset Specifications</h3>
                  <p className="text-xs text-[#767B70]">Sindh Agricultural Price Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-[#767B70] hover:text-[#2F332C] text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2F332C] leading-relaxed">
              <p>
                All crop prices, marketplace listings, and farmer profiles presented in <strong>saa-wak (ساوڪ)</strong> are <strong>fictional demo records</strong> crafted for the hackathon prototype.
              </p>

              <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E8E7DF] space-y-1.5 text-[11px] text-[#555A50]">
                <div>• <strong className="text-[#2F332C]">8 Crops:</strong> Wheat, Basmati Rice, Cotton, Sugarcane, Onion, Tomato, Red Chilli, Sindhri Mango</div>
                <div>• <strong className="text-[#2F332C]">3 Mandi Hubs:</strong> Hyderabad Mandi, Sukkur Market, Mirpur Khas Mandi</div>
                <div>• <strong className="text-[#2F332C]">14 Consecutive Days:</strong> 336 ordered daily price records (8 × 3 × 14)</div>
                <div>• <strong className="text-[#2F332C]">Standard Unit:</strong> PKR per 40 kg (canonical mandi maund)</div>
              </div>

              <p className="text-[11px] text-[#767B70]">
                A future release will connect to live APMC Mandi feeds and verified farmer digital IDs via Google Antigravity backend.
              </p>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowInfoModal(false)}
                className="bg-[#2D452B] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#4A6B42] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
