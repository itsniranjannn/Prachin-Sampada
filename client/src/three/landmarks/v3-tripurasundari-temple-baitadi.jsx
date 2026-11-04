/* Tripurasundari (Ransaini Bhagwati) Temple, Devikot hill, Baitadi. 1 unit = 1 m, front = +z.
   Modern renovation: vermilion-red body, copper-orange roofs, white trim. Wide gabled porch roof (ridge front-to-back) over an
   open arcade of red pillars + 3 white cusped arches, two smaller hipped roofs stacked behind, recessed band, gold finial.
   Open grass hilltop courtyard, paved path, triple-roof red gate at the lip, flag poles, two bell shrines, bell tree,
   white triple arch with swing posts, boundary wall, palms, drop to terraced valley, hazy ridges and snow peaks. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Diyo, THREE, useMemo, useRef, useEffect, useState } = K;
  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  const RED = '#b8402e', DRED = '#8b2a22', FASCIA = '#a05a2a', ORANGE = '#c8602f', WHITE = '#f0ece4', WOOD = '#7a3a20';
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };

  /* ---------- instancing ---------- */
  const _o = new THREE.Object3D();
  const BOXG = new THREE.BoxGeometry(1, 1, 1);
  const CONEG = new THREE.ConeGeometry(0.5, 1, 8);
  /* items: [x,y,z, sx,sy,sz, color, rotY, rotZ] */
  function Inst({ items, geo = BOXG, cast = true, rough = 0.8, metal = 0 }) {
    const mesh = useMemo(() => {
      const mat = new THREE.MeshStandardMaterial({ roughness: rough, metalness: metal });
      const im = new THREE.InstancedMesh(geo, mat, items.length);
      const c = new THREE.Color();
      items.forEach((it, i) => {
        _o.position.set(it[0], it[1], it[2]);
        _o.rotation.set(0, it[7] || 0, it[8] || 0);
        _o.scale.set(it[3], it[4], it[5]);
        _o.updateMatrix();
        im.setMatrixAt(i, _o.matrix);
        im.setColorAt(i, c.set(it[6]));
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [items, geo, cast, rough, metal]);
    return <primitive object={mesh} />;
  }

  /* ---------- hip roof with ridge along x ---------- */
  function hipGeo(w, d, h, rl) {
    const A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], D = [-w / 2, 0, d / 2];
    const R1 = [-rl / 2, h, 0], R2 = [rl / 2, h, 0];
    const tris = [D, C, R2, D, R2, R1, B, A, R1, B, R1, R2, C, B, R2, A, D, R1];
    const pos = [], uv = [];
    tris.forEach((v) => { pos.push(...v); uv.push(v[0] * 0.45, (v[2] + v[1] * 1.6) * 0.45); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function useRoofMat(M) {
    return useMemo(() => {
      const m = M.mat('roof', 1, 1, { color: '#f6a070' }).clone();
      m.side = THREE.DoubleSide;
      return m;
    }, [M]);
  }
  /* hipped copper roof, eave at height y */
  function HipRoof({ w, d, h, y, rl, p = [0, 0, 0], tail = true }) {
    const M = useM();
    const rm = useRoofMat(M);
    const geo = useMemo(() => hipGeo(w, d, h, rl), [w, d, h, rl]);
    const wood = M.plain(FASCIA, { roughness: 0.7 });
    const red = M.plain(RED, { roughness: 0.7 });
    const dent = useMemo(() => {
      const it = [];
      const nx = Math.round(w / 0.4), nz = Math.round(d / 0.4);
      for (let i = 0; i < nx; i += 1) { const x = -w / 2 + (i + 0.5) * w / nx; it.push([x, -0.3, d / 2 + 0.06, 0.2, 0.18, 0.12, '#7a3a1c']); it.push([x, -0.3, -d / 2 - 0.06, 0.2, 0.18, 0.12, '#7a3a1c']); }
      for (let i = 0; i < nz; i += 1) { const z = -d / 2 + (i + 0.5) * d / nz; it.push([w / 2 + 0.06, -0.3, z, 0.12, 0.18, 0.2, '#7a3a1c']); it.push([-w / 2 - 0.06, -0.3, z, 0.12, 0.18, 0.2, '#7a3a1c']); }
      return it;
    }, [w, d]);
    return (
      <group position={[p[0], y, p[2]]}>
        <mesh geometry={geo} material={rm} castShadow receiveShadow />
        <Box s={[w + 0.14, 0.3, 0.16]} p={[0, -0.1, d / 2 + 0.02]} m={wood} cast={false} />
        <Box s={[w + 0.14, 0.3, 0.16]} p={[0, -0.1, -d / 2 - 0.02]} m={wood} cast={false} />
        <Box s={[0.16, 0.3, d + 0.14]} p={[w / 2 + 0.02, -0.1, 0]} m={wood} cast={false} />
        <Box s={[0.16, 0.3, d + 0.14]} p={[-w / 2 - 0.02, -0.1, 0]} m={wood} cast={false} />
        <Inst items={dent} cast={false} />
        <Box s={[w - 0.1, 0.1, 0.1]} p={[0, -0.24, d / 2 - 0.05]} m={red} cast={false} />
        <Box s={[rl + 0.15, 0.1, 0.16]} p={[0, h + 0.03, 0]} m={M.copper} cast={false} />
      </group>
    );
  }

  /* cusped arch outline (white ring) */
  function archGeo(w, h, spring, t, depth) {
    const path = (sh, ww, hh, sp, y0) => {
      sh.moveTo(-ww / 2, y0);
      sh.lineTo(-ww / 2, sp);
      sh.bezierCurveTo(-ww / 2, sp + (hh - sp) * 0.6, -ww * 0.06, hh - (hh - sp) * 0.2, 0, hh);
      sh.bezierCurveTo(ww * 0.06, hh - (hh - sp) * 0.2, ww / 2, sp + (hh - sp) * 0.6, ww / 2, sp);
      sh.lineTo(ww / 2, y0);
      sh.lineTo(-ww / 2, y0);
    };
    const outer = new THREE.Shape();
    path(outer, w, h, spring, -0.06);
    const hole = new THREE.Path();
    path(hole, w - 2 * t, h - t * 1.3, spring, 0);
    outer.holes.push(hole);
    return new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: false });
  }
  function archFillGeo(w, h, spring, depth) {
    const sh = new THREE.Shape();
    sh.moveTo(-w / 2, 0);
    sh.lineTo(-w / 2, spring);
    sh.bezierCurveTo(-w / 2, spring + (h - spring) * 0.6, -w * 0.06, h - (h - spring) * 0.2, 0, h);
    sh.bezierCurveTo(w * 0.06, h - (h - spring) * 0.2, w / 2, spring + (h - spring) * 0.6, w / 2, spring);
    sh.lineTo(w / 2, 0);
    return new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  }
  function Arch({ p, w, h, spring, t = 0.2, ring, fill, depth = 0.22 }) {
    const g1 = useMemo(() => archGeo(w, h, spring, t, depth), [w, h, spring, t, depth]);
    const g2 = useMemo(() => (fill ? archFillGeo(w, h, spring, 0.05) : null), [w, h, spring, fill]);
    return (
      <group position={p}>
        <mesh geometry={g1} material={ring} castShadow />
        {g2 && <mesh geometry={g2} material={fill} position={[0, 0, 0.02]} />}
      </group>
    );
  }

  let _gt = null;
  function gridTex() {
    if (_gt) return _gt;
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#a8301f'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#6e1d14'; g.fillRect(0, 0, 64, 4); g.fillRect(0, 0, 4, 64);
    g.fillStyle = '#b83a28'; g.fillRect(8, 8, 52, 52);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 2); t.colorSpace = THREE.SRGBColorSpace;
    _gt = t; return t;
  }

  /* ---------- the temple ---------- */
  function TempleBody({ dusk }) {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.65 });
    const dred = M.plain(DRED, { roughness: 0.7 });
    const white = M.plain(WHITE, { roughness: 0.7 });
    const wood = M.plain(WOOD, { roughness: 0.7 });
    const dark = M.plain('#6a1f18', { roughness: 0.9 });
    const fascia = M.plain(FASCIA, { roughness: 0.7 });
    const maroon = M.plain('#4a1c16', { roughness: 0.9 });
    const slab = M.plain('#9b978f', { roughness: 0.95 });
    const slabTop = M.plain('#aaa69d', { roughness: 0.95 });
    const tile = useMemo(() => new THREE.MeshStandardMaterial({ map: gridTex(), roughness: 0.75 }), []);
    const rm = useRoofMat(M);
    const PB = 0.6;          // plinth top
    const EY = 3.1;           // porch eave height
    const hw = 6.1, rise = 1.9, zc = -0.6, zl = 8.4;
    const ang = Math.atan2(rise, hw), sl = Math.hypot(hw, rise);

    /* front tympanum: small coloured tiles in the gable triangle */
    /* 3 bands: red base, diamond strip, red top */
    const triHalf = (y) => (hw - 0.5) * (1 - (y - EY) / (rise - 0.1));
    const bandGeo = (y0, y1) => {
      const sh = new THREE.Shape();
      sh.moveTo(-triHalf(y0), y0 - EY); sh.lineTo(triHalf(y0), y0 - EY); sh.lineTo(triHalf(y1), y1 - EY); sh.lineTo(-triHalf(y1), y1 - EY);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false });
    };
    const bandLo = useMemo(() => bandGeo(EY + 0.02, EY + 0.5), []);
    const bandTop = useMemo(() => bandGeo(EY + 1.02, EY + rise - 0.12), []);
    const tym = useMemo(() => {
      const it = [];
      const cols = ['#e8c13a', '#2f6fb5', '#2f9a5a'];
      const yc = EY + 0.76;
      const half = triHalf(yc + 0.2) - 0.12;
      const n = Math.floor(half * 2 / 0.32);
      for (let i = 0; i < n; i += 1) {
        const x = -half + (i + 0.5) * (half * 2 / n);
        it.push([x, yc, 2.82, 0.26, 0.26, 0.05, cols[i % 3], 0, Math.PI / 4]);
      }
      for (let i = 0; i < 9; i += 1) it.push([-3.2 + i * 0.8, EY + 0.26, 2.82, 0.2, 0.2, 0.05, i % 2 ? '#e8c13a' : '#2f9a5a']);
      return it;
    }, []);
    const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb25a', toneMapped: false }), []);
    const archFill = M.plain('#3a1510', { roughness: 0.9 });
    const tail = useMemo(() => {
      const it = [];
      for (let z = -4.5; z < 3.4; z += 0.45) {
        [-1, 1].forEach((s) => it.push([s * (hw + 0.1), EY - 0.36, z, 0.2, 0.2, 0.26, z % 0.9 < 0.45 ? '#7a3a1c' : '#b8662e']));
      }
      /* dentil blocks under the gable rakes, front and rear */
      [3.74, -4.94].forEach((z) => { for (let k = 0; k < 15; k += 1) { const t = (k + 0.5) / 15; [-1, 1].forEach((s) => it.push([s * (hw * (1 - t)), EY + rise * t - 0.32, z, 0.16, 0.2, 0.2, k % 2 ? '#7a3a1c' : '#b8662e', 0, 0])); } });
      return it;
    }, []);
    const triGeo = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(-hw + 0.5, 0); sh.lineTo(hw - 0.5, 0); sh.lineTo(0, rise - 0.1); sh.lineTo(-hw + 0.5, 0);
      return new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false });
    }, []);
    const pil = [-5.0, -4.2, -1.4, 1.4, 4.2, 5.0];
    return (
      <group>
        {/* stone plinth + front steps */}
        <Box s={[11.8, PB, 9.2]} p={[0, PB / 2, -0.7]} m={slab} />
        <Box s={[11.6, 0.04, 9.0]} p={[0, PB + 0.005, -0.7]} m={slabTop} cast={false} />
        <Box s={[4.4, 0.2, 0.7]} p={[0, 0.1, 4.2]} m={slab} />
        <Box s={[3.6, 0.4, 0.5]} p={[0, 0.2, 3.95]} m={slab} />
        {/* rear red stepped plinth */}
        <Box s={[11.0, 0.22, 0.8]} p={[0, 0.11, -5.7]} m={dred} />
        <Box s={[9.6, 0.42, 0.55]} p={[0, 0.21, -5.45]} m={dred} />
        <Box s={[7.6, 0.6, 0.3]} p={[0, 0.3, -5.3]} m={dred} />
        {/* lower red body */}
        <Box s={[8.8, EY - PB, 5.4]} p={[0, (EY + PB) / 2, -3.4]} m={tile} />
        <Box s={[8.8, EY - PB, 0.2]} p={[0, (EY + PB) / 2, 0.9]} m={maroon} />
        {/* upper cella */}
        <Box s={[7.2, 2.1, 4.2]} p={[0, EY + 1.0, -1.7]} m={red} />
        <Box s={[7.3, 0.12, 4.3]} p={[0, EY + 2.0, -1.7]} m={wood} cast={false} />
        {/* gable roof: ridge runs front to back */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * hw / 2, EY + rise / 2 + 0.04, zc]} rotation={[0, 0, -s * ang]} material={rm} castShadow receiveShadow>
              <boxGeometry args={[sl + 0.35, 0.2, zl]} />
            </mesh>
            <Box s={[0.28, 0.34, zl]} p={[s * (hw + 0.1), EY - 0.1, zc]} m={fascia} cast={false} />
            <Box s={[0.1, 0.1, zl]} p={[s * (hw + 0.02), EY - 0.3, zc]} m={red} cast={false} />
            {/* carved rake boards, white edged, front and rear */}
            {[3.7, -4.9].map((z, k) => (
              <group key={k}>
                <Box s={[sl + 0.4, 0.36, 0.16]} p={[s * hw / 2, EY + rise / 2 - 0.05, z]} r={[0, 0, -s * ang]} m={fascia} cast={false} />
                <Box s={[sl + 0.4, 0.09, 0.2]} p={[s * hw / 2, EY + rise / 2 - 0.26, z]} r={[0, 0, -s * ang]} m={white} cast={false} />
              </group>
            ))}
          </group>
        ))}
        <Box s={[0.34, 0.2, zl + 0.2]} p={[0, EY + rise + 0.14, zc]} m={M.copper} cast={false} />
        <Inst items={tail} />
        {/* front tympanum */}
        <mesh geometry={triGeo} position={[0, EY, 2.7]} material={dred} castShadow />
        <mesh geometry={bandLo} position={[0, EY, 2.72]} material={red} />
        <mesh geometry={bandTop} position={[0, EY, 2.72]} material={red} />
        {[EY + 0.52, EY + 1.0].map((y, k) => <Box key={k} s={[2 * triHalf(y), 0.07, 0.1]} p={[0, y, 2.86]} m={white} cast={false} />)}
        <Inst items={tym} cast={false} />
        <Box s={[0.55, 0.55, 0.1]} p={[0, EY + 1.5, 2.84]} m={white} r={[0, 0, Math.PI / 4]} cast={false} />
        <Box s={[0.32, 0.32, 0.12]} p={[0, EY + 1.5, 2.86]} m={M.plain('#e8c13a')} r={[0, 0, Math.PI / 4]} cast={false} />
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Box s={[sl - 1.2, 0.12, 0.1]} p={[sd * (hw - 0.5) / 2 - sd * 0.05, EY + (rise - 0.1) / 2 + 0.02, 2.88]} r={[0, 0, -sd * Math.atan2(rise - 0.1, hw - 0.5)]} m={white} cast={false} />
            <Box s={[sl - 1.2, 0.07, 0.1]} p={[sd * (hw - 0.5) / 2 - sd * 0.05, EY + (rise - 0.1) / 2 - 0.12, 2.9]} r={[0, 0, -sd * Math.atan2(rise - 0.1, hw - 0.5)]} m={M.plain('#e8892a')} cast={false} />
          </group>
        ))}
        <mesh geometry={triGeo} position={[0, EY, -4.45]} material={dred} />
        <Box s={[0.9, 0.2, 0.14]} p={[0, EY + 0.55, -4.55]} m={white} cast={false} />
        {/* beam over the arcade */}
        <Box s={[10.6, 0.2, 0.3]} p={[0, EY - 0.02, 2.5]} m={wood} cast={false} />
        {/* pillars */}
        {pil.map((x, i) => (
          <group key={i} position={[x, 0, 2.5]}>
            <Cyl rt={0.2} rb={0.22} h={2.3} p={[0, PB + 1.15, 0]} m={red} seg={14} />
            <Cyl rt={0.27} rb={0.27} h={0.14} p={[0, PB + 0.25, 0]} m={white} seg={14} />
            <Cyl rt={0.27} rb={0.27} h={0.14} p={[0, PB + 2.0, 0]} m={white} seg={14} />
            <Box s={[0.5, 0.22, 0.5]} p={[0, PB + 2.38, 0]} m={wood} />
          </group>
        ))}
        {/* arches, dark shrine openings and lamps */}
        {[-2.8, 0, 2.8].map((x, i) => (
          <group key={i}>
            <Arch p={[x, 0.95, 2.46]} w={2.7} h={2.05} spring={0.8} t={0.34} ring={white} depth={0.26} />
            <Arch p={[x, 0.95, 2.3]} w={2.1} h={1.75} spring={0.7} t={0.1} ring={wood} fill={archFill} depth={0.08} />
            <Box s={[2.1, 2.4, 0.1]} p={[x, 1.8, 1.05]} m={dark} cast={false} />
            {dusk && <Arch p={[x, 0.95, 2.4]} w={1.7} h={1.5} spring={0.6} t={0.1} ring={glow} fill={glow} depth={0.03} />}
          </group>
        ))}
        {/* ceiling of the porch */}
        <Box s={[10.4, 0.1, 1.7]} p={[0, 3.0, 1.7]} m={maroon} cast={false} />
        {/* rear: small door, two pillars with white/green bands */}
        <Box s={[1.0, 1.7, 0.12]} p={[0, PB + 0.85, -6.18 + 1.7]} m={dark} cast={false} />
        <Box s={[1.2, 0.12, 0.14]} p={[0, PB + 1.76, -4.7]} m={white} cast={false} />
        {[-0.85, 0.85].map((x) => (
          <group key={x} position={[x, 0, -4.78]}>
            <Cyl rt={0.18} rb={0.2} h={2.2} p={[0, PB + 1.1, 0]} m={red} seg={12} />
            {[0.4, 0.9, 1.4, 1.95].map((y, j) => <Cyl key={j} rt={0.24} rb={0.24} h={0.1} p={[0, PB + y, 0]} m={j % 2 ? M.plain('#2f8a4a') : white} seg={12} />)}
          </group>
        ))}
        {/* recessed upper stages */}
        <HipRoof w={9.2} d={7.4} h={0.9} y={5.1} rl={4.2} p={[0, 0, -1.7]} />
        <Box s={[4.6, 1.3, 3.6]} p={[0, 5.9, -1.7]} m={dred} />
        <Box s={[4.75, 0.16, 3.75]} p={[0, 6.45, -1.7]} m={wood} cast={false} />
        <Box s={[4.7, 0.08, 3.7]} p={[0, 6.3, -1.7]} m={white} cast={false} />
        {[-1.9, -1.3, -0.65, 0, 0.65, 1.3, 1.9].map((x, i) => <Box key={i} s={[0.22, 0.45, 0.06]} p={[x, 5.8, 0.14]} m={i % 2 ? wood : white} cast={false} />)}
        <HipRoof w={6.0} d={4.8} h={0.8} y={6.55} rl={2.0} p={[0, 0, -1.7]} />
        {/* gold finial */}
        {dusk && <Ball rad={0.42} p={[0, 7.75, -1.7]} m={glow} />}
        <group position={[0, 7.35, -1.7]} scale={1.1}>
          <Cyl rt={0.12} rb={0.22} h={0.16} p={[0, 0.08, 0]} m={M.gold} seg={12} />
          <Ball rad={0.18} p={[0, 0.3, 0]} m={M.gold} />
          <Cyl rt={0.05} rb={0.14} h={0.22} p={[0, 0.5, 0]} m={M.gold} seg={12} />
          <mesh position={[0, 0.85, 0]} material={M.gold} castShadow><coneGeometry args={[0.07, 0.5, 10]} /></mesh>
        </group>
      </group>
    );
  }

  /* little red bell shrine with tiered copper cap and hanging bell */
  function BellShrine({ p, r = 0, dusk }) {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.7 });
    const wood = M.plain(FASCIA);
    const white = M.plain(WHITE);
    const dark = M.plain('#1d0d0a');
    const bronze = M.plain('#a67c2c', { roughness: 0.35, metalness: 0.6 });
    const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb25a', toneMapped: false }), []);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[2.1, 0.35, 2.1]} p={[0, 0.17, 0]} m={M.stone} />
        <Box s={[0.4, 2.2, 0.4]} p={[-0.7, 1.45, 0.55]} m={red} />
        <Box s={[0.4, 2.2, 0.4]} p={[0.7, 1.45, 0.55]} m={red} />
        <Box s={[1.7, 2.2, 0.35]} p={[0, 1.45, -0.65]} m={red} />
        <Box s={[0.35, 2.2, 1.2]} p={[-0.78, 1.45, -0.1]} m={red} />
        <Box s={[0.35, 2.2, 1.2]} p={[0.78, 1.45, -0.1]} m={red} />
        <Box s={[1.9, 0.3, 1.7]} p={[0, 2.65, 0]} m={wood} />
        <Box s={[1.1, 1.5, 0.1]} p={[0, 1.2, -0.46]} m={dark} cast={false} />
        <Box s={[1.5, 0.12, 0.12]} p={[0, 2.4, 0.76]} m={white} cast={false} />
        <HipRoof w={2.5} d={2.3} h={0.7} y={2.8} rl={1.0} />
        <Box s={[1.5, 0.5, 1.3]} p={[0, 3.75, 0]} m={red} />
        <HipRoof w={1.9} d={1.7} h={0.6} y={3.95} rl={0.5} />
        <mesh position={[0, 4.95, 0]} material={M.gold} castShadow><coneGeometry args={[0.07, 0.5, 8]} /></mesh>
        <Ball rad={0.1} p={[0, 4.62, 0]} m={M.gold} />
        <Cyl rt={0.02} rb={0.02} h={0.5} p={[0, 2.35, 0.1]} m={M.dark} seg={5} />
        <mesh position={[0, 1.95, 0.1]} material={bronze} castShadow><cylinderGeometry args={[0.1, 0.36, 0.55, 14]} /></mesh>
        <Ball rad={0.07} p={[0, 1.66, 0.1]} m={bronze} />
        {dusk && <Ball rad={0.34} p={[0, 1.2, -0.3]} m={glow} />}
        <Diyo p={[0.5, 0.35, 0.95]} light />
      </group>
    );
  }

  function FlagPole({ p, h, tilt = 0, tiltZ = 0, seed = 0 }) {
    const M = useM();
    const flags = useMemo(() => {
      const cols = ['#c9473a', '#e9e2d2', '#d9b043', '#7fa8c8', '#c9473a', '#e07a2a'];
      const out = [];
      let y = h - 0.7;
      for (let i = 0; i < 6 && y > 3; i += 1) {
        out.push([0.34, y, 0, 0.6, 0.9, 0.03, cols[Math.floor(rnd(seed + i) * cols.length)], 0.5 * (rnd(seed * 3 + i) - 0.5), 0.2 * (rnd(seed + i * 9) - 0.5)]);
        y -= 1.1 + rnd(seed * 5 + i) * 0.8;
      }
      return out;
    }, [h, seed]);
    return (
      <group position={p} rotation={[tiltZ, 0, tilt]}>
        <Cyl rt={0.045} rb={0.08} h={h} p={[0, h / 2, 0]} m={M.plain('#c9b48a')} seg={6} />
        <Ball rad={0.09} p={[0, h + 0.05, 0]} m={M.plain('#c9473a')} />
        <Inst items={flags} cast={false} />
      </group>
    );
  }
  function FlagCluster({ p, n = 5, seed = 1, spread = 1.3 }) {
    const M = useM();
    const poles = useMemo(() => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + seed, rr = i === 0 ? 0 : spread * (0.6 + 0.5 * rnd(seed * 9 + i));
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, h: 8 + 3 * rnd(seed * 4 + i), t: -0.05 - 0.05 * rnd(seed + i) };
    }), [n, seed, spread]);
    return (
      <group position={p}>
        {poles.map((q, i) => <FlagPole key={i} p={[q.x, 0, q.z]} h={q.h} tilt={q.t} tiltZ={0.04 * (i % 2 ? 1 : -1)} seed={seed * 7 + i * 3} />)}
        <Cyl rt={spread * 1.3} rb={spread * 1.4} h={0.18} p={[0, 0.09, 0]} m={M.plain('#9b978f', { roughness: 1 })} seg={14} />
      </group>
    );
  }

  /* low white-and-red painted boundary wall */
  function WallRun({ a, b }) {
    const M = useM();
    const red = M.plain('#b0402c', { roughness: 0.8 });
    const white = M.plain(WHITE);
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ry = Math.atan2(dx, dz);
    return (
      <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, ry, 0]}>
        <Box s={[0.4, 0.7, len + 0.05]} p={[0, 0.35, 0]} m={red} />
        <Box s={[0.46, 0.22, len + 0.05]} p={[0, 0.81, 0]} m={white} cast={false} />
      </group>
    );
  }

  function Main() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const pathM = M.plain('#b9b4a8', { roughness: 0.95 });
    return (
      <group ref={ref}>
        <TempleBody dusk={dusk} />
        {/* paved path from the porch, curving to the gate on the western lip */}
        <Box s={[1.5, 0.05, 6.4]} p={[0, 0.03, 7.4]} m={pathM} cast={false} />
        <Box s={[1.5, 0.05, 7.6]} p={[-3.5, 0.04, 9.0]} r={[0, -1.166, 0]} m={pathM} cast={false} />
        <group position={[-7.6, 0, 5.4]} rotation={[0, 0.5, 0]}><BellShrine dusk={dusk} p={[0, 0, 0]} /></group>
        <group position={[7.6, 0, 5.4]} rotation={[0, -0.5, 0]}><BellShrine dusk={dusk} p={[0, 0, 0]} /></group>
        <FlagCluster p={[-12.8, 0, 5]} n={5} seed={2} />
        <FlagCluster p={[-13, 0, -3.5]} n={4} seed={5} spread={1.1} />
        <Frame s={[16, 9.5, 14]} p={[0, 4.7, 2]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  const plateauR = (a) => 22 + 2.2 * Math.sin(3 * a + 0.6) + 1.4 * Math.sin(5 * a + 2) - 1.2 * Math.cos(a);
  function hf(x, z) {
    const r = Math.hypot(x, z), a = Math.atan2(x, z);
    const e = r - plateauR(a);
    if (e < 0) return 0;
    const drop = -30 * sstep(0, 1, Math.pow(e / 11, 0.8));
    let y = drop;
    const ridge = (0.5 + 0.5 * Math.sin(a * 4 + 1)) * 14 + 4 * Math.sin(a * 9 + r * 0.1);
    y += ridge * sstep(44, 66, r) + 20 * sstep(70, 95, r) * (0.5 + 0.5 * Math.cos(a + 2.5));
    if (e > 1.5 && r < 56) {
      const q = Math.round(y / 2.2) * 2.2;
      y = y + (q - y) * 0.92;
    }
    return y;
  }
  const _c = new THREE.Color();
  function Terrain({ dusk }) {
    const M = useM();
    const geo = useMemo(() => {
      const N = 150, S = 190;
      const pos = [], col = [], idx = [];
      for (let j = 0; j <= N; j += 1) {
        for (let i = 0; i <= N; i += 1) {
          const x = -S / 2 + (S * i) / N, z = -S / 2 + (S * j) / N;
          const y = hf(x, z);
          pos.push(x, y, z);
          const r = Math.hypot(x, z), a = Math.atan2(x, z), e = r - plateauR(a);
          let c;
          if (e < 0) {
            const n = Math.sin(x * 0.31 + 1.3) * Math.sin(z * 0.27) + 0.6 * Math.sin(x * 0.9 + z * 0.7);
            c = n > 0.9 ? '#4f7838' : n > 0.35 ? '#5a8541' : n < -1.0 ? '#6a964a' : '#628c44';
          }
          else if (e < 1.5) c = '#9a7a52';
          else {
            const t = Math.floor((y + 40) / 2.4);
            c = ['#7fae52', '#b8bd5c', '#5f9040', '#a4b556'][((t % 4) + 4) % 4];
            if (rnd(i * 7 + j * 13) > 0.93) c = '#8a6a48';
          }
          _c.set(c);
          const haze = sstep(48, 100, r);
          _c.lerp(new THREE.Color('#8fa8c4'), haze * 0.85);
          if (y > 12) _c.lerp(new THREE.Color('#7e92ad'), 0.35);
          if (dusk) _c.lerp(new THREE.Color('#1f3a2e'), 0.4).multiplyScalar(0.7);
          col.push(_c.r, _c.g, _c.b);
        }
      }
      for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
        const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, [dusk]);
    const m = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false }), []);
    return (
      <group>
        <mesh geometry={geo} material={m} receiveShadow />
      </group>
    );
  }

  function VillageHouses() {
    const spots = useMemo(() => {
      const out = [];
      for (let i = 0; i < 20; i += 1) {
        const a = 1.8 + 3.4 * rnd(i * 3 + 1);
        const r = 40 + 10 * rnd(i * 5 + 2);
        const x = Math.sin(a) * r, z = Math.cos(a) * r;
        out.push({ x, z, y: hf(x, z), ry: rnd(i + 9) * 3, w: 3.6 + rnd(i) * 1.6 });
      }
      return out;
    }, []);
    const walls = useMemo(() => spots.map((s) => [s.x, s.y + 0.4, s.z, s.w, 3.0, s.w * 0.75, rnd(s.x) > 0.5 ? '#efeadd' : '#d9cdb0', s.ry]), [spots]);
    const roofs = useMemo(() => spots.map((s) => [s.x, s.y + 2.1, s.z, s.w * 1.2, 0.35, s.w * 0.95, rnd(s.z) > 0.4 ? '#8a8f95' : '#6f757c', s.ry]), [spots]);
    return (<group><Inst items={walls} /><Inst items={roofs} /></group>);
  }

  function Peaks({ dusk }) {
    const geo = useMemo(() => {
      const pos = [], col = [];
      const snow = new THREE.Color('#f2f6fa'), c = new THREE.Color();
      const push = (v, cc) => { pos.push(v[0], v[1], v[2]); col.push(cc.r, cc.g, cc.b); };
      /* far snow peaks: small and distant, only the top ~15 percent is white */
      for (let i = 0; i < 9; i += 1) {
        const a = 2.55 + i * 0.36 + rnd(i) * 0.2;
        const r = 172 + rnd(i + 4) * 26;
        const h = 38 + rnd(i + 8) * 8, w = 32 + rnd(i + 12) * 13;
        const cx = Math.sin(a) * r, cz = Math.cos(a) * r;
        const ring = 8, lev = 5, y0 = -6;
        const P = (l, k) => {
          const f = l / lev, ang = (k / ring) * Math.PI * 2 + rnd(i * 31 + l * 7 + k) * 0.4;
          const rad = w * (1 - f) * (0.75 + 0.4 * rnd(i * 17 + l * 5 + k * 3));
          return [cx + Math.cos(ang) * rad, y0 + h * f * (l === lev ? 1 : 0.92 + 0.14 * rnd(k + l)), cz + Math.sin(ang) * rad];
        };
        for (let l = 0; l < lev; l += 1) for (let k = 0; k < ring; k += 1) {
          const q = [P(l, k), P(l, (k + 1) % ring), P(l + 1, (k + 1) % ring), P(l + 1, k)];
          [0, 1, 2, 0, 2, 3].forEach((n) => {
            const v = q[n]; const t = (v[1] - y0) / h;
            c.set('#5f7a9c').lerp(new THREE.Color('#9fb3cb'), Math.min(1, t * 1.3)).lerp(snow, sstep(0.84, 0.9, t));
            push(v, c);
          });
        }
      }
      /* layered hazy ridge silhouettes, nearer = darker and greener */
      const layers = [[95, 12, 4], [115, 15, 5], [135, 19, 6], [155, 23, 6]];
      const A0 = 1.0, A1 = 5.7, NA = 90;
      layers.forEach(([r, top, amp], li) => {
        const crest = (k) => {
          const a = A0 + (A1 - A0) * k / NA;
          return top + amp * (Math.sin(a * 3.1 + li * 1.7) * 0.5 + Math.sin(a * 7.3 + li) * 0.3 + Math.sin(a * 13 + li * 2.2) * 0.15) - amp * 0.4 * sstep(0, 0.12, (k / NA)) * 0 ;
        };
        const hz = li / 3;
        const cTop = new THREE.Color('#6f8aa0').lerp(new THREE.Color('#a9bcd2'), hz);
        const cLow = new THREE.Color('#3f5f4f').lerp(new THREE.Color('#7f98b0'), hz);
        for (let k = 0; k < NA; k += 1) {
          const a0 = A0 + (A1 - A0) * k / NA, a1 = A0 + (A1 - A0) * (k + 1) / NA;
          const rr = (rv, a) => [Math.sin(a) * rv, Math.cos(a) * rv];
          const mk = (rv, y, a) => { const p = rr(rv, a); return [p[0], y, p[1]]; };
          const ci = crest(k), cj = crest(k + 1);
          [[-1, 0], [1, 1]].forEach(([sd]) => {
            const rb = r + sd * 38;
            const v = sd < 0
              ? [[mk(rb, -34, a0), cLow], [mk(rb, -34, a1), cLow], [mk(r, cj, a1), cTop], [mk(rb, -34, a0), cLow], [mk(r, cj, a1), cTop], [mk(r, ci, a0), cTop]]
              : [[mk(r, ci, a0), cTop], [mk(r, cj, a1), cTop], [mk(rb, -34, a1), cLow], [mk(r, ci, a0), cTop], [mk(rb, -34, a1), cLow], [mk(rb, -34, a0), cLow]];
            v.forEach(([p, cc]) => push(p, cc));
          });
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const m = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide, fog: false, emissive: new THREE.Color('#4d6a94'), emissiveIntensity: dusk ? 0.12 : 0.55 }), [dusk]);
    const sky = useMemo(() => {
      const g = new THREE.SphereGeometry(230, 24, 16);
      const p = g.attributes.position, cs = [];
      const hz = new THREE.Color('#dcebf5'), zn = new THREE.Color('#78aedc'), cc = new THREE.Color();
      for (let i = 0; i < p.count; i += 1) { cc.copy(hz).lerp(zn, sstep(-0.05, 0.7, p.getY(i) / 230)); cs.push(cc.r, cc.g, cc.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
      return g;
    }, []);
    return (
      <group>
        <mesh geometry={geo} material={m} />
        <mesh geometry={sky} renderOrder={-2}><meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -34, 0]}><circleGeometry args={[230, 32]} /><meshStandardMaterial color="#8fa88a" roughness={1} /></mesh>
      </group>
    );
  }

  function BroadTree({ p, s = 1 }) {
    const M = useM();
    const leaf = M.plain('#3f6a34', { roughness: 1 });
    const leaf2 = M.plain('#557f3c', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.28} rb={0.45} h={3.6} p={[0, 1.8, 0]} m={M.plain('#5a4030')} seg={8} />
        <Cyl rt={0.12} rb={0.22} h={2.2} p={[1.0, 4.2, 0]} r={[0, 0, -0.7]} m={M.plain('#5a4030')} seg={6} />
        <Cyl rt={0.12} rb={0.22} h={2.2} p={[-1.0, 4.2, 0]} r={[0, 0, 0.7]} m={M.plain('#5a4030')} seg={6} />
        <Ball rad={2.2} p={[0, 5.2, 0]} m={leaf} sc={[1.2, 0.7, 1.1]} />
        <Ball rad={1.6} p={[1.9, 4.6, 0.4]} m={leaf2} sc={[1, 0.75, 1]} />
        <Ball rad={1.6} p={[-1.9, 4.7, -0.5]} m={leaf2} sc={[1, 0.75, 1]} />
        <Ball rad={1.3} p={[0.5, 6.1, 0.6]} m={M.plain('#6a9444', { roughness: 1 })} sc={[1.1, 0.7, 1]} />
        <Ball rad={1.2} p={[-0.8, 3.9, 1.3]} m={leaf} sc={[1, 0.7, 1]} />
      </group>
    );
  }
  function Palm({ p, h = 5, s = 1 }) {
    const M = useM();
    const leaf = M.plain('#3d7a3a', { roughness: 0.9 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.14} rb={0.24} h={h} p={[0, h / 2, 0]} m={M.plain('#7a6244')} seg={8} />
        {Array.from({ length: 8 }, (_, i) => (
          <group key={i} position={[0, h, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
            <Box s={[2.3, 0.05, 0.4]} p={[1.0, -0.2, 0]} r={[0, 0, -0.45]} m={leaf} cast={false} />
          </group>
        ))}
      </group>
    );
  }

  function Gate() {
    const M = useM();
    const red = M.plain('#a83c2a', { roughness: 0.7 });
    const dred = M.plain(DRED);
    const white = M.plain(WHITE);
    const wood = M.plain(WOOD);
    const stone = M.stone;
    return (
      <group position={[-8.2, 0, 11.2]} rotation={[0, 0.8, 0]} scale={0.8}>
        {[-3.4, 0, 3.4].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <Box s={[1.2, 3.7, 1.2]} p={[0, 1.85, 0]} m={red} />
            <Box s={[1.4, 0.2, 1.4]} p={[0, 0.1, 0]} m={dred} />
            {[1, -1].map((s) => (
              <group key={s}>
                <Cyl rt={0.2} rb={0.2} h={0.04} p={[0, 2.6, s * 0.61]} r={[Math.PI / 2, 0, 0]} m={M.gold} seg={14} />
                <Box s={[0.5, 0.35, 0.04]} p={[0, 3.2, s * 0.61]} m={white} cast={false} />
              </group>
            ))}
            <Box s={[1.5, 0.25, 1.5]} p={[0, 3.95 + (i === 1 ? 0.5 : 0) - 0.1, 0]} m={wood} />
            {i === 1 && <Box s={[1.0, 0.5, 1.0]} p={[0, 4.15, 0]} m={red} />}
            <HipRoof w={2.5} d={2.4} h={0.75} y={4.0 + (i === 1 ? 0.5 : 0)} rl={0.4} />
            <mesh position={[0, 4.95 + (i === 1 ? 0.5 : 0), 0]} material={M.gold} castShadow><coneGeometry args={[0.07, 0.45, 8]} /></mesh>
          </group>
        ))}
        {/* heavy beam */}
        <Box s={[8.6, 0.55, 1.0]} p={[0, 3.55, 0]} m={red} />
        <Box s={[8.7, 0.12, 1.1]} p={[0, 3.9, 0]} m={wood} />
        <Box s={[8.7, 0.1, 1.1]} p={[0, 3.2, 0]} m={white} cast={false} />
        {/* steps down the hill edge (outside = +z) */}
        {[0, 1, 2].map((i) => <Box key={i} s={[3.6, 1.2, 0.8]} p={[0, -0.25 * (i + 1) - 0.6, 1.4 + i * 0.8]} m={stone} />)}
        <Box s={[7.0, 0.1, 1.8]} p={[0, 0.03, 0]} m={stone} cast={false} />
      </group>
    );
  }

  function Shop() {
    const M = useM();
    const wall = M.plain('#c25c40', { roughness: 0.9 });
    return (
      <group position={[-7.2, 0, 0.9]}>
        <Box s={[3.6, 2.5, 2.2]} p={[0, 1.25, 0]} m={wall} />
        <Box s={[3.0, 1.9, 0.08]} p={[0, 1.05, 1.12]} m={M.plain('#d9892e', { roughness: 0.6 })} cast={false} />
        <Box s={[3.7, 0.5, 2.3]} p={[0, 2.55, 0]} m={M.plain('#e9d9c3')} />
        {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => <Box key={i} s={[0.45, 0.3, 0.04]} p={[x, 2.55, 1.18]} m={i % 2 ? M.plain('#2f8a4a') : M.plain('#c25c40')} cast={false} />)}
      </group>
    );
  }

  function BellTree() {
    const M = useM();
    const bells = useMemo(() => {
      const it = [];
      for (let i = 0; i < 30; i += 1) {
        const a = rnd(i) * Math.PI * 2, y = 1.0 + rnd(i + 30) * 2.6, r = 0.55 + 0.1 * rnd(i + 5);
        it.push([Math.sin(a) * r, y, Math.cos(a) * r, 0.22, 0.28, 0.22, '#8a6a2f']);
      }
      return it;
    }, []);
    return (
      <group position={[-15, 0, 1]} rotation={[0, 0.6, 0]} scale={0.8}>
        <Cyl rt={0.5} rb={0.75} h={4.2} p={[0, 2.1, 0]} m={M.plain('#6a5a4a', { roughness: 1 })} seg={10} />
        <Cyl rt={0.18} rb={0.3} h={3} p={[1.1, 4.6, 0]} r={[0, 0, -0.7]} m={M.plain('#6a5a4a')} seg={6} />
        <Cyl rt={0.18} rb={0.3} h={3} p={[-1.1, 4.6, 0.3]} r={[0, 0, 0.7]} m={M.plain('#6a5a4a')} seg={6} />
        <Ball rad={2.8} p={[0, 6.6, 0]} m={M.plain('#4a7a38', { roughness: 1 })} sc={[1.2, 0.8, 1.2]} />
        <Ball rad={2.0} p={[2.2, 5.9, 0.5]} m={M.plain('#5a8a40', { roughness: 1 })} />
        <Inst items={bells} geo={CONEG} rough={0.4} metal={0.5} />
        <Box s={[0.25, 1.7, 0.25]} p={[-1.4, 0.85, 2.3]} m={M.plain('#d9642e')} />
        <Box s={[0.25, 1.7, 0.25]} p={[1.0, 0.85, 2.4]} m={M.plain('#d9642e')} />
        <Box s={[0.5, 0.12, 0.5]} p={[-1.4, 0.06, 2.3]} m={M.plain('#2f8a4a')} />
      </group>
    );
  }

  function SwingArch() {
    const M = useM();
    const white = M.plain(WHITE, { roughness: 0.7 });
    const base = M.plain('#d9642e', { roughness: 0.8 });
    const red = M.plain('#c0281e');
    return (
      <group position={[11.5, 0, 3.5]} rotation={[0, 1.0, 0]} scale={0.8}>
        {[[-2.4, 2.1], [0, 2.8], [2.4, 2.1]].map(([x, h], i) => (
          <group key={i}>
            <Arch p={[x, 0, 0]} w={2.2} h={h} spring={h * 0.55} t={0.22} ring={white} depth={0.3} />
            <Box s={[2.2, 0.9, 0.3]} p={[x, 0.42, 0.15]} m={base} />
            <Box s={[0.22, 0.9, 0.34]} p={[x - 1.0, 0.42, 0.15]} m={base} cast={false} />
          </group>
        ))}
        {[-3.9, 3.9].map((x) => <Cyl key={x} rt={0.1} rb={0.15} h={6.5} p={[x, 3.25, 0.6]} m={red} seg={8} />)}
        <Box s={[8.0, 0.14, 0.14]} p={[0, 6.5, 0.6]} m={red} />
        {[-0.5, 0.5].map((x) => <Box key={x} s={[0.03, 5.2, 0.03]} p={[x, 3.9, 0.6]} m={M.plain('#444')} cast={false} />)}
        <Box s={[1.2, 0.1, 0.4]} p={[0, 1.3, 0.6]} m={M.plain('#6a4a30')} />
      </group>
    );
  }

  function Lamps() {
    const M = useM();
    const bulb = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd08a', toneMapped: false }), []);
    const pts = [[-2.4, 6.4], [-6.0, 8.2], [1.0, 9.0]];
    return (
      <group>
        {pts.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.04} rb={0.06} h={2.2} p={[0, 1.1, 0]} m={M.dark} seg={6} />
            <Ball rad={0.13} p={[0, 2.3, 0]} m={bulb} />
            {i < 2 && <pointLight position={[0, 2.4, 0]} intensity={3} distance={9} color="#ffb35a" />}
          </group>
        ))}
        <pointLight position={[0, 2.0, 3.8]} intensity={4} distance={9} color="#ff9a4a" />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const trees = useMemo(() => {
      const out = [];
      for (let i = 0; i < 9; i += 1) {
        const a = 2.1 + i * 0.3 + rnd(i) * 0.08;   // behind and to the sides
        const r = plateauR(a) - 4 - rnd(i + 3) * 2;
        out.push({ p: [Math.sin(a) * r, 0, Math.cos(a) * r], s: 0.7 + rnd(i + 6) * 0.4 });
      }
      return out;
    }, []);
    const wallSegs = useMemo(() => {
      const out = [], N = 16, A0 = Math.PI / 2 - 0.62, A1 = Math.PI / 2 + 0.62;
      const pt = (k) => { const a = A0 + (A1 - A0) * k / N, r = plateauR(a) - 1.8; return [Math.sin(a) * r, Math.cos(a) * r]; };
      for (let k = 0; k < N; k += 1) out.push([pt(k), pt(k + 1)]);
      return out;
    }, []);
    return (
      <group ref={ref}>
        <Terrain dusk={dusk} />
        <VillageHouses />
        <Peaks dusk={dusk} />
        {dusk && <Lamps />}
        <Gate />
        <BellTree />
        <SwingArch />
        {wallSegs.map((w, i) => <WallRun key={i} a={w[0]} b={w[1]} />)}
        {/* big tree behind the gate, palms behind the temple */}
                <Palm p={[-7.5, 0, -11]} h={6} />
        <Palm p={[-3.2, 0, -12.5]} h={5} s={0.9} />
        <Palm p={[3.5, 0, -11.5]} h={7} s={1.05} />
        <Palm p={[8.5, 0, -9.5]} h={5.5} />
        {trees.map((t, i) => <BroadTree key={i} p={t.p} s={t.s} />)}
      </group>
    );
  }

  return { 'tripurasundari-temple-baitadi': { Main, Env } };
}
