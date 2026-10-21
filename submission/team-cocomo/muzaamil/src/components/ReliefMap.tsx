import { LngLatBounds, Map as MapLibre, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef, useState } from "react";
import { pct } from "../lib/format";
import { tr, useI18n } from "../i18n";
import { campCoords, DEPOTS, nearestDepot } from "../lib/geo";
import CampMap, { type MapCamp } from "./CampMap";

// MapLibre's worker is a separate module; Vite has to bundle it and hand over the URL.
setWorkerUrl(workerUrl);

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const SINDH_BOUNDS: [[number, number], [number, number]] = [
  [66.6, 23.6],
  [71.2, 28.6],
];

type Route = { _id: string; campId: string; status: string };

function pinColor(c: MapCamp) {
  if (c.status === "Closed") return "#b9bcb5";
  if (c.criticalGaps > 0) return "#d92d20";
  if (c.status === "Full") return "#f79009";
  return "#079455";
}

function pinElement(c: MapCamp, size: number, selected: boolean, showLabel: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${c.name}, ${c.district}`);
  el.title = `${c.name} · ${c.district} · ${c.status === "Closed" ? tr("Closed") : tr("{percent} needs met", { percent: pct(c.needsMet) })}`;
  el.style.cssText = "display:flex;align-items:center;gap:6px;cursor:pointer;background:none;border:0;padding:0;";
  const color = pinColor(c);
  const dot = document.createElement("span");
  dot.style.cssText = `width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2.5px solid #fff;box-shadow:0 0 0 ${selected ? 3 : 1}px ${selected ? "#111311" : "rgba(17,19,17,.25)"},0 2px 6px rgba(17,19,17,.25);flex-shrink:0;`;
  el.appendChild(dot);
  if (showLabel) {
    const label = document.createElement("span");
    label.textContent = `${c.name.split(" ")[0]} · ${c.status === "Closed" ? tr("Closed") : pct(c.needsMet)}`;
    label.dir = "auto";
    label.style.cssText = `font:600 11px var(--font-sans);white-space:nowrap;padding:3px 7px;border-radius:6px;background:${selected ? "#111311" : "rgba(255,255,255,.95)"};color:${selected ? "#fff" : "#30332f"};box-shadow:0 1px 3px rgba(17,19,17,.18);`;
    el.appendChild(label);
  }
  return el;
}

function routeData(camps: MapCamp[], routes: Route[]) {
  const byId = new Map(camps.map((c) => [c._id, c]));
  return {
    type: "FeatureCollection" as const,
    features: routes.flatMap((r) => {
      const camp = byId.get(r.campId);
      if (!camp) return [];
      const [lng, lat] = campCoords(camp);
      const depot = nearestDepot(lng, lat);
      return [
        {
          type: "Feature" as const,
          properties: { status: r.status },
          geometry: { type: "LineString" as const, coordinates: [[depot.lng, depot.lat], [lng, lat]] },
        },
      ];
    }),
  };
}

export default function ReliefMap({
  camps,
  routes = [],
  selectedId = null,
  onSelect,
  height = 420,
  focusId,
  labels = true,
}: {
  camps: MapCamp[];
  routes?: Route[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
  /** Zoom to one camp instead of the whole province. */
  focusId?: string;
  labels?: boolean;
}) {
  const { language, t } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!container.current) return;
    setReady(false);
    let loaded = false;
    const map = new MapLibre({
      container: container.current,
      style: STYLE_URL,
      locale: {
        "NavigationControl.ZoomIn": t("Zoom in"),
        "NavigationControl.ZoomOut": t("Zoom out"),
        "AttributionControl.ToggleAttribution": t("Map attribution"),
      },
      bounds: SINDH_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      scrollZoom: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      loaded = true;
      map.addSource("routes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": ["match", ["get", "status"], "In Transit", "#1570ef", "#8b8f88"],
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
      setReady(true);
    });
    map.on("error", () => {
      if (!loaded) setFailed(true);
    });
    const timeout = setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 10_000);
    for (const d of DEPOTS) {
      const el = document.createElement("span");
      el.title = tr(d.name);
      el.style.cssText = "width:12px;height:12px;border-radius:3px;background:#111311;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);";
      new Marker({ element: el }).setLngLat([d.lng, d.lat]).addTo(map);
    }
    // The card can grow after the map mounts (grid rows stretch to the tallest card), and MapLibre
    // only sizes its canvas once, so keep it in step with the container.
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(container.current);
    mapRef.current = map;
    return () => {
      resize.disconnect();
      clearTimeout(timeout);
      map.remove();
      mapRef.current = null;
    };
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const m of markers.current) m.remove();
    const maxFamilies = Math.max(1, ...camps.map((c) => c.families));
    markers.current = camps.map((c) => {
      const size = c.status === "Closed" ? 12 : 12 + Math.round((c.families / maxFamilies) * 8);
      const selected = c._id === selectedId;
      // Labels only where they matter, so clustered camps near Sukkur stay readable.
      const showLabel = labels && (selected || (c.status !== "Closed" && c.criticalGaps > 0));
      const el = pinElement(c, size, selected, showLabel);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current?.(c._id);
      });
      return new Marker({ element: el, anchor: showLabel ? "left" : "center", offset: showLabel ? [-size / 2, 0] : [0, 0] }).setLngLat(campCoords(c)).addTo(map);
    });
  }, [camps, selectedId, labels, language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource("routes") as GeoJSONSource | undefined)?.setData(routeData(camps, routes));
  }, [camps, routes, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const focus = focusId ? camps.find((c) => c._id === focusId) : null;
    if (focus) {
      map.jumpTo({ center: campCoords(focus), zoom: 9 });
    } else if (camps.length > 1) {
      const b = new LngLatBounds();
      for (const c of camps) b.extend(campCoords(c));
      for (const d of DEPOTS) b.extend([d.lng, d.lat]);
      map.fitBounds(b, { padding: { top: 40, bottom: 40, left: 40, right: 140 }, animate: false, maxZoom: 8 });
    }
  }, [focusId, camps.length, ready, language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) {
    return (
      <div className="flex items-center justify-center bg-tint" style={{ height }}>
        <div className="h-full max-w-[460px] py-2">
          <CampMap camps={camps} routes={routes} selectedId={selectedId} onSelect={(id) => onSelect?.(id)} />
        </div>
      </div>
    );
  }
  return <div ref={container} data-geographic-map dir="ltr" className="relative w-full bg-tint" style={{ height }} />;
}

export function MapKey() {
  const { t } = useI18n();
  const dot = (color: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full border-2 border-white" style={{ background: color, boxShadow: "0 0 0 1px rgba(17,19,17,.2)" }} />
      {t(label)}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
      {dot("#d92d20", "Critical gap")}
      {dot("#079455", "Open")}
      {dot("#f79009", "Full")}
      {dot("#b9bcb5", "Closed")}
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-ink" /> {t("Depot")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 border-t-2 border-dashed border-info" /> {t("In transit")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 border-t-2 border-dashed border-faint" /> {t("Pending")}
      </span>
    </div>
  );
}
