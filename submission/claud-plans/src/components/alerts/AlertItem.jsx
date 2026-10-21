import React from 'react';
import { Bell, Trash2, Power, AlertTriangle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { formatPKR, formatTimeAgo } from '../../utils/formatters';

export const AlertItem = ({ alert, onToggleStatus, onDelete }) => {
  const {
    id,
    cropName,
    marketName,
    condition,
    targetPrice,
    active,
    triggered,
    triggeredAt,
    message,
    createdAt
  } = alert;

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      triggered && active
        ? 'bg-harvest-50/70 border-harvest-300 shadow-sm'
        : active
        ? 'bg-white border-earth-300 shadow-card'
        : 'bg-slate-50 border-slate-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            triggered && active
              ? 'bg-harvest-500 text-slate-950 font-bold'
              : active
              ? 'bg-agri-100 text-agri-700'
              : 'bg-slate-200 text-slate-500'
          }`}>
            {condition === 'above' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {cropName}
              </h4>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                condition === 'above' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Trigger if {condition === 'above' ? 'Rises Above' : 'Falls Below'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              Market: <span className="font-semibold text-slate-700">{marketName}</span>
            </p>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xs text-slate-400">Target Threshold:</span>
              <span className="text-base font-extrabold text-slate-800">
                {formatPKR(targetPrice)}
              </span>
            </div>

            {/* Triggered Status Message */}
            {triggered && active && message && (
              <div className="mt-2.5 p-2 rounded-lg bg-harvest-100/80 border border-harvest-300 text-xs text-harvest-900 flex items-start gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-harvest-700 shrink-0 mt-0.5" />
                <div>
                  <p>{message}</p>
                  {triggeredAt && (
                    <span className="text-[10px] text-harvest-700 block mt-0.5">
                      Evaluated {formatTimeAgo(triggeredAt)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleStatus(id, active)}
            className={`p-2 rounded-xl transition-colors ${
              active
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
            }`}
            title={active ? 'Pause Alert' : 'Resume Alert'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
            title="Delete Alert"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
