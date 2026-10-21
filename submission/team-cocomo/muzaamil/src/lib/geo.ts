/**
 * Simplified Sindh geography in [lng, lat]. Hand-traced at roughly 10–20 km
 * accuracy: good for orientation, not for navigation.
 */
export const SINDH_OUTLINE: [number, number][] = [
  [69.58, 28.5], [70.1, 28.25], [70.2, 27.95], [70.6, 27.7], [70.9, 27.3], [70.75, 26.9],
  [70.6, 26.55], [70.15, 26.4], [70.1, 26.1], [70.65, 25.75], [70.95, 25.3], [71.1, 24.7],
  [70.7, 24.3], [70.2, 24.3], [69.7, 24.25], [69.2, 24.0], [68.8, 23.7], [68.2, 23.7],
  [67.6, 23.9], [67.3, 24.4], [66.9, 24.7], [66.7, 25.0], [67.1, 25.4], [67.3, 25.9],
  [67.45, 26.4], [67.3, 26.9], [67.7, 27.4], [67.95, 27.9], [68.3, 28.2], [68.8, 28.25],
  [69.2, 28.4],
];

export const INDUS: [number, number][] = [
  [69.55, 28.45], [69.2, 28.1], [68.86, 27.7], [68.4, 27.3], [68.0, 26.9], [67.95, 26.4],
  [68.2, 25.9], [68.37, 25.39], [68.2, 24.9], [67.9, 24.5], [67.6, 24.0],
];

export const MANCHAR_LAKE: [number, number] = [67.68, 26.42];

export const DEPOTS = [
  { name: "Sukkur depot", lng: 68.86, lat: 27.7 },
  { name: "Hyderabad depot", lng: 68.37, lat: 25.39 },
];

/** Fallback coordinates for camps created without a location. */
export const DISTRICT_COORDS: Record<string, [number, number]> = {
  Larkana: [68.21, 27.56],
  Dadu: [67.78, 26.73],
  Sukkur: [68.86, 27.7],
  Khairpur: [68.76, 27.53],
  Jacobabad: [68.44, 28.28],
  Shikarpur: [68.64, 27.96],
  Kashmore: [69.58, 28.43],
  Ghotki: [69.32, 28.0],
  Kambar: [68.0, 27.59],
  "Qambar Shahdadkot": [68.0, 27.59],
  "Naushahro Feroze": [68.12, 26.84],
  Nawabshah: [68.41, 26.24],
  "Shaheed Benazirabad": [68.41, 26.24],
  Sanghar: [68.95, 26.05],
  Jamshoro: [68.28, 25.43],
  Hyderabad: [68.37, 25.39],
  Matiari: [68.45, 25.6],
  Tando: [68.53, 25.13],
  Mirpurkhas: [69.01, 25.53],
  Umerkot: [69.73, 25.36],
  Tharparkar: [70.2, 24.75],
  Badin: [68.84, 24.65],
  Thatta: [67.92, 24.75],
  Sujawal: [68.08, 24.6],
  Karachi: [67.01, 24.86],
};

export const MAP_CENTER: [number, number] = [68.85, 26.1];

/** Projects lng/lat to the plane the 3D slab sits on (1 unit ≈ 1 degree). */
export function project(lng: number, lat: number): [number, number] {
  return [lng - MAP_CENTER[0], lat - MAP_CENTER[1]];
}

export function campCoords(camp: { lat: number | null; lng: number | null; district: string; name: string }): [number, number] {
  if (camp.lat != null && camp.lng != null) return [camp.lng, camp.lat];
  const known = DISTRICT_COORDS[camp.district];
  if (known) return known;
  // Stable jitter around the centre for unknown districts.
  let h = 0;
  for (const ch of camp.name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return [MAP_CENTER[0] + ((h % 40) - 20) / 40, MAP_CENTER[1] + ((h % 23) - 11) / 20];
}

export function nearestDepot(lng: number, lat: number) {
  return DEPOTS.reduce((best, d) =>
    Math.hypot(d.lng - lng, d.lat - lat) < Math.hypot(best.lng - lng, best.lat - lat) ? d : best,
  );
}
