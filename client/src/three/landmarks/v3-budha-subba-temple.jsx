/* Budha Subba (Budhasubba) Kirat shrine, Bijayapur hill, Dharan, Koshi. 1 unit = 1 m. Front = +z. Sizes are estimates from six photographs (marked est.).
   A humble hilltop shrine complex (NOT a pagoda or tower): on the left a long open pavilion (~10 x 6 m) with red posts, a waist-high GREEN wall on a red
   plinth band and a two-stage hipped roof of grey-green corrugated tin (wide skirt, short yellow clerestory band, smaller upper hip, red thread fringe
   under the eave, dozens of brass bells inside); to its right two tiny bright-yellow arch-topped red shrines side by side, each with a flight of steps;
   a small blue-roofed hut; a huge clump of tuftless bamboo (bare tops, leaning stems, hung with threads) and a huge old tree behind; bare orange packed
   earth courtyard, curved rubble-stone platform, poles with wires; trees all round. Behind (-z) the hill edge falls away to the Seuti river, with Dharan
   hazy on the far bank. */
export default function make(K) {
  const { useM, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- terrain: flat earth terrace, rubble edge behind (-z), steep fall to the Seuti, far bank with Dharan ---------- */
  const zEdge = (x) => -11.5 + 1.2 * Math.sin(x * 0.2 + 0.5);
  const zRiver = (x) => -54 + 8 * Math.sin(x * 0.04 + 0.7);
  const RIVER_Y = -15.4;
  function H(x, z) {
    const q = -z, e = -zEdge(x), c = -zRiver(x);
    let h;
    if (q <= e) h = 5 * sstep(12, 48, z);
    else if (q < c) h = -17.5 * sstep(e, c - 7, q);
    else h = -17.5 + 14 * sstep(6, 44, q - c) + 12 * sstep(70, 130, q - c);
    h += sstep(38, 120, Math.abs(x)) * 13;
    const wN = Math.max(sstep(15, 34, Math.abs(x)), sstep(e + 2, e + 14, q)) * (q > c - 8 && q < c + 8 ? 0.35 : 1);
    h += wN * (1.1 * Math.sin(x * 0.17 + z * 0.11) + 0.8 * Math.sin(x * 0.31 - z * 0.23 + 2) + 0.5 * Math.sin(z * 0.41 + 1));
    return h;
  }

  /* ---------- canvas textures + materials ---------- */
  const texCache = {}, matCache = {};
  function ctex(key, draw, rx, ry, w = 256, h = 256) {
    const k = `${key}|${rx}|${ry}`;
    if (texCache[k]) return texCache[k];
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    texCache[k] = t; return t;
  }
  const drawers = {
    tin: (g, w, h) => {
      g.fillStyle = '#6f7f70'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) {
        const x = i * 16;
        const gr = g.createLinearGradient(x, 0, x + 16, 0);
        gr.addColorStop(0, '#46544a'); gr.addColorStop(0.5, '#788a79'); gr.addColorStop(1, '#4e5c50');
        g.fillStyle = gr; g.fillRect(x, 0, 16, h);
      }
      for (let i = 0; i < 90; i++) { // weathering streaks and rust
        g.fillStyle = rnd(i * 1.7) > 0.8 ? 'rgba(120,80,55,0.16)' : 'rgba(40,50,40,0.12)';
        g.fillRect(Math.floor(rnd(i * 3.3) * 256), Math.floor(rnd(i * 5.1) * 256), 2 + Math.floor(rnd(i * 7.7) * 7), 18 + Math.floor(rnd(i * 9.9) * 90));
      }
    },
    tinBlue: (g, w, h) => {
      for (let i = 0; i < 8; i++) { const x = i * 32; const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, '#2f5f98'); gr.addColorStop(0.45, '#4f86c4'); gr.addColorStop(1, '#36669f'); g.fillStyle = gr; g.fillRect(x, 0, 32, h); }
    },
    rubble: (g, w, h) => {
      g.fillStyle = '#4b463f'; g.fillRect(0, 0, w, h);
      let y = 0, r = 0;
      while (y < h) {
        const hh = Math.min(h - y, 30 + Math.floor(rnd(r * 3.3) * 34)); let x = -Math.floor(rnd(r * 7.1) * 60);
        while (x < w) {
          const ww = 44 + Math.floor(rnd(x * 0.31 + r * 9) * 80); const L = 86 + Math.floor(rnd(x * 1.7 + r * 5.3) * 70);
          g.fillStyle = `rgb(${L + 6},${L + 2},${L - 8})`; g.fillRect(x + 2, y + 2, ww - 4, hh - 4);
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2, y + hh - 6, ww - 4, 4);
          x += ww;
        }
        y += hh; r++;
      }
    },
    concrete: (g, w, h) => {
      g.fillStyle = '#a99c8e'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? '60,50,40' : '230,220,205'},0.10)`; g.fillRect(rnd(i * 2.1) * w, rnd(i * 3.7) * h, 2 + rnd(i * 5) * 5, 2 + rnd(i * 6) * 5); }
    },
    text: (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#2a160a'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const font = (px) => `bold ${px}px "Nirmala UI","Mangal","Noto Sans Devanagari","Kokila",sans-serif`;
      let px = 220; g.font = font(px);
      const s1 = 'श्री बुढासुब्बा';
      while (g.measureText(s1).width > w - 16 && px > 30) { px -= 4; g.font = font(px); }
      g.fillText(s1, w / 2, h * 0.28);
      g.font = font(px * 1.15); g.fillText('मन्दिर', w / 2, h * 0.72);
    },
  };
  function tm(kind, rx = 1, ry = 1, o = {}, w, h) {
    const k = `${kind}|${rx}|${ry}|${JSON.stringify(o)}`;
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial({ map: ctex(kind, drawers[kind], rx, ry, w, h), roughness: 0.9, ...o });
    return matCache[k];
  }
  function pm(color, o = {}) {
    const k = `p|${color}|${JSON.stringify(o)}`;
    if (!matCache[k]) matCache[k] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
    return matCache[k];
  }
  const RED = '#a8271f', REDD = '#7c1e1a', GREEN = '#1f7a4c', YEL = '#e3c832';
  const THREADS = ['#d62828', '#d62828', '#e63946', '#f77f00', '#f77f00', '#fcbf49', '#2a9d8f', '#1d5fa8', '#8338ec', '#2b9348', '#ffd166', '#c1121f'];

  const Bx = ({ s, p, r, m, cast = true }) => (
    <mesh position={p} rotation={r} material={m} castShadow={cast} receiveShadow><boxGeometry args={s} /></mesh>
  );

  /* instanced meshes; items {p, s, rx, ry, rz, c} */
  function Inst({ geo, mat, items, cast = true }) {
    const g = useMemo(() => geo(), []); // eslint-disable-line
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const col = useMemo(() => new THREE.Color(), []);
    return (
      <instancedMesh
        args={[g, mat, items.length]}
        castShadow={cast}
        receiveShadow
        frustumCulled={false}
        ref={(m) => {
          if (!m) return;
          items.forEach((it, i) => {
            dummy.position.set(...it.p); dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
            dummy.scale.set(...(it.s || [1, 1, 1]));
            dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
            if (it.c) { col.set(it.c); m.setColorAt(i, col); }
          });
          m.instanceMatrix.needsUpdate = true;
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }}
      />
    );
  }
  const unitBox = () => new THREE.BoxGeometry(1, 1, 1);
  const unitCone = () => new THREE.ConeGeometry(1, 1, 7);
  const unitTrunk = () => new THREE.CylinderGeometry(0.55, 1, 1, 6);
  const unitRock = () => new THREE.DodecahedronGeometry(1, 0);
  const unitBlob = () => new THREE.IcosahedronGeometry(1, 1);
  const bellGeo = () => new THREE.LatheGeometry([[0, 0.01], [0.02, 0.01], [0.03, -0.02], [0.07, -0.05], [0.085, -0.12], [0.11, -0.19], [0.14, -0.25], [0.15, -0.27], [0.125, -0.265], [0.0, -0.24]].map(([x, y]) => new THREE.Vector2(x, y)), 10);

  /* cylinder between two points */
  function Seg({ a, b, r0, r1 = r0, m, seg = 6, cast = true }) {
    const { pos, q, len } = useMemo(() => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
      const l = d.length();
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()).toArray(), len: l };
    }, [a.join(), b.join()]); // eslint-disable-line
    return <mesh position={pos} quaternion={q} material={m} castShadow={cast}><cylinderGeometry args={[r1, r0, len, seg]} /></mesh>;
  }
  /* slightly sagging wire */
  function Wire({ a, b, sag = 0.18, r = 0.012 }) {
    const M = pm('#1c1c1c');
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2];
    return (<group><Seg a={a} b={mid} r0={r} m={M} seg={4} cast={false} /><Seg a={mid} b={b} r0={r} m={M} seg={4} cast={false} /></group>);
  }

  /* square hip frustum with arbitrary top rectangle (hip roof with ridge when w2 > d2 ~ 0) */
  function hipGeo(w1, d1, w2, d2, h, k = 1 / 1.5) {
    const a1 = w1 / 2, b1 = d1 / 2, a2 = w2 / 2, b2 = d2 / 2;
    const B = [[-a1, 0, b1], [a1, 0, b1], [a1, 0, -b1], [-a1, 0, -b1]];
    const T = [[-a2, h, b2], [a2, h, b2], [a2, h, -b2], [-a2, h, -b2]];
    const pos = [], uv = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, p0 = B[i], p1 = B[j], t0 = T[i], t1 = T[j];
      const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), tl = Math.hypot(t1[0] - t0[0], t1[2] - t0[2]);
      const inset = i % 2 === 0 ? b1 - b2 : a1 - a2, sl = Math.hypot(h, inset);
      pos.push(...p0, ...p1, ...t1, ...p0, ...t1, ...t0);
      const u0 = 0, u1 = len * k, v0 = 0, v1 = sl * k, ta = ((len - tl) / 2) * k, tb = ((len + tl) / 2) * k;
      uv.push(u0, v0, u1, v0, tb, v1, u0, v0, tb, v1, ta, v1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function HipRoof({ w1, d1, w2, d2, h, y = 0, mat, under = '#4a382c' }) {
    const g = useMemo(() => hipGeo(w1, d1, w2, d2, h), [w1, d1, w2, d2, h]);
    return (
      <group position={[0, y, 0]}>
        <mesh geometry={g} material={mat} castShadow receiveShadow />
        <mesh geometry={g} material={pm(under, { side: THREE.BackSide })} />
      </group>
    );
  }

  /* ---------- the tuftless bamboo clump: curved, thick, bare-topped culms with nodes ---------- */
  function bambooGeometry() {
    const pos = [], col = [], idx = [];
    const RS = 6, N = 16, c = new THREE.Color();
    const pal = ['#6f6a34', '#807a3e', '#5f6030', '#a89a5a', '#8a7a44', '#b4a66a', '#66683a', '#948a4c', '#c0b078'];
    let vbase = 0;
    const NC = 120;
    for (let i = 0; i < NC; i++) {
      const a = rnd(i * 3.1) * Math.PI * 2, rr = Math.sqrt(rnd(i * 5.7)) * 3.9;
      const bx = Math.cos(a) * rr * 1.1, bz = Math.sin(a) * rr * 0.85;
      const arching = i % 9 === 0;
      const Hs = arching ? 8.5 + rnd(i * 7.3) * 2 : 8.5 + rnd(i * 7.3) * 2.5 - rr * 0.25;
      let outA = Math.atan2(bz, bx) + (rnd(i * 2.2) - 0.5) * 0.9;
      let lean = (0.5 + rnd(i * 9.1) * 0.4) * (0.55 + rr / 3.9 * 0.6);
      if (arching) { outA = 1.35 + (rnd(i * 1.9) - 0.5) * 0.7; lean = 0.9 + rnd(i * 3.3) * 0.3; } /* over the shrines (+z) */
      const r0 = 0.3 + rnd(i * 4.4) * 0.2;
      const base = new THREE.Color(pal[Math.floor(rnd(i * 6.3) * pal.length)]);
      const pts = [];
      for (let n = 0; n <= N; n++) {
        const t = n / N, out = lean * Hs * 0.42 * Math.pow(t, 2.2), sw = Math.sin(i + t * 3) * 0.3 * t * t;
        pts.push(new THREE.Vector3(bx + Math.cos(outA) * out - Math.sin(outA) * sw, Hs * t * (1 - 0.1 * t * t), bz + Math.sin(outA) * out + Math.cos(outA) * sw));
      }
      for (let n = 0; n <= N; n++) {
        const t = n / N, p = pts[n];
        const T = pts[Math.min(N, n + 1)].clone().sub(pts[Math.max(0, n - 1)]).normalize();
        const u = new THREE.Vector3(0, 0, 1).cross(T).normalize(), v = T.clone().cross(u).normalize();
        const node = n % 3 === 0;
        const rad = r0 * (1 - 0.55 * Math.pow(t, 1.4)) * (node ? 1.12 : 1) * (n === 0 ? 1.15 : 1);
        c.copy(base); c.offsetHSL(0, 0, t * 0.05 - (t < 0.15 ? 0.05 : 0)); if (node) c.multiplyScalar(0.72);
        for (let k = 0; k < RS; k++) {
          const ang = (k / RS) * Math.PI * 2;
          pos.push(p.x + (u.x * Math.cos(ang) + v.x * Math.sin(ang)) * rad, p.y + (u.y * Math.cos(ang) + v.y * Math.sin(ang)) * rad, p.z + (u.z * Math.cos(ang) + v.z * Math.sin(ang)) * rad);
          col.push(c.r, c.g, c.b);
        }
      }
      for (let n = 0; n < N; n++) for (let k = 0; k < RS; k++) {
        const a0 = vbase + n * RS + k, a1 = vbase + n * RS + ((k + 1) % RS), b0 = a0 + RS, b1 = a1 + RS;
        idx.push(a0, b0, a1, a1, b0, b1);
      }
      vbase += (N + 1) * RS;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  /* ---------- the little arch-topped (barrel-vaulted) shrine ---------- */
  function archGeo(w, hs, rise, depth) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, hs); s.absellipse(0, hs, w / 2, rise, 0, Math.PI, false); s.lineTo(-w / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -depth);
    return g;
  }
  function Shrine({ x, z = 0, text }) {
    const red = pm(RED), yel = pm(YEL, { roughness: 0.7 }), conc = tm('concrete', 1, 1, {}), dark = pm('#241a15');
    const BH = 2.2;
    const arch = useMemo(() => archGeo(2.1, 0.5, 1.1, 2.3), []);
    const txt = useMemo(() => tm('text', 1, 1, { transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, 512, 380), []);
    const strands = useMemo(() => {
      const a = [];
      [-0.85, 0.85].forEach((px, k) => { for (let i = 0; i < 10; i++) { const len = 0.5 + rnd(i * 3 + k * 11) * 1.0; a.push({ p: [px + (rnd(i * 7 + k) - 0.5) * 0.22, BH - len / 2, 0.14 + (rnd(i * 5) - 0.5) * 0.1], s: [0.035, len, 0.035], c: THREADS[(i * 5 + k * 3) % THREADS.length] }); } });
      return a;
    }, []);
    return (
      <group position={[x, 0, z]}>
        <Bx s={[2.3, 0.4, 3.05]} p={[0, 0.2, -1.52]} m={conc} />
        {[0, 1, 2].map((k) => <Bx key={k} s={[1.6, 0.1 * (k + 1), (3 - k) * 0.3]} p={[0, 0.05 * (k + 1), (3 - k) * 0.15]} m={conc} />)}
        <group position={[0, 0.4, 0]}>
          <Bx s={[2.0, BH, 0.2]} p={[0, BH / 2, -2.8]} m={red} />
          <Bx s={[0.2, BH, 2.5]} p={[-0.9, BH / 2, -1.6]} m={red} />
          <Bx s={[0.2, BH, 2.5]} p={[0.9, BH / 2, -1.6]} m={red} />
          <Bx s={[1.6, 0.05, 2.5]} p={[0, 0.03, -1.55]} m={dark} />
          <Bx s={[1.6, BH - 0.2, 0.04]} p={[0, BH / 2, -2.65]} m={pm('#5e1713')} cast={false} />
          {[-0.85, 0.85].map((px) => <Bx key={px} s={[0.3, BH, 0.3]} p={[px, BH / 2, -0.2]} m={red} />)}
          <mesh geometry={useMemo(() => bellGeo(), [])} position={[0, BH - 0.05, -0.9]} scale={1.2} material={pm('#a98a3a', { metalness: 0.35, roughness: 0.5, side: THREE.DoubleSide })} />
          <Seg a={[0, BH, -0.9]} b={[0, BH - 0.3, -0.9]} r0={0.01} m={pm('#222')} seg={4} cast={false} />
          <mesh position={[0, 0.3, -1.8]} material={pm('#ffcf7a', { emissive: '#ff9a30', emissiveIntensity: 0.9 })}><sphereGeometry args={[0.07, 8, 6]} /></mesh>
          <Inst geo={unitBox} mat={pm('#ffffff')} items={strands} cast={false} />
          {/* tall yellow tombstone arch (1.6 m) over the 2.2 m red body, a little wider than it */}
          <mesh geometry={arch} material={yel} position={[0, BH, 0.12]} castShadow receiveShadow />
          {text && <mesh material={txt} position={[0, BH + 0.78, 0.14]}><planeGeometry args={[1.85, 1.37]} /></mesh>}
        </group>
      </group>
    );
  }

  /* ================================ MAIN ================================ */
  function BudhaMain() {
    const M = useM();
    const red = pm(RED), redD = pm(REDD), green = pm(GREEN, { roughness: 0.8 }), yel = pm(YEL, { roughness: 0.7 }), dark = pm('#241a15');
    const tin = tm('tin', 1, 1, { side: THREE.FrontSide });
    const conc = tm('concrete', 2, 1, {});
    const bellM = pm('#a98a3a', { metalness: 0.35, roughness: 0.5, emissive: '#3a2a08', emissiveIntensity: 0.4, side: THREE.DoubleSide });
    const PX = -6.2, PZ = -0.8;
    const rubble = tm('rubble', 2, 1, {});

    /* thread fringe under the lower eave: outer plan 11.6 x 7.6, y = 2.8 */
    const fringe = useMemo(() => {
      const a = []; let n = 0;
      const edge = (x0, z0, x1, z1) => {
        const L = Math.hypot(x1 - x0, z1 - z0), cnt = Math.floor(L / 0.085);
        for (let i = 0; i < cnt; i++) {
          const t = (i + 0.5) / cnt, len = 0.3 + rnd(n * 2.3) * 0.22, c = rnd(n * 4.1) > 0.78 ? THREADS[Math.floor(rnd(n * 9.7) * THREADS.length)] : (rnd(n * 3.3) > 0.5 ? '#c4231b' : '#e0561c');
          a.push({ p: [x0 + (x1 - x0) * t, 2.78 - len / 2, z0 + (z1 - z0) * t], s: [0.03, len, 0.03], c }); n++;
        }
      };
      edge(-5.8, 3.8, 5.8, 3.8); edge(5.8, 3.8, 5.8, -3.8); edge(5.8, -3.8, -5.8, -3.8); edge(-5.8, -3.8, -5.8, 3.8);
      return a;
    }, []);

    /* bells + chains hung from rails inside the pavilion */
    const { bells, chains, hangs } = useMemo(() => {
      const bl = [], ch = [], hg = []; let n = 0;
      const rail = (x0, z0, x1, z1, step, y) => {
        const L = Math.hypot(x1 - x0, z1 - z0), cnt = Math.floor(L / step);
        for (let i = 0; i <= cnt; i++) {
          const t = i / cnt, x = x0 + (x1 - x0) * t + (rnd(n * 1.3) - 0.5) * 0.06, z = z0 + (z1 - z0) * t;
          const drop = 0.1 + rnd(n * 2.9) * 0.9, sc = 0.55 + rnd(n * 5.3) * 0.85;
          bl.push({ p: [x, y - drop, z], s: [sc, sc, sc], c: rnd(n * 6.1) > 0.5 ? '#b6963f' : '#8f7430' });
          ch.push({ p: [x, y - drop / 2, z], s: [0.014, drop, 0.014] });
          if (rnd(n * 8.1) > 0.7) hg.push({ p: [x + 0.07, y - 0.3, z], s: [0.03, 0.5 + rnd(n * 3.7) * 0.4, 0.03], c: THREADS[Math.floor(rnd(n * 4.3) * THREADS.length)] });
          n++;
        }
      };
      rail(-4.55, 2.45, 1.5, 2.45, 0.18, 2.5);   /* front rail, left of the entrance gap */
      rail(3.4, 2.45, 4.55, 2.45, 0.2, 2.5);
      rail(-4.55, -2.5, 4.55, -2.5, 0.2, 2.5);   /* back rail */
      rail(-4.5, -2.2, -4.5, 2.2, 0.24, 2.5);
      rail(4.5, -2.2, 4.5, 2.2, 0.24, 2.5);
      rail(-3.5, -0.2, 3.5, -0.2, 0.28, 2.5);
      return { bells: bl, chains: ch, hangs: hg };
    }, []);

    /* red threads / garlands on the old tree and nearby wires (picture 3) */
    const treeThreads = useMemo(() => Array.from({ length: 40 }, (_, i) => {
      const a = rnd(i * 3.3) * Math.PI * 2, len = 0.5 + rnd(i * 7.1) * 1.1;
      return { p: [1.3 + Math.cos(a) * 0.95, 2.3 + rnd(i * 5.5) * 1.6 - len / 2, -5.0 + Math.sin(a) * 0.95], s: [0.03, len, 0.03], c: THREADS[(i * 7) % THREADS.length] };
    }), []);
    const bambooThreads = useMemo(() => Array.from({ length: 260 }, (_, i) => {
      const a = rnd(i * 4.9) * Math.PI * 2, rr = 0.6 + Math.sqrt(rnd(i * 2.7)) * 3.6, len = 0.5 + rnd(i * 7.3) * 1.4;
      return { p: [7.0 + Math.cos(a) * rr * 1.1, 1.4 + rnd(i * 9.1) * 2.5 - len / 2, -6.2 + Math.sin(a) * rr * 0.9 + (rr > 3 ? 0.2 : 0)], s: [0.03, len, 0.03], c: THREADS[(i * 5) % THREADS.length] };
    }), []);
    const bamboo = useMemo(() => bambooGeometry(), []);
    const archStones = useMemo(() => {
      const a = []; let n = 0;
      const ring = (cx, cz, R, a0, a1, cnt, y, sz) => {
        for (let i = 0; i < cnt; i++) {
          const t = a0 + ((a1 - a0) * (i + 0.5)) / cnt, rr = R + (rnd(n * 3.1) - 0.5) * 0.18;
          const L = 90 + Math.floor(rnd(n * 1.9) * 70);
          a.push({ p: [cx + Math.cos(t) * rr, y + (rnd(n * 2.3) - 0.5) * 0.06, cz + Math.sin(t) * rr], s: [sz * (0.85 + rnd(n * 4.1) * 0.5), 0.3 + rnd(n * 5.3) * 0.12, sz * (0.7 + rnd(n * 6.7) * 0.4)], ry: -t + (rnd(n * 8.1) - 0.5) * 0.6, c: `rgb(${L},${L - 4},${L - 14})` });
          n++;
        }
      };
      /* broken curved rubble bank hugging the pavilion's front-left corner (0.8-1.0 m) */
      const CX = -10.2, CZ = 3.5;
      [[0.3, 0.97], [0.62, 0.85], [0.9, 0.6]].forEach(([y, keep], k) => {
        const cnt = 30 - k * 4;
        for (let i = 0; i < cnt; i++) {
          const t = 0.9 + ((3.55 - 0.9) * (i + 0.5)) / cnt;
          if (rnd(n * 5.3 + 2) > keep) { n++; continue; }
          const rr = 2.3 + (rnd(n * 3.1) - 0.5) * 0.35 - k * 0.1;
          const L = 88 + Math.floor(rnd(n * 1.9) * 70);
          a.push({ p: [CX + Math.cos(t) * rr, y + (rnd(n * 2.3) - 0.5) * 0.12, CZ + Math.sin(t) * rr], s: [0.5 + rnd(n * 4.1) * 0.35, 0.38 + rnd(n * 5.3) * 0.2, 0.62 + rnd(n * 6.7) * 0.35], ry: -t + (rnd(n * 8.1) - 0.5) * 0.9, rz: (rnd(n * 9.1) - 0.5) * 0.4, c: `rgb(${L},${L - 4},${L - 14})` });
          n++;
        }
      });
      return a;
    }, []);

    return (
      <group>
        <Frame s={[22, 8, 9]} p={[1.0, 3.5, 0]} />

        {/* ======== PAVILION ======== */}
        <group position={[PX, 0, PZ]}>
          <Bx s={[10.8, 0.25, 6.8]} p={[0, 0.125, 0]} m={conc} />
          <Bx s={[10.2, 0.04, 6.2]} p={[0, 0.27, 0]} m={pm('#4a3c35')} cast={false} />
          {/* posts (8 along each long face, 3 per end) */}
          {Array.from({ length: 8 }, (_, i) => -4.9 + i * 1.4).map((x) => (
            <group key={x}>
              <Bx s={[0.2, 2.3, 0.2]} p={[x, 1.4, 2.9]} m={red} />
              <Bx s={[0.2, 2.3, 0.2]} p={[x, 1.4, -2.9]} m={red} />
            </group>
          ))}
          {[-1.45, 0, 1.45].map((z) => (
            <group key={z}>
              <Bx s={[0.2, 2.3, 0.2]} p={[-4.9, 1.4, z]} m={red} />
              <Bx s={[0.2, 2.3, 0.2]} p={[4.9, 1.4, z]} m={red} />
            </group>
          ))}
          {/* red plinth band + green waist-high wall: front (with an entrance gap) and left end */}
          {[[-5.0, 1.95], [3.45, 4.95]].map(([a, b], i) => (
            <group key={i}>
              <Bx s={[b - a, 0.36, 0.26]} p={[(a + b) / 2, 0.43, 2.9]} m={red} />
              <Bx s={[b - a, 0.9, 0.22]} p={[(a + b) / 2, 1.06, 2.9]} m={green} />
              <Bx s={[b - a, 0.08, 0.3]} p={[(a + b) / 2, 1.55, 2.9]} m={redD} />
            </group>
          ))}
          <Bx s={[0.26, 0.36, 5.8]} p={[-4.9, 0.43, 0]} m={red} />
          <Bx s={[0.22, 0.9, 5.8]} p={[-4.9, 1.06, 0]} m={green} />
          <Bx s={[0.3, 0.08, 5.8]} p={[-4.9, 1.55, 0]} m={redD} />
          {/* entrance steps */}
          <Bx s={[1.5, 0.12, 0.6]} p={[2.7, 0.06, 3.3]} m={conc} />
          <Bx s={[1.5, 0.2, 0.4]} p={[2.7, 0.35, 3.1]} m={conc} cast={false} />
          {/* right end: open between posts, one low rail */}
          <Bx s={[0.08, 0.08, 5.8]} p={[4.9, 1.05, 0]} m={red} />
          {/* back wall (dark red) and dark ceiling */}
          <Bx s={[10.0, 2.5, 0.2]} p={[0, 1.5, -2.95]} m={pm('#6e1d19')} />
          <Bx s={[10.0, 0.06, 6.0]} p={[0, 2.78, 0]} m={pm('#2b201a')} cast={false} />
          {/* ring beam */}
          <Bx s={[10.4, 0.26, 0.24]} p={[0, 2.62, 2.9]} m={red} />
          <Bx s={[10.4, 0.26, 0.24]} p={[0, 2.62, -2.9]} m={red} />
          <Bx s={[0.24, 0.26, 6.0]} p={[-4.9, 2.62, 0]} m={red} />
          <Bx s={[0.24, 0.26, 6.0]} p={[4.9, 2.62, 0]} m={red} />
          {/* rails for the bells */}
          <Bx s={[9.2, 0.07, 0.07]} p={[0, 2.5, 2.45]} m={dark} cast={false} />
          <Bx s={[9.2, 0.07, 0.07]} p={[0, 2.5, -2.5]} m={dark} cast={false} />
          <Bx s={[0.07, 0.07, 4.8]} p={[-4.5, 2.5, 0]} m={dark} cast={false} />
          <Bx s={[0.07, 0.07, 4.8]} p={[4.5, 2.5, 0]} m={dark} cast={false} />
          <Bx s={[7, 0.07, 0.07]} p={[0, 2.5, -0.2]} m={dark} cast={false} />
          <Inst geo={bellGeo} mat={bellM} items={bells} cast={false} />
          <Inst geo={unitBox} mat={pm('#3a3a3a')} items={chains} cast={false} />
          <Inst geo={unitBox} mat={pm('#ffffff')} items={hangs} cast={false} />
          {/* two-stage roof: wide skirt, yellow clerestory band, smaller hipped top with a short ridge */}
          <Bx s={[11.7, 0.14, 0.1]} p={[0, 2.78, 3.82]} m={redD} cast={false} />
          <Bx s={[11.7, 0.14, 0.1]} p={[0, 2.78, -3.82]} m={redD} cast={false} />
          <Bx s={[0.1, 0.14, 7.6]} p={[5.82, 2.78, 0]} m={redD} cast={false} />
          <Bx s={[0.1, 0.14, 7.6]} p={[-5.82, 2.78, 0]} m={redD} cast={false} />
          <HipRoof w1={11.6} d1={7.6} w2={6.2} d2={2.4} h={1.3} y={2.82} mat={tin} />
          <Bx s={[6.2, 0.6, 2.4]} p={[0, 4.42, 0]} m={yel} />
          <Bx s={[6.3, 0.07, 2.5]} p={[0, 4.15, 0]} m={redD} cast={false} />
          <HipRoof w1={7.0} d1={3.4} w2={1.8} d2={0.3} h={1.2} y={4.72} mat={tin} />
          <Bx s={[2.0, 0.1, 0.22]} p={[0, 5.95, 0]} m={pm('#7f8c7e')} cast={false} />
          <Seg a={[0, 5.95, 0]} b={[0, 6.4, 0]} r0={0.05} r1={0.02} m={pm('#6a736a')} seg={6} />
          <Inst geo={unitBox} mat={pm('#ffffff')} items={fringe} cast={false} />
          {/* lamps */}
          <mesh position={[0.8, 2.3, 2.6]} material={pm('#fff0b0', { emissive: '#ffcf6a', emissiveIntensity: 1.2 })}><sphereGeometry args={[0.09, 8, 6]} /></mesh>
          <mesh position={[-3.2, 2.3, -2.2]} material={pm('#fff0b0', { emissive: '#ffcf6a', emissiveIntensity: 1.2 })}><sphereGeometry args={[0.09, 8, 6]} /></mesh>
          <pointLight position={[0, 2.0, 0]} intensity={1.1} distance={9} color="#ffb060" />
        </group>

        {/* ======== TWO LITTLE YELLOW ARCH SHRINES ======== */}
        <Shrine x={2.9} z={-0.55} text />
        <Shrine x={6.3} z={-0.55} />
        <pointLight position={[4.6, 2.4, 0.8]} intensity={0.9} distance={9} color="#ffb060" />

        {/* small red offering stall with a cantilevered canopy, in front between the shrines */}
        <group position={[4.6, 0, 1.6]}>
          <Bx s={[1.3, 0.9, 0.9]} p={[0, 0.45, 0]} m={red} />
          <Bx s={[1.4, 0.06, 1.0]} p={[0, 0.93, 0]} m={pm('#d9cbb0')} />
          {[-0.6, 0.6].map((x) => <Bx key={x} s={[0.1, 1.2, 0.1]} p={[x, 1.5, -0.4]} m={red} />)}
          <Bx s={[1.7, 0.08, 1.4]} p={[0, 2.18, -0.05]} r={[0.1, 0, 0]} m={redD} />
          {[0, 1, 2, 3, 4].map((i) => <Bx key={i} s={[0.16, 0.1, 0.16]} p={[-0.5 + i * 0.25, 1.0, 0.1]} m={pm(THREADS[i * 2])} cast={false} />)}
        </group>

        {/* small blue-roofed hut and a green bin */}
        <group position={[10.3, 0, -2.2]}>
          <Bx s={[2.3, 2.0, 2.2]} p={[0, 1.0, 0]} m={pm('#c9c3b3')} />
          <Bx s={[0.8, 1.5, 0.08]} p={[0, 0.8, 1.12]} m={pm('#3b5a8a')} />
          <HipRoof w1={3.1} d1={3.0} w2={1.0} d2={0.3} h={1.1} y={2.0} mat={tm('tinBlue', 1, 1)} under="#2a3a55" />
        </group>
        <Cyl8 p={[8.55, 0.36, 0.8]} />

        {/* ======== BAMBOO CLUMP, OLD TREE, LOW WALL ======== */}
        <group position={[7.0, 0, -6.2]}>
          <mesh geometry={bamboo} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={0.75} /></mesh>
          {[[0.6, 0.2, 1.1, 3.4], [1.4, 0.7, 0.9, 2.8], [-1.0, -0.4, 1.0, 3.0], [-0.2, 1.2, 0.8, 2.4], [2.0, -0.5, 0.8, 2.2], [-2.0, 0.6, 0.8, 2.2]].map(([x, z, r, h], i) => <Cyl8 key={i} p={[x, h / 2, z]} r={r} h={h} m={pm(['#7d6b3c', '#6f6a35', '#8a7746'][i % 3], { roughness: 0.9 })} seg={9} />)}
        </group>
        <Inst geo={unitBox} mat={pm('#ffffff')} items={bambooThreads} cast={false} />
        {/* green signboard tied to a stem */}
        <Bx s={[0.5, 0.34, 0.04]} p={[6.4, 1.7, -3.65]} m={pm('#1f6b3a')} cast={false} />
        <Bx s={[0.4, 0.04, 0.05]} p={[6.4, 1.72, -3.62]} m={pm('#e8e8e0')} cast={false} />
        {/* low wall and wire fence in front of the bamboo */}
        <Bx s={[4, 0.55, 0.3]} p={[12.2, 0.275, -4.6]} m={conc} />
        {[10.4, 11.6, 12.8, 14].map((x) => <Bx key={x} s={[0.07, 0.9, 0.07]} p={[x, 1.0, -4.6]} m={pm('#5a4535')} cast={false} />)}
        <Bx s={[3.8, 0.03, 0.03]} p={[12.2, 1.3, -4.6]} m={pm('#444')} cast={false} />
        <Bx s={[3.8, 0.03, 0.03]} p={[12.2, 0.95, -4.6]} m={pm('#444')} cast={false} />

        {/* the huge old tree behind the shrines */}
        <OldTree />

        {/* ======== COURTYARD DETAILS ======== */}
        {/* curved rubble platform */}
        <Inst geo={unitRock} mat={pm('#ffffff', { roughness: 1 })} items={archStones} />
        <mesh position={[-10.2, 0.88, 3.5]} rotation={[Math.PI / 2, 0, 0]} material={pm('#6f5030', { roughness: 1, side: THREE.DoubleSide })} receiveShadow><ringGeometry args={[1.5, 2.3, 28, 1, 0.9, 2.65]} /></mesh>
        {/* diyas on the shrine steps (lit at dusk) */}
        {[2.1, 2.7, 3.3, 5.5, 6.1, 6.7].map((x, i) => (
          <mesh key={i} position={[x, 0.33, 0.2]} material={pm('#ffd27a', { emissive: '#ff9a30', emissiveIntensity: 1.4 })}><coneGeometry args={[0.04, 0.1, 6]} /></mesh>
        ))}
        {/* bamboo poles and wires across the yard */}
        <Seg a={[-0.9, 0, 5.4]} b={[-0.75, 6.6, 5.1]} r0={0.07} r1={0.05} m={pm('#9b8a4e')} />
        <Seg a={[-3.2, 0, 7.4]} b={[-0.8, 5.0, 5.2]} r0={0.05} r1={0.04} m={pm('#8c7c46')} />
        <Seg a={[9.4, 0, 4.6]} b={[9.2, 6.0, 4.2]} r0={0.07} r1={0.05} m={pm('#9b8a4e')} />
        <Wire a={[-0.75, 6.5, 5.1]} b={[9.2, 5.9, 4.2]} sag={0.35} />
        <Wire a={[-0.75, 6.0, 5.1]} b={[9.2, 5.5, 4.2]} sag={0.3} />
        <Wire a={[-0.75, 6.4, 5.1]} b={[1.4, 7.0, -5.0]} sag={0.4} />
        <Wire a={[9.2, 5.8, 4.2]} b={[7.0, 7.2, -4.0]} sag={0.4} />
        <Inst geo={unitBox} mat={pm('#ffffff')} items={treeThreads} cast={false} />
        <Seg a={[-2.0, 0, 3.6]} b={[-2.0, 0.55, 3.6]} r0={0.12} m={pm('#8a7f72')} />
      </group>
    );
  }

  /* little cylinder helper: bin, or an open-ended stone drum */
  function Cyl8({ p, r = 0.28, h = 0.72, m, seg = 14, open }) {
    return (
      <mesh position={p} material={m || pm('#2e7d4a')} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, seg, 1, !!open]} />
      </mesh>
    );
  }

  function OldTree() {
    const bark = pm('#4e4034', { roughness: 1 });
    const leaf = [pm('#2f4a24', { roughness: 1 }), pm('#38552a', { roughness: 1 }), pm('#294220', { roughness: 1 })];
    const limbs = [[[1.0, 5.5, -5.0], [-1.8, 8.0, -4.2], 0.55], [[1.1, 6.5, -5.0], [4.6, 9.0, -4.6], 0.5], [[1.2, 7.5, -5.1], [1.6, 12, -8.0], 0.45], [[0.9, 4.8, -5.0], [4.2, 7.4, -2.2], 0.4], [[0.9, 5.2, -5.0], [-1.5, 8.4, -1.6], 0.35], [[1.1, 6.0, -5.0], [8, 8.8, -3.2], 0.4]];
    const blobs = [[-1.8, 9.0, -4.0, 3.2], [4.6, 9.8, -4.4, 3.4], [1.2, 11.8, -7.0, 3.4], [-1.6, 9.6, -2.4, 2.8], [3.2, 8.8, -1.6, 2.8], [0.2, 10.6, -5.2, 3.2], [-5, 9.6, -7.5, 2.7], [8.0, 9.6, -3.2, 3.0], [6.0, 11.2, -6.4, 3.0], [-0.5, 9.4, -6.8, 2.6]];
    return (
      <group>
        <Seg a={[1.3, 0, -5.0]} b={[1.0, 6, -5.0]} r0={1.5} r1={1.0} m={bark} seg={9} />
        <Seg a={[1.0, 5.5, -5.0]} b={[1.0, 8.2, -5.0]} r0={1.0} r1={0.7} m={bark} seg={8} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 7) * Math.PI * 2 + 0.4; return <Seg key={i} a={[1.3 + Math.cos(a) * 2.0, 0, -5.0 + Math.sin(a) * 2.0]} b={[1.2 + Math.cos(a) * 0.7, 2.0, -5.0 + Math.sin(a) * 0.7]} r0={0.22} r1={0.55} m={bark} seg={5} />; })}
        {limbs.map(([a, b, r], i) => <Seg key={i} a={a} b={b} r0={r} r1={r * 0.55} m={bark} seg={6} />)}
        {blobs.map(([x, y, z, s], i) => <mesh key={i} position={[x, y, z]} scale={[s, s * 0.62, s]} material={leaf[i % 3]} castShadow><icosahedronGeometry args={[1, 1]} /></mesh>)}
      </group>
    );
  }

  /* ================================ ENV ================================ */
  function BudhaEnv() {
    const ground = useMemo(() => {
      const g = new THREE.PlaneGeometry(300, 270, 190, 170); g.rotateX(-Math.PI / 2); g.translate(0, 0, -48);
      const pos = g.attributes.position; const cols = new Float32Array(pos.count * 3);
      const earth = new THREE.Color('#8a6040'), litter = new THREE.Color('#6e5636'), forest = new THREE.Color('#4a6030'), slope = new THREE.Color('#55703a'), sand = new THREE.Color('#bba980'), farland = new THREE.Color('#7d8b4c'), hill = new THREE.Color('#5d7040'), c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i), h = H(x, z);
        pos.setY(i, h - (h > -0.5 && h < 0.5 ? 0.02 : 0));
        const q = -z, e = -zEdge(x), cc = -zRiver(x);
        const n = Math.sin(x * 0.31 + 1) * Math.sin(z * 0.27 + 2) * 0.5 + 0.5;
        c.copy(forest).lerp(slope, n * 0.7);
        if (q > cc + 6) c.lerp(farland, 0.6).lerp(hill, sstep(40, 120, q - cc));
        if (h < RIVER_Y + 2.6 && q > cc - 12 && q < cc + 12) c.lerp(sand, 0.8);
        const earthW = (1 - sstep(12, 17, Math.abs(x - 1))) * (1 - sstep(e - 1.5, e + 2.5, q)) * (1 - sstep(4.5, 8.5, z));
        c.lerp(litter, (1 - sstep(24, 34, Math.abs(x - 1))) * (1 - sstep(e, e + 4, q)) * 0.85 * (1 - earthW));
        c.lerp(earth, earthW);
        c.lerp(new THREE.Color('#4f3b24'), earthW * (0.6 * (1 - sstep(-6, 8, z)) + 0.5 * sstep(8, 15, Math.abs(x - 1)) + 0.25));
        const pat = Math.sin(x * 0.9 + z * 0.4) * Math.sin(z * 0.8 - x * 0.3 + 1) * 0.5 + 0.5, pat2 = Math.sin(x * 2.3 + 1.7) * Math.sin(z * 2.1) * 0.5 + 0.5;
        c.lerp(new THREE.Color('#78502e'), earthW * Math.max(0, pat - 0.55) * 0.9);
        c.lerp(new THREE.Color('#9a7048'), earthW * Math.max(0, pat2 - 0.7) * 0.8);
        const wet = (1 - sstep(0, 5, Math.abs(z - 4.2))) * (1 - sstep(8, 14, Math.abs(x + 6))) * 0.5; // damp earth in front of the pavilion
        c.lerp(new THREE.Color('#5e4128'), wet);
        if (z > 8 && z < 70 && h > -1 && Math.abs(x) < 70) { const gp = sstep(7, 11, z) * (0.55 + 0.3 * Math.sin(x * 0.45 + z * 0.3)); c.lerp(new THREE.Color(Math.sin(x * 0.7 - z * 0.5) > 0.2 ? '#4d6232' : '#5d5232'), Math.min(0.9, gp * (0.6 + 0.4 * sstep(8, 18, z)))); }
        c.offsetHSL(0, 0, (rnd(i) - 0.5) * 0.03);
        cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); return g;
    }, []);

    /* trees: free-standing forest at the back and flanks; the approach in front stays clear */
    const trees = useMemo(() => {
      const list = [[-19, -3, H(-19, -3), 11], [-17.5, 7.5, H(-17.5, 7.5), 9], [-22, 2, H(-22, 2), 12], [18.5, 7, H(18.5, 7), 9.5], [21, -2, H(21, -2), 12], [16.5, -9.5, H(16.5, -9.5), 12], [-14, -10, H(-14, -10), 10]];
      let tries = 0;
      while (list.length < 300 && tries < 4000) {
        tries++;
        const x = (rnd(tries * 1.3) - 0.5) * 200, z = -78 + rnd(tries * 2.9 + 7) * 112;
        if (x > -17 && x < 17.5 && z > -10 && z < 13) continue;
        const h0 = H(x, z);
        if (h0 < RIVER_Y + 3) continue;
        const q = -z, cc = -zRiver(x);
        if (q > cc - 6 && q < cc + 8) continue;
        let hh = 8 + rnd(tries * 4.7) * 9;
        const clearFront = z > -1 && Math.abs(x) < 44;
        const valleyView = z < -10 && z > -45 && x > -26 && x < 30;
        if (clearFront) hh = Math.min(hh, 0.8 - h0);
        if (valleyView) hh = Math.min(hh, 2.0 - h0);
        
        if (hh < 3) continue;
        list.push([x, z, h0, hh]);
      }
      return list;
    }, []);
    const treeItems = useMemo(() => {
      const trunks = [], b1 = [], b2 = [], b3 = [];
      const col = new THREE.Color();
      trees.forEach(([x, z, h0, hh], i) => {
        const R = hh * (z > -20 ? 0.25 : 0.3);
        trunks.push({ p: [x, h0 + hh * 0.3, z], s: [0.25 + hh * 0.02, hh * 0.6, 0.25 + hh * 0.02] });
        const cl = (k) => { col.setHSL(0.25 + rnd(i * 1.7 + k) * 0.07, 0.45, 0.07 + rnd(i * 2.3 + k) * 0.07); return `#${col.getHexString()}`; };
        b1.push({ p: [x, h0 + hh * 0.72, z], s: [R, R * 0.8, R], c: cl(1), ry: rnd(i) * 6 });
        b2.push({ p: [x + R * 0.55, h0 + hh * 0.6, z + R * 0.3], s: [R * 0.75, R * 0.65, R * 0.75], c: cl(2), ry: rnd(i + 3) * 6 });
        b3.push({ p: [x - R * 0.5, h0 + hh * 0.85, z - R * 0.35], s: [R * 0.7, R * 0.6, R * 0.7], c: cl(3), ry: rnd(i + 5) * 6 });
      });
      return { trunks, b1, b2, b3 };
    }, [trees]);

    /* Dharan across the Seuti: tin-roofed and concrete houses on the far bank */
    const town = useMemo(() => {
      const walls = [], roofs = [];
      const wc = ['#d8cfc0', '#e0b98a', '#c9d3d0', '#d9a69a', '#e9e3d6', '#b9c4cf', '#cdb27a'];
      const rc = ['#b2543d', '#5f7f9c', '#8b9094', '#3f7f5f', '#a14a3a', '#7d8a95'];
      for (let i = 0; i < 150; i++) {
        const x = -95 + rnd(i * 1.7) * 190, cc = -zRiver(x), q = cc + 12 + rnd(i * 2.9) * 38, z = -q;
        const h0 = H(x, z), w = 3.5 + rnd(i * 3.3) * 4, d = 3.5 + rnd(i * 4.1) * 4, big = rnd(i * 5.5) > 0.88, hh = big ? 7 + rnd(i * 6.1) * 6 : 3 + rnd(i * 7.3) * 2.5;
        walls.push({ p: [x, h0 + hh / 2, z], s: [w, hh, d], ry: rnd(i * 8.1) * 0.5, c: wc[i % wc.length] });
        roofs.push({ p: [x, h0 + hh + 0.15, z], s: [w + 0.5, 0.35, d + 0.5], ry: 0, c: rc[(i * 3) % rc.length] });
      }
      return { walls, roofs };
    }, []);

    /* fence along the back (valley) edge of the terrace + low rubble retaining wall */
    const edge = useMemo(() => {
      const posts = [], rails = [], stones = [];
      let n = 0;
      for (let x = -17; x <= 18.5; x += 2) { const z = zEdge(x) + 1.3; posts.push({ p: [x, 0.55, z], s: [0.1, 1.1, 0.1] }); if (x < 18) { const z2 = zEdge(x + 2) + 1.3; rails.push({ p: [x + 1, 0.95, (z + z2) / 2], s: [2.02, 0.06, 0.06], ry: -Math.atan2(z2 - z, 2) }); rails.push({ p: [x + 1, 0.55, (z + z2) / 2], s: [2.02, 0.06, 0.06], ry: -Math.atan2(z2 - z, 2) }); } }
      for (let x = -17; x <= 19; x += 0.55) { const z = zEdge(x) + 0.5; for (let k = 0; k < 2; k++) { const L = 80 + Math.floor(rnd(n * 2.1) * 70); stones.push({ p: [x + (rnd(n) - 0.5) * 0.2, -0.05 - k * 0.45, z + 0.1 + k * 0.1], s: [0.5 + rnd(n * 1.3) * 0.2, 0.3, 0.35], ry: rnd(n * 3.7) * 3, c: `rgb(${L},${L - 4},${L - 14})` }); n++; } }
      return { posts, rails, stones };
    }, []);

    const pebbles = useMemo(() => {
      const a = [];
      for (let i = 0; i < 90; i++) {
        const x = -14 + rnd(i * 2.3) * 29, z = -3.5 + rnd(i * 4.1) * 12;
        if (x > -11.6 && x < -0.8 && z < 3.8) continue;
        if (x > 0.6 && x < 7.8 && z < 1.4) continue;
        if (x > -12.2 && x < -6.2 && z > 3.4 && z < 9.6) continue;
        const sz = 0.08 + rnd(i * 7.7) * 0.22, L = 110 + Math.floor(rnd(i * 5.1) * 60);
        a.push({ p: [x, sz * 0.25, z], s: [sz, sz * 0.55, sz * 0.8], ry: rnd(i) * 3, c: `rgb(${L},${L - 12},${L - 30})` });
      }
      return a;
    }, []);
    const shrubs = useMemo(() => {
      const a = []; const col = new THREE.Color();
      for (let i = 0; i < 90; i++) {
        const t = rnd(i * 2.1) * Math.PI * 2, rx = 17 + rnd(i * 3.3) * 7, rz = 11 + rnd(i * 4.7) * 6;
        let x = 1 + Math.cos(t) * rx, z = -1 + Math.sin(t) * rz;
        if (z > -3) continue; // the approach in front stays open
        const s = 0.6 + rnd(i * 5.9) * 0.8;
        col.setHSL(0.24 + rnd(i * 1.3) * 0.08, 0.45, 0.07 + rnd(i * 7.7) * 0.06);
        a.push({ p: [x, H(x, z) + s * 0.5, z], s: [s * 1.3, s, s * 1.3], c: `#${col.getHexString()}` });
      }
      return a;
    }, []);
    const fore = useMemo(() => {
      const a = []; const col = new THREE.Color();
      for (let i = 0; i < 0; i++) {
        const x = -26 + rnd(i * 2.9) * 54, z = 6.5 + rnd(i * 4.3) * 13;
        if (z < 9.5 && x > -1 && x < 8) continue; /* the path to the shrines stays open */
        const s = 0.35 + rnd(i * 6.1) * 0.55 * sstep(6, 14, z);
        col.setHSL(0.22 + rnd(i * 1.3) * 0.08, 0.4, 0.12 + rnd(i * 7.7) * 0.08);
        a.push({ p: [x, H(x, z) + s * 0.3, z], s: [s * 1.5, s * 0.7, s * 1.4], c: `#${col.getHexString()}` });
      }
      return a;
    }, []);
    const ridges = useMemo(() => [[-200, '#6c8265', 12, 1.0, 0.012], [-235, '#869a80', 16, 2.1, 0.009]].map(([z, color, amp, ph, fq]) => {
      const pts = [new THREE.Vector2(-520, -40)];
      for (let x = -520; x <= 520; x += 10) pts.push(new THREE.Vector2(x, amp * (0.55 + 0.3 * Math.sin(x * fq + ph) + 0.15 * Math.sin(x * fq * 3.1 + ph * 2)) - 18));
      pts.push(new THREE.Vector2(520, -40));
      const g = new THREE.ShapeGeometry(new THREE.Shape(pts));
      return { z, color, g };
    }), []);
    return (
      <group>
        {ridges.map((r, i) => <mesh key={i} geometry={r.g} position={[0, 0, r.z]}><meshBasicMaterial color={r.color} fog={false} /></mesh>)}
        <Inst geo={unitBlob} mat={pm('#ffffff', { roughness: 1 })} items={shrubs} />
        <Inst geo={unitRock} mat={pm('#ffffff', { roughness: 1 })} items={pebbles} />
        <mesh geometry={ground} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
        {/* the Seuti river far below the hill edge */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, RIVER_Y, -48]}><planeGeometry args={[400, 300]} /><meshStandardMaterial color="#7d9a98" roughness={0.25} metalness={0.1} transparent opacity={0.92} /></mesh>
        {/* tall forest and slope trees */}
        <Inst geo={unitTrunk} mat={pm('#4e3d2f')} items={treeItems.trunks} />
        <Inst geo={unitBlob} mat={pm('#ffffff', { roughness: 1 })} items={treeItems.b1} />
        <Inst geo={unitBlob} mat={pm('#ffffff', { roughness: 1 })} items={treeItems.b2} />
        <Inst geo={unitBlob} mat={pm('#ffffff', { roughness: 1 })} items={treeItems.b3} />
        {/* Dharan across the river */}
        <Inst geo={unitBox} mat={pm('#ffffff', { roughness: 1 })} items={town.walls} />
        <Inst geo={unitBox} mat={pm('#ffffff', { roughness: 0.8 })} items={town.roofs} />
        {/* terrace edge: rubble retaining wall and low fence */}
        <Inst geo={unitRock} mat={pm('#ffffff', { roughness: 1 })} items={edge.stones} />
        <Inst geo={unitBox} mat={pm('#6e5a46')} items={edge.posts} />
        <Inst geo={unitBox} mat={pm('#7a6550')} items={edge.rails} cast={false} />
        {/* parked white van at the far end of the terrace */}
        <group position={[25, 0, -3.5]} rotation={[0, -1.2, 0]}>
          <Bx s={[4.4, 1.3, 1.8]} p={[0, 0.95, 0]} m={pm('#eeeeea')} />
          <Bx s={[1.6, 0.9, 1.78]} p={[1.9, 1.15, 0]} m={pm('#e8e8e4')} />
          <Bx s={[1.62, 0.5, 1.8]} p={[1.9, 1.35, 0]} m={pm('#2b3238')} />
          {[[-1.4, 0.9], [-1.4, -0.9], [1.5, 0.9], [1.5, -0.9]].map(([x, z], i) => <mesh key={i} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]} material={pm('#1c1c1c')}><cylinderGeometry args={[0.32, 0.32, 0.2, 10]} /></mesh>)}
        </group>
      </group>
    );
  }

  return { 'budha-subba-temple': { Main: BudhaMain, Env: BudhaEnv } };
}
