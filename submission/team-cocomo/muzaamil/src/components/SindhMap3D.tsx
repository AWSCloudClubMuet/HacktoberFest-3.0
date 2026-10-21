import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { pct } from "../lib/format";
import { campCoords, DEPOTS, INDUS, MANCHAR_LAKE, nearestDepot, project, SINDH_OUTLINE } from "../lib/geo";

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

const SLAB_DEPTH = 0.22;
const TOP = SLAB_DEPTH + 0.012;

function colorFor(camp: MapCamp) {
  if (camp.status === "Closed") return "#9A9EAD";
  const r = camp.needsMet ?? 1;
  if (r < 0.4) return "#B3261E";
  if (r < 0.6) return "#C98400";
  return "#1F3A93";
}

/** Plane coordinates → world position on top of the slab. */
const toWorld = (lng: number, lat: number, y = TOP) => {
  const [x, z] = project(lng, lat);
  return new THREE.Vector3(x, y, -z);
};

function Slab() {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    SINDH_OUTLINE.forEach(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: SLAB_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
  const outline = useMemo(
    () => [...SINDH_OUTLINE, SINDH_OUTLINE[0]].map(([lng, lat]) => toWorld(lng, lat, TOP + 0.01)),
    [],
  );
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" color="#FFFFFF" emissive="#E8ECF8" emissiveIntensity={0.55} roughness={0.9} />
        <meshStandardMaterial attach="material-1" color="#1F3A93" roughness={0.6} metalness={0.05} />
      </mesh>
      <Line points={outline} color="#12152B" lineWidth={1.6} />
    </group>
  );
}

function River() {
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(INDUS.map(([lng, lat]) => toWorld(lng, lat, TOP + 0.004)));
    return curve.getPoints(120);
  }, []);
  const lake = toWorld(...MANCHAR_LAKE, TOP + 0.002);
  return (
    <group>
      <Line points={points} color="#8FA4DD" lineWidth={9} transparent opacity={0.75} />
      <Line points={points} color="#1F3A93" lineWidth={2.2} />
      <mesh position={lake} rotation={[-Math.PI / 2, 0, 0.4]} scale={[1.6, 1, 1]}>
        <circleGeometry args={[0.09, 32]} />
        <meshBasicMaterial color="#B9C6EC" />
      </mesh>
    </group>
  );
}

function RouteLine({ from, to, status }: { from: THREE.Vector3; to: THREE.Vector3; status: string }) {
  const ref = useRef<any>(null);
  const points = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 0.25 + from.distanceTo(to) * 0.12;
    return new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(48);
  }, [from, to]);
  useFrame((_, dt) => {
    if (ref.current?.material) ref.current.material.dashOffset -= dt * 0.25;
  });
  return (
    <Line
      ref={ref}
      points={points}
      color={status === "In Transit" ? "#12152B" : "#C98400"}
      lineWidth={2.4}
      dashed
      dashSize={0.06}
      gapSize={0.045}
    />
  );
}

function CampPin({
  camp,
  selected,
  onSelect,
}: {
  camp: MapCamp;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const halo = useRef<THREE.Mesh>(null);
  const [lng, lat] = campCoords(camp);
  const pos = toWorld(lng, lat);
  const color = colorFor(camp);
  const radius = 0.045 + Math.sqrt(Math.max(camp.families, 1)) / 420;
  const critical = camp.criticalGaps > 0 && camp.status !== "Closed";
  const height = camp.status === "Closed" ? 0.05 : 0.12 + (1 - (camp.needsMet ?? 1)) * 0.35;

  useFrame(({ clock }) => {
    if (!halo.current) return;
    const t = (clock.getElapsedTime() % 1.8) / 1.8;
    halo.current.scale.setScalar(1 + t * 1.8);
    (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - t);
  });

  return (
    <group position={pos}>
      {critical && (
        <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[radius * 1.1, radius * 1.5, 40]} />
          <meshBasicMaterial color="#B3261E" transparent depthWrite={false} />
        </mesh>
      )}
      <mesh
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(camp._id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
        castShadow
      >
        <cylinderGeometry args={[radius, radius, height, 28]} />
        <meshStandardMaterial
          color={color}
          transparent={camp.status === "Closed"}
          opacity={camp.status === "Closed" ? 0.55 : 1}
          emissive={selected ? color : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
        />
      </mesh>
      {camp.status === "Full" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <ringGeometry args={[radius * 1.35, radius * 1.6, 40]} />
          <meshBasicMaterial color="#1F3A93" />
        </mesh>
      )}
      {(critical || selected || camp.status === "Full") && (
        <Html position={[0, height + 0.06, 0]} center distanceFactor={7} zIndexRange={[20, 0]}>
          <button
            onClick={() => onSelect(camp._id)}
            className={`-translate-y-3 cursor-pointer whitespace-nowrap rounded-md border-[1.5px] px-2 py-1 text-[12px] font-bold shadow-[0_6px_14px_-8px_#12152B88] ${
              critical ? "border-madder bg-madder text-white" : "border-indigo bg-white text-indigo"
            }`}
          >
            {camp.name.split(" ")[0]}{" "}
            <span className="font-mono text-[11px]">{camp.status === "Full" ? "· Full" : pct(camp.needsMet)}</span>
          </button>
        </Html>
      )}
    </group>
  );
}

function Depots() {
  return (
    <>
      {DEPOTS.map((d) => (
        <group key={d.name} position={toWorld(d.lng, d.lat)}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.09, 0.1, 0.09]} />
            <meshStandardMaterial color="#12152B" />
          </mesh>
          <Html position={[0, 0.16, 0]} center distanceFactor={7} zIndexRange={[10, 0]}>
            <span className="-translate-y-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-bold text-white">{d.name}</span>
          </Html>
        </group>
      ))}
    </>
  );
}

export default function SindhMap3D({
  camps,
  routes,
  selectedId,
  onSelect,
  view,
}: {
  camps: MapCamp[];
  routes: Route[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  view: "3d" | "flat";
}) {
  const campById = useMemo(() => new Map(camps.map((c) => [c._id, c])), [camps]);
  const routeLines = useMemo(
    () =>
      routes.flatMap((r) => {
        const camp = campById.get(r.campId);
        if (!camp) return [];
        const [lng, lat] = campCoords(camp);
        const depot = nearestDepot(lng, lat);
        return [{ id: r._id, status: r.status, from: toWorld(depot.lng, depot.lat), to: toWorld(lng, lat) }];
      }),
    [routes, campById],
  );

  return (
    <Canvas
      key={view}
      shadows
      dpr={[1, 2]}
      camera={{ position: view === "3d" ? [0.4, 7.4, 4.6] : [0, 9.2, 0.001], fov: 38 }}
      onPointerMissed={() => onSelect(null)}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={["#ffffff", "#C9D3F0", 0.4]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.12} />
      </mesh>
      <group position={[-1.25, 0, 0.1]}>
        <Slab />
        <River />
        <Depots />
        {routeLines.map((r) => (
          <RouteLine key={r.id} from={r.from} to={r.to} status={r.status} />
        ))}
        {camps.map((c) => (
          <CampPin key={c._id} camp={c} selected={c._id === selectedId} onSelect={onSelect} />
        ))}
      </group>
      <OrbitControls
        enablePan={false}
        minDistance={4.5}
        maxDistance={14}
        maxPolarAngle={view === "3d" ? Math.PI / 2.6 : 0.01}
        minPolarAngle={0}
        enableRotate={view === "3d"}
        target={[0, 0, 0.3]}
      />
    </Canvas>
  );
}
