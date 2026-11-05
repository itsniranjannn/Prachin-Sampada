// Hand-built landmarks: Bhaktapur, Taumadhi and Tachupal squares, Changu, and the Kathmandu-valley edge shrines.
import { useMemo } from 'react';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Spire, Tree, THREE, Frame, Water, roofMat, GUARDS, Garuda, Lion, Elephant, Wrestler, Goddess, Griffin,
    PrayerFlags, PrayerWheels, eyesTexture, Nandi, Lingam, Trident, Chaitya, Monkey, BellPavilion, ringOf } = K;

  /* ================= helpers ================= */
  const R = (i, k = 0) => { const r = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return r - Math.floor(r); };
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * (1 + k)))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };
  const cv = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return t;
  };
  const bricks = (g, w, h, base, rows = 18, cols = 9, seed = 1) => {
    g.fillStyle = '#9b7a66'; g.fillRect(0, 0, w, h);
    const bh = h / rows; const bw = w / cols;
    for (let r = 0; r < rows; r += 1) {
      for (let c = -1; c < cols; c += 1) {
        g.fillStyle = shade(base, (R(r * 31 + c, seed) - 0.5) * 0.3);
        g.fillRect(c * bw + (r % 2) * bw / 2 + 1, r * bh + 1, bw - 2, bh - 2);
      }
    }
  };
  const latticeWin = (g, x, y, w, h, frame = '#4a2a16') => {
    g.fillStyle = frame; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = '#170d07'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#8f5a2c'; g.lineWidth = 2;
    const n = Math.max(2, Math.round(w / 7));
    for (let i = 1; i < n; i += 1) { g.beginPath(); g.moveTo(x + (i * w) / n, y); g.lineTo(x + (i * w) / n, y + h); g.stroke(); }
    g.beginPath(); g.moveTo(x, y + h * 0.4); g.lineTo(x + w, y + h * 0.4); g.stroke();
  };
  const FAC = new Map();
  /** Painted brick house front: storeys of lattice windows, shop openings below. Cached per kind. */
  const facadeMat = (st, base, cols, plaster) => {
    const key = `${st}|${base}|${cols}|${plaster}`;
    if (!FAC.has(key)) {
      const t = cv(256, 96 * st, (g, w, h) => {
        if (plaster) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i += 1) { g.fillStyle = `rgba(0,0,0,${R(i, 3) * 0.05})`; g.fillRect(R(i, 1) * w, R(i, 2) * h, 30, 4); } } else bricks(g, w, h, base, 8 * st, 8, st);
        const sh = h / st;
        for (let s = 0; s < st; s += 1) {
          const y0 = h - (s + 1) * sh;
          g.fillStyle = '#3a2416'; g.fillRect(0, y0, w, 5);
          for (let k = 0; k < cols; k += 1) {
            const x = ((k + 0.5) * w) / cols; const ww = (w / cols) * 0.5;
            if (s === 0) { g.fillStyle = '#1b0f08'; g.fillRect(x - ww * 0.6, y0 + sh * 0.32, ww * 1.2, sh * 0.68); } else latticeWin(g, x - ww / 2, y0 + sh * 0.25, ww, sh * 0.5);
          }
        }
      });
      FAC.set(key, new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
    }
    return FAC.get(key);
  };
  const useCMat = (key, w, h, draw) => useMemo(() => new THREE.MeshStandardMaterial({ map: cv(w, h, draw), roughness: 0.9 }), [key]); // eslint-disable-line

  let PAVER = null;
  /** Sandy herringbone brick paving of the Bhaktapur squares. */
  const paverMat = (rep = 40) => {
    if (!PAVER) {
      const t = cv(256, 256, (g, w, h) => {
        g.fillStyle = '#c99a6c'; g.fillRect(0, 0, w, h);
        for (let r = 0; r < 32; r += 1) {
          for (let c = 0; c < 16; c += 1) {
            g.fillStyle = shade('#d9ab7c', (R(r * 17 + c, 9) - 0.5) * 0.22);
            const x = c * 16; const y = r * 8;
            if ((r + c) % 2) g.fillRect(x + 1, y + 1, 14, 6); else { g.fillRect(x + 4, y, 8, 8); g.fillStyle = 'rgba(120,80,50,0.25)'; g.fillRect(x + 4, y, 1, 8); }
          }
        }
      });
      t.repeat.set(rep, rep);
      PAVER = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    }
    return PAVER;
  };

  const CM = new Map();
  /** Cached canvas-painted material (not a hook), with an optional texture repeat. */
  const cmat = (key, w, h, draw, rep = [1, 1], opts = {}) => {
    if (!CM.has(key)) {
      const t = cv(w, h, draw); t.repeat.set(rep[0], rep[1]);
      CM.set(key, new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, ...opts }));
    }
    return CM.get(key);
  };
  /** Moss-stained clay tile, as on the Taumadhi and Bagmati-bank temples. */
  const mossRoof = (rep = 3) => cmat(`moss${rep}`, 256, 256, (g, w, h) => {
    g.fillStyle = '#5e4a36'; g.fillRect(0, 0, w, h);
    const rows = 16; const th = h / rows; const tw = w / 14;
    for (let r = 0; r < rows; r += 1) for (let c = -1; c < 14; c += 1) {
      g.fillStyle = shade(R(r * 13 + c, 4) > 0.5 ? '#7a5a40' : '#654a34', (R(r * 7 + c, 5) - 0.5) * 0.3);
      g.fillRect(c * tw + (r % 2) * tw / 2 + 1, r * th + 1, tw - 2, th - 2);
    }
    for (let i = 0; i < 130; i += 1) {
      g.fillStyle = `rgba(${58 + R(i, 6) * 24},${86 + R(i, 7) * 26},40,${0.12 + R(i, 8) * 0.25})`;
      g.beginPath(); g.ellipse(R(i, 1) * w, R(i, 2) * h, 6 + R(i, 3) * 22, 3 + R(i, 4) * 8, 0, 0, 7); g.fill();
    }
  }, [rep, rep]);
  /** Aged terracotta tile with darker, soot-stained courses: the palace and temple roofs. */
  const terraRoof = (base = '#a8704c', rep = 1) => cmat(`terra${base}${rep}`, 256, 256, (g, w, h) => {
    g.fillStyle = '#4a3024'; g.fillRect(0, 0, w, h);
    const rows = 18; const th = h / rows; const tw = w / 16;
    for (let r = 0; r < rows; r += 1) for (let c = -1; c < 16; c += 1) {
      g.fillStyle = shade(base, (R(r * 17 + c, 6) - 0.5) * 0.34);
      g.fillRect(c * tw + (r % 2) * tw / 2 + 0.5, r * th + 0.5, tw - 1.5, th - 1.5);
      g.fillStyle = 'rgba(30,16,10,0.28)'; g.fillRect(c * tw + (r % 2) * tw / 2 + 0.5, r * th + th * 0.7, tw - 1.5, th * 0.3);
    }
    for (let i = 0; i < 60; i += 1) { g.fillStyle = `rgba(60,70,36,${0.08 + R(i, 7) * 0.14})`; g.fillRect(R(i, 1) * w, R(i, 2) * h, 8 + R(i, 3) * 20, 3 + R(i, 4) * 5); }
  }, [rep, rep]);
  /** Weathered grey-brown stone blocks with soot streaks and lichen: the Vatsala shikhara. */
  const greyStone = (rep = 2) => cmat(`gstone${rep}`, 256, 256, (g, w, h) => {
    g.fillStyle = '#5c584e'; g.fillRect(0, 0, w, h);
    const rows = 10; const bh = h / rows;
    for (let r = 0; r < rows; r += 1) {
      let x = -R(r, 2) * 40;
      while (x < w) { const bw = 36 + R(r + x, 3) * 40; g.fillStyle = shade('#8c877a', (R(r * 11 + x, 4) - 0.5) * 0.3); g.fillRect(x + 1.5, r * bh + 1.5, bw - 3, bh - 3); x += bw; }
    }
    for (let i = 0; i < 40; i += 1) { g.fillStyle = `rgba(24,22,18,${0.05 + R(i, 5) * 0.14})`; g.fillRect(R(i, 1) * w, R(i, 2) * h * 0.6, 3 + R(i, 3) * 5, 40 + R(i, 4) * 100); }
    for (let i = 0; i < 90; i += 1) { g.fillStyle = `rgba(120,130,56,${0.1 + R(i, 7) * 0.2})`; g.fillRect(R(i, 8) * w, R(i, 9) * h, 3 + R(i, 1) * 6, 2 + R(i, 2) * 4); }
  }, [rep, rep], { roughness: 1 });
  /** Tile roof in gilded copper: gold shingles that still read as tiles. */
  const goldRoof = () => cmat('goldroof', 256, 256, (g, w, h) => {
    g.fillStyle = '#8a6214'; g.fillRect(0, 0, w, h);
    const rows = 14; const th = h / rows; const tw = w / 12;
    for (let r = 0; r < rows; r += 1) for (let c = -1; c < 12; c += 1) {
      g.fillStyle = shade(R(r * 9 + c, 2) > 0.4 ? '#e0b240' : '#c99a2c', (R(r * 5 + c, 3) - 0.5) * 0.22);
      g.fillRect(c * tw + (r % 2) * tw / 2 + 1, r * th + 1, tw - 2, th - 2);
    }
  }, [4, 4], { metalness: 0.35, roughness: 0.5, emissive: '#3a2608', emissiveIntensity: 0.6 });
  /** Painted temple wall: brick with timber bands, lattice windows and (ground storey) a gilt-framed door. */
  const carvedWall = (kind, base = '#a24d38') => cmat(`cw${kind}${base}`, 512, 256, (g, w, h) => {
    if (kind === 'cream') { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 50; i += 1) { g.fillStyle = `rgba(90,60,30,${R(i, 3) * 0.06})`; g.fillRect(R(i, 1) * w, R(i, 2) * h, 40, 5); } } else bricks(g, w, h, base, 14, 14, kind.length);
    g.fillStyle = '#2c180d'; g.fillRect(0, 0, w, 18); g.fillRect(0, h - 18, w, 18);
    g.fillStyle = '#8f5a2c'; for (let x = 6; x < w; x += 14) { g.fillRect(x, 5, 7, 8); g.fillRect(x, h - 13, 7, 8); }
    if (kind === 'ground' || kind === 'cream') {
      const dw = 104; const dx = w / 2 - dw / 2;
      g.fillStyle = '#c9a038'; g.fillRect(dx - 12, 52, dw + 24, h - 70);
      g.fillStyle = '#1b0e07'; g.fillRect(dx, 62, dw, h - 80);
      g.strokeStyle = '#8f5a2c'; g.lineWidth = 3;
      for (let k = 1; k < 5; k += 1) { g.beginPath(); g.moveTo(dx + (k * dw) / 5, 62); g.lineTo(dx + (k * dw) / 5, h - 18); g.stroke(); }
      g.fillStyle = '#c9a038'; g.beginPath(); g.arc(w / 2, 56, dw / 2 + 12, Math.PI, 0); g.fill();
      g.fillStyle = '#7a2a1a'; g.beginPath(); g.arc(w / 2, 56, dw / 2 - 4, Math.PI, 0); g.fill();
      [0.13, 0.29, 0.71, 0.87].forEach((f) => latticeWin(g, w * f - 28, 62, 56, 108));
    } else [0.17, 0.5, 0.83].forEach((f) => latticeWin(g, w * f - 36, 44, 72, 100));
  }, [1, 1]);
  /** Painted storeys of a brick house front: shared by Bld (one house) and LongHall (a whole range). */
  function paintFacade(g, w, h, st, base, cols, plaster) {
    if (plaster) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i += 1) { g.fillStyle = `rgba(0,0,0,${R(i, 3) * 0.05})`; g.fillRect(R(i, 1) * w, R(i, 2) * h, 30, 4); } } else bricks(g, w, h, base, 8 * st, 8, st);
    const sh = h / st;
    for (let s = 0; s < st; s += 1) {
      const y0 = h - (s + 1) * sh;
      g.fillStyle = '#3a2416'; g.fillRect(0, y0, w, 5);
      for (let k = 0; k < cols; k += 1) {
        const x = ((k + 0.5) * w) / cols; const ww = (w / cols) * 0.5;
        if (s === 0) { g.fillStyle = '#1b0f08'; g.fillRect(x - ww * 0.6, y0 + sh * 0.32, ww * 1.2, sh * 0.68); } else latticeWin(g, x - ww / 2, y0 + sh * 0.25, ww, sh * 0.5);
      }
    }
  }
  /** One long brick range of shops and houses under a continuous hipped tile roof (the ringing buildings of the squares). */
  function LongHall({ p = [0, 0, 0], r = 0, L = 24, st = 3, base = '#b8664a', d = 2.6, roof = '#8a5e4c', plaster = false }) {
    const M = useM();
    const sh = 0.8; const cols = Math.max(4, Math.round(L / 1.5));
    const fm = cmat(`rng${st}|${base}|${cols}|${plaster}`, 256 * Math.min(8, Math.ceil(cols / 3)), 96 * st, (g, w, h) => paintFacade(g, w, h, st, base, cols, plaster));
    const side = M.mat('brick', 2, st, { color: lighten(base) });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[L, sh * st, d]} p={[0, (sh * st) / 2, 0]} m={[side, side, side, side, fm, fm]} />
        <Box s={[L + 0.3, 0.1, d + 0.3]} p={[0, sh * st + 0.02, 0]} m={M.plain('#3a2416')} cast={false} />
        <Roof w={L + 0.9} d={d + 1.0} h={0.6 + st * 0.12} y={sh * st} m={M.mat('roof', Math.max(3, L / 4), 2, { color: roof })} sag={1.15} lift={0.04} fascia={false} />
      </group>
    );
  }
  /** Newar house, two meshes: a painted front and a tiled roof. Faces +z. */
  function Bld({ p = [0, 0, 0], r = 0, w = 2.8, d = 2.2, st = 3, base = '#b8664a', plaster = false, roof = '#8a5e4c', ov = 0.3 }) {
    const M = useM();
    const sh = 0.8;
    const fm = facadeMat(st, base, Math.max(2, Math.round(w / 0.9)), plaster);
    const side = plaster ? M.plain(base, { roughness: 0.9 }) : M.mat('brick', 2, st, { color: lighten(base) });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, sh * st, d]} p={[0, (sh * st) / 2, 0]} m={[side, side, side, side, fm, fm]} />
        <Roof w={w + ov * 2} d={d + ov * 2} h={0.5 + st * 0.06} y={sh * st} m={M.mat('roof', 2, 2, { color: roof })} sag={1.2} lift={0.08} fascia={false} />
      </group>
    );
  }
  const lighten = (hex, k = 0.55) => K.lighten(hex, k) || '#f0c2a8';
  const HB = ['#b8664a', '#c07a55', '#a85a42', '#c48a64', '#b06a4c'];
  /** A run of houses along local x, centred on the group origin. */
  function Row({ x = 0, z = 0, ry = 0, n = 8, step = 3, seed = 1, smin = 2, smax = 4, plasterP = 0.25 }) {
    return (
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        {Array.from({ length: n }, (_, i) => {
          const st = smin + Math.floor(R(i, seed) * (smax - smin + 1));
          const pl = R(i, seed + 7) < plasterP;
          return <Bld key={i} p={[(i - (n - 1) / 2) * step, 0, 0]} w={step - 0.08} d={2.2 + R(i, seed + 3) * 0.6} st={st} plaster={pl} base={pl ? ['#efe6d6', '#e8dcc4', '#f2ede2'][i % 3] : HB[(i + seed) % HB.length]} roof={['#8a5e4c', '#9a6650', '#7d5444'][i % 3]} />;
        })}
      </group>
    );
  }
  const front = (a) => Math.cos(a - 0.9) > 0.35;
  function Hills({ r = 62, snow = true, seed = 1, h = 9, col = '#86a05e', n = 15 }) {
    const M = useM();
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 + R(i, seed) * 0.3;
          const rr = r + R(i, seed + 1) * 10;
          const hh = h * (0.6 + R(i, seed + 2) * 0.8);
          return <mesh key={i} position={[Math.cos(a) * rr, -1, Math.sin(a) * rr]} scale={[9 + R(i, 4) * 6, hh, 9 + R(i, 5) * 6]} material={M.mat('grass', 4, 2, { color: i % 3 ? col : '#9ab874' })}><sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>;
        })}
        {snow && [[-30, -92, 17, 24], [-8, -100, 22, 30], [18, -96, 19, 26], [40, -88, 14, 19], [-52, -80, 14, 18]].map(([x, z, rr, hh], k) => (
          <group key={`s${k}`} position={[x, -1, z]}>
            <mesh material={M.mat('rock', 4, 4, { color: '#8a8a92' })}><coneGeometry args={[rr, hh, 7]} /></mesh>
            <mesh position={[0, hh * 0.3, 0]} material={M.plain('#f6f7fb', { roughness: 0.6 })}><coneGeometry args={[rr * 0.44, hh * 0.44, 7]} /></mesh>
          </group>
        ))}
      </group>
    );
  }
  function Floor({ r = 40, tint = '#f2d6c0', rx = 34, mat }) {
    const M = useM();
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={mat || M.mat('herring', rx, rx, { color: tint })}><circleGeometry args={[r, 64]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={M.mat('grass', 30, 30, { color: '#b8c890' })}><circleGeometry args={[120, 48]} /></mesh>
      </group>
    );
  }
  /** Stack of solid steps rising from (z0, y0) to (z1, y1) along -z. */
  function Stairs({ w, x = 0, z0, z1, y0 = 0, y1, n, m }) {
    const run = (z0 - z1) / n;
    return (
      <group>
        {Array.from({ length: n }, (_, k) => {
          const hh = y0 + ((k + 1) * (y1 - y0)) / n;
          return <Box key={k} s={[w, hh, run + 0.02]} p={[x, hh / 2, z0 - (k + 0.5) * run]} m={m} />;
        })}
      </group>
    );
  }
  /** Merged carved eave struts (tunala) slanting from the wall up to the roof edge. */
  const strutGeo = (w, d, dens, h, sw = 0.07) => {
    const parts = [];
    const o = h * 0.75;
    [[0, d / 2, w], [Math.PI, d / 2, w], [Math.PI / 2, w / 2, d], [-Math.PI / 2, w / 2, d]].forEach(([th, half, len]) => {
      const n = Math.max(2, Math.round(len * dens));
      for (let k = 0; k < n; k += 1) {
        const t = ((k + 0.5) / n - 0.5) * len * 0.94;
        const L = Math.hypot(h, o);
        const g = new THREE.BoxGeometry(sw, L, sw);
        g.rotateX(Math.atan2(o, h));
        g.translate(t, -h / 2, half + o / 2 - 0.02);
        g.rotateY(th);
        parts.push(g);
      }
    });
    return mergeGeometries(parts);
  };
  function Struts({ w, d, y, dens = 1.6, h = 0.55, m, sw = 0.07 }) {
    const g = useMemo(() => strutGeo(w, d, dens, h, sw), [w, d, dens, h, sw]);
    return <mesh geometry={g} material={m} position={[0, y, 0]} castShadow />;
  }
  /** Ring of slim posts, merged into one mesh (an open verandah). */
  function PostRing({ w, d, y = 0, h, n = 5, m, rad = 0.075 }) {
    const g = useMemo(() => {
      const parts = [];
      const add = (x, z) => { const c = new THREE.CylinderGeometry(rad * 0.85, rad, h, 8); c.translate(x, h / 2, z); parts.push(c); };
      for (let i = 0; i < n; i += 1) {
        const t = (i / (n - 1) - 0.5);
        add(t * w, d / 2); add(t * w, -d / 2);
        if (i > 0 && i < n - 1) { add(w / 2, t * d); add(-w / 2, t * d); }
      }
      add(w / 2, 0); add(-w / 2, 0);
      return mergeGeometries(parts);
    }, [w, d, h, n, rad]);
    return <mesh geometry={g} material={m} position={[0, y, 0]} castShadow />;
  }
  /* Upper-storey wall: brick with timber lattice windows, painted once per tier shape. */
  const UW = new Map();
  const upperWall = (base, cols, tall = 0.62) => {
    const key = `${base}|${cols}|${tall}`;
    if (!UW.has(key)) {
      UW.set(key, new THREE.MeshStandardMaterial({
        roughness: 0.9,
        map: cv(256, 128, (g, w, h) => {
          bricks(g, w, h, base, 10, 8, cols);
          g.fillStyle = '#3a2416'; g.fillRect(0, h - 7, w, 7); g.fillRect(0, 0, w, 7);
          for (let k = 0; k < cols; k += 1) {
            const ww = (w / cols) * 0.5; const x = ((k + 0.5) * w) / cols - ww / 2;
            latticeWin(g, x, h * (0.5 - tall / 2) + 4, ww, h * tall - 4);
          }
        }),
      }));
    }
    return UW.get(key);
  };
  /** Newar multi-roofed pagoda. tiers: [{w,d,wh,ov,rh}] bottom to top. Faces +z. */
  function Pag({ tiers, y0 = 0, base = '#c0704f', roofC = '#a87a5c', gold = false, porch = 0, fringe = null, cols = 3, finial = 1.2, sag = 1.45, strutC = '#5a3418', dens = 1.5, cluster = 0, wallM, doors = true, edgeC = '#3a2416', door4 = false, roofM, wallFor, sw = 0.07 }) {
    const M = useM();
    const wm = wallM || M.mat('brick', 3, 1, { color: lighten(base) });
    const rm = roofM || (gold ? M.gold : M.mat('roof', 3, 3, { color: roofC }));
    const sm = M.plain(strutC, { roughness: 0.8 });
    const out = [];
    let y = y0;
    tiers.forEach((t, i) => {
      const rw = t.w + 2 * t.ov; const rd = t.d + 2 * t.ov;
      if (i === 0 && porch) {
        const ins = 0.5;
        out.push(<Box key="core" s={[t.w - ins * 2, t.wh, t.d - ins * 2]} p={[0, y + t.wh / 2, 0]} m={wm} />);
        out.push(<PostRing key="posts" w={t.w - 0.3} d={t.d - 0.3} y={y} h={t.wh - 0.1} n={porch} m={M.plain('#6a3a1e', { roughness: 0.8 })} />);
        out.push(<Box key="beam" s={[t.w, 0.16, t.d]} p={[0, y + t.wh - 0.08, 0]} m={M.plain('#4a2a16')} />);
        if (doors) out.push(<Box key="dr" s={[0.9, t.wh * 0.72, 0.05]} p={[0, y + t.wh * 0.36, t.d / 2 - ins + 0.01]} m={M.plain('#2a150a')} />);
      } else {
        const tm = wallFor && wallFor(i);
        const um = tm || (i === 0 ? wm : upperWall(base, t.cols || cols));
        out.push(<Box key={`w${i}`} s={[t.w, t.wh, t.d]} p={[0, y + t.wh / 2, 0]} m={tm ? [tm, tm, tm, tm, tm, tm] : (i === 0 ? wm : [um, um, um, um, um, um])} />);
        if (i === 0 && doors) {
          (door4 ? [[0, t.d / 2, 0], [t.w / 2, 0, Math.PI / 2], [0, -t.d / 2, Math.PI], [-t.w / 2, 0, -Math.PI / 2]] : [[0, t.d / 2, 0]]).forEach(([dx, dz, dr], q) => out.push(
            <group key={'dr' + q} position={[dx, y, dz]} rotation={[0, dr, 0]}>
              <Box s={[1.0, t.wh * 0.66, 0.08]} p={[0, t.wh * 0.33, 0.02]} m={door4 ? M.gold : M.plain('#2a150a')} />
              <Box s={[0.66, t.wh * 0.56, 0.05]} p={[0, t.wh * 0.3, 0.06]} m={M.plain('#3a2010')} />
              {door4 && <mesh position={[0, t.wh * 0.66, 0.05]} material={M.gold}><torusGeometry args={[0.5, 0.06, 6, 20, Math.PI]} /></mesh>}
            </group>,
          ));
        }
        out.push(<Box key={`b${i}`} s={[t.w + 0.06, 0.1, t.d + 0.06]} p={[0, y + t.wh - 0.05, 0]} m={M.plain('#4a2a16')} cast={false} />);
      }
      out.push(<Struts key={`st${i}`} w={t.w} d={t.d} y={y + t.wh} dens={dens} h={Math.min(0.8, t.ov * 0.55)} m={sm} sw={sw} />);
      out.push(<Roof key={`r${i}`} w={rw} d={rd} h={t.rh} y={y + t.wh - 0.05} m={rm} sag={sag} fascia={false} lift={0.2} />);
      if (fringe) {
        const fm2 = M.plain(fringe, { roughness: 0.9 });
        const fy = y + t.wh - 0.02; const fr = rw * 0.5 - 0.1; const fd = rd * 0.5 - 0.1;
        out.push(<Box key={`f1${i}`} s={[rw - 0.3, 0.34, 0.05]} p={[0, fy, fd]} m={fm2} cast={false} />);
        out.push(<Box key={`f2${i}`} s={[rw - 0.3, 0.34, 0.05]} p={[0, fy, -fd]} m={fm2} cast={false} />);
        out.push(<Box key={`f3${i}`} s={[0.05, 0.34, rd - 0.3]} p={[fr, fy, 0]} m={fm2} cast={false} />);
        out.push(<Box key={`f4${i}`} s={[0.05, 0.34, rd - 0.3]} p={[-fr, fy, 0]} m={fm2} cast={false} />);
      } else {
        const em = M.plain(edgeC, edgeC === '#3a2416' ? {} : { metalness: 0.8, roughness: 0.4 });
        out.push(<Box key={`e1${i}`} s={[rw, 0.07, 0.06]} p={[0, y + t.wh - 0.06, rd / 2]} m={em} cast={false} />);
        out.push(<Box key={`e2${i}`} s={[rw, 0.07, 0.06]} p={[0, y + t.wh - 0.06, -rd / 2]} m={em} cast={false} />);
        out.push(<Box key={`e3${i}`} s={[0.06, 0.07, rd]} p={[rw / 2, y + t.wh - 0.06, 0]} m={em} cast={false} />);
        out.push(<Box key={`e4${i}`} s={[0.06, 0.07, rd]} p={[-rw / 2, y + t.wh - 0.06, 0]} m={em} cast={false} />);
      }
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz], k) => out.push(
        <mesh key={`bl${i}${k}`} position={[sx * rw * 0.48, y + t.wh - 0.2, sz * rd * 0.48]} material={M.gold}><coneGeometry args={[0.045, 0.15, 6]} /></mesh>,
      ));
      const nx = tiers[i + 1];
      if (nx) {
        const s = Math.max(nx.w / rw, nx.d / rd);
        y = y + t.wh - 0.05 + t.rh * (1 - s) ** sag - 0.05;
      } else y = y + t.wh - 0.05 + t.rh;
    });
    out.push(<Gajur key="fin" y={y - 0.05} s={finial} />);
    for (let k = 0; k < cluster; k += 1) {
      const a = (k / cluster) * Math.PI * 2;
      out.push(<Gajur key={`cl${k}`} y={y - 0.2} s={0.32} />);
      out.push(<group key={`cg${k}`} position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]}><Gajur y={y - 0.28} s={0.3} /></group>);
    }
    return <group>{out}</group>;
  }
  /** Guardian pair on a pedestal flanking a stair. */
  function GuardPair({ idx, x, y, z, sc = 1.4, m, rot = 0 }) {
    const G = GUARDS[Math.min(idx, GUARDS.length - 1)];
    return (
      <group>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * x, y, z]} rotation={[0, rot, 0]}>
            <Box s={[0.7 * sc * 0.8, 0.22, 0.6 * sc * 0.8]} p={[0, 0.11, 0]} m={m} />
            <group position={[0, 0.22, 0]} scale={sc}><G m={m} /></group>
          </group>
        ))}
      </group>
    );
  }

  /* ================= Bhaktapur Durbar Square ================= */
  const strS = (M) => M.mat('granite', 1, 1, { color: '#ffffff' });
  function paintGround55(g, w, h) {
    bricks(g, w, h, '#b9654a', 12, 40, 5);
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, 8);
    for (let k = 0; k < 20; k += 1) {
      const x = ((k + 0.5) * w) / 20;
      if (k === 3 || k === 12) { g.fillStyle = '#2b180c'; g.fillRect(x - 26, h * 0.28, 52, h * 0.72); g.fillStyle = '#6a3a1e'; g.fillRect(x - 20, h * 0.34, 40, h * 0.66); g.fillStyle = '#1a0e08'; g.fillRect(x - 1, h * 0.34, 2, h * 0.66); } else latticeWin(g, x - 17, h * 0.4, 34, 28);
    }
  }
  function paintMid55(g, w, h) {
    bricks(g, w, h, '#b9654a', 12, 40, 6);
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, 8);
    const slots = 15;
    for (let k = 0; k < slots; k += 1) {
      const x = ((k + 0.5) * w) / slots;
      if (k % 2 === 1) {
        g.fillStyle = '#4a2a16'; g.fillRect(x - 36, h * 0.28, 72, h * 0.66);
        g.beginPath(); g.moveTo(x - 44, h * 0.3); g.lineTo(x, h * 0.04); g.lineTo(x + 44, h * 0.3); g.closePath(); g.fill();
        g.fillStyle = '#7a4a26'; g.beginPath(); g.moveTo(x - 30, h * 0.28); g.lineTo(x, h * 0.12); g.lineTo(x + 30, h * 0.28); g.closePath(); g.fill();
        latticeWin(g, x - 28, h * 0.36, 56, h * 0.5, '#4a2a16');
      } else latticeWin(g, x - 16, h * 0.46, 32, 26);
    }
  }
  function paintTop55(g, w, h) {
    g.fillStyle = '#24160d'; g.fillRect(0, 0, w, h);
    const cw = w / 55;
    g.fillStyle = '#4a2c18'; g.fillRect(0, 0, w, 16);
    g.fillStyle = '#8a5a2c'; for (let x = 3; x < w; x += 9) g.fillRect(x, 3, 5, 9);
    for (let k = 0; k < 55; k += 1) {
      const x = k * cw;
      g.fillStyle = '#3e2615'; g.fillRect(x + 1, 22, cw - 2, h - 40);
      g.fillStyle = '#7a4c26'; g.beginPath(); g.moveTo(x + 1, 30); g.lineTo(x + cw / 2, 12); g.lineTo(x + cw - 1, 30); g.closePath(); g.fill();
      g.fillStyle = '#4a2c18'; g.beginPath(); g.moveTo(x + 6, 30); g.lineTo(x + cw / 2, 18); g.lineTo(x + cw - 6, 30); g.closePath(); g.fill();
      g.fillStyle = '#0f0805'; g.fillRect(x + 5, 34, cw - 10, h - 66);
      g.save(); g.beginPath(); g.rect(x + 5, 34, cw - 10, h - 66); g.clip();
      g.strokeStyle = '#a06c36'; g.lineWidth = 1.4;
      for (let i = -8; i < 10; i += 1) {
        g.beginPath(); g.moveTo(x + 5 + i * 6, 34); g.lineTo(x + 5 + i * 6 + (h - 66), h - 32); g.stroke();
        g.beginPath(); g.moveTo(x + 5 + i * 6 + (h - 66), 34); g.lineTo(x + 5 + i * 6, h - 32); g.stroke();
      }
      g.restore();
      g.fillStyle = '#6b4222'; g.fillRect(x + 2, h - 30, cw - 4, 8);
    }
    g.fillStyle = '#1e120a'; g.fillRect(0, h - 14, w, 14);
  }
  /** Row of pointed gable crests (one per window), corbel blocks and pedimented big-window hoods, merged to three meshes. */
  const palaceTrim = (L, D) => {
    const crest = []; const corbel = []; const hood = [];
    const cw = L / 55;
    for (let k = 0; k < 55; k += 1) {
      const c = new THREE.CylinderGeometry(0, cw * 0.46, 0.34, 4); c.rotateY(Math.PI / 4); c.scale(1, 1, 0.22);
      [1, -1].forEach((q) => { const g = c.clone(); g.translate(-L / 2 + (k + 0.5) * cw, 0.17, q * D / 2); crest.push(g); });
    }
    for (let k = 0; k < 40; k += 1) {
      const b = new THREE.BoxGeometry(0.1, 0.32, 0.5);
      [1, -1].forEach((q) => { const g = b.clone(); g.rotateX(q * 0.5); g.translate(-L / 2 + (k + 0.5) * (L / 40), 0, q * (D / 2 - 0.05)); corbel.push(g); });
    }
    for (let k = 1; k < 15; k += 2) {
      const x = -L / 2 + ((k + 0.5) * L) / 15;
      const ped = new THREE.CylinderGeometry(0, 0.5, 0.34, 4); ped.rotateY(Math.PI / 4); ped.scale(1.05, 1, 0.3); ped.translate(x, 0.38, 0.13);
      const sill = new THREE.BoxGeometry(0.86, 0.09, 0.2); sill.translate(x, -0.52, 0.1);
      const lt = new THREE.BoxGeometry(0.86, 0.08, 0.16); lt.translate(x, 0.2, 0.09);
      hood.push(ped, sill, lt);
    }
    return { crest: mergeGeometries(crest), corbel: mergeGeometries(corbel), hood: mergeGeometries(hood) };
  };
  /** The Palace of Fifty-five Windows: brick body, a pedimented middle storey and a projecting band of 55 dark carved windows under a deep rafter-eaved roof. */
  function Palace55({ L = 17, D = 3.4 }) {
    const M = useM();
    const bk = M.mat('brick', 5, 2, { color: '#f4c9b0' });
    const gnd = useCMat('p55g', 1024, 160, paintGround55);
    const mid = useCMat('p55m', 1024, 160, paintMid55);
    const top = useCMat('p55t', 2200, 192, paintTop55);
    const dk = M.plain('#3a2416', { roughness: 0.8 });
    const wood = M.plain('#5a3418', { roughness: 0.8 });
    const hoodM = M.plain('#4a2c18', { roughness: 0.8 });
    const tr = useMemo(() => palaceTrim(L, D + 0.7), [L, D]);
    const faces = (fm) => [bk, bk, bk, bk, fm, fm];
    const TD = D + 0.7; // depth of the projecting window band
    return (
      <group>
        <Box s={[L + 0.5, 0.3, D + 0.5]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[L, 1.1, D]} p={[0, 0.85, 0]} m={faces(gnd)} />
        <Box s={[L + 0.25, 0.12, D + 0.25]} p={[0, 1.46, 0]} m={dk} />
        <Box s={[L, 1.2, D]} p={[0, 2.1, 0]} m={faces(mid)} />
        {/* pedimented hoods over the big first-floor windows, front and back */}
        <mesh geometry={tr.hood} material={hoodM} position={[0, 2.12, D / 2 - 0.1]} castShadow />
        <mesh geometry={tr.hood} material={hoodM} position={[0, 2.12, -D / 2 + 0.1]} rotation={[0, Math.PI, 0]} castShadow />
        {/* stepped cornice and corbels carrying the projecting carved-window band */}
        <Box s={[L + 0.3, 0.12, D + 0.3]} p={[0, 2.76, 0]} m={dk} />
        <mesh geometry={tr.corbel} material={wood} position={[0, 2.92, 0]} castShadow />
        <Box s={[L + 0.55, 0.14, TD + 0.1]} p={[0, 3.04, 0]} m={dk} />
        <Box s={[L + 0.4, 1.35, TD]} p={[0, 3.78, 0]} m={[wood, wood, wood, wood, top, top]} />
        <Box s={[L + 0.6, 0.12, TD + 0.14]} p={[0, 4.5, 0]} m={dk} />
        <mesh geometry={tr.crest} material={M.plain('#6b4222', { roughness: 0.85 })} position={[0, 4.55, 0]} castShadow />
        {/* deep rafter eaves, tiled roof and the red fringe along the edge */}
        <Struts w={L + 0.6} d={TD + 0.1} y={4.58} dens={2.6} h={1.0} sw={0.1} m={wood} />
        <Roof w={L + 2.4} d={TD + 2.4} h={0.8} y={4.5} m={terraRoof('#b07048', 0.45)} sag={1.1} lift={0.04} fascia={false} />
        <Box s={[L + 2.3, 0.1, 0.1]} p={[0, 4.46, (TD + 2.4) / 2]} m={dk} cast={false} />
        <Box s={[L + 2.0, 0.34, 0.05]} p={[0, 4.26, (TD + 2.4) / 2 - 0.08]} m={M.plain('#b3262a', { roughness: 0.9 })} cast={false} />
        <Box s={[L + 2.0, 0.34, 0.05]} p={[0, 4.26, -(TD + 2.4) / 2 + 0.08]} m={M.plain('#b3262a', { roughness: 0.9 })} cast={false} />
        <Box s={[0.05, 0.34, TD + 2.0]} p={[(L + 2.4) / 2 - 0.08, 4.26, 0]} m={M.plain('#b3262a', { roughness: 0.9 })} cast={false} />
        <Box s={[0.05, 0.34, TD + 2.0]} p={[-(L + 2.4) / 2 + 0.08, 4.26, 0]} m={M.plain('#b3262a', { roughness: 0.9 })} cast={false} />
        {[-1, 1].map((k) => <Box key={k} s={[0.9, 0.5, 0.7]} p={[k * 6.5, 0.55, D / 2 + 0.5]} m={M.stone} />)}
        {[-1, 1].map((k) => <group key={`l${k}`} position={[k * 6.5, 0.8, D / 2 + 0.5]} scale={1.3}><Lion m={M.stone} /></group>)}
      </group>
    );
  }
  function GGate({ s = 1 }) {
    const M = useM();
    const gd = M.plain('#c8922a', { metalness: 0.8, roughness: 0.45 });
    const brick = M.mat('brick', 3, 3, { color: '#f4c9b0' });
    const arcAng = (n, a0, a1) => Array.from({ length: n }, (_, i) => a0 + ((a1 - a0) * i) / (n - 1));
    return (
      <group scale={s}>
        <Box s={[4.4, 0.16, 1]} p={[0, 0.08, 0]} m={M.stone} />
        <Box s={[4.2, 3.3, 0.7]} p={[0, 1.81, 0]} m={brick} />
        {[0, 1].map((k) => <Box key={k} s={[1.7, 0.1 + k * 0.1, 0.5]} p={[0, 0.2 + k * 0.1, 0.55]} m={M.stone} />)}
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.16, 1.5, 0.16]} p={[k * 0.62, 0.95, 0.4]} m={M.gold} />
            <Box s={[0.07, 1.3, 0.2]} p={[k * 0.72, 0.9, 0.38]} m={gd} />
            <Box s={[0.4, 0.95, 0.05]} p={[k * 1.58, 1.65, 0.37]} m={gd} />
            <mesh position={[k * 1.58, 2.12, 0.37]} material={gd}><circleGeometry args={[0.2, 14, 0, Math.PI]} /></mesh>
            <group position={[k * 1.12, 1.62, 0.42]} rotation={[0, k * -0.5, 0]} scale={1.1}><Griffin m={M.gold} /></group>
          </group>
        ))}
        <Box s={[1.05, 1.45, 0.05]} p={[0, 0.9, 0.34]} m={M.plain('#150b06')} />
        <Box s={[1.48, 0.15, 0.2]} p={[0, 1.66, 0.4]} m={M.gold} />
        <Box s={[2.4, 0.2, 0.26]} p={[0, 1.8, 0.4]} m={gd} />
        {Array.from({ length: 18 }, (_, i) => <Ball key={i} rad={0.05} p={[-1.1 + i * 0.13, 1.93, 0.52]} m={M.gold} />)}
        <group position={[0, 1.9, 0.42]} scale={1.16}>
          <mesh position={[0, 0, -0.02]} material={gd}><circleGeometry args={[1.08, 28, 0, Math.PI]} /></mesh>
          <mesh material={M.gold}><torusGeometry args={[1.04, 0.09, 8, 30, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.02]} material={gd}><torusGeometry args={[0.84, 0.06, 8, 30, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.03]} material={M.gold}><torusGeometry args={[0.64, 0.05, 8, 30, Math.PI]} /></mesh>
          <mesh position={[0, 0, 0.01]} material={M.plain('#a97820', { metalness: 0.8, roughness: 0.5 })}><circleGeometry args={[0.62, 24, 0, Math.PI]} /></mesh>
          {arcAng(17, 0.12, Math.PI - 0.12).map((a, i) => <Ball key={i} rad={0.065} p={[Math.cos(a) * 1.16, Math.sin(a) * 1.16, 0.03]} m={M.gold} />)}
          {[0.45, 0.95, 2.2, 2.7].map((a, i) => <mesh key={i} position={[Math.cos(a) * 0.94, Math.sin(a) * 0.94, 0.07]} material={M.gold}><torusGeometry args={[0.12, 0.034, 6, 14]} /></mesh>)}
          <group position={[0, 0.1, 0.1]} scale={1.05}>
            <Box s={[0.22, 0.34, 0.1]} p={[0, 0.2, 0]} m={M.gold} />
            <Ball rad={0.085} p={[0, 0.47, 0]} m={M.gold} />
            <mesh position={[0, 0.6, 0]} material={M.gold}><coneGeometry args={[0.07, 0.14, 8]} /></mesh>
            <mesh position={[0, 0.3, -0.04]} material={gd}><torusGeometry args={[0.26, 0.025, 6, 20]} /></mesh>
            {[-4, -3, -2, -1, 1, 2, 3, 4].map((q) => <Cyl key={q} rt={0.013} h={0.36} p={[Math.sin(q * 0.27) * 0.21, 0.25 + Math.cos(q * 0.27) * 0.12, 0.02]} r={[0, 0, -q * 0.27]} m={M.gold} seg={5} />)}
            <Box s={[0.4, 0.06, 0.12]} p={[0, 0.02, 0]} m={M.gold} />
          </group>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 0.42, 0.18, 0.08]}>
              <Box s={[0.1, 0.2, 0.05]} p={[0, 0.1, 0]} m={M.gold} />
              <Ball rad={0.05} p={[0, 0.26, 0]} m={M.gold} />
            </group>
          ))}
          <group position={[0, 1.18, 0.08]} scale={1.8}>
            <Garuda m={M.gold} />
          </group>
          {[-1, 1].map((k) => <Box key={k} s={[0.55, 0.05, 0.05]} p={[k * 0.36, 1.12, 0.1]} r={[0, 0, k * 0.4]} m={M.gold} />)}
        </group>
        <Roof w={4.9} d={2.2} h={0.55} y={3.4} m={M.mat('roof', 4, 2, { color: '#8a5e4c' })} sag={1.2} lift={0.1} />
        <Gajur y={3.85} s={0.4} />
      </group>
    );
  }
  function KingPillar() {
    const M = useM();
    const st = M.mat('granite', 1, 3, { color: '#ffffff' });
    return (
      <group>
        <Box s={[1.1, 0.22, 1.1]} p={[0, 0.11, 0]} m={st} />
        <Box s={[0.8, 0.22, 0.8]} p={[0, 0.33, 0]} m={st} />
        <Cyl rt={0.2} rb={0.25} h={3.1} p={[0, 2.0, 0]} m={st} seg={14} />
        <Cyl rt={0.34} rb={0.2} h={0.24} p={[0, 3.67, 0]} m={st} seg={14} />
        <Box s={[0.56, 0.12, 0.56]} p={[0, 3.85, 0]} m={st} />
        <group position={[0, 3.91, 0]}>
          <Box s={[0.34, 0.1, 0.3]} p={[0, 0.05, 0]} m={M.gold} />
          <Box s={[0.22, 0.34, 0.14]} p={[0, 0.27, 0]} m={M.gold} />
          <Ball rad={0.1} p={[0, 0.55, 0]} m={M.gold} />
          <mesh position={[0, 0.7, 0]} material={M.gold}><coneGeometry args={[0.07, 0.16, 8]} /></mesh>
          <Cyl rt={0.28} h={0.03} p={[0, 0.5, -0.14]} r={[Math.PI / 2, 0, 0]} m={M.gold} />
          {[-0.2, 0, 0.2].map((x) => <mesh key={x} position={[x, 0.78, -0.14]} material={M.gold}><coneGeometry args={[0.05, 0.14, 6]} /></mesh>)}
          <Ball rad={0.06} sc={[1, 0.8, 1.3]} p={[0, 1.0, -0.14]} m={M.gold} />
        </group>
      </group>
    );
  }
  /** Curvilinear shikhara tower built from stacked bands with projecting ledges, an amalaka disc and a gilded finial. */
  const ribGeo = (r0, h, n) => {
    const parts = [];
    const hi = h / n;
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const wi = 2 * r0 * 0.8 * Math.max(0.07, 1 - t ** 1.55);
      const g = new THREE.BoxGeometry(wi, hi * 0.8, wi); g.translate(0, (i + 0.4) * hi, 0); parts.push(g);
      const wl = wi + r0 * 0.12;
      const l = new THREE.BoxGeometry(wl, hi * 0.22, wl); l.translate(0, (i + 0.9) * hi, 0); parts.push(l);
      if (i % 3 === 2) {
        const rib = new THREE.BoxGeometry(wi * 0.18, hi * 0.9, wi * 1.06); rib.translate(0, (i + 0.5) * hi, 0); parts.push(rib);
        const rib2 = new THREE.BoxGeometry(wi * 1.06, hi * 0.9, wi * 0.18); rib2.translate(0, (i + 0.5) * hi, 0); parts.push(rib2);
      }
    }
    const am = new THREE.CylinderGeometry(r0 * 0.3, r0 * 0.26, hi * 0.5, 16); am.translate(0, h + hi * 0.15, 0); parts.push(am);
    return mergeGeometries(parts);
  };
  function RibSpire({ r0, h, y, m }) {
    const M = useM();
    const geo = useMemo(() => ribGeo(r0, h, Math.max(8, Math.round(h * 5))), [r0, h]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        <mesh position={[0, h + r0 * 0.33, 0]} material={M.gold}><sphereGeometry args={[r0 * 0.1, 10, 8]} /></mesh>
        <mesh position={[0, h + r0 * 0.5, 0]} material={M.gold}><coneGeometry args={[r0 * 0.07, r0 * 0.34, 8]} /></mesh>
      </group>
    );
  }
  /** Stone shikhara: pillared lower storey, cornices, corner mini-spires and a ribbed spire. */
  function ShikT({ m, w = 3.4, y = 0, h = 3.1, minis = 4, gild = true }) {
    const M = useM();
    return (
      <group position={[0, y, 0]}>
        <Box s={[w + 0.3, 0.14, w + 0.3]} p={[0, 0.07, 0]} m={m} />
        <Box s={[w * 0.58, 1.0, w * 0.58]} p={[0, 0.64, 0]} m={m} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => (
          <group key={i} position={[a * w * 0.38, 0, b * w * 0.38]}>
            <Box s={[0.55, 0.62, 0.55]} p={[0, 0.45, 0]} m={m} />
            <Box s={[0.66, 0.08, 0.66]} p={[0, 0.78, 0]} m={m} />
            <RibSpire r0={0.3} h={0.95} y={0.78} m={m} />
          </group>
        ))}
        {minis > 4 && [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([a, b], i) => (
          <group key={`m${i}`} position={[a * w * 0.4, 0.64, b * w * 0.4]}><RibSpire r0={0.2} h={0.7} y={0.2} m={m} /></group>
        ))}
        <Box s={[w * 0.5, 0.14, w * 0.5]} p={[0, 1.2, 0]} m={m} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[w * 0.46 - i * 0.14, 0.12, w * 0.46 - i * 0.14]} p={[0, 1.34 + i * 0.5, 0]} m={m} />)}
        <RibSpire r0={w * 0.3} h={h} y={1.28} m={m} />
        {gild && <Gajur y={1.28 + h + 0.3} s={0.45} />}
      </group>
    );
  }
  /** Curvilinear stone tower: stacked tapering storeys, each with a projecting ledge, corner pilasters and a central rib; dark niches on the faces. */
  const towerGeo = (w, h, n) => {
    const body = []; const niche = [];
    const hi = h / n;
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const wi = w * Math.max(0.1, 1 - t ** 1.4 * 0.93);
      const b = new THREE.BoxGeometry(wi, hi * 0.78, wi); b.translate(0, (i + 0.39) * hi, 0); body.push(b);
      const wl = wi * 1.08 + 0.04;
      const l = new THREE.BoxGeometry(wl, hi * 0.2, wl); l.translate(0, (i + 0.88) * hi, 0); body.push(l);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, c]) => { const k = new THREE.BoxGeometry(wi * 0.16, hi * 0.8, wi * 0.16); k.translate(a * wi * 0.5, (i + 0.4) * hi, c * wi * 0.5); body.push(k); });
      const rb = new THREE.BoxGeometry(wi * 0.22, hi * 0.8, wi * 1.07); rb.translate(0, (i + 0.4) * hi, 0); body.push(rb);
      const rb2 = new THREE.BoxGeometry(wi * 1.07, hi * 0.8, wi * 0.22); rb2.translate(0, (i + 0.4) * hi, 0); body.push(rb2);
      if (i % 2 === 0 && wi > w * 0.3) {
        [0, 1, 2, 3].forEach((q) => {
          const nb = new THREE.BoxGeometry(wi * 0.26, hi * 0.5, 0.06); nb.translate(wi * 0.24, (i + 0.42) * hi, wi * 0.54); nb.rotateY((q * Math.PI) / 2);
          niche.push(nb);
          const mir = new THREE.BoxGeometry(wi * 0.26, hi * 0.5, 0.06); mir.translate(-wi * 0.24, (i + 0.42) * hi, wi * 0.54); mir.rotateY((q * Math.PI) / 2); niche.push(mir);
        });
      }
    }
    const am = new THREE.CylinderGeometry(w * 0.15, w * 0.12, hi * 0.7, 12); am.translate(0, h + hi * 0.1, 0); body.push(am);
    return { body: mergeGeometries(body), niche: mergeGeometries(niche) };
  };
  function Tower({ w, h, y = 0, n, gs, nm, kalash = 0.5 }) {
    const M = useM();
    const g = useMemo(() => towerGeo(w, h, n), [w, h, n]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={g.body} material={gs} castShadow receiveShadow />
        <mesh geometry={g.niche} material={nm} />
        <Ball rad={w * 0.1} p={[0, h + (h / n) * 0.55, 0]} m={M.gold} />
        <Gajur y={h + (h / n) * 0.7} s={kalash} />
      </group>
    );
  }
  /** Vatsala Durga: stone shikhara over an arched-porch ground storey on a stepped plinth; mini shikharas at the corners. Faces +z. */
  function VatsalaT() {
    const M = useM();
    const gs = greyStone(2);
    const gs1 = greyStone(1);
    const dk = M.plain('#17130e', { roughness: 1 });
    const colH = 1.35;
    const pw = 1.95; // half width of the porch ring
    const ring = useMemo(() => {
      const cols = []; const arch = [];
      const pos = [-pw, -pw / 3, pw / 3, pw];
      [0, 1, 2, 3].forEach((side) => {
        pos.forEach((t, i) => {
          if (i === 0 && side > 0) return; // corners shared
          const x = side % 2 === 0 ? t : (side === 1 ? pw : -pw);
          const z = side % 2 === 0 ? (side === 0 ? pw : -pw) : t;
          const c = new THREE.CylinderGeometry(0.075, 0.095, colH, 8); c.translate(x, colH / 2, z); cols.push(c);
          const cap = new THREE.BoxGeometry(0.26, 0.12, 0.26); cap.translate(x, colH + 0.02, z); cols.push(cap);
          const base = new THREE.BoxGeometry(0.24, 0.1, 0.24); base.translate(x, 0.05, z); cols.push(base);
        });
        for (let i = 0; i < 3; i += 1) {
          const a = new THREE.TorusGeometry((pos[i + 1] - pos[i]) / 2 - 0.04, 0.045, 6, 14, Math.PI);
          const mid = (pos[i] + pos[i + 1]) / 2;
          a.rotateY(side % 2 === 0 ? 0 : Math.PI / 2);
          const x = side % 2 === 0 ? mid : (side === 1 ? pw : -pw); const z = side % 2 === 0 ? (side === 0 ? pw : -pw) : mid;
          a.translate(x, colH + 0.08, z); arch.push(a);
        }
      });
      return { cols: mergeGeometries(cols), arch: mergeGeometries(arch) };
    }, []);
    return (
      <group>
        {[0, 1, 2].map((i) => <Box key={i} s={[6.0 - i * 0.55, 0.28, 6.0 - i * 0.55]} p={[0, 0.14 + i * 0.28, 0]} m={gs1} />)}
        <Stairs w={1.6} z0={3.0 + 1.0} z1={2.5} y1={0.84} n={5} m={gs1} />
        {[0, 1].map((i) => [-1, 1].map((k) => <group key={`${i}${k}`} position={[k * 1.25, 0.28 * i, 3.1 - i * 0.55]} scale={1.15}>{i === 0 ? <Elephant m={gs1} /> : <Lion m={gs1} />}</group>))}
        <group position={[0, 0.84, 0]}>
          <Box s={[2.9, colH, 2.9]} p={[0, colH / 2, 0]} m={gs} />
          {[0, 1, 2, 3].map((q) => <Box key={q} s={[0.8, 1.0, 0.06]} p={[Math.sin((q * Math.PI) / 2) * 1.46, 0.55, Math.cos((q * Math.PI) / 2) * 1.46]} r={[0, (q * Math.PI) / 2, 0]} m={dk} />)}
          <mesh geometry={ring.cols} material={gs1} castShadow receiveShadow />
          <mesh geometry={ring.arch} material={gs1} castShadow />
          {/* stacked cornices over the porch, widening outward, with dark carved frieze between */}
          <Box s={[4.5, 0.14, 4.5]} p={[0, colH + 0.16, 0]} m={gs1} />
          <Box s={[4.2, 0.12, 4.2]} p={[0, colH + 0.28, 0]} m={dk} />
          <Box s={[4.7, 0.14, 4.7]} p={[0, colH + 0.4, 0]} m={gs1} />
          <Box s={[4.35, 0.5, 4.35]} p={[0, colH + 0.72, 0]} m={gs} />
          <Box s={[4.85, 0.16, 4.85]} p={[0, colH + 1.05, 0]} m={gs1} />
          <Box s={[5.0, 0.1, 5.0]} p={[0, colH + 1.17, 0]} m={gs} />
          {/* corner mini shikharas on pillared stages */}
          {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => (
            <group key={i} position={[a * 1.95, colH + 1.22, b * 1.95]}>
              <Box s={[1.0, 0.7, 1.0]} p={[0, 0.35, 0]} m={gs} />
              <Box s={[0.5, 0.4, 0.06]} p={[0, 0.36, 0.51]} m={dk} />
              <Box s={[0.5, 0.4, 0.06]} p={[0, 0.36, -0.51]} m={dk} />
              <Box s={[0.06, 0.4, 0.5]} p={[0.51, 0.36, 0]} m={dk} />
              <Box s={[0.06, 0.4, 0.5]} p={[-0.51, 0.36, 0]} m={dk} />
              <Box s={[1.14, 0.1, 1.14]} p={[0, 0.74, 0]} m={gs1} />
              <Tower w={0.86} h={1.55} y={0.78} n={8} gs={gs} nm={dk} kalash={0.2} />
            </group>
          ))}
          {/* the upper stage of the main tower, then the shikhara itself */}
          <Box s={[3.0, 0.9, 3.0]} p={[0, colH + 1.67, 0]} m={gs} />
          <Box s={[3.25, 0.12, 3.25]} p={[0, colH + 2.17, 0]} m={gs1} />
          <Tower w={2.7} h={3.7} y={colH + 2.22} n={16} gs={gs} nm={dk} kalash={0.5} />
        </group>
      </group>
    );
  }
  /** Siddhi Lakshmi: a tall brick shikhara on a stepped plinth. */
  function BrickShik({ s = 1 }) {
    const M = useM();
    const bm = M.mat('brick', 3, 3, { color: '#f2c2a6' });
    return (
      <group scale={s}>
        {[0, 1, 2].map((i) => <Box key={i} s={[4.6 - i * 0.6, 0.3, 4.6 - i * 0.6]} p={[0, 0.15 + i * 0.3, 0]} m={bm} />)}
        <Stairs w={1.2} z0={2.7} z1={1.9} y1={0.9} n={5} m={M.stone} />
        <group position={[-0.9, 0.3, 2.4]} scale={1.2}><Elephant m={M.stone} /></group>
        <group position={[0.9, 0.3, 2.4]} scale={1.2}><Elephant m={M.stone} /></group>
        <ShikT m={bm} w={3.0} y={0.9} h={3.6} gild />
      </group>
    );
  }
  /** Two-storey octagonal pavilion (Chyasilin Mandap). */
  function OctaMandap({ s = 1 }) {
    const M = useM();
    const bm = M.mat('brick', 4, 1, { color: '#f2c2a6' });
    const rm = M.mat('roof', 3, 3, { color: '#8a5e4c' });
    return (
      <group scale={s}>
        <Cyl rt={2.1} rb={2.2} h={0.5} p={[0, 0.25, 0]} m={bm} seg={8} />
        {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <Cyl key={i} rt={0.07} h={1.0} p={[Math.cos(a) * 1.7, 1.0, Math.sin(a) * 1.7]} m={M.plain('#6a3a1e')} seg={8} />; })}
        <Cyl rt={0.95} h={1.0} p={[0, 1.0, 0]} m={M.plain('#2a150a')} seg={8} />
        <mesh position={[0, 1.58, 0]} material={rm} castShadow><coneGeometry args={[2.5, 0.62, 8]} /></mesh>
        <Cyl rt={1.15} h={0.9} p={[0, 2.15, 0]} m={bm} seg={8} />
        {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + 0.39; return <Box key={i} s={[0.3, 0.4, 0.05]} p={[Math.cos(a) * 1.07, 2.15, Math.sin(a) * 1.07]} r={[0, -a + Math.PI / 2, 0]} m={M.plain('#2a150a')} />; })}
        <mesh position={[0, 2.95, 0]} material={rm} castShadow><coneGeometry args={[1.8, 0.8, 8]} /></mesh>
        <Gajur y={3.3} s={0.8} />
      </group>
    );
  }
  function ArcadedHall({ x, z, ry = 0, n = 9 }) {
    const M = useM();
    const wm = M.plain('#f1ebe0', { roughness: 0.85 });
    return (
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <Box s={[n * 1.6, 0.3, 3.4]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[n * 1.6, 2.3, 2]} p={[0, 1.45, -0.6]} m={wm} />
        {Array.from({ length: n }, (_, i) => <Box key={i} s={[0.36, 0.7, 0.05]} p={[(i - (n - 1) / 2) * 1.6, 2.0, 0.42]} m={M.plain('#6a2a1a')} />)}
        <Box s={[n * 1.6 + 0.4, 0.2, 3.2]} p={[0, 2.7, 0.1]} m={M.plain('#4a2a16')} />
        {Array.from({ length: n + 1 }, (_, i) => <Cyl key={i} rt={0.09} h={1.2} p={[(i - n / 2) * 1.6, 0.9, 1.1]} m={M.plain('#6a3a1e')} seg={8} />)}
        <Roof w={n * 1.6 + 0.8} d={3.9} h={0.8} y={2.75} m={M.mat('roof', 8, 2, { color: '#9a6650' })} sag={1.2} lift={0.05} fascia={false} />
      </group>
    );
  }

  /** A square-plan pagoda on a stepped brick plinth with a front stair and guardians: the temples crowding the square. Faces +z. */
  function SqPag({ tiers, plinth = 3, pw = 5.4, finial = 1.0, base = '#9a4a36', roofM, sc = 1 }) {
    const M = useM();
    const bm = M.mat('brick', 3, 1, { color: '#f2c2a6' });
    const h = 0.22;
    const moss = roofM || terraRoof('#a86a46', 0.5);
    return (
      <group scale={sc}>
        {Array.from({ length: plinth }, (_, i) => <Box key={i} s={[pw - i * 0.7, h, pw - i * 0.7]} p={[0, h / 2 + i * h, 0]} m={bm} />)}
        <Stairs w={1.6} z0={pw / 2 + 0.9} z1={pw / 2 - (plinth - 1) * 0.35 - 0.1} y1={plinth * h} n={plinth * 2} m={M.stone} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.25, 0, pw / 2 + 0.2]} scale={1.1}><Lion m={M.stone} /></group>)}
        <Pag y0={plinth * h} porch={5} cols={3} dens={1.7} finial={finial} base={base} sw={0.09} roofM={moss} tiers={tiers} />
      </group>
    );
  }
  const PASHUPATI = [{ w: 3.2, d: 3.2, wh: 1.5, ov: 1.4, rh: 0.9 }, { w: 2.5, d: 2.5, wh: 1.2, ov: 1.15, rh: 0.85 }, { w: 1.8, d: 1.8, wh: 1.0, ov: 0.95, rh: 0.8 }];

  /* --- the square: palace, gate, pillar, bells, Vatsala, Siddhi Lakshmi, Pashupatinath, Chyasilin and the smaller pagodas --- */
  function SquareThings({ full = true }) {
    const M = useM();
    return (
      <group>
        <group position={[-4, 0, -9]}>
          <Palace55 />
          <group position={[-10.4, 0, 0.1]}><GGate s={0.95} /></group>
        </group>
        <group position={[-4.6, 0, -3.6]} rotation={[0, Math.PI, 0]}><KingPillar /></group>
        <group position={[-0.7, 0, -4.3]}><BellPavilion p={[0, 0, 0]} s={1.1} /></group>
        <group position={[3.8, 0, -3.4]}><VatsalaT /></group>
        {full && (
          <>
            <group position={[13.8, 0, 1.8]} rotation={[0, -0.25, 0]}><BrickShik /></group>
            <group position={[11.6, 0, -10.2]}><SqPag tiers={PASHUPATI} pw={5.6} finial={1.1} /></group>
            <group position={[19.4, 0, -5.5]} rotation={[0, -0.4, 0]}><SqPag tiers={PASHUPATI} pw={5.0} sc={0.9} finial={1.0} /></group>
            <group position={[21.5, 0, -12]}><OctaMandap s={1.0} /></group>
            <group position={[-9.6, 0, -5.4]}><BellPavilion p={[0, 0, 0]} s={0.85} /></group>
            <group position={[-18.2, 0, 1]} rotation={[0, 0.35, 0]}>
              <SqPag plinth={3} pw={5.0} tiers={[{ w: 2.8, d: 2.8, wh: 1.3, ov: 1.2, rh: 0.8 }, { w: 2.1, d: 2.1, wh: 1.0, ov: 1.0, rh: 0.75 }]} finial={0.9} />
            </group>
            <group position={[2.4, 0, 8.2]}>
              {[0, 1, 2].map((i) => <Box key={i} s={[5.4 - i * 0.8, 0.2, 3.2 - i * 0.5]} p={[0, 0.1 + i * 0.2, 0]} m={M.mat('brick', 3, 1, { color: '#f2c2a6' })} />)}
            </group>
          </>
        )}
      </group>
    );
  }
  function DurbarMain() {
    return (
      <group>
        <group scale={0.85} position={[1.5, 0, 3]}><SquareThings /></group>
        <Frame s={[36, 10.5, 17]} p={[3, 5.2, -2]} />
      </group>
    );
  }
  function DurbarEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={46} mat={paverMat(46)} />
        <Hills />
        <ArcadedHall x={-29} z={-3} ry={Math.PI / 2} n={9} />
        <LongHall p={[0, 0, -22]} L={46} st={3} base="#b86a4c" />
        <LongHall p={[35, 0, -4]} r={-Math.PI / 2} L={34} st={3} base="#c07a55" roof="#9a6650" />
        <LongHall p={[-25, 0, -19]} r={Math.PI / 4} L={14} st={4} base="#efe6d6" plaster roof="#7d5444" />
        <LongHall p={[2, 0, 40]} r={Math.PI} L={44} st={2} base="#b06a4c" />
        <Row x={-36} z={14} ry={Math.PI / 2} n={5} step={3.2} seed={2} smin={3} smax={4} />
        {Array.from({ length: 10 }, (_, i) => <Tree key={i} p={[-30 + i * 6.5, 0, -28 - (i % 3) * 2]} s={1.4 + R(i, 2)} kind={i % 4 ? 'broad' : 'pine'} />)}
        <Box s={[7, 0.5, 5]} p={[12, 0.25, 11]} m={M.mat('brick', 3, 1, { color: '#f2c2a6' })} />
        <Box s={[5, 0.3, 3.4]} p={[-8, 0.15, 12]} m={M.mat('brick', 3, 1, { color: '#f2c2a6' })} />
      </group>
    );
  }

  /* --- 55-window palace: the long front, the Golden Gate at its west end, the king's pillar and bell, Vatsala and Siddhi Lakshmi beyond --- */
  function PalaceMain() {
    return (
      <group>
        <group scale={0.72} position={[-0.8, 0, 0]}>
          <group position={[0, 0, -3]}><Palace55 /></group>
          <group position={[-10.5, 0, -2.9]}><GGate s={0.95} /></group>
          <group position={[-2.6, 0, 3.4]} rotation={[0, Math.PI, 0]}><KingPillar /></group>
          <group position={[1.6, 0, 3.7]}><BellPavilion p={[0, 0, 0]} s={0.85} /></group>
        </group>
        <Frame s={[16.4, 4.8, 7]} p={[-1.7, 2.4, 0.4]} />
      </group>
    );
  }
  function PalaceEnv() {
    return (
      <group>
        <Floor r={42} mat={paverMat(42)} />
        <Hills />
        <LongHall p={[0, 0, -19]} L={40} st={3} base="#b86a4c" />
        <LongHall p={[-26, 0, -2]} r={Math.PI / 2} L={26} st={3} base="#efe6d6" plaster roof="#7d5444" />
        <LongHall p={[27, 0, -2]} r={-Math.PI / 2} L={28} st={3} base="#c07a55" roof="#9a6650" />
        <group position={[-17, 0, 13]} rotation={[0, 0.3, 0]}><BrickShik /></group>
        <group position={[19, 0, 11]} rotation={[0, -0.4, 0]}><VatsalaT /></group>
        <group position={[-20, 0, -9]} rotation={[0, 0.3, 0]}><SqPag tiers={PASHUPATI} pw={5.2} /></group>
        <group position={[12, 0, -9.5]}><OctaMandap s={0.95} /></group>
        {Array.from({ length: 6 }, (_, i) => <Tree key={i} p={[-22 + i * 9, 0, -27]} s={1.5} />)}
      </group>
    );
  }
  /* --- Golden Gate close up: gilded door, torana with Taleju and Garuda, in the brick palace wall --- */
  function GoldenMain() {
    const M = useM();
    return (
      <group>
        <group position={[0, 0, 0]} scale={1.5}><GGate /></group>
        <Box s={[2.4, 4.6, 0.9]} p={[-4.5, 2.3, -0.1]} m={M.plain('#f1ebe0', { roughness: 0.85 })} />
        <Box s={[0.7, 0.7, 0.05]} p={[-4.5, 3.0, 0.38]} m={M.plain('#a12a1a')} />
        <Roof w={3.3} d={2} h={0.7} y={4.6} m={M.mat('roof', 3, 2, { color: '#8a5e4c' })} sag={1.2} fascia={false} />
        <Box s={[2.6, 4.5, 0.9]} p={[4.4, 2.25, -0.1]} m={M.mat('brick', 8, 3, { color: '#f4c9b0' })} />
        <Frame s={[8.5, 5.8, 4]} p={[0, 2.9, 0]} />
      </group>
    );
  }
  function GoldenEnv() {
    return (
      <group>
        <Floor r={34} mat={paverMat(34)} />
        <group position={[6, 0, 5.4]} rotation={[0, Math.PI, 0]}><KingPillar /></group>
        <group position={[12, 0, 9]} rotation={[0, 0.3, 0]}><VatsalaT /></group>
        <Hills r={60} />
      </group>
    );
  }

  /* --- Vatsala Durga: its own square corner --- */
  function VatsalaMain() {
    return (
      <group>
        <VatsalaT />
        <group position={[-5.6, 0, 3.6]} rotation={[0, Math.PI, 0]} scale={1.25}><KingPillar /></group>
        <group position={[5.9, 0, 4.2]}><BellPavilion p={[0, 0, 0]} s={1.5} /></group>
        <Frame s={[17, 9.8, 12.5]} p={[0, 4.8, 1.6]} />
      </group>
    );
  }
  function VatsalaEnv() {
    return (
      <group>
        <Floor r={38} mat={paverMat(38)} />
        <Hills />
        <group position={[3, 0, -19]}><Palace55 /></group>
        <group position={[-7.5, 0, -18.9]}><GGate s={0.95} /></group>
        <group position={[17, 0, 3]} rotation={[0, -0.3, 0]}><BrickShik /></group>
        <group position={[-17, 0, -8]} rotation={[0, 0.4, 0]}><SqPag tiers={PASHUPATI} pw={5.2} sc={0.95} /></group>
        <LongHall p={[-29, 0, 2]} r={Math.PI / 2} L={26} st={3} base="#b86a4c" />
        <LongHall p={[2, 0, 32]} r={Math.PI} L={40} st={2} base="#c07a55" />
      </group>
    );
  }
  /* ================= Taumadhi: Nyatapola and Bhairavnath ================= */
  const NH = [6.7, 5.85, 5.0, 4.15, 3.3];
  /** Nyatapola: five roofs on five brick plinths, one stair, a guardian pair on every level. Faces +z. */
  function NyatBody() {
    const M = useM();
    const brick = M.mat('brick', 8, 1, { color: '#f0bfa4' });
    const st = M.mat('granite', 1, 1, { color: '#ffffff' });
    const rise = 0.6;
    return (
      <group>
        {NH.map((h, i) => (
          <group key={i}>
            <Box s={[h * 2, rise, h * 2]} p={[0, i * rise + rise / 2, 0]} m={brick} />
            <Box s={[h * 2 + 0.12, 0.07, h * 2 + 0.12]} p={[0, (i + 1) * rise - 0.02, 0]} m={st} cast={false} />
          </group>
        ))}
        <Stairs w={2.6} z0={NH[0] + 0.15} z1={NH[4] - 0.1} y1={rise * 5} n={24} m={st} />
        {NH.map((h, i) => (
          <GuardPair key={i} idx={i} x={1.95} y={(i + 1) * rise} z={(h + (NH[i + 1] || NH[4] - 1.0)) / 2 - 0.05} sc={1.6 + i * 0.2} m={st} />
        ))}
        <Pag y0={rise * 5} porch={7} cols={3} dens={1.7} finial={1.5} base="#8a4a36" roofC="#a07a5a" strutC="#4a2a16" tiers={[
          { w: 5.0, d: 5.0, wh: 1.8, ov: 1.45, rh: 0.95 },
          { w: 4.35, d: 4.35, wh: 1.3, ov: 1.25, rh: 0.9 },
          { w: 3.7, d: 3.7, wh: 1.2, ov: 1.1, rh: 0.88 },
          { w: 3.1, d: 3.1, wh: 1.1, ov: 0.95, rh: 0.85 },
          { w: 2.5, d: 2.5, wh: 1.05, ov: 0.85, rh: 0.82 },
        ]} />
      </group>
    );
  }
  /** Bhairavnath: a stout three-roofed temple with a huge moss-tiled first roof, a deep carved ground storey and a gilded crown. Faces +z. */
  function BhairBody() {
    const M = useM();
    const brick = M.mat('brick', 6, 1, { color: '#f0bfa4' });
    const st = M.mat('granite', 1, 1, { color: '#ffffff' });
    const wood = M.plain('#4a2a16', { roughness: 0.85 });
    const wf = (i) => carvedWall(i === 0 ? 'ground' : 'upper', '#a24d38');
    const PW = 6.4; const PD = 4.8;
    return (
      <group>
        {[0, 1, 2].map((i) => <Box key={i} s={[11 - i * 0.7, 0.24, 8.6 - i * 0.7]} p={[0, 0.12 + i * 0.24, 0]} m={i === 1 ? st : brick} />)}
        <Stairs w={2.6} z0={4.3 + 1.0} z1={3.7} y1={0.72} n={4} m={st} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.8, 0.48, 4.0]} scale={1.2}><Lion m={st} /></group>)}
        {/* open timber verandah across the front of the ground storey */}
        {[-2.6, -1.56, -0.52, 0.52, 1.56, 2.6].map((x) => <Cyl key={x} rt={0.09} rb={0.11} h={1.55} p={[x, 0.72 + 0.78, PD / 2 + 0.5]} m={wood} seg={8} />)}
        <Box s={[PW - 0.2, 0.14, 0.2]} p={[0, 0.72 + 1.58, PD / 2 + 0.5]} m={wood} />
        <Pag y0={0.72} porch={0} doors={false} wallFor={wf} dens={2.3} sw={0.11} finial={1.1} cluster={3} roofM={mossRoof(1.3)} strutC="#3a2010" tiers={[
          { w: PW, d: PD, wh: 2.0, ov: 2.0, rh: 1.15 },
          { w: 4.3, d: 3.2, wh: 1.55, ov: 1.4, rh: 1.0 },
          { w: 2.8, d: 2.3, wh: 1.3, ov: 1.1, rh: 0.95 },
        ]} />
      </group>
    );
  }
  function TaumadhiEnv({ focus = 'nyat' }) {
    const M = useM();
    return (
      <group>
        <Floor r={44} mat={paverMat(44)} />
        <Hills seed={4} />
        {focus !== 'nyat' && <group position={[20, 0, 10]} rotation={[0, -Math.PI / 2, 0]}><NyatBody /></group>}
        {focus !== 'bhair' && <group position={[17, 0, 7]} rotation={[0, -Math.PI / 2, 0]}><BhairBody /></group>}
        <Row x={-1} z={-19} n={14} step={3.2} seed={11} smin={3} smax={4} />
        <Row x={-22} z={2} ry={Math.PI / 2} n={9} step={3.2} seed={12} smin={3} smax={4} />
        <Row x={30} z={-8} ry={-Math.PI / 2} n={4} step={3.2} seed={13} smin={2} smax={4} />
        <Row x={6} z={30} ry={Math.PI} n={12} step={3.2} seed={14} smin={2} smax={3} />
        {Array.from({ length: 6 }, (_, i) => <Tree key={i} p={[-30 + i * 12, 0, -30]} s={1.6} />)}
        <Box s={[2.2, 0.3, 2.2]} p={[-9, 0.15, 10]} m={M.stone} />
        <Cyl rt={0.5} rb={0.6} h={0.9} p={[-9, 0.75, 10]} m={M.mat('granite', 1, 1, { color: '#ffffff' })} />
      </group>
    );
  }
  function NyatMain() {
    return <group><NyatBody /></group>;
  }
  function BhairMain() {
    return <group><BhairBody /><Frame s={[12, 10.5, 9.5]} p={[0, 5.2, 0]} /></group>;
  }

  /* ================= Tachupal: Dattatreya and the Peacock Window ================= */
  function DattaBody() {
    const M = useM();
    const brick = M.mat('brick', 6, 1, { color: '#f0bfa4' });
    const st = M.mat('granite', 1, 1, { color: '#ffffff' });
    const lv = [{ w: 9.4, d: 8.2 }, { w: 8.6, d: 7.4 }, { w: 7.8, d: 6.6 }];
    return (
      <group>
        {lv.map((l, i) => (
          <group key={i}>
            <Box s={[l.w, 0.34, l.d]} p={[0, i * 0.34 + 0.17, 0]} m={i % 2 ? st : brick} />
            <Box s={[l.w + 0.08, 0.05, l.d + 0.08]} p={[0, (i + 1) * 0.34, 0]} m={st} cast={false} />
          </group>
        ))}
        <Stairs w={2.1} z0={4.1 + 0.9} z1={3.3} y1={1.02} n={7} m={st} />
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.95, 0.34, 3.7]}>
            <Box s={[1.1, 0.5, 1.0]} p={[0, 0.25, 0]} m={st} />
            <group position={[0, 0.5, 0]} scale={2.1}><Wrestler m={st} /></group>
          </group>
        ))}
        <Pag y0={1.02} porch={7} fringe="#c2362b" cols={3} dens={1.4} finial={1.1} roofC="#a8684c" tiers={[
          { w: 6.2, d: 4.8, wh: 1.8, ov: 1.6, rh: 0.9 },
          { w: 3.6, d: 3.0, wh: 1.7, ov: 1.0, rh: 0.85 },
          { w: 2.5, d: 2.2, wh: 1.6, ov: 0.8, rh: 0.8 },
        ]} />
        {/* Garuda pillar, gilded wheel pillar and trident before the temple */}
        <group position={[4.2, 0, 6.6]}>
          <Box s={[0.9, 0.3, 0.9]} p={[0, 0.15, 0]} m={st} />
          <Cyl rt={0.2} rb={0.26} h={5.4} p={[0, 3.0, 0]} m={st} seg={12} />
          <Cyl rt={0.32} rb={0.2} h={0.22} p={[0, 5.8, 0]} m={st} seg={12} />
          <group position={[0, 5.9, 0]} scale={1.9}><Garuda m={st} /></group>
        </group>
        <group position={[-3.6, 0, 5.6]}>
          <Box s={[0.7, 0.26, 0.7]} p={[0, 0.13, 0]} m={st} />
          <Cyl rt={0.14} rb={0.18} h={2.5} p={[0, 1.5, 0]} m={st} seg={10} />
          <Cyl rt={0.3} h={0.07} p={[0, 2.85, 0]} r={[Math.PI / 2, 0, 0]} m={M.gold} />
          <mesh position={[0, 3.1, 0]} material={M.gold}><torusGeometry args={[0.28, 0.05, 8, 20]} /></mesh>
        </group>
        <Trident p={[3.8, 0, 4.6]} h={2.6} />
      </group>
    );
  }
  /** Shop front of the Pujari Math lane: red cloth backdrop crowded with masks, bells, bowls and thangka panels. */
  function paintStall(g, w, h) {
    g.fillStyle = '#1a0d08'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#a81f26'; g.fillRect(0, 0, w, h * 0.62);
    for (let i = 0; i < 90; i += 1) { g.fillStyle = `rgba(0,0,0,${R(i, 4) * 0.12})`; g.fillRect(R(i, 1) * w, R(i, 2) * h * 0.62, 30, 3); }
    const cols = ['#d9a63c', '#2a7ab0', '#e8e0cc', '#3a9a5a', '#8a3a8a', '#c9702a'];
    for (let k = 0; k < 70; k += 1) {
      const x = 14 + R(k, 1) * (w - 28); const y = 14 + R(k, 2) * (h * 0.56 - 24); const c = cols[k % cols.length];
      const kind = k % 4;
      g.fillStyle = c;
      if (kind === 0) { g.beginPath(); g.ellipse(x, y, 9, 12, 0, 0, 7); g.fill(); g.fillStyle = '#2a140a'; g.fillRect(x - 5, y - 3, 3, 3); g.fillRect(x + 2, y - 3, 3, 3); g.fillRect(x - 3, y + 3, 6, 2); }
      else if (kind === 1) { g.fillRect(x - 11, y - 14, 22, 28); g.fillStyle = '#f0d890'; g.fillRect(x - 7, y - 10, 14, 20); g.fillStyle = c; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
      else if (kind === 2) { g.fillStyle = '#c8a040'; g.beginPath(); g.moveTo(x - 9, y - 8); g.lineTo(x + 9, y - 8); g.lineTo(x + 6, y + 10); g.lineTo(x - 6, y + 10); g.closePath(); g.fill(); g.fillRect(x - 1, y - 14, 2, 6); }
      else { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.strokeStyle = '#3a1a08'; g.lineWidth = 2; g.stroke(); }
    }
    g.fillStyle = '#7a1a20'; g.fillRect(0, h * 0.62, w, h * 0.38);
    for (let k = 0; k < 40; k += 1) {
      const x = 10 + R(k, 5) * (w - 20); const y = h * 0.66 + R(k, 6) * h * 0.28;
      g.fillStyle = cols[(k + 2) % cols.length]; g.beginPath(); g.arc(x, y, 5 + R(k, 7) * 5, 0, 7); g.fill();
    }
    g.fillStyle = '#2c180d'; g.fillRect(0, 0, w, 8);
  }
  /** Small timber lattice window with a pitched hood, for the flanking windows of the Pujari Math. */
  function paintSideWin(g, w, h) {
    bricks(g, w, h, '#b8664a', 10, 6, 3);
    g.fillStyle = '#3a2314'; g.fillRect(w * 0.12, h * 0.14, w * 0.76, h * 0.72);
    g.fillStyle = '#0f0805'; g.fillRect(w * 0.18, h * 0.3, w * 0.64, h * 0.52);
    g.strokeStyle = '#a06c36'; g.lineWidth = 2;
    for (let i = 1; i < 9; i += 1) { g.beginPath(); g.moveTo(w * 0.18 + (i * w * 0.64) / 9, h * 0.3); g.lineTo(w * 0.18 + (i * w * 0.64) / 9, h * 0.82); g.stroke(); }
    g.beginPath(); g.moveTo(w * 0.18, h * 0.56); g.lineTo(w * 0.82, h * 0.56); g.stroke();
    g.fillStyle = '#5a3720'; g.beginPath(); g.moveTo(w * 0.08, h * 0.3); g.lineTo(w * 0.5, h * 0.04); g.lineTo(w * 0.92, h * 0.3); g.closePath(); g.fill();
    g.fillStyle = '#7a4c26'; g.beginPath(); g.moveTo(w * 0.2, h * 0.28); g.lineTo(w * 0.5, h * 0.1); g.lineTo(w * 0.8, h * 0.28); g.closePath(); g.fill();
  }
  /** The Peacock Window (Mhaykha Jhya): a carved timber frame round a circular lattice of radiating tail feathers, a peacock perched at the centre. Faces +z. */
  function PeacockWin({ s = 1 }) {
    const M = useM();
    const wood = M.plain('#3e2413', { roughness: 0.85 });
    const wood2 = M.plain('#6a4222', { roughness: 0.8 });
    const carve = M.plain('#94622f', { roughness: 0.75 });
    const bird = M.plain('#b08658', { roughness: 0.7 });
    const voidM = M.plain('#0b0603', { roughness: 1 });
    const g = useMemo(() => {
      const P = { panel: null, spokes: [], leaves: [], arcs: [], eyes: [], beads: [], dent: [], scal: [], corner: [] };
      const Rr = 1.2; const cy = -0.1; const oy = cy - 0.42; // feathers fan out from the bird's body
      const sh = new THREE.Shape();
      sh.moveTo(-1.55, -1.55); sh.lineTo(1.55, -1.55); sh.lineTo(1.55, 1.55); sh.lineTo(-1.55, 1.55); sh.closePath();
      const hole = new THREE.Path(); hole.absarc(0, cy, 1.26, 0, Math.PI * 2, true); sh.holes.push(hole);
      P.panel = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false, curveSegments: 48 });
      const n = 31;
      for (let i = 0; i < n; i += 1) {
        const a = -Math.PI * 0.1 + (i / (n - 1)) * Math.PI * 1.2;
        const len = Rr * 0.97;
        const c = new THREE.CylinderGeometry(0.014, 0.022, len, 5); c.rotateZ(a - Math.PI / 2); c.translate(Math.cos(a) * len / 2, oy + Math.sin(a) * len / 2, 0.07); P.spokes.push(c);
        [0.5, 0.74, 0.93].forEach((f, q) => {
          const l = new THREE.SphereGeometry(q === 2 ? 0.075 : 0.055, 8, 6); l.scale(q === 2 ? 1.5 : 1.25, 0.6, 0.45); l.rotateZ(a); l.translate(Math.cos(a) * Rr * f, oy + Math.sin(a) * Rr * f, 0.075); P.leaves.push(l);
        });
        const e = new THREE.TorusGeometry(0.035, 0.011, 5, 12); e.translate(Math.cos(a) * Rr * 0.64, oy + Math.sin(a) * Rr * 0.64, 0.08); P.eyes.push(e);
      }
      [0.3, 0.52, 0.76].forEach((f) => { const t = new THREE.TorusGeometry(Rr * f, 0.012, 4, 56, Math.PI * 1.2); t.rotateZ(-Math.PI * 0.1); t.translate(0, oy, 0.07); P.arcs.push(t); });
      for (let k = 0; k < 40; k += 1) {
        const a = (k / 40) * Math.PI * 2;
        const sc = new THREE.SphereGeometry(0.1, 8, 6); sc.scale(1.5, 0.7, 0.5); sc.rotateZ(a); sc.translate(Math.cos(a) * 1.4, cy + Math.sin(a) * 1.4, 0.13); P.scal.push(sc);
      }
      for (let k = 0; k < 4; k += 1) for (let j = 0; j < 14; j += 1) {
        const a = k * (Math.PI / 2) + Math.PI / 4;
        const px = Math.cos(a) * (1.4 + R(j, k) * 0.25) + (R(j, k + 3) - 0.5) * 0.4; const py = cy + Math.sin(a) * (1.4 + R(j, k + 2) * 0.25) + (R(j, k + 5) - 0.5) * 0.4;
        if (Math.hypot(px, py - cy) < 1.42 || Math.abs(px) > 1.5 || Math.abs(py) > 1.5) continue;
        const lf = new THREE.SphereGeometry(0.07, 8, 6); lf.scale(1.6, 0.6, 0.5); lf.rotateZ(a + R(j, 9)); lf.translate(px, py, 0.13); P.corner.push(lf);
      }
      [-1, 1].forEach((sx) => { for (let j = 0; j < 14; j += 1) { const b = new THREE.SphereGeometry(0.1, 8, 6); b.scale(1, 1.1, 1); b.translate(sx * 1.78, -1.7 + j * 0.26, 0.13); P.beads.push(b); } });
      for (let j = 0; j < 30; j += 1) { const d = new THREE.BoxGeometry(0.09, 0.13, 0.1); d.translate(-1.74 + j * 0.12, 1.98, 0.1); P.dent.push(d); }
      const m = (a) => mergeGeometries(a);
      return { panel: P.panel, spokes: m(P.spokes), leaves: m(P.leaves), arcs: m(P.arcs), eyes: m(P.eyes), beads: m(P.beads), dent: m(P.dent), scal: m(P.scal), corner: m(P.corner) };
    }, []);
    return (
      <group scale={s}>
        <Box s={[4.1, 4.1, 0.2]} p={[0, -0.05, -0.12]} m={wood} />
        <mesh geometry={g.panel} material={wood2} position={[0, 0, -0.06]} castShadow />
        <mesh position={[0, -0.1, -0.03]} material={voidM}><circleGeometry args={[1.3, 40]} /></mesh>
        <mesh geometry={g.spokes} material={carve} />
        <mesh geometry={g.leaves} material={carve} />
        <mesh geometry={g.arcs} material={carve} />
        <mesh geometry={g.eyes} material={wood2} />
        <mesh geometry={g.scal} material={carve} />
        <mesh geometry={g.corner} material={carve} />
        <mesh position={[0, -0.1, 0.08]} material={carve}><torusGeometry args={[1.3, 0.06, 6, 56]} /></mesh>
        <mesh position={[0, -0.1, 0.1]} material={wood2}><torusGeometry args={[1.12, 0.03, 5, 56]} /></mesh>
        {/* posts of stacked beads, cornice with dentils and a peaked crest, sill with carved brackets */}
        {[-1, 1].map((k) => <Box key={k} s={[0.2, 4.0, 0.2]} p={[k * 1.78, 0.1, 0.02]} m={wood} />)}
        <mesh geometry={g.beads} material={carve} />
        <Box s={[4.1, 0.16, 0.36]} p={[0, 1.86, 0.1]} m={wood2} />
        <mesh geometry={g.dent} material={carve} />
        <Box s={[4.4, 0.14, 0.52]} p={[0, 2.12, 0.14]} m={wood2} />
        <Box s={[3.2, 0.2, 0.4]} p={[0, 2.3, 0.1]} m={wood} />
        {[-1, 0, 1].map((k) => <mesh key={k} position={[k * 0.9, 2.5, 0.1]} material={carve}><coneGeometry args={[0.2, 0.4, 4]} /></mesh>)}
        <Box s={[4.3, 0.2, 0.55]} p={[0, -2.05, 0.15]} m={wood2} />
        {[-1.5, 0, 1.5].map((x) => (
          <group key={x} position={[x, -2.32, 0.2]}>
            <Box s={[0.5, 0.36, 0.3]} m={wood} />
            <Ball rad={0.15} sc={[1, 1.1, 0.8]} p={[0, -0.05, 0.16]} m={carve} />
          </group>
        ))}
        {/* the peacock: body, neck, head, crest, beak and legs */}
        <Ball rad={0.3} sc={[0.85, 1.55, 0.7]} p={[0, -0.78, 0.2]} m={bird} />
        <Ball rad={0.2} sc={[1, 1.2, 0.7]} p={[0, -0.28, 0.2]} m={bird} />
        <Cyl rt={0.075} rb={0.14} h={0.55} p={[0, -0.02, 0.2]} m={bird} seg={10} />
        <Ball rad={0.11} p={[0, 0.3, 0.22]} m={bird} />
        <mesh position={[-0.13, 0.28, 0.25]} rotation={[0, 0, Math.PI / 2]} material={bird}><coneGeometry args={[0.04, 0.14, 6]} /></mesh>
        {[-0.07, 0, 0.07].map((x) => <Cyl key={x} rt={0.008} rb={0.014} h={0.2} p={[x * 1.2, 0.5, 0.22]} r={[0, 0, -x * 3]} m={bird} seg={5} />)}
        {[-0.12, 0.12].map((x) => <Cyl key={x} rt={0.025} h={0.4} p={[x, -1.42, 0.2]} m={bird} seg={6} />)}
      </group>
    );
  }
  function PeacockMain() {
    const M = useM();
    const bk = M.mat('brick', 6, 3, { color: '#ffe0cc' });
    const back = cmat('pbk', 512, 288, (g, w, h) => paintFacade(g, w, h, 3, '#b8664a', 5, false));
    const flank = cmat('psd', 256, 288, (g, w, h) => paintFacade(g, w, h, 3, '#b8664a', 2, false));
    const stall = useCMat('stall', 1024, 256, paintStall);
    const sideWin = useCMat('sidewin', 256, 256, paintSideWin);
    const wood = M.plain('#3a2314', { roughness: 0.8 });
    const wood2 = M.plain('#5a3a20', { roughness: 0.8 });
    const red = M.plain('#a81f26', { roughness: 0.95 });
    const W = 9.6; const D = 3.0; const GH = 2.5; const TH = 6.5;
    const tops = useMemo(() => {
      const t = cv(256, 256, (g) => { g.fillStyle = '#7a1a20'; g.fillRect(0, 0, 256, 256); const cols = ['#d9a63c', '#2a7ab0', '#e8e0cc', '#3a9a5a', '#8a3a8a', '#c9702a']; for (let k = 0; k < 60; k += 1) { g.fillStyle = cols[k % 6]; g.beginPath(); g.arc(R(k, 1) * 256, R(k, 2) * 256, 5 + R(k, 3) * 9, 0, 7); g.fill(); } });
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
    }, []);
    return (
      <group>
        {/* the math block, brick on every side */}
        <Box s={[W + 0.4, 0.3, D + 0.5]} p={[0, 0.15, 0.1]} m={M.stone} />
        <Box s={[W, TH, D]} p={[0, TH / 2 + 0.3, 0]} m={[flank, flank, bk, bk, bk, back]} />
        {/* ground floor: pilasters, shop opening with its cloth backdrop, centre door */}
        <Box s={[W - 1.0, GH - 0.2, 0.12]} p={[0, 0.3 + (GH - 0.2) / 2 + 0.05, D / 2 + 0.02]} m={[wood, wood, wood, wood, stall, wood]} />
        <Box s={[1.5, GH - 0.1, 0.16]} p={[0, 0.3 + (GH - 0.1) / 2, D / 2 + 0.06]} m={M.plain('#1a0e07')} />
        <Box s={[1.8, 0.2, 0.3]} p={[0, 0.3 + GH, D / 2 + 0.1]} m={wood2} />
        {[-1, 1].map((k) => <Box key={k} s={[0.2, GH - 0.1, 0.24]} p={[k * 0.82, 0.3 + (GH - 0.1) / 2, D / 2 + 0.1]} m={wood2} />)}
        {[-1, 1].map((k) => <Box key={`p${k}`} s={[0.5, GH, 0.3]} p={[k * (W / 2 - 0.35), 0.3 + GH / 2, D / 2 + 0.05]} m={bk} />)}
        {[0, 1, 2].map((k) => <Box key={k} s={[2.2 - k * 0.3, 0.1, 0.4]} p={[0, 0.35 + k * 0.1, D / 2 + 0.5 + (2 - k) * 0.2]} m={M.stone} />)}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.9, 0, D / 2 + 0.55]}>
            <Box s={[2.6, 0.7, 0.8]} p={[0, 0.65, 0]} m={[red, red, tops, red, red, red]} />
            <Box s={[0.1, 0.7, 0.1]} p={[-1.2, 0.35, 0.3]} m={wood} />
            <Box s={[0.1, 0.7, 0.1]} p={[1.2, 0.35, 0.3]} m={wood} />
          </group>
        ))}
        {/* carved beam over the shops, then the first floor with the window */}
        <Box s={[W + 0.2, 0.3, D + 0.3]} p={[0, 0.3 + GH + 0.1, 0]} m={wood} />
        <Box s={[W + 0.3, 0.1, D + 0.5]} p={[0, 0.3 + GH + 0.3, 0]} m={wood2} />
        <group position={[0, 0.3 + GH + 0.3 + 1.8, D / 2 + 0.02]}><PeacockWin s={0.85} /></group>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 3.7, 0.3 + GH + 2.2, D / 2 + 0.03]}>
            <Box s={[1.5, 1.7, 0.08]} m={[wood, wood, wood, wood, sideWin, wood]} />
            <Box s={[1.7, 0.1, 0.34]} p={[0, -0.9, 0.12]} m={wood2} />
          </group>
        ))}
        {/* eave: timber band, rafters, tiled roof */}
        <Box s={[W + 0.5, 0.3, D + 0.6]} p={[0, TH + 0.2, 0]} m={wood} />
        <Struts w={W + 0.4} d={D + 0.5} y={TH + 0.3} dens={2} h={0.8} sw={0.1} m={wood2} />
        <Roof w={W + 2.6} d={D + 3.0} h={1.1} y={TH + 0.3} m={terraRoof('#a86a46', 0.5)} sag={1.15} lift={0.04} fascia={false} />
        <Box s={[W + 2.2, 0.06, 0.06]} p={[0, TH + 0.26, (D + 3.0) / 2 - 0.05]} m={wood} cast={false} />
        <Frame s={[W + 1.2, TH + 2.2, D + 3]} p={[0, (TH + 2.2) / 2, 0.4]} />
      </group>
    );
  }
  function PeacockEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={44} mat={paverMat(44)} />
        <Hills seed={6} />
        <LongHall p={[-(4.8 + 8), 0, 0]} L={16} st={3} d={3.0} base="#b86a4c" />
        <LongHall p={[4.8 + 8, 0, 0]} L={16} st={4} d={3.0} base="#c07a55" roof="#9a6650" />
        <LongHall p={[0, 0, 20]} r={Math.PI} L={40} st={3} base="#b06a4c" />
        <LongHall p={[0, 0, -12]} L={34} st={3} base="#b86a4c" roof="#7d5444" />
        <LongHall p={[-27, 0, 3]} r={Math.PI / 2} L={20} st={2} base="#efe6d6" plaster roof="#7d5444" />
        <group position={[26, 0, 18]} rotation={[0, -Math.PI / 2, 0]} scale={0.7}><DattaBody /></group>
        <Box s={[36, 0.02, 6]} p={[0, 0.02, 7]} m={M.plain('#b09a88')} cast={false} />
        <group position={[18, 0, 30]}><Tree p={[0, 0, 0]} s={2} /></group>
      </group>
    );
  }
  function TachupalEnv({ lane = false }) {
    const M = useM();
    return (
      <group>
        <Floor r={44} mat={paverMat(44)} />
        <Hills seed={6} />
        <Row x={-9.5} z={-0.4} n={4} step={3.4} seed={21} smin={3} smax={4} plasterP={0} />
        <Row x={9.5} z={-0.4} n={4} step={3.4} seed={22} smin={3} smax={4} plasterP={0} />
        <Row x={0} z={-8} n={14} step={3.2} seed={23} smin={3} smax={4} />
        <Row x={0} z={13} ry={Math.PI} n={12} step={3.3} seed={24} smin={2} smax={4} />
        <Row x={-27} z={0} ry={Math.PI / 2} n={8} step={3.3} seed={25} smin={2} smax={4} />
        <group position={[26, 0, 14]} rotation={[0, -Math.PI / 2, 0]} scale={0.7}><DattaBody /></group>
        <group position={[18, 0, 30]}><Tree p={[0, 0, 0]} s={2} /></group>
        <Box s={[40, 0.01, 2.6]} p={[0, 0.01, 5]} m={M.plain('#b09a88')} cast={false} />
      </group>
    );
  }
  function DattaMain() {
    return (
      <group>
        <DattaBody />
        <Frame s={[10.5, 9.5, 12.5]} p={[0, 4.7, 2]} />
      </group>
    );
  }
  function DattaEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={44} mat={paverMat(44)} />
        <Hills seed={6} />
        <Row x={-13} z={-3} ry={Math.PI / 2} n={5} step={3.3} seed={31} smin={3} smax={4} />
        <Row x={13} z={-3} ry={-Math.PI / 2} n={5} step={3.3} seed={32} smin={3} smax={4} />
        <Row x={0} z={-12} n={9} step={3.3} seed={33} smin={3} smax={4} />
        <Row x={-6} z={26} ry={Math.PI} n={12} step={3.3} seed={34} smin={2} smax={4} />
        <group position={[-20, 0, 12]} rotation={[0, Math.PI / 2, 0]}>
          <Box s={[8, 0.8, 5]} p={[0, 0.4, 0]} m={M.mat('brick', 4, 1, { color: '#f0bfa4' })} />
          <Roof w={9.4} d={6.4} h={1.1} y={3.2} m={M.mat('roof', 6, 2, { color: '#a8684c' })} sag={1.2} fascia={false} />
          <Box s={[7.6, 2.4, 4.6]} p={[0, 2.0, 0]} m={M.plain('#6a3a1e')} />
        </group>
      </group>
    );
  }

  /* ================= valley-edge shrines ================= */
  const stoneM = (M) => M.mat('granite', 1, 1, { color: '#ffffff' });
  const redBrick = (M, rx = 4, ry = 1) => M.mat('brick', rx, ry, { color: '#f0bfa4' });
  function Pavilion({ p, s = 1, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[2.4, 0.3, 2.4]} p={[0, 0.15, 0]} m={M.plain('#efe8dc')} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => <Cyl key={`${a}${b}`} rt={0.07} h={1.2} p={[a * 0.95, 0.9, b * 0.95]} m={M.plain('#6a3a1e')} seg={8} />)}
        <Roof w={3} d={3} h={0.8} y={1.5} m={M.mat('roof', 3, 3, { color: '#a8684c' })} sag={1.2} fascia={false} />
      </group>
    );
  }
  /* --- Siddha Pokhari: big rectangular tank, white stepped coping, brick walkway, small red-roofed pavilions, peepal tree --- */
  function PokPav({ p, s = 1, r = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[3.4, 0.5, 3.0]} p={[0, 0.25, 0]} m={M.plain('#efeae0')} />
        <Box s={[2.6, 1.25, 2.2]} p={[0, 1.1, -0.2]} m={M.plain('#f3eee4', { roughness: 0.9 })} />
        {[-1, 0, 1].map((x) => <Box key={x} s={[0.5, 0.9, 0.05]} p={[x * 0.8, 1.2, 0.92]} m={M.plain('#5a3418')} />)}
        {[-1.3, 1.3].map((x) => <Cyl key={x} rt={0.09} h={1.3} p={[x, 1.15, 1.2]} m={M.plain('#a0482e')} seg={8} />)}
        <Roof w={4.4} d={3.8} h={0.9} y={1.75} m={M.mat('roof', 3, 3, { color: '#b05a3c' })} sag={1.15} fascia={false} />
      </group>
    );
  }
  function SiddhaMain() {
    const M = useM();
    const W = 32; const D = 17;
    const wall = M.plain('#f3efe6', { roughness: 0.85 });
    const walk = M.plain('#b98e66', { roughness: 1 });
    const tr = M.plain('#4a3a2a', { roughness: 1 });
    return (
      <group>
        <Water w={W} d={D} p={[0, 0.02, 0]} color="#5c8c5a" />
        {[0, 1].map((k) => (
          <group key={k}>
            {[1, -1].map((q) => <Box key={q} s={[W + 1.4 + k * 0.9, 0.3 + k * 0.1, 0.5]} p={[0, 0.15 + k * 0.12, q * (D / 2 + 0.25 + k * 0.4)]} m={wall} />)}
            {[1, -1].map((q) => <Box key={q} s={[0.5, 0.3 + k * 0.1, D]} p={[q * (W / 2 + 0.25 + k * 0.4), 0.15 + k * 0.12, 0]} m={wall} />)}
          </group>
        ))}
        {[1, -1].map((q) => <Box key={q} s={[W + 9, 0.04, 3.6]} p={[0, 0.02, q * (D / 2 + 2.8)]} m={walk} cast={false} />)}
        {[1, -1].map((q) => <Box key={q} s={[3.6, 0.04, D]} p={[q * (W / 2 + 2.8), 0.02, 0]} m={walk} cast={false} />)}
        {[0, 1, 2].map((k) => <Box key={k} s={[5, 0.12, 0.5]} p={[-6, 0.06, D / 2 - 0.2 - k * 0.45]} m={wall} cast={false} />)}
        {[-12, -3, 6, 13].map((x, i) => <PokPav key={x} p={[x, 0, -D / 2 - 3.2]} s={0.85 + (i % 2) * 0.1} />)}
        <PokPav p={[W / 2 + 3.2, 0, -2]} r={-Math.PI / 2} s={0.9} />
        <PokPav p={[-W / 2 - 3.2, 0, 3]} r={Math.PI / 2} s={0.9} />
        <group position={[W / 2 + 4, 0, D / 2 - 1]}>
          <Cyl rt={0.55} rb={1.1} h={3.4} p={[0, 1.7, 0]} m={tr} seg={10} />
          <Tree p={[0, 2.4, 0]} s={3.4} kind="broad" />
        </group>
        <group position={[-W / 2 - 4, 0, -D / 2 - 1]}><Tree p={[0, 0, 0]} s={3.0} kind="broad" /></group>
        <Frame s={[W + 10, 4, D + 10]} p={[0, 2, 0]} />
      </group>
    );
  }
  function SiddhaEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={52} mat={M.plain('#a89468', { roughness: 1 })} />
        <Hills seed={7} h={8} r={70} />
        {Array.from({ length: 34 }, (_, i) => { const a = (i / 34) * Math.PI * 2; if (front(a)) return null; return <Tree key={i} p={[Math.cos(a) * (28 + (i % 3) * 3), 0, Math.sin(a) * (22 + (i % 3) * 3)]} s={1.8 + R(i, 3) * 1.4} kind={i % 5 ? 'broad' : 'pine'} />; })}
        <Row x={-6} z={-36} n={14} step={3.2} seed={41} smin={2} smax={3} />
        <Row x={-38} z={2} ry={Math.PI / 2} n={7} step={3.2} seed={42} smin={2} smax={3} />
        <group position={[-20, 0, -30]}>
          <Cyl rt={0.12} rb={0.35} h={16} p={[0, 8, 0]} m={M.plain('#c8c8c8')} seg={4} />
          {[0, 1, 2, 3].map((k) => <Box key={k} s={[0.9 - k * 0.15, 0.3, 0.9 - k * 0.15]} p={[0, 4 + k * 3, 0]} m={M.plain('#c24a3a')} cast={false} />)}
        </group>
      </group>
    );
  }

  /* --- Dakshinkali: shrine in a forested ravine, tin roofs, red valance, teal railings, stream pool --- */
  function DakshinMain() {
    const M = useM();
    const red = M.plain('#c2362b', { roughness: 0.9 });
    const teal = M.plain('#2f9a84', { roughness: 0.6 });
    const st = stoneM(M);
    const tinM = useCMat('tin', 128, 128, (g, w, h) => { g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i += 1) { g.fillStyle = i % 2 ? '#b4b9be' : '#7e848a'; g.fillRect(i * 8, 0, 8, h); } });
    return (
      <group>
        <Box s={[18, 0.4, 13]} p={[0, 0.2, -0.5]} m={M.plain('#c4b9a4', { roughness: 0.95 })} />
        <Box s={[18.2, 0.8, 0.5]} p={[0, 0.0, 6.2]} m={M.mat('granite', 6, 1, { color: '#cbbfa8' })} />
        <group position={[0, 0.4, -4.4]}>
          <Box s={[9, 1.7, 3.6]} p={[0, 0.85, 0]} m={M.mat('granite', 3, 1, { color: '#e8dfd0' })} />
          {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => <Box key={x} s={[0.55, 1.1, 0.06]} p={[x, 0.75, 1.82]} m={M.plain('#1a0e07')} />)}
          <Roof w={10} d={5.6} h={1.15} y={1.7} m={tinM} sag={1.0} lift={0} fascia={false} />
          <Box s={[10, 0.18, 0.05]} p={[0, 1.65, 2.82]} m={red} cast={false} />
          {Array.from({ length: 26 }, (_, i) => <Box key={i} s={[0.28, 0.32, 0.03]} p={[-4.7 + i * 0.376, 1.4, 2.84]} m={red} cast={false} />)}
          <Box s={[3.6, 1.3, 2.6]} p={[0, 3.0, -0.2]} m={M.plain('#6a3a24')} />
          <Box s={[4.4, 0.12, 3.4]} p={[0, 3.75, -0.2]} m={red} />
          {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.3, 0.3, 0.03]} p={[-1.98 + i * 0.36, 3.55, 1.5]} m={red} cast={false} />)}
          <Roof w={4.6} d={3.4} h={0.8} y={3.75} m={tinM} sag={1.1} lift={0} fascia={false} />
          <group position={[0, 4.55, -0.2]}>
            <Box s={[0.7, 0.55, 0.7]} p={[0, 0.27, 0]} m={M.plain('#2a2a2e')} />
            <mesh position={[0, 0.8, 0]} material={tinM} castShadow><coneGeometry args={[0.65, 0.5, 4]} /></mesh>
            <Gajur y={1.0} s={0.4} />
          </group>
        </group>
        <group position={[-6.2, 0.4, 0.2]}>
          <Box s={[4.2, 1.0, 3.4]} p={[0, 0.5, 0]} m={M.plain('#e6e0d2')} />
          {[-1.6, -0.5, 0.5, 1.6].map((x) => <Box key={x} s={[0.45, 1.4, 0.4]} p={[x, 1.6, 1.4]} m={M.plain('#a8442a')} />)}
          <Box s={[3.9, 1.2, 0.2]} p={[0, 1.55, -1.5]} m={M.plain('#6a3a24')} />
          <Roof w={5.2} d={4.4} h={1.0} y={2.2} m={M.mat('roof', 3, 3, { color: '#b05a3c' })} sag={1.15} fascia={false} />
          <Gajur y={3.15} s={0.35} />
        </group>
        <Water w={8} d={3.6} p={[-1.0, 0.43, 2.4]} color="#6f9a8c" />
        {[0.6, 4.4].map((z, i) => <Box key={i} s={[8.4, 0.35, 0.3]} p={[-1.0, 0.55, z]} m={teal} />)}
        {Array.from({ length: 6 }, (_, k) => <Box key={k} s={[3.4, 0.12 + 0.07 * k, 0.55]} p={[5.6, 0.4 + 0.04 * k, 0.6 + k * 0.55]} m={st} />)}
        <Cyl rt={0.08} rb={0.2} h={0.6} p={[-1, 0.7, 2.4]} m={st} seg={8} />
        <Box s={[17.4, 0.1, 0.1]} p={[0, 1.15, 6.3]} m={teal} />
        <Box s={[17.4, 0.1, 0.1]} p={[0, 0.8, 6.3]} m={teal} />
        {Array.from({ length: 24 }, (_, i) => <Box key={i} s={[0.07, 0.75, 0.07]} p={[-8.6 + i * 0.75, 0.82, 6.3]} m={teal} />)}
        <Box s={[0.14, 4.6, 0.14]} p={[-8, 2.3, -1.5]} m={M.plain('#d6a53a')} />
        <Box s={[0.14, 4.2, 0.14]} p={[8, 2.1, -1.5]} m={M.plain('#d6a53a')} />
        <Cyl rt={0.09} h={5.2} p={[7.2, 2.6, 2]} m={M.plain('#80909a')} seg={6} />
        <PrayerFlags from={[-8, 4.4, -1.5]} to={[8, 3.9, -1.5]} n={30} />
        <PrayerFlags from={[-8, 3.8, 5]} to={[8, 3.4, 5]} n={28} />
        <Frame s={[19, 6, 14]} p={[0, 2.8, 0]} />
      </group>
    );
  }
  function DakshinEnv() {
    const M = useM();
    const slope = (cx, cz, Rr, H, n, seed, kind) => Array.from({ length: n }, (_, i) => {
      const a = R(i, seed) * Math.PI * 2; const d = R(i, seed + 1) * Rr * 0.85; const y = H * (1 - d / Rr) - 1.2;
      return <Tree key={`${seed}${i}`} p={[cx + Math.cos(a) * d, y, cz + Math.sin(a) * d]} s={1.7 + R(i, seed + 2) * 1.3} kind={(i % kind) ? 'pine' : 'broad'} />;
    });
    return (
      <group>
        <Floor r={30} mat={M.plain('#a79c84', { roughness: 1 })} />
        <mesh position={[0, 11, -42]} material={M.mat('grass', 6, 6, { color: '#6a8a46' })} receiveShadow><coneGeometry args={[28, 24, 16]} /></mesh>
        <mesh position={[-36, 8, -10]} material={M.mat('grass', 6, 6, { color: '#6a8a46' })} receiveShadow><coneGeometry args={[18, 18, 14]} /></mesh>
        <mesh position={[36, 9, -14]} material={M.mat('grass', 6, 6, { color: '#6a8a46' })} receiveShadow><coneGeometry args={[19, 20, 14]} /></mesh>
        {slope(0, -42, 28, 24, 46, 3, 3)}
        {slope(-36, -10, 18, 18, 22, 5, 3)}
        {slope(36, -14, 19, 20, 24, 8, 3)}
        <Box s={[22, 2.4, 1]} p={[0, 1.2, -8.2]} m={M.plain('#8f8670', { roughness: 1 })} />
        <Bld p={[-14, 3.2, -14]} w={4} d={3} st={3} plaster base="#e8d890" roof="#a8442a" />
        {[0, 1, 2, 3, 4].map((k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[44, 3 + k * 2.4, -30 - k * 1.5]} material={M.mat('grass', 8, 1, { color: k % 2 ? '#c8c060' : '#98ac58' })}><planeGeometry args={[18 - k * 2, 1.3]} /></mesh>)}
        <Hills seed={9} h={14} col="#5f8040" r={64} />
              </group>
    );
  }


  /* --- Adinath Lokeshwar, Chobhar --- */
  /** A wall of hundreds of hanging bronze bells, pots and discs, merged to two meshes. Faces +z, bottom edge at the group origin. */
  function BellWall({ w, h, p, r = 0 }) {
    const M = useM();
    const g = useMemo(() => {
      const bells = []; const discs = [];
      const nx = Math.round(w / 0.21); const ny = Math.round(h / 0.27);
      for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += 1) {
        if (R(i * 7 + j, 3) < 0.16) continue;
        const x = -w / 2 + (i + 0.5) * (w / nx) + (R(j, i) - 0.5) * 0.05; const y = 0.14 + j * (h / ny) + (R(i, j) - 0.5) * 0.04;
        if ((i + j) % 3 === 0) { const d = new THREE.CylinderGeometry(0.085 + R(i, j) * 0.03, 0.085, 0.03, 12); d.rotateX(Math.PI / 2); d.translate(x, y, 0.05); discs.push(d); }
        else { const c = new THREE.CylinderGeometry(0.045, 0.1 + R(j, i) * 0.03, 0.15, 8); c.rotateX(-Math.PI / 2); c.translate(x, y, 0.09); bells.push(c); }
      }
      return { bells: mergeGeometries(bells), discs: mergeGeometries(discs) };
    }, [w, h]);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <mesh geometry={g.bells} material={M.plain('#b9893b', { metalness: 0.5, roughness: 0.45, emissive: '#2a1a06' })} castShadow />
        <mesh geometry={g.discs} material={M.plain('#8f6a2c', { metalness: 0.5, roughness: 0.5, emissive: '#1e1204' })} />
      </group>
    );
  }
  /** Small bells hung along an eave edge. */
  function EaveBells({ w, d, y, n = 14 }) {
    const M = useM();
    const g = useMemo(() => {
      const parts = [];
      [[w, d / 2, 0], [w, -d / 2, 0], [d, w / 2, 1], [d, -w / 2, 1]].forEach(([len, off, side]) => {
        const nn = Math.max(4, Math.round((n * len) / w));
        for (let i = 0; i < nn; i += 1) {
          const c = new THREE.CylinderGeometry(0.03, 0.07, 0.14, 8);
          const t = ((i + 0.5) / nn - 0.5) * len * 0.96;
          c.translate(side ? off : t, 0, side ? t : off); parts.push(c);
        }
      });
      return mergeGeometries(parts);
    }, [w, d, n]);
    return <mesh geometry={g} position={[0, y, 0]} material={M.plain('#b9893b', { metalness: 0.5, roughness: 0.45, emissive: '#2a1a06' })} />;
  }
  /** The Chobhar vajra: a gilded thunderbolt lying on its red pedestal, a central hub and four curved prongs at each end. */
  function Vajra({ p, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.4} rb={0.46} h={0.5} p={[0, 0.25, 0]} m={M.plain('#b3202a')} />
        <Box s={[0.95, 0.1, 0.95]} p={[0, 0.02, 0]} m={M.plain('#8a1a22')} />
        <group position={[0, 0.7, 0]}>
          <Ball rad={0.13} m={M.gold} />
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 0.2, 0, 0]}>
              <Cyl rt={0.1} h={0.05} r={[0, 0, Math.PI / 2]} m={M.gold} seg={14} />
              <Ball rad={0.075} p={[k * 0.1, 0, 0]} m={M.gold} />
              {[0, 1, 2, 3].map((q) => (
                <group key={q} rotation={[(q * Math.PI) / 2, 0, 0]}><Cyl rt={0.012} rb={0.03} h={0.36} p={[k * 0.38, 0.12, 0]} r={[0, 0, -k * (Math.PI / 2 + 0.3)]} m={M.gold} seg={6} /></group>
              ))}
              <Cyl rt={0.012} rb={0.03} h={0.4} p={[k * 0.3, 0, 0]} r={[0, 0, -k * (Math.PI / 2)]} m={M.gold} seg={6} />
            </group>
          ))}
        </group>
      </group>
    );
  }
  /** Red cloth canopy with a scalloped valance, hung on four poles over the vajra. */
  function RedCanopy({ p, s = 1, h = 2.4 }) {
    const M = useM();
    const red = M.plain('#c8222a', { roughness: 0.95, side: THREE.DoubleSide });
    const blue = M.plain('#27408b', { roughness: 0.95 });
    return (
      <group position={p} scale={s}>
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <Cyl key={i} rt={0.03} h={h} p={[a * 0.95, h / 2, b * 0.95]} m={M.dark} seg={6} />)}
        <mesh position={[0, h + 0.3, 0]} rotation={[0, Math.PI / 4, 0]} material={red} castShadow><coneGeometry args={[1.9, 0.75, 4, 1, true]} /></mesh>
        <mesh position={[0, h - 0.06, 0]} rotation={[0, Math.PI / 4, 0]} material={blue}><cylinderGeometry args={[1.3, 1.5, 0.3, 4, 1, true]} /></mesh>
        {[0, 1, 2, 3].map((q) => (
          <group key={q} rotation={[0, (q * Math.PI) / 2, 0]}>
            {Array.from({ length: 7 }, (_, i) => <Box key={i} s={[0.3, 0.26, 0.04]} p={[(i - 3) * 0.39, h - 0.14, 1.33]} m={red} cast={false} />)}
          </group>
        ))}
      </group>
    );
  }
  function ChobharMain() {
    const M = useM();
    const gs = greyStone(2);
    const wf = (i) => carvedWall(i === 0 ? 'ground' : 'upper', '#8a3f2e');
    const T0 = { w: 4.0, d: 3.8, wh: 1.9, ov: 1.45, rh: 0.95 }; const T1 = { w: 3.1, d: 3.0, wh: 1.3, ov: 1.2, rh: 0.9 }; const T2 = { w: 2.3, d: 2.2, wh: 1.15, ov: 1.0, rh: 0.85 };
    return (
      <group>
        <Box s={[13, 0.3, 11.4]} p={[0, 0.15, 0]} m={M.mat('herring', 6, 5, { color: '#f0bfa4' })} />
        {/* the Adinath temple: dark carved brick storeys, deep eaves, hung with bells */}
        <group position={[0, 0.3, -1.4]}>
          <Box s={[7.2, 0.35, 6.2]} p={[0, 0.17, 0]} m={gs} />
          <Pag y0={0.35} doors={false} wallFor={wf} roofM={terraRoof('#7a4f34', 0.5)} cols={3} dens={2.3} sw={0.11} finial={1.1} strutC="#2c180d" tiers={[T0, T1, T2]} />
          <BellWall w={3.5} h={1.5} p={[-1.0, 0.45, 1.97]} />
          <BellWall w={3.3} h={1.5} p={[-2.04, 0.45, 0]} r={-Math.PI / 2} />
          <BellWall w={3.3} h={1.5} p={[2.04, 0.45, 0]} r={Math.PI / 2} />
          <EaveBells w={T0.w + 2 * T0.ov} d={T0.d + 2 * T0.ov} y={0.35 + T0.wh - 0.2} n={16} />
          <EaveBells w={T1.w + 2 * T1.ov} d={T1.d + 2 * T1.ov} y={0.35 + T0.wh + 1.2} n={12} />
        </group>
        <group position={[-3.9, 0.3, 3.2]}>
          <Box s={[3.0, 0.3, 3.0]} p={[0, 0.15, 0]} m={gs} />
          <ShikT m={gs} w={2.4} y={0.3} h={2.4} />
        </group>
        <RedCanopy p={[0.6, 0.3, 4.1]} h={2.3} />
        <Vajra p={[0.6, 0.3, 4.1]} s={1.2} />
        <BellPavilion p={[3.9, 0.3, 3.3]} s={0.75} />
        {[-1, 1].map((k) => <group key={k} position={[k * 5.5, 0.3, 1.2]}>{Array.from({ length: 7 }, (_, i) => <group key={i} position={[0, 0, -i * 0.55]}><Cyl rt={0.11} h={0.42} p={[0, 0.52, 0]} m={M.plain(i % 2 ? '#b8892f' : '#9c2a20')} seg={10} /><Cyl rt={0.02} h={0.5} p={[0, 0.25, 0]} m={M.dark} seg={6} /></group>)}</group>)}
        {/* two-storey brick and timber ranges close the courtyard */}
        <LongHall p={[-6.9, 0.3, -0.5]} r={Math.PI / 2} L={11} st={2} d={2.0} base="#9a4a36" roof="#6a4a38" />
        <LongHall p={[6.9, 0.3, -0.5]} r={-Math.PI / 2} L={11} st={2} d={2.0} base="#9a4a36" roof="#6a4a38" />
        <LongHall p={[0, 0.3, -6.7]} L={13} st={2} d={1.8} base="#8f4430" roof="#6a4a38" />
        <BellWall w={7} h={1.2} p={[-6.0, 0.55, -0.5]} r={Math.PI / 2} />
        <Frame s={[14.5, 7.8, 13]} p={[0, 3.9, -0.3]} />
      </group>
    );
  }
  function ChobharEnv() {
    const M = useM();
    return (
      <group>
        <mesh position={[0, -6.02, 0]} material={M.mat('grass', 10, 4, { color: '#86a060' })} receiveShadow><cylinderGeometry args={[10, 26, 12, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -12, 0]} material={M.mat('grass', 20, 20, { color: '#b8c890' })}><circleGeometry args={[120, 32]} /></mesh>
        <Water w={90} d={5} p={[0, -11.9, 24]} />
        {Array.from({ length: 34 }, (_, i) => { const a = (i / 34) * Math.PI * 2; const r = 11 + (i % 4) * 2.2; if (front(a)) return null; const y = -((r - 10) / 16) * 12; return <Tree key={i} p={[Math.cos(a) * r, y, Math.sin(a) * r]} s={1.4 + R(i, 4)} kind={i % 3 ? 'broad' : 'pine'} />; })}
        {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3; return <Bld key={i} p={[Math.cos(a) * 14, -2.6, Math.sin(a) * 14]} r={-a + Math.PI / 2} w={2.6} st={2 + (i % 2)} plaster={i % 2 === 0} base={i % 2 ? '#b8664a' : '#efe6d6'} />; })}
        <Hills seed={12} h={12} r={65} />
      </group>
    );
  }
  /* --- Guhyeshwari --- */
  /** Compound gateway: painted cream pillars with a gilt arch, carved hood and a small tiled roof. Faces +z. */
  function GuhyeGate() {
    const M = useM();
    const cream = M.plain('#e9dcb8', { roughness: 0.9 });
    const gd = M.plain('#c8922a', { metalness: 0.7, roughness: 0.45 });
    const dk = M.plain('#2a150a');
    return (
      <group>
        <Box s={[3.6, 0.3, 1.5]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[3.2, 3.0, 1.0]} p={[0, 1.8, 0]} m={cream} />
        <Box s={[1.3, 2.0, 0.12]} p={[0, 1.3, 0.5]} m={dk} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Box s={[0.3, 2.2, 0.3]} p={[k * 0.85, 1.4, 0.55]} m={M.plain('#d6a53a', { roughness: 0.6 })} />
            <Box s={[0.5, 1.7, 0.1]} p={[k * 1.35, 1.2, 0.52]} m={M.plain('#2f7a52')} />
            <Box s={[0.4, 0.4, 0.12]} p={[k * 1.35, 2.2, 0.55]} m={M.plain('#a12a1a')} />
          </group>
        ))}
        <mesh position={[0, 2.3, 0.52]} material={gd}><torusGeometry args={[0.8, 0.07, 6, 20, Math.PI]} /></mesh>
        <mesh position={[0, 2.3, 0.5]} material={M.plain('#8a1a1a')}><circleGeometry args={[0.76, 20, 0, Math.PI]} /></mesh>
        <Ball rad={0.18} p={[0, 2.62, 0.6]} m={M.gold} />
        <Box s={[3.0, 0.16, 0.5]} p={[0, 2.97, 0.4]} m={M.plain('#4a2a16')} />
        <Roof w={4.2} d={2.4} h={0.8} y={3.3} m={terraRoof('#b8482e', 0.6)} sag={1.2} lift={0.1} fascia={false} />
        <Gajur y={4.05} s={0.4} />
      </group>
    );
  }
  /** Tall stone pillar on a red pedestal carrying a gilded animal or sun disc. */
  function GuhyePillar({ x, z, h, top }) {
    const M = useM();
    const gs = greyStone(1);
    return (
      <group position={[x, 0.2, z]}>
        <Box s={[0.95, 0.24, 0.95]} p={[0, 0.12, 0]} m={M.plain('#a8302a')} />
        <Cyl rt={0.38} rb={0.45} h={0.4} p={[0, 0.44, 0]} m={gs} seg={12} />
        <Cyl rt={0.16} rb={0.22} h={h} p={[0, 0.64 + h / 2, 0]} m={gs} seg={12} />
        <Cyl rt={0.34} rb={0.18} h={0.28} p={[0, 0.64 + h + 0.12, 0]} m={M.gold} seg={12} />
        <group position={[0, 0.64 + h + 0.26, 0]} scale={1.1}>
          {top === 'lion' && <Lion m={M.gold} />}
          {top === 'garuda' && <Garuda m={M.gold} />}
          {top === 'disc' && <><mesh position={[0, 0.45, 0]} material={M.gold}><torusGeometry args={[0.4, 0.05, 6, 24]} /></mesh>{Array.from({ length: 12 }, (_, i) => <Cyl key={i} rt={0.012} h={0.36} p={[Math.cos((i / 12) * Math.PI * 2) * 0.2, 0.45 + Math.sin((i / 12) * Math.PI * 2) * 0.2, 0]} r={[0, 0, (i / 12) * Math.PI * 2 - Math.PI / 2]} m={M.gold} seg={4} />)}<Ball rad={0.12} p={[0, 0.45, 0]} m={M.gold} /></>}
        </group>
      </group>
    );
  }
  function GuhyeMain() {
    const M = useM();
    const red = M.plain('#a63d33', { roughness: 1 });
    const cope = M.plain('#e8dcc0', { roughness: 0.9 });
    const st = stoneM(M);
    const T0 = { w: 3.4, d: 3.4, wh: 1.7, ov: 1.35, rh: 0.85 }; const T1 = { w: 2.5, d: 2.5, wh: 1.2, ov: 1.05, rh: 0.8 };
    return (
      <group>
        <Box s={[16, 0.2, 14]} p={[0, 0.1, 0]} m={M.mat('stone', 6, 5, { color: '#fff2da' })} />
        {/* red compound wall with a pale coping, and the gateway in the south face */}
        {[[0, -7, 16, 0.5], [-8, 0, 0.5, 14], [8, 0, 0.5, 14]].map(([x, z, w, d], i) => <group key={i}><Box s={[w, 1.5, d]} p={[x, 0.95, z]} m={red} /><Box s={[w + (w > d ? 0.1 : 0.22), 0.12, d + (w > d ? 0.22 : 0.1)]} p={[x, 1.76, z]} m={cope} cast={false} /></group>)}
        {[-1, 1].map((k) => <group key={`f${k}`}><Box s={[5.2, 1.5, 0.5]} p={[k * 5.4, 0.95, 7]} m={red} /><Box s={[5.3, 0.12, 0.62]} p={[k * 5.4, 1.76, 7]} m={cope} cast={false} /></group>)}
        <group position={[0, 0.2, 7]}><GuhyeGate /></group>
        {/* the gilded two-roof temple on its stone platform */}
        <group position={[0, 0.2, -2.4]} scale={1.3}>
          <Box s={[5.6, 0.3, 5.6]} p={[0, 0.15, 0]} m={st} />
          <Box s={[4.9, 0.2, 4.9]} p={[0, 0.4, 0]} m={st} />
          <Stairs w={1.8} z0={2.8 + 1.0} z1={2.45} y1={0.5} n={4} m={st} />
          <Pag y0={0.5} doors={false} wallFor={(i) => carvedWall(i === 0 ? 'cream' : 'cream', i === 0 ? '#eadcb4' : '#e2d2a8')} roofM={goldRoof()} fringe="#d9a63c" cols={3} dens={2.2} sw={0.1} finial={0.9} cluster={0} strutC="#b8862a" tiers={[T0, T1]} />
          {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <group key={i} position={[a * 1.0, 4.1, b * 1.0]}><Cyl rt={0.03} rb={0.06} h={0.9} p={[0, 0.45, 0]} r={[b * 0.2, 0, -a * 0.2]} m={M.gold} seg={6} /><Ball rad={0.08} p={[-a * 0.18, 0.95, -b * 0.18]} m={M.gold} /></group>)}
        </group>
        {/* three pillars before the temple */}
        <GuhyePillar x={-2.2} z={2.4} h={3.0} top="lion" />
        <GuhyePillar x={0} z={3.0} h={3.6} top="disc" />
        <GuhyePillar x={2.2} z={2.4} h={3.0} top="garuda" />
        {/* red-brick dharmashala ranges, red tin roofs */}
        <LongHall p={[-6.4, 0.2, -2.8]} r={Math.PI / 2} L={8} st={2} d={2.2} base="#a85a42" roof="#b3262a" />
        <LongHall p={[6.4, 0.2, -2.8]} r={-Math.PI / 2} L={8} st={2} d={2.2} base="#a85a42" roof="#b3262a" />
        <Frame s={[16.5, 7.6, 14.5]} p={[0, 3.7, 0]} />
      </group>
    );
  }
  function GuhyeEnv() {
    const M = useM();
    const wall = stoneM(M);
    return (
      <group>
        <Floor r={30} mat={M.plain('#9fae62', { roughness: 1 })} />
        {/* the Bagmati below the compound, a stone embankment and ghat steps down to the water */}
        <Water w={90} d={9} p={[0, 0.03, -19]} color="#7a7a52" />
        <Box s={[40, 0.5, 0.7]} p={[0, 0.25, -14.3]} m={wall} />
        {Array.from({ length: 7 }, (_, k) => <Box key={k} s={[9, 0.08 + k * 0.07, 0.7]} p={[-5, (0.08 + k * 0.07) / 2, -14.3 + (k + 1) * 0.7]} m={wall} />)}
        {Array.from({ length: 7 }, (_, k) => <Box key={`b${k}`} s={[0.7, 0.08 + k * 0.07, 6]} p={[13 - (k + 1) * 0.7, (0.08 + k * 0.07) / 2, -11]} m={wall} />)}
        <group position={[0, 0, -19]}>
          <Box s={[12, 0.2, 0.2]} p={[0, 2.4, 0]} m={M.dark} />
          <PrayerFlags from={[-6, 2.4, 0]} to={[6, 2.4, 0]} n={22} />
        </group>
        {/* votive domed shrines on the bank */}
        {[[-12, -10], [11, -9.5], [15, 4]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Cyl rt={0.9} rb={1.0} h={1.0} p={[0, 0.5, 0]} m={M.plain('#efe8dc')} seg={8} />{[0, 1, 2, 3].map((q) => <Box key={q} s={[0.5, 0.6, 0.05]} p={[Math.sin(q * Math.PI / 2) * 0.93, 0.45, Math.cos(q * Math.PI / 2) * 0.93]} r={[0, q * Math.PI / 2, 0]} m={M.plain('#2a1a10')} />)}<mesh position={[0, 1.3, 0]} material={greyStone(1)}><coneGeometry args={[1.05, 1.2, 8]} /></mesh><Gajur y={1.85} s={0.35} /></group>)}
        {/* the old peepal tree shading the compound corner, and woodland behind */}
        <group position={[-12, 0, -6]}><Cyl rt={0.7} rb={1.2} h={3.4} p={[0, 1.7, 0]} m={M.plain('#4a3a2a', { roughness: 1 })} seg={10} /><Tree p={[0, 2.6, 0]} s={3.6} kind="broad" /></group>
        {Array.from({ length: 16 }, (_, i) => <Tree key={i} p={[-24 + i * 3.2, 0, -30 - (i % 3) * 2]} s={2 + R(i, 1)} />)}
        <Bld p={[-14, 0, 12]} w={4} d={3} st={2} roof="#c04a3a" />
        <Bld p={[14, 0, 13]} w={4} d={3} st={2} roof="#c04a3a" />
        <Hills seed={15} h={9} />
      </group>
    );
  }
  /* --- Gokarneshwor Mahadev --- */
  /** Small stone shrine on a pedestal: a figure under a little tiled hood. */
  function StoneShrine({ p, r = 0, s = 1, G = Goddess }) {
    const M = useM();
    const gs = greyStone(1);
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[0.9, 0.22, 0.8]} p={[0, 0.11, 0]} m={gs} />
        <Box s={[0.6, 0.5, 0.5]} p={[0, 0.47, 0]} m={gs} />
        <group position={[0, 0.72, 0]} scale={0.9}><G m={gs} /></group>
        <Roof w={1.3} d={1.1} h={0.34} y={1.35} m={terraRoof('#7a5a3a', 0.6)} sag={1.2} lift={0.05} fascia={false} />
      </group>
    );
  }
  /** The round red-brick well of Gokarna: a low drum with a rope-twist band, four square brick posts round it. */
  function RedWell({ p }) {
    const M = useM();
    const rb = M.mat('brick', 4, 1, { color: '#e0623f' });
    return (
      <group position={p}>
        <Box s={[2.4, 0.12, 2.4]} p={[0, 0.06, 0]} m={M.plain('#c8503a')} />
        <Cyl rt={0.5} rb={0.55} h={0.55} p={[0, 0.4, 0]} m={rb} seg={24} />
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.plain('#c8503a')}><torusGeometry args={[0.55, 0.05, 6, 28]} /></mesh>
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <Box key={i} s={[0.4, 0.85, 0.4]} p={[a * 1.0, 0.54, b * 1.0]} m={rb} />)}
      </group>
    );
  }
  function GokarnaMain() {
    const M = useM();
    const st = stoneM(M);
    const brick = redBrick(M, 4, 1);
    const wf = (i) => carvedWall(i === 0 ? 'ground' : 'upper', '#a84f38');
    return (
      <group>
        {/* stone-edged brick platform, with the stone stairs of the ghat falling away to the river */}
        <Box s={[13, 0.5, 12]} p={[0, 0.25, 0]} m={brick} />
        <Box s={[13.1, 0.08, 12.1]} p={[0, 0.5, 0]} m={st} cast={false} />
        <Stairs w={2.8} z0={6 + 1.4} z1={5} y1={0.5} n={5} m={st} />
        {Array.from({ length: 5 }, (_, k) => <Box key={k} s={[0.8, 0.45 - k * 0.08, 8]} p={[7.0 + k * 0.8, (0.45 - k * 0.08) / 2, 0]} m={st} />)}
        <Pag y0={0.5} doors={false} wallFor={wf} roofM={mossRoof(1.3)} cols={3} dens={2.2} sw={0.1} finial={1.0} strutC="#3a2010" tiers={[
          { w: 4.6, d: 4.6, wh: 1.8, ov: 1.9, rh: 1.0 }, { w: 3.4, d: 3.4, wh: 1.35, ov: 1.4, rh: 0.92 }, { w: 2.4, d: 2.4, wh: 1.15, ov: 1.05, rh: 0.85 },
        ]} />
        <Nandi p={[0, 0.5, 4.3]} face={0} />
        <Pavilion p={[4.9, 0.5, 3.9]} s={0.8} r={0.3} />
        <Pavilion p={[-5.0, 0.5, -3.6]} s={0.7} r={-0.4} />
        {/* cluster of stone shrines round the temple */}
        <StoneShrine p={[-4.6, 0.5, 3.6]} r={0.5} G={Goddess} />
        <StoneShrine p={[-3.0, 0.5, 5.0]} r={0.2} G={Lion} s={0.9} />
        <StoneShrine p={[4.4, 0.5, -1.6]} r={-1.2} G={Elephant} s={0.9} />
        <StoneShrine p={[-5.2, 0.5, 0.6]} r={1.2} G={Goddess} s={1.0} />
        <Lingam p={[2.6, 0.5, 3.3]} />
        <RedWell p={[-3.6, 0.5, -3.6]} />
        <Trident p={[-1.8, 0.5, 4.6]} h={2.0} />
        <Frame s={[16, 10.8, 15]} p={[0, 5.2, 0]} />
      </group>
    );
  }
  function GokarnaEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={26} mat={M.mat('stone', 8, 8, { color: '#d8cfbd' })} />
        <Water w={9} d={90} p={[17.5, 0.03, 0]} color="#5f7d70" />
        {Array.from({ length: 4 }, (_, k) => <Box key={k} s={[0.8, 0.12 + (3 - k) * 0.1, 22]} p={[12.6 + k * 0.8, 0.06 + (3 - k) * 0.05, 0]} m={stoneM(M)} />)}
        {[0, 1, 2, 3, 4].map((k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[-18 - k * 2, 0.002 * k, -6 + k * 2]} material={M.mat('grass', 6, 2, { color: k % 2 ? '#d0c060' : '#8aa04e' })}><planeGeometry args={[18, 1.6]} /></mesh>)}
        <group position={[-14, 0, 8]}><Chaitya p={[0, 0, 0]} s={1.5} /></group>
        {Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2; if (front(a)) return null; return <Tree key={i} p={[Math.cos(a) * (17 + (i % 3) * 3), 0, Math.sin(a) * (17 + (i % 3) * 3)]} s={1.7 + R(i, 3)} kind={i % 3 ? 'broad' : 'pine'} />; })}
        <Hills seed={17} h={13} r={55} />
        <Row x={-12} z={-20} n={6} step={3.2} seed={51} smin={2} smax={3} />
        <Bld p={[9, 0, -12]} w={4} d={3} st={2} roof="#a8442a" plaster base="#efe6d6" />
      </group>
    );
  }
  /* --- Charumati Stupa --- */
  function CharuMain() {
    const M = useM();
    const eyes = useMemo(() => eyesTexture(), []);
    const harm = useMemo(() => new THREE.MeshStandardMaterial({ map: eyes, roughness: 0.8 }), [eyes]);
    const wm = M.plain('#ece8dc', { roughness: 0.9 });
    const gold = M.gold;
    const gm = M.plain('#b8903a', { metalness: 0.6, roughness: 0.4 });
    return (
      <group>
        <Cyl rt={3.4} rb={3.5} h={0.4} p={[0, 0.2, 0]} m={wm} seg={40} />
        <PrayerWheels radius={3.2} n={36} />
        <Cyl rt={3.35} h={0.9} p={[0, 0.55, 0]} m={M.plain('#dcd6c8', { transparent: true, opacity: 0.0 })} seg={4} />
        <mesh position={[0, 0.4, 0]} scale={[1, 0.62, 1]} material={wm} castShadow><sphereGeometry args={[3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
        <Box s={[1.3, 0.14, 1.3]} p={[0, 2.35, 0]} m={gm} />
        <mesh position={[0, 2.78, 0]} material={[gm, gm, gm, gm, harm, harm]} castShadow><boxGeometry args={[1.15, 0.8, 1.15]} /></mesh>
        <mesh position={[0, 2.78, 0]} rotation={[0, Math.PI / 2, 0]} material={[gm, gm, gm, gm, harm, harm]}><boxGeometry args={[1.151, 0.8, 1.151]} /></mesh>
        <Box s={[1.3, 0.22, 1.3]} p={[0, 3.07, 0]} m={M.plain('#2e8b57', { roughness: 0.9 })} cast={false} />
        {[['#2b4c8c', 0],['#e2b33c', 0.05], ['#2e8b57', 0.1], ['#c0392b', 0.15]].map(([c, o], i) => <Box key={c} s={[1.3 - i * 0.0, 0.07, 1.3]} p={[0, 3.2 + o, 0]} m={M.plain(c)} />)}
        {Array.from({ length: 13 }, (_, i) => <Box key={i} s={[1.0 - i * 0.055, 0.16, 1.0 - i * 0.055]} p={[0, 3.4 + i * 0.17, 0]} m={i % 2 ? gold : gm} />)}
        <mesh position={[0, 5.75, 0]} material={gold}><coneGeometry args={[0.3, 0.3, 16]} /></mesh>
        <Gajur y={5.8} s={0.7} />
        {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2 + 0.2; return <PrayerFlags key={k} from={[0, 5.7, 0]} to={[Math.cos(a) * 6.2, 1.0, Math.sin(a) * 6.2]} n={22} />; })}
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <group key={i} position={[a * 4.6, 0, b * 4.6]}><Chaitya p={[0, 0, 0]} s={1.2} /></group>)}
        <Box s={[0.1, 1.0, 9]} p={[-4.2, 0.5, 0]} m={M.plain('#e9e6dc')} cast={false} />
        <Frame s={[13, 6.8, 13]} p={[0, 3.2, 0]} />
      </group>
    );
  }
  function CharuEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={26} mat={M.mat('stone', 10, 10, { color: '#ffffff' })} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 14]} material={M.plain('#5a5a60')}><planeGeometry args={[80, 7]} /></mesh>
        <Row x={0} z={-12} n={9} step={3.2} seed={61} smin={3} smax={4} plasterP={0.5} />
        <Row x={-14} z={0} ry={Math.PI / 2} n={5} step={3.2} seed={62} smin={2} smax={4} />
        <Row x={14} z={0} ry={-Math.PI / 2} n={5} step={3.2} seed={63} smin={2} smax={4} />
        {[-14, -4, 6, 16].map((x) => <Cyl key={x} rt={0.1} h={7} p={[x, 3.5, -9.5]} m={M.plain('#6a6a6a')} seg={6} />)}
        <Hills seed={18} h={9} />
      </group>
    );
  }

  return {
    'bhaktapur-durbar-square': { Main: DurbarMain, Env: DurbarEnv },
    'fifty-five-window-palace': { Main: PalaceMain, Env: PalaceEnv },
    'golden-gate-bhaktapur': { Main: GoldenMain, Env: GoldenEnv },
    'vatsala-durga-temple': { Main: VatsalaMain, Env: VatsalaEnv },
    'nyatapola-temple': { Main: NyatMain, Env: () => <TaumadhiEnv focus="nyat" /> },
    'bhairavnath-temple': { Main: BhairMain, Env: () => <TaumadhiEnv focus="bhair" /> },
    'siddha-pokhari': { Main: SiddhaMain, Env: SiddhaEnv },
    'dakshinkali-temple': { Main: DakshinMain, Env: DakshinEnv },
    'adinath-lokeshwar-chobhar': { Main: ChobharMain, Env: ChobharEnv },
    'guhyeshwari-temple': { Main: GuhyeMain, Env: GuhyeEnv },
    'gokarneshwor-mahadev': { Main: GokarnaMain, Env: GokarnaEnv },
    'charumati-stupa': { Main: CharuMain, Env: CharuEnv },
    'dattatreya-temple': { Main: DattaMain, Env: DattaEnv },
    'peacock-window': { Main: PeacockMain, Env: PeacockEnv },
  };
}
