// Kalika Bhagawati Temple, Baglung: a stout red-brick three-roofed pagoda standing free in a big level pale-grey paved courtyard
// inside a tall sal forest. Very wide dark-metal lowest roof over an open pillared ambulatory, gabled lit porch on the front (+z),
// yellow/orange cloth valances under each eave, small crowning cupola with one window and a slender gilded pinnacle.
// Env: four cardinal pink/salmon gateways (olive roofs, pinnacle cupola, arched wings, dark lions), scattered small red shrines, a low
// red building with teal metal roof on the right, the zig-zag stone wall, blue puja stalls on the approach lane, festival cloth strung
// between trees, tall forest all round, forested hills far off. No snow peaks, no town, no river.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Lion, Frame, Diyo, THREE, useMemo, useRef, useEffect } = K;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const RED = '#a8322a', YEL = '#e6b422', ORA = '#d96a1e', GOLDC = '#c9a23a', WOODC = '#5b4636';
  const W1 = 6.4;
  // roof tiers: width, eave height, rise
  const T = [{ w: W1, e: 1.55, h: 1.1 }, { w: 3.7, e: 3.2, h: 0.8 }, { w: 2.56, e: 4.75, h: 0.6 }, { w: 1.6, e: 5.4, h: 0.4 }];
  const SAG = 1.25, LIFT = 0.16;
  const roofY = (t, x, z) => {
    const ax = Math.abs(x) / (t.w / 2), az = Math.abs(z) / (t.w / 2);
    const s = Math.min(1, Math.max(ax, az));
    return t.e + t.h * (1 - s) ** SAG + LIFT * t.h * (ax * az) ** 2.4;
  };

  const Glow = ({ s, p, c = '#ffcf86' }) => <mesh position={p}><boxGeometry args={s} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>;

  function Prism({ w, h, d, m, p, r }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
      g.translate(0, 0, -d / 2);
      return g;
    }, [w, h, d]);
    return <mesh geometry={geo} material={m} position={p} rotation={r} castShadow receiveShadow />;
  }

  /* ---------- the pagoda ---------- */
  function Valance({ w, e, wide = 1, thin = false }) {
    const M = useM();
    const y = M.plain(YEL, { roughness: 0.9 }), o = M.plain(ORA, { roughness: 0.9 }), rd = M.plain('#b5271f', { roughness: 0.9 });
    const hw = w / 2 - 0.06;
    if (thin) {
      return (
        <group>
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rot) => (
            <group key={rot} rotation={[0, rot, 0]}>
              <Box s={[(w - 0.1) * wide, 0.06, 0.04]} p={[0, e - 0.05, hw]} m={y} cast={false} />
            </group>
          ))}
        </group>
      );
    }
    return (
      <group>
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((rot) => (
          <group key={rot} rotation={[0, rot, 0]}>
            <Box s={[(w - 0.2) * wide, 0.13, 0.04]} p={[0, e - 0.1, hw]} m={y} cast={false} />
            <Box s={[(w - 0.2) * wide, 0.09, 0.04]} p={[0, e - 0.22, hw]} m={o} cast={false} />
            <Box s={[(w - 0.2) * wide, 0.05, 0.045]} p={[0, e - 0.3, hw]} m={rd} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function Pigeon({ p, ry }) {
    const M = useM();
    const g = M.plain('#4f5359', { roughness: 0.9 });
    return (
      <group position={p} rotation={[0, ry, 0]} scale={1.6}>
        <Ball rad={0.065} sc={[0.9, 0.85, 1.5]} p={[0, 0.06, 0]} m={g} />
        <Ball rad={0.04} sc={[0.8, 0.7, 0.8]} p={[0, 0.05, 0.05]} m={M.plain('#c9ccd0')} />
        <Ball rad={0.04} p={[0, 0.11, 0.09]} m={M.plain('#3a3d42')} />
      </group>
    );
  }

  function PagodaMain() {
    const M = useM();
    const brick = (w, h) => M.mat('brick', w / 1.6, h / 1.6, { color: '#ff9a82', emissive: '#7a2214', emissiveIntensity: 0.6 });
    const ribTex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#666c6a'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 16; i += 1) { g.fillStyle = i % 2 ? '#7a807e' : '#4d5351'; g.fillRect(i * 8, 0, 4, 128); g.fillStyle = '#3a3f3d'; g.fillRect(i * 8, 0, 1, 128); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    }, []);
    const metal = useMemo(() => new THREE.MeshStandardMaterial({ map: ribTex, roughness: 0.5, metalness: 0.45, side: THREE.DoubleSide }), [ribTex]);
    const beam = M.plain(WOODC, { roughness: 0.85 });
    const cream = M.plain('#e9dfc4');
    const slab = M.mat('stone', 3, 3, { color: '#cfcdc6' });
    const orange = M.plain('#e08a1e', { roughness: 0.7 });
    const gold = M.gold;
    const darkM = M.plain('#1d1512');
    const pillarM = M.mat('brick', 0.2, 0.8, { color: '#ff8c74', emissive: '#6a1c10', emissiveIntensity: 0.55 });

    const pillars = useMemo(() => {
      const out = []; const h = 2.55;
      [-2.55, -1.275, 0, 1.275, 2.55].forEach((v) => { out.push([v, -h]); if (Math.abs(v) < 2.6) out.push([v, h]); });
      [-1.275, 0, 1.275].forEach((v) => { out.push([-h, v]); out.push([h, v]); });
      return out.filter(([x, z]) => !(z > 2 && Math.abs(x) < 0.4));
    }, []);

    const pigeons = useMemo(() => {
      const r = rng(7); const out = [];
      const ridge = (tt, list) => list.forEach(([sx, sz, t]) => { const x = sx * t, z = sz * t; out.push({ p: [x, roofY(tt, x, z) + 0.01, z], ry: Math.atan2(sx, sz) + (r() - 0.5) * 0.6 }); });
      ridge(T[0], [[1, 1, 1.9], [1, 1, 2.2], [1, 1, 2.5], [-1, 1, 2.0], [-1, 1, 2.3], [1, -1, 2.1], [1, -1, 2.4], [-1, -1, 2.0], [-1, -1, 2.3], [-1, -1, 2.6]]);
      ridge(T[1], [[1, 1, 1.0], [1, 1, 1.2], [-1, 1, 1.1], [-1, -1, 1.1]]);
      return out;
    }, []);

    const WIN = (y, w3) => ([[0, w3 / 2 + 0.01, 0], [Math.PI / 2, 0, 0], [Math.PI, 0, 0], [-Math.PI / 2, 0, 0]].map((_, i) => {
      const rot = [0, Math.PI / 2, Math.PI, -Math.PI / 2][i];
      return (
        <group key={i} rotation={[0, rot, 0]}>
          <Box s={[0.5, 0.44, 0.05]} p={[0, y, w3 / 2 + 0.01]} m={cream} cast={false} />
          <Box s={[0.38, 0.32, 0.06]} p={[0, y, w3 / 2 + 0.02]} m={darkM} cast={false} />
          {[-0.09, 0, 0.09].map((x) => <Box key={x} s={[0.02, 0.32, 0.07]} p={[x, y, w3 / 2 + 0.025]} m={beam} cast={false} />)}
        </group>
      );
    }));

    const e1 = T[0].e;
    return (
      <group>
        <pointLight position={[0, 1.0, 1.8]} intensity={4} distance={8} color="#ffb08a" />
        <pointLight position={[0, 1.0, -1.8]} intensity={1.2} distance={6} color="#ffb08a" />
        {/* single low plinth */}
        <Box s={[5.7, 0.22, 5.7]} p={[0, 0.11, 0]} m={slab} />
        <Box s={[5.82, 0.08, 5.82]} p={[0, 0.04, 0]} m={M.plain('#9a978f')} />
        {/* sanctum */}
        <Box s={[3.0, e1 - 0.2, 3.0]} p={[0, 0.2 + (e1 - 0.2) / 2, 0]} m={brick(3, 1.4)} />
        {[0.55, 1.15].map((y) => <Box key={y} s={[3.06, 0.07, 3.06]} p={[0, y, 0]} m={beam} cast={false} />)}
        {/* door, lintel, gilded flanking panels */}
        <Box s={[1.05, 1.1, 0.06]} p={[0, 0.78, 1.52]} m={darkM} cast={false} />
        <Box s={[1.4, 0.16, 0.1]} p={[0, 1.4, 1.53]} m={orange} cast={false} />
        <Box s={[1.2, 0.05, 0.12]} p={[0, 1.27, 1.54]} m={gold} cast={false} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.45, 0.8, 0.05]} p={[k * 0.95, 0.85, 1.52]} m={gold} cast={false} />
            <Box s={[0.28, 0.6, 0.06]} p={[k * 0.95, 0.82, 1.53]} m={M.plain('#6a2a18')} cast={false} />
            <Cyl rt={0.14} h={0.06} p={[k * 0.95, 1.25, 1.53]} r={[Math.PI / 2, 0, 0]} m={gold} seg={12} />
          </group>
        ))}
        <Glow s={[0.5, 0.35, 0.02]} p={[0, 0.7, 1.56]} c="#ffb24a" />
        {/* ambulatory pillars, beam ring, ceiling */}
        {pillars.map(([x, z], i) => <Box key={i} s={[0.3, e1 - 0.2, 0.3]} p={[x, 0.2 + (e1 - 0.2) / 2, z]} m={pillarM} />)}
        <Box s={[5.5, 0.16, 0.22]} p={[0, e1 - 0.1, 2.55]} m={beam} />
        <Box s={[5.5, 0.16, 0.22]} p={[0, e1 - 0.1, -2.55]} m={beam} />
        <Box s={[0.22, 0.16, 5.5]} p={[2.55, e1 - 0.1, 0]} m={beam} />
        <Box s={[0.22, 0.16, 5.5]} p={[-2.55, e1 - 0.1, 0]} m={beam} />
        <Box s={[W1 - 0.1, 0.05, W1 - 0.1]} p={[0, e1 - 0.04, 0]} m={M.plain('#6a4a3a')} cast={false} />
        {[[-2.2, 2.3], [-0.9, 2.3], [0.9, 2.3], [2.2, 2.3], [-2.3, -0.5], [2.3, -0.5]].map(([x, z], i) => <Glow key={'ln' + i} s={[0.16, 0.2, 0.16]} p={[x, e1 - 0.3, z]} c="#ffc566" />)}
        {/* offering rail and lamps */}
        <Box s={[3.6, 0.06, 0.08]} p={[0, 0.72, 2.3]} m={beam} />
        <Box s={[3.6, 0.05, 0.06]} p={[0, 0.45, 2.3]} m={beam} />
        {[-1.8, -0.9, 0.9, 1.8].map((x) => <Box key={x} s={[0.07, 0.75, 0.07]} p={[x, 0.37, 2.3]} m={beam} />)}
        {[-1.6, -1.2, -0.8, 0.8, 1.2, 1.6].map((x) => <Glow key={x} s={[0.07, 0.07, 0.07]} p={[x, 0.78, 2.3]} c="#ffcf7a" />)}

        {/* roof 1 + gabled porch */}
        <Roof w={T[0].w} d={T[0].w} h={T[0].h} y={T[0].e} m={metal} sag={SAG} lift={LIFT} fascia={false} />
        <Valance w={T[0].w} e={T[0].e} />
        <group position={[0, e1 - 0.12, 2.35]}>
          <Prism w={2.7} h={1.0} d={2.5} m={metal} p={[0, 0, 0]} />
          <Prism w={2.3} h={0.82} d={0.06} m={M.plain('#d98a1c')} p={[0, 0, 1.27]} />
          <Prism w={1.5} h={0.5} d={0.07} m={M.plain('#7a2118')} p={[0, 0.02, 1.28]} />
          <Box s={[2.7, 0.1, 0.05]} p={[0, -0.04, 1.26]} m={M.plain(YEL)} cast={false} />
          <Box s={[2.7, 0.08, 0.05]} p={[0, -0.13, 1.26]} m={M.plain(ORA)} cast={false} />
          <Ball rad={0.1} p={[0, 0.08, 1.2]} m={M.plain('#ffd460', { emissive: '#ffb020', emissiveIntensity: 1.6 })} />
          <pointLight position={[0, -0.1, 1.2]} intensity={3.5} distance={7} color="#ffb347" />
        </group>
        {[-0.95, 0.95].map((x) => <Box key={x} s={[0.2, e1 - 0.35, 0.2]} p={[x, 0.2 + (e1 - 0.35) / 2, 3.45]} m={beam} />)}

        {/* storey 2 */}
        <Box s={[2.5, 1.9, 2.5]} p={[0, 1.3 + 0.95, 0]} m={brick(2.5, 1.9)} />
        <Box s={[2.58, 0.07, 2.58]} p={[0, 2.6, 0]} m={beam} cast={false} />
        {WIN(2.25, 2.5)}
        <Roof w={T[1].w} d={T[1].w} h={T[1].h} y={T[1].e} m={metal} sag={SAG} lift={LIFT} fascia={false} />
        <Box s={[T[1].w - 0.1, 0.05, T[1].w - 0.1]} p={[0, T[1].e - 0.04, 0]} m={M.plain('#3b2a20')} cast={false} />
        <Valance w={T[1].w} e={T[1].e} />
        {/* storey 3 */}
        <Box s={[1.95, 1.6, 1.95]} p={[0, 3.1 + 0.8, 0]} m={brick(1.95, 1.6)} />
        <Box s={[2.03, 0.07, 2.03]} p={[0, 4.0, 0]} m={beam} cast={false} />
        {WIN(3.95, 1.95)}
        <Roof w={T[2].w} d={T[2].w} h={T[2].h} y={T[2].e} m={metal} sag={SAG} lift={LIFT} fascia={false} />
        <Box s={[T[2].w - 0.1, 0.05, T[2].w - 0.1]} p={[0, T[2].e - 0.04, 0]} m={M.plain('#3b2a20')} cast={false} />
        <Valance w={T[2].w} e={T[2].e} thin />
        {/* crowning cupola */}
        <Box s={[1.15, 1.0, 1.15]} p={[0, 4.6 + 0.5, 0]} m={brick(1.15, 1.0)} />
        <Box s={[0.38, 0.38, 0.05]} p={[0, 5.0, 0.58]} m={cream} cast={false} />
        <Box s={[0.28, 0.28, 0.06]} p={[0, 5.0, 0.59]} m={darkM} cast={false} />
        <Glow s={[0.22, 0.22, 0.02]} p={[0, 5.0, 0.63]} c="#ffcf86" />
        <Roof w={T[3].w} d={T[3].w} h={T[3].h} y={T[3].e} m={metal} sag={SAG} lift={LIFT} fascia={false} />
        <Valance w={T[3].w} e={T[3].e} wide={1} thin />
        <group position={[0, 5.72, 0]}>
          <Cyl rt={0.1} rb={0.15} h={0.12} p={[0, 0.06, 0]} m={gold} seg={12} />
          <Ball rad={0.13} p={[0, 0.2, 0]} m={gold} />
          <Cyl rt={0.02} rb={0.03} h={0.95} p={[0, 0.65, 0]} m={gold} seg={8} />
          <mesh position={[0, 1.2, 0]} material={gold}><coneGeometry args={[0.045, 0.2, 8]} /></mesh>
          <Box s={[0.28, 0.14, 0.01]} p={[0.15, 0.95, 0]} m={M.plain('#c0392b')} cast={false} />
        </group>

        {/* pigeons on the ridges */}
        {pigeons.map((q, i) => <Pigeon key={i} p={q.p} ry={q.ry} />)}

        {/* puja / fire platform with orange rim in front of the door */}
        <group position={[0, 0, 4.15]}>
          <Box s={[1.9, 0.3, 1.15]} p={[0, 0.15, 0]} m={M.plain('#e9dfc4')} />
          <Box s={[2.0, 0.07, 1.25]} p={[0, 0.32, 0]} m={orange} />
          <Box s={[1.5, 0.05, 0.8]} p={[0, 0.37, 0]} m={M.plain('#8a1f18')} cast={false} />
          {[-0.5, -0.15, 0.2, 0.55].map((x, i) => <Ball key={i} rad={0.07} sc={[1, 0.6, 1]} p={[x, 0.42, i % 2 ? 0.15 : -0.1]} m={M.plain(i % 2 ? '#f2a31c' : '#e45a1b')} />)}
          <Glow s={[0.1, 0.1, 0.1]} p={[0.1, 0.46, 0.0]} c="#ffcf7a" />
          <pointLight position={[0, 0.8, 0]} intensity={1.4} distance={4} color="#ffb35a" />
        </group>
        <Frame s={[7.0, 6.9, 8.0]} p={[0, 3.45, 0.7]} />
      </group>
    );
  }

  /* ---------- gateway ---------- */
  function Gate({ p, r, s = 1 }) {
    const M = useM();
    const pink = M.plain('#d9967f', { roughness: 0.9 });
    const olive = M.plain('#b8a84a', { roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide });
    const red = M.plain('#c0392b');
    const cream = M.plain('#efe6cf');
    const dark = M.plain('#241c18');
    const lionM = M.plain('#2a2420', { roughness: 0.6 });
    const ped = M.plain('#b9a190');
    const pyr = (hw, hd, h, y, k) => (
      <group position={[0, y, 0]} scale={[1, 1, hd / hw]}>
        <mesh rotation={[0, Math.PI / 4, 0]} material={olive} castShadow key={k}><coneGeometry args={[hw * 1.4142, h, 4]} /></mesh>
      </group>
    );
    return (
      <group position={p} rotation={[0, r || 0, 0]} scale={s}>
        {[-1, 1].map((k) => <Box key={k} s={[0.6, 2.3, 0.8]} p={[k * 0.85, 1.15, 0]} m={pink} />)}
        <Box s={[2.3, 0.42, 0.8]} p={[0, 2.25, 0]} m={pink} />
        <Box s={[2.5, 0.08, 0.9]} p={[0, 2.06, 0]} m={cream} cast={false} />
        <Roof w={3.5} d={1.5} h={0.55} y={2.46} m={olive} sag={1.1} lift={0.05} fascia={false} />
        <Box s={[3.5, 0.16, 0.06]} p={[0, 2.42, 0.75]} m={red} cast={false} />
        <Box s={[3.5, 0.16, 0.06]} p={[0, 2.42, -0.75]} m={red} cast={false} />
        <Box s={[0.06, 0.16, 1.5]} p={[1.75, 2.42, 0]} m={red} cast={false} />
        <Box s={[0.06, 0.16, 1.5]} p={[-1.75, 2.42, 0]} m={red} cast={false} />
        <Box s={[2.3, 0.4, 0.04]} p={[0, 2.22, 0.42]} m={M.plain('#e8d36a')} cast={false} />
        {[-0.45, 0.45].map((x) => <Box key={x} s={[0.7, 0.07, 0.05]} p={[x, 2.22, 0.45]} m={M.plain('#5a3a18')} cast={false} />)}
        {/* hanging yellow-green name-board across the opening, with flag strings */}
        <Box s={[2.2, 0.35, 0.03]} p={[0, 1.9, 0.44]} m={M.plain('#c5cf4e', { roughness: 0.9 })} cast={false} />
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => <Box key={x} s={[0.26, 0.07, 0.035]} p={[x, 1.93, 0.46]} m={M.plain('#6a1a14')} cast={false} />)}
        {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => <Box key={x} s={[0.22, 0.28, 0.02]} p={[x, 1.58 - (i % 2) * 0.05, 0.45]} m={M.plain(i % 2 ? '#e0a020' : '#a8281e')} cast={false} />)}
        {/* two-stage pinnacle cupola */}
        <Box s={[0.8, 0.45, 0.8]} p={[0, 3.0, 0]} m={cream} />
        <Box s={[0.3, 0.2, 0.04]} p={[0, 3.0, 0.41]} m={red} cast={false} />
        <Roof w={1.1} d={1.1} h={0.28} y={3.22} m={olive} sag={1.1} lift={0.05} fascia={false} />
        <Box s={[0.45, 0.4, 0.45]} p={[0, 3.67, 0]} m={cream} />
        <Box s={[0.46, 0.08, 0.46]} p={[0, 3.52, 0]} m={red} />
        <Roof w={0.7} d={0.7} h={0.22} y={3.87} m={olive} sag={1.1} lift={0.05} fascia={false} />
        <mesh position={[0, 4.25, 0]} material={M.gold}><coneGeometry args={[0.04, 0.26, 8]} /></mesh>
        {/* arched wings */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.0, 0, 0]}>
            <Box s={[1.7, 1.5, 1.0]} p={[0, 0.75, 0]} m={pink} />
            {[0.51, -0.51].map((z) => (
              <group key={z}>
                <Box s={[0.8, 0.85, 0.04]} p={[0, 0.45, z]} m={dark} cast={false} />
                <Cyl rt={0.4} h={0.04} p={[0, 0.88, z]} r={[Math.PI / 2, 0, 0]} m={dark} seg={14} />
                <Box s={[1.0, 0.05, 0.05]} p={[0, 0.03, z]} m={cream} cast={false} />
              </group>
            ))}
            <Box s={[2.0, 0.09, 1.3]} p={[0, 1.52, 0]} m={red} cast={false} />
            {pyr(1.0, 0.65, 0.6, 1.82, k)}
          </group>
        ))}
        {/* dark lions on pedestals */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.45, 0, 1.0]}>
            <Box s={[0.5, 0.5, 0.55]} p={[0, 0.25, 0]} m={ped} />
            <group position={[0, 0.5, 0]} scale={1.3}><Lion m={lionM} /></group>
          </group>
        ))}
      </group>
    );
  }

  /* ---------- small red shrine ---------- */
  function Shrine({ p, r, s = 1 }) {
    const M = useM();
    const metal = M.plain('#4b514f', { roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide });
    const brick = M.mat('brick', 0.5, 0.5, { color: '#e49a8c' });
    return (
      <group position={p} rotation={[0, r || 0, 0]} scale={s}>
        <Box s={[1.1, 0.14, 1.1]} p={[0, 0.07, 0]} m={M.plain('#bdbab2')} />
        <Box s={[0.7, 0.55, 0.7]} p={[0, 0.41, 0]} m={brick} />
        <Box s={[0.28, 0.35, 0.04]} p={[0, 0.34, 0.36]} m={M.plain('#1d1512')} cast={false} />
        <Roof w={1.25} d={1.25} h={0.36} y={0.7} m={metal} sag={1.2} lift={0.12} fascia={false} />
        <Box s={[1.1, 0.07, 0.03]} p={[0, 0.63, 0.61]} m={M.plain(YEL)} cast={false} />
        <Box s={[0.46, 0.4, 0.46]} p={[0, 1.02, 0]} m={brick} />
        <Roof w={0.8} d={0.8} h={0.3} y={1.2} m={metal} sag={1.2} lift={0.12} fascia={false} />
        <Box s={[0.7, 0.06, 0.03]} p={[0, 1.15, 0.4]} m={M.plain(ORA)} cast={false} />
        <Cyl rt={0.015} rb={0.025} h={0.4} p={[0, 1.7, 0]} m={M.gold} seg={6} />
        <Ball rad={0.05} p={[0, 1.55, 0]} m={M.gold} />
      </group>
    );
  }

  /* ---------- low red building with teal roof ---------- */
  function SideBuilding({ p, r }) {
    const M = useM();
    const teal = M.plain('#2f6f8f', { roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide });
    const wall = M.mat('brick', 2, 1, { color: '#e49a8c' });
    const cream = M.plain('#eadfc2');
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-1.6, 0); s.lineTo(1.6, 0); s.lineTo(0, 0.7); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 6.0, bevelEnabled: false });
      g.translate(0, 0, -3.0);
      return g;
    }, []);
    return (
      <group position={p} rotation={[0, r || 0, 0]}>
        <Box s={[2.5, 0.16, 5.4]} p={[0, 0.08, 0]} m={M.plain('#bdbab2')} />
        <Box s={[2.2, 1.45, 5.0]} p={[0, 0.88, 0]} m={wall} />
        {/* cream columns and openings on the front (+z of the group) */}
        {[-2.2, -1.1, 0, 1.1, 2.2].map((z) => <Box key={z} s={[0.16, 1.5, 0.16]} p={[1.18, 0.93, z]} m={cream} />)}
        <Box s={[0.05, 1.2, 3.0]} p={[1.12, 0.78, -0.6]} m={M.plain('#2a1d16')} cast={false} />
        {[1.0, 0.0, -1.0].map((z) => <Box key={z} s={[0.04, 0.55, 0.6]} p={[1.12, 0.85, z * 1.4 + 1.2]} m={M.plain('#c8a45a')} cast={false} />)}
        <Box s={[0.28, 0.12, 5.2]} p={[1.18, 1.62, 0]} m={cream} cast={false} />
        <mesh geometry={geo} material={teal} position={[0, 1.6, 0]} castShadow receiveShadow />
        <Box s={[3.4, 0.05, 0.05]} p={[0, 1.6, 3.0]} m={teal} cast={false} />
      </group>
    );
  }

  /* ---------- freestanding zig-zag stone wall ---------- */
  function ZigWall({ p, r }) {
    const WW = 5.6, HH = 1.9;
    const { geo, tex } = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * HH / WW);
      const g = c.getContext('2d'); const cw = c.width, ch = c.height;
      const Y = (y) => (1 - y / HH) * ch;
      g.fillStyle = '#a6a59f'; g.fillRect(0, 0, cw, ch);
      // lower stepped zig-zag chequer
      const cell = 22; const rows = Math.ceil((Y(0) - Y(1.0)) / cell) + 1;
      for (let rI = 0; rI < rows; rI += 1) {
        const k = rI % 16; const tri = k < 8 ? k : 16 - k;
        for (let ci = -2; ci < cw / cell + 2; ci += 1) {
          const dark = Math.floor((ci - tri) / 2) % 2 === 0;
          g.fillStyle = dark ? '#2e3035' : '#b9b8b0';
          g.fillRect(ci * cell, Y(1.0) + rI * cell, cell, cell);
        }
      }
      g.fillStyle = '#7b7a74'; g.fillRect(0, Y(1.0) - 6, cw, 8);
      // niche band
      const n = 15;
      for (let i = 0; i < n; i += 1) {
        const cx = ((i + 0.5) / n) * cw; const nw = 30;
        g.fillStyle = '#85847d'; g.fillRect(cx - nw / 2 - 5, Y(1.5), nw + 10, Y(1.08) - Y(1.5));
        g.fillStyle = '#24201e'; g.fillRect(cx - nw / 2 + 4, Y(1.42), nw - 8, Y(1.14) - Y(1.42));
        g.fillStyle = '#c8c7c0'; g.beginPath(); g.moveTo(cx - nw / 2 - 6, Y(1.5)); g.lineTo(cx, Y(1.62)); g.lineTo(cx + nw / 2 + 6, Y(1.5)); g.closePath(); g.fill();
      }
      // crest arch niche
      g.fillStyle = '#8b5a3e'; g.beginPath(); g.moveTo(cw / 2 - 36, Y(1.5)); g.lineTo(cw / 2 - 36, Y(1.72)); g.quadraticCurveTo(cw / 2, Y(1.98), cw / 2 + 36, Y(1.72)); g.lineTo(cw / 2 + 36, Y(1.5)); g.closePath(); g.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      t.repeat.set(1 / WW, 1 / HH); t.offset.set(0.5, 0); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      const s = new THREE.Shape();
      s.moveTo(-WW / 2, 0); s.lineTo(WW / 2, 0); s.lineTo(WW / 2, 1.5);
      const bumps = 9; const bw = WW / bumps;
      for (let i = 0; i < bumps; i += 1) {
        const x1 = WW / 2 - (i + 1) * bw; const mid = x1 + bw / 2;
        const hgt = i === 4 ? 1.95 : 1.7 + 0.05 * (i % 2);
        s.quadraticCurveTo(mid, hgt * 1.2 - 0.3, x1, 1.5);
      }
      s.closePath();
      const gg = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false, curveSegments: 6 });
      gg.translate(0, 0, -0.2);
      return { geo: gg, tex: t };
    }, []);
    const mats = useMemo(() => [new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: '#9b9a93', roughness: 0.95 })], [tex]);
    return (
      <group position={p} rotation={[0, r || 0, 0]}>
        <mesh geometry={geo} material={mats} castShadow receiveShadow />
      </group>
    );
  }

  /* ---------- puja stalls ---------- */
  function Stalls({ p, r, n = 8 }) {
    const M = useM();
    const L = n * 1.7;
    const blue = M.plain('#1f5f8f', { roughness: 0.6 });
    const white = M.plain('#e8eef0');
    const wall = M.mat('brick', 4, 1, { color: '#e49a8c' });
    const glass = M.plain('#8fb6c6', { roughness: 0.2, metalness: 0.3, emissive: '#2a4a56', emissiveIntensity: 0.3 });
    const goods = ['#e45a1b', '#f2c21c', '#d62f6e', '#f5f0e6', '#7a3b1b', '#c0392b'];
    const items = useMemo(() => Array.from({ length: n }, (_, i) => ({ x: -L / 2 + 0.85 + i * 1.7, c: goods[i % goods.length], c2: goods[(i + 3) % goods.length] })), [n, L]);
    return (
      <group position={p} rotation={[0, r || 0, 0]}>
        <Box s={[L, 0.1, 2.4]} p={[0, 0.05, 0]} m={M.plain('#a5a399')} />
        <Box s={[L, 1.2, 0.1]} p={[0, 0.7, -1.1]} m={M.plain('#2b2420')} />
        <Box s={[L, 0.05, 2.4]} p={[0, 1.3, 0]} m={M.plain('#3a302a')} cast={false} />
        {Array.from({ length: n + 1 }, (_, i) => <Box key={i} s={[0.14, 1.25, 0.16]} p={[-L / 2 + i * 1.7, 0.72, 1.1]} m={blue} />)}
        <Box s={[L, 0.28, 0.1]} p={[0, 1.2, 1.15]} m={blue} />
        <Box s={[L, 0.1, 0.12]} p={[0, 1.38, 1.17]} m={white} />
        {items.map((it, i) => (
          <group key={i} position={[it.x, 0, 0.5]}>
            <Box s={[1.0, 0.35, 0.5]} p={[0, 0.27, 0.1]} m={M.plain('#6b4a2a')} />
            <Ball rad={0.15} sc={[1.2, 0.8, 1]} p={[-0.25, 0.55, 0.1]} m={M.plain(it.c)} />
            <Ball rad={0.13} sc={[1.2, 0.8, 1]} p={[0.2, 0.55, 0.1]} m={M.plain(it.c2)} />
            <Box s={[0.9, 0.5, 0.04]} p={[0, 0.95, -0.2]} m={M.plain(it.c2, { roughness: 0.8 })} cast={false} />
            <Glow s={[0.5, 0.04, 0.05]} p={[0, 1.22, 0.4]} c="#ffe6a8" />
          </group>
        ))}
        {/* brick upper floor with glass band, blue and white fascia */}
        <Box s={[L + 0.1, 1.5, 2.2]} p={[0, 2.08, -0.05]} m={wall} />
        <Box s={[L + 0.12, 0.6, 0.05]} p={[0, 2.35, 1.07]} m={glass} cast={false} />
        <Box s={[L + 0.2, 0.15, 2.4]} p={[0, 2.88, 0]} m={M.plain('#6b7479')} />
        <Box s={[L + 0.15, 0.3, 0.06]} p={[0, 1.55, 1.15]} m={white} cast={false} />
      </group>
    );
  }

  /* ---------- festival cloth strings ---------- */
  function Cloth({ lines }) {
    const ref = useRef();
    const data = useMemo(() => {
      const out = [];
      lines.forEach(([a, b, sag]) => {
        const dx = b[0] - a[0], dz = b[2] - a[2];
        const len = Math.hypot(dx, dz); const n = Math.max(3, Math.floor(len / 1.0));
        const ang = Math.atan2(-dz, dx);
        for (let i = 0; i < n; i += 1) {
          const t = (i + 0.5) / n;
          const y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag;
          out.push({ p: [a[0] + dx * t, y - 0.2, a[2] + dz * t], a: ang, c: i % 2 ? '#d8861c' : '#b5271f' });
        }
      });
      return out;
    }, [lines]);
    useEffect(() => {
      const m = ref.current; if (!m) return;
      const o = new THREE.Object3D(); const col = new THREE.Color();
      data.forEach((d, i) => { o.position.set(...d.p); o.rotation.set(0, d.a, 0); o.scale.set(1, 1, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); col.set(d.c); m.setColorAt(i, col); });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [data]);
    return (
      <instancedMesh ref={ref} args={[undefined, undefined, data.length]} frustumCulled={false}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshStandardMaterial side={THREE.DoubleSide} roughness={0.9} emissive="#3a0c06" emissiveIntensity={0.25} />
      </instancedMesh>
    );
  }

  /* ---------- forest (instanced) ---------- */
  const PATHTREES_R = [14, 19, 24, 29, 34, 39].map((z) => [3.7, z]);
  const PATHTREES_L = [16.5, 21.5, 26.5, 31.5, 36.5].map((z) => [-3.7, z]);
  const EDGETREES = [[-21, -10], [4, -22], [19, -12], [-12, -20]];

  const forestData = (() => {
    const r = rng(2024); const trees = [];
    const push = (x, z, big) => trees.push({ x, z, h: (big ? 10 : 8.5) + r() * 3, rad: 0.25 + r() * 0.15, cr: 1.9 + r() * 0.8 });
    PATHTREES_R.concat(PATHTREES_L).concat(EDGETREES).forEach(([x, z]) => push(x, z, true));
    let tries = 0;
    while (trees.length < 250 && tries < 12000) {
      tries += 1;
      const rad = 15.5 + (r() ** 1.3) * 46; const ang = r() * Math.PI * 2;
      const x = Math.sin(ang) * rad, z = Math.cos(ang) * rad;
      if (Math.abs(x) < 15.6 && Math.abs(z) < 15.6) continue;
      if (Math.abs(x) < 3.9 || Math.abs(z) < 3.9) continue;
      if (z > -2 && rad < 26) continue; if (z < 0 && rad < 21) continue; if (x > 0 && z > 0 && ang > 0.25 && ang < 1.35 && rad < 32) continue;
      if (x > -9 && x < -3.5 && z > 13 && z < 31) continue;
      if (x > 5 && x < 13 && z > 13 && z < 22) continue;
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3.4)) continue;
      push(x, z, rad < 32);
    }
    return trees;
  })();

  function Forest() {
    const tr = useRef(); const cr = useRef(); const sh = useRef(); const lit = useRef(); const LITTER = 260;
    const bushes = useMemo(() => {
      const r = rng(55); const out = [];
      for (let i = 0; i < 90; i += 1) {
        const rad = 15.5 + r() * 34; const a = r() * 6.28; const x = Math.sin(a) * rad, z = Math.cos(a) * rad;
        if (Math.abs(x) < 15.6 && Math.abs(z) < 15.6) continue; if (Math.abs(x) < 3.6 || Math.abs(z) < 3.6) continue;
        if (x > -9 && x < -3.5 && z > 13 && z < 31) continue;
        if (x > 0 && z > 0 && a > 0.25 && a < 1.35 && rad < 30) continue;
        out.push([x, z, 0.35 + r() * 0.4]);
      }
      return out;
    }, []);
    useEffect(() => {
      const o = new THREE.Object3D(); const col = new THREE.Color(); const r = rng(99);
      const greens = ['#2f5528', '#3b6a30', '#2a4a26', '#33602c', '#2a4a26'];
      let ci = 0;
      forestData.forEach((t, i) => {
        o.rotation.set(0, 0, 0); o.scale.set(t.rad / 0.2, t.h, t.rad / 0.2); o.position.set(t.x, t.h / 2, t.z); o.updateMatrix();
        tr.current.setMatrixAt(i, o.matrix);
        [[0, 0.2, 0, 1], [0.9, -1.4, 0.5, 0.8], [-0.8, -2.4, -0.6, 0.85], [0.3, -3.6, 0.9, 0.7]].forEach(([dx, dy, dz, k]) => {
          o.position.set(t.x + dx * t.cr * 0.5, t.h + dy, t.z + dz * t.cr * 0.5); o.rotation.set(r(), r() * 3, r());
          o.scale.set(t.cr * k, t.cr * k * 0.8, t.cr * k); o.updateMatrix();
          cr.current.setMatrixAt(ci, o.matrix); col.set(greens[Math.floor(r() * greens.length)]); cr.current.setColorAt(ci, col); ci += 1;
        });
      });
      bushes.forEach(([x, z, s], i) => {
        o.rotation.set(0, 0, 0); o.position.set(x, s * 0.4, z); o.scale.set(s * 1.3, s * 0.8, s * 1.3); o.updateMatrix(); sh.current.setMatrixAt(i, o.matrix);
      });
      const lt = lit.current; const lr = rng(321);
      for (let i = 0; i < LITTER; i += 1) {
        const rad = 3 + lr() * 52; const a = lr() * 6.28; let x = Math.sin(a) * rad, z = Math.cos(a) * rad;
        if (Math.abs(x) < 15 && Math.abs(z) < 15) { x += 16 * Math.sign(x || 1); }
        o.rotation.set(-Math.PI / 2, 0, lr() * 6.28); o.position.set(x, 0.01, z); const k = 0.5 + lr() * 1.2; o.scale.set(k, k * 0.7, 1); o.updateMatrix();
        lt.setMatrixAt(i, o.matrix); col.set(['#4a3220', '#3a2616', '#52391f', '#2e2418', '#26201a'][i % 5]); lt.setColorAt(i, col);
      }
      lt.instanceMatrix.needsUpdate = true; if (lt.instanceColor) lt.instanceColor.needsUpdate = true;
      [tr, cr, sh].forEach((q) => { q.current.instanceMatrix.needsUpdate = true; if (q.current.instanceColor) q.current.instanceColor.needsUpdate = true; });
    }, [bushes]);
    const n = forestData.length;
    return (
      <group>
        <instancedMesh ref={tr} args={[undefined, undefined, n]} castShadow frustumCulled={false}>
          <cylinderGeometry args={[0.13, 0.2, 1, 7]} /><meshStandardMaterial color="#4f493f" roughness={1} />
        </instancedMesh>
        <instancedMesh ref={cr} args={[undefined, undefined, n * 4]} castShadow frustumCulled={false}>
          <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#ffffff" roughness={1} flatShading />
        </instancedMesh>
        <instancedMesh ref={lit} args={[undefined, undefined, LITTER]} frustumCulled={false}>
          <circleGeometry args={[0.6, 6]} /><meshStandardMaterial color="#ffffff" roughness={1} side={THREE.DoubleSide} />
        </instancedMesh>
        <instancedMesh ref={sh} args={[undefined, undefined, bushes.length]} frustumCulled={false}>
          <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#3a5a2c" roughness={1} flatShading />
        </instancedMesh>
      </group>
    );
  }

  function Tufts() {
    const ref = useRef();
    const N = 220;
    useEffect(() => {
      const o = new THREE.Object3D(); const col = new THREE.Color(); const r = rng(808); let i = 0;
      while (i < N) {
        const rad = 16 + r() * 40, a = r() * 6.28, x = Math.sin(a) * rad, z = Math.cos(a) * rad;
        if (Math.abs(x) < 15.6 && Math.abs(z) < 15.6) continue; if (Math.abs(x) < 2.8 || Math.abs(z) < 2.8) continue;
        const k = 0.2 + r() * 0.25; o.position.set(x, k * 0.5, z); o.rotation.set(0, r() * 3, 0); o.scale.set(k, k * 1.4, k); o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix); col.set(['#3f6a2c', '#52763a', '#2f5528', '#6a7a3a'][i % 4]); ref.current.setColorAt(i, col); i += 1;
      }
      ref.current.instanceMatrix.needsUpdate = true; if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, []);
    return (
      <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
        <coneGeometry args={[0.5, 1, 5]} /><meshStandardMaterial color="#ffffff" roughness={1} flatShading />
      </instancedMesh>
    );
  }

  function Person({ p, c, ry = 0, s = 1 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s}>
        <Cyl rt={0.08} rb={0.1} h={0.34} p={[0, 0.17, 0]} m={M.plain('#3a3a44')} seg={8} />
        <Cyl rt={0.09} rb={0.1} h={0.26} p={[0, 0.47, 0]} m={M.plain(c)} seg={8} />
        <Ball rad={0.065} p={[0, 0.68, 0]} m={M.plain('#c99a76')} />
      </group>
    );
  }

  /* ---------- Main / Env ---------- */
  function KalikaMain() { return <PagodaMain />; }

  function KalikaEnv() {
    const M = useM();
    const paving = useMemo(() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d'); const r = rng(11); g.fillStyle = '#8f8e88'; g.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 400; i += 1) { g.fillStyle = r() < 0.5 ? 'rgba(120,118,112,0.35)' : 'rgba(160,158,150,0.3)'; g.fillRect(r() * 1024, r() * 1024, 20 + r() * 50, 20 + r() * 50); } g.strokeStyle = '#6d6c66'; g.lineWidth = 3; for (let i = 0; i <= 10; i += 1) { const v = i * 102.4; g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 1024); g.stroke(); g.beginPath(); g.moveTo(0, v); g.lineTo(1024, v); g.stroke(); } for (let i = 0; i < 22; i += 1) { const x = r() * 1024, y = r() * 1024, k = 25 + r() * 60; g.fillStyle = i % 3 === 0 ? 'rgba(90,110,120,0.45)' : i % 3 === 1 ? 'rgba(40,36,28,0.4)' : 'rgba(55,70,40,0.35)'; g.beginPath(); g.ellipse(x, y, k, k * 0.6, r() * 3, 0, 6.3); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return new THREE.MeshStandardMaterial({ map: t, roughness: 1 }); }, []);
    const gravel = M.plain('#b5b1a4', { roughness: 1 });
    const earth = M.plain('#3a3022', { roughness: 1 });
    const kerb = M.plain('#8e8b83');
    const hillA = M.plain('#3e6234', { roughness: 1 }); const hillB = M.plain('#4b7040', { roughness: 1 });
    const lines = useMemo(() => {
      const L = [];
      for (let i = 0; i < PATHTREES_R.length - 1; i += 1) L.push([[3.7, 3.9, PATHTREES_R[i][1]], [3.7, 3.9, PATHTREES_R[i + 1][1]], 0.6]);
      for (let i = 0; i < PATHTREES_L.length - 1; i += 1) L.push([[-3.7, 4.0, PATHTREES_L[i][1]], [-3.7, 4.0, PATHTREES_L[i + 1][1]], 0.6]);
      
      L.push([[3.7, 4.2, 19], [-3.7, 4.0, 21.5], 0.5]);
      L.push([[-3.7, 4.2, 21.5], [3.7, 4.0, 24], 0.5]);
      L.push([[3.7, 4.0, 29], [-3.7, 4.2, 26.5], 0.5]);
      L.push([[3.7, 4.2, 34], [-3.7, 4.0, 31.5], 0.5]);
      return L;
    }, []);
    const hills = useMemo(() => {
      const r = rng(5); const out = [];
      for (let i = 0; i < 16; i += 1) { const a = (i / 16) * Math.PI * 2 + r() * 0.2; out.push({ x: Math.sin(a) * (80 + r() * 8), z: Math.cos(a) * (80 + r() * 8), rad: 15 + r() * 8, k: 0.5 + r() * 0.4, m: i % 2 }); }
      return out;
    }, []);
    return (
      <group>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={earth}><circleGeometry args={[90, 48]} /></mesh>
        {/* gravel lanes through the forest on the four axes */}
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} rotation={[-Math.PI / 2, 0, r]} position={[0, 0.0, 0]} receiveShadow material={gravel}><planeGeometry args={[5.2, 120]} /></mesh>
        ))}
        {/* paved courtyard, level, about 45 m */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 0]} receiveShadow material={paving}><planeGeometry args={[30, 30]} /></mesh><Box s={[30, 0.1, 30]} p={[0, 0.0, 0]} m={kerb} cast={false} />
        {[[0, 15.15, 30.6, 0.3], [0, -15.15, 30.6, 0.3]].map(([x, z, w, d], i) => <Box key={i} s={[w, 0.2, d]} p={[x, 0.02, z]} m={kerb} cast={false} />)}
        {[[15.15, 0], [-15.15, 0]].map(([x, z], i) => <Box key={i} s={[0.3, 0.2, 30.6]} p={[x, 0.02, z]} m={kerb} cast={false} />)}
        <Box s={[5.2, 0.12, 1.0]} p={[0, 0.0, 15.4]} m={M.plain('#c3c0b6')} cast={false} />
        <Box s={[5.2, 0.12, 1.0]} p={[0, 0.0, -15.4]} m={M.plain('#c3c0b6')} cast={false} />
        <Box s={[1.0, 0.12, 5.2]} p={[15.4, 0.0, 0]} m={M.plain('#c3c0b6')} cast={false} />
        <Box s={[1.0, 0.12, 5.2]} p={[-15.4, 0.0, 0]} m={M.plain('#c3c0b6')} cast={false} />

        {/* four cardinal gateways: main one on +z */}
        <Gate p={[5, 0, 11]} r={0} />
        <Gate p={[0, 0, -15]} r={Math.PI} />
        <Gate p={[15, 0, 0]} r={Math.PI / 2} />
        <Gate p={[-15, 0, 0]} r={-Math.PI / 2} />

        {/* scattered small red shrines (not symmetric) */}
        <Shrine p={[-6.8, 0, 4.2]} r={0.3} s={1.15} />
        <Shrine p={[5.6, 0, -6.6]} r={-0.5} s={0.9} />
        <Shrine p={[-5.2, 0, -7.6]} r={0.9} s={1.0} />
        <Shrine p={[7.2, 0, 7.4]} r={-0.2} s={0.85} />

        <SideBuilding p={[9.0, 0, -0.8]} r={0} />
        <group scale={1.26} position={[-8, 0, -1]}><ZigWall p={[0, 0, 0]} r={Math.PI / 2} /></group>
        <Stalls p={[-5.7, 0, 25.0]} r={Math.PI / 2} n={8} />

        {/* people for scale */}
        <Person p={[-1.0, 0, 5.6]} c="#2f9e44" ry={2.5} />
        <Person p={[1.4, 0, 5.2]} c="#f08c00" ry={3.4} />
        <Person p={[0.2, 0, 6.2]} c="#c2255c" ry={1.2} />
        <Person p={[-3.3, 0, 7.8]} c="#e8e4da" ry={0.4} />
        <Person p={[-0.6, 0, 14.5]} c="#1c7ed6" ry={3.1} />
        <Person p={[1.2, 0, 17.5]} c="#c92a2a" ry={0.2} />
        <Person p={[-6.9, 0, 5.8]} c="#e67700" ry={0.5} />
        <Diyo p={[-0.6, 0.42, 4.15]} light />

        <Tufts />
        <Forest />
        <Cloth lines={lines} />

        {/* far forested hills, no snow */}
        {hills.map((h, i) => (
          <mesh key={i} position={[h.x, -1, h.z]} scale={[h.rad, h.rad * h.k, h.rad]} material={h.m ? hillA : hillB}><sphereGeometry args={[1, 14, 8]} /></mesh>
        ))}
      </group>
    );
  }

  return { 'kalika-bhagawati-temple-baglung': { Main: KalikaMain, Env: KalikaEnv } };
}
