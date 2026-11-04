/* Dantakali Temple, Dharan (Bijayapur hill). A squat TWO-roof pagoda with rose-red painted walls, tarnished grey roofs, an open lattice
   drum under the upper roof, a gilded finial with a red pennant; inside a small whitewashed, peeling walled yard on a hillside, entered
   by a red-pier gate carrying a charcoal sawtooth semicircular nameboard. Plain concrete town houses, wires, big trees, forest slope behind.
   Units ~ metres. Front (gate and temple door) faces +z. Ground rises behind (-z), the lane and steps fall away in front (+z). */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 7.3) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const Y = new THREE.Vector3(0, 1, 0);
  const aim = (dir) => new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(dir[0], dir[1], dir[2]).normalize());

  const GOLD = '#e6b53a'; const YEL = '#f2b81c'; const PINK = '#e2607a'; const PINKL = '#ee8aa0'; const PINKD = '#b53a50';
  const TZ = -1.8; // temple centre z
  const FW = 8.6; // front wall z
  const SW = 7.6; // side wall |x|
  const BW = -7.4; // back wall z

  /* terrain height: flat yard/plots, hill rising behind, lane and slope falling in front */
  const hf = (x, z) => {
    if (Math.abs(x) < 8.1 && z > -8.1 && z < 8.8) return -0.12 + Math.max(0, -z - 3) * 0.05;
    let h = 0;
    if (z < -9) { const d = -9 - z; h = 18 * Math.tanh(d * 0.46 / 18) + Math.sin(x * 0.11 + z * 0.07) * Math.min(2.4, d * 0.15); }
    h += Math.max(0, Math.abs(x) - 30) * 0.22;
    const f = sstep(8.5, 10.0, z);
    h = h * (1 - f) + (-2.0 - Math.max(0, z - 19) * 0.22) * f;
    return Math.max(h, -6);
  };

  /* merge many small primitives into one vertex-coloured geometry */
  function dkMerge(items) {
    const base = {
      b: new THREE.BoxGeometry(1, 1, 1).toNonIndexed(),
      s: new THREE.IcosahedronGeometry(1, 1).toNonIndexed(),
      c: new THREE.CylinderGeometry(0.5, 0.5, 1, 8).toNonIndexed(),
      k: new THREE.ConeGeometry(0.5, 1, 8).toNonIndexed(),
    };
    const P = []; const N = []; const C = [];
    const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler();
    const pv = new THREE.Vector3(); const sv = new THREE.Vector3(); const v = new THREE.Vector3(); const n3 = new THREE.Vector3();
    const nm = new THREE.Matrix3(); const col = new THREE.Color();
    items.forEach((it) => {
      const g = base[it.t || 'b'];
      if (it.q) q.copy(it.q); else { const r = it.r || [0, 0, 0]; e.set(r[0], r[1], r[2]); q.setFromEuler(e); }
      const s = it.s || [1, 1, 1];
      m4.compose(pv.set(it.p[0], it.p[1], it.p[2]), q, sv.set(s[0], s[1], s[2]));
      nm.getNormalMatrix(m4);
      col.set(it.c || '#ffffff');
      const pa = g.attributes.position; const na = g.attributes.normal;
      for (let i = 0; i < pa.count; i += 1) {
        v.fromBufferAttribute(pa, i).applyMatrix4(m4); P.push(v.x, v.y, v.z);
        n3.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(n3.x, n3.y, n3.z);
        C.push(col.r, col.g, col.b);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    return geo;
  }
  function Merged({ items, basic = false }) {
    const M = useM();
    const g = useMemo(() => dkMerge(items), [items]);
    if (basic) return <mesh geometry={g}><meshBasicMaterial vertexColors toneMapped={false} /></mesh>;
    return <mesh geometry={g} material={M.plain('#ffffff', { vertexColors: true, roughness: 0.88 })} castShadow receiveShadow />;
  }

  /* canvas textures (text, murals, peeling whitewash) */
  function useCanvasTex(w, h, draw) {
    return useMemo(() => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  }
  const DEV = '"Nirmala UI","Mangal","Noto Sans Devanagari","Kokila",sans-serif';
  function fitText(ctx, t, x, y, maxW, fs, weight = 'bold') {
    let f = fs;
    ctx.font = `${weight} ${f}px ${DEV}`;
    while (ctx.measureText(t).width > maxW && f > 24) { f -= 4; ctx.font = `${weight} ${f}px ${DEV}`; }
    ctx.fillText(t, x, y);
  }

  /* ---------- the pagoda ---------- */
  const roofY = (x, z, w, h, y, sag, lift) => {
    const ax = Math.abs(x) / (w / 2); const az = Math.abs(z) / (w / 2);
    const s = Math.max(ax, az);
    return y + h * Math.pow(Math.max(0, 1 - s), sag) + lift * h * Math.pow(ax * az, 2.4);
  };
  const seg3 = (a, b, wd, th, c) => {
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = d.length(); d.normalize();
    const lat = new THREE.Vector3().crossVectors(d, Y).normalize(); const nr = new THREE.Vector3().crossVectors(lat, d);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(lat, d, nr));
    return { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], s: [wd, len * 1.04, th], q, c };
  };
  const ROOFC = '#9a8d68';
  function roofDetail(w, h, y, sag, lift, seed) {
    const it = []; const H = w / 2; const pt = (x, z, o = 0.035) => [x, roofY(x, z, w, h, y, sag, lift) + o, z];
    const rot = (k, x, z) => [[x, z], [z, -x], [-x, -z], [-z, x]][k];
    for (let k = 0; k < 4; k += 1) {
      [-0.3, -0.12, 0.12, 0.3].forEach((u) => {
        const ux = u * w; const z0 = Math.abs(ux) + 0.25; const N = 7;
        for (let i = 0; i < N; i += 1) {
          const za = z0 + ((H * 0.93 - z0) * i) / N; const zb = z0 + ((H * 0.93 - z0) * (i + 1)) / N;
          const A = rot(k, ux, za); const B = rot(k, ux, zb);
          it.push(seg3(pt(A[0], A[1]), pt(B[0], B[1]), 0.07, 0.04, '#6a6654'));
        }
      });
      // hip ridge
      for (let i = 0; i < 8; i += 1) {
        const ta = 0.12 * H + (0.86 * H * i) / 8; const tb = 0.12 * H + (0.86 * H * (i + 1)) / 8;
        const A = rot(k, ta, ta); const B = rot(k, tb, tb);
        it.push(seg3(pt(A[0], A[1], 0.05), pt(B[0], B[1], 0.05), 0.13, 0.06, '#c9a43a'));
      }
      // dark eave border
      for (let i = 0; i < 12; i += 1) {
        const xa = -H + (2 * H * i) / 12; const xb = -H + (2 * H * (i + 1)) / 12;
        const A = rot(k, xa, H - 0.14); const B = rot(k, xb, H - 0.14);
        it.push(seg3(pt(A[0], A[1], 0.05), pt(B[0], B[1], 0.05), 0.25, 0.07, '#4a473c'));
      }
    }
    // mottled tarnish patches lying on the slope
    const pal = ['#9a9478', '#7a7664', '#a39a7c', '#6f6c5c', '#94906f'];
    for (let i = 0; i < 26; i += 1) {
      const a = rnd(seed + i) * 6.28; const r = (0.2 + rnd(seed + i + 50) * 0.7) * H * 0.9;
      const x = Math.cos(a) * r; const z = Math.sin(a) * r; const e = 0.05;
      const gx = (roofY(x + e, z, w, h, y, sag, lift) - roofY(x - e, z, w, h, y, sag, lift)) / (2 * e);
      const gz = (roofY(x, z + e, w, h, y, sag, lift) - roofY(x, z - e, w, h, y, sag, lift)) / (2 * e);
      it.push({ p: pt(x, z, 0.03), s: [0.5 + rnd(seed + i + 9) * 0.6, 0.03, 0.4 + rnd(seed + i + 19) * 0.5], q: aim([-gx, 1, -gz]), c: pal[i % 5] });
    }
    return it;
  }
  function strutRing(half, yb, out, rise, xs, c, th = 0.14) {
    const len = Math.hypot(out, rise); const tilt = Math.atan2(rise, out); const items = [];
    const mk = (x, z, psi) => {
      const q = new THREE.Quaternion().setFromAxisAngle(Y, psi).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -tilt));
      items.push({ p: [x + (Math.sin(psi) * out) / 2, yb + rise / 2, z + (Math.cos(psi) * out) / 2], s: [th, th, len], q, c });
    };
    xs.forEach((x) => { mk(x, half, 0); mk(x, -half, Math.PI); mk(half, x, Math.PI / 2); mk(-half, x, -Math.PI / 2); });
    [[1, 1, Math.PI / 4], [1, -1, (3 * Math.PI) / 4], [-1, -1, (-3 * Math.PI) / 4], [-1, 1, -Math.PI / 4]].forEach(([sx, sz, psi]) => mk(sx * half, sz * half, psi));
    return items;
  }

  function DkTemple() {
    const M = useM();
    const wall = M.plain('#e4607a', { roughness: 0.8 });
    const roofM = M.plain(ROOFC, { roughness: 0.6, metalness: 0.2 });
    const pinkL = M.plain(PINKL, { roughness: 0.8 });
    const pinkD = M.plain(PINKD, { roughness: 0.8 });
    const pinkM = M.plain('#d04a64', { roughness: 0.8 });
    const dark = M.plain('#2a1512', { roughness: 0.9 });
    const yellow = M.plain(YEL, { roughness: 0.55, metalness: 0.15 });
    const orange = M.plain('#e08a3e', { roughness: 0.85 });

    const frameGeo = useMemo(() => {
      const w = 0.95; const hs = 1.45; const sh = new THREE.Shape();
      sh.moveTo(-w, 0); sh.lineTo(w, 0); sh.lineTo(w, hs); sh.absarc(0, hs, w, 0, Math.PI, false); sh.lineTo(-w, 0);
      const iw = 0.72; const hole = new THREE.Path();
      hole.moveTo(-iw, 0); hole.lineTo(-iw, hs); hole.absarc(0, hs, iw, Math.PI, 0, true); hole.lineTo(iw, 0); hole.lineTo(-iw, 0);
      sh.holes.push(hole);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false });
    }, []);
    const fanGeo = useMemo(() => {
      const sh = new THREE.Shape(); sh.absellipse(0, 0, 0.95, 0.62, 0, Math.PI, false); sh.lineTo(0.95, 0);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false });
    }, []);
    const fan2Geo = useMemo(() => {
      const sh = new THREE.Shape(); sh.absellipse(0, 0, 0.7, 0.42, 0, Math.PI, false); sh.lineTo(0.7, 0);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false });
    }, []);

    /* everything made of many thin bars/struts, merged */
    const bits = useMemo(() => {
      const it = [];
      // lower bracket ring under the wide roof + under the upper roof
      strutRing(3.7, 3.0, 0.65, 0.55, [-2.9, -1.45, 0, 1.45, 2.9], '#c43e55', 0.15).forEach((x) => it.push(x));
      strutRing(1.95, 5.35, 0.55, 0.5, [-1.0, 0, 1.0], '#c43e55', 0.12).forEach((x) => it.push(x));
      // lattice windows on the four faces of the drum (open tracery over a dark interior)
      [0, 1, 2, 3].forEach((f) => {
        const ang = (f * Math.PI) / 2; const c = Math.cos(ang); const s = Math.sin(ang);
        const put = (lx, ly, sx, sy) => it.push({ p: [lx * c + 1.8 * s, ly, -lx * s + 1.8 * c], s: [sx * c + 0.05 * Math.abs(s), sy, sx * Math.abs(s) + 0.05 * Math.abs(c)], c: '#c5445b' });
        for (let i = 0; i < 11; i += 1) put(-1.35 + i * 0.27, 5.05, 0.05, 0.95);
        put(0, 4.78, 2.9, 0.05); put(0, 5.3, 2.9, 0.05);
      });
      // front: grille bars (yellow iron) of the two bays
      [-1, 1].forEach((sx) => {
        for (let i = 0; i < 11; i += 1) it.push({ p: [sx * 2.33 - 0.9 + i * 0.18, 1.78, 3.76], s: [0.035, 1.55, 0.04], c: YEL });
        it.push({ p: [sx * 2.33, 2.58, 3.76], s: [1.95, 0.07, 0.06], c: YEL });
        it.push({ p: [sx * 2.33, 0.98, 3.76], s: [1.95, 0.07, 0.06], c: YEL });
        it.push({ p: [sx * 2.33, 1.78, 3.76], s: [1.95, 0.04, 0.05], c: YEL });
      });
      // door grille (follows the arch)
      for (let i = 0; i < 9; i += 1) {
        const x = -0.64 + i * 0.16; const h = 1.45 + Math.sqrt(Math.max(0, 0.72 * 0.72 - x * x)) - 0.05;
        it.push({ p: [x, 0.3 + h / 2, 3.78], s: [0.035, h, 0.04], c: YEL });
      }
      it.push({ p: [0, 1.35, 3.78], s: [1.4, 0.04, 0.05], c: YEL });
      // garlands of marigolds beside the door and over the arch
      for (let k = 0; k < 8; k += 1) { it.push({ t: 's', p: [-0.98, 2.35 - k * 0.2, 4.02], s: [0.08, 0.1, 0.08], c: k % 2 ? '#f08a14' : '#f4c21a' }); }
      for (let k = 0; k < 6; k += 1) { it.push({ t: 's', p: [0.98, 2.35 - k * 0.2, 4.02], s: [0.08, 0.1, 0.08], c: k % 2 ? '#e2541a' : '#f08a14' }); }
      for (let k = 0; k < 11; k += 1) { const x = -0.85 + k * 0.17; it.push({ t: 's', p: [x, 2.72 - Math.sin((k / 10) * Math.PI) * 0.18, 4.0], s: [0.08, 0.08, 0.08], c: k % 2 ? '#f08a14' : '#f4c21a' }); }
      roofDetail(8.8, 2.3, 3.62, 1.6, 0.35, 3).forEach((x) => it.push(x));
      roofDetail(5.3, 2.1, 5.98, 1.6, 0.35, 41).forEach((x) => it.push(x));
      return it;
    }, []);

    const flagCloth = M.plain('#d9441e', { roughness: 0.9 });
    const pigeons = [[-3.0, 3.7], [-2.2, 4.0], [0.9, 3.9], [2.3, 3.6], [3.3, 2.6], [-3.6, 1.2], [3.7, -1.2], [-1.0, 3.3]];

    return (
      <group>
        {/* plinth, one low step */}
        <Box s={[8.3, 0.3, 8.3]} p={[0, 0.15, 0]} m={orange} />
        {/* ground storey: rose-red painted walls */}
        <Box s={[7.4, 3.1, 7.4]} p={[0, 1.85, 0]} m={wall} />
        {/* frieze band under the roof */}
        <Box s={[7.52, 0.42, 7.52]} p={[0, 3.2, 0]} m={pinkL} />
        <Box s={[7.56, 0.06, 7.56]} p={[0, 2.99, 0]} m={M.plain(GOLD, { roughness: 0.5, metalness: 0.3 })} />
        {/* corner pilasters */}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => <Box key={`${sx}${sz}`} s={[0.34, 3.1, 0.34]} p={[sx * 3.63, 1.85, sz * 3.63]} m={pinkM} />)}
        {/* front facade: bays, door pilasters, dark recesses */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Box s={[1.95, 1.7, 0.08]} p={[sx * 2.33, 1.78, 3.69]} m={dark} cast={false} />
            <Box s={[0.26, 3.0, 0.14]} p={[sx * 1.22, 1.8, 3.74]} m={pinkM} />
            <Box s={[0.3, 3.0, 0.14]} p={[sx * 3.46, 1.8, 3.74]} m={pinkM} />
            {/* gold horizontal emblem plaque */}
            <Box s={[1.1, 0.12, 0.06]} p={[sx * 2.33, 2.82, 3.73]} m={M.gold} cast={false} />
            <Box s={[0.5, 0.2, 0.06]} p={[sx * 2.33, 2.82, 3.74]} m={M.plain('#c9942a', { metalness: 0.4, roughness: 0.4 })} cast={false} />
            <Cyl rt={0.12} h={0.07} p={[sx * 2.33, 2.82, 3.77]} r={[Math.PI / 2, 0, 0]} m={M.gold} seg={16} />
          </group>
        ))}
        {/* arched yellow doorway with scalloped gold fan crest */}
        <group position={[0, 0.3, 3.7]}>
          <Box s={[1.5, 2.3, 0.1]} p={[0, 1.15, -0.06]} m={dark} cast={false} />
          <mesh geometry={frameGeo} material={yellow} position={[0, 0, 0]} castShadow />
        </group>
        <mesh geometry={fanGeo} material={M.gold} position={[0, 2.68, 3.72]} castShadow />
        <mesh geometry={fan2Geo} material={M.plain('#c4243a', { roughness: 0.7 })} position={[0, 2.72, 3.82]} />
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => <Ball key={k} rad={0.06} p={[Math.sin((k / 3.6) * 1.25) * 0.98, 2.68 + Math.cos((k / 3.6) * 1.25) * 0.6, 3.84]} m={M.gold} />)}
        {/* little gold shield on the frieze above the door */}
        <Box s={[0.46, 0.26, 0.06]} p={[0, 3.3, 3.8]} m={M.gold} cast={false} />
        {/* step in front of the door */}
        <Box s={[3.2, 0.16, 0.6]} p={[0, 0.08, 4.4]} m={orange} />

        {/* lower roof, soffit and pink fascia */}
        <Box s={[8.6, 0.1, 8.6]} p={[0, 3.52, 0]} m={pinkD} cast={false} />
        <Roof w={8.8} d={8.8} h={2.3} y={3.62} m={roofM} sag={1.6} lift={0.35} fascia={false} />
        <Box s={[8.8, 0.2, 0.18]} p={[0, 3.66, 4.4]} m={pinkM} />
        <Box s={[8.8, 0.2, 0.18]} p={[0, 3.66, -4.4]} m={pinkM} />
        <Box s={[0.18, 0.2, 8.8]} p={[4.4, 3.66, 0]} m={pinkM} />
        <Box s={[0.18, 0.2, 8.8]} p={[-4.4, 3.66, 0]} m={pinkM} />
        {/* gilded corner figures on the lower roof */}
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[sx * 4.05, roofY(4.05, 4.05, 8.8, 2.3, 3.62, 1.6, 0.35) - 0.2, sz * 4.05]}>
            <Cyl rt={0.07} rb={0.12} h={0.42} p={[0, 0.2, 0]} m={M.gold} seg={8} />
            <Ball rad={0.1} p={[0, 0.5, 0]} m={M.gold} />
          </group>
        ))}
        {/* pigeons */}
        {pigeons.map(([x, z], i) => (
          <Ball key={i} rad={0.13} sc={[1.3, 0.8, 0.9]} p={[x, roofY(x, z, 8.8, 2.3, 3.62, 1.6, 0.35) + 0.1, z]} m={M.plain(i % 3 ? '#8d929b' : '#e4e4e0')} />
        ))}

        {/* upper drum: dark open interior, corner posts, lattice bars (merged) */}
        <Box s={[3.5, 1.7, 3.5]} p={[0, 5.05, 0]} m={dark} />
        {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => <Box key={`${sx}${sz}`} s={[0.36, 1.7, 0.36]} p={[sx * 1.78, 5.05, sz * 1.78]} m={wall} />)}
        <Box s={[3.96, 0.3, 3.96]} p={[0, 4.55, 0]} m={wall} />
        <Box s={[3.96, 0.2, 3.96]} p={[0, 5.8, 0]} m={pinkL} />
        {/* upper roof */}
        <Box s={[5.1, 0.1, 5.1]} p={[0, 5.92, 0]} m={pinkD} cast={false} />
        <Roof w={5.3} d={5.3} h={2.1} y={5.98} m={roofM} sag={1.6} lift={0.35} fascia={false} />
        <Box s={[5.3, 0.18, 0.16]} p={[0, 6.02, 2.65]} m={pinkM} />
        <Box s={[5.3, 0.18, 0.16]} p={[0, 6.02, -2.65]} m={pinkM} />
        <Box s={[0.16, 0.18, 5.3]} p={[2.65, 6.02, 0]} m={pinkM} />
        <Box s={[0.16, 0.18, 5.3]} p={[-2.65, 6.02, 0]} m={pinkM} />
        {/* gilded finial, thin pinnacle and red pennant */}
        <Gajur y={8.05} s={1.15} />
        <Cyl rt={0.03} rb={0.05} h={1.5} p={[0, 9.7, 0]} m={M.gold} seg={8} />
        <mesh position={[0, 10.55, 0]} material={M.gold}><coneGeometry args={[0.06, 0.3, 8]} /></mesh>
        <Box s={[0.9, 0.3, 0.02]} p={[0.48, 9.9, 0]} m={flagCloth} cast={false} />
        <Box s={[0.5, 0.2, 0.02]} p={[0.28, 9.5, 0]} m={flagCloth} cast={false} />
        <Merged items={bits} />
      </group>
    );
  }

  /* ---------- courtyard furniture ---------- */
  function DkYard() {
    const M = useM();
    const orange = M.plain('#e8893a', { roughness: 0.85 });
    const orangeD = M.plain('#c9672a', { roughness: 0.85 });
    const black = M.plain('#1d1d1f', { roughness: 0.5, metalness: 0.5 });
    const pinkM = M.plain('#d04a64', { roughness: 0.8 });
    const floor = M.plain('#d9784c', { roughness: 0.9 });
    const px = -1.7; const pz = 3.5;
    const post = useMemo(() => {
      const it = [];
      for (let i = 0; i < 5; i += 1) it.push({ t: 'c', p: [px, 0.18 + i * 0.33, pz], s: [0.42, 0.33, 0.42], c: i % 2 ? '#d62a22' : '#f2c01c' });
      it.push({ t: 'k', p: [px, 1.9, pz], s: [0.7, 0.55, 0.7], c: '#c4232a' });
      for (let k = 0; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2; const d = [Math.sin(a) * 0.55, 0.85, Math.cos(a) * 0.55];
        it.push({ t: 'c', p: [px + d[0] * 0.5, 2.15 + d[1] * 0.5, pz + d[2] * 0.5], s: [0.03, 1.0, 0.03], q: aim(d), c: '#6a5236' });
      }
      return it;
    }, []);
    const lamps = useMemo(() => {
      const it = [];
      for (let r = 0; r < 3; r += 1) for (let i = 0; i < 16; i += 1) it.push({ t: 's', p: [-2.0 + i * 0.27, 0.93, 6.0 - 0.18 + r * 0.18], s: [0.05, 0.05, 0.05], c: '#ffb347' });
      return it;
    }, []);
    return (
      <group>
        {/* red-orange tiled yard floor */}
        <Box s={[15.2, 0.08, 17.2]} p={[0, -0.02, 0.7]} m={floor} cast={false} />
        {/* low orange parapet pen in front of the sanctum */}
        {[-1, 1].map((sx) => <Box key={sx} s={[0.34, 0.8, 2.9]} p={[sx * 4.4, 0.4, 3.8]} m={orange} />)}
        {[-1, 1].map((sx) => <Box key={`c${sx}`} s={[0.44, 0.1, 3.0]} p={[sx * 4.4, 0.85, 3.8]} m={orangeD} />)}
        {[-1, 1].map((sx) => <Box key={`f${sx}`} s={[3.2, 0.8, 0.34]} p={[sx * 2.8, 0.4, 5.2]} m={orange} />)}
        {[-1, 1].map((sx) => <Box key={`g${sx}`} s={[3.3, 0.1, 0.44]} p={[sx * 2.8, 0.85, 5.2]} m={orangeD} />)}
        {/* offering post with red cloth and dry branches */}
        <Merged items={post} />
        {/* bell frames */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 3.3, 0, 3.0]}>
            {[-0.45, 0.45].map((x) => <Box key={x} s={[0.14, 2.0, 0.14]} p={[x, 1.0, 0]} m={pinkM} />)}
            <Box s={[1.1, 0.12, 0.14]} p={[0, 2.0, 0]} m={pinkM} />
            <Cyl rt={0.12} rb={0.3} h={0.45} p={[0, 1.58, 0]} m={M.plain('#9a6d2a', { metalness: 0.7, roughness: 0.35 })} seg={14} />
            <Ball rad={0.1} p={[0, 1.8, 0]} m={M.plain('#9a6d2a', { metalness: 0.7, roughness: 0.35 })} />
          </group>
        ))}
        {/* black iron lamp tray with diyas */}
        <Box s={[4.6, 0.08, 0.7]} p={[0, 0.85, 6.0]} m={black} />
        <Box s={[4.6, 0.12, 0.06]} p={[0, 0.92, 6.35]} m={black} />
        {[-2.2, 2.2].map((x) => [-0.28, 0.28].map((z) => <Box key={`${x}${z}`} s={[0.06, 0.85, 0.06]} p={[x, 0.42, 6.0 + z]} m={black} />))}
        <Merged items={lamps} basic />
        <pointLight position={[0, 1.6, 6.0]} intensity={2.2} distance={5} color="#ffa94d" />
        <pointLight position={[0, 2.0, 3.6]} intensity={5} distance={7.5} color="#ffb066" />
      </group>
    );
  }

  /* ---------- boundary wall, gate, murals ---------- */
  function DkWalls() {
    const M = useM();
    const wallTex = useCanvasTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#cfd6d4'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i += 1) {
        const cols = ['#c2ced2', '#bdbcae', '#cfd0c4', '#b3a898', '#bccbd2'];
        ctx.fillStyle = cols[i % 5]; ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.ellipse(rnd(i) * w, rnd(i + 99) * h, 18 + rnd(i + 5) * 60, 10 + rnd(i + 8) * 40, 0, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 18; i += 1) { ctx.fillStyle = '#a8705a'; ctx.beginPath(); ctx.ellipse(rnd(i + 400) * w, h * (0.72 + rnd(i + 410) * 0.28), 12 + rnd(i + 3) * 26, 6 + rnd(i + 4) * 14, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#5d7080';
      for (let i = 0; i < 30; i += 1) ctx.fillRect(rnd(i + 700) * w, 0, 3 + rnd(i + 3) * 7, h * (0.3 + rnd(i + 9) * 0.7));
      ctx.globalAlpha = 1;
    });
    const wallM = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }), [wallTex]);
    const board = useMemo(() => {
      const R = 1.9; const N = 36; const sh = new THREE.Shape();
      sh.moveTo(-(R - 0.17), 0);
      for (let i = 1; i <= N; i += 1) { const a = Math.PI - (i * Math.PI) / N; const r = i % 2 ? R : R - 0.17; sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      sh.lineTo(-(R - 0.17), 0);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false });
    }, []);
    const signTex = useCanvasTex(1024, 512, (ctx) => {
      ctx.fillStyle = '#f4f4ee'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, 'श्री दन्तकाली शक्तिपीठ', 512, 215, 860, 130);
      fitText(ctx, 'धरान-१४', 512, 372, 520, 110);
    });
    const altTex = useCanvasTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f0b820'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#c9731a'; ctx.fillRect(0, h - 18, w, 18);
      ctx.fillStyle = '#7a3a10'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, 'उचाई-१५७२ फिट', w / 2, h / 2, 450, 100);
    });
    const muralA = useCanvasTex(640, 470, (ctx, W0, H0) => {
      ctx.fillStyle = '#eab01d'; ctx.fillRect(0, 0, W0, H0); ctx.translate(115, 0); ctx.scale(0.73, 0.73);
      const w = 560; const h = 640;
      ctx.fillStyle = '#eab01d'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d68a14'; ctx.fillRect(0, 0, 26, h); ctx.fillRect(w - 26, 0, 26, h);
      ctx.beginPath(); ctx.moveTo(40, h); ctx.lineTo(40, 250); ctx.arc(w / 2, 250, w / 2 - 40, Math.PI, 0); ctx.lineTo(w - 40, h); ctx.closePath();
      const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16224a'); gr.addColorStop(1, '#2a3a6a'); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); ctx.translate(w / 2, 300);
      for (let i = 0; i < 40; i += 1) { ctx.rotate((Math.PI * 2) / 40); ctx.fillStyle = i % 2 ? '#f2c230' : '#e8982a'; ctx.beginPath(); ctx.moveTo(-9, -100); ctx.lineTo(0, -235); ctx.lineTo(9, -100); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#f6d24a'; ctx.beginPath(); ctx.arc(w / 2, 300, 105, 0, 7); ctx.fill();
      ctx.fillStyle = '#e07a1f'; ctx.beginPath(); ctx.moveTo(w / 2 - 70, 470); ctx.lineTo(w / 2 - 38, 300); ctx.lineTo(w / 2 + 38, 300); ctx.lineTo(w / 2 + 70, 470); ctx.fill();
      ctx.fillStyle = '#e9ab6e'; ctx.beginPath(); ctx.arc(w / 2, 262, 34, 0, 7); ctx.fill();
      ctx.fillStyle = '#d29a18'; ctx.fillRect(w / 2 - 28, 218, 56, 14);
      ctx.strokeStyle = '#f6d24a'; ctx.lineWidth = 10;
      for (let k = -2; k <= 2; k += 1) { ctx.beginPath(); ctx.moveTo(w / 2 + k * 6, 330); ctx.lineTo(w / 2 + k * 62, 390 + Math.abs(k) * 20); ctx.stroke(); }
      ctx.fillStyle = '#f08aa8';
      for (let k = 0; k < 9; k += 1) { ctx.beginPath(); ctx.ellipse(w / 2 + (k - 4) * 48, 560 + Math.abs(k - 4) * 6, 32, 20, (k - 4) * 0.2, 0, 7); ctx.fill(); }
    });
    const muralB = useCanvasTex(740, 434, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w * 0.35, h * 0.3, 20, w * 0.5, h * 0.5, 460); g.addColorStop(0, '#d03a30'); g.addColorStop(1, '#8e1a22'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(232,226,222,0.8)'; ctx.beginPath(); ctx.ellipse(95, 120, 80, 105, 0.3, 0, 7); ctx.fill();
      const cx = 420; const SK = '#3a4660'; const SKL = '#55648a';
      ctx.fillStyle = 'rgba(244,236,214,0.9)'; ctx.beginPath(); ctx.arc(cx, 112, 82, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f0c84a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, 112, 82, 0, 7); ctx.stroke();
      ctx.fillStyle = '#c8d4ec'; ctx.beginPath(); ctx.ellipse(cx, 398, 190, 24, -0.04, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 205, 386, 22, 0, 7); ctx.fill();
      ctx.strokeStyle = SK; ctx.lineWidth = 26; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 32, 320); ctx.lineTo(cx - 62, 376); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 32, 320); ctx.lineTo(cx + 60, 376); ctx.stroke();
      ctx.fillStyle = '#e0b22a'; ctx.beginPath(); ctx.moveTo(cx - 48, 262); ctx.lineTo(cx + 48, 262); ctx.lineTo(cx + 92, 340); ctx.lineTo(cx - 92, 340); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c4243a'; for (let k = 0; k < 7; k += 1) { ctx.beginPath(); ctx.moveTo(cx - 88 + k * 28, 340); ctx.lineTo(cx - 74 + k * 28, 322); ctx.lineTo(cx - 60 + k * 28, 340); ctx.fill(); }
      ctx.fillStyle = SK; ctx.beginPath(); ctx.moveTo(cx - 52, 168); ctx.lineTo(cx + 52, 168); ctx.lineTo(cx + 38, 270); ctx.lineTo(cx - 38, 270); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ece6d6'; for (let k = 0; k < 9; k += 1) { ctx.beginPath(); ctx.arc(cx - 40 + k * 10, 196 + Math.sin((k / 8) * Math.PI) * 26, 6, 0, 7); ctx.fill(); }
      ctx.strokeStyle = SK; ctx.lineWidth = 14; const hands = [];
      [-1, 1].forEach((sg) => { [0.38, 0.95, 1.55, 2.2].forEach((a) => {
        const sx = cx + sg * 42; const sy = 182; const hx = sx + sg * Math.sin(a) * 135; const hy = sy - Math.cos(a) * 135 + 20;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke(); hands.push([hx, hy, sg, a]);
      }); });
      ctx.fillStyle = SKL; hands.forEach(([hx, hy]) => { ctx.beginPath(); ctx.arc(hx, hy, 11, 0, 7); ctx.fill(); });
      const th = hands.find((q) => q[2] === -1 && q[3] === 0.38);
      ctx.strokeStyle = '#e8d8a0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(th[0], th[1] + 55); ctx.lineTo(th[0], th[1] - 120); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(th[0] - 22, th[1] - 100); ctx.lineTo(th[0] - 22, th[1] - 138); ctx.moveTo(th[0] + 22, th[1] - 100); ctx.lineTo(th[0] + 22, th[1] - 138); ctx.moveTo(th[0], th[1] - 120); ctx.lineTo(th[0], th[1] - 156); ctx.moveTo(th[0] - 22, th[1] - 102); ctx.lineTo(th[0] + 22, th[1] - 102); ctx.stroke();
      const sw = hands.find((q) => q[2] === 1 && q[3] === 0.38);
      ctx.strokeStyle = '#d8e2f0'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sw[0], sw[1] + 20); ctx.lineTo(sw[0] + 14, sw[1] - 100); ctx.stroke();
      ctx.fillStyle = SK; ctx.beginPath(); ctx.arc(cx, 128, 33, 0, 7); ctx.fill();
      ctx.fillStyle = '#f0c030'; ctx.beginPath(); ctx.moveTo(cx - 36, 112); for (let k = 0; k < 4; k += 1) { ctx.lineTo(cx - 36 + k * 18 + 9, 74); ctx.lineTo(cx - 36 + (k + 1) * 18, 112); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.arc(cx - 13, 124, 7, 0, 7); ctx.arc(cx + 13, 124, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0303a'; ctx.beginPath(); ctx.ellipse(cx, 152, 8, 17, 0, 0, 7); ctx.fill();
    });
    const red = M.plain('#bf4a2c', { roughness: 0.9 });
    const cream = M.plain('#e9e5d6', { roughness: 0.9 });
    const charcoal = M.plain('#2b2b2e', { roughness: 0.85 });
    const slat = M.plain('#5a3a24', { roughness: 0.8 });
    const stone = M.mat('stone', 1, 1, { color: '#d6cfbf' });
    const yfl = M.plain('#efb81e', { roughness: 0.75 });
    const FWt = FW; // front wall z
    const piers = useMemo(() => {
      const it = [];
      const add = (x, z) => {
        it.push({ p: [x, 0.6, z], s: [0.62, 3.0, 0.62], c: '#e8e4d4' });
        it.push({ p: [x, 2.15, z], s: [0.8, 0.16, 0.8], c: '#d8d2c0' });
        it.push({ t: 'k', p: [x, 2.41, z], s: [0.95, 0.38, 0.95], q: new THREE.Quaternion().setFromAxisAngle(Y, Math.PI / 4), c: '#8f8c7b' });
        it.push({ t: 'c', p: [x, 2.73, z], s: [0.1, 0.3, 0.1], c: GOLD });
        it.push({ t: 's', p: [x, 2.95, z], s: [0.13, 0.15, 0.13], c: GOLD });
        it.push({ t: 'k', p: [x, 3.23, z], s: [0.1, 0.5, 0.1], c: GOLD });
      };
      add(-SW - 0.2, FWt); add(SW + 0.2, FWt); add(-5.3, FWt);
      [BW, -3.2, 1.6].forEach((z) => { add(-SW - 0.2, z); add(SW + 0.2, z); });
      add(-SW - 0.2, BW); add(SW + 0.2, BW);
      return it;
    }, [FWt]);
    const leaf = useMemo(() => {
      const it = [];
      for (let i = 0; i < 8; i += 1) it.push({ p: [0.07 + i * 0.135, 1.25, FWt - 0.02], s: [0.1, 2.4, 0.06], c: '#5e3b24' });
      it.push({ p: [0.55, 0.55, FWt - 0.07], s: [1.1, 0.1, 0.05], c: '#4a2e1c' }); it.push({ p: [0.55, 2.1, FWt - 0.07], s: [1.1, 0.1, 0.05], c: '#4a2e1c' });
      return it;
    }, [FWt]);
    const wallH = 2.6;
    return (
      <group>
        {/* whitewashed wall: front (two halves flanking the gate), sides, back */}
        <Box s={[6.4, 2.8, 0.5]} p={[-4.85, 0.4, FWt]} m={wallM} />
        <Box s={[5.5, 2.8, 0.5]} p={[5.3, 0.4, FWt]} m={wallM} />
        <Box s={[0.5, 3.2, FWt - BW]} p={[-SW - 0.2, 0.6, (FWt + BW) / 2]} m={wallM} />
        <Box s={[0.5, 3.2, FWt - BW]} p={[SW + 0.2, 0.6, (FWt + BW) / 2]} m={wallM} />
        {/* stone retaining wall holding the compound above the lane */}
        <Box s={[6.9, 1.95, 0.8]} p={[-4.85, -1.03, FWt + 0.1]} m={stone} />
        <Box s={[6.9, 1.95, 0.8]} p={[4.85, -1.03, FWt + 0.1]} m={stone} />
        <Box s={[7.0, 0.14, 0.95]} p={[-4.85, -0.02, FWt + 0.1]} m={M.plain('#bdb6a4')} cast={false} />
        <Box s={[7.0, 0.14, 0.95]} p={[4.85, -0.02, FWt + 0.1]} m={M.plain('#bdb6a4')} cast={false} />
        <Box s={[2 * SW + 0.9, wallH, 0.5]} p={[0, wallH / 2, BW]} m={wallM} />
        <Merged items={piers} />
        {/* gate: low arched bay in the wall, slim red piers, lintel, sawtooth nameboard seated on it, stepped yellow flank, slatted leaf */}
        {[-1.45, 1.45].map((x) => <Box key={x} s={[0.55, 2.6, 0.8]} p={[x, 1.3, FWt]} m={red} />)}
        <Box s={[0.28, 0.45, 0.05]} p={[-1.45, 1.1, FWt + 0.41]} m={M.plain('#e6d2bf')} cast={false} />
        <Box s={[0.22, 0.6, 0.05]} p={[1.45, 2.0, FWt + 0.41]} m={M.plain('#e6d2bf')} cast={false} />
        <Box s={[3.4, 0.32, 0.8]} p={[0, 2.6, FWt]} m={red} />
        <Box s={[2.2, 0.1, 0.6]} p={[0, 2.4, FWt]} m={cream} cast={false} />
        <group position={[0, 2.75, FWt - 0.2]} scale={[0.7, 0.7, 1]}><mesh geometry={board} material={charcoal} castShadow /></group>
        <mesh position={[0, 3.4, FWt + 0.205]}><planeGeometry args={[2.25, 1.13]} /><meshBasicMaterial map={signTex} transparent toneMapped={false} /></mesh>
        <Merged items={leaf} />
        <Box s={[0.9, 3.5, 0.78]} p={[2.15, 0.75, FWt]} m={yfl} />
        <Box s={[0.7, 0.5, 0.62]} p={[2.15, 2.4, FWt]} m={yfl} />
        <Box s={[0.5, 0.4, 0.46]} p={[2.15, 2.8, FWt]} m={yfl} />
        <mesh position={[2.15, 1.0, FWt + 0.395]}><planeGeometry args={[0.8, 0.4]} /><meshBasicMaterial map={altTex} toneMapped={false} /></mesh>
        {/* painted murals on the street face of the wall: goddess in a yellow arch, black Kali on red */}
        <mesh position={[3.85, 0.95, FWt + 0.26]}><planeGeometry args={[2.4, 1.7]} /><meshStandardMaterial map={muralA} roughness={0.95} /></mesh>
        <mesh position={[6.55, 0.95, FWt + 0.26]}><planeGeometry args={[2.9, 1.7]} /><meshStandardMaterial map={muralB} roughness={0.95} /></mesh>
        {/* steps down to the lane */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const top = -0.25 * (i + 1) + 0.02; return <Box key={i} s={[2.8, top + 2.0, 0.46]} p={[0, (top - 2.0) / 2, FWt + 0.62 + 0.42 * i]} m={stone} />; })}
        <Box s={[2.8, 0.14, 0.6]} p={[0, -0.02, FWt + 0.3]} m={stone} />
        {[-1, 1].map((sx) => <Box key={`r${sx}`} s={[0.2, 0.7, 3.6]} p={[sx * 1.5, -0.55, FWt + 2.4]} m={stone} />)}
      </group>
    );
  }

  function DkMain() {
    return (
      <group>
        <group position={[0, 0, -2.6]} scale={0.85}><DkTemple /></group>
        <DkYard />
        <DkWalls />
        <Frame s={[14, 10.9, 15]} p={[0, 5.2, 0.6]} />
      </group>
    );
  }

  /* ---------- surroundings ---------- */
  function DkTerrain() {
    const M = useM();
    const geo = useMemo(() => {
      const g = new THREE.PlaneGeometry(180, 180, 144, 144); g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position; const col = []; const c1 = new THREE.Color('#89a554'); const c2 = new THREE.Color('#4f7a3a'); const dust = new THREE.Color('#b9ad90'); const t = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i); const h = hf(x, z); pos.setY(i, h);
        const n = rnd(Math.floor(x / 3) * 31 + Math.floor(z / 3) * 17);
        t.copy(c1).lerp(c2, Math.min(1, Math.max(0, h / 13 + n * 0.3)));
        if (z > -14 && z < 10.4 && Math.abs(x) < 34) t.lerp(dust, 0.55);
        if (z > 10) t.lerp(dust, 0.3);
        col.push(t.r, t.g, t.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
      return g;
    }, []);
    return (
      <group>
        <mesh geometry={geo} material={M.plain('#ffffff', { vertexColors: true, roughness: 1 })} receiveShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.2, 0]} material={M.plain('#9bb36a', { roughness: 1 })}><circleGeometry args={[150, 48]} /></mesh>
      </group>
    );
  }

  const treeItems = (x, y, z, s0, seed) => {
    const s = s0 * 0.75;
    const g = ['#3f6b34', '#4c7a3a', '#35603a', '#5a8640'];
    const it = [{ t: 'c', p: [x, y + 1.2 * s, z], s: [0.55 * s, 2.4 * s, 0.55 * s], c: '#5a4533' }];
    for (let k = 0; k < 3; k += 1) {
      const a = rnd(seed + k * 3) * 6.28;
      it.push({ t: 's', p: [x + Math.cos(a) * 0.9 * s, y + (3.2 + k * 0.5) * s, z + Math.sin(a) * 0.9 * s], s: [2.0 * s, 1.7 * s, 2.0 * s], c: g[(seed + k) % 4] });
    }
    return it;
  };
  function DkForest() {
    const items = useMemo(() => {
      const it = [];
      for (let i = 0; i < 120; i += 1) {
        const x = (rnd(i) - 0.5) * 130; const z = -13 - rnd(i + 300) * 58;
        if (Math.abs(x - 4) < 9 && z > -22) continue; // keep the banyan's clearing
        it.push(...treeItems(x, hf(x, z) - 0.2, z, 0.8 + rnd(i + 60) * 0.9, i));
      }
      for (let i = 0; i < 26; i += 1) { // side slopes beyond the plots
        const x = (i % 2 ? 1 : -1) * (30 + rnd(i + 900) * 30); const z = -8 + rnd(i + 950) * 40;
        it.push(...treeItems(x, hf(x, z) - 0.2, z, 1.2 + rnd(i + 70) * 1.0, i + 7));
      }
      return it;
    }, []);
    return <Merged items={items} />;
  }
  function DkBigTrees() {
    const items = useMemo(() => {
      const it = [];
      const banyan = (x, z, s, seed) => {
        const y = hf(x, z) - 0.2; const gs = ['#27502c', '#2f5d34', '#386a3a', '#2a5530'];
        it.push({ t: 'c', p: [x, y + 3.5 * s, z], s: [1.7 * s, 7 * s, 1.7 * s], c: '#5c4a3a' });
        for (let k = 0; k < 4; k += 1) { const a = (k / 4) * 6.28 + seed; it.push({ t: 'c', p: [x + Math.cos(a) * 1.4 * s, y + 2.5 * s, z + Math.sin(a) * 1.4 * s], s: [0.5 * s, 5 * s, 0.5 * s], c: '#66503c' }); }
        for (let k = 0; k < 9; k += 1) {
          const a = (k / 9) * 6.28 + seed; const r = k === 0 ? 0 : 3.3 * s;
          it.push({ t: 's', p: [x + Math.cos(a) * r, y + (8 + (k % 3) * 1.6) * s, z + Math.sin(a) * r], s: [4.2 * s, 3.2 * s, 4.2 * s], c: gs[(k + seed) % 4] });
        }
      };
      banyan(4.5, -15, 0.75, 1); banyan(-13, -11, 0.6, 2); banyan(18, -16, 0.56, 3);
      return it;
    }, []);
    return <Merged items={items} />;
  }
  function DkPalm({ p }) {
    const items = useMemo(() => {
      const it = []; const H = 11; const N = 9; let prev = [0, 0, 0];
      for (let i = 1; i <= N; i += 1) {
        const t = i / N; const cur = [Math.sin(t * 1.6) * 0.8, t * H, 0.2 * t * t];
        const d = [cur[0] - prev[0], cur[1] - prev[1], cur[2] - prev[2]]; const len = Math.hypot(...d);
        it.push({ t: 'c', p: [(cur[0] + prev[0]) / 2, (cur[1] + prev[1]) / 2, (cur[2] + prev[2]) / 2], s: [0.36 - t * 0.12, len * 1.02, 0.36 - t * 0.12], q: aim(d), c: '#8c7b62' });
        prev = cur;
      }
      const top = prev;
      for (let k = 0; k < 10; k += 1) {
        const a = (k / 10) * 6.28; const d = [Math.cos(a) * 0.9, -0.45, Math.sin(a) * 0.9];
        it.push({ p: [top[0] + d[0] * 1.4, top[1] + 0.1 + d[1] * 1.4, top[2] + d[2] * 1.4], s: [0.5, 0.05, 3.2], q: aim([d[0], d[1], d[2]]).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)), c: k % 2 ? '#3f7a35' : '#4d8a3a' });
      }
      return it;
    }, []);
    return <group position={p}><Merged items={items} /></group>;
  }

  /* concrete town house: plain facade, window grid, balconies, flat roof with tank or tin roof */
  function DkHouse({ p, w, d, floors = 3, fh = 3.1, color = '#e4e2da', roof = 'flat', creeper = false, seed = 1 }) {
    const M = useM();
    const H = floors * fh;
    const parts = useMemo(() => {
      const dk = []; const lit = []; const tr = [];
      const nF = Math.max(2, Math.round(w / 2.8)); const nS = Math.max(2, Math.round(d / 2.8));
      for (let f = 0; f < floors; f += 1) {
        const y = f * fh + (f === 0 ? 1.6 : 1.85);
        for (let i = 0; i < nF; i += 1) {
          const x = -w / 2 + ((i + 0.5) * w) / nF;
          (rnd(seed * 50 + f * 7 + i) > 0.97 ? lit : dk).push({ p: [x, y, d / 2 + 0.02], s: [1.0, 1.25, 0.06], c: '#2a3844' });
          tr.push({ p: [x, y - 0.68, d / 2 + 0.06], s: [1.2, 0.08, 0.14], c: '#bdb9ac' });
        }
        for (let i = 0; i < nS; i += 1) {
          const z = -d / 2 + ((i + 0.5) * d) / nS;
          (rnd(seed * 70 + f * 5 + i) > 0.97 ? lit : dk).push({ p: [w / 2 + 0.02, y, z], s: [0.06, 1.25, 1.0], c: '#2a3844' });
          tr.push({ p: [w / 2 + 0.06, y - 0.68, z], s: [0.14, 0.08, 1.2], c: '#bdb9ac' });
        }
        if (f > 0) {
          tr.push({ p: [0, f * fh + 0.02, d / 2 + 0.42], s: [w * 0.9, 0.14, 0.85], c: '#cfcbbe' });
          tr.push({ p: [0, f * fh + 0.95, d / 2 + 0.82], s: [w * 0.9, 0.06, 0.06], c: '#4a5a52' });
          for (let k = 0; k <= Math.round(w * 0.9 / 1.3); k += 1) tr.push({ p: [-w * 0.45 + (k * w * 0.9) / Math.round(w * 0.9 / 1.3), f * fh + 0.5, d / 2 + 0.82], s: [0.05, 0.95, 0.05], c: '#4a5a52' });
        }
      }
      tr.push({ p: [0, H + 0.1, 0], s: [w + 0.2, 0.2, d + 0.2], c: '#c9c5b8' });
      if (roof === 'flat') {
        tr.push({ t: 'c', p: [w * 0.25, H + 1.0, -d * 0.2], s: [1.1, 1.0, 1.1], c: '#202226' });
        tr.push({ p: [w * 0.25, H + 0.4, -d * 0.2], s: [0.9, 0.4, 0.9], c: '#8a867c' });
      }
      if (creeper) for (let k = 0; k < 14; k += 1) tr.push({ t: 's', p: [w / 2 + 0.08, 1.2 + rnd(k + seed * 9) * (H - 2), -d / 2 + 0.5 + rnd(k + 40) * (d - 1)], s: [0.07, 0.8 + rnd(k) * 0.8, 0.8], c: k % 2 ? '#4a8a3a' : '#3a7a30' });
      return { dk, lit, tr };
    }, [w, d, floors, fh, creeper, seed, roof, H]);
    return (
      <group position={p}>
        <Box s={[w, H, d]} p={[0, H / 2, 0]} m={M.plain(color, { roughness: 0.95 })} />
        <Merged items={parts.dk} />
        <Merged items={parts.tr} />
        <Merged items={parts.lit.map((o) => ({ ...o, c: '#e8d29a' }))} basic />
        {roof === 'tin' && <Roof w={w + 0.8} d={d + 0.8} h={1.5} y={H + 0.2} m={M.plain('#7e756c', { roughness: 0.6, metalness: 0.4 })} sag={1} lift={0} fascia={false} />}
      </group>
    );
  }

  function DkWire({ a, b, sag = 0.5 }) {
    const obj = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 14; i += 1) { const t = i / 14; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t)); }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#1c1c1c' }));
    }, [a, b, sag]);
    return <primitive object={obj} />;
  }
  function DkPole({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.1} rb={0.16} h={8.2} p={[0, 4.1, 0]} m={M.plain('#77756f')} seg={8} />
        <Box s={[1.8, 0.1, 0.12]} p={[0, 7.8, 0]} m={M.plain('#5c5a55')} />
        <Box s={[1.4, 0.1, 0.12]} p={[0, 7.1, 0]} m={M.plain('#5c5a55')} />
      </group>
    );
  }
  function DkVan({ p }) {
    const M = useM();
    const white = M.plain('#e9ebec', { roughness: 0.5 });
    const glass = M.plain('#31404d', { roughness: 0.2, metalness: 0.4 });
    return (
      <group position={p} rotation={[0, 0.08, 0]}>
        <Box s={[4.4, 1.35, 1.8]} p={[0, 1.1, 0]} m={white} />
        <Box s={[1.3, 0.85, 1.76]} p={[-1.55, 0.95, 0]} m={white} />
        <Box s={[1.1, 0.55, 1.82]} p={[1.6, 1.4, 0]} m={glass} />
        <Box s={[2.4, 0.5, 1.82]} p={[-0.2, 1.4, 0]} m={glass} />
        {[-1.4, 1.4].map((x) => [-0.9, 0.9].map((z) => <Cyl key={`${x}${z}`} rt={0.38} h={0.28} p={[x, 0.38, z]} r={[Math.PI / 2, 0, 0]} m={M.plain('#1b1b1b')} seg={14} />))}
      </group>
    );
  }
  function DkBike({ p, r = 0, c = '#c8272d' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.0, 0.22, 0.28]} p={[0, 0.62, 0]} m={M.plain(c)} />
        <Box s={[0.5, 0.1, 0.26]} p={[-0.25, 0.8, 0]} m={M.plain('#1d1d1d')} />
        <Box s={[0.08, 0.1, 0.62]} p={[0.55, 1.0, 0]} m={M.plain('#2a2a2a')} />
        {[-0.62, 0.62].map((x) => <Cyl key={x} rt={0.3} h={0.14} p={[x, 0.3, 0]} r={[Math.PI / 2, 0, 0]} m={M.plain('#161616')} seg={12} />)}
      </group>
    );
  }
  function DkLane() {
    const M = useM();
    return (
      <group>
        <Box s={[120, 0.1, 6.8]} p={[0, -2.03, 15.4]} m={M.plain('#585a5c', { roughness: 0.95 })} cast={false} />
        <Box s={[120, 0.4, 0.5]} p={[0, -1.85, 12.0]} m={M.plain('#b6b0a0')} cast={false} />
        <DkVan p={[-4.5, -1.98, 16.4]} />
        <DkBike p={[4.2, -1.98, 13.4]} r={0.3} />
        <DkBike p={[5.5, -1.98, 13.7]} r={-0.1} c="#a81e24" />
        <DkBike p={[7.0, -1.98, 13.5]} r={0.2} c="#2a2c30" />
        <DkPole p={[-10, -2.0, 12.6]} />
        <DkPole p={[25, -2.0, 12.6]} />
        <DkPole p={[-27, -2.0, 12.6]} />
        {[-0.7, 0.7].map((o) => <DkWire key={`l${o}`} a={[-27 + o, 6.0, 12.6]} b={[-10 + o, 6.0, 12.6]} sag={0.7} />)}
        {[-0.7, 0.7].map((o) => <DkWire key={`r${o}`} a={[25 + o, 6.0, 12.6]} b={[42 + o, 6.0, 12.6]} sag={0.7} />)}
        {/* a few low trees along the lane edge */}
        <Merged items={useMemo(() => [...treeItems(-18, hf(-18, 21) - 0.2, 21, 0.9, 11), ...treeItems(10, hf(10, 22) - 0.2, 22, 1.0, 12), ...treeItems(24, hf(24, 21) - 0.2, 21, 0.9, 14), ...treeItems(-6, hf(-6, 25) - 0.2, 25, 1.0, 13)], [])} />
      </group>
    );
  }
  function DkRidges() {
    const items = useMemo(() => {
      const it = [];
      for (let i = 0; i < 9; i += 1) { const x = -110 + i * 28 + rnd(i) * 10; it.push({ t: 's', p: [x, 12, -105 - rnd(i + 3) * 10], s: [30 + rnd(i + 7) * 14, 26 + rnd(i + 9) * 10, 18], c: i % 2 ? '#6f8f80' : '#789a88' }); }
      for (let i = 0; i < 4; i += 1) { it.push({ t: 's', p: [-100, 8, -40 + i * 40], s: [14, 24, 22], c: '#759a84' }); it.push({ t: 's', p: [100, 8, -40 + i * 40], s: [14, 24, 22], c: '#759a84' }); }
      return it;
    }, []);
    return <Merged items={items} />;
  }

  function DkEnv() {
    return (
      <group>
        <DkTerrain />
        <DkForest />
        <DkBigTrees />
        <DkPalm p={[-6.3, 0, -5.3]} />
        <DkLane />
        {/* plain neighbouring town houses on the real sides of the compound */}
        <DkHouse p={[-17, 0, -0.5]} w={8} d={9} floors={2} color="#d9d6cc" creeper seed={3} />
        <DkHouse p={[-26, 0, 4.5]} w={9} d={9} floors={2} color="#cfc9bb" roof="tin" seed={5} />
        <DkHouse p={[20, 0, -9]} w={9} d={10} floors={2} color="#efebe0" seed={7} />
        <DkHouse p={[27, 0, -2]} w={9} d={10} floors={2} color="#d7dde2" seed={9} />
        <DkHouse p={[-12, hf(-12, -14), -15]} w={8} d={7} floors={2} color="#ece8de" seed={11} />
        <DkHouse p={[-13, 0, -3]} w={5} d={7} floors={2} color="#dfe8ee" seed={21} />
        <DkHouse p={[13.5, 0, 1]} w={5.5} d={7} floors={2} color="#f1efe8" seed={23} />
        <DkHouse p={[-3, hf(-3, -10.6), -11.4]} w={8} d={4} floors={2} color="#e2ebf0" seed={25} />
        <DkHouse p={[5, hf(5, -10.8), -11.6]} w={6} d={4} floors={2} color="#f0ede4" roof="tin" seed={27} />
        <DkHouse p={[-30, 0, -14]} w={8} d={8} floors={2} color="#dcd6c8" roof="tin" seed={13} />
      </group>
    );
  }

  return { 'dantakali-temple-dharan': { Main: DkMain, Env: DkEnv } };
}
