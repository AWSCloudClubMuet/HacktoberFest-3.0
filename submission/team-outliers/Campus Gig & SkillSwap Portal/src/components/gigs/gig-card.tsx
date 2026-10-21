import Link from "next/link";
import { Gig, User } from "@/types";
import { getUserById, getUserStats } from "@/lib/api";
import { formatDate, formatCurrency, isPastDeadline } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export interface GigCardProps { gig: Gig; compact?: boolean; }

const categoryStyles = { Programming: "bg-[#e8f0ff] text-[#315efb]", Design: "bg-[#f5ecff] text-[#7c3aed]", Writing: "bg-[#e7f7f0] text-[#087f5b]", Tutoring: "bg-[#fff4df] text-[#b15f00]" };

export function GigCard({ gig, compact = false }: GigCardProps) {
  const poster: User | undefined = getUserById(gig.user_id);
  const stats = poster ? getUserStats(poster.id) : null;
  const expired = gig.status === "Expired" || (gig.status === "Open" && isPastDeadline(gig.deadline));
  const status = expired ? "Expired" : gig.status;
  const compensation = gig.payment_type === "Paid" ? formatCurrency(gig.budget) : gig.payment_type === "SkillSwap" ? "Skill swap" : "Free help";

  return <article className={`group flex flex-col rounded-2xl border border-[#e3e7ef] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#b9c5fb] hover:shadow-md ${compact ? "p-4" : "min-h-[290px]"}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${categoryStyles[gig.category]}`}>{gig.category}</span><span className={`text-[11px] font-bold ${status === "Open" ? "text-[#087f5b]" : status === "In Progress" ? "text-[#b15f00]" : "text-[#71809a]"}`}>{status}</span></div>
    <div className="mt-4"><p className="text-xs font-semibold text-[#71809a]">{gig.type === "Offering" ? "Offering a service" : "Looking for help"}</p><Link href={`/gigs/${gig.id}`}><h3 className="mt-1.5 text-lg font-extrabold leading-snug text-[#172033] group-hover:text-[#315efb]">{gig.title}</h3></Link>{!compact && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64708a]">{gig.description}</p>}</div>
    <div className="mt-auto pt-5"><div className="flex items-center justify-between border-y border-[#eef0f5] py-3 text-xs"><span className="font-bold text-[#172033]">{compensation}</span><span className="text-[#71809a]">Due {formatDate(gig.deadline)}</span></div>{poster && <Link href={`/profile/${poster.id}`} className="mt-3 flex items-center justify-between"><span className="flex items-center gap-2"><Avatar src={poster.avatarUrl} fallback={poster.name} size="sm" /><span><span className="block text-xs font-bold text-[#33405a]">{poster.name}</span><span className="block text-[10px] text-[#8792a8]">{poster.major}</span></span></span>{stats?.averageRating ? <span className="text-xs font-bold text-[#b15f00]">★ {stats.averageRating}</span> : <span className="text-[10px] font-semibold text-[#8792a8]">New member</span>}</Link>}</div>
  </article>;
}
