/* Upardang Gadhi, Ichchhakamana, Chitwan (~1,275 m). 1 unit = 1 m. Entrance (south gate) faces +z.
   A roofless dry-stone hill-fort ruin: a ~64 x 44 m walled grassy summit compound. Long dark grey-brown dry-laid flat-slab wall with
   stepped terrace courses at its foot (north / west / east), roofless room outlines, low stepped stone platforms, one standing stone
   shell with a notched flat parapet and a carved dark-timber doorway, a small gate tunnel with a dry ditch, the rebuilt 2-storey
   Kot Ghar museum tower, a stone-curbed well, taps, a tiny shrine. Hazy forested ridges, pale Himalayan ridge north, valley south.
   Layout / orientation / gate position are conventions (no plan is documented); geometry is taken from six photographs. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, THREE, useMemo } = K;

  const plain = (M, c, o = {}) => M.plain(c, { fog: false, ...o });
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const nz2 = (x, z) => Math.sin(x * 0.37 + z * 0.21 + 1.3) * 0.5 + Math.sin(x * 0.83 - z * 0.61 + 4.1) * 0.3 + Math.sin(x * 1.7 + z * 1.3 + 2.2) * 0.2;

  /* ---------------- plan constants ---------------- */
  const HX = 32.3, HZ = 22.3;       // outer face of perimeter wall
  const GATE_X = -10, GATE_W = 2.0;  // south gate tunnel
  const GY = -0.3;                    // ground level outside the walls (courtyard top = 0)

  /* ---------------- terrain ---------------- */
  /* irregular 8-sided enclosure following the hilltop; gate on the south edge (v5 -> v6) */
  const POLY = [[-30, -12], [-16, -22], [10, -22], [30, -12], [32, 8], [10, 22], [-8, 22], [-31, 10]];
  const GX = 1;
  function sdPoly(x, z) {
    let inside = false, best = 1e9;
    for (let i = 0; i < POLY.length; i++) {
      const [ax, az] = POLY[i], [bx, bz] = POLY[(i + 1) % POLY.length];
      if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
      const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
      best = Math.min(best, Math.hypot(x - ax - vx * t, z - az - vz * t));
    }
    return inside ? -best : best;
  }
  function rectDist(x, z) { return Math.max(sdPoly(x, z), 0); }
  function terr(x, z) {
    const d = rectDist(x, z);
    if (d <= 0) return -0.3;
    const south = z > 0 ? 1 : 0.62;
    let y = GY;
    const fall = sstep(4, z > 0 ? 52 : 78, d);
    y -= 49 * Math.pow(fall, 0.9) * south + 0.12 * Math.max(0, d - 5);
    y += nz2(x * 0.7, z * 0.7) * 1.5 * sstep(4, 20, d) * (1 - fall * 0.7);
    // dry ditch round the south, west and east fronts, with an earth causeway at the gate
    const fadeZ = sstep(-14, -4, z);
    const dd = d - 1.6;
    if (dd > 0 && dd < 3.4 && fadeZ > 0) {
      const prof = Math.sin((dd / 3.4) * Math.PI);
      const cw = 1 - sstep(GATE_W + 0.6, GATE_W + 2.4, Math.abs(x - GATE_X)) * 0 ; // placeholder
      const onGate = z > 0 && Math.abs(x - GATE_X) < GATE_W + 0.5 ? 1 : 0;
      y -= 0.0 * Math.min(1, prof * 1.8) * fadeZ * (1 - onGate);
    }
    return y;
  }

  /* ---------------- stone texture: long dry-laid flat slabs ---------------- */
  let _tex = null;
  function slabTex() {
    if (_tex) return _tex;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#1f1c19'; g.fillRect(0, 0, 256, 256);
    let y = 0, r = 0;
    while (y < 256) {
      const h = Math.min(256 - y, 6 + Math.floor(rnd(r * 3.1) * 7));
      let x = -Math.floor(rnd(r * 7.7) * 60);
      while (x < 256) {
        const w = 44 + Math.floor(rnd(x * 0.37 + r * 11) * 96);
        const L = 110 + Math.floor(rnd(x * 1.7 + r * 5.3) * 60);
        const warm = Math.floor(rnd(x * 0.9 + r * 2.2) * 5);
        g.fillStyle = `rgb(${L + warm},${L},${L - 12})`; g.fillRect(x + 1, y + 1, w - 2, h - 2);
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 1, y + h - 3, w - 2, 3);
        g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 1, y + 1, w - 2, 1);
        if (rnd(x + r * 31) > 0.82) { g.fillStyle = 'rgba(120,135,80,0.28)'; g.fillRect(x + 2, y + 2, w - 5, h - 5); }
        x += w;
      }
      y += h; r++;
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    _tex = t; return t;
  }
  const matCache = {};
  const stoneMat = (color) => (matCache[color] ||= new THREE.MeshStandardMaterial({ map: slabTex(), color, roughness: 1, fog: false }));
  const STONE = '#b4aca1', STONE2 = '#a39b91', STONE3 = '#bdb5a9', STONE_NEW = '#b4aca1';

  function StoneBox({ s, p, r, color = STONE, tile = 3.2 }) {
    const geo = useMemo(() => {
      const g = new THREE.BoxGeometry(s[0], s[1], s[2]);
      const uv = g.attributes.uv;
      const dims = [[s[2], s[1]], [s[2], s[1]], [s[0], s[2]], [s[0], s[2]], [s[0], s[1]], [s[0], s[1]]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const ii = f * 4 + k; uv.setXY(ii, (uv.getX(ii) * dims[f][0]) / tile, (uv.getY(ii) * dims[f][1]) / tile); }
      return g;
    }, [s[0], s[1], s[2]]); // eslint-disable-line
    return <mesh position={p} rotation={r} geometry={geo} material={stoneMat(color)} castShadow receiveShadow />;
  }

  /* ---------------- instancing ---------------- */
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const compose = (pos, rotY, sc) => _m.compose(_p.set(...pos), _q.setFromEuler(_e.set(0, rotY, 0)), _s.set(...sc)).clone();
  function Inst({ geo, mat, mats, colors, cast = false }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(geo, mat, mats.length);
      mats.forEach((mm, i) => im.setMatrixAt(i, mm));
      if (colors) colors.forEach((c, i) => im.setColorAt(i, new THREE.Color(c)));
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, mat, mats, colors, cast]);
    return <primitive object={mesh} />;
  }
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitCone = new THREE.ConeGeometry(1, 1, 7);
  const unitBall = new THREE.IcosahedronGeometry(1, 1);
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });
  const farMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, fog: false });

  /* ---------------- wall helpers ---------------- */
  // wall along x (axis 'x') or z centred at c with length len, thickness t
  function Wall({ cx, cz, len, t = 0.75, y0 = -0.5, y1, axis = 'x', color = STONE, cap = false }) {
    const h = y1 - y0, cy = (y0 + y1) / 2;
    const sz = axis === 'x' ? [len, h, t] : [t, h, len];
    return (
      <group>
        <StoneBox s={sz} p={[cx, cy, cz]} color={color} />
        {cap && <Box s={axis === 'x' ? [len + 0.04, 0.1, t * 0.9] : [t * 0.9, 0.1, len + 0.04]} p={[cx, y1 + 0.04, cz]} m={plain(useM(), '#6e6558', { roughness: 1 })} cast={false} />}
      </group>
    );
  }

  /* roofless room outline: four low walls with door gaps, ragged broken tops at different heights */
  function Room({ x, z, w, d, h = 0.9, t = 0.55, doors = [], seed = 1, color, rot = 0 }) {
    const col = color || [STONE, STONE2, STONE3][seed % 3];
    const parts = [];
    const sideDefs = [
      ['n', 'x', z - d / 2, w, x], ['s', 'x', z + d / 2, w, x], ['w', 'z', x - w / 2, d, z], ['e', 'z', x + w / 2, d, z],
    ];
    sideDefs.forEach(([side, axis, fixed, len, c0], si) => {
      const hh = h * (0.55 + 0.7 * rnd(seed * 7 + si));
      const dr = doors.find((q) => q[0] === side);
      const ext = len + t;
      const segs = [];
      if (dr) {
        const g0 = dr[1] - dr[2] / 2, g1 = dr[1] + dr[2] / 2;
        const a = -ext / 2, b = ext / 2;
        if (g0 - a > 0.2) segs.push([a, g0]);
        if (b - g1 > 0.2) segs.push([g1, b]);
      } else segs.push([-ext / 2, ext / 2]);
      segs.forEach(([a, b], k) => {
        // split each run into 2-3 pieces of differing height so the top looks broken
        const n = (b - a) > 6 ? 3 : (b - a) > 2.5 ? 2 : 1;
        for (let q = 0; q < n; q++) {
          const l = (b - a) / n, mid = a + l * (q + 0.5);
          const hk = Math.max(0.35, hh * (0.6 + 0.55 * rnd(seed * 13 + si * 5 + k * 3 + q)));
          const pos = axis === 'x' ? [c0 + mid, hk / 2, fixed] : [fixed, hk / 2, c0 + mid];
          const sz = axis === 'x' ? [l + 0.02, hk, t] : [t, hk, l + 0.02];
          parts.push(<StoneBox key={`${si}-${k}-${q}`} s={sz} p={pos} color={col} tile={2.4} />);
        }
      });
    });
    return <group position={[x, 0, z]} rotation={[0, rot, 0]}><group position={[-x, 0, -z]}>{parts}</group></group>;
  }

  /* double-course stepped wall: low outer course 0.6, higher inner 1.0 */
  function StepWall({ x, z, len, rot = 0, color = STONE }) {
    return (
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        <StoneBox s={[len, 1.0, 0.8]} p={[0, 0.5, -0.8]} color={color} tile={2.4} />
        <StoneBox s={[len + 0.6, 0.6, 0.9]} p={[0.2, 0.3, 0.1]} color={STONE2} tile={2.4} />
      </group>
    );
  }

  /* low stepped stone platform block */
  function Platform({ x, z, w, d, h = 1.0, rot = 0, tiers = 2, color = STONE }) {
    const M = useM();
    return (
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        <StoneBox s={[w, h, d]} p={[0, h / 2, 0]} color={color} tile={2.4} />
        {tiers > 1 && <StoneBox s={[w * 0.62, h * 0.45, d * 0.58]} p={[-w * 0.08, h + h * 0.225, 0]} color={STONE2} tile={2.0} />}
        <Box s={[w - 0.3, 0.05, d - 0.3]} p={[0, h + 0.02 - (tiers > 1 ? 0.0 : 0), 0]} m={plain(M, '#8e8470', { roughness: 1 })} cast={false} />
      </group>
    );
  }

  /* ---------------- terrace courses (ragged, stepped at the foot of the wall) ---------------- */
  function Terraces() {
    const M = useM();
    const grass = plain(M, '#a08a4c', { roughness: 1 });
    const data = useMemo(() => {
      const out = [];
      const T = 1.15, H = [1.15, 0.78, 0.42];
      const run = (axis, a0, a1, fixed, dir, k0) => {
        H.forEach((h, i) => {
          const segN = 3 + ((i + k0) % 2);
          const len = (a1 - a0) / segN;
          for (let sgi = 0; sgi < segN; sgi++) {
            const id = k0 * 50 + i * 7 + sgi;
            const hh = Math.max(0.2, h + (rnd(id) - 0.5) * 0.3);
            const inset = (rnd(id + 5) - 0.5) * 0.35;
            const c = a0 + len * (sgi + 0.5);
            const off = fixed + dir * (i * T + T / 2 + inset);
            out.push({ axis, c, off, len: len + 0.05, hh, T, id });
          }
        });
      };
      run('x', -29, 19, -HZ + 0.4, 1, 1);   // north: bands stack toward +z
      run('z', -14, 11, -HX + 0.4, 1, 2);   // west: stack toward +x
      run('z', -3, 12, HX - 0.4, -1, 3);    // east: stack toward -x
      return out;
    }, []);
    const blocks = useMemo(() => {
      const L = [], C = [];
      data.forEach((b, i) => {
        if (i % 2) return;
        for (let k = 0; k < 2; k++) {
          const id = b.id * 3 + k, along = b.c + (rnd(id) - 0.5) * b.len * 0.8, w = 0.35 + rnd(id + 1) * 0.35;
          const pos = b.axis === 'x' ? [along, b.hh + 0.08, b.off + (rnd(id + 2) - 0.5) * 0.3] : [b.off + (rnd(id + 2) - 0.5) * 0.3, b.hh + 0.08, along];
          L.push(compose(pos, rnd(id + 3) * 3, [w, 0.2 + rnd(id + 4) * 0.12, w * 0.7])); C.push(['#3d3732', '#4a443d', '#34302b'][id % 3]);
        }
      });
      return { L, C };
    }, [data]);
    return (
      <group>
        {data.map((b, i) => {
          const sz = b.axis === 'x' ? [b.len, b.hh + 0.3, b.T] : [b.T, b.hh + 0.3, b.len];
          const gs = b.axis === 'x' ? [b.len - 0.2, 0.05, b.T - 0.35] : [b.T - 0.35, 0.05, b.len - 0.2];
          const p = b.axis === 'x' ? [b.c, (b.hh - 0.3) / 2, b.off] : [b.off, (b.hh - 0.3) / 2, b.c];
          const gp = b.axis === 'x' ? [b.c, b.hh + 0.02, b.off] : [b.off, b.hh + 0.02, b.c];
          return (
            <group key={i}>
              <StoneBox s={sz} p={p} color={i % 3 ? STONE : STONE2} tile={2.6} />
              <Box s={gs} p={gp} m={grass} cast={false} />
            </group>
          );
        })}
        <Inst geo={unitBox} mat={whiteMat} mats={blocks.L} colors={blocks.C} />
      </group>
    );
  }

  /* ---------------- polygon perimeter, bastions, gate tower, stone ramp ---------------- */
  let _bt = null;
  const bastionMat = (color) => {
    if (!_bt) { _bt = slabTex().clone(); _bt.repeat.set(7, 1.6); _bt.needsUpdate = true; }
    return new THREE.MeshStandardMaterial({ map: _bt, color, roughness: 1, fog: false });
  };
  function Seg({ a, b, h, col = STONE, t = 1.0, k = 0 }) {
    const M = useM();
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ang = -Math.atan2(dz, dx);
    const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, y0 = -3.2;
    const n = Math.max(2, Math.floor(L / 3.0));
    const caps = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5;
      const bh = 0.35 + 0.35 * rnd(k * 17 + i);
      if (i % 2 === 0) caps.push(<StoneBox key={'c' + i} s={[L / n * 0.72, bh, t * 0.62]} p={[u * L, h + bh / 2, 0]} color={i % 4 === 0 ? '#c7bfb1' : STONE3} tile={1.4} />);
      else if (rnd(k * 5 + i) > 0.45) caps.push(<Box key={'m' + i} s={[L / n * 0.5, 0.05, t * 0.8]} p={[u * L, h + 0.05, 0]} m={plain(M, '#59693a', { roughness: 1 })} cast={false} />);
    }
    return (
      <group position={[cx, 0, cz]} rotation={[0, ang, 0]}>
        <StoneBox s={[L + 0.9, h - y0, t]} p={[0, (h + y0) / 2, 0]} color={col} tile={2.6} />
        <StoneBox s={[L + 0.9, 0.22, t + 0.22]} p={[0, h + 0.11, 0]} color="#cfc7b8" tile={2.0} />
        <StoneBox s={[L + 0.9, 1.1, t + 0.5]} p={[0, -0.55, 0.2]} color={STONE2} tile={2.0} />
        {caps}
      </group>
    );
  }
  function Bastion({ x, z, r = 3.3, h = 5.0 }) {
    const M = useM();
    const mat = useMemo(() => bastionMat('#aaa296'), []);
    const cap = useMemo(() => bastionMat('#cbc3b4'), []);
    const blocks = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; if (i % 2 === 0) blocks.push(<Box key={i} s={[1.0, 0.55, 0.7]} p={[Math.cos(a) * (r - 0.35), h + 0.55, Math.sin(a) * (r - 0.35)]} r={[0, -a + Math.PI / 2, 0]} m={cap} />); }
    return (
      <group position={[x, 0, z]}>
        <Cyl rt={r} rb={r + 0.5} h={h + 3.2} p={[0, (h - 3.2) / 2, 0]} m={mat} seg={18} />
        <Cyl rt={r + 0.25} rb={r + 0.25} h={0.25} p={[0, h + 0.12, 0]} m={cap} seg={18} />
        <Cyl rt={r - 0.3} rb={r - 0.3} h={0.04} p={[0, h + 0.26, 0]} m={plain(M, '#3b362f', { roughness: 1 })} seg={18} />
        {blocks}
        {[0.6, 2.2, 3.8, 5.4].map((a, i) => <Box key={'s' + i} s={[0.14, 0.7, 0.2]} p={[Math.cos(a) * (r + 0.02), h - 1.3, Math.sin(a) * (r + 0.02)]} r={[0, -a, 0]} m={plain(M, '#120f0c', { roughness: 1 })} cast={false} />)}
      </group>
    );
  }
  function GateTower() {
    const M = useM();
    const wood = plain(M, '#2a1d13', { roughness: 0.9 }), woodL = plain(M, '#4a3826', { roughness: 0.9 }), dark = plain(M, '#0e0c0a', { roughness: 1 });
    const W = 8, D = 6.4, H = 9.2, GW = 2.6, GH = 3.8, pw = (W - GW) / 2;
    const z = 22 - 0.2;
    return (
      <group position={[GX, 0, z]}>
        <StoneBox s={[W + 1.0, 1.0, D + 1.0]} p={[0, -0.45, 0]} color={STONE2} tile={2.4} />
        <StoneBox s={[pw, H + 3, D]} p={[-(GW / 2 + pw / 2), (H - 3) / 2, 0]} color="#a59d92" tile={2.6} />
        <StoneBox s={[pw, H + 3, D]} p={[GW / 2 + pw / 2, (H - 3) / 2, 0]} color="#b0a89b" tile={2.6} />
        <StoneBox s={[GW + 0.02, H - GH, D]} p={[0, GH + (H - GH) / 2, 0]} color="#a9a195" tile={2.6} />
        <Box s={[GW, GH, 0.2]} p={[0, GH / 2, -D / 2 + 0.6]} m={dark} cast={false} />
        <Box s={[GW + 0.4, 0.28, 0.6]} p={[0, GH + 0.1, D / 2 - 0.1]} m={wood} />
        <Box s={[0.22, GH, 0.6]} p={[-GW / 2 - 0.1, GH / 2, D / 2 - 0.1]} m={wood} /><Box s={[0.22, GH, 0.6]} p={[GW / 2 + 0.1, GH / 2, D / 2 - 0.1]} m={wood} />
        <Box s={[3.6, 0.8, 0.22]} p={[0, GH + 0.8, D / 2 + 0.05]} m={woodL} />
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[0.4, 0.4 + (i % 2) * 0.12, 0.08]} p={[-1.4 + i * 0.7, GH + 0.8, D / 2 + 0.2]} m={i % 2 ? wood : plain(M, '#7d6a52', { roughness: 0.9 })} cast={false} />)}
        <Box s={[0.9, 1.3, 0.2]} p={[-2.3, 6.8, D / 2 + 0.02]} m={dark} cast={false} /><Box s={[0.9, 1.3, 0.2]} p={[2.3, 6.8, D / 2 + 0.02]} m={dark} cast={false} />
        <Box s={[0.14, 0.9, 0.2]} p={[0, 6.8, D / 2 + 0.02]} m={dark} cast={false} />
        <Box s={[0.2, 1.3, 0.9]} p={[W / 2 + 0.01, 6.8, 0]} m={dark} cast={false} />
        <StoneBox s={[W + 0.4, 0.3, D + 0.4]} p={[0, 5.2, 0]} color="#c9c1b3" tile={2.4} />
        <StoneBox s={[W + 0.7, 0.34, D + 0.7]} p={[0, H + 0.17, 0]} color="#cdc5b6" tile={2.4} />
        {[-3.4, -1.6, 0.4, 2.2, 3.6].map((px, i) => [-2.8, 2.8].map((pz, j) => <StoneBox key={i + '-' + j} s={[1.1, 0.7 + ((i + j) % 2) * 0.35, 0.8]} p={[px, H + 0.34 + 0.4, pz]} color={(i + j) % 2 ? STONE : '#c4bcae'} tile={1.2} />))}
        {[-2.2, 0, 2.2].map((pz, i) => [-3.7, 3.7].map((px, j) => <StoneBox key={'s' + i + j} s={[0.8, 0.7 + ((i + j) % 2) * 0.3, 1.0]} p={[px, H + 0.34 + 0.38, pz]} color={STONE3} tile={1.2} />))}
        <Box s={[W - 1.2, 0.04, D - 1.2]} p={[0, H + 0.36, 0]} m={plain(M, '#2a251f', { roughness: 1 })} cast={false} />
      </group>
    );
  }
  function Ramp() {
    const M = useM();
    const steps = [];
    for (let i = 0; i < 11; i++) {
      const zc = 25.6 + i * 1.2, top = terr(GX, zc) + 0.1;
      const ttop = Math.round(top * 4) / 4;
      steps.push(
        <group key={i}>
          <StoneBox s={[3.4, 1.8, 1.2]} p={[GX, ttop - 0.9, zc]} color={i % 2 ? '#a79f93' : '#b9b1a4'} tile={1.8} />
          <Box s={[3.5, 0.08, 1.0]} p={[GX, ttop + 0.01, zc]} m={plain(M, i % 3 ? '#8f877a' : '#9d9587', { roughness: 1 })} cast={false} />
          <StoneBox s={[0.5, 0.8, 1.2]} p={[GX - 2.05, ttop + 0.2, zc]} color={STONE2} tile={1.2} />
          <StoneBox s={[0.5, 0.8, 1.2]} p={[GX + 2.05, ttop + 0.2, zc]} color={STONE2} tile={1.2} />
        </group>
      );
    }
    return <group>{steps}</group>;
  }
  function Perimeter() {
    const V = POLY;
    const heights = [3.6, 4.4, 4.4, 3.8, 3.4, 3.6, 3.8, 3.4];
    const cols = [STONE, STONE2, STONE3, STONE, STONE2, STONE, STONE3, STONE2];
    const segs = [];
    for (let i = 0; i < V.length; i++) {
      if (i === 5) {
        segs.push(<Seg key={i} a={V[5]} b={[GX + 4.2, 22]} h={heights[i]} col={cols[i]} k={i} />);
        segs.push(<Seg key={i + 'b'} a={[GX - 4.2, 22]} b={V[6]} h={heights[i]} col={cols[i]} k={i + 20} />);
      } else segs.push(<Seg key={i} a={V[i]} b={V[(i + 1) % V.length]} h={heights[i]} col={cols[i]} k={i} />);
    }
    return (
      <group>
        {segs}
        <Bastion x={30} z={-12} r={3.4} h={5.6} />
        <Bastion x={10} z={22} r={3.2} h={5.4} />
        <Bastion x={-8} z={22} r={3.2} h={5.2} />
        <Bastion x={-16} z={-22} r={2.6} h={4.4} />
        <GateTower />
        <Ramp />
      </group>
    );
  }

  /* ---------------- the standing stone shell with the carved doorway ---------------- */
  function Shell({ x = 8, z = -4, rot = 0.1 }) {
    const M = useM();
    const wood = plain(M, '#241a12', { roughness: 0.9 }), woodL = plain(M, '#3a2a1c', { roughness: 0.9 }), carv = plain(M, '#6b5a48', { roughness: 0.9 }), panel = plain(M, '#2f241a', { roughness: 0.9 });
    const W = 9.4, D = 6.4, H = 4.5, t = 0.8, DX = 1.2, DW = 1.5, DH = 3.4;
    const fz = D / 2 - t / 2, lw = DX - DW / 2 + W / 2, rw = W / 2 - (DX + DW / 2);
    return (
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        <StoneBox s={[W, 0.35, D + 0.5]} p={[0, 0.17, 0]} color={STONE2} tile={3} />
        <StoneBox s={[W, H, t]} p={[0, H / 2, -D / 2 + t / 2]} color={STONE} />
        <StoneBox s={[t, H, D]} p={[-W / 2 + t / 2, H / 2, 0]} color={STONE2} />
        <StoneBox s={[t, H, D]} p={[W / 2 - t / 2, H / 2, 0]} color={STONE} />
        {/* front wall with a 1.4 x 2.4 m door gap */}
        <StoneBox s={[lw, H, t]} p={[-W / 2 + lw / 2, H / 2, fz]} color={STONE} />
        <StoneBox s={[rw, H, t]} p={[W / 2 - rw / 2, H / 2, fz]} color={STONE2} />
        <StoneBox s={[DW, H - DH, t]} p={[DX, DH + (H - DH) / 2, fz]} color={STONE} tile={2} />
        {/* dark carved timber door frame + leaf + lintel panel */}
        <Box s={[0.14, DH, 0.5]} p={[DX - DW / 2 + 0.07, DH / 2, D / 2 - 0.3]} m={wood} /><Box s={[0.14, DH, 0.5]} p={[DX + DW / 2 - 0.07, DH / 2, D / 2 - 0.3]} m={wood} />
        <Box s={[DW, 0.15, 0.5]} p={[DX, DH - 0.07, D / 2 - 0.3]} m={wood} />
        <Box s={[0.75, DH - 0.2, 0.1]} p={[DX - 0.3, (DH - 0.2) / 2, D / 2 - 0.08]} m={woodL} />
        {[0.5, 1.2, 1.9, 2.6].map((y, i) => <Box key={i} s={[0.4, 0.2, 0.04]} p={[DX - 0.3, y, D / 2 - 0.01]} m={carv} cast={false} />)}
        <Box s={[2.5, 0.7, 0.16]} p={[DX, DH + 0.5, D / 2 + 0.06]} m={panel} />
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[0.32, 0.38 + (i % 2) * 0.1, 0.08]} p={[DX - 1.0 + i * 0.5, DH + 0.5, D / 2 + 0.17]} m={i % 2 ? carv : woodL} cast={false} />)}
        {/* heavy dark frame round the carved lintel panel */}
        <Box s={[2.7, 0.08, 0.2]} p={[DX, DH + 0.89, D / 2 + 0.07]} m={wood} /><Box s={[2.7, 0.08, 0.2]} p={[DX, DH + 0.11, D / 2 + 0.07]} m={wood} />
        <Box s={[DW, DH, 0.9]} p={[DX, DH / 2, -D / 2 + t / 2]} m={plain(M, '#9aa4aa', { roughness: 1, emissive: '#b8c4cc', emissiveIntensity: 0.45 })} cast={false} />
        <StoneBox s={[W - 0.3, 0.35, D - 0.3]} p={[0, H + 0.1, 0]} color={STONE3} tile={3} />
        {[[-3.9, 2.9, 0.45, 0.55], [-2.2, 2.9, 0.4, 0.3], [-0.1, 2.9, 0.55, 0.5], [2.9, 2.9, 0.4, 0.28], [4.1, 2.9, 0.5, 0.55],
          [-4.3, 0.4, 0.4, 0.55], [4.3, -0.6, 0.4, 0.4], [-3.0, -2.9, 0.5, 0.5], [0.8, -2.9, 0.5, 0.3], [3.2, -2.9, 0.45, 0.55]].map(([px, pz, w, hh], i) => (
          <StoneBox key={i} s={[w + 0.6, hh, 0.6]} p={[px, H + 0.27 + hh / 2, pz]} color={STONE} tile={1.4} />
        ))}
        <Box s={[W - 1.6, 0.04, D - 1.6]} p={[0, 0.37, 0]} m={plain(M, '#2a251f', { roughness: 1 })} cast={false} />
      </group>
    );
  }

  /* ---------------- rebuilt Kot Ghar museum tower, 2 floors ---------------- */
  function KotGhar({ x = 24, z = -HZ - 4.2 }) {
    const M = useM();
    const wood = plain(M, '#3a2a1d', { roughness: 0.9 });
    const glass = plain(M, '#3c474e', { roughness: 0.3, emissive: '#ffcf80', emissiveIntensity: 0.3 });
    const W = 5, D = 5, H1 = 2.2, H2 = 2.1, b = 0.3, SL = '#6c6d70', SL2 = '#5f6063';
    const win = (px, py, pz, ry, k) => (
      <group key={k} position={[px, py, pz]} rotation={[0, ry, 0]}>
        <Box s={[0.84, 1.04, 0.1]} p={[0, 0, 0]} m={wood} />
        <Box s={[0.66, 0.86, 0.12]} p={[0, 0, 0.02]} m={glass} cast={false} />
      </group>
    );
    return (
      <group position={[x, -0.3, z]} rotation={[0, 0.1, 0]}>
        <StoneBox s={[W + 0.4, b, D + 0.4]} p={[0, b / 2 - 0.05, 0]} color={SL} tile={3} />
        <StoneBox s={[W, H1, D]} p={[0, b + H1 / 2 - 0.05, 0]} color={SL} tile={2.6} />
        <StoneBox s={[W, H2, D]} p={[0, b + H1 + H2 / 2 - 0.05, 0]} color={SL} tile={2.6} />
        <StoneBox s={[W + 0.3, 0.3, D + 0.3]} p={[0, b + H1 + H2 + 0.1, 0]} color={SL2} tile={3} />
        <Box s={[1.0, 1.9, 0.14]} p={[0, 1.2, D / 2 + 0.01]} m={wood} />
        {win(1.5, 1.5, D / 2 + 0.03, 0, 'a')}
        {win(0, 3.8, D / 2 + 0.03, 0, 'b')}
        {win(W / 2 + 0.03, 1.5, 0, Math.PI / 2, 'c')}
        {win(W / 2 + 0.03, 3.8, 0, Math.PI / 2, 'd')}
        {win(-W / 2 - 0.03, 1.5, 0, -Math.PI / 2, 'e')}
        {win(-W / 2 - 0.03, 3.8, 0, -Math.PI / 2, 'f')}
        {win(0, 1.5, -D / 2 - 0.03, Math.PI, 'g')}
        {win(0, 3.8, -D / 2 - 0.03, Math.PI, 'h')}
      </group>
    );
  }

  /* ---------------- well, taps, shrine ---------------- */
  function Well({ x = 4, z = 12.5 }) {
    const M = useM();
    return (
      <group position={[x, 0, z]}>
        <Cyl rt={1.15} rb={1.25} h={0.65} p={[0, 0.32, 0]} m={stoneMat(STONE3)} seg={14} />
        <Cyl rt={0.78} rb={0.78} h={0.05} p={[0, 0.66, 0]} m={plain(M, '#10100f', { roughness: 1 })} seg={14} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Box key={i} s={[0.5, 0.12, 0.3]} p={[Math.cos(i * 0.785) * 1.0, 0.68, Math.sin(i * 0.785) * 1.0]} r={[0, -i * 0.785, 0]} m={stoneMat(STONE)} cast={false} />)}
      </group>
    );
  }
  function Taps() {
    const M = useM();
    const iron = plain(M, '#2c3236', { roughness: 0.5, metalness: 0.6 });
    return (
      <group>
        {[-4, -2.4].map((dz, i) => (
          <group key={i} position={[-24.5, 0, 9 + dz * 0.5 + 4]}>
            <StoneBox s={[0.7, 1.0, 0.7]} p={[0, 0.5, 0]} color={STONE3} tile={1.5} />
            <Cyl rt={0.04} rb={0.04} h={0.4} p={[0.45, 0.8, 0]} r={[0, 0, Math.PI / 2]} m={iron} seg={6} />
            <Box s={[0.6, 0.1, 0.5]} p={[0.5, 0.05, 0]} m={stoneMat(STONE2)} cast={false} />
          </group>
        ))}
      </group>
    );
  }
  function Shrine({ x = 17, z = 9.5 }) {
    const M = useM();
    const flame = plain(M, '#ffd27a', { emissive: '#ffa43a', emissiveIntensity: 1.3 });
    return (
      <group position={[x, 0, z]}>
        <StoneBox s={[2.4, 0.35, 2.4]} p={[0, 0.17, 0]} color={STONE2} tile={2} />
        <StoneBox s={[1.5, 1.5, 1.4]} p={[0, 1.1, 0]} color={STONE3} tile={1.8} />
        <Box s={[0.7, 1.0, 0.08]} p={[0, 0.9, 0.72]} m={plain(M, '#1c1814', { roughness: 1 })} cast={false} />
        <Box s={[1.9, 0.14, 1.8]} p={[0, 1.93, 0]} m={stoneMat(STONE)} />
        <Box s={[1.1, 0.3, 1.0]} p={[0, 2.1, 0]} m={stoneMat(STONE2)} />
        <Ball rad={0.1} p={[0.55, 0.45, 1.05]} m={flame} />
        <Ball rad={0.1} p={[-0.55, 0.45, 1.05]} m={flame} />
      </group>
    );
  }

  /* ---------------- courtyard ground detail ---------------- */
  function Courtyard() {
    const M = useM();
    const grass = plain(M, '#8a7646', { roughness: 1 });
    const data = useMemo(() => {
      const tufts = [], tc = [], stones = [], sc = [], patches = [], pc = [];
      for (let i = 0; i < 400; i++) {
        const x = (rnd(i * 2.1) - 0.5) * 60, z = (rnd(i * 3.7 + 1) - 0.5) * 40;
        if (sdPoly(x, z) > -1.6) continue;
        const h = 0.3 + rnd(i + 9) * 0.2;
        tufts.push(compose([x, h / 2, z], rnd(i) * 6, [0.16 + rnd(i + 4) * 0.12, h, 0.16 + rnd(i + 5) * 0.12]));
        tc.push(['#8c7a48', '#7f6e40', '#6f6035', '#85733f', '#766639'][i % 5]);
      }
      for (let i = 0; i < 56; i++) {
        const x = (rnd(i * 5.3 + 2) - 0.5) * 58, z = (rnd(i * 1.9 + 7) - 0.5) * 38;
        if (sdPoly(x, z) > -1.6) continue;
        const w = 0.4 + rnd(i + 21) * 0.7;
        stones.push(compose([x, 0.03, z], rnd(i + 3) * 3, [w, 0.08, w * (0.5 + rnd(i + 6) * 0.4)]));
        sc.push(['#6a6258', '#5c554b', '#74695c'][i % 3]);
      }
      for (let i = 0; i < 26; i++) {
        const x = (rnd(i * 4.4 + 5) - 0.5) * 60, z = (rnd(i * 2.2 + 3) - 0.5) * 40, r = 1.2 + rnd(i + 3) * 3;
        if (sdPoly(x, z) > -3) continue;
        patches.push(compose([x, 0.012 + (i % 5) * 0.001, z], 0, [r, 1, r * (0.5 + rnd(i) * 0.5)]));
        pc.push(['#6a5b32', '#73643a', '#5c4f2b', '#786838', '#554a2a'][i % 5]);
      }
      return { tufts, tc, stones, sc, patches, pc };
    }, []);
    const disc = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.02, 10), []);
    const floorGeo = useMemo(() => {
      const sh = new THREE.Shape(POLY.map(([x, z]) => new THREE.Vector2(x * 0.985, -z * 0.985)));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false });
      g.rotateX(-Math.PI / 2); return g;
    }, []);
    return (
      <group>
        <mesh geometry={floorGeo} position={[0, -0.5, 0]} material={grass} receiveShadow />
        <Inst geo={disc} mat={whiteMat} mats={data.patches} colors={data.pc} />
        <Inst geo={unitBox} mat={whiteMat} mats={data.stones} colors={data.sc} />
        <Inst geo={unitCone} mat={whiteMat} mats={data.tufts} colors={data.tc} />
      </group>
    );
  }

  /* ---------------- Main ---------------- */
  function UpardangMain() {
    const M = useM();
    const rubble = useMemo(() => {
      const L = [], C = [];
      for (let i = 0; i < 70; i++) {
        const a = rnd(i * 3.3) * 6.283, side = i % 4;
        let x, z;
        if (side === 0) { x = (rnd(i + 1) - 0.5) * 56; z = -14 + rnd(i + 4) * 26; } else { x = (rnd(i + 8) - 0.5) * 58; z = (rnd(i + 2) - 0.5) * 36; }
        if (sdPoly(x, z) > -2) continue;
        const w = 0.3 + rnd(i + 5) * 0.5;
        L.push(compose([x, 0.1 + w * 0.15, z], a, [w, w * 0.4, w * 0.7])); C.push(['#5a5249', '#6d6458', '#4d463f'][i % 3]);
      }
      return { L, C };
    }, []);
    return (
      <group>
        <Courtyard />
        <Perimeter />
        {/* roofless room outlines: irregular, off-axis, at differing heights */}
        <Room x={-21} z={-11.5} w={9} d={6} seed={1} rot={0.13} h={1.0} doors={[['s', 0.4, 1.1], ['e', 0.5, 1.0]]} />
        <Room x={-9} z={-10} w={11} d={5} seed={3} rot={-0.09} doors={[['s', 1, 1.2], ['w', 0, 1.0]]} h={1.2} />
        <Room x={-23} z={-0.5} w={5} d={5.4} seed={5} rot={0.17} doors={[['e', 0.8, 1.1]]} h={0.8} />
        <Room x={-17.5} z={2.5} w={5.2} d={4} seed={6} rot={-0.12} doors={[['s', 0.5, 1.1]]} h={0.7} />
        <Room x={-10} z={-0.8} w={5.5} d={5.4} seed={7} rot={0.08} doors={[['n', -0.4, 1.1]]} h={0.95} />
        <Room x={24} z={-2.5} w={5} d={5} seed={8} rot={-0.15} doors={[['w', 0, 1.1]]} h={0.7} />
        <Room x={22} z={7.5} w={6.6} d={5.4} seed={9} rot={0.1} doors={[['n', 0, 1.2], ['w', 0.2, 1.1]]} h={1.1} />
        <Room x={-8} z={14.5} w={6.5} d={4.4} seed={11} rot={-0.14} doors={[['w', 0, 1.1], ['n', 1, 1.0]]} h={0.65} />
        <StepWall x={-1} z={-4} len={9} rot={0.07} />
        <StepWall x={15} z={6} len={7} rot={-0.14} color={STONE3} />
        {/* stepped platform blocks */}
        <Platform x={-4} z={6} w={6.2} d={3.6} h={1.1} tiers={2} rot={0.09} />
        <Platform x={6} z={7.5} w={4.6} d={3.0} h={0.8} tiers={2} color={STONE2} rot={-0.12} />
        <Platform x={-21} z={10.5} w={5.6} d={3.2} h={0.6} tiers={1} color={STONE3} rot={0.06} />
        <Platform x={18} z={-4.5} w={3.6} d={2.6} h={0.55} tiers={1} rot={0.2} />
        <Shell />
        <KotGhar x={20} z={-10} />
        <Well />
        <Taps />
        <Shrine x={13} z={11} />
        {/* a few small trees at the wall edge */}
        <Tree p={[-34, terr(-34, -4), -4]} s={1.5} kind="broad" />
        <Tree p={[-36, terr(-36, 12), 12]} s={1.3} kind="broad" />
        <Tree p={[37, terr(37, -2), -2]} s={1.5} kind="broad" />
        <Tree p={[22, terr(22, 21), 21]} s={1.2} kind="broad" />
        <Inst geo={unitBox} mat={whiteMat} mats={rubble.L} colors={rubble.C} cast />
        {/* gate lantern (lit at dusk) */}
        <Ball rad={0.16} p={[GX + 2.4, 4.9, 25.4]} m={plain(M, '#ffe2a0', { emissive: '#ffb860', emissiveIntensity: 1.2 })} />
        <Frame s={[50, 9, 34]} p={[0, 3.2, 0]} />
      </group>
    );
  }

  /* ---------------- Env ---------------- */
  const X0 = -96, X1 = 96, Z0 = -84, Z1 = 100, S = 1.5;
  function buildTerrain() {
    const nx = Math.round((X1 - X0) / S) + 1, nz = Math.round((Z1 - Z0) / S) + 1;
    const pos = [], col = [], idx = [];
    const GOLD = new THREE.Color('#8f8552'), INNER = new THREE.Color('#a08a50'), OLIVE = new THREE.Color('#6E7C5A'), DARK = new THREE.Color('#52653f'), DRY = new THREE.Color('#6d6a45'), HAZE = new THREE.Color('#9cab9a'), EARTH = new THREE.Color('#7b6a4d'), ROCK = new THREE.Color('#6e6458');
    const c = new THREE.Color();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = X0 + i * S, z = Z0 + j * S;
      const y = terr(x, z); pos.push(x, y, z);
      const d = rectDist(x, z), n = nz2(x * 1.1, z * 1.1), f = nz2(x * 0.25 + 7, z * 0.25);
      if (d <= 0) c.copy(INNER);
      else {
        c.copy(GOLD).lerp(DRY, 0.3 + n * 0.3);
        if (f > 0.1) c.lerp(OLIVE, 0.25 + 0.3 * f);
        c.lerp(OLIVE, sstep(5, 24, d) * 0.85); c.lerp(DARK, sstep(16, 60, d) * (0.65 + 0.3 * f));
        if (d > 1.4 && d < 4 && z > -10) c.lerp(EARTH, 0.3);
        if (n > 0.5 && d > 6) c.lerp(ROCK, 0.3);
        c.lerp(HAZE, sstep(70, 120, d) * 0.35);
      }
      col.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, cc = a + nx, e = cc + 1; idx.push(a, cc, b, b, cc, e); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  /* ridge crest height as a function of angle; the big mass sits behind the fort (west to north, th ~ -2.4 rad) */
  const angd = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  function ridgeTop(R, layer, th, snow) {
    const w = Math.exp(-Math.pow(angd(th, -2.2) / 1.9, 2));
    const jag = (Math.sin(23 * th + layer) * 0.5 + Math.sin(47 * th + 2 * layer) * 0.35 + Math.sin(101 * th) * 0.2 + Math.sin(187 * th + layer) * 0.12) * (2.0 + layer * 1.2);
    const prof = 0.5 + 0.5 * (Math.sin(3 * th + layer * 1.7) * 0.6 + Math.sin(7 * th + layer * 2.9) * 0.3);
    if (snow) return 6 + 24 * Math.exp(-Math.pow(angd(th, -2.1) / 0.45, 2)) + 3 * Math.sin(29 * th) - 30 * (1 - w);
    if (layer === 1) return -58 + w * (62 + 18 * prof) + jag * w;
    return -30 + layer * 3 + w * (36 + 16 * prof) + jag * (0.3 + w);
  }
  const RSLOPE = 0.3; // fraction of R the ridge flank runs inward as it descends
  function buildRidge(R, layer, color, haze, snow) {
    const N = 360, ROWS = 8, pos = [], col = [], idx = [];
    const base = new THREE.Color(color), hz = new THREE.Color('#b9c6c4'), c = new THREE.Color();
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const top = ridgeTop(R, layer, th, snow);
      for (let r = 0; r < ROWS; r++) {
        const t = r / (ROWS - 1);
        const y = top + (-70 - top) * t * t, rr = snow ? R : R * (1 - RSLOPE * t);
        // patchy forest variation in 2-D, drifting diagonally so it never forms vertical streaks
        const v = nz2(th * 9 + t * 7, t * 4 + layer * 5);
        c.copy(base).offsetHSL(0, 0, v * 0.03 - (1 - t) * 0.0).lerp(hz, haze);
        pos.push(Math.cos(th) * rr, y, Math.sin(th) * rr); col.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < N; i++) for (let r = 0; r < ROWS - 1; r++) { const a = i * ROWS + r, b = (i + 1) * ROWS + r; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }

  function HazeSky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(700, 24, 16);
      const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); const c = new THREE.Color(); const a = new THREE.Color('#e4e9e6'), b = new THREE.Color('#7fa8d6');
      for (let i = 0; i < pos.count; i++) { const t = Math.max(0, pos.getY(i) / 700); c.copy(a).lerp(b, Math.pow(t, 0.5)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
    }, []);
    return <mesh geometry={geo}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  const PATH = [[GATE_X, 25], [-6, 31], [-13, 38], [-7, 46], [-15, 54], [-9, 63]];

  function UpardangEnv() {
    const M = useM();
    const terrGeo = useMemo(buildTerrain, []);
    const ridges = useMemo(() => [
      buildRidge(95, 1, '#38553a', 0.0, false),
      buildRidge(140, 2, '#4c6a47', 0.5, false),
      buildRidge(190, 3, '#547049', 0.72, false),
      buildRidge(250, 4, '#d3dde8', 0.55, true),
    ], []);
    const trees = useMemo(() => {
      const cone = [], cc = [], ball = [], bc = [];
      for (let i = 0; i < 4200; i++) {
        const x = X0 + 4 + rnd(i * 1.37) * (X1 - X0 - 8), z = Z0 + 4 + rnd(i * 2.91 + 3) * (Z1 - Z0 - 8);
        const d = rectDist(x, z);
        if (d < 16) continue;
        if (rnd(i + 77) > 0.12 + 0.5 * sstep(14, 60, d)) continue;
        if (nz2(x * 0.2 + 3, z * 0.2) < -0.5 && d < 26) continue; // open dry-grass clearings
        let near = false; for (let k = 0; k < PATH.length; k++) if (Math.hypot(x - PATH[k][0], z - PATH[k][1]) < 4) { near = true; break; }
        if (near) continue;
        const y = terr(x, z); if (y < -46) continue;
        const sc = 0.9 + sstep(0, 80, d) * 0.5;
        const hz = sstep(50, 130, d) * 0.45; const hc = (hex) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#aab9b4'), hz).getHexString();
        if (rnd(i + 5) > 0.4) {
          const h = (5 + rnd(i + 7) * 3) * sc, r = (1.3 + rnd(i + 11) * 0.8) * sc;
          cone.push(compose([x, y + h / 2 - 0.2, z], rnd(i) * 6, [r, h, r]));
          cc.push(hc(['#4f6a43', '#47603e', '#4f6a43', '#566f45', '#3e5a3c'][i % 5]));
        } else {
          const r = (1.7 + rnd(i + 13) * 1.1) * sc;
          ball.push(compose([x, y + r * 0.7 + 0.6, z], rnd(i) * 6, [r, r * 0.8, r]));
          bc.push(hc(['#5d7a4c', '#587548', '#667f4a', '#52703f', '#5d7a4c'][i % 5]));
        }
      }
      return { cone, cc, ball, bc };
    }, []);
    const crest = useMemo(() => {
      const L = [], C = [];
      [[95, 1, 3500, 0.0]].forEach(([R, layer, n, hz], q) => {
        for (let i = 0; i < n; i++) {
          const th = rnd(i * 1.7 + q * 91) * Math.PI * 2;
          const top = ridgeTop(R, layer, th, false);
          if (top < 4) continue;
          const t = Math.pow(rnd(i + 5 + q * 7), 1.5) * 0.28;
          const rr = R * (1 - RSLOPE * t) - 0.5, y = top + (-70 - top) * t * t;
          const h = 4.5 + rnd(i + 9) * 4.5, w = 1.5 + rnd(i + 11) * 1.0;
          L.push(compose([Math.cos(th) * rr, y + h * 0.35, Math.sin(th) * rr], rnd(i) * 6, [w, h, w]));
          C.push('#' + new THREE.Color(['#34502f', '#3b5736', '#2f4a2c', '#456340'][i % 4]).lerp(new THREE.Color('#b9c6c4'), hz).getHexString());
        }
      });
      return { L, C };
    }, []);
    const stones = useMemo(() => {
      const L = [], C = [];
      for (let k = 0; k < PATH.length - 1; k++) {
        const [ax, az] = PATH[k], [bx, bz] = PATH[k + 1]; const len = Math.hypot(bx - ax, bz - az);
        for (let s = 0; s < len; s += 1.15) {
          const t = s / len, x = ax + (bx - ax) * t + (rnd(s + k * 9) - 0.5) * 0.5, z = az + (bz - az) * t;
          const y = terr(x, z);
          L.push(compose([x, y + 0.06, z], rnd(s * 3 + k) * 3, [0.9 + rnd(s) * 0.4, 0.14, 0.6 + rnd(s + 2) * 0.3]));
          C.push(['#8b8272', '#7a7164', '#968c7c'][(k + Math.floor(s)) % 3]);
        }
      }
      return { L, C };
    }, []);
    const gy = terr(-17, 36);
    return (
      <group>
        <mesh geometry={terrGeo} receiveShadow><meshStandardMaterial vertexColors color="#9c9c94" roughness={1} fog={false} /></mesh>
        <HazeSky />
        {/* valley floor far below, hazy */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -50, 0]}><circleGeometry args={[300, 48]} /><meshBasicMaterial color="#aebba6" fog={false} /></mesh>
        {ridges.map((g, i) => <mesh key={i} geometry={g}><meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} /></mesh>)}
        <Inst geo={unitCone} mat={farMat} mats={crest.L} colors={crest.C} />
        <Inst geo={unitCone} mat={farMat} mats={trees.cone} colors={trees.cc} cast />
        <Inst geo={unitBall} mat={farMat} mats={trees.ball} colors={trees.bc} cast />
        {/* Ganesh shrine beside the path below the fort */}
        <group position={[-17, gy, 36]} rotation={[0, 0.5, 0]}>
          <StoneBox s={[2.0, 0.4, 2.0]} p={[0, 0.0, 0]} color={STONE2} tile={2} />
          <StoneBox s={[1.2, 1.2, 1.1]} p={[0, 0.8, 0]} color={STONE3} tile={1.6} />
          <Box s={[0.6, 0.8, 0.06]} p={[0, 0.65, 0.57]} m={plain(M, '#1c1814', { roughness: 1 })} cast={false} />
          <Ball rad={0.22} p={[0, 0.62, 0.52]} sc={[1, 1.2, 0.8]} m={plain(M, '#c8531e', { roughness: 0.8 })} />
          <Box s={[1.5, 0.14, 1.4]} p={[0, 1.47, 0]} m={stoneMat(STONE)} />
          <Ball rad={0.08} p={[0.45, 0.28, 1.1]} m={plain(M, '#ffd27a', { emissive: '#ffa43a', emissiveIntensity: 1.3 })} />
        </group>
      </group>
    );
  }

  return { 'upardang-gadhi': { Main: UpardangMain, Env: UpardangEnv } };
}
