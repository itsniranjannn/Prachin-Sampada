// Bindhyabasini Temple, old Pokhara: a small single-tier white shikhara (about 7 x 7 m, 12 m high) on a low stone plinth in an
// open paved hilltop courtyard. Scalloped red valance with gold fringe round the dome base, gilded toran door canopy with a dark
// carved tympanum, gold finial with a rope hanging down the dome, two bronze lions at the door steps. Around it: small white
// domed shrines, white two-pillar bell gateways, a long low dark-timber pavilion, a flagpole, Hanuman beside a Ganesh shrine.
// Env: the little hill with stone stairs (east and north), a slate-roofed arched hall, big trees, town roofs to the south and
// forested ridge plus snow peaks to the north. Door faces +z (model convention).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, THREE, useMemo } = K;

  const WHITE = '#f4f3ee', RED = '#b8281f', ORANGE = '#d4401e', GOLDC = '#c9a23a', DARKC = '#3a2c24';

  /* ---------- helpers ---------- */
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // dome profile (r, y) from the cornice upwards: three convex bands, then a slender neck
  const quarter = (rb, rt, y0, y1, n = 8, p = 1) => {
    const out = [];
    for (let i = 0; i <= n; i += 1) {
      const t = i / n;
      out.push([rt + (rb - rt) * Math.pow(Math.cos(t * Math.PI / 2), p), y0 + (y1 - y0) * Math.sin(t * Math.PI / 2)]);
    }
    return out;
  };
  const coneBand = (rb, rt, y0, y1, n = 14) => {
    const out = [];
    for (let i = 1; i <= n; i += 1) {
      const t = i / n;
      const k = 1 - Math.pow(1 - t, 1.5) * 0.35 - t * 0.0; // gentle concave-convex taper
      const e = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      out.push([rb + (rt - rb) * (0.25 * t + 0.75 * e) * (k > 0 ? 1 : 1), y0 + (y1 - y0) * t]);
    }
    return out;
  };
  const DOME = [
    [0.01, 0], [1.3, 0],
    ...coneBand(1.3, 1.15, 0, 0.5, 4),
    [1.23, 0.5], [1.23, 0.55], [1.13, 0.55],
    ...coneBand(1.13, 1.05, 0.55, 1.2, 5),
    [1.13, 1.2], [1.13, 1.25], [0.98, 1.25],
    ...coneBand(0.98, 0.22, 1.25, 1.85, 14),
    [0.2, 1.9], [0.2, 2.0], [0.3, 2.01], [0.3, 2.07], [0.01, 2.07],
  ];
  const rAt = (y) => {
    let r = 0.2;
    for (let i = 1; i < DOME.length; i += 1) {
      const [r0, y0] = DOME[i - 1], [r1, y1] = DOME[i];
      if (y >= y0 && y <= y1 && y1 > y0) r = Math.max(r, r0 + (r1 - r0) * (y - y0) / (y1 - y0));
    }
    return r;
  };

  function Glow({ s, p, c = '#ffcf86' }) {
    return <mesh position={p}><boxGeometry args={s} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>;
  }

  function Gable({ w, d, h, m, p, r }) {
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
      g.translate(0, 0, -d / 2);
      return g;
    }, [w, d, h]);
    return <mesh geometry={geo} material={m} position={p} rotation={r} castShadow receiveShadow />;
  }

  /** Scalloped valance for one face: a straight band with hanging scallops, gold fringe behind. */
  function Valance({ w, n, mRed, mGold, mOrange }) {
    const [gr, gg, go] = useMemo(() => {
      const mk = (grow) => {
        const s = new THREE.Shape();
        const h = w / 2 + grow, sw = (2 * h) / n;
        s.moveTo(-h, 0.1); s.lineTo(h, 0.1); s.lineTo(h, 0.0);
        for (let i = 0; i < n; i += 1) {
          const x1 = h - i * sw, x0 = x1 - sw;
          s.quadraticCurveTo((x0 + x1) / 2, -0.76 - grow * 2, x0, 0.0);
        }
        s.closePath();
        return new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false });
      };
      return [mk(0), mk(0.02), mk(0.01)];
    }, [w, n]);
    return (
      <group>
        <mesh geometry={gg} material={mGold} position={[0, -0.05, -0.01]} />
        <mesh geometry={go} material={mOrange} position={[0, -0.02, -0.03]} />
        <mesh geometry={gr} material={mRed} castShadow />
        <Box s={[w, 0.035, 0.1]} p={[0, 0.085, 0.04]} m={mGold} />
        {Array.from({ length: n + 1 }, (_, i) => (
          <group key={i} position={[-w / 2 + i * (w / n), -0.4, 0.06]}>
            <mesh material={mRed} position={[0, -0.06, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.035, 0.12, 6]} /></mesh>
            <Ball rad={0.03} p={[0, 0.01, 0]} m={mGold} />
          </group>
        ))}
      </group>
    );
  }

  /** Small white domed shrine (about a quarter of the main shrine). */
  function MiniShrine({ p, r, s = 1, redFront = false }) {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.85 });
    const geo = useMemo(() => {
      const pts = [new THREE.Vector2(0.01, 0)];
      quarter(0.42, 0.12, 0, 0.55, 10).forEach(([rr, yy]) => pts.push(new THREE.Vector2(rr, yy)));
      pts.push(new THREE.Vector2(0.1, 0.6), new THREE.Vector2(0.01, 0.62));
      return new THREE.LatheGeometry(pts, 24);
    }, []);
    return (
      <group position={p} rotation={r} scale={s}>
        <Box s={[0.9, 0.12, 0.9]} p={[0, 0.06, 0]} m={M.stone} />
        <Box s={[0.7, 0.5, 0.7]} p={[0, 0.37, 0]} m={white} />
        {redFront && <Box s={[0.5, 0.3, 0.04]} p={[0, 0.34, 0.36]} m={M.plain(ORANGE)} />}
        <Box s={[0.28, 0.32, 0.04]} p={[0, 0.32, 0.355]} m={M.plain('#2a1c16')} />
        <Box s={[0.8, 0.06, 0.8]} p={[0, 0.65, 0]} m={white} />
        <mesh geometry={geo} material={white} position={[0, 0.68, 0]} castShadow />
        <Ball rad={0.05} p={[0, 1.34, 0]} m={M.gold} />
      </group>
    );
  }

  /** White stone two-pillar gateway with a red bell hanging from the lintel. */
  function BellGate({ p, r, s = 1 }) {
    const M = useM();
    const white = M.plain('#ecebe6', { roughness: 0.9 });
    return (
      <group position={p} rotation={r} scale={s}>
        {[-0.55, 0.55].map((x) => (
          <group key={x}>
            <Box s={[0.34, 0.12, 0.34]} p={[x, 0.06, 0]} m={white} />
            <Box s={[0.22, 1.5, 0.22]} p={[x, 0.85, 0]} m={white} />
            <Box s={[0.3, 0.08, 0.3]} p={[x, 1.62, 0]} m={white} />
          </group>
        ))}
        <Box s={[1.5, 0.18, 0.26]} p={[0, 1.74, 0]} m={white} />
        <Box s={[1.6, 0.06, 0.32]} p={[0, 1.87, 0]} m={white} />
        <Cyl rt={0.012} h={0.2} p={[0, 1.55, 0]} m={M.gold} seg={6} />
        <Cyl rt={0.04} rb={0.12} h={0.22} p={[0, 1.38, 0]} m={M.plain('#b3262a', { metalness: 0.3, roughness: 0.5 })} seg={14} />
        <Ball rad={0.03} p={[0, 1.25, 0]} m={M.gold} />
      </group>
    );
  }

  /** Long low open hall of dark carved timber under one pitched dark tile roof, on a dark stone plinth. */
  function Pavilion({ p, len = 9, dep = 2.6 }) {
    const M = useM();
    const wood = M.plain('#7a4e26', { roughness: 0.7 });
    const gilt = M.plain('#a97a35', { roughness: 0.55, metalness: 0.25 });
    const roof = M.mat('roof', 5, 2, { color: '#5e4e48' });
    const zs = useMemo(() => Array.from({ length: 8 }, (_, i) => -len / 2 + 0.55 + i * ((len - 1.1) / 7)), [len]);
    return (
      <group position={p}>
        <Box s={[dep + 0.4, 0.4, len + 0.4]} p={[0, 0.2, 0]} m={M.plain('#3a3632', { roughness: 0.95 })} />
        <Box s={[dep + 0.6, 0.05, len + 0.6]} p={[0, 0.02, 0]} m={M.stone} />
        {[-1, 1].map((k) => (
          <group key={k}>
            {zs.map((z, i) => (
              <group key={i}>
                <Cyl rt={0.07} rb={0.08} h={1.55} p={[k * (dep / 2 - 0.1), 1.18, z]} m={wood} seg={8} />
                <Box s={[0.2, 0.12, 0.2]} p={[k * (dep / 2 - 0.1), 0.46, z]} m={M.dark} />
                <Box s={[0.34, 0.1, 0.1]} p={[k * (dep / 2 - 0.22), 1.82, z]} r={[0, 0, k * 0.5]} m={gilt} />
              </group>
            ))}
            <Box s={[0.18, 0.18, len]} p={[k * (dep / 2 - 0.1), 2.02, 0]} m={gilt} />
            <Box s={[0.1, 0.4, len - 0.2]} p={[k * (dep / 2 - 0.1), 0.8, 0]} m={M.dark} />
          </group>
        ))}
        {[-len / 2 + 0.1, len / 2 - 0.1].map((z) => <Box key={z} s={[dep - 0.1, 0.14, 0.14]} p={[0, 2.02, z]} m={gilt} />)}
        <Box s={[dep + 0.5, 0.08, len + 0.5]} p={[0, 2.16, 0]} m={M.dark} />
        <Gable w={dep + 1.1} d={len + 0.6} h={0.78} m={roof} p={[0, 2.2, 0]} />
        <Box s={[0.14, 0.12, len + 0.7]} p={[0, 3.0, 0]} m={M.dark} />
        <pointLight position={[0, 1.4, 0]} intensity={1.0} distance={6} color="#ffb35a" />
      </group>
    );
  }

  /* ---------- the shrine ---------- */
  function Shrine() {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.85 });
    const red = M.plain(RED, { roughness: 0.7 });
    const orange = M.plain(ORANGE, { roughness: 0.75 });
    const gold = M.gold;
    const goldFlat = M.plain(GOLDC, { metalness: 0.5, roughness: 0.4 });
    const dark = M.plain(DARKC, { roughness: 0.8 });
    const bronze = M.plain('#8f6428', { metalness: 0.55, roughness: 0.45 });
    const brick = M.mat('brick', 3, 1, { color: '#d9bfae' });

    const domeGeo = useMemo(() => new THREE.LatheGeometry(DOME.map(([r, y]) => new THREE.Vector2(r, y)), 48), []);
    const ropeGeo = useMemo(() => {
      const pts = [];
      for (let y = 2.0; y >= 0.0; y -= 0.2) pts.push(new THREE.Vector3(0, y, rAt(y) + 0.035));
      pts.push(new THREE.Vector3(0, 0.05, 1.38), new THREE.Vector3(0, -0.05, 1.47), new THREE.Vector3(0, -0.36, 1.49));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 60, 0.04, 6, false);
    }, []);
    const arch = useMemo(() => {
      const mk = (w, h, ap) => {
        const s = new THREE.Shape();
        s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h);
        s.bezierCurveTo(w / 2, h + ap * 0.5, w * 0.12, h + ap * 0.85, 0, h + ap);
        s.bezierCurveTo(-w * 0.12, h + ap * 0.85, -w / 2, h + ap * 0.5, -w / 2, h);
        s.closePath();
        return s;
      };
      return {
        outer: new THREE.ExtrudeGeometry(mk(1.18, 0.14, 0.5), { depth: 0.05, bevelEnabled: false }),
        inner: new THREE.ExtrudeGeometry(mk(1.0, 0.1, 0.42), { depth: 0.16, bevelEnabled: false }),
      };
    }, []);

    const WALL_Y = 0.4, WALL_H = 1.75, TOP = WALL_Y + WALL_H; // wall top 2.15
    const tymp = useMemo(() => {
      const t = new THREE.Shape();
      t.moveTo(-0.45, 0); t.lineTo(0.45, 0); t.lineTo(0.45, 0.1); t.lineTo(0.36, 0.1); t.lineTo(0.36, 0.18); t.lineTo(0.24, 0.18);
      t.lineTo(0.24, 0.26); t.lineTo(0.12, 0.26); t.lineTo(0.0, 0.35); t.lineTo(-0.12, 0.26); t.lineTo(-0.24, 0.26); t.lineTo(-0.24, 0.18);
      t.lineTo(-0.36, 0.18); t.lineTo(-0.36, 0.1); t.lineTo(-0.45, 0.1); t.closePath();
      return new THREE.ExtrudeGeometry(t, { depth: 0.3, bevelEnabled: false });
    }, []);
    return (
      <group>
        {/* stone/brick plinth, two levels */}
        <Box s={[4.4, 0.18, 4.4]} p={[0, 0.09, 0]} m={M.stone} />
        <Box s={[3.8, 0.2, 3.8]} p={[0, 0.28, 0]} m={brick} />
        {/* three stone steps up to the door */}
        {[0, 1, 2].map((i) => <Box key={i} s={[1.5, 0.13, 0.32]} p={[0, 0.065 + i * 0.13 + 0.0, 2.4 - i * 0.3]} m={M.stone} />)}
        <Box s={[1.5, 0.13, 0.5]} p={[0, 0.335, 2.0]} m={M.stone} />

        {/* cella: white, full orange-red lower wall on the +x (queue) face, thin red base line on the others */}
        <Box s={[2.6, WALL_H, 2.6]} p={[0, WALL_Y + WALL_H / 2, 0]} m={white} />
        <Box s={[2.74, 0.14, 2.74]} p={[0, WALL_Y + 0.07, 0]} m={white} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.05, 1.0, 2.64]} p={[k * 1.325, WALL_Y + 0.5, 0]} m={orange} />
            <Box s={[0.07, 0.05, 2.66]} p={[k * 1.33, WALL_Y + 1.03, 0]} m={red} />
          </group>
        ))}
        <Box s={[2.66, 0.05, 0.05]} p={[0, WALL_Y + 0.15, 1.325]} m={red} />
        <Box s={[2.66, 0.05, 0.05]} p={[0, WALL_Y + 0.15, -1.325]} m={red} />
        {/* slim cornice lip */}
        <Box s={[2.8, 0.08, 2.8]} p={[0, TOP + 0.04, 0]} m={white} />
        <Box s={[2.7, 0.06, 2.7]} p={[0, TOP - 0.03, 0]} m={white} />

        {/* red scalloped valance with gold fringe on all four faces, tassels at the corners */}
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, k * Math.PI / 2, 0]}>
            <group position={[0, TOP - 0.04, 1.4]}><Valance w={2.8} n={9} mRed={red} mGold={goldFlat} mOrange={orange} /></group>
            <group position={[1.4, TOP - 0.5, 1.4]}>
              <mesh material={red} position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.05, 0.24, 8]} /></mesh>
              <Ball rad={0.04} p={[0, 0.02, 0]} m={goldFlat} />
            </group>
          </group>
        ))}

        {/* white dome: tapered near-conical bell, narrow neck */}
        <mesh geometry={domeGeo} material={white} position={[0, TOP + 0.08, 0]} castShadow receiveShadow />
        <group position={[0, TOP + 0.08, 0]}>
          <mesh geometry={ropeGeo} material={goldFlat} />
          {/* collar ring and gilded finial (gajur) */}
          <Cyl rt={0.34} rb={0.36} h={0.05} p={[0, 2.03, 0]} m={gold} seg={16} />
          <Cyl rt={0.12} rb={0.2} h={0.14} p={[0, 2.16, 0]} m={gold} seg={14} />
          <Ball rad={0.17} p={[0, 2.33, 0]} sc={[1, 1.15, 1]} m={gold} />
          <Cyl rt={0.07} rb={0.1} h={0.1} p={[0, 2.5, 0]} m={gold} seg={12} />
          <mesh position={[0, 2.82, 0]} material={gold}><coneGeometry args={[0.05, 0.32, 10]} /></mesh>
        </group>

        {/* door: gold repousse jamb frame round a small dark opening, dark carved tympanum above */}
        <group position={[0, WALL_Y, 1.3]}>
          <Box s={[0.45, 0.7, 0.05]} p={[0, 0.35, 0.03]} m={M.plain('#120c09', { roughness: 1 })} cast={false} />
          {[-0.285, 0.285].map((x) => <Box key={x} s={[0.12, 0.82, 0.3]} p={[x, 0.41, 0.15]} m={gold} />)}
          <Box s={[0.69, 0.12, 0.3]} p={[0, 0.76, 0.15]} m={gold} />
          <Box s={[0.86, 0.06, 0.34]} p={[0, 0.85, 0.17]} m={goldFlat} />
          <mesh geometry={tymp} material={dark} position={[0, 0.88, 0.0]} />
          <mesh geometry={tymp} material={goldFlat} position={[0, 0.88, 0.3]} scale={[1.02, 0.14, 0.05]} />
          <Box s={[0.5, 0.05, 0.04]} p={[0, 1.04, 0.31]} m={goldFlat} />
          <Box s={[0.26, 0.05, 0.04]} p={[0, 1.14, 0.31]} m={goldFlat} />
          <Ball rad={0.045} p={[0, 1.29, 0.16]} m={gold} />
          {[-0.12, 0.12].map((x) => <Ball key={x} rad={0.03} p={[x, 0.76, 0.32]} m={gold} />)}
        </group>

        {/* gilded stair rails */}
        {[-0.72, 0.72].map((x) => (
          <group key={x}>
            <Box s={[0.04, 0.04, 1.12]} p={[x, 0.62, 2.0]} r={[0.35, 0, 0]} m={goldFlat} />
            <Box s={[0.05, 0.5, 0.05]} p={[x, 0.3, 2.5]} m={goldFlat} />
            <Box s={[0.05, 0.5, 0.05]} p={[x, 0.62, 1.55]} m={goldFlat} />
          </group>
        ))}

        {/* two bronze lions on stone pedestals */}
        {[-1.05, 1.05].map((x) => (
          <group key={x} position={[x, 0, 2.3]}>
            <Box s={[0.5, 0.14, 0.5]} p={[0, 0.07, 0]} m={M.stone} />
            <Box s={[0.4, 0.34, 0.4]} p={[0, 0.31, 0]} m={M.stone} />
            <Box s={[0.46, 0.06, 0.46]} p={[0, 0.51, 0]} m={M.stone} />
            <group position={[0, 0.54, 0]} scale={1.5}>
              <K.Lion m={bronze} />
              <Ball rad={0.1} p={[0, 0.5, 0.1]} sc={[1.3, 1, 0.6]} m={bronze} />
            </group>
          </group>
        ))}

        {/* paved hilltop courtyard */}
        <Box s={[17.6, 0.2, 14]} p={[-1.2, -0.1, -0.5]} m={M.plain('#8a8174', { roughness: 0.95 })} cast={false} />
        {[[-6.5, -3, '#80776a'], [3, -4.5, '#948b7d'], [-2, 3.5, '#7c7366'], [-9, 4, '#988f80'], [5, 3.5, '#857c6f'], [-5, -5.5, '#948b7d'], [1, -2.5, '#7e7568']].map(([x, z, c], i) => <Box key={i} s={[2.4, 0.014, 2.4]} p={[x, 0.008, z]} m={M.plain(c, { roughness: 0.95 })} cast={false} />)}
        {/* slab joint lines */}
        {[-8, -5.6, -3.2, -0.8, 1.6, 4, 6.4].map((x) => <Box key={x} s={[0.03, 0.012, 14]} p={[x, 0.006, -0.5]} m={M.plain('#6f685d')} cast={false} />)}
        {[-6, -3.6, -1.2, 1.2, 3.6, 5.8].map((z) => <Box key={z} s={[17.6, 0.012, 0.03]} p={[-1.2, 0.007, z]} m={M.plain('#6f685d')} cast={false} />)}
        {/* retaining wall: the hilltop drops away on every side */}
        <Box s={[17.9, 1.35, 14.3]} p={[-1.2, -0.77, -0.5]} m={M.mat('granite', 6, 1, { color: '#a39a8c' })} />

        {/* two white bell gateways */}
        <BellGate p={[3.2, 0, 2.8]} r={[0, 0.25, 0]} />
        <BellGate p={[-3.5, 0, 2.2]} r={[0, -0.15, 0]} s={0.8} />

        {/* two small white domed shrines behind right */}
        <MiniShrine p={[5.1, 0, -0.2]} r={[0, -0.1, 0]} />
        <MiniShrine p={[6.5, 0, -1.2]} r={[0, 0.05, 0]} s={0.85} />

        {/* Ganesh shrine and sindoor-red Hanuman near the entrance */}
        <MiniShrine p={[-2.5, 0, 4.1]} s={0.9} redFront />
        <group position={[-1.5, 0, 4.2]}>
          <Box s={[0.42, 0.18, 0.42]} p={[0, 0.09, 0]} m={M.stone} />
          <Cyl rt={0.1} rb={0.15} h={0.36} p={[0, 0.36, 0]} m={M.plain('#c0301c')} seg={10} />
          <Ball rad={0.11} p={[0, 0.64, 0.01]} m={M.plain('#c0301c')} />
          <Cyl rt={0.025} h={0.5} p={[0.15, 0.42, 0.04]} m={M.plain('#c0301c')} seg={6} />
          <Ball rad={0.07} p={[0.15, 0.7, 0.04]} m={M.plain('#c0301c')} />
          <Cyl rt={0.07} rb={0.04} h={0.05} p={[0, 0.78, 0.01]} m={gold} seg={8} />
        </group>

        {/* long dark-timber pavilion on the left */}
        <Pavilion p={[-8.2, 0, -0.5]} />
        {/* small white dome visible behind the pavilion */}
        <MiniShrine p={[-11, 0, -0.5]} r={[0, Math.PI / 2, 0]} />

        {/* tall slim rust-brown flagpole with tasselled top */}
        <group position={[-5.3, 0, 3.6]}>
          <Box s={[0.5, 0.15, 0.5]} p={[0, 0.07, 0]} m={M.stone} />
          <Cyl rt={0.035} rb={0.06} h={4.2} p={[0, 2.2, 0]} m={M.plain('#8a4a30', { roughness: 0.6 })} seg={8} />
          <Box s={[0.14, 0.2, 0.14]} p={[0, 4.3, 0]} m={M.plain('#8a4a30')} />
          <mesh position={[0, 4.6, 0]} material={goldFlat}><coneGeometry args={[0.1, 0.4, 8]} /></mesh>
          <Box s={[0.03, 0.5, 0.26]} p={[0.03, 3.95, 0.14]} m={red} />
        </group>

        {/* low parapet round the plaza, open at the two stairs */}
        <Box s={[17.6, 0.2, 0.3]} p={[-1.2, 0.1, 6.35]} m={M.stone} />
        <Box s={[0.3, 0.45, 14]} p={[-9.85, 0.22, -0.5]} m={M.stone} />
        <Box s={[0.3, 0.45, 9.5]} p={[7.45, 0.22, -2.75]} m={M.stone} />
        <Box s={[0.3, 0.45, 1.5]} p={[7.45, 0.22, 5.75]} m={M.stone} />
        <Box s={[4.9, 0.45, 0.3]} p={[-7.55, 0.22, -7.35]} m={M.stone} />
        <Box s={[9.5, 0.45, 0.3]} p={[2.85, 0.22, -7.35]} m={M.stone} />

        <pointLight position={[0, 1.2, 3.0]} intensity={2.0} distance={7} color="#ffb35a" />
        <Frame s={[7.6, 5.8, 5.6]} p={[0.3, 2.9, 1.5]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  // the hill: flat shelf at y -1.2 out to r 12.5, then a wooded slope down to the town at y -7
  const hillY = (x, z) => { const r = Math.hypot(x, z); return r <= 12.5 ? -1.2 : Math.max(-7, -1.2 - (r - 12.5) * 0.34); };

  function StoneStairs({ pos, rot }) {
    const M = useM();
    const N = 18, run = 0.9, rise = 0.32;
    const steps = useMemo(() => Array.from({ length: N }, (_, i) => i), []);
    const a = Math.atan2(rise, run), L = Math.hypot(run * N, rise * N);
    const iron = M.plain('#2f2f2f');
    return (
      <group position={pos} rotation={rot}>
        {steps.map((i) => <Box key={i} s={[run, 0.7, 3.0]} p={[run * (i + 0.5), -rise * (i + 1) - 0.35, 0]} m={M.mat('granite', 1, 1, { color: '#a39b90' })} cast={false} />)}
        {[-1.6, 1.6].map((z) => (
          <group key={z}>
            <Box s={[L, 0.07, 0.07]} p={[(L / 2) * Math.cos(a), 0.85 - (L / 2) * Math.sin(a), z]} r={[0, 0, -a]} m={iron} cast={false} />
            <Box s={[L, 0.07, 0.07]} p={[(L / 2) * Math.cos(a), 0.5 - (L / 2) * Math.sin(a), z]} r={[0, 0, -a]} m={iron} cast={false} />
            {Array.from({ length: 7 }, (_, k) => <Box key={k} s={[0.07, 0.95, 0.07]} p={[k * 2.6 + 0.1, 0.4 - rise * (k * 2.6 / run), z]} m={iron} cast={false} />)}
          </group>
        ))}
      </group>
    );
  }

  function Town() {
    const M = useM();
    const houses = useMemo(() => {
      const r = rng(7), out = [];
      const wall = ['#efe6d4', '#e0cfae', '#d9b9a0', '#e8e4dc', '#c9d4c8', '#d8c0a4'];
      const roofs = ['#6f6a66', '#8c5a44', '#5f6e7c', '#9a4a3a', '#7a7f82'];
      let tries = 0;
      while (out.length < 62 && tries < 900) {
        tries += 1;
        const x = (r() - 0.5) * 124, z = -14 + r() * 76;
        if (Math.hypot(x, z) < 32) continue;
        if (Math.hypot(x, z) > 66) continue;
        const w = 2.4 + r() * 2.6, d = 2.4 + r() * 2.2, h = 1.8 + r() * 2.2;
        out.push({ x, z, w, d, h, wc: wall[Math.floor(r() * wall.length)], rc: roofs[Math.floor(r() * roofs.length)], rot: Math.floor(r() * 2) * Math.PI / 2 });
      }
      return out;
    }, []);
    return (
      <group>
        {houses.map((hh, i) => (
          <group key={i} position={[hh.x, -7, hh.z]} rotation={[0, hh.rot, 0]}>
            <Box s={[hh.w, hh.h, hh.d]} p={[0, hh.h / 2, 0]} m={M.plain(hh.wc, { roughness: 0.9 })} cast={false} />
            <Gable w={hh.w + 0.5} d={hh.d + 0.4} h={0.8} m={M.plain(hh.rc, { roughness: 0.8 })} p={[0, hh.h, 0]} />
          </group>
        ))}
      </group>
    );
  }

  function SlopeTown() {
    const M = useM();
    const hs = useMemo(() => {
      const r = rng(21), out = [];
      for (let i = 0; i < 26; i += 1) {
        const x = -34 + r() * 68, z = -(17 + r() * 14);
        const rr = Math.hypot(x, z);
        if (rr < 15.5 || rr > 30) continue;
        out.push({ x, z, w: 2.6 + r() * 2, d: 2.4 + r() * 1.8, h: 1.8 + r() * 1.6, wc: ['#efe6d4', '#e0cfae', '#d9b9a0', '#e8e4dc'][i % 4], rc: ['#6f6a66', '#8c5a44', '#5f6e7c', '#9a4a3a'][i % 4] });
      }
      return out;
    }, []);
    return (
      <group>
        {hs.map((hh, i) => (
          <group key={i} position={[hh.x, hillY(hh.x, hh.z) - 0.2, hh.z]}>
            <Box s={[hh.w, hh.h, hh.d]} p={[0, hh.h / 2, 0]} m={M.plain(hh.wc, { roughness: 0.9 })} cast={false} />
            <Gable w={hh.w + 0.5} d={hh.d + 0.4} h={0.8} m={M.plain(hh.rc, { roughness: 0.8 })} p={[0, hh.h, 0]} />
          </group>
        ))}
      </group>
    );
  }

  function SlateHall() {
    const M = useM();
    return (
      <group position={[4.6, 0, -4.6]} rotation={[0, -Math.PI / 2, 0]} scale={0.9}>
        <Box s={[6.6, 0.3, 2.8]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[6.0, 1.7, 2.2]} p={[0, 1.15, 0]} m={M.plain('#e8e6df')} />
        {[-2.2, -0.73, 0.73, 2.2].map((x) => <Box key={x} s={[0.8, 1.2, 0.05]} p={[x, 0.95, 1.12]} m={M.plain('#2a2420')} cast={false} />)}
        <Gable w={3.2} d={6.8} h={0.9} m={M.mat('rock', 3, 2, { color: '#6a727a' })} p={[0, 2.0, 0]} r={[0, Math.PI / 2, 0]} />
      </group>
    );
  }

  function Range() {
    const M = useM();
    const rock = M.plain('#56637a', { roughness: 1 });
    const snow = M.plain('#f6f8fb', { roughness: 0.9 });
    const ridgeNear = M.plain('#34542f', { roughness: 1 });
    const ridgeFar = M.plain('#4a6a52', { roughness: 1 });
    // [x, height, radius, z]
    const peaks = [[-80, 20, 17, -90], [-52, 26, 18, -92], [-26, 22, 17, -88], [30, 24, 18, -90], [56, 27, 19, -92], [84, 20, 17, -88]];
    return (
      <group>
        {peaks.map(([x, h, r, z], i) => (
          <group key={i} position={[x, -1, z]}>
            <mesh position={[0, h / 2, 0]} material={rock}><coneGeometry args={[r, h, 7]} /></mesh>
            <mesh position={[0, h * 0.75, 0]} material={snow}><coneGeometry args={[r * 0.52, h * 0.5, 7]} /></mesh>
            <mesh position={[r * 0.8, h * 0.25, 1]} material={rock}><coneGeometry args={[r * 0.7, h * 0.5, 7]} /></mesh>
            <mesh position={[r * 0.8, h * 0.36, 1]} material={snow}><coneGeometry args={[r * 0.38, h * 0.28, 7]} /></mesh>
          </group>
        ))}
        {/* Machhapuchhre: slim fishtail, two thin tips */}
        <group position={[4, -2, -94]}>
          <mesh position={[0, 8, 0]} material={rock}><coneGeometry args={[17, 16, 7]} /></mesh>
          <mesh position={[-2, 11.5, 0]} material={snow}><coneGeometry args={[6.5, 15, 6]} /></mesh>
          <mesh position={[3.2, 10.5, 0]} material={snow}><coneGeometry args={[5.5, 13, 6]} /></mesh>
        </group>
        {/* long low forested ridges across the horizon */}
        {Array.from({ length: 16 }, (_, i) => -90 + i * 12).map((x, i) => (
          <Ball key={`f${x}`} rad={1} p={[x, -7, -72 - (i % 3) * 2]} sc={[16, 11 + (i % 4) * 1.2, 9]} m={ridgeFar} />
        ))}
        {Array.from({ length: 14 }, (_, i) => -84 + i * 13).map((x, i) => (
          <Ball key={`n${x}`} rad={1} p={[x, -7.5, -50 - (i % 3) * 2.5]} sc={[14, 8 + (i % 3) * 1.2, 8]} m={ridgeNear} />
        ))}
      </group>
    );
  }

  function BigTrees() {
    const M = useM();
    // [x, z, scale]: the first four stand at the plaza edge, close round the shrine
    const spots = [[-10.8, 4.8, 2.8], [-4.5, -8.6, 3.0], [4.8, -8.8, 2.8], [10.2, -5.0, 2.6], [-13, -6, 2.6], [-14, 8, 2.4], [12, 12, 2.4], [-3, 15, 2.2], [16, -9, 2.4], [-18, -2, 2.4], [20, 3, 2.4]];
    const bush = M.plain('#c2185b', { roughness: 0.9 });
    return (
      <group>
        {spots.map(([x, z, s], i) => <Tree key={i} p={[x, hillY(x, z) + 0.05, z]} s={s} />)}
        {[[-9.5, -3.6], [-9.5, -1.9], [-9.5, 2.4], [-9.5, 4.2], [-8.6, -7.0]].map(([x, z], i) => (
          <group key={i} position={[x, 0.3, z]}>
            <Ball rad={0.7} p={[0, 0, 0]} sc={[0.9, 0.5, 1.4]} m={bush} />
            <Ball rad={0.5} p={[0.1, 0.12, 0.6]} sc={[0.9, 0.5, 1]} m={M.plain('#d6336c')} />
            <Ball rad={0.5} p={[-0.1, 0.1, -0.6]} sc={[0.9, 0.5, 1]} m={bush} />
          </group>
        ))}
      </group>
    );
  }

  function Env() {
    const M = useM();
    const mound = useMemo(() => new THREE.CylinderGeometry(12.5, 29.5, 5.8, 40, 1), []);
    return (
      <group>
        {/* town ground far below */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.02, 0]} receiveShadow material={M.mat('grass', 20, 20, { color: '#b2b48c' })}>
          <circleGeometry args={[110, 48]} />
        </mesh>
        {/* the hill */}
        <mesh geometry={mound} position={[0, -4.1, 0]} material={M.mat('grass', 10, 3, { color: '#8fae78' })} receiveShadow />
        <StoneStairs pos={[7.6, 0, 3.5]} rot={[0, 0, 0]} />
        <StoneStairs pos={[-3.5, 0, -7.5]} rot={[0, Math.PI / 2, 0]} />
        <Town />
        <SlateHall />
        <SlopeTown />
        <BigTrees />
        <Range />
        {[[16, -16], [-17, 15], [19, 8], [-19, -12], [8, -19], [-8, 19]].map(([x, z], i) => <Tree key={i} p={[x, hillY(x, z) + 0.05, z]} s={2.2} />)}
      </group>
    );
  }

  return { 'bindhyabasini-temple-pokhara': { Main: Shrine, Env } };
}
