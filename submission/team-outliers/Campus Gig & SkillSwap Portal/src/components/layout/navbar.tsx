"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUser, getUsers, setCurrentUserId, initializeStore } from "@/lib/api";
import { User } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const navLinks = [
  { href: "/gigs", label: "Find work" }, { href: "/gigs/post", label: "Post a gig" },
  { href: "/my-gigs", label: "My gigs" }, { href: "/my-applications", label: "Applications" },
];

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = React.useState<User>();
  const [users, setUsers] = React.useState<User[]>([]);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const refresh = () => { initializeStore(); setCurrentUser(getCurrentUser()); setUsers(getUsers()); };
    refresh();
    window.addEventListener("user-changed", refresh);
    return () => window.removeEventListener("user-changed", refresh);
  }, []);

  return <>
    <header className="sticky top-0 z-40 border-b border-[#e3e7ef] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SkillSwap home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#172033] text-sm font-black text-white shadow-sm">S</span>
          <span className="leading-tight"><span className="block text-[15px] font-extrabold tracking-tight text-[#172033]">SkillSwap</span><span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#71809a]">campus network</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navLinks.map((link) => { const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(`${link.href}/`)); return <Link key={link.href} href={link.href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-[#eef2ff] text-[#315efb]" : "text-[#59657c] hover:bg-[#f3f5f9] hover:text-[#172033]"}`}>{link.label}</Link>; })}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          {currentUser && <Link href={`/profile/${currentUser.id}`} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[#f3f5f9]"><Avatar src={currentUser.avatarUrl} fallback={currentUser.name} size="sm" /><span className="hidden text-left lg:block"><span className="block text-xs font-bold text-[#172033]">{currentUser.name}</span><span className="block text-[10px] text-[#71809a]">Demo profile</span></span></Link>}
          <Button variant="outline" size="sm" onClick={() => setSwitcherOpen(true)}>Switch profile</Button>
        </div>
        <button onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-[#45516a] hover:bg-[#f3f5f9] md:hidden" aria-label="Toggle navigation menu"><span className="text-lg">{mobileMenuOpen ? "×" : "☰"}</span></button>
      </div>
      {mobileMenuOpen && <nav className="border-t border-[#e3e7ef] bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">{navLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-[#45516a] hover:bg-[#f3f5f9]">{link.label}</Link>)}<button onClick={() => { setMobileMenuOpen(false); setSwitcherOpen(true); }} className="mt-1 w-full rounded-lg bg-[#eef2ff] px-3 py-2.5 text-left text-sm font-semibold text-[#315efb]">Switch demo profile</button></nav>}
    </header>
    <Dialog open={switcherOpen} onOpenChange={setSwitcherOpen} title="Choose a demo profile" description="Switch profiles to test posting, applying, managing gigs, and leaving reviews." maxWidth="lg">
      <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{users.map((user) => { const selected = currentUser?.id === user.id; return <button key={user.id} onClick={() => { setCurrentUserId(user.id); setSwitcherOpen(false); }} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-[#315efb] bg-[#eef2ff]" : "border-[#e3e7ef] bg-white hover:border-[#aab9f8]"}`}><Avatar src={user.avatarUrl} fallback={user.name} size="md" /><span className="min-w-0"><span className="flex items-center gap-2"><span className="truncate text-sm font-bold text-[#172033]">{user.name}</span>{selected && <span className="rounded bg-[#315efb] px-1.5 py-0.5 text-[9px] font-bold text-white">ACTIVE</span>}</span><span className="mt-0.5 block truncate text-xs text-[#64708a]">{user.major}</span><span className="mt-2 block truncate text-[11px] text-[#71809a]">{user.skills.slice(0, 3).join(" · ")}</span></span></button>; })}</div>
    </Dialog>
  </>;
}
