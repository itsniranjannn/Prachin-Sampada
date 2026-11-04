// Boudhanath Stupa (Boudha, Kathmandu): the great white dome on three notched square mandala terraces, the gilded harmika with
// painted eyes on all four faces, the 13-step spire, prayer flags radiating to the 16-sided kora wall and a closed ring of
// brick, ochre and peach houses and gompas around a flat paved circuit. Flat valley floor; hazy green hills far to the north.
export default function make(K) {
  const { THREE, useMemo, useM, Frame, Box, Cyl, Ball, Roof, Tree } = K;

  /* ---------------- scale and layout constants (1 unit is about 2.6 m) ---------------- */
  const TERR = [{ h: 12.5, y: 0, th: 1.1 }, { h: 10.3, y: 1.1, th: 1.0 }, { h: 8.4, y: 2.1, th: 0.9 }];
  const DOME_R = 6.6;
  const DOME_Y0 = 3.8;
  const DOME_SY = 0.78;
  const HOFF = DOME_Y0 + DOME_R * DOME_SY - 9.74; // lift (negative) of harmika and spire after lowering the dome
  const WALL_A = 18; // apothem of the 16-sided kora wall
  const HOUSE_R = 23; // front line of the houses
  const SPIRE_Y = 16.0; // where the flag strings are tied
  const TAU = Math.PI * 2;

  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------------- geometry helpers (merge many boxes into one mesh, with vertex colours) ---------------- */
  const _c = new THREE.Color();
  const paint = (g, col) => {
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    _c.set(col || '#ffffff');
    for (let i = 0; i < n; i += 1) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  };
  const place = (g, p, o) => {
    if (o && o.r) { g.rotateX(o.r[0] || 0); g.rotateY(o.r[1] || 0); g.rotateZ(o.r[2] || 0); }
    g.translate(p[0], p[1], p[2]);
    if (o && o.base) g.applyMatrix4(o.base);
  };
  const mkBox = (s, p, col, o = {}) => {
    const g = new THREE.BoxGeometry(s[0], s[1], s[2]);
    if (o.tile) {
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i += 1) {
        const f = Math.floor(i / 4);
        const fw = f < 2 ? s[2] : s[0];
        const fh = f < 2 ? s[1] : f < 4 ? s[2] : s[1];
        uv.setXY(i, (uv.getX(i) * fw) / o.tile, (uv.getY(i) * fh) / o.tile);
      }
    }
    place(g, p, o);
    return paint(g, col);
  };
  const mkCyl = (rt, rb, h, seg, p, col, o = {}) => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg);
    place(g, p, o);
    return paint(g, col);
  };
  const mkPyr = (w, d, h, p, col, o = {}) => {
    const g = new THREE.ConeGeometry(0.7071, 1, 4);
    g.rotateY(Math.PI / 4);
    g.scale(w, h, d);
    place(g, [p[0], p[1] + h / 2, p[2]], o);
    return paint(g, col);
  };
  const mergeG = (list) => {
    const out = new THREE.BufferGeometry();
    if (!list.length) return out;
    let nv = 0; let ni = 0;
    list.forEach((g) => { nv += g.attributes.position.count; ni += g.index.count; });
    const P = new Float32Array(nv * 3); const N = new Float32Array(nv * 3); const U = new Float32Array(nv * 2);
    const C = new Float32Array(nv * 3); const I = new Uint32Array(ni);
    let vo = 0; let io = 0;
    for (const g of list) {
      const n = g.attributes.position.count;
      P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3);
      U.set(g.attributes.uv.array, vo * 2); C.set(g.attributes.color.array, vo * 3);
      const ix = g.index.array;
      for (let i = 0; i < ix.length; i += 1) I[io + i] = ix[i] + vo;
      vo += n; io += ix.length;
      g.dispose();
    }
    out.setAttribute('position', new THREE.BufferAttribute(P, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    out.setAttribute('color', new THREE.BufferAttribute(C, 3));
    out.setIndex(new THREE.BufferAttribute(I, 1));
    return out;
  };
  const frameBase = (x, z, ry) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));

  /* ---------------- mandala terrace outline: square with notched corners and stair bays on all four sides ---------------- */
  function mandalaShape(h, c) {
    const k = 0.8;
    let side = [[-h + 2 * k, h], [h - 2 * k, h], [h - 2 * k, h - k], [h - k, h - k], [h - k, h - 2 * k]];
    const pts = [];
    for (let q = 0; q < 4; q += 1) {
      side.forEach((pt) => pts.push(pt));
      side = side.map(([x, z]) => [z, -x]);
    }
    const sh = new THREE.Shape();
    pts.forEach(([x, z], n) => (n ? sh.lineTo(x, z) : sh.moveTo(x, z)));
    sh.closePath();
    return sh;
  }
  function terraceGeo(h, hgt, y0, inset = 0, c = 1.6, b = 2.7, p = 0.7) {
    const g = new THREE.ExtrudeGeometry(mandalaShape(h - inset, c, b, p), { depth: hgt, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.translate(0, y0 + hgt, 0);
    return g;
  }

  /* ---------------- textures drawn on canvas ---------------- */
  function makeEyes() {
    const W = 560; const H = 480;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, '#e6c04a'); gr.addColorStop(0.5, '#d6aa34'); gr.addColorStop(1, '#e2ba44');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a07818'; g.lineWidth = 6;
    g.strokeRect(10, 10, W - 20, H - 20); g.strokeRect(24, 24, W - 48, H - 48);
    const cy = H * 0.6;
    g.lineCap = 'round'; g.lineJoin = 'round';
    const eye = (cx) => {
      const hw = 125;
      // brow
      g.beginPath(); g.moveTo(cx - hw - 12, cy - 52); g.quadraticCurveTo(cx, cy - 150, cx + hw + 12, cy - 52);
      g.strokeStyle = '#141c4e'; g.lineWidth = 20; g.stroke();
      g.beginPath(); g.moveTo(cx - hw - 6, cy - 38); g.quadraticCurveTo(cx, cy - 128, cx + hw + 6, cy - 38);
      g.strokeStyle = '#d4552e'; g.lineWidth = 7; g.stroke();
      // eye white
      g.beginPath(); g.moveTo(cx - hw, cy + 6); g.quadraticCurveTo(cx, cy - 92, cx + hw, cy + 6); g.quadraticCurveTo(cx, cy + 66, cx - hw, cy + 6);
      g.fillStyle = '#fbf8ef'; g.fill(); g.strokeStyle = '#141c4e'; g.lineWidth = 14; g.stroke();
      // red-brown upper lid
      g.beginPath(); g.moveTo(cx - hw + 4, cy + 2); g.quadraticCurveTo(cx, cy - 98, cx + hw - 4, cy + 2);
      g.strokeStyle = '#8a2e1c'; g.lineWidth = 16; g.stroke();
      // iris and pupil
      g.save(); g.beginPath(); g.moveTo(cx - hw + 6, cy + 6); g.quadraticCurveTo(cx, cy - 86, cx + hw - 6, cy + 6); g.quadraticCurveTo(cx, cy + 58, cx - hw + 6, cy + 6); g.clip();
      g.beginPath(); g.arc(cx, cy - 6, 46, 0, TAU); g.fillStyle = '#1d86e8'; g.fill();
      g.lineWidth = 6; g.strokeStyle = '#0c2a6a'; g.stroke();
      g.beginPath(); g.arc(cx, cy - 6, 19, 0, TAU); g.fillStyle = '#050810'; g.fill();
      g.restore();
    };
    eye(158); eye(402);
    // third eye (urna)
    g.beginPath(); g.moveTo(280 - 30, cy - 120); g.quadraticCurveTo(280, cy - 160, 280 + 30, cy - 120); g.quadraticCurveTo(280, cy - 98, 280 - 30, cy - 120);
    g.fillStyle = '#fbf8ef'; g.fill(); g.strokeStyle = '#141c4e'; g.lineWidth = 8; g.stroke();
    g.beginPath(); g.arc(280, cy - 122, 10, 0, TAU); g.fillStyle = '#1d86e8'; g.fill();
    // nose (the curl that stands for the number one)
    g.beginPath(); g.moveTo(280, cy + 8); g.bezierCurveTo(283, cy + 70, 281, cy + 112, 274, cy + 140);
    g.bezierCurveTo(266, cy + 172, 316, cy + 182, 314, cy + 148);
    g.strokeStyle = '#9a3420'; g.lineWidth = 15; g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  function makeDome() {
    const W = 1024; const H = 512;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, W, H);
    const rnd = rng(11);
    const N = 12;
    for (let k = 0; k < N; k += 1) {
      const x0 = (k / N) * W; const x1 = ((k + 1) / N) * W; const xm = (x0 + x1) / 2;
      const ye = H * (0.6 + rnd() * 0.04);
      const gr = g.createLinearGradient(0, 0, 0, ye + 30);
      gr.addColorStop(0, 'rgba(227,178,74,0.95)'); gr.addColorStop(0.5, 'rgba(231,186,92,0.92)'); gr.addColorStop(1, 'rgba(244,240,232,0.0)');
      g.beginPath(); g.moveTo(x0 + 3, 0); g.lineTo(x0 + 3, ye - 22); g.quadraticCurveTo(xm, ye + 38, x1 - 3, ye - 22); g.lineTo(x1 - 3, 0); g.closePath();
      g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(190,132,40,0.55)'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x0 + 4, ye - 24); g.quadraticCurveTo(xm, ye + 34, x1 - 4, ye - 24); g.stroke();
      g.strokeStyle = 'rgba(255,252,244,0.95)'; g.lineWidth = 12;
      g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0, ye + 14); g.stroke();
      for (let d = 0; d < 3; d += 1) {
        const dx = x0 + 14 + rnd() * (x1 - x0 - 28);
        g.strokeStyle = 'rgba(190,140,50,0.3)'; g.lineWidth = 2 + rnd() * 3;
        g.beginPath(); g.moveTo(dx, 20); g.lineTo(dx + (rnd() - 0.5) * 8, ye * (0.5 + rnd() * 0.4)); g.stroke();
      }
    }
    const sh = g.createLinearGradient(0, H * 0.7, 0, H);
    sh.addColorStop(0, 'rgba(180,170,150,0)'); sh.addColorStop(1, 'rgba(180,170,150,0.28)');
    g.fillStyle = sh; g.fillRect(0, H * 0.7, W, H * 0.3);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }

  /* ---------------- prayer flags: strings radiating from the spire, merged by colour ---------------- */
  const FLAGC = ['#2f6db5', '#f4f1e8', '#c8372d', '#2e9560', '#e8b630'];
  function wallVerts() {
    const out = [];
    const R = WALL_A / Math.cos(Math.PI / 16);
    for (let k = 0; k < 16; k += 1) {
      const th = Math.PI / 2 + (k + 0.5) * (Math.PI / 8);
      out.push([Math.cos(th) * R, Math.sin(th) * R, th]);
    }
    return out;
  }
  /* the closed ring of houses, computed once: used by the flag strings (roof anchors) and by Env */
  const gateAngle = Math.PI / 2;
  function computeTown() {
    const rnd = rng(23);
    const brickT = ['#e8a088', '#dd8c72', '#eaaa90', '#d98068', '#e29478'];
    const plasT = ['#e0b050', '#e8c090', '#f0e6d2', '#e8a094', '#d4b878', '#e8c866', '#dc9a70'];
    const rings = [];
    const mk = (R, d, minS, maxS, first) => {
      const list = [];
      let a = 0.02;
      let guard = 0;
      while (a < TAU - 0.06 && guard < 200) {
        guard += 1;
        const gompa = rnd() < 0.1;
        const w = gompa ? 7 + rnd() * 1.2 : 3.8 + rnd() * 2.4;
        const da = w / R;
        const ac = a + da / 2;
        a += da;
        let dg = Math.abs(((ac - gateAngle + Math.PI * 3) % TAU) - Math.PI);
        dg = Math.abs(dg);
        const nearGate = Math.abs(((ac - gateAngle + Math.PI) % TAU + TAU) % TAU - Math.PI) < (w / 2 + 9.6) / R;
        if (first && nearGate) continue;
        const frontSide = Math.sin(ac) > (first ? -0.3 : -0.2);
        if (!first && Math.sin(ac) > 0.45) continue;
        const wide = Math.abs(Math.cos(ac)) > 0.6;
        const backSide = Math.sin(ac) < -0.45;
        const lo = frontSide ? (first ? 2 : 2) : backSide ? 5 : minS; const hi = frontSide ? (first ? 3 : 3) : backSide ? 6 : maxS;
        const st = gompa ? (frontSide ? (first ? 2 : 3) : 4) : lo + Math.floor(rnd() * (hi - lo + 1));
        const kind = gompa ? 'gompa' : rnd() < 0.5 ? 'brick' : 'plaster';
        const H = 1.1 + (st - 1) * 0.95;
        const sp = {
          R, ac, w, d, st, H, kind, gompa,
          col: kind === 'brick' ? brickT[Math.floor(rnd() * brickT.length)] : plasT[Math.floor(rnd() * plasT.length)],
          roof: gompa ? 'pitch' : 'flat', front: frontSide,
          roofCol: ['#8a4a2e', '#6c4a3c', '#5d7a63', '#a05a3a'][Math.floor(rnd() * 4)],
          flatCol: ['#b4694a', '#9a5a40', '#8a8f88', '#a87a58', '#c27a58'][Math.floor(rnd() * 5)],
          balc: rnd() < 0.6, tin: rnd() < 0.3, awn: Math.floor(rnd() * 5), seed: Math.floor(rnd() * 1e6),
          ry: Math.atan2(-Math.cos(ac), -Math.sin(ac)),
          pole: first && !gompa,
        };
        sp.pk = sp.pole && (list.length % 2 === 0) && (Math.sin(ac) < 0.5);
        sp.anc = [Math.cos(ac) * (R + 0.4), H + 1.5, Math.sin(ac) * (R + 0.4)];
        list.push(sp);
      }
      rings.push(list);
    };
    mk(HOUSE_R, 5.4, 3, 5, true);
    // two gompas flank the gate, with gold pitched roofs
    [-1, 1].forEach((sd) => {
      const R = HOUSE_R; const ac = gateAngle + sd * (7.0 / R);
      const H = 1.1 + 1 * 0.95;
      rings[0].push({ R, ac, w: 6.6, d: 5.0, st: 2, H, kind: 'plaster', gompa: true, col: '#efe4cc', roof: 'pitch', front: true, roofCol: '#a05a3a', flatCol: '#b4694a', balc: false, awn: 0, seed: 777 + sd, ry: Math.atan2(-Math.cos(ac), -Math.sin(ac)), pole: false, pk: false, anc: [0, 0, 0] });
    });
    mk(HOUSE_R + 5.6, 6, 4, 7, false);
    return rings;
  }
  const TOWN = computeTown();

  function flagStrings() {
    const strings = [];
    const top = [0, SPIRE_Y, 0];
    const wv = wallVerts();
    wv.forEach(([x, z, th]) => {
      [-0.5, 0, 0.5].forEach((o) => {
        strings.push([[top[0], top[1] - Math.abs(o) * 0.6, top[2]], [x - Math.sin(th) * o * 1.6, 2.5, z + Math.cos(th) * o * 1.6]]);
      });
    });
    // a few rooftop poles on the sides and back
    TOWN[0].filter((s) => s.pole && s.pk).forEach((s) => strings.push([top, s.anc]));
    return strings;
  }
  function buildFlags() {
    const bins = [[], [], [], [], []];
    const lineP = [];
    const strings = flagStrings();
    strings.forEach(([a, b], si) => {
      const dx = b[0] - a[0]; const dy = b[1] - a[1]; const dz = b[2] - a[2];
      const L = Math.hypot(dx, dy, dz);
      const sag = 0.01 * L;
      const at = (t) => [a[0] + dx * t, a[1] + dy * t - sag * Math.sin(Math.PI * t), a[2] + dz * t];
      let prev = at(0);
      for (let s = 1; s <= 14; s += 1) { const q = at(s / 14); lineP.push(...prev, ...q); prev = q; }
      const n = Math.floor((L * 0.58) / 0.8);
      for (let i = 0; i < n; i += 1) {
        const t0 = 0.4 + (i / n) * 0.56; const t1 = t0 + (0.5 / L);
        const p0 = at(t0); const p1 = at(t1);
        const fh = 0.5;
        const ci = (i + si) % 5;
        bins[ci].push(p0, p1, [p1[0], p1[1] - fh, p1[2]], [p0[0], p0[1] - fh, p0[2]]);
      }
    });
    // tall vertical banners on poles near the circuit
    const banner = [[19.2, 40], [19.4, 150], [19.2, 200], [19.3, 245], [19.0, 305], [19.3, 340], [19.2, 120], [19.1, 75]];
    const poles = [];
    banner.forEach(([r, deg], bi) => {
      const th = (deg * Math.PI) / 180;
      const x = Math.cos(th) * r; const z = Math.sin(th) * r;
      poles.push([x, z]);
      const tx = -Math.sin(th) * 0.32; const tz = Math.cos(th) * 0.32;
      for (let j = 0; j < 6; j += 1) {
        const y1 = 5.4 - j * 0.58; const y0 = y1 - 0.56;
        const ci = (j + bi) % 5;
        bins[ci].push([x, y1, z], [x + tx * 2, y1, z + tz * 2], [x + tx * 2, y0, z + tz * 2], [x, y0, z]);
      }
    });
    const toGeo = (quads) => {
      const pos = new Float32Array(quads.length * 3);
      quads.forEach((q, i) => pos.set(q, i * 3));
      const idx = [];
      for (let i = 0; i < quads.length; i += 4) idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineP), 3));
    return { flags: bins.map(toGeo), line: lg, poles };
  }

  /* ---------------- chorten and small shrine ---------------- */
  function Chorten({ p, s = 1, W, gold }) {
    return (
      <group position={p} scale={s}>
        <Box s={[1.3, 0.3, 1.3]} p={[0, 0.15, 0]} m={W} />
        <Box s={[1.0, 0.3, 1.0]} p={[0, 0.45, 0]} m={W} />
        <mesh position={[0, 0.6, 0]} scale={[1, 0.85, 1]} material={W} castShadow><sphereGeometry args={[0.46, 16, 10, 0, TAU, 0, Math.PI / 2]} /></mesh>
        <Box s={[0.34, 0.28, 0.34]} p={[0, 1.15, 0]} m={gold} />
        <Cyl rt={0.05} rb={0.22} h={0.75} p={[0, 1.65, 0]} m={gold} seg={10} />
        <Ball rad={0.08} p={[0, 2.07, 0]} m={gold} />
      </group>
    );
  }
  function Shrine({ p, s = 1, ry = 0, W, gold }) {
    return (
      <group position={p} scale={s} rotation={[0, ry, 0]}>
        <Box s={[1.3, 0.25, 1.3]} p={[0, 0.125, 0]} m={W} />
        <Box s={[1.0, 0.85, 1.0]} p={[0, 0.67, 0]} m={W} />
        <Box s={[0.46, 0.55, 0.06]} p={[0, 0.6, 0.52]} m={gold} />
        <Roof w={1.5} d={1.5} h={0.55} y={1.1} m={gold} sag={1.3} lift={0.15} fascia={false} />
        <Ball rad={0.09} p={[0, 1.72, 0]} m={gold} />
      </group>
    );
  }

  /* ================================ MAIN ================================ */
  function BoudhaMain() {
    const M = useM();
    const W = useMemo(() => M.plain('#f6f3ec', { roughness: 0.85 }), [M]);
    const pave = useMemo(() => M.plain('#efe9de', { roughness: 0.95 }), [M]);
    const terra = useMemo(() => M.plain('#b8715a', { roughness: 0.95 }), [M]);
    const eyeTex = useMemo(() => makeEyes(), []);
    const domeTex = useMemo(() => makeDome(), []);
    const harmM = useMemo(() => new THREE.MeshStandardMaterial({ map: eyeTex, roughness: 0.6, metalness: 0.05, emissive: '#2a1f05', emissiveIntensity: 0.05 }), [eyeTex]);
    const domeM = useMemo(() => new THREE.MeshStandardMaterial({ map: domeTex, roughness: 0.92 }), [domeTex]);
    const vc = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), []);
    const lampM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcf6a', emissive: '#ff9a2a', emissiveIntensity: 1.4, roughness: 0.5 }), []);
    const gold = M.gold;

    const terr = useMemo(() => TERR.map((t, i) => ({
      wall: terraceGeo(t.h, t.th, t.y),
      cap: terraceGeo(t.h + 0.12, 0.1, t.y + t.th),
      top: terraceGeo(t.h, 0.03, t.y + t.th + 0.1, 0.5),
      parapet: i === 2 ? (() => {
        const sh = mandalaShape(t.h - 0.1, 1.6, 2.7, 0.7);
        sh.holes.push(new THREE.Path(mandalaShape(t.h - 0.65, 1.6, 2.7, 0.7).getPoints()));
        const g = new THREE.ExtrudeGeometry(sh, { depth: 0.38, bevelEnabled: false });
        g.rotateX(Math.PI / 2); g.translate(0, t.y + t.th + 0.44, 0);
        return g;
      })() : null,
      key: i,
    })), []);

    const stairs = useMemo(() => {
      const list = [];
      for (let k = 0; k < 4; k += 1) {
        const base = new THREE.Matrix4().makeRotationY((k * Math.PI) / 2);
        TERR.forEach((t) => {
          for (let j = 0; j < 5; j += 1) {
            const ht = ((j + 1) * t.th) / 5;
            const z1 = t.h + 1.0 - j * 0.2; const z0 = t.h - 0.2;
            list.push(mkBox([6.4, ht, z1 - z0], [0, t.y + ht / 2, (z0 + z1) / 2], j % 2 ? '#e9e5da' : '#f6f3ec', { base }));
          }
          list.push(mkBox([0.35, t.th * 0.9, 1.4], [3.35, t.y + t.th * 0.45, t.h + 0.4], '#f2efe8', { base }));
          list.push(mkBox([0.35, t.th * 0.9, 1.4], [-3.35, t.y + t.th * 0.45, t.h + 0.4], '#f2efe8', { base }));
        });
      }
      return mergeG(list);
    }, []);

    const drumsDetail = useMemo(() => {
      const list = [];
      const n = 40;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * TAU;
        const dq = Math.abs(((a * 2) / Math.PI) % 1);
        if (dq < 0.12 || dq > 0.88) continue;
        const base = frameBase(Math.cos(a) * 6.62, Math.sin(a) * 6.62, Math.atan2(Math.cos(a), Math.sin(a)));
        list.push(mkBox([0.7, 0.4, 0.1], [0, 3.72, 0], '#3a322c', { base }));
      }
      for (let k = 0; k < 4; k += 1) {
        const a = (k * Math.PI) / 2;
        const base = frameBase(Math.cos(a) * 6.62, Math.sin(a) * 6.62, Math.atan2(Math.cos(a), Math.sin(a)));
        list.push(mkBox([1.1, 0.4, 0.1], [0, 3.72, 0.02], '#d7aa32', { base }));
        list.push(mkBox([0.82, 0.36, 0.12], [0, 3.72, 0.04], '#7a2a22', { base }));
        list.push(mkBox([0.32, 0.2, 0.14], [0, 3.72, 0.07], '#e6c24c', { base }));
      }
      return mergeG(list);
    }, []);

    const lamps = useMemo(() => {
      const list = [];
      for (let k = 0; k < 4; k += 1) {
        const base = new THREE.Matrix4().makeRotationY((k * Math.PI) / 2);
        for (let i = 0; i < 5; i += 1) {
          [-1, 1].forEach((sd) => list.push(mkCyl(0.07, 0.07, 0.1, 8, [sd * (3.0 + i * 0.36), 0.05, TERR[0].h + 1.9], '#ffcf6a', { base })));
        }
      }
      return mergeG(list);
    }, []);

    const wall = useMemo(() => {
      const white = [];
      const det = [];
      const L = 2 * WALL_A * Math.tan(Math.PI / 16);
      for (let k = 0; k < 16; k += 1) {
        const th = Math.PI / 2 + k * (Math.PI / 8);
        const base = frameBase(Math.cos(th) * WALL_A, Math.sin(th) * WALL_A, Math.atan2(-Math.cos(th), -Math.sin(th)));
        const segs = k === 0 ? [[-(L / 2 + 0.2), -1.9], [1.9, L / 2 + 0.2]] : [[-(L / 2 + 0.2), L / 2 + 0.2]];
        segs.forEach(([x0, x1]) => {
          const len = x1 - x0; const xc = (x0 + x1) / 2;
          white.push(mkBox([len, 0.22, 0.98], [xc, 0.11, 0], '#f2efe8', { base }));
          white.push(mkBox([len, 0.66, 0.62], [xc, 0.55, 0], '#f7f4ee', { base }));
          white.push(mkBox([len + 0.04, 0.1, 0.82], [xc, 0.93, 0], '#fbf9f4', { base }));
          det.push(mkBox([len - 0.12, 0.5, 0.04], [xc, 0.52, 0.32], '#6e2a22', { base }));
          const n = Math.max(2, Math.floor((len - 0.2) / 0.36));
          const step = (len - 0.2) / n;
          for (let i = 0; i < n; i += 1) {
            const x = x0 + 0.1 + (i + 0.5) * step;
            det.push(mkCyl(0.14, 0.14, 0.4, 10, [x, 0.52, 0.42], '#a8552a', { base }));
            det.push(mkCyl(0.15, 0.15, 0.05, 10, [x, 0.74, 0.42], '#e0aa34', { base }));
          }
        });
      }
      return { white: mergeG(white), det: mergeG(det) };
    }, []);

    const fl = useMemo(() => buildFlags(), []);
    const poleG = useMemo(() => mergeG(fl.poles.map(([x, z]) => mkCyl(0.04, 0.05, 5.6, 6, [x, 2.8, z], '#5a4030'))
      .concat(wallVerts().map(([x, z]) => mkCyl(0.035, 0.045, 2.6, 6, [x, 1.3, z], '#5a4030')))
      ), [fl]);

    const valance = ['#2c8a4f', '#e8892a', '#2f6db5', '#c8372d'];
    const vh = [0.3, 0.12, 0.12, 0.12];
    let vy = 12.94;
    const vparts = valance.map((c, i) => { vy -= vh[i]; return { c, h: vh[i], y: vy + vh[i] / 2 }; });

    return (
      <group>
        {terr.map((t) => (
          <group key={t.key}>
            <mesh geometry={t.wall} material={W} castShadow receiveShadow />
            <mesh geometry={t.cap} material={M.plain('#dedad0', { roughness: 0.9 })} castShadow receiveShadow />
            <mesh geometry={t.top} material={t.key === 0 ? terra : pave} receiveShadow />
            {t.parapet && <mesh geometry={t.parapet} material={W} castShadow receiveShadow />}
          </group>
        ))}
        <mesh geometry={stairs} material={vc} castShadow receiveShadow />
        <mesh geometry={lamps} material={lampM} />

        {/* round plinth drums, vent slots, four Dhyani Buddha niches */}
        <Cyl rt={7.2} h={0.45} p={[0, 3.225, 0]} m={W} seg={72} />
        <Cyl rt={7.35} h={0.1} p={[0, 3.5, 0]} m={M.plain('#e4e0d6', { roughness: 0.9 })} seg={72} />
        <Cyl rt={6.62} h={0.4} p={[0, 3.72, 0]} m={W} seg={72} />
        <mesh geometry={drumsDetail} material={vc} />

        {/* the great hemispherical dome with saffron lobes at the crown */}
        <mesh position={[0, DOME_Y0, 0]} scale={[1, DOME_SY, 1]} material={domeM} castShadow receiveShadow>
          <sphereGeometry args={[DOME_R, 72, 28, 0, TAU, 0, Math.PI / 2]} />
        </mesh>

        <group position={[0, HOFF, 0]}>
        {/* harmika: gilded square tower, eyes on all four faces, wide striped valance */}
        <Box s={[3.9, 0.16, 3.9]} p={[0, 9.74, 0]} m={gold} />
        <mesh position={[0, 11.35, 0]} castShadow material={[harmM, harmM, gold, gold, harmM, harmM]}><boxGeometry args={[3.6, 3.1, 3.6]} /></mesh>
        {vparts.map((v, i) => <Box key={i} s={[3.84, v.h, 3.84]} p={[0, v.y, 0]} m={M.plain(v.c, { roughness: 0.7 })} cast={false} />)}
        <Box s={[3.9, 0.08, 3.9]} p={[0, 12.98, 0]} m={gold} />

        <group position={[0, 13.0, 0]}>
        {/* 13 gilded steps, a broad tapering tower */}
        {Array.from({ length: 13 }, (_, i) => {
          const r = 1.65 - i * (1.15 / 12);
          return (
            <group key={i}>
              <Cyl rt={r - 0.04} rb={r - 0.01} h={0.33} p={[0, 0.165 + i * 0.33, 0]} m={gold} seg={20} />
              <Cyl rt={r + 0.04} rb={r + 0.04} h={0.05} p={[0, 0.025 + i * 0.33, 0]} m={M.plain('#b98a1c', { metalness: 0.5, roughness: 0.4 })} seg={20} />
            </group>
          );
        })}
        <Cyl rt={1.0} h={0.06} p={[0, 0.0, 0]} m={M.plain('#c8372d')} seg={20} />
        <group position={[0, 1.04, 0]}>
        {/* collar bands, parasol, crown */}
        <Cyl rt={0.4} h={0.07} p={[0, 3.3, 0]} m={M.plain('#c8372d')} seg={16} />
        <Cyl rt={0.4} h={0.07} p={[0, 3.37, 0]} m={M.plain('#2f6db5')} seg={16} />
        <Cyl rt={0.4} h={0.07} p={[0, 3.44, 0]} m={M.plain('#f4f1e8')} seg={16} />
        <mesh position={[0, 3.75, 0]} material={gold} castShadow><coneGeometry args={[0.85, 0.4, 24]} /></mesh>
        <mesh position={[0, 3.55, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}><torusGeometry args={[0.84, 0.035, 6, 28]} /></mesh>
        <Ball rad={0.22} p={[0, 4.02, 0]} m={gold} />
        <Cyl rt={0.02} rb={0.12} h={0.7} p={[0, 4.4, 0]} m={gold} seg={10} />
        <mesh position={[0, 4.62, 0]} rotation={[0, 0, Math.PI]} material={gold}><torusGeometry args={[0.17, 0.04, 6, 14, Math.PI]} /></mesh>
        <Ball rad={0.1} p={[0, 4.8, 0]} m={gold} />
        <Cyl rt={0.01} rb={0.05} h={0.28} p={[0, 4.96, 0]} m={gold} seg={6} />
        </group>
        </group>
        </group>

        {/* chortens only at the outer corners of the lowest terrace */}
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => (
          <Chorten key={i} p={[sx * 10.2, 1.2, sz * 10.2]} s={0.5} W={W} gold={gold} />
        ))}

        {/* 16-sided kora wall with its rows of prayer wheels, gate gap on the +z side */}
        <mesh geometry={wall.white} material={vc} castShadow receiveShadow />
        <mesh geometry={wall.det} material={vc} castShadow />
        {[-2.1, 2.1].map((x) => (
          <group key={x}>
            <Box s={[0.5, 1.6, 0.6]} p={[x, 0.8, WALL_A]} m={W} />
            <Ball rad={0.2} p={[x, 1.78, WALL_A]} m={gold} />
          </group>
        ))}

        {/* flags */}
        {fl.flags.map((g, i) => <mesh key={i} geometry={g} castShadow><meshStandardMaterial color={FLAGC[i]} side={THREE.DoubleSide} roughness={1} /></mesh>)}
        <lineSegments geometry={fl.line}><lineBasicMaterial color="#b9c7d2" transparent opacity={0.55} /></lineSegments>
        <mesh geometry={poleG} material={vc} />

        <Frame s={[26, 20, 26]} p={[0, 10, 0]} />
      </group>
    );
  }

  /* ================================ ENV ================================ */
  function buildTownGeo() {
    const G = { brick: [], plaster: [], detail: [], glass: [], lit: [], gold: [] };
    const awnC = ['#2f6db5', '#c0392b', '#2e8b57', '#e2b33c', '#d9d4c8'];
    const wood = '#5a3822';
    const house = (sp, full) => {
      const rnd = rng(sp.seed);
      const { w, d, st, H } = sp;
      const base = frameBase(Math.cos(sp.ac) * (sp.R + d / 2), Math.sin(sp.ac) * (sp.R + d / 2), sp.ry);
      const body = sp.kind === 'brick' ? G.brick : G.plaster;
      body.push(mkBox([w, H, d], [0, H / 2, 0], sp.col, { base, tile: sp.kind === 'brick' ? 2.4 : 0 }));
      const fz = d / 2;
      if (sp.gompa) {
        const maroon = '#7d2a22';
        G.detail.push(mkBox([w + 0.1, 0.55, d + 0.1], [0, H - 0.3, 0], maroon, { base }));
        G.detail.push(mkBox([w + 0.3, 0.12, d + 0.3], [0, H + 0.02, 0], '#e8e2d4', { base }));
        G.gold.push(mkPyr(w * 0.8, d * 0.8, 0.95, [0, H + 0.08, 0], null, { base }));
        G.gold.push(mkCyl(0.05, 0.12, 0.7, 8, [0, H + 1.35, 0], null, { base }));
        G.gold.push(new THREE.SphereGeometry(0.14, 8, 6));
        const sg = G.gold[G.gold.length - 1]; sg.translate(0, H + 1.8, 0); sg.applyMatrix4(base); paint(sg, null);
        [-1, 1].forEach((sd) => {
          G.gold.push(mkBox([0.45, 0.3, 0.45], [sd * (w / 2 - 0.4), H + 0.26, d / 2 - 0.4], null, { base }));
          G.gold.push(mkBox([0.45, 0.3, 0.45], [sd * (w / 2 - 0.4), H + 0.26, -d / 2 + 0.4], null, { base }));
        });
        G.detail.push(mkBox([1.5, 1.2, 0.12], [0, 0.65, fz + 0.03], maroon, { base }));
        G.gold.push(mkBox([1.7, 0.1, 0.16], [0, 1.3, fz + 0.05], null, { base }));
        for (let s = 1; s < st; s += 1) {
          const y = 1.1 + (s - 1) * 0.95 + 0.5;
          [-1, 1].forEach((sd) => {
            G.detail.push(mkBox([1.0, 0.7, 0.1], [sd * w * 0.27, y, fz + 0.03], maroon, { base }));
            G.glass.push(mkBox([0.78, 0.5, 0.12], [sd * w * 0.27, y, fz + 0.05], '#d9a92e', { base }));
          });
          if (s === st - 1) G.gold.push(mkBox([1.2, 0.72, 0.14], [0, y, fz + 0.05], null, { base }));
        }
        return;
      }
      // windows
      const nW = Math.max(2, Math.round(w / 1.5));
      for (let s = 1; s < st; s += 1) {
        const y = 1.1 + (s - 1) * 0.95 + 0.48;
        for (let i = 0; i < nW; i += 1) {
          const x = (i - (nW - 1) / 2) * (w / nW);
          G.detail.push(mkBox([0.64, 0.6, 0.1], [x, y, fz + 0.03], wood, { base }));
          const lit = rnd() < 0.22;
          (lit ? G.lit : G.glass).push(mkBox([0.46, 0.42, 0.12], [x, y, fz + 0.045], '#ffffff', { base }));
          if (full) G.detail.push(mkBox([0.76, 0.05, 0.14], [x, y - 0.33, fz + 0.06], '#efe8da', { base }));
        }
        if (s < st - 1 || true) G.detail.push(mkBox([w + 0.06, 0.06, d + 0.06], [0, 1.1 + (s - 1) * 0.95 + 0.02, 0], '#efe8da', { base }));
      }
      // shop front
      G.detail.push(mkBox([w * 0.74, 0.78, 0.1], [0, 0.45, fz + 0.03], '#3e2c20', { base }));
      G.detail.push(mkBox([w * 0.78, 0.07, 0.42], [0, 0.93, fz + 0.2], awnC[sp.awn % 5], { base, r: [0.25, 0, 0] }));
      if (sp.balc && st > 2) {
        for (let s2 = 1; s2 < st; s2 += 2) {
          const y = 1.1 + (s2 - 1) * 0.95 + 0.1;
          G.detail.push(mkBox([w * 0.86, 0.07, 0.55], [0, y, fz + 0.27], wood, { base }));
          G.detail.push(mkBox([w * 0.86, 0.3, 0.04], [0, y + 0.19, fz + 0.52], wood, { base }));
        }
      }
      if (sp.tin) {
        G.detail.push(mkBox([w + 0.3, 0.08, d + 0.3], [0, H + 0.04, 0], '#6a5448', { base }));
        G.detail.push(mkPyr(w + 0.45, d + 0.45, 0.95, [0, H + 0.06, 0], '#8e9ca4', { base }));
        return;
      }
      // flat roof with parapet (pitched roofs are for the gompas only)
      G.detail.push(mkBox([w + 0.14, 0.1, d + 0.14], [0, H + 0.05, 0], sp.flatCol, { base }));
      G.detail.push(mkBox([w + 0.1, 0.3, 0.1], [0, H + 0.25, fz + 0.02], '#cfc6b6', { base }));
      G.detail.push(mkBox([w + 0.1, 0.3, 0.1], [0, H + 0.25, -fz - 0.02], '#cfc6b6', { base }));
      G.detail.push(mkBox([0.1, 0.3, d], [-w / 2 - 0.02, H + 0.25, 0], '#cfc6b6', { base }));
      G.detail.push(mkBox([0.1, 0.3, d], [w / 2 + 0.02, H + 0.25, 0], '#cfc6b6', { base }));
      if (!sp.front && rnd() < 0.7) G.detail.push(mkBox([w * 0.35, 0.6, d * 0.35], [(rnd() - 0.5) * w * 0.4, H + 0.45, -d * 0.2], '#d8cfc0', { base }));
      if (rnd() < 0.5) G.detail.push(mkBox([w * 0.28, 0.35, 0.5], [(rnd() - 0.5) * w * 0.5, H + 0.28, -d * 0.1], sp.roofCol, { base }));
      if (sp.pole) G.detail.push(mkCyl(0.035, 0.045, 1.5, 6, [0, H + 0.8, fz - 0.4], '#5a4030', { base }));
    };
    TOWN[0].forEach((sp) => house(sp, true));
    TOWN[1].forEach((sp) => house(sp, false));
    return { brick: mergeG(G.brick), plaster: mergeG(G.plaster), detail: mergeG(G.detail), glass: mergeG(G.glass), lit: mergeG(G.lit), gold: mergeG(G.gold) };
  }

  function BoudhaEnv() {
    const M = useM();
    const W = useMemo(() => M.plain('#f6f3ec', { roughness: 0.85 }), [M]);
    const gold = M.gold;
    const town = useMemo(() => buildTownGeo(), []);
    const mBrick = useMemo(() => {
      const m = M.mat('brick', 1, 1, { color: '#ffffff' }).clone();
      m.vertexColors = true; m.needsUpdate = true; return m;
    }, [M]);
    const mPlas = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), []);
    const mDet = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), []);
    const mGlass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2d3a44', emissive: '#6a4418', emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.2 }), []);
    const mLit = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8c070', emissive: '#ffb347', emissiveIntensity: 1.1, roughness: 0.5 }), []);
    const street = useMemo(() => M.mat('brick', 12, 12, { color: '#d9a089' }), [M]);
    const stone = useMemo(() => M.mat('brick', 9, 9, { color: '#d9967c' }), [M]);
    const gray = useMemo(() => M.plain('#b9b4aa', { roughness: 0.95 }), [M]);
    const outer = useMemo(() => M.plain('#b8ae9c', { roughness: 1 }), [M]);
    const field = useMemo(() => M.mat('grass', 36, 36, { color: '#a9c08a' }), [M]);

    const ridge = useMemo(() => {
      const mk = (r0, base, amp, seed, y0) => {
        const rnd = rng(seed); const N = 90; const pos = []; const idx = [];
        let h = 0;
        for (let i = 0; i <= N; i += 1) {
          const a = Math.PI * 1.05 + (i / N) * Math.PI * 0.9;
          const env = 0.3 + 0.7 * Math.sin((Math.PI * i) / N);
          h = env * (base + amp * (0.5 + 0.3 * Math.sin(i * 0.23 + seed) + 0.2 * Math.sin(i * 0.61 + seed * 2)) + rnd() * amp * 0.18);
          const c = Math.cos(a); const sn = Math.sin(a);
          pos.push(c * (r0 + 14), y0, sn * (r0 + 14), c * r0, h, sn * r0);
          if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        g.setIndex(idx); g.computeVertexNormals();
        return g;
      };
      return { far: mk(130, 26, 12, 3, -0.3), near: mk(102, 16, 6, 7, -0.3) };
    }, []);
    const skyTex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 8; c.height = 256;
      const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#2f6fc0'); gr.addColorStop(0.5, '#6aa2dc'); gr.addColorStop(0.8, '#a8cdea'); gr.addColorStop(1, '#d6e6ef');
      g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }, []);
    const rings = (n, r, f) => Array.from({ length: n }, (_, i) => f(i, (i / n) * TAU));

    return (
      <group>
        <mesh position={[0, -20, 0]} rotation={[0, 0, 0]}><sphereGeometry args={[175, 24, 16, 0, TAU, 0, Math.PI * 0.62]} /><meshLambertMaterial map={skyTex} emissive="#ffffff" emissiveMap={skyTex} emissiveIntensity={0.3} side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
        {/* flat valley floor, paved town, brick circuit street, stone inside the wall */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow material={field}><circleGeometry args={[110, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow material={outer}><circleGeometry args={[42, 64]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow material={street}><circleGeometry args={[HOUSE_R + 0.5, 64]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={stone}><circleGeometry args={[WALL_A - 0.2, 64]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} receiveShadow material={gray}><ringGeometry args={[WALL_A + 0.6, WALL_A + 2.2, 64]} /></mesh>

        {/* the closed ring of houses and gompas */}
        <mesh geometry={town.brick} material={mBrick} castShadow receiveShadow />
        <mesh geometry={town.plaster} material={mPlas} castShadow receiveShadow />
        <mesh geometry={town.detail} material={mDet} castShadow receiveShadow />
        <mesh geometry={town.glass} material={mGlass} />
        <mesh geometry={town.lit} material={mLit} />
        <mesh geometry={town.gold} material={gold} castShadow />

        {/* small chortens and gold-roofed shrines at the edge of the circuit */}
        {[[22, 15.4], [-30, 15.4], [140, 15.4], [200, 15.6], [250, 15.4], [320, 15.5]].map(([deg, r], i) => {
          const th = (deg * Math.PI) / 180;
          return <Chorten key={i} p={[Math.cos(th) * r, 0, Math.sin(th) * r]} s={0.95} W={W} gold={gold} />;
        })}
        {[[60, 15.6], [118, 15.6], [175, 15.5], [292, 15.6]].map(([deg, r], i) => {
          const th = (deg * Math.PI) / 180;
          return <Shrine key={i} p={[Math.cos(th) * r, 0, Math.sin(th) * r]} s={1.0} ry={Math.atan2(-Math.cos(th), -Math.sin(th))} W={W} gold={gold} />;
        })}
        {/* chortens on top of the kora wall */}
        {[[3, 1], [11, 1]].map(([k], i) => {
          const th = Math.PI / 2 + (k + 0.5) * (Math.PI / 8);
          const R = WALL_A / Math.cos(Math.PI / 16);
          return <Chorten key={i} p={[Math.cos(th) * R, 0.98, Math.sin(th) * R]} s={0.5} W={W} gold={gold} />;
        })}

        {/* Ajima shrine beside the main gate */}
        <group position={[-10.5, 0, 21.4]}>
          <Box s={[2.4, 0.3, 2.4]} p={[0, 0.15, 0]} m={W} />
          <Box s={[2.0, 1.1, 2.0]} p={[0, 0.85, 0]} m={M.plain('#b3342a', { roughness: 0.8 })} />
          <Box s={[2.1, 0.12, 2.1]} p={[0, 1.45, 0]} m={W} />
          <Box s={[1.5, 0.8, 1.5]} p={[0, 1.9, 0]} m={W} />
          <Box s={[0.8, 0.7, 0.06]} p={[0, 0.8, 1.02]} m={gold} />
          <Roof w={2.8} d={2.8} h={0.6} y={1.45} m={gold} sag={1.4} lift={0.12} fascia={false} />
          <Roof w={2.2} d={2.2} h={0.55} y={2.3} m={gold} sag={1.4} lift={0.12} fascia={false} />
          <Cyl rt={0.03} rb={0.12} h={0.55} p={[0, 3.1, 0]} m={gold} seg={8} />
        </group>
        {/* lamp house (Diyo Ghar) with brass lamp trays */}
        <group position={[10.5, 0, 20.6]}>
          <Box s={[4.2, 1.7, 0.5]} p={[0, 0.85, 0.6]} m={M.plain('#b5502f', { roughness: 0.85 })} />
          <Box s={[4.4, 0.12, 1.4]} p={[0, 1.75, 0.2]} m={M.plain('#8a3a24')} />
          <Box s={[3.8, 0.1, 0.8]} p={[0, 0.7, 0.0]} m={M.dark} />
          {[-1.4, -0.5, 0.4, 1.3].map((x) => <Cyl key={x} rt={0.22} rb={0.26} h={0.14} p={[x, 0.82, 0]} m={gold} seg={8} />)}
          {[-1.4, -0.5, 0.4, 1.3].map((x) => <Ball key={`f${x}`} rad={0.06} p={[x, 0.96, 0]} m={M.plain('#ffb347', { emissive: '#ff9a2a', emissiveIntensity: 1.5 })} />)}
        </group>

        {/* distant hazy green hills to the north, a few trees far outside the ring */}
        <mesh geometry={ridge.far}><meshStandardMaterial color="#8aa6c4" emissive="#8aa6c4" emissiveIntensity={0.55} fog={false} roughness={1} flatShading side={THREE.DoubleSide} /></mesh>
        <mesh geometry={ridge.near}><meshStandardMaterial color="#7f9a8a" emissive="#7f9a8a" emissiveIntensity={0.5} fog={false} roughness={1} flatShading side={THREE.DoubleSide} /></mesh>
        {rings(18, 48, (i, a) => {
          const r = 45 + (i % 4) * 5;
          return <Tree key={i} p={[Math.cos(a + i) * r, 0, Math.sin(a + i) * r]} s={1.6 + (i % 3) * 0.5} kind={i % 4 === 0 ? 'pine' : 'broad'} />;
        })}
      </group>
    );
  }

  return { boudhanath: { Main: BoudhaMain, Env: BoudhaEnv } };
}
