/* Taleju Bell, Patan Durbar Square (Lalitpur, Bagmati). A free-standing bell frame, NOT a temple: two chunky grey stone pillars
   carry ONE wide dark timber-and-tile roof with upswept eave corners and exactly three spire finials (centre tallest); a large
   blackened bell hangs on an arched hanger between the pillars. The frame stands on a broad buff stone block (about 2x the roof
   width) with an arched deity niche at the centre and low orange-red tiled lean-tos with shops either side. Behind: the long red
   palace tile roof; to one side the three-tier brick Degu Taleju, to the other the stone Chyasin Dega. Red-brick paved square.
   All sizes are photo estimates (no published dimensions); bell metal disputed (bronze / cast iron) so dark blackened bronze.
   1 unit = 1 m. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Tree, Frame, THREE, useMemo } = K;

  const PH = 3.6;       // plinth height (top of block)
  const PW = 11, PD = 4.6;
  const RW = 5.0, RD = 3.0, RH = 0.6, RT = 0.2, RLIFT = 1.1; // roof width, depth, rise, thickness, corner lift
  const PIL_X = 1.55;

  /* ---------- roof surface: two-way pitch, hipped ends, upswept corners ---------- */
  const roofY = (x, z) => {
    const ax = Math.abs(x) / (RW / 2); const az = Math.abs(z) / (RD / 2);
    return RH * Math.pow(1 - Math.min(1, az), 1.1) + RLIFT * Math.pow(ax, 3) * Math.pow(az, 2.5);
  };
  function roofGeos() {
    const N = 28; const hw = RW / 2; const hd = RD / 2;
    const P = []; const B = []; const uv = [];
    for (let j = 0; j <= N; j += 1) for (let i = 0; i <= N; i += 1) {
      const x = -hw + (RW * i) / N; const z = -hd + (RD * j) / N;
      const y = roofY(x, z);
      P.push(x, y, z); B.push(x, y - RT, z); uv.push(i / N * 5, j / N * 2);
    }
    const idx = []; const idxR = [];
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      const a = j * (N + 1) + i; const b = a + 1; const c = a + N + 1; const e = c + 1;
      idx.push(a, c, b, b, c, e); idxR.push(a, b, c, b, e, c);
    }
    const mk = (pos, ix) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(ix); g.computeVertexNormals(); return g;
    };
    // sides (edge fascia): boundary loop
    const loop = [];
    for (let i = 0; i <= N; i += 1) loop.push([i, 0]);
    for (let j = 1; j <= N; j += 1) loop.push([N, j]);
    for (let i = N - 1; i >= 0; i -= 1) loop.push([i, N]);
    for (let j = N - 1; j >= 1; j -= 1) loop.push([0, j]);
    loop.push([0, 0]);
    const sp = [];
    const vt = (i, j) => { const k = (j * (N + 1) + i) * 3; return [P[k], P[k + 1], P[k + 2]]; };
    const vb = (i, j) => { const k = (j * (N + 1) + i) * 3; return [B[k], B[k + 1], B[k + 2]]; };
    for (let k = 0; k < loop.length - 1; k += 1) {
      const [i0, j0] = loop[k]; const [i1, j1] = loop[k + 1];
      const t0 = vt(i0, j0); const t1 = vt(i1, j1); const b0 = vb(i0, j0); const b1 = vb(i1, j1);
      sp.push(...t0, ...b0, ...t1, ...t1, ...b0, ...b1);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    sg.computeVertexNormals();
    return { top: mk(P, idx), under: mk(B, idxR), side: sg };
  }

  /* ---------- procedural ashlar stone texture (buff blocks, dark mortar) ---------- */
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 3.3) * 43758.5453; return v - Math.floor(v); };
  const texCache = {};
  function ashlar(base, rx, ry, key) {
    const id = `${key}|${rx}|${ry}`;
    if (texCache[id]) return texCache[id];
    const W = 512; const H = 256;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#4e463a'; c.fillRect(0, 0, W, H);
    const rowH = [70, 52, 64, 48, 22];
    let yy = 0;
    for (let r = 0; r < rowH.length; r += 1) {
      const rh = rowH[r]; let x = -rnd(r + 7) * 160; let k = 0;
      while (x < W) {
        const bw = 90 + rnd(r * 31 + k) * 150; k += 1;
        const sh = (rnd(r * 17 + k * 3) - 0.5) * 70;
        const col = new THREE.Color(base); const f = 1 + sh / 255 * 1.6;
        c.fillStyle = `rgb(${Math.min(255, col.r * 255 * f) | 0},${Math.min(255, col.g * 255 * f) | 0},${Math.min(255, col.b * 255 * f) | 0})`;
        c.fillRect(x + 2, yy + 2, bw - 4, rh - 4);
        for (let n = 0; n < 30; n += 1) {
          c.fillStyle = `rgba(55,42,28,${0.05 + rnd(r * 99 + k * 7 + n) * 0.16})`;
          c.fillRect(x + 3 + rnd(n + k * 5 + r) * (bw - 10), yy + 3 + rnd(n * 3 + k + r * 9) * (rh - 10), 5 + rnd(n) * 26, 3 + rnd(n + 5) * 9);
        }
        x += bw;
      }
      yy += rh;
    }
    for (let n = 0; n < 14; n += 1) {
      const gx = rnd(n * 5 + 1) * W; const gw = 10 + rnd(n + 9) * 30;
      const gr = c.createLinearGradient(0, 0, 0, H * (0.4 + rnd(n) * 0.5));
      gr.addColorStop(0, 'rgba(35,28,20,0.45)'); gr.addColorStop(1, 'rgba(35,28,20,0)');
      c.fillStyle = gr; c.fillRect(gx, 0, gw, H);
    }
    const sg = c.createLinearGradient(0, H, 0, H * 0.7);
    sg.addColorStop(0, 'rgba(25,20,15,0.6)'); sg.addColorStop(1, 'rgba(25,20,15,0)');
    c.fillStyle = sg; c.fillRect(0, H * 0.7, W, H * 0.3);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache[id] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    return texCache[id];
  }
  /** Gable roof prism: ridge along x, w long, d deep, h rise, eave at y. */
  function Gable({ w, d, h, y, z = 0, m }) {
    const geo = useMemo(() => {
      const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(d / 2 - 0.2, 0.12); sh.lineTo(0, h); sh.lineTo(-d / 2 + 0.2, 0.12); sh.lineTo(-d / 2, 0);
      const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false });
      g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); return g;
    }, [w, d, h]);
    return <mesh geometry={geo} position={[0, y, z]} material={m} castShadow receiveShadow />;
  }

  /* ---------- lathe profiles ---------- */
  const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const bellGeo = () => lathe([[0.5, 0.0], [0.72, 0.0], [0.7, 0.07], [0.6, 0.13], [0.54, 0.3], [0.48, 0.55], [0.4, 0.8], [0.28, 0.97], [0.15, 1.04], [0.08, 1.08], [0.0, 1.08]]);
  const finialGeo = () => lathe([[0.0, 0.0], [0.17, 0.0], [0.17, 0.1], [0.11, 0.14], [0.11, 0.3], [0.19, 0.38], [0.19, 0.47], [0.1, 0.53], [0.1, 0.66], [0.14, 0.72], [0.12, 0.78], [0.06, 0.88], [0.0, 1.05]], 12);

  /* ---------- the bell frame ---------- */
  function Pillar({ x }) {
    const M = useM();
    const stone = M.plain('#72695c', { roughness: 0.95 });
    const stoneD = M.plain('#5c554a', { roughness: 0.95 });
    const dark = M.plain('#3b2a1c', { roughness: 0.85 });
    return (
      <group position={[x, 0, 0]}>
        <Box s={[1.1, 0.3, 1.1]} p={[0, 0.15, 0]} m={stoneD} />
        <Cyl rt={0.55} rb={0.64} h={3.55} p={[0, 2.05, 0]} r={[0, Math.PI / 4, 0]} m={stone} seg={4} />
        <Box s={[0.98, 0.14, 0.98]} p={[0, 3.88, 0]} m={stoneD} />
        <Box s={[1.04, 0.14, 1.04]} p={[0, 4.02, 0]} m={stone} />
        <Box s={[1.1, 0.34, 1.1]} p={[0, 4.26, 0]} m={dark} />
        {/* carved bracket arms along z, tips curled up */}
        <Box s={[0.26, 0.2, 2.5]} p={[0, 4.38, 0]} m={dark} />
        {[-1, 1].map((s) => <Box key={s} s={[0.22, 0.16, 0.3]} p={[0, 4.46, s * 1.25]} r={[s * 0.5, 0, 0]} m={dark} />)}
      </group>
    );
  }

  function Finial({ x, s }) {
    const M = useM();
    const geo = useMemo(finialGeo, []);
    const tip = M.plain('#8a6a2e', { roughness: 0.55, metalness: 0.45 });
    return (
      <group position={[x, RH - 0.02, 0]} scale={s}>
        <mesh geometry={geo} material={M.plain('#4a3a22', { roughness: 0.7, metalness: 0.2 })} castShadow />
        <mesh position={[0, 1.0, 0]} material={tip}><coneGeometry args={[0.035, 0.12, 6]} /></mesh>
      </group>
    );
  }

  function Arm({ sg, m }) {
    const geo = useMemo(() => {
      const c = new THREE.CatmullRomCurve3([[0.95, 4.12, 0], [1.12, 3.75, 0], [1.0, 3.3, 0], [0.62, 2.95, 0], [0.28, 2.7, 0], [0.12, 2.52, 0]].map(([x, y, z]) => new THREE.Vector3(sg * x, y, z)));
      return new THREE.TubeGeometry(c, 28, 0.06, 8, false);
    }, [sg]);
    return (
      <group>
        <mesh geometry={geo} material={m} castShadow />
        <Ball rad={0.1} p={[sg * 0.95, 4.1, 0]} m={m} />
        <Ball rad={0.075} p={[sg * 0.62, 2.95, 0]} m={m} />
      </group>
    );
  }

  function Pavilion() {
    const M = useM();
    const g = useMemo(roofGeos, []);
    const bell = useMemo(bellGeo, []);
    const tile = M.mat('roof', 5, 2, { color: '#5c4a40', side: THREE.DoubleSide });
    const timber = M.plain('#3b2a1c', { roughness: 0.85, side: THREE.DoubleSide });
    const dark = M.plain('#3b2a1c', { roughness: 0.85 });
    const bellM = M.plain('#3d3a35', { roughness: 0.4, metalness: 0.65 });
    const bellIn = M.plain('#1b1a18', { roughness: 0.8, side: THREE.DoubleSide });
    const brass = M.plain('#6b5530', { roughness: 0.5, metalness: 0.5 });
    const RY = 4.78;
    const tassels = [];
    for (let i = 0; i < 15; i += 1) {
      const x = -RW / 2 + 0.15 + ((RW - 0.3) * i) / 14;
      [-1, 1].forEach((s) => tassels.push([x, roofY(x, s * RD / 2) - RT - 0.1, s * RD / 2]));
    }
    for (let i = 1; i < 6; i += 1) {
      const z = -RD / 2 + (RD * i) / 6;
      [-1, 1].forEach((s) => tassels.push([s * RW / 2, roofY(s * RW / 2, z) - RT - 0.1, z]));
    }
    return (
      <group position={[0, PH, 0]}>
        <Pillar x={-PIL_X} /><Pillar x={PIL_X} />
        {/* cross beam + frieze under the roof */}
        <Box s={[3.9, 0.34, 0.4]} p={[0, 4.3, 0]} m={dark} />
        <Box s={[3.9, 0.28, 2.1]} p={[0, 4.56, 0]} m={dark} />
        {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => <Box key={x} s={[0.12, 0.18, 2.6]} p={[x, 4.42, 0]} m={timber} />)}
        {/* roof (one tier) */}
        <group position={[0, RY, 0]}>
          <mesh geometry={g.top} material={tile} castShadow receiveShadow />
          <mesh geometry={g.under} material={timber} />
          <mesh geometry={g.side} material={timber} castShadow />
          <Finial x={-1.0} s={1.3} /><Finial x={0} s={1.7} /><Finial x={1.0} s={1.3} />
          <Box s={[2.6, 0.08, 0.14]} p={[0, RH - 0.02, 0]} m={dark} />
          {tassels.map((p, i) => (
            <mesh key={i} position={p} rotation={[Math.PI, 0, 0]} material={brass}><coneGeometry args={[0.045, 0.16, 6]} /></mesh>
          ))}
        </group>
        {/* hanger: two S-shaped side arms from the beam to a single crown loop above the bell */}
        <group>
          {[-1, 1].map((sg) => <Arm key={sg} sg={sg} m={brass} />)}
          <mesh position={[0, 2.5, 0]} material={brass}><torusGeometry args={[0.15, 0.045, 8, 18]} /></mesh>
          <Cyl rt={0.07} h={0.2} p={[0, 2.38, 0]} m={brass} seg={8} />
          {/* bell: rim about one third up the pillar */}
          <mesh geometry={bell} position={[0, 1.28, 0]} material={bellM} castShadow />
          <mesh geometry={bell} position={[0, 1.28, 0]} scale={[0.92, 0.97, 0.92]} material={bellIn} />
          <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}><torusGeometry args={[0.66, 0.025, 6, 28]} /></mesh>
          <mesh position={[0, 1.85, 0]} rotation={[Math.PI / 2, 0, 0]} material={brass}><torusGeometry args={[0.5, 0.025, 6, 28]} /></mesh>
        </group>
      </group>
    );
  }

  /* ---------- plinth block with niche, lean-tos ---------- */
  function ArchNiche() {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape(); const w = 1.2; const h = 1.95; const r = w / 2;
      s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
      return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 14 });
    }, []);
    const frame = useMemo(() => {
      const s = new THREE.Shape(); const w = 1.5; const h = 2.25; const r = w / 2;
      s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
      return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false, curveSegments: 14 });
    }, []);
    return (
      <group position={[0, 0.95, PD / 2 + 0.002]}>
        <mesh geometry={frame} position={[0, -0.12, 0]} material={M.mat('granite', 1, 1, { color: '#7a6a50' })} />
        <mesh geometry={geo} position={[0, 0, 0.07]} material={M.plain('#120d09')} />
        <Box s={[0.4, 0.95, 0.07]} p={[0, 0.65, 0.15]} m={M.plain('#6e5636')} />
        <Ball rad={0.16} p={[0, 1.34, 0.16]} m={M.plain('#6e5636')} />
        <Box s={[0.8, 0.06, 0.07]} p={[0, 0.14, 0.15]} m={M.plain('#6e5636')} />
      </group>
    );
  }

  function Plinth() {
    const M = useM();
    const buff = ashlar('#b8aa88', 2.2, 1, 'front');
    const buffD = M.plain('#7a6c54', { roughness: 0.95 });
    const stone = M.plain('#7a7062', { roughness: 0.95 });
    const topBuff = M.plain('#76694f', { roughness: 0.95 });
    const moss = M.plain('#4a5a30', { roughness: 1 });
    const side = ashlar('#b0a280', 1.2, 1, 'side');
    const lamp = M.plain('#fff2c8', { emissive: '#ffd890', emissiveIntensity: 0.9 });
    const metal = M.plain('#4a4a4a', { metalness: 0.5 });
    const pot = M.plain('#a4553a');
    const leaf = M.plain('#4f7a3a');
    return (
      <group>
        <Box s={[PW + 0.5, 0.3, PD + 0.5]} p={[0, 0.15, 0]} m={stone} />
        <Box s={[PW, PH - 0.55, PD]} p={[0, 0.3 + (PH - 0.55) / 2, 0]} m={buff} />
        <Box s={[0.01, 0.01, 0.01]} p={[0, 0, 0]} m={buff} cast={false} />
        {/* side faces a little different so they do not repeat the front texture */}
        <Box s={[0.02, PH - 0.7, PD - 0.3]} p={[PW / 2 + 0.005, 1.9, 0]} m={side} cast={false} />
        <Box s={[0.02, PH - 0.7, PD - 0.3]} p={[-PW / 2 - 0.005, 1.9, 0]} m={side} cast={false} />
        {/* string course and cornice / coping */}
        <Box s={[PW + 0.15, 0.12, PD + 0.15]} p={[0, 0.85, 0]} m={buffD} cast={false} />
        <Box s={[PW + 0.3, 0.22, PD + 0.3]} p={[0, PH - 0.36, 0]} m={buffD} />
        <Box s={[PW + 0.5, 0.14, PD + 0.5]} p={[0, PH - 0.18, 0]} m={topBuff} />
        <Box s={[PW + 0.54, 0.05, 0.06]} p={[0, PH - 0.1, (PD + 0.5) / 2]} m={moss} cast={false} />
        <Box s={[PW + 0.54, 0.02, 0.2]} p={[0, PH - 0.095, (PD + 0.5) / 2 - 0.05]} m={moss} cast={false} />
        <Box s={[PW + 0.1, 0.12, PD + 0.1]} p={[0, PH - 0.06, 0]} m={topBuff} />
        <ArchNiche />
        {/* flowerpots and two floodlights on top */}
        {[-2.1, 2.1].map((x) => (
          <group key={x} position={[x, PH, 0.9]}>
            <Cyl rt={0.16} rb={0.11} h={0.26} p={[0, 0.13, 0]} m={pot} seg={10} />
            <Ball rad={0.2} p={[0, 0.4, 0]} m={leaf} />
          </group>
        ))}
        {[-3.9, 3.9].map((x) => (
          <group key={x} position={[x, PH, 1.5]}>
            <Cyl rt={0.03} h={0.7} p={[0, 0.35, 0]} m={metal} seg={6} />
            <Box s={[0.34, 0.24, 0.14]} p={[0, 0.78, 0.04]} r={[0.2, 0, 0]} m={metal} />
            <Box s={[0.28, 0.18, 0.02]} p={[0, 0.77, 0.12]} r={[0.2, 0, 0]} m={lamp} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function LeanTo({ sgn }) {
    const M = useM();
    const tile = M.mat('roof', 5, 3, { color: '#b8643f' });
    const brick = M.mat('brick', 3, 2, { color: '#e0a58c' });
    const wood = M.plain('#3b2a1c', { roughness: 0.8 });
    const dark = M.plain('#2b1f18');
    const shut = M.plain('#8d8f90', { roughness: 0.5, metalness: 0.4 });
    const x0 = sgn * (PW / 2 + 1.75);
    return (
      <group position={[x0, 0, 0]}>
        {/* sloping tile roof falling away from the block */}
        <Box s={[3.7, 0.15, 5.1]} p={[0, 2.55, 0.4]} r={[0, 0, -sgn * 0.2]} m={tile} />
        <Box s={[3.7, 0.12, 0.1]} p={[0, 2.38, 2.95]} r={[0, 0, -sgn * 0.2]} m={wood} />
        {[-1.6, -0.5, 0.6, 1.7, 2.7].map((z) => <Box key={z} s={[3.5, 0.1, 0.07]} p={[0, 2.64, z]} r={[0, 0, -sgn * 0.2]} m={wood} cast={false} />)}
        {/* back wall and end wall */}
        <Box s={[3.4, 2.3, 0.3]} p={[0, 1.15, 1.7]} m={brick} />
        <Box s={[0.3, 2.1, 4.2]} p={[sgn * 1.7, 1.05, -0.4]} m={brick} />
        {/* front timber posts and shop beam */}
        {[-1.5, 0.2, 1.5].map((x) => <Box key={x} s={[0.16, 2.2, 0.16]} p={[x, 1.1, 2.7]} m={wood} />)}
        <Box s={[3.5, 0.2, 0.2]} p={[0, 2.25, 2.7]} m={wood} />
        {sgn < 0 ? (
          <group>
            <Box s={[2.6, 1.8, 0.05]} p={[0, 1.2, 1.84]} m={dark} cast={false} />
            <Box s={[1.4, 0.2, 0.1]} p={[0, 0.9, 1.88]} m={wood} />
          </group>
        ) : (
          <group>
            <Box s={[2.2, 1.9, 0.06]} p={[0, 1.0, 1.88]} m={shut} />
            {[0.2, 0.5, 0.8, 1.1, 1.4, 1.7].map((y) => <Box key={y} s={[2.2, 0.03, 0.08]} p={[0, y, 1.9]} m={dark} cast={false} />)}
          </group>
        )}
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Plinth />
        <Pavilion />
        <LeanTo sgn={-1} /><LeanTo sgn={1} />
        <Frame s={[15, 10.4, 5.5]} p={[0, 5.2, 0.3]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function Bench({ p, r = 0 }) {
    const M = useM();
    const wood = M.plain('#6b4a2e'); const iron = M.plain('#2f3a3a', { metalness: 0.4 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[1.8, 0.07, 0.5]} p={[0, 0.45, 0]} m={wood} />
        <Box s={[1.8, 0.4, 0.06]} p={[0, 0.78, -0.24]} r={[-0.15, 0, 0]} m={wood} />
        {[-0.8, 0.8].map((x) => <Box key={x} s={[0.06, 0.45, 0.45]} p={[x, 0.22, 0]} m={iron} />)}
      </group>
    );
  }

  function ThreeTier({ p, r = 0 }) {
    const M = useM();
    const brick = M.mat('brick', 3, 2, { color: '#e0a58c' });
    const tile = M.mat('roof', 4, 4, { color: '#c2704f' });
    const dark = M.plain('#3b2a1c');
    const gilt = M.plain('#8a6a2e', { metalness: 0.5, roughness: 0.5 });
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[7.6, 0.5, 7.6]} p={[0, 0.25, 0]} m={M.mat('granite', 2, 1, { color: '#b9ac98' })} />
        <Box s={[6.6, 0.5, 6.6]} p={[0, 0.75, 0]} m={M.mat('granite', 2, 1, { color: '#b9ac98' })} />
        <Box s={[4.4, 3.0, 4.4]} p={[0, 2.5, 0]} m={brick} />
        <Box s={[1.1, 1.8, 0.12]} p={[0, 1.9, 2.24]} m={dark} />
        <Roof w={7.2} d={7.2} h={1.5} y={4.0} m={tile} sag={1.5} />
        <Box s={[3.6, 1.3, 3.6]} p={[0, 5.0, 0]} m={brick} />
        <Roof w={6.0} d={6.0} h={1.4} y={5.6} m={tile} sag={1.5} />
        <Box s={[2.8, 1.2, 2.8]} p={[0, 6.4, 0]} m={brick} />
        <Roof w={4.8} d={4.8} h={1.4} y={7.0} m={tile} sag={1.5} />
        <Cyl rt={0.1} rb={0.35} h={1.2} p={[0, 8.9, 0]} m={gilt} seg={10} />
      </group>
    );
  }

  function Chyasin({ p }) {
    const M = useM();
    const st = M.plain('#6a6255', { roughness: 0.95 });
    const stD = M.plain('#625a4e', { roughness: 0.95 });
    const roofM = M.plain('#4d463c', { roughness: 0.9 });
    const gilt = M.plain('#8a6a2e', { metalness: 0.5, roughness: 0.5 });
    const dome = useMemo(() => {
      const pts = [[0.01, 0]]; const R = 3.3; const H = 6.4; const n = 8;
      for (let i = 0; i < n; i += 1) {
        const t0 = i / n; const t1 = (i + 1) / n;
        const r0 = R * Math.pow(1 - Math.pow(t0, 1.7), 0.55) + 0.12; const r1 = R * Math.pow(1 - Math.pow(t1, 1.7), 0.55) + 0.12;
        pts.push([r0 + 0.12, t0 * H], [r0 + 0.12, t0 * H + 0.1], [r0, t0 * H + 0.16], [r1, t1 * H - 0.02]);
      }
      pts.push([0.35, H], [0.22, H + 0.3], [0.01, H + 0.3]);
      return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 16);
    }, []);
    return (
      <group position={p}>
        {/* stepped octagonal platform */}
        <Cyl rt={6.4} rb={6.7} h={0.4} p={[0, 0.2, 0]} r={[0, Math.PI / 8, 0]} m={stD} seg={8} />
        <Cyl rt={5.7} rb={5.9} h={0.4} p={[0, 0.6, 0]} r={[0, Math.PI / 8, 0]} m={st} seg={8} />
        <Cyl rt={5.0} rb={5.2} h={0.4} p={[0, 1.0, 0]} r={[0, Math.PI / 8, 0]} m={stD} seg={8} />
        {/* colonnade of the lower drum */}
        <Cyl rt={3.7} rb={3.7} h={1.6} p={[0, 2.0, 0]} r={[0, Math.PI / 8, 0]} m={M.plain('#2f2a24')} seg={8} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <Cyl key={i} rt={0.17} rb={0.2} h={1.7} p={[Math.cos(a) * 4.1, 2.05, Math.sin(a) * 4.1]} m={st} seg={8} />;
        })}
        <Cyl rt={4.7} rb={4.5} h={0.4} p={[0, 3.05, 0]} r={[0, Math.PI / 8, 0]} m={stD} seg={8} />
        {/* ring of small kiosks on the cornice */}
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2; const x = Math.cos(a) * 3.95; const z = Math.sin(a) * 3.95;
          return (
            <group key={i} position={[x, 3.25, z]} rotation={[0, -a, 0]}>
              {[-0.3, 0.3].map((o) => <Cyl key={o} rt={0.08} rb={0.09} h={0.7} p={[0, 0.35, o]} m={st} seg={6} />)}
              <Cyl rt={0.02} rb={0.62} h={0.6} p={[0, 1.0, 0]} r={[0, Math.PI / 4, 0]} m={roofM} seg={4} />
              <Cyl rt={0.01} rb={0.03} h={0.2} p={[0, 1.4, 0]} m={gilt} seg={6} />
            </group>
          );
        })}
        {/* main stepped bell-shaped stone dome */}
        <mesh geometry={dome} position={[0, 3.3, 0]} material={st} castShadow receiveShadow />
        {Array.from({ length: 8 }, (_, k) => {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          return <Cyl key={k} rt={0.01} rb={0.2} h={0.6} p={[Math.cos(a) * 2.6, 4.6, Math.sin(a) * 2.6]} m={st} seg={6} />;
        })}
        <Cyl rt={0.03} rb={0.1} h={1.2} p={[0, 10.3, 0]} m={gilt} seg={8} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const paving = M.mat('herring', 34, 34, { color: '#c8b0a6' });
    const slab = M.mat('granite', 6, 1, { color: '#b4aa9a' });
    const wall = M.mat('brick', 12, 2, { color: '#dd9f86' });
    const tile = M.mat('roof', 14, 3, { color: '#b9654a' });
    const gtile = M.mat('roof', 0.5, 0.5, { color: '#c27a5a' });
    const dark = M.plain('#2b1f18');
    const win = M.plain('#fff0c8', { emissive: '#ffbe6a', emissiveIntensity: 0.8 });
    const road = M.plain('#55575a', { roughness: 0.95 });
    const wood = M.plain('#4a2f20');
    const pole = M.plain('#3d4446', { metalness: 0.5 });
    const lamp = M.plain('#fff2c8', { emissive: '#ffd890', emissiveIntensity: 1.4 });
    return (
      <group>
        <Cyl rt={64} h={0.2} p={[0, -0.1, 0]} m={paving} seg={48} />
        {/* stone border lines in the paving */}
        <Box s={[40, 0.05, 0.6]} p={[0, 0.015, 3.4]} m={slab} cast={false} />
        <Box s={[40, 0.05, 0.6]} p={[0, 0.015, 12.5]} m={slab} cast={false} />
        <Box s={[0.6, 0.05, 10]} p={[-12, 0.015, 7.9]} m={slab} cast={false} />
        <Box s={[0.6, 0.05, 10]} p={[10, 0.015, 7.9]} m={slab} cast={false} />
        {[-20, -16, -8, 8, 16, 24].map((x) => <Box key={x} s={[0.5, 0.05, 14]} p={[x, 0.015, 9]} m={slab} cast={false} />)}
        {[-1, 6, 14, 18].map((z) => <Box key={z} s={[60, 0.05, 0.45]} p={[0, 0.016, z]} m={slab} cast={false} />)}
        {/* low stepped platforms around the plaza */}
        {[-1, 1].map((sg) => (
          <group key={sg}>
            <Box s={[7, 0.2, 3.2]} p={[sg * 9.5, 0.1, 9.2]} m={slab} />
            <Box s={[6, 0.2, 2.4]} p={[sg * 9.5, 0.3, 9.0]} m={slab} />
          </group>
        ))}
        {/* roadway near the Chyasin Dega corner */}
        <Box s={[60, 0.04, 8]} p={[30, 0.02, 20]} m={road} cast={false} />
        <Box s={[60, 0.05, 0.4]} p={[30, 0.03, 15.8]} m={slab} cast={false} />
        {/* palace: long red-brick front, red tile roof, below the pavilion */}
        <Box s={[56, 2.1, 6]} p={[0, 1.05, -9]} m={wall} />
        <Gable w={57} d={7.6} h={1.2} y={2.1} z={-9} m={gtile} />
        {Array.from({ length: 14 }, (_, i) => (
          <group key={i} position={[-20 + i * 3.08, 1.8, -5.97]}>
            <Box s={[0.9, 0.9, 0.08]} p={[0, 0, 0]} m={wood} cast={false} />
            <Box s={[0.7, 0.7, 0.04]} p={[0, 0, 0.04]} m={win} cast={false} />
          </group>
        ))}
        {/* Taleju temple complex roofs rising far behind, dark red */}
        <Box s={[10, 3.5, 8]} p={[-13, 1.75, -22]} m={wall} />
        <group position={[-13, 0, -22]}><Roof w={12} d={10} h={1.8} y={3.5} m={tile} sag={1.4} /></group>
        {/* three-tier brick temple (Degu Taleju) on the left, Chyasin Dega on the right */}
        <ThreeTier p={[-19, 0, -3]} />
        <Chyasin p={[18, 0, -3]} />
        {/* benches, lamp */}
        <Bench p={[-4, 0, 9]} r={Math.PI / 2 - 0.15} />
        <Bench p={[4.5, 0, 9.5]} r={Math.PI} />
        <Bench p={[-13, 0, 6]} r={Math.PI / 2} />
        <group position={[12.6, 0, 11]}>
          <Cyl rt={0.07} rb={0.1} h={5.2} p={[0, 2.6, 0]} m={pole} seg={8} />
          <Box s={[0.9, 0.06, 0.06]} p={[0.4, 5.2, 0]} m={pole} />
          <Box s={[0.5, 0.14, 0.24]} p={[0.8, 5.12, 0]} m={lamp} />
        </group>
        {/* a few trees behind the palace roofline, clear of the Degu Taleju / Chyasin silhouettes */}
        <Tree p={[-8, 0, -27]} s={2.4} /><Tree p={[5, 0, -29]} s={2.6} /><Tree p={[-32, 0, -20]} s={2.2} />
        {/* far horizon: roof silhouettes and green trees */}
        {[-52, -40, -26, 8, 22, 40, 52].map((x, i) => (
          <group key={x} position={[x, 0, -46 - (i % 3) * 4]}>
            <Box s={[7, 5 + (i % 3), 5]} p={[0, 2.8, 0]} m={wall} />
            <Roof w={8} d={6} h={1.6} y={5.4 + (i % 3)} m={tile} sag={1.2} />
          </group>
        ))}
        {[-50, -38, -24, 24, 34, 46, 56].map((x, i) => <Tree key={x} p={[x, 0, -40 - (i % 3) * 3]} s={3 + (i % 2)} />)}
        {/* distant plain houses either side beyond the palace */}
        {[-34, -28, 30, 36].map((x, i) => (
          <group key={x} position={[x, 0, -22 - (i % 2) * 4]}>
            <Box s={[5, 5 + (i % 2), 4]} p={[0, 2.6, 0]} m={wall} />
            <Roof w={5.6} d={4.6} h={1.2} y={5.2} m={tile} sag={1.1} />
          </group>
        ))}
      </group>
    );
  }

  return { 'taleju-bell': { Main, Env } };
}
