// client/src/components/GigCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import PaymentBadge from './PaymentBadge';
import { Calendar, Star, ArrowRight, User } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function GigCard({ gig }) {
  const { currentUser } = useUser();
  const isOwner = currentUser?.id === gig.user_id;

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = new Date(gig.deadline) < new Date();
  const skills = Array.isArray(gig.skills_required) && gig.skills_required.length > 0
    ? gig.skills_required
    : (Array.isArray(gig.skills_offered) ? gig.skills_offered : []);

  return (
    <div className="bg-white rounded-lg border border-[#E3E9E4] hover:border-[#176B52]/50 hover:shadow-card transition-standard flex flex-col justify-between overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Top Header: Type, Category, and Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
              gig.type === 'Offering' 
                ? 'bg-[#EEF5F1] text-[#176B52] border border-[#DCEBE3]' 
                : 'bg-[#F4F1EA] text-[#69583E] border border-[#E3DDD1]'
            }`}>
              {gig.type}
            </span>
            <CategoryBadge category={gig.category} />
          </div>
          <StatusBadge status={gig.status} />
        </div>

        {/* Opportunity Title */}
        <Link to={`/gigs/${gig.id}`} className="block group">
          <h3 className="font-semibold text-sm sm:text-base text-[#202923] group-hover:text-[#176B52] leading-snug line-clamp-2 mb-2 transition-colors">
            {gig.title}
          </h3>
        </Link>

        {/* Description Snippet */}
        <p className="text-xs text-[#68746D] line-clamp-2 mb-3 leading-relaxed min-h-[2.5rem]">
          {gig.description}
        </p>

        {/* Skills Tag Pills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {skills.slice(0, 3).map((skill, idx) => (
              <span 
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAF8] text-[#68746D] border border-[#E3E9E4]"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F8FAF8] text-[#68746D]">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Poster Info */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E3E9E4]">
          <Link 
            to={`/profile/${gig.owner?.id || gig.user_id}`}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity min-w-0"
          >
            <div className="w-6 h-6 rounded bg-[#DCEBE3] text-[#176B52] font-semibold flex items-center justify-center text-[10px] shrink-0">
              {gig.owner?.name ? gig.owner.name.split(' ').map(n=>n[0]).join('') : 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#202923] truncate flex items-center gap-1">
                {gig.owner?.name || 'Student Peer'}
                {isOwner && (
                  <span className="text-[9px] bg-[#EEF5F1] text-[#176B52] px-1 rounded font-medium">You</span>
                )}
              </p>
              <p className="text-[10px] text-[#68746D] truncate">{gig.owner?.department || gig.owner?.major || 'Campus Student'}</p>
            </div>
          </Link>

          {gig.owner?.average_rating > 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-medium text-[#C48D35] bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
              <Star className="w-3 h-3 fill-[#E5AD52] text-[#E5AD52]" />
              <span>{gig.owner.average_rating}</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#68746D]">New</span>
          )}
        </div>
      </div>

      {/* Card Footer: Terms and Action */}
      <div className="bg-[#F8FAF8] px-4 sm:px-5 py-2.5 border-t border-[#E3E9E4] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <PaymentBadge paymentType={gig.payment_type} budget={gig.budget} />

          <div className="flex items-center gap-1 text-[11px] text-[#68746D]" title={`Deadline: ${formatDate(gig.deadline)}`}>
            <Calendar className="w-3.5 h-3.5 text-[#68746D]" />
            <span className={isOverdue && gig.status === 'Open' ? 'text-[#B93838] font-medium' : ''}>
              {formatDate(gig.deadline)}
            </span>
          </div>
        </div>

        <Link
          to={`/gigs/${gig.id}`}
          className="inline-flex items-center gap-1 font-medium text-xs text-[#176B52] hover:text-[#10513F] transition-colors"
        >
          {isOwner ? 'Manage' : 'View Details'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
