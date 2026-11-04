// Balkumari Temple, Madhyapur Thimi. Three-roofed square Newar pagoda in a brick-paved town courtyard.
// Axes: front = +z. The stone peacock pillar stands in front-left (-x). Houses ring the square; alleys leave it.
// Scale: roof 1 is 4.8 wide (about 12 m), so 0.4 units per metre.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Diyo, Frame, THREE, useMemo, useEffect, useRef } = K;

  /* ---------- helpers ---------- */
  const rotY = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
  const YAWS = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
    pyr: new THREE.ConeGeometry(0.7071, 1, 4, 1).rotateY(Math.PI / 4),
    pennant: (() => {
      const s = new THREE.Shape();
      s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, -0.72); s.lineTo(0, -1); s.lineTo(-0.5, -0.72); s.lineTo(-0.5, 0);
      return new THREE.ShapeGeometry(s);
    })(),
    toran: (() => {
      const s = new THREE.Shape();
      s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0.5, 0.5);
      s.quadraticCurveTo(0.46, 0.68, 0.3, 0.7); s.quadraticCurveTo(0.26, 0.6, 0.2, 0.62);
      s.quadraticCurveTo(0.12, 0.78, 0, 1);
      s.quadraticCurveTo(-0.12, 0.78, -0.2, 0.62); s.quadraticCurveTo(-0.26, 0.6, -0.3, 0.7);
      s.quadraticCurveTo(-0.46, 0.68, -0.5, 0.5); s.lineTo(-0.5, 0);
      return new THREE.ShapeGeometry(s);
    })(),
    horn: (() => {
      const c = new THREE.CatmullRomCurve3([[0, 0, 0], [0, 0.07, 0.13], [0, 0.22, 0.22], [0, 0.36, 0.19], [0, 0.42, 0.09]].map((a) => new THREE.Vector3(...a)));
      return new THREE.TubeGeometry(c, 14, 0.038, 6);
    })(),
    hornTip: (() => {
      const c = new THREE.CatmullRomCurve3([[0, 0.36, 0.19], [0, 0.43, 0.15], [0, 0.46, 0.05]].map((a) => new THREE.Vector3(...a)));
      return new THREE.TubeGeometry(c, 8, 0.022, 5);
    })(),
  };

  /** One draw call for many copies of a geometry. items: {p:[x,y,z], s:[sx,sy,sz], rx, ry, rz, c} in the parent's frame. */
  function Inst({ items, mat, g = 'box', shadow = true }) {
    const ref = useRef();
    useEffect(() => {
      const m = ref.current;
      if (!m) return;
      const o = new THREE.Object3D();
      o.rotation.order = 'YXZ';
      const col = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it.p[0], it.p[1], it.p[2]);
        o.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
        o.scale.set(it.s[0], it.s[1], it.s[2]);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        if (it.c) { col.set(it.c); m.setColorAt(i, col); }
      });
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }, [items]);
    if (!items.length) return null;
    return <instancedMesh key={items.length} ref={ref} args={[G[g], mat, items.length]} castShadow={shadow} receiveShadow frustumCulled={false} />;
  }

  /* ---------- dimensions ---------- */
  const RW = [5.7, 4.5, 3.6];
  const RH = [0.7, 0.65, 0.6];
  const HALF = [1.5, 1.2, 0.98];
  const WH = [1.2, 0.95, 0.85];
  const PH = 0.22;
  const LIFT = 0.5;
  const SAG = 1.5;
  const E = [PH + WH[0]];
  const BASE = [PH];
  for (let k = 1; k < 3; k += 1) {
    BASE[k] = E[k - 1] + RH[k - 1] * (1 - HALF[k] / (RW[k - 1] / 2)) ** SAG;
    E[k] = BASE[k] + WH[k];
  }
  const APEX = E[2] + RH[2];
  const hipY = (k, a) => RH[k] * (1 - a) ** SAG + LIFT * RH[k] * a ** 4.8;

  /** Curved band following the upswept eave edge of roof k. */
  function bandGeo(k, top, hgt, off = 0.02) {
    const hw = RW[k] / 2;
    const h = RH[k];
    const N = 18;
    const pos = [];
    const idx = [];
    let vi = 0;
    YAWS.forEach((yaw) => {
      for (let i = 0; i <= N; i += 1) {
        const t = -1 + (2 * i) / N;
        const ye = LIFT * h * Math.abs(t) ** 2.4;
        const [x, z] = rotY(t * hw, hw + off, yaw);
        pos.push(x, ye + top, z, x, ye + top - hgt, z);
      }
      for (let i = 0; i < N; i += 1) { const a = vi + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      vi += (N + 1) * 2;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function Peafowl({ s = 1, gold }) {
    return (
      <group scale={s}>
        <Ball rad={0.06} sc={[1, 1, 1.35]} p={[0, 0.1, 0]} m={gold} />
        <Cyl rt={0.02} rb={0.03} h={0.1} p={[0, 0.17, 0.06]} r={[0.35, 0, 0]} m={gold} seg={6} />
        <Ball rad={0.038} p={[0, 0.235, 0.09]} m={gold} />
        <mesh position={[0, 0.08, -0.22]} rotation={[-1.95, 0, 0]} material={gold}><coneGeometry args={[0.1, 0.4, 10]} /></mesh>
        <Box s={[0.012, 0.07, 0.012]} p={[0, 0.29, 0.09]} m={gold} cast={false} />
      </group>
    );
  }

  /* ---------- one pagoda roof with gilded edge, hips, corner horns, peacocks and banners ---------- */
  function RoofSet({ k, tile, gilt, darkM, banners, panelM }) {
    const w = RW[k];
    const M0 = useM();
    const flag = M0.plain('#ffffff', { metalness: 0.65, roughness: 0.4, emissive: '#8a6a20', emissiveIntensity: 0.55, side: THREE.DoubleSide });
    const hw = w / 2;
    const gold = M0.gold;
    const gb = useMemo(() => bandGeo(k, 0.04, 0.22), [k]);
    const db = useMemo(() => bandGeo(k, -0.18, 0.1), [k]);
    const panels = useMemo(() => {
      const out = [];
      YAWS.forEach((yaw) => {
        for (let t = -hw + 0.3; t <= hw - 0.25; t += 0.5) {
          const ye = LIFT * RH[k] * Math.abs(t / hw) ** 2.4;
          const [x, z] = rotY(t, hw + 0.05, yaw);
          out.push({ p: [x, ye - 0.07, z], s: [0.32, 0.12, 0.03], ry: yaw });
        }
      });
      return out;
    }, [k, hw]);
    const hips = useMemo(() => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => {
      const pts = [];
      for (let i = 0; i <= 14; i += 1) { const a = i / 14; pts.push(new THREE.Vector3(sx * a * hw, hipY(k, a) + 0.025, sz * a * hw)); }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.032, 6);
    }), [k, hw]);
    const pen = useMemo(() => {
      if (!banners) return [];
      const cols = ['#7a5a22', '#c9a227', '#b9b9b0', '#c9a227', '#7a5a22', '#b9b9b0'];
      const wd = [0.08, 0.1, 0.09, 0.1, 0.08, 0.09];
      const ln = [1.25, 1.5, 1.35, 1.55, 1.3, 1.15];
      return cols.map((c, j) => ({ p: [(j - 2.5) * 0.14, 0, (j % 2) * 0.03], s: [wd[j], ln[j] * banners, 1], c }));
    }, [banners]);
    const corners = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    return (
      <group position={[0, E[k], 0]}>
        <Roof w={w} d={w} h={RH[k]} y={0} m={tile} sag={SAG} lift={LIFT} fascia={false} />
        <Box s={[w - 0.2, 0.05, w - 0.2]} p={[0, 0, 0]} m={darkM} cast={false} />
        <mesh geometry={gb} material={gilt} castShadow />
        <mesh geometry={db} material={darkM} />
        <Inst items={panels} mat={panelM} shadow={false} />
        {hips.map((g, i) => <mesh key={i} geometry={g} material={gilt} />)}
        {corners.map(([sx, sz], i) => {
          const yaw = Math.atan2(sx, sz);
          return (
            <group key={i} position={[sx * hw, LIFT * RH[k], sz * hw]} rotation={[0, yaw, 0]}>
              <mesh geometry={G.horn} material={gold} castShadow />
              <mesh geometry={G.hornTip} material={gold} />
              <group position={[0, 0.02, -0.3]}><Peafowl gold={gold} s={1.1} /></group>
              {banners ? (
                <group position={[0, 0.0, -0.2]}>
                  <Inst items={pen} mat={flag} g="pennant" shadow={false} />
                </group>
              ) : null}
            </group>
          );
        })}
      </group>
    );
  }

  /* ---------- the temple ---------- */
  function BalkumariMain() {
    const M = useM();
    const tile = M.mat('roof', 2, 2, { color: '#5a4436' });
    const panelM = M.plain('#8a6410', { metalness: 0.6, roughness: 0.4 });
    const darkM = M.plain('#2a1a10', { roughness: 0.8 });
    const gilt = M.plain('#e0b73c', { metalness: 0.55, roughness: 0.35, emissive: '#6b4a08', emissiveIntensity: 0.3, side: THREE.DoubleSide });
    const brick = M.plain('#34201a', { roughness: 0.9 });
    const pier = M.mat('brick', 1, 1, { color: '#b9806a' });
    const blue = M.plain('#2a5da8', { roughness: 0.5, metalness: 0.3 });
    const strutM = M.plain('#6a4326', { roughness: 0.85 });
    const slatM = M.plain('#6a4326', { roughness: 0.85 });
    const peaM = M.plain('#d9b860', { metalness: 0.55, roughness: 0.35, emissive: '#5a420a', emissiveIntensity: 0.25 });
    const voidM = M.plain('#110905', { roughness: 1 });
    const glowM = M.plain('#8a2d12', { roughness: 0.9, emissive: '#ff6a20', emissiveIntensity: 0.3 });
    const stone = M.plain('#6f6a63', { roughness: 0.95 });

    const parts = useMemo(() => {
      const gtor = []; const dark = []; const voids = []; const slats = []; const glow = []; const strut = []; const goldI = []; const fence = [];
      const add = (arr, yaw, lx, ly, lz, sx, sy, sz, extra = {}) => {
        const [x, z] = rotY(lx, lz, yaw);
        arr.push({ p: [x, ly, z], s: [sx, sy, sz], ry: yaw, ...extra });
      };
      YAWS.forEach((yaw, face) => {
        for (let k = 0; k < 3; k += 1) {
          const H = HALF[k];
          const y0 = k === 0 ? PH : BASE[k] - 0.05;
          const yc = (y0 + E[k]) / 2;
          const pw = 2 * H - 0.3;
          const ph = WH[k] - 0.18;
          add(dark, yaw, 0, yc, H + 0.012, pw, ph, 0.03);
          const nb = k === 0 ? 3 : 2;
          const bw = (pw - 0.12 - (nb - 1) * 0.16) / nb;
          for (let b = 0; b < nb; b += 1) {
            const bx = -pw / 2 + 0.06 + bw / 2 + b * (bw + 0.16);
            const door = k === 0 && face === 0 && b === 1;
            add(door ? glow : voids, yaw, bx, yc, H + 0.03, bw, ph - 0.16, 0.03);
            const fw = bw + 0.1; const fh = ph - 0.08;
            add(slats, yaw, bx - fw / 2, yc, H + 0.05, 0.05, fh, 0.03);
            add(slats, yaw, bx + fw / 2, yc, H + 0.05, 0.05, fh, 0.03);
            add(slats, yaw, bx, yc + fh / 2, H + 0.05, fw, 0.05, 0.03);
            add(slats, yaw, bx, yc - fh / 2, H + 0.05, fw, 0.05, 0.03);
            if (k === 0 && b === 1) add(gtor, yaw, bx, yc - (ph - 0.16) / 2 - 0.02, H + 0.02, bw + 0.34, ph + 0.02, 1);
            if (!door) {
              for (let s = 1; s <= 4; s += 1) add(slats, yaw, bx - bw / 2 + (bw * s) / 5, yc, H + 0.055, 0.028, ph - 0.18, 0.03);
            } else {
              add(slats, yaw, bx - bw / 4, yc, H + 0.055, 0.03, ph - 0.18, 0.03);
              add(slats, yaw, bx + bw / 4, yc, H + 0.055, 0.03, ph - 0.18, 0.03);
            }
          }
          // corner posts and eave beam
          add(dark, yaw, H, yc, H, 0.15, WH[k] + 0.04, 0.15);
          const R = RW[k] / 2;
          add(dark, yaw, 0, E[k] - 0.08, R - 0.3, 2 * (R - 0.3), 0.1, 0.1);
          const dz = R - 0.3 - H - 0.03;
          const dy = 0.45 + 0.25 * (k === 0 ? 1 : 0.7);
          const len = Math.hypot(dz, dy);
          const a = Math.atan2(dz, dy);
          const n = 4;
          for (let s = 0; s < n; s += 1) {
            const sx = -(H - 0.25) + ((2 * (H - 0.25)) * s) / (n - 1);
            add(strut, yaw, sx, E[k] - 0.08 - dy / 2, H + 0.03 + dz / 2, 0.14, len, 0.14, { rx: a });
          }
          const dz2 = dz * 0.55;
          const a2 = Math.atan2(dz2, dy);
          for (let s = 0; s < n - 1; s += 1) {
            const sx = -(H - 0.25) + ((2 * (H - 0.25)) * (s + 0.5)) / (n - 1);
            add(strut, yaw, sx, E[k] - 0.08 - dy / 2, H + 0.03 + dz2 / 2, 0.11, Math.hypot(dz2, dy), 0.11, { rx: a2 });
          }
          add(goldI, yaw, 0, E[k] - 0.14, H + 0.045, pw, 0.1, 0.05);
        }
        // blue iron grille round the ground floor
        const FH = 1.82;
        const nbars = 24;
        for (let b = 0; b <= nbars; b += 1) add(fence, yaw, -FH + (2 * FH * b) / nbars, PH + 0.4, FH, 0.035, 0.8, 0.035);
        add(fence, yaw, 0, PH + 0.12, FH, 2 * FH, 0.05, 0.05);
        add(fence, yaw, 0, PH + 0.8, FH, 2 * FH, 0.06, 0.06);
        add(fence, yaw, FH, PH + 0.42, FH, 0.09, 0.86, 0.09);
      });
      return { dark, voids, slats, glow, strut, goldI, fence, gtor };
    }, []);

    return (
      <group>
        {/* low single-step brick plinth */}
        <Box s={[6.0, PH, 6.0]} p={[0, PH / 2, 0]} m={M.mat('herring', 4, 4, { color: '#c9a08c', emissive: '#4a2a1e', emissiveIntensity: 0.2 })} />
        <Box s={[1.8, 0.11, 0.4]} p={[0, 0.055, 2.9]} m={M.stone} />
        {/* walls of the three storeys */}
        <Box s={[3.0, WH[0], 3.0]} p={[0, PH + WH[0] / 2, 0]} m={brick} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => <Box key={i} s={[0.2, WH[0], 0.2]} p={[x * 1.5, PH + WH[0] / 2, z * 1.5]} m={pier} />)}
        <Box s={[2.4, WH[1] + 0.1, 2.4]} p={[0, BASE[1] - 0.05 + (WH[1] + 0.1) / 2, 0]} m={brick} />
        <Box s={[1.96, WH[2] + 0.1, 1.96]} p={[0, BASE[2] - 0.05 + (WH[2] + 0.1) / 2, 0]} m={brick} />
        <Inst items={parts.dark} mat={darkM} />
        <Inst items={parts.voids} mat={voidM} shadow={false} />
        <Inst items={parts.slats} mat={slatM} shadow={false} />
        <Inst items={parts.glow} mat={glowM} shadow={false} />
        <Inst items={parts.strut} mat={strutM} />
        <Inst items={parts.goldI} mat={gilt} shadow={false} />
        <Inst items={parts.gtor} mat={gilt} g="toran" shadow={false} />
        <Inst items={parts.fence} mat={blue} shadow={false} />
        {[0, 1, 2].map((k) => <RoofSet key={k} k={k} tile={tile} gilt={gilt} darkM={darkM} banners={k === 0 ? 0 : 1} panelM={panelM} />)}
        <Gajur y={APEX - 0.04} s={1.25} />
        {/* diyas on the plinth */}
        {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => <Diyo key={i} p={[x, PH, 2.3]} light={i === 2} />)}
        {/* the stone peacock pillar */}
        <group position={[-3.4, 0, 5.0]}>
          <Box s={[0.9, 0.14, 0.9]} p={[0, 0.07, 0]} m={stone} />
          <Box s={[0.66, 0.22, 0.66]} p={[0, 0.25, 0]} m={stone} />
          <Box s={[0.45, 2.6, 0.45]} p={[0, 1.66, 0]} m={stone} />
          <Box s={[0.55, 0.08, 0.55]} p={[0, 1.2, 0]} m={stone} />
          <Box s={[0.55, 0.08, 0.55]} p={[0, 2.2, 0]} m={stone} />
          <Box s={[0.56, 0.1, 0.56]} p={[0, 2.92, 0]} m={stone} />
          <Box s={[0.68, 0.1, 0.68]} p={[0, 3.05, 0]} m={stone} />
          <Box s={[0.5, 0.12, 0.5]} p={[0, 3.16, 0]} m={stone} />
          <group position={[0, 3.2, 0]} rotation={[0, 0.5, 0]}><Peafowl gold={peaM} s={2.4} /></group>
        </group>
        <Frame s={[8.0, 6.6, 8.6]} p={[-0.8, 3.3, 1.3]} />
      </group>
    );
  }

  /* ---------- small shrines ---------- */
  function WhiteShrine({ p, s = 1, tall = 1 }) {
    const M = useM();
    const wh = M.plain('#f3efe6', { roughness: 0.85 });
    const silver = M.plain('#d9d9d2', { metalness: 0.5, roughness: 0.35 });
    return (
      <group position={p} scale={s}>
        <Box s={[1.0, 0.25, 1.0]} p={[0, 0.125, 0]} m={M.mat('brick', 1, 1, { color: '#c98a72' })} />
        <Cyl rt={0.34} rb={0.38} h={0.45} p={[0, 0.47, 0]} m={wh} seg={20} />
        <Ball rad={0.38} sc={[1, 0.8, 1]} p={[0, 0.7, 0]} m={wh} />
        <Box s={[0.2, 0.18, 0.2]} p={[0, 1.04, 0]} m={wh} />
        {[0, 1, 2, 3, 4].map((i) => <Cyl key={i} rt={0.13 - i * 0.02} rb={0.15 - i * 0.02} h={0.06 * tall} p={[0, 1.16 + i * 0.07 * tall, 0]} m={silver} seg={10} />)}
        <mesh position={[0, 1.62 * tall, 0]} material={silver}><coneGeometry args={[0.035, 0.22, 8]} /></mesh>
        <Box s={[0.3, 0.32, 0.03]} p={[0, 0.5, 0.38]} m={M.plain('#2a1a10')} cast={false} />
      </group>
    );
  }
  function RedShrine({ p, ry = 0 }) {
    const M = useM();
    const org = M.plain('#d96a30', { roughness: 0.8 });
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[0.9, 0.18, 0.8]} p={[0, 0.09, 0]} m={M.stone} />
        <Box s={[0.66, 0.55, 0.55]} p={[0, 0.45, 0]} m={org} />
        <Box s={[0.36, 0.36, 0.03]} p={[0, 0.46, 0.285]} m={M.plain('#3a1c0e')} cast={false} />
        <Roof w={0.95} d={0.85} h={0.3} y={0.72} m={M.gold} sag={1.3} lift={0.2} fascia={false} />
        <Cyl rt={0.02} rb={0.05} h={0.2} p={[0, 1.12, 0]} m={M.gold} seg={8} />
        {[-0.28, 0.28].map((x) => (
          <group key={x} position={[x, 0.18, 0.5]}>
            <Box s={[0.1, 0.07, 0.16]} p={[0, 0.04, 0]} m={M.gold} cast={false} />
            <Ball rad={0.045} p={[0, 0.11, 0.07]} m={M.gold} />
          </group>
        ))}
      </group>
    );
  }
  function BhairavShrine({ p, ry = 0 }) {
    const M = useM();
    const dk = M.plain('#2a1a10', { roughness: 0.9 });
    const bronze = M.plain('#8a5a2a', { metalness: 0.6, roughness: 0.4 });
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[1.5, 0.2, 1.3]} p={[0, 0.1, 0]} m={M.stone} />
        {[[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]].map(([x, z], i) => <Box key={i} s={[0.1, 1.1, 0.1]} p={[x, 0.75, z]} m={dk} />)}
        <Box s={[1.3, 0.9, 0.1]} p={[0, 0.65, -0.55]} m={dk} />
        <Ball rad={0.28} sc={[1, 1.1, 0.8]} p={[0, 0.6, -0.3]} m={bronze} />
        <Box s={[0.4, 0.1, 0.2]} p={[0, 0.95, -0.3]} m={M.gold} />
        <Ball rad={0.05} p={[-0.1, 0.65, -0.05]} m={M.plain('#f5f0e0')} />
        <Ball rad={0.05} p={[0.1, 0.65, -0.05]} m={M.plain('#f5f0e0')} />
        <Roof w={1.7} d={1.5} h={0.4} y={1.3} m={M.mat('roof', 1, 1, { color: '#5a4436' })} sag={1.4} lift={0.3} fascia={false} />
        <Cyl rt={0.02} rb={0.05} h={0.25} p={[0, 1.8, 0]} m={M.gold} seg={8} />
        <Box s={[0.5, 0.04, 0.3]} p={[0, 0.22, 0.2]} m={M.plain('#d96a30')} cast={false} />
      </group>
    );
  }
  function SmallPagoda({ p, ry = 0, w = 2.0 }) {
    const M = useM();
    const tile = M.mat('roof', 2, 2, { color: '#443228' });
    const gilt = M.plain('#e0b73c', { metalness: 0.55, roughness: 0.35, emissive: '#6b4a08', emissiveIntensity: 0.3 });
    const brick = M.mat('brick', 1.5, 1, { color: '#c98a72' });
    const dk = M.plain('#2a1a10');
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[w + 0.7, 0.2, w + 0.7]} p={[0, 0.1, 0]} m={M.mat('herring', 2, 2, { color: '#e3a58e' })} />
        <Box s={[1.3, 0.8, 1.3]} p={[0, 0.6, 0]} m={brick} />
        <Box s={[0.55, 0.62, 0.04]} p={[0, 0.58, 0.66]} m={dk} cast={false} />
        <Roof w={2.6} d={2.6} h={0.6} y={1.0} m={tile} sag={1.5} lift={0.4} fascia />
        <Box s={[1.0, 0.65, 1.0]} p={[0, 1.2 + 0.3, 0]} m={brick} />
        <Box s={[0.4, 0.4, 0.04]} p={[0, 1.5, 0.51]} m={dk} cast={false} />
        <Roof w={2.0} d={2.0} h={0.55} y={1.82} m={tile} sag={1.5} lift={0.4} fascia />
        <Gajur y={2.34} s={0.55} />
        <Box s={[1.9, 0.07, 0.07]} p={[0, 0.95, 0.9]} m={dk} cast={false} />
        {/* small gilt bell on a post */}
        <group position={[1.7, 0, 1.3]}><Cyl rt={0.04} h={0.9} p={[0, 0.45, 0]} m={dk} seg={6} /><Ball rad={0.1} sc={[1, 1.2, 1]} p={[0, 0.95, 0]} m={gilt} /></group>
      </group>
    );
  }
  function Pati({ p, ry = 0, len = 7, dep = 2.0 }) {
    const M = useM();
    const dk = M.plain('#2f2018');
    const tile = M.mat('roof', 3, 1, { color: '#7a5848' });
    const n = Math.round(len / 1.1);
    const posts = useMemo(() => Array.from({ length: n + 1 }, (_, i) => ({ p: [-len / 2 + 0.1 + ((len - 0.2) * i) / n, 0.9, dep / 2 - 0.15], s: [0.15, 1.2, 0.15] })), [n, len, dep]);
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <Box s={[len, 0.3, dep]} p={[0, 0.15, 0]} m={M.mat('brick', 4, 1, { color: '#e3a58e' })} />
        <Box s={[len, 1.3, 0.16]} p={[0, 0.95, -dep / 2 + 0.1]} m={M.mat('brick', 3, 1, { color: '#e8b098' })} />
        <Inst items={posts} mat={dk} />
        <Box s={[len + 0.1, 0.14, 0.2]} p={[0, 1.58, dep / 2 - 0.15]} m={dk} />
        <Box s={[len + 0.5, 0.07, dep * 0.62]} p={[0, 2.0, dep * 0.25]} r={[0.36, 0, 0]} m={tile} />
        <Box s={[len + 0.5, 0.07, dep * 0.62]} p={[0, 2.0, -dep * 0.25]} r={[-0.36, 0, 0]} m={tile} />
        <Box s={[0.1, 0.5, dep * 0.7]} p={[-len / 2 - 0.1, 1.75, 0]} m={M.plain('#e9d9c2')} />
        <Box s={[0.1, 0.5, dep * 0.7]} p={[len / 2 + 0.1, 1.75, 0]} m={M.plain('#e9d9c2')} />
      </group>
    );
  }

  /* ---------- the town ---------- */
  function BalkumariEnv() {
    const M = useM();
    const rowsData = useMemo(() => {
      const r = rng(7);
      const bodies = []; const wins = []; const frames = []; const roofsHip = []; const roofsFlat = []; const eaves = [];
      const balc = []; const rails = []; const lats = [];
      const palette = ['#e8a889', '#f0dcc4', '#ffffff', '#e8a889', '#f0dcc4', '#e0724f', '#ffd9b8', '#f4e8d8', '#d9694a'];
      const tanks = [];
      const hipPalette = ['#4a362c', '#3d2c24', '#52392e'];
      const rows = [
        { pos: -9.6, from: -13.6, to: 13.6, yaw: 0, skip: [[-5.2, -4.2], [3.4, 4.4]], st: [4, 4, 3] },
        { pos: 11.9, from: -13.6, to: 13.6, yaw: Math.PI, skip: [[-1.2, -0.2], [6.2, 7.2]], st: [1, 1, 1] },
        { pos: -12.6, from: -8.6, to: 10.9, yaw: Math.PI / 2, skip: [[1.2, 2.2]], st: [4, 3, 4] },
        { pos: 12.6, from: -8.6, to: 10.9, yaw: -Math.PI / 2, skip: [[-3.8, -2.8]], st: [3, 4, 3] },
      ];
      const world = (row, along, ly, off, list, s, extra = {}) => {
        const base = (row.yaw === 0 || row.yaw === Math.PI) ? [along, row.pos] : [row.pos, along];
        const [dx, dz] = rotY(0, off, row.yaw);
        list.push({ p: [base[0] + dx, ly, base[1] + dz], s, ry: row.yaw, ...extra });
      };
      rows.forEach((row) => {
        let cur = row.from;
        let i = 0;
        while (cur < row.to - 1.5) {
          const sk = row.skip.find(([a, b]) => cur + 1.5 > a && cur < b);
          if (sk) { cur = sk[1]; continue; }
          let w = 2.0 + r() * 1.3;
          const nextSk = row.skip.find(([a]) => a > cur && cur + w > a);
          if (nextSk) w = Math.max(1.6, nextSk[0] - cur - 0.05);
          if (cur + w > row.to) w = row.to - cur;
          const d = 1.9 + r() * 0.4;
          const st = Math.max(1, row.st[i % 3] + Math.floor(r() * 3) - 1);
          i += 1;
          const along = cur + w / 2;
          const h = st * 0.85;
          const col = palette[Math.floor(r() * palette.length)];
          const kind = r() < 0.6 ? 1 : 0; // 1 = timber balcony house
          world(row, along, h / 2, 0, bodies, [w, h, d], { c: col });
          if (r() < 0.65) {
            world(row, along, h + 0.24, 0, roofsHip, [w * 1.1, 0.48, d * 1.1], { c: hipPalette[Math.floor(r() * 3)] });
          } else {
            world(row, along, h + 0.08, 0, roofsFlat, [w + 0.06, 0.16, d + 0.06], { c: '#cdbba5' });
            if (r() < 0.6 && row.pos < 11) world(row, along + (r() - 0.5) * w * 0.4, h + 0.38, -d * 0.15, tanks, [0.4, 0.44, 0.4], { c: r() < 0.5 ? '#1e2a36' : '#3a4a5a' });
          }
          world(row, along, h - 0.05, d / 2 + 0.05, eaves, [w + 0.04, 0.05, 0.14]);
          const nw = Math.max(2, Math.round(w / 0.8));
          const sgn = (row.yaw === 0 || row.yaw === -Math.PI / 2) ? 1 : -1;
          for (let s = 0; s < st; s += 1) {
            const bal = kind === 1 && s >= 1;
            if (bal) {
              const bw = w * 0.62;
              world(row, along, s * 0.85 + 0.42, d / 2 + 0.17, balc, [bw, 0.55, 0.34]);
              world(row, along, s * 0.85 + 0.72, d / 2 + 0.34, rails, [bw + 0.04, 0.07, 0.05]);
              for (let q = 0; q < 3; q += 1) world(row, along + sgn * (-bw / 2 + (bw * (q + 0.5)) / 3), s * 0.85 + 0.42, d / 2 + 0.35, lats, [bw / 3 - 0.06, 0.4, 0.03]);
            }
            for (let q = 0; q < nw; q += 1) {
              const lx = -w / 2 + (w * (q + 0.5)) / nw;
              if (bal && Math.abs(lx) < w * 0.31) continue;
              if (r() < 0.22) continue;
              const a2 = along + sgn * lx;
              const ground = s === 0;
              world(row, a2, s * 0.85 + (ground ? 0.34 : 0.5), d / 2 + 0.02, frames, ground ? [0.5, 0.62, 0.05] : [0.42, 0.52, 0.05]);
              world(row, a2, s * 0.85 + (ground ? 0.34 : 0.5), d / 2 + 0.04, wins, ground ? [0.36, 0.5, 0.05] : [0.28, 0.4, 0.05]);
            }
          }
          cur += w + 0.04;
        }
      });
      return { bodies, wins, frames, roofsHip, roofsFlat, eaves, balc, rails, lats, tanks };
    }, []);

    const wires = useMemo(() => {
      const def = [[-12.4, 3.2, -6, 12.4, 3.0, -5.2], [-9, 3.4, -9.4, 9, 3.0, -9.6]];
      return def.map(([x1, y1, z1, x2, y2, z2]) => {
        const mid = new THREE.Vector3((x1 + x2) / 2, Math.min(y1, y2) - 0.55, (z1 + z2) / 2);
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x1, y1, z1), mid, new THREE.Vector3(x2, y2, z2)]), 16, 0.012, 4);
      });
    }, []);

    const ridge = useMemo(() => {
      const mk = (pts, depth) => {
        const sh = new THREE.Shape();
        sh.moveTo(pts[0][0], -4);
        pts.forEach(([x, y]) => sh.lineTo(x, y));
        sh.lineTo(pts[pts.length - 1][0], -4);
        sh.closePath();
        return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
      };
      const gen = (seed, base, amp, step) => {
        const q = rng(seed);
        const pts = [];
        for (let x = -320; x <= 320; x += step) {
          const t = x / 60;
          pts.push([x, base + amp * (0.5 * Math.sin(t * 0.9 + seed) + 0.3 * Math.sin(t * 2.3 + seed * 2) + 0.25 * Math.sin(t * 5.1)) + (q() - 0.5) * amp * 0.45]);
        }
        return pts;
      };
      return { far: mk(gen(3, 11, 6, 5), 2), near: mk(gen(9, 6, 3.4, 4), 2) };
    }, []);

    const back = useMemo(() => {
      const r = rng(31);
      const bodies = []; const roofs = [];
      const palette = ['#e0724f', '#f0dcc4', '#d4623f', '#ffffff', '#e8a889', '#c85a3c'];
      for (let i = 0; i < 150 && bodies.length < 80; i += 1) {
        const a = r() * Math.PI * 2;
        const rad = 15.5 + r() * 14;
        const x = Math.cos(a) * rad * 1.15;
        const z = Math.sin(a) * rad * 0.95 + 1;
        if (Math.abs(x) < 15 && z > -12.5 && z < 14) continue;
        const w = 2.2 + r() * 1.3; const d = 2.2 + r() * 1.3; const h = (2.5 + r() * 1.3) * (z > 8 ? 0.8 : 1);
        bodies.push({ p: [x, h / 2, z], s: [w, h, d], ry: r() * 3, c: palette[Math.floor(r() * palette.length)] });
        roofs.push({ p: [x, h + 0.22, z], s: [w * 1.1, 0.46, d * 1.1], ry: 0, c: ['#4a362c', '#3d2c24'][Math.floor(r() * 2)] });
      }
      return { bodies, roofs };
    }, []);

    const brickWall = M.mat('plaster', 3, 3.4, { color: '#ffffff', emissive: '#5a4a3e', emissiveIntensity: 0.4 });
    const roofTile = M.mat('roof', 2, 2, { color: '#ffffff' });
    const timber = M.plain('#6a4326', { roughness: 0.9 });
    const wireM = M.plain('#1a1512', { roughness: 1 });
    const flatM = M.plain('#ffffff', { roughness: 0.9 });
    const winFrame = M.plain('#5a3820', { roughness: 0.9 });
    const winGlass = M.plain('#33241a', { roughness: 0.6, emissive: '#ffb04a', emissiveIntensity: 0.1 });
    const dk = M.plain('#2f2018');

    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={M.plain('#a39172', { roughness: 1 })}><circleGeometry args={[62, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} material={M.plain('#b3a98d', { roughness: 1 })}><circleGeometry args={[300, 48]} /></mesh>
        {/* brick-paved courtyard running into the alleys */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 1.15]} receiveShadow material={M.mat('herring', 12, 10, { color: '#b98a72', emissive: '#4a2a1e', emissiveIntensity: 0.2 })}><planeGeometry args={[27.6, 22]} /></mesh>
        {[[0, 6.0, 7.8, 0.5], [0, 9.0, 24, 0.35], [-8.5, 0, 0.45, 20], [0, -6.2, 20, 0.4]].map(([x, z, w, d], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014, z]} receiveShadow material={M.plain('#7d5a4a', { roughness: 0.95 })}><planeGeometry args={[w, d]} /></mesh>
        ))}
        {[[0, 3.2, 6.9, 0.35], [0, -3.2, 6.9, 0.35], [3.2, 0, 0.35, 6.9], [-3.2, 0, 0.35, 6.9]].map(([x, z, w, d], i) => (
          <mesh key={'b' + i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.016, z]} receiveShadow material={M.plain('#6f6a63', { roughness: 0.95 })}><planeGeometry args={[w, d]} /></mesh>
        ))}
        {/* ring of houses */}
        <Inst items={rowsData.bodies} mat={brickWall} />
        <Inst items={rowsData.roofsHip} mat={roofTile} g="pyr" />
        <Inst items={rowsData.roofsFlat} mat={flatM} />
        <Inst items={rowsData.tanks} mat={M.plain('#ffffff', { roughness: 0.6 })} g="cyl" />
        <Inst items={rowsData.eaves} mat={dk} shadow={false} />
        <Inst items={rowsData.frames} mat={winFrame} shadow={false} />
        <Inst items={rowsData.wins} mat={winGlass} shadow={false} />
        <Inst items={rowsData.balc} mat={timber} />
        <Inst items={rowsData.rails} mat={dk} shadow={false} />
        <Inst items={rowsData.lats} mat={winGlass} shadow={false} />
        {wires.map((g, i) => <mesh key={i} geometry={g} material={wireM} />)}
        {/* town behind */}
        <Inst items={back.bodies} mat={brickWall} />
        <Inst items={back.roofs} mat={roofTile} g="pyr" />
        {/* rest houses along the courtyard edge */}
        <Pati p={[10.2, 0, -0.2]} ry={-Math.PI / 2} len={7} />
        <Pati p={[-5.8, 0, -7.2]} ry={0} len={7.5} />
        {/* the other shrines of the square */}
        <WhiteShrine p={[-7.8, 0, -0.6]} s={1.15} />
        <WhiteShrine p={[-6.0, 0, -3.4]} s={0.9} tall={1.2} />
        <RedShrine p={[-4.3, 0, 3.0]} ry={0.35} />
        <BhairavShrine p={[6.6, 0, 3.8]} ry={-0.3} />
        <SmallPagoda p={[7.6, 0, -5.3]} ry={-Math.PI / 2} w={2.0} />
        {/* Shivapuri ridge, dark forested silhouette */}
        <mesh geometry={ridge.far} position={[0, -1, -88]} material={M.plain('#a9b5b1', { roughness: 1 })} />
        <mesh geometry={ridge.near} position={[0, -1, -76]} material={M.plain('#74867a', { roughness: 1 })} />
      </group>
    );
  }

  return { 'balkumari-temple-thimi': { Main: BalkumariMain, Env: BalkumariEnv } };
}
