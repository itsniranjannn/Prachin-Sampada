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
  const { useM, Box, Cyl, Ball, Roof, Gajur, PagodaBody, Tree, Frame, Water, Tank, Chaitya, Trident, PrayerFlags, Spire, Lion, Nandi, Lingam, THREE, wallMat, roofMat, whiteMat, GroundDisc, ringOf, NewarHouse, House, Gumba, Diyo } = K;
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
  const stn = (M) => M.plain('#d6ccb8', { roughness: 0.92 });
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
        <Box s={[2.3, 0.2, 2.3]} p={[0, 0.1, 0]} m={stn(M)} />
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
        <Box s={[21, 0.4, 9.2]} p={[0, 0.2, 0.3]} m={M.plain('#e9e0cc', { roughness: 0.95 })} />
        {[0, 1, 2].map((k) => <Box key={k} s={[3.4 + k * 0.5, 0.13, 0.4]} p={[0, 0.07 + (2 - k) * 0.0 + 0.0, 4.35 + 0.0 + (2 - k) * 0.3 + 0.2 - 0.2]} m={stn(M)} />)}

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
        <Frame s={[21, 9.5, 9]} p={[0, 4.7, 0.3]} />
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
        {[-1, 1].map((k) => <group key={`gp${k}`} position={[k * 2.6, 0, 22]} scale={[1, 0.5, 1]}><Box s={[1.1, 3.2, 1.1]} p={[0, 1.6, 0]} m={wm} /><Box s={[1.3, 0.14, 1.3]} p={[0, 3.2, 0]} m={M.plain('#e8a24d')} /><Dome r={0.55} h={0.8} p={[0, 3.25, 0]} m={M.plain('#a9cdb9')} /></group>)}
        
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
            {[0, 1, 2, 3].map((s) => <Box key={s} s={[19 + (3 - s) * 1.0 + 1, 0.12 + (3 - s) * 0.1, 0.7]} p={[0, 0.06 + (3 - s) * 0.05, -6.5 - (3 - s) * 0.7]} m={stn(M)} />)}
            {[0, 1, 2, 3].map((s) => <Box key={`e${s}`} s={[0.7, 0.12 + (3 - s) * 0.1, 13 + (3 - s) * 1.4]} p={[-9.5 - (3 - s) * 0.7, 0.06 + (3 - s) * 0.05, 0]} m={stn(M)} />)}
            {[0, 1, 2, 3].map((s) => <Box key={`f${s}`} s={[0.7, 0.12 + (3 - s) * 0.1, 13 + (3 - s) * 1.4]} p={[9.5 + (3 - s) * 0.7, 0.06 + (3 - s) * 0.05, 0]} m={stn(M)} />)}
            {[0, 1, 2, 3].map((s) => <Box key={`g${s}`} s={[19 + (3 - s) * 1.0 + 1, 0.12 + (3 - s) * 0.1, 0.7]} p={[0, 0.06 + (3 - s) * 0.05, 6.5 + (3 - s) * 0.7]} m={stn(M)} />)}
            <group position={[0, 0, -9.6]}><Box s={[2.2, 0.3, 2.2]} p={[0, 0.15, 0]} m={stn(M)} /><Cyl rt={0.5} rb={0.6} h={1.3} p={[0, 0.95, 0]} m={wm} seg={10} /><Dome r={0.62} h={0.8} p={[0, 1.6, 0]} m={M.plain('#e8a24d')} /></group>
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
        <Box s={[4.9, 0.5, 4.9]} p={[0, 0.45, 0]} m={stn(M)} />
        <Box s={[4.4, 0.18, 4.4]} p={[0, 0.78, 0]} m={redStone} />
        <group position={[0, 0.86, 0]}>
          <PagodaBody tiers={2} w={3.5} d={3.5} walls="red-brick" roof="copper" f={new Set(['carved-struts', 'carved-windows'])} wh={1.05} ov={1.15} taper={0.66} />
        </group>
        {/* white canvas awning draped over the front */}
        <mesh position={[0, 1.7, 2.7]} rotation={[0.55, 0, 0]} material={white}><boxGeometry args={[3.2, 0.03, 1.8]} /></mesh>
        {/* squat red stone columns with square capitals in front, in pairs */}
        {[-3.0, -1.5, 1.5, 3.0].map((x) => (
          <group key={x} position={[x, 0.2, 4.2]}>
            <Box s={[0.55, 0.14, 0.55]} p={[0, 0.07, 0]} m={stn(M)} />
            {[-0.17, 0.17].map((dx) => <Cyl key={dx} rt={0.15} rb={0.17} h={1.4} p={[dx, 0.85, 0]} m={redStone} seg={12} />)}
            <Box s={[0.78, 0.2, 0.55]} p={[0, 1.65, 0]} m={stn(M)} />
          </group>
        ))}
        {/* small white shikhara shrine and a lingam on a platform */}
        <group position={[5.6, 0.2, 2.6]}>
          <Box s={[1.5, 0.3, 1.5]} p={[0, 0.15, 0]} m={stn(M)} />
          <Box s={[1.0, 1.1, 1.0]} p={[0, 0.85, 0]} m={white} />
          <Spire r0={0.62} h={1.5} y={1.4} m={white} />
        </group>
        <group position={[-5.2, 0.2, 3.6]}>
          <Box s={[1.5, 0.3, 1.5]} p={[0, 0.15, 0]} m={stn(M)} />
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
        {[[-4, 14.5, '#3a63b0'], [-7.5, 14.8, '#e57a30']].map(([x, z, c], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[2.2, 0.6, 1.2]} p={[0, 0.3, 0]} m={M.plain('#9b7a52')} />
            <mesh position={[0, 1.7, 0]} rotation={[0.25, 0, 0]} material={M.plain(c, { roughness: 0.9 })}><boxGeometry args={[2.8, 0.04, 1.8]} /></mesh>
            {[-1.2, 1.2].map((dx) => <Cyl key={dx} rt={0.04} h={1.7} p={[dx, 0.85, 0.7]} m={M.dark} seg={5} />)}
          </group>
        ))}
        <Tree p={[-11, 0, -6]} s={2.0} />
        <Tree p={[11.5, 0, -7]} s={2.2} />
                {/* the town beyond: low concrete houses */}
        <Town n={26} r0={28} r1={40} a0={0} a1={Math.PI * 2} seed={11} hMin={3} hMax={7.5} />
        {Array.from({ length: 12 }, (_, k) => <Tree key={`t${k}`} p={[Math.cos(k * 0.55) * 24, 0, Math.sin(k * 0.55 + 3) * 22 - 6]} s={1.3 + rnd(k) * 0.5} />)}
        {/* Ganga Sagar tank beyond the east wall */}
        <group position={[28, 0, 6]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><planeGeometry args={[14, 10]} /><meshStandardMaterial color="#5c8a83" metalness={0.35} roughness={0.12} /></mesh>
          {[0, 1, 2].map((s) => <Box key={s} s={[14 + (2 - s) * 1.2 + 1, 0.1 + (2 - s) * 0.1, 0.8]} p={[0, 0.05 + (2 - s) * 0.05, 5 + (2 - s) * 0.8]} m={stn(M)} />)}
          {[0, 1, 2].map((s) => <Box key={`b${s}`} s={[14 + (2 - s) * 1.2 + 1, 0.1 + (2 - s) * 0.1, 0.8]} p={[0, 0.05 + (2 - s) * 0.05, -5 - (2 - s) * 0.8]} m={stn(M)} />)}
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
        <Box s={[10.4, 0.2, 9]} p={[0, 0.1, 0]} m={M.plain('#d8cdbb', { roughness: 1 })} />
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
        <group position={[-2.5, 0, 4.2]}>
          {[-1, 1].map((k) => <Box key={k} s={[0.6, 2.8, 0.6]} p={[k * 1.3, 1.4, 0]} m={redW} />)}
          <Box s={[3.2, 0.5, 0.6]} p={[0, 2.8, 0]} m={redW} />
          <Arch w={3.0} h={0.8} p={[0, 3.0, 0]} m={M.plain('#6a6a72', { roughness: 0.8 })} />
          <Box s={[1.5, 2.2, 0.12]} p={[0, 1.1, 0.02]} m={M.plain('#7a2c20')} />
          {[-1, 1].map((k) => <Box key={`y${k}`} s={[0.5, 3.4, 0.5]} p={[k * 1.9, 1.7, 0]} m={yellow} />)}
        </group>
        <Box s={[1.0, 1.6, 0.4]} p={[-4.7, 0.8, 4.2]} m={wallW} /><Box s={[6.0, 1.6, 0.4]} p={[1.9, 0.8, 4.2]} m={wallW} />
        {[-1, 1].map((k) => <Box key={`s${k}`} s={[0.4, 1.6, 8.6]} p={[k * 5.1, 0.8, 0]} m={wallW} />)}
        <Box s={[10.6, 1.6, 0.4]} p={[0, 0.8, -4.3]} m={wallW} />
        <Rail a={[-1.6, 2.4]} b={[1.6, 2.4]} y={0.7} m={M.plain('#8c2b24')} n={6} />
        <Frame s={[11, 5.2, 9.4]} p={[0, 2.6, 0]} />
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
        <HillM p={[0, -9, 0]} r={34} h={9} m={M.plain('#86a85e', { roughness: 1 })} />
        <HillM p={[-34, -6, -22]} r={26} h={16} m={M.plain('#6f9a52', { roughness: 1 })} />
        <HillM p={[32, -6, -30]} r={24} h={14} m={M.plain('#78a45a', { roughness: 1 })} />
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

  const ArchBlock = ({ w, h, depth = 0.5, p, r = 0, m }) => {
    const geo = useMemo(() => { const g = new THREE.ExtrudeGeometry(archShape(THREE, w, h), { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); return g; }, [w, h, depth]);
    return <mesh geometry={geo} position={p} rotation={[0, r, 0]} material={m} castShadow receiveShadow />;
  };
  /** Hanging temple bell (brass). */
  const Bell = ({ p, s = 1 }) => {
    const M = useM();
    const geo = useMemo(() => new THREE.LatheGeometry([[0.02, 0.36], [0.16, 0.34], [0.22, 0.1], [0.3, -0.1], [0.3, -0.14]].map(([x, y]) => new THREE.Vector2(x, y)), 14), []);
    return <mesh geometry={geo} position={p} scale={s} material={M.plain('#8a6b2e', { metalness: 0.8, roughness: 0.4 })} castShadow />;
  };
  const BambooClump = ({ p, n = 12, h = 9, seed = 1 }) => {
    const M = useM();
    const stem = M.plain('#b3a55c', { roughness: 0.8 });
    const leaf = M.plain('#6f9340', { roughness: 1 });
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, k) => {
          const a = (k / n) * Math.PI * 2 + seed; const rr = 0.2 + rnd(k + seed) * 0.7;
          const hh = h * (0.8 + rnd(k + seed * 3) * 0.4); const lean = 0.08 + rnd(k) * 0.12;
          return (
            <group key={k} position={[Math.cos(a) * rr, 0, Math.sin(a) * rr]} rotation={[Math.sin(a) * lean, 0, -Math.cos(a) * lean]}>
              <Cyl rt={0.05} rb={0.08} h={hh} p={[0, hh / 2, 0]} m={stem} seg={6} />
              <Ball rad={0.55} sc={[1, 1.5, 1]} p={[0, hh * 0.9, 0]} m={leaf} />
            </group>
          );
        })}
      </group>
    );
  };

  /* =====================================================================
     BUDHA SUBBA TEMPLE (Dharan): open red-posted pavilion, yellow arched shrines, bamboo grove
     ===================================================================== */
  function BudhaMain() {
    const M = useM();
    const red = M.plain('#a3281f', { roughness: 0.75 });
    const green = M.plain('#3e8a58', { roughness: 0.8 });
    const yellow = M.plain('#eed33a', { roughness: 0.7 });
    const roofG = M.plain('#9db79d', { roughness: 0.55, metalness: 0.35 });
    const dark = M.plain('#2a1a16');
    const stone = M.plain('#a49a8a', { roughness: 1 });
    return (
      <group>
        <Box s={[11, 0.3, 7.5]} p={[1.6, 0.15, 0.6]} m={M.plain('#b9825a', { roughness: 1 })} />
        {/* pavilion on a low plinth */}
        <Box s={[6.4, 0.5, 4.4]} p={[-1.2, 0.5, 0]} m={stone} />
        <Box s={[6.0, 0.65, 0.18]} p={[-1.2, 1.1, 1.9]} m={green} />
        <Box s={[6.0, 0.18, 0.2]} p={[-1.2, 0.8, 1.92]} m={red} />
        <Box s={[6.0, 0.65, 0.18]} p={[-1.2, 1.1, -1.9]} m={green} />
        {[-1, 1].map((k) => <Box key={k} s={[0.18, 0.65, 3.8]} p={[-1.2 + k * 2.9, 1.1, 0]} m={green} />)}
        {Array.from({ length: 6 }, (_, k) => [1.9, -1.9].map((z) => <Cyl key={`${k}${z}`} rt={0.1} h={2.2} p={[-3.7 + k * 1.0, 2.0, z]} m={red} seg={8} />))}
        {[-1, 1].map((k) => <Cyl key={`p${k}`} rt={0.1} h={2.2} p={[-1.2 + k * 2.9, 2.0, 0]} m={red} seg={8} />)}
        <Box s={[6.2, 0.2, 4.2]} p={[-1.2, 3.1, 0]} m={red} />
        <Roof w={7.4} d={5.4} h={0.8} y={3.15} m={roofG} sag={1.15} lift={0.05} />
        <Box s={[7.4, 0.14, 0.06]} p={[-1.2, 3.1, 2.7]} m={red} />
        {/* the second tier: a yellow band under a small hipped roof */}
        <Box s={[3.4, 0.55, 2.4]} p={[-1.2, 3.8, 0]} m={yellow} />
        <Roof w={4.4} d={3.4} h={0.7} y={4.05} m={roofG} sag={1.15} lift={0.05} />
        {/* strings of brass bells under the eaves and hanging threads */}
        {Array.from({ length: 12 }, (_, k) => <Bell key={k} p={[-3.9 + k * 0.5, 2.85, 2.65]} s={0.28} />)}
        {Array.from({ length: 14 }, (_, k) => <Box key={`t${k}`} s={[0.04, 0.8, 0.04]} p={[-4.1 + k * 0.45, 2.55, 2.4]} m={M.plain(k % 2 ? '#d33a2a' : '#e0a22a')} cast={false} />)}
        <Cyl rt={0.05} h={0.3} p={[-1.2, 4.7, 0]} m={M.gold} seg={6} />
        {/* the yellow arched shrines with their red posts */}
        {[[4.2, 1.9], [6.2, 0.4]].map(([x, z], k) => (
          <group key={k} position={[x, 0.3, z]}>
            <Box s={[1.6, 0.2, 1.4]} p={[0, 0.1, 0]} m={stone} />
            {[-0.7, 0.7].map((dx) => <Box key={dx} s={[0.22, 1.7, 0.22]} p={[dx, 1.05, 0.5]} m={red} />)}
            <Box s={[1.4, 1.6, 0.9]} p={[0, 0.95, -0.2]} m={M.plain('#ca6a54')} />
            <ArchBlock w={1.8} h={1.1} depth={1.3} p={[0, 1.8, 0]} m={yellow} />
            <Arch w={1.0} h={1.0} p={[0, 0.2, 0.56]} m={dark} />
          </group>
        ))}
        <Bell p={[3.4, 1.6, 4.2]} s={0.8} />
        <Frame s={[11, 4.6, 7]} p={[1.6, 2.3, 0.8]} />
      </group>
    );
  }
  function BudhaEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={80} y={-0.04} m={M.plain('#7b9250', { roughness: 1 })} />
        <GroundDisc r={22} y={-0.02} m={M.plain('#b9825a', { roughness: 1 })} />
        {/* stone retaining wall of the hilltop */}
        <mesh position={[0, -0.9, -1]} material={M.plain('#9a9283', { roughness: 1 })}><cylinderGeometry args={[18, 18.5, 1.8, 40, 1, true]} /></mesh>
        {[[-9, -5], [-3, -8], [6, -7], [11, -2], [-11, 0], [1, -5.5]].map(([x, z], k) => <BambooClump key={k} p={[x, 0, z]} n={12} h={6.2 + (k % 3)} seed={k + 1} />)}
        {[[-15, -4], [15, -9], [-8, -13]].map(([x, z], k) => <Tree key={`b${k}`} p={[x, 0, z]} s={2.4 + k * 0.2} />)}
        {Array.from({ length: 30 }, (_, k) => {
          const a = rnd(k + 90) * Math.PI * 2; const r = 20 + rnd(k + 33) * 16;
          return <Tree key={`f${k}`} p={[Math.cos(a) * r, -2, Math.sin(a) * r]} s={1.8 + rnd(k) * 1.4} kind={k % 3 ? 'broad' : 'pine'} />;
        })}
        <Peak p={[-20, -3, -55]} r={26} h={22} snow={0.01} rock="#7a9a8a" />
        <Peak p={[25, -3, -50]} r={22} h={16} snow={0.01} rock="#86a08e" />
      </group>
    );
  }

  /* =====================================================================
     PINDESHWOR BABADHAM (Dharan): orange pyramid-spired Shiva temple with a long arcaded hall
     ===================================================================== */
  function PindeshMain() {
    const M = useM();
    const orange = M.plain('#e4692e', { roughness: 0.85 });
    const spireM = M.plain('#d2502a', { roughness: 0.8 });
    const yellow = M.plain('#f1c52e', { roughness: 0.7 });
    const grey = M.plain('#cfcbc2', { roughness: 0.95 });
    const dark = M.plain('#35241e');
    const white = M.plain('#f4f0e8', { roughness: 0.85 });
    return (
      <group>
        <Box s={[22, 0.2, 14]} p={[0, 0.1, 0]} m={M.plain('#cfc5ae', { roughness: 1 })} />
        {/* sanctum block and its tall four-sided spire */}
        <Box s={[3.6, 2.6, 3.6]} p={[5, 1.5, -1]} m={grey} />
        <Box s={[3.8, 0.3, 3.8]} p={[5, 0.35, -1]} m={M.plain('#a85a40')} />
        <Arch w={1.0} h={1.7} p={[5, 0.4, 0.82]} m={dark} />
        <Box s={[4.1, 0.3, 4.1]} p={[5, 2.9, -1]} m={yellow} />
        <mesh position={[5, 2.95 + 2.7, -1]} rotation={[0, Math.PI / 4, 0]} material={spireM} castShadow><coneGeometry args={[2.9, 5.4, 4]} /></mesh>
                <Cyl rt={0.18} rb={0.3} h={0.4} p={[5, 8.5, -1]} m={M.gold} seg={8} />
        <Trident p={[5, 8.6, -1]} h={1.7} />
        {/* the long low orange hall with its row of arched openings */}
        <Box s={[12.6, 2.1, 3.0]} p={[-3.1, 1.2, -1]} m={orange} />
        <Box s={[12.8, 0.18, 3.2]} p={[-3.1, 2.3, -1]} m={yellow} />
        <Box s={[12.8, 0.3, 3.2]} p={[-3.1, 0.15, -1]} m={M.plain('#9a4a30')} />
        {Array.from({ length: 10 }, (_, k) => <group key={k}><Arch w={0.78} h={1.25} p={[-8.4 + k * 1.2, 0.5, 0.52]} m={yellow} /><Arch w={0.58} h={1.1} p={[-8.4 + k * 1.2, 0.5, 0.53]} m={dark} /></group>)}
        {/* a white shrine with an orange dome, and a small white-domed one, behind */}
        <group position={[-1.5, 0.2, 5]}>
          <Box s={[2.2, 0.5, 2.2]} p={[0, 0.25, 0]} m={white} />
          <Box s={[1.6, 1.2, 1.6]} p={[0, 1.1, 0]} m={white} />
          <Arch w={0.7} h={0.9} p={[0, 0.7, 0.81]} m={dark} />
          <Dome r={0.95} h={1.1} p={[0, 1.7, 0]} m={M.plain('#f09a38')} />
        </group>
        {/* yellow entrance arch, two stub towers, strings of flags */}
        <group position={[-3, 0.2, 6.6]}>
          {[-1, 1].map((k) => <group key={k} position={[k * 2.0, 0, 0]}><Box s={[0.9, 2.6, 0.7]} p={[0, 1.3, 0]} m={yellow} /><Dome r={0.4} h={0.6} p={[0, 2.6, 0]} m={yellow} /></group>)}
          <Box s={[4.9, 0.8, 0.7]} p={[0, 2.3, 0]} m={yellow} />
          <Arch w={3.2} h={1.9} p={[0, 0, 0.36]} m={dark} />
        </group>
        <PrayerFlags from={[-5, 3.4, 6.6]} to={[3, 5.6, -1]} n={14} />
        <Frame s={[22, 9, 14]} p={[0, 4.5, 0]} />
      </group>
    );
  }
  function PindeshEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={80} y={-0.04} m={M.plain('#8aa45c', { roughness: 1 })} />
        <GroundDisc r={26} y={-0.02} m={M.plain('#a9c07a', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow material={M.plain('#cfc5ae', { roughness: 1 })}><planeGeometry args={[24, 18]} /></mesh>
        <Box s={[24, 1.4, 0.4]} p={[0, 0.7, -9]} m={M.plain('#e8d38a')} />
        <Box s={[0.4, 1.4, 18]} p={[12, 0.7, 0]} m={M.plain('#e8d38a')} />
        <Box s={[0.4, 1.4, 18]} p={[-12, 0.7, 0]} m={M.plain('#e8d38a')} />
        {Array.from({ length: 14 }, (_, k) => <Palm key={k} p={[-30 + k * 4.6 + rnd(k) * 2, 0, -16 - rnd(k + 4) * 8]} s={1.1 + rnd(k) * 0.5} />)}
        {Array.from({ length: 24 }, (_, k) => { const a = Math.PI + (k / 23) * Math.PI; const r = 17 + rnd(k) * 5; return <Tree key={`t${k}`} p={[Math.cos(a) * r, 0, Math.sin(a) * r]} s={2.0 + rnd(k + 2)} />; })}
        <Town n={14} r0={30} r1={40} a0={Math.PI + 0.2} a1={Math.PI * 2 - 0.2} seed={5} hMin={3} hMax={6} />
        <HillM p={[-26, -8, -42]} r={36} h={24} m={M.plain('#6c8f4c', { roughness: 1 })} />
        <HillM p={[26, -8, -46]} r={30} h={20} m={M.plain('#789a56', { roughness: 1 })} />
      </group>
    );
  }

  /* =====================================================================
     PATHIBHARA DEVI (Taplejung): open summit shrine, bells, flags, Kanchenjunga behind
     ===================================================================== */
  function PathibharaMain() {
    const M = useM();
    const rock = M.plain('#b2ab9c', { roughness: 1 });
    const red = M.plain('#c4281f', { roughness: 0.8 });
    const gold = M.gold;
    const marigold = M.plain('#f2a516', { roughness: 0.9 });
    const blueRoof = M.plain('#4a76b8', { roughness: 0.5, metalness: 0.4 });
    const wood = M.plain('#c2a05a', { roughness: 0.85 });
    return (
      <group>
        <Rocks p={[0, -0.5, 0]} s={4.6} seed={3} m={rock} sc={[1.55, 0.26, 1.2]} />
        {/* the goddess on a stone platform under a red canopy, with tridents */}
        <Box s={[3.0, 0.7, 2.6]} p={[0, 0.35, 0]} m={stn(M)} />
        <group position={[0, 0.7, 0]}>
          <mesh position={[0, 0.8, 0]} material={red} castShadow><coneGeometry args={[0.85, 1.6, 12]} /></mesh>
          <Cyl rt={0.9} rb={0.9} h={0.18} p={[0, 0.2, 0]} m={marigold} seg={14} />
          <Ball rad={0.25} p={[0, 1.78, 0]} m={gold} />
          <mesh position={[0, 2.12, 0]} material={gold}><coneGeometry args={[0.22, 0.4, 8]} /></mesh>
          {[-1, 1].map((k) => <Cyl key={k} rt={0.05} h={0.9} p={[k * 0.5, 1.2, 0.2]} r={[0.2, 0, -k * 0.5]} m={gold} seg={6} />)}
          <Box s={[1.1, 0.3, 0.35]} p={[0, 1.38, 0.3]} m={M.plain('#2f9fd6')} />
          <Ball rad={0.5} sc={[1.6, 0.4, 0.8]} p={[0, 1.3, 0.38]} m={marigold} />
        </group>
        {[-1.4, 1.4].map((x) => <Cyl key={x} rt={0.06} h={3.2} p={[x, 1.6, -0.9]} m={M.dark} seg={6} />)}
        <Box s={[3.4, 0.08, 2.0]} p={[0, 3.2, -0.2]} r={[0.25, 0, 0]} m={red} />
        {[[-2.1, 1.6], [-1.6, 2.1], [2.0, 1.7], [1.6, 2.1], [0, 2.3]].map(([x, z], k) => <Trident key={k} p={[x, 0.2, z]} h={1.8 + (k % 2) * 0.6} />)}
        {/* huge brass bell on its gallows frame */}
        <group position={[-3.8, 0, 2.6]}>
          {[-0.8, 0.8].map((x) => <Cyl key={x} rt={0.09} h={2.6} p={[x, 1.3, 0]} m={M.dark} seg={6} />)}
          <Box s={[2.0, 0.14, 0.14]} p={[0, 2.6, 0]} m={M.dark} />
          <Bell p={[0, 1.85, 0]} s={1.9} />
        </group>
        {/* the small blue-roofed shelter, wooden walls on a stone base */}
        <group position={[5.2, 0, -1.6]}>
          <Box s={[3.2, 0.4, 3.2]} p={[0, 0.2, 0]} m={rock} />
          <Box s={[3.0, 1.3, 3.0]} p={[0, 1.05, 0]} m={wood} />
          <Box s={[1.0, 0.5, 0.05]} p={[0, 1.2, 1.52]} m={M.plain('#e8e4da')} cast={false} />
          <Roof w={4.0} d={4.0} h={0.8} y={1.7} m={blueRoof} sag={1.1} lift={0.05} />
          <Box s={[1.5, 0.5, 1.5]} p={[0, 2.5, 0]} m={wood} />
          <Roof w={2.2} d={2.2} h={0.5} y={2.7} m={blueRoof} sag={1.1} lift={0.05} />
        </group>
        {/* flag poles with many strings of prayer flags */}
        {[[-5.5, -3], [6, 3.4], [-1, -4.4], [4, 5.6]].map(([x, z], k) => <Cyl key={k} rt={0.05} h={5.2} p={[x, 2.6, z]} m={M.plain('#8a6a4a')} seg={5} />)}
        <PrayerFlags from={[-5.5, 5, -3]} to={[6, 4.8, 3.4]} n={26} />
        <PrayerFlags from={[-5.5, 4.6, -3]} to={[-1, 5, -4.4]} n={14} />
        <PrayerFlags from={[-1, 4.9, -4.4]} to={[4, 4.7, 5.6]} n={26} />
        <PrayerFlags from={[-5.5, 4.2, -3]} to={[4, 4.5, 5.6]} n={30} />
        <PrayerFlags from={[6, 4.9, 3.4]} to={[4, 4.8, 5.6]} n={8} />
        {[[2.6, 2.2, 2.4], [-2.8, 1.1, 3.6], [3.2, 2.8, -3.5]].map(([x, z, s], k) => <Rocks key={k} p={[x * 1.5, 0, z + 1]} s={s * 0.4} seed={k + 7} m={rock} />)}
        <Frame s={[15, 6.5, 12]} p={[0, 3, 0]} />
      </group>
    );
  }
  function PathibharaEnv() {
    const M = useM();
    const rock = M.plain('#8a8378', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={16} y={-0.05} m={M.plain('#a39d8a', { roughness: 1 })} />
        <GroundDisc r={90} y={-12} m={M.plain('#6c7f9a', { roughness: 1 })} />
        {/* Kanchenjunga massif and its snowy neighbours */}
        <Peak p={[-12, -12, -46]} r={30} h={56} snow={0.55} seg={7} />
        <Peak p={[20, -12, -44]} r={22} h={44} snow={0.52} seg={6} rock="#85848d" />
        <Peak p={[-40, -12, -40]} r={20} h={36} snow={0.5} seg={6} rock="#85848d" />
        <Peak p={[46, -12, -38]} r={20} h={30} snow={0.45} seg={6} rock="#8a8a94" />
        {/* dark forested ridges falling away, hazy blue */}
        {[[-40, -2, 14], [40, -4, 10], [0, -6, -24], [-52, -8, -10], [52, -8, -14]].map(([x, z, r], k) => <HillM key={k} p={[x, -12, z]} r={r} h={9 + k * 1.5} m={M.plain(k % 2 ? '#4c6a6a' : '#566f78', { roughness: 1 })} />)}
        {Array.from({ length: 22 }, (_, k) => { const a = rnd(k) * Math.PI * 2; const r = 15 + rnd(k + 9) * 10; return <Tree key={k} p={[Math.cos(a) * r, -3 - (r - 15) * 0.4, Math.sin(a) * r]} s={2.2 + rnd(k) * 1.4} kind="pine" />; })}
        {[[-20, 6, -26, 6], [18, 7, -30, 6]].map(([x, y, z, r], k) => <mesh key={`c${k}`} position={[x, y - 4, z]} scale={[1.8, 0.35, 1]}><sphereGeometry args={[r, 14, 10]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.65} roughness={1} /></mesh>)}
      </group>
    );
  }

  /* =====================================================================
     BARAHACHHETRA: white domed temples on a terrace above the Saptakoshi
     ===================================================================== */
  function BarahaMain() {
    const M = useM();
    const wm = M.plain('#f6f4ee', { roughness: 0.85 });
    const lav = M.plain('#8e72c8', { roughness: 0.6 });
    const olive = M.plain('#8d8a2b', { roughness: 0.6, metalness: 0.3 });
    const blue = M.plain('#3465b0', { roughness: 0.6 });
    const brown = M.plain('#a98055', { roughness: 0.85 });
    const dark = M.plain('#33261f');
    const tile = M.plain('#c1706a', { roughness: 0.95 });
    const temple = (p, s, k) => (
      <group position={p} scale={s} key={k}>
        <Box s={[2.8, 0.4, 2.8]} p={[0, 0.2, 0]} m={wm} />
        <Box s={[2.4, 1.9, 2.4]} p={[0, 1.35, 0]} m={wm} />
        <Arch w={0.9} h={1.3} p={[0, 0.4, 1.21]} m={dark} pt={0.1} />
        <Box s={[2.6, 0.14, 2.6]} p={[0, 2.35, 0]} m={wm} />
        <Cyl rt={0.9} rb={1.0} h={0.7} p={[0, 2.75, 0]} m={wm} seg={8} />
        <Dome r={1.0} h={1.2} p={[0, 3.1, 0]} m={wm} seg={16} />
        {[[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]].map(([a, b], j) => <Cyl key={j} rt={0.03} rb={0.12} h={0.5} p={[a, 2.6, b]} m={wm} seg={6} />)}
      </group>
    );
    return (
      <group>
        <Box s={[16, 0.5, 13]} p={[0, 0.25, 0]} m={stn(M)} />
        <Box s={[17, 0.3, 14]} p={[0, -0.1, 0]} m={M.plain('#9a9283', { roughness: 1 })} />
        {temple([-1.2, 0.5, -3.6], 1.35, 'main')}
        {temple([-5.4, 0.5, -1.2], 1.0, 'b')}
        {temple([3.2, 0.5, -4.4], 0.9, 'c')}
        {/* the circular Varaha basin with its violet rim and the statue in the middle */}
        <group position={[0.8, 0.5, 2.6]}>
          <Cyl rt={2.5} rb={2.5} h={0.7} p={[0, 0.35, 0]} m={lav} seg={32} />
          <Cyl rt={1.85} rb={1.85} h={0.72} p={[0, 0.36, 0]} m={M.plain('#2c5a48', { roughness: 0.2, metalness: 0.3 })} seg={32} />
          <Cyl rt={2.6} rb={2.6} h={0.12} p={[0, 0.72, 0]} m={wm} seg={32} />
          <Cyl rt={0.35} rb={0.4} h={0.25} p={[0, 0.45, 0]} m={M.plain('#d4413a')} seg={12} />
          <Box s={[0.4, 1.0, 0.25]} p={[0, 1.0, 0]} m={M.plain('#6fb6b0')} />
          <Ball rad={0.2} p={[0, 1.6, 0.04]} m={M.plain('#8a6bb0')} />
          <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} material={olive}><torusGeometry args={[3.5, 0.04, 6, 36]} /></mesh>
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} material={olive}><torusGeometry args={[3.5, 0.04, 6, 36]} /></mesh>
          {Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return <Cyl key={k} rt={0.03} h={0.85} p={[Math.cos(a) * 3.5, 0.45, Math.sin(a) * 3.5]} m={olive} seg={5} />; })}
          {[0, 1, 2, 3].map((k) => { const a = (k / 4) * Math.PI * 2 + 0.78; return <Ball key={k} rad={0.12} p={[Math.cos(a) * 3.5, 1.0, Math.sin(a) * 3.5]} m={M.plain('#b9e27a')} />; })}
        </group>
        {/* brown octagonal-roofed pavilion in front */}
        <group position={[-5.6, 0.5, 4.6]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.1} h={1.6} p={[a * 0.9, 0.8, b * 0.9]} m={M.plain('#6b4a34')} seg={6} />)}
          <Box s={[2.2, 0.2, 2.2]} p={[0, 1.7, 0]} m={M.plain('#6b4a34')} />
          <Roof w={3.2} d={3.2} h={1.3} y={1.75} m={brown} sag={1.3} lift={0.02} />
          <Gajur y={3.0} s={0.45} />
        </group>
        {/* main gate with finials, and blue steel railings along the terrace edge */}
        <group position={[6.4, 0.5, 4.6]}>
          {[-1, 1].map((k) => <group key={k} position={[k * 1.3, 0, 0]}><Box s={[0.6, 2.2, 0.6]} p={[0, 1.1, 0]} m={wm} /><mesh position={[0, 2.5, 0]} material={wm}><coneGeometry args={[0.2, 0.6, 6]} /></mesh></group>)}
          <Arch w={2.0} h={1.4} p={[0, 0.9, 0]} m={wm} pt={0.3} />
        </group>
        <Rail a={[-7.8, 6.3]} b={[7.8, 6.3]} y={0.5} m={blue} n={16} h={0.9} />
        <Rail a={[7.8, 6.3]} b={[7.8, -3]} y={0.5} m={blue} n={8} h={0.9} />
        <Frame s={[17, 6.5, 14]} p={[0, 3.2, 0]} />
      </group>
    );
  }
  function BarahaEnv() {
    const M = useM();
    const forest = M.plain('#6f9a48', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={90} y={-6.5} m={M.plain('#8c9a68', { roughness: 1 })} />
        {/* the terrace is a stone-faced bluff above the river valley */}
        <Box s={[22, 6.4, 18]} p={[0, -3.2, 0]} m={M.plain('#8c8374', { roughness: 1 })} />
        <mesh position={[0, -3.3, 0]} rotation={[0, 0, 0]} material={M.plain('#7a9858', { roughness: 1 })}><cylinderGeometry args={[14, 20, 6.6, 6, 1]} /></mesh>
        {/* the broad Saptakoshi with pale sand banks, flowing east-west below the terrace */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.4, -22]}><planeGeometry args={[160, 12]} /><meshStandardMaterial color="#58919a" metalness={0.3} roughness={0.15} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, -6.35, -14]}><planeGeometry args={[90, 6]} /><meshStandardMaterial color="#d9cfb2" roughness={1} /></mesh>
        {[[-20, -26, 5, 0.5], [14, -20, 7, 0.6], [30, -28, 4, 0.4]].map(([x, z, r, s], k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, -6.3, z]} scale={[1.6, 1, 1]}><circleGeometry args={[r, 20]} /><meshStandardMaterial color="#cfc5a6" roughness={1} /></mesh>)}
        {/* steep forested hills on the far bank and flanks */}
        <HillM p={[-18, -6.5, -40]} r={28} h={26} m={forest} />
        <HillM p={[20, -6.5, -42]} r={30} h={30} m={M.plain('#6a8a4c', { roughness: 1 })} />
        <HillM p={[-46, -6.5, -8]} r={24} h={20} m={forest} />
        <HillM p={[46, -6.5, -10]} r={24} h={18} m={M.plain('#6a8a4c', { roughness: 1 })} />
        {Array.from({ length: 34 }, (_, k) => { const x = -50 + k * 3 + rnd(k) * 2; const z = -36 - rnd(k + 3) * 14; return <Tree key={k} p={[x, -6.5 + 5 + rnd(k) * 7, z]} s={2.4 + rnd(k) * 1.2} kind={k % 3 ? 'broad' : 'pine'} />; })}
        {[[-12, -6], [-13, 2], [11, -7], [12, -1]].map(([x, z], k) => <Tree key={`n${k}`} p={[x, 0, z]} s={1.8 + rnd(k) * 0.6} />)}
        <Tree p={[10, 0, -7]} s={2.0} />
        <Tree p={[-9, 0, -6.5]} s={2.0} />
      </group>
    );
  }

  /* =====================================================================
     TENGBOCHE MONASTERY (Khumbu): red-walled gompa, painted gate, white chorten, Ama Dablam behind
     ===================================================================== */
  function TengMain() {
    const M = useM();
    const stone = M.plain('#a79f92', { roughness: 1 });
    const maroon = M.plain('#8c2e29', { roughness: 0.85 });
    const redW = M.plain('#b0302a', { roughness: 0.85 });
    const redRoof = M.plain('#c9382c', { roughness: 0.55, metalness: 0.25 });
    const white = M.plain('#f1ede4', { roughness: 0.9 });
    const black = M.plain('#1f1a1c');
    const gold = M.gold;
    const teal = M.plain('#2b8c8a', { roughness: 0.7 });
    const yel = M.plain('#e8b730', { roughness: 0.6 });
    return (
      <group>
        <Box s={[21, 0.3, 17]} p={[0, 0.15, 0.5]} m={M.plain('#b2a58f', { roughness: 1 })} />
        {/* the great gompa: stone base with stairs, maroon walls, black window panel, flat roof with golden ornaments */}
        <group position={[0, 0.3, -3]}>
          <Box s={[10, 1.4, 6]} p={[0, 0.7, 0]} m={stone} />
          {Array.from({ length: 5 }, (_, k) => <Box key={k} s={[3.2, 0.26 * (k + 1), 0.4]} p={[0, 0.13 * (k + 1), 3.6 - k * 0.38]} m={stone} />)}
          <Box s={[9.6, 2.1, 5.6]} p={[0, 2.45, 0]} m={maroon} />
          <Box s={[9.8, 0.12, 5.8]} p={[0, 3.5, 0]} m={white} />
          <Box s={[3.4, 1.5, 0.12]} p={[0, 2.0, 2.84]} m={black} />
          {[-1.3, -0.45, 0.45, 1.3].map((x) => <Box key={x} s={[0.7, 0.5, 0.05]} p={[x, 2.4, 2.92]} m={white} cast={false} />)}
          {[-1.3, -0.45, 0.45, 1.3].map((x) => <Box key={`b${x}`} s={[0.7, 0.5, 0.05]} p={[x, 1.7, 2.92]} m={white} cast={false} />)}
          {[-3.6, 3.6].map((x) => <group key={x}>{[0, 1].map((r) => <Box key={r} s={[0.9, 0.7, 0.06]} p={[x, 1.9 + r * 0.9, 2.84]} m={black} cast={false} />)}<Box s={[1.1, 0.12, 0.1]} p={[x, 2.9, 2.86]} m={yel} cast={false} /></group>)}
          <Box s={[10, 0.5, 6]} p={[0, 3.85, 0]} m={black} />
          <Box s={[10.2, 0.16, 6.2]} p={[0, 4.2, 0]} m={white} />
          {/* golden wheel and deer on the roof ridge, corner banners */}
          <Box s={[0.2, 0.7, 0.1]} p={[0, 4.6, 2.5]} m={gold} />
          <mesh position={[0, 5.0, 2.5]} material={gold}><torusGeometry args={[0.28, 0.05, 6, 18]} /></mesh>
          {[-0.7, 0.7].map((x) => <Box key={x} s={[0.3, 0.3, 0.15]} p={[x, 4.45, 2.5]} m={gold} />)}
          {[[-4.6, 2.8], [4.6, 2.8], [-4.6, -2.8], [4.6, -2.8]].map(([x, z]) => <group key={`${x}${z}`}><Cyl rt={0.14} h={0.6} p={[x, 4.5, z]} m={gold} seg={8} /><mesh position={[x, 4.95, z]} material={gold}><coneGeometry args={[0.12, 0.35, 8]} /></mesh></group>)}
        </group>
        {/* side lodges and prayer rooms with red roofs */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 8.2, 0.3, 0.6]}>
            <Box s={[3.2, 0.6, 7.6]} p={[0, 0.3, 0]} m={stone} />
            <Box s={[3.0, 2.0, 7.4]} p={[0, 1.6, 0]} m={redW} />
            <Box s={[3.1, 0.16, 7.5]} p={[0, 2.5, 0]} m={white} />
            <Roof w={3.8} d={8.2} h={1.0} y={2.5} m={redRoof} sag={1.0} lift={0} fascia={false} />
            {[-2.5, 0, 2.5].map((z) => <Box key={z} s={[0.05, 0.8, 0.9]} p={[-k * 1.52, 1.7, z]} m={M.plain('#e8c84a')} cast={false} />)}
          </group>
        ))}
        {/* the painted entrance gate: four colourful posts, two-tier ridged roof, golden deer and wheel */}
        <group position={[-6.4, 0.3, 7.6]}>
          {[-2.0, -0.7, 0.7, 2.0].map((x, k) => <Box key={x} s={[0.55, 3.4, 0.55]} p={[x, 1.7, 0]} m={k % 2 ? teal : maroon} />)}
          <Box s={[4.9, 0.5, 0.8]} p={[0, 3.55, 0]} m={M.plain('#2a6a6a')} />
          <Box s={[4.9, 0.16, 0.9]} p={[0, 3.3, 0]} m={yel} />
          <Roof w={5.8} d={2.6} h={0.9} y={3.78} m={M.plain('#6a3a2a', { roughness: 0.7 })} sag={1.2} lift={0.05} />
          <Box s={[4.2, 0.4, 1.4]} p={[0, 4.55, 0]} m={maroon} />
          <Roof w={4.8} d={2.0} h={0.6} y={4.7} m={M.plain('#6a3a2a', { roughness: 0.7 })} sag={1.2} lift={0.05} />
          <mesh position={[0, 5.6, 0]} material={gold}><torusGeometry args={[0.28, 0.06, 6, 18]} /></mesh>
          {[-1.0, 1.0].map((x) => <Box key={x} s={[0.4, 0.34, 0.14]} p={[x, 5.45, 0]} m={gold} />)}
          {[-2.8, 2.8].map((x) => <group key={x} position={[x, 0.5, 0.4]}><Box s={[0.7, 0.3, 0.7]} p={[0, -0.15, 0]} m={stone} /><Lion m={M.plain('#e9e2d4')} /></group>)}
        </group>
        {/* white chorten with a golden spire and a mani-stone wall */}
        <group position={[-5.0, 0.3, 4.4]}>
          <Box s={[1.8, 0.4, 1.8]} p={[0, 0.2, 0]} m={white} />
          <Box s={[1.4, 0.35, 1.4]} p={[0, 0.58, 0]} m={white} />
          <mesh position={[0, 0.75, 0]} material={white} castShadow><sphereGeometry args={[0.7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Box s={[0.5, 0.4, 0.5]} p={[0, 1.65, 0]} m={white} />
          {Array.from({ length: 8 }, (_, k) => <Cyl key={k} rt={0.26 - k * 0.025} rb={0.28 - k * 0.025} h={0.14} p={[0, 1.9 + k * 0.14, 0]} m={gold} seg={10} />)}
          <mesh position={[0, 3.2, 0]} material={gold}><coneGeometry args={[0.07, 0.4, 6]} /></mesh>
        </group>
        <Box s={[5.0, 0.9, 0.8]} p={[5.0, 0.75, 5.6]} m={M.plain('#9a9488', { roughness: 1 })} />
        {[0, 1, 2, 3].map((k) => <Rocks key={k} p={[2.8 + k * 1.3, 1.3, 5.6]} s={0.32} seed={k + 2} m={M.plain('#b0aa9c', { roughness: 1 })} />)}
        <PrayerFlags from={[-8.2, 5.2, 0.6]} to={[-6.4, 5.9, 7.6]} n={16} />
        <PrayerFlags from={[0, 5.2, -3]} to={[8.2, 4.6, 0.6]} n={16} />
        <Frame s={[21, 6.5, 16]} p={[0, 3.2, 1]} />
      </group>
    );
  }
  function TengEnv() {
    const M = useM();
    const dryGrass = M.plain('#9a8b62', { roughness: 1 });
    const rockM = M.plain('#8a8478', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={90} y={-16} m={M.plain('#7e8794', { roughness: 1 })} />
        {/* the Tengboche ridge, a grassy shoulder dropping away into the valley */}
        <HillM p={[0, -16, 0]} r={38} h={16} m={dryGrass} />
        <HillM p={[-40, -16, -10]} r={34} h={26} m={M.plain('#6d7660', { roughness: 1 })} />
        <HillM p={[44, -16, -4]} r={34} h={30} m={M.plain('#6a7258', { roughness: 1 })} />
        <HillM p={[0, -16, -40]} r={36} h={26} m={M.plain('#8f8a84', { roughness: 1 })} />
        {/* Ama Dablam (right), the Everest-Lhotse-Nuptse wall (left): steep and snow-plastered */}
        <Peak p={[16, -14, -30]} r={14} h={58} snow={0.6} seg={5} rock="#4a4a58" />
        <Peak p={[-24, -14, -34]} r={24} h={64} snow={0.55} seg={6} rock="#50505e" />
        <Peak p={[-62, -14, -40]} r={22} h={50} snow={0.5} seg={6} rock="#66656f" />
        <Peak p={[52, -14, -42]} r={20} h={44} snow={0.5} seg={6} rock="#6a6a74" />
        {/* juniper and rhododendron on the slopes, a few lodges */}
        {Array.from({ length: 22 }, (_, k) => { const a = rnd(k + 5) * Math.PI * 2; const r = 16 + rnd(k + 8) * 14; return <Tree key={k} p={[Math.cos(a) * r, -(r - 14) * 0.38, Math.sin(a) * r]} s={1.4 + rnd(k) * 0.9} kind="pine" />; })}
        {[[-17, 7, 0.6], [17, 9, -0.5], [-20, -5, 1.2], [21, -8, 2.0], [0, -22, 0.1]].map(([x, z, r], k) => (
          <group key={`l${k}`} position={[x, -Math.max(0, (Math.hypot(x, z) - 14) * 0.38), z]} rotation={[0, r, 0]}>
            <Box s={[4, 2.6, 2.8]} p={[0, 1.3, 0]} m={M.plain('#efe9dc')} />
            <Roof w={4.6} d={3.4} h={0.9} y={2.6} m={M.plain(k % 2 ? '#2f6db5' : '#c9382c', { roughness: 0.55, metalness: 0.2 })} sag={1.0} lift={0} fascia={false} />
          </group>
        ))}
      </group>
    );
  }

  /* =====================================================================
     HALESI MAHADEV (Halesi-Maratika caves): a great limestone cave mouth with railed steps
     ===================================================================== */
  function HalesiMain() {
    const M = useM();
    const lime = M.plain('#aaa69b', { roughness: 1 });
    const limeD = M.plain('#85817a', { roughness: 1 });
    const black = M.plain('#0b0907');
    const white = M.plain('#f4f1ea', { roughness: 0.85 });
    const red = M.plain('#c43a2f', { roughness: 0.8 });
    const stone = M.plain('#cfc7b8', { roughness: 0.9 });
    return (
      <group>
        {/* the limestone cliff, shouldering the dark half-moon mouth */}
        <Rocks p={[0, 2.9, -5.6]} s={5.2} seed={4} m={lime} sc={[1.6, 0.95, 0.85]} />
        <Rocks p={[-4.8, 1.7, -0.6]} s={2.3} seed={9} m={limeD} sc={[1, 1.25, 1.7]} />
        <Rocks p={[4.8, 1.6, -0.8]} s={2.2} seed={12} m={lime} sc={[1, 1.2, 1.6]} />
        <Rocks p={[0, 4.5, -0.6]} s={2.0} seed={21} m={limeD} sc={[2.2, 0.4, 1.5]} />
        <Rocks p={[-2.4, 4.2, -3.0]} s={2.4} seed={5} m={lime} sc={[1.3, 0.7, 1.2]} />
        <Box s={[7.4, 0.2, 6.4]} p={[0, 0.1, 1.4]} m={M.plain('#6b6054', { roughness: 1 })} />
        <Arch w={5.2} h={3.5} p={[0, 0.15, 0.3]} m={black} pt={-0.4} />
        <Box s={[5.0, 0.12, 2.4]} p={[0, 0.2, 1.1]} m={M.plain('#2a231d', { roughness: 1 })} />
        {/* railed steps descending into the cave along the left, white posts with red rails */}
        {Array.from({ length: 9 }, (_, k) => <Box key={k} s={[1.6, 0.14 * (9 - k), 0.5]} p={[-4.6 + k * 0.0, 0.07 * (9 - k), 5.5 - k * 0.55]} m={stone} />)}
        <Rail a={[-3.6, 6.2]} b={[-3.6, 1.2]} y={0.2} h={1.0} m={white} n={7} />
        <Rail a={[-5.6, 6.2]} b={[-5.6, 1.2]} y={0.2} h={1.0} m={white} n={7} />
        {/* inside the mouth: caged shrines, bell, lingam, tridents */}
        {[[-1.6, 0.8], [0.4, 0.2], [1.8, 1.2]].map(([x, z], k) => (
          <group key={k} position={[x, 0.2, z]}>
            <Box s={[1.1, 0.5, 1.1]} p={[0, 0.25, 0]} m={white} />
            <Box s={[0.9, 0.5, 0.9]} p={[0, 0.75, 0]} m={M.plain('#4a3a30')} />
            <Rail a={[-0.55, 0.55]} b={[0.55, 0.55]} y={0.5} h={0.6} m={white} n={3} />
          </group>
        ))}
        <Lingam p={[0.2, 0.2, 1.2]} />
        <Trident p={[2.8, 0.2, 1.8]} h={1.8} />
        <Trident p={[-2.4, 0.2, 1.5]} h={1.5} />
        <Bell p={[3.4, 2.4, 2.6]} s={0.9} />
        <Box s={[0.1, 2.4, 0.1]} p={[3.4, 1.2, 2.6]} m={M.dark} />
        <PrayerFlags from={[-5.6, 3.4, 4]} to={[5.8, 4.4, 3.4]} n={22} />
        <PrayerFlags from={[-5.2, 3.0, 5.4]} to={[5.4, 3.6, 5]} n={22} />
        <Frame s={[16, 7.5, 13]} p={[0, 3.4, 0.4]} />
      </group>
    );
  }
  function HalesiEnv() {
    const M = useM();
    const green = M.plain('#6a8a4a', { roughness: 1 });
    return (
      <group>
        <GroundDisc r={90} y={-14} m={M.plain('#7a8d62', { roughness: 1 })} />
        <GroundDisc r={10} y={-0.03} m={M.plain('#a8957a', { roughness: 1 })} />
        {/* hill shoulders with forest and the village's blue-roofed houses stepping down */}
        <HillM p={[0, -14, 0]} r={28} h={14} m={M.plain('#8b8a5a', { roughness: 1 })} />
        <HillM p={[-36, -14, -22]} r={34} h={30} m={green} />
        <HillM p={[40, -14, -26]} r={34} h={28} m={M.plain('#789658', { roughness: 1 })} />
        <HillM p={[0, -14, -64]} r={50} h={44} m={M.plain('#7b8f90', { roughness: 1 })} />
        {Array.from({ length: 40 }, (_, k) => { const a = rnd(k + 9) * Math.PI * 2; const r = 12 + rnd(k + 4) * 18; if (a > 0.5 && a < 2.4 && r < 16) return null; return <Tree key={k} p={[Math.cos(a) * r, -(r - 12) * 0.42, Math.sin(a) * r]} s={1.4 + rnd(k) * 1.2} kind={k % 4 ? 'broad' : 'pine'} />; })}
        {[[-14, 10, 0.3, '#2f6db5'], [-19, 15, 0.9, '#2f6db5'], [-12, -8, -0.3, '#c9382c'], [-22, -2, 0.2, '#2f6db5'], [-6, -16, 0.0, '#2f6db5'], [24, -8, 0.4, '#3e8a58']].map(([x, z, r, c], k) => (
          <group key={k} position={[x, -(Math.hypot(x, z) - 12) * 0.42, z]} rotation={[0, r, 0]}>
            <Box s={[3.2, 3.6, 2.6]} p={[0, 1.8, 0]} m={M.plain(['#d6c6a4', '#c9a58c', '#e4dcc8'][k % 3], { roughness: 0.95 })} />
            <Roof w={3.8} d={3.2} h={0.8} y={3.6} m={M.plain(c, { roughness: 0.5, metalness: 0.3 })} sag={1.0} lift={0} fascia={false} />
          </group>
        ))}
        {/* the red-and-gold Maratika Chimey Takten Choling monastery up the slope */}
        <group position={[16, 3.2, -14]}>
          <Box s={[6, 5, 4]} p={[0, 2.5, 0]} m={M.plain('#c4472e', { roughness: 0.85 })} />
          <Box s={[6.2, 0.4, 4.2]} p={[0, 3.2, 0]} m={M.gold} />
          <Roof w={6.6} d={4.8} h={1.2} y={5} m={M.plain('#c4472e', { roughness: 0.6, metalness: 0.2 })} sag={1.05} lift={0.02} />
        </group>
        <Peak p={[-30, -14, -96]} r={38} h={42} snow={0.2} rock="#8aa0b0" />
      </group>
    );
  }

  /* =====================================================================
     MAKWANPUR GADHI: roofless rubble-stone fort on a green ridge above terraced fields
     ===================================================================== */
  function MakwanMain() {
    const M = useM();
    const wall = M.plain('#8f8a7e', { roughness: 1 });
    const wallD = M.plain('#7a756a', { roughness: 1 });
    const grass = M.plain('#86a05c', { roughness: 1 });
    const red = M.plain('#b33a30', { roughness: 0.75 });
    const iron = M.plain('#2a2a2c', { metalness: 0.7, roughness: 0.4 });
    const segs = (len, n, h0, seed) => Array.from({ length: n }, (_, i) => ({ x: -len / 2 + (i + 0.5) * (len / n), h: h0 * (0.55 + rnd(i + seed) * 0.5), w: len / n * 1.03 }));
    const wallRun = (len, n, h0, seed, key) => segs(len, n, h0, seed).map((s, i) => <Box key={`${key}${i}`} s={[s.w, s.h, 0.9]} p={[s.x, s.h / 2, 0]} m={i % 2 ? wall : wallD} />);
    const W = 20; const D = 13;
    return (
      <group>
        <Box s={[W + 2, 0.3, D + 2]} p={[0, 0.15, 0]} m={grass} />
        {/* rubble stone curtain wall: thick, uneven where it has crumbled */}
        <group position={[0, 0.3, -D / 2]}>{wallRun(W, 12, 3.0, 1, 'n')}</group>
        <group position={[-W / 2, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>{wallRun(D, 8, 3.0, 5, 'w')}</group>
        <group position={[W / 2, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>{wallRun(D, 8, 3.0, 9, 'e')}</group>
        <group position={[-W / 4 - 1.2, 0.3, D / 2]}>{wallRun(W / 2 - 2.4, 5, 2.6, 13, 's1')}</group>
        <group position={[W / 4 + 1.2, 0.3, D / 2]}>{wallRun(W / 2 - 2.4, 5, 2.6, 17, 's2')}</group>
        {/* inner crumbled walls of the Sen palace */}
        {[[-4, -3, 5, 1.6, 0], [5, -2, 4, 1.3, 0], [0, 1, 6, 1.0, Math.PI / 2], [-6, 2, 3, 1.4, 0]].map(([x, z, w, h, r], k) => <Box key={k} s={[w, h, 0.7]} p={[x, 0.3 + h / 2, z]} r={[0, r, 0]} m={k % 2 ? wall : wallD} />)}
        {/* the defensive ditch outside, dark water in its floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, D / 2 + 2.4]} material={M.plain('#2c3c34', { roughness: 0.2, metalness: 0.2 })}><planeGeometry args={[W + 2, 1.6]} /></mesh>
        <Box s={[W + 2, 0.5, 0.4]} p={[0, 0.2, D / 2 + 3.4]} m={wallD} />
        <Box s={[3.0, 0.1, 5.5]} p={[0, 0.3, D / 2 + 1.4]} m={M.plain('#8a8478', { roughness: 1 })} />
        {/* Kali Top: the old cannon under a red-posted tin shed, with iron balls */}
        <group position={[5.4, 0.3, 3.8]}>
          {[[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.07} h={2.0} p={[x, 1.0, z]} m={red} seg={6} />)}
          <Roof w={3.2} d={2.4} h={0.5} y={2.0} m={M.plain('#8f9094', { metalness: 0.4, roughness: 0.6 })} sag={1.0} lift={0} fascia={false} />
          <Cyl rt={0.16} rb={0.2} h={1.6} p={[0, 0.7, 0]} r={[0, 0, Math.PI / 2 - 0.15]} m={iron} seg={10} />
          {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 0.45, 0.4]} rotation={[0, Math.PI / 2, 0]} material={iron}><cylinderGeometry args={[0.42, 0.42, 0.08, 16]} /></mesh>)}
          {[[1.0, 0.8], [1.3, 0.5]].map(([x, z], k) => <Ball key={k} rad={0.16} p={[x, 0.18, z]} m={iron} />)}
        </group>
        <Frame s={[24, 5, 18]} p={[0, 2.2, 1]} />
      </group>
    );
  }
  function MakwanEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={90} y={-16} m={M.plain('#8c9a68', { roughness: 1 })} />
        {/* the ridge top and terraced fields falling away below */}
        <mesh position={[0, -1.0, 0]} material={M.plain('#86a05c', { roughness: 1 })} receiveShadow><cylinderGeometry args={[24, 30, 2, 40]} /></mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => <mesh key={k} position={[0, -2.4 - k * 2.3, 0]} receiveShadow material={M.mat('grass', 20, 2, { color: k % 2 ? '#b2b865' : '#7fa44c' })}><cylinderGeometry args={[31 + k * 5, 33 + k * 5, 2.3, 56]} /></mesh>)}
        {Array.from({ length: 24 }, (_, k) => { const a = rnd(k + 2) * Math.PI * 2; const r = 25 + rnd(k) * 4; if (Math.sin(a) > 0.4 && Math.abs(Math.cos(a)) < 0.7) return null; return <Tree key={k} p={[Math.cos(a) * r, -1.6, Math.sin(a) * r]} s={1.8 + rnd(k) * 1} kind={k % 3 ? 'broad' : 'pine'} />; })}
        <HillM p={[-50, -16, -50]} r={42} h={44} m={M.plain('#6f8d6c', { roughness: 1 })} />
        <HillM p={[40, -16, -64]} r={46} h={50} m={M.plain('#768f78', { roughness: 1 })} />
        <HillM p={[0, -16, -92]} r={60} h={70} m={M.plain('#8ba0a6', { roughness: 1 })} />
      </group>
    );
  }

  /* =====================================================================
     UPARDANG GADHI (Chitwan): low dark-stone walls outlining rooms on a dry grassy hilltop
     ===================================================================== */
  function UpardangMain() {
    const M = useM();
    const wall = M.plain('#6f695d', { roughness: 1 });
    const wallD = M.plain('#5b564c', { roughness: 1 });
    const dry = M.plain('#b49a58', { roughness: 1 });
    const wood = M.plain('#4a3a2c', { roughness: 0.8 });
    const W = 26; const D = 17;
    const run = (len, n, h0, seed, key) => Array.from({ length: n }, (_, i) => { const h = h0 * (0.7 + rnd(i + seed) * 0.4); return <Box key={`${key}${i}`} s={[len / n * 1.02, h, 0.7]} p={[-len / 2 + (i + 0.5) * (len / n), h / 2, 0]} m={i % 2 ? wall : wallD} />; });
    return (
      <group>
        <Box s={[W + 2, 0.3, D + 2]} p={[0, 0.15, 0]} m={dry} />
        <group position={[0, 0.3, -D / 2]}>{run(W, 16, 1.7, 1, 'n')}</group>
        <group position={[-W / 2, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>{run(D, 10, 1.7, 3, 'w')}</group>
        <group position={[W / 2, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>{run(D, 10, 1.7, 5, 'e')}</group>
        <group position={[-W / 2 + 6, 0.3, D / 2]}>{run(11, 7, 1.5, 7, 's')}</group>
        <group position={[W / 2 - 6, 0.3, D / 2]}>{run(11, 7, 1.5, 9, 't')}</group>
        {/* the gate with its carved lintel and wooden door, and the entry ramp */}
        <Box s={[3.2, 2.4, 1.2]} p={[0, 1.5, D / 2]} m={wall} />
        <Box s={[1.2, 1.5, 0.14]} p={[0, 1.05, D / 2 + 0.6]} m={wood} />
        <Box s={[1.6, 0.35, 0.2]} p={[0, 2.0, D / 2 + 0.62]} m={M.plain('#bbb3a4', { roughness: 0.9 })} />
        <Box s={[3.0, 0.12, 4]} p={[0, 0.34, D / 2 + 2.4]} m={M.plain('#8a8070', { roughness: 1 })} />
        {/* outlines of rooms: the Kot Ghar weapon house, a two-room house, the well, a small temple */}
        {[[-6.5, -2.0, 6, 4.6], [-3, 3.2, 4, 3.2], [6.5, -3.0, 5.4, 4.2]].map(([x, z, w, d], k) => (
          <group key={k} position={[x, 0.3, z]}>
            {[[0, d / 2, w, 0.6], [0, -d / 2, w, 0.6]].map(([a, b, ww, dd], j) => <Box key={j} s={[ww, 0.7 + rnd(k * 5 + j) * 0.5, dd]} p={[a, 0.4, b]} m={wallD} />)}
            {[[w / 2, 0, 0.6, d], [-w / 2, 0, 0.6, d]].map(([a, b, ww, dd], j) => <Box key={`s${j}`} s={[ww, 0.6 + rnd(k * 7 + j) * 0.5, dd]} p={[a, 0.35, b]} m={wall} />)}
            {k === 0 && <Box s={[0.6, 0.6, d - 0.6]} p={[0, 0.3, 0]} m={wall} />}
          </group>
        ))}
        <group position={[4.5, 0.3, 4.4]}><Cyl rt={0.8} rb={0.9} h={0.7} p={[0, 0.35, 0]} m={wall} seg={14} /><Cyl rt={0.5} rb={0.5} h={0.72} p={[0, 0.36, 0]} m={M.plain('#1c2a2a')} seg={14} /></group>
        <group position={[9.2, 0.3, 3.4]}><Box s={[1.8, 0.4, 1.8]} p={[0, 0.2, 0]} m={wall} /><Box s={[1.1, 1.2, 1.1]} p={[0, 1.0, 0]} m={M.plain('#d6cfc0')} /><Spire r0={0.7} h={1.2} y={1.6} m={M.plain('#d6cfc0')} /></group>
        {/* the wooden footbridge over the ditch */}
        <Box s={[1.4, 0.12, 3.4]} p={[0, 0.5, D / 2 + 5.4]} m={wood} />
        <Frame s={[28, 4, 20]} p={[0, 1.6, 1]} />
      </group>
    );
  }
  function UpardangEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={90} y={-18} m={M.plain('#8a9a7e', { roughness: 1 })} />
        <mesh position={[0, -1.1, 0]} material={M.plain('#b49a58', { roughness: 1 })} receiveShadow><cylinderGeometry args={[26, 34, 2.2, 40]} /></mesh>
        <HillM p={[0, -18, 0]} r={46} h={17} m={M.plain('#a8934f', { roughness: 1 })} />
        {Array.from({ length: 10 }, (_, k) => { const a = rnd(k + 20) * Math.PI * 2; const r = 31 + rnd(k) * 6; return <Tree key={k} p={[Math.cos(a) * r, -3, Math.sin(a) * r]} s={1.4 + rnd(k) * 0.8} kind="pine" />; })}
        {/* layers of hazy forested ridges behind, paler with distance */}
        <HillM p={[-40, -18, -50]} r={42} h={44} m={M.plain('#5f7b64', { roughness: 1 })} />
        <HillM p={[30, -18, -62]} r={46} h={48} m={M.plain('#6d8870', { roughness: 1 })} />
        <HillM p={[-10, -18, -90]} r={58} h={60} m={M.plain('#8fa4a8', { roughness: 1 })} />
        <HillM p={[60, -18, 20]} r={34} h={28} m={M.plain('#6a8467', { roughness: 1 })} />
        <HillM p={[-62, -18, 30]} r={32} h={26} m={M.plain('#6a8467', { roughness: 1 })} />
      </group>
    );
  }

  /* =====================================================================
     DHANUSHA DHAM: painted wall, gateway shrine with a small yellow dome, one great tree
     ===================================================================== */
  function DhanushaMain() {
    const M = useM();
    const yellow = M.plain('#f2c230', { roughness: 0.8 });
    const red = M.plain('#b83a2e', { roughness: 0.85 });
    const blue = M.plain('#2d6fb5', { roughness: 0.75 });
    const white = M.plain('#f4f2ec', { roughness: 0.9 });
    const dark = M.plain('#2a1d1a');
    const slate = M.plain('#2d3a56', { roughness: 0.9 });
    return (
      <group>
        <Box s={[26, 0.2, 14]} p={[0, 0.1, 0]} m={M.plain('#cfc3aa', { roughness: 1 })} />
        {/* the long low enclosure wall: red base, yellow upper band, blue trim, with painted name panels */}
        {[[-1, 1], [1, 1]].map(([k], i) => (
          <group key={i} position={[k * 6.6, 0, 3.5]}>
            <Box s={[10.4, 0.8, 0.5]} p={[0, 0.6, 0]} m={red} />
            <Box s={[10.4, 0.1, 0.56]} p={[0, 1.05, 0]} m={blue} />
            <Box s={[10.4, 0.9, 0.5]} p={[0, 1.55, 0]} m={yellow} />
            <Box s={[10.5, 0.1, 0.6]} p={[0, 2.05, 0]} m={blue} />
            <Box s={[4.0, 0.55, 0.04]} p={[0, 1.55, 0.28]} m={red} cast={false} />
            {[-4.6, 0, 4.6].map((x) => <Cyl key={x} rt={0.15} h={2.2} p={[x, 1.2, 0.2]} m={yellow} seg={8} />)}
          </group>
        ))}
        {/* the gateway shrine: yellow tower, arched opening, small dome and gold finial */}
        <group position={[0, 0.2, 3.5]}>
          <Box s={[2.8, 0.5, 1.4]} p={[0, 0.25, 0]} m={red} />
          <Box s={[2.6, 2.6, 1.2]} p={[0, 1.8, 0]} m={yellow} />
          <Box s={[2.8, 0.14, 1.4]} p={[0, 3.15, 0]} m={blue} />
          <Arch w={1.3} h={1.9} p={[0, 0.5, 0.62]} m={dark} pt={0.2} />
          <Arch w={1.6} h={2.2} p={[0, 0.5, 0.605]} m={red} pt={0.25} />
          <Box s={[2.0, 0.5, 0.05]} p={[0, 2.85, 0.62]} m={blue} cast={false} />
          <Box s={[2.0, 0.9, 1.0]} p={[0, 3.7, 0]} m={yellow} />
          <Dome r={0.9} h={1.0} p={[0, 4.15, 0]} m={yellow} />
          {[[-1.15, 0.45], [1.15, 0.45], [-1.15, -0.45], [1.15, -0.45]].map(([x, z]) => <group key={`${x}${z}`} position={[x, 3.15, z]}><Cyl rt={0.1} h={0.5} p={[0, 0.25, 0]} m={yellow} seg={8} /><Dome r={0.16} h={0.2} p={[0, 0.5, 0]} m={M.gold} /></group>)}
          <Box s={[0.7, 1.0, 0.12]} p={[1.9, 0.9, 0.9]} m={M.plain('#3e9a58')} />
        </group>
        {/* the covered inner hall behind the wall: white walls, dark red plinth, black roof edge */}
        <Box s={[22, 0.7, 4.0]} p={[0, 0.55, -2.4]} m={M.plain('#6a2a26')} />
        <Box s={[22, 1.7, 4.0]} p={[0, 1.75, -2.4]} m={white} />
        {Array.from({ length: 16 }, (_, k) => <Box key={k} s={[0.8, 0.28, 0.05]} p={[-9.6 + k * 1.28, 2.1, -0.38]} m={slate} cast={false} />)}
        <Roof w={23} d={5.4} h={0.9} y={2.55} m={M.plain('#26262e', { roughness: 0.7 })} sag={1.0} lift={0} />
        {/* the huge tree: thick buttressed trunk and a wide shade canopy */}
        <group position={[2.4, 0.2, -3.4]}>
          <Cyl rt={0.7} rb={1.3} h={5.4} p={[0, 2.7, 0]} m={M.plain('#6a5a48', { roughness: 1 })} seg={10} />
          {[[0, 6.2, 0, 3.4], [-3.0, 5.6, 0.6, 2.7], [3.2, 5.8, -0.4, 2.8], [0.6, 7.2, -1.2, 2.5], [-1.4, 6.4, -2.6, 2.4], [1.8, 6.4, 2.4, 2.3]].map(([x, y, z, r], i) => <Ball key={i} rad={r} sc={[1, 0.62, 1]} p={[x, y, z]} m={M.plain(i % 2 ? '#4a6a38' : '#587a3e', { roughness: 1 })} />)}
        </group>
        <Frame s={[26, 8, 12]} p={[0, 3.6, -0.6]} />
      </group>
    );
  }
  function DhanushaEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={90} y={-0.05} m={M.plain('#9ab364', { roughness: 1 })} />
        <GroundDisc r={22} y={-0.02} m={M.plain('#cdbf9f', { roughness: 1 })} />
        {/* concrete forecourt and a village lane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 9]} material={M.plain('#bdb5a6', { roughness: 0.95 })}><planeGeometry args={[30, 7]} /></mesh>
        {[[-10, 14, 0.1], [12, 14, -0.2]].map(([x, z], k) => <group key={k} position={[x, 0, z]}><Box s={[0.14, 5.4, 0.14]} p={[0, 2.7, 0]} m={M.dark} /><Box s={[1.4, 0.06, 0.06]} p={[0, 5.4, 0]} m={M.dark} /></group>)}
        <Town n={14} r0={30} r1={40} a0={0.05} a1={Math.PI * 2 - 0.05} seed={31} hMin={2.4} hMax={5.4} roof="#9a7a62" />
        {/* paddy and wheat fields, trees and palms between the village houses */}
        {[[-24, -16, '#8fb455'], [22, -18, '#cdbf55'], [-28, 14, '#cdbf55'], [28, 10, '#8fb455'], [0, -26, '#a3c25e']].map(([x, z, c], k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]} material={M.plain(c, { roughness: 1 })}><planeGeometry args={[16, 11]} /></mesh>)}
        {Array.from({ length: 18 }, (_, k) => { const x = Math.cos(k * 0.9) * (22 + (k % 3) * 4); const z = Math.sin(k * 0.9 + 1) * (22 + (k % 4) * 3); return z > 6 ? null : <Tree key={k} p={[x, 0, z]} s={1.4 + rnd(k) * 0.7} />; })}
        {Array.from({ length: 8 }, (_, k) => <Palm key={`p${k}`} p={[-22 + k * 6, 0, -20 - rnd(k) * 6]} s={1.1} />)}
      </group>
    );
  }

  /* =====================================================================
     GADHIMAI TEMPLE (Bariyarpur): cream shrine with tiger reliefs, balustraded terrace, small red-gold roofs
     ===================================================================== */
  function GadhimaiMain() {
    const M = useM();
    const cream = M.plain('#efe4c8', { roughness: 0.9 });
    const dark = M.plain('#2e1a14');
    const red = M.plain('#b5382a', { roughness: 0.75 });
    const gold = M.plain('#e0ae2c', { roughness: 0.5, metalness: 0.5 });
    const tiger = M.plain('#c9702a', { roughness: 0.85 });
    const white = M.plain('#f6f3ea', { roughness: 0.9 });
    const Tiger = ({ p, r = 0 }) => (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[0.9, 0.3, 0.1]} p={[0, 0, 0]} m={tiger} cast={false} />
        <Ball rad={0.16} sc={[1, 1, 0.5]} p={[0.5, 0.1, 0]} m={tiger} />
        <Box s={[0.06, 0.28, 0.1]} p={[-0.3, -0.2, 0]} m={tiger} cast={false} />
        <Box s={[0.06, 0.28, 0.1]} p={[0.3, -0.2, 0]} m={tiger} cast={false} />
        <Box s={[0.5, 0.05, 0.08]} p={[-0.65, 0.12, 0]} r={[0, 0, 0.5]} m={tiger} cast={false} />
      </group>
    );
    return (
      <group>
        <Box s={[16, 0.2, 14]} p={[0, 0.1, 0]} m={M.plain('#d8cdb6', { roughness: 1 })} />
        <Box s={[6.2, 0.6, 6.2]} p={[0, 0.5, 0]} m={stn(M)} />
        <Box s={[5.0, 3.0, 5.0]} p={[0, 2.3, 0]} m={cream} />
        <Box s={[5.2, 0.24, 5.2]} p={[0, 3.9, 0]} m={gold} />
        {/* front: three ogee arches, with tigers marching along the wall above */}
        {[-1.6, 0, 1.6].map((x) => (
          <group key={x}>
            <Arch w={1.3} h={2.2} p={[x, 0.8, 2.52]} m={red} pt={0.5} />
            <Arch w={1.0} h={1.9} p={[x, 0.8, 2.53]} m={dark} pt={0.4} />
          </group>
        ))}
        <Tiger p={[-1.6, 3.5, 2.55]} />
        <Tiger p={[1.4, 3.5, 2.55]} r={0} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Arch w={1.2} h={2.0} p={[k * 2.52, 0.8, 0]} r={k * Math.PI / 2} m={red} pt={0.4} />
            <Arch w={0.9} h={1.7} p={[k * 2.53, 0.8, 0]} r={k * Math.PI / 2} m={dark} pt={0.35} />
            <Tiger p={[k * 2.55, 3.5, 0]} r={k * Math.PI / 2} />
          </group>
        ))}
        {/* white balustraded terrace on the roof, and the little two-tier red and gold roofs above */}
        <Box s={[5.6, 0.14, 5.6]} p={[0, 4.12, 0]} m={white} />
        {Array.from({ length: 12 }, (_, k) => [[-2.65 + k * 0.48, 2.65], [-2.65 + k * 0.48, -2.65], [2.65, -2.65 + k * 0.48], [-2.65, -2.65 + k * 0.48]].map(([x, z], j) => <Cyl key={`${k}${j}`} rt={0.05} rb={0.07} h={0.55} p={[x, 4.45, z]} m={white} seg={6} />))}
        <Box s={[5.6, 0.09, 0.14]} p={[0, 4.75, 2.65]} m={white} />
        <Box s={[5.6, 0.09, 0.14]} p={[0, 4.75, -2.65]} m={white} />
        <Box s={[0.14, 0.09, 5.4]} p={[2.65, 4.75, 0]} m={white} />
        <Box s={[0.14, 0.09, 5.4]} p={[-2.65, 4.75, 0]} m={white} />
        <Box s={[2.4, 1.0, 2.4]} p={[0, 4.7, 0]} m={cream} />
        <Roof w={3.8} d={3.8} h={0.7} y={5.1} m={red} sag={1.2} lift={0.08} />
        <Box s={[1.5, 0.6, 1.5]} p={[0, 5.9, 0]} m={cream} />
        <Roof w={2.6} d={2.6} h={0.6} y={6.1} m={red} sag={1.2} lift={0.08} />
        <Gajur y={6.7} s={0.7} />
        {/* a side pavilion with a stepped red-and-yellow tiled roof */}
        <group position={[-4.6, 0.2, 2.8]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.09} h={1.7} p={[a * 1.0, 0.85, b * 1.0]} m={M.plain('#8a5a3a')} seg={6} />)}
          <Roof w={3.2} d={3.2} h={0.8} y={1.7} m={M.plain('#e8b23a', { roughness: 0.6 })} sag={1.2} lift={0.05} />
        </group>
        <PrayerFlags from={[4.6, 5.0, 3]} to={[7, 2.5, 6]} n={10} />
        <Frame s={[16, 7.5, 12]} p={[0, 3.4, 0.5]} />
      </group>
    );
  }
  function GadhimaiEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={90} y={-0.05} m={M.plain('#a1b46a', { roughness: 1 })} />
        <GroundDisc r={20} y={-0.02} m={M.plain('#d6cab0', { roughness: 1 })} />
        {/* great shade trees with buttress roots, ringed by paving */}
        {[[-9, -5, 3.0], [-3, -10, 3.2], [5, -11, 2.8], [-13, 5, 2.5], [11, -8, 2.6]].map(([x, z, s], k) => <Tree key={k} p={[x, 0, z]} s={s} />)}
        {/* pond at the Bariyarpur grounds, edged by a red-brown rail */}
        <group position={[-8, 0, 18]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><circleGeometry args={[9, 32]} /><meshStandardMaterial color="#6f9a8f" metalness={0.3} roughness={0.15} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}><ringGeometry args={[9, 10.4, 32]} /><meshStandardMaterial color="#b8a888" roughness={1} /></mesh>
          <Rail a={[-8, 11]} b={[8, 11]} y={0} h={0.9} m={M.plain('#7a3a2a')} n={10} />
        </group>
        {/* the walled festival arena, open grass inside, red brick walls */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[26, 0.01, -14]} material={M.plain('#8fae54', { roughness: 1 })}><planeGeometry args={[34, 28]} /></mesh>
        {[[26, -28, 34, 0.5, 0], [26, 0, 34, 0.5, 0], [9, -14, 28, 0.5, 1], [43, -14, 28, 0.5, 1]].map(([x, z, l, t, v], k) => <Box key={k} s={v ? [t, 2.0, l] : [l, 2.0, t]} p={[x, 1.0, z]} m={M.plain('#b9573e', { roughness: 0.9 })} />)}
        <Town n={14} r0={32} r1={42} a0={0.5} a1={Math.PI * 2 - 0.5} seed={41} hMin={2.4} hMax={5} />
        {Array.from({ length: 20 }, (_, k) => <Tree key={`f${k}`} p={[Math.cos(k * 0.66) * (26 + rnd(k) * 8), 0, Math.sin(k * 0.66 + 2) * (26 + rnd(k + 2) * 8)]} s={1.6 + rnd(k) * 0.8} />)}
      </group>
    );
  }

  /* =====================================================================
     CHHINNAMASTA BHAGAWATI (Saptari): three-roofed red pagoda, lotus finial, railed yard, blue tin shelter
     ===================================================================== */
  function ChhinnaMain() {
    const M = useM();
    const redRoof = M.plain('#c9302a', { roughness: 0.55, metalness: 0.3 });
    const white = M.plain('#f6f3ea', { roughness: 0.85 });
    const yel = M.plain('#e8b730', { roughness: 0.7 });
    const green = M.plain('#3d9a5a', { roughness: 0.7 });
    const brick = M.mat('brick', 3, 1, { color: '#c46a4e' });
    const dark = M.plain('#3a2218');
    const tin = M.plain('#2c6bc1', { roughness: 0.5, metalness: 0.4 });
    const orange = M.plain('#d9582a', { roughness: 0.7 });
    const lotus = M.plain('#e88a9a', { roughness: 0.6 });
    return (
      <group>
        <Box s={[16, 0.2, 14]} p={[0, 0.1, 0]} m={M.plain('#cfc3aa', { roughness: 1 })} />
        <Box s={[5.6, 0.5, 5.6]} p={[0, 0.45, 0]} m={stn(M)} />
        <group position={[0, 0.7, 0]}>
          {/* brick-faced ground storey with arched openings, then three stacked red roofs edged in white */}
          <Box s={[4.4, 1.7, 4.4]} p={[0, 0.85, 0]} m={brick} />
          {[-1.4, 0, 1.4].map((x) => <group key={x}><Arch w={0.9} h={1.2} p={[x, 0.2, 2.22]} m={dark} /></group>)}
          <Box s={[4.6, 0.16, 4.6]} p={[0, 1.7, 0]} m={dark} />
          <Roof w={7.0} d={7.0} h={0.9} y={1.65} m={redRoof} sag={1.1} lift={0.06} fascia={false} />
          <Box s={[7.1, 0.12, 0.12]} p={[0, 1.65, 3.5]} m={white} /><Box s={[7.1, 0.12, 0.12]} p={[0, 1.65, -3.5]} m={white} />
          <Box s={[0.12, 0.12, 7.1]} p={[3.5, 1.65, 0]} m={white} /><Box s={[0.12, 0.12, 7.1]} p={[-3.5, 1.65, 0]} m={white} />
          <Box s={[3.4, 0.7, 3.4]} p={[0, 2.2, 0]} m={M.plain('#8a1f1a')} />
          <Box s={[3.5, 0.1, 3.5]} p={[0, 2.35, 0]} m={yel} /><Box s={[3.5, 0.1, 3.5]} p={[0, 2.1, 0]} m={green} />
          <Roof w={5.2} d={5.2} h={0.8} y={2.5} m={redRoof} sag={1.1} lift={0.06} fascia={false} />
          <Box s={[5.3, 0.12, 0.12]} p={[0, 2.5, 2.6]} m={white} /><Box s={[5.3, 0.12, 0.12]} p={[0, 2.5, -2.6]} m={white} />
          <Box s={[0.12, 0.12, 5.3]} p={[2.6, 2.5, 0]} m={white} /><Box s={[0.12, 0.12, 5.3]} p={[-2.6, 2.5, 0]} m={white} />
          <Box s={[2.4, 0.6, 2.4]} p={[0, 3.0, 0]} m={M.plain('#8a1f1a')} />
          <Box s={[2.5, 0.1, 2.5]} p={[0, 3.12, 0]} m={yel} />
          <Roof w={3.6} d={3.6} h={0.7} y={3.3} m={redRoof} sag={1.1} lift={0.06} fascia={false} />
          <Box s={[3.7, 0.12, 0.12]} p={[0, 3.3, 1.8]} m={white} /><Box s={[3.7, 0.12, 0.12]} p={[0, 3.3, -1.8]} m={white} />
          <Box s={[0.12, 0.12, 3.7]} p={[1.8, 3.3, 0]} m={white} /><Box s={[0.12, 0.12, 3.7]} p={[-1.8, 3.3, 0]} m={white} />
          {/* lotus finial and the trident above */}
          <Cyl rt={0.18} rb={0.22} h={0.3} p={[0, 4.1, 0]} m={white} seg={8} />
          {Array.from({ length: 8 }, (_, k) => <mesh key={k} position={[Math.cos(k * 0.785) * 0.24, 4.4, Math.sin(k * 0.785) * 0.24]} rotation={[Math.sin(k * 0.785) * 0.8, 0, -Math.cos(k * 0.785) * 0.8]} material={lotus}><coneGeometry args={[0.1, 0.4, 5]} /></mesh>)}
          <Cyl rt={0.03} h={1.1} p={[0, 5.0, 0]} m={M.plain('#8a8580', { metalness: 0.8 })} seg={6} />
          {[-0.14, 0.14].map((x) => <mesh key={x} position={[x, 5.6, 0]} material={M.plain('#8a8580', { metalness: 0.8 })}><coneGeometry args={[0.03, 0.26, 5]} /></mesh>)}
          <Bell p={[0, 0.9, 2.45]} s={0.5} />
        </group>
        {/* railed queueing yard in front and a blue tin-roofed pavilion on orange posts */}
        <Rail a={[-6.6, 5.6]} b={[6.6, 5.6]} y={0.2} h={1.0} m={orange} n={14} />
        <Rail a={[-6.6, 5.6]} b={[-6.6, -3.5]} y={0.2} h={1.0} m={orange} n={10} />
        <Rail a={[6.6, 5.6]} b={[6.6, -3.5]} y={0.2} h={1.0} m={orange} n={10} />
        <group position={[-4.2, 0.2, 3.8]}>
          {[[-1.5, -1.4], [1.5, -1.4], [-1.5, 1.4], [1.5, 1.4]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.07} h={2.2} p={[x, 1.1, z]} m={orange} seg={6} />)}
          <Roof w={4.2} d={3.6} h={0.9} y={2.2} m={tin} sag={1.0} lift={0} fascia={false} />
        </group>
        <Frame s={[16, 7, 13]} p={[0, 3.2, 0.5]} />
      </group>
    );
  }
  function ChhinnaEnv() {
    const M = useM();
    const brickRed = M.plain('#c23a30', { roughness: 0.8 });
    return (
      <group>
        <GroundDisc r={90} y={-0.05} m={M.plain('#9fb468', { roughness: 1 })} />
        <GroundDisc r={26} y={-0.02} m={M.plain('#cfc3aa', { roughness: 1 })} />
        {/* the temple pond in Saptari with broad red ghat steps, a bathing platform and a second red shrine across the water */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 24]}><planeGeometry args={[60, 24]} /><meshStandardMaterial color="#6c9a80" metalness={0.3} roughness={0.15} /></mesh>
        {[0, 1, 2, 3, 4].map((s) => <Box key={s} s={[40, 0.12 + (4 - s) * 0.12, 0.8]} p={[0, 0.06 + (4 - s) * 0.06, 11 + s * 0.8]} m={s % 2 ? stn(M) : M.plain('#c6584a', { roughness: 0.85 })} />)}
        <group position={[18, 0, 35]}>
          <Box s={[8, 0.8, 5]} p={[0, 0.4, 0]} m={brickRed} />
          <Box s={[7, 1.8, 4]} p={[0, 1.7, 0]} m={brickRed} />
          {[-2.4, -0.8, 0.8, 2.4].map((x) => <Arch key={x} w={1.0} h={1.4} p={[x, 0.9, 2.02]} m={M.plain('#3a2218')} />)}
          <Roof w={9} d={6} h={1.3} y={2.6} m={M.plain('#c9302a', { roughness: 0.55 })} sag={1.1} lift={0.04} />
          <Box s={[2.6, 0.9, 2.6]} p={[0, 3.6, 0]} m={brickRed} />
          <Roof w={3.8} d={3.8} h={0.9} y={3.95} m={M.plain('#c9302a', { roughness: 0.55 })} sag={1.1} lift={0.04} />
        </group>
        {[[-18, 4], [-19, -3], [-17, -9], [18, -5], [19, -11], [-8, -14], [10, -15], [4, -17], [-24, 12], [-30, 8]].map(([x, z], k) => <Palm key={k} p={[x, 0, z]} s={1.3 + rnd(k) * 0.4} />)}
        {Array.from({ length: 14 }, (_, k) => <Tree key={`t${k}`} p={[Math.cos(k * 0.9) * 26, 0, -4 - Math.abs(Math.sin(k * 0.9)) * 20]} s={1.5 + rnd(k) * 0.8} />)}
        <Town n={16} r0={32} r1={42} a0={Math.PI + 0.3} a1={Math.PI * 2 - 0.3} seed={51} hMin={2.4} hMax={5} />
        {[[-24, -14, '#8fb455'], [26, -14, '#cdbf55']].map(([x, z, c], k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]} material={M.plain(c, { roughness: 1 })}><planeGeometry args={[16, 12]} /></mesh>)}
      </group>
    );
  }

  /* =====================================================================
     SIMRAUNGADH AND RANIVAS TEMPLE (Bara): banded white shikhara in a ruined brick palace
     ===================================================================== */
  function SimraunMain() {
    const M = useM();
    const white = M.plain('#f5f2ea', { roughness: 0.85 });
    const redB = M.plain('#b03a2e', { roughness: 0.75 });
    const greenB = M.plain('#5fa684', { roughness: 0.75 });
    const dark = M.plain('#3a2a26');
    const brick = M.mat('brick', 2, 1, { color: '#c98a6c' });
    const r0 = 1.55; const sh = 4.6;
    const spireY = 0.3 + 3 * 0.34 + 2.1 + 0.3;
    const prof = (t) => r0 * (1 - t ** 1.7) * (1 + 0.08 * Math.sin(t * Math.PI));
    return (
      <group>
        <Box s={[22, 0.2, 18]} p={[0, 0.1, 0]} m={M.plain('#c8b296', { roughness: 1 })} />
        {/* stepped plinth */}
        {[0, 1, 2].map((k) => <Box key={k} s={[7.4 - k * 0.8, 0.34, 7.4 - k * 0.8]} p={[0, 0.2 + k * 0.34 + 0.17, 0]} m={k % 2 ? M.plain('#e2d6c0') : white} />)}
        {Array.from({ length: 6 }, (_, k) => <Box key={`s${k}`} s={[2.4, 0.17 * (k + 1), 0.4]} p={[0, 0.085 * (k + 1) + 0.2, 4.2 - k * 0.3]} m={white} />)}
        {/* arcaded colonnade around the sanctum: four sides of slender columns with arches, a cornice, corner spires */}
        <group position={[0, 1.22, 0]}>
          <Box s={[3.0, 2.1, 3.0]} p={[0, 1.05, 0]} m={white} />
          {[0, 1, 2, 3].map((q) => (
            <group key={q} rotation={[0, q * Math.PI / 2, 0]}>
              {[-1.8, -0.9, 0, 0.9, 1.8].map((x) => <Cyl key={x} rt={0.1} rb={0.12} h={1.7} p={[x, 0.85, 2.5]} m={white} seg={8} />)}
              {[-1.35, -0.45, 0.45, 1.35].map((x) => <group key={x}><Arch w={0.82} h={1.0} p={[x, 0.65, 2.52]} m={dark} pt={0.1} /></group>)}
              <Box s={[4.9, 0.18, 0.3]} p={[0, 1.75, 2.5]} m={redB} />
              <Box s={[4.9, 0.1, 0.34]} p={[0, 1.93, 2.5]} m={greenB} />
              <Arch w={1.1} h={1.5} p={[0, 0.0, 1.52]} m={dark} pt={0.15} />
            </group>
          ))}
          <Box s={[5.4, 0.16, 5.4]} p={[0, 2.1, 0]} m={white} />
          {[[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]].map(([x, z]) => <Spire key={`${x}${z}`} r0={0.38} h={1.5} x={x} z={z} y={2.18} m={white} />)}
          {/* the tall shikhara: white curved spire with red and green bands */}
          <Box s={[2.4, 0.7, 2.4]} p={[0, 2.55, 0]} m={white} />
          <Spire r0={r0} h={sh} y={2.9} m={white} />
          {[0.18, 0.34, 0.5, 0.66].map((t, k) => <mesh key={t} position={[0, 2.9 + t * sh, 0]} rotation={[0, Math.PI / 4, 0]} material={k % 2 ? greenB : redB}><cylinderGeometry args={[prof(t) + 0.03, prof(t - 0.035) + 0.03, 0.2, 4]} /></mesh>)}
          <Cyl rt={0.04} h={0.8} p={[0, 2.9 + sh + 0.55, 0]} m={M.gold} seg={6} />
          {[-0.18, 0, 0.18].map((x) => <mesh key={x} position={[x, 2.9 + sh + (x ? 1.1 : 1.2), 0]} material={M.gold}><coneGeometry args={[0.04, x ? 0.3 : 0.44, 5]} /></mesh>)}
        </group>
        {/* crumbling brick palace walls and arches of the Ranivas around the plinth */}
        {[[-8.2, -3, 1, 6, 0], [8.4, -2, 1, 7, 0], [0, -8, 14, 1, 0]].map(([x, z, w, d], k) => <Box key={k} s={[w, 2.8 - k * 0.4, d]} p={[x, 1.4, z]} m={brick} />)}
        {[-4.6, 0, 4.6].map((x, k) => (
          <group key={x} position={[x, 0, -8]}>
            <Arch w={2.2} h={2.6} p={[0, 0, 0.52]} m={M.plain('#2e2018')} pt={0.4} />
          </group>
        ))}
        {[[-8.2, 3.6, 1.1], [8.4, 4, 0.8], [-6.4, 6.4, 0.7]].map(([x, z, h], k) => <Box key={`b${k}`} s={[1.6, h * 1.6, 0.9]} p={[x, h * 0.8, z]} r={[0, k * 0.6, 0]} m={brick} />)}
        <Frame s={[22, 11, 18]} p={[0, 5, 0]} />
      </group>
    );
  }
  function SimraunEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={90} y={-0.05} m={M.plain('#a3b46a', { roughness: 1 })} />
        <GroundDisc r={26} y={-0.02} m={M.plain('#cfae8c', { roughness: 1 })} />
        {/* Jharokhar Pokhari, the big medieval pond, with grassy banks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, -0.04, 38]}><planeGeometry args={[78, 22]} /><meshStandardMaterial color="#7c9a7c" metalness={0.25} roughness={0.2} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, -0.02, 38]} material={M.plain('#c4b690', { roughness: 1 })}><planeGeometry args={[86, 28]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, -0.03, 38]}><planeGeometry args={[78, 22]} /><meshStandardMaterial color="#7c9a7c" metalness={0.25} roughness={0.2} /></mesh>
        {/* ruined palace walls enclosing a brick courtyard, with pointed arches */}
        {[[-17, -4, 1, 18], [17, -2, 1, 16]].map(([x, z, w, d], k) => <Box key={k} s={[w, 3.4, d]} p={[x, 1.7, z]} m={M.mat('brick', 3, 1, { color: '#c98a6c' })} />)}
        {[-15, 15].map((x, k) => <group key={k} position={[x, 0, -9]}><Box s={[5, 3.6, 1]} p={[0, 1.8, 0]} m={M.mat('brick', 2, 1, { color: '#c98a6c' })} /><Arch w={2.4} h={2.6} p={[0, 0, 0.52]} m={M.plain('#2e2018')} pt={0.4} /></group>)}
        {/* village fields, mango and neem trees, a stone pillar */}
        {[[-30, -14, '#c8bd57'], [30, -16, '#86ad4c'], [-34, 12, '#86ad4c'], [32, 14, '#c8bd57']].map(([x, z, c], k) => <mesh key={`f${k}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]} material={M.plain(c, { roughness: 1 })}><planeGeometry args={[18, 12]} /></mesh>)}
        {Array.from({ length: 22 }, (_, k) => <Tree key={`t${k}`} p={[Math.cos(k * 0.62) * (30 + rnd(k) * 12), 0, -Math.abs(Math.sin(k * 0.62)) * 34 + 6]} s={1.6 + rnd(k) * 0.9} />)}
        <Cyl rt={0.28} rb={0.34} h={4.6} p={[-13, 2.3, 7]} m={M.plain('#3f3b3a', { roughness: 0.9 })} seg={4} />
        <Town n={14} r0={46} r1={56} a0={Math.PI + 0.2} a1={Math.PI * 2 - 0.2} seed={61} hMin={2.4} hMax={5} />
      </group>
    );
  }

  /* @@SITES */
  return {
    'dhanusha-dham': { Main: DhanushaMain, Env: DhanushaEnv },
    'gadhimai-temple': { Main: GadhimaiMain, Env: GadhimaiEnv },
    'chhinnamasta-bhagawati': { Main: ChhinnaMain, Env: ChhinnaEnv },
    'simraungadh-ranivas': { Main: SimraunMain, Env: SimraunEnv },
    'tengboche-monastery': { Main: TengMain, Env: TengEnv },
    'halesi-mahadev': { Main: HalesiMain, Env: HalesiEnv },
    'makwanpur-gadhi': { Main: MakwanMain, Env: MakwanEnv },
    'upardang-gadhi': { Main: UpardangMain, Env: UpardangEnv },
    'budha-subba-temple': { Main: BudhaMain, Env: BudhaEnv },
    'pindeshwor-babadham': { Main: PindeshMain, Env: PindeshEnv },
    'pathibhara-devi': { Main: PathibharaMain, Env: PathibharaEnv },
    barahachhetra: { Main: BarahaMain, Env: BarahaEnv },
    'janaki-mandir': { Main: JanakiMain, Env: JanakiEnv },
    'ram-mandir-janakpur': { Main: RamMain, Env: RamEnv },
    'dantakali-temple-dharan': { Main: DantaMain, Env: DantaEnv },
  };
}
