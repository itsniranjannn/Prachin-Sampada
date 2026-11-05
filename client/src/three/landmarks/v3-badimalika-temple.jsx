/* Badimalika (Malika Bhagwati) temple, Mallagiri summit, Kailashmandau, Bajura, ~4,200 m. Pre-2025 pilgrim compound.
   A tiny whitewashed square shrine with a plain pale pyramidal roof, an open 4-pier pavilion with a grey slate hipped roof (left),
   a stone bell gateway, iron bell gallows and a thicket of rusty tridents (right), a dry-stone wall across the front, a slanted
   flagstaff; bare brown summit, steep slopes, green approach ridge, cloud sea and far snow peaks. 1 unit = 1 m. Front = +z.
   Dimensions are eyeball estimates from 7 photographs. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Diyo, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const WHITE = '#f0efe8', SLATE = '#6f6c66', BEAM = '#4a3a30', WALL = '#6a6761', RUST = '#2f221c', BRONZE = '#6f5428', PLASTER = '#c4c0b6', POST = '#8d8a84';
  const DX = -2.5; // centre the compound

  /* ---------- instanced helpers ---------- */
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const compose = (pos, rot, sc) => _m.compose(_p.set(...pos), _q.setFromEuler(_e.set(...rot)), _s.set(...sc)).clone();
  /* matrix of a unit (r=1,h=1, centred) cylinder spanning a->b with radius r */
  function between(a, b, r) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = B.clone().sub(A), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(r, len, r));
  }
  function Inst({ geo, mat, mats, cast = true }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(geo, mat, mats.length);
      mats.forEach((mm, i) => im.setMatrixAt(i, mm));
      im.instanceMatrix.needsUpdate = true; im.castShadow = cast; im.receiveShadow = true; im.frustumCulled = false;
      return im;
    }, [geo, mat, mats, cast]);
    return <primitive object={mesh} />;
  }
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 6);
  const unitCone = new THREE.ConeGeometry(1, 1, 6);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitTorus = new THREE.TorusGeometry(1, 0.09, 5, 14);
  const bellGeo = (() => {
    const pts = [[0.001, 1], [0.22, 0.98], [0.4, 0.86], [0.52, 0.55], [0.8, 0.2], [1, 0], [0.9, 0.02], [0.45, 0.5], [0.001, 0.9]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 10);
  })();

  /* ---------- bells (instanced): list of [x,y,z,size] (size = rim radius) ---------- */
  function Bells({ list, mat }) {
    const mats = useMemo(() => list.map(([x, y, z, s]) => compose([x, y, z], [0, 0, 0], [s * 1.35, s * 1.6, s * 1.35])), [list]);
    return <Inst geo={bellGeo} mat={mat} mats={mats} />;
  }

  /* ---------- tridents (instanced parts) ---------- */
  const TRIDENTS = (() => {
    const out = [];
    let i = 0;
    const add = (x, z, h, tilt, ring) => out.push({ x, z, h, tilt, ring, rot: rnd(i * 3 + 1) * 6.28, i: i++ });
    // thicket to the right of the bell gateway
    for (let k = 0; k < 50; k++) {
      const x = 8.8 + rnd(k * 7 + 2) * 4.2, z = -3 + rnd(k * 5 + 9) * 2.5;
      add(x, z, 2.2 + rnd(k * 11 + 3) * 1.8, (rnd(k * 13 + 5) - 0.5) * 0.2, k % 6 === 4);
    }
    // a few beside the shrine and gateway
    add(3.1, -1.6, 2.1, 0.08, false); add(3.5, -2.1, 1.7, -0.1, false); add(2.8, 0.9, 1.3, 0.06, false);
    add(-3.6, 0.9, 1.2, -0.08, false); add(7.7, 1.2, 1.9, 0.1, true);
    return out;
  })();

  function Tridents({ M }) {
    const rustMat = M.plain(RUST, { roughness: 0.7, metalness: 0.5 });
    const { cyl, cone, ring, cloth, small } = useMemo(() => {
      const cyl = [], cone = [], ring = [], cloth = [], small = [];
      TRIDENTS.forEach((t) => {
        const T = new THREE.Matrix4().compose(new THREE.Vector3(t.x, 0, t.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(t.tilt, t.rot, t.tilt * 0.6)), new THREE.Vector3(1, 1, 1));
        const put = (arr, L) => arr.push(T.clone().multiply(L));
        const h = t.h;
        put(cyl, between([0, 0, 0], [0, h, 0], 0.036));
        put(cyl, between([-0.25, h - 0.28, 0], [0.25, h - 0.28, 0], 0.022));
        put(cyl, between([-0.25, h - 0.28, 0], [-0.25, h + 0.22, 0], 0.02));
        put(cyl, between([0.25, h - 0.28, 0], [0.25, h + 0.22, 0], 0.02));
        put(cyl, between([0, h - 0.28, 0], [0, h + 0.42, 0], 0.022));
        [-0.25, 0, 0.25].forEach((px) => { const top = px === 0 ? h + 0.42 : h + 0.22; put(cone, compose([px, top + 0.1, 0], [0, 0, 0], [0.055, 0.26, 0.055])); });
        if (t.ring) put(ring, compose([0, h + 0.5, 0], [0, 0, 0], [0.38, 0.38, 0.38]));
        if (t.i % 3 === 0 || t.i % 7 === 2) put(cloth, compose([0.05, h * 0.55, 0.04], [0, 0, 0.1], [0.1, 0.55, 0.02]));
        if (t.i % 4 !== 1) put(small, compose([0.06, h - 0.38, 0.02], [0, 0, 0], [0.045, 0.045, 0.045]));
      });
      return { cyl, cone, ring, cloth, small };
    }, []);
    return (
      <group>
        <Inst geo={unitCyl} mat={rustMat} mats={cyl} />
        <Inst geo={unitCone} mat={rustMat} mats={cone} />
        <Inst geo={unitTorus} mat={rustMat} mats={ring} />
        <Inst geo={unitBox} mat={M.plain('#e6e0d2', { roughness: 1 })} mats={cloth} />
        <Bells list={small.map((mm) => { const v = new THREE.Vector3().setFromMatrixPosition(mm); return [v.x, v.y, v.z, 0.08]; })} mat={M.plain(BRONZE, { metalness: 0.4, roughness: 0.6, side: THREE.DoubleSide })} />
      </group>
    );
  }

  /* ---------- tubular-iron gallows bell stands ---------- */
  const STANDS = [
    { x: 8.6, z: 0.5, w: 1.5, h: 3.1 }, { x: 10.6, z: 0.5, w: 1.8, h: 3.4 }, { x: 12.6, z: 0.5, w: 1.5, h: 3.0 }, { x: 14.6, z: 0.5, w: 1.3, h: 3.2 },
  ];
  function BellStands({ M }) {
    const rustMat = M.plain('#3a2b25', { roughness: 0.6, metalness: 0.6 });
    const bronze = M.plain(BRONZE, { metalness: 0.4, roughness: 0.6, side: THREE.DoubleSide });
    const dark = M.plain('#4a3818', { metalness: 0.4, roughness: 0.6, side: THREE.DoubleSide });
    const { tubes, bells, big } = useMemo(() => {
      const tubes = [], bells = [], big = [];
      STANDS.forEach((s, si) => {
        const { x, z, w, h } = s, hw = w / 2;
        const R = 0.045;
        tubes.push(between([x - hw, 0, z], [x - hw, h, z], R), between([x + hw, 0, z], [x + hw, h, z], R));
        tubes.push(between([x - hw - 0.1, h, z], [x + hw + 0.1, h, z], R), between([x - hw, h * 0.72, z], [x + hw, h * 0.72, z], R * 0.8));
        tubes.push(between([x - hw, 0.5, z - 0.5], [x - hw, h * 0.75, z], R * 0.8), between([x + hw, 0.5, z - 0.5], [x + hw, h * 0.75, z], R * 0.8));
        // hanging cluster of bells under the top bar
        const n = 16 + (si % 2) * 4;
        for (let k = 0; k < n; k++) {
          const a = rnd(si * 100 + k * 3 + 1), b = rnd(si * 100 + k * 3 + 2), c = rnd(si * 100 + k * 3 + 3);
          const yy = h - 0.2 - b * (h * 0.5);
          bells.push([x - hw * 0.9 + a * w * 0.9, yy, z + (c - 0.5) * 0.32, 0.13 + rnd(k + si) * 0.07]);
        }
        // big bells on top of the posts
        big.push([x - hw, h + 0.02, z, 0.32], [x + hw, h + 0.02, z, 0.3], [x - hw * 0.5, h + 0.02, z, 0.27], [x + hw * 0.5, h + 0.02, z, 0.28]);
        big.push([x, h + 0.02, z, 0.35]);
      });
      return { tubes, bells, big };
    }, []);
    return (
      <group>
        <Inst geo={unitCyl} mat={rustMat} mats={tubes} />
        <Bells list={bells} mat={dark} />
        <Bells list={big} mat={bronze} />
      </group>
    );
  }

  /* ---------- stone bell gateway ---------- */
  function Gateway({ M }) {
    const stone = M.plain('#7d7a73', { roughness: 0.95 });
    const bronze = M.plain(BRONZE, { metalness: 0.4, roughness: 0.6, side: THREE.DoubleSide });
    const list = useMemo(() => {
      const l = [];
      [2.5, 1.9, 1.3].forEach((y, r) => {
        for (let k = 0; k < 7; k++) l.push([-0.9 + k * 0.3 + (rnd(k + r * 9) - 0.5) * 0.05, y - rnd(k + 20 + r) * 0.06, (r - 1) * 0.07, 0.26 + rnd(k + 5 + r * 3) * 0.06]);
      });
      l.push([0, 1.2, 0.05, 0.34]);
      return l;
    }, []);
    const iron = M.plain('#3a2b25', { metalness: 0.6 });
    return (
      <group>
        <Box s={[0.42, 3.0, 0.42]} p={[-1.25, 1.5, 0]} m={stone} />
        <Box s={[0.42, 3.0, 0.42]} p={[1.25, 1.5, 0]} m={stone} />
        <Box s={[0.62, 0.34, 0.5]} p={[-1.25, 3.17, 0]} m={stone} />
        <Box s={[0.62, 0.34, 0.5]} p={[1.25, 3.17, 0]} m={stone} />
        <Box s={[0.56, 0.16, 0.5]} p={[-1.25, 2.78, 0]} m={stone} />
        <Box s={[0.56, 0.16, 0.5]} p={[1.25, 2.78, 0]} m={stone} />
        <Box s={[3.2, 0.34, 0.44]} p={[0, 3.08, 0]} m={stone} />
        <Box s={[2.1, 0.1, 0.1]} p={[0, 2.9, 0]} m={iron} />
        <Box s={[2.1, 0.08, 0.08]} p={[0, 2.32, 0.0]} m={iron} />
        <Box s={[2.1, 0.08, 0.08]} p={[0, 1.72, 0.0]} m={iron} />
        <Bells list={list} mat={bronze} />
      </group>
    );
  }

  /* ---------- pavilion ---------- */
  function Pavilion({ M }) {
    const white = M.plain(WHITE, { roughness: 0.9 });
    const slate = M.plain('#7a776f', { roughness: 0.95 });
    const beam = M.plain(BEAM, { roughness: 0.85 });
    const piers = [[-1.45, -1.45], [1.45, -1.45], [-1.45, 1.45], [1.45, 1.45]];
    return (
      <group>
        <Box s={[3.6, 0.3, 3.6]} p={[0, 0.15, 0]} m={white} />
        {piers.map(([x, z], i) => <Box key={i} s={[0.55, 2.2, 0.55]} p={[x, 1.4, z]} m={white} />)}
        <Box s={[0.14, 0.14, 0.02]} p={[1.45, 1.4, 1.74]} m={M.plain('#b5251f')} />
        <Box s={[0.14, 0.14, 0.02]} p={[1.45, 1.4, 1.74]} r={[0, 0, Math.PI / 4]} m={M.plain('#b5251f')} />
        {/* dark wooden beam ring and rafters */}
        <Box s={[3.55, 0.28, 0.3]} p={[0, 2.64, 1.45]} m={beam} />
        <Box s={[3.55, 0.28, 0.3]} p={[0, 2.64, -1.45]} m={beam} />
        <Box s={[0.3, 0.28, 3.55]} p={[-1.45, 2.64, 0]} m={beam} />
        <Box s={[0.3, 0.28, 3.55]} p={[1.45, 2.64, 0]} m={beam} />
        <Box s={[4.5, 0.14, 4.5]} p={[0, 2.86, 0]} m={beam} />
        {/* slate slab courses and low hipped roof */}
        <Box s={[4.5, 0.12, 4.5]} p={[0, 2.99, 0]} m={slate} />
        <Box s={[4.5, 0.1, 4.5]} p={[0, 3.1, 0]} m={M.plain('#7a776f', { roughness: 0.95 })} />
        <Box s={[4.1, 0.1, 4.1]} p={[0, 3.2, 0]} m={M.plain('#6f6c66', { roughness: 0.95 })} />
        <Box s={[3.7, 0.1, 3.7]} p={[0, 3.3, 0]} m={M.plain('#7a776f', { roughness: 0.95 })} />
        <Cyl rt={0.3} rb={2.6} h={0.9} p={[0, 3.8, 0]} r={[0, Math.PI / 4, 0]} seg={4} m={slate} />
        <Cyl rt={0.12} rb={0.15} h={0.3} p={[0, 4.4, 0]} m={white} />
        <Ball rad={0.1} p={[0, 4.62, 0]} m={white} />
        <Cyl rt={0.02} rb={0.02} h={0.3} p={[0, 4.83, 0]} m={M.plain(RUST)} />
        {/* little whitewashed niche stub at the base */}
        <Box s={[0.7, 0.5, 0.5]} p={[-0.5, 0.55, 1.35]} m={white} />
        <Ball rad={0.3} p={[-0.5, 0.8, 1.35]} sc={[1, 0.8, 0.8]} m={white} />
        {/* shaded interior */}
        <Box s={[2.5, 0.05, 2.5]} p={[0, 0.32, 0]} m={M.plain('#8a8378')} />
      </group>
    );
  }

  /* ---------- main shrine ---------- */
  function Shrine({ M }) {
    const white = M.plain(WHITE, { roughness: 0.92 });
    const plaster = M.plain('#aaa69c', { roughness: 0.95 });
    const hip = M.plain('#8f8b82', { roughness: 0.95 });
    return (
      <group>
        {/* low whitewashed rubble platform */}
        <Box s={[4.4, 0.35, 4.2]} p={[0, 0.17, 0]} m={white} />
        <Box s={[3.0, 2.05, 3.0]} p={[0, 1.37, 0]} m={white} />
        <Box s={[3.14, 0.12, 3.14]} p={[0, 2.44, 0]} m={white} />
        {/* plain pale four-faced pyramid roof, plastered */}
        <Cyl rt={0.18} rb={2.42} h={1.3} p={[0, 3.1, 0]} r={[0, Math.PI / 4, 0]} seg={4} m={plaster} />
        {/* plaster hip ridges */}
        {[0, 1, 2, 3].map((i) => {
          const a = i * Math.PI / 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
          return <Box key={i} s={[0.1, 0.07, 1.8]} p={[c * 1.2, 3.1, s * 1.2]} r={[0, -a + Math.PI / 2, 0]} m={hip} cast={false} />;
        })}
        <Cyl rt={0.07} rb={0.15} h={0.32} p={[0, 3.9, 0]} m={white} />
        <Ball rad={0.1} p={[0, 4.12, 0]} m={white} />
        {/* a small dark door-niche on the front face, no windows */}
        <Box s={[0.5, 0.8, 0.05]} p={[0, 0.9, 1.51]} m={M.plain('#3a342d')} />
        <Box s={[0.7, 0.08, 0.08]} p={[0, 1.36, 1.53]} m={white} />
      </group>
    );
  }

  /* ---------- altars, small figures, dry-stone wall, flagstaff ---------- */
  function Altars({ M }) {
    const white = M.plain('#e9e7de', { roughness: 0.95 });
    const dark = M.plain('#4a4540', { roughness: 0.9 });
    const slate = M.plain('#77746d', { roughness: 0.95 });
    return (
      <group>
        <Box s={[1.3, 0.8, 1.2]} p={[2.5, 0.4, 0.6]} r={[0, 0.2, 0]} m={white} />
        <Box s={[0.9, 0.35, 0.8]} p={[2.7, 0.95, 0.5]} r={[0, 0.5, 0.05]} m={white} />
        <Box s={[1.3, 0.9, 1.0]} p={[3.0, 0.45, -0.5]} r={[0, -0.3, 0]} m={white} />
        <Box s={[1.3, 0.55, 0.9]} p={[1.5, 0.27, 1.4]} r={[0, 0.15, 0]} m={white} />
        <Box s={[0.8, 0.6, 0.8]} p={[-2.7, 0.3, 1.1]} r={[0, 0.4, 0]} m={white} />
        <Box s={[0.9, 0.35, 0.9]} p={[-2.4, 0.17, -1.9]} r={[0, 0.1, 0]} m={white} />
        {/* small dark carved figures on altars */}
        <Box s={[0.25, 0.4, 0.2]} p={[3.0, 1.1, -0.4]} m={dark} />
        <Ball rad={0.13} p={[3.0, 1.38, -0.4]} m={dark} />
        <Box s={[0.22, 0.32, 0.2]} p={[2.3, 0.9, 0.5]} m={dark} />
        <Ball rad={0.11} p={[2.3, 1.1, 0.5]} m={dark} />
        {/* slate ledge with a carved grey stone head, near the trident thicket */}
        <Box s={[2.2, 0.18, 0.9]} p={[6.6, 0.7, -2.2]} r={[0, 0.2, 0.03]} m={slate} />
        <Box s={[1.6, 0.16, 0.8]} p={[6.7, 0.52, -2.2]} r={[0, 0.1, -0.02]} m={slate} />
        <Box s={[1.9, 0.4, 0.8]} p={[6.6, 0.3, -2.2]} m={slate} />
        <Ball rad={0.3} p={[6.8, 1.0, -2.2]} sc={[1, 1.1, 0.85]} m={M.plain('#77746d')} />
        <Box s={[0.5, 0.2, 0.4]} p={[6.8, 0.78, -2.2]} m={M.plain('#77746d')} />
      </group>
    );
  }

  function Strata({ p, len, axis }) {
    const a = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4f4d49', roughness: 1 }), []);
    const b = useMemo(() => new THREE.MeshStandardMaterial({ color: '#85827a', roughness: 1 }), []);
    return (
      <group position={[p[0], 0, p[1]]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const L = len * (0.9 + rnd(i + len) * 0.1), off = (rnd(i * 3 + len) - 0.5) * 0.1 * len;
          const sz = axis === 'x' ? [L, 0.17, 0.05] : [0.05, 0.17, L];
          return <mesh key={i} position={axis === 'x' ? [off, 0.1 + i * 0.2, 0] : [0, 0.1 + i * 0.2, off]} material={i % 2 ? b : a}><boxGeometry args={sz} /></mesh>;
        })}
      </group>
    );
  }

  function StoneWall({ M }) {
    const w = (len) => M.plain('#55534e', { roughness: 0.97 });
    const cap = M.plain('#6e6b65', { roughness: 0.95 });
    const rocks = useMemo(() => Array.from({ length: 16 }, (_, i) => [-9 + i * 0.95 + rnd(i) * 0.3, 1.04 + rnd(i + 8) * 0.06, 2.5 + (rnd(i + 3) - 0.5) * 0.15, 0.3 + rnd(i + 2) * 0.35]), []);
    const rm = M.plain('#625f59', { roughness: 0.95 });
    return (
      <group>
        <Box s={[13.2, 1.0, 0.55]} p={[-3.2, 0.5, 2.5]} m={w(13.2)} />
        <Box s={[0.55, 1.0, 6.5]} p={[-9.5, 0.5, -0.8]} m={w(6.5)} />
        <Box s={[0.55, 0.9, 3.0]} p={[3.4, 0.45, 1.0]} m={w(3)} />
        <Box s={[13.2, 0.08, 0.62]} p={[-3.2, 1.04, 2.5]} m={cap} />
        <Box s={[0.62, 0.08, 6.5]} p={[-9.5, 1.04, -0.8]} m={cap} />
        <Strata p={[-3.2, 2.78]} len={13.2} axis="x" />
        <Strata p={[-3.2, 2.22]} len={13.2} axis="x" />
        <Strata p={[-9.78, -0.8]} len={6.5} axis="z" />
        <Strata p={[-9.22, -0.8]} len={6.5} axis="z" />
        <Strata p={[3.68, 1.0]} len={3} axis="z" />
        <Strata p={[3.12, 1.0]} len={3} axis="z" />
        {rocks.map((r, i) => <Box key={i} s={[r[3], 0.12, 0.45]} p={[r[0], r[1], r[2]]} r={[0, rnd(i) * 0.3, 0]} m={rm} cast={false} />)}
      </group>
    );
  }

  function Flagstaff({ M }) {
    return (
      <group position={[-3.2, 0, -3.4]} rotation={[0.05, 0, -0.12]}>
        <Cyl rt={0.03} rb={0.06} h={5.2} p={[0, 2.6, 0]} m={M.plain('#3b2f28', { roughness: 0.8 })} seg={8} />
        <Cyl rt={0.0} rb={0.05} h={0.4} p={[0, 5.4, 0]} m={M.plain('#8d8a84', { metalness: 0.7, roughness: 0.4 })} seg={6} />
        <Box s={[0.5, 0.35, 0.02]} p={[0.28, 4.7, 0]} m={M.plain('#f1eee6', { side: THREE.DoubleSide })} />
        <Box s={[0.5, 0.12, 0.025]} p={[0.28, 4.62, 0]} m={M.plain('#c1272d')} />
        <Box s={[0.4, 0.5, 0.45]} p={[0, 0.25, 0]} m={M.plain('#e4e1d8')} />
      </group>
    );
  }

  function Pilgrims({ M }) {
    const spots = [[2.9, 1.6, '#2b2f3d'], [3.8, 1.5, '#4d6b50']];
    return (
      <group>
        {spots.map(([x, z, c], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.16} rb={0.2} h={1.1} p={[0, 0.85, 0]} m={M.plain(c)} seg={8} />
            <Cyl rt={0.14} rb={0.14} h={0.6} p={[0, 0.3, 0]} m={M.plain('#2a2a2a')} seg={8} />
            <Ball rad={0.13} p={[0, 1.55, 0]} m={M.plain('#b78a66')} />
          </group>
        ))}
      </group>
    );
  }

  function BadimalikaMain() {
    const M = useM();
    return (
      <group position={[DX, 0, 0]}>
        <group position={[-6, 0, -1.5]}><Pavilion M={M} /></group>
        <group position={[-1, 0, -1]}><Shrine M={M} /></group>
        <group position={[5.2, 0, 0]}><Gateway M={M} /></group>
        <Tridents M={M} />
        <BellStands M={M} />
        <Altars M={M} />
        <StoneWall M={M} />
        <Flagstaff M={M} />
        <Pilgrims M={M} />
        {/* tall stone post at the far right edge */}
        <Box s={[0.5, 3.8, 0.5]} p={[15.2, 1.9, 1.4]} r={[0.02, 0.2, -0.04]} m={M.plain('#8f8c85', { roughness: 0.95 })} />
        <Diyo p={[1.0, 0.8, 1.9]} light />
        <Diyo p={[-0.4, 0.5, 2.0]} />
        {/* invisible frame for the camera */}
        <Frame s={[20, 4.2, 6]} p={[3.4, 2.1, -0.5]} />
      </group>
    );
  }

  /* ---------- environment: bare summit, steep slopes, green ridge, cloud sea, snow peaks ---------- */
  function hgt(x, z) {
    const rr = Math.hypot((x - 1) / 1.7, (z + 1.5) / 0.9);
    let h = -0.04;
    if (rr > 8) h = -(rr - 8) * 1.6 - Math.pow(Math.max(0, rr - 8), 1.3) * 0.1;
    if (z > 8) {
      const ridge = -0.05 - (z - 8) * 0.14 - Math.max(0, Math.abs(x) - 2.2) * 0.9;
      h = Math.max(h, ridge);
    }
    // gentle lumps on the flat top
    h += (Math.sin(x * 0.7) * Math.cos(z * 0.6) * 0.05) * (rr < 9 ? 1 : 0);
    if (rr > 9.5) h += Math.sin(x * 0.35 + z * 0.2) * Math.cos(z * 0.3 - x * 0.1) * Math.min(2.5, (rr - 9.5) * 0.2);
    return h;
  }

  function Summit({ M }) {
    const geo = useMemo(() => {
      const S = 260, N = 170;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const h = hgt(x, z); p.setY(i, h);
        const rr = Math.hypot((x - 1) / 1.7, (z + 1.5) / 0.9);
        const n = rnd(Math.floor(x * 2) * 31 + Math.floor(z * 2) * 17) * 0.5 + Math.sin(x * 0.4) * Math.cos(z * 0.5) * 0.25;
        const flat = rr < 8;
        const green = sstep(-1, -7, h) * 0.7 + (z > 10 && Math.abs(x) < 10 ? sstep(10, 22, z) * 0.45 : 0);
        c.set(flat ? '#6b5b43' : '#7d6c4c');
        if (flat && Math.sin(x * 0.9 + z * 0.5) * Math.cos(z * 1.3 - x * 0.4) > 0.35 && rnd(Math.floor(x) * 7 + Math.floor(z) * 3) > 0.3) c.set('#8a7a58');
        c.lerp(new THREE.Color('#6f7a3c'), Math.min(0.95, green + sstep(11, 17, rr) * 0.6));
        c.offsetHSL(0, 0, (n - 0.35) * 0.08);
        // paler trampled approach path on the crest
        if (z > 6 && Math.abs(x) < 1.5) c.lerp(new THREE.Color('#6f8a3a'), 0.85);
        if (h < -28) c.lerp(new THREE.Color('#9aa2a8'), 0.5);
        col.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  function Tussocks({ M }) {
    const mats = useMemo(() => {
      const l = [];
      for (let i = 0; i < 110; i++) {
        const a = rnd(i * 3) * 6.28, r = 3 + rnd(i * 5 + 1) * 40;
        const x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r - 0.5;
        if (Math.abs(x + 2.5) < 14 && z > -8 && z < 5) continue;
        const h = hgt(x, z); if (h < -26) continue;
        const s = 0.3 + rnd(i + 9) * 0.5;
        l.push(compose([x, h + s * 0.1, z], [0, rnd(i) * 6, 0], [s * 1.3, s * 0.3, s]));
      }
      return l;
    }, []);
    const geo = useMemo(() => new THREE.SphereGeometry(1, 7, 4), []);
    return <Inst geo={geo} mat={M.plain('#8a7a52', { roughness: 1 })} mats={mats} cast={false} />;
  }

  function Rocks({ M }) {
    const mats = useMemo(() => {
      const l = [];
      for (let i = 0; i < 90; i++) {
        const x = (rnd(i * 3 + 1) - 0.5) * 36, z = -9 + rnd(i * 7 + 2) * 20;
        if (x > -12 && x < 12 && z > -6 && z < 3.5) continue;
        const h = hgt(x, z); if (h < -5) continue;
        const s = 0.18 + rnd(i + 4) * 0.5;
        l.push(compose([x, h + s * 0.2, z], [rnd(i) * 0.5, rnd(i + 3) * 6, rnd(i + 5) * 0.4], [s * 1.5, s * 0.55, s]));
      }
      return l;
    }, []);
    const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
    return <Inst geo={geo} mat={M.plain('#777168', { roughness: 1, flatShading: true })} mats={mats} />;
  }

  function Sky({ M }) {
    const cloud = M.plain('#fbfcfd', { roughness: 1, transparent: true, opacity: 0.85, fog: false });
    const blobs = useMemo(() => {
      const l = [];
      for (let i = 0; i < 60; i++) {
        const a = rnd(i * 3) * 6.28, r = 22 + rnd(i * 5 + 1) * 110;
        const s = 2 + rnd(i + 2) * 4;
        l.push(compose([Math.cos(a) * r, -21 + rnd(i + 8) * 2.5, Math.sin(a) * r], [0, rnd(i) * 3, 0], [s * 2.2, s * 0.35, s]));
      }
      return l;
    }, []);
    const geo = useMemo(() => new THREE.SphereGeometry(1, 9, 6), []);
    const dome = useMemo(() => {
      const g = new THREE.SphereGeometry(300, 24, 16);
      const p = g.attributes.position, col = new Float32Array(p.count * 3), top = new THREE.Color('#1f4fa8'), mid = new THREE.Color('#5b8fd6'), low = new THREE.Color('#8fb4e0'), c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const t = Math.max(0, p.getY(i) / 300);
        c.copy(low).lerp(mid, sstep(0, 0.18, t)).lerp(top, sstep(0.15, 0.7, t));
        col.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    const rockM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7d8ca4', roughness: 1, flatShading: true, fog: false }), []);
    const snowM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eef3f8', roughness: 1, flatShading: true, fog: false }), []);
    const peaks = [[-90, -170, 40, 44, 0], [-10, -200, 52, 56, 1], [100, -140, 38, 40, 2], [-160, -60, 36, 34, 3],
      ...Array.from({ length: 8 }, (_, i) => [-210 + i * 60, -230 - (i % 2) * 20, 34 + rnd(i + 3) * 14, 26 + rnd(i + 11) * 22, i + 4])];
    const ridgeM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6f86a8', roughness: 1, flatShading: true, fog: false }), []);
    return (
      <group>
        <mesh geometry={dome}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -19.8, 0]}><circleGeometry args={[320, 48]} /><meshStandardMaterial color="#8da0b8" roughness={1} fog={false} /></mesh>
        <Inst geo={geo} mat={cloud} mats={blobs} cast={false} />
        {peaks.map(([x, z, rb, h, k], i) => {
          const part = (dx, dz, b, hh, sd, key) => (
            <group key={key} position={[dx, 0, dz]}>
              <Cyl rt={0} rb={b} h={hh} p={[0, hh / 2, 0]} m={rockM} seg={sd} />
              <Cyl rt={0} rb={b * 0.78} h={hh * 0.77} p={[0, hh * 0.615, 0]} m={snowM} seg={sd} />
            </group>
          );
          return (
            <group key={i} position={[x, -20, z]} rotation={[0, k * 0.7, 0]}>
              {part(0, 0, rb, h, 6, 'a')}
              {part(rb * 0.6, rb * 0.1, rb * 0.6, h * 0.72, 5, 'b')}
              {part(-rb * 0.6, -rb * 0.1, rb * 0.55, h * 0.8, 6, 'c')}
              {k % 2 === 0 && part(rb * 0.1, rb * 0.6, rb * 0.4, h * 0.55, 5, 'd')}
            </group>
          );
        })}
      </group>
    );
  }

  function BadimalikaEnv() {
    const M = useM();
    return (
      <group>
        <Summit M={M} />
        <Tussocks M={M} />
        <Rocks M={M} />
        <Sky M={M} />
      </group>
    );
  }

  return { 'badimalika-temple': { Main: BadimalikaMain, Env: BadimalikaEnv } };
}
