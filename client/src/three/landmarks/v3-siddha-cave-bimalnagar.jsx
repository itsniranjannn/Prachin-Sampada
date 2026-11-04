/* Siddha Cave (Siddha Gufa), Bimalnagar, Bandipur trail, Gandaki. 1 unit = 1 m. Entrance faces +z.
   A natural limestone karst cave, NOT a built monument: a mossy dark grey-brown rock outcrop on a steep forested hillside with a low,
   wide, near-black mouth under an overhanging lip. A steep railed concrete staircase (rise 0.2, run 0.3) climbs the slope to a paved lip;
   a blue-pillared gate canopy stands on the stairs, a blue mesh booth beside them, a bamboo/pipe fence with a Devanagari board and the
   maroon "SIDDHA CAVE L=437m H=45m" sign at the top, a small stone bell niche right of the mouth. Inside: brown and cream banded rock,
   cream/amber stalactites and a flowstone column, a red-cloth Shiva shrine, bats, visitors with headlamps. Below the hill: the
   Marsyangdi valley with terraced fields, a river and layered misty hills. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo, useRef, useEffect, useState } = K;

  /* ---------- maths ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const l = (a, b, t) => a + (b - a) * t;
    const h = (i, j, k) => hash(xi + i, yi + j, zi + k);
    return l(l(l(h(0, 0, 0), h(1, 0, 0), u), l(h(0, 1, 0), h(1, 1, 0), u), v), l(l(h(0, 0, 1), h(1, 0, 1), u), l(h(0, 1, 1), h(1, 1, 1), u), v), w);
  };
  const fbm = (x, y, z) => 0.55 * vnoise(x, y, z) + 0.3 * vnoise(x * 2.1, y * 2.1, z * 2.1) + 0.15 * vnoise(x * 4.3, y * 4.3, z * 4.3);
  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const cl = (hex) => new THREE.Color(hex);
  const mixc = (a, b, t, out) => out.copy(a).lerp(b, clamp(t, 0, 1));

  /* ---------- the hillside: one height function shared by Main and Env ---------- */
  function baseY(z) {
    if (z <= 30) { if (z < -60) return 41.75 + (-z - 60) * 0.15; return -0.667 * (z - 2.6); }
    const d = z - 30;
    let y = -18.27 - 0.667 * d - (0.333 / 90) * d * d;
    if (d > 45) y = -55.8;
    return y + 0.22 * Math.max(0, z - 100);
  }
  function T(x, z) {
    let y = baseY(z);
    const ax = Math.abs(x);
    y -= 0.28 * clamp(z - 2.6, 0, 34) * sm(3, 12, ax);
    y -= 0.55 * Math.max(0, ax - 22) * (0.4 + 0.6 * sm(-60, 0, z));
    if (ax > 110) y += Math.min(45, 0.45 * (ax - 110));
    const d = Math.hypot(x, z);
    y += sm(120, 210, d) * (14 + 16 * fbm(x * 0.02 + 3, z * 0.02, 1));
    y += (fbm(x * 0.06, z * 0.06, 5) - 0.5) * 3.2 * sm(12, 34, Math.hypot(x * 0.7, z));
    const w = sm(8, 5, ax) * sm(4, 2.6, z) * sm(-3.5, -1, z);
    y *= 1 - w;
    y -= 14 * sm(7.5, 5.2, ax) * sm(-0.4, -1.4, z) * (1 - sm(-9.5, -12.5, z));
    y -= 0.3 * sm(3.4, 2.4, Math.abs(x + 0.8)) * sm(2.4, 3.2, z);
    return y;
  }

  /* ---------- the rock outcrop with the cave mouth (one heightfield-style mesh) ---------- */
  const FH = 8.2;
  const MA = 4.0, MB = 2.6;                       // mouth half-width and height (super-ellipse): low, wide
  const zf = (y) => 0.4 - 0.13 * Math.max(0, y) + 1.8 * Math.exp(-(((y - 4.1) / 0.8) ** 2)) + 0.7 * Math.exp(-(((y - 6.4) / 0.45) ** 2)) + 0.5 * Math.exp(-(((y - 1.9) / 0.35) ** 2)) + (y < 0 ? -y * 1.2 : 0);
  const crestD = (x) => 1.5 * Math.sin(0.5 * x + 1) + 0.9 * Math.sin(1.1 * x + 2) + 0.45 * Math.sin(2.3 * x) + 0.25 * Math.sin(4.1 * x + 1) - 0.06 * x;
  const topY = (z) => FH + 0.12 * (-z - 1.2);
  const mouthR = (x, y) => Math.pow(Math.pow(Math.abs(x) / MA, 2.6) + Math.pow(Math.max(0, y) / MB, 2.6), 1 / 2.6);
  const faceNoise = (x, y) => ((fbm(x * 0.3, y * 0.35, 3) - 0.5) * 1.5 + (fbm(x * 0.9, y * 1.0, 8) - 0.5) * 0.5);
  const faceZ = (x, y) => zf(y) + faceNoise(x, y);   // approximate outer surface of the cliff

  function buildRock() {
    const rows = [];
    for (let y = -1.0; y <= FH + 0.001; y += 0.12) rows.push({ z: zf(y), y, face: true });
    for (let z = -1.6; z >= -26; z -= 0.9) rows.push({ z, y: topY(z), face: false });
    const NX = 110, X0 = -17, DX = 0.31;
    const nR = rows.length;
    const pos = [], col = [], idx = [];
    const C = {
      rock1: cl('#3b362f'), rock2: cl('#5c5448'), strata: cl('#8d8473'), stain: cl('#6b5436'), mossD: cl('#2c501b'), mossL: cl('#559024'),
      brown: cl('#8a6a45'), cream: cl('#d8c7a3'), black: cl('#2b2420'), forest: cl('#34522a'), soil: cl('#4f4430'), under: cl('#2b2926'),
    };
    const c = new THREE.Color(), c2 = new THREE.Color();
    for (let j = 0; j < nR; j++) {
      const r = rows[j], rp = rows[Math.max(0, j - 1)], rn = rows[Math.min(nR - 1, j + 1)];
      let dz = rn.z - rp.z, dy = rn.y - rp.y; const L = Math.hypot(dz, dy) || 1; dz /= L; dy /= L;
      const nz = dy, ny = -dz;
      for (let i = 0; i <= NX; i++) {
        const x = X0 + i * DX;
        let y = r.y, z = r.z;
        const sx = x * 1.0;
        const amp = r.face ? 1.45 : 0.9;
        const nn = ((fbm(sx * 0.3, y * 0.35, z * 0.3 + 3) - 0.5) * 1.5 + (fbm(sx * 0.9, y * 1.0, z * 0.9 + 8) - 0.5) * 0.5 + (fbm(sx * 1.3, y * 0.12, 4) - 0.5) * 0.9) * amp;
        z += nn * nz; y += nn * ny;
        y += crestD(x) * sm(2.5, FH, r.y);
        let tun = 0;
        if (r.face && r.y >= 0 && r.y <= MB * 1.3) {
          const mr = mouthR(x, r.y) * (1 + 0.07 * (fbm(x * 0.8, r.y * 0.8, 11) - 0.5));
          tun = sm(1.0, 0.86, mr);
          if (tun > 0) z = z - tun * (6.6 + 1.2 * fbm(x * 0.5, r.y * 0.5, 2)) + 0.4 * (1 - tun) * 0;
        }
        const ty = T(x, z);
        const tt = sm(15.8 + 1.5 * (fbm(x * 0.2, 1, 1) - 0.5), 7.6, Math.abs(x));
        y = ty + (y - ty) * tt;
        pos.push(x, y, z);
        // colour
        const n1 = fbm(x * 0.3, y * 0.4, z * 0.3 + 2), n2 = fbm(x * 0.9, y * 1.1, z * 0.9 + 7);
        if (r.face) {
          mixc(C.rock1, C.rock2, n2, c);
          const s = Math.sin(r.y * 2.1 + n1 * 5);
          if (s > 0.55) mixc(c, C.strata, 0.55, c);
          if (n1 > 0.6) mixc(c, C.stain, 0.4, c);
          let mm = 0.28 + (n1 - 0.5) * 1.5 + (x > 2.5 ? 0.18 : 0) + (x > 5 ? 0.14 : 0) + (r.y > 4.5 ? 0.14 : 0) + (r.y > 6.2 ? 0.3 : 0) + (x > 3 ? 0.2 : 0) + (r.y < 0.8 ? 0.2 : 0) + Math.sin(x * 0.9 + n2 * 6) * 0.1;
          if (r.y > 2.9 && r.y < 4.9 && Math.abs(x) < 6) mm -= 0.3;     // dark wet underside of the lip
          mixc(C.mossD, C.mossL, n2 * 1.3, c2);
          mixc(c, c2, sm(0.32, 0.62, mm), c);
          if (r.y > 6.4) c.multiplyScalar(0.72);
          if (r.y > 3.0 && r.y < 4.0 && Math.abs(x) < 5.5) mixc(c, C.under, 0.45, c);
          if (tun > 0) {
            const band = 0.5 + 0.5 * Math.sin(r.y * 4.0 + n1 * 6);
            mixc(C.brown, C.cream, band * 0.8, c2);
            mixc(C.black, c2.multiplyScalar(0.3), sm(0.0, 0.9, tun), c);
          } else if (mouthR(x, r.y) < 1.12 && r.y >= 0) {
            mixc(c, C.black, 0.7, c);
          }
        } else {
          mixc(C.forest, C.soil, n1 * 0.9, c);
          mixc(c, C.mossD, 0.3, c);
        }
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < nR - 1; j++) {
      for (let i = 0; i < NX; i++) {
        const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1;
        idx.push(a, b, d, b, e, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /* ---------- helpers ---------- */
  const GT = -1.0;                                // gate canopy height
  const SX = -0.8, SW = 2.8;                     // stair axis x and width
  const sy = (i) => -0.2 * i;                    // tread top height of step i
  const sz = (i) => 2.6 + 0.3 * i - 0.15;       // tread centre z of step i

  function stairGeo(i0, i1) {
    const pts = [];
    for (let i = i0; i <= i1; i++) { pts.push([2.6 + 0.3 * (i - 1), -0.2 * i]); pts.push([2.6 + 0.3 * i, -0.2 * i]); }
    const bot = [];
    for (let i = i1; i >= i0; i--) { bot.push([2.6 + 0.3 * i, -0.2 * i - 1.4]); bot.push([2.6 + 0.3 * (i - 1), -0.2 * i - 1.4]); }
    const sh = new THREE.Shape();
    const all = [...pts, ...bot];
    sh.moveTo(all[0][0], all[0][1]);
    for (let k = 1; k < all.length; k++) sh.lineTo(all[k][0], all[k][1]);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: SW, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(SX + SW / 2, 0, 0);
    return g;
  }

  function Pipe({ a, b, r = 0.035, m }) {
    const { pos, len, q } = useMemo(() => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = B.clone().sub(A); const len = d.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), len, q };
    }, [a.join(), b.join()]); // eslint-disable-line react-hooks/exhaustive-deps
    return <mesh position={pos} quaternion={q} material={m} castShadow><cylinderGeometry args={[r, r, len, 6]} /></mesh>;
  }

  function Inst({ geo, mat, items, cast = false }) {
    const ref = useRef();
    useEffect(() => {
      const m = ref.current; if (!m) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]); o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        if (Array.isArray(it.s)) o.scale.set(it.s[0], it.s[1], it.s[2]); else o.scale.setScalar(it.s);
        o.updateMatrix(); m.setMatrixAt(i, o.matrix);
        if (it.c) { c.set(it.c); m.setColorAt(i, c); }
      });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} castShadow={cast} receiveShadow />;
  }

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  function useCanvasTex(draw, w, h) {
    return useMemo(() => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      draw(cv.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  }

  function Person({ p, c = '#3b4a6b', pants = '#2a2a35', lamp = false, s = 1, r = 0, skin = '#c58f6a' }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Cyl rt={0.09} rb={0.08} h={0.85} p={[0, 0.43, 0]} m={M.plain(pants, { roughness: 0.9 })} seg={6} />
        <Cyl rt={0.17} rb={0.15} h={0.62} p={[0, 1.15, 0]} m={M.plain(c, { roughness: 0.9 })} seg={8} />
        <Ball rad={0.115} p={[0, 1.6, 0]} m={M.plain(skin, { roughness: 0.8 })} />
        {lamp && <mesh position={[0, 1.66, 0.11]}><sphereGeometry args={[0.045, 8, 6]} /><meshBasicMaterial color="#fff2c0" /></mesh>}
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function SiddhaMain() {
    const M = useM();
    const [dusk, dref] = useDusk();
    const rockGeo = useMemo(() => buildRock(), []);
    const stairs = useMemo(() => stairGeo(1, 26), []);
    const concrete = M.plain('#8e8b80', { roughness: 0.95 });
    const concreteD = M.plain('#7c7a70', { roughness: 0.95 });
    const blue = M.plain('#2f78c8', { roughness: 0.55, metalness: 0.15 });
    const blueD = M.plain('#245f9e', { roughness: 0.6 });
    const silver = M.plain('#b9bec3', { roughness: 0.4, metalness: 0.7 });
    const bamboo = M.plain('#bdb496', { roughness: 0.85 });
    const green = M.plain('#4c7a2a', { roughness: 1 });
    const greenL = M.plain('#5a8a30', { roughness: 1 });
    const greenD = M.plain('#2f5a24', { roughness: 1 });
    const cream = M.plain('#e6d8b4', { roughness: 0.6 });
    const amber = M.plain('#b88445', { roughness: 0.6 });
    const brown = M.plain('#7a5c3c', { roughness: 0.9 });
    const stoneM = M.plain('#8a8578', { roughness: 0.95 });
    const stoneL = M.plain('#d2ccba', { roughness: 0.9 });
    const rockD = M.plain('#3d3730', { roughness: 1 });
    const mesh = M.plain('#d5dde4', { roughness: 0.5, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });

    const signTex = useCanvasTex((g, w, h) => {
      g.fillStyle = '#8a2c2a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d9c7bd'; g.textAlign = 'center';
      g.font = 'bold 78px Arial, sans-serif'; g.fillText('SIDDHA CAVE', w / 2, 108);
      g.font = 'bold 84px Arial, sans-serif'; g.fillText('L=437m  H=45m', w / 2, 200);
      g.font = '28px Arial, sans-serif'; g.fillText('www.ncttm.edu.np', w / 2, 246);
    }, 512, 280);
    const boardTex = useCanvasTex((g, w, h) => {
      g.fillStyle = '#e4e0d2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2d7aa0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold 84px "Nirmala UI", "Mangal", "Noto Sans Devanagari", Arial, sans-serif'; g.fillText('गुफा प्रवेश', w / 2, h / 2 + 4);
    }, 512, 128);

    /* stair rails */
    const railPts = (x, h) => [[x, sy(1) + h, sz(1) - 0.2], [x, sy(26) + h, sz(26) + 0.1]];
    const posts = [];
    for (let i = 2; i <= 26; i += 4) posts.push(i);

    /* vines hanging over the lip */
    const vines = useMemo(() => {
      const r = mkRng(5); const out = [];
      for (let k = 0; k < 16; k++) {
        const x = -5.5 + k * 0.85 + (r() - 0.5) * 0.5;
        if (x > -4.6 && x < 4.4 && k % 2) continue;
        const y = 4.3 - r() * 0.3; const len = 0.5 + r() * 1.6;
        out.push({ x, y, len, z: faceZ(x, y) + 0.12, w: 0.05 + r() * 0.05, tone: r() });
      }
      return out;
    }, []);
    const leaves = useMemo(() => {
      const r = mkRng(9); const out = [];
      for (let k = 0; k < 14; k++) {
        const x = 5.5 + r() * 5.4, y = 0.3 + r() * 5.2;
        out.push({ x, y, z: faceZ(x, y) + 0.2, s: 0.2 + r() * 0.2, ry: r() * 6, rz: (r() - 0.5) * 1.2, tone: r() });
      }
      for (let k = 0; k < 6; k++) {
        const x = -6.2 - r() * 4.5, y = 0.3 + r() * 3.4;
        out.push({ x, y, z: faceZ(x, y) + 0.2, s: 0.2 + r() * 0.2, ry: r() * 6, rz: (r() - 0.5) * 1.2, tone: r() });
      }
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2, rr = 0.9 + r() * 0.5;
        const x = 6.0 + Math.cos(a) * rr * 1.1, y = 1.55 + Math.sin(a) * rr * 0.9;
        out.push({ x, y, z: faceZ(x, y) + 0.65, s: 0.2 + r() * 0.2, ry: a, rz: a, tone: 0.6 + r() * 0.4 });
      }
      return out;
    }, []);
    const boulders = useMemo(() => {
      const r = mkRng(21); const out = [];
      [[-8.6, 1.6], [9.4, 2.2], [-11.6, 3.2]].forEach(([x, z], k) => {
        const y = T(x, z);
        out.push({ x, y: y + 0.2, z, s: 0.5 + r() * 0.3, tone: k % 2 });
      });
      return out;
    }, []);

    const mounds = useMemo(() => {
      const r = mkRng(23); const out = [];
      [[-7.4, 3.6], [7.6, 3.0], [-9.6, 4.4], [10.4, 4.2], [-6.2, 6.8], [6.6, 6.4], [9.2, 8.6], [-9.0, 9.6]].forEach(([x, z]) => {
        out.push({ x, z, y: T(x, z) + 0.1, s: 0.8 + r() * 0.8 });
      });
      return out;
    }, []);
    const rblocks = useMemo(() => {
      const r = mkRng(61); const out = []; const cs = ['#5a5348', '#6b6355', '#463f35', '#7a7160'];
      for (let k = 0; k < 11; k++) {
        const x = -12 + k * 2.3 + (r() - 0.5);
        const ty = T(x, -2.5), top = FH + crestD(x) - 0.3;
        const tt = sm(15.8, 7.6, Math.abs(x));
        const y = ty + (top - ty) * tt + 0.1;
        out.push({ p: [x, y, -1.4 - r() * 3], s: [0.7 + r() * 0.8, 0.5 + r() * 0.6, 0.6 + r() * 0.7], r: [r() * 3, r() * 3, r() * 3], c: cs[k % 4] });
      }
      [[-10.5, -0.6], [-12.4, 0.2], [11.0, -0.4], [12.6, 0.4]].forEach(([x, z], k) => {
        out.push({ p: [x, T(x, z) + 0.2, z], s: [0.9 + r() * 0.6, 0.7 + r() * 0.5, 0.8 + r() * 0.5], r: [r() * 3, r() * 3, r() * 3], c: cs[k % 4] });
      });
      return out;
    }, []);
    const rwall = useMemo(() => {
      const r = mkRng(71); const out = [];
      for (let i = 3; i <= 27; i += 2) {
        const x = 1.2 + r() * 0.5, z = sz(i) + 0.4, g = r() > 0.45;
        out.push({ p: [x, sy(i) + 0.5 + r() * 0.5, z], s: [0.5 + r() * 0.4, 0.55 + r() * 0.5, 0.6 + r() * 0.3], r: [r() * 3, r() * 3, r() * 3], c: g ? '#3f5a2c' : '#5a5348' });
      }
      return out;
    }, []);
    const overh = useMemo(() => {
      const r = mkRng(83); const out = []; const cs = ['#3a342c', '#4a4338', '#2f2a24', '#52493c', '#3f4a2a'];
      for (let k = 0; k < 8; k++) {
        const x = -6.5 + k * 1.75 + (r() - 0.5) * 0.6, y = 4.5 + r() * 1.9;
        out.push({ p: [x, y, faceZ(x, y) + 0.3 + r() * 0.3], s: [0.8 + r() * 0.7, 0.45 + r() * 0.4, 0.9 + r() * 0.6], r: [r() * 1.2, r() * 3, r() * 1.2], c: cs[k % 5] });
      }
      return out;
    }, []);
    const gableGeo = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-0.95, 0); sh.lineTo(0.95, 0); sh.lineTo(0, 0.75); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 3.7, bevelEnabled: false });
      g.translate(0, 0, -1.85); g.rotateY(Math.PI / 2); return g;
    }, []);
    const gableGeo2 = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-0.9, 0); sh.lineTo(0.9, 0); sh.lineTo(0, 0.5); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 1.7, bevelEnabled: false });
      g.translate(0, 0, -0.85); g.rotateY(Math.PI / 2); return g;
    }, []);

    /* interior */
    const ceilY = (x) => MB * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / MA, 2.6)), 1 / 2.6);
    const drips = useMemo(() => {
      const r = mkRng(33); const out = [];
      for (let k = 0; k < 24; k++) {
        const x = -3.0 + r() * 6.0, z = -3.0 - r() * 5.0;
        const cy = ceilY(x) - 0.05;
        if (cy < 0.6) continue;
        const len = 0.3 + r() * 1.0;
        out.push({ x, z, y: cy - len / 2, len, rad: 0.07 + r() * 0.1, amber: r() > 0.55 });
      }
      return out;
    }, []);
    const bats = useMemo(() => {
      const r = mkRng(44); const out = [];
      for (let k = 0; k < 10; k++) {
        const x = -2.6 + r() * 5.2, z = -4 - r() * 4.5;
        out.push({ x, z, y: ceilY(x) - 0.14 });
      }
      return out;
    }, []);

    const people = [
      { i: 5, x: -1.4, c: '#9a3030' }, { i: 8, x: 0.1, c: '#2f4f7f' }, { i: 12, x: -1.8, c: '#e8e4da' }, { i: 14, x: -0.4, c: '#3b6b4a' },
      { i: 16, x: 0.3, c: '#d6a03a' }, { i: 19, x: -1.5, c: '#2d2d3a' }, { i: 22, x: 0.2, c: '#8a3a6a' }, { i: 24, x: -1.7, c: '#4a5a7a' },
      { i: 3, x: -0.6, c: '#c0392b' }, { i: 4, x: 0.2, c: '#27496d', s: 0.95 }, { i: 6, x: -1.1, c: '#e0dcd0', s: 1.05 }, { i: 7, x: -0.2, c: '#2d2d3a', s: 0.92 },
      { i: 9, x: -1.6, c: '#3b6b4a' }, { i: 10, x: 0.3, c: '#b8742a', s: 1.04 }, { i: 11, x: -0.7, c: '#5a3a7a', s: 0.9 }, { i: 13, x: 0.0, c: '#d94a3a' }, { i: 14, x: -1.5, c: '#1f3a5f', s: 1.06 },
    ];

    return (
      <group ref={dref}>
        <Frame s={[19, 10, 12]} p={[0, 2.8, 3.4]} />
        {/* rock outcrop with the cave mouth */}
        <mesh geometry={rockGeo} castShadow receiveShadow><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>
        {boulders.map((b, k) => (
          <mesh key={k} position={[b.x, b.y, b.z]} scale={[b.s * 1.2, b.s * 0.8, b.s]} rotation={[0, k, 0]} castShadow receiveShadow>
            <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={b.tone ? '#6a6458' : '#575046'} flatShading roughness={1} />
          </mesh>
        ))}

        {[].map((b, k) => (
          <mesh key={'mo' + k} position={[b.x, b.y, b.z]} scale={[b.s * 1.5, b.s * 0.6, b.s * 1.2]} rotation={[0, k, 0]} material={k % 2 ? green : greenD} castShadow receiveShadow>
            <sphereGeometry args={[1, 9, 6]} />
          </mesh>
        ))}
        {rblocks.map((b, k) => (
          <mesh key={'rb' + k} position={b.p} scale={b.s} rotation={b.r} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={b.c} flatShading roughness={1} />
          </mesh>
        ))}
        {/* paved lip platform across the mouth, with a lower step */}
        <Box s={[11.2, 2.6, 2.6]} p={[0, -1.28, 1.3]} m={concreteD} />
        <Box s={[10.6, 0.12, 2.2]} p={[0, 0.0, 1.5]} m={concrete} />
        <Box s={[8.6, 0.1, 1.2]} p={[0, 0.03, -0.8]} m={concrete} />
        <Box s={[10.6, 0.12, 0.45]} p={[0, -0.1, 2.75]} m={concrete} />
        {/* paved path inside the first stretch */}
        <Box s={[3.0, 0.06, 5.2]} p={[0.4, 0.04, -3.2]} m={M.plain("#3a3630", { roughness: 1 })} />

        {/* concrete stairs */}
        <mesh geometry={stairs} material={concrete} castShadow receiveShadow />
        {/* pipe railings, left and right of the flight */}
        {[[-2.3], [0.7]].map(([x], k) => (
          <group key={k}>
            <Pipe a={railPts(x, 1.0)[0]} b={railPts(x, 1.0)[1]} m={silver} />
            <Pipe a={railPts(x, 0.5)[0]} b={railPts(x, 0.5)[1]} m={silver} />
            {posts.map((i) => <Box key={i} s={[0.07, 1.05, 0.07]} p={[x, sy(i) + 0.52, sz(i)]} m={silver} cast={false} />)}
          </group>
        ))}

        {/* bamboo / pipe fence across the lip with the entrance gap over the stairs */}
        {[[-5.2, -2.4], [0.8, 5.2]].map(([a, b], k) => (
          <group key={k}>
            <Pipe a={[a, 1.05, 2.45]} b={[b, 1.05, 2.45]} r={0.04} m={bamboo} />
            <Pipe a={[a, 0.6, 2.45]} b={[b, 0.6, 2.45]} r={0.04} m={bamboo} />
            {Array.from({ length: Math.round((b - a) / 1.0) + 1 }, (_, n) => <Box key={n} s={[0.09, 1.2, 0.09]} p={[a + n * ((b - a) / Math.round((b - a) / 1.0)), 0.6, 2.45]} m={bamboo} cast={false} />)}
          </group>
        ))}
        {/* entrance posts and the Devanagari board */}
        <Box s={[0.12, 1.7, 0.12]} p={[-2.4, 0.85, 2.45]} m={bamboo} />
        <Box s={[0.12, 1.7, 0.12]} p={[0.8, 0.85, 2.45]} m={bamboo} />
        <mesh position={[-3.9, 1.5, 2.5]}><planeGeometry args={[2.7, 0.7]} /><meshStandardMaterial map={boardTex} roughness={0.8} /></mesh>
        {/* maroon sign */}
        <group position={[3.0, 1.0, 2.52]} scale={1.3}>
          <mesh><planeGeometry args={[2.0, 1.1]} /><meshStandardMaterial map={signTex} roughness={0.8} /></mesh>
          <mesh position={[0, 0, -0.01]}><planeGeometry args={[2.04, 1.14]} /><meshStandardMaterial color="#5a1a1a" /></mesh>
          <Pipe a={[-0.9, 0.55, 0]} b={[-0.9, 1.0, 0]} r={0.012} m={silver} />
          <Pipe a={[0.9, 0.55, 0]} b={[0.9, 1.0, 0]} r={0.012} m={silver} />
        </group>

        {/* blue-pillared gate canopy on the stairs */}
        {[[-2.4, 9.0], [0.8, 9.0], [-2.4, 7.6], [0.8, 7.6]].map(([x, z], k) => {
          const i = Math.ceil((z - 2.6) / 0.3); const base = sy(i); const top = GT;
          return <Box key={k} s={[0.26, top - base, 0.26]} p={[x, (top + base) / 2, z]} m={blue} />;
        })}
        <Box s={[3.4, 0.22, 0.2]} p={[-0.8, GT - 0.1, 9.0]} m={blueD} />
        <Box s={[3.4, 0.22, 0.2]} p={[-0.8, GT - 0.1, 7.6]} m={blueD} />
        <Box s={[0.2, 0.22, 1.6]} p={[-2.4, GT - 0.1, 8.3]} m={blueD} />
        <Box s={[0.2, 0.22, 1.6]} p={[0.8, GT - 0.1, 8.3]} m={blueD} />
        <mesh position={[-0.8, GT + 0.02, 8.3]} geometry={gableGeo} castShadow><meshStandardMaterial color="#4a9be6" roughness={0.5} flatShading /></mesh>
        <Box s={[3.7, 0.06, 0.1]} p={[-0.8, GT + 0.77, 8.3]} m={blueD} cast={false} />
        {[-2.4, 0.8].map((x) => (
          <group key={x}>
            <Box s={[0.07, 0.07, 1.5]} p={[x, GT - 0.7, 8.3]} m={blue} cast={false} />
            <Box s={[0.07, 0.07, 1.5]} p={[x, GT - 1.3, 8.3]} m={blue} cast={false} />
            <Box s={[0.06, 0.6, 1.5]} p={[x, GT - 1.0, 8.3]} m={blueD} cast={false} />
          </group>
        ))}
        <Box s={[3.5, 0.08, 0.1]} p={[-0.8, GT + 0.03, 9.45]} m={M.plain('#f2f2ee')} cast={false} />
        {/* gate leaf: a low railing barrier */}

        {/* blue mesh booth beside the steps, on a concrete pad */}
        <Box s={[2.3, 2.0, 2.3]} p={[-4.75, -5.5, 8.8]} m={concreteD} />
        <group position={[-4.75, -4.5, 8.8]}>
          {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z], k) => <Box key={k} s={[0.1, 2.1, 0.1]} p={[x, 1.05, z]} m={blue} />)}
          <Box s={[1.2, 0.8, 0.06]} p={[0, 0.4, 0.55]} m={blue} />
          <Box s={[1.2, 0.8, 0.06]} p={[0, 0.4, -0.55]} m={blue} />
          <Box s={[0.06, 0.8, 1.2]} p={[-0.55, 0.4, 0]} m={blue} />
          <Box s={[0.06, 0.8, 1.2]} p={[0.55, 0.4, 0]} m={blue} />
          <mesh position={[0, 1.5, 0.55]} material={mesh}><planeGeometry args={[1.1, 1.1]} /></mesh>
          <mesh position={[0, 1.5, -0.55]} material={mesh}><planeGeometry args={[1.1, 1.1]} /></mesh>
          <mesh position={[0.55, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} material={mesh}><planeGeometry args={[1.1, 1.1]} /></mesh>
          <mesh position={[-0.55, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} material={mesh}><planeGeometry args={[1.1, 1.1]} /></mesh>
          <mesh position={[0, 2.1, 0]} geometry={gableGeo2} castShadow><meshStandardMaterial color="#3d88dc" roughness={0.5} flatShading /></mesh>
          <Box s={[0.95, 0.6, 0.03]} p={[0, 0.85, 0.59]} m={M.plain('#f2f2ee')} cast={false} />
          <Box s={[0.7, 0.06, 0.035]} p={[0, 0.95, 0.6]} m={blueD} cast={false} /><Box s={[0.7, 0.06, 0.035]} p={[0, 0.78, 0.6]} m={blueD} cast={false} />
        </group>
        {/* lamp pole */}
        <Cyl rt={0.07} rb={0.09} h={6.6} p={[2.7, sy(16) + 3.0, sz(16)]} m={M.plain('#9ea3a8', { metalness: 0.6, roughness: 0.5 })} seg={8} />
        <Box s={[0.5, 0.12, 0.25]} p={[2.45, sy(16) + 6.25, sz(16)]} m={M.plain('#9ea3a8')} />
        <mesh position={[2.35, sy(16) + 6.12, sz(16)]}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#fff2cf" emissive="#ffd98a" emissiveIntensity={dusk ? 3 : 0.4} /></mesh>

        {/* bell niche: small square stone frame at the right of the mouth */}
        <group position={[6.0, 1.55, faceZ(6.0, 1.55) + 0.45]} scale={1.3}>
          <Box s={[0.12, 1.0, 0.45]} p={[-0.45, 0, 0]} m={stoneL} />
          <Box s={[0.12, 1.0, 0.45]} p={[0.45, 0, 0]} m={stoneL} />
          <Box s={[1.02, 0.12, 0.45]} p={[0, 0.5, 0]} m={stoneL} />
          <Box s={[1.02, 0.12, 0.45]} p={[0, -0.5, 0]} m={stoneL} />
          <Box s={[0.8, 0.8, 0.1]} p={[0, 0, -0.15]} m={rockD} />
          <Cyl rt={0.03} rb={0.17} h={0.26} p={[0, 0.12, 0.02]} m={M.plain('#c8a040', { metalness: 0.7, roughness: 0.35 })} seg={10} />
          <Pipe a={[0, 0.45, 0.02]} b={[0, 0.26, 0.02]} r={0.012} m={silver} />
        </group>
        <Box s={[2.0, 0.25, 1.2]} p={[6.0, 0.7, faceZ(6.0, 0.7) + 0.75]} m={stoneL} />

        {/* moss, ferns and creepers on the rock */}
        {vines.map((v, k) => <Box key={k} s={[v.w, v.len, 0.05]} p={[v.x, v.y - v.len / 2, v.z]} m={v.tone > 0.5 ? green : greenD} cast={false} />)}
        {leaves.map((l, k) => (
          <group key={k} position={[l.x, l.y, l.z]} rotation={[0, l.ry, 0]}>
            {[0, 1, 2, 3].map((q) => (
              <mesh key={q} position={[Math.cos(q * 1.57) * l.s * 0.5, l.s * 0.6, Math.sin(q * 1.57) * l.s * 0.5]} rotation={[Math.sin(q * 1.57) * 0.7, 0, -Math.cos(q * 1.57) * 0.7]} material={l.tone > 0.5 ? greenL : green} castShadow>
                <coneGeometry args={[l.s * 0.35, l.s * 2, 4]} />
              </mesh>
            ))}
          </group>
        ))}
        {rwall.map((b, k) => (
          <mesh key={'rw' + k} position={b.p} scale={b.s} rotation={b.r} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={b.c} flatShading roughness={1} />
          </mesh>
        ))}
        {overh.map((b, k) => (
          <mesh key={'ov' + k} position={b.p} scale={b.s} rotation={b.r} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={b.c} flatShading roughness={1} />
          </mesh>
        ))}

        {/* interior glow and light */}
        <pointLight position={[0.3, 1.9, -4.4]} color="#ffb55c" intensity={dusk ? 7 : 2} distance={11} decay={1.7} />
        <pointLight position={[-1.4, 1.3, -0.6]} color="#ffc27a" intensity={dusk ? 1.2 : 0.3} distance={6} decay={2} />

        {/* stalactites hanging from the ceiling and a flowstone column */}
        {drips.map((d, k) => (
          <mesh key={k} position={[d.x, d.y, d.z]} rotation={[Math.PI, 0, 0]} material={d.amber ? amber : cream}>
            <coneGeometry args={[d.rad, d.len, 6]} />
          </mesh>
        ))}
        <Ball rad={1.2} sc={[1.0, 1.3, 0.9]} p={[2.5, 1.0, -7.4]} m={cream} />
        <Cyl rt={0.5} rb={0.9} h={0.6} p={[2.5, 0.3, -7.4]} m={amber} seg={9} />
        <group position={[2.5, 0, -8.6]}>
          <Cyl rt={0.95} rb={1.45} h={2.9} p={[0, 1.45, 0]} m={cream} seg={9} />
          <Cyl rt={0.7} rb={0.5} h={1.0} p={[0, 0.2, 0]} m={amber} seg={9} />
          {Array.from({ length: 9 }, (_, k) => {
            const a = (k / 9) * Math.PI * 2;
            return (
              <mesh key={k} position={[Math.cos(a) * 1.05, 1.2, Math.sin(a) * 1.05]} rotation={[0, -a, 0]} material={k % 3 === 0 ? amber : cream}>
                <coneGeometry args={[0.16, 2.1, 5]} />
              </mesh>
            );
          })}
        </group>
        {/* floor stalagmites */}
        {[[-2.4, -5.0, 0.7], [-1.4, -6.4, 0.9], [0.3, -6.6, 0.6], [2.6, -5.6, 0.5], [-2.9, -6.4, 1.1]].map(([x, z, h], k) => (
          <mesh key={k} position={[x, h / 2, z]} material={k % 2 ? amber : cream}><coneGeometry args={[0.24 + h * 0.1, h, 6]} /></mesh>
        ))}
        {/* bats on the roof */}
        {bats.map((b, k) => (
          <group key={k} position={[b.x, b.y, b.z]}>
            <Ball rad={0.09} sc={[1, 1.5, 0.9]} m={rockD} p={[0, 0, 0]} />
            <Ball rad={0.06} p={[0, -0.1, 0]} m={rockD} />
          </group>
        ))}

        {/* small Shiva shrine wrapped in red and gold cloth, just inside on the left */}
        <group position={[-2.0, 0, -6.6]}>
          <Ball rad={0.55} sc={[1.4, 0.35, 1.0]} p={[0, 0.1, 0]} m={stoneM} />
          <Cyl rt={0.14} rb={0.3} h={0.75} p={[0, 0.5, 0]} m={M.plain('#6f7a4a', { roughness: 1 })} seg={7} />
          <Cyl rt={0.18} rb={0.52} h={0.5} p={[0, 0.75, 0]} m={M.plain('#b3202a', { roughness: 0.8 })} seg={9} />
          <Cyl rt={0.5} rb={0.53} h={0.05} p={[0, 0.54, 0]} m={M.plain('#e0b030', { metalness: 0.5, roughness: 0.4 })} seg={9} />
          <Cyl rt={0.2} rb={0.2} h={0.04} p={[0, 1.02, 0]} m={M.plain('#e0b030', { metalness: 0.5, roughness: 0.4 })} seg={9} />
          <Ball rad={0.07} p={[0.5, 0.18, 0.45]} m={M.plain('#e8741c')} />
          <Ball rad={0.07} p={[-0.45, 0.18, 0.5]} m={M.plain('#e8741c')} />
          <Cyl rt={0.02} rb={0.1} h={0.18} p={[0.35, 1.1, 0.3]} m={M.plain('#c8a040', { metalness: 0.7, roughness: 0.4 })} seg={8} />
        </group>

        {/* visitors: on the stairs and inside with headlamps */}
        {people.map((q, k) => <Person key={k} p={[q.x, sy(q.i) + 0.02, sz(q.i)]} c={q.c} s={q.s || 1} r={Math.PI + ((k * 7) % 5 - 2) * 0.12} />)}
        <Person p={[-1.3, 0.1, 1.2]} c="#d94a3a" r={Math.PI} />
        <Person p={[1.2, 0.1, 0.4]} c="#3a63a8" r={Math.PI * 0.9} />
        <Person p={[0.2, 0.06, -2.4]} c="#6b3a7a" r={Math.PI * 0.2} lamp />
        <Person p={[1.0, 0.06, -3.4]} c="#2e7a5a" r={0.1} lamp />
        <Person p={[-0.4, 0.06, -3.6]} c="#c07a2a" r={0.2} lamp />
        <Person p={[0.7, 0.06, -4.7]} c="#3a4a8a" r={-0.1} lamp />
        <Person p={[-0.9, 0.06, -5.8]} c="#a03a3a" r={0.3} lamp />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function buildTerrain() {
    const N = 120;
    const pos = [], col = [], idx = [];
    const c = new THREE.Color();
    const forest = cl('#2f4a22'), forestL = cl('#3a5a2a'), field1 = cl('#9fbe55'), field2 = cl('#c8c068'), field3 = cl('#7da34a'), hazy = cl('#c9d4cc'), rocky = cl('#7f8f7c'), c2 = new THREE.Color();
    const warp = (u) => 230 * (0.35 * u + 0.65 * u * u * u);
    for (let j = 0; j <= N; j++) {
      const v = (j / N) * 2 - 1;
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * 2 - 1;
        const x = warp(u), z = warp(v);
        const y = T(x, z);
        pos.push(x, y, z);
        const d = Math.hypot(x, z);
        const n = fbm(x * 0.05, z * 0.05, 2), n2 = fbm(x * 0.2, z * 0.2, 9);
        mixc(forest, forestL, n2 * 1.5 - 0.2, c);
        if (fbm(x * 0.5, z * 0.5, 4) > 0.62) mixc(c, cl('#5a5a38'), 0.35, c);
        if (z > 36 && z < 105 && d < 170) {
          const cell = hash(Math.floor(x / 14), Math.floor(z / 9), 3);
          const f = cell < 0.34 ? field1 : cell < 0.66 ? field2 : field3;
          mixc(c, f, sm(34, 48, z) * (1 - sm(90, 108, z)) * 0.9, c);
        }
        if (z > 18 && z <= 38) mixc(c, field3, sm(18, 38, z) * 0.35 * n, c);
        if (Math.abs(x) < 4.6 && z > 2.4) mixc(c, cl('#8a7a5a'), 0.6, c);
        if (d < 12 && z < 3) mixc(c, rocky, 0.4, c);
        mixc(c, hazy, sm(70, 230, d) * 0.85, c);
        col.push(c.r, c.g, c.b);
      }
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, d = a + N + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function ribbonGeo(pts, width, yoff) {
    const pos = [], idx = [];
    pts.forEach((p, k) => {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      const nx = -dz, nz = dx;
      [-1, 1].forEach((s) => { const x = p[0] + nx * s * width / 2, z = p[1] + nz * s * width / 2; pos.push(x, T(x, z) + yoff, z); });
    });
    for (let k = 0; k < pts.length - 1; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  function SiddhaEnv() {
    const M = useM();
    const [dusk, dref] = useDusk();
    const terrain = useMemo(() => buildTerrain(), []);
    const stairs2 = useMemo(() => stairGeo(27, 74), []);
    const concrete = M.plain('#8e8b80', { roughness: 0.95 });
    const silver = M.plain('#b9bec3', { roughness: 0.4, metalness: 0.7 });
    const trail = useMemo(() => {
      const pts = [[SX, sz(74)]];
      let z = sz(74), x = SX, dir = 1;
      while (z < 82) { const tx = dir * 12 + (dir > 0 ? 2 : -4); const steps = 8; for (let k = 1; k <= steps; k++) { pts.push([x + (tx - x) * k / steps, z + k * 1.0]); } x = tx; z += steps; dir = -dir; }
      return ribbonGeo(pts, 1.8, 0.12);
    }, []);
    const river = useMemo(() => {
      const pts = []; for (let x = -220; x <= 220; x += 6) pts.push([x, 88 + 10 * Math.sin(x * 0.025) + 4 * Math.sin(x * 0.07)]);
      const pos = [], idx = [];
      pts.forEach((p, k) => { [-1, 1].forEach((s) => pos.push(p[0], -55.3, p[1] + s * 5)); });
      for (let k = 0; k < pts.length - 1; k++) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    }, []);
    const skyGeo = useMemo(() => {
      const g = new THREE.SphereGeometry(380, 24, 16);
      const day = [cl('#d9d9cc'), cl('#a9c3d8')], dk = [cl('#4b3a60'), cl('#1c1236')];
      const cs = []; const p = g.attributes.position; const cc = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i) / 380, 0, 1); cc.copy((dusk ? dk : day)[0]).lerp((dusk ? dk : day)[1], Math.pow(t, 0.6)); cs.push(cc.r, cc.g, cc.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
      return g;
    }, [dusk]);
    const mistTex = useCanvasTex((g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, 128, 128);

    /* forest */
    const forest = useMemo(() => {
      const r = mkRng(77); const crowns = [], trunks = [];
      const tones = ['#2a5226', '#356429', '#244a26', '#3f7230', '#2d5a26', '#4a7a35'];
      const rockTopAt = (x, z) => { const ty = T(x, z); const t = sm(14.2, 10.6, Math.abs(x)); return ty + (topY(z) - ty) * t; };
      for (let k = 0; k < 1400 && crowns.length < 560; k++) {
        const x = (r() - 0.5) * 150, z = -50 + r() * 112;
        const onTop = z < -3 && z > -26 && Math.abs(x) < 17;
        if (z >= -3 && z < 3.5 && Math.abs(x) < 13.5) continue;
        if (z >= 2 && z < 45 && Math.abs(x) < 13) continue;
        
        if (z > 72) continue;
        if (Math.abs(x) < 13.5 && z > -3.5 && z < 3.5) continue;
        let y = T(x, z);
        if (onTop) { y = Math.max(y, rockTopAt(x, z)); if (r() < 0.15) continue; }
        if (z > 40 && r() < 0.8) continue;
        if (Math.hypot(x, z) < 25 && !onTop && r() < 0.65) continue;
        const h = 2.0 + r() * 3.2, cr = 1.2 + Math.pow(r(), 1.5) * 2.8;
        trunks.push({ p: [x, y + h * 0.4, z], s: [0.35 + r() * 0.15, h * 0.8, 0.35 + r() * 0.15], c: '#4a3a2a' });
        crowns.push({ p: [x, y + h, z], s: [cr, cr * 0.85, cr], c: tones[Math.floor(r() * tones.length)], ry: r() * 6 });
        if (r() > 0.4) crowns.push({ p: [x + (r() - 0.5) * 2.2, y + h * 0.75, z + (r() - 0.5) * 2.2], s: [cr * 0.85, cr * 0.7, cr * 0.85], c: tones[Math.floor(r() * tones.length)], ry: r() * 6 });
      }
      return { crowns, trunks };
    }, []);
    const ferns = useMemo(() => {
      const r = mkRng(88); const out = [];
      for (let k = 0; k < 90; k++) {
        const side = k % 2 ? 1 : -1; const z = 3.5 + r() * 26; const x = SX + side * (1.8 + r() * 4.2) + (side > 0 ? 0.5 : -0.3);
        const h = 0.15 + r() * 0.15; out.push({ p: [x, T(x, z) + h, z], s: [h * 1.2, h * 2, h * 1.2], c: r() > 0.5 ? '#37652a' : '#24501e', ry: r() * 6 });
      }
      for (let k = 0; k < 40; k++) {
        const x = 6.5 + r() * 8, z = -1 + r() * 7;
        const h = 0.25 + r() * 0.25; out.push({ p: [x, T(x, z) + h, z], s: [h * 1.2, h * 2, h * 1.2], c: r() > 0.5 ? '#3d7226' : '#2c5a20', ry: r() * 6 });
      }
      return out;
    }, []);
    const houses = useMemo(() => {
      const r = mkRng(55); const out = []; const cs = ['#e9a3a0', '#f1d27a', '#8fb7e3', '#f4efe6', '#c9d98a', '#e8b88a'];
      for (let k = 0; k < 90; k++) {
        const x = (r() - 0.5) * 220, z = 46 + r() * 36; if (z > 78 && z < 98) continue;
        out.push({ p: [x, T(x, z) + 1.2, z], s: [3.4, 2.4, 3.4], c: cs[Math.floor(r() * cs.length)], ry: r() * 3 });
      }
      return out;
    }, []);
    const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const crownMat = useMemo(() => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), []);
    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.6, 1, 1, 5), []);
    const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), []);
    const fernGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 5), []);
    const fernMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), []);
    const houseGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const houseMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9 }), []);

    const railA = (x, h) => [[x, sy(27) + h, sz(27)], [x, sy(74) + h, sz(74)]];
    const upost = []; for (let i = 30; i <= 74; i += 4) upost.push(i);

    return (
      <group ref={dref}>
        {/* sky dome and valley haze */}
        <mesh geometry={skyGeo} renderOrder={-2}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
        <mesh geometry={terrain} receiveShadow><meshStandardMaterial vertexColors roughness={1} flatShading /></mesh>
        <mesh geometry={river}><meshStandardMaterial color={dusk ? '#4c5a80' : '#7fa8c0'} metalness={0.4} roughness={0.2} /></mesh>
        <mesh geometry={trail}><meshStandardMaterial color="#a38a62" roughness={1} /></mesh>
        {/* continuation of the stairs down the hill, with railings */}
        <mesh geometry={stairs2} material={concrete} receiveShadow />
        {[-2.3, 0.7].map((x) => (
          <group key={x}>
            <Pipe a={railA(x, 1.0)[0]} b={railA(x, 1.0)[1]} m={silver} />
            <Pipe a={railA(x, 0.5)[0]} b={railA(x, 0.5)[1]} m={silver} />
            {upost.map((i) => <Box key={i} s={[0.07, 1.05, 0.07]} p={[x, sy(i) + 0.52, sz(i)]} m={silver} cast={false} />)}
          </group>
        ))}
        {/* forest, ferns and the valley villages */}
        <Inst geo={trunkGeo} mat={trunkMat} items={forest.trunks} />
        <Inst geo={crownGeo} mat={crownMat} items={forest.crowns} />
        <Inst geo={fernGeo} mat={fernMat} items={ferns} />
        <Inst geo={houseGeo} mat={houseMat} items={houses} />
        {[[-24, 0.3, 90], [-30, 0.3, 120]].map(([y, o, rr], k) => (
          <mesh key={'fog' + k} position={[0, y, 22]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
            <planeGeometry args={[rr * 2, rr * 2]} /><meshBasicMaterial map={mistTex} transparent opacity={dusk ? o * 0.45 : o} depthWrite={false} fog={false} color={dusk ? '#9a86b8' : '#f4f8f6'} />
          </mesh>
        ))}
        {/* mist layers */}
        {[[-22, 70, 0.14], [-26, 110, 0.18], [-34, 150, 0.28], [-50, 190, 0.34], [-21, 40, 0.1]].map(([y, r, o], k) => (
          <mesh key={k} position={[k === 4 ? 8 : 0, y, k === 4 ? 6 : 30]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
            <planeGeometry args={[r * 2, r * 2]} /><meshBasicMaterial map={mistTex} transparent opacity={dusk ? o * 0.5 : o} depthWrite={false} fog={false} color={dusk ? '#9a86b8' : '#ffffff'} />
          </mesh>
        ))}
        {dusk && <pointLight position={[2.35, sy(16) + 6.0, sz(16) + 0.4]} color="#ffd08a" intensity={14} distance={16} decay={1.6} />}
        {dusk && <pointLight position={[-0.8, -0.6, 8.3]} color="#9cc8ff" intensity={5} distance={9} decay={1.8} />}
      </group>
    );
  }

  return { 'siddha-cave-bimalnagar': { Main: SiddhaMain, Env: SiddhaEnv } };
}
