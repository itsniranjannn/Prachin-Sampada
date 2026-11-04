// Patan Durbar Square (Lalitpur). 1 unit ~ 4.5 m. The plaza is a long, open, brick-paved street-square running north-south
// (+z = the south end nearest the camera, -z = north / Mangal Bazaar). The ONE very long red-brick royal palace closes one
// side (x = -5.5, left of the default view) with a continuous 3-storey wall of carved timber window bays under one long tiled
// eave. Facing it stand the temples on raised plinths, doors turned to the palace: Chyasin Dega (south end, nearest), Char
// Narayan, a small stone shikhara, Hari Shankar, the grey-stone Krishna Mandir with its Garuda column, the Taleju bell,
// Vishwanath (elephants) and Bhimsen (north end). The Yoganarendra Malla column stands mid-plaza. Degu Taleju (3 roofs, gilded
// top) rises behind the palace. A road runs behind the temples; Newar brick houses close the ends. Flat valley floor, faint hills.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Elephant, Lion, Garuda, Frame, Tree, THREE, useMemo, useState, useEffect } = K;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const C = { brick: '#f2bc9a', brickP: '#e9ae8c', tile: '#9c8c82', timber: '#5a3a28', gold: '#c9a227', eave: '#d98a5a' };
  const BRICKS = ['#f2bc9a', '#e8a886', '#f5c4a2', '#dd9c7c', '#eeb48f'];
  const PI = Math.PI;

  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    plane: new THREE.PlaneGeometry(1, 1),
    cone: new THREE.ConeGeometry(0.5, 1, 8),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    ball: new THREE.SphereGeometry(0.5, 10, 8),
    cap: new THREE.CapsuleGeometry(0.3, 0.5, 3, 8),
  };
  const cache = {};
  const memoGeo = (k, fn) => (cache[k] = cache[k] || fn());

  /** Hip roof with the eave at y = 0 and the ridge (from x = r1 to r2) at y = H, in real units. */
  function hipGeo(L, D, H, r1, r2, uvs = 1.5) {
    const hx = L / 2, hz = D / 2;
    const a = [-hx, 0, -hz], b = [hx, 0, -hz], c = [hx, 0, hz], d = [-hx, 0, hz], q1 = [r1, H, 0], q2 = [r2, H, 0];
    const tris = [[d, c, q2], [d, q2, q1], [b, a, q1], [b, q1, q2], [c, b, q2], [a, d, q1]];
    const pos = [], uv = [];
    tris.forEach((t) => t.forEach((v) => { pos.push(v[0], v[1], v[2]); uv.push(v[0] / uvs, (v[2] + v[1] * 0.6) / uvs); }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  /** Ribbed, curved stone shikhara (rekha tower / dome / spirelet). Base radius R, height H. */
  function ribbedGeo(R, H, o = {}) {
    const { seg = 32, rows = 18, ribs = 8, amp = 0.06, p1 = 2, p2 = 0.9, belly = 0.08, tmax = 1 } = o;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= rows; i += 1) {
      const t = i / rows, tt = t * tmax;
      const r = Math.max(0.012, R * Math.pow(Math.max(0, 1 - Math.pow(tt, p1)), p2) * (1 + belly * Math.sin(PI * Math.min(1, tt))));
      for (let j = 0; j <= seg; j += 1) {
        const th = (j / seg) * PI * 2;
        const rr = r * (1 + amp * Math.cos(ribs * th));
        pos.push(rr * Math.sin(th), t * H, rr * Math.cos(th));
        uv.push((j / seg) * 4, t * 3);
      }
    }
    for (let i = 0; i < rows; i += 1) for (let j = 0; j < seg; j += 1) { const a = i * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  /** arched opening (flat, faces +z), width w, height h, base at y = 0 */
  function archGeo(w, h) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2);
    s.absarc(0, h - w / 2, w / 2, 0, PI, false); s.lineTo(-w / 2, 0);
    return new THREE.ShapeGeometry(s, 10);
  }

  /* ---------- shared materials ---------- */
  let latM = null;
  function latMat() {
    if (latM) return latM;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#1e110a'; x.fillRect(0, 0, 64, 64);
    x.strokeStyle = '#a07a48'; x.lineWidth = 4;
    for (let i = 6; i < 64; i += 12) { x.beginPath(); x.moveTo(i, 3); x.lineTo(i, 61); x.stroke(); x.beginPath(); x.moveTo(3, i); x.lineTo(61, i); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    latM = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ff9a40', emissiveIntensity: 0.2, roughness: 0.85 });
    return latM;
  }
  const stoneM = (M) => M.plain('#948b7d', { roughness: 0.97 });
  const stoneDM = (M) => M.plain('#70665a', { roughness: 0.88 });
  const lifted = {};
  const lift = (base, em, k) => { const key = base.uuid + em; if (!lifted[key]) { const m = base.clone(); m.emissive = new THREE.Color(em); m.emissiveIntensity = k; lifted[key] = m; } return lifted[key]; };
  const brickCM = (M, w, h, c) => lift(M.mat('brick', Math.max(1, w / 1.1), Math.max(1, h / 0.75), { color: c }), '#6a3220', 0.55);
  const eaveM = (M) => M.plain(C.eave, { roughness: 0.85 });
  const brickM = (M, w, h) => M.mat('brick', Math.max(1, w / 1.1), Math.max(1, h / 0.75), { color: C.brick });
  const brickPM = (M, w, h) => M.mat('brick', Math.max(1, w / 1.1), Math.max(1, h / 0.75), { color: C.brickP });
  const tileM = (M) => lift(M.mat('roof', 3, 3, { color: C.tile }), '#2a1a14', 0.04);
  const timberM = (M) => M.plain(C.timber, { roughness: 0.8 });
  const coreM = (M) => M.plain('#30261f', { roughness: 0.9 });
  const darkM = (M) => M.plain('#1c0f08', { roughness: 0.9 });
  const lampM = (M) => M.plain('#ffd7a0', { emissive: '#ff9a2a', emissiveIntensity: 1.8, roughness: 0.5 });

  /** Many copies of one geometry in one draw call. items: {p, r, s, c} */
  function Inst({ geo, m, items, shadow = false }) {
    const mesh = useMemo(() => {
      if (!items.length) return null;
      const im = new THREE.InstancedMesh(geo, m, items.length);
      const o = new THREE.Object3D(); o.rotation.order = 'YXZ';
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set((it.r && it.r[0]) || 0, (it.r && it.r[1]) || 0, (it.r && it.r[2]) || 0);
        const s = it.s || [1, 1, 1]; o.scale.set(s[0], s[1], s[2]);
        o.updateMatrix(); im.setMatrixAt(i, o.matrix);
        if (it.c) im.setColorAt(i, col.set(it.c));
      });
      im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, m, items, shadow]);
    return mesh ? <primitive object={mesh} /> : null;
  }
  const Windows = ({ win, fr }) => {
    const M = useM();
    return (
      <>
        <Inst geo={G.plane} m={latMat()} items={win} />
        <Inst geo={G.box} m={M.plain('#3b2314', { roughness: 0.8 })} items={fr} />
      </>
    );
  };
  /** point on a wall facing direction ry: a = along the wall, o = outward distance */
  const at = (ry, a, o) => [a * Math.cos(ry) + o * Math.sin(ry), -a * Math.sin(ry) + o * Math.cos(ry)];
  const SIDES = [0, PI / 2, PI, -PI / 2];
  const winAt = (win, fr, ry, a, y, o, w, h) => {
    const [x, z] = at(ry, a, o + 0.03); const [fx, fz] = at(ry, a, o);
    win.push({ p: [x, y, z], r: [0, ry, 0], s: [w, h, 1] });
    fr.push({ p: [fx, y, fz], r: [0, ry, 0], s: [w + 0.12, h + 0.12, 0.06] });
  };

  function Finial({ y, s = 1 }) {
    const M = useM();
    return (
      <group position={[0, y, 0]} scale={s}>
        <Cyl rt={0.12} rb={0.18} h={0.14} p={[0, 0.07, 0]} m={M.gold} seg={12} />
        <Ball rad={0.15} p={[0, 0.27, 0]} m={M.gold} />
        <Cyl rt={0.07} rb={0.11} h={0.12} p={[0, 0.45, 0]} m={M.gold} seg={12} />
        <mesh position={[0, 0.78, 0]} material={M.gold} castShadow><coneGeometry args={[0.06, 0.5, 10]} /></mesh>
      </group>
    );
  }

  /* ================= a Newar brick pagoda: 2-step plinth, tall narrow tiers, steep curved tiled roofs, gilded finial ================= */
  function Pagoda({ roofs = 3, w = 2, plinth = 2, wallH = 1.8, upH = 1.3, front = 'door', topGold = false, elephants = false, lions = false, ov0 = 0.62, big = 1, torana = false, wall = 0, stonePlinth = false }) {
    const M = useM();
    const HH = 0.2;
    const info = useMemo(() => {
      const tiers = []; let y = plinth * HH, apex = 0;
      for (let i = 0; i < roofs; i += 1) {
        const ww = w * Math.pow(0.85, i), wh = i === 0 ? wallH : upH * 1.2 * (1 - 0.04 * (i - 1)), ov = ov0 * (1 - 0.06 * i), rh = 0.9 - 0.05 * i;
        tiers.push({ y, ww, wh, ov, rh });
        apex = y + wh - 0.05 + rh;
        y += wh + rh * 0.6;
      }
      return { tiers, top: y, apex };
    }, [roofs, w, plinth, wallH, upH, ov0]);
    const data = useMemo(() => {
      const win = [], fr = [], st = [], bl = [];
      info.tiers.forEach((t, i) => {
        const n = Math.max(2, Math.round(t.ww * 1.3));
        SIDES.forEach((ry) => {
          for (let k = 0; k < n; k += 1) {
            const a = ((k + 0.5) / n - 0.5) * t.ww * 0.86;
            const [px, pz] = at(ry, a, t.ww / 2 + 0.04);
            st.push({ p: [px, t.y + t.wh - 0.22, pz], r: [0.62, ry, 0], s: [0.07, 0.55, 0.07] });
          }
        });
        const rw = t.ww + 2 * t.ov;
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => bl.push({ p: [sx * rw / 2 * 0.95, t.y + t.wh - 0.18, sz * rw / 2 * 0.95], r: [PI, 0, 0], s: [0.09, 0.17, 0.09] }));
        if (i >= 1) {
          const ww = Math.min(0.5, t.ww * 0.3);
          SIDES.forEach((ry) => { if (i === 1 && ry === 0 && front === 'shop') return; winAt(win, fr, ry, 0, t.y + t.wh * 0.5, t.ww / 2, ww, t.wh * 0.6); });
        } else {
          [1, 2, 3].forEach((s) => winAt(win, fr, SIDES[s], 0, t.y + t.wh * 0.58, t.ww / 2, 0.42, t.wh * 0.4));
          if (front === 'door') [-1, 1].forEach((k) => winAt(win, fr, 0, k * t.ww * 0.32, t.y + t.wh * 0.62, t.ww / 2, 0.38, t.wh * 0.36));
        }
      });
      return { win, fr, st, bl };
    }, [info, front]);
    const t0 = info.tiers[0], s0 = w + 0.5 + 0.36 * plinth;
    return (
      <group>
        {Array.from({ length: plinth }, (_, i) => {
          const s = w + 0.5 + 0.36 * (plinth - i);
          return <Box key={`p${i}`} s={[s, HH, s]} p={[0, i * HH + HH / 2, 0]} m={stonePlinth && i % 2 === 0 ? stoneM(M) : brickCM(M, s, HH * 2, BRICKS[(wall + 2) % 5])} />;
        })}
        <Box s={[w + 0.58, 0.04, w + 0.58]} p={[0, plinth * HH - 0.02, 0]} m={stoneM(M)} cast={false} />
        {Array.from({ length: plinth + 1 }, (_, k) => {
          const h = HH * (k + 1);
          const stTop = (w + 0.5 + 0.36) / 2;
          const zf = s0 / 2 + 0.34 * (plinth - k);
          return <Box key={`s${k}`} s={[1.1, h, zf - stTop + 0.02]} p={[0, h / 2, (zf + stTop) / 2]} m={stoneM(M)} />;
        })}
        {info.tiers.map((t, i) => (
          <group key={i}>
            <Box s={[t.ww, t.wh, t.ww]} p={[0, t.y + t.wh / 2, 0]} m={brickCM(M, t.ww, t.wh, BRICKS[(wall + i) % 5])} />
            <Box s={[t.ww + 0.08, 0.12, t.ww + 0.08]} p={[0, t.y + t.wh - 0.06, 0]} m={timberM(M)} />
            <Box s={[t.ww + 0.06, 0.07, t.ww + 0.06]} p={[0, t.y + 0.04, 0]} m={timberM(M)} cast={false} />
            <Roof w={t.ww + 2 * t.ov} d={t.ww + 2 * t.ov} h={t.rh} y={t.y + t.wh - 0.05} m={topGold && i === roofs - 1 ? M.gold : tileM(M)} fascia={false} />
            <Box s={[t.ww + 2 * t.ov - 0.1, 0.07, t.ww + 2 * t.ov - 0.1]} p={[0, t.y + t.wh - 0.06, 0]} m={eaveM(M)} cast={false} />
          </group>
        ))}
        {front === 'door' && (
          <group position={[0, t0.y, t0.ww / 2]}>
            <Box s={[0.9, 1.15, 0.08]} p={[0, 0.575, 0.03]} m={timberM(M)} cast={false} />
            <Box s={[0.68, 1.0, 0.06]} p={[0, 0.5, 0.07]} m={darkM(M)} cast={false} />
            <Box s={[0.84, 0.07, 0.1]} p={[0, 1.2, 0.07]} m={M.gold} cast={false} />
          </group>
        )}
        {torana && (
          <group position={[0, t0.y + 1.02, t0.ww / 2 + 0.14]}>
            <mesh material={M.gold} castShadow><torusGeometry args={[0.56, 0.05, 6, 20, PI]} /></mesh>
            <mesh position={[0, 0.34, 0]} material={M.gold}><torusGeometry args={[0.3, 0.035, 6, 16, PI]} /></mesh>
            <Cyl rt={0.04} rb={0.04} h={1.0} p={[-0.56, -0.5, 0]} m={M.gold} seg={8} />
            <Cyl rt={0.04} rb={0.04} h={1.0} p={[0.56, -0.5, 0]} m={M.gold} seg={8} />
            <Ball rad={0.1} p={[0, 0.78, 0]} m={M.gold} />
          </group>
        )}
        {front === 'shop' && (
          <group position={[0, t0.y, t0.ww / 2]}>
            <Box s={[t0.ww * 0.86, 0.9, 0.06]} p={[0, 0.5, 0.03]} m={darkM(M)} cast={false} />
            {[-1.5, -0.5, 0.5, 1.5].map((k) => <Box key={k} s={[0.1, 0.95, 0.12]} p={[k * t0.ww * 0.215, 0.5, 0.08]} m={timberM(M)} cast={false} />)}
            <Box s={[t0.ww * 0.92, 0.09, 0.14]} p={[0, 1.02, 0.08]} m={timberM(M)} cast={false} />
          </group>
        )}
        {front === 'shop' && info.tiers[1] && (() => {
          const t = info.tiers[1]; const W = t.ww * 1.0;
          return (
            <group position={[0, t.y + t.wh * 0.5, t.ww / 2]}>
              <Box s={[W, t.wh * 0.9, 0.1]} p={[0, 0, 0.03]} m={M.gold} cast={false} />
              {[-1, 0, 1].map((k) => (
                <group key={k} position={[k * W * 0.33, 0, 0]}>
                  <mesh position={[0, 0, 0.09]} material={latMat()}><planeGeometry args={[W * 0.27, t.wh * 0.6]} /></mesh>
                  <Box s={[W * 0.31, 0.05, 0.16]} p={[0, t.wh * 0.38, 0.1]} m={M.gold} cast={false} />
                </group>
              ))}
              <Box s={[W + 0.2, 0.06, 0.34]} p={[0, -t.wh * 0.42, 0.14]} m={M.gold} cast={false} />
            </group>
          );
        })()}
        <Inst geo={G.box} m={timberM(M)} items={data.st} />
        <Inst geo={G.cone} m={M.gold} items={data.bl} />
        <Windows win={data.win} fr={data.fr} />
        <Finial y={info.apex - 0.1} s={0.95 * big} />
        {elephants && [-1, 1].map((k) => <group key={k} position={[k * 0.95, 0, s0 / 2 + 0.34 * plinth + 0.35]} scale={1.5}><Elephant m={stoneM(M)} /></group>)}
        {lions && [-1, 1].map((k) => <group key={k} position={[k * 0.85, 0.2, s0 / 2 + 0.7]} scale={1.4}><Lion m={stoneM(M)} /></group>)}
      </group>
    );
  }

  /* ================= grey stone shikhara pieces ================= */
  function StoneSpirelets({ items, R = 0.2, H = 0.65, kal = 1 }) {
    const M = useM();
    const geo = memoGeo(`sp${R}${H}`, () => ribbedGeo(R, H, { seg: 14, rows: 9, ribs: 4, amp: 0.1, p1: 1.7, p2: 0.9, belly: 0.12, tmax: 0.95 }));
    const fin = useMemo(() => items.map((it) => ({ p: [it.p[0], it.p[1] + H * 0.99, it.p[2]], s: [0.13 * kal, 0.12 * kal, 0.13 * kal] })), [items, H, kal]);
    const spike = useMemo(() => items.map((it) => ({ p: [it.p[0], it.p[1] + H * 1.05 + 0.15 * kal, it.p[2]], s: [0.07 * kal, 0.3 * kal, 0.07 * kal] })), [items, H, kal]);
    return (
      <>
        <Inst geo={geo} m={stoneM(M)} items={items} shadow />
        <Inst geo={G.ball} m={M.gold} items={fin} />
        <Inst geo={G.cone} m={M.gold} items={spike} />
      </>
    );
  }

  /** Krishna Mandir: three open arched colonnade storeys on a stepped plinth, curved ribbed central shikhara, 21 gilded pinnacles (8 + 8 + 4 + 1). */
  function KrishnaMandir() {
    const M = useM();
    const st = stoneM(M), stD = stoneDM(M);
    const L = useMemo(() => [{ y: 0.6, h: 0.95, half: 1.7, n: 5 }, { y: 1.7, h: 0.9, half: 1.3, n: 4 }, { y: 2.75, h: 0.8, half: 0.9, n: 3 }], []);
    const d = useMemo(() => {
      const cols = [], beams = [], arches = [[], [], []], spl = [[], [], []];
      L.forEach((lv, li) => {
        const { y, h, half, n } = lv;
        const sp = (2 * half) / (n - 1);
        SIDES.forEach((ry) => {
          for (let k = 0; k < n; k += 1) {
            if ((ry === PI / 2 || ry === -PI / 2) && (k === 0 || k === n - 1)) continue;
            const a = -half + k * sp; const [x, z] = at(ry, a, half);
            cols.push({ p: [x, y + h / 2, z], s: [0.2, h, 0.2] });
          }
          for (let k = 0; k < n - 1; k += 1) {
            const a = -half + (k + 0.5) * sp; const [x, z] = at(ry, a, half - 0.3);
            arches[li].push({ p: [x, y + 0.02, z], r: [0, ry, 0] });
          }
          const [bx, bz] = at(ry, 0, half);
          beams.push({ p: [bx, y + h - 0.08, bz], r: [0, ry, 0], s: [2 * half + 0.24, 0.16, 0.26] });
        });
        const rr = half + 0.12;
        const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [a * rr, b * rr]);
        const mids = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [a * rr, b * rr]);
        const sy = y + h + 0.15;
        (li < 2 ? corners.concat(mids) : corners).forEach(([x, z]) => spl[li].push({ p: [x, sy, z] }));
      });
      return { cols, beams, arches, spl };
    }, [L]);
    const archG = L.map((lv, i) => memoGeo(`kar${i}`, () => archGeo((2 * lv.half) / (lv.n - 1) - 0.24, lv.h - 0.2)));
    const tower = memoGeo('kmt3', () => ribbedGeo(0.85, 3.6, { seg: 32, rows: 30, ribs: 8, amp: 0.11, p1: 1.9, p2: 0.75, belly: 0.1, tmax: 0.93 }));
    const bands = [0.2, 0.36, 0.52, 0.66, 0.78].map((t) => ({ y: t * 3.6, r: 0.85 * Math.pow(1 - Math.pow(t * 0.93, 1.9), 0.75) * (1 + 0.1 * Math.sin(PI * t * 0.93)) * 1.1 }));
    const topY = 3.7;
    const ringG = memoGeo('kmring', () => ribbedGeo(0.34, 0.16, { seg: 20, rows: 3, ribs: 10, amp: 0.1, p1: 4, p2: 1, belly: 0.4 }));
    return (
      <group>
        {[5.6, 5.1, 4.6].map((s, i) => <Box key={i} s={[s, 0.2, s]} p={[0, 0.1 + i * 0.2, 0]} m={st} />)}
        {[0, 1, 2].map((k) => <Box key={`st${k}`} s={[1.7, 0.2 * (k + 1), 0.9 - 0.3 * k + 0.1]} p={[0, 0.1 * (k + 1), 2.7 + (0.9 - 0.3 * k) / 2]} m={st} />)}
        {L.map((lv, i) => (
          <group key={i}>
            <Box s={[2 * lv.half - 0.5, lv.h, 2 * lv.half - 0.5]} p={[0, lv.y + lv.h / 2, 0]} m={stD} />
            <Box s={[2 * lv.half + 0.6, 0.15, 2 * lv.half + 0.6]} p={[0, lv.y + lv.h + 0.075, 0]} m={st} />
            <Box s={[2 * lv.half + 0.3, 0.06, 2 * lv.half + 0.3]} p={[0, lv.y + 0.03, 0]} m={st} cast={false} />
            <Inst geo={archG[i]} m={darkM(M)} items={d.arches[i]} />
          </group>
        ))}
        <Inst geo={G.box} m={st} items={d.cols} shadow />
        <Inst geo={G.box} m={st} items={d.beams} shadow />
        <StoneSpirelets items={d.spl[0]} R={0.26} H={0.85} kal={1.2} />
        <StoneSpirelets items={d.spl[1]} R={0.24} H={0.75} kal={1.2} />
        <StoneSpirelets items={d.spl[2]} R={0.2} H={0.65} kal={1.2} />
        <mesh geometry={tower} position={[0, topY, 0]} material={st} castShadow receiveShadow />
        {bands.map((b, i) => <Cyl key={i} rt={b.r} rb={b.r} h={0.07} p={[0, topY + b.y, 0]} m={stD} seg={20} />)}
        <mesh geometry={ringG} position={[0, topY + 3.5, 0]} material={st} castShadow />
        <Ball rad={0.2} p={[0, topY + 3.82, 0]} m={M.gold} />
        <Cyl rt={0.1} rb={0.1} h={0.1} p={[0, topY + 3.98, 0]} m={M.gold} seg={12} />
        <mesh position={[0, topY + 4.25, 0]} material={M.gold} castShadow><coneGeometry args={[0.08, 0.55, 10]} /></mesh>
      </group>
    );
  }

  /** Chyasin Dega: octagonal stone temple, two open arched colonnaded floors with balconies, one dominant smooth domed shikhara, 8 small corner turrets, gilded pinnacle, two lions. */
  function Chyasin() {
    const M = useM();
    const st = stoneM(M), stD = stoneDM(M);
    const lv = [{ y: 0.4, h: 0.85, R: 1.5 }, { y: 1.37, h: 0.7, R: 1.1 }];
    const d = useMemo(() => {
      const cols = [], rails = [], arch = [[], []];
      lv.forEach((l, li) => {
        for (let k = 0; k < 8; k += 1) {
          const a = k * PI / 4 + PI / 8, a2 = k * PI / 4;
          cols.push({ p: [l.R * Math.sin(a), l.y + l.h / 2, l.R * Math.cos(a)], s: [0.22, l.h, 0.22] });
          const rr = (l.R + 0.2) * Math.cos(PI / 8);
          rails.push({ p: [rr * Math.sin(a2), l.y + l.h + 0.13 + 0.12, rr * Math.cos(a2)], r: [0, a2, 0], s: [(l.R + 0.2) * 2 * Math.sin(PI / 8) * 0.98, 0.13, 0.04] });
          rails.push({ p: [rr * Math.sin(a2), l.y + l.h + 0.13 + 0.04, rr * Math.cos(a2)], r: [0, a2, 0], s: [(l.R + 0.2) * 2 * Math.sin(PI / 8) * 0.98, 0.05, 0.04] });
          const ap = (l.R - 0.26) * Math.cos(PI / 8) + 0.02;
          arch[li].push({ p: [ap * Math.sin(a2), l.y + 0.03, ap * Math.cos(a2)], r: [0, a2, 0] });
        }
      });
      return { cols, rails, arch };
    }, []);
    const sy = 1.37 + 0.7 + 0.13;
    const tur = useMemo(() => Array.from({ length: 8 }, (_, k) => { const a = k * PI / 4 + PI / 8; return { p: [1.12 * Math.sin(a), sy, 1.12 * Math.cos(a)] }; }), []);
    const dome = memoGeo('cdome3', () => ribbedGeo(1.0, 2.5, { seg: 32, rows: 30, ribs: 8, amp: 0.03, p1: 2.2, p2: 0.7, belly: 0.3, tmax: 0.97 }));
    const archG = [memoGeo('cha0', () => archGeo(0.78, 0.72)), memoGeo('cha1', () => archGeo(0.58, 0.58))];
    const oct = (r, h, y, m, k) => <mesh key={k} position={[0, y, 0]} rotation={[0, PI / 8, 0]} material={m} castShadow receiveShadow><cylinderGeometry args={[r, r, h, 8]} /></mesh>;
    return (
      <group>
        {oct(2.2, 0.2, 0.1, st, 'a')}
        {oct(1.9, 0.2, 0.3, st, 'b')}
        {lv.map((l, i) => (
          <group key={i}>
            {oct(l.R - 0.26, l.h, l.y + l.h / 2, stD, `c${i}`)}
            {oct(l.R + 0.2, 0.13, l.y + l.h + 0.065, st, `s${i}`)}
            <Inst geo={archG[i]} m={M.plain('#120a05', { roughness: 1 })} items={d.arch[i]} />
          </group>
        ))}
        <Inst geo={G.cyl} m={st} items={d.cols} shadow />
        <Inst geo={G.box} m={st} items={d.rails} />
        <mesh geometry={dome} position={[0, sy, 0]} material={st} castShadow receiveShadow />
        <StoneSpirelets items={tur} R={0.24} H={0.95} />
        <Cyl rt={0.14} rb={0.14} h={0.16} p={[0, sy + 2.5 * 0.99, 0]} m={st} seg={12} />
        <Ball rad={0.17} p={[0, sy + 2.7, 0]} m={M.gold} />
        <mesh position={[0, sy + 3.1, 0]} material={M.gold} castShadow><coneGeometry args={[0.07, 0.8, 10]} /></mesh>
        {[0, 1, 2].map((k) => <Box key={k} s={[1.5, 0.2 * (k + 1), 0.34]} p={[0, 0.1 * (k + 1), 1.9 + (2 - k) * 0.34 + 0.1]} m={st} />)}
        {[-1, 1].map((k) => <group key={k} position={[k * 1.0, 0.0, 2.45]} scale={1.55}><Lion m={st} /></group>)}
      </group>
    );
  }

  /** small independent stone shikhara (as between the pagodas in the photographs) */
  function SmallShikhara() {
    const M = useM();
    const st = stoneM(M);
    const tower = memoGeo('sst', () => ribbedGeo(0.52, 1.8, { seg: 24, rows: 18, ribs: 8, amp: 0.06, p1: 2, p2: 0.85, belly: 0.1, tmax: 0.92 }));
    return (
      <group>
        <Box s={[1.9, 0.22, 1.9]} p={[0, 0.11, 0]} m={st} />
        <Box s={[1.6, 0.22, 1.6]} p={[0, 0.33, 0]} m={st} />
        <Box s={[1.0, 0.9, 1.0]} p={[0, 0.99, 0]} m={stoneDM(M)} />
        <Box s={[1.18, 0.1, 1.18]} p={[0, 1.49, 0]} m={st} />
        <Box s={[0.6, 0.7, 0.5]} p={[0, 0.9, 0.62]} m={st} />
        <Box s={[0.74, 0.08, 0.6]} p={[0, 1.28, 0.62]} m={st} />
        <mesh geometry={tower} position={[0, 1.54, 0]} material={st} castShadow />
        <Cyl rt={0.16} rb={0.16} h={0.1} p={[0, 1.54 + 1.8 * 0.99, 0]} m={st} seg={12} />
        <Ball rad={0.1} p={[0, 1.54 + 1.95, 0]} m={M.gold} />
        <mesh position={[0, 1.54 + 2.2, 0]} material={M.gold}><coneGeometry args={[0.045, 0.4, 8]} /></mesh>
        {[0, 1].map((k) => <Box key={k} s={[0.7, 0.2 * (k + 1), 0.3]} p={[0, 0.1 * (k + 1), 1.2 + (1 - k) * 0.3]} m={st} />)}
      </group>
    );
  }

  /* ================= free-standing monuments ================= */
  /** Yoganarendra Malla column: 3-step square base, thick shaft, gilt seated king under a cobra hood, small bird on top. */
  function KingColumn() {
    const M = useM();
    const st = stoneM(M);
    return (
      <group>
        {[2.3, 1.95, 1.6, 1.25].map((s, i) => <Box key={i} s={[s, 0.2, s]} p={[0, 0.1 + i * 0.2, 0]} m={i % 2 ? stoneDM(M) : st} />)}
        <group position={[0, 0.2, 0]}>
        <Cyl rt={0.25} rb={0.33} h={2.6} p={[0, 0.6 + 1.3, 0]} m={st} seg={14} />
        {[0.45, 1.3, 2.2].map((y, i) => <Cyl key={i} rt={0.33} rb={0.33} h={0.08} p={[0, 0.6 + y, 0]} m={stoneDM(M)} seg={14} />)}
        <Cyl rt={0.5} rb={0.25} h={0.32} p={[0, 3.36, 0]} m={st} seg={14} />
        <Box s={[0.9, 0.12, 0.9]} p={[0, 3.58, 0]} m={st} />
        <group position={[0, 3.64, 0]} scale={2.0}>
          <Box s={[0.3, 0.22, 0.22]} p={[0, 0.11, 0]} m={M.gold} />
          <Box s={[0.2, 0.26, 0.14]} p={[0, 0.35, 0]} m={M.gold} />
          <Ball rad={0.08} p={[0, 0.56, 0.01]} m={M.gold} />
          <mesh position={[0, 0.68, 0]} material={M.gold}><coneGeometry args={[0.06, 0.12, 8]} /></mesh>
          <mesh position={[0, 0.74, -0.12]} rotation={[-0.25, 0, 0]} scale={[1, 1, 0.35]} material={M.gold} castShadow><sphereGeometry args={[0.33, 16, 10, 0, PI * 2, 0, PI / 2]} /></mesh>
          <Cyl rt={0.02} rb={0.05} h={0.35} p={[0, 0.9, -0.12]} m={M.gold} seg={8} />
          <Ball rad={0.07} sc={[1, 0.9, 1.4]} p={[0, 1.12, -0.12]} m={M.gold} />
          <mesh position={[0, 1.16, -0.12]} material={M.gold}><boxGeometry args={[0.24, 0.025, 0.08]} /></mesh>
        </group>
        </group>
      </group>
    );
  }
  function GarudaColumn() {
    const M = useM();
    const st = stoneM(M);
    return (
      <group>
        <Box s={[0.7, 0.2, 0.7]} p={[0, 0.1, 0]} m={st} />
        <Cyl rt={0.11} rb={0.15} h={1.3} p={[0, 0.85, 0]} m={st} seg={12} />
        <Cyl rt={0.2} rb={0.12} h={0.14} p={[0, 1.57, 0]} m={st} seg={12} />
        <group position={[0, 1.64, 0]} rotation={[0, -PI / 2, 0]} scale={1.5}><Garuda m={M.gold} /></group>
      </group>
    );
  }
  function SquarePillar() {
    const M = useM();
    const st = stoneM(M);
    return (
      <group>
        <Box s={[0.8, 0.18, 0.8]} p={[0, 0.09, 0]} m={st} />
        <Box s={[0.4, 2.2, 0.4]} p={[0, 1.28, 0]} m={st} />
        <Box s={[0.55, 0.14, 0.55]} p={[0, 2.45, 0]} m={st} />
        <Box s={[0.28, 0.1, 0.28]} p={[0, 2.57, 0]} m={stoneDM(M)} />
        <Ball rad={0.12} p={[0, 2.7, 0]} m={M.gold} />
      </group>
    );
  }
  /** Taleju bell: a great bronze bell hung between two stone pillars under a small tiled roof */
  function BellShrine() {
    const M = useM();
    const st = stoneM(M);
    const bellG = useMemo(() => new THREE.LatheGeometry([[0.02, 0.4], [0.14, 0.38], [0.2, 0.2], [0.3, -0.02], [0.33, -0.08]].map(([x, y]) => new THREE.Vector2(x, y)), 20), []);
    return (
      <group>
        <Box s={[1.1, 0.2, 1.9]} p={[0, 0.1, 0]} m={st} />
        {[-0.7, 0.7].map((z) => <Box key={z} s={[0.24, 1.5, 0.24]} p={[0, 0.95, z]} m={st} />)}
        <Box s={[0.3, 0.14, 1.85]} p={[0, 1.72, 0]} m={timberM(M)} />
        <mesh geometry={bellG} position={[0, 1.3, 0]} scale={1.15} material={M.plain('#6b5a3a', { metalness: 0.7, roughness: 0.4 })} castShadow />
        <Roof w={1.7} d={2.3} h={0.5} y={1.78} m={tileM(M)} fascia={false} />
        <Cyl rt={0.03} rb={0.05} h={0.24} p={[0, 2.32, 0]} m={M.gold} seg={8} />
      </group>
    );
  }
  function Figure({ kind, p }) {
    const M = useM();
    const st = stoneM(M);
    return (
      <group position={p}>
        <Box s={[0.46, 0.3, 0.46]} p={[0, 0.15, 0]} m={st} />
        {kind === 'hanuman' && (<><Box s={[0.26, 0.3, 0.2]} p={[0, 0.45, 0]} m={M.plain('#8a5a44')} /><Ball rad={0.1} p={[0, 0.68, 0.02]} m={M.plain('#8a5a44')} /><Cyl rt={0.02} h={0.5} p={[0.14, 0.62, -0.1]} r={[0, 0, -0.3]} m={M.plain('#8a5a44')} seg={6} /></>)}
        {kind === 'ganesh' && (<><Ball rad={0.17} sc={[1, 1.1, 0.9]} p={[0, 0.5, 0]} m={st} /><Ball rad={0.11} p={[0, 0.76, 0.03]} m={st} /><Cyl rt={0.025} rb={0.04} h={0.2} p={[0, 0.66, 0.15]} r={[0.3, 0, 0]} m={st} seg={6} /></>)}
        {kind === 'narasimha' && (<><Box s={[0.28, 0.32, 0.2]} p={[0, 0.46, 0]} m={st} /><Ball rad={0.12} p={[0, 0.72, 0.02]} m={st} /><Ball rad={0.17} sc={[1.2, 0.5, 0.5]} p={[0, 0.74, -0.02]} m={st} /></>)}
      </group>
    );
  }

  /* ================= the long royal palace: three chowk-length blocks of different height, each with its own tiled roof ================= */
  function Palace() {
    const M = useM();
    const SEG = [
      { x0: -19.5, x1: -6.2, H: 3.9, rh: 1.15, c: 0, gx: -12.85 }, // Sundari Chowk (south)
      { x0: -6.2, x1: 6.2, H: 4.2, rh: 1.7, c: 2, gx: 0 },          // Mul Chowk (centre, projecting)
      { x0: 6.2, x1: 19.5, H: 3.3, rh: 0.95, c: 1, gx: 12.85 },     // Keshav Narayan Chowk (north)
    ];
    const d = useMemo(() => {
      const r = rng(77);
      const win = [], bay = [], gbay = [], sill = [], slit = [], strut = [], hood = [], band = [], edge = [], bwin = [], bfr = [];
      const flat = (x, y, w, h) => {
        bay.push({ p: [x, y, 0.07], s: [w + 0.24, h + 0.24, 0.18] });
        win.push({ p: [x, y, 0.17], s: [w, h, 1] });
        sill.push({ p: [x, y - h / 2 - 0.15, 0.15], s: [w + 0.42, 0.06, 0.32] });
      };
      const deep = (x, y, w, h) => {
        bay.push({ p: [x, y, 0.38], s: [w + 0.34, h + 0.34, 0.76] });
        win.push({ p: [x, y, 0.77], s: [w, h, 1] });
        hood.push({ p: [x, y + h / 2 + 0.32, 0.6], r: [0.45, 0, 0], s: [w + 0.9, 0.05, 1.0] });
        sill.push({ p: [x, y - h / 2 - 0.22, 0.62], s: [w + 0.6, 0.07, 0.5] });
      };
      SEG.forEach((sg, si) => {
        const { x0, x1, H, gx } = sg; const L = x1 - x0; const mid = (x0 + x1) / 2;
        const yU = H - 1.35;
        const deepX = [0.17, 0.5, 0.83].map((f) => x0 + L * f);
        deepX.forEach((x, k) => { if (k === 1 && si < 2) return; deep(x, yU, 1.5, 1.2); });
        for (let row = 0; row < 2; row += 1) {
          let x = x0 + 0.9;
          while (x < x1 - 0.7) {
            const w = [0.7, 0.95, 1.2, 0.8][Math.floor(r() * 4)];
            const y = row === 0 ? 1.45 : yU; const h = row === 0 ? 0.62 : 0.85;
            const blocked = (row === 1 && deepX.some((dx) => Math.abs(x - dx) < 1.55 + w / 2)) || Math.abs(x - gx) < (row === 0 ? 2.0 : 1.9);
            if (!blocked) flat(x, y, w, h);
            x += w + 0.55 + r() * 0.45;
          }
        }
        band.push({ p: [mid, 2.55, 0.1], s: [L, 0.09, 0.3] });
        edge.push({ p: [mid, H - 0.42, 1.62], s: [L + 0.5, 0.12, 0.16] });
        for (let x = x0 + 0.5; x < x1 - 0.2; x += 0.95) {
          if (Math.abs(x - gx) < 2.2 && si !== 2) continue;
          strut.push({ p: [x, H - 0.92, 0.72], r: [0.96, 0, 0], s: [0.1, 1.6, 0.1] });
        }
        for (let x = x0 + 0.7; x < x1; x += 1.9) { if (Math.abs(x - gx) < 2.3) continue; slit.push({ p: [x, 0.75, 0.012], s: [0.24, 0.5, 1] }); }
      });
      [[1.3, 0.55], [2.35, 0.55]].forEach(([y, ht], ri) => {
        for (let x = -18; x <= 18.1; x += 1.8) {
          if ((Math.round((x + 18) / 1.8) + ri) % 3 === 2) continue;
          bwin.push({ p: [x, y, -4.53], r: [0, PI, 0], s: [0.6, ht, 1] });
          bfr.push({ p: [x, y, -4.51], s: [0.72, ht + 0.12, 0.05] });
        }
      });
      [[-19.52, -PI / 2, 3.9], [19.52, PI / 2, 3.3]].forEach(([x, ry, H]) => {
        [-0.9, -2.25, -3.6].forEach((z) => [1.4, H - 1.35].forEach((y) => { win.push({ p: [x + Math.sign(x) * 0.02, y, z], r: [0, ry, 0], s: [0.7, 0.8, 1] }); bay.push({ p: [x + Math.sign(x) * 0.005, y, z], s: [0.1, 1.0, 0.95] }); }));
      });
      return { win, bay, gbay, sill, slit, strut, hood, band, edge, bwin, bfr };
    }, []);
    const stone = stoneM(M);
    const tl = tileM(M);
    const Gate = ({ sg, gold, zf = 0 }) => (
      <group position={[sg.gx, 0, zf]}>
        <Box s={[2.8, 2.3, 0.55]} p={[0, 1.15, 0.27]} m={brickCM(M, 2.8, 2.3, BRICKS[(sg.c + 3) % 5])} />
        <Box s={[1.5, 1.6, 0.1]} p={[0, 0.8, 0.58]} m={gold ? M.gold : timberM(M)} cast={false} />
        <Box s={[1.06, 1.4, 0.07]} p={[0, 0.7, 0.63]} m={darkM(M)} cast={false} />
        <mesh position={[0, 1.45, 0.66]} material={gold ? M.gold : timberM(M)}><torusGeometry args={[0.6, 0.05, 6, 20, PI]} /></mesh>
        {gold && <Box s={[2.5, 0.1, 0.12]} p={[0, 1.78, 0.64]} m={M.gold} cast={false} />}
        <Box s={[3.1, 0.07, 1.15]} p={[0, 2.32, 0.6]} r={[0.3, 0, 0]} m={tl} />
        <Box s={[1.9, 0.12, 0.36]} p={[0, 0.06, 0.82]} m={stone} />
        <Box s={[2.2, 0.08, 0.3]} p={[0, 0.04, 1.1]} m={stone} />
      </group>
    );
    const TripleBay = ({ x, y, z, n = 3, w = 1.0, h = 1.35 }) => (
      <group position={[x, y, z]}>
        <Box s={[n * (w + 0.34) + 0.3, h + 0.5, 0.7]} p={[0, 0, 0.35]} m={M.gold} />
        {Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * (w + 0.34)).map((dx, k) => (
          <group key={k} position={[dx, 0, 0]}>
            <Box s={[w + 0.12, h + 0.12, 0.12]} p={[0, 0, 0.72]} m={M.plain('#3a2216', { roughness: 0.8 })} cast={false} />
            <mesh position={[0, 0, 0.79]} material={latMat()}><planeGeometry args={[w, h]} /></mesh>
            <Box s={[w + 0.34, 0.08, 0.34]} p={[0, h / 2 + 0.2, 0.78]} m={M.gold} cast={false} />
          </group>
        ))}
        <Box s={[n * (w + 0.34) + 0.8, 0.06, 1.1]} p={[0, h / 2 + 0.42, 0.6]} r={[0.4, 0, 0]} m={tl} />
      </group>
    );
    return (
      <group>
        {SEG.map((sg, i) => {
          const L = sg.x1 - sg.x0; const mid = (sg.x0 + sg.x1) / 2;
          return (
            <group key={i}>
              <Box s={[L, sg.H, 4.5]} p={[mid, sg.H / 2, -2.25]} m={brickCM(M, L, sg.H, BRICKS[sg.c])} />
              <Box s={[L + 0.2, 0.34, 0.14]} p={[mid, 0.17, 0.05]} m={stone} />
              <Box s={[L + 0.5, 0.07, 1.9]} p={[mid, sg.H - 0.12, 0.75]} r={[0.3, 0, 0]} m={tl} />
              <Box s={[L, 0.16, 0.22]} p={[mid, sg.H - 0.3, 0.12]} m={timberM(M)} cast={false} />
              <Box s={[L + 0.5, 0.06, 1.0]} p={[mid, 2.12, 0.5]} r={[0.3, 0, 0]} m={tl} />
              <mesh geometry={memoGeo(`hip${i}`, () => hipGeo(L + 0.8, 6.6, sg.rh, -(L / 2 - 2.6), L / 2 - 2.6))} position={[mid, sg.H - 0.08, -1.8]} material={tl} castShadow receiveShadow />
              <Box s={[L - 3.6, 0.1, 0.12]} p={[mid, sg.H - 0.08 + sg.rh, -1.8]} m={eaveM(M)} cast={false} />
            </group>
          );
        })}
        <Box s={[13.6, 0.1, 0.9]} p={[0, 0.05, 0.5]} m={stone} cast={false} />
        <Inst geo={G.box} m={M.plain('#3e2616', { roughness: 0.85 })} items={d.bay} />
        <Inst geo={G.plane} m={latMat()} items={d.win} />
        <Inst geo={G.box} m={timberM(M)} items={d.sill} />
        <Inst geo={G.box} m={timberM(M)} items={d.band} />
        <Inst geo={G.box} m={eaveM(M)} items={d.edge} />
        <Inst geo={G.box} m={tl} items={d.hood} />
        <Inst geo={G.plane} m={darkM(M)} items={d.slit} />
        <Inst geo={G.box} m={timberM(M)} items={d.strut} />
        <Inst geo={G.plane} m={latMat()} items={d.bwin} />
        <Inst geo={G.box} m={timberM(M)} items={d.bfr} />
        {/* Mul Chowk: projecting central bay with gilded gate and triple gilded windows, raised gabled block above with gilded roof and pinnacles */}
        <group>
          <Box s={[7.0, 3.9, 1.1]} p={[0, 1.95, 0.55]} m={brickCM(M, 7, 3.9, BRICKS[4])} />
          <Gate sg={SEG[1]} gold zf={1.1} />
          <TripleBay x={0} y={3.0} z={1.1} />
          <Box s={[8.0, 0.14, 1.8]} p={[0, 4.12, 1.55]} r={[0.3, 0, 0]} m={tl} />
          <Box s={[8.0, 0.1, 0.16]} p={[0, 3.78, 2.28]} m={eaveM(M)} cast={false} />
          <Box s={[5.6, 1.1, 3.6]} p={[0, 4.2 + 0.55, -3.2]} m={brickCM(M, 5.6, 1.1, BRICKS[3])} />
          <mesh geometry={memoGeo('mulhip', () => hipGeo(7.0, 5.2, 1.5, -1.2, 1.2))} position={[0, 5.25, -3.2]} material={M.gold} castShadow />
          {[-2.4, 0, 2.4].map((x) => <group key={x} position={[x, 6.7, -3.2]} scale={0.7}><Cyl rt={0.07} rb={0.14} h={0.3} p={[0, 0.15, 0]} m={M.gold} seg={10} /><Ball rad={0.17} p={[0, 0.42, 0]} m={M.gold} /><mesh position={[0, 0.85, 0]} material={M.gold}><coneGeometry args={[0.07, 0.8, 8]} /></mesh></group>)}
        </group>
        {/* Sundari Chowk: gold-framed carved window bay over the gate, Hanuman, Ganesh, Narasimha guarding */}
        <Gate sg={SEG[0]} gold />
        <TripleBay x={SEG[0].gx} y={3.15} z={0.1} n={3} w={0.95} h={1.0} />
        <Gate sg={SEG[2]} gold={false} />
        {[[-1.4, 'ganesh'], [1.5, 'hanuman'], [2.6, 'narasimha']].map(([dx, k], i) => <Figure key={i} kind={k} p={[SEG[0].gx + dx + (dx < 0 ? -0.5 : 0.1), 0, 1.4]} />)}
        {/* Taleju pagoda rising behind the Mul Chowk bay */}
        <group position={[0, 0, -8.2]}><Pagoda roofs={3} w={2.4} plinth={3} ov0={0.7} big={1.3} topGold torana wall={1} /></group>
      </group>
    );
  }

  /* ================= MAIN ================= */
  const TX = 4.4; // temple row x (before the mirror)
  const YAW = 0.95; // the plaza's long axis is turned toward the default camera, so the view runs down the square as in the classic photograph
  /** Real orientation: palace on the east, temples on the west; seen from the south end the palace is on the right. */
  function Plan({ children }) {
    return <group rotation={[0, YAW, 0]}><group scale={[-1, 1, 1]}>{children}</group></group>;
  }
  function PatanMain() {
    const TZ = PI / -2;
    const T = (x, z, children, sc = 1) => <group position={[x, 0, z]} rotation={[0, TZ, 0]} scale={sc}>{children}</group>;
    return (
      <group>
        <Plan>
          <group position={[-5.5, 0, -4]} rotation={[0, PI / 2, 0]}><Palace /></group>
          {T(TX, 12, <Chyasin />, 1.05)}
          {T(TX + 0.2, 6.8, <Pagoda roofs={2} w={2.0} plinth={4} stonePlinth wall={3} lions />, 1.15)}
          {T(TX - 0.1, 3.3, <SmallShikhara />, 0.9)}
          {T(TX + 0.1, 0, <Pagoda roofs={3} w={2.0} plinth={4} wall={0} elephants />, 1.12)}
          {T(TX + 0.2, -6.1, <KrishnaMandir />, 1.3)}
          <group position={[0.4, 0, -6.1]}><GarudaColumn /></group>
          {T(TX - 0.7, -11.9, <BellShrine />, 1.4)}
          {T(TX + 0.2, -15.2, <Pagoda roofs={2} w={2.0} plinth={3} wall={2} elephants />)}
          {T(TX + 0.3, -19.8, <Pagoda roofs={3} w={2.0} plinth={4} stonePlinth wall={4} front="shop" />, 1.1)}
          <group position={[-2.5, 0, 1.4]} scale={1.3}><KingColumn /></group>
          <group position={[0.2, 0, 8.6]}><SquarePillar /></group>
        </Plan>
        <Frame s={[17, 7.6, 22]} p={[-2.7, 3.8, -4.2]} />
      </group>
    );
  }

  /* ================= ENV ================= */
  /** blue-hazed daytime sky dome (hidden at dusk, when the app paints its own dusk sky) */
  function Sky() {
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      const f = () => { const b = document.querySelector('.chip.on'); setDusk(!!b && /dusk/i.test(b.textContent || '')); };
      f(); const t = setInterval(f, 400); return () => clearInterval(t);
    }, []);
    const tex = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 256;
      const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#6f9fd6'); g.addColorStop(0.35, '#9dc0e4'); g.addColorStop(0.5, '#cfe0ee'); g.addColorStop(0.56, '#e9e4d6'); g.addColorStop(1, '#e9e4d6');
      x.fillStyle = g; x.fillRect(0, 0, 4, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }, []);
    if (dusk) return null;
    return <mesh renderOrder={-10}><sphereGeometry args={[175, 24, 16]} /><meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} /></mesh>;
  }
  function PatanEnvInner() {
    const M = useM();
    const houses = useMemo(() => {
      const r = rng(11);
      const bodyB = [], bodyP = [], roofs = [], win = [], wfr = [];
      const BR = ['#b87a5e', '#a86e54', '#c2866a', '#9c6450', '#b48066', '#c8977f'];
      const PL = ['#e4d6ba', '#dacaa8', '#d2c7b0', '#dfcba2', '#cdd0bc'];
      const TL = ['#8a6a58', '#7a5a4a', '#9a7a66', '#6e5a50', '#a0705a', '#5f4f48'];
      const hw = 0.8;
      const add = (cx, cz, face, w, dp, st, plaster, windows) => {
        const h = st * hw;
        const item = { p: [cx, h / 2, cz], r: [0, face, 0], s: [w, h, dp], c: plaster ? PL[Math.floor(r() * PL.length)] : BR[Math.floor(r() * BR.length)] };
        (plaster ? bodyP : bodyB).push(item);
        roofs.push({ p: [cx, h - 0.04, cz], r: [0, face, 0], s: [w + 0.7, 0.55 + r() * 0.5, dp + 0.7], c: TL[Math.floor(r() * TL.length)] });
        if (windows) {
          for (let s = 1; s < st; s += 1) {
            const n = w > 2.8 ? 2 : 1;
            for (let k = 0; k < n; k += 1) {
              const a = n === 1 ? 0 : (k - 0.5) * w * 0.45;
              const [px, pz] = at(face, a, dp / 2 + 0.2); const [fx, fz] = at(face, a, dp / 2 + 0.04);
              win.push({ p: [cx + px, s * hw + hw * 0.45, cz + pz], r: [0, face, 0], s: [0.46, 0.44, 1] });
              wfr.push({ p: [cx + fx, s * hw + hw * 0.45, cz + fz], r: [0, face, 0], s: [0.74, 0.56, 0.32] });
            }
          }
        }
      };
      const rowZ = (x, z0, z1, face, o = {}) => {
        const { s0 = 2, s1 = 4, skip = [], windows = true, pl = 0.15 } = o;
        let z = z0;
        while (z < z1) {
          const w = 2 + r() * 1.5, dp = 2.4 + r() * 1.0;
          if (skip.some(([a, b]) => z + w > a && z < b)) { z += 0.8; continue; }
          add(x + (r() - 0.5) * 0.3, z + w / 2, face, w, dp, s0 + Math.floor(r() * (s1 - s0 + 1)), r() < pl, windows);
          z += w + 0.06;
        }
      };
      const rowX = (z, x0, x1, face, o = {}) => {
        const { s0 = 2, s1 = 4, skip = [], windows = true, pl = 0.15 } = o;
        let x = x0;
        while (x < x1) {
          const w = 2 + r() * 1.5, dp = 2.4 + r() * 1.0;
          if (skip.some(([a, b]) => x + w > a && x < b)) { x += 0.8; continue; }
          add(x + w / 2, z + (r() - 0.5) * 0.3, face, w, dp, s0 + Math.floor(r() * (s1 - s0 + 1)), r() < pl, windows);
          x += w + 0.06;
        }
      };
      const lanesZ = [[-12.5, -9.5], [10.5, 13.5]];
      // behind the palace (west of it in the world, left of the view): tall, dense
      rowZ(-21, -34, 22, PI / 2, { skip: lanesZ, s0: 2, s1: 3 });
      rowZ(-22.6, -36, 30, PI / 2, { skip: lanesZ, s0: 3, s1: 5, windows: false });
      rowZ(-27.4, -38, 36, PI / 2, { s0: 3, s1: 5, windows: false, pl: 0.4 });
      rowZ(-33, -40, 40, PI / 2, { s0: 3, s1: 5, windows: false, pl: 0.5 });
      // beyond the road: one low frontage row only
            rowZ(21, -30, 8, -PI / 2, { s0: 1, s1: 1, windows: false, pl: 0.1 });
      rowZ(26, -34, 40, -PI / 2, { s0: 2, s1: 4, windows: false, pl: 0.4 });
      rowZ(14.6, -26, 8, -PI / 2, { s0: 1, s1: 1, windows: false, pl: 0.2 });
      rowZ(21, 14.5, 30, -PI / 2, { s0: 1, s1: 3, windows: false, pl: 0.3 });
      rowZ(31, -30, 40, -PI / 2, { s0: 2, s1: 4, windows: false, pl: 0.5 });
      // north end (Mangal Bazaar): faces the plaza
      rowX(-25, -10, 13, 0, { s0: 2, s1: 4, skip: [[-3.0, 0.6]] });
      rowX(-30, -17, 20, 0, { s0: 3, s1: 4, windows: false, skip: [[-3.0, 0.6]] });
      rowX(-35.5, -30, 30, 0, { s0: 3, s1: 5, windows: false, pl: 0.4 });
      // south end, nearest the camera: one storey only so nothing hides the temples
      rowX(33, -34, 34, PI, { s0: 1, s1: 2, windows: false, skip: [[-3.0, 0.6]], pl: 0.3 });
      rowX(38.5, -30, 30, PI, { s0: 2, s1: 4, windows: false, pl: 0.3 });
      return { bodyB, bodyP, roofs, win, wfr };
    }, []);
    const trees = useMemo(() => {
      const r = rng(21), a = [], b = [];
      for (let i = 0; i < 90; i += 1) {
        const ang = r() * PI * 2, R = 47 + r() * 8; if (Math.sin(ang) < -0.2 && r() < 0.3) continue;
        const h = 3.5 + r() * 3, x = Math.cos(ang) * R, z = Math.sin(ang) * R;
        a.push({ p: [x, h * 0.62, z], s: [3.2 + r(), h * 0.95, 3.2 + r()], c: r() < 0.5 ? '#5a7a4c' : '#68885a' });
        b.push({ p: [x + 1.0, h * 0.85, z - 0.6], s: [2.4, 2.2, 2.4], c: '#76955f' });
      }
      return { a, b };
    }, []);
    const borders = useMemo(() => { const r = rng(9), out = []; [[-5.4, 0], [8.1, 0]].forEach(([x]) => { let z = -22.2; while (z < 16) { const L = 2.2 + r() * 2.4; out.push({ s: [0.3 + (r() < 0.3 ? 0.15 : 0), 0.07 + (r() < 0.25 ? 0.05 : 0), L - 0.06], p: [x + (r() - 0.5) * 0.12, 0.04, z + L / 2] }); z += L; } }); [[-22.2], [16.2]].forEach(([z]) => { let x = -5.4; while (x < 8) { const L = 2.2 + r() * 2.4; out.push({ s: [L - 0.06, 0.07, 0.3], p: [x + L / 2, 0.04, z + (r() - 0.5) * 0.1] }); x += L; } }); return out; }, []);
    const hipU = memoGeo('hipU', () => hipGeo(1, 1, 1, -0.2, 0.2, 0.6));
    const ppl = useMemo(() => {
      const r = rng(5); const body = [], head = [];
      const CL = ['#c0392b', '#2f6db5', '#e2b33c', '#2e8b57', '#f2efe6', '#7a3b8c', '#d9732a', '#333', '#a33'];
      const SK = ['#d8a882', '#b98560', '#9c6a48'];
      const put = (x, z) => { body.push({ p: [x, 0.19, z], s: [0.13, 0.34, 0.13], c: CL[Math.floor(r() * CL.length)] }); head.push({ p: [x, 0.39, z], s: [0.1, 0.1, 0.1], c: SK[Math.floor(r() * SK.length)] }); };
      for (let i = 0; i < 26; i += 1) put(-4.4 + r() * 7.2, -16 + r() * 28);
      [[-2.9, 0.9], [-2.6, 1.1], [-3.0, 1.3], [-1.0, 3.0], [-0.8, 3.2]].forEach(([x, z]) => put(x, z));
      return { body, head };
    }, []);
    const pigeons = useMemo(() => { const r = rng(3); return Array.from({ length: 40 }, () => ({ p: [-3.3 + r() * 3.2, 0.05, -1.2 + r() * 3.4], r: [0, r() * 6, 0], s: [0.06, 0.05, 0.1], c: r() < 0.3 ? '#e8e6e0' : '#7f858c' })); }, []);
    const hills = useMemo(() => Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * PI * 2 + 0.2; const R = 125 + (i % 3) * 8; return { p: [Math.cos(a) * R, 6, Math.sin(a) * R], s: [120 + (i % 4) * 12, 7 + (i % 3) * 2, 60] }; }), []);
    const brickGround = lift(M.mat('herring', 8, 16, { color: '#ffdcc4' }), '#8a5a40', 0.6);
    return (
      <group>
        {/* ground */}
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={M.plain('#86a06a', { roughness: 1 })}><circleGeometry args={[150, 48]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow material={M.plain('#a39579', { roughness: 1 })}><circleGeometry args={[52, 48]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[1.3, -0.005, -3]} receiveShadow material={M.plain('#a8a090', { roughness: 0.95 })}><planeGeometry args={[14.2, 39]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[1.3, 0.003, -3]} receiveShadow material={brickGround}><planeGeometry args={[13.5, 38.3]} /></mesh>
        {borders.map((b, i) => <Box key={i} s={b.s} p={b.p} m={i % 3 ? stoneM(M) : stoneDM(M)} cast={false} />)}
        {[[-2.6, 17.2], [4.2, 17.0], [-1.0, -23.2]].map(([x, z], i) => <Box key={`st${i}`} s={[1.8, 0.1, 0.5]} p={[x, 0.05, z]} m={stoneM(M)} cast={false} />)}
        <Sky />
        {[[-45,34,-60,9],[20,40,-70,12],[-10,30,-65,7],[-70,38,-20,10],[45,36,-55,8]].map(([x,y,z,r],i)=>(<group key={`cl${i}`} position={[x,y,z]}><Ball rad={r} sc={[1.6,0.45,1]} m={M.plain('#ffffff',{roughness:1})} /><Ball rad={r*0.7} sc={[1.4,0.5,1]} p={[r*0.9,-r*0.05,r*0.2]} m={M.plain('#f4f7fb',{roughness:1})} /></group>))}
        <mesh rotation={[-PI / 2, 0, 0]} position={[1.3, 0.002, 19.4]} receiveShadow material={brickGround}><planeGeometry args={[13.5, 6.4]} /></mesh>
        <mesh rotation={[-PI / 2, 0, 0]} position={[0, 0.004, 28.2]} receiveShadow material={M.plain('#3e3e41', { roughness: 0.95 })}><planeGeometry args={[80, 2.4]} /></mesh>
        {Array.from({ length: 14 }, (_, k) => <Box key={`rd${k}`} s={[1.4, 0.01, 0.1]} p={[-30 + k * 4.6, 0.012, 28.2]} m={M.plain('#d8d4c4')} cast={false} />)}
        {[[-3.5, 20.5], [5.5, 19.5], [2.5, 24.2]].map(([x, z], k) => (
          <group key={`sh${k}`} position={[x, 0, z]}><Box s={[0.9, 0.5, 0.9]} p={[0, 0.25, 0]} m={stoneDM(M)} /><Ball rad={0.55} p={[0, 0.85, 0]} sc={[1, 0.8, 1]} m={M.plain('#5f7d4a', { roughness: 1 })} /></group>
        ))}
        {/* road behind the temples */}
        <mesh rotation={[-PI / 2, 0, 0]} position={[10.2, 0.005, -4.5]} receiveShadow material={M.plain('#3e3e41', { roughness: 0.95 })}><planeGeometry args={[2, 40]} /></mesh>
        {Array.from({ length: 12 }, (_, k) => <Box key={`d${k}`} s={[0.1, 0.01, 1.4]} p={[10.2, 0.012, -22 + k * 3.4]} m={M.plain('#d8d4c4')} cast={false} />)}
        {[[10.6, 6], [9.8, -9], [10.7, -18]].map(([x, z], k) => <group key={`mb${k}`} position={[x, 0, z]}><Box s={[0.2, 0.22, 0.75]} p={[0, 0.2, 0]} m={M.plain(['#3a5aa0', '#a03a3a', '#2f2f33'][k])} /><Box s={[0.12, 0.34, 0.12]} p={[0, 0.5, -0.1]} m={M.plain('#d8a882')} /></group>)}
        <Box s={[0.2, 0.1, 40]} p={[9.1, 0.05, -4.5]} m={stoneM(M)} cast={false} />
        <Box s={[0.2, 0.1, 40]} p={[11.3, 0.05, -4.5]} m={stoneM(M)} cast={false} />
        {/* houses */}
        <Inst geo={G.box} m={M.plain('#ffffff', { roughness: 0.95 })} items={houses.bodyB} shadow />
        <Inst geo={G.box} m={M.plain('#ffffff', { roughness: 0.9 })} items={houses.bodyP} shadow />
        <Inst geo={hipU} m={M.plain('#ffffff', { roughness: 0.95 })} items={houses.roofs} shadow />
        <Windows win={houses.win} fr={houses.wfr} />
        {/* people and pigeons */}
        <Inst geo={G.cap} m={M.plain('#ffffff')} items={ppl.body} />
        <Inst geo={G.ball} m={M.plain('#ffffff')} items={ppl.head} />
        <Inst geo={G.ball} m={M.plain('#ffffff')} items={pigeons} />
        {/* Degu Taleju behind the palace: 3 roofs, dark brick, gilded top roof, torana and pinnacle */}
        <group position={[-13.5, 0, -11.5]} rotation={[0, PI / 2, 0]} scale={1.15}><Pagoda roofs={3} w={2.5} plinth={3} wallH={1.9} upH={1.3} ov0={0.74} big={1.4} topGold torana /></group>
        {/* Manga Hiti: sunken stone water tank at the south-west corner */}
        <group position={[-9.6, 0, 20]}>
          <Box s={[4.6, 0.12, 4.6]} p={[0, 0.06, 0]} m={stoneM(M)} />
          <Box s={[3.4, 0.05, 3.4]} p={[0, 0.13, 0]} m={M.plain('#4a5f55', { roughness: 0.4 })} cast={false} />
          {[0, 1, 2].map((k) => <Box key={k} s={[1.6, 0.05, 0.3]} p={[0, 0.14 + k * 0.02, 1.9 - k * 0.2]} m={stoneDM(M)} cast={false} />)}
          <Box s={[0.5, 0.5, 0.5]} p={[-2.1, 0.3, -2.1]} m={stoneDM(M)} />
        </group>
        {/* hazy tree line at the far ends */}
        <Inst geo={G.ball} m={M.plain('#ffffff', { roughness: 1 })} items={trees.a} />
        <Inst geo={G.ball} m={M.plain('#ffffff', { roughness: 1 })} items={trees.b} />
        {/* benches, lamps, trees */}
        {[[1.0, 6.9], [1.0, -2.6]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Box s={[0.3, 0.05, 1.1]} p={[0, 0.2, 0]} m={timberM(M)} />
            <Box s={[0.06, 0.18, 1.0]} p={[0.15, 0.32, 0]} r={[0, 0, 0.2]} m={timberM(M)} />
            <Box s={[0.28, 0.2, 0.05]} p={[0, 0.1, 0.45]} m={stoneDM(M)} />
            <Box s={[0.28, 0.2, 0.05]} p={[0, 0.1, -0.45]} m={stoneDM(M)} />
          </group>
        ))}
        {[[8.2, -12], [8.2, -1], [8.2, 12]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.03} rb={0.04} h={1.6} p={[0, 0.8, 0]} m={M.plain('#55585c', { metalness: 0.5 })} seg={8} />
            <Ball rad={0.1} p={[0, 1.66, 0]} m={lampM(M)} />
          </group>
        ))}
        <pointLight position={[7.5, 1.9, -1]} intensity={4} distance={9} color="#ffb060" />
        <pointLight position={[-3, 1.2, 0]} intensity={3} distance={9} color="#ffb060" />
        {[[-26, -12, 1.8], [-34, 10, 2.2], [-8, -33, 2], [-38, -2, 2.5], [-30, 22, 2.4], [17, 36, 1.8], [-16, 37, 2], [24, 8, 1.7], [22, -18, 1.9], [-20, 28, 1.6]].map(([x, z, s], i) => <Tree key={i} p={[x, 0, z]} s={s} />)}
        {/* diyas */}
        {[[1.2, 8.4], [1.2, 0.6], [1.2, -10.4], [1.2, -16]].map(([x, z], i) => <Ball key={i} rad={0.045} sc={[1, 0.6, 1]} p={[x, 0.05, z]} m={lampM(M)} />)}
        {/* faint low foothills */}
        {hills.map((h, i) => <mesh key={i} position={h.p} scale={h.s} material={M.plain(i % 2 ? '#94acc6' : '#a2b8d0', { roughness: 1 })}><coneGeometry args={[0.5, 1, 7]} /></mesh>)}
      </group>
    );
  }

  const PatanEnv = () => <Plan><PatanEnvInner /></Plan>;
  return { 'patan-durbar-square': { Main: PatanMain, Env: PatanEnv } };
}
