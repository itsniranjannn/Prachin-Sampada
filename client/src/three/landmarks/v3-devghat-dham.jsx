/* Devghat Dham, Tanahun/Chitwan, Gandaki: a landscape pilgrim town. A green rounded knoll (peninsula) wrapped by the wide braided river at the
   Trishuli / Kali Gandaki confluence; small orange-red temples (dome-capped shrines, two- and three-tier pagodas, a gold-roofed Pashupati pagoda
   beside a lit arch gate), red-roofed houses along the crest, stone bathing steps, a long prayer-flag suspension bridge, sand bars and a forested
   Mahabharat ridge behind. Layout is an impression from six photographs; counts and distances are approximate (not surveyed).
   Built in local (u,v) plan coordinates: u runs across the view, v towards the viewer; the whole scene is turned 45 degrees so the default camera
   looks straight down v. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Frame, Trident, Lingam, PrayerFlags, THREE, useMemo } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const vn = (u, v) => {
    const iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv;
    const a = rn(iu * 57 + iv * 131), b = rn((iu + 1) * 57 + iv * 131), c = rn(iu * 57 + (iv + 1) * 131), d = rn((iu + 1) * 57 + (iv + 1) * 131);
    const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    return mix(mix(a, b, su), mix(c, d, su), sv);
  };
  const segD = (u, v, a, b, c, d) => {
    const dx = c - a, dz = d - b;
    const t = Math.min(1, Math.max(0, ((u - a) * dx + (v - b) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(u - (a + dx * t), v - (b + dz * t));
  };

  /* glowing materials: dim by day, lit when the viewer is switched to the dusk (aarti) view */
  const GLOW = [];
  const GLOW_CACHE = {};
  const glowMat = (key, color, emissive, day, dusk) => {
    if (!GLOW_CACHE[key]) {
      const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: day, roughness: 0.5 });
      GLOW_CACHE[key] = mat;
      GLOW.push({ mat, day, dusk });
    }
    return GLOW_CACHE[key];
  };
  function GlowDriver() {
    K.useEffect(() => {
      let last = null;
      const tick = () => {
        let d = false;
        try { d = Array.from(document.querySelectorAll('.model-tools .chip.on')).some((e) => /dusk/i.test(e.textContent)); } catch (e) { d = false; }
        if (d !== last) { last = d; GLOW.forEach((g) => { g.mat.emissiveIntensity = d ? g.dusk : g.day; }); }
      };
      tick();
      const id = setInterval(tick, 300);
      return () => clearInterval(id);
    }, []);
    return null;
  }

  /* ------------------------------------------------------------------ terrain */
  const RC = 25, RW = 10.5;
  const PADS = [[8.8, 1.8, 5.2, 5.0, 7.0]];
  // gravel bars [u, v, half-length, half-width, angle]: big flat grey-beige flats attached to the banks
  const BARS = [[29, 12, 6.5, 12.5, 0], [36, -11.5, 15, 5, -0.42], [18, 22, 5, 3, -0.3], [-23, -9.5, 11, 3.4, 0.05], [3, -26, 12, 3.2, 0.1]];
  const JX = 23, JZ = -16; // the confluence (Trishuli arm A meets the Kali Gandaki arm B)

  function T(u, v) {
    const wv = Math.max(0, v - 12);
    const uu = u - 2.5 * Math.sin(v * 0.09) + 0.115 * wv * wv;
    const sl = 0.14 * wv;
    const d1 = segD(uu, v, RC, -22, RC, 400) / Math.sqrt(1 + sl * sl) - RW;
    const vv = v - 2 * Math.sin(u * 0.08 + 1);
    const d2 = segD(u, vv, -100, -27, RC - 1, -16.5) - 6.2;
    const d3 = segD(u, v, JX, JZ, JX + 66, JZ - 29) - 8.6;
    const d = Math.min(d1, d2, d3);
    const nz = (vn(u * 0.12, v * 0.12) - 0.5) * 1.4 + (vn(u * 0.4, v * 0.4) - 0.5) * 0.35;
    const rb = Math.hypot(u + 3, v);
    const bowl = 0.0016 * Math.pow(rb, 1.6);
    let hill = 0.55 * Math.max(0, u - 34) + 0.6 * Math.max(0, -v - 21) + 0.45 * Math.max(0, -u - 100) * sm(40, 5, v);
    hill = 46 * Math.tanh(hill / 46);
    hill *= 0.2 + 0.8 * sm(1, 14, d3);
    hill += 7 * Math.tanh(0.3 * Math.max(0, -u - 100) / 7) * sm(16, 0, v);
    const hillN = hill > 0 ? nz * Math.min(1, hill / 6) * 2.2 + (vn(u * 0.05, v * 0.05) - 0.5) * hill * 0.35 : 0;
    let k = 7.6 * Math.exp(-(Math.pow(Math.abs(u + 3) / 17.5, 2.3) + Math.pow(Math.abs(v) / (v < 0 ? 11 : 10.5), 2.3)));
    k *= 0.97 + 0.06 * vn(u * 0.25, v * 0.25);
    k += 2.4 * Math.exp(-(Math.pow((u + 40) / 7.5, 2) + Math.pow((v - 11) / 6, 2)));
    let land = 0.7 + bowl + hill + hillN + nz * 0.2 + k;
    let pad = 0;
    for (const [pu, pv, ru, rv, ph] of PADS) pad = Math.max(pad, ph * Math.exp(-(Math.pow((u - pu) / ru, 4) + Math.pow((v - pv) / rv, 4))));
    land = Math.max(land, pad);
    let bar = -1;
    for (const [bu, bv, ru, rv, an] of BARS) {
      const dx = u - bu, dz = v - bv, ca = Math.cos(an), sa = Math.sin(an);
      bar = Math.max(bar, 1 - Math.hypot((dx * ca + dz * sa) / ru, (-dx * sa + dz * ca) / rv));
    }
    bar += (vn(u * 0.25, v * 0.25) - 0.5) * 0.28;
    const chan = -0.4 + 0.75 * sm(0.12, 0.4, bar);
    if (hill > 1 && k < 0.3) land = mix(land, Math.round(land / 0.9) * 0.9, 0.65 * sm(1, 4, hill));
    const h = mix(chan, land, sm(-1.2, 0.7 + Math.min(1.5, k * 0.3), d));
    return { h, d, hill, k, bar, chan, pad, wood: hill + bowl * 0.4 };
  }
  const gy = (u, v) => T(u, v).h;
  const gmax = (u, v, r) => Math.max(gy(u, v), gy(u + r, v), gy(u - r, v), gy(u, v + r), gy(u, v - r), gy(u + r, v + r), gy(u - r, v - r), gy(u + r, v - r), gy(u - r, v + r));

  /* the long suspension bridge crosses the Trishuli arm near the foot of the far forested ridge, at an angle */
  const BR_L = 44, BR_U0 = -BR_L / 2, BR_U1 = BR_L / 2, BR_V = 0;
  const BR_AX = [1, 0]; // spans the river across the foreground (along u)
  const BR_CX = -2, BR_CZ = 27;
  const BR_TH = Math.atan2(-BR_AX[1], BR_AX[0]);
  const brGround = (x) => gmax(BR_CX + BR_AX[0] * x, BR_CZ + BR_AX[1] * x, 1.2);
  const BR_Y = Math.max(brGround(-BR_L / 2), brGround(BR_L / 2), 2.4) + 0.5; // deck height above water
  const wxz = (u, v, y = 0) => [(u + v) * 0.7071, y, (v - u) * 0.7071];

  function Terrain() {
    const geo = useMemo(() => {
      const S = 240, N = 240;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const c = new THREE.Color();
      const haze = new THREE.Color('#7f9a96');
      const forest = ['#35602d', '#2d5128', '#3e6c33', '#2a4a27'];
      for (let i = 0; i < p.count; i += 1) {
        const u = p.getX(i), v = p.getZ(i);
        const t = T(u, v);
        p.setY(i, t.h);
        const n = rn(Math.floor(u * 0.8) * 131 + Math.floor(v * 0.8) * 17);
        const n2 = vn(u * 0.18, v * 0.18);
        if (t.d < -0.2) {
          if (t.chan > 0 && t.h > 0.0 && t.h < 1.3) c.set(n > 0.5 ? '#ddd3b4' : '#d4c9a8');
          else if (t.h > 1.5) c.set(n > 0.5 ? '#5e8a40' : '#527a38');
          else if (t.h > 0.05) c.set(n > 0.5 ? '#8a7f66' : '#7c725b');
          else c.set('#5d6c5e');
        } else if (t.d < 1.5 && t.k > 1.2 && t.h < 6) {
          c.set(n > 0.45 ? '#8d8777' : '#78735f');
        } else if (t.d < 0.9 && t.h < 1.4) {
          c.set(n > 0.5 ? '#9b907a' : '#8c826f');
        } else if (t.k > 0.8 && t.k < 8.5) {
          c.set(['#2c5428', '#35632f', '#264a24', '#3f6e34'][Math.floor(n * 4) % 4]);
        } else if (t.wood > 1.6 && t.k < 0.6) {
          c.set(forest[Math.floor(n * 4) % 4]);
          if (n2 > 0.62) c.lerp(new THREE.Color('#7b8d4e'), 0.4);
          else if (n2 < 0.32) c.lerp(new THREE.Color('#1f3b1f'), 0.45);
        } else if (t.k > 0.5 || t.pad > 0.5) {
          c.set(n2 > 0.5 ? '#6f9a45' : '#628d3f');
        } else {
          const fc = ['#86a552', '#8fac57', '#7c9d4d', '#97ad5b', '#74964a', '#8ba855'];
          c.set(fc[Math.floor(rn(Math.floor((u + 200) / 6) * 31 + Math.floor((v + 200) / 8) * 7) * 6)]);
          if (n > 0.85) c.multiplyScalar(0.92);
        }
        const r = Math.hypot(u, v);
        const hz = sm(70, 140, r) * 0.2;
        c.lerp(haze, hz);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  function Water() {
    const geo = useMemo(() => {
      const S = 240, N = 120;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const deep = new THREE.Color('#556b57'), shal = new THREE.Color('#8f9c78'), brown = new THREE.Color('#8a7a55');
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const u = p.getX(i), v = p.getZ(i);
        const t = T(u, v);
        const sh = sm(-0.3, 0.3, t.h);
        c.copy(deep).lerp(brown, 0.25 + 0.2 * vn(u * 0.07 + 3, v * 0.07)).lerp(shal, Math.min(1, sh * 0.8 + sm(-0.4, 1.6, t.d) * 0.25));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, 0.0, 0]} receiveShadow><meshStandardMaterial vertexColors roughness={0.55} metalness={0.0} /></mesh>;
  }

  /* ------------------------------------------------------------------ instancing helpers */
  function Inst({ geo, mat, items, cast = false }) {
    const ref = (mesh) => {
      if (!mesh || mesh.userData.done) return;
      const o = new THREE.Object3D();
      const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set(0, it.ry || 0, 0);
        if (Array.isArray(it.s)) o.scale.set(it.s[0], it.s[1], it.s[2]); else o.scale.setScalar(it.s == null ? 1 : it.s);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        if (it.c) { c.set(it.c); mesh.setColorAt(i, c); }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.userData.done = true;
    };
    if (!items.length) return null;
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }
  const useBox = () => useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), []);
  const usePyr = () => useMemo(() => new THREE.ConeGeometry(0.7071, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0), []);
  const useStd = (opts) => useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, ...opts }), []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------------ layout (pure maths, computed once) */
  const WALLS = ['#e9dfc4', '#eee8d8', '#e3d29a', '#e3bfa4', '#ecdcc4', '#d4cdb9', '#efe0bd'];
  const ROOFS = ['#c0392b', '#d2562f', '#c0392b', '#d2562f', '#b5301f'];

  // [u, v, clearance radius] of the temples and plazas on the knoll
  const OBST = [[-13.4, 1.4, 4.6], [-7.2, -2.6, 4.6], [-7.2, 3.0, 3.4], [-0.5, 0, 5.8], [6.9, -0.9, 4.4], [10.4, 2.6, 3.6], [-17.6, -1.6, 1.8], [-3.5, -6.2, 2.0], [4.4, -6.0, 1.8], [-10.4, -6.2, 1.8],
    [8.6, -5.2, 1.7], [11.8, -7.8, 3.0], [7.4, 13.6, 1.4], [-9.8, 6.4, 1.4], [11.5, 13.6, 3.6]];
    const GH_U = 11.5, GH_V0 = 10.8, GH_N = 8, GH_ST = 0.72;
  const GH_TOP = gy(GH_U, GH_V0 + 0.3) + 0.08;
  const ghTop = (i) => GH_TOP * (1 - i / GH_N) + 0.12;
  const nearObst = (u, v, r) => OBST.some(([a, b, c]) => Math.hypot(u - a, v - b) < c + r);
  const LANE = (u) => 4.9 + 0.35 * Math.sin(u * 0.22);

  function bakeHouses(list) {
    const walls = [], roofs = [], wins = [], lit = [];
    list.forEach((h, i) => {
      const y0 = (h.yb == null ? h.y - 0.5 : h.yb - 0.35);
      const wh = h.st * 0.7 + (h.y - y0);
      const wc = h.wall || WALLS[Math.floor(rn(i + 3) * WALLS.length)];
      walls.push({ p: [h.u, y0, h.v], s: [h.w, wh, h.d], ry: h.ry, c: wc });
      if (h.flat) {
        walls.push({ p: [h.u, y0 + wh, h.v], s: [h.w * 1.06, 0.12, h.d * 1.06], ry: h.ry, c: '#b8b0a0' });
        walls.push({ p: [h.u + h.w * 0.2, y0 + wh + 0.12, h.v], s: [0.5, 0.45, 0.5], ry: h.ry, c: '#cdbfa0' });
      } else {
        const blue = rn(i * 7 + 2) < 0.14;
        const rc = blue ? '#2f6fb0' : h.roof || ROOFS[Math.floor(rn(i + 9) * ROOFS.length)];
        roofs.push({ p: [h.u, y0 + wh - 0.02, h.v], s: [h.w * 1.3, 0.38 + rn(i + 5) * 0.08, h.d * 1.3], ry: h.ry, c: rc });
      }
      for (let s = 0; s < h.st; s += 1) {
        const y = h.y + s * 0.7 + 0.18;
        const cs = Math.cos(h.ry), sn = Math.sin(h.ry);
        [-1, 1].forEach((side) => {
          const ox = side * h.w * 0.25;
          const it = { p: [h.u + ox * cs, y, h.v - ox * sn], s: [h.w * 0.22, 0.24, h.d + 0.04], ry: h.ry, c: '#ffffff' };
          if (rn(i * 13 + s * 5 + side) < 0.3) lit.push(it); else wins.push({ ...it, c: '#3a4756' });
        });
      }
    });
    return { walls, roofs, wins, lit };
  }

  const KNOLL_HOUSES = (() => {
    const out = [];
    let n = 0;
    // dense, irregular red-roofed cluster along the crest and shoulders: mostly 3-4 storeys, many flat parapet roofs
    for (let v0 = -11.5; v0 <= 11; v0 += 2.3) {
      for (let u0 = -21; u0 <= 14; u0 += 2.3) {
        n += 1;
        const u = u0 + (rn(n) - 0.5) * 1.3 + (Math.round((v0 + 11) / 2.45) % 2) * 0.7, v = v0 + (rn(n + 400) - 0.5) * 1.3;
        const t = T(u, v);
        if (t.k < 1.0 || t.d < 1.1 || rn(n + 900) < 0.1) continue;
        if (u > 7.5 && u < 16 && v > 8.2) continue;
        if (nearObst(u, v, -0.5) || Math.abs(v - LANE(u)) < 1.15) continue;
        const w = 1.5 + rn(n + 4) * 0.55, d = 1.4 + rn(n + 8) * 0.5;
        const y = gmax(u, v, 0.8);
        const yb = Math.min(gy(u + 0.8, v + 0.7), gy(u - 0.8, v - 0.7), gy(u + 0.8, v - 0.7), gy(u - 0.8, v + 0.7));
        const hi = t.k > 3.4;
        out.push({ u, v, w, d, st: hi ? 2 + (rn(n + 60) > 0.5 ? 1 : 0) : 2, ry: (rn(n + 6) - 0.5) * 0.7, y, yb, flat: rn(n + 7) > 0.78 });
      }
    }
    return out;
  })();

  const FAR_HOUSES = (() => {
    const out = [];
    for (let i = 0; i < 12; i += 1) {
      const u = -46 + (i % 4) * 3.4 + rn(i) * 1.2, v = 8 + Math.floor(i / 4) * 3.2 + rn(i + 5);
      if (gy(u, v) < 0.9) continue;
      out.push({ u, v, w: 2.0 + rn(i + 2) * 0.5, d: 1.8, st: 2 + (i % 3 === 0 ? 1 : 0), ry: (rn(i + 4) - 0.5) * 0.4, y: gmax(u, v, 0.8) });
    }
    // village on the fields in front of the knoll (lane + two rows), and a few at the river terrace
    let m = 0;
    for (let u = -34; u < -10; u += 3.3 + rn(m + 70) * 0.7) {
      m += 1;
      [[15.2, 1], [19.4, -1]].forEach(([v0, side], r) => {
        if (rn(m * 5 + r) < (r ? 0.55 : 0.25)) return;
        const v = v0 + rn(m + r * 9) * 0.5;
        if (gy(u, v) < 0.9) return;
        out.push({ u, v, w: 1.7 + rn(m + 3) * 0.5, d: 1.5, st: 2 + (rn(m + r) > 0.7 ? 1 : 0), ry: side > 0 ? 0 : Math.PI, y: gmax(u, v, 0.9), flat: rn(m + 11) > 0.6 });
      });
    }
    for (let u = -4; u < 10; u += 3.4) {
      m += 1;
      const v = 15 + rn(m) * 1.6;
      if (gy(u, v) < 0.9) continue;
      out.push({ u, v, w: 2.0, d: 1.8, st: 2, ry: 0, y: gmax(u, v, 0.9) });
    }
    // far (right) bank, east of the main river
    for (let i = 0; i < 6; i += 1) {
      const u = 36.5 + rn(i + 30) * 3.5, v = 3 + i * 3.3 + rn(i + 31);
      if (gy(u, v) < 1.2) continue;
      out.push({ u, v, w: 2.1, d: 1.9, st: 2 + (i % 3 === 0 ? 1 : 0), ry: -Math.PI / 2 + (rn(i + 4) - 0.5) * 0.3, y: gmax(u, v, 0.9) });
    }
    return out;
  })();

  const TREES = (() => {
    const crowns = [], trunks = [];
    const cols = ['#27502a', '#2f5a2c', '#1f4222', '#3b6a32', '#2a5428', '#4f7c36', '#18381c', '#6a8a3a'];
    let n = 0;
    for (let tries = 0; tries < 5000 && n < 85; tries += 1) {
      const u = -18 + rn(tries * 2 + 1) * 35, v = -13 + rn(tries * 2 + 2) * 25;
      const t = T(u, v);
      if (t.k < 0.7 || t.d < 0.7) continue;
      const crest = t.k > 5.6;
      if (crest && rn(tries + 77) > 0.22) continue;
      if (!crest && t.k > 2.0 && rn(tries + 78) > 0.22) continue;
      if (v > 6.5 && rn(tries + 79) > 0.3) continue;
      if (nearObst(u, v, 0.9) || Math.abs(v - LANE(u)) < 1.0) continue;
      if (KNOLL_HOUSES.some((h) => Math.abs(u - h.u) < h.w * 0.5 + 0.8 && Math.abs(v - h.v) < h.d * 0.5 + 0.8)) continue;
      if (v > 1.5 && v < 5.6 && u > -10 && u < 4 && t.k > 4.2) continue; // keep the temples open to view
      n += 1;
      const s = (crest ? 1.5 : 0.85) + rn(tries + 5) * (crest ? 0.9 : 0.5);
      const h = t.h - 0.2;
      trunks.push({ p: [u, h, v], s: [0.22 * s, 1.5 * s, 0.22 * s], c: '#4b3a2c' });
      const m = 3 + Math.floor(rn(tries + 6) * 2);
      for (let q = 0; q < m; q += 1) {
        const a = rn(tries * 7 + q) * 6.28, r = (q ? 0.7 : 0) * s;
        const cs = (0.85 + rn(tries * 3 + q) * 0.5) * s;
        crowns.push({ p: [u + Math.cos(a) * r, h + (1.5 + 0.35 * q) * s, v + Math.sin(a) * r], s: [cs * 1.2, cs * 0.6, cs * 1.2], c: cols[Math.floor(rn(tries + q * 13 + 3) * cols.length)] });
      }
    }
    return { crowns, trunks };
  })();

  const FOREST = (() => {
    const crowns = [], trunks = [];
    const cols = ['#2f5a2c', '#386430', '#2a4e29', '#426f35', '#335c2e', '#4d7a3a'];
    const patch = ['#1f3f20', '#27492a', '#33602f', '#5d8340', '#6f8e45', '#2c5528'];
    let n = 0;
    // clumps of trees (not single dots) on the fields in front of the knoll
    for (let i = 0; i < 26; i += 1) {
      const cu = -34 + rn(i + 500) * 54, cv = 11 + rn(i + 520) * 17;
      const m = 4 + Math.floor(rn(i + 515) * 4);
      for (let q = 0; q < m; q += 1) {
        const u = cu + (rn(i * 9 + q + 600) - 0.5) * 3.6, v = cv + (rn(i * 9 + q + 700) - 0.5) * 3.2;
        const t = T(u, v);
        if (t.d < 3 || FAR_HOUSES.some((h) => Math.abs(u - h.u) < 2.6 && Math.abs(v - h.v) < 2.6)) continue;
        const s = 0.8 + rn(i * 9 + q + 800) * 0.7;
        trunks.push({ p: [u, t.h - 0.1, v], s: [0.17 * s, 1.0 * s, 0.17 * s], c: '#5b4333' });
        crowns.push({ p: [u, t.h + 1.1 * s, v], s: [1.1 * s, 0.95 * s, 1.1 * s], c: cols[(i + q) % 6] });
      }
    }
        for (let tries = 0; tries < 20000 && n < 4600; tries += 1) {
      const u = -112 + rn(tries * 3 + 1) * 224, v = -112 + rn(tries * 3 + 2) * 224;
      const t = T(u, v);
      if (t.d < 2.0) continue;
      const sparse = t.wood < 1.6;
      if (v > 14 && Math.hypot(u, v) < 75) continue;
      if (FAR_HOUSES.some((h) => Math.hypot(u - h.u, v - h.v) < 3.2)) continue;
      if (sparse) continue;
      if (u < -42 && u > -100 && v > -18 && v < 16) continue; // keep the left view clear
      if (Math.hypot(u + 3, v) < 19 && sparse) continue;
      n += 1;
      const s = 1.3 + rn(tries + 4) * 1.1;
      trunks.push({ p: [u, t.h - 0.2, v], s: [0.25 * s, 1.0 * s, 0.25 * s], c: '#4b3a2c' });
      const pn = vn(u * 0.07 + 9, v * 0.07);
      const cc = pn > 0.66 ? patch[Math.floor(rn(tries + 6) * 3) + 3] : pn < 0.34 ? patch[Math.floor(rn(tries + 6) * 3)] : cols[Math.floor(rn(tries + 6) * cols.length)];
      crowns.push({ p: [u, t.h + 0.8 * s, v], s: [1.3 * s, 1.05 * s, 1.3 * s], c: cc });
    }
    return { crowns, trunks };
  })();

  const HOUSES_BAKED = bakeHouses(KNOLL_HOUSES);
  const FAR_BAKED = bakeHouses(FAR_HOUSES);

  /* ------------------------------------------------------------------ building blocks */
  function HouseSet({ L }) {
    const bw = useBox();
    const pyr = usePyr();
    const mw = useStd({ roughness: 0.9 });
    const mr = useStd({ roughness: 0.6, metalness: 0.15 });
    const mwin = useStd({ roughness: 0.4 });
    const mlit = glowMat('win', '#3a4756', '#ffb04a', 0.0, 1.5);
    return (
      <group>
        <Inst geo={bw} mat={mw} items={L.walls} cast />
        <Inst geo={pyr} mat={mr} items={L.roofs} cast />
        <Inst geo={bw} mat={mwin} items={L.wins} />
        <Inst geo={bw} mat={mlit} items={L.lit} />
      </group>
    );
  }

  function TreeSet({ L, cast = true }) {
    const trunk = useMemo(() => new THREE.CylinderGeometry(0.7, 1, 1, 6).translate(0, 0.5, 0), []);
    const crown = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
    const mt = useStd({ roughness: 1 });
    const mc = useStd({ roughness: 1, flatShading: true });
    return (
      <group>
        <Inst geo={trunk} mat={mt} items={L.trunks} cast={cast} />
        <Inst geo={crown} mat={mc} items={L.crowns} cast={cast} />
      </group>
    );
  }

  const wallOrange = (M) => M.plain('#c4532c', { roughness: 0.9 });
  const wallBrick = (M) => M.plain('#b9552f', { roughness: 0.95 });
  const roofMetal = (M, kind) => {
    if (kind === 'gold') return M.gold;
    if (kind === 'dark') return M.plain('#5a4034', { roughness: 0.6, metalness: 0.3 });
    if (kind === 'red') return M.plain('#9a4430', { roughness: 0.6, metalness: 0.25 });
    return M.plain('#7e8c85', { roughness: 0.5, metalness: 0.35 });
  };

  /** Small Nepali pagoda: square body, 2-3 hipped tiers, gajur. Local origin at ground. */
  function Pagoda({ p, ry = 0, s = 1, tiers = 2, w = 2, wh = 1.0, roof = 'grey', brick = false, led = false }) {
    const M = useM();
    const wm = brick ? wallBrick(M) : wallOrange(M);
    const rm = roofMetal(M, roof);
    const parts = [];
    let y = 0.22;
    for (let k = 0; k < tiers; k += 1) {
      const bw = w * (1 - 0.3 * k);
      const bh = k === 0 ? wh : wh * 0.55;
      const we = bw * 1.78;
      const rh = 0.5 - 0.04 * k;
      parts.push(<Box key={`b${k}`} s={[bw, bh, bw]} p={[0, y + bh / 2, 0]} m={wm} />);
      if (k === 0) {
        parts.push(<Box key="door" s={[bw * 0.3, bh * 0.62, 0.06]} p={[0, y + bh * 0.33, bw / 2 + 0.02]} m={glowMat('door', '#2a1a10', '#ff9a30', 0.0, 1.8)} cast={false} />);
        parts.push(<Box key="dl" s={[bw * 0.5, 0.06, 0.07]} p={[0, y + bh * 0.68, bw / 2 + 0.03]} m={M.dark} cast={false} />);
      } else {
        parts.push(<Box key={`w${k}`} s={[bw * 0.3, bh * 0.4, 0.05]} p={[0, y + bh * 0.5, bw / 2 + 0.02]} m={M.dark} cast={false} />);
      }
      parts.push(<Roof key={`r${k}`} w={we} d={we} h={rh} y={y + bh} m={rm} sag={1.45} lift={0.22} />);
      if (led) {
        const ledM = glowMat('led', '#e8c040', '#ffb200', 0.5, 3.6);
        parts.push(<Box key={`l${k}`} s={[we, 0.05, 0.05]} p={[0, y + bh - 0.1, we / 2]} m={ledM} cast={false} />);
        parts.push(<Box key={`m${k}`} s={[0.05, 0.05, we]} p={[we / 2, y + bh - 0.1, 0]} m={ledM} cast={false} />);
        parts.push(<Box key={`n${k}`} s={[0.05, 0.05, we]} p={[-we / 2, y + bh - 0.1, 0]} m={ledM} cast={false} />);
      }
      y = y + bh + rh * 0.62;
      if (k === tiers - 1) parts.push(<Gajur key="g" y={y - rh * 0.62 + rh} s={0.5} />);
    }
    return (
      <group position={[p[0], p[1] - 0.25, p[2]]} rotation={[0, ry, 0]} scale={s * 0.95}>
        <Box s={[w * 1.5, 0.7, w * 1.5]} p={[0, -0.05, 0]} m={M.stone} />
        {parts}
      </group>
    );
  }

  /** Orange-red square shrine with a white bell/cone roof (Bageshwori). */
  function BellShrine({ p, ry = 0, s = 1 }) {
    const M = useM();
    const geo = useMemo(() => {
      const pts = [[1.28, 0], [1.2, 0.16], [1.0, 0.52], [0.78, 0.98], [0.54, 1.42], [0.36, 1.78], [0.27, 2.06], [0.22, 2.24]].map(([x, y]) => new THREE.Vector2(x, y));
      return new THREE.LatheGeometry(pts, 20);
    }, []);
    const white = M.plain('#efebe2', { roughness: 0.8 });
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s * 0.92}>
        <Box s={[2.5, 0.7, 2.5]} p={[0, -0.1, 0]} m={M.stone} />
        <Box s={[2.2, 1.7, 2.2]} p={[0, 1.0, 0]} m={wallOrange(M)} />
        <Box s={[2.3, 0.12, 2.3]} p={[0, 1.9, 0]} m={white} />
        <Box s={[0.55, 1.0, 0.06]} p={[0, 0.8, 1.12]} m={glowMat('door', '#2a1a10', '#ff9a30', 0.0, 1.8)} cast={false} />
        <Box s={[0.7, 0.1, 0.1]} p={[0, 1.35, 1.12]} m={M.dark} cast={false} />
        <mesh geometry={geo} material={white} position={[0, 1.96, 0]} castShadow />
        <Cyl rt={0.07} rb={0.12} h={0.22} p={[0, 4.28, 0]} m={M.plain('#6a4a30')} seg={10} />
        <Ball rad={0.1} p={[0, 4.42, 0]} m={M.copper} />
        <Cyl rt={0.015} rb={0.04} h={0.3} p={[0, 4.62, 0]} m={M.copper} seg={6} />
      </group>
    );
  }

  /** Smaller shrine with a low white dome on a pink-orange base. */
  function DomeShrine({ p, ry = 0, s = 1 }) {
    const M = useM();
    const white = M.plain('#f0ece3', { roughness: 0.8 });
    return (
      <group position={p} rotation={[0, ry, 0]} scale={s * 0.95}>
        <Box s={[1.9, 0.6, 1.9]} p={[0, -0.1, 0]} m={M.stone} />
        <Box s={[1.6, 1.0, 1.6]} p={[0, 0.7, 0]} m={M.plain('#e98a5f', { roughness: 0.85 })} />
        <Box s={[0.4, 0.62, 0.05]} p={[0, 0.55, 0.82]} m={M.dark} cast={false} />
        <Cyl rt={0.92} rb={0.95} h={0.12} p={[0, 1.26, 0]} m={M.plain('#8a6a54')} seg={20} />
        <mesh position={[0, 1.32, 0]} scale={[1, 0.62, 1]} material={white} castShadow><sphereGeometry args={[0.86, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Cyl rt={0.05} rb={0.09} h={0.2} p={[0, 1.95, 0]} m={M.copper} seg={8} />
        <Ball rad={0.07} p={[0, 2.08, 0]} m={M.copper} />
      </group>
    );
  }

  /** Fenced stone plaza (Bageshwori). */
  function Plaza({ p, w, d }) {
    const M = useM();
    const posts = useMemo(() => {
      const o = [];
      for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.8) { o.push({ p: [x, 0, d / 2], s: [0.06, 0.55, 0.06], c: '#8a7f70' }); o.push({ p: [x, 0, -d / 2], s: [0.06, 0.55, 0.06], c: '#8a7f70' }); }
      for (let z = -d / 2 + 0.8; z < d / 2; z += 0.8) { o.push({ p: [w / 2, 0, z], s: [0.06, 0.55, 0.06], c: '#8a7f70' }); o.push({ p: [-w / 2, 0, z], s: [0.06, 0.55, 0.06], c: '#8a7f70' }); }
      return o;
    }, [w, d]);
    const bx = useBox();
    const mp = useStd({ roughness: 0.6, metalness: 0.4 });
    const rail = M.plain('#9a9486', { roughness: 0.5, metalness: 0.4 });
    return (
      <group position={p}>
        <Box s={[w, 0.9, d]} p={[0, -0.4, 0]} m={M.mat('stone', 4, 3, { color: '#d6cfc0' })} />
        <Inst geo={bx} mat={mp} items={posts.map((q) => ({ ...q, p: [q.p[0], 0.05, q.p[2]] }))} />
        <Box s={[w, 0.04, 0.04]} p={[0, 0.52, d / 2]} m={rail} cast={false} />
        <Box s={[w, 0.04, 0.04]} p={[0, 0.3, d / 2]} m={rail} cast={false} />
        <Box s={[w, 0.04, 0.04]} p={[0, 0.52, -d / 2]} m={rail} cast={false} />
        <Box s={[0.04, 0.04, d]} p={[w / 2, 0.52, 0]} m={rail} cast={false} />
        <Box s={[0.04, 0.04, d]} p={[-w / 2, 0.52, 0]} m={rail} cast={false} />
      </group>
    );
  }

  /** Ritual tank with a small yellow-railed arched footbridge. Runs along z. */
  function TankBridge({ p, w = 3.6, d = 2.4, s = 1 }) {
    const M = useM();
    const yellow = M.plain('#e3b21c', { roughness: 0.5 });
    const rails = useMemo(() => {
      const mk = (x) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const t = i / 8; return new THREE.Vector3(x, 0.62 + 0.5 * Math.sin(Math.PI * t), (0.5 - t) * (d + 1.0)); })), 16, 0.035, 6, false);
      return [mk(-0.45), mk(0.45)];
    }, [d]);
    const deck = Array.from({ length: 7 }, (_, i) => {
      const t = (i + 0.5) / 7;
      return [0, 0.3 + 0.5 * Math.sin(Math.PI * t), (0.5 - t) * (d + 1.0)];
    });
    return (
      <group position={p} scale={s}>
        <Box s={[w + 0.3, 1.0, d + 0.3]} p={[0, -0.5, 0]} m={M.plain('#b3ab9a', { roughness: 0.95 })} />
        <Box s={[w + 0.3, 0.45, d + 0.3]} p={[0, 0.0, 0]} m={M.plain('#eeece4')} />
        <Box s={[w - 0.1, 0.05, d - 0.1]} p={[0, 0.24, 0]} m={M.plain('#3d6b6a', { roughness: 0.2, metalness: 0.3 })} cast={false} />
        <Box s={[w + 0.3, 0.1, 0.05]} p={[0, 0.22, d / 2 + 0.16]} m={M.plain('#d8a010')} cast={false} />
        {deck.map((q, i) => <Box key={i} s={[1.0, 0.07, (d + 1.0) / 7 + 0.05]} p={q} r={[Math.cos(Math.PI * ((i + 0.5) / 7)) * 0.5 * 0.9, 0, 0]} m={M.plain('#b8b2a4')} />)}
        {rails.map((g, i) => <mesh key={i} geometry={g} material={yellow} castShadow />)}
      </group>
    );
  }

  /** Lit arch gateway (axis along u: the arch plane spans v). */
  function ArchGate({ p, s = 0.8 }) {
    const M = useM();
    const led = glowMat('led', '#e8c040', '#ffb200', 0.5, 3.6);
    const orange = M.plain('#d9542e', { roughness: 0.85 });
    return (
      <group position={p} scale={s}>
        {[-1, 1].map((k) => (
          <group key={k} position={[0, 0, k * 1.9]}>
            <Box s={[0.7, 2.6, 0.7]} p={[0, 1.3, 0]} m={orange} />
            <Box s={[0.85, 0.2, 0.85]} p={[0, 2.65, 0]} m={M.plain('#f0e6c8')} />
            <Box s={[0.7, 0.14, 0.7]} p={[0, 0.07, 0]} m={M.stone} />
          </group>
        ))}
        <group position={[0, 2.7, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={orange} castShadow><torusGeometry args={[1.9, 0.26, 8, 28, Math.PI]} /></mesh>
          <mesh material={led} position={[0, 0, 0.27]}><torusGeometry args={[1.9, 0.07, 6, 28, Math.PI]} /></mesh>
          <mesh material={led} position={[0, 0, -0.27]}><torusGeometry args={[1.9, 0.07, 6, 28, Math.PI]} /></mesh>
        </group>
        <Roof w={1.6} d={1.1} h={0.45} y={4.7} m={M.gold} sag={1.4} lift={0.2} />
        <Cyl rt={0.05} rb={0.1} h={0.35} p={[0, 5.3, 0]} m={M.gold} seg={8} />
        {Array.from({ length: 9 }, (_, i) => <Box key={i} s={[0.03, 2.2, 0.03]} p={[0, 1.15, -1.5 + i * 0.375]} m={M.dark} cast={false} />)}
        <Box s={[0.04, 0.04, 3.2]} p={[0, 0.3, 0]} m={M.dark} cast={false} />
        <Box s={[0.04, 0.04, 3.2]} p={[0, 2.1, 0]} m={M.dark} cast={false} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ the suspension bridge */
  function Bridge() {
    const M = useM();
    const L = BR_U1 - BR_U0;
    const top = BR_Y + 3.4, low = BR_Y + 1.3;
    const cableY = (t) => top - (top - low) * 4 * t * (1 - t);
    const cables = useMemo(() => [-0.85, 0.85].map((dv) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 21 }, (_, i) => { const t = i / 20; return new THREE.Vector3(BR_U0 + L * t, cableY(t), BR_V + dv); })), 40, 0.05, 6, false)), []); // eslint-disable-line
    const stays = useMemo(() => {
      const o = [];
      [-0.85, 0.85].forEach((dv) => {
        o.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(BR_U0, top, BR_V + dv), new THREE.Vector3(BR_U0 - 3.4, BR_Y - 0.4, BR_V + dv * 1.6)), 2, 0.035, 5, false));
        o.push(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(BR_U1, top, BR_V + dv), new THREE.Vector3(BR_U1 + 3.4, BR_Y - 0.4, BR_V + dv * 1.6)), 2, 0.035, 5, false));
      });
      return o;
    }, []); // eslint-disable-line
    const hangers = useMemo(() => {
      const o = [];
      const n = Math.round(L / 1.2);
      for (let i = 1; i < n; i += 1) {
        const t = i / n;
        const len = cableY(t) - BR_Y;
        [-0.85, 0.85].forEach((dv) => o.push({ p: [BR_U0 + L * t, BR_Y, BR_V + dv], s: [0.022, len, 0.022], c: '#cfd3d6' }));
      }
      return o;
    }, []); // eslint-disable-line
    const bx = useBox();
    const mh = useStd({ roughness: 0.5, metalness: 0.6 });
    const flags = useMemo(() => {
      const pos = [], colr = [];
      const cols = ['#2f6db5', '#f2efe6', '#c0392b', '#2e8b57', '#e2b33c'].map((h) => new THREE.Color(h));
      const n = 48;
      for (let i = 0; i < n; i += 1) {
        const u0 = BR_U0 + 0.6 + (i / n) * (L - 1.2), w = 0.5, y1 = BR_Y + 1.2, y0 = y1 - 0.6, v = BR_V + 0.98;
        pos.push(u0, y1, v, u0 + w, y1, v, u0 + w, y0, v, u0, y1, v, u0 + w, y0, v, u0, y0, v);
        const c = cols[i % 5];
        for (let k = 0; k < 6; k += 1) colr.push(c.r, c.g, c.b);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.computeVertexNormals();
      return g;
    }, []); // eslint-disable-line
    const netTex = useMemo(() => {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 32;
      const g = cv.getContext('2d');
      g.strokeStyle = '#d4d6d2'; g.lineWidth = 2;
      for (let i = -32; i < 160; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 32); g.stroke(); g.beginPath(); g.moveTo(i + 32, 0); g.lineTo(i, 32); g.stroke(); }
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(L / 3, 1);
      return t;
    }, []); // eslint-disable-line
    const deckTex = useMemo(() => {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      const g = cv.getContext('2d');
      g.fillStyle = '#6a7076'; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = '#9aa0a6'; g.lineWidth = 3;
      for (let i = 0; i <= 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(L * 1.2, 2);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }, []); // eslint-disable-line
    const steel = M.plain('#8d969e', { roughness: 0.45, metalness: 0.6 });
    const mid = BR_U0 + L / 2;
    return (
      <group>
        <Box s={[L, 0.12, 1.45]} p={[mid, BR_Y - 0.06, BR_V]} m={new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.7, metalness: 0.2 })} />
        <Box s={[L, 0.1, 0.1]} p={[mid, BR_Y - 0.14, BR_V - 0.7]} m={steel} />
        <Box s={[L, 0.1, 0.1]} p={[mid, BR_Y - 0.14, BR_V + 0.7]} m={steel} />
        {cables.map((g, i) => <mesh key={i} geometry={g} material={steel} castShadow />)}
        {stays.map((g, i) => <mesh key={`s${i}`} geometry={g} material={steel} />)}
        <Inst geo={bx} mat={mh} items={hangers} />
        {[-1, 1].map((k) => (
          <mesh key={`net${k}`} position={[mid, BR_Y + 0.58, BR_V + k * 0.82]}>
            <planeGeometry args={[L, 1.0]} />
            <meshBasicMaterial map={netTex} transparent alphaTest={0.3} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <Box s={[L, 0.04, 0.04]} p={[mid, BR_Y + 1.08, BR_V - 0.85]} m={steel} cast={false} />
        <Box s={[L, 0.04, 0.04]} p={[mid, BR_Y + 1.08, BR_V + 0.85]} m={steel} cast={false} />
        <mesh geometry={flags}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} /></mesh>
        {[BR_U0, BR_U1].map((u, i) => (
          <group key={i} position={[u, 0, BR_V]}>
            {[-0.85, 0.85].map((dv) => <Box key={dv} s={[0.3, top + 0.5, 0.3]} p={[0, (top - 0.5) / 2 + 0.25, dv]} m={M.plain('#9aa4ad', { roughness: 0.6, metalness: 0.4 })} />)}
            <Box s={[0.24, 0.24, 2.0]} p={[0, top - 0.5, 0]} m={steel} />
            <Box s={[0.24, 0.2, 2.0]} p={[0, top - 2.6, 0]} m={steel} />
            <Box s={[1.6, BR_Y + 0.3, 2.4]} p={[i ? 1.1 : -1.1, (BR_Y - 0.7) / 2, 0]} m={M.plain('#d6cfbf', { roughness: 0.95 })} />
          </group>
        ))}
      </group>
    );
  }

  /* ------------------------------------------------------------------ steps, pilgrims, rocks */
  const PILGRIMS = (() => {
    const bodies = [], heads = [];
    const cols = ['#e27d2a', '#c8372d', '#f2efe6', '#2f6fb0', '#e8c04a', '#b04a7a', '#f2efe6', '#d86a2a'];
    const spots = [[10.2, 12.0], [11.0, 13.1], [12.4, 12.6], [13.2, 14.0], [10.6, 14.4], [12.6, 15.2], [11.6, 11.4], [10.0, 13.6], [22.5, 10.0], [23.5, 12.5], [24.6, 14.5]];
    spots.forEach(([u, v], i) => {
      const y = i < 8 ? Math.max(ghTop(Math.max(0, Math.min(GH_N - 1, Math.round((v - GH_V0) / GH_ST)))), -0.05) + 0.02 : Math.max(gy(u, v), -0.05);
      const sc = 1;
      bodies.push({ p: [u, y, v], s: [0.13 * sc, 0.34 * sc, 0.13 * sc], c: cols[i % cols.length] });
      heads.push({ p: [u, y + 0.38 * sc, v], s: [0.075 * sc, 0.075 * sc, 0.075 * sc], c: '#8a5a3c' });
    });
    return { bodies, heads };
  })();

  function Pilgrims() {
    const cyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.6, 1, 8).translate(0, 0.5, 0), []);
    const ball = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
    const m1 = useStd({ roughness: 0.9 });
    const m2 = useStd({ roughness: 0.9 });
    return (
      <group>
        <Inst geo={cyl} mat={m1} items={PILGRIMS.bodies} />
        <Inst geo={ball} mat={m2} items={PILGRIMS.heads} />
      </group>
    );
  }

  /** Stone bathing steps on the knoll's front-right side, running down toward the viewer to the river. */
  function Ghat() {
    const M = useM();
    const steps = Array.from({ length: GH_N }, (_, i) => ({ v: GH_V0 + GH_ST * i, top: ghTop(i) }));
    return (
      <group position={[GH_U, 0, 0]}>
        {steps.map((s, i) => <Box key={i} s={[4.8, s.top + 0.5, GH_ST + 0.02]} p={[0, (s.top - 0.5) / 2, s.v]} m={M.plain(i % 2 ? '#e0dacb' : '#d2cbba', { roughness: 0.9 })} />)}
        <Box s={[4.8, 0.45, 0.14]} p={[0, GH_TOP + 0.2, GH_V0 - 0.5]} m={M.plain('#e7e2d6')} />
        <Lingam p={[-1.9, GH_TOP + 0.08, GH_V0 - 0.2]} />
        <Trident p={[1.9, GH_TOP + 0.05, GH_V0 - 0.2]} h={1.7} />
        {[-1.5, 0, 1.5].map((u, i) => <Diyo2 key={i} p={[u, GH_TOP + 0.02, GH_V0 + 0.1 + i * 0.15]} />)}
      </group>
    );
  }
  function Diyo2({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.06} rb={0.04} h={0.04} p={[0, 0.02, 0]} m={M.plain('#8b4a2a')} seg={8} />
        <mesh position={[0, 0.09, 0]}><coneGeometry args={[0.025, 0.08, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
      </group>
    );
  }

  const ROCKS = (() => {
    const o = [];
    // rocky outcrop at the confluence: 5 big grey boulders plus a scatter of smaller stones
    [[22.4, -14.4, 2.3], [24.8, -12.4, 1.9], [20.4, -16.4, 1.6], [23.8, -17.0, 1.5], [26.6, -14.4, 1.2]].forEach(([u, v, s], i) => o.push({ p: [u, -0.6, v], s: [s * 1.3, s * 1.0, s], ry: rn(i + 9) * 3, c: ['#7d776b', '#8d887c', '#6c675d', '#847e72', '#767064'][i % 5] }));
    for (let i = 0; i < 14; i += 1) {
      const u = 19.5 + rn(i) * 8, v = -17.5 + rn(i + 3) * 6;
      const s = 0.25 + rn(i + 6) * 0.35;
      o.push({ p: [u, -0.3, v], s: [s * 1.2, s * 0.7, s], ry: rn(i + 9) * 3, c: ['#8f897c', '#a39d90', '#7d786d', '#b0aa9d'][i % 4] });
    }
    return o;
  })();
  const FOAM = (() => {
    const o = [];
    // a few white rapid strokes streaming from the boulders
    for (let i = 0; i < 9; i += 1) o.push({ p: [20.6 + rn(i + 40) * 6.5, 0.05, -15.4 + rn(i + 41) * 3.4], s: [1.3 + rn(i + 42) * 1.3, 0.05, 0.1 + rn(i + 43) * 0.1], ry: 0.5 + rn(i + 44) * 0.4, c: '#f6f9f7' });
    return o;
  })();

  function Rocks() {
    const rock = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
    const ball = useMemo(() => new THREE.SphereGeometry(1, 8, 5), []);
    const m1 = useStd({ roughness: 1 });
    const m2 = useStd({ roughness: 0.6 });
    return (
      <group>
        <Inst geo={rock} mat={m1} items={ROCKS} cast />
        <Inst geo={ball} mat={m2} items={FOAM} />
      </group>
    );
  }

  /** Small wooden ferry boats with a standing boatman. */
  function Boat({ p, ry = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[2.4, 0.28, 0.7]} p={[0, 0.06, 0]} m={M.plain('#7a4a2a', { roughness: 0.9 })} />
        <Box s={[0.5, 0.2, 0.5]} p={[1.3, 0.2, 0]} r={[0, 0.78, 0]} m={M.plain('#7a4a2a', { roughness: 0.9 })} />
        <Cyl rt={0.07} rb={0.09} h={0.34} p={[0.1, 0.42, 0]} m={M.plain('#e27d2a')} seg={8} />
        <Ball rad={0.075} p={[0.1, 0.66, 0]} m={M.plain('#8a5a3c')} />
      </group>
    );
  }

  /** The tall pale 3-4 storey guesthouse on the stone embankment at the confluence (photo 2). */
  function BankHouse({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[3.8, 2.0, 3.0]} p={[0, -0.6, 0]} m={M.plain('#a9a291', { roughness: 0.95 })} />
        <Box s={[3.6, 1.2, 2.8]} p={[0, 0.2, 0]} m={M.mat('stone', 3, 1, { color: '#bdb5a5' })} />
        <Box s={[2.8, 3.3, 2.2]} p={[0, 2.45, 0]} m={M.plain('#efe7bd')} />
        {[0, 1, 2].map((i) => <Box key={i} s={[2.85, 0.14, 2.25]} p={[0, 1.4 + i * 1.05, 0]} m={M.plain('#b5362a')} cast={false} />)}
        {[0, 1, 2].map((i) => <Box key={`w${i}`} s={[2.0, 0.42, 2.3]} p={[0, 1.8 + i * 1.05, 0]} m={M.plain('#3a4756', { roughness: 0.3 })} cast={false} />)}
        <Roof w={3.3} d={2.7} h={0.55} y={4.1} m={M.plain('#b5362a', { roughness: 0.6 })} sag={1.1} lift={0.05} />
      </group>
    );
  }

  /** Small Shiva shrine at the water with trident. */
  function WaterShrine({ p, ry = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[1.5, 0.25, 1.5]} p={[0, 0, 0]} m={M.stone} />
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => <Box key={i} s={[0.1, 0.9, 0.1]} p={[x, 0.55, z]} m={wallOrange(M)} />)}
        <Roof w={1.5} d={1.5} h={0.4} y={1.0} m={roofMetal(M, 'red')} sag={1.3} lift={0.15} />
        <Lingam p={[0, 0.12, 0]} />
        <Trident p={[0.9, 0.1, 0.7]} h={1.4} />
      </group>
    );
  }

  /** Bells and prayer-ribbons strung on a line in front of a pagoda. */
  function BellLine({ a, b, n = 9 }) {
    const M = useM();
    const items = useMemo(() => Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      return { p: [mix(a[0], b[0], t), mix(a[1], b[1], t) - Math.sin(t * Math.PI) * 0.35 - 0.1, mix(a[2], b[2], t)], s: [0.06, 0.22 + rn(i) * 0.12, 0.06], c: ['#7a3f24', '#d8a010', '#b5362a', '#3a3a3a'][i % 4] };
    }), [a, b, n]);
    const bx = useBox();
    const mm = useStd({ roughness: 0.7 });
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
    return (
      <group>
        <Box s={[0.012, 0.012, len]} p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.08, (a[2] + b[2]) / 2]} r={[0, ang, 0]} m={M.dark} cast={false} />
        <Inst geo={bx} mat={mm} items={items} />
      </group>
    );
  }

  /** Soft winter mist drifting over the water. */
  function Mist() {
    const tex = useMemo(() => {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 128;
      const g = cv.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(235,240,236,0.55)'); gr.addColorStop(1, 'rgba(235,240,236,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(cv);
    }, []);
    const spots = [[24, -3, 18, 9], [14, -16, 20, 7], [-20, -17, 16, 5]];
    return (
      <group>
        {spots.map(([u, v, w, d], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[u, 0.55 + i * 0.05, v]}>
            <planeGeometry args={[w, d]} />
            <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.45} />
          </mesh>
        ))}
      </group>
    );
  }

  /** Lamp posts along the lane and bridge rail; lit at dusk. */
  const LAMPS = (() => {
    const o = [];
    for (let u = -14; u <= 9; u += 3.8) o.push({ p: [u, gmax(u, LANE(u) - 0.9, 0.4), LANE(u) - 0.9], s: [0.5, 0.5, 0.5], c: '#ffffff' });
    return o;
  })();
  function Lamps() {
    const M = useM();
    const bx = useBox();
    const ball = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
    const bulb = glowMat('lamp', '#fff0c0', '#ffd070', 0.15, 3.0);
    const bridgeBulbs = useMemo(() => {
      const o = [];
      for (let u = BR_U0 + 1; u < BR_U1; u += 1.6) { o.push({ p: [u, BR_Y + 1.1, BR_V - 0.86], s: [0.07, 0.07, 0.07] }); o.push({ p: [u + 0.8, BR_Y + 1.1, BR_V + 0.86], s: [0.07, 0.07, 0.07] }); }
      return o;
    }, []);
    const mp = useStd({ roughness: 0.6, color: '#3a3a3a' });
    return (
      <group>
        <Inst geo={bx} mat={mp} items={LAMPS.map((l) => ({ p: l.p, s: [0.07, 1.5, 0.07] }))} />
        <Inst geo={ball} mat={bulb} items={LAMPS.map((l) => ({ p: [l.p[0], l.p[1] + 1.55, l.p[2]], s: [0.16, 0.16, 0.16] }))} />
        <group position={[BR_CX, 0, BR_CZ]} rotation={[0, BR_TH, 0]}><Inst geo={ball} mat={bulb} items={bridgeBulbs} /></group>
      </group>
    );
  }

  /** Paved lane along the crest front. */
  function Lane() {
    const M = useM();
    const segs = Array.from({ length: 10 }, (_, i) => {
      const u0 = -16 + i * 2.8, u1 = u0 + 2.8;
      const v0 = LANE(u0), v1 = LANE(u1);
      const um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
      return { um, vm, len: Math.hypot(u1 - u0, v1 - v0), ang: Math.atan2(v1 - v0, u1 - u0), y: gmax(um, vm, 0.5) };
    });
    return (
      <group>
        {segs.map((s, i) => <Box key={i} s={[s.len + 0.08, 0.2, 1.25]} p={[s.um, s.y - 0.06, s.vm]} r={[0, -s.ang, 0]} m={M.plain('#b3a58c', { roughness: 1 })} cast={false} />)}
      </group>
    );
  }

  /* ------------------------------------------------------------------ the main scene */
  const TEMP_Y = {};
  const yAt = (key, u, v, r) => { if (!TEMP_Y[key]) TEMP_Y[key] = gmax(u, v, r) - 0.02; return TEMP_Y[key]; };
  const PLAZA_Y = yAt('plaza', -0.2, 0.2, 3.0);

  function DevghatMain() {
    const M = useM();
    const Y = (key, u, v, r) => yAt(key, u, v, r);
    const y3 = Y('p3', -7.2, -2.6, 2.4);
    return (
      <group rotation={[0, Math.PI / 4, 0]}>
        {/* temple precinct on the crest: Bageshwori (orange base, white cone) and the white-domed shrine on a fenced plaza */}
        <Plaza p={[-0.5, PLAZA_Y, 0]} w={8.6} d={6.0} />
        <BellShrine p={[-2.4, PLAZA_Y + 0.1, -0.4]} s={1.15} />
        <DomeShrine p={[2.5, PLAZA_Y + 0.12, -0.8]} ry={-0.2} s={1.1} />
        {/* Vidyeshwar: orange-brick two-tier pagoda */}
        <Pagoda p={[-14.2, Y('p2', -14.2, 1.4, 2.4), 1.4]} tiers={2} brick roof="grey" s={1.1} />
        {/* the three-tier dark-roofed pagoda with its ritual tank and yellow-railed arched bridge */}
        <Pagoda p={[-8.0, y3, -3.4]} tiers={3} roof="dark" s={1.15} w={2.0} wh={1.15} />
        <TankBridge p={[-8.0, Y('tk', -8.0, 3.0, 2.0) + 0.02, 3.2]} s={0.9} />
        <BellLine a={[-11.8, y3 + 2.6, 0.2]} b={[-5.0, y3 + 2.9, 0.4]} n={10} />
        <Cyl rt={0.13} rb={0.17} h={1.4} p={[-4.8, y3 + 0.7, 0.8]} m={M.stone} seg={10} />
        {/* the Pashupati precinct: gold two-tier pagoda beside the lit arch gate, on the shoulder of the knoll */}
        <Pagoda p={[7.4, Y('pp', 7.4, -1.4, 2.2), -1.4]} tiers={2} roof="gold" led s={1.1} />
        <ArchGate p={[10.6, Y('gt', 10.6, 3.2, 2.4) - 0.1, 3.2]} s={0.75} />
        {/* small scattered shrines */}
        <Pagoda p={[-17.6, Y('s1', -17.6, -1.6, 1.4), -1.6]} tiers={2} s={0.6} roof="red" />
        <Pagoda p={[-3.5, Y('s2', -3.5, -6.2, 1.4), -6.2]} tiers={2} s={0.7} roof="dark" />
        <DomeShrine p={[4.4, Y('s3', 4.4, -6.0, 1.2), -6.0]} s={0.75} ry={0.3} />
        <Pagoda p={[-10.4, Y('s4', -10.4, -6.2, 1.4), -6.2]} tiers={2} s={0.6} roof="grey" brick />
        <Pagoda p={[8.6, Y('s5', 8.6, -5.2, 1.3), -5.2]} tiers={2} s={0.55} roof="red" />
        <DomeShrine p={[-9.8, Y('s6', -9.8, 6.4, 1.1), 6.4]} s={0.5} ry={0.2} />
        <WaterShrine p={[7.4, Y('ws', 7.4, 13.6, 1.0), 13.6]} ry={0.2} />
        <BankHouse p={[11.8, Y('bh', 11.8, -7.8, 1.8) + 0.05, -7.8]} />
        {/* houses, trees, lane */}
        <HouseSet L={HOUSES_BAKED} />
        <TreeSet L={TREES} />
        <Lane />
        <Ghat />
        <Pilgrims />
        <Lamps />
        <GlowDriver />
        <Mist />
        <PrayerFlags from={[-4.4, PLAZA_Y + 2.6, 3.2]} to={[3.4, PLAZA_Y + 2.6, 3.2]} n={16} />
        <PrayerFlags from={[-13, Y('p2', -14.2, 1.4, 2.4) + 2.8, 4.4]} to={[-4.4, PLAZA_Y + 2.6, 3.2]} n={12} />
        <Rocks />
        <group position={[BR_CX, 0, BR_CZ]} rotation={[0, BR_TH, 0]}><Bridge /></group>
        <Boat p={[21, -0.02, 6.6]} ry={1.5} />
        <Boat p={[17, -0.02, 19.5]} ry={1.7} />
        <Boat p={[27.6, -0.02, -12.0]} ry={0.3} />
        <pointLight position={[-0.4, PLAZA_Y + 2.5, 1.2]} intensity={1.2} distance={7} color="#ffb35a" />
        <pointLight position={[10.4, 8.5, 2.6]} intensity={1.6} distance={8} color="#ffcf6a" />
      </group>
    );
  }

  function DevghatMainWrap() {
    const pts = [[-15, 6, 10], [-15, -8, 10], [11, 6, 10], [11, -8, 10]];
    return (
      <group>
        <DevghatMain />
        {/* camera framing (world coordinates): knoll with its temples, the confluence and the bridge */}
        {pts.map(([u, v, h], i) => <Frame key={i} s={[0.2, h, 0.2]} p={wxz(u, v, h / 2)} />)}
      </group>
    );
  }

  /** blue-grey gradient sky dome (clear, slightly hazy near the horizon) */
  function Sky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(150, 24, 14);
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const top = new THREE.Color('#4f7fb0'), mid = new THREE.Color('#8fb0c8'), hor = new THREE.Color('#d6e0e2');
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) {
        const t = Math.max(0, p.getY(i) / 150);
        c.copy(hor).lerp(mid, sm(0, 0.25, t)).lerp(top, sm(0.2, 0.8, t));
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>;
  }

  function DevghatEnv() {
    return (
      <group>
        <Sky />
        <group rotation={[0, Math.PI / 4, 0]}>
        <Terrain />
        <Water />
        <TreeSet L={FOREST} cast={false} />
        <HouseSet L={FAR_BAKED} />
        </group>
      </group>
    );
  }

  return { 'devghat-dham': { Main: DevghatMainWrap, Env: DevghatEnv } };
}
