// Hand-built landmarks: Kathmandu Durbar Square and the sites in and around it.
import { useMemo } from 'react';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Spire, Lion, Tree, Trident, Diyo, Frame, Water, GroundDisc, ringOf, curvedRoofGeometry, THREE, PillarStatue, Elephant, Chaitya } = K;
  const PI = Math.PI;
  const TILE = '#cfa17e';

  /* ---------------- generic helpers ---------------- */
  /** Merge many boxes / cylinders into one geometry (one draw call). Parts: {s,p,r} box or {cyl:[rt,rb,h,seg],p,r}. */
  function mergeParts(list) {
    const pos = []; const nor = []; const uv = []; const idx = [];
    let off = 0;
    const e = new THREE.Euler(0, 0, 0, 'YXZ'); const q = new THREE.Quaternion(); const v = new THREE.Vector3();
    const sc = new THREE.Vector3(1, 1, 1); const mtx = new THREE.Matrix4();
    for (const b of list) {
      const g = b.cyl ? new THREE.CylinderGeometry(b.cyl[0], b.cyl[1], b.cyl[2], b.cyl[3] || 8) : new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]);
      const r = b.r || [0, 0, 0];
      e.set(r[0], r[1], r[2]); q.setFromEuler(e); v.set(b.p[0], b.p[1], b.p[2]);
      mtx.compose(v, q, sc); g.applyMatrix4(mtx);
      const pa = g.attributes.position.array; const na = g.attributes.normal.array; const ua = g.attributes.uv.array;
      for (let i = 0; i < pa.length; i += 1) { pos.push(pa[i]); nor.push(na[i]); }
      for (let i = 0; i < ua.length; i += 1) uv.push(ua[i]);
      const ia = g.index.array;
      for (let i = 0; i < ia.length; i += 1) idx.push(ia[i] + off);
      off += g.attributes.position.count; g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    out.setIndex(idx);
    return out;
  }
  function Merged({ parts, m, cast = true }) {
    const geo = useMemo(() => mergeParts(parts), []); // eslint-disable-line
    return <mesh geometry={geo} material={m} castShadow={cast} receiveShadow />;
  }
  /** Offset a local point (dx,dy,dz) from p after yawing by `yaw` about y. */
  const at = (p, yaw, dx, dy, dz) => [p[0] + dx * Math.cos(yaw) + dz * Math.sin(yaw), p[1] + dy, p[2] - dx * Math.sin(yaw) + dz * Math.cos(yaw)];

  const mats = (M) => ({
    wood: M.plain('#5a3418', { roughness: 0.8 }),
    dark: M.plain('#1b0f08'),
    slat: M.plain('#8f5a2c', { roughness: 0.75 }),
    red: M.plain('#b3202a', { roughness: 0.75 }),
    tile: M.mat('roof', 3, 3, { color: TILE }),
    tileDark: M.mat('roof', 3, 3, { color: '#8a5a48' }),
    plaster: M.plain('#efe8da', { roughness: 0.88 }),
    white: M.plain('#f7f4ee', { roughness: 0.82 }),
    brick: (rx, ry, c = '#f0c2a8') => M.mat('brick', rx, ry, { color: c }),
  });

  /** Carved wooden windows: list of {p:[x,y,z], yaw, w, h}. Frames and lattice in one mesh, openings in another. */
  function Windows({ list, ornate = false }) {
    const M = useM();
    const { frames, holes } = useMemo(() => {
      const fr = []; const ho = [];
      list.forEach(({ p, yaw = 0, w, h }) => {
        fr.push({ s: [w + 0.12, h + 0.12, 0.07], p: at(p, yaw, 0, 0, 0.0), r: [0, yaw, 0] });
        fr.push({ s: [w + 0.2, 0.05, 0.14], p: at(p, yaw, 0, -h / 2 - 0.07, 0.04), r: [0, yaw, 0] });
        if (ornate) fr.push({ s: [w + 0.26, 0.12, 0.1], p: at(p, yaw, 0, h / 2 + 0.1, 0.02), r: [0, yaw, 0] });
        ho.push({ s: [w, h, 0.06], p: at(p, yaw, 0, 0, 0.03), r: [0, yaw, 0] });
        const n = Math.max(2, Math.round(w / 0.1));
        for (let k = 0; k < n; k += 1) fr.push({ s: [0.025, h * 0.94, 0.03], p: at(p, yaw, -w / 2 + ((k + 0.5) * w) / n, 0, 0.07), r: [0, yaw, 0] });
      });
      return { frames: fr, holes: ho };
    }, []); // eslint-disable-line
    return (
      <group>
        <Merged parts={frames} m={M.plain('#6a3f20', { roughness: 0.8 })} cast={false} />
        <Merged parts={holes} m={M.plain('#1b0f08')} cast={false} />
      </group>
    );
  }

  /** Rows of carved struts (tunala) under an eave, one mesh. */
  function Struts({ w, d, y, nx = 4, nz = 4, h = 0.55 }) {
    const M = useM();
    const parts = useMemo(() => {
      const out = [];
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz]) => {
        const len = sx ? d : w; const cnt = sx ? nz : nx;
        for (let k = 0; k < cnt; k += 1) {
          const t = ((k + 0.5) / cnt - 0.5) * len * 0.9;
          const x = sx ? sx * (w / 2 + h * 0.36) : t; const z = sz ? sz * (d / 2 + h * 0.36) : t;
          const yaw = sx ? (sx * PI) / 2 : (sz > 0 ? 0 : PI);
          out.push({ s: [0.09, h, 0.09], p: [x, y - h / 2 + 0.04, z], r: [0.62, yaw, 0] });
        }
      });
      return out;
    }, []); // eslint-disable-line
    return <Merged parts={parts} m={M.plain('#5a3418', { roughness: 0.8 })} cast={false} />;
  }

  /** Pagoda roof with the red valance of the Newar eave and a dark soffit under it. */
  function Rf({ w, d, h, y, m, sag = 1.2, lift = 0.09, fringe = true }) {
    const M = useM();
    const geo = useMemo(() => curvedRoofGeometry(w, d, h, sag, lift), [w, d, h, sag, lift]);
    const parts = useMemo(() => [
      { s: [w, 0.13, 0.03], p: [0, -0.08, d / 2], r: [0, 0, 0] }, { s: [w, 0.13, 0.03], p: [0, -0.08, -d / 2], r: [0, 0, 0] },
      { s: [0.03, 0.13, d], p: [w / 2, -0.08, 0], r: [0, 0, 0] }, { s: [0.03, 0.13, d], p: [-w / 2, -0.08, 0], r: [0, 0, 0] },
    ], [w, d]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        <Box s={[w - 0.02, 0.04, d - 0.02]} p={[0, -0.02, 0]} m={M.plain('#2a1810')} cast={false} />
        {fringe && <Merged parts={parts} m={M.plain('#b3202a', { roughness: 0.75 })} cast={false} />}
      </group>
    );
  }

  /**
   * Newar pagoda from a list of tiers {w,d,h(wall),ov(eave overhang),rh(roof rise),open,wall,nw,door}. Faces +z.
   * Each wall sits exactly on the slope of the roof below it, so the tiers never float.
   */
  function Pagoda({ base = 0, tiers, roofM, finial = true, gs = 1, sag = 1.2, lift = 0.09, fringe = true, tint = '#f0c2a8', lite = false, doorGold = false }) {
    const M = useM();
    const T = mats(M);
    const out = [];
    let y = base;
    tiers.forEach((t, i) => {
      const nx = tiers[i + 1];
      const { w, d, h, ov = 0.9, rh = 0.8 } = t;
      const wallM = t.wall === 'timber' ? M.mat('wood', w / 1.2, h / 0.7, { color: '#9a6a46' })
        : t.wall === 'gold' ? M.gold : t.wall === 'dark' ? M.plain('#3a2a20', { roughness: 0.7 })
          : t.wall === 'plaster' ? T.plaster : M.mat('brick', w / 1.2, h / 0.6, { color: t.tint || tint });
      if (t.open) {
        const parts = [];
        const ring = (sx, sz) => {
          const nxp = Math.max(2, Math.round((w * sx) / (t.gap || 0.9))); const nzp = Math.max(2, Math.round((d * sz) / (t.gap || 0.9)));
          for (let k = 0; k <= nxp; k += 1) [1, -1].forEach((s) => parts.push({ cyl: [0.075, 0.09, h, 8], p: [(-w * sx) / 2 + (k * w * sx) / nxp, y + h / 2, (s * d * sz) / 2] }));
          for (let k = 1; k < nzp; k += 1) [1, -1].forEach((s) => parts.push({ cyl: [0.075, 0.09, h, 8], p: [(s * w * sx) / 2, y + h / 2, (-d * sz) / 2 + (k * d * sz) / nzp] }));
        };
        ring(0.96, 0.96);
        if (t.inner) ring(0.6, 0.6);
        parts.push({ s: [w, 0.14, 0.16], p: [0, y + h - 0.07, d / 2 - 0.05] }, { s: [w, 0.14, 0.16], p: [0, y + h - 0.07, -d / 2 + 0.05] }, { s: [0.16, 0.14, d], p: [w / 2 - 0.05, y + h - 0.07, 0] }, { s: [0.16, 0.14, d], p: [-w / 2 + 0.05, y + h - 0.07, 0] });
        out.push(<Merged key={`posts${i}`} parts={parts} m={T.wood} />);
        out.push(<Box key={`cella${i}`} s={[w * 0.56, h * 0.94, d * 0.56]} p={[0, y + (h * 0.94) / 2, 0]} m={M.mat('brick', w / 2, h / 0.8, { color: '#e0a88c' })} />);
        out.push(<Box key={`cd${i}`} s={[0.7, h * 0.7, 0.05]} p={[0, y + h * 0.36, d * 0.28 + 0.01]} m={T.dark} cast={false} />);
        out.push(<Box key={`flr${i}`} s={[w * 0.98, 0.05, d * 0.98]} p={[0, y + 0.02, 0]} m={M.stone} cast={false} />);
      } else {
        out.push(<Box key={`w${i}`} s={[w, h, d]} p={[0, y + h / 2, 0]} m={wallM} />);
        out.push(<Box key={`bm${i}`} s={[w + 0.08, 0.1, d + 0.08]} p={[0, y + h - 0.05, 0]} m={T.wood} cast={false} />);
        const wl = [];
        const nwin = t.nw ?? Math.max(1, Math.round(w / 1.2));
        [[0, d / 2 + 0.01, 0, w], [w / 2 + 0.01, 0, PI / 2, d], [0, -d / 2 - 0.01, PI, w], [-w / 2 - 0.01, 0, -PI / 2, d]].forEach(([px, pz, yaw, len], f) => {
          if (i === 0 && f === 0 && t.door !== false) return;
          const n = f % 2 === 1 ? Math.max(1, nwin - 1) : nwin;
          for (let k = 0; k < n; k += 1) {
            const c = -len / 2 + ((k + 0.5) * len) / n;
            wl.push({ p: at([px, y + h * 0.5, pz], yaw, c, 0, 0), yaw, w: Math.min(0.6, (len / n) * 0.55), h: Math.min(h * 0.55, 0.62) });
          }
        });
        if (t.windows !== false) out.push(<Windows key={`win${i}`} list={wl} />);
        if (i === 0 && t.door !== false) {
          out.push(<Box key={`dr${i}`} s={[0.86, Math.min(h * 0.78, 1.2), 0.07]} p={[0, y + Math.min(h * 0.78, 1.2) / 2, d / 2 + 0.01]} m={doorGold ? M.gold : T.wood} cast={false} />);
          out.push(<Box key={`drf${i}`} s={[1.06, Math.min(h * 0.78, 1.2) + 0.12, 0.05]} p={[0, y + (Math.min(h * 0.78, 1.2) + 0.12) / 2, d / 2 + 0.005]} m={T.slat} cast={false} />);
          if (!lite) out.push(<mesh key={`tor${i}`} position={[0, y + Math.min(h * 0.78, 1.2) + 0.1, d / 2 + 0.06]} material={M.gold}><torusGeometry args={[0.5, 0.045, 8, 24, PI]} /></mesh>);
        }
      }
      out.push(<Struts key={`st${i}`} w={w} d={d} y={y + h} nx={Math.max(3, Math.round(w / 0.8))} nz={Math.max(3, Math.round(d / 0.8))} h={0.45 + ov * 0.2} />);
      const rw = w + 2 * ov; const rd = d + 2 * ov;
      out.push(<Rf key={`r${i}`} w={rw} d={rd} h={rh} y={y + h - 0.04} m={roofM} sag={sag} lift={lift} fringe={fringe} />);
      if (nx) y = y + h - 0.04 + rh * (1 - Math.max(nx.w / rw, nx.d / rd)) ** sag - 0.04;
      else if (finial) out.push(<Gajur key="gj" y={y + h - 0.04 + rh - 0.02} s={gs} />);
    });
    return <group>{out}</group>;
  }
  const pagodaHeight = (base, tiers) => base + tiers.reduce((a, t) => a + t.h + t.rh * 0.65, 0) + 0.9;

  /** Brick plinth of stacked steps with a pale stone flight on each chosen side. `stairs` lists yaw angles. */
  function StepPlinth({ steps, w, d, stepH = 0.22, inset = 0.34, stairs = [0], sw = 2.2, brickC = '#f0c2a8', top = '#d9a58a' }) {
    const M = useM();
    const out = [];
    const flights = [];
    for (let i = 0; i < steps; i += 1) {
      const lw = w - 2 * inset * i; const ld = d - 2 * inset * i;
      out.push(<Box key={`l${i}`} s={[lw, stepH, ld]} p={[0, stepH * i + stepH / 2, 0]} m={M.mat('brick', lw / 1.2, 0.3, { color: brickC })} />);
      out.push(<Box key={`c${i}`} s={[lw + 0.03, 0.03, ld + 0.03]} p={[0, stepH * (i + 1) - 0.005, 0]} m={M.plain(top, { roughness: 0.9 })} cast={false} />);
    }
    stairs.forEach((yaw) => {
      const half = yaw % PI === 0 ? d / 2 : w / 2;
      for (let k = 0; k < steps; k += 1) {
        const front = half - inset * k;
        flights.push({ s: [sw, stepH + 0.01, inset + 0.04], p: at([0, (k + 1) * stepH - stepH / 2 + 0.005, 0], yaw, 0, 0, front + 0.02 - (inset + 0.04) / 2), r: [0, yaw, 0] });
      }
      flights.push({ s: [sw, stepH * 0.5, inset + 0.3], p: at([0, stepH * 0.25, 0], yaw, 0, 0, half + (inset + 0.3) / 2 - 0.02), r: [0, yaw, 0] });
    });
    return <group>{out}<Merged parts={flights} m={M.plain('#cfc4b0', { roughness: 0.9 })} /></group>;
  }

  /** Small timber post fence (as around Kasthamandap) as one mesh. */
  function Fence({ w, d, h = 0.7, n = 18, color = '#6b4528' }) {
    const M = useM();
    const parts = useMemo(() => {
      const out = [];
      const side = (len, f) => { const c = Math.round(len / 0.4); for (let k = 0; k <= c; k += 1) out.push(f(-len / 2 + (k * len) / c)); };
      side(w, (x) => ({ cyl: [0.03, 0.03, h, 5], p: [x, h / 2, d / 2] })); side(w, (x) => ({ cyl: [0.03, 0.03, h, 5], p: [x, h / 2, -d / 2] }));
      side(d, (z) => ({ cyl: [0.03, 0.03, h, 5], p: [w / 2, h / 2, z] })); side(d, (z) => ({ cyl: [0.03, 0.03, h, 5], p: [-w / 2, h / 2, z] }));
      [0.2, 0.6].forEach((yy) => { out.push({ s: [w, 0.04, 0.04], p: [0, yy * h / 0.7 * 0.7, d / 2] }, { s: [w, 0.04, 0.04], p: [0, yy, -d / 2] }, { s: [0.04, 0.04, d], p: [w / 2, yy, 0] }, { s: [0.04, 0.04, d], p: [-w / 2, yy, 0] }); });
      return out;
    }, []); // eslint-disable-line
    return <Merged parts={parts} m={M.plain(color, { roughness: 0.8 })} cast={false} />;
  }

  /** A plain brick townhouse for the streets round the squares: body, windows, low tiled roof. */
  function Townhouse({ p, r = 0, w = 2.4, d = 2, storeys = 3, plaster = false, tint = '#f0c2a8', pc = '#ece3d2', shop = true, neo = false }) {
    const M = useM();
    const T = mats(M);
    const sh = 0.85;
    const wl = useMemo(() => {
      const out = [];
      const n = Math.max(1, Math.round(w / 1.1));
      for (let s = shop ? 1 : 0; s < storeys; s += 1) for (let k = 0; k < n; k += 1) out.push({ p: [-w / 2 + ((k + 0.5) * w) / n, s * sh + sh * 0.5, d / 2 + 0.01], yaw: 0, w: Math.min(0.55, (w / n) * 0.5), h: 0.46 });
      return out;
    }, []); // eslint-disable-line
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, sh * storeys, d]} p={[0, (sh * storeys) / 2, 0]} m={plaster ? M.plain(pc, { roughness: 0.9 }) : M.mat('brick', w / 1.1, storeys, { color: tint })} />
        {shop && <Box s={[w * 0.8, sh * 0.62, 0.06]} p={[0, sh * 0.34, d / 2 + 0.01]} m={T.dark} cast={false} />}
        <Windows list={wl} />
        <Rf w={w + 0.5} d={d + 0.5} h={0.5 + storeys * 0.05} y={sh * storeys} m={neo ? T.tileDark : T.tile} sag={1.15} lift={0.05} fringe={false} />
      </group>
    );
  }

  /* ---------------- the temples of the square ---------------- */
  const MAJU_STEPS = 9;
  const MAJU_TIERS = [
    { w: 4.9, d: 4.9, h: 1.3, ov: 1.05, rh: 0.95, open: true, inner: true },
    { w: 3.8, d: 3.8, h: 0.95, ov: 0.85, rh: 0.85, nw: 3, door: false, wall: 'timber' },
    { w: 2.8, d: 2.8, h: 0.85, ov: 0.72, rh: 0.8, nw: 2, door: false, wall: 'timber' },
  ];
  /** Maju Dega: Shiva temple, three roofs over an open pillared hall, on a nine-step brick pyramid, white Kamadev shikhara at its foot. */
  function MajuBody() {
    const M = useM();
    const T = mats(M);
    const baseY = MAJU_STEPS * 0.22;
    return (
      <group>
        <StepPlinth steps={MAJU_STEPS} w={11} d={11} stairs={[0, PI / 2, -PI / 2, PI]} sw={2.4} />
        <Pagoda base={baseY} tiers={MAJU_TIERS} roofM={T.tile} />
        <Box s={[0.7, 0.14, 0.9]} p={[0, baseY + 0.07, 2.8]} m={M.stone} />
        <group position={[6.9, 0, 3.4]}>
          <Box s={[1.5, 0.25, 1.5]} p={[0, 0.125, 0]} m={M.stone} />
          <Box s={[1.1, 0.5, 1.1]} p={[0, 0.5, 0]} m={T.white} />
          <Spire r0={0.62} h={2.4} y={0.75} m={T.white} />
        </group>
      </group>
    );
  }

  /** Gable roof prism along x (used on courtyard houses). */
  function Gable({ len, d, h, y, m, ov = 0.5 }) {
    const geo = useMemo(() => {
      const hd = d / 2 + ov;
      const s = new THREE.Shape();
      s.moveTo(-hd, 0); s.lineTo(0, h); s.lineTo(hd, 0); s.lineTo(-hd, 0);
      const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
      g.translate(0, 0, -len / 2); g.rotateY(PI / 2);
      return g;
    }, [len, d, h, ov]);
    return <mesh geometry={geo} material={m} position={[0, y, 0]} castShadow receiveShadow />;
  }

  /* ---- Jagannath: two broad roofs over a brick hall with carved struts, on a three-step plinth ---- */
  const JAG_TIERS = [
    { w: 4.3, d: 4.0, h: 1.95, ov: 1.25, rh: 1.05, nw: 2 },
    { w: 2.9, d: 2.7, h: 1.2, ov: 1.05, rh: 1.0, nw: 2, door: false, wall: 'timber' },
  ];
  function JagBody() {
    const M = useM();
    const T = mats(M);
    return (
      <group>
        <StepPlinth steps={3} w={7.6} d={7.2} stepH={0.26} inset={0.42} stairs={[0]} sw={2.4} />
        <Pagoda base={0.78} tiers={JAG_TIERS} roofM={T.tile} gs={0.9} />
      </group>
    );
  }

  /* ---- Kasthamandap: three roofs, the lowest very wide over an open timber hall, balcony under the second ---- */
  const KASTHA_TIERS = [
    { w: 6.8, d: 6.8, h: 1.9, ov: 1.1, rh: 1.0, open: true, inner: true, gap: 0.95 },
    { w: 5.0, d: 5.0, h: 1.05, ov: 0.95, rh: 0.85, nw: 4, wall: 'timber', door: false },
    { w: 3.4, d: 3.4, h: 0.95, ov: 0.85, rh: 0.8, nw: 3, wall: 'timber', door: false },
  ];
  function KasthaBody() {
    const M = useM();
    const T = mats(M);
    const base = 0.4;
    const y1 = base + 1.9 - 0.04 + 1.0 * (1 - Math.max(5.0 / 8.9, 5.0 / 8.9)) ** 1.2 - 0.04;
    const rail = useMemo(() => {
      const out = []; const hw = 5.0 / 2 + 0.55;
      const side = (f) => { const c = Math.round((hw * 2) / 0.32); for (let k = 0; k <= c; k += 1) out.push(f(-hw + (k * hw * 2) / c)); };
      side((x) => ({ cyl: [0.03, 0.03, 0.5, 5], p: [x, 0.3, hw] })); side((x) => ({ cyl: [0.03, 0.03, 0.5, 5], p: [x, 0.3, -hw] }));
      side((z) => ({ cyl: [0.03, 0.03, 0.5, 5], p: [hw, 0.3, z] })); side((z) => ({ cyl: [0.03, 0.03, 0.5, 5], p: [-hw, 0.3, z] }));
      out.push({ s: [hw * 2 + 0.06, 0.06, 0.06], p: [0, 0.57, hw] }, { s: [hw * 2 + 0.06, 0.06, 0.06], p: [0, 0.57, -hw] }, { s: [0.06, 0.06, hw * 2], p: [hw, 0.57, 0] }, { s: [0.06, 0.06, hw * 2], p: [-hw, 0.57, 0] });
      out.push({ s: [hw * 2 + 0.2, 0.08, hw * 2 + 0.2], p: [0, 0.03, 0] });
      return out;
    }, []); // eslint-disable-line
    return (
      <group>
        <Box s={[8.6, 0.2, 8.6]} p={[0, 0.1, 0]} m={M.stone} />
        <Box s={[7.9, 0.2, 7.9]} p={[0, 0.3, 0]} m={T.brick(4, 0.3)} />
        <Pagoda base={base} tiers={KASTHA_TIERS} roofM={T.tile} gs={0.6} sag={1.15} lift={0.07} />
        <group position={[0, y1 + 0.02, 0]}><Merged parts={rail} m={T.wood} /></group>
        <Fence w={9.2} d={9.2} h={0.7} />
      </group>
    );
  }

  /* ---- Taleju: three gilded roofs (weathered) on a tall brick plinth, small shrines and a red enclosure with a gate ---- */
  const TALEJU_TIERS = [
    { w: 3.3, d: 3.3, h: 1.9, ov: 1.05, rh: 1.1, nw: 2 },
    { w: 2.6, d: 2.6, h: 1.5, ov: 0.9, rh: 0.95, nw: 2, wall: 'dark', door: false },
    { w: 2.0, d: 2.0, h: 1.3, ov: 0.8, rh: 0.9, nw: 2, wall: 'dark', door: false },
  ];
  function TalejuBody({ lite }) {
    const M = useM();
    const T = mats(M);
    const roof = M.plain('#a38d3e', { metalness: 0.75, roughness: 0.42 });
    const red = M.plain('#a9473a', { roughness: 0.9 });
    const S = 8; const H = S * 0.3;
    const shrines = [[-6, -5.4], [6, -5.4], [-6.3, 1.5], [6.3, 1.5], [-6, 5.5], [6, 5.5]];
    return (
      <group>
        <StepPlinth steps={S} w={10.2} d={10.2} stepH={0.3} inset={0.42} stairs={[0]} sw={2.4} />
        <Pagoda base={H} tiers={TALEJU_TIERS} roofM={roof} gs={1.15} sag={1.25} />
        {shrines.map(([x, z], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[1.1, 0.3, 1.1]} p={[0, 0.15, 0]} m={M.stone} />
            <Pagoda base={0.3} tiers={[{ w: 0.7, d: 0.7, h: 0.75, ov: 0.45, rh: 0.4, door: false, windows: false }, { w: 0.45, d: 0.45, h: 0.5, ov: 0.35, rh: 0.35, door: false, windows: false }]} roofM={T.tile} gs={0.3} fringe />
          </group>
        ))}
        {/* enclosure wall with gate */}
        {[[0, -8, 16.4, 0.5], [-8.1, 0, 0.5, 16.4], [8.1, 0, 0.5, 16.4]].map(([x, z, w, d], k) => (
          <group key={k}><Box s={[w, 1.7, d]} p={[x, 0.85, z]} m={red} /><Box s={[w + 0.1, 0.12, d + 0.1]} p={[x, 1.74, z]} m={T.white} /></group>
        ))}
        {[[-4.6, 8], [4.6, 8]].map(([x, z], k) => (
          <group key={k}><Box s={[6.2, 1.7, 0.5]} p={[x, 0.85, z]} m={red} /><Box s={[6.3, 0.12, 0.6]} p={[x, 1.74, z]} m={T.white} /></group>
        ))}
        <group position={[0, 0, 8]}>
          <Box s={[2.4, 2.5, 0.8]} p={[0, 1.25, 0]} m={red} />
          <Box s={[2.6, 0.14, 1.0]} p={[0, 2.57, 0]} m={T.white} />
          <Box s={[1.3, 1.7, 0.08]} p={[0, 0.85, 0.42]} m={T.wood} />
          <mesh position={[0, 1.7, 0.43]} material={T.slat}><torusGeometry args={[0.66, 0.1, 8, 20, PI]} /></mesh>
          {[-1, 1].map((k) => <group key={k} position={[k * 1.5, 0.12, 0.5]} scale={1.2}><Lion m={T.white} /></group>)}
          <Rf w={3.0} d={1.5} h={0.45} y={2.6} m={T.tile} sag={1.1} lift={0.05} />
        </group>
      </group>
    );
  }

  /* ---- Kumari Ghar: three-storey brick bahal round a small courtyard, lions at the door, ornate carved windows ---- */
  function KumariBody() {
    const M = useM();
    const T = mats(M);
    const W = 9.8; const D = 9.2; const wd = 2.1; const sh = 0.95; const H = sh * 3;
    const iw = W - 2 * wd; const id = D - 2 * wd;
    const outer = useMemo(() => {
      const l = [];
      const row = (n, px, pz, yaw, len, s, wdt, hgt) => {
        for (let k = 0; k < n; k += 1) l.push({ p: at([px, s * sh + sh * 0.52, pz], yaw, -len / 2 + ((k + 0.5) * len) / n, 0, 0), yaw, w: wdt, h: hgt });
      };
      [1, 2].forEach((s) => {
        row(5, 0, D / 2 + 0.01, 0, W - 0.8, s, 0.5, 0.5);
        row(5, 0, -D / 2 - 0.01, PI, W - 0.8, s, 0.5, 0.5);
        row(3, W / 2 + 0.01, 0, PI / 2, D - 1, s, 0.5, 0.5);
        row(3, -W / 2 - 0.01, 0, -PI / 2, D - 1, s, 0.5, 0.5);
      });
      return l;
    }, []); // eslint-disable-line
    const inner = useMemo(() => {
      const l = [];
      const faces = [[0, id / 2 - 0.01, PI, iw], [0, -id / 2 + 0.01, 0, iw], [iw / 2 - 0.01, 0, -PI / 2, id], [-iw / 2 + 0.01, 0, PI / 2, id]];
      faces.forEach(([px, pz, yaw, len]) => {
        const n1 = Math.round(len / 0.95); const n2 = Math.round(len / 0.7);
        for (let k = 0; k < n1; k += 1) l.push({ p: at([px, 1 * sh + sh * 0.5, pz], yaw, -len / 2 + ((k + 0.5) * len) / n1, 0, 0), yaw, w: 0.58, h: 0.55, o: 1 });
        for (let k = 0; k < n2; k += 1) l.push({ p: at([px, 2 * sh + sh * 0.5, pz], yaw, -len / 2 + ((k + 0.5) * len) / n2, 0, 0), yaw, w: 0.4, h: 0.44, o: 1 });
      });
      return l;
    }, []); // eslint-disable-line
    const posts = useMemo(() => {
      const out = [];
      const faces = [[0, id / 2 - 0.12, iw], [0, -id / 2 + 0.12, iw]];
      faces.forEach(([px, pz, len]) => { const n = 4; for (let k = 0; k <= n; k += 1) out.push({ cyl: [0.07, 0.08, sh * 0.9, 8], p: [-len / 2 + (k * len) / n, sh * 0.45, pz] }); out.push({ s: [len, 0.1, 0.16], p: [0, sh * 0.92, pz] }); });
      const sides = [[iw / 2 - 0.12, id], [-iw / 2 + 0.12, id]];
      sides.forEach(([px, len]) => { const n = 3; for (let k = 0; k <= n; k += 1) out.push({ cyl: [0.07, 0.08, sh * 0.9, 8], p: [px, sh * 0.45, -len / 2 + (k * len) / n] }); out.push({ s: [0.16, 0.1, len], p: [px, sh * 0.92, 0] }); });
      return out;
    }, []); // eslint-disable-line
    const brick = M.mat('brick', 4, 2.5, { color: '#ecb69b' });
    const roofM = M.mat('roof', 0.7, 0.7, { color: TILE });
    return (
      <group>
        <Box s={[W + 0.5, 0.2, D + 0.5]} p={[0, 0.1, 0]} m={M.stone} />
        <Box s={[W, H, wd]} p={[0, H / 2, D / 2 - wd / 2]} m={brick} />
        <Box s={[W, H, wd]} p={[0, H / 2, -D / 2 + wd / 2]} m={brick} />
        <Box s={[wd, H, D - 2 * wd]} p={[W / 2 - wd / 2, H / 2, 0]} m={brick} />
        <Box s={[wd, H, D - 2 * wd]} p={[-W / 2 + wd / 2, H / 2, 0]} m={brick} />
        {[1, 2].map((s) => <Box key={s} s={[W + 0.06, 0.07, D + 0.06]} p={[0, s * sh, 0]} m={T.wood} cast={false} />)}
        <Box s={[iw, 0.06, id]} p={[0, 0.22, 0]} m={M.plain('#cfc4b0')} cast={false} />
        <Windows list={outer} />
        <Windows list={inner} ornate />
        <Merged parts={posts} m={T.wood} />
        {/* gilded central Kumari window above the courtyard */}
        <Box s={[0.9, 0.62, 0.1]} p={[0, 2 * sh + sh * 0.52, id / 2 - 0.05]} r={[0, PI, 0]} m={M.gold} cast={false} />
        {/* door, steps and the two lions */}
        <Box s={[1.0, 1.4, 0.08]} p={[0, 0.9, D / 2 + 0.03]} m={T.wood} cast={false} />
        <Box s={[1.3, 1.55, 0.06]} p={[0, 0.98, D / 2 + 0.0]} m={T.slat} cast={false} />
        <mesh position={[0, 1.66, D / 2 + 0.06]} material={M.gold}><torusGeometry args={[0.6, 0.05, 8, 20, PI]} /></mesh>
        <Box s={[3.4, 0.18, 0.7]} p={[0, 0.29, D / 2 + 0.4]} m={M.stone} />
        <Box s={[3.0, 0.18, 0.5]} p={[0, 0.2, D / 2 + 0.7]} m={M.stone} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.25, 0.38, D / 2 + 0.45]} scale={1.7}><Lion m={T.white} /></group>)}
        {[-1, 1].map((k) => <Box key={`mn${k}`} s={[0.14, 0.1, 0.1]} p={[k * 1.25, 0.82, D / 2 + 0.78]} m={T.red} cast={false} />)}
        <group position={[0, 0, D / 2 - wd / 2]}><Gable len={W + 0.2} d={wd} h={0.6} y={H} m={roofM} ov={0.3} /></group>
        <group position={[0, 0, -D / 2 + wd / 2]}><Gable len={W + 0.2} d={wd} h={0.6} y={H} m={roofM} ov={0.3} /></group>
        <group position={[W / 2 - wd / 2, 0, 0]} rotation={[0, PI / 2, 0]}><Gable len={D - 2 * wd + 0.2} d={wd} h={0.6} y={H} m={roofM} ov={0.3} /></group>
        <group position={[-W / 2 + wd / 2, 0, 0]} rotation={[0, PI / 2, 0]}><Gable len={D - 2 * wd + 0.2} d={wd} h={0.6} y={H} m={roofM} ov={0.3} /></group>
        <Chaitya p={[0, 0.25, 0]} s={0.55} />
        <Tree p={[-1.1, 0.25, -0.7]} s={0.55} />
      </group>
    );
  }

  /* ---- Hanuman Dhoka: the long white palace front with the painted gate, red-robed Hanuman under his umbrella, the five-roofed
         Panchamukhi Hanuman tower rising behind and the brick Basantapur tower at the end ---- */
  function HanumanBody() {
    const M = useM();
    const T = mats(M);
    const L = 16; const D = 3.6; const sh = 0.95; const H = sh * 3;
    const wl = useMemo(() => {
      const l = [];
      for (let s = 0; s < 3; s += 1) {
        const n = s === 0 ? 7 : 9;
        for (let k = 0; k < n; k += 1) {
          const x = -L / 2 + ((k + 0.5) * L) / n;
          if (s === 0 && Math.abs(x) < 1.4) continue;
          l.push({ p: [x, s * sh + sh * 0.52, D / 2 + 0.01], yaw: 0, w: s === 0 ? 0.4 : 0.5, h: s === 0 ? 0.5 : 0.5 });
        }
      }
      return l;
    }, []); // eslint-disable-line
    const balc = useMemo(() => {
      const out = []; const c = Math.round(L / 0.35);
      for (let k = 0; k <= c; k += 1) out.push({ cyl: [0.03, 0.03, 0.45, 5], p: [-L / 2 + (k * L) / c, sh + 0.25, D / 2 + 0.6] });
      out.push({ s: [L, 0.07, 0.07], p: [0, sh + 0.5, D / 2 + 0.6] }, { s: [L, 0.08, 0.7], p: [0, sh + 0.02, D / 2 + 0.3] });
      return out;
    }, []); // eslint-disable-line
    const tw = [2.4, 2.0, 1.65, 1.35, 1.1];
    const panch = tw.map((w, i) => ({ w, d: w, h: i === 0 ? 3.1 : 0.6, ov: 0.4 - i * 0.02, rh: 0.42, wall: 'plaster', door: false, windows: false }));
    const basa = [
      { w: 4, d: 4, h: 2.7, ov: 0.65, rh: 0.7, nw: 3, door: false },
      { w: 3.4, d: 3.4, h: 1.4, ov: 0.6, rh: 0.62, nw: 3, door: false },
      { w: 2.8, d: 2.8, h: 1.2, ov: 0.55, rh: 0.58, nw: 2, door: false },
      { w: 2.2, d: 2.2, h: 1.0, ov: 0.5, rh: 0.55, nw: 2, door: false },
    ];
    return (
      <group>
        <Box s={[L + 0.3, 0.25, D + 0.5]} p={[0, 0.12, 0]} m={M.stone} />
        <Box s={[L, H, D]} p={[0, H / 2, 0]} m={T.plaster} />
        {[0, 1, 2].map((s) => <Box key={s} s={[L + 0.04, 0.07, D + 0.04]} p={[0, (s + 1) * sh, 0]} m={T.wood} cast={false} />)}
        <Windows list={wl} ornate />
        <Merged parts={balc} m={T.wood} />
        <Rf w={L + 1.2} d={D + 1.4} h={1.05} y={H} m={T.tileDark} sag={1.1} lift={0.04} fringe={false} />
        {/* the gate */}
        <Box s={[1.9, 2.3, 0.14]} p={[0, 1.4, D / 2 + 0.05]} m={M.plain('#c9a227', { roughness: 0.5, metalness: 0.4 })} cast={false} />
        <Box s={[1.15, 1.7, 0.1]} p={[0, 1.1, D / 2 + 0.13]} m={M.plain('#2a4a7a', { roughness: 0.6 })} cast={false} />
        <mesh position={[0, 1.95, D / 2 + 0.15]} material={M.gold}><torusGeometry args={[0.62, 0.07, 8, 24, PI]} /></mesh>
        <Box s={[1.6, 0.5, 0.1]} p={[0, 2.35, D / 2 + 0.14]} m={M.gold} cast={false} />
        {[0, 1, 2].map((k) => <Box key={k} s={[3.4 - k * 0.3, 0.12, 0.7 - k * 0.15]} p={[0, 0.3 + k * 0.1, D / 2 + 0.5 + k * 0.28]} r={[0, 0, 0]} m={M.stone} />).reverse()}
        {[-1, 1].map((k) => <group key={k} position={[k * 1.35, 0.4, D / 2 + 0.55]} scale={1.5}><Lion m={T.white} /></group>)}
        {/* Hanuman in red cloth under an umbrella */}
        <group position={[-3.1, 0, D / 2 + 0.7]}>
          <Box s={[0.85, 1.1, 0.85]} p={[0, 0.55, 0]} m={M.plain('#a8261a', { roughness: 0.8 })} />
          <mesh position={[0, 1.55, 0]} material={M.plain('#d3281e', { roughness: 0.85 })} castShadow><coneGeometry args={[0.5, 1.0, 14]} /></mesh>
          <Ball rad={0.22} p={[0, 2.18, 0.04]} m={M.plain('#f08a1a', { roughness: 0.7 })} />
          <Cyl rt={0.02} h={1.1} p={[0, 2.8, 0]} m={T.dark} seg={6} />
          <mesh position={[0, 3.3, 0]} material={M.plain('#6e1818', { roughness: 0.8 })} castShadow><coneGeometry args={[0.72, 0.28, 18]} /></mesh>
        </group>
        {/* Panchamukhi tower behind the front and the Basantapur tower beyond the end */}
        <group position={[-3.4, 0, -2.4]}><Pagoda base={0} tiers={panch} roofM={T.tile} gs={0.7} fringe={false} /></group>
        <group position={[L / 2 + 2.4, 0, -0.4]}><Pagoda base={0} tiers={basa} roofM={T.tile} gs={0.8} /></group>
      </group>
    );
  }

  /* ---- Kal Bhairav: the huge black six-armed stone Bhairav in a blue-and-red arched niche, canopy with three white spires,
         stone lions, a low railing and the lamps ---- */
  function KalBody({ wall = false }) {
    const M = useM();
    const T = mats(M);
    const black = M.plain('#1a1717', { roughness: 0.45 });
    const stone = M.plain('#8b857c', { roughness: 0.95 });
    const grey = M.plain('#5f5a55', { roughness: 0.95 });
    const skulls = useMemo(() => Array.from({ length: 9 }, (_, k) => k), []);
    const arms = [[-1, 0.9, 0.6], [-1, 0.45, 0.2], [-1, -0.05, -0.3], [1, 0.9, 0.6], [1, 0.45, 0.2], [1, -0.05, -0.3]];
    return (
      <group>
        {wall && <Box s={[9, 5.6, 0.9]} p={[0, 2.8, -0.75]} m={M.mat('brick', 6, 3, { color: '#e8b29a' })} />}
        <Box s={[3.6, 0.5, 1.5]} p={[0, 0.25, 0.1]} m={grey} />
        <group scale={1.2}>
        <Box s={[2.8, 1.9, 0.5]} p={[0, 1.45, -0.2]} m={stone} />
        <Cyl rt={1.4} h={0.5} p={[0, 2.4, -0.2]} r={[PI / 2, 0, 0]} m={stone} seg={32} />
        <mesh position={[0, 2.4, 0.07]} material={M.plain('#274a8c', { roughness: 0.6 })}><circleGeometry args={[1.22, 32]} /></mesh>
        <mesh position={[0, 2.4, 0.08]} material={M.plain('#a42422', { roughness: 0.6 })}><torusGeometry args={[1.28, 0.07, 8, 40, PI]} /></mesh>
        <Box s={[2.5, 1.6, 0.06]} p={[0, 1.4, 0.08]} m={M.plain('#274a8c', { roughness: 0.6 })} cast={false} />
        {/* the figure */}
        <group position={[0, 0, 0.3]}>
          <Box s={[1.3, 0.28, 0.5]} p={[0, 0.64, 0]} m={M.plain('#4a3a32')} />
          <Ball rad={0.16} p={[-0.6, 0.78, 0.05]} m={M.plain('#4a3a32')} />
          {[-1, 1].map((k) => <Cyl key={k} rt={0.13} rb={0.1} h={0.85} p={[k * 0.38, 1.1, 0]} r={[0, 0, k * 0.2]} m={black} seg={10} />)}
          <Box s={[0.9, 0.35, 0.32]} p={[0, 1.55, 0]} m={M.plain('#a02020')} />
          <Box s={[0.85, 0.95, 0.34]} p={[0, 2.1, 0]} m={black} />
          <Ball rad={0.3} p={[0, 2.85, 0.02]} m={black} />
          {[-1, 1].map((k) => <Ball key={k} rad={0.06} p={[k * 0.12, 2.9, 0.28]} m={M.white || T.white} />)}
          <mesh position={[0, 3.3, 0]} material={M.gold} castShadow><coneGeometry args={[0.34, 0.6, 10]} /></mesh>
          {[-0.28, 0, 0.28].map((x) => <Ball key={x} rad={0.07} p={[x, 3.1, 0.2]} m={M.gold} />)}
          {skulls.map((k) => <Ball key={k} rad={0.075} p={[-0.38 + k * 0.095, 2.25 - Math.abs(k - 4) * -0.02 - 0.18 + Math.abs(k - 4) * 0.02, 0.2]} m={T.white} />)}
          {arms.map(([sx, y, a], k) => <Cyl key={k} rt={0.07} h={0.85} p={[sx * (0.72 + a * 0.28), 2.1 + y * 0.55, 0.02]} r={[0, 0, sx * (0.9 - a * 0.9)]} m={black} seg={8} />)}
          <Box s={[0.07, 1.0, 0.04]} p={[0.95, 3.15, 0.12]} r={[0, 0, -0.25]} m={silver(M)} />
          <Box s={[0.07, 0.7, 0.04]} p={[-1.0, 2.9, 0.12]} r={[0, 0, 0.3]} m={silver(M)} />
        </group>
        </group>
        {/* canopy of the shrine */}
        {[-2.0, 2.0].map((x) => <Cyl key={x} rt={0.1} h={5.0} p={[x, 2.5, 1.2]} m={T.wood} seg={8} />)}
        <Rf w={5.8} d={3.2} h={0.6} y={5.0} m={T.tile} sag={1.15} lift={0.05} />
        {[-1, 0, 1].map((k) => <group key={k} position={[k * 1.1, 5.55, 0]}><Spire r0={0.22} h={0.7} y={0} m={T.white} /></group>)}
        {/* stone lions, lamps and railing */}
        {[-1, 1].map((k) => <group key={`l${k}`} position={[k * 2.1, 0.5, 1.5]} scale={2.0}><Lion m={grey} /></group>)}
        <Box s={[2.2, 0.55, 0.9]} p={[0, 0.28, 1.9]} m={grey} />
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => <Diyo key={x} p={[x, 0.56, 1.9]} />)}
        <Fence w={4.6} d={2.4} h={0.8} />
      </group>
    );
  }
  const silver = (M) => M.plain('#d4d6da', { metalness: 0.9, roughness: 0.28 });

  /* ---- Ashok Binayak (Maru Ganesh): tiny gold-plated shrine with one roof and no pinnacle, in a gilt cage, bell frame beside it ---- */
  function AshokBody() {
    const M = useM();
    const T = mats(M);
    const bars = useMemo(() => {
      const out = []; const hw = 1.5; const n = Math.round((hw * 2) / 0.17);
      for (let k = 0; k <= n; k += 1) { const t = -hw + (k * hw * 2) / n; out.push({ cyl: [0.022, 0.022, 1.7, 5], p: [t, 0.85, hw] }, { cyl: [0.022, 0.022, 1.7, 5], p: [t, 0.85, -hw] }, { cyl: [0.022, 0.022, 1.7, 5], p: [hw, 0.85, t] }, { cyl: [0.022, 0.022, 1.7, 5], p: [-hw, 0.85, t] }); }
      [0.5, 1.2, 1.72].forEach((y) => out.push({ s: [hw * 2 + 0.1, 0.05, 0.05], p: [0, y, hw] }, { s: [hw * 2 + 0.1, 0.05, 0.05], p: [0, y, -hw] }, { s: [0.05, 0.05, hw * 2], p: [hw, y, 0] }, { s: [0.05, 0.05, hw * 2], p: [-hw, y, 0] }));
      return out;
    }, []); // eslint-disable-line
    const bells = useMemo(() => {
      const out = [];
      for (let r = 0; r < 4; r += 1) for (let k = 0; k < 9; k += 1) out.push({ cyl: [0.03, 0.06, 0.12, 8], p: [-0.72 + k * 0.18, 1.2 - r * 0.28, 0] });
      [0.1, 0.4, 0.68, 0.96, 1.3].forEach((y) => out.push({ s: [1.7, 0.03, 0.03], p: [0, y, 0.05] }));
      return out;
    }, []); // eslint-disable-line
    const brass = M.plain('#c9993a', { metalness: 0.85, roughness: 0.35 });
    return (
      <group>
        <Box s={[3.5, 0.2, 3.5]} p={[0, 0.1, 0]} m={M.stone} />
        <group position={[0, 0.2, 0]}>
          <Box s={[1.9, 0.4, 1.9]} p={[0, 0.2, 0]} m={M.gold} />
          <Pagoda base={0.4} tiers={[{ w: 1.5, d: 1.5, h: 1.1, ov: 0.65, rh: 0.55, wall: 'gold', door: false, windows: false }]} roofM={M.gold} finial={false} fringe />
          <Box s={[0.85, 0.95, 0.08]} p={[0, 0.95, 0.78]} m={M.plain('#1b0f08')} cast={false} />
          <Box s={[1.05, 1.15, 0.06]} p={[0, 0.98, 0.76]} m={silver(M)} cast={false} />
          <mesh position={[0, 1.45, 0.8]} material={silver(M)}><torusGeometry args={[0.48, 0.07, 8, 22, PI]} /></mesh>
          <Ball rad={0.2} p={[0, 0.72, 0.7]} m={M.plain('#8a2a1a')} />
          <Ball rad={0.13} p={[0, 0.98, 0.72]} m={M.plain('#8a2a1a')} />
          <Merged parts={bars} m={brass} />
        </group>
        <group position={[-2.5, 0.2, 0.2]} rotation={[0, PI / 2, 0]}>
          <Box s={[1.9, 0.2, 0.5]} p={[0, 0.1, 0]} m={M.stone} />
          <group position={[0, 0.25, 0]}><Merged parts={bells} m={brass} /></group>
          <Box s={[1.9, 0.25, 0.1]} p={[0, 1.75, 0.0]} m={M.plain('#c0262a')} />
        </group>
      </group>
    );
  }

  /* ---- the layout of the square: x east, z south; r turns the building so its local +z (front) faces that way ---- */
  const SQUARE = {
    'maju-dega': { p: [-10, 0, -3], r: PI / 2, B: MajuBody },
    'jagannath-temple': { p: [4, 0, -15.5], r: 0, B: JagBody },
    kasthamandap: { p: [-10, 0, 13], r: PI / 2, B: KasthaBody },
    'ashok-binayak': { p: [-3.4, 0, 8.2], r: PI / 2, B: AshokBody },
    'kumari-ghar': { p: [5, 0, 19.5], r: PI, B: KumariBody },
    'hanuman-dhoka-palace': { p: [21, 0, -3], r: -PI / 2, B: HanumanBody },
    'kal-bhairav': { p: [18.5, 0, -9], r: -PI / 2, B: KalBody },
    'taleju-temple': { p: [34, 0, -12], r: 0, B: TalejuBody },
    'pratap-column': { p: [9, 0, -5], r: PI / 2, B: PratapBody },
  };
  function PratapBody() {
    const M = useM();
    return (
      <group>
        {[0, 1, 2].map((k) => <Box key={k} s={[1.8 - k * 0.3, 0.22, 1.8 - k * 0.3]} p={[0, 0.11 + k * 0.22, 0]} m={M.stone} />)}
        <PillarStatue p={[0, 0.66, 0]} king />
      </group>
    );
  }

  function GaddiBaithak() {
    const M = useM();
    const T = mats(M);
    const wl = useMemo(() => {
      const l = [];
      for (let s = 0; s < 2; s += 1) for (let k = 0; k < 7; k += 1) l.push({ p: [-3.3 + k * 1.1, s * 1.1 + 0.9, 2.51], yaw: 0, w: 0.5, h: 0.75 });
      return l;
    }, []);
    const wm = M.plain('#f6f2ea', { roughness: 0.9 });
    return (
      <group>
        <Box s={[8.4, 2.6, 5]} p={[0, 1.3, 0]} m={wm} />
        {wl.map((w, i) => <group key={i}><Box s={[0.56, 0.8, 0.05]} p={w.p} m={T.dark} cast={false} /><mesh position={[w.p[0], w.p[1] + 0.4, w.p[2]]} material={T.dark}><circleGeometry args={[0.28, 12, 0, PI]} /></mesh></group>)}
        <Box s={[8.6, 0.16, 5.2]} p={[0, 2.68, 0]} m={wm} />
        <Box s={[2.6, 1.0, 0.4]} p={[0, 3.1, 2.4]} m={wm} />
        <mesh position={[0, 3.9, 2.4]} rotation={[0, 0, 0]} material={wm}><cylinderGeometry args={[0, 1.4, 0.7, 3, 1]} /></mesh>
      </group>
    );
  }

  /** Everything round the square: paving, the surrounding streets of houses and shops, the hills beyond. */
  function SquareScenery() {
    const M = useM();
    const T = mats(M);
    const houses = useMemo(() => {
      const out = [];
      const pcs = ['#ece3d2', '#e6d4ae', '#d9ccc0', '#efe5c6', '#cfd3cf'];
      let i = 0;
      const row = (n, f) => { for (let k = 0; k < n; k += 1) { out.push({ ...f(k), i }); i += 1; } };
      row(11, (k) => ({ p: [-24, 0, -21 + k * 4], r: PI / 2, st: 3 + (k % 3 === 0 ? 1 : 0) }));
      row(17, (k) => ({ p: [-20 + k * 4, 0, 28], r: PI, st: 3 + (k % 4 === 1 ? 1 : 0) }));
      row(17, (k) => ({ p: [-20 + k * 4, 0, -27], r: 0, st: 3 + (k % 3 === 2 ? 1 : 0) }));
      row(6, (k) => ({ p: [51, 0, -26 + k * 5], r: -PI / 2, st: 3 }));
      row(4, (k) => ({ p: [21 + (k % 2) * 3.4, 0, 12 + k * 3], r: PI, st: 3 }));
      return out;
    }, []);
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[14, -0.01, 0]} receiveShadow material={M.mat('plaster', 14, 10, { color: '#e2d7c2' })}><planeGeometry args={[84, 62]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.mat('grass', 30, 30, { color: '#b8c890' })} />
        {houses.map((h) => <Townhouse key={h.i} p={h.p} r={h.r} w={3.2 + (h.i % 3) * 0.25} d={2.4} storeys={h.st} plaster={h.i % 3 === 0} pc={['#ece3d2', '#e6d4ae', '#d9ccc0', '#efe5c6', '#cfd3cf'][h.i % 5]} tint={['#f0c2a8', '#e8b29a', '#f4cdb4'][h.i % 3]} shop />)}
        <group position={[27, 0, 14]} rotation={[0, PI, 0]}><GaddiBaithak /></group>
        <Tree p={[-17, 0, 2]} s={1.7} />
        <Tree p={[-18, 0, 20]} s={1.4} />
        {/* Swayambhu hill with its stupa to the west, wooded hills to the north */}
        <group position={[-78, 0, 6]}>
          <mesh position={[0, -3, 0]} scale={[30, 18, 30]} material={M.mat('grass', 6, 4, { color: '#6f9058' })}><sphereGeometry args={[1, 24, 12, 0, PI * 2, 0, PI / 2]} /></mesh>
          <Box s={[2.2, 1.0, 2.2]} p={[0, 15, 0]} m={T.white} />
          <Spire r0={1.3} h={2.4} y={15.5} m={T.white} />
          <Spire r0={0.1} h={0.1} y={18} m={M.gold} />
        </group>
        {[[-40, -78, 40, 14], [10, -86, 50, 18], [60, -76, 36, 12]].map(([x, z, r, h], k) => <mesh key={k} position={[x, -3, z]} scale={[r, h, r * 0.6]} material={M.mat('grass', 6, 4, { color: '#6b8a56' })}><sphereGeometry args={[1, 20, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
        {[[-20, -105, 26, 30], [30, -110, 30, 36]].map(([x, z, r, h], k) => (
          <group key={`pk${k}`} position={[x, -2, z]}>
            <mesh material={M.mat('rock', 4, 4, { color: '#8a8890' })}><coneGeometry args={[r, h, 7]} /></mesh>
            <mesh position={[0, h * 0.3, 0]} material={M.plain('#f6f7fb', { roughness: 0.6 })}><coneGeometry args={[r * 0.42, h * 0.42, 7]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /** The other buildings of the square, shifted so that `self` stands at the origin facing +z (or the whole square when self is null). */
  function SquareNeighbours({ self, skip = [] }) {
    const me = self ? SQUARE[self] : null;
    const inner = (
      <group position={me ? [-me.p[0], 0, -me.p[2]] : [0, 0, 0]}>
        {Object.entries(SQUARE).map(([k, s]) => {
          if (k === self || skip.includes(k)) return null;
          const B = s.B;
          return <group key={k} position={s.p} rotation={[0, s.r, 0]}><B lite /></group>;
        })}
        <SquareScenery />
      </group>
    );
    return me ? <group rotation={[0, -me.r, 0]}>{inner}</group> : inner;
  }

  const Env = (self) => function SquareEnvOf() { return <SquareNeighbours self={self} />; };
  const mainOf = (Body, frame, props = {}) => function MainOf() { return (<group><Body {...props} /><Frame s={frame.s} p={frame.p || [0, frame.s[1] / 2, 0]} /></group>); };

  function SquareMain() {
    return (
      <group>
        <group scale={0.5} position={[-6, 0, 0]}>
          {Object.entries(SQUARE).map(([k, s]) => { const B = s.B; return <group key={k} position={s.p} rotation={[0, s.r, 0]}><B /></group>; })}
        </group>
        <Frame s={[22, 6.5, 17]} p={[0, 3.2, -1]} />
      </group>
    );
  }
  function SquareEnvMain() { return <group scale={0.5} position={[-6, 0, 0]}><SquareScenery /></group>; }

  const MajuMain = mainOf(MajuBody, { s: [15, 9.5, 15], p: [1.5, 4.75, 1.5] });
  const MajuEnv = Env('maju-dega');
  const JagMain = mainOf(JagBody, { s: [11, 6.6, 11], p: [0, 3.3, 0.5] });
  const KasthaMain = mainOf(KasthaBody, { s: [11, 6.8, 11], p: [0, 3.4, 0] });
  const TalejuMain = mainOf(TalejuBody, { s: [18, 10, 18], p: [0, 5, 0] });
  const KumariMain = mainOf(KumariBody, { s: [11, 5, 11], p: [0, 2.5, 0.8] });
  const HanumanMain = mainOf(HanumanBody, { s: [22, 9.4, 11], p: [3, 4.7, -1] });
  const KalMain = mainOf(KalBody, { s: [9, 6.2, 5], p: [0, 3.1, 0.5] });
  const AshokMain = mainOf(AshokBody, { s: [9, 3.4, 5], p: [-1, 1.7, 0.5] });

  /** y of each tier's wall base, and the apex of the top roof, replicating Pagoda's stacking. */
  function tierBases(base, tiers, sag = 1.2) {
    const ys = []; let y = base;
    tiers.forEach((t, i) => {
      ys.push(y);
      const rw = t.w + 2 * (t.ov ?? 0.9); const rd = t.d + 2 * (t.ov ?? 0.9);
      const nx = tiers[i + 1];
      if (nx) y = y + t.h - 0.04 + (t.rh ?? 0.8) * (1 - Math.max(nx.w / rw, nx.d / rd)) ** sag - 0.04;
      else ys.push(y + t.h - 0.04 + (t.rh ?? 0.8));
    });
    return ys;
  }

  /* ---------------- Budhanilkantha: the reclining black Vishnu on the coils of Shesha in his tank ---------------- */
  function BudhaMain() {
    const M = useM();
    const T = mats(M);
    const black = M.plain('#2a2b2e', { roughness: 0.32, metalness: 0.15 });
    const orange = M.plain('#e08a1c', { roughness: 0.9 });
    const marigold = M.plain('#f4a21e', { roughness: 0.9 });
    const stone = M.plain('#b8afa0', { roughness: 0.95 });
    const coils = [[0.26, 3.0, 1], [0.5, 2.7, 1], [0.74, 2.4, 1], [0.97, 2.0, 1]];
    const hoods = Array.from({ length: 11 }, (_, k) => k);
    const posts = useMemo(() => [[-5.1, -3.1], [5.1, -3.1], [-5.1, 3.1], [5.1, 3.1]].map(([x, z]) => ({ cyl: [0.09, 0.11, 3.3, 8], p: [x, 1.65, z] })), []);
    return (
      <group>
        {/* the stone tank */}
        {[[0, 3.35, 11.2, 0.55], [0, -3.35, 11.2, 0.55]].map(([x, z, w, d], k) => <Box key={k} s={[w, 0.6, d]} p={[x, 0.3, z]} m={stone} />)}
        {[[5.35, 0], [-5.35, 0]].map(([x, z], k) => <Box key={`e${k}`} s={[0.55, 0.6, 6.2]} p={[x, 0.3, z]} m={stone} />)}
        <Water w={10.2} d={6.2} p={[0, 0.34, 0]} color="#4a6a5a" />
        <Box s={[10.2, 0.1, 6.2]} p={[0, 0.02, 0]} m={M.plain('#2a3a38')} cast={false} />
        {/* the serpent's coils */}
        {coils.map(([y, s], k) => (
          <mesh key={k} position={[0, y, 0]} rotation={[PI / 2, 0, 0]} scale={[s * 1.15, s * 0.78, 1]} material={M.plain(k % 2 ? '#2c2d30' : '#34353a', { roughness: 0.4 })} castShadow>
            <torusGeometry args={[0.72, 0.27, 10, 28]} />
          </mesh>
        ))}
        <Ball rad={1} sc={[2.9, 0.5, 1.7]} p={[0, 0.4, 0]} m={black} />
        {/* Vishnu reclining, head to the right */}
        <group position={[0, 1.12, 0]}>
          <Cyl rt={0.2} rb={0.17} h={1.5} p={[-1.5, 0.12, -0.16]} r={[0, 0, PI / 2 + 0.05]} m={black} seg={12} />
          <Cyl rt={0.2} rb={0.17} h={1.5} p={[-1.4, 0.2, 0.2]} r={[0, 0.5, PI / 2]} m={black} seg={12} />
          <Box s={[1.5, 0.5, 1.0]} p={[-0.2, 0.17, 0]} m={black} />
          <Box s={[0.9, 0.42, 0.95]} p={[0.9, 0.3, 0]} m={black} />
          <Ball rad={0.36} p={[1.65, 0.45, 0]} m={black} />
          <mesh position={[1.7, 1.05, 0]} material={M.gold} castShadow><coneGeometry args={[0.26, 0.8, 12]} /></mesh>
          <Cyl rt={0.28} rb={0.3} h={0.14} p={[1.68, 0.62, 0]} m={M.gold} seg={14} />
          {[-1, 1].map((k) => <Cyl key={k} rt={0.09} rb={0.1} h={1.6} p={[0.4, 0.46, k * 0.62]} r={[0, 0, PI / 2 - 0.12 * k]} m={black} seg={8} />)}
          {[-1, 1].map((k) => <Cyl key={`a${k}`} rt={0.08} rb={0.09} h={1.4} p={[0.95, 0.5, k * 0.9]} r={[k * 0.5, 0, PI / 2]} m={black} seg={8} />)}
          <Cyl rt={0.28} h={0.05} p={[0.1, 0.5, 0.95]} r={[PI / 2, 0, 0]} m={M.gold} seg={16} />
          <Ball rad={0.13} p={[0.1, 0.5, -0.95]} sc={[1, 0.8, 1.4]} m={T.white} />
          <Box s={[1.7, 0.1, 1.15]} p={[0.05, 0.55, 0]} m={orange} cast={false} />
          <Box s={[0.2, 0.06, 1.0]} p={[1.0, 0.54, 0]} m={marigold} cast={false} />
          {Array.from({ length: 9 }, (_, k) => <Ball key={k} rad={0.075} p={[-0.7 + k * 0.28, 0.64 + (k % 2) * 0.02, (k % 3 - 1) * 0.1]} m={k % 2 ? marigold : orange} />)}
        </group>
        {/* the eleven hoods rising behind the head */}
        {hoods.map((k) => {
          const a = ((k - 5) / 5) * 1.15;
          return <group key={k} position={[1.95, 1.95 + Math.cos(a) * 0.55, Math.sin(a) * 1.2]} rotation={[0, 0, 0]}><Ball rad={0.2} sc={[0.55, 1.1, 0.9]} m={black} /></group>;
        })}
        {[...Array(5)].map((_, k) => <Ball key={`h${k}`} rad={0.3} sc={[1.2, 0.8, 1]} p={[1.6 + k * 0.04, 1.6, (k - 2) * 0.55]} m={black} />)}
        {/* corner posts, the yellow-and-red canopy and the wooden railing */}
        <Merged parts={posts} m={T.wood} />
        <group position={[0, 3.55, -2.0]} rotation={[-0.16, 0, 0]}>
          <Box s={[11.6, 0.05, 3.4]} p={[0, 0, 0]} m={M.plain('#f1b30e', { roughness: 0.9 })} cast />
          <Box s={[11.6, 0.3, 0.05]} p={[0, -0.15, 1.7]} m={T.red} cast={false} />
          {[5.8, -5.8].map((x) => <Box key={x} s={[0.05, 0.3, 3.4]} p={[x, -0.15, 0]} m={T.red} cast={false} />)}
        </group>
        <Fence w={10.6} d={6.8} h={0.85} color="#9a4a2a" />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 4.2, 0, 3.0]}>
            <Cyl rt={0.12} rb={0.15} h={1.9} p={[0, 0.95 + 0.6, 0]} m={stone} seg={10} />
            <mesh position={[0, 2.35, 0]} material={M.gold}><torusGeometry args={[0.22, 0.05, 8, 20]} /></mesh>
          </group>
        ))}
        <Frame s={[13, 4.4, 9]} p={[0, 2.2, 0]} />
      </group>
    );
  }
  function BudhaEnv() {
    const M = useM();
    const T = mats(M);
    const trees = useMemo(() => Array.from({ length: 26 }, (_, k) => {
      const a = -PI * 0.05 - (k / 25) * PI * 0.9;
      const r = 17 + (k % 4) * 3.5;
      return { p: [Math.cos(a) * r, 0, Math.sin(a) * r], s: 1.3 + (k % 3) * 0.4, kind: k % 3 === 0 ? 'broad' : 'pine' };
    }), []);
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 1]} receiveShadow material={M.mat('plaster', 10, 7, { color: '#e2d7c2' })}><planeGeometry args={[24, 17]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.mat('grass', 30, 30, { color: '#a8c07e' })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.mat('grass', 14, 10, { color: '#9cb872' })}><circleGeometry args={[40, 48]} /></mesh>
        {/* temple compound behind: white walls under a yellow railing, red-brick halls, a red-roofed shrine */}
        <Box s={[22, 1.5, 0.5]} p={[0, 0.75, -8.2]} m={T.white} />
        <Box s={[22, 0.4, 0.1]} p={[0, 1.75, -8.2]} m={M.plain('#e8b21a', { roughness: 0.6 })} />
        <group position={[-7, 0, -12]}><Townhouse p={[0, 0, 0]} w={5} d={3.4} storeys={2} tint="#e0805f" shop={false} /></group>
        <group position={[2, 0, -12.5]}>
          <Pagoda base={0} tiers={[{ w: 3.4, d: 3.4, h: 1.5, ov: 1.0, rh: 0.8, tint: '#e2886a' }, { w: 2.3, d: 2.3, h: 1.0, ov: 0.8, rh: 0.7, wall: 'plaster', door: false }]} roofM={M.plain('#b2352a', { roughness: 0.7 })} gs={0.8} />
        </group>
        <group position={[10, 0, -11]}><Townhouse p={[0, 0, 0]} w={4.4} d={3.2} storeys={3} plaster pc="#f3ead3" shop={false} /></group>
        {trees.map((t, i) => <Tree key={i} p={t.p} s={t.s} kind={t.kind} />)}
        <mesh position={[0, -4, -62]} scale={[75, 30, 38]} material={M.mat('grass', 8, 4, { color: '#5f8350' })}><sphereGeometry args={[1, 28, 12, 0, PI * 2, 0, PI / 2]} /></mesh>
        <mesh position={[-45, -4, -50]} scale={[40, 20, 26]} material={M.mat('grass', 6, 4, { color: '#6a8c56' })}><sphereGeometry args={[1, 24, 10, 0, PI * 2, 0, PI / 2]} /></mesh>
        <mesh position={[48, -4, -52]} scale={[40, 22, 26]} material={M.mat('grass', 6, 4, { color: '#628652' })}><sphereGeometry args={[1, 24, 10, 0, PI * 2, 0, PI / 2]} /></mesh>
        {ringOf(14, 21, (p, r, i) => (i % 2 ? <Townhouse key={i} p={p} r={r} w={3} d={2.4} storeys={2 + (i % 2)} plaster pc="#efe5c6" /> : null), (a) => a < PI * 0.15 || a > PI * 0.85)}
      </group>
    );
  }

  /* ---------------- Bagh Bhairab: the squat, very wide three-roofed temple of Kirtipur ---------------- */
  const BAGH_TIERS = [
    { w: 7.2, d: 5.4, h: 1.55, ov: 1.3, rh: 0.8, open: true, inner: true, gap: 1.05 },
    { w: 5.2, d: 3.8, h: 1.2, ov: 0.9, rh: 0.72, nw: 5, wall: 'timber', door: false },
    { w: 3.5, d: 2.5, h: 0.95, ov: 0.75, rh: 0.62, nw: 4, wall: 'timber', door: false },
  ];
  function BaghMain() {
    const M = useM();
    const T = mats(M);
    const grey = M.mat('granite', 1, 1, { color: '#8e887d' });
    const ys = tierBases(0.5, BAGH_TIERS, 1.1);
    const top = ys[ys.length - 1];
    const swords = useMemo(() => {
      const out = [];
      for (let k = 0; k < 14; k += 1) out.push({ s: [0.05, 0.85, 0.02], p: [-2.3 + k * 0.355, 0, 0], r: [0, 0, (k % 2 ? 0.18 : -0.18)] });
      return out;
    }, []);
    const y1 = ys[1];
    return (
      <group>
        <StepPlinth steps={2} w={12} d={10} stepH={0.25} inset={0.5} stairs={[0]} sw={3.2} />
        <Pagoda base={0.5} tiers={BAGH_TIERS} roofM={T.tile} sag={1.1} lift={0.07} finial={false} />
        {Array.from({ length: 5 }, (_, k) => <mesh key={k} position={[-0.9 + k * 0.45, top + 0.08, 0]} material={M.gold} castShadow><coneGeometry args={[0.07, 0.34, 8]} /></mesh>)}
        <Box s={[0.5, 0.35, 0.5]} p={[0, top - 0.05, 0]} m={T.wood} />
        {/* the old swords hung on the upper walls */}
        <group position={[0, y1 + 0.55, 5.2 / 2 - 0.62 + 0.02]}><Merged parts={swords.map((s) => ({ ...s, p: [s.p[0] * 0.8, 0, 0.0] }))} m={silver(M)} /></group>
        {[-1.8, -0.6, 0.6, 1.8].map((x) => <Cyl key={x} rt={0.17} h={0.05} p={[x, y1 + 0.78, 1.95]} r={[PI / 2, 0, 0]} m={silver(M)} seg={14} />)}
        {/* stone pillars, the small stone shikhara and the stone lion in the courtyard */}
        {[-3.8, 3.8].map((x) => <group key={x} position={[x, 0.5, 3.6]}><Box s={[0.5, 0.3, 0.5]} p={[0, 0.15, 0]} m={grey} /><Cyl rt={0.13} rb={0.17} h={2.4} p={[0, 1.5, 0]} m={grey} seg={10} /><Box s={[0.34, 0.14, 0.34]} p={[0, 2.75, 0]} m={grey} /></group>)}
        <group position={[-6.2, 0, 2.2]}><Box s={[1.1, 0.8, 1.1]} p={[0, 0.4, 0]} m={grey} /><Spire r0={0.55} h={1.5} y={0.8} m={grey} /></group>
        <group position={[5.8, 0.5, 4.2]} scale={1.6}><Lion m={grey} /></group>
        <Frame s={[14, 6.2, 12]} p={[0, 3.1, 0.5]} />
      </group>
    );
  }
  function BaghEnv() {
    const M = useM();
    const T = mats(M);
    const houses = useMemo(() => {
      const out = [];
      for (let k = 0; k < 7; k += 1) out.push({ p: [-11 + k * 3.8, 0, -10.5], r: 0, st: 3 + (k % 2) });
      for (let k = 0; k < 5; k += 1) out.push({ p: [-12.5, 0, -6 + k * 3.8], r: PI / 2, st: 2 + (k % 3) });
      for (let k = 0; k < 5; k += 1) out.push({ p: [12.5, 0, -6 + k * 3.8], r: -PI / 2, st: 3 });
      return out;
    }, []);
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('herring', 9, 8, { color: '#f0c0a6' })}><planeGeometry args={[27, 23]} /></mesh>
        <mesh position={[0, -9.02, 0]} material={M.mat('grass', 10, 4, { color: '#8aa462' })} receiveShadow><cylinderGeometry args={[19, 40, 18, 48]} /></mesh>
        <GroundDisc r={110} y={-18} m={M.mat('grass', 30, 30, { color: '#b8c890' })} />
        {[[-30, -14, 22, 14], [34, -20, 26, 10], [0, -30, 30, 8]].map(([x, z, w, d], k) => <mesh key={k} rotation={[-PI / 2, 0, 0]} position={[x, -17.9, z]} material={M.plain(['#c4b45a', '#7fa04a', '#a9b856'][k], { roughness: 1 })}><planeGeometry args={[w, d]} /></mesh>)}
        {houses.map((h, i) => <Townhouse key={i} p={h.p} r={h.r} w={3.5} d={2.5} storeys={h.st} plaster={i % 4 === 1} pc={i === 3 ? '#c9483a' : '#e6d4ae'} />)}
        <Townhouse p={[-12.5, 0, 14]} r={PI / 2} w={3.6} d={2.6} storeys={3} plaster pc="#c4443a" />
        <Tree p={[-9, 0, 8.5]} s={2.0} />
        <Tree p={[10.5, 0, 9]} s={1.8} />
        <Tree p={[13, 0, -8]} s={1.5} />
        {Array.from({ length: 14 }, (_, k) => { const a = 0.15 + (k / 13) * (PI * 0.7); return <Townhouse key={`s${k}`} p={[Math.cos(a) * 26, -4 - (k % 3) * 2.2, Math.sin(a) * 26 + 6]} r={-a + PI / 2} w={3} d={2.4} storeys={2 + (k % 2)} plaster={k % 3 === 0} />; })}
        {[[-60, -45, 40, 18], [30, -70, 60, 26]].map(([x, z, r, h], k) => <mesh key={`g${k}`} position={[x, -18, z]} scale={[r, h, r * 0.6]} material={M.mat('grass', 6, 4, { color: '#6b8a56' })}><sphereGeometry args={[1, 20, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
      </group>
    );
  }

  /* ---------------- Seto Machindranath: the gilded-roofed temple among stupas and bronze lions in Jana Bahal ---------------- */
  function BronzePillar({ p, s = 1 }) {
    const M = useM();
    const bronze = M.plain('#7a5a34', { metalness: 0.7, roughness: 0.4 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.35} rb={0.42} h={0.3} p={[0, 0.15, 0]} m={bronze} seg={12} />
        <Cyl rt={0.15} rb={0.2} h={2.0} p={[0, 1.3, 0]} m={bronze} seg={10} />
        <Ball rad={0.28} sc={[1, 0.6, 1]} p={[0, 2.35, 0]} m={bronze} />
        <Cyl rt={0.32} rb={0.1} h={0.18} p={[0, 2.55, 0]} m={bronze} seg={12} />
        <group position={[0, 2.62, 0]} scale={1.1}><K.Goddess m={M.gold} /></group>
      </group>
    );
  }
  function SetoMain() {
    const M = useM();
    const T = mats(M);
    const brass = M.plain('#b98f3a', { metalness: 0.8, roughness: 0.4 });
    const grey = M.mat('granite', 1, 1, { color: '#a49d90' });
    const roofGrey = M.plain('#8c9094', { metalness: 0.6, roughness: 0.5 });
    const posts = useMemo(() => {
      const out = []; const hw = 2.6; const hd = 2.6;
      [-hw, -hw / 3, hw / 3, hw].forEach((x) => out.push({ cyl: [0.09, 0.11, 1.8, 8], p: [x, 0.9, hd] }, { cyl: [0.09, 0.11, 1.8, 8], p: [x, 0.9, -hd] }));
      [-hd / 3, hd / 3].forEach((z) => out.push({ cyl: [0.09, 0.11, 1.8, 8], p: [hw, 0.9, z] }, { cyl: [0.09, 0.11, 1.8, 8], p: [-hw, 0.9, z] }));
      return out;
    }, []);
    const chai = useMemo(() => {
      const out = [];
      for (let k = 0; k < 4; k += 1) out.push([-6.2 + k * 1.1, 0, 3.4 - (k % 2) * 0.3], [6.2 - k * 1.1, 0, 3.0 + (k % 2) * 0.3]);
      for (let k = 0; k < 5; k += 1) out.push([-5.4 + k * 2.7, 0, -5.4 + (k % 2) * 0.5]);
      out.push([-6.4, 0, -1], [-6.4, 0, 1.2], [6.4, 0, -1.2], [6.4, 0, 0.9]);
      return out;
    }, []);
    return (
      <group>
        <Box s={[7, 0.3, 7]} p={[0, 0.15, 0]} m={M.stone} />
        <Pagoda base={0.3} tiers={[{ w: 3.6, d: 3.6, h: 1.8, ov: 1.4, rh: 0.8, wall: 'dark', door: false, windows: false }, { w: 2.3, d: 2.3, h: 1.0, ov: 0.95, rh: 0.7, wall: 'gold', door: false, windows: false }]} roofM={brass} gs={0.9} fringe={false} />
        <Merged parts={posts} m={T.wood} />
        {/* gilded front with torana */}
        <Box s={[2.5, 1.5, 0.08]} p={[0, 1.05, 1.86]} m={M.gold} cast={false} />
        <Box s={[1.0, 1.1, 0.1]} p={[0, 0.85, 1.9]} m={M.plain('#2a1810')} cast={false} />
        <mesh position={[0, 1.55, 1.92]} material={M.gold}><torusGeometry args={[0.62, 0.07, 8, 24, PI]} /></mesh>
        <Box s={[3.2, 0.14, 0.06]} p={[0, 2.12, 1.86]} m={M.gold} cast={false} />
        {Array.from({ length: 14 }, (_, k) => <Box key={k} s={[0.1, 0.2, 0.02]} p={[-1.5 + k * 0.23, 2.0, 1.88]} m={M.gold} cast={false} />)}
        {/* bronze lions and pillars */}
        {[-1, 1].map((k) => <group key={k} position={[k * 1.7, 0.3, 4.2]}><Box s={[0.9, 0.35, 1.0]} p={[0, 0.17, 0]} m={grey} /><group position={[0, 0.35, 0]} scale={1.7}><Lion m={M.plain('#7a5a34', { metalness: 0.7, roughness: 0.4 })} /></group></group>)}
        <BronzePillar p={[-3.6, 0.3, 4.4]} s={1.15} />
        <BronzePillar p={[3.6, 0.3, 4.4]} s={1.15} />
        <BronzePillar p={[-4.6, 0.3, -2.4]} />
        {/* many small stone chaityas and two copper-roofed shrines */}
        {chai.map((p, i) => <K.Chaitya key={i} p={p} s={0.8 + (i % 3) * 0.12} />)}
        {[[-5.0, -3.4], [5.0, -3.6]].map(([x, z], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[1.3, 0.3, 1.3]} p={[0, 0.15, 0]} m={grey} />
            <Pagoda base={0.3} tiers={[{ w: 0.8, d: 0.8, h: 0.95, ov: 0.45, rh: 0.5, tint: '#e0a88c', door: false, windows: false }]} roofM={roofGrey} gs={0.35} fringe={false} />
          </group>
        ))}
        {/* wooden gateway arch */}
        <group position={[0, 0, 7.4]}>
          {[-1.7, 1.7].map((x) => <Box key={x} s={[0.34, 3.2, 0.34]} p={[x, 1.6, 0]} m={T.wood} />)}
          <mesh position={[0, 2.5, 0]} material={T.wood} castShadow><torusGeometry args={[1.7, 0.16, 8, 24, PI]} /></mesh>
          <Box s={[4.2, 0.2, 0.3]} p={[0, 3.25, 0]} m={T.wood} />
        </group>
        <Frame s={[16, 6.4, 17]} p={[0, 3.2, 1.6]} />
      </group>
    );
  }
  function SetoEnv() {
    const M = useM();
    const houses = useMemo(() => {
      const out = [];
      for (let k = 0; k < 7; k += 1) out.push({ p: [-11 + k * 3.7, 0, -11.5], r: 0, st: 3 + (k % 2) });
      for (let k = 0; k < 6; k += 1) out.push({ p: [-12.5, 0, -7 + k * 3.7], r: PI / 2, st: 3 + (k % 3 === 0 ? 1 : 0) });
      for (let k = 0; k < 6; k += 1) out.push({ p: [12.5, 0, -7 + k * 3.7], r: -PI / 2, st: 3 + (k % 2) });
      for (let k = 0; k < 7; k += 1) if (k !== 3) out.push({ p: [-11 + k * 3.7, 0, 12.5], r: PI, st: 3 + (k % 2) });
      return out;
    }, []);
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.mat('plaster', 10, 10, { color: '#e0d5c0' })}><planeGeometry args={[28, 27]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.mat('plaster', 30, 30, { color: '#d6ccb8' })} />
        {houses.map((h, i) => <Townhouse key={i} p={h.p} r={h.r} w={3.4} d={2.5} storeys={h.st} plaster={i % 5 === 2} pc="#e2d8c4" tint={['#f0c2a8', '#e4a98c', '#e9b9a0'][i % 3]} shop={i % 2 === 0} />)}
        {[[-20, -14], [-19, 6], [20, -12], [21, 9], [-4, -22], [8, -23], [-3, 23], [9, 24]].map(([x, z], k) => <Townhouse key={`o${k}`} p={[x, 0, z]} r={k} w={4} d={3} storeys={4 + (k % 2)} plaster pc={['#d8d0c4', '#e6dcc0', '#cdd3d1'][k % 3]} neo />)}
      </group>
    );
  }

  /* ---------------- Rani Pokhari: the Queen's Pond with its white shikhara temple on a causeway ---------------- */
  function RaniMain() {
    return (
      <group>
        <group scale={0.62}><RaniInner /></group>
        <Frame s={[19, 4.6, 15]} p={[0, 2.3, 0.9]} />
      </group>
    );
  }
  function RaniInner() {
    const M = useM();
    const T = mats(M);
    const red = M.mat('brick', 8, 1, { color: '#e8a58a' });
    const W = 28; const D = 22;
    const arches = useMemo(() => {
      const out = [];
      for (let k = 0; k < 18; k += 1) { const x = -W / 2 + 1 + (k * (W - 2)) / 17; out.push({ s: [0.5, 0.55, 0.05], p: [x, 0.5, -D / 2 + 0.3] }, { s: [0.5, 0.55, 0.05], p: [x, 0.5, D / 2 - 0.3] }); }
      for (let k = 0; k < 13; k += 1) { const z = -D / 2 + 1 + (k * (D - 2)) / 12; out.push({ s: [0.05, 0.55, 0.5], p: [W / 2 - 0.3, 0.5, z] }, { s: [0.05, 0.55, 0.5], p: [-W / 2 + 0.3, 0.5, z] }); }
      return out;
    }, []);
    const rail = useMemo(() => {
      const out = []; const n = 40;
      for (let k = 0; k <= n; k += 1) out.push({ cyl: [0.04, 0.05, 0.5, 6], p: [-W / 2 + (k * W) / n, 1.25, D / 2 + 0.35] });
      out.push({ s: [W, 0.07, 0.1], p: [0, 1.52, D / 2 + 0.35] });
      return out;
    }, []);
    const elephantArch = useMemo(() => [{ s: [0.8, 1.7, 1.5], p: [-1.3, 0.85, 0] }, { s: [0.8, 1.7, 1.5], p: [1.3, 0.85, 0] }, { s: [3.4, 0.5, 1.5], p: [0, 1.95, 0] }], []);
    const hexPosts = useMemo(() => Array.from({ length: 6 }, (_, k) => ({ cyl: [0.08, 0.09, 1.6, 8], p: [Math.cos((k / 6) * PI * 2) * 1.2, 0.8, Math.sin((k / 6) * PI * 2) * 1.2] })), []);
    return (
      <group>
        {/* embankment walls with arched niches */}
        {[[0, D / 2 + 0.2, W + 1.2, 0.8], [0, -D / 2 - 0.2, W + 1.2, 0.8]].map(([x, z, w, d], k) => <Box key={k} s={[w, 1.2, d]} p={[x, 0.6, z]} m={red} />)}
        {[[W / 2 + 0.2, 0], [-W / 2 - 0.2, 0]].map(([x, z], k) => <Box key={`e${k}`} s={[0.8, 1.2, D]} p={[x, 0.6, z]} m={red} />)}
        {[[0, D / 2 + 0.2, W + 1.3], [0, -D / 2 - 0.2, W + 1.3]].map(([x, z, w], k) => <Box key={`c${k}`} s={[w, 0.1, 0.95]} p={[x, 1.24, z]} m={M.plain('#efe6d6')} cast={false} />)}
        <Merged parts={arches} m={T.dark} cast={false} />
        <Merged parts={rail} m={T.white} cast={false} />
        <Water w={W} d={D} p={[0, 0.12, 0]} color="#3f7567" />
        {/* the causeway to the south bank */}
        <Box s={[1.6, 0.5, 8.6]} p={[0, 0.3, 6.4]} m={T.white} />
        {[-0.75, 0.75].map((x) => <Box key={x} s={[0.12, 0.45, 8.6]} p={[x, 0.8, 6.4]} m={T.white} cast={false} />)}
        {/* the central Shiva temple, shikhara style */}
        <group position={[0, 0, 1.8]} scale={1.25}>
          {[3.9, 3.4].map((s, k) => <Box key={k} s={[s, 0.3, s]} p={[0, 0.15 + k * 0.3, 0]} m={T.white} />)}
          <Box s={[2.2, 1.5, 2.2]} p={[0, 1.35, 0]} m={T.white} />
          <Box s={[2.4, 0.15, 2.4]} p={[0, 2.18, 0]} m={T.white} />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => (
            <group key={`${a}${b}`} position={[a * 1.45, 0.6, b * 1.45]}>
              {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([c, d]) => <Cyl key={`${c}${d}`} rt={0.04} h={0.6} p={[c * 0.2, 0.3, d * 0.2]} m={T.white} seg={6} />)}
              <Ball rad={0.3} sc={[1, 0.8, 1]} p={[0, 0.65, 0]} m={T.white} />
              <mesh position={[0, 1.0, 0]} material={M.gold}><coneGeometry args={[0.04, 0.2, 6]} /></mesh>
            </group>
          ))}
          <Box s={[0.9, 1.05, 0.06]} p={[0, 1.2, 1.12]} m={M.plain('#3a2a20')} cast={false} />
          <mesh position={[0, 1.78, 1.14]} material={T.white}><torusGeometry args={[0.5, 0.07, 8, 20, PI]} /></mesh>
          <Spire r0={1.15} h={4.2} y={2.25} m={T.white} />
          <Gajur y={6.45} s={0.55} />
        </group>
        {/* stone elephant carrying the figures of Pratap Malla and his sons, on the south bank */}
        <group position={[7.8, 0, D / 2 + 0.2]}>
          <Merged parts={elephantArch} m={M.mat('granite', 1, 1, { color: '#d6cdbc' })} />
          <group position={[0, 2.2, 0]} scale={2.9}><Elephant m={M.mat('granite', 1, 1, { color: '#c9c0af' })} /></group>
          {[-0.5, 0, 0.5].map((x, k) => <group key={k} position={[x, 3.5 + (k === 1 ? 0.1 : 0), 0]}><Cyl rt={0.1} rb={0.13} h={0.38} p={[0, 0, 0]} m={M.plain('#8a6a30', { metalness: 0.5 })} seg={8} /><Ball rad={0.1} p={[0, 0.28, 0]} m={M.plain('#8a6a30', { metalness: 0.5 })} /></group>)}
        </group>
        {/* the old round rest house beside it */}
        <group position={[-8.5, 0, D / 2 + 1.1]}>
          <Cyl rt={1.45} h={0.22} p={[0, 0.11, 0]} m={M.stone} seg={6} />
          <group position={[0, 0.22, 0]}>
            <Merged parts={hexPosts} m={T.wood} />
            <mesh position={[0, 2.0, 0]} material={T.tile} castShadow><coneGeometry args={[2.1, 1.0, 6]} /></mesh>
            <Ball rad={0.1} p={[0, 2.55, 0]} m={M.gold} />
          </group>
        </group>
      </group>
    );
  }
  function RaniEnv() {
    const M = useM();
    const blocks = useMemo(() => {
      const out = []; let i = 0;
      const pcs = ['#efe3b8', '#dedcd4', '#f2e8d0', '#d7d2c4', '#e8d8a0'];
      for (let k = 0; k < 9; k += 1) out.push({ p: [-26 + k * 6.6, 0, -24], r: 0, i: i++ });
      for (let k = 0; k < 8; k += 1) out.push({ p: [-26 + k * 6.6, 0, 28], r: PI, i: i++ });
      for (let k = 0; k < 6; k += 1) out.push({ p: [-24, 0, -18 + k * 7], r: PI / 2, i: i++ });
      for (let k = 0; k < 6; k += 1) out.push({ p: [24, 0, -18 + k * 7], r: -PI / 2, i: i++ });
      return out.map((b) => ({ ...b, pc: pcs[b.i % 5], st: 3 + (b.i % 3) }));
    }, []);
    return (
      <group scale={0.62}>
        <GroundDisc r={100} y={-0.04} m={M.mat('grass', 30, 30, { color: '#b2c586' })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 2]} receiveShadow material={M.mat('grass', 12, 10, { color: '#a6c07a' })}><planeGeometry args={[40, 34]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.015, 2]} material={M.plain('#5a5a5e', { roughness: 0.95 })}><ringGeometry args={[22, 25.5, 4, 1, PI / 4]} /></mesh>
        {blocks.map((b) => <Townhouse key={b.i} p={b.p} r={b.r} w={5} d={3.4} storeys={b.st} plaster pc={b.pc} neo shop={b.i % 2 === 0} />)}
        {Array.from({ length: 22 }, (_, k) => { const a = (k / 22) * PI * 2; return <Tree key={k} p={[Math.cos(a) * 19.5 * 1.1, 0, Math.sin(a) * 16.2 + 2]} s={1.6 + (k % 3) * 0.3} />; })}
        {/* Ghantaghar clock tower at the south-west corner */}
        <group position={[-22, 0, 14]}>
          <Box s={[2.2, 9, 2.2]} p={[0, 4.5, 0]} m={M.plain('#f1ede4', { roughness: 0.85 })} />
          <Box s={[2.5, 0.25, 2.5]} p={[0, 9.1, 0]} m={M.plain('#f1ede4')} />
          {[0, 1, 2, 3].map((k) => <mesh key={k} position={[Math.sin((k * PI) / 2) * 1.12, 8.0, Math.cos((k * PI) / 2) * 1.12]} rotation={[0, (k * PI) / 2, 0]} material={M.plain('#faf7ef')}><circleGeometry args={[0.7, 20]} /></mesh>)}
          <mesh position={[0, 10.1, 0]} material={M.plain('#8a8a8a', { metalness: 0.5, roughness: 0.5 })}><coneGeometry args={[1.4, 1.8, 4]} /></mesh>
        </group>
        {[[-60, -70, 52, 18], [20, -78, 70, 22], [70, -60, 40, 14]].map(([x, z, r, h], k) => <mesh key={k} position={[x, -2, z]} scale={[r, h, r * 0.55]} material={M.mat('grass', 6, 4, { color: '#6b8a58' })}><sphereGeometry args={[1, 20, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
        {[[-30, -100, 28, 34], [10, -108, 34, 42], [50, -98, 26, 30]].map(([x, z, r, h], k) => (
          <group key={`pk${k}`} position={[x, -2, z]}>
            <mesh material={M.mat('rock', 4, 4, { color: '#8a8890' })}><coneGeometry args={[r, h, 7]} /></mesh>
            <mesh position={[0, h * 0.3, 0]} material={M.plain('#f6f7fb', { roughness: 0.6 })}><coneGeometry args={[r * 0.42, h * 0.42, 7]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  /* ---------------- Dharahara: the rebuilt 72 m white tower: a tall, gently tapering round shaft, bands of ring ledges,
                        the round viewing balcony with its railing, a white dome and a slim spire ---------------- */
  function DharaMain() {
    const M = useM();
    const T = mats(M);
    const R0 = 1.6; const R1 = 1.2; const y0 = 0.5; const y1 = 17.6;
    const rAt = (y) => R0 + ((R1 - R0) * (y - y0)) / (y1 - y0);
    const shaft = useMemo(() => {
      const pts = [];
      for (let i = 0; i <= 20; i += 1) { const y = y0 + ((y1 - y0) * i) / 20; pts.push(new THREE.Vector2(rAt(y) + 0.04 * Math.sin((i / 20) * PI), y)); }
      return new THREE.LatheGeometry(pts, 28);
    }, []); // eslint-disable-line
    const rings = useMemo(() => {
      const out = [];
      for (let k = 0; k < 9; k += 1) { const y = 2.3 + k * 1.85; out.push({ cyl: [rAt(y) + 0.13, rAt(y) + 0.13, 0.2, 28], p: [0, y, 0] }, { cyl: [rAt(y) + 0.08, rAt(y) + 0.08, 0.1, 28], p: [0, y + 0.17, 0] }); }
      return out;
    }, []); // eslint-disable-line
    const slits = useMemo(() => {
      const out = [];
      for (let k = 0; k < 9; k += 1) { const y = 3.2 + k * 1.85; for (let j = 0; j < 4; j += 1) { const a = (j * PI) / 2 + (k % 2) * 0.4; const r = rAt(y) + 0.05; out.push({ s: [0.22, 0.4, 0.07], p: [Math.sin(a) * r, y, Math.cos(a) * r], r: [0, a, 0] }); } }
      return out;
    }, []); // eslint-disable-line
    const rail = useMemo(() => {
      const out = [];
      for (let k = 0; k < 28; k += 1) { const a = (k / 28) * PI * 2; out.push({ cyl: [0.03, 0.03, 0.55, 5], p: [Math.cos(a) * 1.85, 18.2, Math.sin(a) * 1.85] }); }
      out.push({ cyl: [1.86, 1.86, 0.06, 28], p: [0, 18.5, 0] });
      return out;
    }, []);
    return (
      <group>
        <Cyl rt={3.4} rb={3.7} h={0.5} p={[0, 0.25, 0]} m={M.stone} seg={8} />
        <Cyl rt={2.4} rb={2.6} h={0.2} p={[0, 0.58, 0]} m={M.stone} seg={8} />
        {[0, 1, 2, 3].map((k) => <Box key={k} s={[1.8 - k * 0.1, 0.16, 0.5]} p={[0, 0.08 + k * 0.16, 2.0 + 1.35 - k * 0.38 + 0.2]} m={M.stone} />)}
        <Box s={[1.5, 1.7, 1.0]} p={[0, 1.4, 1.75]} m={T.white} />
        <Box s={[0.7, 1.1, 0.06]} p={[0, 1.1, 2.27]} m={T.dark} cast={false} />
        <mesh position={[0, 1.65, 2.27]} material={T.dark}><circleGeometry args={[0.35, 16, 0, PI]} /></mesh>
        <Box s={[1.7, 0.12, 1.2]} p={[0, 2.3, 1.75]} m={T.white} />
        <mesh geometry={shaft} material={M.plain('#f6f3ec', { roughness: 0.8 })} castShadow receiveShadow />
        <Merged parts={rings} m={M.plain('#f1ede3', { roughness: 0.8 })} />
        <Merged parts={slits} m={T.dark} cast={false} />
        {/* the viewing balcony and the upper drum */}
        <Cyl rt={1.95} rb={1.55} h={0.35} p={[0, 17.8, 0]} m={M.plain('#f1ede3')} seg={28} />
        <Merged parts={rail} m={M.plain('#f6f3ec')} cast={false} />
        <Cyl rt={1.22} rb={1.2} h={1.2} p={[0, 18.8, 0]} m={M.plain('#f6f3ec', { roughness: 0.8 })} seg={28} />
        {Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * PI * 2; return <Box key={k} s={[0.16, 0.34, 0.05]} p={[Math.sin(a) * 1.22, 18.85, Math.cos(a) * 1.22]} r={[0, a, 0]} m={T.dark} cast={false} />; })}
        <Cyl rt={1.42} rb={1.42} h={0.16} p={[0, 19.5, 0]} m={M.plain('#f1ede3')} seg={28} />
        <mesh position={[0, 19.55, 0]} scale={[1, 0.85, 1]} material={M.plain('#f8f5ee', { roughness: 0.75 })} castShadow><sphereGeometry args={[1.28, 28, 14, 0, PI * 2, 0, PI / 2]} /></mesh>
        <Cyl rt={0.14} rb={0.2} h={0.3} p={[0, 20.75, 0]} m={M.plain('#f1ede3')} seg={10} />
        <mesh position={[0, 21.4, 0]} material={M.plain('#e8e2d4', { metalness: 0.4, roughness: 0.4 })}><coneGeometry args={[0.06, 1.0, 8]} /></mesh>
        <Ball rad={0.1} p={[0, 21.0, 0]} m={M.gold} />
        <Frame s={[9, 22.4, 9]} p={[0, 11.2, 0]} />
      </group>
    );
  }
  function DharaEnv() {
    const M = useM();
    const blocks = useMemo(() => {
      const out = []; let i = 0;
      const cols = ['#e9c8a0', '#c4d4e4', '#e6e0b8', '#d9a58a', '#c9d9c0', '#e8e0d4', '#b9cfe6', '#e0b8a8'];
      const ring = (n, r0, rj) => { for (let k = 0; k < n; k += 1) { const a = (k / n) * PI * 2 + 0.2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - PI / 2) < 0.38) continue; const r = r0 + ((k * 7) % 5) * rj; out.push({ p: [Math.cos(a) * r, 0, Math.sin(a) * r], r: -a + PI / 2, st: 3 + ((k * 5 + i) % 4), pc: cols[(k + i) % 8], i: i++ }); } };
      ring(15, 11.5, 0.8); ring(20, 18, 1.3); ring(22, 25, 1.6);
      return out;
    }, []);
    return (
      <group>
        <GroundDisc r={9.5} m={M.mat('granite', 6, 6, { color: '#efe3cf' })} />
        <GroundDisc r={100} y={-0.04} m={M.mat('plaster', 30, 30, { color: '#d2c9b6' })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 10]}><ringGeometry args={[9.5, 11, 32, 1, 0, 2 * PI]} /><meshStandardMaterial color="#5a5a5e" roughness={0.95} /></mesh>
        {blocks.map((b) => <Townhouse key={b.i} p={b.p} r={b.r} w={3.6 + (b.i % 3) * 0.5} d={2.8} storeys={b.st} plaster pc={b.pc} neo shop={b.i % 2 === 0} />)}
        {[[-7, 7], [7.5, 6.5], [-8, -3], [8, -4]].map(([x, z], k) => <Tree key={k} p={[x, 0, z]} s={1.4} />)}
        {[[-70, -75, 60, 24], [10, -85, 80, 28], [75, -70, 55, 22]].map(([x, z, r, h], k) => <mesh key={k} position={[x, -3, z]} scale={[r, h, r * 0.55]} material={M.mat('grass', 6, 4, { color: '#4d6e4a' })}><sphereGeometry args={[1, 22, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
        {[[-55, -110, 30, 36], [-15, -118, 36, 46], [28, -115, 32, 40], [62, -108, 28, 32]].map(([x, z, r, h], k) => (
          <group key={`pk${k}`} position={[x, -2, z]}>
            <mesh material={M.mat('rock', 4, 4, { color: '#8e8c94' })}><coneGeometry args={[r, h, 7]} /></mesh>
            <mesh position={[0, h * 0.28, 0]} material={M.plain('#f8f9fc', { roughness: 0.6 })}><coneGeometry args={[r * 0.5, h * 0.46, 7]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  return {
    'kathmandu-durbar-square': { Main: SquareMain, Env: SquareEnvMain },
    'maju-dega': { Main: MajuMain, Env: MajuEnv },
    'jagannath-temple': { Main: JagMain, Env: Env('jagannath-temple') },
    kasthamandap: { Main: KasthaMain, Env: Env('kasthamandap') },
    'taleju-temple': { Main: TalejuMain, Env: Env('taleju-temple') },
    'kumari-ghar': { Main: KumariMain, Env: Env('kumari-ghar') },
    'hanuman-dhoka-palace': { Main: HanumanMain, Env: Env('hanuman-dhoka-palace') },
    'kal-bhairav': { Main: KalMain, Env: Env('kal-bhairav') },
    'ashok-binayak': { Main: AshokMain, Env: Env('ashok-binayak') },
    budhanilkantha: { Main: BudhaMain, Env: BudhaEnv },
    'bagh-bhairab-kirtipur': { Main: BaghMain, Env: BaghEnv },
    'seto-machindranath': { Main: SetoMain, Env: SetoEnv },
    'rani-pokhari': { Main: RaniMain, Env: RaniEnv },
    dharahara: { Main: DharaMain, Env: DharaEnv },
  };
}
