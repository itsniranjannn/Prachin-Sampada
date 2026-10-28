// Hand-built landmarks for Patan (Lalitpur): the Durbar Square with its palace and temples, the courtyards, Kumbheshwar,
// the Golden Temple, Mahabouddha, Rato Machhindranath and the Lagankhel Ashoka stupa.
import { useLayoutEffect, useMemo, useRef } from 'react';

export default function make(K) {
  const {
    useM, Box, Cyl, Ball, Roof, Gajur, Lion, Elephant, Garuda, Goddess, Nandi, Lingam, Trident, Frame, Water, GroundDisc,
    Doorway, Chhatri, Chaitya, PrayerFlags, PrayerWheels, Tree, Diyo, THREE,
  } = K;

  /* ------------------------------------------------------------------ textures and materials */
  const brickM = (M, rx = 2, ry = 1, c = '#e6b097') => M.mat('brick', rx, ry, { color: c });
  const stoneM = (M, rx = 1, ry = 1, c = '#d6c9ad') => M.mat('plaster', rx * 2, ry * 2, { color: c, roughness: 0.95 });
  const tileM = (M, c = '#cf9a72', rx = 3, ry = 3) => M.mat('roof', rx, ry, { color: c });
  const timberM = (M, c = '#4a2a16') => M.plain(c, { roughness: 0.8 });
  const paveM = (M, rx, ry, c = '#e2c4ae') => M.mat('herring', rx, ry, { color: c });

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

  /** Embossed gilt copper: a warm gold ground with a grid of repousse rosettes, for the Golden Temple. */
  let reposTex = null;
  const reposCache = {};
  function reposseMat(rx = 3, ry = 3, tone = '#d6a23a') {
    const key = `${rx}|${ry}|${tone}`;
    if (reposCache[key]) return reposCache[key];
    if (!reposTex) {
      reposTex = mk(128, 128, (g) => {
        g.fillStyle = '#d9a73c'; g.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
          const x = i * 32 + 16; const y = j * 32 + 16;
          g.strokeStyle = '#8a5f14'; g.lineWidth = 2; g.strokeRect(i * 32 + 2, j * 32 + 2, 28, 28);
          g.fillStyle = '#f2cd6a'; g.beginPath(); g.arc(x, y, 9, 0, 6.3); g.fill();
          g.strokeStyle = '#9a6c1c'; g.beginPath(); g.arc(x, y, 9, 0, 6.3); g.stroke();
          g.fillStyle = '#b07f22'; g.beginPath(); g.arc(x, y, 3.5, 0, 6.3); g.fill();
          for (let k = 0; k < 8; k += 1) { const a = (k * Math.PI) / 4; g.fillStyle = '#a67420'; g.fillRect(x + Math.cos(a) * 12 - 1.5, y + Math.sin(a) * 12 - 1.5, 3, 3); }
        }
      });
    }
    const t = reposTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
    reposCache[key] = new THREE.MeshStandardMaterial({ map: t, color: tone, metalness: 0.65, roughness: 0.4 });
    return reposCache[key];
  }

  /** A carved gilt arch (torana): a cusped ogee band that rises to a spike. Faces +z; sits with its base at y = 0. */
  function Torana({ p = [0, 0, 0], w = 0.9, h = 0.7, m, r = [0, 0, 0] }) {
    const M = useM();
    const g = useMemo(() => {
      const hw = w / 2; const b = Math.min(0.11, w * 0.14);
      const s = new THREE.Shape();
      s.moveTo(-hw, 0); s.lineTo(-hw, h * 0.42);
      s.bezierCurveTo(-hw, h * 0.74, -hw * 0.2, h * 0.62, 0, h);
      s.bezierCurveTo(hw * 0.2, h * 0.62, hw, h * 0.74, hw, h * 0.42);
      s.lineTo(hw, 0); s.lineTo(hw - b, 0); s.lineTo(hw - b, h * 0.42);
      s.bezierCurveTo(hw - b, h * 0.66, hw * 0.2, h * 0.56, 0, h - b * 1.6);
      s.bezierCurveTo(-hw * 0.2, h * 0.56, -hw + b, h * 0.66, -hw + b, h * 0.42);
      s.lineTo(-hw + b, 0); s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false });
      geo.translate(0, 0, -0.035);
      return geo;
    }, [w, h]);
    return (
      <group position={p} rotation={r}>
        <mesh geometry={g} material={m || M.gold} castShadow />
        <Ball rad={Math.min(0.08, w * 0.1)} p={[0, h + 0.04, 0]} m={m || M.gold} />
      </group>
    );
  }

  /** A stone elephant of the temple guard: barrel body, domed head, ears, tusks, trunk, and an optional mahout. Faces +z, about 1.3 long. */
  function StoneElephant({ m, cloth, rider = true }) {
    const M = useM();
    const cl = cloth || M.plain('#9a3a28', { roughness: 0.8 });
    return (
      <group>
        <Ball rad={0.34} sc={[1, 0.92, 1.55]} p={[0, 0.7, -0.05]} m={m} />
        {[-1, 1].map((a) => [1, -1].map((b) => <Cyl key={`${a}${b}`} rt={0.1} rb={0.115} h={0.5} p={[a * 0.19, 0.25, b * 0.32 - 0.05]} m={m} seg={10} />))}
        <Ball rad={0.23} sc={[1, 1.08, 1.05]} p={[0, 0.86, 0.5]} m={m} />
        {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.2} sc={[0.16, 1, 0.8]} p={[k * 0.25, 0.86, 0.42]} m={m} />)}
        <Cyl rt={0.05} rb={0.1} h={0.62} p={[0, 0.55, 0.74]} r={[0.28, 0, 0]} m={m} seg={10} />
        <Cyl rt={0.045} rb={0.05} h={0.2} p={[0, 0.2, 0.84]} r={[-0.5, 0, 0]} m={m} seg={8} />
        {[-1, 1].map((k) => <mesh key={`t${k}`} position={[k * 0.13, 0.66, 0.78]} rotation={[1.2, 0, k * 0.2]} material={M.plain('#efe6cf', { roughness: 0.5 })}><coneGeometry args={[0.03, 0.3, 6]} /></mesh>)}
        <Box s={[0.5, 0.05, 0.4]} p={[0, 0.69, 0.55]} m={M.gold} cast={false} />
        <Box s={[0.7, 0.07, 0.8]} p={[0, 1.0, -0.08]} m={cl} cast={false} />
        <Box s={[0.74, 0.3, 0.84]} p={[0, 0.84, -0.08]} m={cl} cast={false} />
        {rider && (
          <group position={[0, 1.04, 0.02]}>
            <Box s={[0.2, 0.26, 0.14]} p={[0, 0.16, 0]} m={m} />
            <Ball rad={0.075} p={[0, 0.37, 0]} m={m} />
            {[-1, 1].map((k) => <Cyl key={k} rt={0.035} h={0.2} p={[k * 0.1, 0.03, 0.12]} r={[1.2, 0, 0]} m={m} seg={6} />)}
          </group>
        )}
      </group>
    );
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
      if (!ref.current) return;
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
  function Pagoda({ tiers, y0 = 0, wall, roofM, arcade = false, win = 'lattice', gold = false, finial = 1.1, lod = 1, doorW = 0.7, flank = true, gilt = false, trim = null, torana = false, strutMax = 0.8, children }) {
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
          if (torana) parts.push(<Torana key={`tor${k}`} p={[x, y + 0.42, d / 2 - 0.1]} w={Math.min(0.78, ((w - 1) / n) * 0.92)} h={h - 0.82} />);
          else parts.push(<mesh key={`tor${k}`} position={[x, y + h - 0.42, d / 2 - 0.12]} material={M.gold}><torusGeometry args={[0.3, 0.035, 6, 14, Math.PI]} /></mesh>);
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
      strutItems(w, d, y + h - 0.02, Math.min(strutMax, ov * 0.8), Math.max(3, Math.round(w * 1.2))).forEach((s) => bl.push(s));
      parts.push(<Roof key={`r${i}`} w={w + 2 * ov} d={d + 2 * ov} h={rh} y={eave} m={tm || rm} />);
      if (trim) {
        const A = w + 2 * ov; const B = d + 2 * ov;
        parts.push(<Box key={`tz${i}`} s={[A, 0.13, 0.05]} p={[0, eave - 0.02, B / 2 + 0.03]} m={trim} cast={false} />);
        parts.push(<Box key={`tb${i}`} s={[A, 0.13, 0.05]} p={[0, eave - 0.02, -B / 2 - 0.03]} m={trim} cast={false} />);
        parts.push(<Box key={`tl${i}`} s={[0.05, 0.13, B]} p={[A / 2 + 0.03, eave - 0.02, 0]} m={trim} cast={false} />);
        parts.push(<Box key={`tr${i}`} s={[0.05, 0.13, B]} p={[-A / 2 - 0.03, eave - 0.02, 0]} m={trim} cast={false} />);
      }
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
    const st = stoneM(M, 1, 3, '#d9cdb2');
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
    const st = stoneM(M, 2, 2, '#d9cdb2');
    const dk = stoneM(M, 1, 1, '#c4b799');
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
    const wall = brickM(M, 3, 2, '#c4624a');
    const roofC = tileM(M, '#b8704c');
    const base = brickM(M, 3, 0.5, '#c9735a');
    const brass = M.plain('#b58f3c', { metalness: 0.75, roughness: 0.38 });
    const y0 = 0.6;
    const bays = [-2.35, -1.35, 1.35, 2.35];
    return (
      <group>
        <Plat w={5.6} d={4.4} levels={2} lh={0.3} off={0.6} m={base} stairW={2.0} />
        <Pagoda
          y0={y0}
          wall={wall}
          roofM={roofC}
          trim={M.gold}
          win="triple"
          lod={lod}
          doorW={1.0}
          flank={false}
          strutMax={1.05}
          tiers={[
            { w: 5.6, d: 4.4, h: 2.5, ov: 1.35, rh: 0.95 },
            { w: 3.6, d: 2.9, h: 1.1, ov: 0.85, rh: 0.8 },
            { w: 2.3, d: 1.9, h: 0.95, ov: 0.7, rh: 0.7 },
          ]}
          finial={1.4}
        >
          {/* open shop-front bays under the first roof */}
          {bays.map((x) => (
            <group key={x} position={[x, y0, 2.2]}>
              <Box s={[0.84, 1.3, 0.08]} p={[0, 0.65, 0.01]} m={M.plain('#1a0d07')} />
              <Box s={[1.0, 0.12, 0.14]} p={[0, 1.36, 0.03]} m={timberM(M)} />
              <Box s={[0.1, 1.3, 0.12]} p={[-0.46, 0.65, 0.03]} m={timberM(M)} />
              <Box s={[0.1, 1.3, 0.12]} p={[0.46, 0.65, 0.03]} m={timberM(M)} />
            </group>
          ))}
          <Box s={[5.2, 0.14, 0.2]} p={[0, y0 + 1.46, 2.28]} m={timberM(M)} cast={false} />
          {/* the three connected gilt windows of the first floor */}
          <group position={[0, y0 + 1.82, 2.2]}>
            <Box s={[4.0, 0.84, 0.46]} p={[0, 0, 0.23]} m={M.gold} />
            {[-1, 0, 1].map((k) => (
              <group key={k} position={[k * 1.28, 0, 0.5]}>
                <Box s={[1.08, 0.66, 0.05]} m={timberM(M, '#2a1208')} />
                <Box s={[0.9, 0.5, 0.05]} p={[0, 0, 0.03]} m={latMat()} />
                <Torana p={[0, 0.34, 0.02]} w={1.1} h={0.34} />
              </group>
            ))}
            <Box s={[4.3, 0.1, 0.7]} p={[0, 0.47, 0.3]} m={M.gold} />
            {[-1.95, -0.64, 0.64, 1.95].map((x) => <Box key={x} s={[0.1, 0.84, 0.12]} p={[x, 0, 0.5]} m={M.gold} />)}
          </group>
          {/* the tall brass pole in front of the facade */}
          <Cyl rt={0.045} rb={0.06} h={7.3} p={[0, 3.65 + 0.2, 3.45]} m={brass} seg={8} />
          {[1.2, 2.6, 4.0, 5.4, 6.6].map((yy) => <Cyl key={yy} rt={0.1} h={0.12} p={[0, yy, 3.45]} m={M.gold} seg={8} />)}
          <Ball rad={0.1} p={[0, 7.4, 3.45]} m={M.gold} />
        </Pagoda>
        {[-1, 1].map((k) => <group key={k} position={[k * 1.45, 0.6, 3.1]} scale={1.5}><Lion m={stoneM(M)} /></group>)}
      </group>
    );
  }
  function Vishwanath({ lod = 1 }) {
    const M = useM();
    const wall = brickM(M, 3, 2, '#c9694c');
    const roofC = tileM(M, '#9c6648');
    const st = stoneM(M, 1, 1, '#cfc2a4');
    const base = brickM(M, 4, 0.5, '#cf7c60');
    return (
      <group>
        <Plat w={5.8} d={5.2} levels={3} lh={0.4} off={0.8} m={base} stairW={2.6} />
        <Pagoda
          y0={1.2}
          wall={wall}
          roofM={roofC}
          trim={M.gold}
          arcade
          torana
          win="lattice"
          lod={lod}
          strutMax={1.2}
          tiers={[
            { w: 5.8, d: 5.2, h: 2.2, ov: 1.45, rh: 0.95 },
            { w: 3.3, d: 3.1, h: 1.2, ov: 0.95, rh: 0.8 },
          ]}
          finial={1.4}
        />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.45, 0, 5.2]}>
            <Box s={[1.5, 0.3, 2.3]} p={[0, 0.15, 0]} m={st} />
            <Box s={[1.3, 0.9, 2.1]} p={[0, 0.75, 0]} m={base} />
            <Box s={[1.4, 0.1, 2.2]} p={[0, 1.25, 0]} m={st} />
            <group position={[0, 1.3, 0]} scale={1.65}><StoneElephant m={st} /></group>
          </group>
        ))}
        <group position={[0, 0, -5.4]}><Nandi p={[0, 0, 0]} face={0} /></group>
      </group>
    );
  }

  /* ------------------------------------------------------------------ the palace and the town */
  const seeded = (i, k = 1) => { const r = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return r - Math.floor(r); };
  /** Brick town houses as instanced boxes: walls, hip roofs and window rows. list: {x, z, w, d, n, ry, plaster} */
  function Town({ list, sh = 0.9 }) {
    const M = useM();
    const { wb, wp, rf, fr, lt } = useMemo(() => {
      const wb = []; const wp = []; const rf = []; const fr = []; const lt = [];
      list.forEach((h, i) => {
        const { x, z, w, d, n, ry = 0, plaster = false } = h;
        const H = n * sh;
        (plaster ? wp : wb).push([x, H / 2, z, w, H, d, ry]);
        rf.push([x, H, z, w + 0.7, 0.6 + n * 0.08, d + 0.7, ry]);
        const c = Math.cos(ry); const s = Math.sin(ry);
        const place = (u, y, off) => [x + u * c + (d / 2 + off) * s, y, z - u * s + (d / 2 + off) * c];
        for (let q = 1; q < n; q += 1) {
          const us = w > 2.8 ? [-w * 0.26, 0, w * 0.26] : [0];
          us.forEach((u) => {
            const [a, b, e] = place(u, q * sh + sh * 0.5, 0.02);
            fr.push([a, b, e, 0.5, 0.52, 0.06, ry]);
            const [a2, b2, e2] = place(u, q * sh + sh * 0.5, 0.05);
            lt.push([a2, b2, e2, 0.4, 0.42, 0.05, ry]);
          });
        }
        const [a, b, e] = place(0, 0.42, 0.02);
        fr.push([a, b, e, w * 0.55, 0.7, 0.06, ry]);
        void i;
      });
      return { wb, wp, rf, fr, lt };
    }, [list, sh]);
    return (
      <group>
        <Inst items={wb} m={brickM(M, 2, 2, '#d99d80')} cast />
        <Inst items={wp} m={M.plain('#e9dcc6', { roughness: 0.9 })} cast />
        <Inst items={rf} m={tileM(M, '#c28a66', 2, 2)} kind="cone4" cast />
        <Inst items={fr} m={timberM(M)} />
        <Inst items={lt} m={latMat()} />
      </group>
    );
  }
  /** A row of houses along a line; fronts face the way ry says. */
  const houseRow = (x0, z0, dx, dz, n, ry, seed = 0, nmin = 3) => Array.from({ length: n }, (_, i) => {
    const w = 2.5 + seeded(i + seed) * 1.2;
    return { x: x0 + dx * i + (seeded(i, seed) - 0.5) * 0.4, z: z0 + dz * i + (seeded(i, seed + 3) - 0.5) * 0.5, w, d: 2.8 + seeded(i, seed + 5) * 0.8, n: nmin + Math.floor(seeded(i, seed + 7) * 2.4), ry, plaster: seeded(i, seed + 9) > 0.78 };
  });

  /** The long Malla palace: brick, three storeys of carved windows, a low tiled hip roof; faces +z.
      doors: [{x, gold}] with stone lions; a gold door also gets a gilded window above it. */
  function PalaceFront({ len = 48, d = 4.6, storeys = 3, sh = 1.05, doors = [], roofH = 1.25, tileC = '#cf9a72' }) {
    const M = useM();
    const H = storeys * sh;
    const { fr, lt, dk, tri, bay, bayR } = useMemo(() => {
      const fr = []; const lt = []; const dk = []; const tri = []; const bay = []; const bayR = [];
      const skip = doors.map((q) => q.x);
      const n = Math.floor(len / 2.0);
      for (let k = 0; k < n; k += 1) {
        const x = -len / 2 + ((k + 0.5) * len) / n;
        const nearDoor = skip.some((q) => Math.abs(q - x) < 1.5);
        if (!nearDoor) { fr.push([x, 0.7, d / 2 + 0.02, 0.5, 0.56, 0.07]); dk.push([x, 0.7, d / 2 + 0.05, 0.36, 0.42, 0.05]); }
        for (let s = 1; s < storeys - 1; s += 1) {
          if (doors.some((q) => q.gold && Math.abs(q.x - x) < 1.6 && s === 1)) continue;
          const yy = s * sh + sh * 0.52;
          if ((k + s) % 3 === 0) {
            // a projecting carved bay window with its own little eave
            bay.push([x, yy, d / 2 + 0.2, 1.5, 0.92, 0.4]);
            lt.push([x, yy, d / 2 + 0.41, 1.2, 0.7, 0.05]);
            bayR.push([x, yy + 0.58, d / 2 + 0.26, 1.9, 0.1, 0.78]);
            tri.push([x, yy - 0.52, d / 2 + 0.3, 1.7, 0.1, 0.6]);
          } else {
            fr.push([x, yy, d / 2 + 0.02, 1.15, 0.78, 0.08]);
            lt.push([x, yy, d / 2 + 0.06, 0.95, 0.62, 0.06]);
            tri.push([x, yy + 0.44, d / 2 + 0.12, 1.3, 0.07, 0.24]);
          }
        }
      }
      return { fr, lt, dk, tri, bay, bayR };
    }, [len, d, storeys, sh, doors]);
    const st = useMemo(() => strutItems(len, d, H - 0.02, 0.75, Math.round(len / 1.3), 'long'), [len, d, H]);
    const stone = stoneM(M);
    return (
      <group>
        <Box s={[len, H, d]} p={[0, H / 2, 0]} m={brickM(M, len / 2.4, storeys * 1.2, '#dc9f82')} />
        <Box s={[len + 0.1, 0.35, d + 0.1]} p={[0, 0.17, 0]} m={stone} cast={false} />
        {Array.from({ length: storeys }, (_, s) => <Box key={s} s={[len + 0.08, 0.08, d + 0.08]} p={[0, (s + 1) * sh - 0.04, 0]} m={timberM(M)} cast={false} />)}
        <Box s={[len - 1.0, sh * 0.6, 0.08]} p={[0, (storeys - 1) * sh + sh * 0.5, d / 2 + 0.03]} m={latMat(len / 0.7, 1)} cast={false} />
        <Box s={[len - 1.0, 0.1, 0.12]} p={[0, (storeys - 1) * sh + sh * 0.84, d / 2 + 0.05]} m={timberM(M)} cast={false} />
        <Box s={[len - 1.0, 0.1, 0.12]} p={[0, (storeys - 1) * sh + sh * 0.18, d / 2 + 0.05]} m={timberM(M)} cast={false} />
        <Inst items={fr} m={timberM(M)} />
        <Inst items={lt} m={latMat()} />
        <Inst items={dk} m={M.plain('#1b0f08')} />
        <Inst items={tri} m={timberM(M)} />
        <Inst items={bay} m={timberM(M, '#3a2012')} />
        <Inst items={bayR} m={tileM(M, tileC, 1, 1)} />
        <Inst items={st} m={timberM(M)} />
        <HipRoof w={len} d={d} h={roofH} y={H} ov={0.95} m={tileM(M, tileC, 4, 4)} />
        {doors.map((q, i) => (
          <group key={i} position={[q.x, 0, d / 2]}>
            <Box s={[1.5, 1.7, 0.1]} p={[0, 0.9, 0.03]} m={timberM(M, '#3a1e10')} />
            <Box s={[1.15, 1.45, 0.1]} p={[0, 0.82, 0.08]} m={q.gold ? reposseMat(1, 1.4) : timberM(M, '#241208')} />
            {q.gold && [-1, 1].map((k) => <Box key={k} s={[0.14, 1.6, 0.16]} p={[k * 0.68, 0.84, 0.1]} m={M.gold} />)}
            {q.gold && <Torana p={[0, 1.55, 0.14]} w={1.7} h={0.8} />}
            <mesh position={[0, 1.62, 0.08]} material={q.gold ? M.gold : timberM(M)}><torusGeometry args={[0.6, 0.06, 6, 16, Math.PI]} /></mesh>
            {q.gold && (
              <group position={[0, sh + 0.5, 0.1]}>
                <Box s={[1.9, 0.95, 0.4]} p={[0, 0, 0.1]} m={M.gold} />
                <Box s={[1.5, 0.62, 0.06]} p={[0, -0.02, 0.32]} m={latMat()} />
                <Box s={[2.1, 0.1, 0.6]} p={[0, 0.54, 0.15]} m={M.gold} />
                <Gajur y={0.58} s={0.4} />
              </group>
            )}
            {q.lions !== false && [-1, 1].map((k) => (
              <group key={k} position={[k * 1.35, 0, 0.9]}>
                <Box s={[0.7, 0.4, 0.7]} p={[0, 0.2, 0]} m={stone} />
                <group position={[0, 0.4, 0]} scale={1.9}><Lion m={stoneM(M, 1, 1, '#ddd0b4')} /></group>
              </group>
            ))}
            <Box s={[1.8, 0.14, 0.9]} p={[0, 0.07, 0.65]} m={stone} />
          </group>
        ))}
      </group>
    );
  }

  /** Taleju Bhawani of Mul Chowk: the tall three-roofed temple that rises over the palace. */
  function TalejuTemple({ lod = 1 }) {
    const M = useM();
    return (
      <group>
        <Plat w={3.8} d={3.8} levels={2} lh={0.4} off={0.5} m={brickM(M, 3, 0.5, '#d89578')} stairW={1.6} />
        <Pagoda
          y0={0.8}
          wall={brickM(M, 3, 3, '#d4876a')}
          lod={lod}
          gold
          doorW={0.9}
          tiers={[
            { w: 3.6, d: 3.6, h: 3.4, ov: 0.95, rh: 0.8 },
            { w: 2.6, d: 2.6, h: 1.5, ov: 0.75, rh: 0.7 },
            { w: 1.8, d: 1.8, h: 1.2, ov: 0.6, rh: 0.6 },
          ]}
          finial={1.1}
        />
      </group>
    );
  }
  /** Degutale: a three-roofed Taleju temple on a high stepped brick plinth. */
  function Degutale({ lod = 1 }) {
    const M = useM();
    return (
      <group>
        <Plat w={3.0} d={3.0} levels={4} lh={0.36} off={0.5} m={brickM(M, 3, 0.5, '#d89578')} stairW={1.6} />
        <Pagoda
          y0={1.44}
          wall={brickM(M, 3, 2, '#d4876a')}
          lod={lod}
          doorW={0.8}
          tiers={[
            { w: 3.0, d: 3.0, h: 1.5, ov: 0.9, rh: 0.7 },
            { w: 2.1, d: 2.1, h: 1.0, ov: 0.7, rh: 0.6 },
            { w: 1.5, d: 1.5, h: 0.9, ov: 0.55, rh: 0.55 },
          ]}
          finial={1.2}
        />
      </group>
    );
  }
  /** Char Narayan: a two-roofed brick pagoda on a broad plinth. */
  function CharNarayan({ lod = 1 }) {
    const M = useM();
    return (
      <group>
        <Plat w={4.2} d={3.8} levels={2} lh={0.36} off={0.6} m={brickM(M, 3, 0.5, '#d89578')} stairW={1.7} />
        <Pagoda y0={0.72} wall={brickM(M, 3, 2, '#d4876a')} lod={lod} doorW={0.8} tiers={[{ w: 4.2, d: 3.8, h: 1.5, ov: 1.0, rh: 0.75 }, { w: 2.7, d: 2.4, h: 1.0, ov: 0.7, rh: 0.65 }]} finial={1.2} />
      </group>
    );
  }
  /** Chyasin Dega: the octagonal stone temple of Krishna beside the bell. */
  function Chyasin({ lod = 1 }) {
    const M = useM();
    const st = stoneM(M, 2, 2, '#e4d7bc');
    const dk = stoneM(M, 1, 1, '#d0c3a8');
    const cols = [];
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      [[1.55, 0.5, 1.15], [1.2, 1.9, 0.95]].forEach(([r, y, h]) => cols.push([Math.cos(a) * r, y + h / 2, Math.sin(a) * r, 0.12, h, 0.12]));
    }
    return (
      <group>
        <Cyl rt={2.4} rb={2.5} h={0.5} p={[0, 0.25, 0]} m={st} seg={8} />
        <Cyl rt={1.38} rb={1.38} h={1.15} p={[0, 1.07, 0]} m={archMat(8)} seg={8} />
        <Cyl rt={1.8} rb={1.8} h={0.16} p={[0, 1.72, 0]} m={st} seg={8} />
        <Cyl rt={1.05} rb={1.05} h={0.95} p={[0, 2.3, 0]} m={archMat(8)} seg={8} />
        <Cyl rt={1.4} rb={1.4} h={0.16} p={[0, 2.85, 0]} m={st} seg={8} />
        <Inst items={cols} m={dk} cast />
        <CurvSpire r0={0.95} h={2.6} y={2.93} m={st} seg={8} />
        {lod > 0 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * Math.PI * 2; return <CurvSpire key={i} r0={0.2} h={0.55} y={1.88} x={Math.cos(a) * 1.5} z={Math.sin(a) * 1.5} m={st} seg={8} />; })}
      </group>
    );
  }

  /** The Taleju bell on its tall stone plinth: two stone posts under a small curved dark roof with three gilded finials. */
  function BellStructure() {
    const M = useM();
    const sand = stoneM(M, 3, 1, '#dcc48f');
    const bronze = M.plain('#6d5a38', { metalness: 0.75, roughness: 0.4 });
    const prof = useMemo(() => [[0.03, 0.55], [0.1, 0.52], [0.2, 0.42], [0.27, 0.18], [0.36, -0.15], [0.42, -0.5], [0.43, -0.56], [0.38, -0.56]].map(([x, y]) => new THREE.Vector2(x, y)), []);
    return (
      <group>
        <Box s={[5.2, 1.5, 2.6]} p={[0, 0.75, 0]} m={sand} />
        <Box s={[5.4, 0.14, 2.8]} p={[0, 1.55, 0]} m={stoneM(M)} />
        <Box s={[5.4, 0.2, 2.8]} p={[0, 0.1, 0]} m={stoneM(M)} />
        <Box s={[0.8, 0.9, 0.06]} p={[0, 0.75, 1.32]} m={M.plain('#2a1c12')} />
        <Box s={[1.0, 0.1, 0.1]} p={[0, 1.24, 1.33]} m={stoneM(M)} />
        {[-1, 1].map((k) => <group key={k} position={[k * 3.35, 0, 0]}><Box s={[1.5, 0.95, 2.4]} p={[0, 0.5, 0]} m={brickM(M, 1, 1, '#d89578')} /><Box s={[1.0, 0.7, 0.05]} p={[0, 0.45, 1.22]} m={M.plain('#1b0f08')} /><Roof w={2.1} d={2.9} h={0.5} y={0.95} m={tileM(M)} /></group>)}
        {[-0.85, 0.85].map((x) => (
          <group key={x} position={[x, 1.62, 0]}>
            <Box s={[0.55, 0.22, 0.55]} p={[0, 0.11, 0]} m={stoneM(M)} />
            <Cyl rt={0.17} rb={0.23} h={1.9} p={[0, 1.15, 0]} m={stoneM(M, 1, 2)} seg={12} />
            <Box s={[0.5, 0.2, 0.5]} p={[0, 2.18, 0]} m={stoneM(M)} />
          </group>
        ))}
        <Box s={[2.5, 0.2, 0.3]} p={[0, 3.9, 0]} m={timberM(M)} />
        <Roof w={3.3} d={1.8} h={0.7} y={4.0} lift={0.5} m={timberM(M, '#3a2414')} />
        {[-0.7, 0, 0.7].map((x) => <group key={x} position={[x, 4.62, 0]}><Gajur y={0} s={0.55} /></group>)}
        <mesh position={[0, 2.95, 0]} material={bronze} castShadow><latheGeometry args={[prof, 24]} /></mesh>
        {[-0.2, 0.2].map((x) => <Box key={x} s={[0.03, 0.55, 0.03]} p={[x, 3.62, 0]} m={bronze} />)}
        <mesh position={[0, 3.42, 0]} rotation={[0, 0, 0]} material={M.plain('#8a7448', { metalness: 0.8, roughness: 0.4 })}><torusGeometry args={[0.55, 0.04, 6, 20, Math.PI]} /></mesh>
        {[-1, 1].map((k) => <Box key={`f${k}`} s={[0.1, 0.1, 0.1]} p={[k * 2.6, 1.62, 1.3]} m={stoneM(M)} />)}
      </group>
    );
  }
  function PillarOfKing({ p = [0, 0, 0] }) {
    const M = useM();
    const st = stoneM(M, 1, 4, '#e6d8bb');
    return (
      <group position={p}>
        <Box s={[1.5, 0.22, 1.5]} p={[0, 0.11, 0]} m={st} />
        <Box s={[1.1, 0.22, 1.1]} p={[0, 0.33, 0]} m={st} />
        <Cyl rt={0.2} rb={0.3} h={4.6} p={[0, 2.7, 0]} m={st} seg={12} />
        <Cyl rt={0.5} rb={0.3} h={0.22} p={[0, 5.1, 0]} m={st} seg={12} />
        <Cyl rt={0.46} h={0.1} p={[0, 5.27, 0]} m={M.gold} seg={12} />
        <group position={[0, 5.32, 0]} scale={1.2}>
          <Box s={[0.34, 0.1, 0.3]} p={[0, 0.05, 0]} m={M.gold} />
          <Box s={[0.16, 0.34, 0.1]} p={[0, 0.27, 0]} m={M.gold} />
          <Ball rad={0.07} p={[0, 0.5, 0]} m={M.gold} />
          <mesh position={[0, 0.62, -0.02]} material={M.gold}><sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh position={[0, 0.82, -0.02]} material={M.gold}><coneGeometry args={[0.04, 0.22, 8]} /></mesh>
        </group>
      </group>
    );
  }

  /* ------------------------------------------------------------------ the square as one scene */
  const SQ = {
    krishna: [-9.8, 0], vish: [-0.4, 0], bhim: [8.6, 0], char: [-20.5, 0], pillar: [-6.5, 10.5], bell: [18, 16], degutale: [14.6, 9.4], chyasin: [23.6, 9.8],
    palace: [8, 22.5], taleju: [8.5, 27.5],
  };
  const PALACE_DOORS = [{ x: -8, lions: true }, { x: 7, gold: true }, { x: 24, gold: true, lions: false }];
  const palaceSegs = (r, sk) => (sk ? [[r[0], sk[0]], [sk[1], r[1]]] : [r]).filter(([a, b]) => b - a > 1);
  /** Everything in the square except what is in `skip`, shifted so `origin` is at the centre and turned by rotY. */
  function SquareScene({ rotY = 0, origin = [0, 0], skip = [], lod = 0, ground = true, palace = [-16, 32], palaceSkip = null }) {
    const M = useM();
    const has = (k) => !skip.includes(k);
    const at = (k, ry = 0) => ({ position: [SQ[k][0], 0, SQ[k][1]], rotation: [0, ry, 0] });
    const rear = has('rear');
    const town = useMemo(() => [
      ...houseRow(-36, -9.6, 3.4, 0.2, 18, 0, 1, 3),
      ...houseRow(-36, -4, 0, 3.6, 5, Math.PI / 2, 3, 3),
      ...houseRow(44, -4, 0, 3.6, 7, -Math.PI / 2, 5, 3),
      ...(rear ? houseRow(-34, 34, 3.6, 0, 18, Math.PI, 7, 3) : houseRow(-34, 52, 3.6, 0, 18, Math.PI, 7, 3)),
    ], [rear]);
    return (
      <group rotation={[0, rotY, 0]}>
        <group position={[-origin[0], 0, -origin[1]]}>
          {ground && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.01, 8]} receiveShadow material={paveM(M, 22, 8)}><planeGeometry args={[84, 36]} /></mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.02, 8]} receiveShadow material={M.mat('stone', 40, 20, { color: '#e3d6bd' })}><planeGeometry args={[140, 80]} /></mesh>
              <GroundDisc r={110} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} />
<Backdrop />
              <Town list={town} />
            </>
          )}
          {has('krishna') && <group {...at('krishna')}><KrishnaTemple lod={lod} /><GarudaPillar p={[0, 0, 7.4]} /></group>}
          {has('vish') && <group {...at('vish')}><Vishwanath lod={lod} /></group>}
          {has('bhim') && <group {...at('bhim')}><Bhimsen lod={lod} /></group>}
          {has('char') && <group {...at('char')}><CharNarayan lod={lod} /></group>}
          {has('pillar') && <PillarOfKing p={[SQ.pillar[0], 0, SQ.pillar[1]]} />}
          {has('bell') && <group {...at('bell')}><BellStructure /></group>}
          {has('degutale') && <group {...at('degutale')}><Degutale lod={lod} /></group>}
          {has('chyasin') && <group {...at('chyasin')}><Chyasin lod={lod} /></group>}
          {has('palace') && palaceSegs(palace, palaceSkip).map(([a, b], i) => (
            <group key={i} position={[(a + b) / 2, 0, SQ.palace[1]]} rotation={[0, Math.PI, 0]}>
              <PalaceFront len={b - a} doors={PALACE_DOORS.filter((q) => q.x > a + 1 && q.x < b - 1).map((q) => ({ ...q, x: (a + b) / 2 - q.x }))} />
            </group>
          ))}
          {has('taleju') && <group {...at('taleju', Math.PI)}><TalejuTemple lod={lod} /></group>}
        </group>
      </group>
    );
  }

  /** Valley rim hills with the snowy Himalaya behind (north, -z) and a second ring of Newar houses around the square. */
  function Backdrop() {
    const M = useM();
    const hill = M.plain('#58744b', { roughness: 1, flatShading: true });
    const hillB = M.plain('#6b8556', { roughness: 1 });
    const far = M.plain('#7d8fa3', { roughness: 1, flatShading: true });
    const fir = M.plain('#2f4a2c', { roughness: 1 });
    const snow = M.plain('#f2f5fa', { roughness: 0.6 });
    const peaks = [[-120, -190, 50, 60], [-50, -210, 60, 80], [30, -200, 55, 66], [100, -195, 50, 58], [165, -170, 46, 50], [-175, -150, 44, 48]];
    const hills = [[-85, -110, 38, 26], [-20, -125, 50, 32], [55, -115, 40, 26], [110, -75, 34, 22], [-120, -60, 34, 20], [-100, 70, 40, 22], [120, 70, 36, 20]];
    const firs = useMemo(() => {
      const it = [];
      hills.forEach(([x, z, r, h], i) => {
        for (let k = 0; k < 26; k += 1) {
          const a = seeded(i * 31 + k, 2) * Math.PI * 2; const q = Math.sqrt(seeded(i * 17 + k, 4)) * 0.85;
          const px = x + Math.cos(a) * q * r * 1.3; const pz = z + Math.sin(a) * q * r * 1.1;
          const py = -3 + h * 0.8 * Math.sqrt(Math.max(0, 1 - q * q)) - 0.8;
          const hh = 3.2 + seeded(k, i) * 2.6;
          it.push([px, py + hh * 0.4, pz, hh * 0.34, hh, hh * 0.34]);
        }
      });
      return it;
    }, []);
    const ring = useMemo(() => [
      ...houseRow(-36, -16.5, 3.5, 0.3, 18, 0, 11, 4),
      ...houseRow(-42, -6, 0, 3.7, 6, Math.PI / 2, 13, 4),
      ...houseRow(51, -6, 0, 3.7, 7, -Math.PI / 2, 15, 4),
      ...houseRow(-34, 41, 3.7, 0, 18, Math.PI, 17, 4),
    ], []);
    return (
      <group>
        {hills.map(([x, z, r, h], i) => <mesh key={`h${i}`} position={[x, -3, z]} scale={[r * 1.3, h * 0.8, r * 1.1]} material={i % 2 ? hill : hillB}><sphereGeometry args={[1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>)}
        <Inst items={firs} m={fir} kind="cone4" />
        {peaks.map(([x, z, r, h], i) => (
          <group key={`p${i}`} position={[x, -3, z]}>
            <mesh position={[0, h / 2, 0]} material={far}><coneGeometry args={[r, h, 6]} /></mesh>
            <mesh position={[0, h * 0.72, 0]} material={snow}><coneGeometry args={[r * 0.56, h * 0.56, 6]} /></mesh>
          </group>
        ))}
        <Town list={ring} sh={1.0} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ site entries (in-square temples) */
  const KrishnaMain = () => (<group><KrishnaTemple /><GarudaPillar p={[0, 0, 7.4]} /><Frame s={[10, 9.8, 14.5]} p={[0, 4.9, 1.7]} /></group>);
  const VishMain = () => (<group><Vishwanath /><Frame s={[11.6, 7.8, 14.5]} p={[0, 3.9, 0.3]} /></group>);
  const BhimMain = () => (<group><Bhimsen /><Frame s={[8.6, 8.2, 9.6]} p={[0, 4.1, 0.8]} /></group>);
  const BellMain = () => (<group><BellStructure /><Frame s={[6.6, 5.5, 3.6]} p={[0, 2.7, 0]} /></group>);
  const envFor = (k, extra) => () => <SquareScene origin={SQ[k]} skip={[k]} {...extra} />;
  const palaceEnv = (a, b, d) => () => <SquareScene rotY={Math.PI} origin={[(a + b) / 2, 20.2 + d / 2]} palaceSkip={[a, b]} skip={['taleju', 'rear', 'degutale', 'bell', 'pillar', 'chyasin']} />;
  const SQK = 0.42;
  const SQROT = -0.93;
  function SquareMain() {
    const o = [3, 10.5];
    return (
      <group rotation={[0, SQROT, 0]}><group position={[-o[0] * SQK, 0, -o[1] * SQK]} scale={SQK}>
        <SquareScene ground={false} lod={0} palace={[-11, 27]} />
        <Frame s={[50, 12, 30]} p={[2, 6, 11]} />
      </group></group>
    );
  }
  function SquareEnv() {
    const M = useM();
    return (
      <group rotation={[0, SQROT, 0]}><GroundDisc r={90} y={-0.06} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} /><group position={[-3 * SQK, 0, -10.5 * SQK]} scale={SQK}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.01, 8]} receiveShadow material={paveM(M, 22, 8)}><planeGeometry args={[84, 36]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.02, 8]} receiveShadow material={M.mat('stone', 40, 20, { color: '#e3d6bd' })}><planeGeometry args={[140, 80]} /></mesh>
        <GroundDisc r={110} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} />
<Backdrop />
        <SquareTown />
      </group></group>
    );
  }
  function SquareTown() {
    const town = useMemo(() => [
      ...houseRow(-36, -9.6, 3.4, 0.2, 18, 0, 1, 3),
      ...houseRow(-36, -4, 0, 3.6, 5, Math.PI / 2, 3, 3),
      ...houseRow(44, -4, 0, 3.6, 7, -Math.PI / 2, 5, 3),
      ...houseRow(-34, 34, 3.6, 0, 18, Math.PI, 7, 3),
    ], []);
    return <Town list={town} />;
  }

  /* ------------------------------------------------------------------ palace courtyards (chowks) */
  const faceItem = (bx, bz, ry, u, y, off, sx, sy, sz, rx = 0) => {
    const c = Math.cos(ry); const s = Math.sin(ry);
    return [bx + u * c + off * s, y, bz - u * s + off * c, sx, sy, sz, ry, rx];
  };
  /** A quadrangle of brick wings around a yard. Back and side wings are full height, the front (+z) wing is the palace
      front (lower, so the yard stays visible). Windows, arcade, struts and roofs are built here; contents are children. */
  function Chowk({ w, d, t = 2.8, tf = 3.0, storeys = 3, sh = 1.05, fs = 2, roofH = 1.1, ground = 'brick', archBase = '#b5705a', floor, frontDoors = [], tint = '#dc9f82', tileC = '#cf9a72', children }) {
    const M = useM();
    const H = storeys * sh;
    const timber = timberM(M);
    const zc = (t - tf) / 2;
    const Ls = d - t - tf;
    const faces = useMemo(() => [
      { bx: 0, bz: -d / 2 + t, ry: 0, L: w - 2 * t },
      { bx: -w / 2 + t, bz: zc, ry: Math.PI / 2, L: Ls },
      { bx: w / 2 - t, bz: zc, ry: -Math.PI / 2, L: Ls },
    ], [w, d, t, zc, Ls]);
    const { fr, lt, dk, st, cols, outF, outL } = useMemo(() => {
      const fr = []; const lt = []; const dk = []; const st = []; const cols = []; const outF = []; const outL = [];
      faces.forEach((f) => {
        const n = Math.max(2, Math.floor(f.L / 2.0));
        for (let k = 0; k < n; k += 1) {
          const u = -f.L / 2 + ((k + 0.5) * f.L) / n;
          for (let s = 1; s < storeys - 1; s += 1) {
            fr.push(faceItem(f.bx, f.bz, f.ry, u, s * sh + sh * 0.52, 0.03, 1.15, 0.78, 0.08));
            lt.push(faceItem(f.bx, f.bz, f.ry, u, s * sh + sh * 0.52, 0.07, 0.95, 0.62, 0.06));
          }
          if (ground === 'brick') dk.push(faceItem(f.bx, f.bz, f.ry, u, sh * 0.55, 0.04, 0.5, 0.7, 0.06));
        }
        const sn = Math.max(3, Math.round(f.L / 1.3));
        for (let k = 0; k < sn; k += 1) st.push(faceItem(f.bx, f.bz, f.ry, -f.L / 2 + ((k + 0.5) * f.L) / sn, H - 0.4, 0.3, 0.08, 0.75, 0.08, 0.7));
        if (ground === 'arcade') {
          const an = Math.max(3, Math.round(f.L / 1.9));
          for (let k = 0; k <= an; k += 1) cols.push(faceItem(f.bx, f.bz, f.ry, -f.L / 2 + (k * f.L) / an, sh * 0.48, 0.16, 0.2, sh * 0.96, 0.2));
        }
      });
      // outer faces: windows on the back and the two sides
      [[0, -d / 2, Math.PI, w], [-w / 2, zc, -Math.PI / 2, Ls], [w / 2, zc, Math.PI / 2, Ls]].forEach(([bx, bz, ry, L]) => {
        const n = Math.max(2, Math.floor(L / 2.2));
        for (let k = 0; k < n; k += 1) {
          const u = -L / 2 + ((k + 0.5) * L) / n;
          for (let s = 0; s < storeys; s += 1) {
            outF.push(faceItem(bx, bz, ry, u, s * sh + sh * 0.55, 0.03, s ? 0.8 : 0.45, s ? 0.6 : 0.5, 0.07));
            if (s) outL.push(faceItem(bx, bz, ry, u, s * sh + sh * 0.55, 0.06, 0.62, 0.46, 0.06));
          }
        }
      });
      return { fr, lt, dk, st, cols, outF, outL };
    }, [faces, storeys, sh, ground, H, d, w, zc, Ls]);
    const tile = tileM(M, tileC, 4, 4);
    const bm = brickM(M, 4, storeys * 1.2, tint);
    return (
      <group>
        {floor !== false && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, zc]} receiveShadow material={floor || paveM(M, 5, 5, '#dcae94')}><planeGeometry args={[w - 2 * t, d - t - tf]} /></mesh>}
        <Box s={[w, H, t]} p={[0, H / 2, -d / 2 + t / 2]} m={bm} />
        <Box s={[t, H, Ls]} p={[-w / 2 + t / 2, H / 2, zc]} m={bm} />
        <Box s={[t, H, Ls]} p={[w / 2 - t / 2, H / 2, zc]} m={bm} />
        <Box s={[w + 0.1, 0.3, d + 0.1]} p={[0, 0.15, 0]} m={stoneM(M)} cast={false} />
        {faces.map((f, i) => {
          const c = faceItem(f.bx, f.bz, f.ry, 0, 0, 0.04, 1, 1, 1);
          const top = faceItem(f.bx, f.bz, f.ry, 0, (storeys - 1) * sh + sh * 0.5, 0.05, 1, 1, 1);
          const an = Math.max(3, Math.round(f.L / 1.9));
          return (
            <group key={i}>
              {Array.from({ length: storeys }, (_, s) => { const q = faceItem(f.bx, f.bz, f.ry, 0, (s + 1) * sh - 0.04, 0.05, 1, 1, 1); return <Box key={s} s={[f.L, 0.08, 0.12]} p={[q[0], q[1], q[2]]} r={[0, f.ry, 0]} m={timber} cast={false} />; })}
              <Box s={[f.L - 0.5, sh * 0.62, 0.08]} p={[top[0], top[1], top[2]]} r={[0, f.ry, 0]} m={latMat(f.L / 0.7, 1)} cast={false} />
              {ground === 'arcade' && <mesh position={[c[0], sh * 0.48, c[2]]} rotation={[0, f.ry, 0]} material={archMat(an, archBase)}><planeGeometry args={[f.L, sh * 0.96]} /></mesh>}
            </group>
          );
        })}
        <Inst items={fr} m={timber} />
        <Inst items={lt} m={latMat()} />
        <Inst items={dk} m={M.plain('#1b0f08')} />
        <Inst items={st} m={timber} />
        <Inst items={cols} m={M.plain('#4a2a16')} cast />
        <Inst items={outF} m={timber} />
        <Inst items={outL} m={latMat()} />
        <group position={[0, H, -d / 2 + t / 2]}><HipRoof w={w} d={t} h={roofH} ov={0.95} m={tile} /></group>
        <group position={[-w / 2 + t / 2, H, zc]} rotation={[0, Math.PI / 2, 0]}><HipRoof w={Ls + 1.2} d={t} h={roofH} ov={0.95} m={tile} /></group>
        <group position={[w / 2 - t / 2, H, zc]} rotation={[0, Math.PI / 2, 0]}><HipRoof w={Ls + 1.2} d={t} h={roofH} ov={0.95} m={tile} /></group>
        <group position={[0, 0, d / 2 - tf / 2]}><PalaceFront len={w} d={tf} storeys={fs} sh={sh} roofH={roofH * 0.9} doors={frontDoors} tileC={tileC} /></group>
        {children}
      </group>
    );
  }

  function WhiteShrine({ p = [0, 0, 0], s = 1 }) {
    const M = useM();
    const wm = M.plain('#efebe0', { roughness: 0.7 });
    const ring = Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; return [Math.cos(a) * 0.74, Math.sin(a) * 0.74]; });
    return (
      <group position={p} scale={s}>
        <Plat w={2.0} d={2.0} levels={3} lh={0.2} off={0.4} m={stoneM(M)} stairW={1.0} run={0.6} />
        <Cyl rt={0.66} rb={0.7} h={0.12} p={[0, 0.66, 0]} m={stoneM(M, 1, 1, '#c8bca0')} seg={16} />
        {ring.map(([x, z], i) => (
          <group key={i} position={[x, 0.72, z]}>
            <Cyl rt={0.065} rb={0.075} h={1.05} p={[0, 0.52, 0]} m={wm} seg={10} />
            <Cyl rt={0.11} rb={0.07} h={0.1} p={[0, 1.08, 0]} m={wm} seg={10} />
          </group>
        ))}
        <Cyl rt={0.74} rb={0.8} h={0.12} p={[0, 1.86, 0]} m={wm} seg={16} />
        <mesh position={[0, 1.92, 0]} material={wm} castShadow scale={[1, 0.85, 1]}><sphereGeometry args={[0.8, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.2} rb={0.3} h={0.16} p={[0, 2.62, 0]} m={wm} seg={12} />
        <Cyl rt={0.07} rb={0.12} h={0.34} p={[0, 2.78, 0]} m={wm} seg={10} />
        <mesh position={[0, 3.1, 0]} material={M.gold}><coneGeometry args={[0.1, 0.4, 8]} /></mesh>
        {ring.filter((_, i) => i % 2 === 0).map(([x, z], i) => <mesh key={`f${i}`} position={[x * 1.08, 2.0, z * 1.08]} material={wm}><coneGeometry args={[0.07, 0.3, 8]} /></mesh>)}
        <Cyl rt={0.22} rb={0.26} h={0.5} p={[0, 0.98, 0]} m={wm} seg={10} />
        {[-1, 1].map((k) => <group key={k} position={[k * 0.65, 0.2, 1.35]} scale={1.1}><Lion m={stoneM(M, 1, 1, '#cfc2a4')} /></group>)}
      </group>
    );
  }
  /** Bidya Mandir / Dashain Ghar: a small open gilded shrine with a stepped, tapering gilt roof. */
  function BidyaMandir({ p = [0, 0, 0], s = 1 }) {
    const M = useM();
    const gm = reposseMat(2, 2);
    return (
      <group position={p} scale={s}>
        <Plat w={1.7} d={1.7} levels={3} lh={0.2} off={0.35} m={brickM(M, 2, 0.4, '#d89578')} stairW={0.9} run={0.5} />
        <group position={[0, 0.6, 0]}>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.06} rb={0.07} h={0.85} p={[a * 0.55, 0.43, b * 0.55]} m={gm} seg={8} />)}
          <Box s={[1.0, 0.8, 0.9]} p={[0, 0.42, 0]} m={timberM(M, '#2a1608')} />
          <mesh position={[0, 0.34, 0.46]} material={gm}><planeGeometry args={[0.5, 0.58]} /></mesh>
          <Box s={[1.4, 0.12, 1.4]} p={[0, 0.9, 0]} m={gm} />
          {[1.25, 0.98, 0.72, 0.48].map((w, i) => <Box key={i} s={[w, 0.2, w]} p={[0, 1.08 + i * 0.2, 0]} m={gm} />)}
          <Torana p={[0, 0.5, 0.52]} w={0.7} h={0.36} />
          <Gajur y={1.88} s={0.62} />
        </group>
      </group>
    );
  }

  /** The sunk octagonal royal bath: stone rim with two serpents, 72 niches in the wall, a gilt spout, steps down. */
  const octPts = (r) => Array.from({ length: 8 }, (_, k) => new THREE.Vector2(Math.cos(((k + 0.5) * Math.PI) / 4) * r, Math.sin(((k + 0.5) * Math.PI) / 4) * r));
  function PitFloor({ w, d, r, zc = 0, m }) {
    const g = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-w / 2, -d / 2); sh.lineTo(w / 2, -d / 2); sh.lineTo(w / 2, d / 2); sh.lineTo(-w / 2, d / 2); sh.closePath();
      const hole = new THREE.Path(octPts(r).reverse());
      sh.holes.push(hole);
      const geo = new THREE.ShapeGeometry(sh);
      geo.rotateX(-Math.PI / 2);
      return geo;
    }, [w, d, r]);
    return <mesh geometry={g} position={[0, 0.02, zc]} receiveShadow material={m} />;
  }
  function TushaHiti({ p = [0, 0, 0] }) {
    const M = useM();
    const r = 2.4; const depth = 1.5;
    const a = r * Math.cos(Math.PI / 8);
    const ringG = useMemo(() => {
      const sh = new THREE.Shape(octPts(r + 0.5));
      sh.holes.push(new THREE.Path(octPts(r).reverse()));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      return g;
    }, []);
    const tubeG = useMemo(() => {
      const pts = octPts(r + 0.28).map((v) => new THREE.Vector3(v.x, 0, v.y));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5), 64, 0.17, 8, true);
    }, []);
    const dark = stoneM(M, 1, 1, '#9d9482');
    const niches = useMemo(() => {
      const it = [];
      for (let k = 0; k < 8; k += 1) {
        const phi = (k * Math.PI) / 4;
        for (let j = -1; j <= 1; j += 1) {
          const tx = -Math.sin(phi) * j * 0.8; const tz = Math.cos(phi) * j * 0.8;
          it.push([Math.cos(phi) * (a - 0.09) + tx, -0.62, Math.sin(phi) * (a - 0.09) + tz, 0.34, 0.5, 0.07, Math.PI / 2 - phi]);
        }
      }
      return it;
    }, [a]);
    const { deities, heads } = useMemo(() => {
      const d = []; const h = [];
      for (let k = 0; k < 20; k += 1) {
        const ph = (k / 20) * Math.PI * 2 + 0.15;
        const rr = r + 0.28;
        const x = Math.cos(ph) * rr * 0.97; const z = Math.sin(ph) * rr * 0.97;
        d.push([x, 0.52, z, 0.26, 0.42, 0.14, -ph + Math.PI / 2]);
        h.push([x, 0.84, z, 0.18, 0.16, 0.18]);
      }
      return { deities: d, heads: h };
    }, [r]);
    return (
      <group position={p}>
        <mesh geometry={ringG} position={[0, 0.02, 0]} material={dark} castShadow receiveShadow />
        {Array.from({ length: 8 }, (_, k) => {
          const phi = (k * Math.PI) / 4;
          return <Box key={k} s={[0.765 * r + 0.05, depth, 0.14]} p={[Math.cos(phi) * (a + 0.04), -depth / 2 + 0.02, Math.sin(phi) * (a + 0.04)]} r={[0, Math.PI / 2 - phi, 0]} m={dark} />;
        })}
        <Cyl rt={r} rb={r} h={0.1} p={[0, -depth, 0]} r={[0, Math.PI / 8, 0]} m={dark} seg={8} />
        <Cyl rt={r * 0.96} rb={r * 0.96} h={0.02} p={[0, -depth + 0.45, 0]} r={[0, Math.PI / 8, 0]} m={M.plain('#4f7d7e', { metalness: 0.3, roughness: 0.15 })} seg={8} />
        <Inst items={niches} m={stoneM(M, 1, 1, '#bdb29b')} />
        <mesh geometry={tubeG} position={[0, 0.32, 0]} material={stoneM(M, 1, 1, '#aaa18d')} castShadow />
        {[0, 1].map((k) => <Ball key={k} rad={0.27} sc={[1, 0.85, 1.35]} p={[(k ? -1 : 1) * (r + 0.28), 0.46, 0]} m={stoneM(M, 1, 1, '#aaa18d')} />)}
        <Inst items={deities} m={stoneM(M, 1, 1, '#9a917d')} />
        <Inst items={heads} m={stoneM(M, 1, 1, '#9a917d')} kind="cyl" />
        {[-1, 1].map((k) => <group key={`lg${k}`} position={[k * 1.05, 0.0, a + 0.7]} scale={1.15}><Lion m={stoneM(M, 1, 1, '#8f8672')} /></group>)}
        <Box s={[0.28, 0.28, 0.4]} p={[0, -0.5, -a + 0.2]} m={M.gold} />
        {Array.from({ length: 5 }, (_, i) => <Box key={i} s={[1.3, 0.22, 0.4]} p={[0, -0.12 - i * 0.26, a - 0.28 - i * 0.34]} m={stoneM(M)} />)}
        <group position={[0, 0.02, -(r + 1.3)]}>
          {[1.0, 0.76, 0.52].map((w, i) => <Box key={i} s={[w, 0.3, w]} p={[0, 0.15 + i * 0.3, 0]} m={stoneM(M, 1, 1, '#b8ad96')} />)}
          <CurvSpire r0={0.3} h={0.5} y={0.95} m={stoneM(M, 1, 1, '#b8ad96')} seg={8} />
        </group>
      </group>
    );
  }
  function WoodPillar({ p = [0, 0, 0], h = 4.3 }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[0.5, 0.25, 0.5]} p={[0, 0.12, 0]} m={stoneM(M)} />
        <Cyl rt={0.14} rb={0.18} h={h} p={[0, h / 2 + 0.25, 0]} m={M.plain('#5d4630', { roughness: 0.85 })} seg={10} />
        <mesh position={[0, h + 0.4, 0]} material={M.plain('#4d6b3a', { roughness: 0.8 })}><sphereGeometry args={[0.22, 10, 8]} /></mesh>
        <Cyl rt={0.2} rb={0.14} h={0.18} p={[0, h + 0.28, 0]} m={M.plain('#3a2a1a')} seg={10} />
      </group>
    );
  }

  /* ----- the three courtyards */
  const MUSEUM = { w: 15, d: 17, t: 2.8 };
  function MuseumMain() {
    const M = useM();
    const { w, d, t } = MUSEUM;
    return (
      <group>
        <Chowk w={w} d={d} t={t} tf={3.0} storeys={3} sh={1.05} fs={2} frontDoors={[{ x: 0, gold: true }]} ground="brick" tileC="#b8795a" tint="#d38f74">
          <WhiteShrine p={[0, 0, 0.9]} s={1.6} />
          <group position={[2.0, 0, -d / 2 + t / 2]} scale={0.85}><TalejuTemple lod={1} /></group>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 4.4, 0, 3.6]}>
              <Box s={[0.6, 0.3, 0.6]} p={[0, 0.15, 0]} m={stoneM(M)} />
              <Cyl rt={0.16} rb={0.22} h={0.9} p={[0, 0.75, 0]} m={stoneM(M, 1, 2)} seg={10} />
              <Cyl rt={0.3} rb={0.18} h={0.22} p={[0, 1.3, 0]} m={stoneM(M, 1, 1, '#c8bca0')} seg={10} />
            </group>
          ))}
        </Chowk>
        <Frame s={[w + 1, 9.5, d + 1]} p={[0, 4.7, 0]} />
      </group>
    );
  }
  const MUL = { w: 18, d: 20, t: 3.0 };
  function MulChowkMain() {
    const M = useM();
    const { w, d, t } = MUL;
    return (
      <group>
        <Chowk w={w} d={d} t={t} tf={3.2} storeys={2} sh={1.3} fs={1} roofH={1.2} frontDoors={[{ x: 0, gold: false }]} ground="arcade" archBase="#a96a52" floor={paveM(M, 6, 6, '#e6a98c')} tileC="#8a7561" tint="#cf8d72">
          <BidyaMandir p={[0, 0, 0.6]} s={1.9} />
          <group position={[-w / 2 + 2.4, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} scale={1.0}><TalejuTemple lod={1} /></group>
          <group position={[w / 2 - t, 0, 3.2]} rotation={[0, -Math.PI / 2, 0]}>
            <Box s={[1.5, 1.7, 0.1]} p={[0, 0.9, 0.2]} m={timberM(M, '#3a1e10')} />
            <Box s={[1.15, 1.5, 0.1]} p={[0, 0.85, 0.27]} m={reposseMat(1, 1.4)} />
            <Torana p={[0, 1.6, 0.3]} w={1.6} h={0.8} />
            <Box s={[1.9, 0.2, 0.3]} p={[0, 1.95, 0.3]} m={M.gold} cast={false} />
            {[-1, 1].map((k) => <group key={k} position={[k * 1.3, 0, 0.8]}><Box s={[0.7, 0.4, 0.7]} p={[0, 0.2, 0]} m={stoneM(M)} /><group position={[0, 0.4, 0]} scale={1.9}><Lion m={stoneM(M, 1, 1, '#cfc2a4')} /></group></group>)}
          </group>
          {[-1, 1].map((k) => [-1, 0, 1].map((q) => <Box key={`${k}${q}`} s={[0.12, 0.7, 0.12]} p={[k * 4.2, 0.35, 5 + q * 3.2]} m={M.plain('#1b1a1a')} />))}
        </Chowk>
        <Frame s={[w + 1, 10.5, d + 1]} p={[0, 5, 0]} />
      </group>
    );
  }
  const SUN = { w: 15, d: 16, t: 3.0 };
  function SundariMain() {
    const M = useM();
    const { w, d, t } = SUN;
    const zc = (t - 3.0) / 2;
    const backZ = -d / 2 + t + 0.1;
    return (
      <group>
        <Chowk w={w} d={d} t={t} tf={3.0} storeys={3} sh={1.05} fs={1} frontDoors={[{ x: 0, gold: false }]} ground="arcade" archBase="#a9694d" floor={false} tileC="#9b6e54" tint="#c9866b">
          <PitFloor w={w - 2 * t} d={d - t - 3.0} r={2.4} zc={zc} m={M.mat('stone', 0.6, 0.6, { color: '#c9c0ae' })} />
          <TushaHiti p={[0, 0, zc]} />
          <WoodPillar p={[-3.4, 0, 3.5]} h={4.6} />
          <WoodPillar p={[-2.5, 0, 3.8]} h={4.2} />
          {[-1, 0, 1].map((k) => <Torana key={`e${k}`} p={[w / 2 - t + 0.1, 0.12, zc + k * 2.2]} w={1.5} h={0.95} r={[0, -Math.PI / 2, 0]} />)}
          {[-2, -1, 0, 1, 2].map((k) => <Torana key={`b${k}`} p={[k * 1.9, 0.12, backZ]} w={1.4} h={0.95} />)}
        </Chowk>
        <Frame s={[w + 1, 8.5, d + 1]} p={[0, 4, 0]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ Golden Temple, Mahabouddha, Rato Machhindranath, Lagankhel, Kumbheshwar */
  const ringTown = (rx, rz, n0 = 4) => [
    ...houseRow(-rx, -rz, 3.3, 0, Math.ceil((2 * rx) / 3.3), 0, 11, n0),
    ...houseRow(-rx, rz + 9, 3.3, 0, Math.ceil((2 * rx) / 3.3), Math.PI, 13, 2),
    ...houseRow(-rx, -rz + 3, 0, 3.3, Math.ceil((2 * rz - 6) / 3.3), Math.PI / 2, 15, n0),
    ...houseRow(rx, -rz + 3, 0, 3.3, Math.ceil((2 * rz - 6) / 3.3), -Math.PI / 2, 17, n0),
  ];
  const gildM = (M) => M.plain('#d2a032', { metalness: 0.7, roughness: 0.38 });

  /** A gilt elephant on a stone tortoise-and-lotus plinth, as the Golden Temple's guardians. */
  function GildedElephant({ rider = false }) {
    const M = useM();
    const g = reposseMat(2, 2, '#e0b04a');
    return (
      <group>
        <Box s={[0.9, 0.3, 1.6]} p={[0, 0.15, 0]} m={stoneM(M)} />
        <mesh position={[0, 0.34, 0]} scale={[0.55, 0.14, 0.8]} material={M.plain('#5b6150', { roughness: 0.8 })}><sphereGeometry args={[1, 14, 8]} /></mesh>
        <group position={[0, 0.42, 0]} scale={1.15}><StoneElephant m={g} rider={rider} cloth={M.plain('#8a2a1e')} /></group>
      </group>
    );
  }
  function GoldenMain() {
    const M = useM();
    const w = 17; const d = 15; const t = 2.6;
    const gm = reposseMat(3, 3);
    const gw = reposseMat(2, 1.2);
    const wheels = useMemo(() => {
      const it = [];
      for (let k = 0; k < 14; k += 1) { const z = -d / 2 + t + 0.6 + k * 0.62; it.push([-w / 2 + t + 0.3, 0.7, z, 0.16, 0.34, 0.16], [w / 2 - t - 0.3, 0.7, z, 0.16, 0.34, 0.16]); }
      return it;
    }, []);
    return (
      <group>
        <Chowk w={w} d={d} t={t} tf={2.4} storeys={2} sh={1.25} fs={1} roofH={1} ground="arcade" archBase="#8a5a40" floor={M.mat('stone', 5, 5, { color: '#cfc5b0' })} frontDoors={[{ x: 0, gold: false }]} tint="#d7977a" tileC="#9c6a4e">
          <Plat w={4.4} d={3.8} levels={2} lh={0.3} off={0.5} m={stoneM(M)} stairW={1.8} />
          <group position={[0, 0, -2.6]}>
            <Pagoda y0={0.6} wall={gw} roofM={gm} trim={M.gold} torana arcade win="lattice" gold finial={1.3} strutMax={1.0} tiers={[{ w: 4.4, d: 3.8, h: 1.9, ov: 1.15, rh: 0.85 }, { w: 3.0, d: 2.6, h: 1.0, ov: 0.85, rh: 0.75 }, { w: 2.0, d: 1.8, h: 0.9, ov: 0.65, rh: 0.65 }]} />
          </group>
          <group position={[0, 0, 2.4]}>
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.07} h={1.1} p={[a * 0.6, 0.65, b * 0.6]} m={M.dark} seg={8} />)}
            <Box s={[1.4, 0.28, 1.4]} p={[0, 0.14, 0]} m={gm} />
            <Chaitya p={[0, 0.2, 0]} s={0.7} />
            <Roof w={2.0} d={2.0} h={0.6} y={1.2} m={gm} />
            <Gajur y={1.78} s={0.6} />
          </group>
          {[-1, 1].map((k) => <group key={k} position={[k * 2.5, 0, d / 2 - 3.9]}><GildedElephant /></group>)}
          <Inst items={wheels} m={gm} kind="cyl" />
          {[-1.8, -0.9, 0.9, 1.8].map((x) => <Diyo key={x} p={[x, 0.62, -0.5]} />)}
        </Chowk>
        <Frame s={[w + 1, 8.5, d + 1]} p={[0, 4, 0]} />
      </group>
    );
  }
  function GoldenEnv() {
    const M = useM();
    const town = useMemo(() => ringTown(15, 14), []);
    const gold = reposseMat(2, 1);
    return (
      <group>
        <GroundDisc r={26} m={M.mat('stone', 12, 12, { color: '#d9cdb8' })} />
        <GroundDisc r={90} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} />
        <Town list={town} />
        {/* the stone gate of the monastery: two piers, a gilt lintel with a torana and pent roofs, the guardians outside */}
        <group position={[0, 0, 11.4]}>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 1.55, 0, 0]}>
              <Box s={[1.3, 0.3, 1.2]} p={[0, 0.15, 0]} m={stoneM(M)} />
              <Box s={[1.0, 2.5, 0.9]} p={[0, 1.55, 0]} m={stoneM(M, 1, 2, '#cdbf9f')} />
              <Box s={[1.15, 0.14, 1.05]} p={[0, 2.85, 0]} m={stoneM(M)} />
            </group>
          ))}
          <Box s={[3.6, 0.7, 0.9]} p={[0, 2.5, 0]} m={stoneM(M, 2, 1, '#cdbf9f')} />
          <Box s={[2.9, 0.16, 0.2]} p={[0, 2.88, 0.5]} m={gold} />
          <Torana p={[0, 2.9, 0.46]} w={2.2} h={0.9} />
          <Roof w={5.4} d={2.2} h={0.7} y={3.0} m={tileM(M, '#9c6a4e')} />
          <Gajur y={3.7} s={0.7} />
          {[-1, 1].map((k) => <group key={`l${k}`} position={[k * 3.4, 0, 1.4]}><GildedElephant rider /></group>)}
        </group>
      </group>
    );
  }

  /* Mahabouddha: terracotta tower of Buddha tiles, in a courtyard squeezed between houses */
  let tileTex = null;
  function terracottaMat(rx, ry) {
    if (!tileTex) {
      // 8 x 8 small relief tiles, each with a seated Buddha under a halo
      tileTex = mk(256, 256, (g) => {
        g.fillStyle = '#b2623e'; g.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 8; i += 1) for (let j = 0; j < 8; j += 1) {
          const x = i * 32; const y = j * 32;
          g.fillStyle = '#8f4a2c'; g.fillRect(x + 1, y + 1, 30, 30);
          g.fillStyle = '#cb8156'; g.fillRect(x + 3, y + 3, 26, 26);
          g.fillStyle = '#d99a6c'; g.beginPath(); g.arc(x + 16, y + 13, 8, 0, 6.3); g.fill();
          g.fillStyle = '#9d5430'; g.beginPath(); g.arc(x + 16, y + 11, 3.2, 0, 6.3); g.fill();
          g.beginPath(); g.moveTo(x + 8, y + 27); g.lineTo(x + 12, y + 16); g.lineTo(x + 20, y + 16); g.lineTo(x + 24, y + 27); g.closePath(); g.fill();
          g.fillStyle = '#7a3b22'; g.fillRect(x + 4, y + 4, 24, 1.5);
        }
      });
    }
    const t = tileTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, emissive: '#3a1608', emissiveIntensity: 0.35 });
  }
  function TerraTower({ r0, h, y = 0, seg = 4, m, ledges = 7 }) {
    const M = useM();
    const ledge = brickM(M, 2, 0.4, '#a85a38');
    const prof = [[1, 0], [0.95, 0.1], [0.88, 0.22], [0.78, 0.36], [0.67, 0.5], [0.57, 0.64], [0.48, 0.78], [0.42, 0.9], [0.4, 1]];
    const g = useMemo(() => new THREE.LatheGeometry(prof.map(([r, t]) => new THREE.Vector2(r * r0, t * h)), seg), [r0, h, seg]);
    const lg = Array.from({ length: ledges }, (_, i) => { const t = (i + 1) / (ledges + 1); const r = 1 - 0.6 * t * (0.8 + 0.2 * t); return [t, r]; });
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={g} rotation={[0, Math.PI / 4, 0]} material={m} castShadow receiveShadow />
        {lg.map(([t, r]) => <Box key={t} s={[r * r0 * 1.46, 0.09 + r0 * 0.04, r * r0 * 1.46]} p={[0, h * t, 0]} m={ledge} cast={false} />)}
        <Cyl rt={r0 * 0.52} rb={r0 * 0.44} h={r0 * 0.24} p={[0, h + r0 * 0.1, 0]} m={m} seg={12} />
        <Cyl rt={r0 * 0.3} rb={r0 * 0.5} h={r0 * 0.16} p={[0, h + r0 * 0.3, 0]} m={ledge} seg={12} />
        <Ball rad={r0 * 0.14} p={[0, h + r0 * 0.48, 0]} m={M.gold} />
        <mesh position={[0, h + r0 * 0.78, 0]} material={M.gold}><coneGeometry args={[r0 * 0.07, r0 * 0.5, 8]} /></mesh>
      </group>
    );
  }
  function MahaMain() {
    const M = useM();
    const tm = useMemo(() => terracottaMat(4, 3), []);
    const tm2 = useMemo(() => terracottaMat(1.1, 0.8), []);
    const bm = brickM(M, 2, 1, '#c9794f');
    const dark = M.plain('#2a120a');
    return (
      <group>
        <Box s={[7.4, 0.4, 7.4]} p={[0, 0.2, 0]} m={bm} />
        <Box s={[6.4, 0.4, 6.4]} p={[0, 0.6, 0]} m={bm} />
        <Box s={[5.6, 0.3, 5.6]} p={[0, 0.95, 0]} m={bm} />
        {/* front steps up to the sanctum door */}
        {[0, 1, 2].map((i) => <Box key={i} s={[2.2, 0.35 * (i + 1), 0.5]} p={[0, (0.35 * (i + 1)) / 2, 3.1 + 0.5 + (2 - i) * 0.5]} m={bm} />)}
        <Box s={[3.2, 2.4, 3.2]} p={[0, 2.3, 0]} m={tm2} />
        {/* the arched sanctum entrance */}
        <Box s={[1.2, 1.5, 0.12]} p={[0, 1.7, 1.62]} m={dark} />
        <mesh position={[0, 2.45, 1.63]} material={dark}><circleGeometry args={[0.6, 18, 0, Math.PI]} /></mesh>
        <mesh position={[0, 2.45, 1.7]} material={M.gold}><torusGeometry args={[0.66, 0.045, 6, 18, Math.PI]} /></mesh>
        {[-0.7, 0.7].map((x) => <Box key={x} s={[0.14, 1.7, 0.2]} p={[x, 1.8, 1.66]} m={M.gold} />)}
        <Box s={[3.5, 0.22, 3.5]} p={[0, 3.6, 0]} m={bm} />
        <TerraTower r0={2.15} h={7.6} y={3.7} m={tm} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => <group key={`${a}${b}`} position={[a * 2.55, 1.1, b * 2.55]}><Box s={[1.0, 1.2, 1.0]} p={[0, 0.6, 0]} m={tm2} /><TerraTower r0={0.68} h={2.6} y={1.2} m={tm} ledges={3} /></group>)}
        <Frame s={[8, 13.2, 8]} p={[0, 6.4, 0]} />
      </group>
    );
  }
  function MahaEnv() {
    const M = useM();
    const town = useMemo(() => [
      ...houseRow(-9, -6.6, 3.4, 0, 6, 0, 21, 3),
      ...houseRow(-8.2, -3, 0, 3.3, 4, Math.PI / 2, 23, 3),
      ...houseRow(8.2, -3, 0, 3.3, 4, -Math.PI / 2, 25, 2),
      ...houseRow(-9, 16, 3.4, 0, 6, Math.PI, 27, 2),
      ...houseRow(-18, -13, 3.4, 0, 12, 0, 29, 4),
    ], []);
    const red = M.plain('#a83c26', { roughness: 0.8 });
    return (
      <group>
        <GroundDisc r={40} m={paveM(M, 14, 14)} />
        <GroundDisc r={90} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} />
        <Town list={town} />
        {/* the gateway into the courtyard: red brick piers, a cusped arch opening and a small tiled roof */}
        <group position={[0, 0, 9.6]}>
          {[-1, 1].map((k) => <Box key={k} s={[0.9, 2.6, 1.2]} p={[k * 1.45, 1.3, 0]} m={red} />)}
          <Box s={[3.8, 0.8, 1.2]} p={[0, 2.95, 0]} m={red} />
          <Box s={[2.0, 2.0, 0.1]} p={[0, 1.0, 0.6]} m={M.plain('#2a120a')} />
          <mesh position={[0, 2.0, 0.61]} material={M.plain('#2a120a')}><circleGeometry args={[1.0, 22, 0, Math.PI]} /></mesh>
          <mesh position={[0, 2.0, 0.64]} material={M.gold}><torusGeometry args={[1.03, 0.05, 6, 22, Math.PI]} /></mesh>
          <Roof w={4.8} d={2.0} h={0.55} y={3.35} m={tileM(M, '#9c6a4e')} />
          <Gajur y={3.9} s={0.5} />
          {[-1, 1].map((k) => <group key={`l${k}`} position={[k * 2.4, 0, 1.2]} scale={1.3}><Lion m={stoneM(M)} /></group>)}
        </group>
      </group>
    );
  }

  /* Rato Machhindranath: three roofs, the lowest wide and silvery, in the open court of Ta Bahal behind a blue fence */
  function RatoMain() {
    const M = useM();
    const wall = M.plain('#8a3b2a', { roughness: 0.85 });
    const silver = M.plain('#86948c', { roughness: 0.55 });
    const cop = M.mat('roof', 3, 3, { color: '#8a6c55' });
    const fence = useMemo(() => {
      const it = []; const hx = 6.2; const hz = 5.6;
      for (let i = 0; i <= 24; i += 1) { const x = -hx + (2 * hx * i) / 24; it.push([x, 0.55, hz, 0.06, 1.1, 0.06], [x, 0.55, -hz, 0.06, 1.1, 0.06]); }
      for (let i = 1; i < 22; i += 1) { const z = -hz + (2 * hz * i) / 22; it.push([hx, 0.55, z, 0.06, 1.1, 0.06], [-hx, 0.55, z, 0.06, 1.1, 0.06]); }
      [0.35, 1.05].forEach((y) => it.push([0, y, hz, 2 * hx, 0.05, 0.05], [0, y, -hz, 2 * hx, 0.05, 0.05], [hx, y, 0, 0.05, 0.05, 2 * hz], [-hx, y, 0, 0.05, 0.05, 2 * hz]));
      return it;
    }, []);
    return (
      <group>
        <Plat w={5.6} d={4.8} levels={1} lh={0.4} off={0.5} m={brickM(M, 3, 0.4, '#d89578')} stairW={1.8} />
        <Pagoda y0={0.4} wall={wall} win="lattice" gold doorW={0.9} finial={1.2} roofM={cop}
          tiers={[{ w: 5.6, d: 4.8, h: 1.5, ov: 1.6, rh: 1.35, m: silver }, { w: 3.6, d: 3.0, h: 1.1, ov: 1.0, rh: 1.05 }, { w: 2.4, d: 2.0, h: 1.0, ov: 0.8, rh: 0.9 }]} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.2, 0.4, 3.3]} scale={1.5}><Lion m={M.plain('#f1ece2', { roughness: 0.6 })} /></group>)}
        <Inst items={fence} m={M.plain('#2f6fbf', { roughness: 0.5 })} />
        <Frame s={[13.6, 8, 12.6]} p={[0, 3.6, 0]} />
      </group>
    );
  }
  function RatoEnv() {
    const M = useM();
    const town = useMemo(() => ringTown(17, 15, 4), []);
    return (
      <group>
        <GroundDisc r={26} m={paveM(M, 16, 16, '#e0b39b')} />
        <GroundDisc r={90} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} />
        <Town list={town} />
        <Tree p={[10.5, 0, 6]} s={2.6} kind="pine" />
        <Tree p={[-11, 0, 8]} s={1.8} />
      </group>
    );
  }

  /* Lagankhel: the grass dome of the southern Ashoka stupa, its ring wall of prayer wheels and the white crown */
  function LaganMain() {
    const M = useM();
    const grass = M.plain('#5f9638', { roughness: 1 });
    const wm = whiteLocal(M);
    const posts = useMemo(() => Array.from({ length: 36 }, (_, k) => { const a = (k / 36) * Math.PI * 2; return [Math.cos(a) * 8.85, 0.95, Math.sin(a) * 8.85, 0.1, 1.9, 0.1]; }), []);
    const chaityas = useMemo(() => Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2 + 0.3; return [Math.cos(a) * 9.7, Math.sin(a) * 9.7]; }), []);
    return (
      <group>
        <Cyl rt={8.5} rb={8.7} h={1.2} p={[0, 0.6, 0]} m={brickM(M, 14, 1, '#c98a6a')} seg={64} />
        <mesh position={[0, 1.2, 0]} scale={[1, 0.6, 1]} material={grass} castShadow receiveShadow><sphereGeometry args={[8.3, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={8.9} h={0.14} p={[0, 1.9, 0]} m={M.plain('#2a62b0')} seg={64} />
        <Inst items={posts} m={M.plain('#e0b82a')} kind="cyl" />
        {chaityas.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]} scale={0.8}>
            <Box s={[1.0, 0.3, 1.0]} p={[0, 0.15, 0]} m={wm} />
            <Cyl rt={0.3} rb={0.4} h={0.55} p={[0, 0.58, 0]} m={wm} seg={12} />
            <mesh position={[0, 0.85, 0]} material={M.gold}><coneGeometry args={[0.2, 0.55, 10]} /></mesh>
          </group>
        ))}
        <PrayerWheels radius={8.75} y={0.45} n={64} />
        <group position={[0, 6.0, 0]} scale={1.25}>
          <Cyl rt={0.75} rb={0.85} h={0.5} p={[0, 0.25, 0]} m={wm} seg={16} />
          <mesh position={[0, 0.5, 0]} material={wm} scale={[1, 0.8, 1]}><sphereGeometry args={[0.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Box s={[0.5, 0.3, 0.5]} p={[0, 1.05, 0]} m={wm} />
          {Array.from({ length: 7 }, (_, i) => <Cyl key={i} rt={0.26 - i * 0.025} rb={0.28 - i * 0.025} h={0.1} p={[0, 1.3 + i * 0.11, 0]} m={M.gold} seg={12} />)}
          <mesh position={[0, 2.25, 0]} material={M.gold}><coneGeometry args={[0.07, 0.3, 8]} /></mesh>
        </group>
        <group position={[0, 0, 9.9]} scale={1.2}>
          <Box s={[1.3, 0.3, 1.3]} p={[0, 0.15, 0]} m={wm} />
          <Cyl rt={0.45} rb={0.5} h={0.7} p={[0, 0.65, 0]} m={wm} seg={12} />
          <Cyl rt={0.5} h={0.08} p={[0, 0.78, 0]} m={M.gold} seg={12} />
          <mesh position={[0, 1.3, 0]} material={M.gold}><coneGeometry args={[0.25, 0.7, 10]} /></mesh>
        </group>
        {Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return <PrayerFlags key={k} from={[0, 8.6, 0]} to={[Math.cos(a) * 9.3, 1.8, Math.sin(a) * 9.3]} n={22} />; })}
        <Frame s={[20, 10, 22]} p={[0, 4.4, 1]} />
      </group>
    );
  }
  const whiteLocal = (M) => M.plain('#f4f0e6', { roughness: 0.8 });
  function LaganEnv() {
    const M = useM();
    const town = useMemo(() => [
      ...houseRow(-22, 26, 3.4, 0, 13, Math.PI, 31, 3),
      ...houseRow(-22, -22, 3.4, 0, 13, 0, 33, 4),
      ...houseRow(-24, -16, 0, 3.4, 11, Math.PI / 2, 35, 3),
      ...houseRow(24, -16, 0, 3.4, 11, -Math.PI / 2, 37, 3),
    ], []);
    return (
      <group>
        <GroundDisc r={14} m={paveM(M, 12, 12, '#d9a98e')} />
        <GroundDisc r={90} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b2bf88' })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 16.5]}><planeGeometry args={[70, 4]} /><meshStandardMaterial color="#5d5d60" roughness={0.95} /></mesh>
        <Town list={town} />
        {[[-12, 11], [12, 11], [-15, -4], [15, -6], [0, -14]].map(([x, z], i) => <Tree key={i} p={[x, 0, z]} s={1.5} kind={i % 2 ? 'broad' : 'pine'} />)}
        {[[-60, -60, 30, 16], [55, -55, 34, 18], [0, -80, 45, 20]].map(([x, z, r, h], i) => <mesh key={i} position={[x, h / 2 - 2, z]} material={M.mat('grass', 6, 3, { color: '#8fa86a' })}><coneGeometry args={[r, h, 9]} /></mesh>)}
      </group>
    );
  }

  /* Kumbheshwar: five roofs, red walls and a silvery lowest roof, with the walled sacred pond beside it */
  function KumbhMain() {
    const M = useM();
    const wall = M.plain('#a9442f', { roughness: 0.85 });
    const silver = M.plain('#7d8b84', { roughness: 0.55 });
    const upper = M.mat('roof', 3, 3, { color: '#8f7a64' });
    const red =M.plain('#c4553d', { roughness: 0.85 });
    const wh = M.plain('#f1ece2', { roughness: 0.7 });
    return (
      <group>
        <Plat w={3.8} d={3.8} levels={1} lh={0.36} off={0.5} m={brickM(M, 3, 0.4, '#d89578')} stairW={1.6} />
        <Pagoda y0={0.36} wall={wall} win="lattice" doorW={0.8} finial={1.1}
          roofM={upper} tiers={[{ w: 3.8, d: 3.8, h: 1.45, ov: 1.3, rh: 1.2, m: silver }, { w: 3.1, d: 3.1, h: 0.95, ov: 0.95, rh: 0.95 }, { w: 2.5, d: 2.5, h: 0.85, ov: 0.8, rh: 0.85 }, { w: 2.0, d: 2.0, h: 0.8, ov: 0.65, rh: 0.75 }, { w: 1.5, d: 1.5, h: 0.75, ov: 0.55, rh: 0.7 }]} />
        <group position={[0, 0, 4.2]}><Nandi p={[0, 0, 0]} face={Math.PI} /></group>
        <group position={[8, 0, 0.5]}>
          <Box s={[7, 0.9, 0.5]} p={[0, 0.45, 3]} m={red} /><Box s={[7, 0.9, 0.5]} p={[0, 0.45, -3]} m={red} />
          <Box s={[0.5, 0.9, 6.5]} p={[3.25, 0.45, 0]} m={red} /><Box s={[0.5, 0.9, 6.5]} p={[-3.25, 0.45, 0]} m={red} />
          {[[0, 3], [0, -3]].map(([x, z], i) => <Box key={i} s={[7.1, 0.08, 0.6]} p={[x, 0.93, z]} m={wh} />)}
          {[3.25, -3.25].map((x) => <Box key={x} s={[0.6, 0.08, 6.6]} p={[x, 0.93, 0]} m={wh} />)}
          <Water w={6.4} d={5.6} p={[0, 0.5, 0]} color="#6f7f66" />
          <Lingam p={[0, 0.5, 0]} />
        </group>
        <group position={[-5, 0, 3.4]} scale={1.1}>
          <Cyl rt={0.55} rb={0.6} h={0.3} p={[0, 0.15, 0]} m={wh} seg={16} />
          <mesh position={[0, 0.3, 0]} material={wh} scale={[1, 1.2, 1]}><sphereGeometry args={[0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh position={[0, 0.95, 0]} material={M.gold}><coneGeometry args={[0.09, 0.4, 8]} /></mesh>
        </group>
        <Frame s={[16.5, 8.5, 9.5]} p={[3, 4, 2]} />
      </group>
    );
  }
  function KumbhEnv() {
    const M = useM();
    const town = useMemo(() => ringTown(19, 15, 4), []);
    return (
      <group>
        <GroundDisc r={28} m={paveM(M, 16, 16, '#dfb099')} />
        <GroundDisc r={90} y={-0.05} m={M.mat('grass', 40, 40, { color: '#b9bd90' })} />
        <Town list={town} />
      </group>
    );
  }


  return {
    'patan-durbar-square': { Main: SquareMain, Env: SquareEnv },
    'krishna-mandir': { Main: KrishnaMain, Env: envFor('krishna') },
    'vishwanath-temple': { Main: VishMain, Env: envFor('vish') },
    'bhimsen-temple': { Main: BhimMain, Env: envFor('bhim') },
    'patan-museum': { Main: MuseumMain, Env: palaceEnv(17, 32, MUSEUM.d) },
    'mul-chowk': { Main: MulChowkMain, Env: palaceEnv(-1, 17, MUL.d) },
    'sundari-chowk-tusha-hiti': { Main: SundariMain, Env: palaceEnv(-16, -1, SUN.d) },
    'golden-temple': { Main: GoldenMain, Env: GoldenEnv },
    'mahabouddha-temple': { Main: MahaMain, Env: MahaEnv },
    'rato-machhindranath-temple': { Main: RatoMain, Env: RatoEnv },
    'lagankhel-ashok-stupa': { Main: LaganMain, Env: LaganEnv },
    'kumbheshwar-temple': { Main: KumbhMain, Env: KumbhEnv },
    'taleju-bell': { Main: BellMain, Env: envFor('bell', { rotY: Math.PI, skip: ['bell', 'degutale'] }) },
  };
}
