// Hand-built landmarks for Patan (Lalitpur): the Durbar Square with its palace and temples, the courtyards, Kumbheshwar,
// the Golden Temple, Mahabouddha, Rato Machhindranath and the Lagankhel Ashoka stupa.
import { useLayoutEffect, useMemo, useRef } from 'react';

export default function make(K) {
  const {
    useM, Box, Cyl, Ball, Roof, Gajur, Lion, Elephant, Garuda, Goddess, Nandi, Lingam, Trident, Frame, Water, GroundDisc,
    Doorway, Chhatri, PrayerFlags, PrayerWheels, Tree, Diyo, THREE,
  } = K;

  /* ------------------------------------------------------------------ textures and materials */
  const brickM = (M, rx = 2, ry = 1, c = '#e6b097') => M.mat('brick', rx, ry, { color: c });
  const stoneM = (M, rx = 1, ry = 1, c = '#cdbfa3') => M.mat('granite', rx, ry, { color: c });
  const tileM = (M, c = '#8a5e4c', rx = 3, ry = 3) => M.mat('roof', rx, ry, { color: c });
  const timberM = (M, c = '#4a2a16') => M.plain(c, { roughness: 0.8 });
  const paveM = (M, rx, ry, c = '#e4b9a2') => M.mat('herring', rx, ry, { color: c });

  const mk = (w, h, fn) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  };
  let latBase = null;
  const latCache = {};
  /** Carved timber lattice: dark ground with a light grid and diamonds. */
  function latMat(rx = 1, ry = 1) {
    const key = `${rx}|${ry}`;
    if (!latBase) {
      latBase = mk(128, 128, (g) => {
        g.fillStyle = '#26150b'; g.fillRect(0, 0, 128, 128);
        g.strokeStyle = '#9b6232'; g.lineWidth = 4;
        for (let i = 0; i <= 128; i += 21) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
        g.strokeStyle = '#c28a4e'; g.lineWidth = 2;
        for (let i = 10; i < 128; i += 21) for (let j = 10; j < 128; j += 21) { g.beginPath(); g.moveTo(i - 8, j); g.lineTo(i, j - 8); g.lineTo(i + 8, j); g.lineTo(i, j + 8); g.closePath(); g.stroke(); }
      });
    }
    if (!latCache[key]) {
      const t = latBase.clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
      latCache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
    }
    return latCache[key];
  }
  const archCache = {};
  /** A row of n cusped stone arches (dark openings) on a stone ground, used for the open pavilion storeys. */
  function archMat(n, base = '#9a8e78') {
    const key = `${n}${base}`;
    if (!archCache[key]) {
      const t = mk(96 * n, 128, (g, W, H) => {
        g.fillStyle = base; g.fillRect(0, 0, W, H);
        for (let i = 0; i < n; i += 1) {
          const x0 = i * 96;
          g.fillStyle = '#17110c';
          g.beginPath(); g.moveTo(x0 + 12, H); g.lineTo(x0 + 12, 64);
          g.quadraticCurveTo(x0 + 14, 42, x0 + 32, 38); g.quadraticCurveTo(x0 + 44, 32, x0 + 48, 12);
          g.quadraticCurveTo(x0 + 52, 32, x0 + 64, 38); g.quadraticCurveTo(x0 + 82, 42, x0 + 84, 64);
          g.lineTo(x0 + 84, H); g.closePath(); g.fill();
          g.fillStyle = 'rgba(255,240,210,0.16)'; g.fillRect(x0 + 2, 0, 8, H); g.fillRect(x0 + 86, 0, 8, H);
        }
        g.fillStyle = 'rgba(20,12,6,0.25)'; g.fillRect(0, H - 14, W, 14);
      });
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      archCache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
    }
    return archCache[key];
  }

  /* ------------------------------------------------------------------ generic helpers */
  /** Many boxes (or cones, cylinders) as one instanced mesh. item = [x, y, z, sx, sy, sz, ry, rx, rz]. */
  function Inst({ items, m, kind = 'box', cast = false }) {
    const ref = useRef();
    const geo = useMemo(() => {
      let g;
      if (kind === 'cone4') { g = new THREE.ConeGeometry(0.7071, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); }
      else if (kind === 'cyl') g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
      else g = new THREE.BoxGeometry(1, 1, 1);
      return g;
    }, [kind]);
    useLayoutEffect(() => {
      const o = new THREE.Object3D();
      o.rotation.order = 'YXZ';
      items.forEach((it, i) => {
        const [x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0] = it;
        o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return <instancedMesh key={`${kind}${items.length}`} ref={ref} args={[geo, undefined, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false} />;
  }

  /** Low-pitch hip roof with a ridge, for long palace wings (x length, z depth). */
  function hipRoofGeo(w, d, h, ov = 0.6) {
    const A = w / 2 + ov;
    const B = d / 2 + ov;
    const R = Math.max(0.02, A - B);
    const e = [[-A, 0, -B], [A, 0, -B], [A, 0, B], [-A, 0, B]];
    const r = [[-R, h, 0], [R, h, 0]];
    const tris = [[e[3], e[2], r[1]], [e[3], r[1], r[0]], [e[1], e[0], r[0]], [e[1], r[0], r[1]], [e[0], e[3], r[0]], [e[2], e[1], r[1]]];
    const pos = []; const uv = [];
    tris.forEach((t) => t.forEach((p) => { pos.push(p[0], p[1], p[2]); uv.push(p[0] / 2.4, p[2] / 2.4 + p[1] / 3); }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function HipRoof({ w, d, h, y = 0, ov = 0.6, m, fascia = true }) {
    const M = useM();
    const g = useMemo(() => hipRoofGeo(w, d, h, ov), [w, d, h, ov]);
    const A = w / 2 + ov; const B = d / 2 + ov;
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={g} material={m} castShadow receiveShadow />
        {fascia && (
          <>
            <Box s={[2 * A, 0.1, 0.08]} p={[0, -0.04, B]} m={timberM(M)} cast={false} />
            <Box s={[2 * A, 0.1, 0.08]} p={[0, -0.04, -B]} m={timberM(M)} cast={false} />
            <Box s={[0.08, 0.1, 2 * B]} p={[A, -0.04, 0]} m={timberM(M)} cast={false} />
            <Box s={[0.08, 0.1, 2 * B]} p={[-A, -0.04, 0]} m={timberM(M)} cast={false} />
          </>
        )}
      </group>
    );
  }
  /** Roof around a courtyard: slopes out to the street and in to the yard, meeting at a ridge ring. */
  function ringRoofGeo(wo, dO, t, h) {
    const loop = (w, d, y) => [[-w / 2, y, -d / 2], [w / 2, y, -d / 2], [w / 2, y, d / 2], [-w / 2, y, d / 2]];
    const A = loop(wo, dO, 0); const B = loop(wo - t * 1.1, dO - t * 1.1, h); const C = loop(wo - t * 2.2, dO - t * 2.2, 0.1);
    const pos = []; const uv = [];
    const band = (P, Q) => {
      for (let i = 0; i < 4; i += 1) {
        const j = (i + 1) % 4;
        [[P[i], P[j], Q[j]], [P[i], Q[j], Q[i]]].forEach((tr) => tr.forEach((p) => { pos.push(...p); uv.push(p[0] / 2.4, p[2] / 2.4 + p[1] / 3); }));
      }
    };
    band(A, B); band(B, C);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function RingRoof({ w, d, t, h, y, m }) {
    const g = useMemo(() => ringRoofGeo(w, d, t, h), [w, d, t, h]);
    return <mesh geometry={g} position={[0, y, 0]} material={m} castShadow receiveShadow />;
  }

  /** Slanted carved struts (tunala) under an eave, as one instanced mesh. */
  function strutItems(w, d, y, h = 0.7, n = 4, sides = 'all') {
    const it = [];
    [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]].forEach(([sx, sz, ry]) => {
      if (sides === 'long' && sx) return;
      const len = sx ? d : w;
      const cnt = sx ? Math.max(2, Math.round((n * d) / w)) : n;
      const half = (sx ? w : d) / 2;
      for (let k = 0; k < cnt; k += 1) {
        const u = ((k + 0.5) / cnt - 0.5) * len * 0.92;
        const v = half + h * 0.3;
        it.push([sx ? sx * v : u, y - h / 2, sz ? sz * v : u, 0.08, h, 0.08, ry, 0.7, 0]);
      }
    });
    return it;
  }
  /** Window placement on one face of a box: face 0 +z, 1 -z, 2 +x, 3 -x. u runs along the face. */
  const onFace = (face, w, d, u, y, off) => {
    if (face === 0) return [u, y, d / 2 + off, 0];
    if (face === 1) return [-u, y, -d / 2 - off, Math.PI];
    if (face === 2) return [w / 2 + off, y, -u, Math.PI / 2];
    return [-w / 2 - off, y, u, -Math.PI / 2];
  };
  function ringColumns(hx, hz, nx, nz, y, h, r = 0.15) {
    const it = [];
    for (let i = 0; i <= nx; i += 1) { const x = -hx + (2 * hx * i) / nx; it.push([x, y + h / 2, hz, r, h, r], [x, y + h / 2, -hz, r, h, r]); }
    for (let k = 1; k < nz; k += 1) { const z = -hz + (2 * hz * k) / nz; it.push([hx, y + h / 2, z, r, h, r], [-hx, y + h / 2, z, r, h, r]); }
    return it;
  }

  /** Stepped plinth with a front stair (faces +z). Returns nothing about height: levels * lh. */
  function Plat({ w, d, levels = 2, lh = 0.34, off = 0.7, m, stairW = 1.6, stairs = true, run = 0.9 }) {
    const M = useM();
    const st = stoneM(M);
    const out = [];
    for (let i = 0; i < levels; i += 1) {
      const k = levels - 1 - i;
      out.push(<Box key={`l${i}`} s={[w + 2 * off * k, lh, d + 2 * off * k]} p={[0, i * lh + lh / 2, 0]} m={m} />);
      out.push(<Box key={`c${i}`} s={[w + 2 * off * k + 0.08, 0.05, d + 2 * off * k + 0.08]} p={[0, (i + 1) * lh - 0.02, 0]} m={st} cast={false} />);
    }
    if (stairs) {
      const n = levels * 3;
      const bottom = d / 2 + off * (levels - 1) + run;
      const top = d / 2;
      const rs = (bottom - top) / n;
      const H = levels * lh;
      for (let k = 0; k < n; k += 1) out.push(<Box key={`s${k}`} s={[stairW, ((k + 1) * H) / n, rs + 0.02]} p={[0, ((k + 1) * H) / (2 * n), bottom - (k + 0.5) * rs]} m={st} />);
    }
    return <group>{out}</group>;
  }

  /* ------------------------------------------------------------------ the Newar pagoda */
  /** Multi-roofed pagoda. tiers: [{w, d, h (wall height), ov (eave overhang), rh (roof rise)}], bottom first. */
  function Pagoda({ tiers, y0 = 0, wall, roofM, arcade = false, win = 'lattice', gold = false, finial = 1.1, lod = 1, doorW = 0.7, flank = true, gilt = false, children }) {
    const M = useM();
    const timber = timberM(M);
    const rm = roofM || tileM(M);
    const parts = []; const fr = []; const lt = []; const stt = []; const bl = [];
    let y = y0;
    let apex = y0;
    tiers.forEach((t, i) => {
      const { w, d, h, ov = 0.3 * w, rh = 0.5, m: tm } = t;
      const eave = y + h - 0.05;
      if (i === 0 && arcade) {
        parts.push(<Box key="cella" s={[w - 0.9, h, d - 1.2]} p={[0, y + h / 2, -0.35]} m={wall} />);
        parts.push(<Box key="sl" s={[0.4, h, d]} p={[-w / 2 + 0.2, y + h / 2, 0]} m={wall} />);
        parts.push(<Box key="sr" s={[0.4, h, d]} p={[w / 2 - 0.2, y + h / 2, 0]} m={wall} />);
        parts.push(<Box key="bk" s={[w, h, 0.4]} p={[0, y + h / 2, -d / 2 + 0.2]} m={wall} />);
        const n = Math.max(4, Math.round(w / 0.85));
        for (let k = 0; k <= n; k += 1) {
          const x = -w / 2 + 0.5 + ((w - 1) * k) / n;
          stt.push([x, y + h / 2 - 0.05, d / 2 - 0.2, 0.17, h - 0.3, 0.17]);
        }
        parts.push(<Box key="beam" s={[w - 0.4, 0.2, 0.26]} p={[0, y + h - 0.2, d / 2 - 0.2]} m={timber} />);
        parts.push(<Box key="door" s={[0.8, h * 0.62, 0.06]} p={[0, y + h * 0.31, d / 2 - 1.12]} m={gold ? M.gold : timberM(M, '#3a1e10')} />);
        for (let k = 0; k < n; k += 1) {
          const x = -w / 2 + 0.5 + ((w - 1) * (k + 0.5)) / n;
          parts.push(<mesh key={`tor${k}`} position={[x, y + h - 0.42, d / 2 - 0.12]} material={M.gold}><torusGeometry args={[0.3, 0.035, 6, 14, Math.PI]} /></mesh>);
        }
      } else {
        parts.push(<Box key={`w${i}`} s={[w, h, d]} p={[0, y + h / 2, 0]} m={wall} />);
      }
      parts.push(<Box key={`b${i}`} s={[w + 0.08, 0.1, d + 0.08]} p={[0, y + h - 0.05, 0]} m={timber} cast={false} />);
      if (i === 0 && !arcade) {
        parts.push(<Doorway key="door" p={[0, y, d / 2 + 0.01]} w={doorW} h={Math.min(h * 0.74, 1.2)} gold={gold} />);
        if (flank && w > 2.6 && lod > 0) [-1, 1].forEach((k) => {
          fr.push([k * w * 0.3, y + h * 0.55, d / 2 + 0.02, 0.58, 0.66, 0.06]);
          lt.push([k * w * 0.3, y + h * 0.55, d / 2 + 0.05, 0.46, 0.54, 0.05]);
        });
      } else if (i > 0 && win && lod > 0) {
        for (let f = 0; f < 4; f += 1) {
          const lw = f < 2 ? w : d;
          const us = win === 'triple' && f === 0 ? [-lw * 0.27, 0, lw * 0.27] : [0];
          us.forEach((u, q) => {
            const ww = win === 'triple' && f === 0 ? (q === 1 ? lw * 0.2 : lw * 0.16) : Math.min(0.95, lw * 0.3);
            const wh = h * (win === 'triple' && q === 1 ? 0.78 : 0.62);
            const [x, yy, z, ry] = onFace(f, w, d, u, y + h * 0.5, 0.02);
            fr.push([x, yy, z, ww + 0.12, wh + 0.12, 0.07, ry]);
            const [x2, y2, z2] = onFace(f, w, d, u, y + h * 0.5, 0.05);
            lt.push([x2, y2, z2, ww, wh, 0.05, ry]);
          });
        }
      }
      strutItems(w, d, y + h - 0.02, Math.min(0.8, ov * 0.8), Math.max(3, Math.round(w * 1.2))).forEach((s) => bl.push(s));
      parts.push(<Roof key={`r${i}`} w={w + 2 * ov} d={d + 2 * ov} h={rh} y={eave} m={tm || rm} />);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => stt.push([sx * (w / 2 + ov) * 0.94, eave - 0.1, sz * (d / 2 + ov) * 0.94, 0.07, 0.15, 0.07, 0, 0, 0, 1]));
      apex = eave + rh;
      y = eave + rh * 0.5;
    });
    const cols = stt.filter((s) => s.length < 10); const bells = stt.filter((s) => s.length === 10);
    return (
      <group position={[0, 0, 0]}>
        {parts}
        <Inst items={fr} m={timber} />
        <Inst items={lt} m={latMat()} />
        <Inst items={bl} m={timber} />
        <Inst items={cols} m={timber} cast />
        <Inst items={bells.map((b) => b.slice(0, 9))} m={M.gold} />
        <Gajur y={apex - 0.04} s={finial} />
        {gilt && null}
        {children}
      </group>
    );
  }

  /* ------------------------------------------------------------------ stone temples */
  const curvPts = [[1, 0], [0.97, 0.08], [0.9, 0.22], [0.78, 0.4], [0.64, 0.56], [0.52, 0.7], [0.5, 0.73], [0.58, 0.745], [0.58, 0.78], [0.46, 0.8], [0.38, 0.84], [0.3, 0.9], [0.2, 0.96], [0.06, 1]];
  function CurvSpire({ r0, h, y = 0, m, seg = 12, x = 0, z = 0, kalasha = true }) {
    const M = useM();
    const g = useMemo(() => new THREE.LatheGeometry(curvPts.map(([r, t]) => new THREE.Vector2(Math.max(0.03, r * r0), t * h)), seg), [r0, h, seg]);
    return (
      <group position={[x, y, z]}>
        <mesh geometry={g} rotation={[0, Math.PI / 8, 0]} material={m} castShadow receiveShadow />
        {kalasha && (
          <>
            <Ball rad={r0 * 0.14} p={[0, h + r0 * 0.1, 0]} m={M.gold} />
            <mesh position={[0, h + r0 * 0.4, 0]} material={M.gold}><coneGeometry args={[r0 * 0.07, r0 * 0.5, 8]} /></mesh>
          </>
        )}
      </group>
    );
  }
  function GarudaPillar({ p = [0, 0, 0], s = 1 }) {
    const M = useM();
    const st = stoneM(M, 1, 3, '#c9bba0');
    return (
      <group position={p} scale={s}>
        <Box s={[0.9, 0.2, 0.9]} p={[0, 0.1, 0]} m={st} />
        <Box s={[0.7, 0.3, 0.7]} p={[0, 0.35, 0]} m={st} />
        <Cyl rt={0.14} rb={0.2} h={2.7} p={[0, 1.65, 0]} m={st} seg={12} />
        {[0.7, 1.4].map((yy) => <Cyl key={yy} rt={0.22} h={0.07} p={[0, yy, 0]} m={st} seg={12} />)}
        <Cyl rt={0.34} rb={0.18} h={0.2} p={[0, 3.1, 0]} m={st} seg={12} />
        <Cyl rt={0.36} h={0.06} p={[0, 3.22, 0]} m={M.gold} seg={12} />
        <group position={[0, 3.25, 0]} scale={1.9}><Garuda m={M.gold} /></group>
      </group>
    );
  }
  /** Krishna Mandir: a stone temple of three open pillared storeys with 21 spires, Latina shikhara above. */
  function KrishnaTemple({ lod = 1 }) {
    const M = useM();
    const st = stoneM(M, 2, 2, '#cbbd9f');
    const dk = stoneM(M, 1, 1, '#b3a58b');
    const lv = [{ hx: 2.45, core: 2.05, h: 1.45, n: 6 }, { hx: 2.0, core: 1.6, h: 1.15, n: 5 }, { hx: 1.5, core: 1.2, h: 0.95, n: 4 }];
    const out = [];
    const cols = [];
    const PH = 3 * 0.3;
    let y = PH;
    lv.forEach((L, i) => {
      out.push(<Box key={`core${i}`} s={[L.core * 2, L.h, L.core * 2]} p={[0, y + L.h / 2, 0]} m={archMat(L.n)} />);
      ringColumns(L.hx, L.hx, L.n, L.n, y, L.h, 0.15).forEach((c) => cols.push(c));
      // the arch faces sit in front of the core
      const hw = L.hx - 0.06;
      [0, 1, 2, 3].forEach((f) => {
        const [x, yy, z, ry] = onFace(f, hw * 2, hw * 2, 0, y + L.h / 2, 0);
        out.push(<mesh key={`ar${i}${f}`} position={[x, yy, z]} rotation={[0, ry, 0]} material={archMat(L.n)}><planeGeometry args={[L.hx * 2 - 0.3, L.h - 0.18]} /></mesh>);
      });
      out.push(<Box key={`sl${i}`} s={[L.hx * 2 + 0.55, 0.18, L.hx * 2 + 0.55]} p={[0, y + L.h + 0.09, 0]} m={st} />);
      // balustrade
      const e = L.hx + 0.25;
      [[0, e, L.hx * 2 + 0.5, 0.08], [0, -e, L.hx * 2 + 0.5, 0.08]].forEach(([x, z, w], k) => out.push(<Box key={`bz${i}${k}`} s={[w, 0.26, 0.08]} p={[x, y + L.h + 0.31, z]} m={dk} cast={false} />));
      [[e, 0], [-e, 0]].forEach(([x, z], k) => out.push(<Box key={`bx${i}${k}`} s={[0.08, 0.26, L.hx * 2 + 0.5]} p={[x, y + L.h + 0.31, z]} m={dk} cast={false} />));
      const pos = i < 2 ? [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      pos.forEach(([a, b], k) => {
        if (lod === 0 && i === 2) return;
        out.push(<Chhatri key={`ch${i}${k}`} p={[a * (L.hx - 0.02), y + L.h + 0.18, b * (L.hx - 0.02)]} s={0.95 - i * 0.12} m={st} />);
      });
      y += L.h + 0.18;
    });
    return (
      <group>
        <Plat w={4.9} d={4.9} levels={3} lh={0.3} off={0.75} m={st} stairW={1.7} />
        {out}
        <Inst items={cols} m={st} cast />
        <Box s={[1.9, 0.5, 1.9]} p={[0, y + 0.25, 0]} m={st} />
        <CurvSpire r0={1.0} h={3.5} y={y + 0.5} m={st} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], k) => <CurvSpire key={k} r0={0.36} h={1.25} y={y + 0.5} x={a * 0.82} z={b * 0.82} m={st} />)}
        {[-1, 1].map((k) => <group key={k} position={[k * 0.95, 0, 2.2 + 0.9 + 0.75]} scale={1.8}><Lion m={dk} /></group>)}
      </group>
    );
  }

  /* ------------------------------------------------------------------ the pagodas of the square */
  function Bhimsen({ lod = 1 }) {
    const M = useM();
    const wall = brickM(M, 3, 2, '#d89578');
    const gw = lod ? (
      <group position={[0, 0.34 * 1 + 0.9, 2.2]}>
        <Box s={[3.0, 0.6, 0.55]} p={[0, 0, 0.25]} m={M.gold} />
        {[-1, 0, 1].map((k) => (
          <group key={k} position={[k * 0.96, 0.02, 0.55]}>
            <Box s={[0.82, 0.46, 0.06]} m={timberM(M, '#2a1208')} />
            <Box s={[0.7, 0.36, 0.05]} p={[0, 0, 0.04]} m={latMat()} />
            <mesh position={[0, 0.3, 0]} material={M.gold}><torusGeometry args={[0.38, 0.04, 6, 14, Math.PI]} /></mesh>
          </group>
        ))}
        <Box s={[3.3, 0.08, 0.7]} p={[0, 0.34, 0.3]} m={M.gold} />
      </group>
    ) : null;
    return (
      <group>
        <Plat w={5.0} d={4.0} levels={1} lh={0.34} off={0.5} m={wall} stairW={1.8} />
        <Pagoda
          y0={0.34}
          wall={wall}
          win="triple"
          lod={lod}
          doorW={0.9}
          flank
          tiers={[
            { w: 5.0, d: 4.0, h: 1.55, ov: 1.45, rh: 0.8 },
            { w: 3.2, d: 2.6, h: 1.0, ov: 1.0, rh: 0.7 },
            { w: 2.2, d: 1.9, h: 0.9, ov: 0.85, rh: 0.6 },
          ]}
          finial={1.3}
        >
          {gw}
          <Box s={[0.1, 5.9, 0.1]} p={[0, 3.2, 3.45]} m={timberM(M, '#6a5a40')} />
          <Box s={[0.5, 0.5, 0.08]} p={[0, 5.6, 3.45]} m={M.gold} />
        </Pagoda>
        {[-1, 1].map((k) => <group key={k} position={[k * 1.1, 0.34, 2.9]} scale={1.5}><Lion m={stoneM(M)} /></group>)}
      </group>
    );
  }
  function Vishwanath({ lod = 1 }) {
    const M = useM();
    const wall = brickM(M, 3, 2, '#d4876a');
    return (
      <group>
        <Plat w={5.8} d={5.2} levels={2} lh={0.36} off={0.7} m={brickM(M, 4, 0.5, '#d89578')} stairW={2.4} />
        <Pagoda
          y0={0.72}
          wall={wall}
          arcade
          win="lattice"
          lod={lod}
          tiers={[
            { w: 5.8, d: 5.2, h: 1.75, ov: 1.55, rh: 0.8 },
            { w: 3.3, d: 3.1, h: 1.1, ov: 1.1, rh: 0.75 },
          ]}
          finial={1.3}
        />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.8, 0.0, 3.5 + 1.0]}>
            <Box s={[1.0, 0.45, 1.5]} p={[0, 0.22, 0]} m={stoneM(M)} />
            <Box s={[0.8, 0.45, 1.3]} p={[0, 0.66, 0]} m={stoneM(M)} />
            <group position={[0, 0.88, 0]} scale={2.6}><Elephant m={stoneM(M, 1, 1, '#c0b192')} /></group>
          </group>
        ))}
        <group position={[0, 0, -5.2]}><Nandi p={[0, 0, 0]} face={0} /></group>
      </group>
    );
  }

  function QuickEnv() {
    const M = useM();
    return <group><GroundDisc r={30} m={paveM(M, 12, 12)} /></group>;
  }
  function KrishnaMain() {
    return (<group><KrishnaTemple /><GarudaPillar p={[0, 0, 7]} /><Frame s={[10, 9.5, 14]} p={[0, 4.7, 1.5]} /></group>);
  }
  function VishMain() {
    return (<group><Vishwanath /><Frame s={[9, 6.5, 14]} p={[0, 3.2, 0]} /></group>);
  }
  function BhimMain() {
    return (<group><Bhimsen /><Frame s={[9, 6.5, 9]} p={[0, 3.2, 0]} /></group>);
  }
  return {
    'krishna-mandir': { Main: KrishnaMain, Env: QuickEnv },
    'vishwanath-temple': { Main: VishMain, Env: QuickEnv },
    'bhimsen-temple': { Main: BhimMain, Env: QuickEnv },
  };
}
