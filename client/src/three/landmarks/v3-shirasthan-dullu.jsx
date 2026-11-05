/* Shirasthan (Jwala Mandir), Dullu, Dailekh: a humble mid-hill village flame shrine.
   A level red beaten-earth courtyard (~15 x 12 m, est.), a long low whitewashed single-storey building along the back with dark
   timber posts, a slate roof and a blue/white striped cloth valance; a round red-clay sacrificial-post mound with a pole, yellow
   cloth and ribbons; upright stones; a second red-clay + slate platform with a ribbon post; a shelf of three carved tablets; tiny
   gas flames in blackened niches; slate heaps and millstones; a dry-stone wall with canna, bamboo and banana; terraced green hill
   behind, village houses, Kal Bhairav shrine, Shivling and dharamshala at the left, the Shirasthan stream in the valley in front.
   1 unit = 1 m. Layout is estimated from 7 photographs (no plan is published). Front = +z, building along the back (-z). */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const RED = '#b8613c', WHITE = '#f0eee8', SLATE = '#6e6a62', DARKW = '#3e2a1e', BLUE = '#3f6fae';

  /* ---------- terrain: plateau, terraced hill behind, steep fall to the stream in front ---------- */
  function hgt(x, z) {
    const ax = Math.abs(x);
    let h = -0.12;
    if (z < -9) {
      const t = -9 - z; const st = Math.floor(t / 5.5); const fr = t / 5.5 - st;
      h = -0.12 + st * 1.6 + sstep(0.8, 0.95, fr) * 1.6 + t * 0.1;
    } else if (z > 9) {
      const d = z - 9;
      if (d < 14) { const st = Math.floor(d / 3.5), fr = d / 3.5 - st; h = -0.12 - 1.6 * (st + sstep(0.85, 1, fr)); }
      else if (d < 21) h = -6.52 + Math.sin((d - 14) * 0.4) * 0.12;
      else h = -6.52 + (d - 21) * 0.5;
    }
    if (ax > 16) h += (ax - 16) * 0.16 * (z < 9 ? 1 : 0.5);
    const r = Math.hypot(x, z);
    if (r > 48) h += (r - 48) * 0.35;
    return h;
  }

  function Terrain() {
    const geo = useMemo(() => {
      const S = 170, N = 150;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i), z = p.getZ(i);
        const h = hgt(x, z);
        p.setY(i, h);
        const gx = hgt(x + 0.8, z) - hgt(x - 0.8, z), gz = hgt(x, z + 0.8) - hgt(x, z - 0.8);
        const slope = Math.min(1, Math.hypot(gx, gz) / 1.6);
        const n = rnd(Math.floor(x / 2.5) * 31 + Math.floor(z / 2.5) * 17);
        const wet = (z > 21 && z < 31 && h < -6.2) ? 1 : 0;
        c.set(n < 0.4 ? '#5d7f3c' : n < 0.75 ? '#6b8a45' : '#7c8a4a');
        if (Math.hypot(x, z) > 50) c.lerp(new THREE.Color('#5f7440'), 0.6);
        c.lerp(new THREE.Color('#8b7a5e'), slope * (Math.hypot(x, z) > 40 ? 0.25 : 0.75));
        if (z > 9 && z < 24 && Math.abs(x) < 34) { c.set(rnd(Math.floor(z / 3.5) * 5 + Math.floor(x / 3)) < 0.5 ? '#66783f' : '#78774a'); c.lerp(new THREE.Color('#9a7a55'), 0.35 + slope * 0.6); }
        if (wet) c.lerp(new THREE.Color('#9a9484'), 0.6);
        if (z > -9 && z < 9 && Math.abs(x) < 16) c.set('#6f8f4a');
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>;
  }

  /* ---------- small helpers ---------- */
  function Beam({ a, b, r = 0.05, m, seg = 6 }) {
    const { pos, quat, len } = useMemo(() => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
      const d = vb.clone().sub(va);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      return { pos: va.clone().add(vb).multiplyScalar(0.5).toArray(), quat: new THREE.Euler().setFromQuaternion(q).toArray().slice(0, 3), len: d.length() };
    }, [a, b]);
    return <Cyl rt={r} rb={r} h={len} p={pos} r={quat} m={m} seg={seg} />;
  }

  function Ribbons({ p, n = 6, h = 0.7, spread = 0.18, seed = 1 }) {
    const M = useM();
    const red = M.plain('#c4262e', { roughness: 0.9 }), white = M.plain('#f4f1ea', { roughness: 0.9 });
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const a = rnd(seed * 7 + i), l = h * (0.6 + rnd(seed * 3 + i * 5) * 0.5);
          return <Box key={i} s={[0.045, l, 0.012]} p={[(a - 0.5) * 2 * spread, -l / 2, (rnd(seed + i * 2) - 0.5) * spread]} r={[0, a * 3, (a - 0.5) * 0.3]} m={i % 2 ? white : red} cast={false} />;
        })}
      </group>
    );
  }

  function Person({ p, r = [0, 0, 0], shirt = '#6b7280', seated = false, skin = '#b98563', pants = '#33384a' }) {
    const M = useM();
    const sh = M.plain(shirt, { roughness: 0.9 }), sk = M.plain(skin, { roughness: 0.9 }), pa = M.plain(pants, { roughness: 0.9 });
    return (
      <group position={p} rotation={r}>
        {seated ? (
          <group>
            <Box s={[0.32, 0.16, 0.5]} p={[0, 0.1, 0.1]} m={pa} />
            <Box s={[0.28, 0.12, 0.38]} p={[0, 0.1, 0.45]} m={pa} />
            <Box s={[0.38, 0.5, 0.22]} p={[0, 0.45, 0]} m={sh} />
            <Ball rad={0.115} p={[0, 0.86, 0.02]} m={sk} />
            <Box s={[0.24, 0.08, 0.22]} p={[0, 0.95, 0.0]} m={M.plain('#2a2a2a')} />
          </group>
        ) : (
          <group>
            <Box s={[0.28, 0.82, 0.2]} p={[0, 0.41, 0]} m={pa} />
            <Box s={[0.4, 0.6, 0.22]} p={[0, 1.12, 0]} m={sh} />
            <Box s={[0.1, 0.5, 0.1]} p={[-0.25, 1.1, 0]} m={sh} />
            <Box s={[0.1, 0.5, 0.1]} p={[0.25, 1.1, 0]} m={sh} />
            <Ball rad={0.12} p={[0, 1.57, 0]} m={sk} />
            <Box s={[0.25, 0.09, 0.23]} p={[0, 1.66, 0]} m={M.plain('#2a2a2a')} />
          </group>
        )}
      </group>
    );
  }

  /* a tiny natural-gas flame (exaggerated a little so it reads at this scale) */
  function Flame({ p, s = 1, light = 0.5, blue = false }) {
    const M = useM();
    const out = M.plain(blue ? '#4f8bff' : '#ff8a1c', { emissive: blue ? '#2a5fff' : '#ff6a00', emissiveIntensity: 3.2, roughness: 0.6 });
    const inn = M.plain('#ffe08a', { emissive: '#ffd24a', emissiveIntensity: 3.6, roughness: 0.6 });
    return (
      <group position={p} scale={s}>
        <mesh material={out} position={[0, 0.11, 0]}><coneGeometry args={[0.055, 0.22, 7]} /></mesh>
        <mesh material={inn} position={[0, 0.07, 0]}><coneGeometry args={[0.03, 0.13, 6]} /></mesh>
        <mesh position={[0, 0.12, 0.02]}><sphereGeometry args={[0.2, 10, 8]} /><meshBasicMaterial color={blue ? '#6fa0ff' : '#ffb04a'} transparent opacity={0.28} depthWrite={false} /></mesh>
        <pointLight color="#ff9a3a" intensity={light * 2} distance={4.5} position={[0, 0.15, 0.1]} />
      </group>
    );
  }

  function Slabs({ p, n = 7, w = 0.7, seed = 1 }) {
    const M = useM();
    const m = M.plain('#a9a39a', { roughness: 1 }), m2 = M.plain('#7d786f', { roughness: 1 });
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const a = rnd(seed + i * 3), b = rnd(seed * 2 + i * 5);
          return <Box key={i} s={[w * (0.6 + a * 0.5), 0.07 + b * 0.05, w * (0.5 + b * 0.5)]} p={[(a - 0.5) * w * 0.5, 0.05 + i * 0.075, (b - 0.5) * w * 0.4]} r={[0, a * 2.4, (b - 0.5) * 0.14]} m={i % 3 ? m : m2} />;
        })}
      </group>
    );
  }

  function Banana({ p, s = 1, seed = 1 }) {
    const M = useM();
    const st = M.plain('#7e9a3e'), lf = M.plain('#4f8a2e', { roughness: 0.8 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.1} rb={0.14} h={2.1} p={[0, 1.05, 0]} m={st} seg={7} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * 6.28 + seed;
          return <Box key={i} s={[0.45, 0.03, 1.7]} p={[Math.sin(a) * 0.7, 2.2 - (i % 2) * 0.2, Math.cos(a) * 0.7]} r={[0.35, a, 0]} m={lf} cast={false} />;
        })}
      </group>
    );
  }
  function Bamboo({ p, n = 7, h = 4, seed = 1 }) {
    const M = useM();
    const st = M.plain('#9bab4a'), lf = M.plain('#5f9a3a', { roughness: 0.85 });
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const a = rnd(seed + i), b = rnd(seed * 3 + i * 4);
          const lean = [(a - 0.5) * 0.5, 0, (b - 0.5) * 0.5];
          const hh = h * (0.7 + a * 0.4);
          return (
            <group key={i} position={[(a - 0.5) * 1.2, 0, (b - 0.5) * 1.0]} rotation={lean}>
              <Cyl rt={0.03} rb={0.045} h={hh} p={[0, hh / 2, 0]} m={st} seg={5} />
              <Ball rad={0.5} p={[0, hh - 0.2, 0]} sc={[1, 0.55, 1]} m={lf} />
              <Ball rad={0.4} p={[0.1, hh * 0.72, 0.1]} sc={[1, 0.5, 1]} m={lf} />
            </group>
          );
        })}
      </group>
    );
  }
  function Canna({ p, n = 6, seed = 1 }) {
    const M = useM();
    const lf = M.plain('#3f8f3a', { roughness: 0.8 }), fl = M.plain('#d4281f', { roughness: 0.7 });
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => {
          const a = rnd(seed + i * 2), b = rnd(seed * 5 + i);
          return (
            <group key={i} position={[(a - 0.5) * 1.3, 0, (b - 0.5) * 0.7]}>
              <Box s={[0.35, 0.03, 0.9]} p={[0, 0.7 + b * 0.2, 0]} r={[0.7, a * 6, 0]} m={lf} cast={false} />
              <Box s={[0.35, 0.03, 0.8]} p={[0.1, 0.5, 0.1]} r={[0.5, a * 3, 0.2]} m={lf} cast={false} />
              <Cyl rt={0.015} h={0.9} p={[0, 0.9, 0]} m={lf} seg={4} />
              <Ball rad={0.075} p={[0, 1.38, 0]} sc={[1, 1.3, 1]} m={fl} />
            </group>
          );
        })}
      </group>
    );
  }

  function Roof2({ w, d, rise, y, p = [0, 0, 0], m }) {
    const ang = Math.atan2(rise, d / 2), L = Math.hypot(d / 2, rise);
    return (
      <group position={[p[0], y, p[2]]}>
        <Box s={[w, 0.12, L + 0.1]} p={[0, rise / 2, d / 4]} r={[ang, 0, 0]} m={m} />
        <Box s={[w, 0.12, L + 0.1]} p={[0, rise / 2, -d / 4]} r={[-ang, 0, 0]} m={m} />
        <Box s={[w + 0.1, 0.1, 0.34]} p={[0, rise + 0.06, 0]} m={m} />
      </group>
    );
  }

  function TreeS({ p, s = 1, c = '#4c8a3a', seed = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.14} rb={0.22} h={2.2} p={[0, 1.1, 0]} m={M.plain('#5a4430')} seg={6} />
        <Ball rad={1.5} p={[0, 3.1, 0]} sc={[1, 0.85, 1]} m={M.plain(c, { roughness: 0.9 })} />
        <Ball rad={1.1} p={[0.7, 2.6, 0.3]} sc={[1, 0.8, 1]} m={M.plain(c, { roughness: 0.9 })} />
        <Ball rad={1.0} p={[-0.7, 2.7, -0.2]} sc={[1, 0.8, 1]} m={M.plain('#5f9a45', { roughness: 0.9 })} />
      </group>
    );
  }

  /* dry-stone retaining wall with visible courses */
  function StoneWall({ x0, z0, x1, z1, h = 1.5, th = 0.8, seed = 1 }) {
    const M = useM();
    const L = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(-(z1 - z0), x1 - x0);
    const cols = ['#8f877a', '#a39a8a', '#7a7266', '#9a9183'].map((c) => M.plain(c, { roughness: 1 }));
    const nC = Math.round(h / 0.3), nS = Math.max(2, Math.round(L / 1.6));
    return (
      <group position={[(x0 + x1) / 2, 0, (z0 + z1) / 2]} rotation={[0, ang, 0]}>
        {Array.from({ length: nC }, (_, c) => Array.from({ length: nS }, (_, k) => {
          const sl = L / nS;
          return <Box key={c + '-' + k} s={[sl * (0.94 - (c % 2) * 0.05), 0.28, th - (c % 3) * 0.06]} p={[-L / 2 + sl * (k + 0.5) + (c % 2) * 0.15, 0.15 + c * 0.3, 0]} m={cols[Math.floor(rnd(seed + c * 7 + k * 3) * 4)]} />;
        }))}
        <Box s={[L, 0.1, th + 0.12]} p={[0, h + 0.05, 0]} m={cols[1]} />
      </group>
    );
  }

  /* ---------- a mid-hill village house for the terraces ---------- */
  function VHouse({ x, z, w = 5, d = 3.4, h = 2.8, r = 0, lit = false, seed = 1, wc, rc, rise = 0.8 }) {
    const M = useM();
    const y = hgt(x, z);
    const wall = M.plain(wc || '#efe9dc', { roughness: 0.9 });
    const slate = M.plain(rc || '#7b776f', { roughness: 0.95 });
    const found = M.plain('#9a9284', { roughness: 1 });
    return (
      <group position={[x, y, z]} rotation={[0, r, 0]}>
        <Box s={[w + 0.3, 1.6, d + 0.3]} p={[0, -0.2, 0]} m={found} />
        <Box s={[w, h, d]} p={[0, 0.6 + h / 2 - 0.5, 0]} m={wall} />
        <Roof2 w={w + 0.6} d={d + 0.8} rise={rise} y={0.6 + h - 0.5} m={slate} />
        <Box s={[0.9, 1.7, 0.08]} p={[-w * 0.2, 0.6 + 0.85 - 0.5, d / 2 + 0.03]} m={M.dark} />
        <Box s={[0.8, 0.7, 0.08]} p={[w * 0.22, 0.6 + 1.5 - 0.5, d / 2 + 0.03]} m={lit ? M.plain('#ffc980', { emissive: '#ffa938', emissiveIntensity: 0.5 }) : M.dark} />
      </group>
    );
  }

  /* ================================ MAIN ================================ */
  function ShirasthanMain() {
    const M = useM();
    const earth = M.plain('#a05a3e', { roughness: 1 });
    const clay = M.plain('#a86040', { roughness: 1 });
    const clayD = M.plain('#93523a', { roughness: 1 });
    const white = M.plain(WHITE, { roughness: 0.9 });
    const dwood = M.plain(DARKW, { roughness: 0.85 });
    const bluep = M.plain(BLUE, { roughness: 0.8 });
    const slate = M.plain('#78746c', { roughness: 0.95 });
    const slabg = M.plain('#a9a39a', { roughness: 1 });
    const darkst = M.plain('#4a4a55', { roughness: 0.95 });
    const stoneW = M.plain('#b9b1a3', { roughness: 1 });
    const soot = M.plain('#14110f', { roughness: 1 });
    const ochrePl = M.plain('#d9aa52', { roughness: 0.95 });
    const yellow = M.plain('#f2c21a', { roughness: 0.9 });
    const iron = M.plain('#2a2a2c', { roughness: 0.6, metalness: 0.6 });
    const blueS = M.plain('#4a78b8', { roughness: 0.9 }), cream = M.plain('#f3ecd8', { roughness: 0.9 });
    const bark = M.plain('#8c6a43', { roughness: 0.9 });

    const MX = 0.9, MZ = 0.7; // mound centre
    const postTop = [MX, 2.9, MZ];

    return (
      <group>
        {/* muted red-brown uneven earth courtyard with small level steps, dark patches, stone edging on all sides */}
        <Box s={[15, 0.12, 12]} p={[-0.2, -0.06, 0]} m={earth} cast={false} />
        <Box s={[5.5, 0.1, 3.2]} p={[5.2, 0.05, -0.4]} m={M.plain('#a9644a', { roughness: 1 })} cast={false} />
        <Box s={[3.6, 0.1, 2.4]} p={[-8.0, 0.05, 1.0]} m={M.plain('#98573c', { roughness: 1 })} cast={false} />
        <Box s={[4.4, 0.1, 2.6]} p={[2.0, 0.05, 4.6]} m={M.plain('#ab6a4c', { roughness: 1 })} cast={false} />
        <Box s={[2.6, 0.02, 1.8]} p={[-1.0, 0.01, 1.8]} m={M.plain('#82462f', { roughness: 1 })} cast={false} />
        <Box s={[3.0, 0.02, 1.4]} p={[6.2, 0.11, 5.0]} m={M.plain('#7e4430', { roughness: 1 })} cast={false} />
        <Box s={[1.8, 0.02, 2.6]} p={[-6.0, 0.01, -0.2]} m={M.plain('#8a4d35', { roughness: 1 })} cast={false} />
        {Array.from({ length: 11 }, (_, i) => (i === 2 || i === 6 || i === 7) ? null : (
          <Box key={i} s={[0.6 + rnd(i) * 0.4, 0.2 + rnd(i + 3) * 0.1, 0.35]} p={[-7.2 + i * 1.3, 0.05, 5.95]} r={[0, (rnd(i + 8) - 0.5) * 0.3, 0]} m={i % 4 === 1 ? clayD : slabg} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (i === 3 || i === 4 || i === 7) ? null : (
          <Box key={'l' + i} s={[0.35, 0.18 + rnd(i + 20) * 0.1, 0.6 + rnd(i + 30) * 0.4]} p={[-7.6, 0.05, -1.9 + i * 0.95]} r={[0, (rnd(i + 5) - 0.5) * 0.3, 0]} m={i % 3 === 1 ? clayD : slabg} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={'b' + i} s={[0.6 + rnd(i + 40) * 0.4, 0.2, 0.35]} p={[0.5 + i * 0.5, 0.05, -2.9]} r={[0, (rnd(i + 8) - 0.5) * 0.3, 0]} m={slabg} />
        ))}

        {/* ---- whitewashed single-storey building (about 9 m), thick timber eave beam, porch with 7 posts ---- */}
        <group>
          <Box s={[9.2, 0.45, 3.9]} p={[-4.6, 0.12, -4.05]} m={stoneW} />
          <Box s={[9.0, 3.2, 3.6]} p={[-4.6, 1.8, -4.2]} m={white} />
          <Box s={[9.1, 0.12, 0.1]} p={[-4.6, 3.12, -2.36]} m={dwood} />
          <Box s={[9.1, 0.12, 0.1]} p={[-4.6, 0.5, -2.37]} m={stoneW} />
          <Box s={[1.0, 1.9, 0.1]} p={[-8.3, 1.45, -2.36]} m={dwood} />
          <Box s={[1.0, 1.9, 0.1]} p={[-0.9, 1.45, -2.36]} m={dwood} />
          <Box s={[1.0, 0.8, 0.1]} p={[-4.8, 1.9, -2.36]} m={dwood} />
          <Box s={[0.8, 0.6, 0.12]} p={[-4.8, 1.9, -2.33]} m={M.plain('#ffc980', { emissive: '#ffa938', emissiveIntensity: 0.8 })} />
          <Box s={[5.2, 0.4, 0.5]} p={[-3.2, 0.2, -1.95]} m={clayD} />
          <Box s={[5.0, 0.07, 0.42]} p={[-3.2, 0.44, -1.95]} m={dwood} />
          {Array.from({ length: 7 }, (_, i) => (
            <Cyl key={i} rt={0.11} rb={0.13} h={3.0} p={[-8.8 + i * 1.4, 1.6, -1.25]} m={dwood} seg={8} />
          ))}
          <Box s={[9.2, 0.35, 0.35]} p={[-4.6, 3.1, -1.25]} m={M.plain('#4a2e1c', { roughness: 0.85 })} />
          {Array.from({ length: 7 }, (_, i) => (
            <Box key={i} s={[0.16, 0.16, 1.3]} p={[-8.8 + i * 1.4, 3.0, -1.9]} m={dwood} />
          ))}
          <Roof2 w={9.8} d={5.9} rise={0.78} y={3.28} p={[-4.6, 0, -3.15]} m={slate} />
          {Array.from({ length: 36 }, (_, i) => (
            <Box key={i} s={[0.26, 0.5 + 0.13 * ((i * 7) % 4), 0.03]} p={[-8.95 + i * 0.25 + 0.125, 3.05 - (0.5 + 0.13 * ((i * 7) % 4)) / 2, -0.62 + 0.02 * (i % 3)]} r={[0.05, 0, (rnd(i + 60) - 0.5) * 0.08]} m={i % 2 ? blueS : cream} cast={false} />
          ))}
          <Box s={[9.0, 0.04, 0.7]} p={[-4.6, 3.18, -0.88]} r={[0.2, 0, 0]} m={cream} cast={false} />
          <Box s={[0.1, 3.3, 3.8]} p={[-9.1, 1.8, -4.1]} m={white} />
          <Box s={[1.8, 1.2, 0.03]} p={[-6.2, 1.2, -2.385]} m={M.plain('#e4dfd2', { roughness: 1 })} />
          <Box s={[1.2, 0.9, 0.03]} p={[-1.6, 2.2, -2.385]} m={M.plain('#dcd5c4', { roughness: 1 })} />
          <Box s={[8.4, 0.1, 0.45]} p={[-4.6, 0.55, -2.15]} m={M.plain('#6b4a2e', { roughness: 0.9 })} />
          {Array.from({ length: 16 }, (_, i) => (
            <Box key={'ov' + i} s={[0.5 + rnd(i + 70) * 0.3, 0.08, 0.2 + rnd(i + 80) * 0.3]} p={[-9.2 + i * 0.6, 3.27 + rnd(i + 90) * 0.06, -0.12 + rnd(i + 80) * 0.1]} r={[0.12, 0, 0]} m={M.plain('#55524b', { roughness: 1 })} />
          ))}
          <pointLight color="#ffb050" intensity={1.2} distance={7} position={[-3.5, 1.8, -1.6]} />
        </group>

        {/* ---- right wing: lower whitewashed block with blue-painted posts ---- */}
        <group>
          <Box s={[4.2, 2.7, 3.0]} p={[5.6, 1.35, -4.5]} m={white} />
          <Box s={[4.2, 0.35, 3.1]} p={[5.6, 0.1, -4.5]} m={stoneW} />
          <Box s={[0.85, 0.75, 0.1]} p={[6.2, 1.75, -2.96]} m={dwood} />
          <Box s={[0.7, 0.55, 0.08]} p={[6.2, 1.75, -2.93]} m={M.plain('#2b2f3a')} />
          <Box s={[0.9, 1.8, 0.1]} p={[4.4, 1.0, -2.96]} m={dwood} />
          {[3.6, 5.1, 6.6, 7.4].map((x, i) => (
            <Cyl key={i} rt={0.09} h={2.55} p={[x, 1.3, -2.35]} m={bluep} seg={8} />
          ))}
          <Box s={[4.4, 0.2, 0.25]} p={[5.6, 2.62, -2.35]} m={bluep} />
          <Box s={[4.7, 0.12, 3.9]} p={[5.6, 2.9, -4.2]} r={[0.1, 0, 0]} m={slate} />
          <Ribbons p={[3.6, 2.0, -2.2]} n={5} h={0.8} seed={11} />
        </group>

        {/* ---- round red-clay sacrificial post mound ---- */}
        <group>
          <Cyl rt={0.75} rb={1.0} h={1.1} p={[MX, 0.55, MZ]} m={clay} seg={22} />
          <Cyl rt={0.8} rb={0.8} h={0.13} p={[MX, 1.17, MZ]} m={slabg} seg={22} />
          <Cyl rt={0.3} rb={0.38} h={0.2} p={[MX, 1.33, MZ]} m={clayD} seg={14} />
          <Cyl rt={0.07} rb={0.08} h={2.3} p={[MX, 2.4, MZ]} m={bark} seg={8} />
          {/* yellow cloth + ribbons on the pole */}
          <Box s={[0.7, 0.8, 0.05]} p={[MX + 0.12, 3.0, MZ + 0.1]} r={[0.1, 0.3, 0.25]} m={yellow} cast={false} />
          <Box s={[0.4, 0.5, 0.05]} p={[MX - 0.22, 2.7, MZ + 0.12]} r={[0, 0.5, -0.3]} m={yellow} cast={false} />
          <Ribbons p={[MX, 2.6, MZ + 0.1]} n={12} h={1.1} spread={0.2} seed={3} />
          {/* two long diagonal wooden props */}
          <Beam a={[MX + 2.6, 0.0, MZ + 0.3]} b={[MX + 0.12, 2.3, MZ]} r={0.05} m={bark} />
          <Beam a={[MX - 1.7, 0.0, MZ + 1.8]} b={[MX - 0.08, 2.1, MZ + 0.08]} r={0.045} m={bark} />
          {/* offerings (red tika) on the slab */}
          <Ball rad={0.07} p={[MX + 0.4, 1.26, MZ + 0.25]} sc={[1, 0.4, 1]} m={M.plain('#b3202a')} />
          <Ball rad={0.06} p={[MX - 0.4, 1.26, MZ - 0.1]} sc={[1, 0.4, 1]} m={M.plain('#f0b429')} />
        </group>

        {/* ---- upright stones in front of the bench ---- */}
        <group>
          <Box s={[0.42, 1.15, 0.3]} p={[-1.7, 0.55, -0.7]} r={[0, 0.2, 0.03]} m={M.plain('#a89478', { roughness: 1 })} />
          <Box s={[0.5, 0.6, 0.32]} p={[-2.7, 0.3, -0.45]} r={[0, -0.15, 0]} m={slabg} />
          <Box s={[0.5, 0.52, 0.3]} p={[-3.4, 0.26, -0.3]} r={[0, 0.1, 0]} m={slabg} />
          <Box s={[0.46, 0.45, 0.3]} p={[-4.1, 0.22, -0.2]} r={[0, 0.25, 0]} m={M.plain('#9b9285', { roughness: 1 })} />
          <Box s={[0.34, 0.8, 0.22]} p={[-0.8, 0.4, -1.0]} r={[0, -0.3, 0.05]} m={M.plain('#8a8174', { roughness: 1 })} />
        </group>

        {/* ---- shelf of old carved stone tablets, in the porch alcove at the left ---- */}
        <group position={[-6.7, 0, -2.0]} scale={0.75}>
          <Box s={[2.0, 0.55, 0.7]} p={[0, 0.27, 0]} m={clay} />
          <Box s={[1.5, 0.4, 0.4]} p={[0, 0.74, -0.12]} m={clay} />
          {[-0.52, 0, 0.52].map((x, i) => (
            <group key={i} position={[x, 0.55, 0.3]} rotation={[-0.1, 0, 0]}>
              <Box s={[0.42, 0.7, 0.07]} p={[0, 0.35, 0]} m={M.plain('#b56e48', { roughness: 1 })} />
              <Ball rad={0.075} p={[0, 0.56, 0.05]} m={M.plain('#9a5a3a', { roughness: 1 })} />
              <Box s={[0.16, 0.3, 0.04]} p={[0, 0.3, 0.05]} m={M.plain('#9a5a3a', { roughness: 1 })} />
              <Box s={[0.05, 0.28, 0.04]} p={[-0.14, 0.3, 0.05]} m={M.plain('#9a5a3a', { roughness: 1 })} />
              <Box s={[0.05, 0.28, 0.04]} p={[0.14, 0.3, 0.05]} m={M.plain('#9a5a3a', { roughness: 1 })} />
              <Ball rad={0.025} p={[0, 0.65, 0.07]} m={M.plain('#c4262e')} />
            </group>
          ))}
          <Box s={[0.34, 0.12, 0.2]} p={[0, 0.96, -0.1]} m={M.plain('#6a5a46')} />
          <Ball rad={0.1} p={[0, 1.1, -0.1]} sc={[1, 1.2, 0.8]} m={M.plain('#7a6a55')} />
          <Box s={[0.6, 0.5, 0.1]} p={[-0.6, 1.05, -0.2]} r={[0, 0, 0.5]} m={darkst} />
          <Box s={[0.5, 0.4, 0.1]} p={[0.6, 1.0, -0.2]} r={[0, 0, -0.5]} m={darkst} />
        </group>

        {/* ---- flame niche in the front wall: dark ochre surround, soot hole, iron rod, bright flame ---- */}
        <group position={[-2.5, 0, -2.3]}>
          <Box s={[1.25, 1.45, 0.05]} p={[0, 1.5, 0]} m={M.plain('#b8862e', { roughness: 0.95 })} />
          <Box s={[0.8, 1.0, 0.12]} p={[0, 1.5, 0.04]} m={soot} />
          <Box s={[0.72, 0.04, 0.1]} p={[0, 1.4, 0.12]} m={iron} />
          <Flame p={[0, 1.05, 0.12]} s={2.2} light={1.8} />
          <Flame p={[0.2, 1.62, 0.12]} s={0.6} blue light={0.1} />
        </group>

        {/* ---- rock-niche flame with ash, rice and flowers (ground level, left front) ---- */}
        <group position={[-2.2, 0, 3.1]} scale={1.3}>
          <Cyl rt={0.6} rb={0.62} h={0.04} p={[0, 0.02, 0]} m={M.plain('#8d8a84', { roughness: 1 })} seg={18} />
          <Cyl rt={0.2} rb={0.24} h={0.06} p={[0, 0.05, 0.02]} m={soot} seg={10} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * 6.283 + 0.3, rr = 0.72 + rnd(i + 50) * 0.25, hh = 0.28 + rnd(i + 60) * 0.3;
            const front = Math.cos(a) > 0.2 && Math.sin(a) > 0;
            return <Box key={i} s={[0.4 + rnd(i + 55) * 0.35, hh * (front ? 0.6 : 1), 0.35 + rnd(i + 58) * 0.3]} p={[Math.sin(a) * rr, hh * 0.4, -Math.cos(a) * rr * 0.9 - 0.1]} r={[(rnd(i + 61) - 0.5) * 0.5, a + rnd(i) * 2, (rnd(i + 63) - 0.5) * 0.5]} m={M.plain(['#8b867c', '#7a756c', '#6f6a62', '#9a948a'][i % 4], { roughness: 1 })} />;
          })}
          <Box s={[0.35, 0.3, 0.3]} p={[0.3, 0.7, -0.5]} r={[0.3, 0.6, 0.2]} m={M.plain('#85807a', { roughness: 1 })} />
          <Flame p={[0, 0.06, 0]} s={2.4} light={3} />
          {Array.from({ length: 22 }, (_, i) => (
            <Ball key={i} rad={0.045} p={[(rnd(i) - 0.5) * 1.1, 0.07, (rnd(i + 9) - 0.5) * 1.1]} sc={[1, 0.35, 1]} m={i % 3 === 0 ? M.plain('#d4281f') : i % 3 === 1 ? M.plain('#f3b81c') : M.plain('#ece7da')} />
          ))}
        </group>

        {/* ---- heaps of slate stones with two millstone discs, banana and bamboo behind (left front) ---- */}
        <group position={[-6.6, 0, 3.4]}>
          <Slabs p={[0, 0, 0]} n={9} w={1.1} seed={5} />
          <Slabs p={[1.3, 0, -0.2]} n={5} w={0.8} seed={9} />
          <Cyl rt={0.5} rb={0.5} h={0.12} p={[0.6, 0.08, 1.0]} r={[0.1, 0, 0]} m={M.plain('#77736c', { roughness: 1 })} seg={14} />
          <Cyl rt={0.45} rb={0.45} h={0.12} p={[1.55, 0.08, 0.9]} r={[0.05, 0, 0]} m={M.plain('#6e6a63', { roughness: 1 })} seg={14} />
          <Ribbons p={[0, 0.9, -0.2]} n={4} h={0.6} seed={21} />
          <Banana p={[-0.6, 0, -1.4]} s={0.9} seed={2} />
        </group>

        {/* ---- second platform: low red-clay and slate base with a ribbon post ---- */}
        <group position={[4.9, 0, 2.2]}>
          <Box s={[2.1, 0.55, 1.4]} p={[0, 0.27, 0]} m={clay} />
          {Array.from({ length: 3 }, (_, i) => (
            <Box key={i} s={[2.2 - i * 0.05, 0.12, 1.5]} p={[0, 0.6 + i * 0.13, 0]} r={[0, (i - 1) * 0.04, 0]} m={i % 2 ? slabg : M.plain('#c08158', { roughness: 1 })} />
          ))}
          <Ball rad={0.35} p={[-0.55, 1.15, 0]} sc={[1.3, 0.8, 1]} m={M.plain('#4f8f3b', { roughness: 0.9 })} />
          <Ball rad={0.09} p={[-0.4, 1.35, 0.1]} m={M.plain('#d94a8c')} />
          <Ball rad={0.09} p={[-0.7, 1.32, -0.1]} m={M.plain('#d94a8c')} />
          <Cyl rt={0.04} rb={0.05} h={2.6} p={[1.9, 1.3, 1.0]} m={bark} seg={6} />
          <Ribbons p={[1.9, 2.5, 1.0]} n={9} h={1.2} spread={0.2} seed={7} />
          <Beam a={[0.7, 0.8, 0.2]} b={[1.9, 2.0, 1.0]} r={0.025} m={bark} />
        </group>
        {/* stone basin with water */}
        <Cyl rt={0.5} rb={0.52} h={0.14} p={[3.3, 0.07, 4.5]} m={M.plain('#6a6d70', { roughness: 0.95 })} seg={16} />
        <Cyl rt={0.4} rb={0.4} h={0.02} p={[3.3, 0.145, 4.5]} m={M.plain('#9db8c8', { roughness: 0.2, metalness: 0.1 })} seg={16} />

        {/* ---- dry-stone boundary wall on the right, canna lilies, banana and bamboo ---- */}
        <Box s={[0.7, 1.05, 10.2]} p={[8.1, 0.5, 0.2]} m={M.plain('#a49d90', { roughness: 1 })} />
        <Box s={[0.8, 0.12, 10.3]} p={[8.1, 1.08, 0.2]} m={slabg} />
        <Box s={[6, 1.7, 0.8]} p={[10.5, 0.8, -6.6]} m={M.plain('#a49d90', { roughness: 1 })} />
        <Canna p={[8.9, 1.0, 1.2]} n={7} seed={3} />
        <Canna p={[9.0, 1.0, 3.4]} n={6} seed={8} />
        <Canna p={[8.9, 1.0, -1.0]} n={5} seed={12} />
        <Bamboo p={[9.5, 0, -4.5]} n={9} h={5} seed={4} />
        <Banana p={[8.6, 0, -2.2]} s={1.0} seed={5} />
        <Banana p={[9.7, 0, 4.9]} s={0.8} seed={6} />
        <Ribbons p={[8.1, 2.2, 0.4]} n={0} />

        {/* ---- people for scale ---- */}
        <Person p={[-3.4, 0.46, -1.92]} r={[0, 0.5, 0]} seated shirt="#d9d2c0" pants="#8a7a64" />
        <Person p={[6.0, 0, 3.4]} r={[0, 2.6, 0]} shirt="#7c8794" />
        <Person p={[2.7, 0, -0.9]} r={[0, 0.8, 0]} shirt="#a43b3b" pants="#2c3040" />

        <Frame s={[16.5, 4.8, 12]} p={[-0.3, 2.0, -0.2]} />
      </group>
    );
  }

  /* ================================ ENV ================================ */
  function ShirasthanEnv() {
    const M = useM();
    const slate = M.plain('#7b776f', { roughness: 0.95 });
    const stone = M.plain('#857a6a', { roughness: 1 });
    const bankM = M.plain('#bdb7a6', { roughness: 1 });
    const whiteM = M.plain('#efe9dc', { roughness: 0.9 });
    const redp = M.plain('#a8603f', { roughness: 1 });
    const dwood = M.plain(DARKW, { roughness: 0.85 });
    const water = M.plain('#6aa1bd', { roughness: 0.15, metalness: 0.15 });

    const houses = [
      [-14, -17, 5.2, 3.4, 0.1, true], [-3, -21.5, 4.6, 3.2, -0.05, false], [10, -22, 5, 3.4, 0.15, true], [24, -17, 4.4, 3, -0.2, false],
      [-26, -23, 5.4, 3.5, 0.2, false], [0, -33, 5.5, 3.6, 0.05, true], [16, -34, 4.8, 3.2, -0.1, false], [-18, -35, 5, 3.4, 0.12, false],
      [30, -30, 4.6, 3.2, 0.3, false], [-34, -14, 4.4, 3, -0.3, false],
    ];
    const ky = hgt(-14.5, 3);
    const HC = ['#efe9dc', '#d9aa62', '#a8a193', '#e6d4b4', '#8f8a7e', '#c9703f'];
    const RC = ['#7b776f', '#5d5a56', '#8a6a4a', '#6a6f72'];

    return (
      <group>
        <Terrain />
        {/* the Shirasthan stream in the valley below */}
        <Box s={[150, 0.1, 9]} p={[0, -6.38, 26]} m={bankM} cast={false} />
        <Box s={[150, 0.1, 4.2]} p={[0, -6.33, 26.5]} m={water} cast={false} />
        <Box s={[150, 0.05, 0.7]} p={[0, -6.28, 25.0]} m={M.plain('#f2f6f8', { roughness: 0.5 })} cast={false} />
        <Box s={[150, 0.05, 0.5]} p={[0, -6.28, 27.8]} m={M.plain('#e6eef2', { roughness: 0.5 })} cast={false} />
        {Array.from({ length: 22 }, (_, i) => (
          <Ball key={i} rad={0.45 + rnd(i) * 0.6} p={[-34 + i * 3.1 + rnd(i + 3) * 2, -6.15, 23.6 + rnd(i + 7) * 5.5]} sc={[1.2, 0.6, 1]} m={M.plain(i % 3 ? '#8d887e' : '#a29c90', { roughness: 1 })} />
        ))}
        {/* stone risers of the terraces on the front slope */}
        {Array.from({ length: 4 }, (_, k) => (
          <Box key={'fr' + k} s={[32, 1.75, 0.5]} p={[0, -0.12 - 1.6 * k - 0.8, 9 + 3.5 * (k + 0.93)]} m={stone} />
        ))}
        {/* terraced fields' stone risers on the hillside behind */}
        {Array.from({ length: 5 }, (_, k) => (
          <Box key={k} s={[60, 2.0, 0.7]} p={[0, -0.12 + k * 1.6 + 0.9 + (k + 1) * 0.55, -9 - (k + 1) * 5.5 + 0.75]} m={stone} />
        ))}
        {/* dry-stone retaining walls behind and to the right of the courtyard */}
        <StoneWall x0={-16} z0={-7.6} x1={15} z1={-7.6} h={1.5} th={0.8} seed={3} />
        <StoneWall x0={12} z0={-7.6} x1={12} z1={7} h={1.5} th={0.8} seed={9} />
        <StoneWall x0={-16} z0={-7.6} x1={-16} z1={-1} h={1.2} th={0.7} seed={14} />
        {/* village houses on the terraces */}
        {houses.map((h, i) => <VHouse key={i} x={h[0]} z={h[1]} w={h[2]} d={h[3]} r={h[4]} lit={h[5]} seed={i + 2} wc={HC[i % HC.length]} rc={RC[(i * 3) % RC.length]} rise={0.45 + (i % 4) * 0.3} />)}

        {/* Kal Bhairav shrine, Shivling and dharamshala to the left of the courtyard */}
        <group position={[-14.5, ky, 3.0]}>
          <Box s={[2.4, 0.5, 2.2]} p={[0, 0.1, 0]} m={stone} />
          <Box s={[1.7, 1.5, 1.5]} p={[0, 1.1, 0]} m={M.plain('#c9703f', { roughness: 0.95 })} />
          <Box s={[0.7, 1.0, 0.08]} p={[0, 0.9, 0.78]} m={M.plain('#1a1512')} />
          <Roof2 w={2.3} d={2.2} rise={0.5} y={1.85} m={slate} />
          <Cyl rt={0.03} h={1.4} p={[0.8, 2.9, 0.7]} m={M.plain('#2a2a2c', { metalness: 0.6 })} seg={5} />
          <Box s={[0.4, 0.04, 0.04]} p={[0.8, 3.45, 0.7]} m={M.plain('#2a2a2c')} />
          <Ribbons p={[-0.8, 1.7, 1.0]} n={5} h={0.5} seed={31} />
        </group>
        <group position={[-12.0, hgt(-12, 7.5), 7.5]}>
          <Cyl rt={0.9} rb={1.0} h={0.35} p={[0, 0.17, 0]} m={stone} seg={14} />
          <Cyl rt={0.28} rb={0.3} h={0.55} p={[0, 0.62, 0]} m={M.plain('#2f2f33', { roughness: 0.6 })} seg={14} />
          <Ball rad={0.28} p={[0, 0.9, 0]} m={M.plain('#2f2f33', { roughness: 0.6 })} />
          <Ribbons p={[0.9, 1.0, 0]} n={3} h={0.4} seed={41} />
        </group>
        <group position={[-22, hgt(-22, -3), -3]}>
          <Box s={[10.5, 0.5, 4.2]} p={[0, 0.0, 0]} m={stone} />
          <Box s={[10, 2.6, 3.4]} p={[0, 1.5, -0.2]} m={whiteM} />
          <Roof2 w={11} d={4.8} rise={0.8} y={2.8} p={[0, 0, 0]} m={slate} />
          {[-4.2, -1.4, 1.4, 4.2].map((x, i) => <Cyl key={i} rt={0.1} h={2.6} p={[x, 1.5, 1.65]} m={dwood} seg={6} />)}
          {[-3.4, 0, 3.4].map((x, i) => <Box key={i} s={[0.9, 1.6, 0.08]} p={[x, 1.1, 1.53]} m={dwood} />)}
          <Box s={[0.7, 0.55, 0.08]} p={[-1.7, 1.9, 1.53]} m={M.plain('#ffc980', { emissive: '#ffa938', emissiveIntensity: 0.55 })} />
        </group>

        {/* red-earth footpaths */}
        <Box s={[4.6, 0.06, 1.0]} p={[-9.6, -0.08, 5.2]} r={[0, 0.25, 0]} m={redp} cast={false} />
        <Box s={[2.4, 0.06, 0.55]} p={[-12.6, -0.08, 5.6]} r={[0, 0.25, 0]} m={redp} cast={false} />
        <Box s={[0.9, 0.06, 3.4]} p={[-7.8, -0.08, 8.0]} r={[0, 0.2, 0]} m={redp} cast={false} />
        <Box s={[0.5, 0.06, 1.6]} p={[-7.5, -0.08, 10.3]} r={[0, 0.2, 0]} m={redp} cast={false} />
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} s={[1.6, 0.35, 0.8]} p={[10.5, hgt(10.5, -9.6 - i * 1.5) + 0.1, -9.6 - i * 1.5]} m={stone} />
        ))}

        {/* vegetation: trees on slopes and around the plateau */}
        {[[-11, -9], [-30, 6], [30, -8], [-24, -12], [6, -27], [-8, -28], [22, -27], [-40, -26], [38, -22], [-14, -41], [14, -42], [-5, 42], [20, 40]]
          .map((q, i) => <TreeS key={i} p={[q[0], hgt(q[0], q[1]) - 0.1, q[1]]} s={0.9 + rnd(i) * 0.8} c={i % 3 ? '#4f8c3a' : '#5f9a3c'} seed={i} />)}
        <Banana p={[-9.5, 0, 6.8]} s={0.9} seed={9} />
        <Bamboo p={[-10.5, hgt(-10.5, -8), -8.5]} n={8} h={5.5} seed={9} />
        <Bamboo p={[13, hgt(13, -9), -9]} n={7} h={5} seed={13} />

        {/* people on the terraces behind */}
        <Person p={[-9, hgt(-9, -10.5), -10.5]} shirt="#c4622d" pants="#2c3040" />
        <Person p={[16, hgt(16, -11), -11]} r={[0, 2, 0]} shirt="#4d7a5b" />
      </group>
    );
  }

  return { 'shirasthan-dullu': { Main: ShirasthanMain, Env: ShirasthanEnv } };
}
