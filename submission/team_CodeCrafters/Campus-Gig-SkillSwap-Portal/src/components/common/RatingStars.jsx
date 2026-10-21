import React from 'react';
import { Star } from 'lucide-react';

export function RatingStars({ rating = 5, max = 5, size = 'sm', interactive = false, onRate, className = '' }) {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const starIconSize = sizeMap[size] || sizeMap.sm;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onRate && onRate(starValue)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
              aria-label={`Rate ${starValue} stars`}
            >
              <Star
                className={`${sizeMap[size] || 'w-6 h-6'} ${
                  isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={i}
            className={`${starIconSize} ${
              isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
            }`}
          />
        );
      })}
    </div>
  );
}
