// Uma Maheshwar (Kwacho Dega), Kirtipur: a free-standing three-roof brick-and-timber Newar pagoda on a wide four-step red brick
// plinth, two saddled stone elephants at the stair, on the summit of Kirtipur hill above dense old-town roofs, valley and Himalaya.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Tree, Diyo, Frame, THREE, useMemo } = K;

  /* ---------- procedural textures ---------- */
  const texCache = new Map();
  function canvasTex(key, w, h, draw, rx = 1, ry = 1) {
    const id = `${key}|${rx}|${ry}`;
    if (texCache.has(id)) return texCache.get(id);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    texCache.set(id, t);
    return t;
  }
  const matCache = new Map();
  function cached(id, make2) { if (!matCache.has(id)) matCache.set(id, make2()); return matCache.get(id); }
  /* bright orange-red brick courses (own texture, the stock one renders too dark) */
  const brickTex = (rx, ry, tone) => cached(`bk${rx}|${ry}|${tone}`, () => new THREE.MeshStandardMaterial({
    map: canvasTex(`bk${tone}`, 128, 128, (g, w, h) => {
      const base = [[214, 110, 76], [200, 96, 66], [222, 122, 88]][tone];
      g.fillStyle = "#b4a89a"; g.fillRect(0, 0, w, h);
      const rr = rnd(7 + tone);
      for (let j = 0; j < 8; j += 1) for (let i = 0; i < 4; i += 1) {
        const k = 0.88 + rr() * 0.24;
        g.fillStyle = `rgb(${Math.min(255, base[0] * k) | 0},${Math.min(255, base[1] * k) | 0},${Math.min(255, base[2] * k) | 0})`;
        g.fillRect(i * 32 + (j % 2) * 16 + 1, j * 16 + 1, 30, 14);
      }
    }, rx, ry), roughness: 0.9,
  }));
  /* weathered brown-grey clay tile rows */
  const tileMat = () => cached('tile', () => new THREE.MeshStandardMaterial({
    map: canvasTex('tile', 128, 128, (g, w, h) => {
      g.fillStyle = '#6b5a4c'; g.fillRect(0, 0, w, h);
      const rr = rnd(31);
      for (let j = 0; j < 16; j += 1) for (let i = 0; i < 16; i += 1) {
        const k = 0.82 + rr() * 0.4; const tint = rr() < 0.18 ? [118, 112, 96] : [108, 90, 76];
        g.fillStyle = `rgb(${tint[0] * k | 0},${tint[1] * k | 0},${tint[2] * k | 0})`;
        g.fillRect(i * 8 + 1, j * 8, 6, 7);
      }
      g.fillStyle = 'rgba(30,20,14,0.5)';
      for (let j = 0; j < 16; j += 1) g.fillRect(0, j * 8 + 7, w, 1);
    }, 4, 4), roughness: 0.95,
  }));
  /* town house facade in orange-brown brick with window rows */
  const brickFacade = () => cached('brickfac', () => new THREE.MeshStandardMaterial({
    map: canvasTex('bfac', 192, 256, (g, w, h) => {
      const rr = rnd(77);
      for (let j = 0; j < 32; j += 1) for (let i = 0; i < 12; i += 1) {
        const k = 0.86 + rr() * 0.26;
        g.fillStyle = `rgb(${200 * k | 0},${104 * k | 0},${74 * k | 0})`; g.fillRect(i * 16 + (j % 2) * 8, j * 8, 15, 7);
      }
      for (let r = 0; r < 4; r += 1) {
        g.fillStyle = '#b8aa98'; g.fillRect(0, r * 64 + 58, w, 5);
        for (let c = 0; c < 3; c += 1) {
          const x = c * 64 + 14; const y = r * 64 + 12;
          g.fillStyle = '#d8d0c0'; g.fillRect(x - 3, y - 3, 42, 42);
          g.fillStyle = (r + c) % 3 === 0 ? '#7a8c98' : '#1f242a'; g.fillRect(x, y, 36, 36);
          g.fillStyle = '#d8d0c0'; g.fillRect(x + 17, y, 2, 36);
        }
      }
    }), roughness: 0.95,
  }));
  /* sky dome textures: blue day sky with clouds, plum dusk */
  const skyTex = (dusk) => cached(`sky${dusk}`, () => canvasTex(`sky${dusk}`, 1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h * 0.5);
    if (dusk) { gr.addColorStop(0, '#1d1238'); gr.addColorStop(0.7, '#4a2a62'); gr.addColorStop(1, '#a8607a'); } else { gr.addColorStop(0, '#2c68bc'); gr.addColorStop(0.5, '#5f9ae0'); gr.addColorStop(0.85, '#b9d6ee'); gr.addColorStop(1, '#e8e0cf'); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.5);
    g.fillStyle = dusk ? '#a8607a' : '#e8e0cf'; g.fillRect(0, h * 0.5, w, h * 0.5);
    const rr = rnd(5);
    for (let c = 0; c < 26; c += 1) {
      const cx = rr() * w; const cy = h * (0.22 + rr() * 0.22); const n = 5 + (rr() * 6 | 0);
      for (let k = 0; k < n; k += 1) {
        g.fillStyle = dusk ? `rgba(220,150,170,${0.18 + rr() * 0.2})` : `rgba(255,255,255,${0.5 + rr() * 0.4})`;
        g.beginPath(); g.ellipse(cx + (k - n / 2) * 26 + rr() * 14, cy + (rr() - 0.5) * 10, 36 + rr() * 34, 9 + rr() * 9, 0, 0, 6.3); g.fill();
      }
    }
  }));
  const hazeMat = () => cached('haze', () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, fog: false, flatShading: true }));
  /* dense dark timber lattice */
  const latMat = () => cached('lat', () => new THREE.MeshStandardMaterial({
    map: canvasTex('lat', 64, 64, (g, w, h) => {
      g.fillStyle = '#0f0805'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#6d4a30';
      for (let i = 0; i < w; i += 8) g.fillRect(i, 0, 3, h);
      g.fillStyle = '#4e3220';
      for (let j = 0; j < h; j += 16) g.fillRect(0, j, w, 3);
    }), roughness: 0.8,
  }));
  /* slatted balcony railing: vertical slats on transparent ground */
  const slatMat = (rx) => cached(`slat${rx}`, () => new THREE.MeshStandardMaterial({
    map: canvasTex('slat', 64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#2a170d';
      for (let i = 0; i < 4; i += 1) g.fillRect(i * 16 + 5, 0, 6, h);
    }, rx, 1), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8,
  }));
  /* iron railing: thin bars on transparent ground */
  const ironMat = (rx) => cached(`iron${rx}`, () => new THREE.MeshStandardMaterial({
    map: canvasTex('iron', 64, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#25282b';
      for (let i = 0; i < 4; i += 1) g.fillRect(i * 16 + 6, 0, 3, h);
    }, rx, 1), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4,
  }));
  /* fringed red valance hanging under the eaves */
  const fringeMat = (rx) => cached(`fringe${rx}`, () => new THREE.MeshStandardMaterial({
    map: canvasTex('fringe', 128, 32, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#b02424'; g.fillRect(0, 0, w, 11);
      g.fillStyle = '#e0b552'; g.fillRect(0, 9, w, 3);
      for (let i = 0; i < w; i += 8) {
        g.fillStyle = (i / 8) % 2 ? '#d03030' : '#b82828';
        g.fillRect(i + 1, 12, 6, 19);
        g.fillStyle = '#e0b552'; g.fillRect(i + 1, 28, 6, 3);
      }
    }, rx, 1), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9,
  }));
  /* a four-storey, three-window facade tile for the town (windows partly lit, for dusk) */
  function facadeMats() {
    return cached('facade', () => {
      const lit = (i) => ((i * 7 + 3) % 11) % 4 === 0;
      const map = canvasTex('fac', 192, 256, (g, w, h) => {
        g.fillStyle = '#d9d3c8'; g.fillRect(0, 0, w, h);
        for (let r = 0; r < 4; r += 1) {
          g.fillStyle = '#c9c2b4'; g.fillRect(0, r * 64 + 60, w, 4);
          for (let c = 0; c < 3; c += 1) {
            const x = c * 64 + 14; const y = r * 64 + 12;
            g.fillStyle = '#6a5a4a'; g.fillRect(x - 3, y - 3, 42, 42);
            g.fillStyle = (r * 3 + c) % 5 === 1 ? '#b8c4cc' : '#252c33'; g.fillRect(x, y, 36, 36);
            g.fillStyle = '#6a5a4a'; g.fillRect(x + 17, y, 2, 36);
          }
        }
      });
      const em = canvasTex('facE', 192, 256, (g, w, h) => {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        for (let r = 0; r < 4; r += 1) for (let c = 0; c < 3; c += 1) {
          if (lit(r * 3 + c)) { g.fillStyle = '#ffc77a'; g.fillRect(c * 64 + 14, r * 64 + 12, 36, 36); }
        }
      });
      return new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#ffffff', emissiveIntensity: 0.45, roughness: 0.95 });
    });
  }

  /* roof surface height, same formula as the kit's curved pagoda roof */
  function roofY(span, h, e, x, z, sag = 1.5, lift = 0.2) {
    const hw = span / 2;
    const ax = Math.abs(x) / hw; const az = Math.abs(z) / hw;
    const s = Math.max(ax, az);
    if (s > 1) return -99;
    return e + h * (1 - s) ** sag + lift * h * (ax * az) ** 2.4;
  }

  function rnd(seed) { let t = seed; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

  /* generic instanced mesh from [{p,s,r,c}] */
  function Inst({ geo, mat, items, shadow = true }) {
    const fill = (m) => {
      if (!m) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]); o.rotation.set(0, it.r || 0, 0); o.scale.set(it.s[0], it.s[1], it.s[2]); o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        if (it.c) { c.set(it.c); m.setColorAt(i, c); }
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    if (!items.length) return null;
    return <instancedMesh key={items.length} ref={fill} args={[geo, mat, items.length]} castShadow={shadow} receiveShadow frustumCulled={false} />;
  }
  const unitBox = () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const unitCone = (seg) => new THREE.ConeGeometry(1, 1, seg).translate(0, 0.5, 0);
  const unitCyl = (seg) => new THREE.CylinderGeometry(1, 1, 1, seg).translate(0, 0.5, 0);

  const SIDES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  /* saddled stone elephant facing +z: legs with feet, big head, ears, curled trunk */
  function UmElephant({ m, cloth }) {
    return (
      <group>
        <Ball rad={0.36} sc={[1.02, 0.95, 1.5]} p={[0, 0.7, -0.02]} m={m} />
        {[-0.2, 0.2].map((x) => [0.34, -0.32].map((z) => (
          <group key={`${x}${z}`}>
            <Cyl rt={0.11} rb={0.13} h={0.5} p={[x, 0.27, z]} m={m} seg={8} />
            <Cyl rt={0.145} rb={0.15} h={0.07} p={[x, 0.035, z]} m={cloth.dk} seg={8} />
          </group>
        )))}
        <Ball rad={0.27} sc={[1, 1.1, 1.05]} p={[0, 0.96, 0.5]} m={m} />
        <Ball rad={0.16} sc={[1.25, 0.9, 0.7]} p={[0, 1.2, 0.56]} m={cloth.dk} />
        {[-1, 1].map((k) => (
          <group key={`e${k}`}>
            <Ball rad={0.22} sc={[0.16, 1.15, 0.95]} p={[k * 0.3, 0.98, 0.42]} m={m} />
            <Ball rad={0.16} sc={[0.12, 1, 0.8]} p={[k * 0.33, 0.96, 0.44]} m={cloth.dk} />
          </group>
        ))}
        {/* trunk: three drooping segments and a curl */}
        <Cyl rt={0.1} rb={0.13} h={0.36} p={[0, 0.74, 0.74]} r={[0.15, 0, 0]} m={m} seg={8} />
        <Cyl rt={0.075} rb={0.1} h={0.34} p={[0, 0.44, 0.8]} r={[-0.1, 0, 0]} m={m} seg={8} />
        <Cyl rt={0.055} rb={0.075} h={0.26} p={[0.01, 0.2, 0.86]} r={[-0.55, 0, 0.1]} m={m} seg={8} />
        <Cyl rt={0.04} rb={0.055} h={0.2} p={[0.06, 0.08, 0.99]} r={[-1.35, 0, 0.5]} m={m} seg={8} />
        {[-1, 1].map((k) => <Cyl key={`t${k}`} rt={0.015} rb={0.035} h={0.3} p={[k * 0.14, 0.64, 0.82]} r={[1.15, 0, k * 0.15]} m={cloth.tusk} seg={6} />)}
        <Box s={[0.62, 0.05, 0.7]} p={[0, 1.02, -0.02]} m={cloth.red} />
        <Box s={[0.5, 0.1, 0.45]} p={[0, 1.09, -0.02]} m={cloth.gold} />
        <Box s={[0.7, 0.24, 0.05]} p={[0, 0.88, 0.1]} m={cloth.red} />
        <Box s={[0.7, 0.24, 0.05]} p={[0, 0.88, -0.14]} m={cloth.red} />
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function UmaMain() {
    const M = useM();
    const yb = 1.85; // top of the four-step plinth
    const e1 = 4.23; const e2 = 5.63; const e3 = 6.62; // eave heights of roofs 1, 2, 3
    const sp1 = 5.4; const sp2 = 4.0; const sp3 = 3.0; // spans 1 : 0.74 : 0.56 (broad stepped taper)
    const W2 = 2.9; const W3 = 2.4; // wall widths of storeys 2 and 3
    const h1 = 1.0; const lift1 = 0.3; const h2 = 0.75; const h3 = 0.62;
    const brickPl = (w, h) => brickTex(Math.max(1, Math.round(w / 1.6)), Math.max(1, Math.round(h / 1.0)), 0);
    const brickCell = (w, h) => brickTex(Math.max(1, Math.round(w / 1.6)), Math.max(1, Math.round(h / 1.0)), 1);
    const timber = M.plain('#2a180e', { roughness: 0.75 });
    const timberRed = M.plain('#4a2216', { roughness: 0.75 });
    const strutM = M.plain('#5c2e1a', { roughness: 0.75 });
    const pil = M.plain('#3a2418', { roughness: 0.8 });
    const wallDark = M.plain('#3e2418', { roughness: 0.85 });
    const roofM = tileMat();
    const coping = M.mat('granite', 2, 1, { color: '#b4ada0' });
    const stoneGrey = M.plain('#8e8678', { roughness: 0.95 });
    const stairM = M.plain('#c4beb0', { roughness: 0.95 });
    const stairEdge = M.plain('#e6e1d6', { roughness: 0.9 });
    const dark = M.plain('#120a06');
    const ele = M.plain('#8c7866', { roughness: 0.95 });
    const figM = M.plain('#a59c8c', { roughness: 0.95 });
    const cloth = { red: M.plain('#a02a22'), gold: M.plain('#c9a24a', { metalness: 0.4, roughness: 0.5 }), tusk: M.plain('#efe6d0'), dk: M.plain('#5e4e40', { roughness: 0.95 }) };

    const steps = [0, 1, 2, 3].map((i) => ({ hs: 2.9 - 0.3 * i, top: 0.45 * (i + 1) }));
    const pillarXs = Array.from({ length: 8 }, (_, i) => -1.6 + (i * 3.2) / 7);
    const sidePil = [-1.6, -0.533, 0.533, 1.6];

    const strutRow = (xs, zin, zout, y0, y1, key, w = 0.1, m = timber) => xs.map((x, i) => {
      const dy = y1 - y0; const dz = zout - zin; const L = Math.hypot(dy, dz);
      return (
        <group key={`${key}${i}`}>
          <Box s={[w, w, L]} p={[x, (y0 + y1) / 2, (zin + zout) / 2]} r={[-Math.atan2(dy, dz), 0, 0]} m={m} cast={false} />
          <Box s={[0.05, 0.28, 0.05]} p={[x, y1 - 0.2, zout - 0.04]} m={timberRed} cast={false} />
        </group>
      );
    });

    const windowPanel = (x, y, w, h, z, key) => (
      <group key={key}>
        <Box s={[w + 0.12, h + 0.12, 0.06]} p={[x, y, z]} m={timber} cast={false} />
        <Box s={[w, h, 0.07]} p={[x, y, z + 0.005]} m={latMat()} cast={false} />
      </group>
    );

    /* banner (pataka) hanging from the pinnacle down the front of the roofs to roof 1 */
    const banner = useMemo(() => {
      const zs = [0.12, 0.55, 1.0, 1.45, 1.95, 2.45];
      const top = e3 + h3 - 0.15; const bot = e1 + 0.14;
      const ly = (z) => top - ((z - 0.12) / (2.4 - 0.12)) * (top - bot);
      return zs.map((z) => {
        const surf = Math.max(roofY(sp1, h1, e1, 0, z, 1.5, lift1), roofY(sp2, h2, e2, 0, z, 1.5, 0.26), roofY(sp3, h3, e3, 0, z, 1.5, 0.22));
        return [z, Math.max(ly(z), surf + 0.07)];
      });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* patchy, irregular grass clumps on roof 1 */
    const clumps = useMemo(() => {
      const r = rnd(11); const out = []; const patches = [];
      [[-2.0, 0.05, 5], [-0.9, -0.2, 3], [0.2, 0.15, 7], [1.2, -0.05, 4], [2.1, 0.2, 5]].forEach(([cx, cz, n], ci) => {
        patches.push({ x: cx + (r() - 0.5) * 0.3, z: cz, sx: 0.35 + r() * 0.5, sz: 0.12 + r() * 0.18, c: ci % 2 });
        for (let i = 0; i < n; i += 1) out.push({ x: cx + (r() - 0.5) * 0.7, z: cz + (r() - 0.5) * 0.4, k: 0.4 + r() * 1.5, c: Math.floor(r() * 3) });
      });
      return { out, patches };
    }, []);
    const mossTilt = Math.atan2(roofY(sp1, h1, e1, 0, 1.6, 1.5, lift1) - roofY(sp1, h1, e1, 0, 2.1, 1.5, lift1), 0.5);
    const grassM = [M.plain('#9a8f4a', { roughness: 1 }), M.plain('#74823a', { roughness: 1 }), M.plain('#a89a58', { roughness: 1 })];
    const mossM = [M.plain('#6f7f38', { roughness: 1 }), M.plain('#86803f', { roughness: 1 })];

    const niche = (x, y, w, h, key) => (
      <group key={key}>
        <Box s={[w + 0.1, h + 0.06, 0.05]} p={[x, y, 1.16]} m={coping} cast={false} />
        <Box s={[w, h, 0.07]} p={[x, y, 1.17]} m={dark} cast={false} />
        <Cyl rt={w / 2} h={0.07} p={[x, y + h / 2, 1.17]} r={[Math.PI / 2, 0, 0]} m={dark} seg={12} />
      </group>
    );

    return (
      <group>
        {/* four-step square red-brick plinth with stone coping */}
        {steps.map((s, i) => (
          <group key={i}>
            <Box s={[2 * s.hs, s.top, 2 * s.hs]} p={[0, s.top / 2, 0]} m={brickPl(2 * s.hs, s.top)} />
            {SIDES.map((r, k) => (
              <group key={k} rotation={[0, r, 0]}>
                <Box s={[2 * s.hs + 0.08, 0.05, 0.11]} p={[0, s.top - 0.02, s.hs - 0.04]} m={coping} cast={false} />
              </group>
            ))}
          </group>
        ))}
        {/* central light-grey stone stair with coping edge on every tread, +z front */}
        {Array.from({ length: 8 }, (_, j) => {
          const front = 3.4 - 0.175 * j; const top = (yb / 8) * (j + 1);
          return (
            <group key={j}>
              <Box s={[1.5, top, front - 1.9]} p={[0, top / 2, (front + 1.9) / 2]} m={stairM} />
              <Box s={[1.58, 0.05, 0.12]} p={[0, top - 0.005, front - 0.05]} m={stairEdge} cast={false} />
            </group>
          );
        })}
        {[-1, 1].map((k) => (
          <Box key={k} s={[0.22, 0.24, Math.hypot(yb, 1.5)]} p={[k * 0.86, yb / 2 + 0.08, 2.65]} r={[Math.atan2(yb, 1.5), 0, 0]} m={stairM} />
        ))}
        {/* stone floor of the verandah */}
        <Box s={[3.9, 0.08, 3.9]} p={[0, yb + 0.04, 0]} m={stoneGrey} cast={false} />

        {/* red-brick cell with its arched door and brick niches */}
        <Box s={[2.3, e1 - yb - 0.08, 2.3]} p={[0, (yb + 0.08 + e1) / 2, 0]} m={brickCell(2.3, e1 - yb)} />
        {SIDES.map((r, i) => (
          <group key={i} rotation={[0, r, 0]}>
            {i === 0 ? (
              <>
                <Box s={[0.62, 1.5, 0.06]} p={[0, yb + 0.83, 1.17]} m={dark} cast={false} />
                <Cyl rt={0.31} h={0.06} p={[0, yb + 1.58, 1.17]} r={[Math.PI / 2, 0, 0]} m={dark} seg={14} />
                <Box s={[0.74, 0.07, 0.08]} p={[0, yb + 0.1, 1.18]} m={stoneGrey} cast={false} />
                {niche(-0.85, yb + 0.85, 0.34, 0.7, 'n1')}
                {niche(0.85, yb + 0.85, 0.34, 0.7, 'n2')}
                {niche(-0.85, yb + 1.62, 0.22, 0.3, 'n3')}
                {niche(0.85, yb + 1.62, 0.22, 0.3, 'n4')}
              </>
            ) : (
              <>
                <Box s={[0.55, 1.3, 0.06]} p={[0, yb + 0.75, 1.17]} m={dark} cast={false} />
                <Cyl rt={0.275} h={0.06} p={[0, yb + 1.4, 1.17]} r={[Math.PI / 2, 0, 0]} m={dark} seg={14} />
                {niche(-0.8, yb + 0.9, 0.3, 0.6, 'n1')}
                {niche(0.8, yb + 0.9, 0.3, 0.6, 'n2')}
              </>
            )}
          </group>
        ))}

        {/* open verandah: 20 dark-brown carved pillars (8 across front and back, 2 between the corners on each side) */}
        {[1.6, -1.6].map((z) => pillarXs.map((x, i) => (
          <group key={`${z}${i}`} position={[x, 0, z]}>
            <Box s={[0.26, 0.14, 0.26]} p={[0, yb + 0.15, 0]} m={stoneGrey} cast={false} />
            <Cyl rt={0.078} rb={0.095} h={1.95} p={[0, yb + 1.06, 0]} m={pil} seg={8} />
            <Box s={[0.22, 0.12, 0.22]} p={[0, e1 - 0.38, 0]} m={timberRed} cast={false} />
          </group>
        )))}
        {[1.6, -1.6].map((x) => [-0.533, 0.533].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <Box s={[0.26, 0.14, 0.26]} p={[0, yb + 0.15, 0]} m={stoneGrey} cast={false} />
            <Cyl rt={0.078} rb={0.095} h={1.95} p={[0, yb + 1.06, 0]} m={pil} seg={8} />
            <Box s={[0.22, 0.12, 0.22]} p={[0, e1 - 0.38, 0]} m={timberRed} cast={false} />
          </group>
        )))}
        {/* arched bays on the front and back */}
        {[1.6, -1.6].map((z) => pillarXs.slice(0, 7).map((x, i) => (
          <mesh key={`ar${z}${i}`} position={[x + 0.2286, e1 - 0.45, z]} material={timberRed}><torusGeometry args={[0.19, 0.04, 6, 12, Math.PI]} /></mesh>
        )))}
        {/* arched end-bay openings: brick-filled end bays on both flanks, each with an arched dark doorway */}
        {[1.6, -1.6].map((x) => [-1.067, 1.067].map((z) => (
          <group key={`eb${x}${z}`}>
            <Box s={[0.14, 1.95, 1.0]} p={[x, yb + 1.06, z]} m={brickCell(1.0, 1.95)} />
            <Box s={[0.17, 1.15, 0.5]} p={[x, yb + 0.66, z]} m={dark} cast={false} />
            <Cyl rt={0.25} h={0.17} p={[x, yb + 1.24, z]} r={[0, 0, Math.PI / 2]} m={dark} seg={12} />
            <Box s={[0.18, 0.08, 0.66]} p={[x, yb + 1.52, z]} m={coping} cast={false} />
          </group>
        )))}
        {/* beams on the pillar heads */}
        {[1.6, -1.6].map((z) => <Box key={z} s={[3.4, 0.15, 0.16]} p={[0, e1 - 0.24, z]} m={timber} />)}
        {[1.6, -1.6].map((x) => <Box key={x} s={[0.16, 0.15, 3.4]} p={[x, e1 - 0.24, 0]} m={timber} />)}

        {/* roof 1: very wide and deep-eaved, weathered tile rows, raking carved strut fans, red fringe */}
        <Roof w={sp1} d={sp1} h={h1} y={e1} m={roofM} lift={lift1} fascia />
        <Box s={[sp1 - 1.0, 0.03, sp1 - 1.0]} p={[0, e1 - 0.03, 0]} m={timber} cast={false} />
        {SIDES.map((r, i) => (
          <group key={i} rotation={[0, r, 0]}>
            {strutRow(i % 2 ? sidePil : pillarXs, 1.6, 2.5, e1 - 1.45, e1 - 0.05, 'p', 0.13, strutM)}
            {strutRow((i % 2 ? [-1.07, 0, 1.07] : pillarXs.slice(0, 7).map((x) => x + 0.2286)), 1.3, 2.35, e1 - 0.95, e1 - 0.05, 'a', 0.09, timber)}
            <mesh position={[0, e1 - 0.22, sp1 / 2 + 0.05]} material={fringeMat(Math.round(sp1 / 0.5))}><planeGeometry args={[sp1, 0.3]} /></mesh>
          </group>
        ))}
        {/* patchy grass and moss on roof 1 */}
        <group position={[0, roofY(sp1, h1, e1, 0, 1.85, 1.5, lift1) + 0.03, 1.85]} rotation={[mossTilt, 0, 0]}>
          {clumps.patches.map((q, i) => <Ball key={`p${i}`} rad={1} sc={[q.sx, 0.035, q.sz]} p={[q.x, 0.01, q.z]} m={mossM[q.c]} />)}
          {clumps.out.map((q, i) => (
            <mesh key={i} position={[q.x, 0.1 * q.k, q.z]} rotation={[0, 0, (i % 3 - 1) * 0.18]} material={grassM[q.c]}><coneGeometry args={[0.06, 0.2 * q.k, 5]} /></mesh>
          ))}
        </group>

        {/* storey 2: broad dark-timber balcony storey with a slatted wooden railing */}
        <Box s={[W2, e2 + 0.22 - e1, W2]} p={[0, (e1 + e2 + 0.22) / 2, 0]} m={wallDark} />
        {[1.72, -1.72].map((z) => <Box key={z} s={[3.9, 0.09, 0.5]} p={[0, e1 + 0.42, z]} m={timber} />)}
        {[1.72, -1.72].map((x) => <Box key={x} s={[0.5, 0.09, 3.0]} p={[x, e1 + 0.42, 0]} m={timber} />)}
        {SIDES.map((r, i) => (
          <group key={i} rotation={[0, r, 0]}>
            <mesh position={[0, e1 + 0.66, 1.95]} material={slatMat(16)}><planeGeometry args={[3.9, 0.42]} /></mesh>
            <Box s={[3.96, 0.06, 0.08]} p={[0, e1 + 0.89, 1.95]} m={timber} cast={false} />
            <Box s={[3.9, 0.05, 0.07]} p={[0, e1 + 0.45, 1.95]} m={timber} cast={false} />
            {[-1.95, 1.95].map((x) => <Box key={x} s={[0.09, 0.5, 0.09]} p={[x, e1 + 0.68, 1.95]} m={timberRed} cast={false} />)}
            {[-0.92, 0, 0.92].map((x, k) => windowPanel(x, e1 + 1.15, 0.62, 0.6, 1.47, `w${k}`))}
            {[-0.46, 0.46].map((x) => <Box key={x} s={[0.08, 0.84, 0.07]} p={[x, e1 + 1.15, 1.48]} m={timberRed} cast={false} />)}
          </group>
        ))}

        {/* roof 2: deep eaves, steps down evenly */}
        <Roof w={sp2} d={sp2} h={h2} y={e2} m={roofM} lift={0.26} fascia />
        <Box s={[sp2 - 0.08, 0.05, sp2 - 0.08]} p={[0, e2 - 0.05, 0]} m={timber} cast={false} />
        {SIDES.map((r, i) => (
          <group key={i} rotation={[0, r, 0]}>
            {strutRow([-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2], 1.48, 1.95, e2 - 0.62, e2 - 0.06, 'b', 0.1, strutM)}
            <mesh position={[0, e2 - 0.18, sp2 / 2 + 0.04]} material={fringeMat(Math.round(sp2 / 0.5))}><planeGeometry args={[sp2, 0.3]} /></mesh>
          </group>
        ))}

        {/* storey 3: lower, wide dark-timber band under roof 3 */}
        <Box s={[W3, e3 + 0.12 - e2, W3]} p={[0, (e2 + e3 + 0.12) / 2, 0]} m={wallDark} />
        {SIDES.map((r, i) => (
          <group key={i} rotation={[0, r, 0]}>{[-0.5, 0.5].map((x, k) => windowPanel(x, e2 + 0.55, 0.6, 0.48, 1.22, `c${k}`))}</group>
        ))}

        {/* roof 3 and the small gilded finial */}
        <Roof w={sp3} d={sp3} h={h3} y={e3} m={roofM} lift={0.22} fascia />
        <Box s={[sp3 - 0.06, 0.05, sp3 - 0.06]} p={[0, e3 - 0.05, 0]} m={timber} cast={false} />
        {SIDES.map((r, i) => (
          <group key={i} rotation={[0, r, 0]}>
            {strutRow([-0.9, -0.45, 0, 0.45, 0.9], 1.22, 1.6, e3 - 0.48, e3 - 0.05, 'd', 0.09, strutM)}
            <mesh position={[0, e3 - 0.15, sp3 / 2 + 0.04]} material={fringeMat(Math.round(sp3 / 0.5))}><planeGeometry args={[sp3, 0.26]} /></mesh>
          </group>
        ))}
        <Gajur y={e3 + h3 - 0.06} s={0.5} />

        {/* metal banner hanging from the pinnacle to roof 1 */}
        {banner.slice(0, -1).map((a, i) => {
          const b = banner[i + 1]; const dz = b[0] - a[0]; const dy = b[1] - a[1]; const L = Math.hypot(dy, dz);
          return <Box key={i} s={[0.05, 0.012, L + 0.02]} p={[0, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2]} r={[-Math.atan2(dy, dz), 0, 0]} m={M.plain('#6a5028', { metalness: 0.3, roughness: 0.6 })} cast={false} />;
        })}

        {/* saddled stone elephants flanking the foot of the stair */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 1.4, 0, 3.4]}>
            <Box s={[0.8, 0.5, 1.9]} p={[0, 0.25, 0]} m={stoneGrey} />
            <Box s={[0.9, 0.07, 2.0]} p={[0, 0.53, 0]} m={coping} />
            <group position={[0, 0.56, -0.05]} scale={1.5}><UmElephant m={ele} cloth={cloth} /></group>
          </group>
        ))}
        {/* the standing stone figure on its pedestal at the foot of the stair */}
        <group position={[0, 0, 4.15]}>
          <Box s={[0.5, 0.4, 0.5]} p={[0, 0.2, 0]} m={stoneGrey} />
          <Box s={[0.58, 0.07, 0.58]} p={[0, 0.43, 0]} m={coping} />
          <Cyl rt={0.11} rb={0.15} h={0.8} p={[0, 0.9, 0]} m={figM} seg={8} />
          <Box s={[0.42, 0.14, 0.16]} p={[0, 1.2, 0]} m={figM} />
          <Box s={[0.1, 0.5, 0.1]} p={[-0.24, 0.98, 0.04]} r={[0.2, 0, 0.1]} m={figM} />
          <Box s={[0.1, 0.5, 0.1]} p={[0.24, 0.98, 0.04]} r={[0.2, 0, -0.1]} m={figM} />
          <Ball rad={0.1} p={[0, 1.38, 0]} m={figM} />
          <Cyl rt={0.02} rb={0.09} h={0.2} p={[0, 1.55, 0]} m={figM} seg={8} />
        </group>
        {/* diyas on the top step */}
        {[-1.2, -0.6, 0.6, 1.2].map((x) => <Diyo key={x} p={[x, yb - 0.01, 2.0]} />)}
        <pointLight position={[0, 2.0, 1.0]} intensity={1.4} distance={4.5} color="#ff9a4a" />

        <Frame s={[7.2, 8.2, 9.2]} p={[0, 4.1, 1.4]} />
      </group>
    );
  }

  /* ---------- the summit, the old town below, the valley and the Himalaya ---------- */
  function UmaEnv() {
    const M = useM();
    const fac = facadeMats();
    const haze = hazeMat();
    const bfac = brickFacade();
    const bodyGeo = useMemo(unitBox, []);
    const coneGeo6 = useMemo(() => unitCone(6), []);
    const coneGeo9 = useMemo(() => unitCone(9), []);
    const cylGeo = useMemo(() => unitCyl(10), []);
    const capMat = M.plain('#ffffff', { roughness: 0.9 });
    const plainWhite = M.plain('#ffffff', { roughness: 0.95 });
    const brickPave = brickTex(7, 7, 1);
    const postBrick = M.mat('brick', 1, 1, { color: '#e2a08a' });
    const stoneG = M.mat('granite', 2, 2, { color: '#a9a296' });

    const slope = 12.5 / (21 - 5.66);
    const groundAt = (x, z) => Math.max(-12.5, -(Math.max(Math.abs(x), Math.abs(z)) - 5.66) * slope);

    const town = useMemo(() => {
      const r = rnd(5);
      const tints = ['#c9bfb0', '#b9a898', '#a8917f', '#a9aeb0', '#c8c0a8', '#9a8e82', '#d4d0c8', '#a67f6a', '#b8a090'];
      const caps = ['#8a5a48', '#6a7480', '#9a9a94', '#7c8084', '#8c6050', '#74826e', '#8e8e88'];
      const bodies = []; const roofs = []; const tanks = []; const bricks = []; const laundry = [];
      const add = (x, z, topMax, sizeK) => {
        const Li = Math.max(Math.abs(x), Math.abs(z));
        const gy = groundAt(x, z);
        const w = (2.5 + r() * 1.1) * sizeK; const d = (2.4 + r() * 1.1) * sizeK;
        let top = gy + 2.8 + r() * 2.8;
        top = Math.min(top, topMax(x, z, Li));
        if (top < gy + 1.2) top = gy + 1.2;
        const base = gy - 1.7;
        const rot = (Math.floor(r() * 4)) * Math.PI / 2 * 0 + (r() - 0.5) * 0.12;
        if (Li < 18 && r() < 0.5) {
          const bt = ['#ffffff', '#f4dccb', '#ecc4a8', '#e2b090'];
          bricks.push({ p: [x, base, z], s: [w, top - base, d], r: 0, c: bt[Math.floor(r() * bt.length)] });
          roofs.push({ p: [x, top, z], s: [w + 0.14, 0.14, d + 0.14], r: 0, c: '#9a5a48' });
          const lc = ['#d8c428', '#c82828', '#2f6fbd', '#f2f2ee', '#e07a20', '#3a9a5a'];
          laundry.push({ p: [x, top - 1.0, z + d / 2 + 0.08], s: [w * 0.85, 0.02, 0.02], r: 0, c: '#222222' });
          for (let q = 0; q < 6; q += 1) laundry.push({ p: [x - w * 0.36 + q * w * 0.145, top - 1.4, z + d / 2 + 0.08], s: [0.2, 0.42, 0.03], r: 0, c: lc[(q + Math.floor(r() * 6)) % 6] });
          return;
        }
        bodies.push({ p: [x, base, z], s: [w, top - base, d], r: rot, c: tints[Math.floor(r() * tints.length)] });
        roofs.push({ p: [x, top, z], s: [w + 0.14, 0.14, d + 0.14], r: rot, c: caps[Math.floor(r() * caps.length)] });
        if (r() < 0.32) tanks.push({ p: [x + (r() - 0.5) * w * 0.4, top + 0.14, z + (r() - 0.5) * d * 0.4], s: [0.28, 0.5, 0.28], c: r() < 0.5 ? '#1c1c1c' : '#4a6f90' });
      };
      const near = (x, z, Li) => (z < -4 ? (Li < 12 ? 2.3 : 0.6) : (Li < 11 ? -0.35 : -0.9));
      for (let gx = -6; gx <= 6; gx += 1) {
        for (let gz = -6; gz <= 6; gz += 1) {
          const x = gx * 3.8 + (r() - 0.5) * 1.1; const z = gz * 3.8 + (r() - 0.5) * 1.1;
          const Li = Math.max(Math.abs(x), Math.abs(z));
          if (Li < 7.0 || Li > 23.5) continue;
          add(x, z, near, 1);
        }
      }
      for (let gx = -11; gx <= 11; gx += 1) {
        for (let gz = -11; gz <= 11; gz += 1) {
          const x = gx * 4.6 + (r() - 0.5) * 1.6; const z = gz * 4.6 + (r() - 0.5) * 1.6;
          const Li = Math.max(Math.abs(x), Math.abs(z));
          if (Li < 24.5 || Li > 52) continue;
          if (r() < 0.22) continue;
          add(x, z, () => -12.5 + 5.2, 1.15);
        }
      }
      return { bodies, roofs, tanks, bricks, laundry };
    }, []);

    const trees = useMemo(() => {
      const r = rnd(21); const out = [];
      for (let i = 0; i < 22; i += 1) {
        const a = r() * Math.PI * 2; const d = 8 + r() * 12;
        const x = Math.cos(a) * d; const z = Math.sin(a) * d;
        const gy = groundAt(x, z);
        out.push({ p: [x, gy + 0.9, z], s: [0.9 + r() * 0.5, 2.6 + r() * 1.4, 0.9 + r() * 0.5], c: r() < 0.5 ? '#2f4a32' : '#44683a' });
      }
      return out;
    }, []);

    const peaks = useMemo(() => {
      const r = rnd(3); const rock = []; const snow = [];
      const N = 30;
      for (let i = 0; i < N; i += 1) {
        const a = (-2 - (176 * i) / (N - 1) + (r() - 0.5) * 3) * Math.PI / 180;
        const R = 140 + r() * 10;
        const h = 11 + r() * 9 + (i % 7 === 3 ? 7 : 0);
        const rad = 22 + r() * 10;
        const x = Math.cos(a) * R; const z = Math.sin(a) * R;
        rock.push({ p: [x, -12.5, z], s: [rad, h, rad], c: '#c2cfdf' });
        snow.push({ p: [x, -12.5 + h * 0.42, z], s: [rad * 0.66, h * 0.62, rad * 0.66], c: '#fbfdff' });
      }
      return { rock, snow };
    }, []);
    const hills = useMemo(() => {
      const r = rnd(9); const out = [];
      const gc = ['#6c8c5c', '#789a64', '#84a470', '#628458'];
      for (let i = 0; i < 24; i += 1) {
        const a = (i / 24) * Math.PI * 2 + r() * 0.2;
        const R = 62 + r() * 20; const rad = 15 + r() * 10;
        out.push({ p: [Math.cos(a) * R, -12.5, Math.sin(a) * R], s: [rad, 11 + r() * 8, rad], c: gc[i % 4] });
      }
      return out;
    }, []);
    const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ map: skyTex(false), side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }), []);
    const skyRef = (m) => {
      if (!m) return;
      m.onBeforeRender = (rr, scene) => {
        const bg = scene.background; const dusk = !!(bg && bg.isColor && bg.r < 0.5);
        const t = skyTex(dusk); if (skyMat.map !== t) { skyMat.map = t; skyMat.needsUpdate = true; }
      };
    };

    /* utility poles and wires, as in the photographs */
    const pole = (x, y, z, h = 6.4) => (
      <group position={[x, y, z]}>
        <Cyl rt={0.07} rb={0.1} h={h} p={[0, h / 2, 0]} m={M.plain('#6a5a4c')} seg={6} />
        <Box s={[1.3, 0.08, 0.08]} p={[0, h - 0.4, 0]} m={M.plain('#3a2e26')} cast={false} />
      </group>
    );
    function Wire({ a, b, sag = 0.5, off = 0 }) {
      const obj = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= 12; i += 1) { const t = i / 12; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t + off, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t)); }
        return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#1b1b1b' }));
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
      return <primitive object={obj} />;
    }

    /* platform edge: brick posts, low parapet, iron railing, gate */
    const hx = 5.3; const zf = 5.5; const zb = -5.3;
    const posts = [];
    [-hx, -2.65, 2.65, hx].forEach((x) => posts.push([x, zf]));
    posts.push([-1.5, zf], [1.5, zf]);
    [-2.65, 0, 2.65].forEach((x) => posts.push([x, zb]));
    posts.push([-hx, zb], [hx, zb]);
    [zb + 2.7, 0, 2.7].forEach((z) => { posts.push([-hx, z]); posts.push([hx, z]); });

    const lamp = (x, z) => (
      <group position={[x, 0, z]}>
        <Cyl rt={0.04} rb={0.05} h={1.9} p={[0, 0.95, 0]} m={M.plain('#2a2a2a')} seg={6} />
        <Ball rad={0.13} p={[0, 1.98, 0]} m={M.plain('#ffe6a8', { emissive: '#ffb050', emissiveIntensity: 0.7 })} />
        <pointLight position={[0, 1.9, 0]} intensity={0.9} distance={5} color="#ffb060" />
      </group>
    );

    return (
      <group>
        {/* valley floor, hill and summit platform */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -12.6, 0]} receiveShadow material={M.plain('#8c9f62')}><circleGeometry args={[150, 48]} /></mesh>
        <Cyl rt={8} rb={21} h={12.5} p={[0, -6.27, 0]} r={[0, Math.PI / 4, 0]} m={M.plain('#8a7a5c', { roughness: 1 })} seg={4} />
        <Box s={[10.8, 0.6, 11]} p={[0, -0.31, 0.1]} m={brickPave} />
        {/* parapet */}
        <Box s={[hx - 1.5, 0.36, 0.3]} p={[-(hx + 1.5) / 2, 0.18, zf]} m={postBrick} />
        <Box s={[hx - 1.5, 0.36, 0.3]} p={[(hx + 1.5) / 2, 0.18, zf]} m={postBrick} />
        <Box s={[2 * hx, 0.36, 0.3]} p={[0, 0.18, zb]} m={postBrick} />
        <Box s={[0.3, 0.36, zf - zb]} p={[hx, 0.18, (zf + zb) / 2]} m={postBrick} />
        <Box s={[0.3, 0.36, zf - zb]} p={[-hx, 0.18, (zf + zb) / 2]} m={postBrick} />
        {/* iron railings above the parapet */}
        {[[-(hx + 1.5) / 2, zf, 0, hx - 1.5], [(hx + 1.5) / 2, zf, 0, hx - 1.5], [0, zb, 0, 2 * hx], [hx, (zf + zb) / 2, Math.PI / 2, zf - zb], [-hx, (zf + zb) / 2, Math.PI / 2, zf - zb]].map(([x, z, r, w], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
            <mesh position={[0, 0.66, 0]} material={ironMat(Math.round(w / 0.3))}><planeGeometry args={[w, 0.6]} /></mesh>
            <Box s={[w, 0.05, 0.05]} p={[0, 0.96, 0]} m={M.plain('#25282b')} cast={false} />
          </group>
        ))}
        <Inst geo={bodyGeo} mat={postBrick} items={posts.map(([x, z]) => ({ p: [x, 0, z], s: [0.42, 1.05, 0.42] }))} />
        <Inst geo={bodyGeo} mat={stoneG} items={posts.map(([x, z]) => ({ p: [x, 1.05, z], s: [0.54, 0.1, 0.54] }))} />
        {/* the stone gate of the approach and its steps down the hill */}
        {[-1.5, 1.5].map((x) => <Box key={x} s={[0.5, 0.9, 0.5]} p={[x, 0.45, zf]} m={stoneG} />)}
        
        
        {Array.from({ length: 6 }, (_, j) => {
          const top = -0.3 * (j + 1);
          return <Box key={j} s={[2.4, top + 3.2, 0.55]} p={[0, (top - 3.2) / 2, zf + 0.5 + 0.55 * j]} m={stoneG} />;
        })}
        {lamp(-4.5, zf - 0.4)}
        {lamp(4.5, zf - 0.4)}

        {/* brass bell in an orange-painted brick recess under a black carved window, on the west (-x) side facing the front-left view */}
        <group position={[-4.2, 0, 2.6]} rotation={[0, 0.35, 0]} scale={0.8}>
          <Box s={[2.0, 1.9, 0.5]} p={[0, 0.95, 0]} m={M.mat('brick', 3, 3, { color: '#ff8f5c' })} />
          <Box s={[1.25, 1.1, 0.12]} p={[0, 1.0, 0.27]} m={M.mat('brick', 2, 2, { color: '#ff7a45' })} />
          {[-1.06, 1.06].map((x) => <Box key={x} s={[0.2, 2.0, 0.6]} p={[x, 1.0, 0.04]} m={M.plain('#d8502a')} />)}
          <Box s={[1.5, 0.35, 0.2]} p={[0, 1.8, 0.32]} m={M.plain('#15100d')} />
          <Box s={[1.15, 0.1, 0.12]} p={[0, 0.5, 0.36]} m={M.plain('#ff9a60')} />
          <Cyl rt={0.07} rb={0.24} h={0.42} p={[0, 0.98, 0.34]} m={M.gold} seg={14} />
          <Ball rad={0.075} p={[0, 1.22, 0.34]} m={M.gold} />
          <Cyl rt={0.012} h={0.35} p={[0, 1.42, 0.34]} m={M.plain('#3a3a38')} seg={4} />
        </group>

        {/* a few conifers at the approach, poles and wires */}
        <Tree p={[-5.0, 0, -2.6]} s={0.8} kind="pine" />
        <Tree p={[4.7, 0, -4.4]} s={0.9} kind="pine" />
        {pole(-5.1, 0, -3.0)}
        {pole(4.9, 0, -4.9)}
        {pole(-12, groundAt(-12, -6), -6, 6.5)}
        {pole(12, groundAt(12, -9), -9, 6.5)}
        {pole(-10, groundAt(-10, 9), 9, 6.5)}
        <Wire a={[-5.1, 6.0, -3.0]} b={[4.9, 6.0, -4.9]} sag={0.45} />
        <Wire a={[-5.1, 5.8, -3.0]} b={[4.9, 5.8, -4.9]} sag={0.55} off={0.1} />
        <Wire a={[-5.1, 6.0, -3.0]} b={[-12, groundAt(-12, -6) + 6.1, -6]} sag={1.2} />
        <Wire a={[4.9, 6.0, -4.9]} b={[12, groundAt(12, -9) + 6.1, -9]} sag={1.2} />
        <Wire a={[-5.1, 5.8, -3.0]} b={[-10, groundAt(-10, 9) + 6.1, 9]} sag={1.2} />

        {/* the dense old town of Kirtipur on every side of the summit */}
        <Inst geo={bodyGeo} mat={fac} items={town.bodies} />
        <Inst geo={bodyGeo} mat={bfac} items={town.bricks} />
        <Inst geo={bodyGeo} mat={plainWhite} items={town.laundry} shadow={false} />
        <Inst geo={bodyGeo} mat={capMat} items={town.roofs} />
        <Inst geo={cylGeo} mat={plainWhite} items={town.tanks} />
        <Inst geo={coneGeo9} mat={plainWhite} items={trees} />

        {/* valley hills and the Himalaya on the far horizon */}
        <mesh ref={skyRef} position={[0, -12, 0]} material={skyMat} renderOrder={-10}><sphereGeometry args={[420, 40, 20]} /></mesh>
        <Inst geo={coneGeo6} mat={plainWhite} items={hills} shadow={false} />
        <Inst geo={coneGeo6} mat={haze} items={peaks.rock} shadow={false} />
        <Inst geo={coneGeo6} mat={haze} items={peaks.snow} shadow={false} />
      </group>
    );
  }

  return { 'uma-maheshwar-kirtipur': { Main: UmaMain, Env: UmaEnv } };
}
