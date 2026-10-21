"use client";

import * as React from "react";
import Link from "next/link";
import { getGigs, getUsers, initializeStore } from "@/lib/api";
import { Gig } from "@/types";
import { GigCard } from "@/components/gigs/gig-card";
import { Button } from "@/components/ui/button";

const categories = [
  ["Programming", "Build software, fix bugs, and ship prototypes.", "01"],
  ["Design", "Create brands, interfaces, and event materials.", "02"],
  ["Writing", "Edit applications, reports, and research.", "03"],
  ["Tutoring", "Learn from a peer before your next deadline.", "04"],
] as const;

export default function HomePage() {
  const [gigs, setGigs] = React.useState<Gig[]>([]);
  const [studentCount, setStudentCount] = React.useState(0);

  React.useEffect(() => { initializeStore().then(() => { setGigs(getGigs()); setStudentCount(getUsers().length); }).catch(console.error); }, []);
  const openGigs = gigs.filter((gig) => gig.status === "Open").slice(0, 3);
  const completed = gigs.filter((gig) => gig.status === "Completed").length;

  return <div className="overflow-hidden">
    <section className="border-b border-[#e3e7ef] bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#315efb]"><span className="h-2 w-2 rounded-full bg-[#315efb]" />Built for student-to-student work</p>
          <h1 className="text-4xl font-extrabold leading-[1.04] text-[#172033] sm:text-6xl">Turn what you know into your next opportunity.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#64708a] sm:text-lg">Find practical help, offer a skill, and build a reputation with people from your own campus. Pay, swap skills, or simply help out.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/gigs"><Button size="lg">Explore opportunities <span className="ml-2">→</span></Button></Link><Link href="/gigs/post"><Button variant="outline" size="lg">Post a gig</Button></Link></div>
          <div className="mt-10 flex flex-wrap gap-7 border-t border-[#e8ebf2] pt-6 text-sm"><span><strong className="block text-xl text-[#172033]">{studentCount || "12"}+</strong><span className="text-[#71809a]">student profiles</span></span><span><strong className="block text-xl text-[#172033]">{gigs.length || "25"}+</strong><span className="text-[#71809a]">campus gigs</span></span><span><strong className="block text-xl text-[#172033]">{completed || "4"}</strong><span className="text-[#71809a]">completed together</span></span></div>
        </div>
        <div className="relative self-center rounded-3xl border border-[#dce3f5] bg-[#eef2ff] p-6 shadow-[0_24px_64px_-38px_rgba(49,94,251,0.65)] sm:p-8">
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-bold text-[#315efb]">Open now</span><span className="text-xs font-semibold text-[#71809a]">Programming</span></div><h2 className="mt-5 text-xl font-extrabold">Need Python help for a research dataset</h2><p className="mt-2 text-sm leading-6 text-[#64708a]">Turn a messy public dataset into a clean, usable source for a campus project.</p><div className="mt-6 flex items-center justify-between border-t border-[#edf0f5] pt-4"><span className="text-sm font-bold text-[#172033]">$45 budget</span><span className="text-xs text-[#71809a]">Due Nov 12</span></div></div>
          <div className="mt-4 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-[#172033] p-5 text-white"><span className="text-xs font-semibold text-[#aab9f8]">HOW IT WORKS</span><p className="mt-2 text-base font-bold leading-tight">Post, connect, and get it done.</p></div><div className="rounded-2xl border border-white bg-white/70 p-5"><span className="text-xs font-semibold text-[#71809a]">TRUST SIGNAL</span><p className="mt-2 text-base font-bold leading-tight text-[#172033]">Mutual reviews after every completed gig.</p></div></div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#315efb]">Ways to contribute</p><h2 className="mt-2 text-3xl font-extrabold">A marketplace for real campus work.</h2></div><Link href="/gigs" className="text-sm font-bold text-[#315efb] hover:underline">Browse every category →</Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map(([name, description, number]) => <Link href={`/gigs?category=${name}`} key={name} className="group rounded-2xl border border-[#e3e7ef] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#aab9f8] hover:shadow-md"><span className="text-xs font-bold text-[#9aa5ba]">{number}</span><h3 className="mt-10 text-lg font-extrabold group-hover:text-[#315efb]">{name}</h3><p className="mt-2 text-sm leading-6 text-[#64708a]">{description}</p><span className="mt-5 block text-sm font-bold text-[#315efb]">See gigs →</span></Link>)}</div></section>

    <section className="border-y border-[#e3e7ef] bg-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#315efb]">Fresh opportunities</p><h2 className="mt-2 text-3xl font-extrabold">Ready when you are.</h2></div><Link href="/gigs"><Button variant="outline">See all gigs</Button></Link></div><div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{openGigs.map((gig) => <GigCard key={gig.id} gig={gig} />)}</div></div></section>

    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="grid overflow-hidden rounded-3xl bg-[#172033] p-8 text-white sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#aab9f8]">Make the first move</p><h2 className="mt-3 max-w-xl text-3xl font-extrabold text-white sm:text-4xl">Your next collaborator is already on campus.</h2><p className="mt-4 max-w-xl text-base leading-7 text-[#c6cede]">Start with a clear brief. Choose paid, skill swap, or free help. The platform handles applications, decisions, and reviews.</p></div><Link href="/gigs/post" className="mt-8 lg:mt-0"><Button size="lg" className="bg-white text-[#172033] hover:bg-[#e9edff]">Post your first gig →</Button></Link></div></section>
  </div>;
}
