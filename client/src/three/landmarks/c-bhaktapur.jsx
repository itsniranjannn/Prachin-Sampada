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

  /** Newar house, two meshes: a painted front and a tiled roof. Faces +z. */
  function Bld({ p = [0, 0, 0], r = 0, w = 2.8, d = 2.2, st = 3, base = '#b8664a', plaster = false, roof = '#8a5e4c', ov = 0.3 }) {
    const M = useM();
    const sh = 0.8;
    const fm = facadeMat(st, base, Math.max(2, Math.round(w / 0.9)), plaster);
    const side = plaster ? M.plain(base, { roughness: 0.9 }) : M.mat('brick', 2, st, { color: lighten(base) });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, sh * st, d]} p={[0, (sh * st) / 2, 0]} m={[side, side, side, side, fm, side]} />
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
  const strutGeo = (w, d, dens, h) => {
    const parts = [];
    const o = h * 0.75;
    [[0, d / 2, w], [Math.PI, d / 2, w], [Math.PI / 2, w / 2, d], [-Math.PI / 2, w / 2, d]].forEach(([th, half, len]) => {
      const n = Math.max(2, Math.round(len * dens));
      for (let k = 0; k < n; k += 1) {
        const t = ((k + 0.5) / n - 0.5) * len * 0.94;
        const L = Math.hypot(h, o);
        const g = new THREE.BoxGeometry(0.07, L, 0.07);
        g.rotateX(Math.atan2(o, h));
        g.translate(t, -h / 2, half + o / 2 - 0.02);
        g.rotateY(th);
        parts.push(g);
      }
    });
    return mergeGeometries(parts);
  };
  function Struts({ w, d, y, dens = 1.6, h = 0.55, m }) {
    const g = useMemo(() => strutGeo(w, d, dens, h), [w, d, dens, h]);
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
  function Pag({ tiers, y0 = 0, base = '#c0704f', roofC = '#a87a5c', gold = false, porch = 0, fringe = null, cols = 3, finial = 1.2, sag = 1.45, strutC = '#5a3418', dens = 1.5, cluster = 0, wallM, doors = true, edgeC = '#3a2416', door4 = false }) {
    const M = useM();
    const wm = wallM || M.mat('brick', 3, 1, { color: lighten(base) });
    const rm = gold ? M.gold : M.mat('roof', 3, 3, { color: roofC });
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
        const um = i === 0 ? wm : upperWall(base, t.cols || cols);
        out.push(<Box key={`w${i}`} s={[t.w, t.wh, t.d]} p={[0, y + t.wh / 2, 0]} m={i === 0 ? wm : [um, um, um, um, um, um]} />);
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
      out.push(<Struts key={`st${i}`} w={t.w} d={t.d} y={y + t.wh} dens={dens} h={Math.min(0.8, t.ov * 0.55)} m={sm} />);
      out.push(<Roof key={`r${i}`} w={rw} d={rd} h={t.rh} y={y + t.wh - 0.05} m={rm} sag={sag} fascia={false} lift={0.2} />);
      if (fringe) {
        const fm2 = M.plain(fringe, { roughness: 0.9 });
        out.push(<Box key={`f1${i}`} s={[rw, 0.16, 0.05]} p={[0, y + t.wh - 0.12, rd / 2]} m={fm2} cast={false} />);
        out.push(<Box key={`f2${i}`} s={[rw, 0.16, 0.05]} p={[0, y + t.wh - 0.12, -rd / 2]} m={fm2} cast={false} />);
        out.push(<Box key={`f3${i}`} s={[0.05, 0.16, rd]} p={[rw / 2, y + t.wh - 0.12, 0]} m={fm2} cast={false} />);
        out.push(<Box key={`f4${i}`} s={[0.05, 0.16, rd]} p={[-rw / 2, y + t.wh - 0.12, 0]} m={fm2} cast={false} />);
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
    g.fillStyle = '#2b1a10'; g.fillRect(0, 0, w, h);
    const cw = w / 55;
    for (let k = 0; k < 55; k += 1) {
      const x = k * cw;
      g.fillStyle = '#5a3720'; g.fillRect(x + 1, 14, cw - 2, h - 22);
      g.fillStyle = '#6b4222'; g.beginPath(); g.moveTo(x + 1, 16); g.lineTo(x + cw / 2, 3); g.lineTo(x + cw - 1, 16); g.closePath(); g.fill();
      g.fillStyle = '#150b06'; g.fillRect(x + 5, 22, cw - 10, h - 44);
      g.strokeStyle = '#8f5a2c'; g.lineWidth = 1.5;
      for (let i = 1; i < 4; i += 1) { g.beginPath(); g.moveTo(x + 5 + ((cw - 10) * i) / 4, 22); g.lineTo(x + 5 + ((cw - 10) * i) / 4, h - 22); g.stroke(); }
      g.beginPath(); g.moveTo(x + 5, h * 0.55); g.lineTo(x + cw - 5, h * 0.55); g.stroke();
    }
    g.fillStyle = '#1e120a'; g.fillRect(0, h - 10, w, 10);
  }
  /** The Palace of Fifty-five Windows: three storeys, big pedimented windows, 55 carved windows under a deep tiled roof. */
  function Palace55({ L = 17, D = 3.4 }) {
    const M = useM();
    const bk = M.mat('brick', 5, 2, { color: '#f4c9b0' });
    const gnd = useCMat('p55g', 1024, 160, paintGround55);
    const mid = useCMat('p55m', 1024, 160, paintMid55);
    const top = useCMat('p55t', 1760, 128, paintTop55);
    const dk = M.plain('#3a2416', { roughness: 0.8 });
    const wood = M.plain('#5a3418', { roughness: 0.8 });
    const faces = (fm) => [bk, bk, bk, bk, fm, bk];
    return (
      <group>
        <Box s={[L + 0.5, 0.3, D + 0.5]} p={[0, 0.15, 0]} m={M.stone} />
        <Box s={[L, 1.1, D]} p={[0, 0.85, 0]} m={faces(gnd)} />
        <Box s={[L + 0.25, 0.1, D + 0.25]} p={[0, 1.45, 0]} m={dk} />
        <Box s={[L, 1.2, D]} p={[0, 2.1, 0]} m={faces(mid)} />
        <Box s={[L + 0.3, 0.12, D + 0.3]} p={[0, 2.76, 0]} m={dk} />
        <Box s={[L + 0.2, 1.1, D + 0.2]} p={[0, 3.37, 0]} m={[wood, wood, wood, wood, top, wood]} />
        <Struts w={L + 0.2} d={D + 0.2} y={3.94} dens={1.8} h={0.6} m={wood} />
        <Roof w={L + 2.2} d={D + 2.4} h={0.85} y={3.9} m={M.mat('roof', 14, 3, { color: '#b47c5e' })} sag={1.15} lift={0.04} fascia={false} />
        <Box s={[L + 2.2, 0.08, 0.08]} p={[0, 3.86, (D + 2.4) / 2]} m={dk} cast={false} />
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
            <Spire r0={0.3} h={0.95} y={0.78} m={m} />
          </group>
        ))}
        {minis > 4 && [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([a, b], i) => (
          <group key={`m${i}`} position={[a * w * 0.4, 0.64, b * w * 0.4]}><Spire r0={0.2} h={0.7} y={0.2} m={m} /></group>
        ))}
        <Box s={[w * 0.5, 0.14, w * 0.5]} p={[0, 1.2, 0]} m={m} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[w * 0.46 - i * 0.14, 0.12, w * 0.46 - i * 0.14]} p={[0, 1.34 + i * 0.5, 0]} m={m} />)}
        <Spire r0={w * 0.3} h={h} y={1.28} m={m} />
        {gild && <Gajur y={1.28 + h + 0.05} s={0.55} />}
      </group>
    );
  }
  /** Vatsala Durga: stone shikhara on a three-step plinth, pillared porch, animal guardians up the stairs. Faces +z. */
  function VatsalaT() {
    const M = useM();
    const st = M.plain('#c4bcab', { roughness: 0.9 });
    const dk = M.plain('#a8a090', { roughness: 0.9 });
    const lv = [{ w: 5.4, d: 5.4 }, { w: 4.8, d: 4.8 }, { w: 4.2, d: 4.2 }];
    return (
      <group>
        {lv.map((l, i) => <Box key={i} s={[l.w, 0.3, l.d]} p={[0, 0.15 + i * 0.3, 0]} m={i % 2 ? dk : st} />)}
        <Stairs w={1.5} z0={2.7 + 0.9} z1={2.1} y1={0.9} n={6} m={st} />
        {[0, 1, 2].map((i) => {
          const G = i === 0 ? Elephant : Lion;
          return [-1, 1].map((k) => <group key={`${i}${k}`} position={[k * 1.05, 0.3 * (i), 2.7 - i * 0.3 + 0.55 - 0.1]} scale={1.3}><G m={st} /></group>);
        })}
        <group position={[0, 0.9, 0]}>
          <Box s={[2.5, 1.3, 2.5]} p={[0, 0.65, 0]} m={st} />
          <PostRing w={3.4} d={3.4} h={1.25} n={5} m={st} rad={0.09} />
          <Box s={[3.7, 0.16, 3.7]} p={[0, 1.34, 0]} m={st} />
          <Box s={[3.9, 0.12, 3.9]} p={[0, 1.48, 0]} m={dk} />
          <Box s={[3.5, 0.12, 3.5]} p={[0, 1.6, 0]} m={st} />
          {[-1, 1].map((k) => <Box key={k} s={[0.9, 0.9, 0.05]} p={[0, 0.5, k * 1.27]} m={M.plain('#2a2018')} />)}
          <ShikT m={st} w={3.2} y={1.64} h={3.2} />
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

  /* --- the square: palace, gate, pillar, bell, Vatsala, Siddhi Lakshmi, Chyasilin, Pashupatinath --- */
  function SquareThings({ full = true }) {
    const M = useM();
    return (
      <group>
        <group position={[-4, 0, -9]}>
          <Palace55 />
          <group position={[-10.4, 0, 0.1]}><GGate s={0.95} /></group>
        </group>
        <group position={[-4.6, 0, -3.6]} rotation={[0, Math.PI, 0]}><KingPillar /></group>
        <group position={[-0.7, 0, -4.3]} rotation={[0, 0, 0]}><BellPavilion p={[0, 0, 0]} s={0.9} /></group>
        <group position={[3.4, 0, -3.4]}><VatsalaT /></group>
        {full && (
          <>
            <group position={[13.5, 0, 1.5]} rotation={[0, -0.25, 0]}><BrickShik /></group>
            <group position={[10.5, 0, -10.5]}><OctaMandap s={1.0} /></group>
            <group position={[-17.6, 0, 1]} rotation={[0, 0.35, 0]}>
              {[0, 1, 2].map((i) => <Box key={i} s={[6.2 - i * 0.8, 0.22, 6.2 - i * 0.8]} p={[0, 0.11 + i * 0.22, 0]} m={M.mat('brick', 3, 1, { color: '#f2c2a6' })} />)}
              <Stairs w={1.8} z0={3.9} z1={2.5} y1={0.66} n={3} m={M.stone} />
              {[-1, 1].map((k) => <group key={k} position={[k * 1.3, 0.2, 3.3]} scale={1.2}><Lion m={M.stone} /></group>)}
              <Pag y0={0.66} tiers={[{ w: 2.6, d: 2.6, wh: 1.2, ov: 0.95, rh: 0.7 }, { w: 1.9, d: 1.9, wh: 0.9, ov: 0.75, rh: 0.65 }]} porch={4} finial={0.9} />
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
        <Frame s={[30, 8, 14]} p={[0, 4, -1]} />
      </group>
    );
  }
  function DurbarEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={44} mat={paverMat(44)} />
        <Hills />
        <ArcadedHall x={-27} z={-2} ry={Math.PI / 2} n={9} />
        <Row x={-3} z={-16.5} ry={0} n={14} step={3.1} seed={3} smin={3} smax={4} />
        <Row x={24} z={0} ry={-Math.PI / 2} n={9} step={3.2} seed={8} smin={2} smax={3} />
        <Row x={-24} z={-14} ry={Math.PI / 2} n={4} step={3.2} seed={2} smin={3} smax={4} />
        {Array.from({ length: 10 }, (_, i) => <Tree key={i} p={[-30 + i * 6, 0, -22 - (i % 3) * 2]} s={1.4 + R(i, 2)} kind={i % 4 ? 'broad' : 'pine'} />)}
        <Box s={[7, 0.5, 5]} p={[10, 0.25, 9]} m={M.mat('brick', 3, 1, { color: '#f2c2a6' })} />
      </group>
    );
  }

  /* --- 55-window palace: the long front, the Golden Gate at its west end, the king's pillar, Vatsala beyond --- */
  function PalaceMain() {
    return (
      <group>
        <group scale={0.72} position={[-0.8, 0, 0]}>
          <group position={[0, 0, -3]}><Palace55 /></group>
          <group position={[-10.5, 0, -2.9]}><GGate s={0.95} /></group>
          <group position={[-2.6, 0, 3.4]} rotation={[0, Math.PI, 0]}><KingPillar /></group>
          <group position={[1.6, 0, 3.7]}><BellPavilion p={[0, 0, 0]} s={0.85} /></group>
          <group position={[9.6, 0, 5.2]} scale={0.8}><VatsalaT /></group>
        </group>
        <Frame s={[19.5, 5.4, 9]} p={[0, 2.7, 0.5]} />
      </group>
    );
  }
  function PalaceEnv() {
    return (
      <group>
        <Floor r={40} mat={paverMat(40)} />
        <Hills />
        <Row x={0} z={-17} ry={0} n={11} step={3.1} seed={4} smin={3} smax={4} />
        <Row x={-22} z={-4} ry={Math.PI / 2} n={5} step={3.2} seed={6} smin={2} smax={3} plasterP={0.8} />
        <Row x={22} z={-2} ry={-Math.PI / 2} n={6} step={3.2} seed={1} smin={2} smax={4} />
        {Array.from({ length: 6 }, (_, i) => <Tree key={i} p={[-22 + i * 9, 0, -24]} s={1.5} />)}
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
        <group position={[-5.2, 0, 4.4]} rotation={[0, Math.PI, 0]}><KingPillar /></group>
        <group position={[0.2, 0, 6]}><BellPavilion p={[0, 0, 0]} s={0.95} /></group>
        <Frame s={[16, 8.2, 13]} p={[-1.5, 4.1, 2]} />
      </group>
    );
  }
  function VatsalaEnv() {
    return (
      <group>
        <Floor r={36} mat={paverMat(36)} />
        <Hills />
        <group position={[4, 0, -10]}><Palace55 /></group>
        <group position={[-8.5, 0, -10]}><GGate s={0.95} /></group>
        <group position={[16, 0, 4]}><BrickShik /></group>
        <Row x={-26} z={0} ry={Math.PI / 2} n={7} step={3.1} seed={6} smin={2} smax={4} />
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
        <Pag y0={rise * 5} porch={7} cols={3} dens={1.7} finial={1.5} tiers={[
          { w: 5.0, d: 5.0, wh: 1.8, ov: 1.45, rh: 0.95 },
          { w: 4.35, d: 4.35, wh: 1.3, ov: 1.25, rh: 0.9 },
          { w: 3.7, d: 3.7, wh: 1.2, ov: 1.1, rh: 0.88 },
          { w: 3.1, d: 3.1, wh: 1.1, ov: 0.95, rh: 0.85 },
          { w: 2.5, d: 2.5, wh: 1.05, ov: 0.85, rh: 0.82 },
        ]} />
      </group>
    );
  }
  /** Bhairavnath: broad three-roofed temple, wide ground storey with a pillared front. Faces +z. */
  function BhairBody() {
    const M = useM();
    const brick = M.mat('brick', 6, 1, { color: '#f0bfa4' });
    const st = M.mat('granite', 1, 1, { color: '#ffffff' });
    return (
      <group>
        <Box s={[10.2, 0.4, 7]} p={[0, 0.2, 0]} m={brick} />
        <Box s={[10.3, 0.06, 7.1]} p={[0, 0.4, 0]} m={st} cast={false} />
        <Stairs w={2.4} z0={3.5 + 0.9} z1={3.2} y1={0.4} n={3} m={st} />
        {[-1, 1].map((k) => <group key={k} position={[k * 1.65, 0.4, 3.35]} scale={1.2}><Lion m={st} /></group>)}
        <Pag y0={0.4} porch={9} cols={3} dens={1.5} finial={1.0} cluster={0} tiers={[
          { w: 7.4, d: 4.2, wh: 1.8, ov: 1.5, rh: 0.95 },
          { w: 4.4, d: 2.6, wh: 1.15, ov: 1.1, rh: 0.85, cols: 4 },
          { w: 2.6, d: 1.8, wh: 1.0, ov: 0.9, rh: 0.8, cols: 2 },
        ]} />
        {[-1.2, -0.6, 0, 0.6, 1.2].map((x) => <group key={x} position={[x, 4.0, 0]} />)}
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
    return <group><BhairBody /></group>;
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
          { w: 5.8, d: 4.6, wh: 1.7, ov: 1.55, rh: 0.8 },
          { w: 3.9, d: 3.3, wh: 1.2, ov: 1.25, rh: 0.8 },
          { w: 2.7, d: 2.4, wh: 1.05, ov: 1.0, rh: 0.75 },
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
  function paintPeacock(g, w, h) {
    g.fillStyle = '#3a2314'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i += 1) { g.fillStyle = `rgba(20,10,4,${R(i, 5) * 0.3})`; g.fillRect(R(i, 1) * w, R(i, 2) * h, 40, 3); }
    g.strokeStyle = '#8a5d34'; g.lineWidth = 7; g.strokeRect(8, 8, w - 16, h - 16);
    g.lineWidth = 3; g.strokeRect(26, 26, w - 52, h - 52);
    const cx = w / 2; const cy = h * 0.5; const Rr = w * 0.4;
    g.fillStyle = '#1a0e07'; g.beginPath(); g.arc(cx, cy, Rr, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9a6a3a'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, Rr, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2;
    for (let i = 0; i < 46; i += 1) {
      const a = (i / 46) * Math.PI * 2;
      g.fillStyle = '#8a5d34'; g.beginPath(); g.ellipse(cx + Math.cos(a) * (Rr + 22), cy + Math.sin(a) * (Rr + 22), 9, 5, a, 0, Math.PI * 2); g.fill();
    }
    const oy = cy + h * 0.1;
    for (let a = -Math.PI * 1.02; a <= Math.PI * 0.02; a += Math.PI / 26) {
      g.strokeStyle = '#a8763e'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx, oy); g.lineTo(cx + Math.cos(a) * Rr * 0.94, oy + Math.sin(a) * Rr * 0.94); g.stroke();
      g.fillStyle = '#c08a4a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * Rr * 0.8, oy + Math.sin(a) * Rr * 0.8, 9, 14, a + Math.PI / 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1a0e07'; g.beginPath(); g.arc(cx + Math.cos(a) * Rr * 0.8, oy + Math.sin(a) * Rr * 0.8, 3.5, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#8f5f32'; g.lineWidth = 2.5;
    [0.3, 0.52, 0.7].forEach((k) => { g.beginPath(); g.arc(cx, oy, Rr * k, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); });
    g.fillStyle = '#b8946c';
    g.beginPath(); g.ellipse(cx, oy + 52, 30, 52, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx, oy - 18, 12, 34, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx, oy - 58, 15, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d6b88a'; g.beginPath(); g.moveTo(cx - 3, oy - 72); g.lineTo(cx, oy - 90); g.lineTo(cx + 6, oy - 72); g.fill();
    g.fillStyle = '#7a5a3a'; g.beginPath(); g.moveTo(cx - 6, oy - 56); g.lineTo(cx - 22, oy - 50); g.lineTo(cx - 6, oy - 48); g.fill();
    g.strokeStyle = '#b8946c'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(cx - 12, oy + 96); g.lineTo(cx - 14, oy + 128); g.moveTo(cx + 12, oy + 96); g.lineTo(cx + 14, oy + 128); g.stroke();
    g.fillStyle = 'rgba(30,16,8,0.5)';
    for (let i = 0; i < 18; i += 1) { g.beginPath(); g.arc(cx - 20 + R(i, 8) * 40, oy + 20 + R(i, 9) * 70, 2.2, 0, Math.PI * 2); g.fill(); }
  }
  function PeacockMain() {
    const M = useM();
    const tex = useCMat('peacock', 512, 512, paintPeacock);
    const wood = M.plain('#3a2314', { roughness: 0.8 });
    const wood2 = M.plain('#5a3a20', { roughness: 0.8 });
    const bk = M.mat('brick', 9, 4, { color: '#f0bfa4' });
    return (
      <group>
        <Box s={[9, 5.3, 1]} p={[0, 2.65, 0]} m={bk} />
        <Box s={[9.3, 0.25, 1.3]} p={[0, 0.12, 0.1]} m={M.stone} />
        {[0, 1].map((k) => <Box key={k} s={[2.6 - k * 0.3, 0.12, 0.4]} p={[0, 0.06 + k * 0.1, 0.9 + k * 0.15]} m={M.stone} />)}
        <Box s={[9, 0.14, 1.3]} p={[0, 2.4, 0.1]} m={wood} />
        <Box s={[3.2, 1.55, 0.1]} p={[0, 1.2, 0.52]} m={M.plain('#1a0e07')} />
        <Box s={[3.5, 0.14, 0.2]} p={[0, 2.05, 0.56]} m={wood2} />
        {[-1, 1].map((k) => <Box key={k} s={[0.1, 1.7, 0.2]} p={[k * 1.7, 1.2, 0.56]} m={wood2} />)}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 3.4, 0, 0.6]}>
            <Box s={[2.4, 0.5, 0.9]} p={[0, 0.6, 0.35]} m={M.plain('#b3222a')} />
            {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.3, 0.26, 0.3]} p={[-0.85 + i * 0.34, 0.97, 0.3]} m={M.plain(['#e0a020', '#2a7ab0', '#b3202a', '#3a9a5a', '#f0e0c0', '#8a3a8a'][i])} />)}
          </group>
        ))}
        {/* the Peacock Window, Mhaykha Jhya */}
        <group position={[0, 3.55, 0.5]}>
          <Box s={[2.8, 2.8, 0.14]} p={[0, 0, 0]} m={wood} />
          <Box s={[2.3, 2.3, 0.05]} p={[0, 0, 0.1]} m={[wood, wood, wood, wood, tex, wood]} />
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 1.32, 0, 0.1]}>
              <Box s={[0.2, 2.8, 0.14]} p={[0, 0, 0]} m={wood2} />
              {Array.from({ length: 9 }, (_, i) => <Ball key={i} rad={0.075} p={[0, -1.2 + i * 0.3, 0.1]} m={wood2} />)}
            </group>
          ))}
          <Box s={[3.3, 0.18, 0.3]} p={[0, 1.56, 0.1]} m={wood2} />
          {Array.from({ length: 14 }, (_, i) => <Box key={i} s={[0.12, 0.16, 0.12]} p={[-1.5 + i * 0.23, 1.74, 0.1]} m={wood2} />)}
          <Box s={[3.5, 0.22, 0.5]} p={[0, -1.52, 0.18]} m={wood2} />
          {[-1.4, 0, 1.4].map((x) => <Ball key={x} rad={0.15} sc={[1, 1.2, 0.8]} p={[x, -1.46, 0.46]} m={wood2} />)}
        </group>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 3.5, 3.5, 0.5]}>
            <Box s={[1.1, 1.2, 0.12]} m={wood} />
            <Box s={[0.9, 1.0, 0.05]} p={[0, 0, 0.08]} m={M.plain('#150b06')} />
            {[-2, -1, 0, 1, 2].map((q) => <Box key={q} s={[0.025, 1.0, 0.03]} p={[q * 0.17, 0, 0.12]} m={M.plain('#8f5a2c')} />)}
            <Box s={[1.4, 0.1, 0.35]} p={[0, 0.7, 0.14]} m={wood2} />
          </group>
        ))}
        <Roof w={9.6} d={3} h={0.55} y={5.2} m={M.mat('roof', 6, 2, { color: '#a8684c' })} sag={1.2} lift={0.05} fascia={false} />
        <Frame s={[9.6, 6, 3]} p={[0, 3, 0.5]} />
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
  function PotWall({ w, h, p, r = 0 }) {
    const M = useM();
    const g = useMemo(() => {
      const parts = [];
      for (let i = 0; i < Math.round(w * 4); i += 1) for (let j = 0; j < Math.round(h * 2.2); j += 1) {
        if (R(i * 7 + j, 3) < 0.35) continue;
        const c = new THREE.CylinderGeometry(0.07 + R(i, j) * 0.04, 0.05, 0.12, 8);
        c.rotateX(Math.PI / 2); c.translate(-w / 2 + (i + 0.5) / 4 + R(j, i) * 0.05, 0.2 + j * 0.45, 0.04); parts.push(c);
      }
      return mergeGeometries(parts);
    }, [w, h]);
    return <mesh geometry={g} position={p} rotation={[0, r, 0]} material={M.plain('#c8a050', { metalness: 0.85, roughness: 0.35 })} />;
  }
  function ChobharMain() {
    const M = useM();
    const st = stoneM(M);
    const brick = redBrick(M, 4, 2);
    return (
      <group>
        <Box s={[13, 0.3, 11]} p={[0, 0.15, 0]} m={M.mat('herring', 6, 5, { color: '#f0bfa4' })} />
        <group position={[0, 0.3, -1.2]}>
          <Box s={[7, 0.35, 6]} p={[0, 0.17, 0]} m={st} />
          <Pag y0={0.35} base="#c0704f" gold={false} roofC="#b8693a" porch={0} cols={3} dens={1.4} finial={1.0} tiers={[
            { w: 4.0, d: 3.8, wh: 1.8, ov: 1.4, rh: 0.9 }, { w: 3.1, d: 3.0, wh: 1.2, ov: 1.15, rh: 0.85 }, { w: 2.3, d: 2.2, wh: 1.05, ov: 0.95, rh: 0.8 },
          ]} />
          <PotWall w={3.6} h={1.5} p={[0, 0.35, 1.93]} />
          <PotWall w={3.4} h={1.5} p={[-2.02, 0.35, 0]} r={-Math.PI / 2} />
        </group>
        <group position={[-3.6, 0.3, 3.2]}><ShikT m={st} w={2.4} h={2.2} /></group>
        <group position={[0.4, 0.3, 3.9]}>
          <Cyl rt={0.4} rb={0.45} h={0.5} p={[0, 0.25, 0]} m={M.plain('#b3202a')} />
          <group position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}><Cyl rt={0.07} h={0.7} m={M.gold} seg={8} />{[-1, 1].map((k) => <Ball key={k} rad={0.14} sc={[1, 0.8, 1]} p={[0, k * 0.4, 0]} m={M.gold} />)}</group>
        </group>
        <BellPavilion p={[3.2, 0.3, 3.3]} s={0.55} />
        {[-1, 1].map((k) => <group key={k} position={[k * 5.4, 0.3, 1.5]}>{Array.from({ length: 6 }, (_, i) => <group key={i} position={[0, 0, -i * 0.5]}><Cyl rt={0.11} h={0.4} p={[0, 0.5, 0]} m={M.plain('#9c2a20')} seg={10} /><Cyl rt={0.02} h={0.5} p={[0, 0.25, 0]} m={M.dark} seg={6} /></group>)}</group>)}
        <Box s={[0.5, 2.2, 10]} p={[-6.4, 1.1, 0]} m={brick} />
        <Box s={[0.5, 2.2, 10]} p={[6.4, 1.1, 0]} m={brick} />
        <PotWall w={9} h={1.5} p={[-6.1, 0.4, 0]} r={Math.PI / 2} />
        <Frame s={[13.5, 6, 11]} p={[0, 3, 0]} />
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
        {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3; return <Bld key={i} p={[Math.cos(a) * 13, -2.3, Math.sin(a) * 13]} r={-a + Math.PI / 2} w={2.6} st={2 + (i % 2)} plaster={i % 2 === 0} base={i % 2 ? '#b8664a' : '#efe6d6'} />; })}
        <Hills seed={12} h={12} r={65} />
      </group>
    );
  }

  /* --- Guhyeshwari --- */
  function GuhyeMain() {
    const M = useM();
    const red = M.plain('#b8463a', { roughness: 0.9 });
    const st = stoneM(M);
    return (
      <group>
        <Box s={[16, 0.2, 14]} p={[0, 0.1, 0]} m={M.mat('stone', 6, 5, { color: '#e6dccb' })} />
        {[[0, -7, 16, 0.5], [-8, 0, 0.5, 14], [8, 0, 0.5, 14]].map(([x, z, w, d], i) => <Box key={i} s={[w, 1.5, d]} p={[x, 0.95, z]} m={red} />)}
        {[-1, 1].map((k) => <Box key={`f${k}`} s={[6, 1.5, 0.5]} p={[k * 5, 0.95, 7]} m={red} />)}
        <group position={[0, 0.2, 7]}>
          <Box s={[2.6, 2.6, 0.7]} p={[0, 1.3, 0]} m={M.plain('#f0e0b0')} />
          <Box s={[1.1, 1.8, 0.1]} p={[0, 0.9, 0.38]} m={M.plain('#2a150a')} />
          <Roof w={3.6} d={1.8} h={0.6} y={2.6} m={M.mat('roof', 3, 2, { color: '#a8684c' })} fascia={false} />
          <Gajur y={3.1} s={0.4} />
        </group>
        <group position={[0, 0.2, -1.5]}>
          <Box s={[5, 0.3, 5]} p={[0, 0.15, 0]} m={st} />
          <Pag y0={0.3} gold porch={0} cols={3} dens={1.3} finial={0.6} tiers={[{ w: 2.9, d: 2.9, wh: 1.3, ov: 1.1, rh: 0.75 }, { w: 2.1, d: 2.1, wh: 1.0, ov: 0.85, rh: 0.7 }]} wallM={M.plain('#e8d8b0')} />
          {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <group key={i} position={[a * 0.5, 3.9, b * 0.5]}><Cyl rt={0.03} rb={0.06} h={0.9} p={[0, 0.45, 0]} r={[b * 0.18, 0, -a * 0.18]} m={M.gold} seg={6} /><Ball rad={0.07} p={[-a * 0.17, 0.95, -b * 0.17]} m={M.gold} /></group>)}
        </group>
        {[-1.6, 0, 1.6].map((x, i) => (
          <group key={x} position={[x, 0.2, 2.4]}>
            <Box s={[0.7, 0.2, 0.7]} p={[0, 0.1, 0]} m={M.plain('#b8463a')} />
            <Cyl rt={0.1} rb={0.14} h={2.6 - (i === 1 ? 0 : 0.4)} p={[0, 1.4, 0]} m={st} seg={10} />
            <group position={[0, 2.7 - (i === 1 ? 0 : 0.4), 0]} scale={1.1}><Lion m={M.gold} /></group>
          </group>
        ))}
        <Frame s={[16.5, 5.5, 14.5]} p={[0, 2.7, 0]} />
      </group>
    );
  }
  function GuhyeEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={30} mat={M.mat('grass', 12, 12, { color: '#b4c488' })} />
        <Water w={90} d={7} p={[0, -0.25, -16]} color="#6a7a56" />
        {[0, 1, 2, 3].map((k) => <Box key={k} s={[26, 0.2 + 0.0, 0.8]} p={[-6, -0.15 + k * 0.06, -12 + k * 0.8 + 2.6 - 3.2]} m={stoneM(M)} />)}
        <group position={[0, 0, -16]}>
          <Box s={[12, 0.2, 0.2]} p={[0, 2.4, 0]} m={M.dark} />
          <PrayerFlags from={[-6, 2.4, 0]} to={[6, 2.4, 0]} n={22} />
        </group>
        {[[-12, -9], [11, -9], [14, 4]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><Cyl rt={0.9} rb={1.0} h={1.0} p={[0, 0.5, 0]} m={M.plain('#efe8dc')} seg={8} /><mesh position={[0, 1.3, 0]} material={M.plain('#d8cdb8')}><coneGeometry args={[1.0, 1.1, 8]} /></mesh><Gajur y={1.8} s={0.35} /></group>)}
        {Array.from({ length: 16 }, (_, i) => <Tree key={i} p={[-24 + i * 3.2, 0, -24 - (i % 3) * 2]} s={2 + R(i, 1)} />)}
        <Bld p={[-14, 0, 9]} w={4} d={3} st={2} roof="#c04a3a" />
        <Bld p={[13, 0, 11]} w={4} d={3} st={2} roof="#c04a3a" />
        <Hills seed={15} h={9} />
      </group>
    );
  }

  /* --- Gokarneshwor Mahadev --- */
  function GokarnaMain() {
    const M = useM();
    const st = stoneM(M);
    return (
      <group>
        <Box s={[11, 0.5, 11]} p={[0, 0.25, 0]} m={redBrick(M, 4, 1)} />
        <Stairs w={2.4} z0={5.5 + 1.2} z1={4.6} y1={0.5} n={4} m={st} />
        <Pag y0={0.5} base="#c0704f" roofC="#8f7a52" porch={0} cols={3} dens={1.5} finial={1.0} tiers={[
          { w: 4.2, d: 4.2, wh: 1.7, ov: 1.5, rh: 0.95 }, { w: 3.3, d: 3.3, wh: 1.2, ov: 1.2, rh: 0.9 }, { w: 2.4, d: 2.4, wh: 1.05, ov: 0.95, rh: 0.85 },
        ]} />
        <group position={[3.8, 0.5, 4]}><Pavilion s={0.7} /></group>
        {[[-3.8, 4.2], [-2.6, 5], [3.5, 1.5], [-4.4, 1], [4.4, -2]].map(([x, z], i) => <group key={i} position={[x, 0.5, z]} scale={1.1}><Box s={[0.5, 0.2, 0.4]} p={[0, 0.1, 0]} m={st} />{[Goddess, Lion, Elephant, Goddess, Lion][i] && React_el(i, st)}</group>)}
        <Nandi p={[0, 0.5, -3.6]} face={0} />
        <group position={[-3.6, 0.5, -3.4]}><Cyl rt={0.8} h={0.7} p={[0, 0.35, 0]} m={M.plain('#c8503a')} seg={20} /></group>
        <Frame s={[17, 9, 17]} p={[0, 4.5, 0]} />
      </group>
    );
  }
  const React_el = (i, m) => {
    const G = [Goddess, Lion, Elephant, Goddess, Lion][i];
    return <group position={[0, 0.2, 0]}><G m={m} /></group>;
  };
  function GokarnaEnv() {
    const M = useM();
    return (
      <group>
        <Floor r={26} mat={M.mat('stone', 8, 8, { color: '#d8cfbd' })} />
        <Water w={8} d={90} p={[17, 0.01, 0]} color="#5f7d70" />
        {[0, 1, 2, 3].map((k) => <Box key={k} s={[0.8, 0.5 - k * 0.1, 22]} p={[11.4 + k * 0.8, (0.5 - k * 0.1) / 2, 0]} m={stoneM(M)} />)}
        {[0, 1, 2, 3, 4].map((k) => <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[-18 - k * 2, 0.002 * k, -6 + k * 2]} material={M.mat('grass', 6, 2, { color: k % 2 ? '#d0c060' : '#8aa04e' })}><planeGeometry args={[18, 1.6]} /></mesh>)}
        <group position={[-12, 0, 6]}><Chaitya p={[0, 0, 0]} s={1.5} /></group>
        {Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2; if (front(a)) return null; return <Tree key={i} p={[Math.cos(a) * (17 + (i % 3) * 3), 0, Math.sin(a) * (17 + (i % 3) * 3)]} s={1.7 + R(i, 3)} kind={i % 3 ? 'broad' : 'pine'} />; })}
        <Hills seed={17} h={13} r={55} />
        <Row x={-12} z={-20} n={6} step={3.2} seed={51} smin={2} smax={3} />
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
        {[['#2b4c8c', 0], ['#e2b33c', 0.05], ['#2e8b57', 0.1], ['#c0392b', 0.15]].map(([c, o], i) => <Box key={c} s={[1.3 - i * 0.0, 0.07, 1.3]} p={[0, 3.2 + o, 0]} m={M.plain(c)} />)}
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
    'peacock-window': { Main: PeacockMain, Env: () => <TachupalEnv /> },
  };
}
