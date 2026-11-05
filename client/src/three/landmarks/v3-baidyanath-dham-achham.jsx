// Baidyanath Dham, Achham (Sanfebagar, Sudurpashchim). Small rural Shiva shrine: squat grey-white stone cella under TWO wide dark
// metal-sheet roofs, short dark neck, gold gajur. White Nandi on inscribed pedestal, trident on white plinth, bell fence, red-roofed
// pavilions, cobbled lawn compound, forested hills and a stream confluence behind. 1 unit = 1 m. Front faces +z.
// Proportions (est. from the three photographs): lower eave width W = 6.6, total height about 1.4 W.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Tree, THREE, useMemo, useRef, useEffect, useState } = K;

  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  const B = 0.2; // top of the very low apron

  function useMats() {
    const M = useM();
    return {
      M,
      stone: M.plain('#d9d6cd', { roughness: 0.95 }),
      stoneDk: M.plain('#aaa79e', { roughness: 0.95 }),
      quoin: M.plain('#efede6', { roughness: 0.95 }),
      metal: M.plain('#4f4c47', { roughness: 0.45, metalness: 0.45 }),
      metalRib: M.plain('#35332f', { roughness: 0.5, metalness: 0.4 }),
      wood: M.plain('#4a2f22', { roughness: 0.9 }),
      woodDk: M.plain('#2e1d15', { roughness: 0.9 }),
      neck: M.plain('#4a4742', { roughness: 0.9 }),
      black: M.plain('#14110f', { roughness: 1 }),
      white: M.plain('#f2f0ec', { roughness: 0.85 }),
      pale: M.plain('#cfcdc6', { roughness: 0.95 }),
      paving: M.mat('stone', 9, 7, { color: '#ffffff' }),
      lawn: M.plain('#79ad45', { roughness: 1 }),
      red: M.plain('#b34a34', { roughness: 0.8 }),
      redCloth: M.plain('#c0262a', { roughness: 0.9 }),
      saffron: M.plain('#e8a020', { roughness: 0.9 }),
      flagY: new THREE.MeshStandardMaterial({ color: '#e8c25a', roughness: 0.9, side: THREE.DoubleSide }),
      brass: M.plain('#c8993a', { roughness: 0.4, metalness: 0.6 }),
      iron: M.plain('#1d1c1b', { roughness: 0.7, metalness: 0.4 }),
      slate: M.plain('#5a5750', { roughness: 0.8 }),
      darkStone: M.plain('#7d7972', { roughness: 1 }),
    };
  }

  /* diagonal brackets under one eave side (front side along +z), rotated per side */
  function EaveSide({ k, m }) {
    const n = 7; const dz = 1.15; const dy = 0.62; const L = Math.hypot(dz, dy);
    return (
      <group rotation={[0, (k * Math.PI) / 2, 0]}>
        {Array.from({ length: n }, (_, i) => {
          const x = -2.7 + (5.4 * i) / (n - 1);
          return <Box key={i} s={[0.13, 0.16, L]} p={[x, 2.8, 1.8 + dz / 2 + 0.05]} r={[-Math.atan2(dy, dz), 0, 0]} m={m} cast={false} />;
        })}
        {/* soffit board */}
        <Box s={[6.1, 0.1, 1.45]} p={[0, 3.04, 2.55]} m={m} cast={false} />
      </group>
    );
  }

  function Nandi({ M, mt }) {
    const horn = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0.1, 0), new THREE.Vector3(0.16, 0.26, 0.04), new THREE.Vector3(0.14, 0.38, 0.1)]), 8, 0.03, 6), []);
    return (
      <group>
        <Box s={[1.7, 0.18, 1.5]} p={[0, 0.09, 0]} m={mt.pale} />
        <Box s={[1.4, 1.0, 1.2]} p={[0, 0.68, 0]} m={mt.pale} />
        <Box s={[1.5, 0.12, 1.3]} p={[0, 1.24, 0]} m={mt.quoin} />
        {/* inscription plaque, pale panel with text lines */}
        <Box s={[1.1, 0.8, 0.05]} p={[0, 0.7, 0.62]} m={mt.white} cast={false} />
        <Box s={[1.14, 0.84, 0.03]} p={[0, 0.7, 0.605]} m={mt.darkStone} cast={false} />
        {[0.98, 0.88, 0.78, 0.68, 0.58, 0.48].map((y, i) => <Box key={i} s={[0.86 - (i === 5 ? 0.4 : (i % 2) * 0.12), 0.03, 0.02]} p={[0, y, 0.655]} m={mt.black} cast={false} />)}
        {/* crouching bull facing -z (towards the door) */}
        <group position={[0, 1.3, 0]} rotation={[0, Math.PI, 0]}>
          <Ball rad={0.5} p={[0, 0.34, -0.1]} sc={[0.9, 0.7, 1.3]} m={mt.white} />{/* body */}
          <Ball rad={0.26} p={[0, 0.7, 0.12]} sc={[0.85, 0.9, 1.1]} m={mt.white} />{/* hump */}
          <Ball rad={0.2} p={[0, 0.62, 0.42]} sc={[0.9, 1.2, 1.1]} m={mt.white} />{/* neck */}
          <Ball rad={0.2} p={[0, 0.78, 0.66]} sc={[0.85, 0.95, 1.25]} m={mt.white} />{/* head */}
          <Ball rad={0.12} p={[0, 0.68, 0.88]} sc={[1, 0.85, 1]} m={mt.white} />{/* muzzle */}
          {[-1, 1].map((sg) => <mesh key={`h${sg}`} position={[sg * 0.16, 0.9, 0.6]} rotation={[0, 0, -sg * 0.5]} scale={[sg, 1, 1]} geometry={horn} material={mt.white} />)}
          {[-1, 1].map((sg) => <Ball key={`e${sg}`} rad={0.06} p={[sg * 0.2, 0.86, 0.5]} sc={[1.4, 0.5, 0.8]} m={mt.white} />)}
          {/* folded front legs */}
          {[-1, 1].map((sg) => <Ball key={`f${sg}`} rad={0.11} p={[sg * 0.24, 0.1, 0.5]} sc={[0.8, 0.7, 2.3]} m={mt.white} />)}
          {[-1, 1].map((sg) => <Ball key={`b${sg}`} rad={0.2} p={[sg * 0.36, 0.14, -0.35]} sc={[0.7, 0.75, 1.2]} m={mt.white} />)}
        </group>
      </group>
    );
  }

  function TridentPlinth({ mt }) {
    return (
      <group>
        <Box s={[1.5, 0.2, 1.5]} p={[0, 0.1, 0]} m={mt.white} />
        <Box s={[1.2, 0.25, 1.2]} p={[0, 0.325, 0]} m={mt.white} />
        <Box s={[0.9, 0.55, 0.9]} p={[0, 0.725, 0]} m={mt.white} />
        <Box s={[0.34, 0.5, 0.34]} p={[0.28, 1.25, 0.1]} m={mt.white} />
        <Box s={[0.5, 0.25, 0.5]} p={[-0.1, 1.12, 0.1]} m={mt.iron} />
        <Ball rad={0.17} p={[-0.1, 1.35, 0.1]} m={M0(mt).plain('#e0642a')} />
        {/* golden trident */}
        <Cyl rt={0.04} rb={0.05} h={2.6} p={[-0.1, 2.55, 0.1]} m={mt.M.gold} seg={8} />
        <Cyl rt={0.05} h={0.12} p={[-0.1, 1.5, 0.1]} m={mt.M.gold} seg={8} />
        <Box s={[0.5, 0.05, 0.05]} p={[-0.1, 3.5, 0.1]} m={mt.M.gold} cast={false} />
        {[-0.25, 0.25].map((x) => <mesh key={x} position={[-0.1 + x, 3.72, 0.1]} material={mt.M.gold}><coneGeometry args={[0.045, 0.42, 6]} /></mesh>)}
        <mesh position={[-0.1, 3.9, 0.1]} material={mt.M.gold}><coneGeometry args={[0.06, 0.6, 6]} /></mesh>
        <Cyl rt={0.07} h={0.04} p={[-0.1, 3.38, 0.1]} m={mt.M.gold} seg={8} />
      </group>
    );
  }
  const M0 = (mt) => mt.M;

  /* small dark stacked-stone shrine */
  function StoneShrine({ mt, s = 1 }) {
    return (
      <group scale={s}>
        <Box s={[1.5, 0.35, 1.5]} p={[0, 0.17, 0]} m={mt.darkStone} />
        <Box s={[1.3, 0.55, 1.3]} p={[0, 0.62, 0]} m={mt.darkStone} />
        <Box s={[0.9, 0.5, 0.9]} p={[0, 1.15, 0]} m={mt.stoneDk} />
        <Box s={[0.62, 0.35, 0.62]} p={[0, 1.58, 0]} m={mt.stoneDk} />
        <Box s={[0.36, 0.28, 0.36]} p={[0, 1.9, 0]} m={mt.stoneDk} />
        <Ball rad={0.14} p={[0, 2.1, 0]} m={mt.darkStone} />
        <Box s={[0.34, 0.44, 0.04]} p={[0, 0.9, 0.46]} m={mt.black} cast={false} />
      </group>
    );
  }

  function Pavilion({ mt, rot = 0 }) {
    const posts = [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]];
    return (
      <group rotation={[0, rot, 0]}>
        <Box s={[3.6, 0.22, 3.6]} p={[0, 0.11, 0]} m={mt.pale} />
        {posts.map(([x, z], i) => <Box key={i} s={[0.2, 2.2, 0.2]} p={[x, 1.3, z]} m={mt.white} />)}
        {/* low white parapet on three sides, open to the front */}
        <Box s={[3.0, 0.7, 0.14]} p={[0, 0.6, -1.4]} m={mt.white} />
        <Box s={[0.14, 0.7, 2.8]} p={[-1.4, 0.6, 0]} m={mt.white} />
        <Box s={[0.14, 0.7, 2.8]} p={[1.4, 0.6, 0]} m={mt.white} />
        <Box s={[3.5, 0.14, 3.5]} p={[0, 2.45, 0]} m={mt.white} />
        <Roof w={4.3} d={4.3} h={1.25} y={2.5} m={mt.red} sag={1.1} lift={0.05} fascia={false} />
        <Ball rad={0.1} p={[0, 3.78, 0]} m={mt.M.gold} />
      </group>
    );
  }

  function Student({ mt, p, ry = 0, k = 0 }) {
    const lower = k % 3 === 0 ? mt.saffron : mt.white;
    const skin = mt.M.plain('#8a5e40');
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Cyl rt={0.14} rb={0.2} h={0.75} p={[0, 0.375, 0]} m={lower} seg={8} />
        <Cyl rt={0.17} rb={0.25} h={0.6} p={[0, 1.05, 0]} m={mt.redCloth} seg={8} />
        <Ball rad={0.14} p={[0, 1.5, 0]} m={skin} />
        <Ball rad={0.145} p={[0, 1.55, -0.01]} sc={[1, 0.6, 1]} m={mt.black} />
      </group>
    );
  }

  function BellFence({ mt, w = 3.0 }) {
    const n = 8;
    return (
      <group>
        {[-w / 2, 0, w / 2].map((x, i) => <Box key={i} s={[0.06, 1.7, 0.06]} p={[x, 0.85, 0]} m={mt.iron} />)}
        <Box s={[w, 0.06, 0.06]} p={[0, 1.7, 0]} m={mt.iron} cast={false} />
        <Box s={[w, 0.04, 0.04]} p={[0, 0.9, 0]} m={mt.iron} cast={false} />
        {Array.from({ length: n }, (_, i) => {
          const x = -w / 2 + 0.2 + ((w - 0.4) * i) / (n - 1);
          return (
            <group key={i} position={[x, 1.62, 0]}>
              <Cyl rt={0.008} h={0.1} p={[0, 0, 0]} m={mt.iron} seg={4} />
              <mesh position={[0, -0.16, 0]} material={mt.brass} castShadow><coneGeometry args={[0.09, 0.2, 8]} /></mesh>
            </group>
          );
        })}
      </group>
    );
  }

  function Flag({ mt }) {
    return (
      <group>
        <Cyl rt={0.04} rb={0.06} h={8.4} p={[0, 4.2, 0]} m={mt.iron} seg={6} />
        <group position={[0, 7.7, 0]} rotation={[0, 0, 0.18]}>
          <mesh position={[-0.8, 0, 0]} material={mt.flagY}><planeGeometry args={[1.6, 0.5]} /></mesh>
          <mesh position={[-0.8, 0, 0]} rotation={[0, Math.PI, 0]} material={mt.flagY}><planeGeometry args={[1.6, 0.5]} /></mesh>
        </group>
      </group>
    );
  }

  function Cypress({ p, s = 1 }) {
    const M = useM();
    const leaf = M.plain('#1f3a26', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.12} rb={0.2} h={1} p={[0, 0.5, 0]} m={M.plain('#4a3626')} seg={6} />
        <mesh position={[0, 3.6, 0]} material={leaf} castShadow><coneGeometry args={[1.0, 6.4, 9]} /></mesh>
      </group>
    );
  }

  function Shrine({ mt }) {
    const W = 6.6;
    return (
      <group>
        {/* very low stone apron */}
        <Box s={[5.0, B, 5.0]} p={[0, B / 2, 0]} m={mt.pale} />
        {/* cella: squat square, light grey-white weathered stone */}
        <Box s={[3.6, 3.0, 3.2]} p={[0, B + 1.5, -0.2]} m={mt.stone} />
        {[-1, 1].map((sx) => <Box key={`dw${sx}`} s={[1.05, 3.0, 0.4]} p={[sx * 1.275, B + 1.5, 1.6]} m={mt.stone} />)}
        <Box s={[1.5, 0.8, 0.4]} p={[0, B + 2.6, 1.6]} m={mt.stone} />
        <Box s={[3.72, 0.55, 3.72]} p={[0, B + 0.275, 0]} m={mt.stoneDk} />
        {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.2, 2.45, 0.2]} p={[sx * 1.75, B + 1.78, sz * 1.75]} m={mt.quoin} />))}
        <Box s={[3.75, 0.14, 3.75]} p={[0, B + 2.6, 0]} m={mt.quoin} cast={false} />
        {[0.7,1.5,2.3].map((y,i)=>(<group key={i}>
          <Box s={[3.64,0.2,0.03]} p={[0,B+y,1.81]} m={mt.stoneDk} cast={false} />
          <Box s={[0.03,0.2,3.62]} p={[1.81,B+y,0]} m={mt.stoneDk} cast={false} />
          <Box s={[0.03,0.2,3.62]} p={[-1.81,B+y,0]} m={mt.stoneDk} cast={false} />
        </group>))}
        {/* recessed doorway centred on +z */}
        <Box s={[1.5, 2.2, 0.05]} p={[0, B + 1.1, 1.43]} m={mt.black} cast={false} />
        <Box s={[1.0, 1.95, 0.12]} p={[0, B + 1.02, 1.62]} m={mt.wood} cast={false} />
        <Box s={[0.46, 0.08, 0.14]} p={[0, B + 1.05, 1.7]} m={mt.black} cast={false} />
        <Box s={[0.14, 2.2, 0.2]} p={[-0.64, B + 1.1, 1.86]} m={mt.woodDk} />
        <Box s={[0.14, 2.2, 0.2]} p={[0.64, B + 1.1, 1.86]} m={mt.woodDk} />
        <Box s={[1.7, 0.2, 0.26]} p={[0, B + 2.3, 1.88]} m={mt.woodDk} />
        <Box s={[1.9, 0.12, 0.3]} p={[0, B + 2.46, 1.88]} m={mt.wood} />
        <Box s={[1.4, 0.1, 0.3]} p={[0, B + 0.05, 2.0]} m={mt.pale} cast={false} />

        {/* lower roof: wide hipped dark ridged sheet; thick fascia; bracket row */}
        {[0, 1, 2, 3].map((k) => <EaveSide key={k} k={k} m={mt.wood} />)}
        <Roof w={W} d={W} h={1.2} y={3.1} m={mt.metal} sag={1.05} lift={0.02} fascia={false} />
        {[0, 1, 2, 3].map((k) => (
          <group key={`rg${k}`} rotation={[0, (k * Math.PI) / 2, 0]}>
            {Array.from({ length: 9 }, (_, i) => {
              const x = -1.9 + (3.8 * i) / 8;
              const ex = 1;
              return <Box key={i} s={[0.04, 0.04, 1.5 * ex]} p={[x, 3.42, 2.4]} r={[-0.36, 0, 0]} m={mt.metalRib} cast={false} />;
            })}
          </group>
        ))}
        <Box s={[W + 0.1, 0.25, 0.22]} p={[0, 3.17, W / 2]} m={mt.woodDk} />
        <Box s={[W + 0.1, 0.25, 0.22]} p={[0, 3.17, -W / 2]} m={mt.woodDk} />
        <Box s={[0.22, 0.25, W + 0.1]} p={[W / 2, 3.17, 0]} m={mt.woodDk} />
        <Box s={[0.22, 0.25, W + 0.1]} p={[-W / 2, 3.17, 0]} m={mt.woodDk} />

        {/* neck: short, low dark box with a slit window; thin plinth beneath */}
        <Box s={[2.1, 0.12, 2.1]} p={[0, 4.4, 0]} m={mt.stoneDk} />
        <Box s={[1.9, 1.1, 1.9]} p={[0, 5.01, 0]} m={mt.neck} />
        <Box s={[0.7, 0.26, 0.06]} p={[0, 5.05, 0.96]} m={mt.black} cast={false} />
        <Box s={[0.82, 0.06, 0.1]} p={[0, 5.22, 0.97]} m={mt.quoin} cast={false} />
        <Box s={[2.05, 0.12, 2.05]} p={[0, 5.62, 0]} m={mt.wood} />
        {/* upper roof: smaller, lower rise */}
        <Roof w={3.0} d={3.0} h={0.6} y={5.68} m={mt.metal} sag={1.05} lift={0.02} fascia={false} />
        <Box s={[3.05, 0.1, 0.08]} p={[0, 5.72, 1.5]} m={mt.woodDk} />
        <Box s={[3.05, 0.1, 0.08]} p={[0, 5.72, -1.5]} m={mt.woodDk} />
        <Box s={[0.08, 0.1, 3.05]} p={[1.5, 5.72, 0]} m={mt.woodDk} />
        <Box s={[0.08, 0.1, 3.05]} p={[-1.5, 5.72, 0]} m={mt.woodDk} />
        <Box s={[0.6, 0.26, 0.6]} p={[0, 6.4, 0]} m={mt.neck} />
        <Gajur y={6.5} s={1.3} />
      </group>
    );
  }

  function Main() {
    const mt = useMats();
    const [dusk, ref] = useDusk();
    const students = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: 4 + i * 0.45, z: 5.2 + i * 0.25 })), []);
    return (
      <group ref={ref}>
        <Shrine mt={mt} />
        {/* Nandi on axis facing the door */}
        <group position={[-0.6, 0, 6]}><Nandi M={mt.M} mt={mt} /></group>
        {/* trident plinth front-left, small dark stone shrine behind it */}
        <group position={[-6.0, 0, 2.6]} rotation={[0, 0.15, 0]}><TridentPlinth mt={mt} /></group>
        <group position={[-6.6, 0, -1.6]} rotation={[0, 0.2, 0]}><StoneShrine mt={mt} s={1.1} /></group>
        {/* bell fence beside the front-right wall, stone shrine behind it */}
        <group position={[2.7, 0, 2.3]}><BellFence mt={mt} /></group>
        <group position={[5.9, 0, -0.9]} rotation={[0, -0.2, 0]}><StoneShrine mt={mt} s={1.0} /></group>
        {/* saffron flag behind the right shoulder */}
        <group position={[2.9, 0, -2.4]}><Flag mt={mt} /></group>
        {/* Vedic students in red */}
        {students.map((s, i) => <Student key={i} mt={mt} k={i} p={[s.x, 0.12, s.z]} ry={Math.PI - 0.5} />)}
        {dusk && (
          <>
            <pointLight position={[0, 1.6, 3.2]} color="#ffb060" intensity={14} distance={9} decay={2} />
            <pointLight position={[-6.0, 1.5, 3.2]} color="#ffa040" intensity={5} distance={6} decay={2} />
            <mesh position={[0, 1.2, 1.9]}><boxGeometry args={[0.8, 1.7, 0.05]} /><meshBasicMaterial color="#ff9a3c" /></mesh>
            {[-0.5, 0.5].map((x) => <mesh key={x} position={[x * 2.2, 0.35, 5.0]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#ffc060" /></mesh>)}
            <mesh position={[0, 5.15, 1.06]}><boxGeometry args={[0.8, 0.3, 0.02]} /><meshBasicMaterial color="#ffb050" /></mesh>
          </>
        )}
        <Frame s={[10, 9.4, 7]} p={[0, 4.7, 2]} />
      </group>
    );
  }

  function Hill({ p, s, c, rot = 0, seed = 1 }) {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const r = mkRng(seed * 31 + 7); const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const y = pos.getY(i);
        const hx = pos.getX(i); const hz = pos.getZ(i);
        const f = 1 + 0.11 * Math.sin(hx * 5.1 + seed * 3.3) * Math.cos(hz * 4.3 + seed);
        pos.setX(i, pos.getX(i) * f); pos.setZ(i, pos.getZ(i) * f);
        pos.setY(i, y * (1 + 0.04 * Math.sin(hx * 6 + hz * 5 + seed)));
      }
      g.computeVertexNormals(); return g;
    }, [seed]);
    return (
      <mesh position={p} scale={s} rotation={[0, rot, 0]} geometry={geo}>
        <meshStandardMaterial color={c} roughness={1} />
      </mesh>
    );
  }

  function Patch({ p, s, m, rot = 0 }) {
    return (
      <mesh position={[p[0], 0.15, p[1]]} rotation={[-Math.PI / 2, 0, rot]} scale={[s[0], s[1], 1]} material={m}>
        <circleGeometry args={[1, 14]} />
      </mesh>
    );
  }

  function Env() {
    const mt = useMats();
    const M = mt.M;
    const bank = M.plain('#b8ab8c', { roughness: 1 });
    const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6e9aa0', roughness: 0.25, metalness: 0.2 }), []);
    const trees = useMemo(() => {
      const r = mkRng(77); const out = [];
      for (let i = 0; i < 70; i += 1) {
        const x = -70 + r() * 140; const z = -22 - r() * 28;
        if (z > -34 && Math.abs(x - 10) < 14) continue;
        out.push({ x, z, s: 0.8 + r() * 0.8, k: r() < 0.3 ? 'pine' : 'broad' });
      }
      return out;
    }, []);
    const near = useMemo(() => [
      [-22, -9, 1.3], [-27, -4, 1.1], [-19, -16, 1.4], [24, -10, 1.2], [28, -3, 1.0], [21, -17, 1.3], [-24, 12, 1.1], [26, 12, 1.2], [-30, 4, 1.2],
    ], []);
    return (
      <group>
        {/* ground: wide grass, paved/cobbled courtyard, lawn patches */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[75, 40]} />
          <meshStandardMaterial color="#7ca14e" roughness={1} />
        </mesh>
        <Box s={[40, 0.12, 24]} p={[0, 0.06, 3]} m={mt.paving} cast={false} />
        <Patch p={[-9.5, 7.5]} s={[6, 3.2]} m={mt.lawn} rot={0.1} />
        <Patch p={[8.5, 8]} s={[7, 3.4]} m={mt.lawn} rot={-0.15} />
        <Patch p={[-10, -1.5]} s={[3.8, 2.6]} m={mt.lawn} rot={0.3} />
        <Patch p={[11, -2.5]} s={[3.8, 2.6]} m={mt.lawn} rot={-0.3} />
        <Patch p={[0, -8.5]} s={[20, 3.2]} m={mt.lawn} />
        <Patch p={[0, 10.5]} s={[3.2, 1.8]} m={mt.lawn} />
        {/* low compound edge wall */}
        <Box s={[40, 0.5, 0.25]} p={[0, 0.25, 15.3]} m={mt.pale} cast={false} />

        {/* pavilions, left and right */}
        <group position={[-17, 0, 1.5]}><Pavilion mt={mt} rot={0.1} /></group>
        <group position={[16.5, 0, 2.5]}><Pavilion mt={mt} rot={-0.1} /></group>

        {/* Vedic school outbuilding, back left: low white/grey walls, dark slab roof */}
        <group position={[-24, 0, -8]} rotation={[0, 0.1, 0]}>
          <Box s={[9, 2.6, 3.8]} p={[0, 1.3, 0]} m={mt.pale} />
          <Box s={[1, 1.9, 0.1]} p={[-1.5, 1.0, 1.92]} m={mt.woodDk} cast={false} />
          <Box s={[1.1, 0.8, 0.1]} p={[1.8, 1.5, 1.92]} m={mt.woodDk} cast={false} />
          <Box s={[1.1, 0.8, 0.1]} p={[3.2, 1.5, 1.92]} m={mt.woodDk} cast={false} />
          <Roof w={10.6} d={5.2} h={1.4} y={2.6} m={mt.slate} sag={1} lift={0} fascia={false} />
        </group>

        {/* trees: tall dark cypress at far right, broad trees behind the pavilions */}
        <Cypress p={[19.5, 0, -2.5]} s={1.3} />
        {near.map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s * 1.5} kind="broad" />)}

        {/* stream confluence far behind, off the front sightline */}
        {/* Budhi Ganga from the left, Saraswati joining from the right at a Y angle, gravel bar at the junction */}
        <Box s={[56, 0.04, 11]} p={[-34, 0.0, -50]} r={[0, -0.12, 0]} m={bank} cast={false} />
        <Box s={[56, 0.08, 6.5]} p={[-34, 0.04, -50]} r={[0, -0.12, 0]} m={water} cast={false} />
        <Box s={[50, 0.04, 8]} p={[36, 0.0, -48]} r={[0, 0.62, 0]} m={bank} cast={false} />
        <Box s={[50, 0.08, 4.2]} p={[36, 0.04, -48]} r={[0, 0.62, 0]} m={water} cast={false} />
        <Box s={[40, 0.08, 7]} p={[-4, 0.05, -56]} r={[0, 0.03, 0]} m={water} cast={false} />
        <mesh position={[-1, 0.07, -53]} rotation={[-Math.PI / 2, 0, 0.3]} scale={[4, 2.2, 1]} material={bank}><circleGeometry args={[1, 16]} /></mesh>
        {/* haze */}
        

        {/* low forested green hills behind, ridge dipping at middle-left */}
        {[[-78, -66, 28, 22, '#294326'], [-58, -62, 24, 19, '#2d4829'], [-38, -66, 22, 25, '#294326'], [-18, -72, 24, 20, '#2f4a2c'], [4, -76, 26, 27, '#294326'],
          [26, -70, 22, 23, '#2d4829'], [46, -66, 24, 26, '#294326'], [66, -62, 26, 21, '#2f4a2c'], [86, -60, 24, 19, '#294326'],
          [-34, -50, 16, 9, '#2c4727'], [-8, -54, 15, 8, '#2f4a2c'], [36, -52, 16, 10, '#2c4727'], [-62, -34, 15, 14, '#2b4628'], [64, -30, 15, 13, '#2b4628'], [-84, -20, 17, 16, '#294326'], [88, -16, 17, 15, '#294326']].map(([x, z, r, h, c], i) => (
          <Hill key={i} p={[x, -0.5, z]} s={[r * 1.2, h * 0.7, r * 0.9]} c={c} rot={i} seed={i + 2} />))}
        {trees.map((t, i) => <Tree key={i} p={[t.x, 0, t.z]} s={t.s * 1.8} kind={t.k} />)}
      </group>
    );
  }

  return { 'baidyanath-dham-achham': { Main, Env } };
}
