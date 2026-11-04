// Nuwakot Durbar (Saat Tale Durbar), Nuwakot, Bidur, Bagmati: one massive red-brick fort-tower, seven storeys, on a 25.6 x 11 m plan.
// Plain brick ground storeys with small windows, a band of big dark carved lattice windows (aankhi jhyal), a projecting dark timber
// balcony band, two upper storeys of small arched windows, stacked hipped tile roofs and a small timber lookout (Burja) with a
// gilded finial. It stands on a ridge-top courtyard (stone retaining wall, steep fall to terraced valleys, hazy hills), with the
// long 2-storey brick Garad Ghar (E) and Ranga Mahal (SE), small white-based pagoda shrines, a banyan and a timber pavilion;
// Bhairabi (gilded 2-tier) and a brick Taleju building down/around the ridge and a bazaar of brick houses with tin roofs below.
// 1 unit = 1 m. Storey heights and the 20+ m body are estimates from the photographs (no sourced height).
export default function make(K) {
  const { THREE, useMemo, useRef, useEffect, useState, useM, Frame, Box, Cyl, Ball, Gajur, Roof, Tree } = K;

  const W = 25.6; // tower long side (x)
  const D = 11; // tower short side (z)
  const UB = new THREE.BoxGeometry(1, 1, 1);
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    const [bg, setBg] = useState('#eadfcf');
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) { setDusk(c.r + c.g + c.b < 0.7); setBg('#' + c.getHexString()); } } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref, bg];
  }

  /* ---------- instancing ---------- */
  function Inst({ geo = UB, mat, items, cast = false }) {
    const setRef = (o) => {
      if (!o) return;
      const d = new THREE.Object3D();
      items.forEach((it, i) => {
        d.position.set(it.p[0], it.p[1], it.p[2]);
        const r = it.r || [0, 0, 0]; d.rotation.set(r[0], r[1], r[2]);
        const s = it.s || [1, 1, 1]; d.scale.set(s[0], s[1], s[2]);
        d.updateMatrix(); o.setMatrixAt(i, d.matrix);
      });
      o.instanceMatrix.needsUpdate = true;
    };
    return <instancedMesh key={items.length} ref={setRef} args={[geo, mat, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }

  /* ---------- hipped roof with a ridge (straight slopes, tile) ---------- */
  function hipGeo(w, d, h, rl) {
    const a = w / 2, b = d / 2, r = rl / 2;
    const P = [], U = [];
    const v = (x, y, z) => { P.push(x, y, z); U.push((x + z) * 0.28, (z - x) * 0.28 + y * 0.5); };
    const tri = (p0, p1, p2) => { v(...p0); v(...p1); v(...p2); };
    tri([-a, 0, b], [a, 0, b], [r, h, 0]); tri([-a, 0, b], [r, h, 0], [-r, h, 0]);
    tri([a, 0, -b], [-a, 0, -b], [-r, h, 0]); tri([a, 0, -b], [-r, h, 0], [r, h, 0]);
    tri([a, 0, b], [a, 0, -b], [r, h, 0]);
    tri([-a, 0, -b], [-a, 0, b], [-r, h, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.computeVertexNormals();
    return g;
  }
  function Hip({ w, d, h, rl, y = 0, p = [0, 0, 0], m, under = true }) {
    const M = useM();
    const geo = useMemo(() => hipGeo(w, d, h, rl), [w, d, h, rl]);
    return (
      <group position={[p[0], y, p[2]]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        {under && <Box s={[w, 0.12, d]} p={[0, -0.05, 0]} m={M.dark} cast={false} />}
      </group>
    );
  }

  /* ---------- window strips drawn on a canvas, laid on the wall as a transparent plane ---------- */
  const TX = {};
  const SMAT = {};
  function archPath(g, cx, top, w, bottom) {
    g.beginPath(); g.moveTo(cx - w / 2, bottom); g.lineTo(cx - w / 2, top + w / 2); g.arc(cx, top + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, bottom); g.closePath();
  }
  function lattice(g, x, y, w, h, lit) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = lit ? '#ffb458' : '#120c09'; g.fillRect(x, y, w, h);
    g.strokeStyle = lit ? '#6a3412' : '#6a5038'; g.lineWidth = 2.6;
    const sp = 9;
    for (let k = -h; k < w + h; k += sp) {
      g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k + h, y + h); g.stroke();
      g.beginPath(); g.moveTo(x + k + h, y); g.lineTo(x + k, y + h); g.stroke();
    }
    g.restore();
  }
  function drawBig(g, cx, H, ppm, lit, slot, withBrackets) {
    const fw = Math.min(3.6 * ppm, slot * 0.86), fh = Math.min(H * 0.95, 2.0 * ppm), y0 = (H - fh) / 2;
    if (withBrackets) {
      [-1, 1].forEach((sg) => {
        const bx = cx + sg * (fw / 2 + 0.3 * ppm);
        g.fillStyle = '#b89268'; g.beginPath();
        g.moveTo(bx - 0.3 * ppm, y0 + fh * 0.06); g.lineTo(bx + 0.3 * ppm, y0 + fh * 0.06); g.lineTo(bx + sg * 0.06 * ppm, y0 + fh * 0.8); g.lineTo(bx - sg * 0.06 * ppm, y0 + fh * 0.8); g.closePath(); g.fill();
        g.fillStyle = '#d9bc92'; g.fillRect(bx - 0.09 * ppm, y0 + fh * 0.16, 0.18 * ppm, 0.4 * fh);
        g.strokeStyle = '#5a4030'; g.lineWidth = 2; g.strokeRect(bx - 0.3 * ppm, y0 + fh * 0.06, 0.6 * ppm, fh * 0.74);
      });
    }
    g.fillStyle = '#8a6a4c'; g.fillRect(cx - fw / 2, y0, fw, fh);
    g.strokeStyle = '#2a1d16'; g.lineWidth = 5; g.strokeRect(cx - fw / 2 + 2.5, y0 + 2.5, fw - 5, fh - 5);
    const pw = 0.3 * ppm;
    [-1, 1].forEach((sg) => {
      const px = cx + sg * (fw / 2 - 0.16 * ppm - pw / 2);
      g.fillStyle = '#a07e5a'; g.fillRect(px - pw / 2, y0 + 0.18 * ppm, pw, fh - 0.18 * ppm);
      g.fillStyle = '#4a3628'; for (let yy = y0 + 0.3 * ppm; yy < y0 + fh - 0.3 * ppm; yy += 0.2 * ppm) g.fillRect(px - pw / 2, yy, pw, 2);
    });
    const lx = cx - fw / 2 + 0.5 * ppm, lw = fw - 1.0 * ppm, ly = y0 + 0.24 * ppm, lh = fh - 0.24 * ppm - 0.3 * ppm;
    lattice(g, lx, ly, lw, lh, lit);
    g.fillStyle = '#a07e5a'; g.fillRect(cx - fw / 2, y0 + fh - 0.3 * ppm, fw, 0.3 * ppm);
    g.fillStyle = '#c8a47a'; g.fillRect(cx - fw / 2, y0, fw, 0.2 * ppm);
    g.fillRect(cx - 0.2 * ppm, y0 + 0.03 * ppm, 0.4 * ppm, 0.2 * ppm);
  }
  function drawBal(g, cx, H, ppm, lit, slot) {
    const fw = Math.min(3.8 * ppm, slot * 0.9), fh = H * 0.92, y0 = (H - fh) / 2;
    g.fillStyle = '#7a5c40'; g.fillRect(cx - fw / 2, y0, fw, fh);
    lattice(g, cx - fw / 2 + 0.14 * ppm, y0 + 0.1 * ppm, fw - 0.28 * ppm, fh - 0.2 * ppm, lit);
  }
  function drawMid(g, cx, H, ppm, lit, slot) {
    const fw = Math.min(1.9 * ppm, slot * 0.7), fh = H * 0.8, y0 = (H - fh) / 2;
    g.fillStyle = '#2a1d16'; g.fillRect(cx - fw / 2, y0, fw, fh);
    lattice(g, cx - fw / 2 + 0.18 * ppm, y0 + 0.16 * ppm, fw - 0.36 * ppm, fh - 0.32 * ppm, lit);
  }
  function drawArch(g, cx, H, ppm, lit) {
    const w = 0.95 * ppm, top = H * 0.12, bot = H * 0.9;
    g.fillStyle = '#3a2a20'; archPath(g, cx, top - 0.1 * ppm, w + 0.3 * ppm, bot + 0.04 * ppm); g.fill();
    g.fillStyle = lit ? '#ffb458' : '#0e0907'; archPath(g, cx, top + 0.08 * ppm, w - 0.1 * ppm, bot - 0.08 * ppm); g.fill();
    g.strokeStyle = lit ? '#6a3412' : '#4a3628'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, top + 0.1 * ppm); g.lineTo(cx, bot - 0.08 * ppm); g.stroke();
  }
  function drawSmall(g, cx, H, ppm, lit) {
    const wh = H * 0.66, ww = wh * 0.8, y0 = (H - wh) / 2;
    g.fillStyle = '#d9c3a6'; g.fillRect(cx - ww / 2 - 0.12 * ppm, y0 + wh, ww + 0.24 * ppm, 0.1 * ppm);
    g.fillStyle = '#3a2a20'; g.fillRect(cx - ww / 2 - 0.1 * ppm, y0 - 0.1 * ppm, ww + 0.2 * ppm, wh + 0.2 * ppm);
    g.fillStyle = lit ? '#ffb458' : '#0f0a08'; g.fillRect(cx - ww / 2, y0, ww, wh);
    g.fillStyle = '#3a2a20'; g.fillRect(cx - 1.5, y0, 3, wh); g.fillRect(cx - ww / 2, y0 + wh * 0.45, ww, 3);
  }
  function stripTex(kind, wm, hm, n, dusk, seed) {
    const key = [kind, wm, hm, n, dusk ? 1 : 0, seed].join('|');
    if (TX[key]) return TX[key];
    const ppm = kind === 'rail' ? 22 : (kind === 'big' || kind === 'bal') ? 40 : 46;
    const Wp = Math.max(8, Math.round(wm * ppm)), Hp = Math.max(8, Math.round(hm * ppm));
    const c = document.createElement('canvas'); c.width = Wp; c.height = Hp;
    const g = c.getContext('2d');
    const R = rng(seed);
    if (kind === 'rail') {
      g.fillStyle = '#6a4c36'; g.fillRect(0, 0, Wp, Hp * 0.1); g.fillRect(0, Hp * 0.9, Wp, Hp * 0.1);
      for (let x = 0; x < Wp; x += 0.2 * ppm) g.fillRect(x, 0, 0.05 * ppm, Hp);
      g.fillRect(0, Hp * 0.45, Wp, Hp * 0.06);
    } else {
      const slot = Wp / n;
      for (let i = 0; i < n; i += 1) {
        const cx = (i + 0.5) * slot;
        const lit = dusk && R() < 0.75;
        if (kind === 'big') drawBig(g, cx, Hp, ppm, lit, slot, n <= 6);
        else if (kind === 'bal') drawBal(g, cx, Hp, ppm, lit, slot);
        else if (kind === 'mid') drawMid(g, cx, Hp, ppm, lit, slot);
        else if (kind === 'arch') drawArch(g, cx, Hp, ppm, lit);
        else drawSmall(g, cx, Hp, ppm, lit);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    TX[key] = t;
    return t;
  }
  function stripMat(tex, dusk) {
    const k = `${tex.uuid}|${dusk ? 1 : 0}`;
    if (!SMAT[k]) {
      SMAT[k] = new THREE.MeshStandardMaterial({
        map: tex, transparent: true, alphaTest: 0.4, roughness: 0.85, side: THREE.DoubleSide,
        emissive: dusk ? '#ffffff' : '#000000', emissiveMap: dusk ? tex : null, emissiveIntensity: 0.85,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
    }
    return SMAT[k];
  }
  function Band({ kind, w, h, n = 1, p, ry = 0, dusk, seed = 1 }) {
    const tex = useMemo(() => stripTex(kind, w, h, n, dusk, seed), [kind, w, h, n, dusk, seed]);
    const mat = useMemo(() => stripMat(tex, dusk), [tex, dusk]);
    return <mesh position={p} rotation={[0, ry, 0]} material={mat}><planeGeometry args={[w, h]} /></mesh>;
  }
  /** one row of windows on all four faces of a rectangular block */
  function Ring({ hx, hz, y, bh, kind, nL, nS, dusk, seed = 1, off = 0.05, only }) {
    const faces = [
      { ry: 0, o: hz, w: 2 * hx - 1.2, n: nL }, { ry: Math.PI, o: hz, w: 2 * hx - 1.2, n: nL },
      { ry: Math.PI / 2, o: hx, w: 2 * hz - 1.2, n: nS }, { ry: -Math.PI / 2, o: hx, w: 2 * hz - 1.2, n: nS },
    ];
    return (
      <>
        {faces.map((f, i) => (only && !only.includes(i) ? null : (
          <Band key={i} kind={kind} w={f.w} h={bh} n={f.n} ry={f.ry} dusk={dusk} seed={seed + i}
            p={[Math.sin(f.ry) * (f.o + off), y, Math.cos(f.ry) * (f.o + off)]} />
        )))}
      </>
    );
  }

  /* ---------- hand-drawn textures: thin orange brick with pale mortar, brown tiles ---------- */
  const TCACHE = {};
  function baseCanvas(kind) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d'); const R = rng(kind === 'brick' ? 3 : 8);
    if (kind === 'brick') {
      g.fillStyle = '#efe6d2'; g.fillRect(0, 0, 512, 512);
      const rows = 40, rh = 512 / rows, bw = 48;
      for (let r = 0; r < rows; r += 1) {
        const off = (r % 2) * (bw / 2);
        const wg = 1;
        for (let x = -bw; x < 512 + bw; x += bw) {
          const k = R();
          const dk = R() < 0.1 ? 0.82 : 1;
          const cr = (222 + k * 28) * wg * dk, cg = (128 + k * 24 - R() * 6) * wg * dk, cb = (82 + k * 16) * wg * dk;
          g.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
          g.fillRect(x + off + 1.5, r * rh + 1.6, bw - 3, rh - 3.2);
        }
      }
    } else {
      g.fillStyle = '#4a382c'; g.fillRect(0, 0, 512, 512);
      const rows = 24, rh = 512 / rows, tw = 28;
      for (let r = 0; r < rows; r += 1) {
        const off = (r % 2) * (tw / 2);
        for (let x = -tw; x < 512 + tw; x += tw) {
          const k = R();
          g.fillStyle = `rgb(${(118 + k * 26) | 0},${(94 + k * 20) | 0},${(78 + k * 16) | 0})`;
          g.fillRect(x + off + 1.5, r * rh + 1, tw - 3, rh - 3.5);
        }
      }
    }
    return c;
  }
  function wallTex(kind, rx, ry, shade) {
    const key = `${kind}|${rx.toFixed(2)}|${ry.toFixed(2)}|${shade}`;
    if (TCACHE[key]) return TCACHE[key];
    if (!TCACHE[`base${kind}`]) { const t0 = new THREE.CanvasTexture(baseCanvas(kind)); t0.wrapS = t0.wrapT = THREE.RepeatWrapping; t0.colorSpace = THREE.SRGBColorSpace; t0.anisotropy = 8; TCACHE[`base${kind}`] = t0; }
    const t = TCACHE[`base${kind}`].clone(); t.repeat.set(rx, ry); t.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ map: t, color: shade, roughness: 0.92 });
    TCACHE[key] = m;
    return m;
  }
  const brickMat = (w, h, shade = '#ffffff') => wallTex('brick', w / 2.4, h / 2.4, shade);
  const tileMat = (shade = '#ffffff') => wallTex('tile', 1, 1, shade);

  function BrickBox({ w, h, d, y = 0, tint = '#ffffff' }) {
    const M = useM();
    const mL = brickMat(w, h, tint);
    const mS = brickMat(d, h, tint);
    const mT = M.plain('#7a5a48');
    return (
      <mesh position={[0, y + h / 2, 0]} material={[mS, mS, mT, mT, mL, mL]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
    );
  }

  /* ---------- the tower ---------- */
  const S = { s1: 3.5, s2: 6.8, s3: 10.1, s4: 13.3, s5: 16.2, s6: 19.0, s7: 22.3 };
  const W6 = 22.4, D6 = 8.6, W7 = 6, D7 = 4.8;

  function skirtGeo(wb, db, wt, dt, h) {
    const a = wb / 2, b = db / 2, c = wt / 2, e = dt / 2;
    const B = [[-a, 0, b], [a, 0, b], [a, 0, -b], [-a, 0, -b]];
    const T = [[-c, h, e], [c, h, e], [c, h, -e], [-c, h, -e]];
    const P = [], U = [];
    const v = (q) => { P.push(q[0], q[1], q[2]); U.push((q[0] + q[2]) * 0.28, (q[2] - q[0]) * 0.28 + q[1] * 0.5); };
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4;
      v(B[i]); v(B[j]); v(T[j]); v(B[i]); v(T[j]); v(T[i]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.computeVertexNormals();
    return g;
  }
  function Skirt({ wb, db, wt, dt, h, y, m }) {
    const geo = useMemo(() => skirtGeo(wb, db, wt, dt, h), [wb, db, wt, dt, h]);
    return <mesh geometry={geo} material={m} position={[0, y, 0]} castShadow receiveShadow />;
  }

  function Tower({ dusk }) {
    const M = useM();
    const tile = tileMat();
    const tileDk = tileMat('#9c9088');
    const timber = M.plain('#33231a', { roughness: 0.85 });
    const wood7 = M.plain('#3b2a22', { roughness: 0.85 });
    const bx = W / 2 + 1.0, bz = D / 2 + 1.0;
    const BY = S.s4 - 0.6; // balcony band centre (1.2 m tall, ends at the top of storey 4)
    const corbels = useMemo(() => {
      const it = [];
      for (let x = -W / 2 + 0.8; x <= W / 2 - 0.7; x += 1.6) { it.push({ p: [x, BY - 0.75, D / 2 + 0.5], s: [0.26, 0.3, 1.0] }); it.push({ p: [x, BY - 0.75, -D / 2 - 0.5], s: [0.26, 0.3, 1.0] }); }
      for (let z = -D / 2 + 0.8; z <= D / 2 - 0.7; z += 1.6) { it.push({ p: [W / 2 + 0.5, BY - 0.75, z], s: [1.0, 0.3, 0.26] }); it.push({ p: [-W / 2 - 0.5, BY - 0.75, z], s: [1.0, 0.3, 0.26] }); }
      return it;
    }, []);
    const eave = useMemo(() => {
      const it = []; const hx = W / 2 + 0.4, hz = D / 2 + 0.4, y = S.s5 - 0.5, th = 0.82;
      for (let x = -W / 2 + 1.6; x <= W / 2 - 1.5; x += 3.2) { it.push({ p: [x, y, hz], r: [th, 0, 0], s: [0.22, 1.3, 0.22] }); it.push({ p: [x, y, -hz], r: [-th, 0, 0], s: [0.22, 1.3, 0.22] }); }
      for (let z = -D / 2 + 1.5; z <= D / 2 - 1.4; z += 3.2) { it.push({ p: [hx, y, z], r: [0, 0, -th], s: [0.22, 1.3, 0.22] }); it.push({ p: [-hx, y, z], r: [0, 0, th], s: [0.22, 1.3, 0.22] }); }
      return it;
    }, []);
    const courses = [S.s1, S.s2, S.s3];
    return (
      <group>
        {/* footing */}
        <Box s={[W + 0.9, 0.6, D + 0.9]} p={[0, 0.3, 0]} m={M.mat('rock', 8, 1, { color: '#bdb2a0' })} />
        {/* brick storeys: one uniform orange-red, slightly weathered only at the base */}
        <BrickBox w={W} h={S.s1 - 0.6} d={D} y={0.6} tint="#d6b090" />
        <BrickBox w={W} h={S.s2 - S.s1} d={D} y={S.s1} tint="#e8c8a8" />
        <BrickBox w={W} h={S.s3 - S.s2} d={D} y={S.s2} tint="#e8c8a8" />
        <BrickBox w={W} h={S.s4 - S.s3} d={D} y={S.s3} tint="#e8c8a8" />
        <BrickBox w={W} h={S.s5 - S.s4} d={D} y={S.s4} tint="#e8c8a8" />
        <BrickBox w={W6} h={S.s6 - S.s5} d={D6} y={S.s5} tint="#e8c8a8" />
        {/* timber beams marking the floors */}
        {courses.map((y) => <Box key={y} s={[W + 0.08, 0.2, D + 0.08]} p={[0, y, 0]} m={timber} cast={false} />)}
        {/* windows: small, mid, ONE band of big carved lattice windows under the balcony, then arches */}
        <Ring hx={W / 2} hz={D / 2} y={1.95} bh={1.3} kind="small" nL={6} nS={2} dusk={dusk} seed={11} />
        <Ring hx={W / 2} hz={D / 2} y={5.2} bh={1.4} kind="small" nL={6} nS={3} dusk={dusk} seed={21} />
        <Ring hx={W / 2} hz={D / 2} y={8.45} bh={1.5} kind="mid" nL={5} nS={2} dusk={dusk} seed={31} />
        <Ring hx={W / 2} hz={D / 2} y={11.1} bh={2.4} kind="big" nL={5} nS={2} dusk={dusk} seed={41} />
        <Ring hx={W / 2} hz={D / 2} y={15.1} bh={1.7} kind="arch" nL={10} nS={4} dusk={dusk} seed={51} />
        <Ring hx={W6 / 2} hz={D6 / 2} y={17.6} bh={1.6} kind="arch" nL={8} nS={3} dusk={dusk} seed={61} />
        {/* small plain wooden door with a stone step */}
        <Box s={[1.4, 2.3, 0.18]} p={[0, 1.75, D / 2 + 0.08]} m={M.mat('wood', 1, 1, { color: '#8a6040' })} />
        <Box s={[1.8, 2.6, 0.12]} p={[0, 1.9, D / 2 + 0.04]} m={timber} />
        <Box s={[2.6, 0.3, 1.2]} p={[0, 0.2, D / 2 + 0.7]} m={M.stone} />
        {/* the jharokha band: solid projecting dark timber, 5 lattice panels per long face, tile skirt above */}
        <Box s={[2 * bx, 1.2, 2 * bz]} p={[0, BY, 0]} m={timber} />
        <Box s={[2 * bx + 0.2, 0.14, 2 * bz + 0.2]} p={[0, BY - 0.62, 0]} m={wood7} cast={false} />
        <Inst mat={timber} items={corbels} />
        {[1, -1].map((s) => <Band key={`l${s}`} kind="bal" w={2 * bx - 1.0} h={1.0} n={5} p={[0, BY, s * (bz + 0.03)]} ry={s > 0 ? 0 : Math.PI} dusk={dusk} seed={7} />)}
        {[1, -1].map((s) => <Band key={`s${s}`} kind="bal" w={2 * bz - 1.0} h={1.0} n={2} p={[s * (bx + 0.03), BY, 0]} ry={s > 0 ? Math.PI / 2 : -Math.PI / 2} dusk={dusk} seed={8} />)}
        <Skirt wb={2 * bx + 1.2} db={2 * bz + 1.2} wt={W + 0.2} dt={D + 0.2} h={0.6} y={S.s4} m={tile} />
        {/* roofs: broad lower eave with bracket struts, second tier over the inset storey, lookout roof */}
        <Hip w={W + 1.6} d={D + 1.6} h={1.3} rl={W - D + 1} y={S.s5} m={tile} />
        <Inst mat={timber} items={eave} />
        <Hip w={23.2} d={9.6} h={2.0} rl={13.8} y={S.s6} m={tile} />
        {/* 7th storey: dark timber lookout (Burja) with a projecting gallery */}
        <mesh position={[0, 20.9, 0]} material={wood7} castShadow receiveShadow><boxGeometry args={[W7, 2.8, D7]} /></mesh>
        <Box s={[W7 + 1.8, 0.22, D7 + 1.8]} p={[0, 19.3, 0]} m={timber} />
        {[1, -1].map((s) => <Band key={`gl${s}`} kind="rail" w={W7 + 1.8} h={0.8} p={[0, 19.8, s * (D7 / 2 + 0.9)]} ry={s > 0 ? 0 : Math.PI} dusk={false} seed={5} />)}
        {[1, -1].map((s) => <Band key={`gs${s}`} kind="rail" w={D7 + 1.8} h={0.8} p={[s * (W7 / 2 + 0.9), 19.8, 0]} ry={s > 0 ? Math.PI / 2 : -Math.PI / 2} dusk={false} seed={6} />)}
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => <Box key={`gp${a}${b}`} s={[0.2, 0.9, 0.2]} p={[a * (W7 / 2 + 0.9), 19.75, b * (D7 / 2 + 0.9)]} m={timber} />)}
        <Ring hx={W7 / 2} hz={D7 / 2} y={21.0} bh={1.6} kind="mid" nL={3} nS={2} dusk={dusk} seed={71} off={0.04} />
        <Hip w={7.4} d={6.2} h={1.5} rl={1.8} y={S.s7} m={tileDk} />
        <Hip w={3.2} d={2.6} h={0.8} rl={0.3} y={S.s7 + 1.45} m={tileDk} />
        <Gajur y={S.s7 + 2.2} s={1.4} />
      </group>
    );
  }

  /* ---------- small whitewashed-base pagoda shrine ---------- */
  function Shrine({ p, s = 1, ry = 0, dusk }) {
    const M = useM();
    const white = M.plain('#f3efe6', { roughness: 0.85 });
    const tile = tileMat();
    const dk = M.plain('#3d2a1e', { roughness: 0.85 });
    const struts = useMemo(() => {
      const it = []; const e = 3.3;
      [-2, -1, 0, 1, 2].forEach((k) => {
        it.push({ p: [k * 1.2, 3.35, e - 0.5], r: [0.8, 0, 0], s: [0.12, 1.0, 0.12] }); it.push({ p: [k * 1.2, 3.35, -e + 0.5], r: [-0.8, 0, 0], s: [0.12, 1.0, 0.12] });
        it.push({ p: [e - 0.5, 3.35, k * 1.2], r: [0, 0, -0.8], s: [0.12, 1.0, 0.12] }); it.push({ p: [-e + 0.5, 3.35, k * 1.2], r: [0, 0, 0.8], s: [0.12, 1.0, 0.12] });
      });
      return it;
    }, []);
    return (
      <group position={p} scale={s} rotation={[0, ry, 0]}>
        <Box s={[6.2, 0.4, 6.2]} p={[0, 0.2, 0]} m={M.mat('rock', 2, 1, { color: '#bdb2a0' })} />
        <Cyl rt={2.8} rb={3.3} h={3.2} p={[0, 2.0, 0]} seg={10} m={white} />
        <Box s={[0.8, 1.5, 0.1]} p={[0, 1.15, 3.1]} m={M.dark} />
        <Box s={[5.2, 0.35, 5.2]} p={[0, 3.45, 0]} m={dk} />
        <Roof w={7.4} d={7.4} h={1.5} y={3.6} m={tile} sag={1.3} lift={0.1} />
        <Inst mat={dk} items={struts} />
        <Box s={[3.3, 1.5, 3.3]} p={[0, 4.4, 0]} m={dk} />
        <Band kind="mid" w={2.4} h={1.0} n={1} p={[0, 4.4, 1.68]} dusk={dusk} seed={3} />
        <Roof w={5.3} d={5.3} h={1.6} y={5.15} m={tile} sag={1.3} lift={0.1} />
        <Gajur y={6.7} s={1.3} />
      </group>
    );
  }

  /* ---------- the main group: tower + the shrine beside it ---------- */
  function NuwakotMain() {
    const [dusk, ref] = useDusk();
    return (
      <group ref={ref}>
        <Tower dusk={dusk} />
        <Shrine p={[17, 0, 13]} s={1.1} ry={-0.25} dusk={dusk} />
        {dusk && <pointLight position={[0, 3, 11]} intensity={90} distance={40} color="#ffb060" />}
        {dusk && <pointLight position={[12, 12, 9]} intensity={50} distance={30} color="#ffb060" />}
        <Frame s={[44, 27, 38]} p={[5.5, 13.5, 8.5]} />
      </group>
    );
  }

  /* ================= environment ================= */
  // compact ridge-top courtyard: x +/-34, z -14..24; steep fall all round
  const PX = 34, ZN = -14, ZS = 24;
  function baseH(x, z) {
    const dx = Math.max(Math.abs(x) - PX, 0), dz = Math.max(z - ZS, ZN - z, 0);
    const d = Math.hypot(dx, dz);
    let h = -32 * (1 - Math.exp(-d / 9));
    if (d > 2) {
      const st = 3.6, q = h / st, fl = Math.floor(q), fr = q - fl;
      const stair = (fl + sm(0.5, 0.92, fr)) * st;
      const w = sm(2, 8, d) * (1 - sm(45, 75, d));
      h = h * (1 - w) + stair * w;
    }
    h += 0.7 * Math.sin(x * 0.23 + 1) * Math.sin(z * 0.19) * Math.min(d / 8, 1);
    const r = Math.hypot(x, z), ang = Math.atan2(z, x);
    h += sm(60, 100, r) * (7 + 5 * Math.sin(ang * 3 + r * 0.03));
    return h;
  }
  const SPOTS = [
    { x: -6, z: 53, r: 9, h: -23 },
    { x: -53, z: -3, r: 9, h: -5 },
  ];
  function H(x, z) {
    let h = baseH(x, z);
    for (const s of SPOTS) {
      const w = 1 - sm(s.r, s.r * 1.8, Math.hypot(x - s.x, z - s.z));
      if (w > 0) h = h * (1 - w) + s.h * w;
    }
    return h;
  }

  function Terrain({ bg, dusk }) {
    const geo = useMemo(() => {
      const SZ = 380, NS = 250;
      const pos = [], col = [], idx = [];
      const cGrass = new THREE.Color('#858f4e'), cEarth = new THREE.Color('#a48a62'), cForest = new THREE.Color('#41583a'), bgc = new THREE.Color(bg), cHaze = new THREE.Color(dusk ? '#3f3570' : '#7e98a6'), cFar = dusk ? new THREE.Color('#33295a') : new THREE.Color('#a9bccb'), cLawn = new THREE.Color('#9a9a5a');
      const tmp = new THREE.Color();
      for (let j = 0; j <= NS; j += 1) {
        for (let i = 0; i <= NS; i += 1) {
          const x = -SZ / 2 + (SZ * i) / NS, z = -SZ / 2 + (SZ * j) / NS;
          const h = H(x, z);
          pos.push(x, h, z);
          const dx = Math.max(Math.abs(x) - PX, 0), dz = Math.max(z - ZS, ZN - z, 0), d = Math.hypot(dx, dz), r = Math.hypot(x, z);
          if (d < 0.5) tmp.copy(cLawn);
          else {
            const ti = Math.floor((h + 0.01) / 3.6), n = Math.sin(x * 0.37 + z * 0.11) * Math.sin(z * 0.41);
            if (n > 0.55 && h < -6) tmp.copy(cForest);
            else if (((ti % 2) + 2) % 2 === 0) tmp.copy(cGrass).lerp(cEarth, 0.25 + 0.2 * n); else tmp.copy(cEarth).lerp(cGrass, 0.2 + 0.2 * n);
            if (h < -14 && r < 150) tmp.lerp(cForest, 0.2);
          }
          tmp.lerp(cHaze, sm(50, 110, r) * 0.7).lerp(cFar, sm(110, 150, r) * 0.9).lerp(bgc, sm(165, 190, r));
          col.push(tmp.r, tmp.g, tmp.b);
        }
      }
      for (let j = 0; j < NS; j += 1) {
        for (let i = 0; i < NS; i += 1) {
          const a = j * (NS + 1) + i, b = a + 1, c = a + NS + 1, e = c + 1;
          idx.push(a, c, b, b, c, e);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [bg, dusk]);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, fog: false }), []);
    return <mesh geometry={geo} material={mat} position={[0, -0.4, 0]} receiveShadow />;
  }

  /* layered hazy ridge silhouettes (rings round the viewer), nearer = darker */
  function Ridges({ bg, dusk }) {
    const layers = useMemo(() => {
      const defs = dusk
        ? [{ R: 100, top: 8, amp: 9, sd: 1, c: '#3a3068', k: 0.1 }, { R: 135, top: 20, amp: 10, sd: 2, c: '#40376e', k: 0.25 }, { R: 168, top: 32, amp: 11, sd: 3, c: '#4a4278', k: 0.4 }, { R: 182, top: 50, amp: 14, sd: 4, c: '#6a6396', k: 0.5 }]
        : [{ R: 100, top: 8, amp: 9, sd: 1, c: '#7d9a8c', k: 0.12 }, { R: 135, top: 20, amp: 10, sd: 2, c: '#8fa9b4', k: 0.28 }, { R: 168, top: 32, amp: 11, sd: 3, c: '#a9bccb', k: 0.42 }, { R: 182, top: 52, amp: 15, sd: 4, c: '#dfe7ef', k: 0.55 }];
      const bgc = new THREE.Color(bg);
      return defs.map((d) => {
        const N = 220, pos = [], idx = [];
        for (let i = 0; i <= N; i += 1) {
          const a = (i / N) * Math.PI * 2;
          const t = 0.5 * Math.sin(a * 3 + d.sd) + 0.32 * Math.sin(a * 7 + d.sd * 2) + 0.22 * Math.sin(a * 13 + d.sd * 3) + 0.12 * Math.sin(a * 29 + d.sd);
          const y = d.top + d.amp * t;
          pos.push(Math.cos(a) * d.R, -45, Math.sin(a) * d.R, Math.cos(a) * d.R, y, Math.sin(a) * d.R);
          if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        const c = new THREE.Color(d.c).lerp(bgc, d.k);
        return { g, c };
      });
    }, [bg, dusk]);
    return (
      <>
        {layers.map((l, i) => <mesh key={i} geometry={l.g}><meshBasicMaterial color={l.c} side={THREE.DoubleSide} fog={false} /></mesh>)}
      </>
    );
  }

  function Annex({ p, ry = 0, len, dep = 7.5, dusk, seed }) {
    const M = useM();
    const tile = tileMat();
    const nn = Math.min(5, Math.max(3, Math.round((len - 2) / 3.0)));
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <BrickBox w={len} h={6.6} d={dep} y={0} tint="#f4ddc8" />
        <Box s={[len + 0.9, 0.3, dep + 0.9]} p={[0, 3.3, 0]} m={M.plain('#4a3426')} cast={false} />
        <Box s={[len + 1.3, 0.12, dep + 1.3]} p={[0, 3.55, 0]} m={tileMat('#9c9088')} cast={false} />
        <Box s={[len + 0.6, 0.35, dep + 0.6]} p={[0, 6.45, 0]} m={M.plain('#4a3426')} cast={false} />
        <Ring hx={len / 2} hz={dep / 2} y={1.7} bh={1.2} kind="small" nL={nn} nS={2} dusk={dusk} seed={seed} only={[0, 1]} />
        <Ring hx={len / 2} hz={dep / 2} y={4.95} bh={1.9} kind="big" nL={nn} nS={2} dusk={dusk} seed={seed + 9} only={[0, 1]} />
        <Box s={[1.3, 2.3, 0.15]} p={[2, 1.2, dep / 2 + 0.06]} m={M.mat('wood', 1, 1, { color: '#8a6040' })} />
        <Hip w={len + 1.8} d={dep + 2.2} h={2.4} rl={len - 1} y={6.6} m={tile} />
      </group>
    );
  }

  function Hedge({ items }) {
    const M = useM();
    return <Inst mat={M.plain('#3a5a30', { roughness: 1 })} items={items} cast />;
  }

  /* small dark clumpy tree: trunk plus 3 flattened blobs */
  function SmallTree({ p, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.14} rb={0.22} h={2.2} p={[0, 1.1, 0]} m={M.plain('#5a4636', { roughness: 1 })} seg={6} />
        <Ball rad={1.3} p={[0, 2.8, 0]} sc={[1, 0.8, 1]} m={M.plain('#2f4a2a', { roughness: 1 })} />
        <Ball rad={0.95} p={[0.8, 2.4, 0.3]} sc={[1, 0.8, 1]} m={M.plain('#3b5a31', { roughness: 1 })} />
        <Ball rad={0.9} p={[-0.7, 2.5, -0.3]} sc={[1, 0.8, 1]} m={M.plain('#35522d', { roughness: 1 })} />
      </group>
    );
  }

  function Banyan({ p }) {
    const M = useM();
    const bark = M.plain('#6a5444', { roughness: 1 });
    const l1 = M.plain('#2e4a28', { roughness: 1 }), l2 = M.plain('#37552c', { roughness: 1 });
    return (
      <group position={p} scale={0.72}>
        <Cyl rt={1.0} rb={1.8} h={8} p={[0, 4, 0]} m={bark} seg={10} />
        {[0, 1, 2, 3, 4].map((i) => <Cyl key={i} rt={0.25} rb={0.5} h={3.6} p={[Math.cos(i * 1.26) * 1.9, 1.6, Math.sin(i * 1.26) * 1.9]} r={[Math.sin(i * 1.26) * 0.4, 0, -Math.cos(i * 1.26) * 0.4]} m={bark} seg={6} />)}
        <Ball rad={6} p={[0, 10.5, 0]} sc={[1, 0.6, 1]} m={l1} />
        <Ball rad={4.6} p={[4.5, 9.6, 2]} sc={[1, 0.6, 1]} m={l2} />
        <Ball rad={4.6} p={[-4.5, 9.8, -1]} sc={[1, 0.6, 1]} m={l2} />
        <Ball rad={4.2} p={[1, 9.6, -4.5]} sc={[1, 0.6, 1]} m={l1} />
      </group>
    );
  }

  function Pavilion({ p }) {
    const M = useM();
    const dk = M.plain('#3a2718', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[6.6, 0.5, 6.6]} p={[0, 0.25, 0]} m={M.mat('rock', 2, 1, { color: '#bdb2a0' })} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.26} rb={0.3} h={3.4} p={[a * 2.8, 2.2, b * 2.8]} m={dk} seg={8} />)}
        {[[0, 1], [0, -1]].map(([, b]) => <Box key={`r${b}`} s={[5.6, 0.14, 0.14]} p={[0, 1.4, b * 2.8]} m={dk} />)}
        {[1, -1].map((a) => <Box key={`s${a}`} s={[0.14, 0.14, 5.6]} p={[a * 2.8, 1.4, 0]} m={dk} />)}
        <Box s={[7.2, 0.3, 7.2]} p={[0, 4.0, 0]} m={dk} />
        <Hip w={8.4} d={8.4} h={2.5} rl={0.01} y={4.1} m={tileMat('#b09a8c')} />
      </group>
    );
  }

  function BazaarHouse({ x, z, ry = 0, w = 7, d = 5.5, sto = 2, tin = true, tint = '#ffffff', dusk, seed }) {
    const M = useM();
    const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]];
    const yb = Math.max(...pts.map(([a, b]) => H(x + a * Math.cos(ry) + b * Math.sin(ry), z - a * Math.sin(ry) + b * Math.cos(ry)))) + 0.2;
    const h = sto * 2.6;
    const roof = tin ? M.plain('#8d969c', { metalness: 0.45, roughness: 0.55 }) : tileMat('#9c9088');
    return (
      <group position={[x, yb, z]} rotation={[0, ry, 0]}>
        <Box s={[w + 0.3, 8, d + 0.3]} p={[0, -4, 0]} m={M.mat('rock', 2, 1, { color: '#a89d8c' })} />
        <BrickBox w={w} h={h} d={d} y={0} tint={tint} />
        <Band kind="small" w={w - 0.8} h={1.1} n={Math.max(2, Math.round(w / 2.4))} p={[0, h - 1.3, d / 2 + 0.05]} dusk={dusk} seed={seed} />
        <Hip w={w + 1.0} d={d + 1.4} h={1.9} rl={w * 0.9} y={h} m={roof} />
      </group>
    );
  }

  function Bhairabi({ p }) {
    const M = useM();
    const wall = brickMat(3.6, 2.6, '#f4e2cc');
    return (
      <group position={p}>
        <Box s={[8.2, 0.5, 8.2]} p={[0, 0.25, 0]} m={M.stone} />
        <Box s={[6.4, 0.5, 6.4]} p={[0, 0.75, 0]} m={M.stone} />
        <Box s={[3.6, 2.6, 3.6]} p={[0, 2.3, 0]} m={wall} />
        <Box s={[0.9, 1.7, 0.1]} p={[0, 1.9, 1.82]} m={M.mat('wood', 1, 1, { color: '#7a5030' })} />
        <Roof w={6.4} d={6.4} h={1.5} y={3.6} m={M.gold} sag={1.3} lift={0.12} />
        <Box s={[2.6, 1.3, 2.6]} p={[0, 4.4, 0]} m={wall} />
        <Roof w={4.2} d={4.2} h={1.5} y={5.1} m={M.gold} sag={1.3} lift={0.12} />
        <Gajur y={6.5} s={1.2} />
      </group>
    );
  }

  function Taleju({ p, dusk }) {
    const M = useM();
    const dk = M.plain('#3a2718', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[11, 1.6, 9]} p={[0, 0.8, 0]} m={M.mat('rock', 3, 1, { color: '#b8ad9a' })} />
        <BrickBox w={9.6} h={8.4} d={7.6} y={1.6} tint="#ffffff" />
        <Ring hx={4.8} hz={3.8} y={4.4} bh={1.3} kind="small" nL={3} nS={2} dusk={dusk} seed={91} only={[0, 1]} />
        <Ring hx={4.8} hz={3.8} y={7.6} bh={1.3} kind="small" nL={3} nS={2} dusk={dusk} seed={92} only={[0, 1]} />
        <Box s={[1.2, 2.2, 0.15]} p={[0, 2.7, 3.85]} m={dk} />
        <Box s={[10.4, 0.3, 8.4]} p={[0, 10.2, 0]} m={dk} />
        <Band kind="rail" w={10.4} h={1.0} p={[0, 10.8, 4.16]} dusk={false} seed={4} />
        <Band kind="rail" w={8.4} h={1.0} p={[5.16, 10.8, 0]} ry={Math.PI / 2} dusk={false} seed={4} />
        <Roof w={12.4} d={10.4} h={2.4} y={11.1} m={tileMat('#a9b08a')} sag={1.25} lift={0.18} />
      </group>
    );
  }

  function Stupa({ p }) {
    const M = useM();
    const wh = M.plain('#f1ede4', { roughness: 0.85 });
    return (
      <group position={p}>
        <Cyl rt={2.3} rb={2.5} h={0.9} p={[0, 0.45, 0]} m={M.stone} seg={16} />
        <Ball rad={2.0} p={[0, 1.4, 0]} sc={[1, 0.8, 1]} m={wh} />
        <Box s={[0.9, 0.9, 0.9]} p={[0, 3.1, 0]} m={wh} />
        <mesh position={[0, 4.4, 0]} material={M.gold} castShadow><coneGeometry args={[0.55, 1.8, 12]} /></mesh>
      </group>
    );
  }

  /* scattered dark tree clumps on the hill flanks only (never in front of the monument) */
  function Forest() {
    const M = useM();
    const { a, b } = useMemo(() => {
      const R = rng(7); const A = [], B = [];
      let tries = 0;
      while (A.length + B.length < 170 && tries < 5000) {
        tries += 1;
        const x = (R() - 0.5) * 230, z = (R() - 0.5) * 230;
        const dx = Math.max(Math.abs(x) - PX, 0), dz = Math.max(z - ZS, ZN - z, 0);
        if (Math.hypot(dx, dz) < 3 || Math.hypot(x, z) > 62) continue;
        if ((z > 22 && z < 66 && Math.abs(x) < 48) || (z < -12 && z > -40 && Math.abs(x) < 48)) continue;
        if (Math.hypot(x + 53, z + 3) < 14 || Math.hypot(x + 6, z - 53) < 12) continue;
        const sc = 1.1 + R() * 1.3; const y = H(x, z) + sc * 0.6;
        (R() < 0.5 ? A : B).push({ p: [x, y, z], s: [sc, sc * 0.9, sc] });
      }
      return { a: A, b: B };
    }, []);
    const g = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const fm1 = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f4a2a', roughness: 1, fog: false }), []);
    const fm2 = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3b5a31', roughness: 1, fog: false }), []);
    return (
      <>
        <Inst geo={g} mat={fm1} items={a} cast />
        <Inst geo={g} mat={fm2} items={b} cast />
      </>
    );
  }

  function NuwakotEnv() {
    const M = useM();
    const [dusk, ref, bg] = useDusk();
    const wall = M.mat('rock', 16, 2, { color: '#e6dcc6' });
    const coping = M.mat('rock', 20, 1, { color: '#d2cabb' });
    const hedges = useMemo(() => {
      const it = [];
      for (let x = 3; x <= 14; x += 1.5) it.push({ p: [x, 0.4, 20.5], s: [1.6, 0.8, 1.0] });
      for (let x = -12; x <= -2; x += 1.5) it.push({ p: [x, 0.4, 12.5], s: [1.6, 0.8, 1.0] });
      for (let x = 22; x <= 30; x += 1.5) it.push({ p: [x, 0.4, 20.5], s: [1.6, 0.8, 1.0] });
      for (let z = -2; z <= 6; z += 1.5) it.push({ p: [11.5, 0.4, z], s: [1.0, 0.8, 1.6] });
      return it;
    }, []);
    const buttresses = useMemo(() => {
      const it = [];
      for (let x = -PX + 3; x <= PX - 2; x += 8) it.push({ p: [x, -2.9, ZS + 1.4], s: [1.3, 6.6, 0.9] });
      for (let z = ZN + 3; z <= ZS - 2; z += 8) { it.push({ p: [PX + 1.4, -2.9, z], s: [0.9, 6.6, 1.3] }); it.push({ p: [-PX - 1.4, -2.9, z], s: [0.9, 6.6, 1.3] }); }
      return it;
    }, []);
    const houses = [
      [-30, 31, 0.1, 7, 5.5, 2, true], [-20, 34, -0.15, 6.5, 5, 2, false], [-9, 31, 0.05, 8, 5.5, 3, true], [3, 35, 0.12, 7, 5.5, 2, true],
      [13, 32, -0.1, 6.5, 5, 2, false], [24, 36, 0.15, 7.5, 5.5, 3, true], [-16, 41, 0, 7, 5.5, 2, true], [8, 43, -0.2, 7, 5.5, 2, false],
      [30, 42, 0.1, 6.5, 5, 2, true], [18, 49, 0.1, 7.5, 5.5, 2, true], [-27, 46, -0.1, 7, 5.5, 2, false],
      [-42, 4, 1.5, 6.5, 5, 2, false], [-41, -12, 1.4, 7, 5.5, 2, true], [42, -8, -1.5, 6.5, 5, 2, true], [41, 10, -1.5, 7, 5.5, 2, false],
      [-10, -28, 0.1, 8, 5.5, 3, true], [14, -30, -0.1, 7, 5.5, 2, false], [-30, -26, 0.2, 7, 5, 2, true], [32, -28, 0.15, 7, 5.5, 3, true],
    ];
    const treeSpots = [[-33, 21], [-33, -10], [33, -12], [-12, 22.5], [26, 22.5], [-45, 18], [46, 20], [-24, 38], [0, 40], [38, 34], [-38, 36], [47, -15]];
    return (
      <group ref={ref}>
        <Terrain bg={bg} dusk={dusk} />
        <Ridges bg={bg} dusk={dusk} />
        {/* ridge-top courtyard: dry grass slab, patches of earth and brick paving */}
        <Box s={[2 * PX + 0.6, 0.5, ZS - ZN + 0.6]} p={[0, -0.25, (ZS + ZN) / 2]} m={M.plain('#9a9a5a', { roughness: 1 })} cast={false} />
        {[[-20, 2, 5, '#7f9a4c'], [-8, 20, 4, '#a5a063'], [8, -9, 6, '#6f8f44'], [14, 6, 3.5, '#b2a46a'], [-28, 8, 5, '#6a8a42'], [24, -9, 4, '#a5a063'], [-2, 3, 6, '#86a050'], [27, 17, 4.5, '#79934a'], [-16, -4, 4, '#b09c64'], [2, -4, 5, '#708f46'], [-34, 20, 4, '#88a052'], [10, 20, 3.5, '#7a9648']].map(([x, z, r, c], i) => <Cyl key={i} rt={r} h={0.03} p={[x, 0.02, z]} m={M.plain(c, { roughness: 1 })} seg={14} />)}
        {[[-14, -2, 9, 6], [-24, 14, 7, 5], [4, -9, 8, 4]].map(([x, z, w, d], i) => <Box key={`bp${i}`} s={[w, 0.08, d]} p={[x, 0.04, z]} m={M.mat('herring', w / 2, d / 2, { color: '#c9a287' })} cast={false} />)}
        {/* tall rough-stone retaining wall with coping, buttresses and a parapet */}
        <Box s={[2 * PX + 3, 6.6, 1.2]} p={[0, -2.9, ZS + 0.6]} m={wall} />
        <Box s={[2 * PX + 3, 6.6, 1.2]} p={[0, -2.9, ZN - 0.6]} m={wall} />
        <Box s={[1.2, 6.6, ZS - ZN + 2]} p={[PX + 0.6, -2.9, (ZS + ZN) / 2]} m={wall} />
        <Box s={[1.2, 6.6, ZS - ZN + 2]} p={[-PX - 0.6, -2.9, (ZS + ZN) / 2]} m={wall} />
        <Inst mat={wall} items={buttresses} cast />
        <Box s={[2 * PX + 3.3, 0.35, 1.5]} p={[0, 0.58, ZS + 0.6]} m={coping} />
        <Box s={[2 * PX + 3, 0.7, 0.45]} p={[0, 1.1, ZS + 0.95]} m={wall} />
        <Box s={[2 * PX + 3.3, 0.35, 1.5]} p={[0, 0.58, ZN - 0.6]} m={coping} />
        <Box s={[1.5, 0.35, ZS - ZN + 2.3]} p={[PX + 0.6, 0.58, (ZS + ZN) / 2]} m={coping} />
        <Box s={[1.5, 0.35, ZS - ZN + 2.3]} p={[-PX - 0.6, 0.58, (ZS + ZN) / 2]} m={coping} />
        {/* brick-paved apron and path */}
        <Box s={[30, 0.08, 3.6]} p={[0, 0.04, 7.6]} m={M.mat('herring', 14, 2, { color: '#c9a287' })} cast={false} />
        <Box s={[2.6, 0.08, 15]} p={[0, 0.04, 14]} m={M.mat('herring', 1.5, 7, { color: '#c9a287' })} cast={false} />
        <Box s={[10, 0.08, 9]} p={[17, 0.04, 13]} m={M.mat('herring', 5, 4, { color: '#c9a287' })} cast={false} />
        {/* brick ranges: Garad Ghar (E) and Ranga Mahal (SE) */}
        <Annex p={[31, 0, -2]} ry={-Math.PI / 2} len={22} dusk={dusk} seed={101} />
        <Annex p={[23, 0, -10.5]} ry={0} len={16} dep={6} dusk={dusk} seed={131} />
        {/* more small pagoda shrines in the yard */}
        <Shrine p={[7, 0, 14]} s={0.62} ry={0.3} dusk={dusk} />
        <Shrine p={[-6, 0, 19]} s={0.5} ry={-0.2} dusk={dusk} />
        <Hedge items={hedges} />
        {/* Buddhist stupa N, banyan and timber pavilion on the ridge */}
        <Stupa p={[-16, 0, -9]} />
        <Banyan p={[-30, 0, -8]} />
        <Pavilion p={[-27, 0, 15]} />
        {treeSpots.map(([x, z], i) => <SmallTree key={i} p={[x, z > ZS || z < ZN || Math.abs(x) > PX ? H(x, z) : 0, z]} s={1 + (i % 3) * 0.25} />)}
        {/* Taleju hill and Bhairabi down the ridge */}
        <Taleju p={[SPOTS[1].x, SPOTS[1].h - 0.4 + 0.05, SPOTS[1].z]} dusk={dusk} />
        <Bhairabi p={[SPOTS[0].x, SPOTS[0].h - 0.4 + 0.05, SPOTS[0].z]} />
        {/* bazaar on the terraces below */}
        {houses.map((h, i) => <BazaarHouse key={i} x={h[0]} z={h[1]} ry={h[2]} w={h[3]} d={h[4]} sto={h[5]} tin={h[6]} dusk={dusk} seed={200 + i} tint={i % 3 === 0 ? '#e2c0a2' : '#f6e4d2'} />)}
        <Forest />
        {dusk && <pointLight position={[-20, 4, 20]} intensity={30} distance={30} color="#ffb060" />}
      </group>
    );
  }

  return { 'nuwakot-durbar': { Main: NuwakotMain, Env: NuwakotEnv } };
}
