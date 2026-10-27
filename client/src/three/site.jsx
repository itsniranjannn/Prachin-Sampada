// Procedural 3D heritage sites. Each site is built from its researched `model` spec (kind, roof tiers, plinth levels,
// guardian sculptures, features and surroundings), using CC0 textures from Poly Haven for brick, tile, timber and stone.
import { createContext, Suspense, useContext, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useTexture, Environment, Lightformer, Bounds, Sparkles } from '@react-three/drei';

const TEX = {
  brick: '/textures/red_brick_03.jpg', herring: '/textures/herringbone_brick.jpg', roof: '/textures/clay_roof_tiles_02.jpg',
  wood: '/textures/dark_wooden_planks.jpg', plaster: '/textures/white_plaster_rough_01.jpg', granite: '/textures/granite_tile.jpg',
  stone: '/textures/stone_tiles.jpg', grass: '/textures/sparse_grass.jpg', rock: '/textures/rock_wall_10.jpg', ochre: '/textures/yellow_plaster.jpg',
};
const FLAG = ['#2f6db5', '#f2efe6', '#c0392b', '#2e8b57', '#e2b33c'];
const GOLD = { color: '#d6a53a', metalness: 0.9, roughness: 0.28 };
const COPPER = { color: '#b8693a', metalness: 0.8, roughness: 0.35 };
const DARKWOOD = '#3a2416';
const STONE = '#e2d8c4';

/* ---------- materials ---------- */
const MatCtx = createContext(null);
function MatProvider({ children }) {
  const t = useTexture(TEX);
  const api = useMemo(() => {
    Object.values(t).forEach((x) => { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 4; });
    const cache = new Map();
    const mat = (key, rx = 1, ry = 1, opts = {}) => {
      const id = `${key}|${rx}|${ry}|${JSON.stringify(opts)}`;
      if (!cache.has(id)) {
        const map = key && t[key] ? t[key].clone() : null;
        if (map) { map.repeat.set(rx, ry); map.needsUpdate = true; }
        cache.set(id, new THREE.MeshStandardMaterial({ map, roughness: 0.92, ...opts }));
      }
      return cache.get(id);
    };
    const plain = (color, opts = {}) => mat(null, 1, 1, { color, ...opts });
    return { mat, plain, gold: plain(GOLD.color, GOLD), copper: plain(COPPER.color, COPPER), dark: plain(DARKWOOD, { roughness: 0.8 }), stone: mat('granite', 1, 1, { color: STONE }) };
  }, [t]);
  return <MatCtx.Provider value={api}>{children}</MatCtx.Provider>;
}
const useM = () => useContext(MatCtx);

function wallMat(M, walls, rx = 2, ry = 1) {
  if (walls === 'white-plaster' || walls === 'whitewashed-stone') return M.mat('plaster', rx, ry, { color: '#ffffff', roughness: 0.75 });
  if (walls === 'ochre-plaster') return M.mat('ochre', rx, ry, { color: '#e6c78f' });
  if (walls === 'stone') return M.mat('granite', rx, ry, { color: STONE });
  if (walls === 'timber') return M.mat('wood', rx, ry, { color: '#8a5a3a' });
  return M.mat('brick', rx, ry, { color: '#f0c2a8' });
}
function roofMat(M, roof) {
  if (roof === 'gilded-copper') return M.gold;
  if (roof === 'copper') return M.copper;
  if (roof === 'slate') return M.mat('rock', 2, 2, { color: '#6f6a66' });
  if (roof === 'thatch') return M.plain('#a8875a');
  if (roof === 'stone-spire') return M.stone;
  if (roof === 'white-dome') return M.mat('plaster', 2, 2, { color: '#f4efe6' });
  return M.mat('roof', 3, 3, { color: '#8a5e4c' });
}

/* ---------- basic shapes ---------- */
const Box = ({ s, p = [0, 0, 0], r, m, cast = true }) => (
  <mesh position={p} rotation={r} material={m} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);
const Cyl = ({ rt, rb = rt, h, p = [0, 0, 0], r, m, seg = 24 }) => (
  <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
    <cylinderGeometry args={[rt, rb, h, seg]} />
  </mesh>
);
const Ball = ({ rad, p = [0, 0, 0], sc, m }) => (
  <mesh position={p} scale={sc} material={m} castShadow>
    <sphereGeometry args={[rad, 20, 14]} />
  </mesh>
);
/** Square pyramid roof spanning w x d, with a slight concave sag like Newar roofs. */
function Roof({ w, d, h, y, m }) {
  const r = Math.max(w, d) * Math.SQRT1_2;
  return (
    <mesh position={[0, y + h / 2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w >= d ? 1 : w / d, 1, w >= d ? d / w : 1]} material={m} castShadow receiveShadow>
      <coneGeometry args={[r, h, 4, 1, false]} />
    </mesh>
  );
}

/** Gilded finial (gajur): bell, stacked umbrellas and a spike. */
function Gajur({ y, s = 1 }) {
  const M = useM();
  return (
    <group position={[0, y, 0]} scale={s}>
      <Cyl rt={0.14} rb={0.2} h={0.14} p={[0, 0.07, 0]} m={M.gold} />
      <Ball rad={0.16} p={[0, 0.28, 0]} m={M.gold} />
      <Cyl rt={0.08} rb={0.13} h={0.12} p={[0, 0.48, 0]} m={M.gold} />
      <Ball rad={0.11} p={[0, 0.62, 0]} m={M.gold} />
      <mesh position={[0, 0.88, 0]} material={M.gold} castShadow><coneGeometry args={[0.06, 0.36, 12]} /></mesh>
    </group>
  );
}

/* ---------- sculpture ---------- */
function Lion({ m }) {
  return (
    <group>
      <Box s={[0.2, 0.18, 0.3]} p={[0, 0.2, -0.02]} m={m} />
      <Ball rad={0.13} p={[0, 0.36, 0.12]} m={m} />
      <Ball rad={0.075} p={[0, 0.4, 0.22]} m={m} />
      {[-0.07, 0.07].map((x) => [0.1, -0.12].map((z) => <Cyl key={`${x}${z}`} rt={0.03} h={0.14} p={[x, 0.07, z]} m={m} seg={8} />))}
    </group>
  );
}
function Elephant({ m }) {
  return (
    <group>
      <Ball rad={0.2} sc={[1, 0.85, 1.35]} p={[0, 0.34, -0.03]} m={m} />
      <Ball rad={0.14} p={[0, 0.42, 0.25]} m={m} />
      <Cyl rt={0.035} rb={0.05} h={0.3} p={[0, 0.26, 0.36]} r={[0.25, 0, 0]} m={m} seg={8} />
      {[-1, 1].map((k) => <Box key={k} s={[0.02, 0.18, 0.15]} p={[k * 0.14, 0.44, 0.22]} m={m} />)}
      {[-0.1, 0.1].map((x) => [0.14, -0.16].map((z) => <Cyl key={`${x}${z}`} rt={0.05} h={0.2} p={[x, 0.1, z]} m={m} seg={8} />))}
    </group>
  );
}
function Wrestler({ m }) {
  return (
    <group>
      {[-0.05, 0.05].map((x) => <Cyl key={x} rt={0.035} h={0.24} p={[x, 0.12, 0]} m={m} seg={8} />)}
      <Box s={[0.18, 0.22, 0.11]} p={[0, 0.35, 0]} m={m} />
      <Ball rad={0.065} p={[0, 0.53, 0]} m={m} />
      <Cyl rt={0.025} h={0.22} p={[0.13, 0.36, 0.04]} r={[0.5, 0, -0.3]} m={m} seg={6} />
      <Cyl rt={0.02} h={0.42} p={[-0.13, 0.36, 0.05]} r={[0.2, 0, 0.15]} m={m} seg={6} />
    </group>
  );
}
function Griffin({ m }) {
  return (
    <group>
      <Lion m={m} />
      {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.2, 0.26]} p={[k * 0.13, 0.36, -0.04]} r={[0, 0, k * 0.5]} m={m} />)}
      <mesh position={[0, 0.4, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={m}><coneGeometry args={[0.04, 0.1, 8]} /></mesh>
    </group>
  );
}
function Goddess({ m }) {
  return (
    <group>
      <Box s={[0.24, 0.12, 0.2]} p={[0, 0.06, 0]} m={m} />
      <Box s={[0.15, 0.2, 0.1]} p={[0, 0.22, 0]} m={m} />
      <Ball rad={0.06} p={[0, 0.38, 0]} m={m} />
      <mesh position={[0, 0.47, 0]} material={m}><coneGeometry args={[0.05, 0.12, 8]} /></mesh>
      {[-1, 1].map((k) => <Cyl key={k} rt={0.02} h={0.18} p={[k * 0.11, 0.24, 0.03]} r={[0, 0, k * 0.6]} m={m} seg={6} />)}
    </group>
  );
}
const GUARDS = [Wrestler, Elephant, Lion, Griffin, Goddess];

function Garuda({ m }) {
  return (
    <group rotation={[0, Math.PI, 0]}>
      <Box s={[0.2, 0.14, 0.16]} p={[0, 0.07, 0]} m={m} />
      <Box s={[0.16, 0.24, 0.12]} p={[0, 0.26, 0.02]} m={m} />
      <Ball rad={0.07} p={[0, 0.44, 0.04]} m={m} />
      <mesh position={[0, 0.43, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={m}><coneGeometry args={[0.03, 0.08, 8]} /></mesh>
      {[-1, 1].map((k) => <Box key={k} s={[0.03, 0.3, 0.2]} p={[k * 0.14, 0.32, -0.05]} r={[0, 0, k * 0.35]} m={m} />)}
    </group>
  );
}
/** Stone pillar with a kneeling Garuda or a gilded king under a cobra hood. */
function PillarStatue({ p, king = false, face = 0 }) {
  const M = useM();
  const top = king ? 3.6 : 2.2;
  return (
    <group position={p} rotation={[0, face, 0]}>
      <Box s={[0.6, 0.3, 0.6]} p={[0, 0.15, 0]} m={M.stone} />
      <Cyl rt={0.11} rb={0.14} h={top} p={[0, 0.3 + top / 2, 0]} m={M.stone} seg={12} />
      <Cyl rt={0.26} rb={0.14} h={0.16} p={[0, 0.38 + top, 0]} m={M.stone} />
      <group position={[0, 0.46 + top, 0]} scale={1.3}>
        {king ? (
          <>
            <Goddess m={M.gold} />
            <mesh position={[0, 0.45, -0.08]} rotation={[0.3, 0, 0]} material={M.gold}><sphereGeometry args={[0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          </>
        ) : <Garuda m={M.stone} />}
      </group>
    </group>
  );
}
function BellPavilion({ p, s = 1 }) {
  const M = useM();
  return (
    <group position={p} scale={s}>
      <Box s={[1.6, 0.35, 0.8]} p={[0, 0.17, 0]} m={M.stone} />
      {[-0.6, 0.6].map((x) => <Box key={x} s={[0.16, 1.5, 0.16]} p={[x, 1.1, 0]} m={M.stone} />)}
      <Box s={[1.5, 0.12, 0.2]} p={[0, 1.9, 0]} m={M.dark} />
      <mesh position={[0, 1.45, 0]} material={M.plain('#6b5a3a', { metalness: 0.7, roughness: 0.4 })} castShadow>
        <latheGeometry args={[[new THREE.Vector2(0.02, 0.36), new THREE.Vector2(0.16, 0.34), new THREE.Vector2(0.22, 0.1), new THREE.Vector2(0.3, -0.1), new THREE.Vector2(0.3, -0.14)], 24]} />
      </mesh>
      <Roof w={1.9} d={1.1} h={0.45} y={1.96} m={roofMat(M, 'clay-tile')} />
      <Gajur y={2.4} s={0.5} />
    </group>
  );
}
function Nandi({ p, gold, face = 0 }) {
  const M = useM();
  const m = gold ? M.gold : M.stone;
  return (
    <group position={p} rotation={[0, face, 0]} scale={1.6}>
      <Box s={[0.5, 0.12, 0.7]} p={[0, 0.06, 0]} m={M.stone} />
      <Ball rad={0.2} sc={[1, 0.8, 1.6]} p={[0, 0.3, 0]} m={m} />
      <Ball rad={0.1} p={[0, 0.48, -0.05]} m={m} />
      <Ball rad={0.11} sc={[0.9, 1, 1.2]} p={[0, 0.48, 0.32]} m={m} />
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.07, 0.6, 0.3]} rotation={[0, 0, k * -0.5]} material={m}><coneGeometry args={[0.02, 0.1, 6]} /></mesh>)}
    </group>
  );
}
function Lingam({ p }) {
  const M = useM();
  return (
    <group position={p}>
      <Cyl rt={0.4} rb={0.45} h={0.18} p={[0, 0.09, 0]} m={M.stone} />
      <Box s={[0.14, 0.08, 0.36]} p={[0, 0.14, 0.42]} m={M.stone} />
      <mesh position={[0, 0.42, 0]} material={M.plain('#3d3a38', { roughness: 0.5 })} castShadow><capsuleGeometry args={[0.15, 0.28, 6, 14]} /></mesh>
    </group>
  );
}
function Trident({ p, h = 2 }) {
  const M = useM();
  return (
    <group position={p}>
      <Cyl rt={0.03} h={h} p={[0, h / 2, 0]} m={M.plain('#8a8580', { metalness: 0.8, roughness: 0.3 })} seg={8} />
      {[-0.16, 0, 0.16].map((x) => <mesh key={x} position={[x, h + (x ? 0.12 : 0.2), 0]} material={M.plain('#8a8580', { metalness: 0.8, roughness: 0.3 })}><coneGeometry args={[0.035, x ? 0.28 : 0.42, 6]} /></mesh>)}
      <Box s={[0.36, 0.04, 0.04]} p={[0, h, 0]} m={M.plain('#8a8580', { metalness: 0.8 })} />
      <Box s={[0.22, 0.14, 0.01]} p={[0.14, h - 0.3, 0]} m={M.plain('#b3202a')} />
    </group>
  );
}
function Chaitya({ p, s = 1 }) {
  const M = useM();
  return (
    <group position={p} scale={s}>
      <Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={M.stone} />
      <mesh position={[0, 0.3, 0]} material={M.stone} castShadow><sphereGeometry args={[0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <Box s={[0.16, 0.12, 0.16]} p={[0, 0.58, 0]} m={M.stone} />
      <mesh position={[0, 0.8, 0]} material={M.gold}><coneGeometry args={[0.08, 0.36, 10]} /></mesh>
    </group>
  );
}
function Tree({ p, s = 1, kind = 'broad' }) {
  const M = useM();
  const leaf = M.plain(kind === 'pine' ? '#2f4a32' : '#4d6b38', { roughness: 1 });
  return (
    <group position={p} scale={s}>
      <Cyl rt={0.1} rb={0.16} h={1.2} p={[0, 0.6, 0]} m={M.plain('#5a4030')} seg={8} />
      {kind === 'pine'
        ? [0, 1, 2].map((i) => <mesh key={i} position={[0, 1.2 + i * 0.5, 0]} material={leaf} castShadow><coneGeometry args={[0.8 - i * 0.2, 1, 9]} /></mesh>)
        : [[0, 1.6, 0, 0.75], [0.45, 1.35, 0.2, 0.55], [-0.4, 1.4, -0.2, 0.6], [0.1, 2, -0.2, 0.5]].map(([x, y, z, r], i) => <Ball key={i} rad={r} p={[x, y, z]} m={leaf} />)}
    </group>
  );
}
/** Peepal or banyan on its stone chautara platform. */
function SacredTree({ p }) {
  const M = useM();
  return (
    <group position={p}>
      <Box s={[2.2, 0.4, 2.2]} p={[0, 0.2, 0]} m={M.stone} />
      <Tree p={[0, 0.4, 0]} s={1.5} />
    </group>
  );
}
function Diyo({ p, light }) {
  const M = useM();
  return (
    <group position={p}>
      <Cyl rt={0.07} rb={0.04} h={0.04} p={[0, 0.02, 0]} m={M.plain('#8b4a2a')} seg={10} />
      <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.025, 0.08, 8]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
      {light && <pointLight position={[0, 0.2, 0]} intensity={1.6} distance={2.6} color="#ffb35a" />}
    </group>
  );
}
function PrayerFlags({ from, to, n = 18 }) {
  const pts = useMemo(() => Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const sag = Math.sin(t * Math.PI) * 0.6;
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - sag, from[2] + (to[2] - from[2]) * t];
  }), [from, to, n]);
  const ang = Math.atan2(to[0] - from[0], to[2] - from[2]);
  return (
    <group>
      {pts.map((q, i) => (
        <mesh key={i} position={[q[0], q[1] - 0.1, q[2]]} rotation={[0, ang + Math.PI / 2, 0]}>
          <planeGeometry args={[0.18, 0.2]} />
          <meshStandardMaterial color={FLAG[i % 5]} side={THREE.DoubleSide} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
function PrayerWheels({ radius, y = 0, n = 24 }) {
  const M = useM();
  return (
    <group position={[0, y, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
            <Cyl rt={0.09} h={0.26} p={[0, 0.55, 0]} m={M.plain('#9c2a20', { roughness: 0.6 })} seg={10} />
            <Cyl rt={0.095} h={0.04} p={[0, 0.69, 0]} m={M.gold} seg={10} />
            <Cyl rt={0.02} h={0.42} p={[0, 0.21, 0]} m={M.dark} seg={6} />
          </group>
        );
      })}
    </group>
  );
}
function eyesTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 192;
  const g = c.getContext('2d');
  g.fillStyle = '#f2e6c8'; g.fillRect(0, 0, 256, 192);
  g.strokeStyle = '#1b1b2b'; g.fillStyle = '#1b1b2b'; g.lineWidth = 7; g.lineCap = 'round';
  for (const x of [72, 184]) {
    g.beginPath(); g.moveTo(x - 46, 66); g.quadraticCurveTo(x, 34, x + 46, 66); g.stroke();
    g.beginPath(); g.moveTo(x - 42, 98); g.quadraticCurveTo(x, 70, x + 42, 98); g.quadraticCurveTo(x, 116, x - 42, 98); g.fillStyle = '#fff'; g.fill(); g.stroke();
    g.beginPath(); g.arc(x, 94, 13, 0, Math.PI * 2); g.fillStyle = '#2b4f8a'; g.fill();
    g.beginPath(); g.arc(x, 94, 6, 0, Math.PI * 2); g.fillStyle = '#111'; g.fill();
  }
  g.beginPath(); g.moveTo(128, 110); g.quadraticCurveTo(116, 132, 132, 140); g.quadraticCurveTo(144, 150, 124, 164); g.lineWidth = 6; g.strokeStyle = '#1b1b2b'; g.stroke();
  g.beginPath(); g.arc(128, 54, 7, 0, Math.PI * 2); g.fillStyle = '#b3202a'; g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- plinth with stairs and guardians ---------- */
function Plinth({ steps, shape = 'square', w, d, m, guards, stairs = true }) {
  const M = useM();
  if (!steps) return null;
  const h = 0.34;
  const out = [];
  const lvl = (i) => ({ w: w + 0.9 + (steps - 1 - i) * 0.85, d: d + 0.9 + (steps - 1 - i) * 0.85 });
  for (let i = 0; i < steps; i += 1) {
    const { w: lw, d: ld } = lvl(i);
    const y = i * h + h / 2;
    if (shape === 'round' || shape === 'octagonal') {
      out.push(<Cyl key={`p${i}`} rt={lw / 2} h={h} p={[0, y, 0]} m={m} seg={shape === 'round' ? 48 : 8} />);
    } else {
      out.push(<Box key={`p${i}`} s={[lw, h, ld]} p={[0, y, 0]} m={m} />);
      out.push(<Box key={`c${i}`} s={[lw + 0.04, 0.05, ld + 0.04]} p={[0, y + h / 2 - 0.02, 0]} m={M.stone} />);
    }
  }
  if (stairs) {
    const bottom = lvl(0).d / 2;
    const top = lvl(steps - 1).d / 2;
    const n = steps * 3;
    const run = bottom + 0.9 - top;
    for (let k = 0; k < n; k += 1) {
      out.push(<Box key={`s${k}`} s={[0.95, (k + 1) * (steps * h / n), run / n + 0.02]} p={[0, ((k + 1) * (steps * h / n)) / 2, bottom + 0.9 - (k + 0.5) * (run / n)]} m={M.stone} />);
    }
    if (guards) {
      for (let i = 0; i < steps; i += 1) {
        const G = GUARDS[Math.min(i, GUARDS.length - 1)];
        const z = lvl(i).d / 2 - 0.05 + (i === steps - 1 ? 0 : 0.15);
        const y = (i + 1) * h;
        const zz = bottom + 0.9 - ((i + 1) / steps) * run + 0.2;
        out.push(<group key={`g${i}l`} position={[-0.62, y, Math.min(z, zz)]}><G m={M.stone} /></group>);
        out.push(<group key={`g${i}r`} position={[0.62, y, Math.min(z, zz)]}><G m={M.stone} /></group>);
      }
    }
  }
  return <group>{out}</group>;
}

/* ---------- building kinds ---------- */
function PagodaBody({ tiers = 3, w = 2.6, d = 2.6, y0 = 0, walls, roof, f, small = false }) {
  const M = useM();
  const out = [];
  let y = y0;
  let ww = w;
  let dd = d;
  const rm = roofMat(M, roof);
  for (let i = 0; i < tiers; i += 1) {
    const wallH = i === 0 ? (small ? 0.9 : 1.25) : 0.62;
    out.push(<Box key={`w${i}`} s={[ww, wallH, dd]} p={[0, y + wallH / 2, 0]} m={wallMat(M, walls, ww / 1.2, wallH / 0.6)} />);
    out.push(<Box key={`b${i}`} s={[ww + 0.06, 0.08, dd + 0.06]} p={[0, y + wallH - 0.04, 0]} m={M.dark} />);
    if (i === 0) {
      out.push(<Box key="door" s={[0.62, 0.86, 0.06]} p={[0, y + 0.43, dd / 2 + 0.01]} m={f.has('golden-door') ? M.gold : M.dark} />);
      out.push(<mesh key="torana" position={[0, y + 0.92, dd / 2 + 0.03]} material={M.gold}><torusGeometry args={[0.32, 0.04, 8, 24, Math.PI]} /></mesh>);
      if (f.has('carved-windows')) [-1, 1].forEach((k) => out.push(<Box key={`cw${k}`} s={[0.42, 0.42, 0.06]} p={[k * ww * 0.3, y + 0.6, dd / 2 + 0.01]} m={M.dark} />));
    } else {
      [[0, dd / 2 + 0.01, 0], [ww / 2 + 0.01, 0, Math.PI / 2], [0, -dd / 2 - 0.01, 0], [-ww / 2 - 0.01, 0, Math.PI / 2]].forEach(([x, z, ry], k) => out.push(
        <Box key={`win${i}${k}`} s={[0.36, 0.3, 0.05]} p={[x, y + wallH * 0.5, z]} r={[0, ry, 0]} m={M.dark} />,
      ));
    }
    const o = 0.42 + 0.08 * (tiers - i);
    const rw = ww + 2 * o;
    const rd = dd + 2 * o;
    const rh = 0.5 + 0.04 * (tiers - i);
    if (f.has('carved-struts') || !small) {
      const n = 3;
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz], side) => {
        for (let k = 0; k < n; k += 1) {
          const t = (k - (n - 1) / 2) / n;
          const x = sx ? sx * (ww / 2 + 0.16) : t * ww * 1.1;
          const z = sz ? sz * (dd / 2 + 0.16) : t * dd * 1.1;
          out.push(<Box key={`st${i}-${side}-${k}`} s={[0.07, 0.6, 0.07]} p={[x, y + wallH + 0.02, z]} r={[sz * 0.6, 0, -sx * 0.6]} m={M.dark} />);
        }
      });
    }
    out.push(<Roof key={`r${i}`} w={rw} d={rd} h={rh} y={y + wallH - 0.05} m={rm} />);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], k) => out.push(
      <mesh key={`bell${i}${k}`} position={[sx * rw / 2 * 0.96, y + wallH - 0.14, sz * rd / 2 * 0.96]} material={M.gold}><coneGeometry args={[0.05, 0.14, 8]} /></mesh>,
    ));
    y += wallH + rh * 0.6;
    ww *= 0.72;
    dd *= 0.72;
  }
  out.push(<Gajur key="g" y={y - 0.05} s={small ? 0.7 : 1} />);
  if (roof === 'gilded-copper' || f.has('toran')) out.push(<Box key="pataka" s={[0.06, 1.6, 0.02]} p={[0, y0 + 1.4 + tiers * 0.7, d / 2 + 0.9]} m={M.gold} />);
  return <group>{out}</group>;
}

function StupaBody({ y0 = 0, scale = 1, f, colors }) {
  const M = useM();
  const eyes = useMemo(() => eyesTexture(), []);
  const grass = colors?.[0] && /^#[4-7][0-9a-f]8/i.test(colors[0]);
  const domeMat = grass ? M.mat('grass', 3, 3, { color: '#7a9a50' }) : M.mat('plaster', 3, 2, { color: '#ffffff', roughness: 0.75 });
  const harm = new THREE.MeshStandardMaterial({ map: eyes, roughness: 0.8 });
  const plain = M.plain('#d9b55a', { metalness: 0.6, roughness: 0.35 });
  return (
    <group position={[0, y0, 0]} scale={scale}>
      <Cyl rt={2.3} h={0.3} p={[0, 0.15, 0]} m={M.mat('plaster', 4, 1, { color: '#efe8da' })} seg={48} />
      <mesh position={[0, 0.3, 0]} material={domeMat} castShadow receiveShadow scale={[1, 0.82, 1]}><sphereGeometry args={[2.05, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <Box s={[0.95, 0.12, 0.95]} p={[0, 2.0, 0]} m={plain} />
      <mesh position={[0, 2.46, 0]} castShadow material={[plain, plain, plain, plain, harm, harm]}><boxGeometry args={[0.85, 0.8, 0.85]} /></mesh>
      <mesh position={[0, 2.46, 0]} rotation={[0, Math.PI / 2, 0]} material={[plain, plain, plain, plain, harm, harm]}><boxGeometry args={[0.851, 0.8, 0.851]} /></mesh>
      <Box s={[1.05, 0.1, 1.05]} p={[0, 2.9, 0]} m={M.gold} />
      {Array.from({ length: 13 }, (_, i) => <Cyl key={i} rt={0.42 - i * 0.025} rb={0.45 - i * 0.025} h={0.12} p={[0, 3.02 + i * 0.13, 0]} m={M.gold} />)}
      <mesh position={[0, 4.85, 0]} material={M.gold} castShadow><coneGeometry args={[0.42, 0.22, 24]} /></mesh>
      <Gajur y={4.92} s={0.8} />
      {f.has('prayer-flags') && [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
        const a = (k / 8) * Math.PI * 2 + 0.3;
        return <PrayerFlags key={k} from={[0, 4.9, 0]} to={[Math.cos(a) * 5.2, 0.3, Math.sin(a) * 5.2]} />;
      })}
      {f.has('prayer-wheels') && <PrayerWheels radius={2.75} />}
      {f.has('chaityas') && [0, 1, 2, 3].map((k) => <Chaitya key={k} p={[Math.cos(k * Math.PI / 2 + Math.PI / 4) * 3.3, 0, Math.sin(k * Math.PI / 2 + Math.PI / 4) * 3.3]} s={0.9} />)}
    </group>
  );
}

function spireGeometry(r0, h, seg = 4) {
  const pts = [];
  for (let i = 0; i <= 14; i += 1) {
    const t = i / 14;
    pts.push(new THREE.Vector2(Math.max(0.02, r0 * (1 - t ** 1.7) * (1 + 0.08 * Math.sin(t * Math.PI))), t * h));
  }
  return new THREE.LatheGeometry(pts, seg);
}
function Spire({ r0, h, y, m, x = 0, z = 0 }) {
  const M = useM();
  const geo = useMemo(() => spireGeometry(r0, h), [r0, h]);
  return (
    <group position={[x, y, z]}>
      <mesh geometry={geo} rotation={[0, Math.PI / 4, 0]} material={m} castShadow receiveShadow />
      <Cyl rt={r0 * 0.22} h={r0 * 0.1} p={[0, h * 0.97, 0]} m={m} seg={16} />
      <mesh position={[0, h * 1.03, 0]} material={M.gold}><coneGeometry args={[r0 * 0.1, r0 * 0.4, 10]} /></mesh>
    </group>
  );
}
function ShikharaBody({ tiers = 1, y0 = 0, walls, f }) {
  const M = useM();
  const m = wallMat(M, walls === 'red-brick' ? 'red-brick' : 'stone', 2, 2);
  const out = [];
  let y = y0;
  let w = 2.6;
  const levels = Math.max(1, Math.min(3, tiers));
  for (let i = 0; i < levels; i += 1) {
    const hh = 0.95;
    out.push(<Box key={`core${i}`} s={[w * 0.62, hh, w * 0.62]} p={[0, y + hh / 2, 0]} m={m} />);
    if (levels > 1) {
      const pr = w / 2;
      for (let k = -2; k <= 2; k += 1) {
        [[k * pr / 2, pr], [k * pr / 2, -pr], [pr, k * pr / 2], [-pr, k * pr / 2]].forEach(([x, z], s) => out.push(<Box key={`col${i}${k}${s}`} s={[0.09, hh, 0.09]} p={[x, y + hh / 2, z]} m={m} />));
      }
      out.push(<Box key={`slab${i}`} s={[w + 0.14, 0.12, w + 0.14]} p={[0, y + hh + 0.06, 0]} m={m} />);
      [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz], k) => out.push(
        <Spire key={`ms${i}${k}`} r0={0.2} h={0.75} y={y + hh + 0.12} x={sx * (w / 2 - 0.12)} z={sz * (w / 2 - 0.12)} m={m} />,
      ));
    }
    y += hh + 0.12;
    w *= 0.74;
  }
  out.push(<Spire key="main" r0={w * 0.55} h={2.6 + levels * 0.3} y={y} m={m} />);
  if (f.has('idol-visible') && walls === 'red-brick') out.push(<Box key="tiles" s={[w * 1.12, 0.6, w * 1.12]} p={[0, y + 0.3, 0]} m={M.mat('brick', 3, 1, { color: '#b5683f' })} />);
  return <group>{out}</group>;
}

function PalaceBody({ w = 8, d = 2.6, storeys = 3, walls, roof, f, p = [0, 0, 0], r = 0, windowsRow = true }) {
  const M = useM();
  const out = [];
  const sh = 0.95;
  const wm = wallMat(M, walls, w / 1.4, storeys);
  out.push(<Box key="body" s={[w, sh * storeys, d]} p={[0, (sh * storeys) / 2, 0]} m={wm} />);
  const n = Math.max(3, Math.floor(w / 0.75));
  for (let s = 0; s < storeys; s += 1) {
    for (let k = 0; k < n; k += 1) {
      const x = -w / 2 + (k + 0.5) * (w / n);
      const top = s === storeys - 1 && windowsRow;
      out.push(<Box key={`win${s}-${k}`} s={[top ? w / n - 0.06 : 0.36, top ? 0.5 : 0.42, 0.06]} p={[x, s * sh + sh * 0.55, d / 2 + 0.02]} m={M.dark} />);
      if (top && f.has('carved-windows')) out.push(<Box key={`lat${s}-${k}`} s={[0.03, 0.5, 0.08]} p={[x, s * sh + sh * 0.55, d / 2 + 0.03]} m={M.plain('#6b4a2a')} />);
    }
    out.push(<Box key={`band${s}`} s={[w + 0.04, 0.06, d + 0.04]} p={[0, (s + 1) * sh - 0.03, 0]} m={M.dark} />);
  }
  if (f.has('golden-door')) {
    out.push(<Box key="gd" s={[0.7, 1.05, 0.08]} p={[-w * 0.3, 0.52, d / 2 + 0.03]} m={M.gold} />);
    out.push(<mesh key="gt" position={[-w * 0.3, 1.12, d / 2 + 0.05]} material={M.gold}><torusGeometry args={[0.42, 0.06, 8, 24, Math.PI]} /></mesh>);
  }
  if (roof === 'flat') {
    out.push(<Box key="slab" s={[w + 0.2, 0.16, d + 0.2]} p={[0, sh * storeys + 0.08, 0]} m={wm} />);
    out.push(<Box key="top" s={[w * 0.35, sh * 0.8, d * 0.6]} p={[0, sh * storeys + 0.16 + sh * 0.4, 0]} m={wm} />);
    if (f.has('gilded-pinnacle')) out.push(<Gajur key="gj" y={sh * storeys + 0.16 + sh * 0.8} s={0.7} />);
  } else out.push(<Roof key="roof" w={w + 0.7} d={d + 0.9} h={0.8} y={sh * storeys - 0.04} m={roofMat(M, roof)} />);
  return <group position={p} rotation={[0, r, 0]}>{out}</group>;
}

function DomeTemple({ walls, colors, f }) {
  const M = useM();
  const wm = wallMat(M, walls || 'white-plaster', 3, 2);
  const accent = M.plain(colors?.[1] || '#e2b33c', { roughness: 0.6 });
  const arches = (w, y, z, n) => Array.from({ length: n }, (_, k) => {
    const x = -w / 2 + (k + 0.5) * (w / n);
    return (
      <group key={`${y}${k}`} position={[x, y, z]}>
        <Box s={[0.32, 0.55, 0.05]} p={[0, 0, 0]} m={M.dark} />
        <mesh position={[0, 0.27, 0]} material={M.dark}><circleGeometry args={[0.16, 16, 0, Math.PI]} /></mesh>
      </group>
    );
  });
  const Chhatri = ({ p, s = 1 }) => (
    <group position={p} scale={s}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.04} h={0.5} p={[a * 0.2, 0.25, b * 0.2]} m={wm} seg={8} />)}
      <mesh position={[0, 0.5, 0]} material={wm} castShadow><sphereGeometry args={[0.32, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, 0.9, 0]} material={M.gold}><coneGeometry args={[0.05, 0.22, 8]} /></mesh>
    </group>
  );
  return (
    <group>
      <Box s={[7.6, 1.7, 4.4]} p={[0, 0.85, 0]} m={wm} />
      {arches(7, 0.85, 2.23, 9)}
      <Box s={[7.8, 0.12, 4.6]} p={[0, 1.76, 0]} m={accent} />
      <Box s={[5.6, 1.3, 3.4]} p={[0, 2.45, 0]} m={wm} />
      {arches(5, 2.45, 1.73, 7)}
      <Cyl rt={1.0} h={0.5} p={[0, 3.35, 0]} m={wm} seg={32} />
      <mesh position={[0, 3.6, 0]} material={wm} castShadow><sphereGeometry args={[1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <Gajur y={4.6} s={0.8} />
      {[[-3.7, -2.1], [3.7, -2.1], [-3.7, 2.1], [3.7, 2.1]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <Cyl rt={0.36} rb={0.42} h={3.6} p={[0, 1.8, 0]} m={wm} seg={12} />
          {[1.2, 2.4].map((yy) => <Cyl key={yy} rt={0.46} h={0.08} p={[0, yy, 0]} m={accent} seg={12} />)}
          <Chhatri p={[0, 3.6, 0]} s={1.1} />
        </group>
      ))}
      {[-2, -0.7, 0.7, 2].map((x) => <Chhatri key={x} p={[x, 3.1, 1.6]} s={0.7} />)}
      {f.has('flags-red') && <Trident p={[0, 0, 3.4]} h={1.6} />}
    </group>
  );
}

function Gumba({ f, colors }) {
  const M = useM();
  const wm = M.mat('plaster', 3, 2, { color: '#ffffff', roughness: 0.75 });
  const band = M.plain(colors?.[1] && colors[1] !== '#f5f2ea' ? colors[1] : '#7a1f1f', { roughness: 0.9 });
  return (
    <group>
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 1]} material={wm} castShadow receiveShadow><cylinderGeometry args={[2.1, 2.5, 2.8, 4]} /></mesh>
      <mesh position={[0, 2.95, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.6, 1, 1]} material={band} castShadow><cylinderGeometry args={[2.2, 2.12, 0.42, 4]} /></mesh>
      {[-1.6, -0.55, 0.55, 1.6].map((x) => (
        <group key={x} position={[x, 1.7, 1.54]}>
          <mesh rotation={[0.12, 0, 0]} material={M.plain('#1b1b1b')}><cylinderGeometry args={[0.18, 0.24, 0.55, 4, 1, false, Math.PI / 4]} /></mesh>
        </group>
      ))}
      <Box s={[1.1, 1.3, 0.1]} p={[0, 0.65, 1.86]} m={M.plain('#7a1f1f')} />
      <Roof w={1.8} d={1.8} h={0.7} y={3.1} m={M.gold} />
      <Gajur y={3.75} s={0.7} />
      {[[-2.6, -1.4], [2.6, -1.4], [-2.6, 1.4], [2.6, 1.4]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x * 0.92, 3.15, z * 0.92]}>
          <Cyl rt={0.11} h={0.5} p={[0, 0.25, 0]} m={M.plain('#1b1b1b')} seg={10} />
          <mesh position={[0, 0.6, 0]} material={M.gold}><coneGeometry args={[0.09, 0.22, 10]} /></mesh>
        </group>
      ))}
      {f.has('prayer-flags') && [[-5, 0.2, -3], [5, 0.2, -3], [-5, 0.2, 3], [5, 0.2, 3]].map((to, k) => <PrayerFlags key={k} from={[0, 3.6, 0]} to={to} n={20} />)}
      {f.has('prayer-wheels') && <group position={[0, 0, 0]}>{Array.from({ length: 10 }, (_, k) => <group key={k} position={[-2.25 + k * 0.5, 0, 2.4]}><Cyl rt={0.1} h={0.3} p={[0, 0.55, 0]} m={M.plain('#9c2a20')} seg={10} /><Cyl rt={0.02} h={0.4} p={[0, 0.2, 0]} m={M.dark} seg={6} /></group>)}</group>}
    </group>
  );
}

function Pond({ w = 9, d = 5, f }) {
  const M = useM();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#3d6a6a" metalness={0.35} roughness={0.12} />
      </mesh>
      {[[0, d / 2 + 0.15, w + 0.6, 0.3], [0, -d / 2 - 0.15, w + 0.6, 0.3]].map(([x, z, ww, dd], k) => <Box key={k} s={[ww, 0.35, dd]} p={[x, -0.05, z]} m={M.stone} />)}
      {[[w / 2 + 0.15, 0], [-w / 2 - 0.15, 0]].map(([x, z], k) => <Box key={`e${k}`} s={[0.3, 0.35, d]} p={[x, -0.05, z]} m={M.stone} />)}
      {f.has('ghat-steps') && [0, 1, 2].map((k) => <Box key={`gs${k}`} s={[2.4, 0.12, 0.3]} p={[0, -0.12 * k, d / 2 - 0.15 - k * 0.3]} m={M.stone} />)}
      {f.has('idol-visible') && (
        <group>
          <Box s={[1.6, 0.4, 1.6]} p={[0, -0.05, 0]} m={M.stone} />
          <ShikharaBody tiers={1} y0={0.15} walls="white-plaster" f={new Set()} />
          <Box s={[0.6, 0.18, d / 2]} p={[0, -0.05, d / 4]} m={M.stone} />
        </group>
      )}
      {f.has('elephant-statues') && <group position={[1.2, 0.05, 0.4]} scale={1.6}><Elephant m={M.stone} /></group>}
    </group>
  );
}

function Gate({ f }) {
  const M = useM();
  return (
    <group>
      <Box s={[9, 2.6, 0.7]} p={[0, 1.3, 0]} m={wallMat(M, 'red-brick', 6, 2)} />
      <Box s={[9.2, 0.12, 0.9]} p={[0, 2.66, 0]} m={M.dark} />
      <Box s={[1.4, 1.9, 0.1]} p={[0, 0.95, 0.38]} m={M.gold} />
      <Box s={[0.9, 1.5, 0.12]} p={[0, 0.75, 0.42]} m={M.dark} />
      <mesh position={[0, 2.05, 0.4]} material={M.gold}><circleGeometry args={[0.72, 32, 0, Math.PI]} /></mesh>
      <mesh position={[0, 2.05, 0.43]} material={M.gold}><torusGeometry args={[0.8, 0.07, 8, 32, Math.PI]} /></mesh>
      <group position={[0, 2.25, 0.46]} scale={1.1}><Goddess m={M.gold} /></group>
      <Roof w={2.6} d={1.4} h={0.6} y={2.68} m={roofMat(M, 'clay-tile')} />
      <Gajur y={3.25} s={0.6} />
    </group>
  );
}

function Fort({ tiers = 5, walls, roof, f }) {
  const M = useM();
  const wm = wallMat(M, walls || 'stone', 6, 1);
  const s = 9;
  return (
    <group>
      {[[0, s / 2, s, 0.5], [0, -s / 2, s, 0.5]].map(([x, z, w, d], k) => <Box key={k} s={[w, 1.5, d]} p={[x, 0.75, z]} m={wm} />)}
      {[[s / 2, 0], [-s / 2, 0]].map(([x, z], k) => <Box key={`v${k}`} s={[0.5, 1.5, s]} p={[x, 0.75, z]} m={wm} />)}
      {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => (
        <group key={`${a}${b}`} position={[a * s / 2, 0, b * s / 2]}>
          <Box s={[1.2, 2.4, 1.2]} p={[0, 1.2, 0]} m={wm} />
          <Roof w={1.6} d={1.6} h={0.6} y={2.4} m={roofMat(M, roof)} />
        </group>
      ))}
      <Box s={[1.4, 1.2, 0.6]} p={[0, 0.6, s / 2]} m={M.dark} />
      <group position={[0, 0, -0.6]}>
        <PagodaBody tiers={Math.min(Math.max(tiers, 3), 7)} w={3} d={3} walls={walls === 'stone' ? 'red-brick' : walls} roof={roof} f={f} />
      </group>
    </group>
  );
}

function Cave({ f }) {
  const M = useM();
  return (
    <group>
      <mesh position={[0, 1.3, -1.2]} scale={[4.2, 2.4, 2.8]} material={M.mat('rock', 3, 2, { color: '#8a8070' })} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 2]} />
      </mesh>
      <mesh position={[0, 0.02, 1.62]} rotation={[-0.32, 0, 0]}><circleGeometry args={[1.05, 32, 0, Math.PI]} /><meshBasicMaterial color="#0d0a08" side={THREE.DoubleSide} /></mesh>
      <Box s={[1.7, 0.1, 0.9]} p={[0, 0.05, 1.9]} m={M.stone} />
      {[0, 1, 2, 3].map((k) => <Box key={k} s={[1.4 - k * 0.1, 0.16, 0.36]} p={[0, 0.08 + k * 0.0, 2.6 + k * 0.36]} m={M.stone} />)}
      <Trident p={[-1.2, 0, 1.9]} h={1.6} />
      {[-0.7, 0.7].map((x) => <group key={x} position={[x, 1.6, 1.6]}><Cyl rt={0.08} rb={0.12} h={0.18} m={M.gold} p={[0, 0, 0]} /></group>)}
      <PrayerFlags from={[-2.6, 2.4, 1.2]} to={[2.6, 2.4, 1.2]} n={16} />
    </group>
  );
}

function Ruins() {
  const M = useM();
  const walls = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const r = Math.sin(i * 12.9898) * 43758.5453;
    const f = r - Math.floor(r);
    return { x: -4 + (i % 4) * 2.6, z: -3 + Math.floor(i / 4) * 2, h: 0.2 + f * 0.6, w: 1.6 + f, rot: (i % 2) * Math.PI / 2 };
  }), []);
  return (
    <group>
      {walls.map((w, i) => <Box key={i} s={[w.w, w.h, 0.35]} p={[w.x, w.h / 2, w.z]} r={[0, w.rot, 0]} m={wallMat(M, 'red-brick', 1, 0.4)} />)}
      <Box s={[2.8, 1.4, 0.8]} p={[0, 0.7, 3.4]} m={wallMat(M, 'red-brick', 2, 1)} />
      <Box s={[1, 1.1, 0.9]} p={[0, 0.55, 3.4]} m={M.plain('#2a1d15')} />
    </group>
  );
}

function AshokaPillar({ f }) {
  const M = useM();
  return (
    <group>
      <Box s={[1.4, 0.3, 1.4]} p={[0, 0.15, 0]} m={M.stone} />
      <Cyl rt={0.24} rb={0.3} h={5.2} p={[0, 2.9, 0]} m={M.mat('granite', 1, 4, { color: '#cdb894', roughness: 0.5 })} seg={24} />
      {f.has('fence-railing') && Array.from({ length: 16 }, (_, k) => {
        const a = (k / 16) * Math.PI * 2;
        return <Cyl key={k} rt={0.04} h={0.9} p={[Math.cos(a) * 1.8, 0.45, Math.sin(a) * 1.8]} m={M.plain('#5a4a3a', { metalness: 0.4 })} seg={6} />;
      })}
      {f.has('fence-railing') && <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.plain('#5a4a3a', { metalness: 0.4 })}><torusGeometry args={[1.8, 0.03, 6, 48]} /></mesh>}
    </group>
  );
}

/* ---------- surroundings ---------- */
function House({ p, r = 0, h = 2.4, w = 1.8, d = 1.6, plaster = false, M }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box s={[w, h, d]} p={[0, h / 2, 0]} m={plaster ? M.mat('plaster', 1, 1, { color: '#efe4cf' }) : wallMat(M, 'red-brick', w / 1.4, h / 1.2)} />
      {Array.from({ length: Math.floor(h / 0.8) }, (_, s) => [-0.45, 0.45].map((x) => <Box key={`${s}${x}`} s={[0.28, 0.32, 0.04]} p={[x * w / 1.8, 0.55 + s * 0.8, d / 2 + 0.02]} m={M.dark} />))}
      <mesh position={[0, h + 0.28, 0]} rotation={[0, 0, 0]} scale={[w / 1.8 + 0.15, 1, d / 1.6 + 0.2]} material={roofMat(M, plaster ? 'slate' : 'clay-tile')} castShadow>
        <cylinderGeometry args={[0.01, 1.1, 0.56, 4, 1, false, Math.PI / 4]} />
      </mesh>
    </group>
  );
}
function Surroundings({ list, radius = 10, dusk }) {
  const M = useM();
  const s = new Set(list || []);
  const out = [];
  const hill = s.has('hilltop');
  const alpine = (s.has('snow-peaks') || s.has('himalaya-backdrop')) && !s.has('village') && !s.has('forest');
  const ground = s.has('brick-courtyard') ? M.mat('herring', 10, 10, { color: '#f0c0a6' })
    : s.has('stone-paved-plaza') || s.has('city-street') ? M.mat('stone', 9, 9, { color: '#f0e8da' })
      : s.has('desert-cliffs') ? M.mat('rock', 8, 8, { color: '#c9a477' })
        : alpine ? M.mat('rock', 8, 8, { color: '#a8a39a' })
        : M.mat('grass', 12, 12, { color: '#c4d49a' });
  out.push(<mesh key="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={ground}><circleGeometry args={[radius + 3, 64]} /></mesh>);
  out.push(<mesh key="far" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow material={(alpine ? M.mat('rock', 20, 20, { color: '#9d988f' }) : M.mat('grass', 30, 30, { color: s.has('desert-cliffs') ? '#dcb88a' : '#b8c890' }))}><circleGeometry args={[80, 48]} /></mesh>);
  if (hill) out.push(<mesh key="hill" position={[0, -6.02, 0]} material={M.mat('grass', 10, 4, { color: '#86a060' })} receiveShadow><cylinderGeometry args={[radius + 3, radius + 18, 12, 48]} /></mesh>);
  const ring = (n, r0, fn) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.35;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.45) return null; // keep the front open
    return fn([Math.cos(a) * r0, 0, Math.sin(a) * r0], -a + Math.PI / 2, i);
  });
  if (s.has('newar-houses') || s.has('market-houses') || s.has('city-street')) out.push(...ring(22, radius + 1, (p, r, i) => <House key={`h${i}`} M={M} p={p} r={r} h={1.5 + (i % 3) * 0.45} w={1.6 + (i % 2) * 0.5} d={1.4} />));
  if (s.has('village') || s.has('monks-houses')) out.push(...ring(10, radius + 2, (p, r, i) => <House key={`v${i}`} M={M} p={p} r={r} h={1.5 + (i % 2) * 0.6} plaster />));
  if (s.has('forest') || s.has('sacred-grove') || hill) out.push(...ring(26, radius + (hill ? 1 : 3), (p, r, i) => <Tree key={`t${i}`} p={[p[0] * (1 + (i % 3) * 0.08), 0, p[2] * (1 + (i % 3) * 0.08)]} s={1 + (i % 4) * 0.2} kind={i % 3 ? 'pine' : 'broad'} />));
  if (s.has('garden-lawn')) out.push(...ring(10, radius - 1, (p, r, i) => <Tree key={`g${i}`} p={p} s={0.8} />));
  if (s.has('river') || s.has('riverbank-ghats')) {
    out.push(<mesh key="river" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, radius * 0.62]} receiveShadow><planeGeometry args={[80, 3.4]} /><meshStandardMaterial color="#4d7a80" metalness={0.3} roughness={0.15} /></mesh>);
    if (s.has('riverbank-ghats')) out.push(...[0, 1, 2, 3].map((k) => <Box key={`gh${k}`} s={[12, 0.12, 0.4]} p={[0, 0.06 * (4 - k), radius * 0.62 - 2.1 - k * 0.4 + 1.6]} m={M.stone} />));
  }
  if (s.has('lake') || (s.has('pond') && !list.includes('lake'))) {
    if (s.has('lake')) out.push(<mesh key="lake" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}><circleGeometry args={[radius - 3, 64]} /><meshStandardMaterial color="#2f5d6b" metalness={0.35} roughness={0.08} /></mesh>);
    else out.push(<group key="pond" position={[-radius * 0.55, 0.25, -radius * 0.2]} scale={0.55}><Pond w={7} d={5} f={new Set(['ghat-steps'])} /></group>);
  }
  if (s.has('terraced-fields')) out.push(...[0, 1, 2, 3, 4].map((k) => <mesh key={`tf${k}`} position={[0, -0.6 - k * 0.6, 0]} material={M.mat('grass', 20, 2, { color: k % 2 ? '#a8b860' : '#8aa04e' })} receiveShadow><cylinderGeometry args={[radius + 4 + k * 3, radius + 4 + k * 3, 0.6, 48, 1, true]} /></mesh>));
  if (s.has('himalaya-backdrop') || s.has('snow-peaks')) {
    out.push(...[[-26, -40, 14, 18], [-8, -48, 18, 22], [12, -44, 16, 20], [30, -38, 12, 15], [0, -60, 22, 26]].map(([x, z, r, h], k) => (
      <group key={`m${k}`} position={[x, -1, z]}>
        <mesh material={M.mat('rock', 4, 4, { color: '#7e7c80' })}><coneGeometry args={[r, h, 7]} /></mesh>
        <mesh position={[0, h * 0.3, 0]} material={M.plain('#f6f7fb', { roughness: 0.6 })}><coneGeometry args={[r * 0.42, h * 0.42, 7]} /></mesh>
      </group>
    )));
  }
  if (s.has('desert-cliffs')) out.push(...[[-18, -16, 8], [16, -20, 10], [-4, -26, 12]].map(([x, z, h], k) => <mesh key={`dc${k}`} position={[x, h / 2 - 1, z]} rotation={[0, k, 0]} material={M.mat('rock', 3, 3, { color: '#b98a5a' })}><cylinderGeometry args={[6, 8, h, 7]} /></mesh>));
  if (s.has('plains-fields')) out.push(...[[-14, -10], [14, -12], [-16, 10], [16, 8]].map(([x, z], k) => <mesh key={`pf${k}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.004, z]} material={M.plain(k % 2 ? '#c8b45a' : '#7fa04a', { roughness: 1 })}><planeGeometry args={[9, 7]} /></mesh>));
  if (dusk) out.push(<Sparkles key="sp" count={70} scale={[radius * 2, 6, radius * 2]} position={[0, 3, 0]} size={2.4} speed={0.3} color="#ffcf8a" />);
  return <group>{out}</group>;
}

/* ---------- composer ---------- */
function Monument({ spec, dusk }) {
  const M = useM();
  const f = useMemo(() => new Set(spec.features || []), [spec]);
  const kind = spec.kind || 'pagoda';
  const tiers = Math.max(1, Math.min(spec.tiers || (kind === 'pagoda' ? 3 : 1), 9));
  const [fw = 10, fd = 10] = spec.footprint_m || [];
  const aspect = Math.min(1.6, Math.max(0.65, fw / fd || 1));
  const w = kind === 'pagoda' ? 2.6 * Math.sqrt(aspect) : 2.6;
  const d = kind === 'pagoda' ? 2.6 / Math.sqrt(aspect) : 2.6;
  const steps = Math.min(spec.plinth_steps || 0, 6);
  const plinthH = steps * 0.34;
  const guards = f.has('guardian-pairs-on-stairs') || (f.has('lion-statues') && steps > 0);
  const extras = [];
  if (f.has('garuda-pillar')) extras.push(<PillarStatue key="garuda" p={[1.4, 0, d / 2 + steps * 0.85 + 3.4]} face={Math.PI} />);
  if (f.has('stone-pillar') && !f.has('garuda-pillar') && kind === 'square') extras.push(<PillarStatue key="king" p={[1.8, 0, 4.2]} king />);
  if (f.has('bell') && kind !== 'statue') extras.push(<BellPavilion key="bell" p={[-3.6, 0, 2.6]} s={0.8} />);
  if (f.has('nandi-bull')) extras.push(<Nandi key="nandi" p={[1.2, 0, d / 2 + steps * 0.85 + 2.2]} face={Math.PI} gold={spec.roof === 'gilded-copper'} />);
  if (f.has('shiva-lingam') && kind !== 'pagoda') extras.push(<Lingam key="ling" p={[-1.6, 0, 2.6]} />);
  if (f.has('trident') && kind !== 'cave') extras.push(<Trident key="tri" p={[2.4, 0, 2.2]} h={2.2} />);
  if (f.has('chaityas') && kind !== 'stupa') extras.push(...[-1, 1].map((k) => <Chaitya key={`ch${k}`} p={[k * 2.8, 0, 3]} />));
  if (f.has('sacred-tree')) extras.push(<SacredTree key="tree" p={[-4.5, 0, -2.5]} />);
  if (f.has('lamps-diyo') || dusk) extras.push(...[-1.2, -0.6, 0, 0.6, 1.2].map((x, k) => <Diyo key={`d${k}`} p={[x, plinthH + 0.01, d / 2 + 0.75]} light={dusk && k % 2 === 0} />));
  if (f.has('flags-red')) extras.push(...[-2, 2].map((x) => <group key={`fr${x}`} position={[x * 1.6, 0, 1.6]}><Cyl rt={0.03} h={3.4} p={[0, 1.7, 0]} m={M.dark} seg={6} /><Box s={[0.6, 0.4, 0.01]} p={[0.3, 3.1, 0]} m={M.plain('#b3202a')} /></group>));
  if (f.has('elephant-statues') && !guards && kind !== 'pond') extras.push(...[-1, 1].map((k) => <group key={`el${k}`} position={[k * 0.95, plinthH, d / 2 + 1.2]} scale={1.5}><Elephant m={M.stone} /></group>));
  if (f.has('lion-statues') && !guards && kind !== 'square') extras.push(...[-1, 1].map((k) => <group key={`li${k}`} position={[k * 0.9, plinthH, d / 2 + 1.1]} scale={1.6}><Lion m={M.stone} /></group>));
  if (f.has('water-spouts') && kind !== 'courtyard') extras.push(<group key="hiti" position={[3.6, -0.02, 2.8]}><Box s={[2, 0.05, 1.6]} p={[0, 0, 0]} m={M.plain('#5a6b66')} cast={false} /><Box s={[0.2, 0.2, 0.3]} p={[0, 0.3, -0.7]} m={M.gold} /></group>);

  let body;
  if (kind === 'stupa') body = <StupaBody y0={plinthH} f={f} colors={spec.colors} />;
  else if (kind === 'shikhara') body = <ShikharaBody tiers={tiers} y0={plinthH} walls={spec.walls} f={f} />;
  else if (kind === 'palace' && tiers >= 6) body = <group position={[0, plinthH, 0]}><PalaceBody w={3.4} d={2.8} storeys={tiers} walls={spec.walls} roof={spec.roof} f={f} windowsRow={false} /><group position={[2.6, 0, 0.6]} scale={0.6}><PagodaBody tiers={2} walls="red-brick" roof="clay-tile" f={new Set(['carved-struts'])} /></group></group>;
  else if (kind === 'palace') body = <PalaceBody w={8} d={2.8} storeys={Math.min(tiers, 5)} walls={spec.walls} roof={spec.roof} f={f} p={[0, plinthH, 0]} />;
  else if (kind === 'pond' && spec.surroundings?.includes('lake')) body = <group position={[0, 0, 7.6]}><Box s={[1.2, 0.3, 1.2]} p={[0, 0.15, 0]} m={M.stone} /><group position={[0, 0.3, 0]} scale={0.45}><ShikharaBody tiers={1} walls="white-plaster" f={new Set()} /></group>{[-2, -1.2, 1.4, 2.3].map((x, k) => <group key={k} position={[x, 0, 0.3 + (k % 2) * 0.6]}>{[0, 1, 2].map((j) => <Ball key={j} rad={0.16 - j * 0.04} p={[0, 0.12 + j * 0.2, 0]} m={M.mat('rock', 1, 1, { color: '#9a958c' })} />)}</group>)}<Trident p={[0.9, 0, -0.2]} h={1.4} /></group>;
  else if (kind === 'dome-temple') body = <DomeTemple walls={spec.walls} colors={spec.colors} f={f} />;
  else if (kind === 'gumba') body = <Gumba f={f} colors={spec.colors} />;
  else if (kind === 'pillar') body = <AshokaPillar f={f} />;
  else if (kind === 'pond') body = <Pond f={f} />;
  else if (kind === 'gate') body = <Gate f={f} />;
  else if (kind === 'fort') body = <Fort tiers={tiers} walls={spec.walls} roof={spec.roof} f={f} />;
  else if (kind === 'cave') body = <Cave f={f} />;
  else if (kind === 'ruins') body = <Ruins />;
  else if (kind === 'statue') body = f.has('bell') ? <BellPavilion p={[0, 0, 0]} s={1.6} /> : <group><Box s={[1.2, 1, 1.2]} p={[0, 0.5, 0]} m={M.stone} /><group position={[0, 1, 0]} scale={2.4}><Goddess m={roofMat(M, spec.roof === 'gilded-copper' ? 'gilded-copper' : 'stone-spire')} /></group></group>;
  else if (kind === 'courtyard') {
    body = (
      <group>
        {[[0, -4.2, 0], [0, 4.2, Math.PI], [-4.2, 0, Math.PI / 2], [4.2, 0, -Math.PI / 2]].map(([x, z, r], k) => k === 1 ? null : <PalaceBody key={k} w={8.4} d={1.8} storeys={Math.min(tiers, 3)} walls={spec.walls} roof="clay-tile" f={f} p={[x, 0, z]} r={r} />)}
        {f.has('water-spouts')
          ? <group position={[0, 0, 0]}><Box s={[3, 0.06, 3]} p={[0, -0.02, 0]} m={M.plain('#5a6b66')} cast={false} />{[0, 1, 2].map((k) => <Box key={k} s={[3.6 - k * 0.4, 0.1, 0.2]} p={[0, 0.05, 1.7 - k * 0.2]} m={M.stone} />)}<Box s={[0.24, 0.24, 0.3]} p={[0, 0.5, -1.4]} m={M.gold} /></group>
          : <group scale={0.55}><PagodaBody tiers={spec.roof === 'gilded-copper' ? 2 : 1} small walls={spec.walls} roof={spec.roof === 'gilded-copper' ? 'gilded-copper' : 'gilded-copper'} f={f} /></group>}
      </group>
    );
  } else if (kind === 'square') {
    body = (
      <group>
        <PalaceBody w={11} d={2.8} storeys={3} walls={spec.walls} roof={spec.roof} f={f} p={[0, 0, -4.8]} />
        <group position={[-4.2, 0, 0.4]} scale={0.8}><Plinth steps={3} w={2.6} d={2.6} m={wallMat(M, 'red-brick', 2, 0.4)} guards={false} /><group position={[0, 1.02, 0]}><PagodaBody tiers={3} walls="red-brick" roof="clay-tile" f={f} /></group></group>
        <group position={[4.2, 0, 0.6]} scale={0.7}><Plinth steps={2} w={2.6} d={2.6} m={M.stone} guards /><ShikharaBody tiers={2} y0={0.68} walls="stone" f={f} /></group>
        <group position={[0.2, 0, -1]} scale={0.6}><Plinth steps={2} w={2.4} d={2.4} m={wallMat(M, 'red-brick', 2, 0.4)} guards={false} /><group position={[0, 0.68, 0]}><PagodaBody tiers={2} walls="red-brick" roof="clay-tile" f={f} /></group></group>
      </group>
    );
  } else if (kind === 'lake-shrine' || spec.surroundings?.includes('lake')) {
    body = (
      <group>
        <mesh position={[0, -0.1, 0]} material={M.mat('grass', 2, 2, { color: '#7d9a5a' })} receiveShadow><cylinderGeometry args={[2.8, 3.1, 0.4, 32]} /></mesh>
        <group position={[0, 0.1, 0]}><Plinth steps={1} w={2.2} d={2.2} m={M.stone} guards={false} stairs={false} /><group position={[0, 0.34, 0]}><PagodaBody tiers={tiers} w={2.2} d={2.2} walls={spec.walls} roof={spec.roof} f={f} /></group></group>
      </group>
    );
  } else {
    body = <group position={[0, plinthH, 0]}><PagodaBody tiers={tiers} w={w} d={d} walls={spec.walls} roof={spec.roof} f={f} /></group>;
  }
  const plinth = ['pagoda', 'shikhara', 'palace', 'stupa'].includes(kind)
    ? <Plinth steps={steps} shape={kind === 'stupa' && spec.plinth_shape === 'round' ? 'round' : spec.plinth_shape} w={kind === 'stupa' ? 4.6 : w} d={kind === 'stupa' ? 4.6 : kind === 'palace' ? 2.8 : d} m={kind === 'shikhara' && spec.walls === 'stone' ? M.stone : wallMat(M, kind === 'stupa' ? 'white-plaster' : 'red-brick', 3, 0.5)} guards={guards && kind !== 'stupa'} />
    : null;
  return <group>{plinth}{body}{extras}</group>;
}

function Spin({ on, children }) {
  const ref = useRef();
  useFrame((_, dt) => { if (on && ref.current) ref.current.rotation.y += dt * 0.08; });
  return <group ref={ref}>{children}</group>;
}

function Scene({ spec, dusk, spin, fit = true }) {
  const bg = dusk ? '#2a1a44' : '#eadcc8';
  const radius = ['square', 'courtyard', 'fort', 'dome-temple'].includes(spec.kind) ? 13 : 11;
  const inner = <Monument spec={spec} dusk={dusk} />;
  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 26, 85]} />
      <hemisphereLight args={[dusk ? '#8a74c8' : '#fff3e0', dusk ? '#3a2030' : '#8a6a50', dusk ? 1.1 : 0.8]} />
      <ambientLight intensity={dusk ? 0.35 : 0.15} color={dusk ? '#ffd2a8' : '#ffffff'} />
      <directionalLight position={dusk ? [-8, 6, 6] : [8, 12, 6]} intensity={dusk ? 1.8 : 3} color={dusk ? '#ffad7a' : '#fff1d6'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0004} />
      {dusk && <directionalLight position={[6, 4, -8]} intensity={0.9} color="#ae7fff" />}
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={dusk ? 1.2 : 2.4} color={dusk ? '#ffb07a' : '#fff6e6'} position={[0, 6, 6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={dusk ? 0.8 : 1.2} color={dusk ? '#ae7fff' : '#cfe0ff'} position={[-6, 3, -4]} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={1} color="#ffd9a0" position={[5, 2, -3]} scale={2} />
      </Environment>
      <Spin on={spin}>
        {fit ? <Bounds fit clip observe margin={1.25}>{inner}</Bounds> : inner}
        <Surroundings list={spec.surroundings} radius={radius} dusk={dusk} />
      </Spin>
      <ContactShadows position={[0, 0.02, 0]} opacity={0.4} scale={radius * 2.4} blur={2.4} far={8} />
    </>
  );
}

export const DEFAULT_SPECS = {
  pagoda: { kind: 'pagoda', tiers: 3, plinth_steps: 2, walls: 'red-brick', roof: 'clay-tile', features: ['gilded-pinnacle', 'carved-struts', 'lion-statues'], surroundings: ['stone-paved-plaza', 'newar-houses'] },
  stupa: { kind: 'stupa', plinth_steps: 3, plinth_shape: 'square', features: ['prayer-flags', 'prayer-wheels', 'buddha-eyes'], surroundings: ['stone-paved-plaza'] },
  shikhara: { kind: 'shikhara', tiers: 1, plinth_steps: 2, walls: 'stone', features: ['gilded-pinnacle'], surroundings: ['stone-paved-plaza'] },
  palace: { kind: 'palace', tiers: 3, walls: 'red-brick', roof: 'clay-tile', features: ['carved-windows', 'golden-door'], surroundings: ['stone-paved-plaza'] },
  square: { kind: 'square', walls: 'red-brick', roof: 'clay-tile', features: ['carved-windows', 'stone-pillar', 'bell'], surroundings: ['stone-paved-plaza', 'newar-houses'] },
};
const NYATAPOLA = { kind: 'pagoda', tiers: 5, plinth_steps: 5, plinth_shape: 'square', footprint_m: [25, 25], walls: 'red-brick', roof: 'clay-tile', features: ['gilded-pinnacle', 'carved-struts', 'guardian-pairs-on-stairs'], surroundings: ['stone-paved-plaza', 'newar-houses'] };

/** Viewer for one site, with day and dusk lighting, auto-turn and drag to orbit. */
export function SiteViewer({ spec, type, height = 440, initialDusk = false }) {
  const s = spec || DEFAULT_SPECS[type] || DEFAULT_SPECS.pagoda;
  const [dusk, setDusk] = useState(initialDusk);
  const [spin, setSpin] = useState(true);
  return (
    <div className="model-viewer" style={{ height }}>
      <Canvas shadows dpr={[1, 1.8]} camera={{ position: [9, 6.5, 12], fov: 36 }} gl={{ antialias: true, toneMappingExposure: 1.2 }}>
        <Suspense fallback={null}>
          <MatProvider>
            <Scene spec={s} dusk={dusk} spin={spin} />
          </MatProvider>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={40} maxPolarAngle={1.5} />
      </Canvas>
      <div className="model-tools">
        <button className={`chip ${!dusk ? 'on' : ''}`} onClick={() => setDusk(false)}>Day</button>
        <button className={`chip ${dusk ? 'on' : ''}`} onClick={() => setDusk(true)}>Dusk aarti</button>
        <button className={`chip ${spin ? 'on' : ''}`} onClick={() => setSpin(!spin)}>{spin ? 'Turning' : 'Still'}</button>
      </div>
    </div>
  );
}

/** Home hero: Nyatapola with its five plinths and guardians, lit for evening. */
export function HeroSite() {
  return (
    <Canvas shadows dpr={[1, 1.8]} camera={{ position: [11, 7, 13], fov: 34 }} gl={{ antialias: true, alpha: true }}>
      <Suspense fallback={null}>
        <MatProvider>
          <HeroInner />
        </MatProvider>
      </Suspense>
      <OrbitControls makeDefault enablePan={false} enableZoom={false} minPolarAngle={0.9} maxPolarAngle={1.35} target={[0, 3, 0]} />
    </Canvas>
  );
}
function HeroInner() {
  return (
    <>
      <hemisphereLight args={['#6a4a9a', '#1a0b17', 0.6]} />
      <directionalLight position={[-8, 9, 7]} intensity={1.6} color="#ffc08a" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={12} shadow-camera-bottom={-6} />
      <directionalLight position={[7, 5, -6]} intensity={0.8} color="#ae7fff" />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={1.6} color="#ffb07a" position={[0, 6, 6]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1} color="#ae7fff" position={[-6, 3, -4]} scale={[6, 3, 1]} />
      </Environment>
      <Spin on>
        <Monument spec={NYATAPOLA} dusk />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[7.5, 64]} />
          <meshStandardMaterial color="#3a2238" roughness={1} />
        </mesh>
      </Spin>
      <Sparkles count={60} scale={[16, 8, 16]} position={[0, 4, 0]} size={2.6} speed={0.3} color="#ffcf8a" />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={18} blur={2.4} far={10} />
    </>
  );
}
