import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { fmt, initials } from "../lib/format";
import { useViewer } from "../lib/viewer";
import { useI18n } from "../i18n";
import CommandPalette from "./CommandPalette";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button, Mark, PlusIcon, cx } from "./ui";

// Day 1 of the response.
const RESPONSE_START = new Date("2026-09-29T00:00:00+05:00").getTime();

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const icons: Record<string, string> = {
  "/": "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  "/camps": "M3 20h18M5 20l7-15 7 15M9.5 20l2.5-5 2.5 5",
  "/needs": "M12 3l9 16H3L12 3zM12 10v4M12 17h.01",
  "/warehouse": "M3 9l9-5 9 5v11H3V9zM8 20v-6h8v6",
  "/dispatches": "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z",
  "/donations": "M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z",
  "/volunteers": "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M22 21a7 7 0 00-4-6.3",
  "/log": "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  "/assignment": "M12 21s-6-5.1-6-10a6 6 0 1112 0c0 4.9-6 10-6 10zM12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  "/profile": "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 21a7.5 7.5 0 0115 0",
};

export default function Layout() {
  const { t, locale } = useI18n();
  const { viewer, isCoordinator } = useViewer();
  const counts = useQuery(api.dashboard.nav, isCoordinator ? {} : "skip");
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const now = useClock();
  const [syncedAt, setSyncedAt] = useState(() => new Date());
  useEffect(() => setSyncedAt(new Date()), [counts]);

  const day = Math.max(1, Math.floor((now.getTime() - RESPONSE_START) / 86_400_000) + 1);
  const date = now.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  const tabs: { to: string; label: string; end?: boolean; count?: number; flag?: { text: string; tone: "danger" | "warning" } | null }[] = isCoordinator
    ? [
        { to: "/", label: "Overview", end: true },
        { to: "/log", label: "Quick log" },
        { to: "/camps", label: "Camps", count: counts?.camps },
        { to: "/needs", label: "Needs", count: counts?.needs, flag: counts?.criticalGaps ? { text: t("{count} critical", { count: fmt(counts.criticalGaps) }), tone: "danger" } : null },
        { to: "/warehouse", label: "Warehouse", count: counts?.inventory, flag: counts?.lowStock ? { text: t("{count} low", { count: fmt(counts.lowStock) }), tone: "warning" } : null },
        { to: "/dispatches", label: "Dispatches", count: counts?.dispatches },
        { to: "/donations", label: "Donations", count: counts?.donations },
        { to: "/volunteers", label: "Volunteers", count: counts?.volunteers },
      ]
    : [
        { to: "/assignment", label: "My assignment" },
        { to: "/profile", label: "Profile" },
      ];

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col justify-between overflow-y-auto border-e border-line bg-paper px-3 pb-4 pt-5">
        <div className="flex flex-col gap-7">
          <NavLink to="/" className="flex items-center gap-2.5 px-2.5">
            <Mark />
            <span className="flex flex-col">
              <span className="text-[17px] font-extrabold leading-5 tracking-[-0.02em]">ReliefHub</span>
              <span className="text-[11px] text-muted">{t("Sindh flood response")}</span>
            </span>
          </NavLink>
          <nav className="flex flex-col gap-0.5">
            <div className="label px-2.5 pb-2">{t(isCoordinator ? "Operations" : "My work")}</div>
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cx(
                    "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                    isActive ? "bg-ink font-semibold text-white" : "font-medium text-ink-2 hover:bg-tint",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "text-signal" : "text-faint"}>
                      <path d={icons[tab.to]} />
                    </svg>
                    <span className="flex-1">{t(tab.label)}</span>
                    {tab.flag ? (
                      <span
                        className={cx(
                          "rounded-md px-1.5 py-px text-[11px] font-semibold",
                          tab.flag.tone === "danger" ? "bg-alert text-white" : "bg-warn-wash text-warn-ink",
                        )}
                      >
                        {tab.flag.text}
                      </span>
                    ) : (
                      tab.count != null && <span className={cx("font-mono text-xs", isActive ? "text-ghost" : "text-muted")}>{fmt(tab.count)}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3 pt-5">
          <LanguageSwitcher />
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-tint p-2.5">
          <span title={viewer?.email} className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
            {viewer ? initials(viewer.name) : ""}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold">{viewer?.name}</span>
            <span className="text-xs text-muted">{t(isCoordinator ? "Coordinator" : "Field volunteer")}</span>
          </div>
          <button onClick={() => void signOut().then(() => navigate("/", { replace: true }))} className="cursor-pointer rounded-md px-1.5 py-1 text-xs font-semibold text-muted hover:bg-alert-wash hover:text-alert-ink">
            {t("Sign out")}
          </button>
        </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur xl:px-8">
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
            <span className="flex items-center gap-2 rounded-md bg-ok-wash px-2 py-1 text-xs font-semibold text-ok-ink">
              <span className="pulse size-[7px] rounded-full bg-ok" />
              {t("Live")}
            </span>
            <span className="font-semibold text-ink">{t("Day {day}", { day: fmt(day) })}</span>
            <span className="text-ghost">|</span>
            <bdi>{date}</bdi>
            <span className="text-ghost">|</span>
            <span className="font-mono text-xs text-ink"><bdi>{time}</bdi> {t("PKT")}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CommandPalette />
            {isCoordinator && (
              <Button onClick={() => navigate("/dispatches?new")}>
                <PlusIcon /> {t("New dispatch")}
              </Button>
            )}
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-8 pb-12 pt-8">
          <Outlet />
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-8 py-3 font-mono text-[11px] text-muted">
          <span>
            {t("Synced {time}", { time: syncedAt.toLocaleTimeString(locale) })}
          </span>
          {counts && (
            <span>
              {t("Cash PKR {cash} · In-kind {count} records", { cash: fmt(counts.cash), count: fmt(counts.inKind) })}
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}
