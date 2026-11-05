// Gupteshwor Mahadev Cave, Chhorepatan, Pokhara.
// A sunken teardrop-shaped pit below street level with a double-spiral staircase (pale grey treads, red-orange
// bottle-baluster rail with a black rounded handrail) whose inner stringer wall is painted blue with brown relief
// figures; a rock cave mouth with an iron gate and a lingam at the bottom, green ferns and a tree, a red-orange
// pagoda-roofed shrine pavilion and an arcade of small arches on the terrace behind, a cream three-tier round balconied
// tower on a rubble base, a round ticket balcony and souvenir stalls on the street, and Devi's Fall plunging into a
// narrow banded-rock gorge across the road (on the -x side). Entrance/viewing side = +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Frame, THREE, useMemo, useRef } = K;

  const PI = Math.PI;
  const A = 4.6; // pit half length (x)
  const B = 2.8; // pit half width (z)
  const D = 8.6; // pit depth
  const PS = 1.6; // plan scale of the pit group (x and z)
  const RED = '#b8482a';
  const BLUE = '#3fa5d6';
  const CREAM = '#e7dcc4';
  const GREY = '#cfcabd';
  const BLACK = '#1b1a19';
  const GLOWS = []; // materials whose emissive turns on at dusk
  const CAVELIGHTS = [];
  const DUSKS = []; // [material, dayColor, duskColor]
  let CAVEM = null;
  const caveGlow = () => {
    if (!CAVEM) {
      CAVEM = new THREE.MeshStandardMaterial({ color: '#3a2410', roughness: 0.8, emissive: '#ff9a3c', emissiveIntensity: 0.12 });
      GLOWS.push(CAVEM);
    }
    return CAVEM;
  };
  const duskMat = (day, dusk) => {
    const m = new THREE.MeshStandardMaterial({ color: day, roughness: 1 });
    DUSKS.push([m, new THREE.Color(day), new THREE.Color(dusk)]);
    return m;
  };

  const P = (t, s) => {
    const c = Math.cos(t);
    const sn = Math.sin(t);
    return [s * A * c, s * B * sn * (1 + 0.16 * c)];
  };
  const rnd = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const outline = (s, n = 96) => Array.from({ length: n }, (_, i) => P((i / n) * 2 * PI, s));
  const shapeFrom = (pts) => {
    const sh = new THREE.Shape();
    pts.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)));
    sh.closePath();
    return sh;
  };

  /* ---------- the spiral stair: parameters ---------- */
  const NS = 96;
  const T0 = PI;
  const SPAN = 4 * PI;
  const tOf = (u) => T0 + SPAN * u;
  const sOut = (u) => 1 - 0.36 * u;
  const sIn = (u) => sOut(u) - 0.26;
  const yOf = (u) => -D * u;
  const inward = (t) => {
    const [x, z] = P(t, 1);
    const nx = -x / (A * A);
    const nz = -z / (B * B);
    return Math.atan2(nx, nz); // rotation.y that turns local +z to point toward the pit axis
  };

  /* ---------- baluster geometry ---------- */
  const BAL_PROFILE = [[0, 0], [0.05, 0], [0.05, 0.03], [0.028, 0.075], [0.024, 0.11], [0.058, 0.17], [0.06, 0.2], [0.03, 0.26], [0.034, 0.3], [0.046, 0.325], [0.046, 0.345], [0, 0.345]];
  let balBase = null;
  const getBalBase = () => {
    if (!balBase) balBase = new THREE.LatheGeometry(BAL_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 7).toNonIndexed();
    return balBase;
  };
  function mergeAt(base, list, k = 1) {
    const bp = base.attributes.position.array;
    const bn = base.attributes.normal.array;
    const n = bp.length / 3;
    const pos = new Float32Array(n * list.length * 3);
    const nor = new Float32Array(n * list.length * 3);
    list.forEach(([x, y, z], q) => {
      for (let i = 0; i < n; i += 1) {
        pos[(q * n + i) * 3] = bp[i * 3] * k + x;
        pos[(q * n + i) * 3 + 1] = bp[i * 3 + 1] * k + y;
        pos[(q * n + i) * 3 + 2] = bp[i * 3 + 2] * k + z;
        nor[(q * n + i) * 3] = bn[i * 3];
        nor[(q * n + i) * 3 + 1] = bn[i * 3 + 1];
        nor[(q * n + i) * 3 + 2] = bn[i * 3 + 2];
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return g;
  }
  /** evenly spaced points along a polyline of [x,y,z] */
  function resample(pts, gap) {
    const out = [];
    let acc = 0;
    let next = gap * 0.5;
    for (let k = 1; k < pts.length; k += 1) {
      const a = pts[k - 1];
      const b = pts[k];
      const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      while (next <= acc + seg) {
        const f = (next - acc) / seg;
        out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
        next += gap;
      }
      acc += seg;
    }
    return out;
  }
  const lift = (pts, dy) => pts.map(([x, y, z]) => [x, y + dy, z]);
  const spiralPts = (sFn, off, uA = 0, uB = 1, N = 360) => Array.from({ length: N + 1 }, (_, i) => {
    const u = uA + ((uB - uA) * i) / N;
    const [x, z] = P(tOf(u), sFn(u) + off);
    return [x, yOf(u) - 0.03, z];
  });

  /** bottle-baluster rail along a path: balusters + black rounded handrail + base rail */
  function Rail({ pts, gap = 0.15, h = 0.345, k = 1, bal, hand, base, closed = false, thick = 0.05 }) {
    const g = useMemo(() => {
      const bp = resample(pts, gap * k);
      const hp = lift(pts, h * k + 0.012);
      const bs = lift(pts, 0.02);
      return {
        bal: mergeAt(getBalBase(), bp, k),
        hand: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp.map((p) => new THREE.Vector3(...p)), closed), Math.min(900, pts.length * 2), thick * k + 0.012, 6, closed),
        base: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bs.map((p) => new THREE.Vector3(...p)), closed), Math.min(900, pts.length * 2), 0.045, 5, closed),
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return (
      <group>
        <mesh geometry={g.bal} material={bal} castShadow />
        <mesh geometry={g.hand} material={hand} castShadow />
        <mesh geometry={g.base} material={base} />
      </group>
    );
  }

  /* ---------- the pit ---------- */
  function PitWall() {
    const M = useM();
    const geo = useMemo(() => {
      const R = 7;
      const C = 128;
      const pos = [];
      const col = [];
      const idx = [];
      const c = new THREE.Color();
      for (let r = 0; r <= R; r += 1) {
        for (let j = 0; j <= C; j += 1) {
          const t = (j / C) * 2 * PI;
          const f = r / R;
          const jit = rnd((j % C) * 7 + r * 31) * 0.06 * f + 0.02 * Math.sin(t * 5 + r);
          const [x, z] = P(t, 1 + jit);
          pos.push(x, -D * f, z);
          const front = smooth(0.3 * PI, 0.7 * PI, t) * (1 - smooth(1.1 * PI, 1.3 * PI, t));
          const moss = Math.min(1, 0.72 + 0.28 * (1 - f) + 0.2 * front + 0.3 * (rnd(j * 3 + r * 17) - 0.5));
          c.set('#7a6a48').lerp(new THREE.Color('#2f5f26'), moss);
          c.multiplyScalar(1 - 0.62 * f * f);
          col.push(c.r, c.g, c.b);
        }
      }
      for (let r = 0; r < R; r += 1) {
        for (let j = 0; j < C; j += 1) {
          const a = r * (C + 1) + j;
          const b = a + 1;
          const d = a + C + 1;
          const e = d + 1;
          idx.push(a, d, b, b, d, e);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }, []);
    const floor = useMemo(() => new THREE.ShapeGeometry(shapeFrom(outline(1, 72))), []);
    const lawn = useMemo(() => new THREE.ShapeGeometry(shapeFrom(outline(0.3, 64))), []);
    const wm = M.plain('#ffffff', { roughness: 1, vertexColors: true, side: THREE.DoubleSide });
    return (
      <group>
        <mesh geometry={geo} material={wm} receiveShadow />
        <mesh geometry={floor} material={M.plain('#26321f', { roughness: 1 })} rotation={[-PI / 2, 0, 0]} position={[0, -D, 0]} receiveShadow />
        <mesh geometry={lawn} material={M.plain('#2e5a22', { roughness: 1 })} rotation={[-PI / 2, 0, 0]} position={[0, -D + 0.03, 0]} receiveShadow />
      </group>
    );
  }

  function Stairs() {
    const M = useM();
    const { tread, skirt } = useMemo(() => {
      const tp = [];
      const tcol = [];
      const sp = [];
      const sc = [];
      const col = new THREE.Color();
      const v = (p, y) => [p[0], y, p[1]];
      const tri = (arr, a, b, c) => arr.push(...a, ...b, ...c);
      const quad = (arr, a, b, c, d) => { tri(arr, a, b, c); tri(arr, a, c, d); };
      for (let i = 0; i < NS; i += 1) {
        const u0 = i / NS;
        const u1 = (i + 1) / NS;
        const t0 = tOf(u0);
        const t1 = tOf(u1);
        const ao = P(t0, sOut(u0));
        const ai = P(t0, sIn(u0));
        const bo = P(t1, sOut(u1));
        const bi = P(t1, sIn(u1));
        const y0 = yOf(u0);
        const y1 = yOf(u1);
        quad(tp, v(ao, y0), v(bo, y0), v(bi, y0), v(ai, y0)); // tread
        quad(tp, v(bo, y0), v(bo, y1), v(bi, y1), v(bi, y0)); // riser
        for (let k = 0; k < 12; k += 1) { const sh = k < 6 ? 1 : 0.8; tcol.push(sh * (i % 2 ? 0.92 : 1), sh * (i % 2 ? 0.92 : 1), sh * (i % 2 ? 0.92 : 1)); }
        // inner stringer wall: down to the next loop's deck (loop 1) or to the floor (loop 2)
        const yb = u0 < 0.5 ? yOf(u0 + 0.5) : -D;
        const yb1 = u1 <= 0.5 ? yOf(u1 + 0.5) : -D;
        const q = [v(ai, y0), v(bi, y1), v(bi, yb1), v(ai, yb)];
        quad(sp, q[0], q[1], q[2], q[3]);
        const tm = (t0 + t1) / 2;
        const ang = ((tm % (2 * PI)) + 2 * PI) % (2 * PI);
        const blue = u0 < 0.5 ? 1 : 0;
        void ang;
        const tone = 0.9 + 0.1 * rnd(i);
        for (let k = 0; k < 6; k += 1) {
          // top vertices lighter, bottom darker
          const lowK = k === 2 || k === 3 || k === 5;
          col.set('#cfc8b4').lerp(new THREE.Color(BLUE), blue * (lowK ? 0.3 : 1)).multiplyScalar(tone * (lowK ? 0.4 : 1));
          sc.push(col.r, col.g, col.b);
        }
      }
      const g1 = new THREE.BufferGeometry();
      g1.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
      g1.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 3));
      g1.computeVertexNormals();
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      g2.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
      g2.computeVertexNormals();
      return { tread: g1, skirt: g2 };
    }, []);
    return (
      <group>
        <mesh geometry={tread} material={M.plain('#d9d5ca', { roughness: 0.9, vertexColors: true, side: THREE.DoubleSide })} castShadow receiveShadow />
        <mesh geometry={skirt} material={M.plain('#ffffff', { roughness: 0.95, vertexColors: true, side: THREE.DoubleSide })} castShadow receiveShadow />
      </group>
    );
  }

  function PitRails() {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.7 });
    const redD = M.plain('#8f3820', { roughness: 0.7 });
    const blk = M.plain(BLACK, { roughness: 0.35, metalness: 0.2 });
    const rim = useMemo(() => {
      const pts = [];
      const N = 200;
      const a = T0 + 0.3;
      const b = T0 + 2 * PI - 0.3;
      for (let i = 0; i <= N; i += 1) {
        const [x, z] = P(a + ((b - a) * i) / N, 1.035);
        pts.push([x, 0, z]);
      }
      return pts;
    }, []);
    const inner = useMemo(() => spiralPts(sIn, 0.012, 0.0, 1.0, 360), []);
    const fence = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 60; i += 1) {
        const [x, z] = P(0.45 * PI + (i / 60) * 1.1 * PI, 0.33);
        pts.push([x, -D + 0.03, z]);
      }
      return pts;
    }, []);
    return (
      <group>
        <Rail pts={rim} k={1.4} bal={red} hand={blk} base={redD} thick={0.028} />
        <Rail pts={inner} k={1.4} bal={red} hand={blk} base={redD} thick={0.028} />
        <Rail pts={fence} gap={0.16} k={0.75} bal={M.plain('#f1efe8')} hand={M.plain('#f1efe8')} base={M.plain('#f1efe8')} thick={0.02} />
      </group>
    );
  }

  /* brown clay relief figures on the blue stringer wall (loop-1 inner wall, back arc only) */
  function Relief() {
    const M = useM();
    const clay = M.plain('#74492c', { roughness: 0.9 });
    const items = [];
    const u0 = 0.03;
    const u1 = 0.47;
    const n = 30;
    const SC = 2.3;
    const mu = 0.12;
    for (let i = 0; i < n; i += 1) {
      const f = (i + 0.5) / n;
      const u = u0 + (u1 - u0) * f;
      if (Math.abs(u - mu) < 0.022 || (u > 0.2 && u < 0.3)) continue;
      const t = tOf(u);
      const [x, z] = P(t, sIn(u) - 0.012);
      const ym = yOf(u) - 2.0;
      const ry = inward(t);
      const dance = i % 3 === 1;
      items.push(
        <group key={`f${i}`} position={[x, ym, z]} rotation={[0, ry, 0]} scale={SC}>
          <Box s={[0.11, 0.34, 0.06]} p={[0, -0.12, 0]} m={clay} cast={false} />
          <Ball rad={0.065} p={[0, 0.1, 0]} m={clay} />
          <Box s={[0.3, 0.05, 0.05]} p={[0, dance ? 0.02 : -0.02, 0]} r={[0, 0, dance ? 0.5 : 0.15]} m={clay} cast={false} />
          <Box s={[0.1, 0.22, 0.05]} p={[0.04, -0.37, 0]} r={[0, 0, 0.18]} m={clay} cast={false} />
        </group>,
      );
    }
    // Shiva mask (large round face) and a coiling serpent
    const tm = tOf(mu);
    const [mx, mz] = P(tm, sIn(mu) - 0.02);
    items.push(
      <group key="mask" position={[mx, yOf(mu) - 1.9, mz]} rotation={[0, inward(tm), 0]} scale={2.3}>
        <Ball rad={0.2} sc={[1, 1.15, 0.35]} m={clay} />
        <Ball rad={0.04} p={[-0.07, 0.04, 0.06]} m={M.plain('#f1e2c4')} />
        <Ball rad={0.04} p={[0.07, 0.04, 0.06]} m={M.plain('#f1e2c4')} />
      </group>,
    );
    for (let i = 0; i < 16; i += 1) {
      const u = 0.205 + i * 0.0062;
      const t = tOf(u);
      const [x, z] = P(t, sIn(u) - 0.012);
      items.push(<Ball key={`s${i}`} rad={0.17 - i * 0.004} p={[x, yOf(u) - 2.4 + 0.45 * Math.sin(i * 0.95), z]} sc={[1, 1, 0.55]} m={clay} />);
    }
    return <group>{items}</group>;
  }

  function CaveMouth() {
    const M = useM();
    const rock = M.plain('#7b6a4c', { roughness: 1 });
    const dark = M.plain('#120f0c', { roughness: 1 });
    const t = 3.5 * PI;
    const [x, z] = P(t, sIn(0.625) - 0.02);
    const glow = caveGlow();
    const bars = [];
    for (let i = -5; i <= 5; i += 1) bars.push(<Box key={i} s={[0.025, 0.95, 0.025]} p={[i * 0.12, 0.5, 0.18]} m={M.plain('#2a2a2a', { metalness: 0.5, roughness: 0.5 })} cast={false} />);
    return (
      <group position={[x, -D, z + 0.02]} scale={1.8}>
        <Box s={[1.5, 1.2, 0.2]} p={[0, 0.6, 0.02]} m={rock} />
        <Box s={[1.08, 0.98, 0.3]} p={[0, 0.5, 0.06]} m={dark} cast={false} />
        <Box s={[0.9, 0.7, 0.04]} p={[0, 0.5, -0.1]} m={glow} cast={false} />
        <pointLight position={[0, 0.7, 0.5]} color="#ffa850" intensity={0} distance={6} ref={(l) => { if (l) { l.userData.k = 2.2; CAVELIGHTS.push(l); } }} />
        <Ball rad={0.54} p={[0, 0.98, 0.06]} sc={[1, 0.5, 0.55]} m={dark} />
        <Ball rad={0.52} p={[-0.62, 1.02, 0.08]} sc={[0.55, 0.5, 0.7]} m={rock} />
        <Ball rad={0.52} p={[0.62, 1.02, 0.08]} sc={[0.55, 0.5, 0.7]} m={rock} />
        <Ball rad={0.62} p={[0, 1.18, 0.05]} sc={[1.2, 0.38, 0.6]} m={rock} />
        {bars}
        <Box s={[1.1, 0.03, 0.03]} p={[0, 0.98, 0.18]} m={M.plain('#2a2a2a')} cast={false} />
        <Box s={[1.1, 0.03, 0.03]} p={[0, 0.16, 0.18]} m={M.plain('#2a2a2a')} cast={false} />
        <Cyl rt={0.14} rb={0.17} h={0.1} p={[0, 0.06, -0.05]} m={M.plain('#8a8378')} seg={12} />
        <mesh position={[0, 0.27, -0.05]} material={M.plain('#2b2826', { roughness: 0.5 })}><capsuleGeometry args={[0.07, 0.2, 5, 10]} /></mesh>
        <Box s={[0.5, 0.06, 0.4]} p={[0, 0.03, 0.4]} m={M.plain('#a49c8c')} cast={false} />
        <Cyl rt={0.02} h={0.12} p={[0.3, 0.12, 0.35]} m={glow} seg={6} />
        <Cyl rt={0.02} h={0.12} p={[-0.3, 0.12, 0.35]} m={M.plain('#e8a33a', { emissive: '#e8a33a', emissiveIntensity: 0.4 })} seg={6} />
      </group>
    );
  }

  function Fern({ p, s = 1, c = '#3f7d2e', n = 8 }) {
    const M = useM();
    const m = M.plain(c, { roughness: 1, side: THREE.DoubleSide });
    return (
      <group position={p} scale={s}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * 2 * PI + rnd(i + p[0]) ;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0.24, 0.2, 0]} rotation={[0, 0, -1.05]} material={m} castShadow>
                <coneGeometry args={[0.07, 0.6, 4]} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  function PitPlants() {
    const M = useM();
    const leaf = M.plain('#4a8a34', { roughness: 1 });
    const leaf2 = M.plain('#2a5a24', { roughness: 1 });
    const leaf3 = M.plain('#1f4a1e', { roughness: 1 });
    const hedge = [];
    for (let i = 0; i < 14; i += 1) {
      const t = 0.15 * PI + (i / 14) * 0.8 * PI;
      const [x, z] = P(t, 1.09);
      hedge.push(<Ball key={i} rad={0.2 + 0.1 * rnd(i)} p={[x, 0.08, z]} sc={[1, 0.6, 1]} m={i % 2 ? leaf : leaf2} />);
    }
    // heavy moss and fern cover on the far (back) wall, hugging the wall just above each tread
    const moss = [];
    const ferns = [];
    for (let i = 0; i < 70; i += 1) {
      const th = PI + 0.04 * PI + (i / 70) * 0.92 * PI + 0.05 * rnd(i + 9);
      const u1 = (th - PI) / (4 * PI);
      const k = rnd(i * 3 + 1) < 0.5 ? 0 : 1;
      const yk = yOf(u1 + 0.5 * k);
      const top = k === 0 ? yOf(u1 - 0.5 * 0 ) + 0 : yOf(u1);
      const topY = k === 0 ? 0 : top;
      const y = yk + 0.35 + rnd(i + 21) * Math.max(0.2, topY - yk - 0.9);
      const [x, z] = P(th, 0.975);
      moss.push(<Ball key={`m${i}`} rad={0.26 + 0.14 * rnd(i + 4)} p={[x, y, z]} sc={[1, 0.8, 0.8]} m={i % 3 ? leaf2 : leaf3} />);
      if (i % 4 === 0) ferns.push(<Fern key={`f${i}`} p={[x, y - 0.1, z]} s={1.1} c={i % 8 ? '#2f6a2a' : '#3f7d2e'} n={7} />);
    }
    return (
      <group>
        {hedge}
        {moss}
        {ferns}
        <Fern p={[-1.0, -D + 0.04, 0.5]} s={1.0} />
        
        <Fern p={[0.9, -D + 0.04, 0.0]} s={0.9} c="#356f2b" />
        
        
      </group>
    );
  }

  /* ---------- street-level concrete slab with the pit hole ---------- */
  function Slab() {
    const M = useM();
    const geo = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-8.0, -6.6);
      sh.lineTo(14, -6.6);
      sh.lineTo(14, 12);
      sh.lineTo(-8.0, 12);
      sh.closePath();
      const hole = new THREE.Path();
      outline(PS, 96).forEach(([x, z], i) => (i ? hole.lineTo(x, -z) : hole.moveTo(x, -z)));
      hole.closePath();
      sh.holes.push(hole);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: false });
    }, []);
    const kerb = M.plain('#c4c0b4', { roughness: 0.9 });
    const slabM = useMemo(() => duskMat('#aca89c', '#3a3a3e'), []);
    return (
      <group>
        <mesh geometry={geo} material={slabM} rotation={[-PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow castShadow />
        <Box s={[22, 0.14, 0.22]} p={[3, 0.05, 6.7]} m={kerb} cast={false} />
        <Box s={[0.22, 0.14, 18.6]} p={[14.1, 0.05, -3.3]} m={kerb} cast={false} />
        <Box s={[3.2, 0.06, 0.45]} p={[0, -0.02, 7.0]} m={kerb} cast={false} />
      </group>
    );
  }

  /* ---------- arch wall (flat wall with arched openings) ---------- */
  function ArchWall({ p, r = 0, w, h, n, depth = 0.22, hw = 0.3, hh = 0.55, y0 = 0.2, m, back }) {
    const geo = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.closePath();
      const gap = w / n;
      for (let i = 0; i < n; i += 1) {
        const cx = -w / 2 + gap * (i + 0.5);
        const q = new THREE.Path();
        q.moveTo(cx + hw / 2, y0); q.lineTo(cx + hw / 2, y0 + hh);
        q.absarc(cx, y0 + hh, hw / 2, 0, PI, false);
        q.lineTo(cx - hw / 2, y0); q.closePath();
        sh.holes.push(q);
      }
      const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
      g.translate(0, 0, -depth / 2);
      return g;
    }, [w, h, n, depth, hw, hh, y0]);
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        <Box s={[w - 0.02, h * 0.9, 0.04]} p={[0, h * 0.5, -depth / 2 + 0.06]} m={back || M.plain('#2a1a14')} cast={false} />
      </group>
    );
  }

  /* ---------- the shrine pavilion terrace behind the pit ---------- */
  function Terrace() {
    const M = useM();
    const conc = M.plain('#cbc4b3', { roughness: 0.95 });
    const red = M.plain(RED, { roughness: 0.75 });
    const orange = M.plain('#d4642a', { roughness: 0.7 });
    const roofM = M.plain('#8a5b2e', { roughness: 0.55, metalness: 0.35 });
    const blk = M.plain(BLACK, { roughness: 0.4 });
    const front = useMemo(() => {
      // balustrade along the terrace front, with a gap for the central steps
      const left = [];
      const right = [];
      for (let i = 0; i <= 40; i += 1) {
        left.push([-7.2 + (i / 40) * 5.5, 0.95, -4.5]);
        right.push([-0.2 + (i / 40) * 2.8, 0.95, -4.5]);
      }
      return { left, right };
    }, []);
    const cols = [-1.6, -0.96, -0.32, 0.32, 0.96, 1.6];
    return (
      <group>
        {/* terrace */}
        <Box s={[10.2, 0.95, 4.2]} p={[-2.4, 0.475, -6.55]} m={conc} />
        <Box s={[10.2, 0.08, 0.2]} p={[-2.4, 0.97, -4.5]} m={M.plain('#b7b0a0')} cast={false} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={`s${i}`} s={[2.1, 0.19 * (5 - i), 0.34]} p={[-1.1, 0.095 * (5 - i), -4.07 + i * 0.34]} m={conc} cast={false} />
        ))}
        <Box s={[10.0, 0.8, 0.08]} p={[-2.4, 0.46, -4.44]} m={M.plain(BLUE, { roughness: 0.9 })} cast={false} />
        {Array.from({ length: 13 }, (_, i) => (
          <group key={`tf${i}`} position={[-6.9 + i * 0.72, 0.5, -4.37]} scale={1.1}>
            <Box s={[0.1, 0.3, 0.05]} p={[0, 0, 0]} m={M.plain('#74492c')} cast={false} />
            <Ball rad={0.06} p={[0, 0.2, 0]} m={M.plain('#74492c')} />
            <Box s={[0.28, 0.05, 0.05]} p={[0, 0.08, 0]} r={[0, 0, i % 2 ? 0.45 : 0.1]} m={M.plain('#74492c')} cast={false} />
          </group>
        ))}
        <Rail pts={front.left} bal={red} hand={blk} base={M.plain('#8f3820')} k={0.9} thick={0.05} />
        <Rail pts={front.right} bal={red} hand={blk} base={M.plain('#8f3820')} k={0.9} thick={0.05} />
        {/* the pavilion */}
        <group position={[-1.2, 0.95, -6.6]}>
          <Box s={[3.9, 0.22, 2.4]} p={[0, 0.11, 0]} m={M.plain('#9f9788')} />
          <Box s={[3.5, 1.2, 0.12]} p={[0, 0.82, -0.9]} m={M.plain('#5a2a1a')} />
          <Box s={[0.12, 1.2, 1.9]} p={[-1.72, 0.82, 0]} m={red} />
          <Box s={[0.12, 1.2, 1.9]} p={[1.72, 0.82, 0]} m={red} />
          <Box s={[0.9, 0.7, 0.04]} p={[0, 0.72, -0.82]} m={M.plain('#e8b04a', { emissive: '#d88a20', emissiveIntensity: 0.2 })} cast={false} />
          {cols.map((x, i) => <Cyl key={i} rt={0.065} rb={0.075} h={1.25} p={[x, 0.85, 1.0]} m={orange} seg={8} />)}
          {cols.map((x, i) => <Box key={`b${i}`} s={[0.1, 0.1, 0.1]} p={[x, 0.26, 1.0]} m={M.plain('#8f3820')} cast={false} />)}
          <Box s={[3.6, 0.14, 0.14]} p={[0, 1.48, 1.0]} m={red} />
          <Box s={[3.6, 0.1, 0.1]} p={[0, 1.3, 1.0]} m={orange} cast={false} />
          <Box s={[3.6, 0.12, 0.12]} p={[0, 1.48, -0.9]} m={red} cast={false} />
          {/* tiny Shiva lingam inside */}
          <Cyl rt={0.18} rb={0.22} h={0.16} p={[0, 0.3, -0.3]} m={M.plain('#8a8378')} seg={12} />
          <mesh position={[0, 0.55, -0.3]} material={M.plain('#2b2826', { roughness: 0.5 })}><capsuleGeometry args={[0.1, 0.25, 5, 10]} /></mesh>
          {/* pagoda-style roof, brown corrugated, with a red valance */}
          <Roof w={4.6} d={3.1} h={0.55} y={1.56} m={roofM} sag={1.35} lift={0.12} fascia />
          <Box s={[2.7, 0.4, 1.8]} p={[0, 2.32, 0]} m={red} />
          <Box s={[3.0, 0.08, 2.0]} p={[0, 2.12, 0]} m={M.plain('#e8e0cc')} cast={false} />
          <Roof w={3.4} d={2.3} h={0.8} y={2.5} m={roofM} sag={1.4} lift={0.12} fascia />
          <Box s={[4.1, 0.12, 0.06]} p={[0, 1.5, 1.38]} m={M.plain('#e8e0cc')} cast={false} />
          <Box s={[0.4, 0.14, 0.4]} p={[0, 3.35, 0]} m={roofM} cast={false} />
          <Cyl rt={0.03} rb={0.06} h={0.55} p={[0, 3.65, 0]} m={M.gold} seg={6} />
        </group>
        {/* arcade of small arches, left of the pavilion */}
        <ArchWall p={[-5.4, 0.95, -7.55]} w={3.6} h={1.25} n={7} hw={0.34} hh={0.55} y0={0.15} m={red} back={M.plain('#3a2118')} />
        <Box s={[3.7, 0.08, 0.34]} p={[-5.4, 2.22, -7.55]} m={M.plain('#8f3820')} cast={false} />
        <ArchWall p={[-5.9, 0.95, -5.2]} r={PI / 2} w={2.0} h={1.0} n={4} hw={0.3} hh={0.45} y0={0.12} m={red} back={M.plain('#3a2118')} />
        {/* the big leafy tree on the terrace + a small statue plinth */}
        <group position={[-4.2, 0.95, -5.9]}>
          <Box s={[0.9, 0.35, 0.9]} p={[0, 0.17, 0]} m={conc} />
          <Cyl rt={0.14} rb={0.24} h={1.9} p={[0, 1.2, 0]} m={M.plain('#5a4030')} seg={8} />
          <Ball rad={1.15} p={[0, 2.6, 0]} sc={[1.1, 0.85, 1.1]} m={M.plain('#4a8a34', { roughness: 1 })} />
          <Ball rad={0.8} p={[0.8, 2.3, 0.4]} m={M.plain('#3a7a2c', { roughness: 1 })} />
          <Ball rad={0.8} p={[-0.8, 2.4, -0.3]} m={M.plain('#5a9a3c', { roughness: 1 })} />
          <Ball rad={0.7} p={[0.1, 3.1, -0.2]} m={M.plain('#4f8f36', { roughness: 1 })} />
          <Box s={[0.14, 0.45, 0.1]} p={[0.55, 0.57, 0.3]} m={M.plain('#c09a64')} />
          <Ball rad={0.08} p={[0.55, 0.88, 0.3]} m={M.plain('#c09a64')} />
        </group>
      </group>
    );
  }

  /* ---------- round ticket booth on the street edge (no tent) ---------- */
  function TicketBalcony() {
    const M = useM();
    const cream = M.plain(CREAM, { roughness: 0.9 });
    const rg = useMemo(() => {
      const list = [];
      for (let i = 0; i < 26; i += 1) {
        const a = (i / 26) * 2 * PI;
        list.push([Math.cos(a) * 0.95, 0.98, Math.sin(a) * 0.95]);
      }
      return mergeAt(getBalBase(), list, 0.9);
    }, []);
    return (
      <group position={[-6.6, 0, 7.2]}>
        <Cyl rt={1.1} rb={1.15} h={0.98} p={[0, 0.49, 0]} m={cream} seg={26} />
        <Cyl rt={1.18} rb={1.18} h={0.08} p={[0, 0.98, 0]} m={M.plain('#bdb6a4')} seg={26} />
        <mesh geometry={rg} material={M.plain(RED, { roughness: 0.7 })} />
        <mesh position={[0, 1.34, 0]} rotation={[PI / 2, 0, 0]} material={M.plain(BLACK)}><torusGeometry args={[0.95, 0.04, 6, 30]} /></mesh>
      </group>
    );
  }

  /* ---------- a red-balustraded flight of steps (top at local origin, descending toward +z) ---------- */
  function Flight({ p, n = 12, rise = 0.2, run = 0.42, w = 1.3 }) {
    const M = useM();
    const conc = M.plain('#c4bdad', { roughness: 0.95 });
    const redM = M.plain(RED, { roughness: 0.7 });
    const pts = (x) => Array.from({ length: 7 }, (_, i) => [x, n * rise * (1 - i / 6), (n * run * i) / 6]);
    return (
      <group position={p}>
        {Array.from({ length: n }, (_, i) => (
          <Box key={i} s={[w, rise * (n - i), run]} p={[0, (rise * (n - i)) / 2, run * (i + 0.5)]} m={conc} cast={false} />
        ))}
        <Rail pts={pts(-w / 2 + 0.05)} bal={redM} hand={M.plain(BLACK)} base={M.plain('#8f3820')} k={0.9} thick={0.04} />
        <Rail pts={pts(w / 2 - 0.05)} bal={redM} hand={M.plain(BLACK)} base={M.plain('#8f3820')} k={0.9} thick={0.04} />
      </group>
    );
  }

  /* ---------- cream three-tier round balconied tower rising over a tall rubble retaining wall ---------- */
  const BH = 2.4; // rubble wall height
  function Tower() {
    const M = useM();
    const cream = M.plain(CREAM, { roughness: 0.9 });
    const creamD = M.plain('#d4c7aa', { roughness: 0.9 });
    const rubble = M.mat('rock', 2.6, 1.0, { color: '#e6dcc4', roughness: 1 });
    const dark = M.plain('#2b2a28', { roughness: 0.7 });
    const eave = M.plain('#8d8472', { roughness: 0.8 });
    const redM = M.plain(RED, { roughness: 0.7 });
    const radii = [1.5, 1.2, 0.92];
    const H = 1.25;
    const y0 = BH;
    const rings = useMemo(() => radii.map((r) => {
      const n = Math.round(r * 18);
      const list = [];
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * 2 * PI;
        list.push([Math.cos(a) * (r + 0.3), 0, Math.sin(a) * (r + 0.3)]);
      }
      return mergeAt(getBalBase(), list, 0.85);
    }), []); // eslint-disable-line react-hooks/exhaustive-deps
    const tiers = radii.map((r, k) => {
      const yb = y0 + k * (H + 0.18);
      const nOp = 8;
      return (
        <group key={k} position={[0, yb, 0]}>
          <Cyl rt={r} rb={r} h={H} p={[0, H / 2, 0]} m={cream} seg={32} />
          {Array.from({ length: nOp }, (_, i) => {
            const a = (i / nOp) * 2 * PI + (k % 2) * 0.2;
            return (
              <group key={i} rotation={[0, a, 0]}>
                <Box s={[0.34, 0.62, 0.1]} p={[0, H * 0.55, r + 0.0]} m={dark} cast={false} />
                <Ball rad={0.17} p={[0, H * 0.55 + 0.31, r]} sc={[1, 0.7, 0.4]} m={dark} />
                <Box s={[0.1, 0.8, 0.14]} p={[0.34, H * 0.5, r - 0.02]} m={creamD} cast={false} />
              </group>
            );
          })}
          <Cyl rt={r + 0.4} rb={r + 0.48} h={0.14} p={[0, H + 0.07, 0]} m={eave} seg={32} />
          <Cyl rt={r + 0.34} rb={r + 0.34} h={0.06} p={[0, H + 0.17, 0]} m={creamD} seg={32} />
          <mesh geometry={rings[k]} position={[0, H + 0.2, 0]} material={redM} />
          <mesh position={[0, H + 0.2 + 0.355, 0]} rotation={[PI / 2, 0, 0]} material={M.plain(BLACK)}><torusGeometry args={[r + 0.3, 0.035, 6, 36]} /></mesh>
        </group>
      );
    });
    const topY = y0 + 2 * (H + 0.18) + H;
    return (
      <group position={[8.6, 0, -5.8]}>
        {/* tall rubble-stone retaining wall */}
        <Box s={[6.6, BH, 3.6]} p={[1.4, BH / 2, 0.2]} m={rubble} />
        <Cyl rt={1.9} rb={2.0} h={BH} p={[0, BH / 2, 0]} m={rubble} seg={28} />
        <Box s={[6.7, 0.08, 3.7]} p={[1.4, BH + 0.02, 0.2]} m={M.plain('#aaa292')} cast={false} />
        {tiers}
        <Cyl rt={0.08} rb={radii[2] + 0.35} h={0.55} p={[0, topY + 0.35 + 0.2, 0]} m={M.plain('#8a5b2e', { roughness: 0.6, metalness: 0.3 })} seg={32} />
        <Cyl rt={0.02} rb={0.04} h={0.35} p={[0, topY + 0.95, 0]} m={M.gold} seg={6} />
        <GalleryBlock />
        {/* two long red-balustraded flights down from the gallery court toward the pit rim */}
        <Flight p={[1.9, BH, 2.0]} n={12} rise={BH / 12} run={0.42} w={1.3} />
        <Flight p={[4.1, BH, 2.0]} n={12} rise={BH / 12} run={0.42} w={1.3} />
        <Rail pts={Array.from({ length: 14 }, (_, i) => [0.25 + (i / 13) * 0.85, BH + 0.03, 2.0])} bal={redM} hand={M.plain(BLACK)} base={M.plain('#8f3820')} k={0.9} />
        {/* small turret with chhatri top at the right end */}
        <group position={[4.2, BH, -1.2]}>
          <Box s={[0.9, 2.2, 0.9]} p={[0, 1.1, 0]} m={cream} />
          {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.12, 0.8, 0.12]} p={[sx * 0.42, 2.6, sz * 0.42]} m={creamD} />))}
          <Box s={[1.05, 0.1, 1.05]} p={[0, 2.2, 0]} m={eave} />
          <Box s={[1.1, 0.1, 1.1]} p={[0, 3.05, 0]} m={eave} />
          <mesh position={[0, 3.3, 0]} material={M.plain('#8a5b2e', { roughness: 0.6 })} castShadow><coneGeometry args={[0.7, 0.5, 4]} /></mesh>
          <Box s={[0.32, 0.6, 0.06]} p={[0, 1.3, 0.46]} m={dark} cast={false} />
        </group>
      </group>
    );
  }

  function GalleryBlock() {
    const M = useM();
    const cream = M.plain('#e2d6ba', { roughness: 0.9 });
    const creamD = M.plain('#cbbf9f', { roughness: 0.9 });
    const dark = M.plain('#2b2a28');
    const lowWin = [];
    for (let i = 0; i < 6; i += 1) lowWin.push(<Box key={i} s={[0.5, 0.8, 0.06]} p={[-1.0 + i * 0.95, BH + 0.95, -2.27]} m={dark} cast={false} />);
    return (
      <group>
        <Box s={[6.4, 1.7, 2.2]} p={[1.4, BH + 0.85, -3.4]} m={cream} />
        {lowWin}
        <Box s={[6.6, 0.14, 2.4]} p={[1.4, BH + 1.77, -3.4]} m={M.plain('#9a9181')} />
        {/* upper storey: arcade of arched openings (not rectangles) */}
        <Box s={[6.4, 1.5, 0.2]} p={[1.4, BH + 2.6, -4.4]} m={cream} />
        <Box s={[6.0, 1.2, 0.1]} p={[1.4, BH + 2.5, -3.7]} m={dark} cast={false} />
        <ArchWall p={[1.4, BH + 1.85, -2.38]} w={6.2} h={1.55} n={7} depth={0.24} hw={0.62} hh={0.72} y0={0.1} m={cream} back={dark} />
        <Box s={[6.6, 0.14, 2.4]} p={[1.4, BH + 3.47, -3.4]} m={M.plain('#9a9181')} />
        <Box s={[6.4, 0.3, 0.1]} p={[1.4, BH + 3.7, -2.35]} m={creamD} cast={false} />
      </group>
    );
  }

  /* ---------- dusk lamps (point lights follow the scene's day/dusk state) ---------- */
  function Lamps() {
    const refs = useRef([]);
    const spots = [[-1.4, 0.6, -6.3, 1.4], [-1.2, 2.5, -6.0, 1.2], [0, -D + 1.6, -3.4, 5.0], [0, -D * 0.5, 0, 3.6], [-4.5, -2.5, 1, 1.6], [4.5, -4, 1, 1.6], [-7.6, 1.4, 0.8, 0.8], [10, 4.5, -3, 1.2], [-8, 2.2, 6, 0.8], [0, 1.2, 6.5, 1.6]];
    const before = (renderer, scene) => {
      const bg = scene.background;
      const dusk = !!(bg && bg.isColor && bg.getHSL({}).l < 0.2);
      refs.current.forEach((l) => { if (l) l.intensity = dusk ? l.userData.k : 0; });
      CAVELIGHTS.forEach((l) => { if (l) l.intensity = dusk ? l.userData.k : 0; });
    };
    return (
      <group>
        <mesh onBeforeRender={before} position={[0, -1, 0]}>
          <planeGeometry args={[0.01, 0.01]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {spots.map(([x, y, z, k], i) => (
          <pointLight key={i} ref={(l) => { if (l) { l.userData.k = k; refs.current[i] = l; } }} position={[x, y, z]} color="#ffb060" intensity={0} distance={11} />
        ))}
      </group>
    );
  }

  function GlowBulbs() {
    const M = useM();
    const bulb = M.plain('#ffd48a', { emissive: '#ffb347', emissiveIntensity: 2.6, roughness: 0.4 });
    const pts = useMemo(() => {
      const out = [];
      for (let i = 0; i < 14; i += 1) {
        const a = T0 + 0.4 + i * 0.42;
        const [x, z] = P(a, 1.035);
        out.push([x, 0.5, z]);
      }
      return out;
    }, []);
    return <group>{pts.map((p, i) => <Ball key={i} rad={0.07} p={p} m={bulb} />)}</group>;
  }

  function Main() {
    return (
      <group>
        <Slab />
        <group scale={[PS, 1, PS]}>
          <PitWall />
          <Stairs />
          <PitRails />
          <Relief />
          <CaveMouth />
          <PitPlants />
          <GlowBulbs />
        </group>
        <group position={[0.5, 0, -2.7]}><Terrace /></group>
        <TicketBalcony />
        <Tower />
        <Lamps />
        <Frame s={[21, 8, 14.5]} p={[1.2, 2.2, -2.5]} />
      </group>
    );
  }

  /* ===================================== ENV ===================================== */
  // Devi's Fall gorge across the street on the -x side (world coordinates)
  const GX0 = -11.6; // mouth of the slot, next to the road
  const GX1 = -19.4;
  const FACE = -16.4; // back wall of the slot, where the fall drops
  const ZL = 1.6;
  const ZR = 4.6;
  const GY0 = -7.6;
  const GY1 = 1.1;
  const GCAP = 3.2;
  const ROADX = -9.7;

  const cache = {};
  function canvasTex(key, w, h, draw) {
    if (!cache[key]) {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      draw(cv.getContext('2d'));
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      cache[key] = t;
    }
    return cache[key];
  }
  let WINM = null;
  const winMat = () => {
    if (!WINM) {
      WINM = new THREE.MeshStandardMaterial({ color: '#4d5d70', roughness: 0.4, emissive: '#ffc060', emissiveIntensity: 0 });
      GLOWS.push(WINM);
    }
    return WINM;
  };

  /** 2-storey Chhorepatan shopfront: shutter, awning and signboard below, window row and balcony above, flat roof */
  function Shop({ p, w, d, floors = 2, c = '#e8dcc0', r = 0, sign = '#8a4a3a', shut = '#6b7a86', awn = '#9a5a3a', tank = false }) {
    const M = useM();
    const FH = 2.7;
    const h = floors * FH;
    const wm = winMat();
    const body = M.plain(c, { roughness: 0.95 });
    const trim = M.plain('#a8a59c', { roughness: 0.9 });
    const rail = M.plain('#7a3a2a', { roughness: 0.8 });
    const nW = Math.max(2, Math.floor(w / 1.7));
    const ups = [];
    for (let f = 1; f < floors; f += 1) {
      const y = f * FH;
      ups.push(<Box key={`s${f}`} s={[w + 0.1, 0.14, 0.6]} p={[0, y, d / 2 + 0.2]} m={trim} cast={false} />);
      ups.push(<Box key={`r${f}`} s={[w, 0.5, 0.05]} p={[0, y + 0.35, d / 2 + 0.47]} m={rail} cast={false} />);
      for (let i = 0; i < nW; i += 1) {
        const x = -w / 2 + ((i + 0.5) * w) / nW;
        ups.push(<Box key={`w${f}${i}`} s={[0.8, 1.2, 0.06]} p={[x, y + 1.4, d / 2 + 0.02]} m={wm} cast={false} />);
      }
    }
    const nA = Math.max(3, Math.round(w / 0.9));
    const aw = [];
    for (let i = 0; i < nA; i += 1) {
      aw.push(<Box key={`a${i}`} s={[(w * 0.92) / nA, 0.06, 1.1]} p={[-w * 0.46 + ((i + 0.5) * w * 0.92) / nA, 2.35, d / 2 + 0.5]} r={[0.35, 0, 0]} m={M.plain(i % 2 ? '#e6dcc4' : awn, { roughness: 0.9 })} cast={false} />);
    }
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={body} />
        <Box s={[w * 0.86, 2.0, 0.07]} p={[0, 1.05, d / 2 + 0.02]} m={M.plain(shut, { roughness: 0.6, metalness: 0.3 })} cast={false} />
        <Box s={[w * 0.9, 0.4, 0.1]} p={[0, 2.35, d / 2 + 0.05]} m={M.plain(sign, { roughness: 0.8 })} cast={false} />
        {aw}
        <Box s={[w + 0.1, 0.16, d + 0.1]} p={[0, h + 0.08, 0]} m={trim} cast={false} />
        {tank && <Cyl rt={0.4} rb={0.4} h={0.7} p={[w * 0.25, h + 0.5, -d * 0.2]} m={M.plain('#3b5a8a', { roughness: 0.6 })} seg={10} />}
        {ups}
      </group>
    );
  }

  const BAND_COL = ['#5f4b30', '#7a6035', '#8f7a45', '#4f4330', '#6e6236', '#836a3a', '#5a4630'];
  function Bands({ x0, x1, z0, z1, y0, y1, n, seed = 0 }) {
    const M = useM();
    const hh = (y1 - y0) / n;
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const j = rnd(i * 5 + seed);
          const ins = 0.14 * rnd(i * 11 + seed + 3);
          const cx = (x0 + x1) / 2;
          const cz = (z0 + z1) / 2;
          const moss = i > n - 3;
          return (
            <Box key={i} s={[x1 - x0 - ins * 2, hh * 0.96, z1 - z0 - ins * 2]} p={[cx, y0 + hh * (i + 0.5), cz]} m={M.plain(moss ? '#6f7d3a' : BAND_COL[Math.floor(j * BAND_COL.length)], { roughness: 1 })} />
          );
        })}
      </group>
    );
  }

  function Gorge() {
    const M = useM();
    const water = M.plain('#2f9aa6', { roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 });
    const white = M.plain('#f6fafb', { roughness: 0.5, emissive: '#cfe4ee', emissiveIntensity: 0.4, transparent: true, opacity: 0.95 });
    const beam = new THREE.MeshBasicMaterial({ color: '#fff2b0', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const grass = M.plain('#6f8f45', { roughness: 1 });
    const zc = (ZL + ZR) / 2;
    const xm = (FACE + GX0) / 2;
    return (
      <group>
        <Bands x0={FACE} x1={GX0} z0={-8} z1={ZL} y0={GY0} y1={GY1} n={16} seed={1} />
        <Bands x0={FACE} x1={GX0} z0={ZR} z1={12} y0={GY0} y1={GY1} n={16} seed={7} />
        <Bands x0={GX1 - 3} x1={FACE} z0={-8} z1={12} y0={GY0} y1={GCAP} n={22} seed={13} />
        {/* grassy tops */}
        <Box s={[GX0 - FACE, 0.16, ZL + 8]} p={[xm, GY1 + 0.08, (ZL - 8) / 2]} m={grass} cast={false} />
        <Box s={[GX0 - FACE, 0.16, 12 - ZR]} p={[xm, GY1 + 0.08, (ZR + 12) / 2]} m={grass} cast={false} />
        <Box s={[FACE - GX1 + 3, 0.16, 20]} p={[(GX1 - 3 + FACE) / 2, GCAP + 0.08, 2]} m={grass} cast={false} />
        {/* pool at the foot of the fall and the fall itself (6.5 m, white against dark banded rock) */}
        <Box s={[0.16, GCAP - GY0 + 0.1, 0.9]} p={[FACE + 0.14, (GCAP + GY0) / 2, zc]} m={white} cast={false} />
        <Box s={[0.28, GCAP - GY0 - 1.5, 0.5]} p={[FACE + 0.2, (GCAP + GY0) / 2 - 0.6, zc]} m={white} cast={false} />
        <Ball rad={1.0} p={[FACE + 0.9, GY0 + 0.9, zc]} sc={[1, 1.2, 1]} m={M.plain('#eef6f8', { transparent: true, opacity: 0.55, roughness: 1 })} />
        <Ball rad={0.7} p={[FACE + 0.7, GY0 + 2.4, zc]} sc={[0.8, 1.4, 1]} m={M.plain('#eef6f8', { transparent: true, opacity: 0.35, roughness: 1 })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[xm, GY0 + 0.1, zc]} material={M.plain('#1f8f9a', { roughness: 0.2, transparent: true, opacity: 0.9 })}><planeGeometry args={[GX0 - FACE - 0.1, ZR - ZL - 0.1]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[(GX1 - 3 + FACE) / 2 - 0.5, GCAP + 0.18, zc]} material={water}><planeGeometry args={[FACE - GX1 + 2, 1.6]} /></mesh>
        {/* light shaft through the slot opening */}
        <mesh material={beam} position={[xm + 1.0, -2, zc]} rotation={[0, 0, 0.25]}><cylinderGeometry args={[1.0, 0.4, 9, 14, 1, true]} /></mesh>
        {/* viewing rail at the mouth of the slot */}
        {[ZL - 0.1, ZR + 0.1].map((z, i) => <Box key={i} s={[0.1, 0.8, 0.1]} p={[GX0 + 0.2, 0.4, z]} m={M.plain('#444')} />)}
        <Box s={[0.08, 0.08, ZR - ZL + 0.3]} p={[GX0 + 0.2, 0.8, zc]} m={M.plain('#444')} cast={false} />
        {[[-13.5, ZL - 0.4], [-15.5, ZL - 0.4], [-13.5, ZR + 0.4], [-16, ZR + 0.4]].map(([x, z], i) => (
          <Fern key={i} p={[x, GY1 + 0.1, z]} s={1.3} c={i % 2 ? '#5b8f3c' : '#3f7d2e'} n={9} />
        ))}
        <K.Tree p={[-15.5, GY1 + 0.1, -6]} s={1.7} />
        
        <K.Tree p={[-21, GCAP + 0.1, -3]} s={2.8} />
        <K.Tree p={[-22, GCAP + 0.1, 8]} s={3.0} />
      </group>
    );
  }

  let ROADM = null;
  const roadM = () => {
    if (!ROADM) ROADM = duskMat('#4a4b4e', '#121214');
    return ROADM;
  };

  function Road() {
    const M = useM();
    const asph = roadM();
    const kerb = M.plain('#b9b6ac', { roughness: 0.9 });
    return (
      <group>
        <Box s={[3.0, 0.1, 110]} p={[ROADX, -0.08, 0]} m={asph} cast={false} />
        <Box s={[0.25, 0.18, 110]} p={[ROADX + 1.6, -0.02, 0]} m={kerb} cast={false} />
        <Box s={[0.25, 0.18, 110]} p={[ROADX - 1.6, -0.02, 0]} m={kerb} cast={false} />
      </group>
    );
  }

  /** souvenir stall: striped canopy, counter and hanging goods */
  function Stall({ p, c, c2 = '#efe6d2', r = 0, w = 2.2 }) {
    const M = useM();
    const nS = 6;
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, 0.9, 0.7]} p={[0, 0.45, 0]} m={M.plain('#8a6a46', { roughness: 0.9 })} />
        <Box s={[w + 0.1, 0.08, 0.8]} p={[0, 0.92, 0]} m={M.plain('#b8a27a')} cast={false} />
        {[-1, 1].map((sx) => <Cyl key={sx} rt={0.035} rb={0.035} h={2.1} p={[sx * (w / 2 - 0.05), 1.05, 0.3]} m={M.plain('#5a4a3a')} seg={6} />)}
        <Box s={[w, 1.1, 0.06]} p={[0, 1.55, -0.32]} m={M.plain('#6a5a48')} cast={false} />
        {Array.from({ length: nS }, (_, i) => (
          <Box key={i} s={[(w + 0.3) / nS, 0.06, 1.3]} p={[-(w + 0.3) / 2 + ((i + 0.5) * (w + 0.3)) / nS, 2.1, 0.35]} r={[0.28, 0, 0]} m={M.plain(i % 2 ? c2 : c, { roughness: 0.9 })} cast={false} />
        ))}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => <Box key={`g${i}`} s={[0.24, 0.3, 0.22]} p={[x * (w / 2.2), 1.1, 0.05]} m={M.plain(['#c0392b', '#e2b33c', '#2e8b57', '#2f6db5', '#a0522d'][i])} cast={false} />)}
        {[-0.7, 0, 0.7].map((x, i) => <Box key={`h${i}`} s={[0.2, 0.5, 0.04]} p={[x * (w / 2.2), 1.7, 0.45]} m={M.plain(['#d4642a', '#6a3a8a', '#3a8a8a'][i])} cast={false} />)}
      </group>
    );
  }

  function LampPost({ p }) {
    const M = useM();
    const bulb = M.plain('#fff0c0', { emissive: '#ffb347', emissiveIntensity: 0.9 });
    return (
      <group position={p}>
        <Cyl rt={0.05} rb={0.07} h={3.2} p={[0, 1.6, 0]} m={M.plain('#55575a')} seg={8} />
        <Box s={[0.7, 0.06, 0.06]} p={[0.3, 3.2, 0]} m={M.plain('#55575a')} cast={false} />
        <Ball rad={0.12} p={[0.62, 3.12, 0]} m={bulb} />
      </group>
    );
  }

  function Hills() {
    const M = useM();
    const cols = ['#5c7f45', '#4d7040', '#6a8a50', '#557a42'];
    // low, distant forested ridges (Pokhara valley rim)
    const hills = [[-80, 0, -60, 40, 7], [-30, 0, -90, 46, 8], [20, 0, -95, 48, 7], [70, 0, -65, 40, 8], [95, 0, -10, 36, 6], [80, 0, 50, 36, 6], [-90, 0, 30, 36, 7], [-70, 0, 75, 36, 6], [0, 0, 100, 44, 6]];
    return (
      <group>
        {hills.map(([x, y, z, r, h], i) => (
          <mesh key={i} position={[x, -1, z]} scale={[1, h / r, 1]} material={M.plain(cols[i % 4], { roughness: 1 })}>
            <sphereGeometry args={[r, 18, 10, 0, PI * 2, 0, PI / 2]} />
          </mesh>
        ))}
      </group>
    );
  }

  function Sky() {
    const mat = useMemo(() => new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#7fa6d6') }, bot: { value: new THREE.Color('#eadcc8') } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; float t = smoothstep(-0.02, 0.5, h); vec3 c = mix(bot, top, t); gl_FragColor = vec4(pow(c, vec3(0.4545)), 1.0); }',
    }), []);
    const before = (renderer, scene) => {
      const bg = scene.background;
      const dusk = !!(bg && bg.isColor && bg.getHSL({}).l < 0.2);
      mat.uniforms.top.value.set(dusk ? '#150c2a' : '#7fa6d6');
      mat.uniforms.bot.value.set(dusk ? '#2a1a44' : '#eadcc8');
      GLOWS.forEach((m) => { m.emissiveIntensity = m === CAVEM ? (dusk ? 2.2 : 0.12) : (dusk ? 1.1 : 0); });
      DUSKS.forEach(([m, d, k]) => m.color.copy(dusk ? k : d));
    };
    return <mesh material={mat} renderOrder={-10} onBeforeRender={before}><sphereGeometry args={[175, 24, 16]} /></mesh>;
  }

  function Ground() {
    const M = useM();
    const geo = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-80, -80); sh.lineTo(80, -80); sh.lineTo(80, 80); sh.lineTo(-80, 80); sh.closePath();
      const h1 = new THREE.Path();
      outline(1.02 * PS, 96).forEach(([x, z], i) => (i ? h1.lineTo(x, -z) : h1.moveTo(x, -z)));
      h1.closePath();
      sh.holes.push(h1);
      const h2 = new THREE.Path();
      h2.moveTo(FACE, -ZL); h2.lineTo(GX0, -ZL); h2.lineTo(GX0, -ZR); h2.lineTo(FACE, -ZR); h2.closePath();
      sh.holes.push(h2);
      return new THREE.ShapeGeometry(sh);
    }, []);
    return (
      <group>
        <mesh geometry={geo} rotation={[-PI / 2, 0, 0]} position={[0, -0.06, 0]} material={useMemo(() => duskMat('#8d8d82', '#2a2a2e'), [])} receiveShadow />
        {/* slot floor under the gorge */}
        <mesh rotation={[-PI / 2, 0, 0]} position={[(FACE + GX0) / 2, GY0, (ZL + ZR) / 2]} material={M.plain('#3b3a30')}><planeGeometry args={[GX0 - FACE, ZR - ZL]} /></mesh>
      </group>
    );
  }

  function Env() {
    const M = useM();
    // 2-storey Chhorepatan bazaar: back row behind the shrine terrace, east row, and a few across the street
    const back = [[-9.2, 3.4, 2, '#e3d3b6', '#8a4a3a', '#9a5a3a'], [-5.6, 4.6, 2, '#cdb6a8', '#4a6a8a', '#7a8a4a'], [-0.6, 3.6, 2, '#d3d9c2', '#9a6a2a', '#8a3a3a'], [3.2, 4.2, 2, '#e1c2a2', '#3a6a4a', '#4a6a8a'], [7.5, 3.0, 2, '#cfd3d6', '#8a4a3a', '#9a7a3a'], [11.2, 4.4, 2, '#e0d4ba', '#4a6a8a', '#8a3a3a'], [15.4, 3.6, 2, '#d6c4b0', '#6a5a3a', '#4a7a5a']];
    const east = [[-9, 4.2, 2, '#e8d6b8', '#3a6a4a', '#8a3a3a'], [-4.2, 3.6, 2, '#dcc9c0', '#8a4a3a', '#9a7a3a']];
    const west = [[-12.2, 4.4, 2, '#e8c8b8', '#8a4a3a', '#4a6a8a'], [-16.8, 4.4, 2, '#d3dccb', '#4a6a8a', '#8a3a3a']];
    return (
      <group>
        <Sky />
        <Hills />
        <Ground />
        <Road />
        <Gorge />
        <Box s={[120, 0.1, 3.4]} p={[0, -0.08, 11]} m={roadM()} cast={false} />
        <Box s={[120, 0.18, 0.25]} p={[0, -0.02, 9.2]} m={M.plain('#b9b6ac', { roughness: 0.9 })} cast={false} />
        {/* souvenir stalls with striped canopies at the street edge, flanking the pit entrance */}
        {[[-4.6, '#c0392b'], [-2.0, '#2f6db5'], [5.2, '#e2b33c'], [8.0, '#2e8b57']].map(([x, c], i) => <Stall key={i} p={[x, 0, 8.2]} c={c} w={2.2} />)}
        {[-14, -3, 8].map((z, i) => <LampPost key={i} p={[-8.35, 0, z]} />)}
        {back.map(([x, w, f, c, s, a], i) => <Shop key={`b${i}`} p={[x, 0, -14.6]} w={w} d={5} floors={f} c={c} sign={s} awn={a} tank={i === 2} />)}
        {east.map(([z, w, f, c, s, a], i) => <Shop key={`e${i}`} p={[19.2, 0, z]} r={-PI / 2} w={w} d={5} floors={f} c={c} sign={s} awn={a} tank={i === 1} />)}
        {west.map(([z, w, f, c, s, a], i) => <Shop key={`w${i}`} p={[-14.9, 0, z]} r={PI / 2} w={w} d={4.4} floors={f} c={c} sign={s} awn={a} />)}
        {[[16.5, 8], [-9, 9.5]].map(([x, z], i) => (
          <group key={`bn${i}`} position={[x, 0, z]}>
            <Cyl rt={0.06} rb={0.1} h={1.1} p={[0, 0.55, 0]} m={M.plain('#7a8a4a')} seg={6} />
            <Fern p={[0, 1.0, 0]} s={1.9} c="#5c9a3a" n={7} />
          </group>
        ))}
      </group>
    );
  }

  return { 'gupteshwor-mahadev-cave': { Main, Env } };
}
