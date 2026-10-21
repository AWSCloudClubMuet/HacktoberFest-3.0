import { useMemo } from "react";
import { pct } from "../lib/format";
import { campCoords, DEPOTS, INDUS, nearestDepot, SINDH_OUTLINE } from "../lib/geo";
import { cx } from "./ui";

export type MapCamp = {
  _id: string;
  name: string;
  district: string;
  status: "Open" | "Full" | "Closed";
  lat: number | null;
  lng: number | null;
  families: number;
  needsMet: number | null;
  criticalGaps: number;
};

type Route = { _id: string; campId: string; status: string };

const BOUNDS = { minLng: 66.5, maxLng: 71.3, minLat: 23.5, maxLat: 28.7 };
// Equirectangular projection corrected for Sindh's latitude so the province isn't stretched.
const LAT_SCALE = 1 / Math.cos((26 * Math.PI) / 180);
const W = 440;
const SX = W / (BOUNDS.maxLng - BOUNDS.minLng);
const SY = SX * LAT_SCALE * 0.9;
const H = Math.round((BOUNDS.maxLat - BOUNDS.minLat) * SY);

const toXY = (lng: number, lat: number): [number, number] => [(lng - BOUNDS.minLng) * SX, (BOUNDS.maxLat - lat) * SY];

function smoothPath(points: [number, number][]) {
  const p = points.map(([lng, lat]) => toXY(lng, lat));
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2;
    const my = (p[i][1] + p[i + 1][1]) / 2;
    d += ` Q${p[i][0]},${p[i][1]} ${mx},${my}`;
  }
  const last = p[p.length - 1];
  return `${d} L${last[0]},${last[1]}`;
}

export default function CampMap({
  camps,
  routes,
  selectedId,
  onSelect,
}: {
  camps: MapCamp[];
  routes: Route[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const outline = useMemo(() => SINDH_OUTLINE.map(([lng, lat]) => toXY(lng, lat).join(",")).join(" "), []);
  const river = useMemo(() => smoothPath(INDUS), []);
  const maxFamilies = Math.max(1, ...camps.map((c) => c.families));

  const placed = camps.map((c) => {
    const [lng, lat] = campCoords(c);
    const [x, y] = toXY(lng, lat);
    return { camp: c, x, y, lng, lat, r: c.status === "Closed" ? 6 : 6 + (c.families / maxFamilies) * 6 };
  });
  const byId = new Map(placed.map((p) => [p.camp._id, p]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-label="Map of camps in Sindh">
      <polygon points={outline} fill="#FFFFFF" stroke="var(--color-line-strong)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={river} fill="none" stroke="var(--color-river)" strokeWidth="5" strokeLinecap="round" />

      {routes.map((r) => {
        const to = byId.get(r.campId);
        if (!to) return null;
        const depot = nearestDepot(to.lng, to.lat);
        const [dx, dy] = toXY(depot.lng, depot.lat);
        return (
          <line
            key={r._id}
            x1={dx}
            y1={dy}
            x2={to.x}
            y2={to.y}
            className="route"
            stroke={r.status === "In Transit" ? "var(--color-ink)" : "var(--color-faint)"}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        );
      })}

      {DEPOTS.map((d) => {
        const [x, y] = toXY(d.lng, d.lat);
        return <rect key={d.name} x={x - 5} y={y - 5} width="10" height="10" fill="var(--color-ink)"><title>{d.name}</title></rect>;
      })}

      {placed.map(({ camp, x, y, r, lng }) => {
        const closed = camp.status === "Closed";
        const critical = !closed && camp.criticalGaps > 0;
        const selected = camp._id === selectedId;
        const left = lng < 68.3;
        const label = `${camp.name.split(" ")[0]} ${closed ? "· closed" : pct(camp.needsMet)}`;
        const labelW = label.length * 6.6 + 10;
        const lx = left ? x - r - 6 - labelW : x + r + 6;
        return (
          <g key={camp._id} className="cursor-pointer" onClick={() => onSelect(camp._id)}>
            <title>{`${camp.name} · ${camp.district}`}</title>
            {selected && <circle cx={x} cy={y} r={r + 5} fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={closed ? "#FFFFFF" : critical ? "var(--color-alert)" : camp.status === "Full" ? "#FFFFFF" : "var(--color-ink)"}
              stroke={closed ? "var(--color-faint)" : camp.status === "Full" && !critical ? "var(--color-ink)" : "none"}
              strokeWidth={camp.status === "Full" ? 2.5 : 1.5}
              strokeDasharray={closed ? "3 2" : undefined}
            />
            {selected && <rect x={lx} y={y - 10} width={labelW} height="20" fill="var(--color-signal)" />}
            <text
              x={lx + 5}
              y={y + 4}
              className={cx("font-sans text-[12px]", critical || selected ? "font-semibold" : "")}
              fill={closed ? "var(--color-faint)" : critical || selected ? "var(--color-ink)" : "var(--color-muted)"}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function MapLegend() {
  const item = (swatch: React.ReactNode, label: string) => (
    <span className="flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-[18px] gap-y-2 text-xs text-ink-2">
      {item(<span className="size-[9px] rounded-full bg-alert" />, "Critical gap")}
      {item(<span className="size-[9px] rounded-full bg-ink" />, "Open")}
      {item(<span className="size-[9px] rounded-full border-2 border-ink" />, "Full")}
      {item(<span className="size-[9px] bg-ink" />, "Depot")}
      {item(<span className="w-4 border-t-[1.5px] border-dashed border-ink" />, "In transit")}
      {item(<span className="w-4 border-t-[1.5px] border-dashed border-faint" />, "Pending")}
    </div>
  );
}
