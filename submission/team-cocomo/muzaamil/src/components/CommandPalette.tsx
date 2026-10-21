import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/shadcn/command";
import { fmt, initials, pct, qty } from "../lib/format";
import { useViewer } from "../lib/viewer";
import { useI18n } from "../i18n";
import { Avatar, Badge, PlusIcon, SearchIcon, cx } from "./ui";

const COORDINATOR_PAGES = [
  { to: "/", label: "Overview", hint: "Situation report and map" },
  { to: "/log", label: "Quick log", hint: "Type what happened, it becomes the form" },
  { to: "/camps", label: "Camps", hint: "Registry, occupancy, locations" },
  { to: "/needs", label: "Needs", hint: "Everything camps are short of" },
  { to: "/warehouse", label: "Warehouse", hint: "Stock on hand and reorder levels" },
  { to: "/dispatches", label: "Dispatches", hint: "Trucks pending, on the road, delivered" },
  { to: "/donations", label: "Donations", hint: "Cash and in-kind records" },
  { to: "/volunteers", label: "Volunteers", hint: "Field team and assignments" },
];

const VOLUNTEER_PAGES = [
  { to: "/assignment", label: "My assignment", hint: "Your camp, its needs and incoming deliveries" },
  { to: "/profile", label: "Profile", hint: "Your name, skill and phone number" },
];

/** Word-start matches rank above substring matches; no fuzzy matching, so "ins" finds Insulin, not Khairpur. */
function filter(value: string, search: string, keywords?: string[]) {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  // The first word of each value is the group tag ("camp", "item", …) that keeps values unique.
  const text = [value.split(" ").slice(1).join(" "), ...(keywords ?? [])].join(" ").toLowerCase();
  if (text.startsWith(q)) return 1;
  if (text.split(/[\s·,]+/).some((w) => w.startsWith(q))) return 0.8;
  return text.includes(q) ? 0.4 : 0;
}

function campDot(status: string, critical: number) {
  if (status === "Closed") return "bg-faint";
  if (critical > 0) return "bg-alert";
  if (status === "Full") return "bg-warn";
  return "bg-ok";
}

/** Header search button plus the ⌘K command palette it opens. */
export default function CommandPalette() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isCoordinator } = useViewer();
  const [open, setOpen] = useState(false);
  const fetchAll = open && isCoordinator;
  const camps = useQuery(api.camps.list, fetchAll ? {} : "skip");
  const items = useQuery(api.inventory.list, fetchAll ? {} : "skip");
  const volunteers = useQuery(api.volunteers.list, fetchAll ? {} : "skip");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const pages = isCoordinator ? COORDINATOR_PAGES : VOLUNTEER_PAGES;
  const loading = isCoordinator && (!camps || !items || !volunteers);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-[38px] w-[220px] cursor-pointer items-center gap-2.5 rounded-lg border border-line-strong bg-paper px-3 text-start text-muted transition-[border-color] duration-150 hover:border-ink-2 xl:w-[260px]"
      >
        <SearchIcon />
        <span className="flex-1 truncate text-sm text-faint">{t("Search or jump to…")}</span>
        <kbd dir="ltr" className="rounded border border-line px-1.5 py-px font-mono text-[11px]">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} commandProps={{ loop: true, filter }}>
        <CommandInput placeholder={t(isCoordinator ? "Search camps, districts, stock, volunteers or pages…" : "Jump to a page…")} />
        <CommandList>
          <CommandEmpty>{t(loading ? "Loading…" : "Nothing matches that search.")}</CommandEmpty>

          {isCoordinator && (
            <>
              <CommandGroup heading={t("Actions")}>
                <CommandItem value="action new dispatch send supplies" keywords={[t("New dispatch")]} onSelect={() => go("/dispatches?new")}>
                  <span className="grid size-7 place-items-center rounded-md bg-ink text-white">
                    <PlusIcon />
                  </span>
                  <span className="flex-1 font-semibold">{t("New dispatch")}</span>
                  <CommandShortcut>{t("reserve stock")}</CommandShortcut>
                </CommandItem>
                <CommandItem value="action review critical needs" keywords={[t("Review critical needs")]} onSelect={() => go("/needs")}>
                  <span className="grid size-7 place-items-center rounded-md bg-alert-wash">
                    <span className="size-2 rounded-full bg-alert" />
                  </span>
                  <span className="flex-1 font-semibold">{t("Review critical needs")}</span>
                  <CommandShortcut>{t("under 40%")}</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading={t("Go to")}>
            {pages.map((p) => (
              <CommandItem key={p.to} value={`page ${p.label}`} keywords={[p.hint, t(p.label), t(p.hint)]} onSelect={() => go(p.to)}>
                <span className="w-28 shrink-0 font-semibold">{t(p.label)}</span>
                <span className="flex-1 truncate text-xs text-muted">{t(p.hint)}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {camps && camps.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("Camps")}>
                {camps.map((c) => (
                  <CommandItem key={c._id} value={`camp ${c.name} ${c.district}`} keywords={[c.status, t(c.status)]} onSelect={() => go(`/camps/${c._id}`)}>
                    <span className={cx("size-2 rounded-full", campDot(c.status, c.criticalGaps))} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{c.name}</span>
                      <span className="truncate text-xs text-muted">
                        {t("{district} · {count} families", { district: c.district, count: fmt(c.current_families) })}
                      </span>
                    </span>
                    {c.status === "Closed" ? (
                      <Badge tone="neutral">{t("Closed")}</Badge>
                    ) : c.criticalGaps > 0 ? (
                      <Badge tone="danger">{t("{count} critical", { count: fmt(c.criticalGaps) })}</Badge>
                    ) : (
                      <CommandShortcut>{t("{percent} met", { percent: pct(c.needsMet) })}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {items && items.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("Warehouse")}>
                {items.map((i) => (
                  <CommandItem key={i._id} value={`item ${i.name} ${i.category}`} keywords={[t(i.name), t(i.category)]} onSelect={() => go(`/warehouse?q=${encodeURIComponent(i.name)}`)}>
                    <span className={cx("size-2 rounded-[3px]", i.lowStock ? "bg-warn" : "bg-ok")} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{t(i.name)}</span>
                      <span className="truncate text-xs text-muted">
                        {t("{category} · {stock} on hand", { category: t(i.category), stock: qty(i.stock, i.unit) })}
                      </span>
                    </span>
                    {i.lowStock ? <Badge tone="warning">{t("Low stock")}</Badge> : <CommandShortcut>{t("in stock")}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {volunteers && volunteers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("Volunteers")}>
                {volunteers.map((v) => (
                  <CommandItem key={v._id} value={`volunteer ${v.name} ${v.skill} ${v.campName ?? "unassigned"}`} keywords={[t(v.skill)]} onSelect={() => go(`/volunteers?q=${encodeURIComponent(v.name)}`)}>
                    <Avatar name={initials(v.name)} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{v.name}</span>
                      <span className={cx("truncate text-xs", v.campName ? "text-muted" : "text-warn-ink")}>
                        {t(v.skill)} · {v.campName ?? t("Waiting for a camp")}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
        <div className="flex items-center gap-4 border-t border-line bg-tint px-3.5 py-2 font-mono text-[11px] text-muted">
          <span>{t("↑↓ move")}</span>
          <span>{t("↵ open")}</span>
          <span>{t("esc close")}</span>
          <span className="ms-auto">{t("⌘K or / to open")}</span>
        </div>
      </CommandDialog>
    </>
  );
}
