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

  /* ---------- lettering, rock walls and mountain massifs (added for the accuracy pass) ---------- */
  /** A flat painted board with Devanagari lettering; "|" in the text starts a new line. */
  const Sign = ({ text, w, h, p, r = 0, bg = '#f2c230', fg = '#2d6fb5', weight = 700, font = 0.6, rim = null }) => {
    const tex = useMemo(() => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = Math.max(48, Math.round(512 * h / w));
      const x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
      if (rim) { x.strokeStyle = rim; x.lineWidth = c.height * 0.07; x.strokeRect(c.height * 0.05, c.height * 0.05, c.width - c.height * 0.1, c.height * 0.9); }
      x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
      const lines = String(text).split('|');
      const px = Math.round((c.height / lines.length) * font);
      x.font = `${weight} ${px}px "Noto Sans Devanagari","Nirmala UI","Mangal","Kohinoor Devanagari",sans-serif`;
      lines.forEach((ln, i) => x.fillText(ln, c.width / 2, (c.height / lines.length) * (i + 0.54), c.width * 0.92));
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }, [text, w, h, bg, fg, rim, weight, font]);
    return <mesh position={p} rotation={[0, r, 0]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>;
  };
  /** Coursed rubble stone block: the toolkit rock texture, repeated to the block's size so courses read at any length. */
  const stoneCache = new Map();
  const Stone = ({ s, p, r, c = '#d9d4ca', k = 1, cast = true, glow = 0.8 }) => {
    const M = useM();
    const rx = Math.max(1, Math.round(Math.max(s[0], s[2]) * k / 5)); const ry = Math.max(1, Math.round(s[1] * k / 4.5));
    const id = `${rx}|${ry}|${c}|${glow}`;
    let m = stoneCache.get(id);
    if (!m || m.map !== M.mat('rock', rx, ry, { color: c, roughness: 1 }).map) { /* the texture is dark: lift it with a little self-light so stonework reads as weathered grey, not mud */
      const base = M.mat('rock', rx, ry, { color: c, roughness: 1 });
      m = base.clone(); m.emissive = new THREE.Color('#58544e'); m.emissiveIntensity = glow;
      m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), diffuseColor.rgb, 0.3) * 1.5;'); };
      m.customProgramCacheKey = () => 'koshi-stone';
      stoneCache.set(id, m);
    }
    return <Box s={s} p={p} r={r} cast={cast} m={m} />;
  };
  const massifMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  /** A faceted mountain: jagged ridge-lines, colour banded from lo to hi, optional snow above a height fraction. */
  const Massif = ({ p, r = 10, h = 8, sx = 1, sz = 1, rot = 0, seed = 1, snow = -1, lo = '#4f6b3a', hi = '#7d8450', seg = 30 }) => {
    const geo = useMemo(() => {
      let g = new THREE.CylinderGeometry(0.004, 1, 1, seg, 14, true); /* a near-point top keeps both triangles of every quad */
      g.translate(0, 0.5, 0);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
        const a = Math.atan2(z, x);
        const rr = Math.hypot(x, z);
        const k = rr > 0.0001 ? rr ** 0.8 / rr : 1;
        const f = (1 + 0.2 * Math.sin(a * 2 + seed) + 0.11 * Math.sin(a * 5 + seed * 1.7) + 0.05 * Math.sin(a * 11 + seed * 3) + 0.05 * Math.sin(y * 17 + a * 4 + seed)) * k;
        pos.setXYZ(i, x * f, y + 0.03 * Math.sin(a * 7 + seed * 2.3 + y * 9) * (1 - y), z * f);
      }
      g = g.toNonIndexed();
      const q = g.attributes.position;
      const va = new THREE.Vector3(); const vb = new THREE.Vector3(); const vc = new THREE.Vector3();
      for (let i = 0; i < q.count; i += 3) { /* make every facet face outwards, whatever order the cone emitted it in */
        va.fromBufferAttribute(q, i); vb.fromBufferAttribute(q, i + 1); vc.fromBufferAttribute(q, i + 2);
        const nrm = vb.clone().sub(va).cross(vc.clone().sub(va));
        if (nrm.x * (va.x + vb.x + vc.x) + nrm.z * (va.z + vb.z + vc.z) < 0) { q.setXYZ(i + 1, vc.x, vc.y, vc.z); q.setXYZ(i + 2, vb.x, vb.y, vb.z); }
      }
      g.computeVertexNormals();
      const col = new Float32Array(q.count * 3);
      const cl = new THREE.Color(lo); const ch = new THREE.Color(hi); const cs = new THREE.Color('#f3f6fb'); const tmp = new THREE.Color();
      for (let i = 0; i < q.count; i += 3) {
        const cy = (q.getY(i) + q.getY(i + 1) + q.getY(i + 2)) / 3;
        const ca = Math.atan2(q.getZ(i), q.getX(i));
        const n = 0.5 + 0.5 * Math.sin(ca * 3 + cy * 6 + seed);
        if (snow >= 0 && cy > snow + 0.07 * Math.sin(ca * 6 + seed * 2)) tmp.copy(cs).multiplyScalar(0.88 + 0.12 * n);
        else tmp.copy(cl).lerp(ch, Math.min(1, cy * 1.2)).multiplyScalar(0.9 + 0.16 * n);
        for (let k = 0; k < 3; k += 1) { col[(i + k) * 3] = tmp.r; col[(i + k) * 3 + 1] = tmp.g; col[(i + k) * 3 + 2] = tmp.b; }
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, [seed, snow, lo, hi, seg]);
    return <mesh geometry={geo} material={massifMat} position={p} rotation={[0, rot, 0]} scale={[r * sx, h, r * sz]} receiveShadow />;
  };
  /** A sequence of massifs strung along an arc as a distant range. */
  const Range = ({ n = 7, radius = 70, a0 = 0, a1 = Math.PI, h = 22, w = 16, snow = 0.55, seed = 1, y = -1, lo = '#566b78', hi = '#8791a6' }) => (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const a = a0 + ((i + 0.5) / n) * (a1 - a0);
        const k = 0.65 + 0.7 * rnd(i + seed);
        return <Massif key={i} p={[Math.cos(a) * radius, y, Math.sin(a) * radius]} r={w * (0.8 + 0.5 * rnd(i + seed * 3))} h={h * k} seed={seed + i} snow={snow} lo={lo} hi={hi} rot={a} />;
      })}
    </group>
  );

  /** A run of coursed rubble wall with a ragged battlement of merlons (some fallen) and loopholes in both faces. */
  const FortWall = ({ len, h = 4.2, t = 1.3, seed = 1, rot = 0, p, merlons = true, loops = true, c = '#d9d4ca', miss = 0.28 }) => {
    const M = useM();
    const nm = Math.max(1, Math.floor(len / 1.4));
    const dk = M.plain('#161310', { roughness: 1 });
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Stone s={[len, h, t]} p={[0, h / 2, 0]} c={c} />
        {merlons && Array.from({ length: nm }, (_, i) => {
          const x = -len / 2 + (i + 0.5) * (len / nm);
          if (rnd(i * 3 + seed) < miss) return null;
          const mh = 0.45 + rnd(i + seed * 7) * 0.4;
          return <Stone key={`m${i}`} s={[len / nm * 0.62, mh, t * 0.48]} p={[x, h + mh / 2, t * 0.26]} c={c} />;
        })}
        {loops && Array.from({ length: nm }, (_, i) => {
          if (i % 2) return null;
          const x = -len / 2 + (i + 0.5) * (len / nm);
          return <group key={`l${i}`}><Box s={[0.16, 0.34, 0.05]} p={[x, h - 1.0, t / 2 + 0.005]} m={dk} cast={false} /><Box s={[0.16, 0.34, 0.05]} p={[x, h - 1.0, -t / 2 - 0.005]} m={dk} cast={false} /></group>;
        })}
      </group>
    );
  };
  /** A spoked cart wheel standing on its axle (axis along x). */
  const Wheel = ({ p, r = 0.55, m }) => (
    <group position={p}>
      <mesh rotation={[0, Math.PI / 2, 0]} material={m} castShadow><torusGeometry args={[r, r * 0.13, 8, 22]} /></mesh>
      {Array.from({ length: 6 }, (_, k) => <Box key={k} s={[0.07, r * 1.9, 0.06]} p={[0, 0, 0]} r={[(k * Math.PI) / 6, 0, 0]} m={m} cast={false} />)}
      <Cyl rt={r * 0.2} h={0.22} r={[0, 0, Math.PI / 2]} m={m} seg={10} />
    </group>
  );

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
    const wallW = M.plain('#e8e4da', { roughness: 0.95 });
    const wallStain = M.plain('#cfd3d6', { roughness: 0.95 });
    const pink = M.plain('#cf5a6a', { roughness: 0.75 });
    const redW = M.plain('#b83a2c', { roughness: 0.8 });
    const yellow = M.plain('#f0b92c', { roughness: 0.7 });
    const dark = M.plain('#2a2024');
    const charcoal = M.plain('#2b292d', { roughness: 0.8 });
    const tileGold = M.plain('#c79f48', { metalness: 0.45, roughness: 0.5 });
    const tileRim = M.plain('#b8322a', { roughness: 0.7 });
    /** One gilded tiered roof with a red eave rim and bracket struts at the corners. */
    const GoldRoof = ({ w, y, h = 0.95, rim = 0.1 }) => (
      <group position={[0, y, 0]}>
        <Roof w={w} d={w} h={h} y={0} m={tileGold} sag={1.15} lift={0.04} fascia={false} />
        {[[0, w / 2], [0, -w / 2]].map(([a, b], i) => <Box key={`rz${i}`} s={[w, rim, 0.1]} p={[a, -0.03, b]} m={tileRim} cast={false} />)}
        {[[w / 2, 0], [-w / 2, 0]].map(([a, b], i) => <Box key={`rx${i}`} s={[0.1, rim, w]} p={[a, -0.03, b]} m={tileRim} cast={false} />)}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Box key={`st${i}`} s={[0.1, 0.8, 0.1]} p={[a * w * 0.36, -0.4, b * w * 0.36]} r={[b * 0.5, 0, -a * 0.5]} m={redW} cast={false} />)}
      </group>
    );
    return (
      <group>
        <Box s={[13, 0.3, 11]} p={[0, 0.0, 0]} m={M.plain('#d3c7b2', { roughness: 1 })} />
        {/* the two-tier pagoda: whitewashed plinth, pink-red hall with a gilt doorway, gilded first roof, open red-pillared upper storey, second roof, golden gajur */}
        <Box s={[5.4, 0.5, 5.4]} p={[0, 0.4, -0.4]} m={wallW} />
        <group position={[0, 0.65, -0.4]}>
          <Box s={[4.5, 1.7, 4.5]} p={[0, 0.85, 0]} m={pink} />
          <Box s={[4.6, 0.1, 4.6]} p={[0, 1.7, 0]} m={yellow} />
          {/* gilt arched doorway and its toran, flanked by barred windows */}
          <Arch w={1.5} h={1.45} p={[0, 0, 2.26]} m={yellow} pt={0.25} />
          <Arch w={1.1} h={1.25} p={[0, 0, 2.27]} m={dark} pt={0.2} />
          <Arch w={2.1} h={0.7} p={[0, 1.32, 2.255]} m={yellow} pt={0.3} />
          {[-1.6, 1.6].map((x) => (
            <group key={x}>
              <Box s={[0.95, 0.78, 0.06]} p={[x, 0.95, 2.26]} m={dark} cast={false} />
              {[-0.3, 0, 0.3].map((d) => <Box key={d} s={[0.04, 0.78, 0.08]} p={[x + d, 0.95, 2.29]} m={yellow} cast={false} />)}
              <Box s={[1.05, 0.06, 0.1]} p={[x, 1.36, 2.28]} m={yellow} cast={false} />
            </group>
          ))}
          <GoldRoof w={6.4} y={1.78} />
          {/* open upper storey: four red pillars with dark lattice between, red beam */}
          <Box s={[3.2, 0.12, 3.2]} p={[0, 2.18, 0]} m={redW} />
          {[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.09} h={1.2} p={[x, 2.8, z]} m={redW} seg={8} />)}
          {[0, 1, 2, 3].map((q) => <group key={q} rotation={[0, q * Math.PI / 2, 0]}><Box s={[2.6, 0.8, 0.05]} p={[0, 2.8, 1.4]} m={dark} cast={false} />{[-1, -0.5, 0, 0.5, 1].map((d) => <Box key={d} s={[0.04, 0.8, 0.07]} p={[d, 2.8, 1.42]} m={tileRim} cast={false} />)}</group>)}
          <Box s={[3.4, 0.14, 3.4]} p={[0, 3.45, 0]} m={redW} />
          <GoldRoof w={4.6} y={3.5} h={0.85} />
          <Cyl rt={0.07} rb={0.12} h={0.5} p={[0, 4.62, 0]} m={M.gold} seg={8} />
          <Ball rad={0.2} p={[0, 4.88, 0]} m={M.gold} />
          <mesh position={[0, 5.3, 0]} material={M.gold}><coneGeometry args={[0.1, 0.6, 8]} /></mesh>
        </group>
        {/* the black scalloped gateway: red pillars, a charcoal half-round arch lettered in white, yellow wall posts */}
        <group position={[-2.6, 0, 5.0]}>
          {[-1, 1].map((k) => <Box key={k} s={[0.7, 3.3, 0.7]} p={[k * 1.45, 1.65, 0]} m={redW} />)}
          <Box s={[3.6, 0.5, 0.7]} p={[0, 2.95, 0]} m={redW} />
          <Arch w={3.0} h={1.5} p={[0, 3.15, 0.1]} m={charcoal} pt={0.0} />
          {Array.from({ length: 15 }, (_, k) => { const a = (k / 14) * Math.PI; return <mesh key={k} position={[Math.cos(a) * 1.58, 3.15 + 0.75 + Math.sin(a) * 0.82, 0.1]} rotation={[0, 0, a - Math.PI / 2]} material={charcoal}><coneGeometry args={[0.1, 0.22, 3]} /></mesh>; })}
          <Sign text="श्री दन्तकाली शक्तिपीठ|धरान-१४" w={2.5} h={0.95} p={[0, 3.55, 0.115]} bg="#2b292d" fg="#f2eee4" font={0.42} />
          <Box s={[1.5, 2.5, 0.1]} p={[0, 1.25, 0.1]} m={M.plain('#7a2c20')} />
          {[-1, 1].map((k) => <group key={`y${k}`}><Box s={[0.55, 3.6, 0.55]} p={[k * 2.1, 1.8, 0]} m={yellow} /><Sign text="उचाई|१५७२ फिट" w={0.5} h={1.0} p={[k * 2.1, 2.5, 0.28]} bg="#f0b92c" fg="#c25a1c" font={0.3} /></group>)}
        </group>
        {/* compound wall: weathered whitewash, left and right of the gate, with a gilded kiosk roof at each end */}
        <Box s={[3.6, 2.0, 0.45]} p={[-6.0, 1.0, 5.0]} m={wallStain} />
        <Box s={[6.4, 2.0, 0.45]} p={[2.7, 1.0, 5.0]} m={wallW} />
        {[-1, 1].map((k) => <Box key={`s${k}`} s={[0.45, 2.0, 10]} p={[k * 6.4, 1.0, 0]} m={wallW} />)}
        <Box s={[13, 2.0, 0.45]} p={[0, 1.0, -5]} m={wallStain} />
        {[[-6.2, 5.0], [5.8, 5.0]].map(([x, z], k) => (
          <group key={k} position={[x, 2.0, z]}>
            <Box s={[0.9, 0.6, 0.9]} p={[0, 0.3, 0]} m={wallW} />
            <GoldRoof w={1.4} y={0.75} h={0.45} rim={0.06} />
            <Ball rad={0.1} p={[0, 1.3, 0]} m={M.gold} />
          </group>
        ))}
        {/* painted wall murals facing the street: a blue panel with a golden halo, and a red panel */}
        <Box s={[2.4, 1.5, 0.08]} p={[3.4, 1.0, 5.26]} m={M.plain('#27406e')} cast={false} />
        <mesh position={[3.4, 1.15, 5.31]} material={M.plain('#e8b83c', { roughness: 0.6 })}><circleGeometry args={[0.55, 24]} /></mesh>
        <Box s={[0.5, 0.8, 0.04]} p={[3.4, 0.75, 5.32]} m={M.plain('#e9d9a8')} cast={false} />
        <Box s={[2.2, 1.5, 0.08]} p={[5.6, 1.0, 5.26]} m={M.plain('#a8231e')} cast={false} />
        <mesh position={[5.6, 1.2, 5.31]} material={M.plain('#f1e7d8')}><circleGeometry args={[0.38, 16]} /></mesh>
        {/* red banner poles beside the pagoda, and yellow railing around the inner court */}
        {[[-3.6, 2.2], [3.8, 2.4]].map(([x, z], k) => <group key={k}><Cyl rt={0.04} h={4.4} p={[x, 2.2, z]} m={M.plain('#8a6a4a')} seg={5} /><Box s={[0.6, 0.35, 0.03]} p={[x + 0.3, 4.0, z]} m={redW} cast={false} /></group>)}
        <Rail a={[-1.9, 2.2]} b={[1.9, 2.2]} y={0.3} h={0.8} m={yellow} n={7} />
        <Frame s={[13, 6.2, 11]} p={[0, 2.9, 0]} />
      </group>
    );
  }
  function DantaEnv() {
    const M = useM();
    const surf = (r) => -29.5 + 28 * (1 - r / 40); /* height of the Bijayapur hill's flank at distance r from the shrine */
    const houses = Array.from({ length: 12 }, (_, k) => {
      const a = 0.35 + (k / 11) * (Math.PI - 0.7); const r = 22 + rnd(k + 3) * 12;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: surf(r), w: 3 + rnd(k) * 1.6, h: 3 + rnd(k + 5) * 2.4, c: ['#ece2c8', '#e5c4b8', '#d4e0d0', '#f0e8d8'][k % 4], rot: -a + Math.PI / 2 };
    });
    return (
      <group>
        <GroundDisc r={140} y={-30} m={M.plain('#8aa05e', { roughness: 1 })} />
        {/* Bijayapur hill: the shrine crowns its summit; steep forested flanks fall to Dharan below */}
        <mesh position={[0, -0.4, 0]} material={M.plain('#cdbd9f', { roughness: 1 })} receiveShadow><cylinderGeometry args={[9.2, 11, 0.8, 24]} /></mesh>
        <Massif p={[0, -29.5, 0]} r={40} h={28} seed={6} lo="#5e8a46" hi="#9bb066" />
        {/* the long flight of steps climbing the hill to the gate, with steel railings */}
        {Array.from({ length: 16 }, (_, k) => <Box key={k} s={[3.2, 9 - k * 0.44, 0.72]} p={[-2.6, -k * 0.44 - (9 - k * 0.44) / 2, 5.9 + k * 0.7]} m={M.mat('stone', 1, 1, { color: '#c9c3b6', roughness: 0.95 })} cast={false} />)}
        {[-4.3, -0.9].map((x) => <Box key={x} s={[0.06, 0.06, 12.6]} p={[x, 0.15 - 3.5, 12.0]} r={[0.5, 0, 0]} m={M.plain('#8c2b24')} cast={false} />)}
        {Array.from({ length: 22 }, (_, k) => {
          const a = rnd(k) * Math.PI * 2; const r = 12 + rnd(k + 8) * 20;
          const x = Math.cos(a) * r; const z = Math.sin(a) * r;
          if (z > 2 && Math.abs(x + 2) < 7) return null;
          return <Tree key={k} p={[x, surf(r) + 0.2, z]} s={1.7 + rnd(k + 3) * 1.1} kind={k % 5 ? 'broad' : 'pine'} />;
        })}
        {/* Dharan town spread over the lower slope */}
        {houses.map((h, k) => (
          <group key={k} position={[h.x, h.y, h.z]} rotation={[0, h.rot, 0]}>
            <Box s={[h.w + 0.4, 3.5, 3.4]} p={[0, -1.4, 0]} m={M.plain('#8a8068', { roughness: 1 })} />
            <Box s={[h.w, h.h, 3]} p={[0, h.h / 2, 0]} m={M.plain(h.c, { roughness: 0.92 })} />
            <Box s={[h.w + 0.2, 0.14, 3.2]} p={[0, h.h + 0.07, 0]} m={M.plain('#7a6a64', { roughness: 0.9 })} />
            {Array.from({ length: Math.max(1, Math.round(h.h / 1.4)) }, (_, s) => <Box key={s} s={[h.w * 0.78, 0.5, 0.05]} p={[0, 0.9 + s * 1.4, 1.52]} m={M.dark} cast={false} />)}
          </group>
        ))}
        {/* the green Mahabharat ridges beyond, with the first snow of the high Himal far behind */}
        <Massif p={[-84, -30, -50]} r={46} h={56} seed={2} lo="#4f7a40" hi="#86a45a" />
        <Massif p={[80, -30, -64]} r={48} h={52} seed={7} lo="#587f44" hi="#8fa860" />
        <Massif p={[0, -30, -130]} r={64} h={84} sx={1.7} sz={0.6} seed={4} snow={0.78} lo="#6d8e86" hi="#a2b8bb" />
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
  /** Four-sided stone-ruled shikhara spire: red faces with yellow ridge and centre lines, a yellow base band, a gold kalasha. */
  const StripedSpire = ({ r, h, p, plain = false }) => {
    const M = useM();
    const tex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 8;
      const x = c.getContext('2d');
      x.fillStyle = plain ? '#d2502a' : '#c63e28'; x.fillRect(0, 0, 256, 8);
      if (!plain) { x.fillStyle = '#f3c92f'; for (let k = 0; k < 4; k += 1) { x.fillRect(k * 64 - 5, 0, 10, 8); x.fillRect(k * 64 + 28, 0, 8, 8); } x.fillRect(251, 0, 5, 8); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
    }, [plain]);
    const yellow = M.plain('#f1c52e', { roughness: 0.7 });
    return (
      <group position={p}>
        <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.04, r, h, 4, 1]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>
        <mesh position={[0, 0.16, 0]} material={yellow}><cylinderGeometry args={[r * 0.97, r * 1.04, 0.34, 4]} /></mesh>
        <mesh position={[0, h * 0.34, 0]} material={yellow}><cylinderGeometry args={[r * 0.66 + 0.02, r * 0.66 + 0.02, 0.1, 4]} /></mesh>
        <Cyl rt={0.14} rb={0.22} h={0.34} p={[0, h + 0.08, 0]} m={M.gold} seg={10} />
        <Ball rad={0.2} p={[0, h + 0.38, 0]} m={M.gold} />
        <Trident p={[0, h + 0.5, 0]} h={1.3} />
      </group>
    );
  };
  function PindeshMain() {
    const M = useM();
    const orange = M.plain('#e4692e', { roughness: 0.85 });
    const yellow = M.plain('#f1c52e', { roughness: 0.7 });
    const cream = M.plain('#e9e3d4', { roughness: 0.95 });
    const dark = M.plain('#2e1f1a');
    const white = M.plain('#f6f2ea', { roughness: 0.85 });
    const red = M.plain('#b83a2a', { roughness: 0.8 });
    const tin = M.plain('#3f6fb4', { roughness: 0.5, metalness: 0.35 });
    return (
      <group>
        <Box s={[36, 0.2, 22]} p={[0, 0.1, 0]} m={M.plain('#cfc5ae', { roughness: 1 })} />
        {/* the long orange hall of the old temple with its row of yellow-edged arched windows and doors */}
        <Box s={[17, 2.4, 3.2]} p={[-6, 1.4, -3]} m={orange} />
        <Box s={[17.3, 0.2, 3.5]} p={[-6, 2.7, -3]} m={yellow} />
        <Box s={[17.3, 0.3, 3.5]} p={[-6, 0.3, -3]} m={M.plain('#9a4a30')} />
        {Array.from({ length: 13 }, (_, k) => (k === 3 || k === 9) ? (
          <group key={k}><Arch w={1.1} h={1.9} p={[-13.2 + k * 1.2, 0.2, -1.38]} m={yellow} pt={0.15} /><Arch w={0.86} h={1.75} p={[-13.2 + k * 1.2, 0.2, -1.37]} m={dark} pt={0.12} /></group>
        ) : (
          <group key={k}><Arch w={0.74} h={1.15} p={[-13.2 + k * 1.2, 0.85, -1.38]} m={yellow} pt={0.1} /><Arch w={0.54} h={1.0} p={[-13.2 + k * 1.2, 0.85, -1.37]} m={dark} pt={0.08} /></group>
        ))}
        {/* tin shade over the hall's verandah */}
        <Box s={[17.6, 0.08, 1.6]} p={[-6, 2.2, -0.7]} r={[0.35, 0, 0]} m={M.plain('#5a5d63', { metalness: 0.4, roughness: 0.6 })} />
        {/* the sanctum at the east end: whitewashed base with a dark arched door and the plain terracotta pyramid spire */}
        <Box s={[4.6, 0.4, 4.6]} p={[5.2, 0.4, -3]} m={M.plain('#9a4a30')} />
        <Box s={[4.2, 3.0, 4.2]} p={[5.2, 2.1, -3]} m={cream} />
        <Box s={[4.6, 0.34, 4.6]} p={[5.2, 3.75, -3]} m={yellow} />
        <Arch w={1.2} h={2.0} p={[5.2, 0.6, -0.87]} m={dark} pt={0.3} />
        <Box s={[1.8, 0.07, 1.0]} p={[5.2, 2.5, -0.5]} r={[0.35, 0, 0]} m={M.plain('#6a6d73', { metalness: 0.4, roughness: 0.6 })} />
        <StripedSpire r={3.55} h={6.6} p={[5.2, 3.9, -3]} plain />
        {/* the main Pindeshwar Mahadev temple behind: striped red-and-yellow spire on a white base */}
        <Box s={[4.0, 3.2, 4.0]} p={[-6, 2.0, -9.4]} m={cream} />
        <Box s={[4.4, 0.34, 4.4]} p={[-6, 3.75, -9.4]} m={red} />
        <Arch w={1.1} h={1.9} p={[-6, 0.6, -7.37]} m={dark} pt={0.28} />
        <StripedSpire r={3.2} h={7.0} p={[-6, 3.9, -9.4]} />
        {/* small shrines: a white-domed one, an orange-domed one and a little red pagoda */}
        <group position={[12.4, 0.2, -3.4]}>
          <Box s={[3.0, 0.5, 3.0]} p={[0, 0.25, 0]} m={white} />
          <Box s={[2.4, 1.7, 2.4]} p={[0, 1.35, 0]} m={white} />
          <Arch w={0.9} h={1.3} p={[0, 0.5, 1.21]} m={dark} pt={0.2} />
          <Box s={[2.8, 0.18, 2.8]} p={[0, 2.3, 0]} m={white} />
          <Dome r={1.2} h={1.5} p={[0, 2.4, 0]} m={white} />
        </group>
        <group position={[14.8, 0.2, 1.6]}>
          <Box s={[2.2, 0.4, 2.2]} p={[0, 0.2, 0]} m={white} />
          <Box s={[1.8, 1.4, 1.8]} p={[0, 1.1, 0]} m={orange} />
          <Dome r={1.0} h={1.2} p={[0, 1.8, 0]} m={M.plain('#f09a38', { roughness: 0.6 })} />
        </group>
        <group position={[9.4, 0.2, -9.6]}>
          <Box s={[2.4, 0.4, 2.4]} p={[0, 0.2, 0]} m={white} />
          <Box s={[1.8, 1.5, 1.8]} p={[0, 1.15, 0]} m={red} />
          <Roof w={3.0} d={3.0} h={0.8} y={1.95} m={M.plain('#c4402e', { roughness: 0.6 })} sag={1.1} lift={0.04} />
          <Box s={[1.2, 0.9, 1.2]} p={[0, 2.8, 0]} m={red} />
          <Roof w={2.0} d={2.0} h={0.7} y={3.25} m={M.plain('#c4402e', { roughness: 0.6 })} sag={1.1} lift={0.04} />
          <Ball rad={0.18} p={[0, 4.1, 0]} m={M.gold} />
        </group>
        <Box s={[5.4, 0.1, 3.6]} p={[14.6, 2.6, -8]} r={[0.2, 0, 0]} m={tin} />
        {[[12.2, -9.6], [17, -9.6], [12.2, -6.6], [17, -6.6]].map(([x, z], k) => <Cyl key={k} rt={0.06} h={2.4} p={[x, 1.4, z]} m={M.plain('#6a5a4a')} seg={6} />)}
        {/* the yellow entrance gate: two lettered pillars with small domes, a half-round arch bearing 'Om Namah Shivaya' */}
        <group position={[-3, 0.2, 8.4]}>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 3.0, 0, 0]}>
              <Box s={[1.5, 3.6, 1.0]} p={[0, 1.8, 0]} m={yellow} />
              <Sign text="स्वा|ग|त|म्" w={0.9} h={3.0} p={[0, 1.9, 0.51]} bg="#f1c52e" fg="#2a5aa8" font={0.62} />
              <Box s={[1.7, 0.2, 1.2]} p={[0, 3.7, 0]} m={yellow} />
              <Cyl rt={0.45} rb={0.52} h={0.5} p={[0, 4.0, 0]} m={yellow} seg={10} />
              <Dome r={0.55} h={0.6} p={[0, 4.25, 0]} m={yellow} fin={false} />
              <Ball rad={0.1} p={[0, 4.95, 0]} m={M.gold} />
            </group>
          ))}
          <Box s={[4.6, 1.2, 0.9]} p={[0, 3.0, 0]} m={yellow} />
          <Sign text="श्री पिण्डेश्वर बाबाधाम" w={4.4} h={0.78} p={[0, 2.9, 0.46]} bg="#f1c52e" fg="#b42e22" font={0.62} />
          <mesh position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={yellow}><cylinderGeometry args={[1.55, 1.55, 0.9, 24, 1, false, 0, Math.PI]} /></mesh>
          <Sign text="ॐ नमः शिवाय" w={2.4} h={0.6} p={[0, 3.95, 0.47]} bg="#f1c52e" fg="#2a5aa8" font={0.7} />
        </group>
        <PrayerFlags from={[-6.4, 4.6, 8.4]} to={[0.4, 4.4, 8.4]} n={14} />
        <Frame s={[36, 11, 22]} p={[0, 4.8, -1]} />
      </group>
    );
  }
  function PindeshEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={130} y={-0.04} m={M.plain('#8aa45c', { roughness: 1 })} />
        <GroundDisc r={30} y={-0.02} m={M.plain('#a9c07a', { roughness: 1 })} />
        {/* paved courtyard inside a low yellow boundary wall */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow material={M.mat('stone', 8, 5, { color: '#d8cfba', roughness: 0.95 })}><planeGeometry args={[38, 24]} /></mesh>
        <Box s={[38, 1.4, 0.4]} p={[0, 0.7, -12]} m={M.plain('#e8d38a')} />
        <Box s={[0.4, 1.4, 24]} p={[19, 0.7, 0]} m={M.plain('#e8d38a')} />
        <Box s={[0.4, 1.4, 24]} p={[-19, 0.7, 0]} m={M.plain('#e8d38a')} />
        <Box s={[10, 1.0, 0.4]} p={[-12.5, 0.5, 11.2]} m={M.plain('#e8d38a')} />
        <Box s={[22, 1.0, 0.4]} p={[8, 0.5, 11.2]} m={M.plain('#e8d38a')} />
        {/* palms and broad shade trees closing in behind, as in the photographs */}
        {Array.from({ length: 11 }, (_, k) => <Palm key={k} p={[-34 + k * 4.6 + rnd(k) * 2, 0, -17 - rnd(k + 4) * 8]} s={1.5 + rnd(k) * 0.6} />)}
        {Array.from({ length: 11 }, (_, k) => { const a = Math.PI + 0.25 + (k / 10) * (Math.PI - 0.5); const r = 24 + rnd(k) * 5; return <Tree key={`t${k}`} p={[Math.cos(a) * r, 0, Math.sin(a) * r]} s={2.2 + rnd(k + 2) * 0.8} />; })}
        {[[-26, 12], [26, 14], [32, -2]].map(([x, z], k) => <Palm key={`q${k}`} p={[x, 0, z]} s={1.7} />)}
        <Town n={14} r0={62} r1={72} a0={Math.PI + 0.2} a1={Math.PI * 2 - 0.2} seed={5} hMin={3} hMax={6} />
        {/* the green Mahabharat foothills behind Dharan */}
        <Massif p={[-60, -0.5, -80]} r={50} h={34} seed={2} lo="#4f7a40" hi="#86a45a" />
        <Massif p={[50, -0.5, -90]} r={48} h={30} seed={7} lo="#587f44" hi="#8fa860" />
        <Massif p={[0, -0.5, -120]} r={64} h={46} sx={1.6} sz={0.6} seed={4} lo="#6d8e86" hi="#a2b8bb" />
      </group>
    );
  }

  /* =====================================================================
     PATHIBHARA DEVI (Taplejung): open summit shrine, bells, flags, Kanchenjunga behind
     ===================================================================== */
  function PathibharaMain() {
    const M = useM();
    const rock = M.plain('#8d8a82', { roughness: 1 });
    const rockL = M.plain('#a6a298', { roughness: 1 });
    const red = M.plain('#c4281f', { roughness: 0.8, side: THREE.DoubleSide });
    const gold = M.gold;
    const marigold = M.plain('#f2a516', { roughness: 0.9 });
    const blueRoof = M.plain('#3f6db4', { roughness: 0.45, metalness: 0.4 });
    const wood = M.plain('#cdb070', { roughness: 0.85 });
    const woodD = M.plain('#8a6c3e', { roughness: 0.85 });
    const paving = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x = c.getContext('2d');
      x.fillStyle = '#b4b0a5'; x.fillRect(0, 0, 256, 256);
      for (let j = 0; j < 4; j += 1) { let u = (j % 2) * 30; while (u < 256) { const w = 46 + rnd(u + j * 17) * 40; x.fillStyle = `hsl(40, 6%, ${58 + rnd(u * 3 + j) * 14}%)`; x.fillRect(u + 2, j * 64 + 2, w - 4, 60); u += w; } }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 4); t.anisotropy = 4;
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    }, []);
    const steel = M.plain('#2a2b2e', { metalness: 0.5, roughness: 0.55 });
    return (
      <group>
        {/* the stone-paved summit terrace, rimmed by rough boulders */}
        <Box s={[20, 0.6, 16]} p={[0, -0.3, 0]} m={paving} />
        {[[-10, -4], [-10.4, 2], [-9.4, 6.4], [10.2, -3], [10.4, 3.4], [-5, -8.2], [2, -8.4], [8, -7.6], [-3, 8.2], [5, 8.1]].map(([x, z], k) => <Rocks key={k} p={[x, 0.1, z]} s={0.9 + (k % 3) * 0.3} seed={k + 3} m={k % 2 ? rock : rockL} sc={[1.2, 0.6, 1.0]} />)}
        {/* the main temple building: tan timber-panelled walls on a stone base, two-tier blue tin roof */}
        <group position={[0, 0, -2.4]}>
          <Stone s={[6.4, 0.6, 5.4]} p={[0, 0.3, 0]} c="#d6d2c8" glow={0.5} />
          <Box s={[5.6, 2.3, 4.6]} p={[0, 1.75, 0]} m={wood} />
          {[-2, -1, 0, 1, 2].map((x) => <Box key={x} s={[0.1, 2.3, 0.08]} p={[x * 1.0, 1.75, 2.34]} m={woodD} cast={false} />)}
          <Box s={[5.7, 0.14, 4.7]} p={[0, 0.7, 0]} m={woodD} />
          {[-1.8, 1.8].map((x) => <Box key={x} s={[0.95, 0.75, 0.06]} p={[x, 2.0, 2.36]} m={M.plain('#dfe4e6', { roughness: 0.4 })} cast={false} />)}
          <Box s={[1.0, 1.7, 0.08]} p={[0, 1.55, 2.36]} m={M.plain('#3a2616')} cast={false} />
          <Roof w={7.0} d={6.0} h={1.1} y={2.9} m={blueRoof} sag={1.05} lift={0.03} />
          <Box s={[3.0, 1.0, 2.4]} p={[0, 3.55, 0]} m={wood} />
          {[-0.9, 0.9].map((x) => <Box key={x} s={[0.7, 0.5, 0.06]} p={[x, 3.6, 1.22]} m={M.plain('#dfe4e6', { roughness: 0.4 })} cast={false} />)}
          <Roof w={4.0} d={3.4} h={0.8} y={4.05} m={blueRoof} sag={1.05} lift={0.03} />
          <Cyl rt={0.05} rb={0.1} h={0.55} p={[0, 5.2, 0]} m={gold} seg={8} />
          <Ball rad={0.17} p={[0, 5.55, 0]} m={gold} />
        </group>
        {/* the sanctum in front: gold-faced goddess beneath a red cloth canopy, heaped with marigold garlands */}
        <group position={[0, 0, 2.2]}>
          <Box s={[3.4, 0.4, 2.6]} p={[0, 0.2, 0]} m={paving} />
          {[[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.06} h={2.8} p={[x, 1.8, z]} m={steel} seg={6} />)}
          <Box s={[3.8, 0.08, 3.0]} p={[0, 3.25, 0]} r={[0.12, 0, 0]} m={red} />
          <Box s={[3.8, 0.4, 0.05]} p={[0, 3.0, 1.55]} m={red} cast={false} />
          <Box s={[1.5, 0.7, 0.9]} p={[0, 0.75, 0]} m={M.plain('#e9e2d2')} />
          <mesh position={[0, 1.35, 0]} material={gold} castShadow><coneGeometry args={[0.5, 1.0, 12]} /></mesh>
          <Ball rad={0.28} p={[0, 2.0, 0]} m={gold} />
          <mesh position={[0, 2.38, 0]} material={gold}><coneGeometry args={[0.24, 0.45, 10]} /></mesh>
          <Ball rad={0.62} sc={[1.4, 0.55, 0.9]} p={[0, 1.15, 0.28]} m={marigold} />
          <Ball rad={0.5} sc={[1.5, 0.4, 0.8]} p={[0, 1.55, 0.35]} m={M.plain('#c8312a')} />
          <Box s={[1.1, 0.3, 0.3]} p={[0, 1.2, 0.5]} m={M.plain('#2f9fd6')} />
        </group>
        {/* bunches of iron and brass tridents planted by pilgrims */}
        {[[-3.0, 3.4], [-2.4, 4.1], [-1.9, 3.6], [3.0, 3.6], [2.4, 4.2], [1.9, 3.6], [-4.6, 0.8], [4.8, 1.2], [-5, -1.6], [5.2, -1.4]].map(([x, z], k) => <Trident key={k} p={[x, 0, z]} h={1.8 + (k % 3) * 0.7} />)}
        {/* the great bell: bronze bell hung from a dark steel gallows frame */}
        <group position={[-6.4, 0, 3.4]}>
          {[-1.0, 1.0].map((x) => <Cyl key={x} rt={0.1} rb={0.13} h={3.1} p={[x, 1.55, 0]} m={steel} seg={6} />)}
          <Box s={[2.5, 0.2, 0.2]} p={[0, 3.1, 0]} m={steel} />
          <Box s={[0.12, 0.9, 0.12]} p={[0, 2.6, 0]} m={steel} />
          <Bell p={[0, 1.6, 0]} s={2.2} />
        </group>
        {/* flag poles and many strings of prayer flags */}
        {[[-8, -4.5], [8, -3.5], [-1.5, -6.8], [6.5, 5.2], [-7, 6]].map(([x, z], k) => <Cyl key={k} rt={0.06} h={6.2} p={[x, 3.1, z]} m={M.plain('#8a6a4a')} seg={5} />)}
        <PrayerFlags from={[-8, 6, -4.5]} to={[8, 5.8, -3.5]} n={30} />
        <PrayerFlags from={[-8, 5.5, -4.5]} to={[-1.5, 6, -6.8]} n={16} />
        <PrayerFlags from={[-1.5, 5.9, -6.8]} to={[6.5, 6, 5.2]} n={32} />
        <PrayerFlags from={[-7, 6, 6]} to={[6.5, 5.6, 5.2]} n={26} />
        <PrayerFlags from={[-8, 5, -4.5]} to={[-7, 5.4, 6]} n={24} />
        <Frame s={[21, 7.5, 17]} p={[0, 3.2, 0]} />
      </group>
    );
  }
  function PathibharaEnv() {
    const M = useM();
    const cloud = <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />;
    return (
      <group>
        <GroundDisc r={160} y={-34} m={M.plain('#5d6f8d', { roughness: 1 })} />
        {/* the summit ridge itself: alpine turf and rock falling away on every side */}
        <Massif p={[0, -34, 0]} r={70} h={33.4} seed={5} lo="#66744f" hi="#9a9384" />
        {Array.from({ length: 16 }, (_, k) => { const a = rnd(k) * Math.PI * 2; const r = 14 + rnd(k + 9) * 6; return <Tree key={k} p={[Math.cos(a) * r, -1.5 - (r - 12) * 0.5, Math.sin(a) * r]} s={1.6 + rnd(k) * 1.0} kind="pine" />; })}
        <Tree p={[10.5, -0.3, -4.2]} s={1.9} kind="broad" />
        {/* forested blue ridges stepping down from the summit, mist lying in the valleys between */}
        <Massif p={[-100, -34, -70]} r={50} h={46} seed={2} lo="#42607a" hi="#7690a8" />
        <Massif p={[96, -34, -76]} r={50} h={44} seed={8} lo="#46657e" hi="#7a94ac" />
        <Massif p={[-84, -34, 60]} r={44} h={34} seed={11} lo="#48667a" hi="#7a94a8" />
        <Massif p={[90, -34, 70]} r={46} h={36} seed={13} lo="#46647a" hi="#7a94a8" />
        {[[-40, -12, -60, 50], [38, -14, -70, 56], [0, -9, -90, 70]].map(([x, y, z, r], k) => <mesh key={`c${k}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, y, z]} scale={[1, 0.5, 1]}><circleGeometry args={[r, 32]} />{cloud}</mesh>)}
        {/* Kanchenjunga and its neighbours: a long wall of snow and ice along the northern horizon */}
        <Range n={11} radius={100} y={-34} a0={Math.PI * 1.04} a1={Math.PI * 1.96} h={60} w={26} snow={0.4} seed={4} lo="#3c4a7c" hi="#8c9ac4" />
        <Massif p={[-6, -34, -112]} r={34} h={86} sx={1.25} sz={0.7} seed={21} snow={0.34} lo="#3c4a7c" hi="#9aa8cc" />
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
    const blue = M.plain('#2f5fae', { roughness: 0.6 });
    const brown = M.plain('#a98055', { roughness: 0.85 });
    const dark = M.plain('#2b201a');
    const tile = M.plain('#c1706a', { roughness: 0.95 });
    const gold = M.gold;
    /** A white domed shrine: plinth, porch of slim pillars under a deep eave, drum, ribbed dome, four corner turrets. */
    const temple = (p, s, k, rot = 0) => (
      <group position={p} scale={s} key={k} rotation={[0, rot, 0]}>
        <Box s={[3.6, 0.3, 3.6]} p={[0, 0.15, 0]} m={wm} />
        <Box s={[3.2, 0.14, 3.2]} p={[0, 0.37, 0]} m={wm} />
        <Box s={[2.6, 2.0, 2.6]} p={[0, 1.4, 0]} m={wm} />
        {/* open porch on the front: pillars, a dark doorway and a projecting eave */}
        <Arch w={0.9} h={1.4} p={[0, 0.44, 1.31]} m={dark} pt={0.2} />
        {[-1.15, -0.4, 0.4, 1.15].map((x) => <Cyl key={x} rt={0.06} rb={0.08} h={1.7} p={[x, 1.3, 1.62]} m={wm} seg={8} />)}
        <Box s={[3.0, 0.14, 0.9]} p={[0, 2.22, 1.5]} m={wm} />
        <Box s={[3.1, 0.07, 0.95]} p={[0, 2.12, 1.52]} m={M.plain('#e6e2d8')} cast={false} />
        {[-0.8, 0, 0.8].map((x) => <Arch key={x} w={0.6} h={0.9} p={[x, 1.2, 1.64]} m={M.plain('#d9d4c8')} pt={0.14} />)}
        <Box s={[2.9, 0.16, 2.9]} p={[0, 2.5, 0]} m={wm} />
        <Cyl rt={1.0} rb={1.12} h={0.6} p={[0, 2.88, 0]} m={wm} seg={12} />
        <Cyl rt={1.38} rb={1.38} h={0.1} p={[0, 2.62, 0]} m={wm} seg={20} />
        <Dome r={1.05} h={1.3} p={[0, 3.18, 0]} m={wm} seg={24} />
        {[[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].map(([a, b], j) => (
          <group key={j} position={[a, 2.58, b]}>
            <Cyl rt={0.11} rb={0.15} h={0.55} p={[0, 0.28, 0]} m={wm} seg={8} />
            <Dome r={0.2} h={0.3} p={[0, 0.55, 0]} m={wm} seg={10} />
          </group>
        ))}
      </group>
    );
    return (
      <group>
        <Box s={[22, 0.5, 17]} p={[0, 0.25, 0]} m={tile} />
        <Box s={[23, 0.3, 18]} p={[0, -0.1, 0]} m={M.plain('#9a9283', { roughness: 1 })} />
        {temple([-4.4, 0.5, -5.2], 1.5, 'main')}
        {temple([-9.4, 0.5, -2.0], 1.05, 'b', 0.2)}
        {temple([1.6, 0.5, -6.4], 0.95, 'c', -0.15)}
        {/* the circular Varaha basin: white outer kerb, violet tiled wall, green water, Varaha on a red lotus */}
        <group position={[2.6, 0.5, 2.8]}>
          <Cyl rt={2.9} rb={2.9} h={0.65} p={[0, 0.32, 0]} m={wm} seg={40} />
          <Cyl rt={2.5} rb={2.5} h={0.7} p={[0, 0.35, 0]} m={lav} seg={40} />
          <Cyl rt={2.2} rb={2.2} h={0.72} p={[0, 0.36, 0]} m={M.plain('#1f4a3c', { roughness: 0.15, metalness: 0.3 })} seg={40} />
          <Cyl rt={0.5} rb={0.6} h={0.34} p={[0, 0.5, 0]} m={M.plain('#d4413a')} seg={14} />
          <Cyl rt={0.3} rb={0.45} h={0.2} p={[0, 0.78, 0]} m={M.plain('#e07a8a')} seg={14} />
          <Cyl rt={0.22} rb={0.3} h={1.2} p={[0, 1.4, 0]} m={M.plain('#6fb6b0')} seg={10} />
          <Ball rad={0.24} sc={[1, 1.1, 1.35]} p={[0, 2.18, 0.08]} m={M.plain('#8a8fb0')} />
          <mesh position={[0, 2.12, 0.42]} rotation={[Math.PI / 2, 0, 0]} material={M.plain('#8a8fb0')}><coneGeometry args={[0.1, 0.3, 8]} /></mesh>
          <mesh position={[0, 2.5, 0.05]} material={gold}><coneGeometry args={[0.16, 0.34, 8]} /></mesh>
          <Box s={[1.1, 0.12, 0.2]} p={[0, 1.7, 0.1]} m={M.plain('#e9c25a')} />
          {/* the olive octagonal railing with pale-green globe lamps */}
          {Array.from({ length: 24 }, (_, k) => { const a = (k / 24) * Math.PI * 2; return <Cyl key={k} rt={0.03} h={0.9} p={[Math.cos(a) * 3.55, 0.45, Math.sin(a) * 3.55]} m={olive} seg={5} />; })}
          {[0.5, 0.95].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={olive}><torusGeometry args={[3.55, 0.035, 6, 48]} /></mesh>)}
          {[0, 1, 2, 3].map((k) => { const a = (k / 4) * Math.PI * 2 + 0.78; return <group key={k} position={[Math.cos(a) * 3.55, 0, Math.sin(a) * 3.55]}><Cyl rt={0.04} h={1.4} p={[0, 0.7, 0]} m={olive} seg={5} /><Ball rad={0.14} p={[0, 1.5, 0]} m={M.plain('#c4ec8a', { emissive: '#7aa040', emissiveIntensity: 0.5 })} /></group>; })}
        </group>
        {/* brown octagonal-roofed pavilion in front of the basin */}
        <group position={[-7.6, 0.5, 5.2]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.1} h={1.6} p={[a * 0.9, 0.8, b * 0.9]} m={M.plain('#6b4a34')} seg={6} />)}
          <Box s={[2.2, 0.2, 2.2]} p={[0, 1.7, 0]} m={M.plain('#6b4a34')} />
          <Roof w={3.4} d={3.4} h={1.4} y={1.75} m={brown} sag={1.3} lift={0.02} />
          <Gajur y={3.0} s={0.45} />
        </group>
        {/* the main gate: white pillars with pinnacles under a half-round arch, blue steel railing along the terrace edge */}
        <group position={[9.2, 0.5, 6.6]}>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 1.5, 0, 0]}>
              <Box s={[0.8, 2.6, 0.8]} p={[0, 1.3, 0]} m={wm} />
              <Box s={[1.0, 0.18, 1.0]} p={[0, 2.7, 0]} m={wm} />
              <mesh position={[0, 3.2, 0]} material={wm}><coneGeometry args={[0.3, 0.85, 8]} /></mesh>
              <Ball rad={0.1} p={[0, 3.7, 0]} m={gold} />
            </group>
          ))}
          <Box s={[3.4, 0.7, 0.7]} p={[0, 2.4, 0]} m={wm} />
          <Arch w={2.2} h={1.7} p={[0, 0.2, 0.36]} m={M.plain('#d8d3c6')} pt={0.4} />
          <Arch w={1.7} h={1.5} p={[0, 0.2, 0.37]} m={dark} pt={0.3} />
        </group>
        <Rail a={[-10.4, 8]} b={[10.4, 8]} y={0.5} m={blue} n={18} h={1.0} />
        <Rail a={[10.4, 8]} b={[10.4, -7]} y={0.5} m={blue} n={10} h={1.0} />
        <Rail a={[-10.4, 8]} b={[-10.4, -4]} y={0.5} m={blue} n={7} h={1.0} />
        {/* blue benches along the back wall of the courtyard */}
        {[0, 1, 2, 3].map((k) => <Box key={k} s={[2.0, 0.5, 0.5]} p={[-6 + k * 2.3, 0.78, -8.2]} m={blue} />)}
        <Frame s={[24, 8.2, 18]} p={[0, 3.6, 0]} />
      </group>
    );
  }
  function BarahaEnv() {
    const M = useM();
    const water = <meshStandardMaterial color="#4f8f98" metalness={0.25} roughness={0.15} />;
    const sand = <meshStandardMaterial color="#e3dcc4" roughness={1} />;
    return (
      <group>
        <GroundDisc r={140} y={-9.5} m={M.plain('#8c9a68', { roughness: 1 })} />
        {/* the terrace is a stone-faced bluff above the river valley */}
        <mesh position={[0, -4.9, 0]} material={M.plain('#8f8672', { roughness: 1 })} receiveShadow><cylinderGeometry args={[15.2, 26, 9.6, 14]} /></mesh>
        {Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return <Rocks key={`bl${k}`} p={[Math.cos(a) * 18.5, -4.5 - (k % 3) * 1.8, Math.sin(a) * 18.5]} s={1.5 + (k % 4) * 0.3} seed={k + 2} m={M.plain(k % 2 ? '#7d7664' : '#9a917c', { roughness: 1 })} sc={[1.3, 1.0, 1.3]} />; })}
        {/* the broad Saptakoshi: braided channels of green-blue water between wide pale sand and shingle banks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9.4, -22]}><planeGeometry args={[220, 34]} />{sand}</mesh>
        {[[-12, -17, 70, 6, 0.06], [18, -24, 80, 7, -0.08], [-30, -30, 60, 5, 0.1], [8, -30, 50, 4, 0]].map(([x, z, w, d, r], k) => <mesh key={k} rotation={[-Math.PI / 2, 0, r]} position={[x, -9.35, z]}><planeGeometry args={[w, d]} />{water}</mesh>)}
        {[[-24, -22, 5], [14, -17, 6], [34, -28, 4], [-4, -26, 5]].map(([x, z, r], k) => <mesh key={`b${k}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -9.3, z]} scale={[2.2, 1, 1]}><circleGeometry args={[r, 20]} />{sand}</mesh>)}
        {/* steep forested hills on the far bank and the flanks of the gorge */}
        <Massif p={[-30, -9.5, -62]} r={34} h={50} seed={3} lo="#3f6a38" hi="#7d9a4e" />
        <Massif p={[34, -9.5, -66]} r={36} h={56} seed={6} lo="#44703c" hi="#82a054" />
        <Massif p={[-74, -9.5, -14]} r={30} h={42} seed={9} lo="#3f6a38" hi="#7d9a4e" />
        <Massif p={[74, -9.5, -16]} r={30} h={40} seed={12} lo="#44703c" hi="#82a054" />
        <Massif p={[0, -9.5, -118]} r={60} h={78} sx={1.7} sz={0.6} seed={5} lo="#58806f" hi="#9ab0b0" />
        {Array.from({ length: 24 }, (_, k) => { const x = -60 + k * 5 + rnd(k) * 3; const z = -46 - rnd(k + 3) * 10; return <Tree key={k} p={[x, -2 + rnd(k) * 6, z]} s={2.6 + rnd(k) * 1.2} kind={k % 3 ? 'broad' : 'pine'} />; })}
        {/* trees on the terrace edge and the near bank */}
        {[[-14, -8], [-15, 1], [13.5, -9], [14, 3], [-14, 8]].map(([x, z], k) => <Tree key={`n${k}`} p={[x, 0, z]} s={2.2 + rnd(k) * 0.6} />)}
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
  /** The limestone dome of the cave: a ragged shell with a wide opening on the front (+z) and a sky-hole in the crown. */
  const CaveShell = ({ r = 7.5, h = 5.6, gap = 1.9, hole = 0.2, mat }) => {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(1, 56, 32, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, hole, Math.PI / 2 - hole);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
        const f = 1 + 0.11 * Math.sin(x * 3.1 + 1) * Math.cos(z * 3.3) + 0.08 * Math.sin(y * 5.1 + x * 3.7) + 0.05 * Math.sin(x * 8.3 + z * 7.1 + y * 5.9) + 0.03 * Math.sin(x * 15 - z * 13 + y * 11);
        p.setXYZ(i, x * f, y * (f * 0.5 + 0.5), z * f);
      }
      g.computeVertexNormals();
      return g;
    }, [gap, hole]);
    return <mesh geometry={geo} material={mat} scale={[r, h, r * 0.92]} castShadow receiveShadow />;
  };
  function HalesiMain() {
    const M = useM();
    const rockM = M.plain('#8f8c82', { roughness: 1, side: THREE.DoubleSide });
    const rockD = M.plain('#6c6a63', { roughness: 1 });
    const rockL = M.plain('#a29f94', { roughness: 1 });
    const black = M.plain('#0d0b09', { roughness: 1 });
    const white = M.plain('#f4f1ea', { roughness: 0.85 });
    const red = M.plain('#c43a2f', { roughness: 0.8 });
    const stone = M.plain('#cfc7b8', { roughness: 0.9 });
    const lingamM = M.plain('#d9776c', { roughness: 0.55 });
    return (
      <group>
        {/* the earth floor inside, dark and trampled */}
        <Box s={[13, 0.2, 12]} p={[0, 0.1, -0.5]} m={M.plain('#5d5247', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, -1.2]} material={black}><circleGeometry args={[5.8, 28]} /></mesh>
        <CaveShell mat={rockM} />
        {/* heavy lips of lichen-grey rock over and beside the mouth, and fallen boulders */}
        <Rocks p={[0, 5.0, 2.1]} s={2.0} seed={21} m={rockL} sc={[3.0, 0.62, 1.0]} />
        <Rocks p={[-5.6, 2.3, 2.6]} s={2.4} seed={9} m={rockD} sc={[1.0, 1.15, 1.4]} />
        <Rocks p={[5.8, 2.1, 2.4]} s={2.2} seed={12} m={rockM} sc={[1.0, 1.1, 1.35]} />
        <Rocks p={[-7.6, 0.9, 5.0]} s={1.1} seed={31} m={rockD} sc={[1.3, 0.8, 1.1]} />
        <Rocks p={[7.4, 0.8, 5.4]} s={1.0} seed={35} m={rockL} sc={[1.2, 0.8, 1.0]} />
        <Rocks p={[0, 3.2, -6.0]} s={5.4} seed={4} m={rockM} sc={[1.5, 0.8, 0.8]} />
        {/* railed steps descending from the left to the cave floor, white posts and red rails */}
        {Array.from({ length: 10 }, (_, k) => <Box key={k} s={[1.7, 0.16 * (10 - k) + 0.1, 0.52]} p={[-5.4, 0.08 * (10 - k) + 0.05, 7.4 - k * 0.52]} m={stone} />)}
        {[-6.4, -4.4].map((x) => (
          <group key={x}>
            {Array.from({ length: 6 }, (_, k) => <Box key={k} s={[0.14, 1.0 + 0.16 * (10 - k * 1.7) * 0.5, 0.14]} p={[x, 0.5 + 0.08 * (10 - k * 1.7), 7.4 - k * 0.92]} m={white} />)}
            <Box s={[0.06, 0.06, 5.8]} p={[x, 1.55, 4.7]} r={[0.19, 0, 0]} m={red} cast={false} />
            <Box s={[0.06, 0.06, 5.8]} p={[x, 1.05, 4.7]} r={[0.19, 0, 0]} m={red} cast={false} />
          </group>
        ))}
        {/* within the mouth: railed platform with shrines, bell, natural lingam, tridents */}
        <Box s={[5.4, 0.3, 3.2]} p={[0.4, 0.3, 1.6]} m={white} />
        <Rail a={[-2.4, 3.3]} b={[3.2, 3.3]} y={0.45} h={0.9} m={white} n={7} />
        <Rail a={[3.2, 3.3]} b={[3.2, 0.2]} y={0.45} h={0.9} m={white} n={4} />
        {[[-1.4, 0.8], [1.9, 0.6]].map(([x, z], k) => (
          <group key={k} position={[x, 0.45, z]}>
            <Box s={[1.1, 0.5, 1.0]} p={[0, 0.25, 0]} m={white} />
            <Box s={[0.8, 0.7, 0.7]} p={[0, 0.85, 0]} m={M.plain('#3a2c24')} />
            <Rail a={[-0.6, 0.6]} b={[0.6, 0.6]} y={0.5} h={0.6} m={red} n={3} />
          </group>
        ))}
        <mesh position={[0.4, 1.05, 0.5]} material={lingamM}><coneGeometry args={[0.28, 1.2, 9]} /></mesh>
        <Trident p={[2.7, 0.45, 2.2]} h={1.8} />
        <Trident p={[-2.0, 0.45, 2.4]} h={1.5} />
        <Bell p={[3.2, 2.6, 2.8]} s={0.9} />
        <Box s={[0.1, 2.6, 0.1]} p={[3.2, 1.3, 2.8]} m={M.dark} />
        <PrayerFlags from={[-6.6, 3.8, 6]} to={[6.2, 4.8, 4.6]} n={22} />
        <PrayerFlags from={[-6.2, 3.2, 7.6]} to={[6.0, 3.9, 6.2]} n={22} />
        <Frame s={[17, 8, 15]} p={[0, 3.4, 0.4]} />
      </group>
    );
  }
  function HalesiEnv() {
    const M = useM();
    const hillY = (x, z, cx, cz, R, H) => Math.max(0, H * (1 - Math.hypot(x - cx, z - cz) / R));
    const village = [[-42, -33, 0.3, '#2f6db5', '#d6c6a4', 3], [-46, -29, 0.9, '#2f6db5', '#c9a58c', 2], [-38, -38, -0.2, '#3e6fb0', '#e4dcc8', 3], [-49, -35, 0.2, '#2f6db5', '#d6c6a4', 2], [-43, -26, 0.0, '#c9382c', '#e4dcc8', 2], [-36, -31, 0.4, '#3e8a58', '#d6c6a4', 2]];
    return (
      <group>
        <GroundDisc r={120} y={-0.06} m={M.plain('#7a8a58', { roughness: 1 })} />
        <GroundDisc r={14} y={-0.03} m={M.plain('#b5a083', { roughness: 1 })} />
        {/* forested ridges closing the valley: the hill the caves are cut into, then the higher spurs and a hazy far range */}
        <Massif p={[0, -0.5, -66]} r={30} h={24} sx={1.5} seed={3} lo="#4a6a3a" hi="#8a8b55" />
        <Massif p={[-52, -0.5, -40]} r={28} h={28} seed={7} lo="#3f5f35" hi="#7a8650" />
        <Massif p={[54, -0.5, -40]} r={28} h={28} seed={11} lo="#46683a" hi="#86884f" />
        <Massif p={[0, -0.5, -118]} r={50} h={58} sx={1.7} sz={0.55} seed={5} lo="#5d7a76" hi="#8fa3ac" />
        {Array.from({ length: 46 }, (_, k) => { const a = rnd(k + 9) * Math.PI * 2; const r = 14 + rnd(k + 4) * 22; if (Math.sin(a) > 0.1 && r < 24) return null; const x = Math.cos(a) * r; const z = Math.sin(a) * r; return <Tree key={k} p={[x, 0, z]} s={1.5 + rnd(k) * 1.3} kind={k % 5 ? 'broad' : 'pine'} />; })}
        {/* Halesi village stepping down the hillside: blue-roofed three-storey houses with window strips */}
        {village.map(([x, z, r, roof, wall, fl], k) => {
          const y = hillY(x, z, -52, -40, 28, 28) - 1.0;
          return (
            <group key={k} position={[x, y, z]} rotation={[0, r, 0]}>
              <Box s={[3.4, 3.4, 2.8]} p={[0, -1.4, 0]} m={M.plain('#8a8068', { roughness: 1 })} />
              <Box s={[3.2, fl * 1.5, 2.6]} p={[0, fl * 0.75 + 0.3, 0]} m={M.plain(wall, { roughness: 0.95 })} />
              {Array.from({ length: fl }, (_, s) => <Box key={s} s={[2.4, 0.5, 0.05]} p={[0, 0.9 + s * 1.5, 1.32]} m={M.plain('#3a4a5a')} cast={false} />)}
              <Roof w={3.8} d={3.2} h={0.9} y={fl * 1.5 + 0.3} m={M.plain(roof, { roughness: 0.45, metalness: 0.35 })} sag={1.0} lift={0} fascia={false} />
            </group>
          );
        })}
        {/* the red-and-gold Maratika Chimey Takten Choling monastery on the slope, three storeys with a gilded roof */}
        <group position={[42, hillY(42, -30, 54, -40, 28, 28) - 0.6, -30]} rotation={[0, -0.3, 0]}>
          <Box s={[7.4, 1.8, 5.6]} p={[0, 0, 0]} m={M.plain('#8a8068', { roughness: 1 })} />
          <Box s={[6.8, 2.2, 5.0]} p={[0, 1.8, 0]} m={M.plain('#c4472e', { roughness: 0.85 })} />
          <Box s={[7.2, 0.3, 5.4]} p={[0, 3.0, 0]} m={M.gold} />
          <Box s={[5.6, 1.9, 4.2]} p={[0, 4.1, 0]} m={M.plain('#c4472e', { roughness: 0.85 })} />
          {[-2, -0.7, 0.7, 2].map((x) => <group key={x}><Box s={[0.55, 0.8, 0.06]} p={[x, 1.8, 2.52]} m={M.plain('#2a2018')} cast={false} /><Box s={[0.55, 0.8, 0.06]} p={[x, 4.1, 2.12]} m={M.plain('#2a2018')} cast={false} /></group>)}
          <Roof w={6.6} d={5.2} h={1.1} y={5.05} m={M.plain('#b83d29', { roughness: 0.6, metalness: 0.2 })} sag={1.05} lift={0.02} />
          {[-2.4, 0, 2.4].map((x) => <Ball key={x} rad={0.22} p={[x, 5.0, 2.7]} m={M.gold} />)}
        </group>
        <PrayerFlags from={[-30, 12, -24]} to={[-8, 5, 6]} n={26} />
      </group>
    );
  }

  /* =====================================================================
     MAKWANPUR GADHI: roofless rubble-stone fort on a green ridge above terraced fields
     ===================================================================== */
  function MakwanMain() {
    const M = useM();
    const red = M.plain('#b33a30', { roughness: 0.75 });
    const iron = M.plain('#2b2c2e', { metalness: 0.6, roughness: 0.45 });
    const bronze = M.plain('#7a6a3a', { metalness: 0.7, roughness: 0.4 });
    const teal = M.plain('#3f7f86', { metalness: 0.4, roughness: 0.5 });
    const water = M.plain('#2c4a42', { roughness: 0.2 });
    const W = 22; const D = 14; const T = 1.3; const H = 4.2;
    const stoneEdge = '#cfc9be';
    return (
      <group>
        {/* the ridge-top platform: grass over stone */}
        <Box s={[W + 12, 0.5, D + 12]} p={[0, -0.25, 0]} m={M.plain('#8fae58', { roughness: 1 })} />
        {/* the rubble curtain wall on all four sides, thick and coursed, with the ragged battlements and loopholes */}
        <FortWall len={W + T} p={[0, 0, -D / 2]} seed={1} />
        <FortWall len={D + T} p={[-W / 2, 0, 0]} rot={Math.PI / 2} seed={5} />
        <FortWall len={D + T} p={[W / 2, 0, 0]} rot={Math.PI / 2} seed={9} />
        <FortWall len={W / 2 - 1.8} p={[-(W / 4 + 0.9), 0, D / 2]} seed={13} />
        <FortWall len={W / 2 - 1.8} p={[W / 4 + 0.9, 0, D / 2]} seed={17} />
        {/* square corner bastions, taller than the curtain */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
          <group key={i} position={[a * W / 2, 0, b * D / 2]}>
            <Stone s={[3.6, 5.4, 3.6]} p={[0, 2.7, 0]} c="#d3cec4" />
            {[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4], [0, -1.5], [0, 1.5], [-1.5, 0], [1.5, 0]].map(([x, z], j) => (rnd(i * 9 + j) < 0.25 ? null : <Stone key={j} s={[0.8, 0.6, 0.8]} p={[x, 5.7, z]} c="#d3cec4" />))}
          </group>
        ))}
        {/* the gate: stone lintel over a dark doorway, and the passage beyond */}
        <Stone s={[3.4, 1.2, T + 0.2]} p={[0, 3.6, D / 2]} c="#d9d4ca" />
        <Stone s={[3.6, 0.5, T + 0.5]} p={[0, 4.45, D / 2]} c={stoneEdge} />
        <Box s={[2.6, 3.0, 0.2]} p={[0, 1.5, D / 2 - 0.3]} m={M.plain('#120e0b', { roughness: 1 })} cast={false} />
        {/* the dry ditch around the fort: stone-lined, with dark water in the floor */}
        {[[0, -(D / 2 + 3.2), W + 9, 1.8], [-(W / 2 + 3.2), 0, 1.8, D + 7], [W / 2 + 3.2, 0, 1.8, D + 7], [-(W / 4 + 3.4), D / 2 + 3.2, W / 2 - 1.0, 1.8], [W / 4 + 3.4, D / 2 + 3.2, W / 2 - 1.0, 1.8]].map(([x, z, w, d], k) => (
          <group key={k} position={[x, 0, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} material={water}><planeGeometry args={[w, d]} /></mesh>
            <Stone s={[w + 0.8, 0.28, 0.4]} p={[0, 0.14, d / 2 + 0.2]} c={stoneEdge} cast={false} />
            <Stone s={[w + 0.8, 0.28, 0.4]} p={[0, 0.14, -d / 2 - 0.2]} c={stoneEdge} cast={false} />
          </group>
        ))}
        {/* the stone approach stairs with teal steel railings, descending from the gate */}
        {Array.from({ length: 11 }, (_, k) => <Stone key={k} s={[2.8, 1.8, 0.62]} p={[0, -0.18 * k - 0.1 + 0.0 - 0.8, D / 2 + 1.0 + k * 0.62]} c="#cfc9be" cast={false} />)}
        {[-1.6, 1.6].map((x) => (
          <group key={x}>
            {Array.from({ length: 6 }, (_, k) => <Cyl key={k} rt={0.04} h={1.0} p={[x, 0.45 - 0.37 * k, D / 2 + 1.2 + k * 1.2]} m={teal} seg={5} />)}
            <Box s={[0.07, 0.07, 7.6]} p={[x, 0.9 - 0.9, D / 2 + 4.8]} r={[0.28, 0, 0]} m={teal} cast={false} />
            <Box s={[0.07, 0.07, 7.6]} p={[x, 0.55 - 0.9, D / 2 + 4.8]} r={[0.28, 0, 0]} m={teal} cast={false} />
          </group>
        ))}
        {/* low crumbled walls of the Sen palace rooms inside */}
        {[[-5, -2.4, 6, 0.8, 0], [-5, 1.6, 4, 0.8, 0], [-7.6, -0.4, 4, 0.8, Math.PI / 2], [-2.6, -0.4, 4, 0.8, Math.PI / 2], [6, -3.4, 5, 0.8, 0]].map(([x, z, l, t, r], k) => <Stone key={k} s={[l, 0.7 + rnd(k) * 0.9, t]} p={[x, 0.45 + rnd(k) * 0.3, z]} r={[0, r, 0]} c="#cdc8bd" />)}
        {/* Kali Top: the old cannon on spoked wheels under a red-posted tin shelter, iron balls beside it */}
        <group position={[5.2, 0, 2.2]}>
          {[[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.08} h={2.6} p={[x, 1.3, z]} m={red} seg={6} />)}
          <Box s={[3.6, 0.1, 2.9]} p={[0, 2.65, 0]} r={[0.08, 0, 0]} m={M.plain('#8f9298', { metalness: 0.5, roughness: 0.55 })} />
          <Box s={[3.2, 0.08, 0.1]} p={[0, 2.5, 1.15]} m={red} cast={false} />
          <Wheel p={[-0.8, 0.55, 0]} r={0.55} m={iron} />
          <Wheel p={[0.8, 0.55, 0]} r={0.55} m={iron} />
          <Cyl rt={0.07} h={1.7} p={[0, 0.55, 0]} r={[0, 0, Math.PI / 2]} m={iron} seg={8} />
          <Box s={[0.9, 0.3, 1.5]} p={[0, 0.8, -0.1]} m={iron} />
          <Cyl rt={0.18} rb={0.27} h={2.2} p={[0, 1.0, 0.1]} r={[Math.PI / 2 - 0.18, 0, 0]} m={iron} seg={12} />
          <Cyl rt={0.2} rb={0.2} h={0.12} p={[0, 1.4, 1.2]} r={[Math.PI / 2 - 0.18, 0, 0]} m={bronze} seg={12} />
          {[[1.7, 0.2, 0.9], [2.0, 0.2, 0.5], [1.85, 0.5, 0.7]].map(([x, y, z], k) => <Ball key={k} rad={0.16} p={[x, y, z]} m={iron} />)}
        </group>
        {/* a second bronze cannon laid on the rampart */}
        <group position={[-W / 2 + 0.3, H, 2.4]} rotation={[0, 0.9, 0]}>
          <Cyl rt={0.13} rb={0.2} h={1.9} p={[0, 0.3, 0]} r={[0, 0, Math.PI / 2]} m={iron} seg={10} />
          <Ball rad={0.17} p={[0.95, 0.3, 0]} m={bronze} />
        </group>
        <Frame s={[30, 6.4, 20]} p={[0, 2.8, 2]} />
      </group>
    );
  }
  function MakwanEnv() {
    const M = useM();
    const mist = <meshBasicMaterial color="#e9eef0" transparent opacity={0.26} depthWrite={false} />;
    return (
      <group>
        <GroundDisc r={130} y={-17} m={M.plain('#8c9a68', { roughness: 1 })} />
        {/* the ridge top and terraced maize fields falling away below it */}
        {[0, 1, 2, 3, 4, 5].map((k) => <mesh key={k} position={[0, -1.5 - k * 2.5, 0]} receiveShadow material={M.plain(k % 2 ? '#bcc069' : '#86ad52', { roughness: 1 })}><cylinderGeometry args={[27 + k * 5, 29 + k * 5, 2.5, 56]} /></mesh>)}
        {/* tall slim trees (pine, eucalyptus and sal) crowding the slope along the approach and behind */}
        {Array.from({ length: 34 }, (_, k) => { const a = rnd(k + 2) * Math.PI * 2; const r = 24 + rnd(k) * 12; const x = Math.cos(a) * r; const z = Math.sin(a) * r; const y = -1.2 - Math.max(0, r - 26) * 0.35; if (z > 8 && Math.abs(x) < 9) return null; return <Tree key={k} p={[x, y, z]} s={2.2 + rnd(k) * 1.6} kind={k % 3 ? 'pine' : 'broad'} />; })}
        {/* drifting mist banks over the slope */}
        {[-3.5, -8, -13].map((y, k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}><circleGeometry args={[60 - k * 8, 48]} />{mist}</mesh>)}
        {/* forested ridges beyond the reach of the camera, paler with distance */}
        <Massif p={[-84, -17, -62]} r={44} h={48} seed={2} lo="#4f7050" hi="#8a9a68" />
        <Massif p={[70, -17, -80]} r={46} h={52} seed={6} lo="#567a58" hi="#8fa270" />
        <Massif p={[0, -17, -128]} r={62} h={70} sx={1.6} sz={0.6} seed={9} lo="#6f8d92" hi="#a8bcc4" />
        <Massif p={[88, -17, 34]} r={34} h={30} seed={4} lo="#587a55" hi="#8da06a" />
      </group>
    );
  }

  /* =====================================================================
     UPARDANG GADHI (Chitwan): low dark-stone walls outlining rooms on a dry grassy hilltop
     ===================================================================== */
  function UpardangMain() {
    const M = useM();
    const dry = M.plain('#c9ad62', { roughness: 1 });
    const wood = M.plain('#4a3a2c', { roughness: 0.8 });
    const woodL = M.plain('#8a7358', { roughness: 0.85 });
    const dk = M.plain('#14100d', { roughness: 1 });
    const W = 26; const D = 17;
    const sc = '#d2cdc2';
    return (
      <group>
        <Box s={[W + 8, 0.4, D + 8]} p={[0, -0.2, 0]} m={dry} />
        {/* patches of greener grass among the dry */}
        {[[-8, 5, 6], [9, -3, 5], [2, 6, 4]].map(([x, z, r], k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]} material={M.plain('#aab36a', { roughness: 1 })}><circleGeometry args={[r, 20]} /></mesh>)}
        {/* the long outer rampart wall on the far and side edges: coursed rubble with a flat parapet top */}
        <FortWall len={W} h={2.6} t={1.0} p={[0, 0, -D / 2]} seed={2} merlons={false} loops={false} c={sc} />
        <FortWall len={D} h={2.2} t={1.0} p={[-W / 2, 0, 0]} rot={Math.PI / 2} seed={4} merlons={false} loops={false} c={sc} />
        <FortWall len={D} h={2.2} t={1.0} p={[W / 2, 0, 0]} rot={Math.PI / 2} seed={6} merlons={false} loops={false} c={sc} />
        <FortWall len={9} h={1.7} t={0.9} p={[-W / 2 + 4.5, 0, D / 2]} seed={8} merlons={false} loops={false} c={sc} />
        <FortWall len={9} h={1.7} t={0.9} p={[W / 2 - 4.5, 0, D / 2]} seed={10} merlons={false} loops={false} c={sc} />
        {/* stepped terrace platforms rising toward the back, each a flat stone-faced step */}
        {[0, 1, 2].map((k) => <Stone key={k} s={[17 - k * 2.4, 0.55 + k * 0.45, 3.2 - k * 0.3]} p={[1.5, (0.55 + k * 0.45) / 2 + 0, -D / 2 + 2.6 + k * 0.0 + (2 - k) * 0.0 + k * 0.0]} c={sc} k={0.7} />)}
        {/* the standing gate-house: a stone block with a carved lintel over a wooden-framed door, flat stepped roof */}
        <group position={[-3.0, 0, 0.5]}>
          <Stone s={[4.6, 3.3, 2.4]} p={[0, 1.65, 0]} c={sc} />
          <Stone s={[1.6, 0.5, 2.5]} p={[-1.7, 3.55, 0]} c={sc} />
          <Stone s={[1.4, 0.35, 2.5]} p={[1.6, 3.45, 0]} c={sc} />
          <Box s={[1.2, 2.2, 0.16]} p={[0, 1.2, 1.2]} m={dk} cast={false} />
          <Box s={[1.5, 0.22, 0.28]} p={[0, 2.4, 1.24]} m={woodL} />
          <Box s={[0.18, 2.3, 0.26]} p={[-0.7, 1.2, 1.24]} m={wood} />
          <Box s={[0.18, 2.3, 0.26]} p={[0.7, 1.2, 1.24]} m={wood} />
          <Box s={[1.8, 0.5, 0.2]} p={[0, 2.78, 1.28]} m={woodL} />
          <Box s={[1.2, 1.9, 0.12]} p={[0, 1.1, 0.7]} m={wood} />
        </group>
        {/* footings of the royal rooms: low rubble outlines, a long weapon house and a two-room house */}
        {[[-8, 0, 6, 4.4], [5.5, 2.5, 4.6, 3.6], [7.5, -3.2, 5.6, 3.4]].map(([x, z, w, d], k) => (
          <group key={k} position={[x, 0, z]}>
            {[[0, d / 2, w, 0.7], [0, -d / 2, w, 0.7]].map(([a, b, ww, dd], j) => <Stone key={j} s={[ww, 0.8 + rnd(k * 5 + j) * 0.6, dd]} p={[a, 0.5 + rnd(k * 5 + j) * 0.2, b]} c={sc} k={0.8} />)}
            {[[w / 2, 0, 0.7, d], [-w / 2, 0, 0.7, d]].map(([a, b, ww, dd], j) => <Stone key={`s${j}`} s={[ww, 0.6 + rnd(k * 7 + j) * 0.7, dd]} p={[a, 0.4, b]} c={sc} k={0.8} />)}
            {k === 0 && <Stone s={[0.7, 0.7, d - 0.7]} p={[0, 0.35, 0]} c={sc} k={0.8} />}
          </group>
        ))}
        {/* the entry path of flat stones */}
        {Array.from({ length: 6 }, (_, k) => <Stone key={`p${k}`} s={[2.2 - (k % 2) * 0.3, 0.12, 1.1]} p={[0.4 * Math.sin(k), 0.06, D / 2 + 0.3 + k * 1.1]} c="#e0dbd0" k={0.6} cast={false} />)}
        <Frame s={[30, 4.2, 22]} p={[0, 1.6, 0]} />
      </group>
    );
  }
  function UpardangEnv() {
    const M = useM();
    const dryG = ['#c9ad62', '#bba055', '#d4b96d'];
    return (
      <group>
        <GroundDisc r={140} y={-17} m={M.plain('#8a9a70', { roughness: 1 })} />
        {/* the hilltop knoll: dry golden grass over the summit, steep green flanks below */}
        <mesh position={[0, -1.3, 0]} material={M.plain('#c9ad62', { roughness: 1 })} receiveShadow><cylinderGeometry args={[24, 29, 2.2, 40]} /></mesh>
        <Massif p={[0, -17, 0]} r={50} h={16.4} seed={8} lo="#6d8a4a" hi="#b9a65c" />
        {Array.from({ length: 5 }, (_, k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[Math.cos(k * 1.9) * 13, -0.02, Math.sin(k * 2.3) * 7]} material={M.plain(dryG[k % 3], { roughness: 1 })}><circleGeometry args={[7, 18]} /></mesh>)}
        {Array.from({ length: 12 }, (_, k) => { const a = rnd(k + 20) * Math.PI * 2; const r = 33 + rnd(k) * 6; return <Tree key={k} p={[Math.cos(a) * r, -5, Math.sin(a) * r]} s={1.6 + rnd(k) * 0.9} kind="pine" />; })}
        {/* the Chitwan valley's forested ridges rolling away behind, paler with distance, and a far hazy range */}
        <Massif p={[-62, -17, -70]} r={42} h={52} seed={3} lo="#42624a" hi="#7f9a76" />
        <Massif p={[22, -17, -84]} r={48} h={58} seed={7} lo="#4a6b52" hi="#86a07c" />
        <Massif p={[96, -17, -40]} r={40} h={44} seed={5} lo="#4a6b52" hi="#86a07c" />
        <Massif p={[-10, -17, -140]} r={70} h={78} sx={1.7} sz={0.6} seed={12} lo="#6d8c92" hi="#aebfc7" snow={0.8} />
        <Massif p={[-96, -17, 20]} r={36} h={34} seed={9} lo="#4d6e52" hi="#86a07c" />
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
    const maroon = M.plain('#6a2a26', { roughness: 0.9 });
    const blue = M.plain('#2d6fb5', { roughness: 0.75 });
    const white = M.plain('#f4f2ec', { roughness: 0.9 });
    const dark = M.plain('#2a1d1a');
    const slate = M.plain('#b7bcc4', { roughness: 0.7 });
    const steel = M.plain('#a9aeb4', { metalness: 0.6, roughness: 0.4 });
    const post = M.plain('#a8332b', { roughness: 0.6, metalness: 0.3 });
    const green = M.plain('#2f8f4c', { roughness: 0.7 });
    const tile = M.mat('stone', 5, 4, { color: '#f1ece0', roughness: 0.8 });
    const bedRock = M.mat('rock', 3, 1, { color: '#7d776e', roughness: 1 });
    const roofM = M.plain('#222228', { roughness: 0.65, metalness: 0.2 });
    const xs = Array.from({ length: 8 }, (_, k) => -9.8 + k * 2.8);
    return (
      <group>
        <Box s={[28, 0.2, 17]} p={[0, 0.1, -0.5]} m={M.plain('#cfc3aa', { roughness: 1 })} />
        {/* the painted front wall: red plinth, yellow band with the blue 'Sitaram' lettering, blue trim, yellow wall posts */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 7.3, 0.2, 5]}>
            <Box s={[11.4, 0.75, 0.5]} p={[0, 0.375, 0]} m={red} />
            <Box s={[11.4, 0.08, 0.56]} p={[0, 0.79, 0]} m={blue} />
            <Box s={[11.4, 1.1, 0.5]} p={[0, 1.38, 0]} m={yellow} />
            <Box s={[11.5, 0.1, 0.62]} p={[0, 1.98, 0]} m={blue} />
            <Sign text="सीताराम" w={4.6} h={0.95} p={[0, 1.38, 0.255]} bg="#f2c230" fg="#2a5fb0" font={0.72} />
            {[-5.5, -2.8, 2.8, 5.5].map((x) => <group key={x}><Box s={[0.32, 2.0, 0.6]} p={[x, 1.0, 0]} m={yellow} /><Box s={[0.42, 0.14, 0.7]} p={[x, 2.06, 0]} m={red} /></group>)}
          </group>
        ))}
        {/* the gateway: red plinth, yellow tower with a lettered blue band, arched opening, tiny four-post chhatri with a gilded dome */}
        <group position={[0, 0.2, 5]}>
          <Box s={[3.6, 0.6, 1.5]} p={[0, 0.3, 0]} m={red} />
          <Box s={[3.4, 2.9, 1.3]} p={[0, 2.05, 0]} m={yellow} />
          <Box s={[3.6, 0.14, 1.5]} p={[0, 3.55, 0]} m={blue} />
          <Box s={[3.5, 0.22, 1.4]} p={[0, 0.7, 0]} m={blue} />
          <Arch w={1.5} h={2.2} p={[0, 0.6, 0.66]} m={dark} pt={0.25} />
          <Arch w={1.9} h={2.5} p={[0, 0.6, 0.655]} m={red} pt={0.3} />
          <Sign text="धनुषाधाम" w={2.5} h={0.52} p={[0, 3.25, 0.66]} bg="#2d6fb5" fg="#f6e7a0" font={0.7} />
          <Sign text="स्वा|ग|त|म्" w={0.5} h={2.4} p={[1.95, 1.9, 0.62]} bg="#f2c230" fg="#2a5fb0" font={0.7} />
          <Sign text="स्वा|ग|त|म्" w={0.5} h={2.4} p={[-1.95, 1.9, 0.62]} bg="#f2c230" fg="#2a5fb0" font={0.7} />
          <Box s={[2.2, 0.22, 1.1]} p={[0, 3.77, 0]} m={yellow} />
          {[[-0.8, 0.4], [0.8, 0.4], [-0.8, -0.4], [0.8, -0.4]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.07} h={0.75} p={[x, 4.25, z]} m={red} seg={8} />)}
          <Box s={[2.0, 0.12, 1.2]} p={[0, 4.68, 0]} m={yellow} />
          <Dome r={0.62} h={0.66} p={[0, 4.74, 0]} m={M.plain('#e0a423', { roughness: 0.5, metalness: 0.3 })} />
          {[[-1.6, 0.5], [1.6, 0.5], [-1.6, -0.5], [1.6, -0.5]].map(([x, z]) => <group key={`f${x}${z}`} position={[x, 3.62, z]}><Cyl rt={0.08} rb={0.12} h={0.4} p={[0, 0.2, 0]} m={yellow} seg={8} /><Ball rad={0.1} p={[0, 0.46, 0]} m={M.gold} /></group>)}
          <Cyl rt={0.24} rb={0.28} h={0.7} p={[2.5, 0.35, 0.9]} m={green} seg={12} />
        </group>

        {/* the long shed behind the wall: maroon plinth, white wall with louvred slits, red steel posts on green drums, black roof */}
        <Box s={[24, 0.8, 0.5]} p={[0, 0.6, -6.2]} m={maroon} />
        <Box s={[24, 1.7, 0.5]} p={[0, 1.85, -6.2]} m={white} />
        {[-1, 1].map((k) => <group key={k} position={[k * 11.75, 0, 0]}><Box s={[0.5, 0.8, 11.2]} p={[0, 0.6, -0.6]} m={maroon} /><Box s={[0.5, 1.7, 11.2]} p={[0, 1.85, -0.6]} m={white} /></group>)}
        {Array.from({ length: 14 }, (_, k) => <group key={k}><Box s={[1.2, 0.3, 0.05]} p={[-9.9 + k * 1.52, 2.2, -5.93]} m={slate} cast={false} /><Box s={[1.2, 0.3, 0.05]} p={[-9.9 + k * 1.52, 2.2, -6.47]} m={slate} cast={false} /></group>)}
        <Box s={[24, 0.12, 0.6]} p={[0, 2.76, -6.2]} m={dark} />
        {/* aisle roofs on either side of the open sacred strip, with a deep black fascia */}
        <Box s={[24.6, 0.12, 4.9]} p={[0, 3.05, -4.0]} r={[0.1, 0, 0]} m={roofM} />
        <Box s={[24.6, 0.16, 0.14]} p={[0, 2.68, -6.45]} m={dark} />
        <Box s={[24.6, 0.12, 3.6]} p={[0, 3.3, 3.0]} r={[-0.1, 0, 0]} m={roofM} />
        {/* tiled floor and aisle posts */}
        <Box s={[23.4, 0.06, 11]} p={[0, 0.23, -0.7]} m={tile} cast={false} />
        {xs.map((x) => (
          <group key={x}>
            <Cyl rt={0.07} h={2.9} p={[x, 1.65, -1.9]} m={post} seg={8} />
            <Cyl rt={0.26} rb={0.28} h={0.55} p={[x, 0.5, -1.9]} m={green} seg={12} />
            <Cyl rt={0.07} h={3.1} p={[x, 1.75, 1.8]} m={post} seg={8} />
            <Cyl rt={0.26} rb={0.28} h={0.55} p={[x, 0.5, 1.8]} m={green} seg={12} />
          </group>
        ))}
        {/* the sacred strip: a red-curbed bed holding the grey 'bow' stone outcrops, railed in steel */}
        <group position={[-1.6, 0.26, -0.05]}>
          <Box s={[18, 0.16, 3.1]} p={[0, 0.0, 0]} m={maroon} />
          <Box s={[17.6, 0.2, 2.7]} p={[0, 0.06, 0]} m={M.plain('#6f675c', { roughness: 1 })} />
          {[[-7.4, 0.3, 4], [-5.2, -0.2, 9], [-3.1, 0.2, 14], [-0.9, -0.3, 22], [1.4, 0.2, 5], [3.6, -0.1, 11], [5.6, 0.3, 17], [7.6, -0.2, 26]].map(([x, z, sd], i) => (
            <Rocks key={i} p={[x, 0.22, z]} s={0.62 + 0.14 * (i % 3)} seed={sd} m={bedRock} sc={[1.7, 0.38, 0.95]} />
          ))}
          <Rail a={[-8.6, 1.9]} b={[8.6, 1.9]} y={0.1} h={0.9} m={steel} n={12} />
          <Rail a={[-8.6, -1.9]} b={[8.6, -1.9]} y={0.1} h={0.9} m={steel} n={12} />
        </group>
        {/* the great peepal at the head of the strip: buttressed trunk wrapped in red cloth, spreading canopy over the shed */}
        <group position={[8.8, 0.26, -0.1]}>
          <Cyl rt={0.75} rb={1.35} h={3.6} p={[0, 1.8, 0]} m={M.plain('#6a5a48', { roughness: 1 })} seg={10} />
          {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[0.3, 1.3, 1.6]} p={[Math.cos(i * 1.26) * 1.2, 0.55, Math.sin(i * 1.26) * 1.2]} r={[0, -i * 1.26, 0]} m={M.plain('#6a5a48', { roughness: 1 })} />)}
          <Cyl rt={0.8} rb={0.8} h={0.7} p={[0, 1.3, 0]} m={M.plain('#c0332c', { roughness: 0.9 })} seg={12} />
          {[[0, 4.3, 0, 0.8], [-2.6, 3.95, 0.5, 0.65], [2.6, 3.95, -0.5, 0.65]].map(([x, y, z, k], i) => <Cyl key={i} rt={0.24 * k} rb={0.34 * k} h={2.2} p={[x * 0.5, y - 0.6, z * 0.5]} r={[0, 0, x * 0.15]} m={M.plain('#6a5a48', { roughness: 1 })} seg={8} />)}
          {[[0, 5.6, 0, 3.8], [-3.6, 5.0, 0.8, 3.0], [3.6, 5.1, -0.6, 3.1], [0.8, 6.8, -1.6, 2.7], [-1.6, 5.9, -3.2, 2.6], [1.8, 5.8, 3.2, 2.5], [-4.8, 5.4, -1.6, 2.2]].map(([x, y, z, r], i) => <Ball key={i} rad={r} sc={[1, 0.55, 1]} p={[x, y, z]} m={M.plain(i % 2 ? '#4f7a3a' : '#628c44', { roughness: 1 })} />)}
        </group>
        <Frame s={[27, 9, 17]} p={[0, 4.0, -0.5]} />
      </group>
    );
  }
  function DhanushaEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={110} y={-0.05} m={M.plain('#9ab364', { roughness: 1 })} />
        <GroundDisc r={26} y={-0.02} m={M.plain('#cdbf9f', { roughness: 1 })} />
        {/* concrete forecourt, a village lane and a sloping power pole line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 11.5]} material={M.plain('#bdb5a6', { roughness: 0.95 })}><planeGeometry args={[34, 9]} /></mesh>
        {[[-12, 16, 0.1], [14, 16, -0.2], [-26, -4, 0.3]].map(([x, z], k) => <group key={k} position={[x, 0, z]}><Box s={[0.14, 6, 0.14]} p={[0, 3, 0]} m={M.dark} /><Box s={[1.6, 0.06, 0.06]} p={[0, 5.8, 0]} m={M.dark} /></group>)}
        <Town n={14} r0={50} r1={62} a0={0.05} a1={Math.PI * 2 - 0.05} seed={31} hMin={2.4} hMax={5.4} roof="#9a7a62" />
        {/* paddy and wheat fields, mango trees and palms between the village houses */}
        {[[-30, -20, '#8fb455'], [28, -22, '#cdbf55'], [-34, 16, '#cdbf55'], [34, 12, '#8fb455'], [0, -34, '#a3c25e']].map(([x, z, c], k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]} material={M.plain(c, { roughness: 1 })}><planeGeometry args={[18, 12]} /></mesh>)}
        {Array.from({ length: 16 }, (_, k) => { const a = k * 0.4 + 0.2; const r = 28 + (k % 3) * 5; const x = Math.cos(a) * r; const z = Math.sin(a) * r; return z > 8 && Math.abs(x) < 20 ? null : <Tree key={k} p={[x, 0, z]} s={1.5 + rnd(k) * 0.8} />; })}
        {Array.from({ length: 8 }, (_, k) => <Palm key={`p${k}`} p={[-24 + k * 7, 0, -26 - rnd(k) * 6]} s={1.2} />)}
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
    const greyW = M.plain('#d6d2c8', { roughness: 0.9 });
    const redB = M.plain('#a8433a', { roughness: 0.75 });
    const dark = M.plain('#2c211e');
    const brick = M.mat('brick', 3, 3, { color: '#f4cbb0' });
    const brickOld = M.mat('brick', 2, 3, { color: '#e0ac8c' });
    const darkStone = M.plain('#3c3d41', { roughness: 0.85 });
    const r0 = 1.45; const sh = 5.2; const y0 = 0.5;
    const baseTop = y0 + 3.0 + 0.3;
    const prof = (t) => r0 * (1 - t ** 1.7) * (1 + 0.08 * Math.sin(t * Math.PI));
    return (
      <group>
        <Box s={[26, 0.2, 22]} p={[0, 0.1, 0]} m={M.plain('#c8b296', { roughness: 1 })} />
        {/* brick-paved court around the shrine */}
        <Box s={[16, 0.1, 15]} p={[0, 0.22, 1]} m={M.mat('brick', 8, 8, { color: '#e6c4aa' })} cast={false} />
        {/* the Ranivas: a modest white shikhara on a plain plinth, porch and door on the front */}
        <Box s={[6.2, 0.5, 6.2]} p={[0, 0.45, 0]} m={white} />
        <Box s={[6.4, 0.1, 6.4]} p={[0, 0.74, 0]} m={redB} />
        {Array.from({ length: 5 }, (_, k) => <Box key={`s${k}`} s={[2.2, 0.1 * (k + 1), 0.34]} p={[0, 0.2 + 0.05 * (k + 1), 3.55 + (4 - k) * 0.3]} m={white} />)}
        <group position={[0, y0 + 0.3, 0]}>
          <Box s={[3.8, 3.0, 3.8]} p={[0, 1.5, 0]} m={white} />
          {[0.9, 3.0].map((y) => <Box key={y} s={[3.95, 0.12, 3.95]} p={[0, y, 0]} m={y > 2 ? redB : greyW} />)}
          {/* front porch with an arched door */}
          <Box s={[2.3, 2.3, 1.2]} p={[0, 1.15, 2.4]} m={white} />
          <Box s={[2.5, 0.12, 1.4]} p={[0, 2.35, 2.4]} m={redB} />
          <Arch w={1.1} h={1.7} p={[0, 0, 3.01]} m={dark} pt={0.2} />
          {/* other three faces: a blind arched niche and a small window */}
          {[1, 2, 3].map((q) => <group key={q} rotation={[0, q * Math.PI / 2, 0]}><Arch w={0.9} h={1.5} p={[0, 0.5, 1.91]} m={greyW} pt={0.15} /><Arch w={0.6} h={1.2} p={[0, 0.55, 1.915]} m={dark} pt={0.12} /></group>)}
          {/* small corner shikharas and mid-face urushringa, as on the real tower */}
          {[[-1.75, -1.75], [1.75, -1.75], [-1.75, 1.75], [1.75, 1.75]].map(([x, z]) => <group key={`${x}${z}`}><Box s={[0.7, 0.4, 0.7]} p={[x, 3.2, z]} m={white} /><Spire r0={0.42} h={1.7} x={x} z={z} y={3.4} m={white} /><Ball rad={0.08} p={[x, 5.15, z]} m={M.gold} /></group>)}
          {[0, 1, 2, 3].map((q) => <group key={`u${q}`} rotation={[0, q * Math.PI / 2, 0]}><Box s={[0.8, 0.3, 0.5]} p={[0, 3.15, 1.55]} m={white} /><Spire r0={0.36} h={1.9} x={0} z={1.35} y={3.25} m={white} /></group>)}
          {/* the main spire with fine ribbing bands */}
          <Box s={[2.9, 0.5, 2.9]} p={[0, 3.3, 0]} m={white} />
          <Spire r0={r0} h={sh} y={3.55} m={white} />
          {[0.1, 0.22, 0.34, 0.46, 0.58, 0.7].map((t) => <mesh key={t} position={[0, 3.55 + t * sh, 0]} rotation={[0, Math.PI / 4, 0]} material={greyW}><cylinderGeometry args={[prof(t) + 0.035, prof(t - 0.04) + 0.035, 0.07, 4]} /></mesh>)}
          {[0.28, 0.52].map((t) => <mesh key={`r${t}`} position={[0, 3.55 + t * sh, 0]} rotation={[0, Math.PI / 4, 0]} material={redB}><cylinderGeometry args={[prof(t) + 0.04, prof(t - 0.03) + 0.04, 0.11, 4]} /></mesh>)}
          <Cyl rt={0.05} h={0.9} p={[0, 3.55 + sh + 0.5, 0]} m={M.gold} seg={6} />
          <Ball rad={0.16} p={[0, 3.55 + sh + 0.25, 0]} m={M.gold} />
          {[-0.2, 0, 0.2].map((x) => <mesh key={x} position={[x, 3.55 + sh + (x ? 1.05 : 1.2), 0]} material={M.gold}><coneGeometry args={[0.04, x ? 0.3 : 0.46, 5]} /></mesh>)}
        </group>

        {/* the old palace ruin: tall pink-brick wall with window openings and a broken top, a pointed-arch gate */}
        <group position={[-10.5, 0.2, -3]} rotation={[0, 0.35, 0]}>
          <Box s={[7, 5.2, 1.2]} p={[0, 2.6, 0]} m={brick} />
          <Box s={[2.8, 1.4, 1.2]} p={[-2.1, 5.9, 0]} m={brick} />
          <Box s={[1.6, 0.8, 1.2]} p={[2.4, 5.6, 0]} m={brickOld} />
          {[-2.2, 0.4, 2.6].map((x, i) => <group key={x}><Arch w={0.9} h={1.5} p={[x, 2.4, 0.61]} m={dark} pt={0.2} /><Arch w={0.9} h={1.5} p={[x, 2.4, -0.61]} m={dark} pt={0.2} /></group>)}
          <Box s={[7.2, 0.14, 1.4]} p={[0, 1.2, 0]} m={M.plain('#e0c8b0')} cast={false} />
        </group>
        <group position={[9.5, 0.2, -6.5]} rotation={[0, -0.3, 0]}>
          <Box s={[1.8, 5.2, 1.6]} p={[-3.2, 2.6, 0]} m={brickOld} />
          <Box s={[1.8, 3.6, 1.6]} p={[3.2, 1.8, 0]} m={brickOld} />
          <Box s={[2.6, 1.3, 1.6]} p={[-2.4, 5.55, 0]} m={brick} />
          <Box s={[4.6, 0.7, 1.6]} p={[0.2, 3.4, 0]} m={brick} r={[0, 0, 0.0]} />
          <Arch w={4.4} h={3.2} p={[0, 0, 0.81]} m={dark} pt={0.9} />
          <Arch w={4.4} h={3.2} p={[0, 0, -0.81]} m={dark} pt={0.9} />
        </group>
        {/* scattered fallen brick */}
        {[[-4.5, 7.2], [5.6, 6.0], [-7.2, 3.4], [7.8, 1.0], [3.4, -7.5], [-2.2, -8.0]].map(([x, z], i) => <Box key={`fb${i}`} s={[0.7 + (i % 3) * 0.3, 0.3, 0.5]} p={[x, 0.3, z]} r={[0, i * 0.9, 0.1 * i]} m={brickOld} />)}

        {/* the old stone pillar: tapering dark octagonal shaft on a carved base, and the inscribed slab */}
        <group position={[-8.2, 0.2, 7]}>
          <Box s={[1.1, 0.5, 1.1]} p={[0, 0.25, 0]} m={darkStone} />
          <Cyl rt={0.24} rb={0.36} h={5.2} p={[0, 3.1, 0]} m={darkStone} seg={8} />
          <Cyl rt={0.3} rb={0.28} h={0.4} p={[0, 5.85, 0]} m={darkStone} seg={8} />
          <Cyl rt={0.4} rb={0.38} h={0.18} p={[0, 0.7, 0]} m={darkStone} seg={8} />
          <Cyl rt={0.28} rb={0.4} h={0.8} p={[0, 1.1, 0]} m={M.plain('#505156', { roughness: 0.8 })} seg={8} />
        </group>
        <group position={[7.4, 0.2, 7.4]} rotation={[0, -0.5, 0]}>
          <Box s={[1.6, 0.5, 0.7]} p={[0, 0.25, 0]} m={darkStone} />
          <Box s={[1.5, 1.2, 0.18]} p={[0, 1.1, 0]} r={[-0.12, 0, 0]} m={darkStone} />
          <Sign text="श्रीमन्नान्यदेव|नृपतिः" w={1.34} h={1.0} p={[0, 1.1, 0.1]} r={0} bg="#46484c" fg="#c9c8c0" weight={500} font={0.28} />
        </group>
        <Frame s={[24, 11, 18]} p={[0, 5.0, -1]} />
      </group>
    );
  }
  function SimraunEnv() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={110} y={-0.05} m={M.plain('#a9b46c', { roughness: 1 })} />
        <GroundDisc r={26} y={-0.02} m={M.plain('#cfae8c', { roughness: 1 })} />
        {/* the old earthen rampart and ditch that ringed the city, now a low grassy bank */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} scale={[1, 1, 0.5]} material={M.plain('#8fa45a', { roughness: 1 })}><torusGeometry args={[46, 3, 6, 56]} /></mesh>
        {/* Jharokhar Pokhari, the great medieval pond, with an earthen bank and green edge */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, -0.03, 38]} material={M.plain('#bfb28a', { roughness: 1 })}><planeGeometry args={[96, 36]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6, -0.02, 38]}><planeGeometry args={[88, 29]} /><meshStandardMaterial color="#7d9a7c" metalness={0.25} roughness={0.2} /></mesh>
        {/* village fields, mango and neem trees, some bare */}
        {[[-34, -16, '#c8bd57'], [34, -18, '#86ad4c'], [-38, 8, '#86ad4c'], [36, 12, '#c8bd57']].map(([x, z, c], k) => <mesh key={`f${k}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, z]} material={M.plain(c, { roughness: 1 })}><planeGeometry args={[18, 12]} /></mesh>)}
        {Array.from({ length: 22 }, (_, k) => { const a = k * 0.62; const r = 30 + rnd(k) * 12; const x = Math.cos(a) * r; const z = -Math.abs(Math.sin(a)) * 34 + 8; return z > 18 ? null : <Tree key={`t${k}`} p={[x, 0, z]} s={1.6 + rnd(k) * 0.9} />; })}
        {[[-18, 14], [20, 12], [26, 2]].map(([x, z], k) => <group key={`bt${k}`} position={[x, 0, z]} scale={1.0 + k * 0.15}><Cyl rt={0.12} rb={0.2} h={2.6} p={[0, 1.3, 0]} m={M.plain('#5a4a3c', { roughness: 1 })} seg={7} />{[-0.5, 0.4, 0].map((a, i) => <Cyl key={i} rt={0.03} rb={0.07} h={1.6} p={[a * 0.9, 3.0, i * 0.2 - 0.1]} r={[0, 0, a]} m={M.plain('#5a4a3c', { roughness: 1 })} seg={5} />)}</group>)}
        <Town n={12} r0={54} r1={64} a0={Math.PI + 0.2} a1={Math.PI * 2 - 0.2} seed={61} hMin={2.4} hMax={5} />
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
