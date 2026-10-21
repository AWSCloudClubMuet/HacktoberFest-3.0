// client/src/components/CategoryBadge.jsx
import React from 'react';
import { Code2, Palette, PenTool, GraduationCap, Layers } from 'lucide-react';

export default function CategoryBadge({ category }) {
  switch (category) {
    case 'Programming':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EEF5F1] text-[#176B52] border border-[#DCEBE3]">
          <Code2 className="w-3 h-3 text-[#176B52]" />
          Programming
        </span>
      );
    case 'Design':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FBF5EC] text-[#9E6A1B] border border-[#F3E5CF]">
          <Palette className="w-3 h-3 text-[#9E6A1B]" />
          Design
        </span>
      );
    case 'Writing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF2F6] text-[#245D78] border border-[#D1E2EC]">
          <PenTool className="w-3 h-3 text-[#245D78]" />
          Writing
        </span>
      );
    case 'Tutoring':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F4F1EA] text-[#69583E] border border-[#E3DDD1]">
          <GraduationCap className="w-3 h-3 text-[#69583E]" />
          Tutoring
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2F6F3] text-[#68746D] border border-[#E3E9E4]">
          <Layers className="w-3 h-3 text-[#68746D]" />
          {category}
        </span>
      );
  }
}
