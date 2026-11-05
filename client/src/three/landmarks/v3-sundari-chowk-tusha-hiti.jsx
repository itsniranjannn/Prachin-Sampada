// Sundari Chowk and Tusha Hiti, Patan Durbar Square, Lalitpur.
// An enclosed brick courtyard of the Malla palace (the southern court, south of Mul Chowk). The "monument" is the room and the
// sunken royal bath in its middle: a rounded, cusped stone basin 1.5 m below the flagstones, a ring of small deity statues on
// the rim with two stone serpents coiled round it, nine steps down guarded by two lions, a gilt spout and tiny green pool on
// the far wall, a miniature Krishna Mandir spire on the axis. Around it: 3-storey red-brick wings (open carved-timber arcade,
// carved-window brick storey, lattice top floor under a deep tiled roof); the far wing has three cusped carved-wood arches.
// Entrance (real west side, Durbar Square) is +z. The two near wings (+z, +x) are cut away to a low stone plinth when the
// camera is outside them, so the court is always visible; they stand full height when the viewer is inside or on the far side.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Diyo, NewarHouse, Tree, THREE, useMemo, useRef, useEffect } = K;

  /* ---------------- layout (1 unit = about 2 m) ---------------- */
  const X = 4.2, Z = 3.8, T = 2.2;            // court half-width (x), half-depth (z), wing thickness
  const PL = 0.24, H1 = 2.0, H2 = 3.1, H3 = 4.1; // arcade floor, top of arcade, top of brick storey, eave line
  const D = 0.78;                           // depth of the bath (1.5 m)
  const BA = 1.12, BB = 1.5, NLOBE = 15;    // bath semi-axes (x, z), 30 scallops
  const SW = 0.45, ZF = 1.95;               // half width and front end of the stair
  const BRICK = '#c9775a';
  const BS = 1.5;                           // the bath group is drawn at this scale

  /* ---------------- deterministic random ---------------- */
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------------- canvas textures (made once, lazily) ---------------- */
  let TX = null;
  function textures() {
    if (TX) return TX;
    const mk = (w, h, draw) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
      return t;
    };
    const flags = mk(512, 512, (g, w, h) => {
      const R = rng(7);
      g.fillStyle = '#3c4430'; g.fillRect(0, 0, w, h);
      let y = 0;
      while (y < h) {
        const rh = Math.min(h - y, 70 + R() * 56);
        let x = -R() * 150;
        while (x < w) {
          const sw = 120 + R() * 140;
          g.fillStyle = `hsl(${34 + R() * 12} ${4 + R() * 6}% ${50 + R() * 12}%)`;
          g.fillRect(x + 3, y + 3, sw - 6, rh - 6);
          for (let k = 0; k < 14; k += 1) { g.fillStyle = `rgba(60,55,45,${0.06 + R() * 0.1})`; g.fillRect(x + 4 + R() * (sw - 14), y + 4 + R() * (rh - 14), 3 + R() * 9, 2 + R() * 5); }
          if (R() < 0.25) { g.fillStyle = 'rgba(86,104,60,0.35)'; g.fillRect(x + 2, y + rh - 6, sw - 4, 4); }
          x += sw;
        }
        y += rh;
      }
    });
    const NN = 34;
    const niches = mk(2048, 256, (g, w, h) => {
      g.fillStyle = '#58534b'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3d3934'; g.fillRect(0, 0, w, 34);
      for (let i = 0; i < 130; i += 1) { g.fillStyle = '#857f72'; g.beginPath(); g.arc(8 + i * 16, 17, 5, 0, 7); g.fill(); }
      const cw = w / NN;
      [[42, 128], [136, 226]].forEach(([y0, y1]) => {
        for (let i = 0; i < NN; i += 1) {
          const x0 = i * cw; const nx = x0 + 9; const nw = cw - 16;
          g.fillStyle = '#38342e'; g.fillRect(x0, y0, 6, y1 - y0);
          g.fillStyle = '#17140f';
          g.beginPath(); g.moveTo(nx, y1 - 4); g.lineTo(nx, y0 + 26); g.arc(nx + nw / 2, y0 + 26, nw / 2, Math.PI, 0); g.lineTo(nx + nw, y1 - 4); g.closePath(); g.fill();
          g.fillStyle = '#a39c8c';
          g.fillRect(nx + nw / 2 - 8, y0 + 46, 16, y1 - y0 - 58);
          g.beginPath(); g.arc(nx + nw / 2, y0 + 38, 7, 0, 7); g.fill();
          g.strokeStyle = '#8b8474'; g.lineWidth = 3; g.beginPath(); g.arc(nx + nw / 2, y0 + 38, 15, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
          g.fillStyle = '#7d7769'; g.fillRect(nx + 6, y0 + 58, nw - 12, 4);
        }
      });
      g.fillStyle = '#3a362f'; g.fillRect(0, 230, w, 26);
      g.fillStyle = '#6f695c'; g.fillRect(0, 232, w, 4);
    });
    const lattice = mk(128, 128, (g, w, h) => {
      g.fillStyle = '#150b06'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#7d5430';
      for (let k = 0; k < 4; k += 1) { g.fillRect(k * 32, 0, 8, h); g.fillRect(0, k * 32, w, 8); }
      g.fillStyle = '#4e3220';
      for (let k = 0; k < 4; k += 1) { g.fillRect(k * 32 + 2, 0, 2, h); g.fillRect(0, k * 32 + 2, w, 2); }
    });
    TX = { flags, niches, lattice, NN };
    return TX;
  }
  let MT = null;
  const latCache = {};
  function mt() {
    if (MT) return MT;
    const t = textures();
    const mk = (map, rx, ry, o = {}) => { const m = map.clone(); m.needsUpdate = true; m.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: m, roughness: 0.95, ...o }); };
    MT = {
      paving: mk(t.flags, 1 / 3, 1 / 3, { color: '#8a8577' }),
      pave2: mk(t.flags, 1 / 1.6, 1 / 1.6, { color: '#847f72' }),
      pitSide: new THREE.MeshStandardMaterial({ color: '#4c483f', roughness: 0.95 }),
      niches: mk(t.niches, 1, 1, { side: THREE.DoubleSide }),
      mk,
    };
    return MT;
  }
  function latMat(len) {
    const k = Math.round(len * 2);
    if (!latCache[k]) latCache[k] = mt().mk(textures().lattice, len / 0.9, 1, { roughness: 0.8 });
    return latCache[k];
  }

  /* ---------------- shared geometry ---------------- */
  const archOpenGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.6, 0); s.lineTo(0.6, 0); s.lineTo(0.6, 1.0); s.absarc(0, 1.0, 0.6, 0, Math.PI, false); s.lineTo(-0.6, 0);
    return new THREE.ShapeGeometry(s);
  })();
  const halfDiscGeo = (() => {
    const s = new THREE.Shape(); s.absarc(0, 0, 1, 0, Math.PI, false);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); return g;
  })();
  const archRingGeo = new THREE.TorusGeometry(0.64, 0.045, 6, 20, Math.PI);
  const sphereGeo = new THREE.SphereGeometry(1, 10, 8);
  const cuspGeo = (() => {
    const hw = 0.64, hh = 0.92, N = 64;
    const outer = []; const inner = [];
    for (let i = 0; i <= N; i += 1) {
      const a = (i / N) * Math.PI; const ex = Math.cos(a); const ey = Math.sin(a);
      const sc = 0.1 * Math.abs(Math.sin(3.5 * a));
      const peak = 0.26 * Math.exp(-(((a - Math.PI / 2) / 0.2) ** 2));
      outer.push([(hw + 0.13 + sc) * ex, (hh + 0.05 + sc) * ey + peak]);
      const sc2 = 0.09 * Math.abs(Math.sin(3.5 * a));
      inner.push([(hw - 0.05 - sc2) * ex, (hh - 0.16 - sc2) * ey]);
    }
    const s = new THREE.Shape();
    s.moveTo(outer[0][0], 0);
    outer.forEach(([x, y]) => s.lineTo(x, y));
    s.lineTo(inner[N][0], 0);
    for (let i = N; i >= 0; i -= 1) s.lineTo(inner[i][0], inner[i][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: false }); g.translate(0, 0, -0.07); return g;
  })();

  /* ---------------- bath outline ---------------- */
  const rOf = (th) => 1 - 0.05 * Math.abs(Math.sin(NLOBE * th));
  const oval = (th, s = 1) => { const r = rOf(th) * s; return [BA * r * Math.sin(th), BB * r * Math.cos(th)]; };
  const arc = (a0, a1, s, n) => Array.from({ length: n + 1 }, (_, i) => oval(a0 + ((a1 - a0) * i) / n, s));
  const TH0 = Math.asin(SW / (BA * 0.97));
  const TWO = Math.PI * 2;
  const PIT = [...arc(TH0, TWO - TH0, 1, 180), [-SW, ZF], [SW, ZF]];

  /* ---------------- instanced boxes (or any geometry) ---------------- */
  function Inst({ items, m, geo, cast = false }) {
    const ref = useRef();
    const g = useMemo(() => geo || new THREE.BoxGeometry(1, 1, 1), [geo]);
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D(); o.rotation.order = 'YXZ';
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.scale.set(it[3], it[4], it[5]);
        o.rotation.set(it[7] || 0, it[6] || 0, 0); o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return <instancedMesh key={items.length} ref={ref} args={[g, m, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }

  /* gable roof of tiles with optional brick end plates; ridge runs along local x, eave at y */
  function RoofRun({ L, y, zr, zf, zb, rise, m, br, ends = true }) {
    const rf = zf - zr; const rb = zr - zb;
    const lf = Math.hypot(rf, rise); const lb = Math.hypot(rb, rise);
    const af = Math.atan2(rise, rf); const ab = Math.atan2(rise, rb);
    const tri = useMemo(() => {
      const s = new THREE.Shape(); s.moveTo(zf, 0); s.lineTo(zr, rise); s.lineTo(zb, 0); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false }); g.rotateY(-Math.PI / 2); return g;
    }, [zf, zr, zb, rise]);
    return (
      <group position={[0, y, 0]}>
        <mesh position={[0, rise / 2 + 0.02, (zr + zf) / 2]} rotation={[af, 0, 0]} material={m} castShadow receiveShadow><boxGeometry args={[L, 0.12, lf]} /></mesh>
        <mesh position={[0, rise / 2 + 0.02, (zr + zb) / 2]} rotation={[-ab, 0, 0]} material={m} castShadow receiveShadow><boxGeometry args={[L, 0.12, lb]} /></mesh>
        <mesh position={[0, rise + 0.07, zr]} castShadow><boxGeometry args={[L, 0.15, 0.24]} /><meshStandardMaterial color="#6b3d2c" roughness={0.9} /></mesh>
        {ends && <mesh geometry={tri} material={br} position={[L / 2, 0, 0]} />}
        {ends && <mesh geometry={tri} material={br} position={[-L / 2 + 0.16, 0, 0]} />}
      </group>
    );
  }

  /* ---------------- wings of the court ---------------- */
  const CFG = {
    far: { Lv: 2 * X, L: 2 * X + 2 * T, pitch: 1.35, cusp: [4, 5, 6], win: ['lat', 'wide', 'lat', 'wide', 'lat', 'arch', 'lat', 'wide'], fl: 'ridgeHi' },
    left: { Lv: 2 * Z, L: 2 * Z, pitch: 1.43, cusp: [], win: ['lat', 'lat', 'lat', 'arch2', 'lat', 'lat', 'lat'] },
    right: { Lv: 2 * Z, L: 2 * Z, pitch: 1.7, cusp: [], win: ['wide', 'wide', 'wide', 'wide', 'wide', 'wide'] },
    near: { Lv: 2 * X, L: 2 * X + 2 * T, pitch: 1.35, cusp: [], win: ['lat', 'wide', 'lat', 'gate', 'lat', 'wide', 'lat', 'wide'], gate: 3 },
  };

  function Wing({ k }) {
    const M = useM();
    const c = CFG[k];
    const { Lv, L } = c;
    const nb = Math.round(Lv / c.pitch); const bp = Lv / nb;
    const bx = (i) => -Lv / 2 + bp * (i + 0.5);
    const ext = (L - Lv) / 2;
    const wood = M.plain('#4a3426', { roughness: 0.85 });
    const wood2 = M.plain('#6a4a34', { roughness: 0.85 });
    const cuspW = M.plain('#5a3d2b', { roughness: 0.8 });
    const cuspL = M.plain('#a07a52', { roughness: 0.75 });
    const slatM = M.plain('#8a5c34', { roughness: 0.8 });
    const night = M.plain('#241610', { roughness: 1 });
    const stoneM = M.plain('#625d53', { roughness: 0.95 });
    const stone2 = M.plain('#585449', { roughness: 0.95 });
    const brickBack = M.plain('#8d5441', { roughness: 0.95 });
    const roofM = M.mat('roof', L / 2.4, 2.2, { color: '#5a3a2c' });
    const brickA = M.mat('brick', L / 2.2, (H2 - H1) / 1.1, { color: BRICK, emissive: '#8a4a38', emissiveIntensity: 0.4 });
    const brickB = M.mat('brick', L / 2.2, (H3 - H2) / 1.1, { color: BRICK, emissive: '#8a4a38', emissiveIntensity: 0.4 });
    const brickE = M.mat('brick', 1, H1 / 1.1, { color: BRICK, emissive: '#8a4a38', emissiveIntensity: 0.4 });
    const brickBk = M.mat('brick', Lv / 2.2, (H1 - PL) / 1.1, { color: '#c0694e', emissive: '#8a4a38', emissiveIntensity: 0.4 });
    const brickG = M.mat('brick', 1, 2, { color: BRICK, emissive: '#8a4a38', emissiveIntensity: 0.4 });
    const cuspSet = new Set(c.cusp);

    const it = useMemo(() => {
      const A = { cols: [], bases: [], caps: [], rings: [], opens: [], dent1: [], dent2: [], struts: [], posts: [], frames: [], wopen: [], slats: [], sills: [], hoods: [], tymp: [], tymp2: [], outer: [], brk: [] };
      for (let i = 0; i <= nb; i += 1) {
        const x = -Lv / 2 + bp * i;
        A.cols.push([x, PL + 0.5, -0.18, 0.17, 1.0, 0.17]);
        A.bases.push([x, PL + 0.05, -0.18, 0.28, 0.1, 0.28]);
        A.caps.push([x, PL + 1.06, -0.18, 0.3, 0.12, 0.3]);
        
      }
      for (let i = 0; i < nb; i += 1) {
        const s = Math.min(1.1, (bp - 0.22) / 1.28);
        if (!cuspSet.has(i)) A.opens.push([bx(i), PL, -1.495, (bp - 0.3) / 1.2, 1.0, 1]);
        if (!cuspSet.has(i)) A.rings.push([bx(i), PL + 1.12, 0.09, s, 0.97, 1]);
      }
      for (let x = -L / 2 + 0.2; x < L / 2 - 0.1; x += 0.3) {
        A.dent1.push([x, H2 - 0.17, 0.17, 0.11, 0.18, 0.16]);
        A.dent2.push([x, H3 - 0.22, 0.28, 0.1, 0.16, 0.2]);
      }
      for (let x = -L / 2 + 0.4; x < L / 2 - 0.2; x += 0.75) A.struts.push([x, H3 - 0.28, 0.4, 0.1, 0.1, 0.95, 0, -0.62]);
      for (let i = 0; i <= nb; i += 1) A.posts.push([-Lv / 2 + bp * i, 3.6, 0.07, 0.11, 0.95, 0.13]);
      /* windows of the brick storey */
      const yc = 2.52;
      c.win.forEach((kind, i) => {
        const x = bx(i);
        if (kind === 'lat' || kind === 'wide') {
          const w = kind === 'lat' ? 0.5 : 0.86; const h = 0.62; const ns = kind === 'lat' ? 4 : 7;
          A.frames.push([x, yc, 0.03, w + 0.22, h + 0.22, 0.1]);
          A.wopen.push([x, yc, 0.08, w, h, 0.04]);
          for (let s = 0; s < ns; s += 1) A.slats.push([x - w / 2 + ((s + 0.5) * w) / ns, yc, 0.105, 0.03, h, 0.03]);
          A.slats.push([x, yc + 0.1, 0.105, w, 0.03, 0.03]);
          A.sills.push([x, yc - h / 2 - 0.15, 0.12, w + 0.4, 0.07, 0.26]);
          A.sills.push([x, yc + h / 2 + 0.15, 0.1, w + 0.32, 0.09, 0.2]);
          A.hoods.push([x, yc + h / 2 + 0.3, 0.2, w + 0.55, 0.04, 0.44, 0, 0.35]);
        } else if (kind === 'arch' || kind === 'arch2') {
          const w = kind === 'arch' ? 0.78 : 0.62; const h = 0.5; const yy = 2.46; const ns = kind === 'arch' ? 7 : 5;
          A.frames.push([x, yy, 0.14, w + 0.32, h + 0.3, 0.3]);
          A.wopen.push([x, yy, 0.3, w, h, 0.04]);
          for (let s = 0; s < ns; s += 1) A.slats.push([x - w / 2 + ((s + 0.5) * w) / ns, yy, 0.325, 0.028, h, 0.03]);
          A.sills.push([x, yy - h / 2 - 0.2, 0.22, w + 0.6, 0.08, 0.5]);
          A.tymp.push([x, yy + h / 2 + 0.14, 0.2, (w + 0.32) / 2, (w + 0.32) / 2 * 0.9, 0.2]);
          A.tymp2.push([x, yy + h / 2 + 0.14, 0.31, (w + 0.32) / 2 - 0.1, ((w + 0.32) / 2 - 0.1) * 0.9, 0.06]);
          A.hoods.push([x, yy + h / 2 + 0.08 + (w + 0.32) * 0.5, 0.32, w + 0.9, 0.05, 0.55, 0, 0.32]);
        }
      });
      /* small windows on the outer face */
      for (let x = -L / 2 + 1.1; x < L / 2 - 0.6; x += 2.0) {
        A.outer.push([x, 1.2, -T - 0.02, 0.5, 0.6, 0.06]); A.outer.push([x, 2.55, -T - 0.02, 0.5, 0.62, 0.06]); A.outer.push([x, 3.6, -T - 0.02, 0.62, 0.7, 0.06]);
      }
      return A;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const roofL = k === 'left' || k === 'right' ? Lv - 0.9 : L + 0.6;
    const hi = 0;

    return (
      <group>
        {/* floor, stone plinth bands */}
        <Box s={[Lv, PL, 1.75]} p={[0, PL / 2, -0.875]} m={stoneM} cast={false} />
        <Box s={[Lv, 0.14, 0.45]} p={[0, 0.07, 0.225]} m={stoneM} cast={false} />
        <Box s={[Lv, 0.07, 0.8]} p={[0, 0.035, 0.4]} m={stone2} cast={false} />
        {/* masonry */}
        <Box s={[Lv, H1 - PL, T - 1.5]} p={[0, (H1 + PL) / 2, -1.5 - (T - 1.5) / 2]} m={brickBk} />
        <Box s={[Lv, 0.01, 0.01]} p={[0, 0, -1.6]} m={brickBack} cast={false} />
        {ext > 0 && [-1, 1].map((s) => <Box key={s} s={[ext, H1, T]} p={[s * (Lv / 2 + ext / 2), H1 / 2, -T / 2]} m={brickE} />)}
        <Box s={[L, H2 - H1, T]} p={[0, (H1 + H2) / 2, -T / 2]} m={brickA} />
        <Box s={[L, H3 - H2, T]} p={[0, (H2 + H3) / 2, -T / 2]} m={brickB} />
        {/* beams and bands in carved timber */}
        <Box s={[Lv + 0.1, 0.2, 0.36]} p={[0, H1 - 0.09, -0.12]} m={wood} />
        <Box s={[L, 0.14, 0.34]} p={[0, H2, 0.1]} m={wood} />
        <Box s={[L + 0.1, 0.22, 0.5]} p={[0, H3 - 0.05, 0.12]} m={wood} />
        <Box s={[L, 0.07, 0.4]} p={[0, H2 + 0.12, 0.08]} m={wood2} cast={false} />
        <Inst items={it.cols} m={wood} />
        <Inst items={it.bases} m={stoneM} />
        <Inst items={it.caps} m={wood2} />
        <Inst items={it.brk} m={wood2} />
        <Inst items={it.rings} m={wood} geo={archRingGeo} />
        <Inst items={it.opens} m={night} geo={archOpenGeo} />
        {c.cusp.map((i) => (
          <group key={i}>
            <Box s={[bp - 0.05, 1.5, 0.06]} p={[bx(i), PL + 0.75, -1.46]} m={night} cast={false} />
            <Box s={[bp - 0.12, 1.6, 0.04]} p={[bx(i), PL + 0.8, -0.3]} m={night} cast={false} />
            <group position={[bx(i), PL + 0.8, 0.1]} scale={[(bp - 0.1) / 1.3 * 1.0, 1.1, 1]}>
              <mesh geometry={cuspGeo} material={cuspW} castShadow />
              <mesh geometry={cuspGeo} material={cuspL} position={[0, 0, 0.06]} scale={[0.93, 0.93, 0.35]} castShadow />
              <Ball rad={0.08} p={[0, 1.38, 0.04]} sc={[1, 1.8, 1]} m={cuspW} />
              <Ball rad={0.05} p={[0, 1.62, 0.04]} sc={[1, 1.6, 1]} m={cuspW} />
            </group>
          </group>
        ))}
        {c.cusp.length > 0 && [Math.min(...c.cusp), ...c.cusp.map((i) => i + 1)].map((i) => (
          <group key={`pl${i}`} position={[-Lv / 2 + bp * i, PL, 0.12]}>
            <Cyl rt={0.075} rb={0.1} h={0.62} p={[0, 0.4, 0]} m={cuspW} seg={8} />
            <Cyl rt={0.06} rb={0.075} h={0.62} p={[0, 1.0, 0]} m={cuspL} seg={8} />
            <Ball rad={0.1} p={[0, 0.72, 0]} sc={[1, 0.6, 1]} m={wood2} />
            <Box s={[0.26, 0.08, 0.26]} p={[0, 1.36, 0]} m={wood2} />
            <Box s={[0.26, 0.08, 0.26]} p={[0, 0.04, 0]} m={wood2} />
          </group>
        ))}
        {/* brick storey windows */}
        <Inst items={it.frames} m={wood} />
        <Inst items={it.wopen} m={night} />
        <Inst items={it.slats} m={slatM} />
        <Inst items={it.sills} m={wood2} />
        <Inst items={it.hoods} m={roofM} />
        <Inst items={it.tymp} m={wood} geo={halfDiscGeo} />
        <Inst items={it.tymp2} m={night} geo={halfDiscGeo} />
        {k === 'near' && <Box s={[1.5, 1.7, 0.1]} p={[bx(3), PL + 0.85, -1.45]} m={night} />}
        {/* lattice gallery of the top floor */}
        <Box s={[Lv - 0.1, 0.78, 0.05]} p={[0, 3.6, 0.045]} m={latMat(Lv)} cast={false} />
        <Box s={[Lv + 0.1, 0.08, 0.14]} p={[0, 3.18, 0.07]} m={wood} />
        <Box s={[Lv + 0.1, 0.08, 0.14]} p={[0, 4.02, 0.07]} m={wood} />
        <Inst items={it.posts} m={wood} />
        <Inst items={it.dent1} m={wood2} />
        <Inst items={it.dent2} m={wood2} />
        <Inst items={it.struts} m={wood} />
        <Inst items={it.outer} m={wood} />
        <RoofRun L={roofL} y={H3 + 0.02} zr={-1.0} zf={0.7} zb={-T - 0.5} rise={0.65 + hi} m={roofM} br={brickG} />
      </group>
    );
  }
  /* the cut-away stand-in for a near wing: just its plinth, so the court stays open to the camera */
  function WingStub({ k }) {
    const M = useM();
    const { Lv, L } = CFG[k];
    const stoneM = M.plain('#625d53', { roughness: 0.95 });
    const stone2 = M.plain('#585449', { roughness: 0.95 });
    const wood = M.plain('#4a3426', { roughness: 0.85 });
    const roofM = M.mat('roof', L / 2.4, 1, { color: '#5a3a2c' });
    const brickM = M.mat('brick', L / 2.2, 1.0 / 1.1, { color: BRICK, emissive: '#8a4a38', emissiveIntensity: 0.4 });
    return (
      <group>
        <Box s={[Lv, 0.24, 1.8]} p={[0, 0.12, -0.9]} m={stoneM} />
        <Box s={[Lv, 0.14, 0.45]} p={[0, 0.07, 0.225]} m={stoneM} cast={false} />
        <Box s={[Lv, 0.07, 0.8]} p={[0, 0.035, 0.4]} m={stone2} cast={false} />
        <Box s={[L, 0.4, T - 1.5]} p={[0, 0.2, -1.5 - (T - 1.5) / 2]} m={brickM} />
        <Box s={[L, 0.06, T - 1.4]} p={[0, 0.43, -1.5 - (T - 1.5) / 2]} m={wood} cast={false} />
      </group>
    );
  }

  /* ---------------- sculpture ---------------- */
  function StoneLion({ m }) {
    return (
      <group>
        <Box s={[0.36, 0.1, 0.52]} p={[0, 0.05, 0]} m={m} />
        <Box s={[0.24, 0.22, 0.3]} p={[0, 0.21, -0.1]} m={m} />
        <Cyl rt={0.075} rb={0.1} h={0.32} p={[0, 0.3, 0.1]} r={[0.25, 0, 0]} m={m} seg={8} />
        <Cyl rt={0.155} rb={0.15} h={0.06} p={[0, 0.46, 0.1]} r={[Math.PI / 2, 0, 0]} m={m} seg={14} />
        <Cyl rt={0.12} rb={0.13} h={0.05} p={[0, 0.46, 0.06]} r={[Math.PI / 2, 0, 0]} m={m} seg={14} />
        <Ball rad={0.075} p={[0, 0.44, 0.2]} m={m} />
        <Box s={[0.1, 0.045, 0.07]} p={[0, 0.4, 0.27]} m={m} />
        {[-0.1, 0.1].map((x) => <Box key={x} s={[0.05, 0.07, 0.03]} p={[x, 0.6, 0.12]} m={m} />)}
        {[-0.08, 0.08].map((x) => <Cyl key={x} rt={0.03} rb={0.035} h={0.2} p={[x, 0.13, 0.19]} m={m} seg={8} />)}
        <Ball rad={0.06} p={[0, 0.2, -0.27]} sc={[1, 1.2, 1]} m={m} />
      </group>
    );
  }
  function Guardian({ m }) {
    return (
      <group>
        <Box s={[0.22, 0.06, 0.18]} p={[0, 0.03, 0]} m={m} />
        <Box s={[0.14, 0.3, 0.09]} p={[0, 0.21, 0]} m={m} />
        <Ball rad={0.065} p={[0, 0.42, 0.01]} m={m} />
        <Box s={[0.28, 0.07, 0.07]} p={[0, 0.33, 0]} m={m} />
        <Box s={[0.24, 0.5, 0.04]} p={[0, 0.3, -0.07]} m={m} />
        <Ball rad={0.13} p={[0, 0.53, -0.07]} sc={[1, 0.9, 0.3]} m={m} />
      </group>
    );
  }

  /* ---------------- the bath ---------------- */
  function Bath() {
    const M = useM();
    const T3 = mt();
    const stone = M.plain('#6f6a5f', { roughness: 0.95 });
    const stoneL = M.plain('#9a9384', { roughness: 0.95 });
    const stoneD = M.plain('#5a564c', { roughness: 0.95 });
    const gold = M.gold;

    const geo = useMemo(() => {
      const wallPts = arc(TH0, TWO - TH0, 0.985, 200);
      const pos = []; const uv = []; const idx = []; const cum = [0]; let acc = 0;
      for (let i = 1; i < wallPts.length; i += 1) { acc += Math.hypot(wallPts[i][0] - wallPts[i - 1][0], wallPts[i][1] - wallPts[i - 1][1]); cum.push(acc); }
      wallPts.forEach(([x, z], i) => { pos.push(x, 0, z, x, -D, z); uv.push(cum[i] / acc, 1, cum[i] / acc, 0); });
      for (let i = 0; i < wallPts.length - 1; i += 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const wall = new THREE.BufferGeometry();
      wall.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      wall.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      wall.setIndex(idx); wall.computeVertexNormals();

      const fs = new THREE.Shape(); PIT.forEach(([x, z], i) => (i ? fs.lineTo(x, -z) : fs.moveTo(x, -z))); fs.closePath();
      const floor = new THREE.ShapeGeometry(fs); floor.rotateX(-Math.PI / 2);

      const thc = Math.asin((SW + 0.25) / (BA * 1.13));
      const o = arc(thc, TWO - thc, 1.13, 160); const n = arc(thc, TWO - thc, 1.0, 160);
      const cs = new THREE.Shape();
      o.forEach(([x, z], i) => (i ? cs.lineTo(x, -z) : cs.moveTo(x, -z)));
      for (let i = n.length - 1; i >= 0; i -= 1) cs.lineTo(n[i][0], -n[i][1]);
      cs.closePath();
      const coping = new THREE.ExtrudeGeometry(cs, { depth: 0.1, bevelEnabled: false }); coping.rotateX(-Math.PI / 2);

      /* two serpents: heads at the stair, tails meet at the back */
      const mkSerp = (sgn) => {
        const pts = [];
        const a0 = 0.8; const a1 = Math.PI - 0.05; const N = 70;
        for (let i = 0; i <= N; i += 1) {
          const th = a0 + ((a1 - a0) * i) / N;
          const [x, z] = oval(th, 1.215);
          const y = 0.1 + 0.006 * Math.sin(th * 30);
          pts.push(new THREE.Vector3(sgn * x, y, z));
        }
        const h = pts[0];
        pts.unshift(new THREE.Vector3(h.x - sgn * 0.02, 0.22, h.z + 0.1), new THREE.Vector3(h.x - sgn * 0.03, 0.32, h.z + 0.16));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.15, 8, false);
      };

      /* ring of statues */
      const st = { base: [], body: [], head: [], stele: [], top: [], hood: [] };
      let cnt = 0;
      for (let k = 0; k < 30; k += 1) {
        const th = (k * TWO) / 30;
        const [x, z] = oval(th, 1.065);
        if (Math.abs(x) < 0.95 && z > 0) continue;
        const nx = x / (BA * BA); const nz = z / (BB * BB);
        const ry = Math.atan2(nx, nz);
        const sx = Math.sin(ry); const cz = Math.cos(ry);
        const naga = cnt % 3 === 1; cnt += 1;
        st.base.push([x, 0.1 + 0.03, z, 0.15, 0.06, 0.13, ry]);
        st.stele.push([x - sx * 0.055, 0.1 + 0.06 + 0.125, z - cz * 0.055, 0.19, 0.25, 0.03, ry]);
        st.top.push([x - sx * 0.055, 0.1 + 0.06 + 0.25, z - cz * 0.055, 0.095, 0.095, 0.03, ry]);
        if (naga) {
          st.hood.push([x, 0.1 + 0.06 + 0.115, z, 0.08, 0.21, 0.08, ry]);
          st.head.push([x, 0.1 + 0.06 + 0.25, z, 0.085, 0.06, 0.06, ry]);
        } else {
          st.body.push([x, 0.1 + 0.06 + 0.095, z, 0.12, 0.19, 0.09, ry]);
          st.head.push([x, 0.1 + 0.06 + 0.23, z, 0.06, 0.06, 0.06, ry]);
        }
      }
      return { wall, floor, coping, serpR: mkSerp(1), serpL: mkSerp(-1), st };
    }, []);

    const steps = Array.from({ length: 9 }, (_, i) => {
      const hgt = D * (1 - (i + 1) / 10);
      return { y: -D + hgt / 2, h: hgt, z: ZF - (i + 0.5) * 0.15 };
    });
    const sp = -BB * 0.985;

    return (
      <group>
        <mesh geometry={geo.wall} material={T3.niches} receiveShadow />
        <mesh geometry={geo.floor} position={[0, -D, 0]} material={T3.pave2} receiveShadow />
        <mesh geometry={geo.coping} material={stone} castShadow receiveShadow />
        {steps.map((s, i) => <Box key={i} s={[SW * 2, s.h, 0.15]} p={[0, s.y, s.z]} m={stoneL} />)}
        {/* stair flanks */}
        {[-1, 1].map((sg) => (
          <group key={sg}>
            <Box s={[0.2, D + 0.22, 1.43]} p={[sg * (SW + 0.1), (0.22 - D) / 2, ZF - 0.715]} m={stone} />
            <Box s={[0.26, 0.05, 1.5]} p={[sg * (SW + 0.1), 0.245, ZF - 0.74]} m={stoneD} cast={false} />
            <group position={[sg * (SW + 0.1), 0.27, ZF - 0.17]} scale={1.6}><StoneLion m={stone} /></group>
            <group position={[sg * (SW + 0.1), 0.27, ZF - 1.05]} rotation={[0, sg * -0.25, 0]} scale={1.5}><Guardian m={stone} /></group>
            <Diyo p={[sg * (SW + 0.1), 0.27, ZF - 1.4]} />
          </group>
        ))}
        <Diyo p={[0, 0.1, -BB * 1.13 - 0.1]} light />
        <Diyo p={[SW + 0.1, 0.27, ZF - 0.02]} light />
        {/* ring of statues, serpents */}
        <Inst items={geo.st.base} m={stoneD} />
        <Inst items={geo.st.stele} m={stone} />
        <Inst items={geo.st.top} m={stone} geo={halfDiscGeo} />
        <Inst items={geo.st.body} m={stoneL} />
        <Inst items={geo.st.hood} m={stoneL} geo={sphereGeo} />
        <Inst items={geo.st.head} m={stoneL} geo={sphereGeo} />
        <mesh geometry={geo.serpR} material={stoneD} castShadow receiveShadow />
        <mesh geometry={geo.serpL} material={stoneD} castShadow receiveShadow />
        {[-1, 1].map((sg) => {
          const h = oval(0.8, 1.215);
          return (
            <group key={sg} position={[sg * (h[0] - 0.02), 0.34, h[1] + 0.2]} rotation={[0, sg * 0.3, 0]}>
              <Ball rad={0.07} sc={[1.2, 0.8, 1.2]} m={stoneD} />
              <Ball rad={0.035} p={[0, -0.02, 0.07]} m={stoneD} />
            </group>
          );
        })}
        {/* spout wall: gilt spout, tiny pool */}
        <Box s={[0.95, D - 0.08, 0.12]} p={[0, -D / 2 - 0.04, sp + 0.07]} m={stoneL} />
        <Box s={[0.82, 0.05, 0.1]} p={[0, -0.1, sp + 0.1]} m={stoneD} />
        <Box s={[0.36, 0.44, 0.03]} p={[0, -0.36, sp + 0.145]} m={gold} />
        <Cyl rt={0.03} rb={0.038} h={0.24} p={[0, -0.47, sp + 0.27]} r={[Math.PI / 2, 0, 0]} m={gold} seg={8} />
        <Ball rad={0.055} p={[0, -0.2, sp + 0.17]} m={gold} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -D + 0.03, sp + 0.55]} receiveShadow>
          <planeGeometry args={[0.9, 0.62]} /><meshStandardMaterial color="#2d5a46" roughness={0.08} metalness={0.3} />
        </mesh>
        {/* miniature Krishna Mandir on the axis, beyond the rim: 3 square tiers and a pointed shikhara */}
        <group position={[0, 0, -BB * 1.13 - 0.42]}>
          <Box s={[0.6, 0.1, 0.6]} p={[0, 0.05, 0]} m={stoneD} />
          <Box s={[0.5, 0.08, 0.5]} p={[0, 0.14, 0]} m={stone} />
          {[0, 1, 2].map((t) => {
            const w = 0.4 - t * 0.075; const y0 = 0.18 + t * 0.31;
            return (
              <group key={t}>
                <Box s={[w, 0.24, w]} p={[0, y0 + 0.12, 0]} m={stone} />
                <Box s={[w + 0.14, 0.05, w + 0.14]} p={[0, y0 + 0.265, 0]} m={stoneD} />
                {[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz], q) => <Box key={q} s={[dx ? 0.02 : 0.1, 0.14, dz ? 0.02 : 0.1]} p={[dx * (w / 2 + 0.005), y0 + 0.12, dz * (w / 2 + 0.005)]} m={M.dark} cast={false} />)}
                {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dz], q) => <mesh key={q} position={[dx * (w / 2 + 0.05), y0 + 0.3, dz * (w / 2 + 0.05)]} material={stoneL} castShadow><coneGeometry args={[0.03, 0.1, 6]} /></mesh>)}
              </group>
            );
          })}
          <Box s={[0.2, 0.2, 0.2]} p={[0, 1.2, 0]} m={stone} />
          <mesh position={[0, 1.46, 0]} castShadow material={stone}><coneGeometry args={[0.15, 0.4, 8]} /></mesh>
          <Cyl rt={0.02} rb={0.03} h={0.14} p={[0, 1.72, 0]} m={gold} seg={6} />
        </group>
      </group>
    );
  }

  /* ---------------- ritual poles and meditation slab ---------------- */
  function Pole({ p, h = 3.6 }) {
    const M = useM();
    const wood = M.plain('#5a4636', { roughness: 0.85 });
    const wood2 = M.plain('#6e5644', { roughness: 0.85 });
    return (
      <group position={p}>
        <Box s={[0.3, 0.14, 0.3]} p={[0, 0.07, 0]} m={M.plain('#7d7668')} />
        <Cyl rt={0.06} rb={0.075} h={h} p={[0, h / 2 + 0.14, 0]} m={wood} seg={10} />
        <Cyl rt={0.12} rb={0.07} h={0.2} p={[0, h + 0.2, 0]} m={wood2} seg={10} />
        <Cyl rt={0.14} rb={0.12} h={0.07} p={[0, h + 0.33, 0]} m={wood2} seg={10} />
        <Box s={[0.22, 0.1, 0.22]} p={[0, h + 0.4, 0]} m={wood} />
        <Ball rad={0.11} p={[0, h + 0.5, 0]} sc={[1, 0.85, 1]} m={M.plain('#6b7a4a', { roughness: 0.85 })} />
      </group>
    );
  }

  /* ---------------- Main ---------------- */
  function Main() {
    const M = useM();
    const T3 = mt();
    const mark = useRef(); const gN = useRef(); const gR = useRef(); const gF = useRef(); const gL = useRef();
    const sN = useRef(); const sR = useRef(); const sF = useRef(); const sL = useRef();
    useEffect(() => {
      const v = new THREE.Vector3();
      const set = (full, stub, hide) => {
        if (full.current && stub.current && full.current.visible === hide) { full.current.visible = !hide; stub.current.visible = hide; }
      };
      mark.current.onBeforeRender = (r, s, cam) => {
        if (!cam.isPerspectiveCamera) return;
        cam.getWorldPosition(v); mark.current.worldToLocal(v);
        set(gN, sN, v.z > Z + 0.3); set(gF, sF, v.z < -(Z + 0.3));
        set(gR, sR, v.x > X + 0.3); set(gL, sL, v.x < -(X + 0.3));
      };
    }, []);
    const pave = useMemo(() => {
      const hw = X + T; const hd = Z + T;
      const s = new THREE.Shape();
      s.moveTo(-hw, -hd); s.lineTo(hw, -hd); s.lineTo(hw, hd); s.lineTo(-hw, hd); s.closePath();
      const h = new THREE.Path(); PIT.forEach(([x, z], i) => (i ? h.lineTo(x * BS, -z * BS) : h.moveTo(x * BS, -z * BS))); h.closePath();
      s.holes.push(h);
      const g = new THREE.ExtrudeGeometry(s, { depth: D * BS + 0.05, bevelEnabled: false });
      g.rotateX(-Math.PI / 2); g.translate(0, -(D * BS + 0.05), 0); return g;
    }, []);
    const stoneSlab = M.plain('#4b473f', { roughness: 0.95 });

    const wingAt = {
      far: { p: [0, 0, -Z], r: 0, g: gF, s: sF, vis: true },
      left: { p: [-X, 0, 0], r: Math.PI / 2, g: gL, s: sL, vis: true },
      right: { p: [X, 0, 0], r: -Math.PI / 2, g: gR, s: sR, vis: false },
      near: { p: [0, 0, Z], r: Math.PI, g: gN, s: sN, vis: false },
    };
    return (
      <group>
        <Frame s={[8.4, 4.6, 7.4]} p={[0, 2.1, -0.2]} />
        <mesh ref={mark} frustumCulled={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
        <mesh geometry={pave} material={[T3.paving, T3.pitSide]} receiveShadow />
        <group scale={BS}><Bath /></group>
        {Object.entries(wingAt).map(([k, w]) => (
          <group key={k} position={w.p} rotation={[0, w.r, 0]}>
            <group ref={w.g} visible={w.vis}><Wing k={k} /></group>
            <group ref={w.s} visible={!w.vis}><WingStub k={k} /></group>
          </group>
        ))}
        {[-3.0, -1.5, 0, 1.5, 3.0].map((x) => <Diyo key={x} p={[x, 0.14, -Z + 0.62]} />)}
        <Diyo p={[-2.6, 0.14, 2.75]} light />
        <Diyo p={[-3.45, 0.14, 1.75]} />
        <Pole p={[-2.8, 0, 3.0]} />
        <Pole p={[-3.6, 0, 2.0]} />
        <Box s={[1.4, 0.22, 0.7]} p={[-3.0, 0.11, 3.2]} r={[0, 0.12, 0]} m={stoneSlab} />
        <Box s={[1.15, 0.05, 0.5]} p={[-3.0, 0.245, 3.2]} r={[0, 0.12, 0]} m={M.plain('#5a554b')} cast={false} />
      </group>
    );
  }

  /* ---------------- surroundings ---------------- */
  function Block({ p, sx, sz, h = 4.4 }) {
    const M = useM();
    const wood = M.plain('#3d2a1d', { roughness: 0.85 });
    const night = M.plain('#100906');
    const brickM = M.mat('brick', Math.max(sx, sz) / 2.4, h / 1.2, { color: BRICK, emissive: '#8a4a38', emissiveIntensity: 0.4 });
    const roofM = M.mat('roof', Math.max(sx, sz) / 2.4, 2, { color: '#5a3a2c' });
    const items = useMemo(() => {
      const A = { fr: [], op: [], ba: [] };
      const face = (len, off, ry, cx, cz) => {
        for (let x = -len / 2 + 1; x < len / 2 - 0.5; x += 1.9) {
          [1.2, 2.55, 3.6].forEach((y, s) => {
            const sn = Math.sin(ry); const cs = Math.cos(ry);
            const px = cx + x * cs + off * sn; const pz = cz - x * sn + off * cs;
            A.fr.push([px, y, pz, 0.72, s === 2 ? 0.8 : 0.82, 0.08, ry]);
            A.op.push([px + sn * 0.03, y, pz + cs * 0.03, 0.5, s === 2 ? 0.6 : 0.6, 0.06, ry]);
          });
        }
      };
      face(sx, sz / 2 + 0.02, 0, 0, 0); face(sx, -sz / 2 - 0.02, Math.PI, 0, 0);
      face(sz, sx / 2 + 0.02, Math.PI / 2, 0, 0); face(sz, -sx / 2 - 0.02, -Math.PI / 2, 0, 0);
      [2.0, 3.1].forEach((y) => A.ba.push([0, y, 0, sx + 0.1, 0.12, sz + 0.1]));
      return A;
    }, [sx, sz]);
    const along = sx >= sz;
    return (
      <group position={p}>
        <Box s={[sx, h, sz]} p={[0, h / 2, 0]} m={brickM} />
        <Inst items={items.ba} m={wood} />
        <Inst items={items.fr} m={wood} />
        <Inst items={items.op} m={night} />
        <group rotation={[0, along ? 0 : Math.PI / 2, 0]}>
          <RoofRun L={(along ? sx : sz) + 0.6} y={h} zr={0} zf={(along ? sz : sx) / 2 + 0.5} zb={-(along ? sz : sx) / 2 - 0.5} rise={0.85} m={roofM} br={brickM} ends={false} />
        </group>
      </group>
    );
  }

  function KrishnaFar({ p }) {
    const M = useM();
    const st = M.plain('#cfc6b4', { emissive: '#4a4338', emissiveIntensity: 0.7 });
    const std = M.plain('#b3ab9a', { emissive: '#3a352c', emissiveIntensity: 0.6 });
    const pin = (x, y, z, s = 1) => (
      <group key={`${x}${y}${z}`} position={[x, y, z]} scale={s}>
        <Cyl rt={0.14} rb={0.2} h={0.4} p={[0, 0.2, 0]} m={st} seg={8} />
        <mesh position={[0, 0.6, 0]}><coneGeometry args={[0.13, 0.4, 8]} /><meshStandardMaterial color="#cfc6b4" emissive="#4a4338" emissiveIntensity={0.7} /></mesh>
      </group>
    );
    return (
      <group position={p} rotation={[0, Math.PI, 0]}>
        {[0, 1, 2].map((i) => <Box key={i} s={[6 - i * 0.4, 0.22, 4.4 - i * 0.4]} p={[0, 0.11 + i * 0.22, 0]} m={std} />)}
        <Box s={[5.0, 1.3, 3.5]} p={[0, 0.66 + 1.0, 0]} m={st} />
        <Box s={[5.4, 0.18, 3.9]} p={[0, 0.66 + 1.74, 0]} m={std} />
        <Box s={[3.8, 1.2, 2.6]} p={[0, 2.4 + 0.7, 0]} m={st} />
        <Box s={[4.2, 0.16, 3.0]} p={[0, 3.2 + 0.7, 0]} m={std} />
        <Box s={[2.4, 1.1, 1.8]} p={[0, 3.9 + 0.55, 0]} m={st} />
        {[-2, -0.7, 0.7, 2].map((x) => pin(x, 2.55 + 0.1, 1.5, 1.3))}
        {[-2, -0.7, 0.7, 2].map((x) => pin(x, 2.55 + 0.1, -1.5, 1.3))}
        {[-1.4, 0, 1.4].map((x) => pin(x, 3.95 + 0.1, 1.1, 1.1))}
        {[-1.4, 0, 1.4].map((x) => pin(x, 3.95 + 0.1, -1.1, 1.1))}
        {[-0.7, 0.7].map((x) => pin(x, 4.55, 0.7, 1))}
        <Cyl rt={0.5} rb={0.95} h={1.8} p={[0, 5.5 + 0.2, 0]} m={st} seg={10} />
        <mesh position={[0, 6.9 + 0.1, 0]}><coneGeometry args={[0.55, 1.6, 10]} /><meshStandardMaterial color="#cfc6b4" emissive="#4a4338" emissiveIntensity={0.7} /></mesh>
        <Ball rad={0.16} p={[0, 7.8, 0]} m={M.gold} />
      </group>
    );
  }
  function BhimsenFar({ p }) {
    const M = useM();
    const wh = M.plain('#efe6d6');
    const roof = M.mat('roof', 3, 3, { color: '#5a3a2c' });
    return (
      <group position={p} rotation={[0, Math.PI, 0]}>
        <Box s={[3.4, 0.3, 3.0]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[2.4, 1.6, 2.2]} p={[0, 1.1, 0]} m={wh} />
        <Box s={[0.9, 0.7, 0.05]} p={[0, 1.5, 1.13]} m={M.gold} />
        <Box s={[3.3, 0.16, 3.1]} p={[0, 1.95, 0]} m={roof} />
        <Box s={[2.0, 1.3, 1.8]} p={[0, 2.7, 0]} m={wh} />
        <Box s={[2.9, 0.16, 2.7]} p={[0, 3.4, 0]} m={roof} />
        <Box s={[1.5, 0.12, 1.5]} p={[0, 3.55, 0]} m={roof} />
        <mesh position={[0, 4.1, 0]}><coneGeometry args={[0.1, 0.9, 8]} /><meshStandardMaterial color="#f1c24a" metalness={0.5} roughness={0.35} /></mesh>
      </group>
    );
  }

  function Env() {
    const M = useM();
    const T3 = mt();
    const ground = useMemo(() => {
      const mkRing = (R) => {
        const s = new THREE.Shape(); s.absarc(0, 0, R, 0, TWO, false);
        const hw = X + T; const hd = Z + T;
        const h = new THREE.Path(); h.moveTo(-hw, -hd); h.lineTo(-hw, hd); h.lineTo(hw, hd); h.lineTo(hw, -hd); h.closePath();
        s.holes.push(h);
        const g = new THREE.ShapeGeometry(s, 48); g.rotateX(-Math.PI / 2); return g;
      };
      return { near: mkRing(62), far: mkRing(160) };
    }, []);
    const brickGround = M.mat('herring', 0.28, 0.28, { color: '#c4afa2' });
    const farGround = M.plain('#9aa27a', { roughness: 1 });
    void T3;
    const mk = useRef(); const gN = useRef(); const gS = useRef(); const gE = useRef();
    useEffect(() => {
      const v = new THREE.Vector3();
      mk.current.onBeforeRender = (r, sc, cam) => {
        if (!cam.isPerspectiveCamera) return;
        cam.getWorldPosition(v); mk.current.worldToLocal(v);
        if (gN.current) gN.current.visible = !(v.x < -10);
        if (gS.current) gS.current.visible = !(v.x > 10);
        if (gE.current) gE.current.visible = !(v.z < -10);
      };
    }, []);
    const houses = [];
    const hS = []; const hE = [];
    for (let i = 0; i < 7; i += 1) hS.push({ p: [11.6 + (i % 2) * 0.5, 0, -10.5 + i * 3.5], w: 2.9, d: 3.0, h: 4.0 + (i % 3) * 0.3 });
    for (let i = 0; i < 5; i += 1) hS.push({ p: [17 + (i % 2) * 0.6, 0, -8 + i * 4.4], w: 3.2, d: 3.4, h: 4.2 });
    for (let i = 0; i < 6; i += 1) hE.push({ p: [-11 + i * 3.8, 0, -12.8 - (i % 2) * 0.6], w: 3.2, d: 2.9, h: 4.0 + (i % 2) * 0.4 });
    return (
      <group>
        <mesh geometry={ground.near} position={[0, -0.02, 0]} material={brickGround} receiveShadow />
        <mesh geometry={ground.far} position={[0, -0.07, 0]} material={farGround} receiveShadow />
        {/* Mul Chowk and the rest of the palace, to the north (left) */}
        <mesh ref={mk} frustumCulled={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
        <group ref={gN}><Block p={[-19.2, 0, -1.5]} sx={22} sz={20} h={4.6} /></group>
        {/* Durbar Square temples across the square, NW of the entrance; they face the palace */}
        <KrishnaFar p={[-17, 0, 31]} />
        <BhimsenFar p={[-27, 0, 25]} />
        {/* lanes of brick Newar houses south and east of the palace */}
        <group ref={gS}>{hS.map((h, i) => <Block key={i} p={h.p} sx={h.w} sz={h.d} h={h.h} />)}</group>
        <group ref={gE}>{hE.map((h, i) => <Block key={i} p={h.p} sx={h.w} sz={h.d} h={h.h} />)}</group>
        {[[24, 0, 8], [26, 0, -4], [-8, 0, -22], [8, 0, -24], [30, 0, -14]].map((p, i) => <Tree key={i} p={p} s={1.6} kind="broad" />)}
      </group>
    );
  }

  return { 'sundari-chowk-tusha-hiti': { Main, Env } };
}
