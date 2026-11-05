// Hand-built landmarks: Kathmandu Durbar Square and the sites in and around it.
import { useMemo } from 'react';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Gajur, Spire, Lion, Tree, Trident, Diyo, Frame, Water, GroundDisc, ringOf, curvedRoofGeometry, THREE, PillarStatue, Elephant, Chaitya, SacredTree } = K;
  const PI = Math.PI;
  const TILE = '#b98f72';

  /* ---------------- generic helpers ---------------- */
  /** Merge many boxes / cylinders into one geometry (one draw call). Parts: {s,p,r} box or {cyl:[rt,rb,h,seg],p,r}. */
  function mergeParts(list) {
    const pos = []; const nor = []; const uv = []; const idx = [];
    let off = 0;
    const e = new THREE.Euler(0, 0, 0, 'YXZ'); const q = new THREE.Quaternion(); const v = new THREE.Vector3();
    const sc = new THREE.Vector3(1, 1, 1); const mtx = new THREE.Matrix4();
    for (const b of list) {
      let g;
      if (b.cyl) g = new THREE.CylinderGeometry(b.cyl[0], b.cyl[1], b.cyl[2], b.cyl[3] || 8, 1, false, b.cyl[4] ?? 0, b.cyl[5] ?? PI * 2);
      else if (b.ball) { g = new THREE.SphereGeometry(b.ball[0], 12, 9); if (b.sc) g.scale(b.sc[0], b.sc[1], b.sc[2]); }
      else if (b.cone) g = new THREE.ConeGeometry(b.cone[0], b.cone[1], b.cone[2] || 8);
      else g = new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]);
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
    red: M.plain('#9c2a24', { roughness: 0.75 }),
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
        {fringe && <Merged parts={parts} m={M.plain('#8f2b24', { roughness: 0.75 })} cast={false} />}
      </group>
    );
  }

  /**
   * Newar pagoda from a list of tiers {w,d,h(wall),ov(eave overhang),rh(roof rise),open,wall,nw,door}. Faces +z.
   * Each wall sits exactly on the slope of the roof below it, so the tiers never float.
   */
  function Pagoda({ base = 0, tiers, roofM, finial = true, gs = 1, sag = 1.2, lift = 0.09, fringe = true, tint = '#f0c2a8', lite = false, doorGold = false, deco = null }) {
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
      if (deco) out.push(<group key={`dc${i}`}>{deco(i, y, t)}</group>);
      if (t.struts !== false) out.push(<Struts key={`st${i}`} w={w} d={d} y={y + h} nx={Math.max(3, Math.round(w / 0.8))} nz={Math.max(3, Math.round(d / 0.8))} h={0.45 + ov * 0.2} />);
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
  function Townhouse({ p, r = 0, w = 2.4, d = 2, storeys = 3, plaster = false, tint = '#f0c2a8', pc = '#ece3d2', shop = true, neo = false, ornate = false }) {
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
        {ornate ? <Details build={(b) => { for (let s = shop ? 1 : 0; s < storeys; s += 1) cWin(b, [0, s * sh + sh * 0.5, d / 2 + 0.01], 0, { n: 2, ow: 0.36, oh: 0.4, g: 0.1, lite: true }); }} /> : <Windows list={wl} />}
        <Rf w={w + 0.5} d={d + 0.5} h={0.5 + storeys * 0.05} y={sh * storeys} m={neo ? T.tileDark : T.tile} sag={1.15} lift={0.05} fringe={false} />
      </group>
    );
  }

  /* ---------------- detail kit: carved windows, strut brackets, guardian lions, stone chaityas ----------------
     Every detail is pushed into a "bag" of part lists keyed by material, then drawn as one merged mesh per material. */
  const PALC = (M) => ({
    wood: M.plain('#5a3418', { roughness: 0.8 }),
    dark: M.plain('#120a05', { roughness: 0.9 }),
    bar: M.plain('#a4743f', { roughness: 0.75 }),
    rel: M.plain('#7d4b27', { roughness: 0.8 }),
    ink: M.plain('#2b180c', { roughness: 0.85 }),
    red: M.plain('#a3281f', { roughness: 0.75 }),
    gold: M.gold,
    silver: M.plain('#d4d6da', { metalness: 0.9, roughness: 0.28 }),
    white: M.plain('#f4f0e8', { roughness: 0.85 }),
    wfr: M.plain('#ece6d8', { roughness: 0.85 }),
    stone: M.plain('#8f897f', { roughness: 0.95 }),
    stoneD: M.plain('#5a5550', { roughness: 0.95 }),
    stoneL: M.plain('#b9b2a4', { roughness: 0.95 }),
    bronze: M.plain('#7a5a34', { metalness: 0.7, roughness: 0.4 }),
    brass: M.plain('#c9993a', { metalness: 0.85, roughness: 0.35 }),
    blue: M.plain('#274a8c', { roughness: 0.6 }),
    teal: M.plain('#2f7d86', { roughness: 0.6 }),
    orange: M.plain('#e0661c', { roughness: 0.7 }),
    marigold: M.plain('#f2a51d', { roughness: 0.85 }),
    black: M.plain('#1a1717', { roughness: 0.5 }),
    skin: M.plain('#c8321f', { roughness: 0.6 }),
    brick: M.plain('#b86a50', { roughness: 0.9 }),
    lb_wh: M.plain('#f2eee6', { roughness: 0.8 }),
    lm_wh: M.plain('#b8281f', { roughness: 0.75 }),
    lb_st: M.plain('#7a756e', { roughness: 0.95 }),
    lm_st: M.plain('#5c5852', { roughness: 0.95 }),
    lb_br: M.plain('#7a5a34', { metalness: 0.7, roughness: 0.4 }),
    lm_br: M.plain('#93703c', { metalness: 0.7, roughness: 0.4 }),
  });
  /** Push local-frame parts into bag[k], moved to p, yawed about y and scaled by s. */
  const put = (bag, k, parts, p = [0, 0, 0], yaw = 0, s = 1) => {
    const list = bag[k] || (bag[k] = []);
    parts.forEach((b) => {
      const r = b.r || [0, 0, 0];
      const o = { p: at(p, yaw, b.p[0] * s, b.p[1] * s, b.p[2] * s), r: [r[0], r[1] + yaw, r[2]] };
      if (b.s) o.s = [b.s[0] * s, b.s[1] * s, b.s[2] * s];
      if (b.cyl) o.cyl = [b.cyl[0] * s, b.cyl[1] * s, b.cyl[2] * s, b.cyl[3], b.cyl[4], b.cyl[5]];
      if (b.ball) { o.ball = [b.ball[0] * s]; o.sc = b.sc; }
      if (b.cone) o.cone = [b.cone[0] * s, b.cone[1] * s, b.cone[2]];
      list.push(o);
    });
  };
  function Bag({ bag, cast = false }) {
    const M = useM();
    const P = useMemo(() => PALC(M), [M]);
    return <group>{Object.entries(bag).map(([k, parts]) => (P[k] && parts.length ? <Merged key={k} parts={parts} m={P[k]} cast={cast} /> : null))}</group>;
  }
  /** Build a bag once (build(bag) fills it) and draw it. */
  function Details({ build, cast = false }) {
    const bag = useMemo(() => { const b = {}; build(b); return b; }, []); // eslint-disable-line
    return <Bag bag={bag} cast={cast} />;
  }
  const hbox = (x, y, z, sx, sy, sz) => ({ s: [sx, sy, sz], p: [x, y, z] });
  const halfDisc = (x, y, z, r, t) => ({ cyl: [r, r, t, 16, PI / 2, PI], p: [x, y, z], r: [PI / 2, 0, 0] });

  /** One carved Newar window group (n openings under carved arches, stepped cornice, sill with dentils). p = centre of the openings, faces +z. */
  function cWin(bag, p, yaw, { n = 1, ow = 0.5, oh = 0.62, g = 0.12, arch = true, fk = 'wood', s = 1, lite = false } = {}) {
    const W = n * ow + (n + 1) * g;
    const ah = arch && !lite ? ow * 0.62 : 0;
    const fr = []; const dk = []; const bar = []; const rel = [];
    fr.push(hbox(0, ah / 2, 0, W + 0.16, oh + 0.2 + ah, 0.07));
    fr.push(hbox(0, oh / 2 + ah + 0.15, 0.04, W + 0.34, 0.07, 0.15));
    fr.push(hbox(0, -oh / 2 - 0.1, 0.05, W + 0.26, 0.07, 0.16));
    if (!lite) {
      fr.push(hbox(0, oh / 2 + ah + 0.23, 0.03, W + 0.2, 0.07, 0.11));
      const nd = Math.round(W / 0.1);
      for (let k = 0; k < nd; k += 1) rel.push(hbox(-W / 2 + ((k + 0.5) * W) / nd, -oh / 2 - 0.17, 0.07, 0.05, 0.06, 0.07));
    }
    for (let k = 0; k < n; k += 1) {
      const cx = -W / 2 + g + ow / 2 + k * (ow + g);
      dk.push(hbox(cx, 0, 0.045, ow, oh, 0.05));
      if (!lite) {
        const nb = Math.max(3, Math.round(ow / 0.085));
        for (let j = 0; j < nb; j += 1) bar.push(hbox(cx - ow / 2 + ((j + 0.5) * ow) / nb, 0, 0.075, 0.017, oh * 0.97, 0.03));
        bar.push(hbox(cx, oh * 0.12, 0.08, ow, 0.022, 0.03));
        if (ah) {
          rel.push(halfDisc(cx, oh / 2, 0.058, ow * 0.62, 0.05));
          dk.push(halfDisc(cx, oh / 2, 0.088, ow * 0.44, 0.03));
          rel.push({ cone: [0.045, 0.2, 5], p: [cx, oh / 2 + ow * 0.62 + 0.08, 0.07] });
        }
        if (k < n - 1) rel.push(hbox(cx + (ow + g) / 2, 0, 0.06, g * 0.7, oh + ah * 0.4, 0.05));
      }
    }
    put(bag, fk, fr, p, yaw, s); put(bag, 'dark', dk, p, yaw, s);
    if (bar.length) put(bag, 'bar', bar, p, yaw, s);
    if (rel.length) put(bag, 'rel', rel, p, yaw, s);
  }
  /** Carved doorway: timber frame, two panelled leaves and a gilt-rimmed carved tympanum. p = centre of the sill. */
  function cDoor(bag, p, yaw, { w = 1.0, h = 1.5, s = 1 } = {}) {
    const fr = [hbox(-w / 2 - 0.1, h / 2, 0.01, 0.16, h + 0.1, 0.12), hbox(w / 2 + 0.1, h / 2, 0.01, 0.16, h + 0.1, 0.12), hbox(0, h + 0.07, 0.02, w + 0.52, 0.16, 0.14), hbox(0, h + 0.2, 0.03, w + 0.7, 0.07, 0.16)];
    const dk = [hbox(-w / 4, h / 2, 0.04, w / 2 - 0.02, h, 0.06), hbox(w / 4, h / 2, 0.04, w / 2 - 0.02, h, 0.06)];
    const rel = [];
    [-1, 1].forEach((sx) => { for (let j = 0; j < 3; j += 1) rel.push(hbox(sx * w / 4, h * (0.17 + j * 0.31), 0.08, w / 2 - 0.16, h * 0.24, 0.03)); });
    [-1, 1].forEach((sx) => { rel.push({ ball: [0.07], sc: [1, 1.3, 0.8], p: [sx * (w / 2 + 0.1), h * 0.8, 0.09] }, { ball: [0.07], sc: [1, 1.3, 0.8], p: [sx * (w / 2 + 0.1), h * 0.4, 0.09] }); });
    const gd = [halfDisc(0, h + 0.1, 0.05, w / 2 + 0.34, 0.03)];
    rel.push(halfDisc(0, h + 0.1, 0.075, w / 2 + 0.26, 0.04));
    dk.push(halfDisc(0, h + 0.1, 0.1, w / 2 + 0.1, 0.03));
    gd.push({ cone: [0.05, 0.26, 6], p: [0, h + 0.1 + w / 2 + 0.4, 0.08] });
    put(bag, 'wood', fr, p, yaw, s); put(bag, 'dark', dk, p, yaw, s); put(bag, 'rel', rel, p, yaw, s); put(bag, 'gold', gd, p, yaw, s);
  }
  /** Carved diagonal struts (tunala) holding an eave on all four sides, with figure blocks and the wall plate. y = eave level. */
  function tunala(bag, { w, d, y, ov, h = 0.8, nx, nz, k = 'wood', sides = [0, 1, 2, 3] }) {
    const reach = ov * 0.84; const L = Math.hypot(h, reach); const th = Math.atan2(reach, h);
    const S = [{ yaw: 0, len: w, cnt: nx, hw: d / 2 }, { yaw: PI, len: w, cnt: nx, hw: d / 2 }, { yaw: PI / 2, len: d, cnt: nz, hw: w / 2 }, { yaw: -PI / 2, len: d, cnt: nz, hw: w / 2 }];
    sides.forEach((si) => {
      const { yaw, len, cnt, hw } = S[si];
      const A = []; const B = []; const C = [];
      for (let j = 0; j < cnt; j += 1) {
        const t = (-len / 2) * 0.92 + ((j + 0.5) * len * 0.92) / cnt;
        A.push({ s: [0.11, L, 0.11], p: [t, -h / 2, hw + 0.05 + reach / 2], r: [th, 0, 0] });
        B.push({ s: [0.17, 0.26, 0.09], p: [t, -h * 0.66, hw + 0.06 + reach * 0.3], r: [th, 0, 0] }, { ball: [0.065], p: [t, -h * 0.66 + 0.2, hw + 0.07 + reach * 0.3] }, hbox(t, -h - 0.03, hw + 0.06, 0.16, 0.1, 0.13), hbox(t, 0.01, hw + reach + 0.02, 0.13, 0.08, 0.14));
      }
      C.push(hbox(0, -h - 0.09, hw + 0.08, len + 0.06, 0.1, 0.2), hbox(0, -0.04, hw + reach + 0.03, len * 0.98, 0.07, 0.1));
      put(bag, k, A, [0, y, 0], yaw); put(bag, 'rel', B, [0, y, 0], yaw); put(bag, 'ink', C, [0, y, 0], yaw);
    });
  }
  /** Guardian lion on its haunches facing +z (about 1 unit tall). v: 'wh' white with red mane, 'st' grey stone, 'br' bronze. */
  function lion(bag, p, yaw = 0, s = 1, v = 'st') {
    const body = [
      { ball: [0.3], sc: [0.95, 1.0, 1.25], p: [0, 0.32, -0.12] }, { ball: [0.26], sc: [0.85, 1.15, 0.9], p: [0, 0.5, 0.1] },
      { ball: [0.2], p: [-0.2, 0.2, -0.2] }, { ball: [0.2], p: [0.2, 0.2, -0.2] },
      { cyl: [0.065, 0.08, 0.55, 8], p: [-0.14, 0.28, 0.26] }, { cyl: [0.065, 0.08, 0.55, 8], p: [0.14, 0.28, 0.26] },
      { ball: [0.09], sc: [1, 0.6, 1.5], p: [-0.14, 0.04, 0.33] }, { ball: [0.09], sc: [1, 0.6, 1.5], p: [0.14, 0.04, 0.33] },
      { ball: [0.22], sc: [1, 1, 1], p: [0, 0.78, 0.25] }, hbox(0, 0.7, 0.4, 0.24, 0.12, 0.16), hbox(0, 0.6, 0.38, 0.2, 0.05, 0.14),
      { ball: [0.05], p: [-0.15, 0.95, 0.15] }, { ball: [0.05], p: [0.15, 0.95, 0.15] },
      { cyl: [0.03, 0.025, 0.5, 6], p: [0, 0.5, -0.42], r: [-0.75, 0, 0] }, { ball: [0.07], sc: [1, 1, 1.3], p: [0, 0.74, -0.58] },
    ];
    const mane = [
      { ball: [0.26], sc: [1.1, 1.05, 0.42], p: [0, 0.76, 0.0] }, { ball: [0.08], p: [-0.27, 0.62, 0.1] }, { ball: [0.08], p: [0.27, 0.62, 0.1] }, hbox(0, 0.6, 0.46, 0.08, 0.02, 0.1),
      { ball: [0.07], p: [-0.2, 0.94, 0.05] }, { ball: [0.07], p: [0.2, 0.94, 0.05] }, { ball: [0.06], p: [0, 1.0, 0.02] },
    ];
    const eyes = [{ ball: [0.05], p: [-0.085, 0.84, 0.38] }, { ball: [0.05], p: [0.085, 0.84, 0.38] }, hbox(-0.05, 0.62, 0.46, 0.025, 0.06, 0.02), hbox(0.05, 0.62, 0.46, 0.025, 0.06, 0.02)];
    const pupils = [{ ball: [0.024], p: [-0.085, 0.84, 0.425] }, { ball: [0.024], p: [0.085, 0.84, 0.425] }, { ball: [0.035], p: [0, 0.74, 0.46] }];
    put(bag, `lb_${v}`, body, p, yaw, s); put(bag, `lm_${v}`, mane, p, yaw, s); put(bag, 'white', eyes, p, yaw, s); put(bag, 'dark', pupils, p, yaw, s);
  }
  /** Small grey stone chaitya: stepped base, dome, harmika and a spire of rings with a gilt tip. */
  function chaitya(bag, p, s = 1, c = 'stone') {
    const A = [hbox(0, 0.06, 0, 0.62, 0.12, 0.62), hbox(0, 0.19, 0, 0.5, 0.14, 0.5), hbox(0, 0.3, 0, 0.4, 0.08, 0.4), { ball: [0.21], sc: [1, 0.85, 1], p: [0, 0.34, 0] }, hbox(0, 0.58, 0, 0.17, 0.14, 0.17)];
    for (let k = 0; k < 6; k += 1) A.push({ cyl: [0.12 - k * 0.012, 0.13 - k * 0.012, 0.045, 8], p: [0, 0.68 + k * 0.05, 0] });
    [-1, 1].forEach((sx) => A.push({ ball: [0.04], p: [sx * 0.12, 0.3, 0.2] }));
    put(bag, c, A, p, 0, s); put(bag, 'gold', [{ cone: [0.045, 0.2, 8], p: [0, 1.04, 0] }], p, 0, s);
  }
  /** Row of slim brass bars between two corners, as a fence or a cage side. */
  function barRow(bag, k, x0, z0, x1, z1, h, gap = 0.17, skip = null) {
    const len = Math.hypot(x1 - x0, z1 - z0); const n = Math.max(2, Math.round(len / gap)); const yaw = Math.atan2(-(z1 - z0), x1 - x0);
    const A = [];
    for (let i = 0; i <= n; i += 1) { const t = i / n; if (skip && skip(t)) continue; A.push({ cyl: [0.02, 0.02, h, 5], p: [x0 + (x1 - x0) * t, h / 2, z0 + (z1 - z0) * t] }); }
    [0.04, h * 0.5, h - 0.03].forEach((yy) => A.push({ s: [len + 0.04, 0.04, 0.04], p: [(x0 + x1) / 2, yy, (z0 + z1) / 2], r: [0, yaw, 0] }));
    put(bag, k, A);
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

  /* ---- Jagannath: two broad roofs over a brick hall with a carved timber doorway, lattice windows and rows of carved struts, on a three-step plinth ---- */
  const JAG_TIERS = [
    { w: 4.6, d: 4.2, h: 2.35, ov: 1.55, rh: 1.15, door: false, windows: false, struts: false, tint: '#dba088' },
    { w: 3.1, d: 2.8, h: 1.8, ov: 1.2, rh: 1.1, wall: 'timber', door: false, windows: false, struts: false },
  ];
  function jagDeco(b, i, y, t, lite) {
    const { w, d, h, ov } = t;
    const lw = { lite, s: 1 };
    if (i === 0) {
      cDoor(b, [0, y, d / 2], 0, { w: 1.1, h: 1.75 });
      [-1, 1].forEach((sx) => cWin(b, [sx * 1.6, y + h * 0.52, d / 2], 0, { n: 1, ow: 0.52, oh: 0.75, ...lw }));
      [-1, 1].forEach((sx) => { cWin(b, [sx * 1.0, y + h * 0.5, -d / 2], PI, { n: 1, ow: 0.5, oh: 0.7, ...lw }); [-1, 1].forEach((sz) => cWin(b, [sx * (w / 2), y + h * 0.5, sz * 0.95], sx * (PI / 2), { n: 1, ow: 0.5, oh: 0.7, ...lw })); });
    } else {
      cWin(b, [0, y + h * 0.5, d / 2], 0, { n: 3, ow: 0.4, oh: 0.78, g: 0.11, ...lw });
      cWin(b, [0, y + h * 0.5, -d / 2], PI, { n: 3, ow: 0.4, oh: 0.78, g: 0.11, ...lw });
      [-1, 1].forEach((sx) => cWin(b, [sx * (w / 2), y + h * 0.5, 0], sx * (PI / 2), { n: 2, ow: 0.42, oh: 0.78, g: 0.11, ...lw }));
    }
    put(b, 'ink', [hbox(0, y + h - 0.08, 0, w + 0.06, 0.18, d + 0.06), hbox(0, y + 0.06, 0, w + 0.1, 0.14, d + 0.1)]);
    tunala(b, { w, d, y: y + h - 0.04, ov, h: 0.62 + ov * 0.2, nx: Math.round(w / 0.55), nz: Math.round(d / 0.55) });
  }
  function JagBody({ lite }) {
    const M = useM();
    const T = mats(M);
    return (
      <group>
        <StepPlinth steps={3} w={8.6} d={8.2} stepH={0.3} inset={0.42} stairs={[0]} sw={2.6} brickC="#d98a6e" top="#c98468" />
        <Pagoda base={0.9} tiers={JAG_TIERS} roofM={T.tileDark} gs={1.15} sag={1.15} lift={0.08} deco={(i, y, t) => <Details build={(b) => jagDeco(b, i, y, t, lite)} />} />
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

  /* ---- Taleju: three tall tiers with weathered gilt-copper roofs over dark carved timber and gilt windows, on a high brick plinth, ringed by
         small shrines and an orange-red compound wall with its carved stone-arched gate and white lions ---- */
  const TALEJU_TIERS = [
    { w: 3.8, d: 3.8, h: 2.1, ov: 1.3, rh: 1.1, door: false, windows: false, struts: false, tint: '#d08a70' },
    { w: 3.0, d: 3.0, h: 1.75, ov: 1.1, rh: 1.0, wall: 'dark', door: false, windows: false, struts: false },
    { w: 2.3, d: 2.3, h: 1.55, ov: 0.95, rh: 0.95, wall: 'dark', door: false, windows: false, struts: false },
  ];
  function talDeco(b, i, y, t, lite) {
    const { w, d, h, ov } = t;
    const o = { lite, fk: i ? 'gold' : 'wood' };
    if (i === 0) {
      cDoor(b, [0, y, d / 2], 0, { w: 1.1, h: 1.7 });
      [-1, 1].forEach((sx) => cWin(b, [sx * 1.4, y + h * 0.55, d / 2], 0, { n: 1, ow: 0.5, oh: 0.8, ...o }));
    }
    [0, PI / 2, PI, -PI / 2].forEach((yaw, k) => {
      if (i === 0 && k === 0) return;
      cWin(b, at([0, y + h * (i ? 0.52 : 0.55), 0], yaw, 0, 0, (k % 2 ? w : d) / 2), yaw, { n: i ? 3 : 2, ow: i ? 0.36 : 0.45, oh: i ? 0.7 : 0.8, g: 0.1, ...o });
    });
    put(b, 'ink', [hbox(0, y + h - 0.08, 0, w + 0.06, 0.18, d + 0.06), hbox(0, y + 0.06, 0, w + 0.1, 0.14, d + 0.1)]);
    tunala(b, { w, d, y: y + h - 0.04, ov, h: 0.6 + ov * 0.2, nx: Math.round(w / 0.55), nz: Math.round(d / 0.55) });
  }
  function TalejuBody({ lite }) {
    const M = useM();
    const T = mats(M);
    const roof = M.plain('#b9a24a', { metalness: 0.7, roughness: 0.4, emissive: '#3a2f08', emissiveIntensity: 0.25 });
    const red = M.plain('#c0573a', { roughness: 0.9 });
    const S = 7; const stepH = 0.34; const H = S * stepH; const HW = 7.5;
    const shrines = [[-6.3, -5.2], [6.3, -5.2], [-6.5, 0.4], [6.5, 0.4], [-5.6, 5.2], [5.6, 5.2], [0, -6.3]];
    const gate = useMemo(() => {
      const b = {};
      // carved stone arch round the door, white lions' pedestals, crest ornaments
      put(b, 'stoneD', [{ cyl: [1.12, 1.12, 0.3, 20, PI / 2, PI], p: [0, 1.6, 0.46], r: [PI / 2, 0, 0] }, hbox(-1.0, 0.8, 0.46, 0.26, 1.6, 0.3), hbox(1.0, 0.8, 0.46, 0.26, 1.6, 0.3)]);
      put(b, 'rel', [{ cyl: [0.86, 0.86, 0.34, 20, PI / 2, PI], p: [0, 1.6, 0.46], r: [PI / 2, 0, 0] }]);
      put(b, 'dark', [hbox(0, 0.85, 0.5, 1.5, 1.7, 0.2), { cyl: [0.75, 0.75, 0.2, 20, PI / 2, PI], p: [0, 1.6, 0.52], r: [PI / 2, 0, 0] }]);
      put(b, 'bar', Array.from({ length: 7 }, (_, k) => hbox(-0.6 + k * 0.2, 0.85, 0.63, 0.05, 1.7, 0.04)));
      put(b, 'gold', [{ ball: [0.1], p: [-1.5, 3.3, 0.4] }, { ball: [0.1], p: [1.5, 3.3, 0.4] }, { cone: [0.09, 0.3, 6], p: [0, 4.0, 0] }, { ball: [0.07], p: [0, 3.82, 0] }]);
      put(b, 'white', [hbox(-1.8, 0.3, 0.9, 0.9, 0.6, 0.9), hbox(1.8, 0.3, 0.9, 0.9, 0.6, 0.9), hbox(0, 3.42, 0, 1.8, 0.32, 0.9), hbox(0, 3.68, 0, 1.3, 0.2, 0.7), hbox(0, 3.1, 0.05, 3.5, 0.2, 1.05)]);
      lion(b, [-1.8, 0.6, 0.95], 0, 1.1, 'wh'); lion(b, [1.8, 0.6, 0.95], 0, 1.1, 'wh');
      return b;
    }, []);
    return (
      <group>
        <StepPlinth steps={S} w={8.6} d={8.6} stepH={stepH} inset={0.3} stairs={[0]} sw={2.4} brickC="#d58468" top="#c47a60" />
        <Pagoda base={H} tiers={TALEJU_TIERS} roofM={roof} gs={1.4} sag={1.25} deco={(i, y, t) => <Details build={(b) => talDeco(b, i, y, t, lite)} />} />
        {shrines.map(([x, z], k) => (
          <group key={k} position={[x, 0, z]}>
            <Box s={[1.2, 0.3, 1.2]} p={[0, 0.15, 0]} m={M.stone} />
            <Pagoda base={0.3} tiers={[{ w: 0.7, d: 0.7, h: 0.8, ov: 0.5, rh: 0.42, door: false, windows: false, tint: '#c98068' }, { w: 0.46, d: 0.46, h: 0.55, ov: 0.38, rh: 0.36, wall: 'dark', door: false, windows: false, struts: false }]} roofM={T.tile} gs={0.32} />
          </group>
        ))}
        {/* orange-red compound wall with white coping, and the gate in the south side */}
        {[[0, -HW, 2 * HW + 0.5, 0.5], [-HW, 0, 0.5, 2 * HW], [HW, 0, 0.5, 2 * HW]].map(([x, z, w, d], k) => (
          <group key={k}><Box s={[w, 2.0, d]} p={[x, 1.0, z]} m={red} /><Box s={[w + 0.1, 0.14, d + 0.1]} p={[x, 2.07, z]} m={T.white} /></group>
        ))}
        {[-1, 1].map((k) => (
          <group key={k}><Box s={[HW - 1.9, 2.0, 0.5]} p={[k * (1.9 + (HW - 1.9) / 2), 1.0, HW]} m={red} /><Box s={[HW - 1.8, 0.14, 0.6]} p={[k * (1.9 + (HW - 1.9) / 2), 2.07, HW]} m={T.white} /></group>
        ))}
        <group position={[0, 0, HW]}>
          <Box s={[3.2, 3.0, 0.9]} p={[0, 1.5, 0]} m={red} />
          <Bag bag={gate} />
        </group>
      </group>
    );
  }

  /* ---- Kumari Ghar: three-storey brick bahal round a small courtyard. Its glory is the dark carved timber: tiered window groups under carved
         arches on every storey, a wooden colonnade below, lions at the door and a small stone shrine in the courtyard ---- */
  const KUM = { W: 10, D: 9.2, wd: 1.8, sh: 1.4 };
  function kumDeco(b, lite) {
    const { W, D, wd, sh } = KUM;
    const H = sh * 3; const iw = W - 2 * wd; const id = D - 2 * wd;
    const o = { lite };
    // outer front
    cDoor(b, [0, 0.02, D / 2], 0, { w: 1.1, h: 1.7 });
    [-4.1, 4.1].forEach((x) => cWin(b, [x, sh * 0.62, D / 2], 0, { n: 1, ow: 0.4, oh: 0.5, ...o }));
    [-2.8, 2.8].forEach((x) => cWin(b, [x, sh * 0.62, D / 2], 0, { n: 1, ow: 0.4, oh: 0.5, arch: false, ...o }));
    cWin(b, [0, sh * 1.55, D / 2], 0, { n: 3, ow: 0.55, oh: 0.72, g: 0.14, s: 1.05, ...o });
    [-2.8, 2.8].forEach((x) => cWin(b, [x, sh * 1.55, D / 2], 0, { n: 2, ow: 0.5, oh: 0.68, ...o }));
    [-4.2, 4.2].forEach((x) => cWin(b, [x, sh * 1.55, D / 2], 0, { n: 1, ow: 0.45, oh: 0.64, ...o }));
    [-4.0, -2.0, 0, 2.0, 4.0].forEach((x) => cWin(b, [x, sh * 2.5, D / 2], 0, { n: 1, ow: 0.5, oh: 0.62, ...o }));
    // outer back
    [-3.4, 0, 3.4].forEach((x) => cWin(b, [x, sh * 1.55, -D / 2], PI, { n: 2, ow: 0.5, oh: 0.68, ...o }));
    [-4.2, -2.1, 0, 2.1, 4.2].forEach((x) => cWin(b, [x, sh * 2.5, -D / 2], PI, { n: 1, ow: 0.45, oh: 0.6, ...o }));
    [-3.5, 0, 3.5].forEach((x) => cWin(b, [x, sh * 0.62, -D / 2], PI, { n: 1, ow: 0.4, oh: 0.5, arch: false, ...o }));
    // outer sides
    [-1, 1].forEach((sx) => {
      [-2.8, 0, 2.8].forEach((z) => cWin(b, [sx * W / 2, sh * 1.55, z], sx * (PI / 2), { n: 2, ow: 0.5, oh: 0.66, ...o }));
      [-3.2, -1.6, 0, 1.6, 3.2].forEach((z) => cWin(b, [sx * W / 2, sh * 2.5, z], sx * (PI / 2), { n: 1, ow: 0.42, oh: 0.6, ...o }));
      [-2.4, 2.4].forEach((z) => cWin(b, [sx * W / 2, sh * 0.62, z], sx * (PI / 2), { n: 1, ow: 0.4, oh: 0.5, arch: false, ...o }));
    });
    // inner courtyard faces: big window groups on storeys 1 and 2, the gilt-framed Kumari window on the north wing
    const faces = [{ yaw: PI, c: [0, 0, id / 2], L: iw }, { yaw: 0, c: [0, 0, -id / 2], L: iw }, { yaw: -PI / 2, c: [iw / 2, 0, 0], L: id }, { yaw: PI / 2, c: [-iw / 2, 0, 0], L: id }];
    faces.forEach(({ yaw, c, L }, fi) => {
      const f = (dx, y) => at([c[0], y, c[2]], yaw, dx, 0, 0);
      cWin(b, f(0, sh * 1.55), yaw, { n: L > 5.5 ? 3 : 2, ow: 0.5, oh: 0.7, g: 0.13, ...o });
      [-1, 1].forEach((sx) => cWin(b, f(sx * L * 0.36, sh * 1.55), yaw, { n: 1, ow: 0.45, oh: 0.64, ...o }));
      cWin(b, f(0, sh * 2.5), yaw, { n: L > 5.5 ? 3 : 2, ow: 0.42, oh: 0.56, g: 0.12, fk: fi === 1 ? 'gold' : 'wood', ...o });
      [-1, 1].forEach((sx) => cWin(b, f(sx * L * 0.36, sh * 2.5), yaw, { n: 1, ow: 0.4, oh: 0.52, ...o }));
      put(b, 'ink', [hbox(0, sh, 0.1, L + 0.1, 0.14, 0.24), hbox(0, sh * 2, 0.1, L + 0.1, 0.14, 0.24)], [c[0], 0, c[2]], yaw);
      // ground-floor colonnade: dark recess, posts and beam
      put(b, 'dark', [hbox(0, 0.62, 0.02, L - 0.2, 1.1, 0.04)], [c[0], 0.02, c[2]], yaw);
      const np = Math.round(L / 1.0);
      const posts = []; for (let k = 0; k <= np; k += 1) posts.push({ cyl: [0.07, 0.085, sh - 0.3, 8], p: [-L / 2 + 0.15 + (k * (L - 0.3)) / np, (sh - 0.3) / 2 + 0.0, 0.2] });
      posts.push(hbox(0, sh - 0.22, 0.2, L, 0.14, 0.2));
      put(b, 'wood', posts, [c[0], 0.02, c[2]], yaw);
    });
    // eave brackets round the outer roof
    tunala(b, { w: W, d: D, y: H, ov: 0.62, h: 0.55, nx: 14, nz: 13 });
    [sh, sh * 2].forEach((yy) => put(b, 'ink', [hbox(0, yy, D / 2 + 0.02, W + 0.08, 0.14, 0.1), hbox(0, yy, -D / 2 - 0.02, W + 0.08, 0.14, 0.1), hbox(W / 2 + 0.02, yy, 0, 0.1, 0.14, D), hbox(-W / 2 - 0.02, yy, 0, 0.1, 0.14, D)]));
    // lions on their pedestals, lamps and the stone mandala shrine
    [-1, 1].forEach((sx) => { put(b, 'stoneL', [hbox(sx * 1.75, 0.38, D / 2 + 0.7, 0.95, 0.5, 0.95)]); lion(b, [sx * 1.75, 0.63, D / 2 + 0.7], 0, 1.55, 'wh'); });
    put(b, 'stoneL', [hbox(0, 0.28, D / 2 + 0.55, 3.4, 0.14, 1.1), hbox(0, 0.2, D / 2 + 0.95, 3.0, 0.14, 0.7)]);
    put(b, 'stone', [{ cyl: [0.62, 0.7, 0.2, 16], p: [0, 0.12, 0] }, { cyl: [0.46, 0.52, 0.16, 16], p: [0, 0.3, 0] }]);
    chaitya(b, [0, 0.38, 0], 0.75);
  }
  function KumariBody({ lite }) {
    const M = useM();
    const T = mats(M);
    const { W, D, wd, sh } = KUM; const H = sh * 3;
    const iw = W - 2 * wd; const id = D - 2 * wd;
    const brick = M.mat('brick', 7, 5, { color: '#eab096' });
    const roofM = M.mat('roof', 2.4, 1, { color: '#a07058' });
    return (
      <group>
        <Box s={[W + 0.6, 0.2, D + 0.6]} p={[0, 0.1, 0]} m={M.stone} />
        <Box s={[W, H, wd]} p={[0, H / 2 + 0.2, D / 2 - wd / 2]} m={brick} />
        <Box s={[W, H, wd]} p={[0, H / 2 + 0.2, -D / 2 + wd / 2]} m={brick} />
        <Box s={[wd, H, D - 2 * wd]} p={[W / 2 - wd / 2, H / 2 + 0.2, 0]} m={brick} />
        <Box s={[wd, H, D - 2 * wd]} p={[-W / 2 + wd / 2, H / 2 + 0.2, 0]} m={brick} />
        <Box s={[iw, 0.06, id]} p={[0, 0.22, 0]} m={M.plain('#e4dac6', { emissive: '#7a6e58', emissiveIntensity: 0.55 })} cast={false} />
        <group position={[0, 0.2, 0]}>
          <Details build={(b) => kumDeco(b, lite)} />
          {[[0, D / 2 - wd / 2, 0, W], [0, -D / 2 + wd / 2, 0, W], [W / 2 - wd / 2, 0, PI / 2, D - 2 * wd], [-W / 2 + wd / 2, 0, PI / 2, D - 2 * wd]].map(([x, z, r, len], k) => (
            <group key={k} position={[x, 0, z]} rotation={[0, r, 0]}><Gable len={len + 0.2} d={wd} h={0.95} y={H} m={roofM} ov={0.32} /></group>
          ))}
          <Tree p={[-1.1, 0.12, -0.8]} s={0.6} />
        </group>
      </group>
    );
  }

  /* ---- Hanuman Dhoka: the long whitewashed palace front under a low dark-tiled roof with its timber veranda, the blue-and-gold gate with
         white lions, red-robed Hanuman under his umbrella; behind it the brick wings of Nasal Chowk, the round five-roofed Panchamukhi
         Hanuman tower and, beyond the end, the brick Basantapur tower ---- */
  const HAN = { L: 16, D: 3.8, sh: 1.2 };
  function hanDeco(b, lite) {
    const { L, D, sh } = HAN; const H = sh * 3;
    const o = { lite };
    // front windows: white frames on the ground and first floor, carved timber on the top floor
    for (let k = 0; k < 8; k += 1) {
      const x = -7 + k * 2;
      if (Math.abs(x) > 1.8) cWin(b, [x, 0.25 + 0.7, D / 2], 0, { n: 1, ow: 0.42, oh: 0.5, arch: false, fk: 'wfr', ...o });
      if (Math.abs(x) > 1.8 || true) cWin(b, [x, sh + 0.25 + 0.62, D / 2], 0, { n: 1, ow: 0.48, oh: 0.66, arch: false, fk: 'wfr', ...o });
      cWin(b, [x, sh * 2 + 0.25 + 0.55, D / 2], 0, { n: 1, ow: 0.46, oh: 0.62, ...o });
    }
    // back of the main block, onto Nasal Chowk
    for (let k = 0; k < 8; k += 1) { const x = -7 + k * 2; [0.95, sh + 0.87, sh * 2 + 0.8].forEach((yy, r) => cWin(b, [x, yy, -D / 2], PI, { n: 1, ow: 0.46, oh: 0.62, arch: r === 2, fk: r < 2 ? 'wfr' : 'wood', ...o })); }
    put(b, 'wood', [hbox(0, sh + 0.3, -D / 2 - 0.3, L, 0.1, 0.6), ...Array.from({ length: 45 }, (_, k) => ({ cyl: [0.03, 0.03, 0.5, 5], p: [-L / 2 + (k * L) / 44, sh + 0.58, -D / 2 - 0.58] })), hbox(0, sh + 0.86, -D / 2 - 0.58, L, 0.07, 0.08)]);
    // the veranda along the first floor
    const A = []; const n = Math.round(L / 0.36);
    for (let k = 0; k <= n; k += 1) A.push({ cyl: [0.03, 0.03, 0.55, 5], p: [-L / 2 + (k * L) / n, sh + 0.25 + 0.3, D / 2 + 0.62] });
    A.push(hbox(0, sh + 0.25 + 0.6, D / 2 + 0.62, L, 0.07, 0.09), hbox(0, sh + 0.25 + 0.02, D / 2 + 0.34, L, 0.09, 0.78));
    for (let k = 0; k <= 16; k += 1) A.push({ s: [0.1, 0.5, 0.1], p: [-L / 2 + k * 1.0, sh + 0.25 - 0.22, D / 2 + 0.3], r: [0.6, 0, 0] });
    put(b, 'wood', A);
    put(b, 'ink', [hbox(0, 0.25, 0, L + 0.1, 0.1, D + 0.1), hbox(0, sh + 0.25, 0, L + 0.06, 0.1, D + 0.06), hbox(0, sh * 2 + 0.25, 0, L + 0.06, 0.1, D + 0.06)].map((q) => q));
    tunala(b, { w: L, d: D, y: H + 0.25, ov: 0.9, h: 0.55, nx: 20, nz: 5, sides: [0, 1, 2, 3] });
    // the gate: gilt frame, turquoise leaves, carved crest and a small roof
    put(b, 'gold', [hbox(0, 1.55, D / 2 + 0.07, 2.5, 2.7, 0.1), hbox(0, 3.0, D / 2 + 0.12, 2.3, 0.4, 0.14), { cyl: [0.95, 0.95, 0.1, 16, PI / 2, PI], p: [0, 2.35, D / 2 + 0.14], r: [PI / 2, 0, 0] }]);
    put(b, 'teal', [hbox(-0.5, 1.2, D / 2 + 0.14, 0.95, 2.1, 0.08), hbox(0.5, 1.2, D / 2 + 0.14, 0.95, 2.1, 0.08)]);
    put(b, 'blue', [hbox(-0.5, 1.2, D / 2 + 0.19, 0.7, 1.7, 0.04), hbox(0.5, 1.2, D / 2 + 0.19, 0.7, 1.7, 0.04), { cyl: [0.78, 0.78, 0.06, 16, PI / 2, PI], p: [0, 2.3, D / 2 + 0.17], r: [PI / 2, 0, 0] }]);
    put(b, 'red', [hbox(0, 3.45, D / 2 + 0.1, 2.9, 0.1, 0.6)]);
    [-0.7, 0, 0.7].forEach((x) => put(b, 'gold', [{ ball: [0.12], sc: [1, 1.3, 0.7], p: [x, 3.0, D / 2 + 0.22] }]));
    [-1, 1].forEach((sx) => put(b, 'bar', [hbox(sx * 1.45, 1.4, D / 2 + 0.1, 0.12, 2.6, 0.12)]));
    // stone steps and the lions
    put(b, 'stoneL', [hbox(0, 0.15, D / 2 + 0.5, 4.2, 0.3, 0.8), hbox(0, 0.1, D / 2 + 0.95, 3.8, 0.2, 0.7), hbox(0, 0.05, D / 2 + 1.35, 3.4, 0.1, 0.6)]);
    [-1, 1].forEach((sx) => lion(b, [sx * 1.7, 0.3, D / 2 + 0.7], 0, 1.25, 'wh'));
    // Hanuman: red-painted plinth, red cloak, orange face, umbrella
    const hx = -3.6; const hz = D / 2 + 1.1;
    put(b, 'red', [hbox(hx, 0.5, hz, 1.2, 1.0, 1.2), { cone: [0.62, 1.5, 14], p: [hx, 1.75, hz] }]);
    put(b, 'orange', [{ ball: [0.26], sc: [1, 1.1, 0.95], p: [hx, 2.65, hz + 0.04] }]);
    put(b, 'marigold', Array.from({ length: 9 }, (_, k) => ({ ball: [0.06], p: [hx + Math.sin((k / 8) * PI * 2) * 0.3, 2.15, hz + Math.cos((k / 8) * PI * 2) * 0.3] })));
    put(b, 'dark', [{ cyl: [0.02, 0.02, 1.2, 6], p: [hx, 3.3, hz] }]);
    put(b, 'lm_wh', [{ cone: [1.0, 0.45, 18], p: [hx, 3.98, hz] }]);
    put(b, 'white', Array.from({ length: 14 }, (_, k) => ({ ball: [0.045], p: [hx + Math.sin((k / 14) * PI * 2) * 0.96, 3.74, hz + Math.cos((k / 14) * PI * 2) * 0.96] })));
  }
  const PANCH = [2.25, 1.95, 1.65, 1.38, 1.12];
  function HanumanBody({ lite }) {
    const M = useM();
    const T = mats(M);
    const { L, D, sh } = HAN; const H = sh * 3;
    const brick = M.mat('brick', 5, 3, { color: '#e3a58b' });
    const rb = (r) => M.mat('roof', r, 1, { color: '#8a5c48' });
    const wing = useMemo(() => {
      const b = {};
      [-1, 1].forEach((sx) => {
        const cx = sx * 6.6;
        [-3.2, -4.55, -5.9].forEach((z) => {
          cWin(b, [cx - sx * 1.3, 0.25 + sh * 1.55 - sh, z], -sx * (PI / 2), { n: 2, ow: 0.46, oh: 0.6, lite });
          cWin(b, [cx - sx * 1.3, 0.25 + sh * 2.5 - sh, z], -sx * (PI / 2), { n: 2, ow: 0.4, oh: 0.52, lite });
        });
        put(b, 'ink', [hbox(cx - sx * 1.3, 0.25 + sh, -4.55, 0.1, 0.12, 5.0), hbox(cx - sx * 1.3, 0.25 + sh * 2, -4.55, 0.1, 0.12, 5.0)]);
      });
      return b;
    }, []); // eslint-disable-line
    const basa = [
      { w: 3.8, d: 3.8, h: 3.3, ov: 0.7, rh: 0.7, door: false, windows: false, struts: false, tint: '#e0a088' },
      { w: 3.2, d: 3.2, h: 1.5, ov: 0.65, rh: 0.64, door: false, windows: false, struts: false, tint: '#e0a088' },
      { w: 2.6, d: 2.6, h: 1.3, ov: 0.6, rh: 0.6, door: false, windows: false, struts: false, wall: 'timber' },
      { w: 2.0, d: 2.0, h: 1.1, ov: 0.55, rh: 0.55, door: false, windows: false, struts: false, wall: 'timber' },
    ];
    const basaDeco = (i, y, t) => <Details build={(b) => {
      const { w, d, h } = t;
      [0, PI / 2, PI, -PI / 2].forEach((yaw, k) => {
        const half = (k % 2 ? w : d) / 2;
        if (i === 0) { [0.85, 2.35].forEach((yy) => cWin(b, at([0, y + yy, 0], yaw, 0, 0, half), yaw, { n: 2, ow: 0.42, oh: 0.6, g: 0.12, lite })); } else cWin(b, at([0, y + h * 0.52, 0], yaw, 0, 0, half), yaw, { n: 2, ow: 0.36, oh: 0.55, g: 0.1, lite });
      });
      tunala(b, { w, d, y: y + h - 0.04, ov: t.ov, h: 0.45, nx: Math.round(w / 0.6), nz: Math.round(d / 0.6) });
    }} />;
    return (
      <group>
        <Box s={[L + 0.4, 0.25, D + 0.7]} p={[0, 0.125, 0]} m={M.stone} />
        <Box s={[L, H, D]} p={[0, H / 2 + 0.25, 0]} m={T.white} />
        <Details build={(b) => hanDeco(b, lite)} />
        <Rf w={L + 1.4} d={D + 1.9} h={1.2} y={H + 0.25} m={rb(5)} sag={1.1} lift={0.04} fringe={false} />
        {/* Nasal Chowk: brick wings, paved court, small white shrine and the Panchamukhi tower */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <Box s={[2.6, H, 5.2]} p={[sx * 6.6, H / 2 + 0.25, -4.6]} m={brick} />
            <Rf w={3.7} d={6.3} h={1.0} y={H + 0.25} m={rb(2)} sag={1.1} lift={0.04} fringe={false} />
          </group>
        ))}
        <Bag bag={wing} />
        <Box s={[10.6, 0.06, 5.4]} p={[0, 0.27, -4.7]} m={M.plain('#cfc6b4')} cast={false} />
        <Box s={[10.6, 2.2, 0.4]} p={[0, 1.35, -7.4]} m={brick} />
        <group position={[3.4, 0.3, -5.2]}><Box s={[1.0, 0.5, 1.0]} p={[0, 0.25, 0]} m={T.white} /><Spire r0={0.46} h={1.5} y={0.5} m={T.white} /></group>
        <group position={[-3.2, 0.25, -4.4]}>
          <Box s={[3.0, 4.0, 3.0]} p={[0, 2.0, 0]} m={T.white} />
          <Details build={(b) => { [0, PI / 2, PI, -PI / 2].forEach((yaw) => { [1.1, 2.6].forEach((yy) => cWin(b, at([0, yy, 0], yaw, 0, 0, 1.5), yaw, { n: 1, ow: 0.45, oh: 0.6, fk: 'wfr', arch: false, lite })); }); }} />
          {PANCH.map((r, i) => {
            const y0 = 4.0 + i * 0.95;
            return (
              <group key={i}>
                <Cyl rt={r * 0.62} h={0.5} p={[0, y0 + 0.25, 0]} m={T.white} seg={20} />
                <Cyl rt={r * 0.64} h={0.07} p={[0, y0 + 0.04, 0]} m={T.dark} seg={20} />
                <mesh position={[0, y0 + 0.5 + 0.22, 0]} material={rb(4)} castShadow receiveShadow><coneGeometry args={[r, 0.46, 24]} /></mesh>
                <Cyl rt={r} h={0.06} p={[0, y0 + 0.5, 0]} m={M.plain('#6e1f1a', { roughness: 0.8 })} seg={24} />
              </group>
            );
          })}
          <Gajur y={4.0 + PANCH.length * 0.95 - 0.12} s={0.8} />
        </group>
        <group position={[L / 2 + 2.6, 0, -0.4]}><Pagoda base={0} tiers={basa} roofM={rb(3)} gs={0.8} deco={basaDeco} /></group>
      </group>
    );
  }

  /* ---- Kal Bhairav: the huge carved stone Bhairav in his niche: black body, red face and crown, six arms, a skull garland, on the demon,
         against a blue field and a halo of red flames inside a dark stone arch; masonry housing with a red eave and three white pinnacles,
         stone lions, offering table and a railing ---- */
  /** A limb as a cylinder from (x0,y0) to (x1,y1) in the xy plane at depth z. */
  const limb = (x0, y0, x1, y1, z, r0, r1 = r0) => ({ cyl: [r0, r1, Math.hypot(x1 - x0, y1 - y0), 9], p: [(x0 + x1) / 2, (y0 + y1) / 2, z], r: [0, 0, -Math.atan2(x1 - x0, y1 - y0)] });
  function kalFigure(b) {
    const z = 0.66;
    // the demon he stands on, reclining in red-pink stone
    put(b, 'rel', [{ ball: [0.5], sc: [2.1, 0.32, 0.8], p: [0, 0.56, z + 0.05] }, { ball: [0.26], sc: [1, 0.85, 1], p: [-1.1, 0.72, z + 0.2] }]);
    put(b, 'skin', [{ ball: [0.4], sc: [1.7, 0.3, 0.7], p: [0, 0.7, z + 0.2] }]);
    // legs: wide stance, knees out
    [-1, 1].forEach((sx) => {
      put(b, 'black', [limb(sx * 0.2, 1.75, sx * 0.62, 1.2, z, 0.2, 0.17), limb(sx * 0.62, 1.2, sx * 0.62, 0.8, z + 0.06, 0.15, 0.13), hbox(sx * 0.66, 0.78, z + 0.18, 0.36, 0.14, 0.5)]);
      put(b, 'gold', [{ cyl: [0.17, 0.17, 0.05, 10], p: [sx * 0.62, 0.95, z + 0.06] }]);
    });
    // body: abdomen, broad chest, red waist cloth
    put(b, 'black', [{ ball: [0.4], sc: [1, 1.0, 0.55], p: [0, 1.95, z] }, { ball: [0.52], sc: [1.15, 1.1, 0.55], p: [0, 2.52, z] }, { cyl: [0.14, 0.17, 0.3, 10], p: [0, 2.98, z] }]);
    put(b, 'skin', [hbox(0, 1.68, z + 0.12, 1.1, 0.5, 0.3), hbox(-0.25, 1.1, z + 0.14, 0.5, 0.75, 0.12), hbox(0.3, 1.2, z + 0.14, 0.4, 0.6, 0.12), hbox(0.55, 2.15, z + 0.3, 0.12, 0.7, 0.05)]);
    // six arms
    [-1, 1].forEach((sx) => {
      const arms = [[0.5, 2.85, 0.95, 3.45], [0.55, 2.55, 1.2, 2.75], [0.45, 2.3, 0.95, 1.7]];
      arms.forEach(([x0, y0, x1, y1], k) => {
        put(b, 'black', [limb(sx * x0, y0, sx * x1, y1, z + 0.02 - k * 0.02, 0.1, 0.085), { ball: [0.11], p: [sx * x1, y1, z + 0.02 - k * 0.02] }]);
        put(b, 'gold', [{ cyl: [0.105, 0.105, 0.06, 10], p: [sx * (x0 + x1) / 2, (y0 + y1) / 2, z + 0.02], r: [0, 0, -Math.atan2(sx * (x1 - x0), y1 - y0)] }]);
      });
    });
    // sword (right, raised), trident (left), skull cup, drum
    put(b, 'silver', [limb(0.95, 3.45, 1.45, 4.35, z + 0.1, 0.045, 0.03), limb(-0.95, 3.45, -1.0, 4.4, z + 0.1, 0.02), hbox(-1.0, 4.45, z + 0.1, 0.3, 0.04, 0.03), { cone: [0.03, 0.22, 5], p: [-1.0, 4.62, z + 0.1] }, { cone: [0.03, 0.2, 5], p: [-1.15, 4.55, z + 0.1] }, { cone: [0.03, 0.2, 5], p: [-0.85, 4.55, z + 0.1] }]);
    put(b, 'gold', [hbox(1.0, 3.4, z + 0.1, 0.22, 0.05, 0.06)]);
    put(b, 'white', [{ ball: [0.1], sc: [1, 0.8, 1], p: [1.2, 2.75, z + 0.1] }, { ball: [0.09], p: [-1.2, 2.75, z + 0.1] }]);
    // skull garland across the chest
    put(b, 'white', Array.from({ length: 11 }, (_, k) => { const t = k / 10; return { ball: [0.075], p: [-0.58 + t * 1.16, 2.55 - Math.sin(t * PI) * 0.38, z + 0.32] }; }));
    put(b, 'marigold', Array.from({ length: 10 }, (_, k) => { const t = k / 9; return { ball: [0.06], p: [-0.5 + t * 1.0, 2.8 - Math.sin(t * PI) * 0.22, z + 0.3] }; }));
    // head: red face with huge eyes, brows, fangs and moustache, gold crown with a red plume
    put(b, 'skin', [{ ball: [0.4], sc: [1, 1.05, 0.85], p: [0, 3.35, z + 0.03] }, { cone: [0.14, 0.7, 8], p: [0, 4.45, z - 0.05] }]);
    put(b, 'white', [{ ball: [0.1], p: [-0.16, 3.42, z + 0.3] }, { ball: [0.1], p: [0.16, 3.42, z + 0.3] }, { cone: [0.04, 0.16, 5], p: [-0.1, 3.1, z + 0.34], r: [PI, 0, 0] }, { cone: [0.04, 0.16, 5], p: [0.1, 3.1, z + 0.34], r: [PI, 0, 0] }]);
    put(b, 'black', [{ ball: [0.045], p: [-0.16, 3.42, z + 0.39] }, { ball: [0.045], p: [0.16, 3.42, z + 0.39] }, hbox(-0.17, 3.56, z + 0.31, 0.26, 0.05, 0.06), hbox(0.17, 3.56, z + 0.31, 0.26, 0.05, 0.06), hbox(0, 3.2, z + 0.36, 0.34, 0.05, 0.05), hbox(0, 3.15, z + 0.35, 0.24, 0.07, 0.04)]);
    put(b, 'gold', [{ cyl: [0.4, 0.34, 0.3, 14], p: [0, 3.78, z], r: [0, 0, 0] }, ...Array.from({ length: 5 }, (_, k) => ({ cone: [0.07, 0.3, 6], p: [-0.28 + k * 0.14, 4.06, z + 0.05] })), { ball: [0.07], p: [-0.43, 3.4, z + 0.05] }, { ball: [0.07], p: [0.43, 3.4, z + 0.05] }]);
  }
  function kalDeco(b) {
    // flame halo: red disc, orange rim and tongues of flame round the upper half
    put(b, 'skin', [{ cyl: [1.32, 1.32, 0.05, 28], p: [0, 2.7, 0.42], r: [PI / 2, 0, 0] }]);
    put(b, 'orange', [{ cyl: [1.4, 1.4, 0.04, 28], p: [0, 2.7, 0.4], r: [PI / 2, 0, 0] }]);
    put(b, 'skin', Array.from({ length: 17 }, (_, k) => { const a = -0.2 + (k / 16) * (PI + 0.4); return { cone: [0.11, 0.42, 5], p: [Math.cos(a) * 1.55, 2.7 + Math.sin(a) * 1.55, 0.44], r: [0, 0, a - PI / 2] }; }));
    put(b, 'orange', Array.from({ length: 17 }, (_, k) => { const a = -0.1 + (k / 16) * (PI + 0.2) + 0.09; return { cone: [0.07, 0.3, 5], p: [Math.cos(a) * 1.5, 2.7 + Math.sin(a) * 1.5, 0.46], r: [0, 0, a - PI / 2] }; }));
    kalFigure(b);
    // masonry details: stone piers either side, white string course, lamp bracket and a hanging bell
    put(b, 'stoneD', [hbox(-2.0, 1.9, 0.45, 0.42, 3.0, 0.5), hbox(2.0, 1.9, 0.45, 0.42, 3.0, 0.5)]);
    put(b, 'stoneL', [hbox(0, 4.7, 0.2, 4.9, 0.22, 1.7), hbox(0, 0.2, 0.2, 5.6, 0.4, 2.6), hbox(0, 0.1, 1.9, 3.2, 0.2, 0.8)]);
    put(b, 'gold', [{ ball: [0.09], p: [-1.9, 3.5, 0.72] }, { ball: [0.09], p: [1.9, 3.5, 0.72] }]);
    // lions on stone pedestals, offering table with diyos, marigolds and a red dish
    [-1, 1].forEach((sx) => { put(b, 'stoneL', [hbox(sx * 2.65, 0.65, 1.55, 0.95, 0.5, 1.1)]); lion(b, [sx * 2.65, 0.9, 1.55], sx * -0.25, 1.9, 'st'); });
    put(b, 'stone', [hbox(0, 0.6, 2.3, 2.4, 0.4, 0.9)]);
    put(b, 'marigold', Array.from({ length: 12 }, (_, k) => ({ ball: [0.08], sc: [1, 0.7, 1], p: [-0.9 + (k % 6) * 0.3 + (k > 5 ? 0.1 : 0), 0.86, 2.15 + (k > 5 ? 0.3 : 0)] })));
    put(b, 'skin', [{ cyl: [0.18, 0.15, 0.06, 12], p: [0.8, 0.84, 2.5] }]);
  }
  function KalBody() {
    const M = useM();
    const T = mats(M);
    const stoneD = M.plain('#5a5550', { roughness: 0.95 });
    const blue = M.plain('#274a8c', { roughness: 0.6 });
    const brick = M.mat('brick', 4, 3, { color: '#d9a089' });
    return (
      <group>
        <Box s={[4.6, 4.3, 1.3]} p={[0, 2.55, -0.35]} m={brick} />
        <Box s={[3.1, 2.7, 0.1]} p={[0, 1.75, 0.35]} m={blue} />
        <mesh position={[0, 3.1, 0.35]} material={blue}><cylinderGeometry args={[1.55, 1.55, 0.1, 28, 1, false, PI / 2, PI]} /></mesh>
        <mesh position={[0, 3.1, 0.4]} rotation={[0, 0, 0]} material={stoneD} castShadow><torusGeometry args={[1.78, 0.22, 8, 28, PI]} /></mesh>
        <Details build={kalDeco} />
        <Rf w={5.5} d={2.7} h={0.6} y={4.78} m={T.tile} sag={1.15} lift={0.05} />
        {[-1, 0, 1].map((k) => (
          <group key={k} position={[k * 1.35, 5.1, -0.1]}>
            <Box s={[0.7, 0.4, 0.7]} p={[0, 0.2, 0]} m={T.white} />
            <Cyl rt={0.3} rb={0.34} h={0.35} p={[0, 0.58, 0]} m={T.white} seg={12} />
            <Spire r0={0.26} h={1.0} y={0.75} m={T.white} />
            <Ball rad={0.07} p={[0, 1.85, 0]} m={M.gold} />
          </group>
        ))}
        <group position={[0, 0, 0.6]}><Fence w={8.2} d={5.2} h={0.8} /></group>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => <Diyo key={x} p={[x, 0.82, 2.0]} />)}
      </group>
    );
  }

  const silver = (M) => M.plain('#d4d6da', { metalness: 0.9, roughness: 0.28 });

  /* ---- Ashok Binayak (Maru Ganesh): a tiny gold-plated shrine under one small gilt pagoda roof, its front framed in gilt carving round a silver
         arch and the red-faced Ganesh under marigold garlands, inside a brass cage; the stone bell rack with its red valance stands beside it ---- */
  function ashDeco(b) {
    // shrine front: gilt frame posts, carved lintel, dark cella, silver arch, Ganesh
    const y0 = 0.45; const z = 0.9;
    put(b, 'brass', [hbox(-0.62, y0 + 0.62, z + 0.04, 0.16, 1.3, 0.12), hbox(0.62, y0 + 0.62, z + 0.04, 0.16, 1.3, 0.12), hbox(0, y0 + 1.3, z + 0.05, 1.5, 0.18, 0.14), hbox(0, y0 + 1.46, z + 0.04, 1.7, 0.08, 0.16)]);
    put(b, 'rel', Array.from({ length: 7 }, (_, k) => hbox(-0.54 + k * 0.18, y0 + 1.22, z + 0.13, 0.1, 0.06, 0.03)));
    put(b, 'dark', [hbox(0, y0 + 0.58, z - 0.02, 1.1, 1.14, 0.1)]);
    put(b, 'silver', [hbox(-0.42, y0 + 0.5, z + 0.05, 0.16, 0.9, 0.06), hbox(0.42, y0 + 0.5, z + 0.05, 0.16, 0.9, 0.06), halfDisc(0, y0 + 0.82, z + 0.04, 0.5, 0.05), hbox(0, y0 + 0.08, z + 0.06, 1.0, 0.16, 0.12)]);
    put(b, 'dark', [halfDisc(0, y0 + 0.82, z + 0.075, 0.33, 0.03)]);
    put(b, 'silver', Array.from({ length: 9 }, (_, k) => { const a = (k / 8) * PI; return { ball: [0.045], p: [Math.cos(a) * 0.44, y0 + 0.82 + Math.sin(a) * 0.44, z + 0.09] }; }));
    put(b, 'skin', [{ ball: [0.26], sc: [1, 1.15, 0.8], p: [0, y0 + 0.38, z + 0.06] }, { ball: [0.2], sc: [1, 1.05, 0.9], p: [0, y0 + 0.78, z + 0.1] }, { cyl: [0.05, 0.03, 0.32, 8], p: [0.02, y0 + 0.6, z + 0.28], r: [0.35, 0, 0.1] }, { ball: [0.12], sc: [0.5, 1, 0.3], p: [-0.2, y0 + 0.78, z + 0.1] }, { ball: [0.12], sc: [0.5, 1, 0.3], p: [0.2, y0 + 0.78, z + 0.1] }]);
    put(b, 'gold', [{ cone: [0.1, 0.18, 6], p: [0, y0 + 1.02, z + 0.1] }, { ball: [0.045], p: [-0.06, y0 + 0.82, z + 0.28] }, { ball: [0.045], p: [0.06, y0 + 0.82, z + 0.28] }]);
    put(b, 'marigold', Array.from({ length: 10 }, (_, k) => { const t = k / 9; return { ball: [0.055], p: [-0.2 + t * 0.4, y0 + 0.62 - Math.sin(t * PI) * 0.16, z + 0.17] }; }));
    put(b, 'orange', Array.from({ length: 12 }, (_, k) => { const t = k / 11; return { ball: [0.06], p: [-0.18 + t * 0.36, y0 + 0.5 - Math.sin(t * PI) * 0.2, z + 0.2] }; }));
    // hanging garlands across the front of the roof: three sagging strands
    [0, 1, 2].forEach((s) => put(b, s === 1 ? 'orange' : 'marigold', Array.from({ length: 16 }, (_, k) => { const t = k / 15; return { ball: [0.05], p: [-1.0 + t * 2.0, 1.72 - s * 0.14 - Math.sin(t * PI) * 0.16, z + 0.3 + s * 0.04] }; })));
    // brass cage: bars on four sides with a gate gap in front, top rail
    const hw = 1.62;
    barRow(b, 'brass', -hw, hw, hw, hw, 2.0, 0.16, (t) => t > 0.4 && t < 0.6);
    barRow(b, 'brass', -hw, -hw, hw, -hw, 2.0, 0.16);
    barRow(b, 'brass', -hw, -hw, -hw, hw, 2.0, 0.16);
    barRow(b, 'brass', hw, -hw, hw, hw, 2.0, 0.16);
    put(b, 'brass', [hbox(-0.3, 1.0, hw, 0.05, 2.0, 0.05), hbox(0.3, 1.0, hw, 0.05, 2.0, 0.05)]);
  }
  function bellRack(b) {
    // stone frame, four rows of bronze bells, wooden cross bars, red valance
    put(b, 'stoneD', [hbox(-1.0, 0.95, 0, 0.36, 1.9, 0.4), hbox(1.0, 0.95, 0, 0.36, 1.9, 0.4), hbox(0, 1.82, 0, 2.36, 0.22, 0.42), hbox(0, 0.1, 0, 2.5, 0.2, 0.7)]);
    put(b, 'wood', [0.28, 0.62, 0.96, 1.3, 1.62].map((y) => hbox(0, y, 0, 1.7, 0.05, 0.05)));
    const bells = [];
    for (let r = 0; r < 4; r += 1) for (let k = 0; k < 9; k += 1) bells.push({ cyl: [0.03, 0.065, 0.14, 8], p: [-0.72 + k * 0.18, 1.5 - r * 0.34, 0.03 * (r % 2)] });
    put(b, 'bronze', bells);
    put(b, 'red', [hbox(0, 1.64, 0.28, 2.3, 0.3, 0.04)]);
    put(b, 'gold', Array.from({ length: 22 }, (_, k) => hbox(-1.05 + k * 0.1, 1.46, 0.3, 0.05, 0.05, 0.02)));
    put(b, 'bronze', [{ cyl: [0.02, 0.28, 0.42, 14], p: [1.6, 0.62, 0.9] }, { cyl: [0.06, 0.06, 0.1, 8], p: [1.6, 0.9, 0.9] }]);
    put(b, 'stoneD', [hbox(1.6, 0.35, 0.9, 0.5, 0.7, 0.5)]);
  }
  function AshokBody() {
    const M = useM();
    const T = mats(M);
    return (
      <group>
        <Box s={[7.0, 0.15, 5.4]} p={[-0.8, 0.075, 0.2]} m={M.stone} />
        <group position={[0.6, 0.15, 0]}>
          <Box s={[2.3, 0.45, 2.3]} p={[0, 0.225, 0]} m={M.plain('#b58a3a', { metalness: 0.7, roughness: 0.45 })} />
          <Box s={[1.9, 1.35, 1.8]} p={[0, 0.45 + 0.675, -0.02]} m={M.gold} />
          <Rf w={2.9} d={2.9} h={0.8} y={0.45 + 1.31} m={M.gold} sag={1.2} lift={0.1} />
          <Gajur y={0.45 + 1.31 + 0.8 - 0.05} s={0.55} />
          <Details build={ashDeco} />
        </group>
        <group position={[-2.9, 0.15, 0.4]} rotation={[0, 0.35, 0]}>
          <Details build={bellRack} />
          <Rf w={2.6} d={1.2} h={0.32} y={1.93} m={T.tile} sag={1.1} lift={0.05} />
        </group>
      </group>
    );
  }

  /* ---- the layout of the square: x east, z south; r turns the building so its local +z (front) faces that way ---- */
  const SQUARE = {
    'maju-dega': { p: [-10, 0, -3], r: PI / 2, B: MajuBody },
    'jagannath-temple': { p: [4, 0, -15.5], r: 0, B: JagBody },
    kasthamandap: { p: [-10, 0, 13], r: PI / 2, B: KasthaBody },
    'ashok-binayak': { p: [-1.6, 0, 8.4], r: PI / 2, B: AshokBody },
    'kumari-ghar': { p: [5, 0, 19.5], r: PI, B: KumariBody },
    'hanuman-dhoka-palace': { p: [21, 0, -3], r: -PI / 2, B: HanumanBody },
    'kal-bhairav': { p: [18.5, 0, -9], r: -PI / 2, B: KalBody },
    'taleju-temple': { p: [38, 0, -13], r: 0, B: TalejuBody },
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
        <mesh rotation={[-PI / 2, 0, 0]} position={[14, -0.01, 0]} receiveShadow material={M.plain('#b6aa9b', { roughness: 0.96 })}><planeGeometry args={[84, 62]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.plain('#9db77a', { roughness: 1 })} />
        {houses.map((h) => <Townhouse key={h.i} p={h.p} r={h.r} w={3.2 + (h.i % 3) * 0.25} d={2.4} storeys={h.st} plaster={h.i % 3 === 0} pc={['#ece3d2', '#e6d4ae', '#d9ccc0', '#efe5c6', '#cfd3cf'][h.i % 5]} tint={['#f0c2a8', '#e8b29a', '#f4cdb4'][h.i % 3]} shop />)}
        <group position={[27, 0, 14]} rotation={[0, PI, 0]}><GaddiBaithak /></group>
        <Tree p={[-17, 0, 2]} s={1.7} />
        <Tree p={[-18, 0, 20]} s={1.4} />
        {/* Swayambhu hill with its stupa to the west, wooded hills to the north */}
        <group position={[-78, 0, 6]}>
          <mesh position={[0, -3, 0]} scale={[30, 18, 30]} material={M.plain('#6f9a52', { roughness: 1 })}><sphereGeometry args={[1, 24, 12, 0, PI * 2, 0, PI / 2]} /></mesh>
          <Box s={[2.2, 1.0, 2.2]} p={[0, 15, 0]} m={T.white} />
          <Spire r0={1.3} h={2.4} y={15.5} m={T.white} />
          <Spire r0={0.1} h={0.1} y={18} m={M.gold} />
        </group>
        {[[-40, -78, 40, 14], [10, -86, 50, 18], [60, -76, 36, 12]].map(([x, z, r, h], k) => <mesh key={k} position={[x, -3, z]} scale={[r, h, r * 0.6]} material={M.plain('#6e9654', { roughness: 1 })}><sphereGeometry args={[1, 20, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
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
  const TalejuMain = mainOf(TalejuBody, { s: [16.4, 12.4, 16.4], p: [0, 6.2, 0.4] });
  const KumariMain = mainOf(KumariBody, { s: [11, 5, 11], p: [0, 2.5, 0.8] });
  const HanumanMain = mainOf(HanumanBody, { s: [26, 10.2, 16], p: [2.4, 5.1, -2.6] });
  const KalMain = mainOf(KalBody, { s: [9, 7.0, 6], p: [0, 3.5, 0.7] });
  const AshokMain = mainOf(AshokBody, { s: [6.6, 3.4, 4.8], p: [-0.7, 1.7, 0.4] });

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
    const black = M.plain('#3a3c40', { roughness: 0.82 });
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
        <Water w={10.2} d={6.2} p={[0, 0.34, 0]} color="#5d6a4c" />
        <Box s={[10.2, 0.1, 6.2]} p={[0, 0.02, 0]} m={M.plain('#2a3a38')} cast={false} />
        {/* the serpent's coils */}
        {coils.map(([y, s], k) => (
          <mesh key={k} position={[0, y, 0]} rotation={[PI / 2, 0, 0]} scale={[s * 1.15, s * 0.78, 1]} material={M.plain(k % 2 ? '#35373b' : '#3f4145', { roughness: 0.85 })} castShadow>
            <torusGeometry args={[0.72, 0.27, 10, 28]} />
          </mesh>
        ))}
        <Ball rad={1} sc={[2.9, 0.5, 1.7]} p={[0, 0.4, 0]} m={black} />
        {/* Vishnu reclining, head to the right */}
        <group position={[-0.3, 0, 0]} scale={1.4}>
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
        </group>
        {/* brick retaining wall of the tank with its niches */}
        <Box s={[11.8, 2.0, 0.6]} p={[0, 1.0, -3.95]} m={M.mat('brick', 8, 1.4, { color: '#e29a80' })} />
        {Array.from({ length: 9 }, (_, k) => <Box key={'n' + k} s={[0.42, 0.6, 0.06]} p={[-4.8 + k * 1.2, 1.2, -3.63]} m={T.dark} cast={false} />)}
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
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 1]} receiveShadow material={M.plain('#e2d7c2', { roughness: 0.95 })}><planeGeometry args={[24, 17]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.plain('#a8c07e', { roughness: 1 })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.plain('#9cb872', { roughness: 1 })}><circleGeometry args={[40, 48]} /></mesh>
        {/* temple compound behind: white walls under a yellow railing, red-brick halls, a red-roofed shrine */}
        <Box s={[22, 1.5, 0.5]} p={[0, 0.75, -8.2]} m={T.white} />
        <Box s={[22, 0.4, 0.1]} p={[0, 1.75, -8.2]} m={M.plain('#e8b21a', { roughness: 0.6 })} />
        <group position={[-7, 0, -12]}><Townhouse p={[0, 0, 0]} w={5} d={3.4} storeys={2} tint="#e0805f" shop={false} /></group>
        <group position={[2, 0, -12.5]}>
          <Pagoda base={0} tiers={[{ w: 3.4, d: 3.4, h: 1.5, ov: 1.0, rh: 0.8, tint: '#e2886a' }, { w: 2.3, d: 2.3, h: 1.0, ov: 0.8, rh: 0.7, wall: 'plaster', door: false }]} roofM={M.plain('#b2352a', { roughness: 0.7 })} gs={0.8} />
        </group>
        <group position={[10, 0, -11]}><Townhouse p={[0, 0, 0]} w={4.4} d={3.2} storeys={3} plaster pc="#f3ead3" shop={false} /></group>
        {trees.map((t, i) => <Tree key={i} p={t.p} s={t.s} kind={t.kind} />)}
        <mesh position={[0, -4, -62]} scale={[75, 30, 38]} material={M.plain('#5f8350', { roughness: 1 })}><sphereGeometry args={[1, 28, 12, 0, PI * 2, 0, PI / 2]} /></mesh>
        <mesh position={[-45, -4, -50]} scale={[40, 20, 26]} material={M.plain('#6a8c56', { roughness: 1 })}><sphereGeometry args={[1, 24, 10, 0, PI * 2, 0, PI / 2]} /></mesh>
        <mesh position={[48, -4, -52]} scale={[40, 22, 26]} material={M.plain('#628652', { roughness: 1 })}><sphereGeometry args={[1, 24, 10, 0, PI * 2, 0, PI / 2]} /></mesh>
        {ringOf(14, 21, (p, r, i) => (i % 2 ? <Townhouse key={i} p={p} r={r} w={3} d={2.4} storeys={2 + (i % 2)} plaster pc="#efe5c6" /> : null), (a) => a < PI * 0.15 || a > PI * 0.85)}
      </group>
    );
  }

  /* ---------------- Bagh Bhairab: the broad three-roofed temple of Kirtipur: a wide low red-valanced roof over an open pillared hall, then two tall
                        dark storeys of carved lattice windows with swords hung on them, and a small metal-roofed crown with a row of finials ---------------- */
  const BAGH_TIERS = [
    { w: 7.6, d: 5.8, h: 1.7, ov: 1.45, rh: 0.85, open: true, inner: true, gap: 1.05 },
    { w: 5.6, d: 4.3, h: 2.3, ov: 1.1, rh: 0.78, door: false, windows: false, struts: false, tint: '#d9987f' },
    { w: 4.1, d: 3.1, h: 2.0, ov: 0.95, rh: 0.72, door: false, windows: false, struts: false, wall: 'dark' },
  ];
  /** A tall band of dark carved lattice windows round a storey: frame, dark openings, light lattice bars. */
  function latticeBand(b, w, d, y, hh, cols = 0.135) {
    [0, PI / 2, PI, -PI / 2].forEach((yaw, k) => {
      const len = k % 2 ? d : w; const half = (k % 2 ? w : d) / 2;
      const n = Math.max(3, Math.round((len * 0.9) / (cols * 6)));
      const wall = (len * 0.92) / n;
      const A = []; const D = []; const Bb = [];
      for (let i = 0; i < n; i += 1) {
        const cx = -len * 0.46 + (i + 0.5) * wall;
        A.push(hbox(cx - wall / 2, 0, 0.03, 0.08, hh, 0.09));
        D.push(hbox(cx, 0, 0.02, wall - 0.1, hh * 0.9, 0.05));
        const nb = Math.round((wall - 0.1) / cols);
        for (let j = 0; j < nb; j += 1) Bb.push(hbox(cx - (wall - 0.1) / 2 + ((j + 0.5) * (wall - 0.1)) / nb, 0, 0.06, 0.022, hh * 0.9, 0.03));
        Bb.push(hbox(cx, hh * 0.1, 0.07, wall - 0.1, 0.03, 0.03), hbox(cx, -hh * 0.25, 0.07, wall - 0.1, 0.03, 0.03));
      }
      A.push(hbox(len * 0.46, 0, 0.03, 0.08, hh, 0.09), hbox(0, hh / 2 + 0.05, 0.04, len * 0.97, 0.1, 0.12), hbox(0, -hh / 2 - 0.05, 0.05, len * 0.97, 0.1, 0.14));
      put(b, 'wood', A, [0, y, 0], yaw, 1);
      put(b, 'dark', D.map((q) => ({ ...q, p: [q.p[0], q.p[1], q.p[2] + half] })), [0, y, 0], yaw);
      put(b, 'bar', Bb.map((q) => ({ ...q, p: [q.p[0], q.p[1], q.p[2] + half] })), [0, y, 0], yaw);
    });
  }
  function baghDeco(b, i, y, t, lite) {
    const { w, d, h, ov } = t;
    if (i === 0) {
      tunala(b, { w, d, y: y + h - 0.04, ov, h: 0.65, nx: 13, nz: 10 });
      return;
    }
    if (i === 1) {
      [0, PI / 2, PI, -PI / 2].forEach((yaw, k) => { const half = (k % 2 ? w : d) / 2; [-1.3, 0, 1.3].forEach((x) => cWin(b, at([0, y + 0.8, 0], yaw, x * (k % 2 ? 0.8 : 1), 0, half), yaw, { n: 1, ow: 0.42, oh: 0.52, arch: false, lite })); });
      latticeBand(b, w + 0.02, d + 0.02, y + h * 0.7, h * 0.42);
    } else {
      latticeBand(b, w + 0.02, d + 0.02, y + h * 0.52, h * 0.68);
      // old swords hung in bunches on the front of the storey
      const sw = [];
      for (let k = 0; k < 7; k += 1) sw.push({ s: [0.04, 0.9, 0.014], p: [-1.5 + k * 0.5, 0, 0.0], r: [0, 0, (k % 2 ? 0.1 : -0.1)] });
      put(b, 'silver', sw, [0, y + h * 0.5, d / 2 + 0.1]);
      put(b, 'gold', Array.from({ length: 7 }, (_, k) => hbox(-1.5 + k * 0.5, y + h * 0.5 + 0.45, d / 2 + 0.1, 0.07, 0.07, 0.03)));
    }
    put(b, 'ink', [hbox(0, y + 0.06, 0, w + 0.1, 0.14, d + 0.1)]);
    tunala(b, { w, d, y: y + h - 0.04, ov, h: 0.62, nx: Math.round(w / 0.5), nz: Math.round(d / 0.5) });
  }
  function baghCrown(b, top) {
    put(b, 'gold', Array.from({ length: 9 }, (_, k) => ({ cone: [0.06, 0.3, 6], p: [-1.2 + k * 0.3, top + 0.3, 0] })));
  }
  function BaghMain() {
    const M = useM();
    const T = mats(M);
    const grey = M.mat('granite', 1, 1, { color: '#8e887d' });
    const metal = M.plain('#8e9499', { metalness: 0.65, roughness: 0.45 });
    const ys = tierBases(0.5, BAGH_TIERS, 1.1);
    const top = ys[ys.length - 1];
    const extras = useMemo(() => {
      const b = {};
      baghCrown(b, top + 0.7);
      // stone pillars with lamps, small stone shikhara, stone chaityas and a stone lion in the courtyard
      [-4.2, 4.2].forEach((x) => put(b, 'stoneL', [hbox(x, 0.4, 4.0, 0.62, 0.3, 0.62), { cyl: [0.16, 0.2, 2.0, 10], p: [x, 1.45, 4.0] }, { cyl: [0.26, 0.2, 0.16, 10], p: [x, 2.5, 4.0] }, hbox(x, 2.7, 4.0, 0.4, 0.2, 0.4)]));
      chaitya(b, [-6.8, 0.5, 2.4], 1.5, 'stoneL'); chaitya(b, [6.9, 0.5, 1.2], 1.1, 'stoneL');
      lion(b, [5.8, 0.5, 4.4], -0.5, 1.4, 'st');
      put(b, 'stoneL', [hbox(-6.2, 0.5, 4.8, 1.2, 0.4, 1.2), { ball: [0.4], sc: [1, 0.9, 1], p: [-6.2, 1.0, 4.8] }]);
      return b;
    }, []); // eslint-disable-line
    return (
      <group>
        <StepPlinth steps={2} w={12.2} d={10.4} stepH={0.25} inset={0.5} stairs={[0]} sw={3.2} brickC="#cdb7a4" top="#b9a58f" />
        <Pagoda base={0.5} tiers={BAGH_TIERS} roofM={T.tile} sag={1.1} lift={0.07} finial={false} deco={(i, y, t) => <Details build={(b) => baghDeco(b, i, y, t, false)} />} />
        <Box s={[2.3, 0.75, 1.7]} p={[0, top + 0.28, 0]} m={M.plain('#3a2a20', { roughness: 0.7 })} />
        <group position={[0, top + 0.66, 0]}><Rf w={3.4} d={2.8} h={0.42} y={0} m={metal} sag={1.1} lift={0.03} /></group>
        <Bag bag={extras} />
        <Frame s={[14, 6.6, 12]} p={[0, 3.3, 0.5]} />
      </group>
    );
  }
  /** The ridge of Kirtipur: a paved courtyard on the hilltop edge held by a stone wall, village houses, a peepal tree, fields and the valley below. */
  function BaghEnv() {
    const M = useM();
    const T = mats(M);
    const stone = M.mat('granite', 3, 1, { color: '#a49c8e' });
    const houses = useMemo(() => {
      const out = [];
      for (let k = 0; k < 7; k += 1) out.push({ p: [-11 + k * 3.8, 0, -10.5], r: 0, st: 3 + (k % 2) });
      for (let k = 0; k < 5; k += 1) out.push({ p: [-12.5, 0, -6 + k * 3.8], r: PI / 2, st: 2 + (k % 3) });
      for (let k = 0; k < 5; k += 1) out.push({ p: [12.5, 0, -6 + k * 3.8], r: -PI / 2, st: 3 });
      return out;
    }, []);
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.plain('#b3a392', { roughness: 0.96 })}><planeGeometry args={[27, 23]} /></mesh>
        <mesh position={[0, -9.02, 0]} material={M.plain('#8aa462', { roughness: 1 })} receiveShadow><cylinderGeometry args={[19, 40, 18, 48]} /></mesh>
        <GroundDisc r={110} y={-18} m={M.plain('#b8c890', { roughness: 1 })} />
        {[[-30, -14, 22, 14], [34, -20, 26, 10], [0, -30, 30, 8], [-6, 30, 24, 10], [26, 22, 20, 9]].map(([x, z, w, d], k) => <mesh key={k} rotation={[-PI / 2, 0, 0]} position={[x, -17.9, z]} material={M.plain(['#c4b45a', '#7fa04a', '#a9b856', '#8aa84e', '#cbb85e'][k], { roughness: 1 })}><planeGeometry args={[w, d]} /></mesh>)}
        {/* the retaining wall round the hilltop courtyard, with a coping */}
        {[[0, 11.7, 27.6, 0.5], [0, -11.7, 27.6, 0.5], [13.8, 0, 0.5, 23.4], [-13.8, 0, 0.5, 23.4]].map(([x, z, w, d], k) => (
          <group key={k}><Box s={[w, 1.0, d]} p={[x, 0.5, z]} m={stone} /><Box s={[w + 0.12, 0.1, d + 0.12]} p={[x, 1.04, z]} m={M.plain('#c9c1b2')} cast={false} /></group>
        ))}
        {houses.map((h, i) => <Townhouse key={i} p={h.p} r={h.r} w={3.5} d={2.5} storeys={h.st} plaster={i % 4 === 1} pc={i === 3 ? '#c9483a' : '#e6d4ae'} />)}
        <Townhouse p={[-12.5, 0, 14]} r={PI / 2} w={3.6} d={2.6} storeys={3} plaster pc="#c4443a" />
        <SacredTree p={[-9.5, 0, 8.6]} />
        <Tree p={[10.5, 0, 9]} s={1.8} />
        <Tree p={[13, 0, -8]} s={1.5} />
        {/* houses climbing down the slope below the courtyard, and a white stupa on the next spur */}
        {Array.from({ length: 14 }, (_, k) => { const a = 0.15 + (k / 13) * (PI * 0.7); return <Townhouse key={`s${k}`} p={[Math.cos(a) * 26, -4 - (k % 3) * 2.2, Math.sin(a) * 26 + 6]} r={-a + PI / 2} w={3} d={2.4} storeys={2 + (k % 2)} plaster={k % 3 === 0} />; })}
        <group position={[-34, -12, 24]}><Box s={[1.8, 0.7, 1.8]} p={[0, 0.35, 0]} m={T.white} /><Spire r0={0.9} h={2.4} y={0.7} m={T.white} /></group>
        {[[-60, -45, 40, 18], [30, -70, 60, 26]].map(([x, z, r, h], k) => <mesh key={`g${k}`} position={[x, -18, z]} scale={[r, h, r * 0.6]} material={M.plain('#6b8a56', { roughness: 1 })}><sphereGeometry args={[1, 20, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
      </group>
    );
  }

  /* ---------------- Seto Machindranath: the temple in the Jana Bahal courtyard: two low roofs of grey metal sheet with a gilt fringe hanging from the
                        eaves over dark carved timber, a gilded front, bronze lions and pillars, and dozens of stone chaityas in the bahal ---------------- */
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
  const SETO_TIERS = [
    { w: 3.9, d: 3.9, h: 1.9, ov: 1.75, rh: 0.62, wall: 'dark', door: false, windows: false, struts: false },
    { w: 2.5, d: 2.5, h: 1.15, ov: 1.1, rh: 0.58, wall: 'gold', door: false, windows: false, struts: false },
  ];
  /** Gilt fringe of hanging tags along all four eaves, one mesh. */
  function giltFringe(b, rw, rd, y) {
    [[0, rw, rd / 2], [PI, rw, rd / 2], [PI / 2, rd, rw / 2], [-PI / 2, rd, rw / 2]].forEach(([yaw, len, hw]) => {
      const n = Math.round(len / 0.2); const A = [hbox(0, y + 0.02, hw + 0.01, len, 0.04, 0.03)];
      for (let k = 0; k < n; k += 1) A.push(hbox(-len / 2 + ((k + 0.5) * len) / n, y - 0.1, hw + 0.01, 0.1, 0.2, 0.014), { cone: [0.05, 0.1, 3], p: [-len / 2 + ((k + 0.5) * len) / n, y - 0.25, hw + 0.01], r: [PI, 0, 0] });
      put(b, 'gold', A, [0, 0, 0], yaw);
    });
  }
  function setoDeco(b, i, y, t, lite) {
    const { w, d, h, ov } = t;
    if (i === 0) {
      put(b, 'gold', [hbox(0, y + 0.85, d / 2 + 0.03, 2.7, 1.7, 0.06)]);
      cDoor(b, [0, y + 0.02, d / 2 + 0.05], 0, { w: 1.0, h: 1.25 });
      [-1, 1].forEach((sx) => cWin(b, [sx * 1.15, y + 1.4, d / 2 + 0.05], 0, { n: 1, ow: 0.4, oh: 0.45, fk: 'gold', lite }));
      [0, PI / 2, PI, -PI / 2].forEach((yaw, k) => { if (k) cWin(b, at([0, y + 1.0, 0], yaw, 0, 0, (k % 2 ? w : d) / 2), yaw, { n: 3, ow: 0.45, oh: 0.8, g: 0.14, lite }); });
      // verandah posts round the cella and their beam
      const hw = 2.6; const A = [];
      [-hw, -hw / 3, hw / 3, hw].forEach((x) => A.push({ cyl: [0.09, 0.11, 1.8, 8], p: [x, y + 0.9, hw] }, { cyl: [0.09, 0.11, 1.8, 8], p: [x, y + 0.9, -hw] }));
      [-hw / 3, hw / 3].forEach((z) => A.push({ cyl: [0.09, 0.11, 1.8, 8], p: [hw, y + 0.9, z] }, { cyl: [0.09, 0.11, 1.8, 8], p: [-hw, y + 0.9, z] }));
      put(b, 'wood', A);
      put(b, 'ink', [hbox(0, y + 1.82, hw, hw * 2 + 0.3, 0.16, 0.2), hbox(0, y + 1.82, -hw, hw * 2 + 0.3, 0.16, 0.2), hbox(hw, y + 1.82, 0, 0.2, 0.16, hw * 2), hbox(-hw, y + 1.82, 0, 0.2, 0.16, hw * 2)]);
    } else {
      [0, PI / 2, PI, -PI / 2].forEach((yaw, k) => cWin(b, at([0, y + 0.55, 0], yaw, 0, 0, (k % 2 ? w : d) / 2), yaw, { n: 2, ow: 0.4, oh: 0.5, g: 0.12, lite }));
    }
    tunala(b, { w, d, y: y + h - 0.04, ov, h: 0.55, nx: Math.round(w / 0.5), nz: Math.round(d / 0.5) });
    giltFringe(b, w + 2 * ov, d + 2 * ov, y + h - 0.12);
  }
  const SETO_CH = (() => {
    const out = [];
    [[-7.4, -5.9, -4.5], [7.4, 5.9, 4.5]].forEach((cols) => cols.forEach((x, c) => { for (let k = 0; k < 6; k += 1) { const z = -5.4 + k * 1.9 + (c % 2) * 0.5; if (!(Math.abs(x) < 5 && z > 2.6)) out.push([x, 0.3, z]); } }));
    for (let k = 0; k < 7; k += 1) out.push([-6 + k * 2, 0.3, -6.5 + (k % 2) * 0.4]);
    [-6.2, -2.4, 2.4, 6.2].forEach((x, k) => out.push([x, 0.3, 6.0 + (k % 2) * 0.5]));
    return out.filter(([x, , z]) => !(Math.abs(x) < 4.3 && Math.abs(z) < 4.3));
  })();
  function SetoMain({ lite }) {
    const M = useM();
    const T = mats(M);
    const grey = M.mat('granite', 1, 1, { color: '#a49d90' });
    const roofGrey = M.plain('#8c9094', { metalness: 0.6, roughness: 0.5 });
    const metal = M.plain('#a0a5aa', { metalness: 0.7, roughness: 0.38 });
    const yard = useMemo(() => {
      const b = {};
      SETO_CH.forEach(([x, y, z], i) => chaitya(b, [x, y, z], 0.95 + (i % 3) * 0.14, 'stone'));
      [-1, 1].forEach((sx) => { put(b, 'stoneL', [hbox(sx * 1.7, 0.45, 4.3, 0.95, 0.3, 1.0)]); lion(b, [sx * 1.7, 0.6, 4.3], 0, 1.5, 'br'); });
      // the iron-caged lamp stand and the carved gateway posts of the bahal
      put(b, 'black', [{ cyl: [0.4, 0.4, 0.05, 16], p: [3.8, 0.45, -2.6] }, { cyl: [0.03, 0.03, 0.9, 6], p: [3.8, 0.7, -2.6] }]);
      return b;
    }, []);
    return (
      <group>
        <Box s={[7.6, 0.3, 7.6]} p={[0, 0.15, 0]} m={M.stone} />
        <Pagoda base={0.3} tiers={SETO_TIERS} roofM={metal} gs={1.0} sag={1.05} lift={0.03} fringe={false} deco={(i, y, t) => <Details build={(b) => setoDeco(b, i, y, t, lite)} />} />
        <Bag bag={yard} />
        <BronzePillar p={[-3.7, 0.3, 4.5]} s={1.15} />
        <BronzePillar p={[3.7, 0.3, 4.5]} s={1.15} />
        <BronzePillar p={[-5.2, 0.3, -2.4]} />
        {/* two small brick shrines with grey metal roofs */}
        {[[-5.3, 1.6], [5.3, 1.2]].map(([x, z], k) => (
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
        <Frame s={[13, 6.2, 13.5]} p={[0, 3.1, 1.4]} />
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
      for (let k = 0; k < 7; k += 1) if (k < 2 || k > 4) out.push({ p: [-11 + k * 3.7, 0, 12.5], r: PI, st: 2 });
      return out;
    }, []);
    return (
      <group>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={M.plain('#cfc4b0', { roughness: 0.95 })}><planeGeometry args={[28, 27]} /></mesh>
        <GroundDisc r={95} y={-0.04} m={M.plain('#d6ccb8', { roughness: 1 })} />
        {houses.map((h, i) => <Townhouse key={i} p={h.p} r={h.r} w={3.6} d={2.5} storeys={h.st} plaster={false} tint={['#f0c2a8', '#e4a98c', '#e9b9a0'][i % 3]} shop={i % 2 === 0} ornate />)}
        {[[-20, -14], [-19, 6], [20, -12], [21, 9], [-4, -22], [8, -23]].map(([x, z], k) => <Townhouse key={`o${k}`} p={[x, 0, z]} r={k} w={4} d={3} storeys={4 + (k % 2)} plaster pc={['#d8d0c4', '#e6dcc0', '#cdd3d1'][k % 3]} neo />)}
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
        <GroundDisc r={100} y={-0.04} m={M.plain('#b2c586', { roughness: 1 })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 2]} receiveShadow material={M.plain('#a6c07a', { roughness: 1 })}><planeGeometry args={[40, 34]} /></mesh>
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
        {[[-60, -70, 52, 18], [20, -78, 70, 22], [70, -60, 40, 14]].map(([x, z, r, h], k) => <mesh key={k} position={[x, -2, z]} scale={[r, h, r * 0.55]} material={M.plain('#6b8a58', { roughness: 1 })}><sphereGeometry args={[1, 20, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
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
        <GroundDisc r={100} y={-0.04} m={M.plain('#d2c9b6', { roughness: 1 })} />
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.02, 10]}><ringGeometry args={[9.5, 11, 32, 1, 0, 2 * PI]} /><meshStandardMaterial color="#5a5a5e" roughness={0.95} /></mesh>
        {blocks.map((b) => <Townhouse key={b.i} p={b.p} r={b.r} w={3.6 + (b.i % 3) * 0.5} d={2.8} storeys={b.st} plaster pc={b.pc} neo shop={b.i % 2 === 0} />)}
        {[[-7, 7], [7.5, 6.5], [-8, -3], [8, -4]].map(([x, z], k) => <Tree key={k} p={[x, 0, z]} s={1.4} />)}
        {[[-70, -75, 60, 24], [10, -85, 80, 28], [75, -70, 55, 22]].map(([x, z, r, h], k) => <mesh key={k} position={[x, -3, z]} scale={[r, h, r * 0.55]} material={M.plain('#4d6e4a', { roughness: 1 })}><sphereGeometry args={[1, 22, 10, 0, PI * 2, 0, PI / 2]} /></mesh>)}
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
