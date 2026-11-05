// Janaki Mandir, Janakpur (1910): a long, low, symmetrical three-storey white marble PALACE (not a tower).
// ~42 wide: two long 16-bay arcaded wings with painted polychrome trim, a broad projecting central pavilion (blue-tiled pointed
// portal, arcaded rust-pink balcony of three arches, a five-arch upper layer and three pale-green domes of near-equal size plus
// four mid domes), and two chunky four-stage end towers (maroon balconies carrying four domed chhatris each, orange arched
// windows, teal dome + gold finial). White walls, wide maroon/teal cornice bands, scalloped parapet with turrets every ~2 units.
// Low two-step platform in a paved courtyard with arcaded walls; thatched pavilion + red flag; Ram Mandir compound, Vivah Mandap
// and a ghat pond far off. 1 unit is about 1.3 m. Front = +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, THREE, useMemo, useRef, useEffect, useState } = K;
  const PI = Math.PI;

  /* ---------- dusk detection (scene background is dark at dusk); flips shared emissive levels, never rebuilds materials ---------- */
  const MT = {};
  function mats() {
    if (MT.wall) return MT;
    const s = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
    const e = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, emissive: c, emissiveIntensity: 0.1, toneMapped: false, ...o });
    Object.assign(MT, {
      wall: s('#f7f5ef', { roughness: 0.76 }), cream: s('#efe6d2'), white: s('#ffffff', { roughness: 0.7 }),
      rec: s('#a7aeb0', { roughness: 1 }), recM: s('#7d4636', { roughness: 1 }), rust: s('#c9806e', { roughness: 0.9 }),
      teal: s('#3fa79c'), blue: s('#2d74b3'), band: s('#46b3a6'), maroon: s('#8a3f2e', { roughness: 0.7 }), cap: s('#dcd8cc'),
      pink: s('#e58fa8'), yellow: s('#f0c24a'), pblue: s('#9db8cc', { roughness: 0.9 }),
      gold: s('#d6a63a', { metalness: 0.7, roughness: 0.35 }),
      orange: e('#e9a838'),
      domeC: s('#9fd8bd', { roughness: 0.45, emissive: '#7fd0a8', emissiveIntensity: 0 }),
      domeT: s('#37a695', { roughness: 0.45, emissive: '#37a695', emissiveIntensity: 0 }),
      domeM: s('#dcefe2', { roughness: 0.45, emissive: '#bff0d4', emissiveIntensity: 0 }),
      domeI: s('#ffffff', { roughness: 0.45, emissive: '#9be0c0', emissiveIntensity: 0 }),
      bulb: ['#3dff7a', '#ff3fb3', '#4aa8ff', '#ffb347'].map((c) => e(c)),
      ring: ['#46ff86', '#ff4dc0'].map((c) => e(c, { emissiveIntensity: 0 })),
    });
    return MT;
  }
  function applyDusk(d) {
    const M = mats();
    M.orange.emissiveIntensity = d ? 1.7 : 0.1;
    M.domeC.emissiveIntensity = d ? 0.45 : 0; M.domeT.emissiveIntensity = d ? 0.5 : 0; M.domeM.emissiveIntensity = d ? 0.4 : 0; M.domeI.emissiveIntensity = d ? 0.3 : 0;
    M.bulb.forEach((b) => { b.emissiveIntensity = d ? 5 : 0.4; });
    M.ring.forEach((b) => { b.emissiveIntensity = d ? 3 : 0; });
  }
  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      const check = () => {
        try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) { const d = c.r + c.g + c.b < 0.7; setDusk((p) => (p === d ? p : d)); } } catch (e) { /* ignore */ }
      };
      check(); const t = setInterval(check, 700); return () => clearInterval(t);
    }, []);
    useEffect(() => { applyDusk(dusk); }, [dusk]);
    return [dusk, ref];
  }

  /* ---------- shared geometry: cusped (multifoil) pointed arch, unit width/height, extruded unit depth ---------- */
  const G = {};
  const SH = 0.56;
  const archPt = (u) => {
    const bz = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
    return u <= 0.5 ? bz([-0.5, SH], [-0.5, SH + 0.34], [0, 1], u * 2) : bz([0, 1], [0.5, SH + 0.34], [0.5, SH], (u - 0.5) * 2);
  };
  const archGeo = () => {
    if (G.arch) return G.arch;
    const top = []; const N = 48; const L = 6; const amp = 0.045;
    for (let i = 0; i <= N; i += 1) top.push(archPt(i / N));
    const sp = new THREE.Shape();
    sp.moveTo(-0.5, 0); sp.lineTo(-0.5, SH);
    for (let i = 1; i < N; i += 1) {
      const a = top[i - 1]; const b = top[i + 1]; const tx = b[0] - a[0]; const ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1;
      const bump = amp * Math.abs(Math.sin(PI * L * (i / N)));
      sp.lineTo(top[i][0] + (ty / l) * bump, top[i][1] - (tx / l) * bump);
    }
    sp.lineTo(0.5, SH); sp.lineTo(0.5, 0); sp.closePath();
    G.arch = new THREE.ExtrudeGeometry(sp, { depth: 1, bevelEnabled: false });
    return G.arch;
  };
  const domeGeo = () => {
    if (G.dome) return G.dome;
    const pr = [[0, 0], [0.98, 0], [1.08, 0.2], [1.12, 0.45], [1.0, 0.75], [0.7, 1.05], [0.4, 1.28], [0.2, 1.5], [0.11, 1.68], [0.09, 1.78], [0, 1.82]];
    G.dome = new THREE.LatheGeometry(pr.map(([x, y]) => new THREE.Vector2(x, y)), 24);
    return G.dome;
  };

  /* ---------- instancing ---------- */
  function Inst({ geo, mat, items, colors, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      const m = ref.current; if (!m) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]); o.rotation.set(0, it.ry || 0, 0);
        const s = it.s || [1, 1, 1]; o.scale.set(s[0], s[1], s[2]); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
        if (colors) m.setColorAt(i, c.set(colors[(it.c || 0) % colors.length]));
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [items, colors, mat, geo]);
    if (!items.length) return null;
    return <instancedMesh key={`${items.length}-${mat.uuid}`} ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }
  const rect = (cx, cz, w, d, step, fn) => {
    const nx = Math.max(1, Math.round(w / step)); const nz = Math.max(1, Math.round(d / step));
    for (let i = 0; i < nx; i += 1) { const x = cx - w / 2 + (i + 0.5) * (w / nx); fn(x, cz + d / 2, 0); fn(x, cz - d / 2, PI); }
    for (let j = 0; j < nz; j += 1) { const z = cz - d / 2 + (j + 0.5) * (d / nz); fn(cx + w / 2, z, PI / 2); fn(cx - w / 2, z, -PI / 2); }
  };

  /* ---------- layout constants ---------- */
  const CY = 0.05; // arch base on ground storey
  const TW = 18.9; // tower centre x
  const WX0 = 6.0; const WX1 = 16.3; // wing x extent (pavilion is 12 wide, tower 4.4 wide)
  const TZ = 0.6; // tower centre z (towers project a little forward of the wings)
  const FC = ['#e58fa8', '#c8423a', '#3fa79c', '#f0c24a', '#2d74b3']; // painted frame colours: pink, red, teal, yellow, blue
  const DC = ['#9fd8bd', '#f4f4ee', '#37a695']; // chhatri dome colours: pale green, white, teal
  const WH = 6.3; // wing roofline

  /* ---------- all the facade openings, parapets, turrets and bulbs, built once ---------- */
  function buildBuilding() {
    const S = {
      rec: [], pblue: [], recM: [], cream: [], fr: [], blue: [], teal: [], orange: [], rust: [], merl: [], post: [], pin: [],
      cpost: [], cslab: [], cbase: [], cdome: [], fin: [], bulbs: [[], [], [], []],
    };
    let bc = 0;
    const P = (list, x, y, z, w, h, d, ry = 0, c = 0) => list.push({ p: [x, y, z], s: [w, h, d], ry, c });
    const bulb = (x, y, z) => { S.bulbs[bc % 4].push({ p: [x, y, z], s: [1, 1, 1] }); bc += 1; };
    const merl = (x, y, z, ry) => P(S.merl, x, y, z, 0.36, 0.5, 0.1, ry);
    // framed opening: cream (or painted) frame + recess (or orange pane)
    const win = (x, y, z, w, h, ry, pane = S.rec, fc = -1) => {
      const ox = Math.sin(ry); const oz = Math.cos(ry);
      if (fc >= 0) P(S.fr, x, y - 0.04, z, w + 0.18, h + 0.12, 0.04, ry, fc); else P(S.cream, x, y, z, w + 0.14, h + 0.1, 0.04, ry);
      P(pane, x + ox * 0.025, y + h * 0.04, z + oz * 0.025, w, h * 0.92, 0.03, ry);
    };
    // small open chhatri, instanced: 4 posts, maroon slab, pale dome, gold finial
    const chh = (x, y, z, k, ci) => {
      for (const a of [-1, 1]) for (const b of [-1, 1]) P(S.cpost, x + a * 0.36 * k, y + 0.4 * k, z + b * 0.36 * k, 0.09 * k, 0.8 * k, 0.09 * k);
      P(S.cslab, x, y + 0.85 * k, z, 0.95 * k, 0.1 * k, 0.95 * k);
      P(S.cbase, x, y + 0.02 * k, z, 0.95 * k, 0.08 * k, 0.95 * k);
      S.cdome.push({ p: [x, y + 0.9 * k, z], s: [0.42 * k, 0.42 * k, 0.42 * k], c: ci });
      S.fin.push({ p: [x, y + 0.9 * k + 0.9 * k, z], s: [k, k, k] });
    };
    // glowing bulbs tracing an arch outline
    const archBulbs = (cx, y, z, w, h, n) => {
      for (let i = 0; i <= n; i += 1) { const q = archPt(i / n); bulb(cx + q[0] * w, y + q[1] * h, z); }
    };

    // ---------- wings: 10 wider bays each, three storeys; one big arch row per storey ----------
    const NB = 10; const pitch = (WX1 - WX0) / NB;
    for (const f of [1, -1]) {
      const ry = f > 0 ? 0 : PI;
      for (const sg of [-1, 1]) {
        for (let i = 0; i < NB; i += 1) {
          const x = sg * (WX0 + (i + 0.5) * pitch); const zz = 2.2 * f;
          win(x, CY, zz, 0.64, 2.05, ry, S.rec, -1);
          win(x, 2.7, zz, 0.52, 1.05, ry, i % 2 ? S.pblue : S.rec, i % 4 === 0 ? 2 : -1);
          win(x, 4.62, zz, 0.52, 1.05, ry, i % 4 === 2 ? S.orange : (i % 2 ? S.pblue : S.rec), i % 4 === 0 ? 2 : -1);
        }
      }
    }
    // ---------- pavilion front: tiled pointed portal, side arches, arcaded rust-pink three-arch balcony ----------
    P(S.blue, 0, CY, 3.4, 3.7, 4.4, 0.04);
    P(S.cream, 0, CY, 3.43, 3.3, 4.2, 0.04);
    P(S.teal, 0, CY, 3.46, 2.95, 4.0, 0.04);
    P(S.rec, 0, CY, 3.49, 2.55, 3.75, 0.04);
    for (const sg of [-1, 1]) for (const [k, x] of [[0, 3.2], [1, 4.6]]) {
      win(sg * x, CY, 3.4, 0.9, 2.05, 0, S.rec, k ? 2 : -1);
      win(sg * x, 2.5, 3.4, 0.7, 1.5, 0, S.pblue, k ? 2 : -1);
      win(sg * x, 4.0, 3.4, 0.4, 0.3, 0, S.rec, -1);
    }
    for (const x of [-3.4, 0, 3.4]) {
      P(S.cream, x, 4.75, 3.4, 2.4, 2.3, 0.04);
      P(S.rust, x, 4.8, 3.43, 2.1, 2.15, 0.04);
      for (const dx of [-0.72, 0, 0.72]) { // white arcade across the balcony recess
        P(S.cream, x + dx, 5.35, 4.62, 0.62, 1.35, 0.05);
        P(S.rust, x + dx, 5.4, 4.65, 0.46, 1.25, 0.04);
      }
    }
    for (const sg of [-1, 1]) { win(sg * 5.4, 4.8, 3.4, 0.55, 1.7, 0, S.pblue, 2); }
    // five small arches in the layered upper storey beneath the domes
    for (let i = 0; i < 5; i += 1) win(-3.4 + i * 1.7, 8.2, 2.2, 0.7, 1.5, 0, i % 2 ? S.pblue : S.orange, i % 2 ? -1 : 2);
    for (const sg of [-1, 1]) for (const z of [-1.1, 0.4, 1.7]) win(sg * 4.5, 8.2, z, 0.55, 1.5, sg * PI / 2, S.pblue, 2);
    // pavilion side returns beyond the wings' front
    for (const sg of [-1, 1]) {
      const rs = sg * PI / 2; const x = 6.0 * sg;
      win(x, CY, 2.8, 0.7, 2.05, rs); win(x, 2.7, 2.8, 0.55, 1.2, rs, S.pblue, -1);
      win(x, 6.45, 1.0, 0.45, 0.6, rs, S.orange, 1); win(x, 6.45, -1.0, 0.45, 0.6, rs, S.orange, 1); win(x, 6.45, 2.4, 0.45, 0.6, rs, S.orange, 1);
    }
    // pavilion back
    for (const x of [-4.4, -2.2, 0, 2.2, 4.4]) { win(x, 2.7, -3.4, 0.6, 1.5, PI, S.rec, (x + 5) % 5); win(x, 5.2, -3.4, 0.7, 1.7, PI, S.pblue, 2); }

    // ---------- end towers: octagonal, three stages (body, balcony stage, domed crown) ----------
    for (const sg of [-1, 1]) {
      const c = sg * TW;
      for (let k = 0; k < 8; k += 1) {
        const ry = k * PI / 4; const nx = Math.sin(ry); const nz = Math.cos(ry);
        if (-sg * nx > 0.9) continue; // inner face buried in the wing
        const card = k % 2 === 0;
        const a1 = 2.6; const a2 = 1.9;
        win(c + nx * a1, CY, TZ + nz * a1, 0.9, 2.05, ry);
        win(c + nx * a1, 2.7, TZ + nz * a1, 0.62, 1.05, ry, S.pblue, card ? 2 : -1);
        win(c + nx * a1, 4.62, TZ + nz * a1, 0.62, 1.05, ry, card ? S.rec : S.pblue, -1);
        win(c + nx * a2, 6.8, TZ + nz * a2, 0.55, 0.8, ry, S.orange, card ? 1 : 3);
      }
      // four domed chhatris on the first balcony only
      for (const a of [-1, 1]) for (const b of [-1, 1]) chh(c + a * 2.15, 6.45, TZ + b * 2.15, 0.8, (a > 0) + (b > 0) + 0);
    }

    // ---------- scalloped parapets (pointed merlons), turrets every ~2.2 units on the wing roofs ----------
    const wlen = WX1 - WX0; const nt = Math.floor(wlen / 2.2); const tp = wlen / nt;
    for (const sg of [-1, 1]) for (const f of [1, -1]) {
      for (let x = WX0 + 0.2; x < WX1 - 0.1; x += 0.46) merl(sg * x, WH + 0.25, 2.3 * f, f > 0 ? 0 : PI);
      for (let i = 0; i < nt; i += 1) {
        const x = WX0 + (i + 0.5) * tp;
        chh(sg * x, WH, 1.95 * f, 0.85, (i + (f > 0 ? 0 : 1)) % 3);
        P(S.pin, sg * (x + tp / 2), WH + 0.55, 2.3 * f, 0.14, 0.6, 0.14); // turret finial between chhatris
        S.fin.push({ p: [sg * (x + tp / 2), WH + 0.95, 2.3 * f], s: [1.3, 1.3, 1.3] });
      }
    }
    rect(0, 0, 11.8, 6.6, 0.46, (x, z, ry) => merl(x, 7.5, z, ry));
    rect(0, 0, 9.0, 4.4, 0.46, (x, z, ry) => merl(x, 10.0, z, ry));
    // chhatris along the pavilion lower roof front and back, and four mid-size domed turrets are built in Main
    for (const x of [-4.2, -2.6, 2.6, 4.2]) { chh(x, 7.25, 3.0, 0.75, (Math.abs(x) > 3 ? 0 : 1)); chh(x, 7.25, -3.0, 0.75, 2); }
    chh(0, 7.25, 3.0, 0.7, 1);

    // ---------- balcony balusters (pavilion) and tower balcony rails ----------
    for (let x = -4.6; x <= 4.61; x += 0.3) P(S.post, x, 5.1, 4.72, 0.08, 0.5, 0.08);
    for (const sg of [-1, 1]) for (let z = 3.5; z <= 4.7; z += 0.3) P(S.post, sg * 4.65, 5.1, z, 0.08, 0.5, 0.08);
    for (const sg of [-1, 1]) {
      const c = sg * TW; const h = 5.6; const n = Math.round(h / 0.3);
      for (let i = 0; i <= n; i += 1) {
        const t = -h / 2 + 0.1 + (i * (h - 0.2)) / n;
        P(S.post, c + t, 6.65, TZ + h / 2 - 0.1, 0.07, 0.4, 0.07); P(S.post, c + t, 6.65, TZ - h / 2 + 0.1, 0.07, 0.4, 0.07);
        P(S.post, c + h / 2 - 0.1, 6.65, TZ + t, 0.07, 0.4, 0.07); P(S.post, c - h / 2 + 0.1, 6.65, TZ + t, 0.07, 0.4, 0.07);
      }
      for (let i = 0; i < 20; i += 1) { const t = (i / 20) * 2 * PI; P(S.post, c + Math.sin(t) * 2.1, 7.9, TZ + Math.cos(t) * 2.1, 0.07, 0.3, 0.07); }
    }

    // ---------- festival string lights (lit at dusk): cornices, arch outlines, domes ----------
    for (const f of [1, -1]) for (const sg of [-1, 1]) for (let x = WX0 + 0.2; x < WX1; x += 0.55) bulb(sg * x, 6.0, 2.46 * f);
    for (const f of [1, -1]) for (const sg of [-1, 1]) for (let x = WX0 + 0.2; x < WX1; x += 0.55) bulb(sg * x, 4.2, 2.46 * f);
    rect(0, 0, 12.3, 7.1, 0.6, (x, z) => bulb(x, 7.1, z));
    rect(0, 0, 9.4, 4.8, 0.6, (x, z) => bulb(x, 9.6, z));
    archBulbs(0, CY, 3.55, 3.9, 4.55, 26);
    for (const x of [-3.4, 0, 3.4]) archBulbs(x, 4.75, 3.45, 2.5, 2.4, 14);
    for (const sg of [-1, 1]) {
      const c = sg * TW;
      rect(c, TZ, 5.8, 5.8, 0.55, (x, z) => bulb(x, 6.2, z));
      rect(c, TZ, 3.6, 3.6, 0.55, (x, z) => bulb(x, 7.62, z));
    }
    return S;
  }

  /* ---------- dome with ornate square drum (small arches), lotus band, gold finial, bulb ring ---------- */
  function Dome({ p, r = 1, mat, drum = 0.5, M, ring = 0, sq = true, arches = true }) {
    const gold = M.gold; const A = archGeo();
    const y0 = drum + 0.08 * r;
    return (
      <group position={p}>
        {sq ? <Box s={[r * 1.9, drum, r * 1.9]} p={[0, drum / 2, 0]} m={M.wall} /> : <Cyl rt={r * 0.92} rb={r} h={drum} p={[0, drum / 2, 0]} m={M.wall} seg={8} />}
        {sq && arches && [0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, k * PI / 2, 0]}>
            <mesh geometry={A} material={M.cream} position={[0, drum * 0.1, r * 0.95]} scale={[r * 0.8, drum * 0.8, 0.04]} />
            <mesh geometry={A} material={M.pblue} position={[0, drum * 0.14, r * 0.97]} scale={[r * 0.55, drum * 0.68, 0.03]} />
          </group>
        ))}
        <Cyl rt={r * 1.1} rb={r * 1.1} h={0.1 * r} p={[0, drum + 0.04 * r, 0]} m={M.cream} seg={16} />
        <mesh geometry={domeGeo()} material={mat} position={[0, y0, 0]} scale={r} castShadow />
        <Cyl rt={0.03 * r} rb={0.05 * r} h={0.5 * r} p={[0, y0 + 1.95 * r, 0]} m={gold} seg={6} />
        <Ball rad={0.1 * r} p={[0, y0 + 1.85 * r, 0]} m={gold} />
        <mesh position={[0, y0 + 2.28 * r, 0]} material={gold}><coneGeometry args={[0.07 * r, 0.3 * r, 6]} /></mesh>
        {ring > 0 && <mesh position={[0, y0 + 0.05 * r, 0]} rotation={[PI / 2, 0, 0]} material={M.ring[ring - 1]}><torusGeometry args={[1.1 * r, 0.04, 6, 28]} /></mesh>}
        {ring > 0 && <mesh position={[0, drum + 0.1 * r, 0]} rotation={[PI / 2, 0, 0]} material={M.ring[2 - ring]}><torusGeometry args={[1.14 * r, 0.035, 6, 28]} /></mesh>}
      </group>
    );
  }

  /* ---------------- one end tower body: octagonal, white, balcony ring and a domed crown ---------------- */
  function Oct({ a, h, y, m }) {
    const r = a / Math.cos(PI / 8);
    return <mesh position={[0, y, 0]} rotation={[0, PI / 8, 0]} material={m} castShadow receiveShadow><cylinderGeometry args={[r, r, h, 8]} /></mesh>;
  }
  function Tower({ c, M }) {
    return (
      <group position={[c, 0, TZ]}>
        {/* stage 1: wing height, octagonal 5.2 across, thin maroon cornice per storey */}
        <Oct a={2.6} h={6.3} y={3.15} m={M.wall} />
        {[2.475, 4.325].map((y) => <Oct key={y} a={2.72} h={0.12} y={y} m={M.maroon} />)}
        <Oct a={2.72} h={0.1} y={6.2} m={M.teal} />
        {/* balcony 1: cream slab, teal edge */}
        <Box s={[5.8, 0.18, 5.8]} p={[0, 6.39, 0]} m={M.cream} />
        <Box s={[5.9, 0.06, 5.9]} p={[0, 6.27, 0]} m={M.teal} />
        {/* stage 2: octagonal 3.8 across with arched windows */}
        <Oct a={1.9} h={1.2} y={7.1} m={M.wall} />
        <Oct a={2.0} h={0.1} y={7.0 + 0.55} m={M.teal} />
        {/* balcony ring 2 */}
        <Oct a={2.25} h={0.14} y={7.74} m={M.cream} />
        <Oct a={2.3} h={0.05} y={7.65} m={M.teal} />
        {/* crown: drum, teal dome, gold finial */}
        <Dome p={[0, 7.81, 0]} r={1.05} mat={M.domeT} drum={0.4} M={M} ring={1} sq={false} />
      </group>
    );
  }

  /* ---------------- the palace ---------------- */
  function JanakiMain() {
    useM();
    const [dusk, ref] = useDusk();
    const M = mats();
    const S = useMemo(buildBuilding, []);
    const A = archGeo();
    const bulbGeo = useMemo(() => new THREE.SphereGeometry(0.085, 6, 5), []);
    const goldBall = useMemo(() => new THREE.SphereGeometry(0.1, 8, 6), []);
    const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const unitCyl = useMemo(() => new THREE.CylinderGeometry(0.03, 0.045, 0.4, 5), []);
    const finGeo = useMemo(() => new THREE.ConeGeometry(0.05, 0.4, 5), []);
    return (
      <group ref={ref}>
        {/* two-step platform with a low parapet at its edge and a short central stair */}
        <Box s={[47, 0.2, 13.4]} p={[0, 0.1, 0.4]} m={M.cap} />
        <Box s={[44.4, 0.4, 12]} p={[0, 0.2, 0.2]} m={M.wall} />
        <Box s={[16, 0.22, 1.4]} p={[0, 0.11, 7.4]} m={M.cap} />
        <Box s={[15, 0.1, 0.7]} p={[0, 0.25, 6.8]} m={M.cap} />
        {[-1, 1].map((sg) => <Box key={`pp${sg}`} s={[13.5, 0.5, 0.25]} p={[sg * 14.5, 0.65, 6.05]} m={M.cream} />)}
        <group position={[0, 0.4, 0]}>
          {/* wings: white, one thin maroon cornice per storey, thin teal band under the parapet */}
          {[-1, 1].map((sg) => {
            const cx = sg * (WX0 + WX1) / 2; const len = WX1 - WX0;
            return (
              <group key={`w${sg}`}>
                <Box s={[len, 6.0, 4.4]} p={[cx, 3.0, 0]} m={M.wall} />
                {[2.475, 4.325].map((y) => <Box key={y} s={[len + 0.1, 0.12, 4.55]} p={[cx, y, 0]} m={M.maroon} />)}
                <Box s={[len + 0.1, 0.1, 4.6]} p={[cx, 5.85, 0]} m={M.teal} />
                <Box s={[len + 0.2, 0.16, 4.8]} p={[cx, 6.12, 0]} m={M.maroon} />
                <Box s={[len, 0.04, 4.3]} p={[cx, 6.33, 0]} m={M.cap} />
              </group>
            );
          })}

          {/* central pavilion: broad lower block, then a taller layered upper storey carrying the domes */}
          <Box s={[12, 7.2, 6.8]} p={[0, 3.6, 0]} m={M.wall} />
          <Box s={[12.4, 0.16, 7.2]} p={[0, 7.1, 0]} m={M.maroon} />
          <Box s={[12.2, 0.1, 7.1]} p={[0, 6.8, 0]} m={M.teal} />
          <Box s={[12.2, 0.12, 7.0]} p={[0, 4.45, 0]} m={M.maroon} />
          <Box s={[12.0, 0.04, 6.8]} p={[0, 7.27, 0]} m={M.cap} />
          <Box s={[9.0, 2.5, 4.4]} p={[0, 8.5, 0]} m={M.wall} />
          <Box s={[9.4, 0.16, 4.8]} p={[0, 9.78, 0]} m={M.maroon} />
          <Box s={[9.2, 0.1, 4.6]} p={[0, 7.45, 0]} m={M.teal} />
          {/* balcony: projecting slab, white arcade over a rust-pink recess (the one red-brown band) */}
          <Box s={[9.8, 0.24, 1.5]} p={[0, 4.62, 4.05]} m={M.maroon} />
          <Box s={[9.8, 0.1, 0.16]} p={[0, 5.4, 4.8]} m={M.cream} />
          {[-1, 1].map((sg) => <Box key={`bk${sg}`} s={[0.16, 0.1, 1.4]} p={[sg * 4.9, 5.4, 4.1]} m={M.cream} />)}
          {[-3.4, 0, 3.4].map((x) => <Box key={`bc${x}`} s={[0.22, 2.5, 0.22]} p={[x + (x === 0 ? 1.3 : x < 0 ? 1.3 : -1.3), 6.1, 4.65]} m={M.white} />)}
          <Box s={[4.4, 0.24, 0.6]} p={[0, 4.45, 3.65]} m={M.blue} />
          {/* roofline: big bulbous centre dome (r 1.7) on a tall drum, two flanking domes (r 1.25), turrets at the corners */}
          <Dome p={[0, 9.85, 0]} r={1.7} mat={M.domeC} drum={0.9} M={M} ring={1} />
          {[-1, 1].map((sg) => <Dome key={`fd${sg}`} p={[sg * 3.5, 9.85, 0]} r={1.25} mat={M.domeC} drum={0.6} M={M} ring={2} />)}
          {[-1, 1].map((sg) => [1, -1].map((f) => <Dome key={`ct${sg}${f}`} p={[sg * 4.1, 9.85, f * 1.8]} r={0.42} mat={f > 0 ? M.domeM : M.domeT} drum={0.35} M={M} sq={false} />))}
          {[-1, 1].map((sg) => [1, -1].map((f) => <Dome key={`md${sg}${f}`} p={[sg * 5.25, 7.25, f * 2.2]} r={0.65} mat={f > 0 ? M.domeM : M.domeT} drum={0.45} M={M} ring={1} />))}

          {/* end towers */}
          {[-1, 1].map((sg) => <Tower key={`tw${sg}`} c={sg * TW} M={M} />)}

          {/* openings, parapet, turrets, lights */}
          <Inst geo={A} mat={M.cream} items={S.cream} />
          <Inst geo={A} mat={M.white} items={S.fr} colors={FC} />
          <Inst geo={A} mat={M.blue} items={S.blue} />
          <Inst geo={A} mat={M.teal} items={S.teal} />
          <Inst geo={A} mat={M.rec} items={S.rec} />
          <Inst geo={A} mat={M.pblue} items={S.pblue} />
          <Inst geo={A} mat={M.recM} items={S.recM} />
          <Inst geo={A} mat={M.rust} items={S.rust} />
          <Inst geo={A} mat={M.orange} items={S.orange} />
          <Inst geo={A} mat={M.cream} items={S.merl} cast />
          <Inst geo={unitBox} mat={M.cream} items={S.post} />
          <Inst geo={unitBox} mat={M.wall} items={S.pin} />
          <Inst geo={unitBox} mat={M.wall} items={S.cpost} />
          <Inst geo={unitBox} mat={M.cream} items={S.cslab} />
          <Inst geo={unitBox} mat={M.cream} items={S.cbase} />
          <Inst geo={domeGeo()} mat={M.domeI} items={S.cdome} colors={DC} cast />
          <Inst geo={goldBall} mat={M.gold} items={S.fin} />
          {dusk && S.bulbs.map((b, i) => <Inst key={i} geo={bulbGeo} mat={M.bulb[i]} items={b} />)}
        </group>
        <Frame s={[34, 10, 6]} p={[0, 5.2, 1.5]} />
      </group>
    );
  }

  /* ---------------- courtyard wall: arcaded, scalloped ---------------- */
  function ArcWall({ len, h = 3.0, p, ry = 0, M, low = false }) {
    const S = useMemo(() => {
      const o = { rec: [], cream: [], merl: [] };
      const n = Math.floor(len / 1.6);
      for (let i = 0; i < n; i += 1) {
        const x = -len / 2 + (i + 0.5) * (len / n);
        if (!low) { o.cream.push({ p: [x, 0.05, 0.6], s: [1.0, h - 1.0, 0.04] }); o.rec.push({ p: [x, 0.05, 0.63], s: [0.8, h - 1.15, 0.04] }); }
        else { o.cream.push({ p: [x, 0.1, 0.6], s: [0.7, 0.8, 0.04] }); o.rec.push({ p: [x, 0.1, 0.63], s: [0.52, 0.7, 0.04] }); }
      }
      for (let x = -len / 2 + 0.2; x < len / 2; x += 0.46) o.merl.push({ p: [x, h, 0.5], s: [0.34, low ? 0.35 : 0.45, 0.1] });
      return o;
    }, [len, h, low]);
    const A = archGeo();
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[len, h, 1.2]} p={[0, h / 2, 0]} m={M.wall} />
        <Box s={[len, 0.1, 1.3]} p={[0, h - 0.05, 0]} m={M.maroon} />
        <Inst geo={A} mat={M.cream} items={S.cream} />
        <Inst geo={A} mat={M.rec} items={S.rec} />
        <Inst geo={A} mat={M.cream} items={S.merl} />
      </group>
    );
  }

  /* ---------------- surroundings ---------------- */
  function pavingTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#e6e2d6'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#b9b3a2'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(128, 0); g.lineTo(256, 128); g.lineTo(128, 256); g.lineTo(0, 128); g.closePath(); g.stroke();
    g.strokeStyle = '#cdc7b6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(128, 56); g.lineTo(200, 128); g.lineTo(128, 200); g.lineTo(56, 128); g.closePath(); g.stroke();
    g.strokeStyle = '#d2ccbc'; g.lineWidth = 1.5; g.strokeRect(1, 1, 254, 254);
    g.fillStyle = '#c8ad98'; g.beginPath(); g.arc(128, 128, 11, 0, PI * 2); g.fill();
    g.fillStyle = '#b9c7b8'; g.beginPath(); g.arc(128, 128, 5, 0, PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* pilgrims: robed body, shoulder scarf, head; scale gives adults and children */
  function Person({ items }) {
    const body = useMemo(() => new THREE.CylinderGeometry(0.13, 0.26, 0.72, 8), []);
    const scarf = useMemo(() => new THREE.CylinderGeometry(0.16, 0.2, 0.16, 8), []);
    const head = useMemo(() => new THREE.SphereGeometry(0.13, 8, 6), []);
    const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }), []);
    const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b8805a', roughness: 0.9 }), []);
    const cols = ['#d9382c', '#e07b2a', '#2b6cb0', '#c2185b', '#f2c94c', '#2e8b57', '#7b3f98', '#2a2a2a', '#f4f4f4', '#a0522d'];
    const cols2 = ['#f2c94c', '#d9382c', '#ffffff', '#e07b2a', '#c2185b', '#2b6cb0'];
    const bodies = items.map((it, i) => ({ p: [it[0], 0.36 * it[2], it[1]], s: [it[2], it[2], it[2]], c: i, ry: i }));
    const scarfs = items.map((it, i) => ({ p: [it[0], 0.7 * it[2], it[1]], s: [it[2], it[2], it[2]], c: i * 3 + 1 }));
    const heads = items.map((it) => ({ p: [it[0], 0.86 * it[2], it[1]], s: [it[2], it[2], it[2]] }));
    return (<><Inst geo={body} mat={bodyMat} items={bodies} colors={cols} cast /><Inst geo={scarf} mat={bodyMat} items={scarfs} colors={cols2} /><Inst geo={head} mat={headMat} items={heads} /></>);
  }

  function ThatchPavilion({ p, k = 1 }) {
    const M = useM();
    const post = M.plain('#a8321f', { roughness: 0.8 });
    const thatch = M.plain('#b99a5e', { roughness: 1 });
    return (
      <group position={p} scale={k}>
        <Box s={[3.4, 0.14, 3.4]} p={[0, 0.07, 0]} m={M.plain('#cfc9ba')} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.07} h={1.6} p={[a * 1.45, 0.95, b * 1.45]} m={post} seg={6} />)}
        <Box s={[3.2, 0.12, 3.2]} p={[0, 1.78, 0]} m={post} />
        <mesh position={[0, 2.42, 0]} rotation={[0, PI / 4, 0]} material={thatch} castShadow><coneGeometry args={[2.75, 1.25, 4]} /></mesh>
        <Cyl rt={0.05} h={0.5} p={[0, 3.2, 0]} m={post} seg={6} />
      </group>
    );
  }

  function FlagPole({ p }) {
    const M = useM();
    const red = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9382c', side: THREE.DoubleSide, roughness: 0.9 }), []);
    const geo = useMemo(() => {
      const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(2.0, 0.2); s.lineTo(1.4, -0.4); s.lineTo(2.0, -0.95); s.lineTo(0, -0.85); s.closePath();
      return new THREE.ShapeGeometry(s);
    }, []);
    return (
      <group position={p}>
        <Cyl rt={0.05} rb={0.09} h={5.6} p={[0, 2.8, 0]} m={M.plain('#8a6a4a')} seg={6} />
        <Ball rad={0.1} p={[0, 5.65, 0]} m={M.gold} />
        <mesh geometry={geo} material={red} position={[0.05, 5.35, 0]} rotation={[0, -0.35, 0]} />
      </group>
    );
  }

  function Pond({ p, w, d }) {
    const M = useM();
    const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5d8a7a', roughness: 0.15, metalness: 0.1 }), []);
    return (
      <group position={p}>
        <Box s={[w + 3.2, 0.5, d + 3.2]} p={[0, 0.25, 0]} m={M.plain('#d6d0c0')} />
        <Box s={[w + 2.0, 0.34, d + 2.0]} p={[0, 0.5, 0]} m={M.plain('#cfc9b8')} />
        <Box s={[w + 0.9, 0.2, d + 0.9]} p={[0, 0.66, 0]} m={M.plain('#c6bfad')} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.8, 0]} material={water}><planeGeometry args={[w, d]} /></mesh>
      </group>
    );
  }

  /* a 2-3 storey Janakpur town building: plaster body, shuttered window bands, parapet, water tank */
  function TownBuilding({ p, w, d, storeys, color, trim }) {
    const M = useM();
    const h = storeys * 3.0;
    const dark = M.plain('#6d5a4a', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.plain(color)} />
        <Box s={[w + 0.3, 0.3, d + 0.3]} p={[0, h + 0.15, 0]} m={M.plain(trim)} />
        {Array.from({ length: storeys }).map((_, i) => (
          <group key={i}>
            <Box s={[w + 0.12, 0.14, d + 0.12]} p={[0, 3.0 * (i + 1) - 0.1, 0]} m={M.plain(trim)} />
            <Box s={[w * 0.82, 1.0, 0.1]} p={[0, 3.0 * i + 1.7, d / 2 + 0.03]} m={dark} />
          </group>
        ))}
        <Box s={[1.1, 0.9, 1.1]} p={[w * 0.25, h + 0.75, 0]} m={M.plain('#2f6f93')} />
      </group>
    );
  }

  function JanakiEnv() {
    const M = useM();
    const [, ref] = useDusk();
    const MM = mats();
    const paving = useMemo(() => { const t = pavingTexture(); t.repeat.set(19.5, 10.3); return t; }, []);
    const pave = useMemo(() => new THREE.MeshStandardMaterial({ map: paving, roughness: 0.38, metalness: 0.05, envMapIntensity: 1.2 }), [paving]);
    const people = useMemo(() => {
      let sd = 11; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      const out = [];
      for (let i = 0; i < 26; i += 1) { // pilgrims gathered in front of the portal
        const x = (r() - 0.5) * 15; const z = 8.5 + r() * 4.5;
        out.push([x, z, 0.78 + r() * 0.34]);
      }
      for (let i = 0; i < 22; i += 1) {
        const x = (r() - 0.5) * 54; const z = 13 + r() * 8;
        if (Math.hypot(x - 2, z - 18) < 2.8 || Math.hypot(x - 4.9, z - 18.4) < 1) continue;
        out.push([x, z, 0.7 + r() * 0.4]);
      }
      return out;
    }, []);
    const stone = M.plain('#cbc3b0', { roughness: 0.85 });
    return (
      <group ref={ref}>
        {/* flat Terai ground out to the horizon */}
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow material={M.plain('#b8b48a', { roughness: 1 })}><circleGeometry args={[70, 48]} /></mesh>
        {/* the paved courtyard, diamond-patterned, wall to wall */}
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.005, 6.15]} receiveShadow material={pave}><planeGeometry args={[60.4, 31.7]} /></mesh>

        {/* arcaded perimeter walls, closed at the corners: tall back, side walls 2.2, low front wall */}
        <ArcWall len={61} h={3.0} p={[0, 0, -9.7]} M={MM} />
        <ArcWall len={31.7} h={2.2} p={[-30.2, 0, 6.15]} ry={PI / 2} M={MM} />
        <ArcWall len={31.7} h={2.2} p={[30.2, 0, 6.15]} ry={-PI / 2} M={MM} />
        <ArcWall len={61} h={1.2} p={[0, 0, 22]} ry={PI} M={MM} low />

        {/* forecourt: thatched open pavilion at left, tall red flag a little to its right */}
        <ThatchPavilion p={[2, 0, 18]} k={0.82} />
        <FlagPole p={[4.9, 0, 18.4]} />
        <Person items={people} />

        {/* Ram Mandir courtyard to the south-east: a stone-paved compound with a domed shrine; Vivah Mandap beside it */}
        <group position={[47, 0, -2]}>
          <Box s={[13, 0.3, 13]} p={[0, 0.15, 0]} m={stone} />
          <Box s={[13, 1.3, 0.3]} p={[0, 0.8, 6.4]} m={MM.wall} /><Box s={[13.2, 0.12, 0.45]} p={[0, 1.5, 6.4]} m={MM.maroon} />
          <Box s={[13, 1.3, 0.3]} p={[0, 0.8, -6.4]} m={MM.wall} /><Box s={[13.2, 0.12, 0.45]} p={[0, 1.5, -6.4]} m={MM.maroon} />
          <Box s={[0.3, 1.3, 13]} p={[-6.4, 0.8, 0]} m={MM.wall} /><Box s={[0.45, 0.12, 13.2]} p={[-6.4, 1.5, 0]} m={MM.maroon} />
          <Box s={[0.3, 1.3, 13]} p={[6.4, 0.8, 0]} m={MM.wall} /><Box s={[0.45, 0.12, 13.2]} p={[6.4, 1.5, 0]} m={MM.maroon} />
          <Box s={[4.4, 3.2, 4.4]} p={[0, 1.9, 0]} m={MM.wall} />
          <Box s={[4.8, 0.2, 4.8]} p={[0, 3.6, 0]} m={MM.maroon} />
          <Dome p={[0, 3.7, 0]} r={1.15} mat={MM.domeM} drum={0.5} M={MM} sq={false} />
          {[[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].map(([x, z], i) => <Cyl key={i} rt={0.18} h={1.3} p={[x, 4.25, z]} m={MM.wall} seg={8} />)}
        </group>
        <group position={[47, 0, -20]}>
          <Box s={[7, 0.3, 7]} p={[0, 0.15, 0]} m={stone} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Box key={`${a}${b}`} s={[0.4, 2.4, 0.4]} p={[a * 2.8, 1.5, b * 2.8]} m={MM.wall} />)}
          <Box s={[6.6, 0.3, 6.6]} p={[0, 2.85, 0]} m={MM.maroon} />
          <mesh position={[0, 3.9, 0]} rotation={[0, PI / 4, 0]} material={MM.domeM}><coneGeometry args={[4.4, 1.8, 4]} /></mesh>
          <Ball rad={0.2} p={[0, 4.9, 0]} m={MM.gold} />
        </group>

        {/* one stepped sacred pond (Dhanush Sagar / Ganga Sagar are a few hundred metres off) */}
        <Pond p={[-44, 0, -32]} w={18} d={13} />

        {/* low Janakpur houses and a few two-storey buildings behind and beside the walls, kept below the dome line */}
        {[[-34, -20, 9, 6, 2, '#e8dcc4', '#c8b89a'], [-19, -22, 8, 6, 1, '#e9c9c0', '#b57a6a'], [-4, -24, 7, 5, 2, '#d9c9a8', '#a89678'], [12, -22, 9, 6, 1, '#ece6da', '#b8ad9a'], [28, -20, 8, 6, 2, '#d8dfc8', '#9aa683'],
          [-42, -6, 6, 7, 1, '#e0d3c0', '#b0a088'], [-44, -16, 6, 6, 2, '#e8d0b8', '#b08c70'], [-24, -30, 11, 7, 2, '#d4c4a8', '#8e7e64'], [20, -32, 11, 7, 1, '#e8dcc4', '#a89678'], [4, -34, 8, 6, 2, '#dcd2b8', '#9a8c70']].map(([x, z, w, d, st, col, tr], i) => (
          <TownBuilding key={i} p={[x, 0, z]} w={w} d={d} storeys={st} color={col} trim={tr} />
        ))}
        {/* trees: small, behind z=-30 so the domes read against the sky, a few at the sides */}
        {[[-40, -34, 3.5], [-28, -38, 3.3], [-14, -36, 3.6], [0, -40, 3.4], [14, -38, 3.5], [30, -36, 3.3], [42, -32, 3.6], [-50, -10, 3.4], [-52, -24, 3.5], [50, -12, 3.4], [52, -26, 3.5]].map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s} />)}
      </group>
    );
  }

  return { 'janaki-mandir': { Main: JanakiMain, Env: JanakiEnv } };
}
