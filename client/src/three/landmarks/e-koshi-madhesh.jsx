// Hand-built landmarks: Koshi and Madhesh (Janakpur, Dharan, Saptari, Makwanpur, Chitwan, Solukhumbu...).
import { useMemo } from 'react';

/* ---------- shared geometry helpers (module level) ---------- */
let THREE_REF = null;
function archShape(THREE, w, h, pt = 0) {
  const s = new THREE.Shape();
  const r = w / 2;
  const hh = Math.max(h - r, 0.01);
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh);
  if (pt) { s.quadraticCurveTo(r, hh + r * 0.95, 0, h + pt); s.quadraticCurveTo(-r, hh + r * 0.95, -r, hh); } else s.absarc(0, hh, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return s;
}
function scallopGeometry(THREE, len, n, rad, depth = 0.14) {
  const s = new THREE.Shape();
  const pitch = len / n;
  s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0);
  for (let i = n - 1; i >= 0; i -= 1) s.absarc(-len / 2 + (i + 0.5) * pitch, 0, pitch / 2 * 0.98, 0, Math.PI, false);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}
/** Dome profile as a lathe: neck, bulge, taper to a point. */
function domeGeometry(THREE, r, h, seg = 20) {
  const pts = [[r * 0.82, 0], [r * 0.98, h * 0.1], [r * 1.04, h * 0.3], [r * 0.95, h * 0.5], [r * 0.7, h * 0.7], [r * 0.38, h * 0.88], [r * 0.12, h * 0.97], [0.001, h]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, seg);
}
/** A heap of rough rocks / boulders. */
function lumpyGeometry(THREE, seed = 1, detail = 2) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    const n = 1 + 0.22 * Math.sin(x * 3.1 + seed) * Math.cos(z * 2.7 + seed * 1.7) + 0.14 * Math.sin(y * 5.3 + seed * 2.3);
    p.setXYZ(i, x * n, y * n, z * n);
  }
  g.computeVertexNormals();
  return g;
}

export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, Frame, Water, Tank, Chaitya, Trident, PrayerFlags, Spire, Lion, Nandi, Lingam, THREE, wallMat, roofMat, whiteMat, GroundDisc, ringOf, NewarHouse, House, Gumba, Diyo } = K;
  THREE_REF = THREE;

  /* ---------- reusable parts ---------- */
  const Arch = ({ w, h, p, r = 0, m, pt = 0 }) => {
    const geo = useMemo(() => new THREE.ShapeGeometry(archShape(THREE, w, h, pt), 12), [w, h, pt]);
    return <mesh geometry={geo} position={p} rotation={[0, r, 0]} material={m} />;
  };
  const Scallop = ({ len, n, p, r = 0, m, h = 0.3, depth = 0.14 }) => {
    const geo = useMemo(() => scallopGeometry(THREE, len, n, 1, depth), [len, n, depth]);
    return <mesh geometry={geo} position={p} rotation={[0, r, 0]} scale={[1, h / (len / n / 2), 1]} material={m} castShadow />;
  };
  const Dome = ({ r, h, p, m, fin = true, seg = 20 }) => {
    const M = useM();
    const geo = useMemo(() => domeGeometry(THREE, r, h, seg), [r, h, seg]);
    return (
      <group position={p}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        {fin && <><Cyl rt={r * 0.07} rb={r * 0.1} h={r * 0.2} p={[0, h + r * 0.06, 0]} m={M.gold} seg={8} /><mesh position={[0, h + r * 0.36, 0]} material={M.gold}><coneGeometry args={[r * 0.06, r * 0.4, 8]} /></mesh></>}
      </group>
    );
  };
  const Rocks = ({ p, s = 1, seed = 1, m, sc = [1, 0.7, 1] }) => {
    const geo = useMemo(() => lumpyGeometry(THREE, seed, 2), [seed]);
    return <mesh geometry={geo} position={p} scale={[s * sc[0], s * sc[1], s * sc[2]]} material={m} castShadow receiveShadow />;
  };
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const Sky = null;

  /* =====================================================================
     JANAKI MANDIR (Janakpur): wide white palace-temple of arched bays
     ===================================================================== */
  function JanakiCornerTower({ p, side }) {
    const M = useM();
    const wm = M.plain('#f8f5ef', { roughness: 0.8 });
    const orange = M.plain('#e8a24d', { roughness: 0.7 });
    const teal = M.plain('#58aa9a', { roughness: 0.6 });
    const pink = M.plain('#eaa9b6', { roughness: 0.7 });
    const dark = M.plain('#35283a');
    const green = M.plain('#a9cdb9', { roughness: 0.55 });
    const faces = [[0, 1.1, 0], [side * 1.1, 0, side * Math.PI / 2], [-side * 1.1, 0, -side * Math.PI / 2]];
    return (
      <group position={p}>
        <Box s={[2.3, 0.2, 2.3]} p={[0, 0.1, 0]} m={M.stone} />
        <Box s={[2.1, 3.6, 2.1]} p={[0, 2.0, 0]} m={wm} />
        {[1.1, 2.6].map((y) => <Box key={y} s={[2.22, 0.1, 2.22]} p={[0, y + 0.05, 0]} m={orange} />)}
        {[0.9, 2.4].map((y, lv) => faces.map(([a, b, rot], k) => {
          const x = rot === 0 ? 0 : a; const z = rot === 0 ? b : 0;
          return (
            <group key={`${lv}${k}`} position={[x, y, z]} rotation={[0, rot, 0]}>
              <Arch w={0.62} h={0.95} p={[-0.0, 0, 0.0]} m={lv ? teal : pink} pt={0.1} />
              <Arch w={0.44} h={0.78} p={[0, 0.0, 0.01]} m={dark} pt={0.06} />
            </group>
          );
        }))}
        <Box s={[2.5, 0.14, 2.5]} p={[0, 3.87, 0]} m={teal} />
        <Scallop len={2.5} n={6} p={[0, 3.94, 1.2]} m={wm} h={0.3} />
        <Scallop len={2.5} n={6} p={[0, 3.94, -1.2]} m={wm} h={0.3} />
        <Scallop len={2.5} n={6} p={[1.2, 3.94, 0]} r={Math.PI / 2} m={wm} h={0.3} />
        <Scallop len={2.5} n={6} p={[-1.2, 3.94, 0]} r={Math.PI / 2} m={wm} h={0.3} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => (
          <group key={`${a}${b}`} position={[a * 1.0, 4.0, b * 1.0]}>
            <Cyl rt={0.16} rb={0.18} h={0.62} p={[0, 0.31, 0]} m={wm} seg={10} />
            <Dome r={0.24} h={0.42} p={[0, 0.62, 0]} m={green} />
          </group>
        ))}
        <Box s={[1.55, 1.9, 1.55]} p={[0, 4.98, 0]} m={wm} />
        {[0, 1, 2, 3].map((k) => <group key={k} position={[0, 5.05, 0]} rotation={[0, k * Math.PI / 2, 0]}><group position={[0, 0, 0.78]}><Arch w={0.5} h={0.85} m={dark} pt={0.05} /><Arch w={0.62} h={0.97} p={[0, -0.02, -0.005]} m={orange} pt={0.08} /></group></group>)}
        <Box s={[1.8, 0.14, 1.8]} p={[0, 5.98, 0]} m={orange} />
        <Cyl rt={0.62} rb={0.7} h={0.55} p={[0, 6.32, 0]} m={wm} seg={16} />
        <Cyl rt={0.74} rb={0.74} h={0.08} p={[0, 6.1, 0]} m={teal} seg={16} />
        <Dome r={0.78} h={1.15} p={[0, 6.55, 0]} m={green} />
      </group>
    );
  }

  function JanakiMain() {
    const M = useM();
    const wm = M.plain('#f8f5ef', { roughness: 0.8 });
    const cream = M.plain('#f1e4c6', { roughness: 0.8 });
    const orange = M.plain('#e8a24d', { roughness: 0.7 });
    const teal = M.plain('#58aa9a', { roughness: 0.6 });
    const pink = M.plain('#eaa9b6', { roughness: 0.7 });
    const blue = M.plain('#7ea4d6', { roughness: 0.6 });
    const dark = M.plain('#35283a');
    const green = M.plain('#a9cdb9', { roughness: 0.55 });
    const y0 = 0.4;
    const bays = (x0, x1, n) => Array.from({ length: n }, (_, k) => x0 + (k + 0.5) * ((x1 - x0) / n));
    const wingX = [...bays(-8.0, -3.1, 7), ...bays(3.1, 8.0, 7)];
    const wz = 2.52;
    return (
      <group>
        {/* plinth and front steps */}
        <Box s={[22, 0.4, 9.5]} p={[0, 0.2, 0.3]} m={M.stone} />
        {[0, 1, 2].map((k) => <Box key={k} s={[3.4 + k * 0.5, 0.13, 0.4]} p={[0, 0.07 + (2 - k) * 0.0 + 0.0, 4.35 + 0.0 + (2 - k) * 0.3 + 0.2 - 0.2]} m={M.stone} />)}

        {/* long two-storey wings */}
        <Box s={[17.2, 3.0, 5]} p={[0, y0 + 1.5, 0]} m={wm} />
        <Box s={[17.5, 0.1, 5.3]} p={[0, y0 + 1.5, 0]} m={orange} />
        <Box s={[17.5, 0.12, 5.3]} p={[0, y0 + 3.0, 0]} m={teal} />
        <Box s={[17.4, 0.08, 5.2]} p={[0, y0 + 0.03, 0]} m={pink} />
        {wingX.map((x, i) => (
          <group key={i}>
            {/* ground-floor arch bay */}
            <Arch w={0.6} h={1.12} p={[x, y0 + 0.1, wz]} m={i % 2 ? pink : cream} pt={0.1} />
            <Arch w={0.44} h={0.95} p={[x, y0 + 0.1, wz + 0.012]} m={dark} pt={0.06} />
            {/* upper-floor window under a cusped frame */}
            <Arch w={0.58} h={1.0} p={[x, y0 + 1.7, wz]} m={i % 2 ? teal : orange} pt={0.1} />
            <Arch w={0.4} h={0.8} p={[x, y0 + 1.72, wz + 0.012]} m={dark} pt={0.06} />
            <Box s={[0.66, 0.05, 0.16]} p={[x, y0 + 1.66, wz + 0.07]} m={wm} cast={false} />
            {/* pilaster between bays */}
            <Box s={[0.07, 2.9, 0.1]} p={[x + 0.35, y0 + 1.45, wz + 0.04]} m={cream} cast={false} />
          </group>
        ))}
        <Scallop len={17.2} n={40} p={[0, y0 + 3.04, 2.45]} m={wm} h={0.34} />
        <Scallop len={17.2} n={40} p={[0, y0 + 3.04, -2.45]} m={wm} h={0.34} />

        {/* recessed upper tier with its own parapet, with small arched openings and chhatris */}
        <Box s={[13.4, 1.0, 3.5]} p={[0, y0 + 3.5, -0.5]} m={wm} />
        <Box s={[13.7, 0.1, 3.8]} p={[0, y0 + 4.02, -0.5]} m={blue} />
        {[...bays(-6.4, -3.3, 5), ...bays(3.3, 6.4, 5)].map((x, i) => (
          <group key={`u${i}`}>
            <Arch w={0.46} h={0.7} p={[x, y0 + 3.1, 1.26]} m={i % 2 ? pink : cream} pt={0.08} />
            <Arch w={0.3} h={0.56} p={[x, y0 + 3.12, 1.27]} m={dark} pt={0.05} />
          </group>
        ))}
        <Scallop len={13.4} n={32} p={[0, y0 + 4.07, 1.2]} m={wm} h={0.28} />
        {[-6.3, -4.2, 4.2, 6.3].map((x) => (
          <group key={`ct${x}`} position={[x, y0 + 4.07, 1.1]}>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.04} h={0.52} p={[a * 0.2, 0.26, b * 0.2]} m={wm} seg={6} />)}
            <Dome r={0.32} h={0.5} p={[0, 0.5, 0]} m={green} />
          </group>
        ))}

        {/* central projecting block: grand arched portal, three-arch loggia, crowning dome */}
        <Box s={[5.6, 4.9, 6.4]} p={[0, y0 + 2.45, 0.35]} m={wm} />
        <Box s={[5.9, 0.12, 6.7]} p={[0, y0 + 1.7, 0.35]} m={orange} />
        <Box s={[5.9, 0.12, 6.7]} p={[0, y0 + 3.3, 0.35]} m={teal} />
        <Box s={[5.9, 0.14, 6.7]} p={[0, y0 + 4.9, 0.35]} m={pink} />
        {/* portal */}
        <Arch w={2.2} h={2.0} p={[0, y0, 3.56]} m={teal} pt={0.3} />
        <Arch w={1.84} h={1.76} p={[0, y0, 3.57]} m={orange} pt={0.26} />
        <Arch w={1.5} h={1.56} p={[0, y0, 3.58]} m={dark} pt={0.22} />
        {[-1.9, 1.9].map((x) => <group key={x}><Arch w={0.75} h={1.2} p={[x, y0 + 0.1, 3.56]} m={pink} pt={0.1} /><Arch w={0.55} h={1.0} p={[x, y0 + 0.1, 3.57]} m={dark} pt={0.07} /></group>)}
        {/* loggia, 2nd storey */}
        <Box s={[4.6, 1.3, 0.12]} p={[0, y0 + 2.45, 3.6]} m={cream} />
        {[-1.35, 0, 1.35].map((x) => <group key={x}><Arch w={1.0} h={1.0} p={[x, y0 + 1.9, 3.67]} m={dark} pt={0.12} /><Arch w={1.16} h={1.14} p={[x, y0 + 1.87, 3.655]} m={orange} pt={0.14} /></group>)}
        {[-2.0, -0.68, 0.68, 2.0].map((x) => <Cyl key={x} rt={0.06} rb={0.07} h={1.1} p={[x, y0 + 2.3, 3.78]} m={wm} seg={8} />)}
        <Box s={[4.8, 0.08, 0.3]} p={[0, y0 + 1.76, 3.78]} m={wm} />
        {Array.from({ length: 13 }, (_, k) => <Cyl key={k} rt={0.025} h={0.3} p={[-2.2 + k * 0.367, y0 + 1.93, 3.88]} m={wm} seg={5} />)}
        {/* top storey windows */}
        {[-2.0, -1.0, 0, 1.0, 2.0].map((x) => <group key={x}><Arch w={0.55} h={0.92} p={[x, y0 + 3.4, 3.56]} m={x % 2 ? pink : teal} pt={0.1} /><Arch w={0.38} h={0.74} p={[x, y0 + 3.42, 3.57]} m={dark} pt={0.06} /></group>)}
        <Scallop len={5.6} n={16} p={[0, y0 + 4.97, 3.5]} m={wm} h={0.32} />
        <Scallop len={5.6} n={16} p={[0, y0 + 4.97, -2.8]} m={wm} h={0.32} />
        <Scallop len={6.4} n={18} p={[2.75, y0 + 4.97, 0.35]} r={Math.PI / 2} m={wm} h={0.32} />
        <Scallop len={6.4} n={18} p={[-2.75, y0 + 4.97, 0.35]} r={Math.PI / 2} m={wm} h={0.32} />
        {/* crowning drum and great dome with two flanking domes */}
        <Box s={[3.4, 0.9, 3.4]} p={[0, y0 + 5.4, 0.2]} m={wm} />
        {[0, 1, 2, 3].map((k) => <group key={k} position={[0, y0 + 5.4, 0.2]} rotation={[0, k * Math.PI / 2, 0]}><group position={[0, 0, 1.72]}><Arch w={0.5} h={0.6} p={[0, -0.3, 0]} m={dark} pt={0.05} /></group></group>)}
        <Box s={[3.6, 0.1, 3.6]} p={[0, y0 + 5.9, 0.2]} m={orange} />
        <Cyl rt={1.3} rb={1.4} h={0.5} p={[0, y0 + 6.2, 0.2]} m={wm} seg={20} />
        <Dome r={1.45} h={1.9} p={[0, y0 + 6.45, 0.2]} m={green} seg={28} />
        {[-1.9, 1.9].map((x) => <group key={x} position={[x, y0 + 4.97, 2.6]}><Cyl rt={0.5} h={0.7} p={[0, 0.35, 0]} m={wm} seg={12} /><Dome r={0.62} h={0.85} p={[0, 0.7, 0]} m={green} /></group>)}
        {[-1.9, 1.9].map((x) => <group key={`b${x}`} position={[x, y0 + 4.97, -1.7]}><Cyl rt={0.5} h={0.7} p={[0, 0.35, 0]} m={wm} seg={12} /><Dome r={0.62} h={0.85} p={[0, 0.7, 0]} m={green} /></group>)}
        {/* four slim corner turrets on the central block */}
        {[[-2.7, 3.4], [2.7, 3.4], [-2.7, -2.7], [2.7, -2.7]].map(([x, z]) => (
          <group key={`tu${x}${z}`} position={[x, y0 + 4.97, z]}>
            <Cyl rt={0.2} rb={0.24} h={0.9} p={[0, 0.45, 0]} m={wm} seg={10} />
            <Cyl rt={0.28} h={0.08} p={[0, 0.9, 0]} m={orange} seg={10} />
            <Dome r={0.3} h={0.48} p={[0, 0.9, 0]} m={green} />
          </group>
        ))}
        {/* red flag on the main dome */}
        <Cyl rt={0.025} h={1.5} p={[0, y0 + 8.7, 0.2]} m={M.dark} seg={6} />
        <Box s={[0.9, 0.5, 0.02]} p={[0.46, y0 + 9.2, 0.2]} m={M.plain('#d3301f')} />

        {/* flanking domed turrets and the four corner towers */}
        {[-1, 1].map((k) => (
          <group key={`ft${k}`} position={[k * 3.35, y0 + 3.0, 2.2]}>
            <Cyl rt={0.5} rb={0.56} h={1.9} p={[0, 0.95, 0]} m={wm} seg={12} />
            <Cyl rt={0.6} h={0.1} p={[0, 1.2, 0]} m={teal} seg={12} />
            <Cyl rt={0.6} h={0.1} p={[0, 1.9, 0]} m={orange} seg={12} />
            <Dome r={0.62} h={0.95} p={[0, 1.95, 0]} m={green} />
          </group>
        ))}
        <JanakiCornerTower p={[-9.0, y0, 0.2]} side={-1} />
        <JanakiCornerTower p={[9.0, y0, 0.2]} side={1} />
        <Frame s={[24, 10, 11]} p={[0, 5, 0.3]} />
      </group>
    );
  }

  function JanakiEnv() {
    const M = useM();
    const paving = M.plain('#ebe2d0', { roughness: 0.95 });
    const stripe = M.plain('#d9c9ac', { roughness: 0.95 });
    const wm = M.plain('#f6f2ea');
    const pastel = ['#f4e4c4', '#e8c8c8', '#d3e3d6', '#f2e8d8', '#dfe4ef'];
    return (
      <group>
        <GroundDisc r={80} y={-0.04} m={M.plain('#9fb070', { roughness: 1 })} />
        {/* town roads / earth around */}
        <GroundDisc r={46} y={-0.02} m={M.plain('#cdbf9f', { roughness: 1 })} />
        {/* the big paved courtyard in front of the temple, with a diagonal-banded inlay */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 10]} receiveShadow material={paving}><planeGeometry args={[34, 24]} /></mesh>
        {[-12, -6, 0, 6, 12].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, 10]} material={stripe}><planeGeometry args={[0.12, 24]} /></mesh>)}
        {[0, 6, 12, 18].map((z) => <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, z - 1]} material={stripe}><planeGeometry args={[34, 0.12]} /></mesh>)}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 9]} material={M.plain('#c9ad82', { roughness: 0.95 })}><ringGeometry args={[3.6, 4.0, 40]} /></mesh>
        {/* low boundary wall with scalloped top and gate on the front */}
        {[[-17, 22, 0, 0.0], [17, 22, 0, 0.0]].map(([x, z], k) => <Box key={k} s={[8, 0.7, 0.4]} p={[x > 0 ? 7 : -7, 0.35, 22]} m={wm} />)}
        {[-1, 1].map((k) => <group key={`gp${k}`} position={[k * 2.6, 0, 22]}><Box s={[1.1, 3.2, 1.1]} p={[0, 1.6, 0]} m={wm} /><Box s={[1.3, 0.14, 1.3]} p={[0, 3.2, 0]} m={M.plain('#e8a24d')} /><Dome r={0.55} h={0.8} p={[0, 3.25, 0]} m={M.plain('#a9cdb9')} /></group>)}
        <Box s={[5.2, 0.5, 1.0]} p={[0, 3.0, 22]} m={wm} />
        {[[-17, 10, Math.PI / 2], [17, 10, Math.PI / 2]].map(([x, z, r], k) => <Box key={`sw${k}`} s={[0.4, 0.7, 24]} p={[x, 0.35, z]} m={wm} />)}
        {/* thatched pavilion on red posts, seen in front-left of the facade */}
        <group position={[-5.5, 0, 12]}>
          {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.1} h={1.8} p={[x, 0.9, z]} m={M.plain('#9a3a28')} seg={8} />)}
          <Roof w={3.4} d={3.4} h={1.0} y={1.75} m={M.plain('#b99b62', { roughness: 1 })} sag={1.3} />
        </group>
        {/* the two sacred ponds of the town: Ganga Sagar to the left, Dhanush Sagar to the right, with stepped ghats */}
        {[[-30, 24, 'ganga'], [32, 20, 'dhanush']].map(([x, z, id]) => (
          <group key={id} position={[x, 0, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}><planeGeometry args={[19, 13]} /><meshStandardMaterial color="#5f8c88" metalness={0.35} roughness={0.12} /></mesh>
            {[0, 1, 2, 3].map((s) => <Box key={s} s={[19 + (3 - s) * 1.0 + 1, 0.12 + (3 - s) * 0.1, 0.7]} p={[0, 0.06 + (3 - s) * 0.05, -6.5 - (3 - s) * 0.7]} m={M.stone} />)}
            {[0, 1, 2, 3].map((s) => <Box key={`e${s}`} s={[0.7, 0.12 + (3 - s) * 0.1, 13 + (3 - s) * 1.4]} p={[-9.5 - (3 - s) * 0.7, 0.06 + (3 - s) * 0.05, 0]} m={M.stone} />)}
            {[0, 1, 2, 3].map((s) => <Box key={`f${s}`} s={[0.7, 0.12 + (3 - s) * 0.1, 13 + (3 - s) * 1.4]} p={[9.5 + (3 - s) * 0.7, 0.06 + (3 - s) * 0.05, 0]} m={M.stone} />)}
            {[0, 1, 2, 3].map((s) => <Box key={`g${s}`} s={[19 + (3 - s) * 1.0 + 1, 0.12 + (3 - s) * 0.1, 0.7]} p={[0, 0.06 + (3 - s) * 0.05, 6.5 + (3 - s) * 0.7]} m={M.stone} />)}
            <group position={[0, 0, -9.6]}><Box s={[2.2, 0.3, 2.2]} p={[0, 0.15, 0]} m={M.stone} /><Cyl rt={0.5} rb={0.6} h={1.3} p={[0, 0.95, 0]} m={wm} seg={10} /><Dome r={0.62} h={0.8} p={[0, 1.6, 0]} m={M.plain('#e8a24d')} /></group>
            {[[-9, 9], [9, 9], [-9, -9]].map(([a, b], j) => <Tree key={j} p={[a * 1.25, 0, b * 1.1]} s={1.2} />)}
          </group>
        ))}
        {/* townscape: low whitewashed and pastel buildings, palms and shade trees, all behind and to the sides */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = Math.PI * (0.12 + (i / 23) * 0.76) + Math.PI;
          const r = 36 + rnd(i) * 10;
          const x = Math.cos(a) * r; const z = Math.sin(a) * r * 0.9;
          const w = 3 + rnd(i + 5) * 2.4; const h = 2.4 + rnd(i + 9) * 3.4;
          return (
            <group key={`bd${i}`} position={[x, 0, z]} rotation={[0, -a + Math.PI / 2, 0]}>
              <Box s={[w, h, 3]} p={[0, h / 2, 0]} m={M.plain(pastel[i % 5], { roughness: 0.9 })} />
              <Box s={[w + 0.2, 0.12, 3.2]} p={[0, h, 0]} m={wm} />
              {[0, 1].slice(0, h > 3.8 ? 2 : 1).map((s) => [-0.9, 0, 0.9].map((q) => <Box key={`${s}${q}`} s={[0.5, 0.7, 0.04]} p={[q, 0.9 + s * 1.3, 1.52]} m={M.dark} />))}
            </group>
          );
        })}
        {Array.from({ length: 22 }, (_, i) => {
          const a = rnd(i + 40) * Math.PI * 2; const r = 26 + rnd(i + 70) * 16;
          const x = Math.cos(a) * r; const z = Math.sin(a) * r;
          if (z > 16 && Math.abs(x) < 20) return null;
          return <Tree key={`tr${i}`} p={[x, 0, z]} s={1.1 + rnd(i) * 0.7} />;
        })}
      </group>
    );
  }

  /* ---------- more shared scenery ---------- */
  const Palm = ({ p, s = 1 }) => {
    const M = useM();
    const trunk = M.plain('#7a6a52', { roughness: 1 });
    const leaf = M.plain('#4f7a35', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.1} rb={0.16} h={3.4} p={[0, 1.7, 0]} m={trunk} seg={7} />
        {Array.from({ length: 8 }, (_, k) => (
          <group key={k} position={[0, 3.4, 0]} rotation={[0, (k / 8) * Math.PI * 2, 0]}>
            <Box s={[0.34, 0.03, 1.5]} p={[0, -0.12, 0.72]} r={[0.5, 0, 0]} m={leaf} cast={false} />
          </group>
        ))}
      </group>
    );
  };
  /** Snow peak: grey rock cone with a white cap. */
  const Peak = ({ p, r, h, snow = 0.45, rock = '#7f7d84', seg = 6 }) => {
    const M = useM();
    return (
      <group position={p}>
        <mesh position={[0, h / 2, 0]} material={M.plain(rock, { roughness: 1 })}><coneGeometry args={[r, h, seg]} /></mesh>
        <mesh position={[0, h * (1 - snow / 2), 0]} material={M.plain('#f6f8fc', { roughness: 0.7 })}><coneGeometry args={[r * snow * 1.02, h * snow, seg]} /></mesh>
      </group>
    );
  };
  /** Rows of plain town buildings with parapets and window strips, placed on an arc. */
  const Town = ({ n = 16, r0 = 30, r1 = 40, a0 = 0, a1 = Math.PI * 2, seed = 1, colors = ['#f2e6cc', '#e8c9c0', '#d8e4d6', '#efe6d6'], hMin = 2.4, hMax = 5.5, skip = () => false, roof = '#8a6a5a' }) => {
    const M = useM();
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const a = a0 + ((i + rnd(i + seed)) / n) * (a1 - a0);
          if (skip(a)) return null;
          const r = r0 + rnd(i + seed * 3) * (r1 - r0);
          const w = 2.6 + rnd(i + seed * 5) * 2.4; const h = hMin + rnd(i + seed * 7) * (hMax - hMin);
          const fl = Math.max(1, Math.round(h / 1.4));
          return (
            <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a + Math.PI / 2 + Math.PI, 0]}>
              <Box s={[w, h, 3]} p={[0, h / 2, 0]} m={M.plain(colors[i % colors.length], { roughness: 0.92 })} />
              <Box s={[w + 0.2, 0.14, 3.2]} p={[0, h + 0.07, 0]} m={M.plain(roof, { roughness: 0.9 })} />
              {Array.from({ length: fl }, (_, s) => <Box key={s} s={[w * 0.78, 0.55, 0.05]} p={[0, 0.9 + s * 1.4, 1.52]} m={M.dark} cast={false} />)}
            </group>
          );
        })}
      </group>
    );
  };
  const HillM = ({ p, r, h, m }) => <mesh position={p} scale={[1, h / r, 1]} material={m} receiveShadow><sphereGeometry args={[r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>;
  /** Railing: posts and two rails between two points. */
  const Rail = ({ a, b, y = 0, h = 0.8, m, n = 8 }) => {
    const dx = b[0] - a[0]; const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz); const ang = Math.atan2(dx, dz);
    return (
      <group position={[a[0], y, a[1]]}>
        {Array.from({ length: n + 1 }, (_, k) => <Cyl key={k} rt={0.025} h={h} p={[dx * k / n, h / 2, dz * k / n]} m={m} seg={5} />)}
        {[0.45, 0.95].map((t) => <Box key={t} s={[0.04, 0.04, len]} p={[dx / 2, h * t, dz / 2]} r={[0, ang, 0]} m={m} cast={false} />)}
      </group>
    );
  };

  /* =====================================================================
     RAM MANDIR (Janakpur): two-roofed brick pagoda in a paved court
     ===================================================================== */
  function RamMain() {
    const M = useM();
    const pale = M.plain('#e4dac6', { roughness: 0.95 });
    const redStone = M.plain('#b95a48', { roughness: 0.85 });
    const orange = M.plain('#f0a23a', { roughness: 0.7 });
    const pink = M.plain('#e9a3b8', { roughness: 0.7 });
    const green = M.plain('#5f9b62', { roughness: 0.7 });
    const blue = M.plain('#3f78c0', { roughness: 0.7 });
    const dark = M.plain('#2a1a14');
    const white = M.plain('#f7f4ee', { roughness: 0.85 });
    return (
      <group>
        <Box s={[17, 0.2, 14]} p={[0, 0.1, 0]} m={pale} />
        <Box s={[4.9, 0.5, 4.9]} p={[0, 0.45, 0]} m={M.stone} />
        <Box s={[4.4, 0.18, 4.4]} p={[0, 0.78, 0]} m={redStone} />
        <group position={[0, 0.86, 0]}>
          <PagodaBody tiers={2} w={3.5} d={3.5} walls="red-brick" roof="copper" f={new Set(['carved-struts', 'carved-windows'])} wh={1.05} ov={1.15} taper={0.66} />
        </group>
        {/* white canvas awning draped over the front */}
        <mesh position={[0, 1.7, 2.7]} rotation={[0.55, 0, 0]} material={white}><boxGeometry args={[3.2, 0.03, 1.8]} /></mesh>
        {/* squat red stone columns with square capitals in front, in pairs */}
        {[-3.0, -1.5, 1.5, 3.0].map((x) => (
          <group key={x} position={[x, 0.2, 4.2]}>
            <Box s={[0.55, 0.14, 0.55]} p={[0, 0.07, 0]} m={M.stone} />
            {[-0.17, 0.17].map((dx) => <Cyl key={dx} rt={0.15} rb={0.17} h={1.4} p={[dx, 0.85, 0]} m={redStone} seg={12} />)}
            <Box s={[0.78, 0.2, 0.55]} p={[0, 1.65, 0]} m={M.stone} />
          </group>
        ))}
        {/* small white shikhara shrine and a lingam on a platform */}
        <group position={[5.6, 0.2, 2.6]}>
          <Box s={[1.5, 0.3, 1.5]} p={[0, 0.15, 0]} m={M.stone} />
          <Box s={[1.0, 1.1, 1.0]} p={[0, 0.85, 0]} m={white} />
          <Spire r0={0.62} h={1.5} y={1.4} m={white} />
        </group>
        <group position={[-5.2, 0.2, 3.6]}>
          <Box s={[1.5, 0.3, 1.5]} p={[0, 0.15, 0]} m={M.stone} />
          <Lingam p={[0, 0.3, 0]} />
        </group>
        {/* Rajdevi's bright painted entrance arch */}
        <group position={[-8.2, 0.2, -1.5]} rotation={[0, Math.PI / 2, 0]}>
          {[-1.7, 1.7].map((x) => <Box key={x} s={[0.9, 4.4, 0.9]} p={[x, 2.2, 0]} m={orange} />)}
          <Box s={[4.5, 1.0, 0.9]} p={[0, 4.65, 0]} m={orange} />
          <Box s={[3.0, 0.7, 0.2]} p={[0, 4.65, 0.5]} m={green} />
          <Arch w={2.5} h={3.3} p={[0, 0, 0.46]} m={pink} pt={0.5} />
          <Arch w={2.0} h={2.9} p={[0, 0, 0.47]} m={dark} pt={0.45} />
        </group>
        <PrayerFlags from={[-4, 3.6, 6]} to={[4, 3.6, 6]} n={14} />
        <Frame s={[18, 6.5, 14]} p={[-1, 3.2, 0]} />
      </group>
    );
  }
  function RamEnv() {
    const M = useM();
    const wallY = M.plain('#e9a84a', { roughness: 0.9 });
    const wallR = M.plain('#b94a3a', { roughness: 0.9 });
    return (
      <group>
        <GroundDisc r={80} y={-0.04} m={M.plain('#a3b072', { roughness: 1 })} />
        <GroundDisc r={36} y={-0.02} m={M.plain('#cfc2a4', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow material={M.plain('#e4dac6', { roughness: 0.95 })}><planeGeometry args={[30, 24]} /></mesh>
        {[[-15, 0, 24], [15, 0, 24]].map(([x], k) => <group key={k}><Box s={[0.5, 1.6, 24]} p={[x, 0.8, 0]} m={wallY} /><Box s={[0.52, 0.5, 24]} p={[x, 0.25, 0]} m={wallR} /></group>)}
        <Box s={[30, 1.6, 0.5]} p={[0, 0.8, -12]} m={wallY} />
        <Box s={[30, 0.5, 0.52]} p={[0, 0.25, -12]} m={wallR} />
        {[-1, 1].map((k) => <group key={k}><Box s={[11, 1.6, 0.5]} p={[k * 9.5, 0.8, 12]} m={wallY} /><Box s={[11, 0.5, 0.52]} p={[k * 9.5, 0.25, 12]} m={wallR} /></group>)}
        {/* market stalls with blue and orange tarpaulins at the gate */}
        {[[4, 14.5, '#3a63b0'], [7.5, 14.2, '#e57a30'], [-4, 14.5, '#3a63b0'], [-7.5, 14.8, '#e57a30']].map(([x, z, c], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[2.2, 0.6, 1.2]} p={[0, 0.3, 0]} m={M.plain('#9b7a52')} />
            <mesh position={[0, 1.7, 0]} rotation={[0.25, 0, 0]} material={M.plain(c, { roughness: 0.9 })}><boxGeometry args={[2.8, 0.04, 1.8]} /></mesh>
            {[-1.2, 1.2].map((dx) => <Cyl key={dx} rt={0.04} h={1.7} p={[dx, 0.85, 0.7]} m={M.dark} seg={5} />)}
          </group>
        ))}
        <Tree p={[-11, 0, -6]} s={2.0} />
        <Tree p={[11.5, 0, -7]} s={2.2} />
        <Tree p={[10, 0, 8]} s={1.8} />
        {/* the town beyond: low concrete houses */}
        <Town n={26} r0={28} r1={40} a0={0} a1={Math.PI * 2} seed={11} hMin={3} hMax={7.5} />
        {Array.from({ length: 12 }, (_, k) => <Tree key={`t${k}`} p={[Math.cos(k * 0.55) * 24, 0, Math.sin(k * 0.55 + 3) * 22 - 6]} s={1.3 + rnd(k) * 0.5} />)}
        {/* Ganga Sagar tank beyond the east wall */}
        <group position={[28, 0, 6]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><planeGeometry args={[14, 10]} /><meshStandardMaterial color="#5c8a83" metalness={0.35} roughness={0.12} /></mesh>
          {[0, 1, 2].map((s) => <Box key={s} s={[14 + (2 - s) * 1.2 + 1, 0.1 + (2 - s) * 0.1, 0.8]} p={[0, 0.05 + (2 - s) * 0.05, 5 + (2 - s) * 0.8]} m={M.stone} />)}
          {[0, 1, 2].map((s) => <Box key={`b${s}`} s={[14 + (2 - s) * 1.2 + 1, 0.1 + (2 - s) * 0.1, 0.8]} p={[0, 0.05 + (2 - s) * 0.05, -5 - (2 - s) * 0.8]} m={M.stone} />)}
        </group>
      </group>
    );
  }

  /* =====================================================================
     DANTAKALI TEMPLE (Dharan): small two-roof pagoda, grey roofs, red walls
     ===================================================================== */
  function DantaMain() {
    const M = useM();
    const wallW = M.plain('#ece8e0', { roughness: 0.95 });
    const redW = M.plain('#c9503c', { roughness: 0.8 });
    const yellow = M.plain('#f0b92c', { roughness: 0.7 });
    const dark = M.plain('#33282c');
    const grey = M.plain('#8a8c8e', { roughness: 0.8, metalness: 0.3 });
    return (
      <group>
        <Box s={[12, 0.2, 10]} p={[0, 0.1, 0]} m={M.plain('#d8cdbb', { roughness: 1 })} />
        <Box s={[4.6, 0.5, 4.6]} p={[0, 0.45, 0]} m={wallW} />
        <group position={[0, 0.7, 0]}>
          <Box s={[3.8, 1.25, 3.8]} p={[0, 0.62, 0]} m={redW} />
          <Box s={[4.0, 0.12, 4.0]} p={[0, 1.25, 0]} m={yellow} />
          {[-1, 0, 1].map((k) => <Box key={k} s={[0.9, 0.75, 0.05]} p={[k * 1.2, 0.62, 1.92]} m={dark} cast={false} />)}
          <Box s={[1.0, 0.15, 0.1]} p={[0, 1.08, 1.98]} m={yellow} cast={false} />
          <Roof w={5.4} d={5.4} h={0.7} y={1.2} m={grey} sag={1.2} />
          <Box s={[2.4, 0.8, 2.4]} p={[0, 1.7, 0]} m={redW} />
          {[0, 1, 2, 3].map((k) => <group key={k} rotation={[0, k * Math.PI / 2, 0]}><Box s={[1.4, 0.36, 0.05]} p={[0, 1.7, 1.22]} m={dark} cast={false} /></group>)}
          <Box s={[2.55, 0.1, 2.55]} p={[0, 2.1, 0]} m={yellow} />
          <Roof w={3.8} d={3.8} h={0.7} y={2.06} m={grey} sag={1.2} />
          <Gajur y={2.72} s={0.9} />
        </group>
        {/* the red arched gateway with its grey scalloped nameboard, set in the whitewashed wall */}
        <group position={[0, 0, 4.4]}>
          {[-1, 1].map((k) => <Box key={k} s={[0.6, 2.8, 0.6]} p={[k * 1.3, 1.4, 0]} m={redW} />)}
          <Box s={[3.2, 0.5, 0.6]} p={[0, 2.8, 0]} m={redW} />
          <Arch w={3.0} h={0.8} p={[0, 3.0, 0]} m={M.plain('#4a4a50', { roughness: 0.8 })} />
          <Box s={[1.5, 2.2, 0.12]} p={[0, 1.1, 0.02]} m={M.plain('#7a2c20')} />
          {[-1, 1].map((k) => <Box key={`y${k}`} s={[0.5, 3.4, 0.5]} p={[k * 1.9, 1.7, 0]} m={yellow} />)}
        </group>
        {[[-5.6, 4.4], [5.6, 4.4]].map(([x, z], k) => <Box key={k} s={[7.2, 1.6, 0.4]} p={[x * 0.77 + (x > 0 ? 0.6 : -0.6), 0.8, z]} m={wallW} />)}
        {[-1, 1].map((k) => <Box key={`s${k}`} s={[0.4, 1.6, 9.6]} p={[k * 6.2, 0.8, -0.2]} m={wallW} />)}
        <Box s={[12.8, 1.6, 0.4]} p={[0, 0.8, -5]} m={wallW} />
        <Rail a={[-1.6, 1.8]} b={[1.6, 1.8]} y={0.7} m={M.plain('#8c2b24')} n={6} />
        <Frame s={[13, 6, 11]} p={[0, 3, 0]} />
      </group>
    );
  }
  function DantaEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={80} y={-5} m={M.plain('#8aa05e', { roughness: 1 })} />
        <GroundDisc r={14} y={-0.02} m={M.plain('#cdbd9f', { roughness: 1 })} />
        {/* Bijayapur hill: the temple stands on a shoulder of green forested ridge */}
        <HillM p={[0, -9, 0]} r={34} h={9} m={M.mat('grass', 8, 8, { color: '#7f9c58' })} />
        <HillM p={[-30, -6, -14]} r={28} h={20} m={M.mat('grass', 8, 8, { color: '#6c8c4c' })} />
        <HillM p={[26, -6, -26]} r={26} h={16} m={M.mat('grass', 8, 8, { color: '#789553' })} />
        {Array.from({ length: 34 }, (_, k) => {
          const a = rnd(k) * Math.PI * 2; const r = 9 + rnd(k + 8) * 12;
          const x = Math.cos(a) * r; const z = Math.sin(a) * r;
          if (z > 3 && Math.abs(x) < 9) return null;
          return <Tree key={k} p={[x, -Math.max(0, (r - 9) * 0.22), z]} s={1.3 + rnd(k + 3) * 0.9} kind={k % 5 ? 'broad' : 'pine'} />;
        })}
        {/* Dharan town below: a busy street of low houses */}
        <group position={[0, -6.5, 22]}><Town n={14} r0={8} r1={17} a0={0.1} a1={Math.PI - 0.1} seed={21} hMin={2.5} hMax={6} roof="#7a6a64" /></group>
        <Box s={[16, 0.1, 2]} p={[0, -6.4, 27]} m={M.plain('#6a6a6a')} />
        <Peak p={[-14, -9, -52]} r={20} h={26} snow={0.3} rock="#8c93a0" />
        <Peak p={[22, -9, -60]} r={26} h={30} snow={0.28} rock="#8a909c" />
      </group>
    );
  }

  /* @@SITES */
  return {
    'janaki-mandir': { Main: JanakiMain, Env: JanakiEnv },
    'ram-mandir-janakpur': { Main: RamMain, Env: RamEnv },
    'dantakali-temple-dharan': { Main: DantaMain, Env: DantaEnv },
  };
}
