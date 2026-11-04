// Jagannath Temple, Kathmandu Durbar Square (c.1563).
// Squat two-roof Newar pagoda of exposed red brick and dark timber on a broad three-step brick plinth with four small corner shrines.
// Axes: front = +z (faces the paved square). ~0.47 units per metre (temple 8.0 high, lower roof 8.2 wide).
// Setting: Pratap Malla's column front-left, tall three-roof Taleju behind-left, Hanuman Dhoka gate and white Gaddi Baithak right,
// brick palace wing behind, flat pale stone plaza with pigeons. Compass facing is inferred (front = west).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, GroundDisc, Tree, Diyo, THREE, useMemo } = K;

  const SAG = 1.5;
  const LIFT = 0.4;
  const surf = (h, ax, az) => h * Math.pow(1 - Math.max(ax, az), SAG) + LIFT * h * Math.pow(ax * az, 2.4);
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const C = {
    brick: '#c4684c', dark: '#3d2315', strut: '#7a3822', carve: '#c08a5c', lattice: '#8a5a34', red: '#a3201a',
    tile: '#a39b90', stone: '#e6dccb', plaza: '#bdb29e',
  };

  /* merge many boxes into one geometry. item: {p, s, r:[rx,ry,rz], ry:(outer rotation about Y)} */
  function mergeBoxes(items) {
    const base = new THREE.BoxGeometry(1, 1, 1);
    const bp = base.attributes.position; const bn = base.attributes.normal; const bu = base.attributes.uv; const bi = base.index.array;
    const pos = []; const nor = []; const uv = []; const idx = [];
    const v = new THREE.Vector3(); const q = new THREE.Quaternion(); const e = new THREE.Euler();
    const m = new THREE.Matrix4(); const o = new THREE.Matrix4(); const nm = new THREE.Matrix3();
    let off = 0;
    items.forEach(({ p, s, r = [0, 0, 0], ry = 0 }) => {
      e.set(r[0], r[1], r[2], 'YXZ'); q.setFromEuler(e);
      m.compose(new THREE.Vector3(p[0], p[1], p[2]), q, new THREE.Vector3(s[0], s[1], s[2]));
      o.makeRotationY(ry); m.premultiply(o);
      nm.getNormalMatrix(m);
      for (let i = 0; i < bp.count; i += 1) {
        v.fromBufferAttribute(bp, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(bn, i).applyNormalMatrix(nm).normalize(); nor.push(v.x, v.y, v.z);
        uv.push(bu.getX(i), bu.getY(i));
      }
      for (let k = 0; k < bi.length; k += 1) idx.push(bi[k] + off);
      off += bp.count;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    base.dispose();
    return g;
  }
  const four = (fn) => [0, 1, 2, 3].flatMap((i) => fn(i).map((it) => ({ ...it, ry: (i * Math.PI) / 2 })));

  function Merged({ items, color, rough = 0.85, emissive, ei = 0.3, cast = false }) {
    const M = useM();
    const g = useMemo(() => mergeBoxes(items), [items]);
    const mat = M.plain(color, emissive ? { roughness: rough, emissive, emissiveIntensity: ei } : { roughness: rough });
    return <mesh geometry={g} material={mat} castShadow={cast} receiveShadow />;
  }

  /* red eave band (and darker fringe) following the curved, upturned roof edge */
  function bandGeo(hw, h, bh, out, drop) {
    const N = 20; const pos = []; const idx = [];
    for (let side = 0; side < 4; side += 1) {
      const base = pos.length / 3; const a = (side * Math.PI) / 2;
      for (let i = 0; i <= N; i += 1) {
        const t = -1 + (2 * i) / N; const x = t * hw; const z = hw + out;
        const y = LIFT * h * Math.pow(Math.abs(t), 2.4) - drop;
        const X = x * Math.cos(a) + z * Math.sin(a); const Z = -x * Math.sin(a) + z * Math.cos(a);
        pos.push(X, y, Z, X, y - bh, Z);
      }
      for (let i = 0; i < N; i += 1) { const p = base + 2 * i; idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function RoofBand({ hw, h, e, bh = 0.3, color = C.red, out = 0.05, drop = 0.0 }) {
    const M = useM();
    const g = useMemo(() => bandGeo(hw, h, bh, out, drop), [hw, h, bh, out, drop]);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide }), [color]);
    return <mesh geometry={g} material={mat} position={[0, e, 0]} castShadow receiveShadow />;
  }

  /* pagoda roof: clay tile, red eave band, dark fringe, soffit */
  function TileRoof({ w, h, e, tile = C.tile }) {
    const M = useM();
    const m = M.mat('roof', w * 0.45, w * 0.45, { color: tile });
    return (
      <group>
        <Roof w={w} d={w} h={h} y={e} m={m} sag={SAG} lift={LIFT} fascia={false} />
        <RoofBand hw={w / 2} h={h} e={e} bh={0.3} color={C.red} out={0.04} />
        <RoofBand hw={w / 2} h={h} e={e} bh={0.12} color="#3a2216" out={0.03} drop={0.3} />
        <Box s={[w * 0.94, 0.12, w * 0.94]} p={[0, e - 0.1, 0]} m={M.plain('#2e1a10')} cast={false} />
      </group>
    );
  }

  /* struts (tudal): 5 per face + 1 per corner = 24 per roof. Returns box lists for struts, and carved bits */
  function strutItems(wallHw, reach, eaveY, drop = 1.4) {
    const strut = []; const carve = [];
    const y1 = eaveY - drop; const y2 = eaveY - 0.1;
    const mk = (x, z1, z2, ry) => {
      const dz = z2 - z1; const dy = y2 - y1; const len = Math.hypot(dz, dy); const a = Math.atan2(dz, dy);
      const mid = [x, (y1 + y2) / 2, (z1 + z2) / 2];
      strut.push({ p: mid, s: [0.3, len, 0.22], r: [a, 0, 0], ry });
      // carved god on the upper part of the strut, erotic panel at its base
      const pt = (t) => [x, y1 + dy * t, z1 + dz * t];
      const g1 = pt(0.66); const b1 = pt(0.14);
      carve.push({ p: [g1[0], g1[1], g1[2] + 0.04], s: [0.3, 0.4, 0.14], r: [a, 0, 0], ry });
      carve.push({ p: [g1[0], g1[1] + 0.15, g1[2] + 0.07], s: [0.2, 0.16, 0.12], r: [a, 0, 0], ry });
      carve.push({ p: [b1[0], b1[1], b1[2] + 0.02], s: [0.3, 0.26, 0.14], r: [a, 0, 0], ry });
    };
    for (let i = 0; i < 4; i += 1) {
      const ry = (i * Math.PI) / 2;
      [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1].forEach((f) => mk(f * wallHw * 0.86, wallHw + 0.02, wallHw + reach, ry));
      mk(0, (wallHw + 0.02) * 1.4142, (wallHw + reach * 1.05) * 1.4142, ry + Math.PI / 4);
    }
    return { strut, carve };
  }

  /* ---------- the temple ---------- */
  const PT = 1.2; // plinth top
  const W0 = 2.5; const E1 = 4.05; const H1 = 2.2; const R1 = 7.6;
  const W1 = 1.5; const UB = E1 + surf(H1, W1 / (R1 / 2), W1 / (R1 / 2)); const E2 = UB + 1.3; const H2 = 1.4; const R2 = 4.3;
  const TOP = E2 + H2;

  function Plinth() {
    const M = useM();
    const steps = [[5.2, 0.4, 0, '#b5503a'], [4.7, 0.4, 0.4, '#c05a42'], [4.2, 0.4, 0.8, '#c96248']];
    return (
      <group>
        <Box s={[8.4, 0.02, 8.4]} p={[0, PT + 0.005, 0]} m={M.plain('#7d6b5c', { roughness: 1 })} cast={false} />
        {steps.map(([hw, h, y, col], i) => (
          <group key={i}>
            <Box s={[hw * 2, h, hw * 2]} p={[0, y + h / 2, 0]} m={M.mat('brick', hw * 1.6, 0.5, { color: col })} />
            <Box s={[hw * 2 + 0.06, 0.06, hw * 2 + 0.06]} p={[0, y + h + 0.0, 0]} m={M.plain('#8a7a6c', { roughness: 0.9 })} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function GroundStorey() {
    const M = useM();
    const wallH = E1 + 0.05 - PT;
    const timber = useMemo(() => {
      const it = [];
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => it.push({ p: [a * W0, PT + 1.22, b * W0], s: [0.26, 2.45, 0.26] }));
      return it.concat(four(() => {
        const z = W0 + 0.03; const o = [];
        o.push({ p: [0, E1 - 0.35, z], s: [W0 * 2 + 0.1, 0.2, 0.2] }); // tie beam
        o.push({ p: [0, PT + 0.1, z], s: [W0 * 2, 0.2, 0.18] }); // base rail
        [[-1.8, 0.8, 1.5], [0, 1.3, 1.7], [1.8, 0.8, 1.5]].forEach(([x, w, h]) => {
          o.push({ p: [x - w / 2 - 0.06, PT + h / 2 + 0.1, z], s: [0.14, h + 0.1, 0.16] });
          o.push({ p: [x + w / 2 + 0.06, PT + h / 2 + 0.1, z], s: [0.14, h + 0.1, 0.16] });
          o.push({ p: [x, PT + h + 0.14, z], s: [w + 0.34, 0.14, 0.16] });
          o.push({ p: [x, PT + h + 0.46, z - 0.01], s: [w + 0.5, 0.1, 0.14] });
        });
        return o;
      }));
    }, []);
    const panels = useMemo(() => four(() => {
      const z = W0 + 0.06; const o = [];
      [-1.8, 1.8].forEach((x) => {
        o.push({ p: [x, PT + 0.88, z], s: [0.8, 1.52, 0.06] });
      });
      return o;
    }), []);
    const bars = useMemo(() => four(() => {
      const z = W0 + 0.1; const o = [];
      [-1.8, 1.8].forEach((x) => {
        [-0.2, 0.2].forEach((dx) => o.push({ p: [x + dx, PT + 0.88, z], s: [0.07, 1.5, 0.05] }));
        [0.45, 0.0, -0.45].forEach((dy) => o.push({ p: [x, PT + 0.88 + dy, z], s: [0.8, 0.07, 0.05] }));
      });
      return o;
    }), []);
    const lintels = useMemo(() => four(() => {
      const z = W0 + 0.06; const o = [];
      [[-1.8, 0.8, 1.5], [0, 1.3, 1.7], [1.8, 0.8, 1.5]].forEach(([x, w, h]) => {
        o.push({ p: [x, PT + h + 0.3, z], s: [w + 0.2, 0.22, 0.12] });
        o.push({ p: [x, PT + h + 0.6, z], s: [w * 0.5, 0.3, 0.1] });
        o.push({ p: [x, PT + h + 0.79, z], s: [w * 0.2, 0.2, 0.1] });
      });
      return o;
    }), []);
    const voids = useMemo(() => four(() => [{ p: [0, PT + 0.9, W0 + 0.05], s: [1.3, 1.7, 0.06] }]), []);
    const tymp = useMemo(() => four(() => [{ p: [0, PT + 2.02, W0 + 0.09], s: [1.1, 0.3, 0.06] }, { p: [0, PT + 2.02, W0 + 0.12], s: [0.5, 0.18, 0.05] }]), []);
    return (
      <group>
        <Box s={[W0 * 2, wallH, W0 * 2]} p={[0, PT + wallH / 2, 0]} m={M.mat('brick', 4, 1.4, { color: C.brick })} />
        <Merged items={timber} color={C.dark} />
        <Merged items={panels} color="#7a4a26" />
        <Merged items={bars} color="#a0693a" />
        <Merged items={lintels} color={C.carve} />
        <Merged items={voids} color="#120a05" />
        <Merged items={tymp} color="#d4a62a" rough={0.35} />
      </group>
    );
  }

  function UpperStorey() {
    const M = useM();
    const wallH = E2 + 0.05 - UB;
    const wy = UB + 0.68;
    const wins = [[-0.95, 0.5, 0.8], [0, 0.85, 0.98], [0.95, 0.5, 0.8]];
    const frame = useMemo(() => {
      const it = [];
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => it.push({ p: [a * W1, UB + wallH / 2, b * W1], s: [0.2, wallH, 0.2] }));
      return it.concat(four(() => {
        const z = W1 + 0.03; const o = [];
        o.push({ p: [0, E2 - 0.14, z], s: [W1 * 2 + 0.08, 0.2, 0.16] });
        o.push({ p: [0, UB + 0.06, z], s: [W1 * 2, 0.16, 0.14] });
        wins.forEach(([x, w, h]) => {
          o.push({ p: [x, wy, z], s: [w + 0.2, h + 0.18, 0.12] });
        });
        return o;
      }));
    }, []);
    const lat = useMemo(() => four(() => wins.map(([x, w, h]) => ({ p: [x, wy, W1 + 0.1], s: [w, h, 0.05] }))), []);
    const bars = useMemo(() => four(() => {
      const o = [];
      wins.forEach(([x, w, h]) => {
        const n = w > 0.6 ? 5 : 3;
        for (let k = 0; k < n; k += 1) o.push({ p: [x - w / 2 + (w * (k + 0.5)) / n, wy, W1 + 0.13], s: [0.04, h, 0.04] });
        [-0.28, 0, 0.28].forEach((d) => o.push({ p: [x, wy + d * h, W1 + 0.13], s: [w, 0.04, 0.04] }));
      });
      return o;
    }), []);
    return (
      <group>
        <Box s={[W1 * 2, wallH, W1 * 2]} p={[0, UB + wallH / 2, 0]} m={M.mat('brick', 3, 1.3, { color: C.brick })} />
        <Merged items={frame} color={C.dark} />
        <Merged items={lat} color={C.lattice} emissive="#b86a20" ei={0.22} />
        <Merged items={bars} color="#4a2b16" />
      </group>
    );
  }

  function Struts() {
    const s1 = useMemo(() => strutItems(W0, 1.15, E1, 1.2), []);
    const s2 = useMemo(() => strutItems(W1, 0.85, E2, 1.0), []);
    const strut = useMemo(() => s1.strut.concat(s2.strut), [s1, s2]);
    const carve = useMemo(() => s1.carve.concat(s2.carve), [s1, s2]);
    return (
      <group>
        <Merged items={strut} color={C.strut} cast />
        <Merged items={carve} color={C.carve} />
      </group>
    );
  }

  function Pigeons({ list, color = '#7d828a' }) {
    const items = useMemo(() => {
      const it = [];
      list.forEach(([x, y, z, a]) => {
        it.push({ p: [x, y + 0.07, z], s: [0.1, 0.085, 0.21], r: [0, a, 0] });
        it.push({ p: [x + Math.sin(a) * 0.14, y + 0.15, z + Math.cos(a) * 0.14], s: [0.056, 0.056, 0.056], r: [0, a, 0] });
      });
      return it;
    }, [list]);
    return <Merged items={items} color={color} cast={false} />;
  }
  function roofPigeons(hw, h, e, n, seed) {
    const r = rng(seed); const out = [];
    let guard = 0;
    while (out.length < n && guard < 400) {
      guard += 1;
      const ax = r() * 1.8 - 0.9; const az = r() * 1.8 - 0.9;
      const s = Math.max(Math.abs(ax), Math.abs(az));
      if (s < 0.38) continue;
      out.push([ax * hw, e + surf(h, Math.abs(ax), Math.abs(az)) + 0.02, az * hw, r() * 6.28]);
    }
    return out;
  }

  function CornerShrine({ p }) {
    const M = useM();
    const wh = 0.95; const hw = 0.5; const rw = 1.75; const rh = 0.55; const e = wh + 0.12;
    const it = useMemo(() => [
      { p: [0, 0.52, hw + 0.03], s: [0.46, 0.8, 0.06] },
    ], []);
    const fr = useMemo(() => [
      ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => ({ p: [a * hw, wh / 2, b * hw], s: [0.12, wh, 0.12] })),
      { p: [0, wh - 0.1, hw + 0.03], s: [hw * 2, 0.12, 0.1] },
      { p: [0, 0.52, hw + 0.04], s: [0.62, 0.88, 0.05] },
    ], []);
    return (
      <group position={p}>
        <Box s={[hw * 2, wh, hw * 2]} p={[0, wh / 2, 0]} m={M.mat('brick', 1.2, 1, { color: C.brick })} />
        <Merged items={fr} color={C.dark} />
        <Merged items={it} color="#120a05" />
        <TileRoof w={rw} h={rh} e={e} />
        <Gajur y={e + rh - 0.04} s={0.75} />
      </group>
    );
  }

  function Ambulatory() {
    const M = useM();
    const m = M.mat('brick', 3, 0.3, { color: '#b5503a' });
    const h = 0.5; const y = PT + h / 2; const c = 3.4;
    return (
      <group>
        <Box s={[c * 2 - 1, h, 0.4]} p={[0, y, -c]} m={m} />
        <Box s={[0.4, h, c * 2 - 1]} p={[c, y, 0]} m={m} />
        <Box s={[0.4, h, c * 2 - 1]} p={[-c, y, 0]} m={m} />
        {[-1, 1].map((k) => <Box key={k} s={[1.1, h, 0.4]} p={[k * 2.2, y, c]} m={m} />)}
      </group>
    );
  }

  function Person({ p, c = '#3b5a8a', seated = true }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[0.26, seated ? 0.3 : 0.5, 0.2]} p={[0, seated ? 0.22 : 0.45, 0]} m={M.plain(c)} cast={false} />
        <Box s={[0.22, 0.12, 0.34]} p={[0, 0.07, 0.12]} m={M.plain('#3a3a44')} cast={false} />
        <Ball rad={0.09} p={[0, seated ? 0.48 : 0.78, 0]} m={M.plain('#c99a76')} />
      </group>
    );
  }

  function JagannathMain() {
    const M = useM();
    const up1 = useMemo(() => roofPigeons(R1 / 2, H1, E1, 46, 11), []);
    const up2 = useMemo(() => roofPigeons(R2 / 2, H2, E2, 22, 29), []);
    const pg = useMemo(() => up1.concat(up2), [up1, up2]);
    return (
      <group>
        <Plinth />
        <GroundStorey />
        <Box s={[R1 * 0.52, 0.2, R1 * 0.52]} p={[0, E1 - 0.1, 0]} m={M.plain('#2e1a10')} cast={false} />
        <Struts />
        <TileRoof w={R1} h={H1} e={E1} />
        <UpperStorey />
        <TileRoof w={R2} h={H2} e={E2} />
        <Box s={[0.8, 0.2, 0.8]} p={[0, TOP - 0.08, 0]} m={M.plain('#6a4a30')} />
        <Gajur y={TOP - 0.02} s={1.3} />
        <Pigeons list={pg} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <CornerShrine key={i} p={[a * 3.4, PT, b * 3.4]} />)}
        <Ambulatory />
        <Person p={[-2.6, 0.8, 4.3]} c="#8a3a3a" />
        <Person p={[-2.0, 0.8, 4.4]} c="#3b5a8a" />
        <Person p={[2.8, 0.4, 5.0]} c="#4a6a3a" />
        <Person p={[3.5, 0.4, 5.1]} c="#a8782a" />
        <Diyo p={[-1.1, PT, 3.9]} light />
        <Diyo p={[1.1, PT, 3.9]} light />
        <Frame s={[10.8, 9.0, 10.8]} p={[0, 4.5, 0]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  // generic small pagoda (Taleju and the little shrine by the Gaddi Baithak)
  function Pag({ tiers, steps = [], p = [0, 0, 0], s = 1, ry = 0, tile = '#a99a72', fin = 1.6 }) {
    const M = useM();
    const geo = useMemo(() => {
      let y = steps.reduce((a, [, h]) => a + h, 0);
      const parts = []; const wins = []; const posts = [];
      tiers.forEach((t, i) => {
        const eave = y + t.wh;
        const nxt = tiers[i + 1];
        const hwR = t.rw / 2;
        const nextBase = nxt ? eave + surf(t.rh, nxt.hw / hwR, nxt.hw / hwR) : eave + t.rh * 0.6;
        parts.push({ ...t, base: y, eave, nextBase });
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => posts.push({ p: [a * t.hw, y + t.wh / 2, b * t.hw], s: [0.22, t.wh, 0.22] }));
        const n = t.win || 3;
        for (let f = 0; f < 4; f += 1) {
          for (let k = 0; k < n; k += 1) {
            const x = -t.hw * 0.62 + (t.hw * 1.24 * (k + 0.5)) / n;
            wins.push({ p: [x, y + t.wh * 0.55, t.hw + 0.04], s: [Math.min(0.55, t.hw * 0.5 / n * 1.6), t.wh * 0.42, 0.1], ry: (f * Math.PI) / 2 });
          }
          posts.push({ p: [0, eave - 0.2, t.hw + 0.03], s: [t.hw * 2 + 0.1, 0.2, 0.16], ry: (f * Math.PI) / 2 });
        }
        y = nxt ? nextBase - 0.04 : eave;
      });
      return { parts, wins, posts, top: parts[parts.length - 1].eave + parts[parts.length - 1].rh };
    }, [tiers, steps]);
    let sy = 0;
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s}>
        {steps.map(([hw, h], i) => { const y0 = sy; sy += h; return <Box key={i} s={[hw * 2, h, hw * 2]} p={[0, y0 + h / 2, 0]} m={M.mat('brick', hw * 1.2, 0.5, { color: '#b8705a' })} />; })}
        {geo.parts.map((t, i) => (
          <group key={i}>
            <Box s={[t.hw * 2, t.nextBase - t.base + 0.05, t.hw * 2]} p={[0, (t.base + t.nextBase + 0.05) / 2, 0]} m={M.mat('brick', t.hw, 1, { color: C.brick })} />
            <TileRoof w={t.rw} h={t.rh} e={t.eave} tile={tile} />
          </group>
        ))}
        <Merged items={geo.posts} color={C.dark} />
        <Merged items={geo.wins} color="#3a2414" />
        <Gajur y={geo.top - 0.04} s={fin} />
      </group>
    );
  }

  const TALEJU_STEPS = Array.from({ length: 12 }, (_, i) => [6.2 - i * 0.19, 0.3]);

  function Taleju() {
    return (
      <Pag
        p={[-34, 0, -34]} s={1.35}
        steps={TALEJU_STEPS}
        tiers={[
          { hw: 2.7, wh: 1.8, rw: 9.4, rh: 1.7, win: 3 },
          { hw: 2.0, wh: 1.4, rw: 7.2, rh: 1.5, win: 3 },
          { hw: 1.4, wh: 1.2, rw: 5.2, rh: 1.3, win: 2 },
        ]}
        tile="#a39b90" fin={2.8}
      />
    );
  }

  function PratapColumn({ p }) {
    const M = useM();
    const st = M.plain('#b59f84', { roughness: 0.95 });
    const cap = M.plain('#a89070', { roughness: 0.95 });
    const gold = M.gold;
    const sh = 4.6;
    return (
      <group position={p}>
        <Box s={[2.3, 0.28, 2.3]} p={[0, 0.14, 0]} m={M.stone} />
        <Box s={[1.7, 0.28, 1.7]} p={[0, 0.42, 0]} m={M.stone} />
        <Box s={[1.1, 0.5, 1.1]} p={[0, 0.81, 0]} m={st} />
        <Cyl rt={0.21} rb={0.28} h={sh} p={[0, 1.06 + sh / 2, 0]} m={st} seg={14} />
        {[0.2, 0.5, 0.8].map((t) => <Cyl key={t} rt={0.34 - t * 0.08} rb={0.34 - t * 0.08} h={0.08} p={[0, 1.06 + sh * t, 0]} m={M.plain('#9c8768')} seg={14} />)}
        <Cyl rt={0.62} rb={0.28} h={0.34} p={[0, 1.06 + sh + 0.15, 0]} m={cap} seg={16} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <mesh key={i} position={[Math.cos(a) * 0.5, 1.06 + sh + 0.22, Math.sin(a) * 0.5]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]} material={st}><coneGeometry args={[0.11, 0.3, 6]} /></mesh>;
        })}
        <Box s={[0.9, 0.16, 0.9]} p={[0, 1.06 + sh + 0.4, 0]} m={cap} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <Cyl key={'cp' + i} rt={0.025} rb={0.025} h={1.15} p={[a * 0.38, 1.06 + sh + 1.05, b * 0.38]} m={M.copper} seg={6} />)}
        <mesh position={[0, 1.06 + sh + 1.78, 0]} rotation={[0, Math.PI / 4, 0]} material={M.copper}><coneGeometry args={[0.7, 0.4, 4]} /></mesh>
        <Ball rad={0.06} p={[0, 1.06 + sh + 2.03, 0]} m={gold} />
        <group position={[0, 1.06 + sh + 0.48, 0]} rotation={[0, Math.PI * 0.75, 0]} scale={0.7}>
          <Box s={[0.7, 0.28, 0.5]} p={[0, 0.14, 0]} m={gold} />
          <Box s={[0.34, 0.42, 0.24]} p={[0, 0.5, 0]} m={gold} />
          <Ball rad={0.13} p={[0, 0.82, 0.02]} m={gold} />
          <mesh position={[0, 1.08, 0.02]} material={gold}><coneGeometry args={[0.1, 0.24, 8]} /></mesh>
          <mesh position={[0, 0.78, -0.16]} rotation={[0.25, 0, 0]} material={gold}><sphereGeometry args={[0.36, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          {[-1, 1].map((k) => <Box key={k} s={[0.14, 0.26, 0.14]} p={[k * 0.28, 0.4, 0.1]} m={gold} />)}
          <mesh position={[0, 1.2, -0.1]} material={gold}><coneGeometry args={[0.05, 0.34, 6]} /></mesh>
        </group>
      </group>
    );
  }

  function Window3({ items, color = '#3a2a22' }) {
    return <Merged items={items} color={color} />;
  }

  /* brick Newar house with tiled hip roof and a row of dark windows per storey */
  function House({ p, ry = 0, w = 7, d = 5, st = 3, tint = '#e0a088', rt = '#b98a6a', sh = 1.9, cream = false }) {
    const M = useM();
    const H = st * sh;
    const wins = useMemo(() => {
      const it = []; const n = Math.max(2, Math.round(w / 1.5));
      for (let s = 0; s < st; s += 1) for (let k = 0; k < n; k += 1) {
        const x = -w / 2 + (w * (k + 0.5)) / n;
        it.push({ p: [x, s * sh + sh * 0.55 + (s === 0 ? 0.0 : 0), d / 2 + 0.03], s: [0.62, 0.8, 0.1] });
        it.push({ p: [x, s * sh + sh * 0.55, d / 2 + 0.06], s: [0.48, 0.64, 0.06] });
      }
      return it;
    }, [w, d, st, sh]);
    return (
      <group position={p} rotation={[0, ry, 0]}>
        {cream ? (
          <group>
            <Box s={[w, sh, d]} p={[0, sh / 2, 0]} m={M.mat('brick', w * 0.5, 0.5, { color: tint })} />
            <Box s={[w + 0.1, H - sh, d + 0.1]} p={[0, sh + (H - sh) / 2, 0]} m={M.plain('#f1eadb', { roughness: 0.9 })} />
            <Box s={[w + 0.2, 0.14, d + 0.2]} p={[0, sh, 0]} m={M.plain('#8a5a3c')} cast={false} />
          </group>
        ) : <Box s={[w, H, d]} p={[0, H / 2, 0]} m={M.mat('brick', w * 0.5, H * 0.5, { color: tint })} />}
        <Merged items={wins} color="#3a2216" />
        <Roof w={w + 1.0} d={d + 1.0} h={1.5} y={H} m={M.mat('roof', w * 0.4, 3, { color: rt })} sag={1.1} lift={0} fascia />
        <RoofBandBox w={w + 1.0} d={d + 1.0} y={H} />
      </group>
    );
  }
  function RoofBandBox({ w, d, y }) {
    const M = useM();
    const r = M.plain(C.red, { roughness: 0.9 });
    return (
      <group>
        <Box s={[w, 0.18, 0.06]} p={[0, y - 0.1, d / 2]} m={r} cast={false} />
        <Box s={[w, 0.18, 0.06]} p={[0, y - 0.1, -d / 2]} m={r} cast={false} />
        <Box s={[0.06, 0.18, d]} p={[w / 2, y - 0.1, 0]} m={r} cast={false} />
        <Box s={[0.06, 0.18, d]} p={[-w / 2, y - 0.1, 0]} m={r} cast={false} />
      </group>
    );
  }

  function GaddiBaithak({ p }) {
    const M = useM();
    const white = M.plain('#f3efe6', { roughness: 0.85 });
    const w = 13; const d = 5.2; const H = 6.6;
    const wins = useMemo(() => {
      const it = []; const trim = [];
      for (let s = 0; s < 3; s += 1) for (let k = 0; k < 9; k += 1) {
        const x = -w / 2 + 0.9 + k * 1.4;
        if (Math.abs(x) < 1.6) continue;
        it.push({ p: [x, 1.0 + s * 2.1, d / 2 + 0.04], s: [0.55, 1.05, 0.08] });
        trim.push({ p: [x, 1.0 + s * 2.1, d / 2 + 0.03], s: [0.8, 1.3, 0.05] });
      }
      return { it, trim };
    }, []);
    const ped = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-1.9, 0); sh.lineTo(1.9, 0); sh.lineTo(0, 1.0); sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false });
    }, []);
    return (
      <group position={p}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={white} />
        <Box s={[w + 0.2, 0.25, d + 0.2]} p={[0, H + 0.12, 0]} m={M.plain('#e6dfd0')} />
        <Box s={[w + 0.1, 0.18, 0.1]} p={[0, 2.1, d / 2 + 0.06]} m={M.plain('#e6dfd0')} cast={false} />
        <Box s={[w + 0.1, 0.18, 0.1]} p={[0, 4.2, d / 2 + 0.06]} m={M.plain('#e6dfd0')} cast={false} />
        <Merged items={wins.trim} color="#fbf8f0" />
        <Merged items={wins.it} color="#2a2f38" />
        {/* central portico: columns and pediment */}
        <Box s={[3.6, 4.0, 0.7]} p={[0, 2.0, d / 2 + 0.35]} m={white} />
        {[-1.5, -0.5, 0.5, 1.5].map((x) => <Cyl key={x} rt={0.17} rb={0.2} h={4.0} p={[x, 2.0, d / 2 + 0.9]} m={white} seg={12} />)}
        <Box s={[4.2, 0.3, 1.4]} p={[0, 4.15, d / 2 + 0.7]} m={white} />
        <mesh geometry={ped} position={[0, 4.3, d / 2 + 0.05]} material={white} castShadow />
        <Box s={[1.1, 2.2, 0.1]} p={[0, 1.1, d / 2 + 0.78]} m={M.plain('#3a2a22')} cast={false} />
        {/* low tiled roof and little cupola */}
        <Roof w={w - 1} d={d - 0.6} h={1.1} y={H + 0.25} m={M.mat('roof', 4, 2, { color: '#d09a78' })} sag={1.2} lift={0} fascia={false} />
        <Box s={[1.4, 0.8, 1.4]} p={[0, H + 1.6, 0]} m={white} />
        <Roof w={1.9} d={1.9} h={0.7} y={H + 2.0} m={M.mat('roof', 1, 1, { color: '#d09a78' })} sag={1.2} lift={0} fascia={false} />
      </group>
    );
  }

  function HanumanGate({ p }) {
    const M = useM();
    const orange = M.plain('#c9532a', { roughness: 0.8 });
    const stoneM = M.stone;
    return (
      <group position={p}>
        {/* palace brick wall */}
        <Box s={[9, 4.4, 1.4]} p={[0, 2.2, 0]} m={M.mat('brick', 5, 2.4, { color: '#dd9a80' })} />
        <Roof w={10} d={2.6} h={0.9} y={4.4} m={M.mat('roof', 4, 1, { color: '#b98a6a' })} sag={1.1} lift={0} fascia />
        <RoofBandBox w={10} d={2.6} y={4.4} />
        {/* the red-orange gateway */}
        <Box s={[3.4, 3.7, 1.7]} p={[0, 1.85, 0.2]} m={orange} />
        <Box s={[1.5, 2.5, 0.3]} p={[0, 1.25, 1.1]} m={M.plain('#1a0f08')} cast={false} />
        <Box s={[2.2, 0.35, 0.4]} p={[0, 2.7, 1.1]} m={M.gold} cast={false} />
        <Box s={[3.6, 0.2, 1.9]} p={[0, 3.75, 0.2]} m={M.plain('#6a3a1c')} />
        <Roof w={3.9} d={2.2} h={0.55} y={3.85} m={M.mat('roof', 1, 1, { color: '#b98a6a' })} sag={1.2} lift={0} fascia={false} />
        {/* Hanuman statue under an orange parasol, lions at the gate */}
        <group position={[2.6, 0, 2.6]}>
          <Box s={[1.0, 0.6, 1.0]} p={[0, 0.3, 0]} m={stoneM} />
          <Box s={[0.5, 0.9, 0.36]} p={[0, 1.05, 0]} m={M.plain('#c4301c')} />
          <Ball rad={0.2} p={[0, 1.7, 0]} m={M.plain('#c4301c')} />
          <Cyl rt={0.02} h={1.0} p={[0.28, 1.9, 0]} m={M.dark} seg={6} />
          <mesh position={[0.28, 2.45, 0]} material={M.plain('#ec8a2a')}><coneGeometry args={[0.7, 0.3, 14]} /></mesh>
        </group>
        {[-1, 1].map((k) => <GateLion key={k} p={[k * 2.1, 0, 1.7]} />)}
        <Torana />
      </group>
    );
  }
  function GateLion({ p }) {
    const M = useM(); const st = M.plain('#b9ad98', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[0.7, 0.45, 0.8]} p={[0, 0.22, 0]} m={st} />
        <Box s={[0.4, 0.5, 0.5]} p={[0, 0.7, -0.05]} m={st} />
        <Box s={[0.12, 0.45, 0.12]} p={[-0.12, 0.7, 0.28]} m={st} />
        <Box s={[0.12, 0.45, 0.12]} p={[0.12, 0.7, 0.28]} m={st} />
        <Ball rad={0.23} p={[0, 1.08, 0.0]} sc={[1.2, 1.1, 0.8]} m={M.plain('#8a7a62')} />
        <Ball rad={0.2} p={[0, 1.08, 0.08]} m={st} />
        <Box s={[0.2, 0.12, 0.16]} p={[0, 1.0, 0.27]} m={st} />
        <Box s={[0.18, 0.04, 0.05]} p={[0, 1.12, 0.26]} m={M.dark} cast={false} />
        {[-0.08, 0.08].map((x) => <Ball key={x} rad={0.025} p={[x, 1.15, 0.26]} m={M.dark} />)}
      </group>
    );
  }
  function Torana() {
    const M = useM();
    return (
      <group position={[0, 2.95, 1.12]}>
        <Box s={[2.5, 0.2, 0.14]} p={[0, 0, 0]} m={M.gold} cast={false} />
        <mesh position={[0, 0.55, 0]} material={M.gold}><coneGeometry args={[1.25, 0.9, 3, 1]} /></mesh>
        <Box s={[1.3, 0.12, 0.1]} p={[0, 0.2, 0.02]} m={M.plain('#c4301c')} cast={false} />
        <Gajur y={1.0} s={0.5} />
      </group>
    );
  }

  function Plaza() {
    const M = useM();
    return (
      <group>
        <GroundDisc r={110} y={-0.06} m={M.plain('#a89d88', { roughness: 1 })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 6]} receiveShadow material={M.plain('#cbbfa8', { roughness: 1 })}><planeGeometry args={[150, 130]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 6]} receiveShadow material={M.plain('#d6ccb7', { roughness: 1 })}><planeGeometry args={[15, 15]} /></mesh>
      </group>
    );
  }

  function PaveLines() {
    const items = useMemo(() => {
      const it = [];
      [-1, 1].forEach((k) => { it.push({ p: [k * 9.5, 0.003, 12], s: [0.7, 0.004, 40] }); });
      it.push({ p: [0, 0.003, 21], s: [40, 0.004, 0.7] });
      it.push({ p: [0, 0.003, 6], s: [24, 0.004, 0.5] });
      return it;
    }, []);
    return <Merged items={items} color="#b3a88f" />;
  }

  function FlockOnGround() {
    const list = useMemo(() => {
      const r = rng(77); const out = [];
      for (let i = 0; i < 55; i += 1) {
        const a = r() * Math.PI * 2; const rad = Math.sqrt(r()) * 6.5;
        out.push([3 + Math.cos(a) * rad * 1.3, 0.0, 10 + Math.sin(a) * rad * 0.8, r() * 6.28]);
      }
      return out;
    }, []);
    return <Pigeons list={list} />;
  }

  function Hills() {
    const M = useM();
    const spec = [[-70, -50, 30, 14, '#8ca08e'], [-20, -80, 36, 18, '#93a692'], [40, -75, 34, 15, '#9aab98'], [82, -30, 28, 12, '#8ca08e'], [-85, 10, 26, 11, '#9aab98'], [90, 30, 24, 10, '#93a692']];
    return (
      <group>
        {spec.map(([x, z, r, h, c], i) => <Ball key={i} rad={r} p={[x, -h * 0.55, z]} sc={[1.3, h / r, 1]} m={M.plain(c, { roughness: 1 })} />)}
      </group>
    );
  }

  function JagannathEnv() {
    const M = useM();
    return (
      <group>
        <Plaza />
        <group position={[-10.5, 0, 2]} scale={0.85}><PratapColumn p={[0, 0, 0]} /></group>
        <Taleju />
        <HanumanGate p={[8.5, 0, -10]} />
        <GaddiBaithak p={[21.5, 0, -8]} />
        <Pag p={[13.5, 0, -3]} s={0.7}
          steps={[[2.0, 0.3], [1.7, 0.3]]}
          tiers={[{ hw: 1.15, wh: 1.4, rw: 3.4, rh: 0.8, win: 1 }, { hw: 0.8, wh: 1.0, rw: 2.3, rh: 0.7, win: 1 }]}
          tile="#b98a6a" fin={0.9} />
        {/* palace wing behind everything, left (north) row, right-front row */}
        <House p={[8, 0, -26]} w={34} d={6} st={3} tint="#d89078" rt="#a98060" />
        <House p={[-34, 0, -2]} ry={Math.PI / 2} w={26} d={5.5} st={3} tint="#e0a088" />
        <House p={[-30, 0, 24]} ry={Math.PI / 2} w={14} d={5} st={4} tint="#d18a70" rt="#a07858" />
        <House p={[30, 0, 18]} ry={-Math.PI / 2} w={16} d={5} st={3} tint="#e6ad94" cream />
        <House p={[8, 0, 40]} ry={Math.PI} w={30} d={5.5} st={3} tint="#dc9880" />
        <PaveLines />
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 9]} receiveShadow material={M.plain('#9b9080', { roughness: 1 })}><planeGeometry args={[16, 9]} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, 0.001, 18]} receiveShadow material={M.plain('#9b9080', { roughness: 1 })}><planeGeometry args={[4, 14]} /></mesh>
          {[0, 1].map((i) => <Box key={'n' + i} s={[4 - i * 0.6, 0.18, 1]} p={[13.5, 0.09 + i * 0.18, -0.6 + i * -0.0]} m={M.plain('#8a7e6c', { roughness: 1 })} />)}
          {[0, 1].map((i) => <Box key={'g' + i} s={[4 - i * 0.6, 0.18, 1]} p={[8.5, 0.09 + i * 0.18, -8.6 + i * -0.4]} m={M.plain('#8a7e6c', { roughness: 1 })} />)}
        </group>
        <FlockOnGround />
        <Tree p={[17, 0, 9]} s={2.6} />
        <Tree p={[-20, 0, 12]} s={2.2} />
        <Hills />
      </group>
    );
  }

  return { 'jagannath-temple': { Main: JagannathMain, Env: JagannathEnv } };
}
