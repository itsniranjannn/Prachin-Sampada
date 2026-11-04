// Vatsala Durga Temple, Bhaktapur Durbar Square. A weathered grey-beige stone shikhara: 3-step plinth, open pillared portico
// (doubled corner pillars, trefoil spandrels), a deep dark carved cornice with brackets, bulbous corner kiosk-turrets on two
// levels, a stout curvilinear ribbed tower with three stacked niche bands per face, amalaka and a slim gilded pinnacle.
// Taleju Bell on a stone-pillared beam joined to the plinth (front-left), the barking bell on the plinth, the Bhupatindra
// Malla column on the plaza and the long brick palace behind. Front faces +z.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Diyo, Lion, GroundDisc, useMemo, useRef, useEffect, THREE } = K;

  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const V2 = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));
  // rotate an instance (x,y,z,sx,sy,sz) about y by k quarter turns (matches <group rotation y = k*PI/2>)
  const R = (k, x, y, z, sx, sy, sz) => {
    const q = k % 4;
    if (q === 0) return [x, y, z, sx, sy, sz];
    if (q === 1) return [z, y, -x, sz, sy, sx];
    if (q === 2) return [-x, y, -z, sx, sy, sz];
    return [-z, y, x, sz, sy, sx];
  };

  /* ------- shared geometry ------- */
  const TW0 = 1.45; // tower half-width at base
  const TW1 = 0.4; // at top
  const TY0 = 4.65; // tower base height
  const TH = 6.8; // tower height
  const tw = (t) => TW1 + (TW0 - TW1) * (1 - Math.pow(t, 1.8)); // convex, bulging profile
  const BH = 1.14; // bhadra projection factor

  function towerGeometry() {
    const n = 9;
    const a = 0.34;
    const ring = (w, y) => {
      const pts = [];
      for (let f = 0; f < 4; f += 1) {
        const ang = (f * Math.PI) / 2;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        [[-1, 1], [-a, 1], [-a, BH], [a, BH], [a, 1], [1, 1]].forEach(([x, z]) => {
          const X = x * w;
          const Z = z * w;
          pts.push([X * c + Z * s, y, -X * s + Z * c]);
        });
      }
      return pts;
    };
    const rings = [];
    for (let k = 0; k < n; k += 1) {
      const t0 = k / n;
      const t1 = (k + 1) / n;
      rings.push(ring(tw(t0), TY0 + TH * t0));
      rings.push(ring(tw(t1) * 0.9, TY0 + TH * t1));
    }
    const pos = [];
    const uv = [];
    const push = (p) => { pos.push(p[0], p[1], p[2]); uv.push((p[0] + p[2]) * 0.35, p[1] * 0.35); };
    for (let r = 0; r < rings.length - 1; r += 1) {
      const p1 = rings[r];
      const p2 = rings[r + 1];
      for (let i = 0; i < p1.length; i += 1) {
        const j = (i + 1) % p1.length;
        [p1[i], p2[i], p1[j], p1[j], p2[i], p2[j]].forEach(push);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  // bulbous kiosk roof: amalaka-like bulge plus two ribbed rings
  const kioskRoofGeo = (() => new THREE.LatheGeometry(V2([[0.001, 0], [0.3, 0], [0.3, 0.04], [0.24, 0.09], [0.29, 0.16], [0.29, 0.2], [0.22, 0.25], [0.27, 0.33], [0.27, 0.37], [0.19, 0.42], [0.24, 0.5], [0.24, 0.54], [0.15, 0.59], [0.19, 0.67], [0.17, 0.7], [0.09, 0.75], [0.05, 0.95], [0.015, 1.12]]), 12))();
  const miniSpireGeo = (() => new THREE.LatheGeometry(V2([[0.001, 0], [0.3, 0], [0.3, 0.2], [0.2, 0.26], [0.24, 0.4], [0.15, 0.48], [0.19, 0.6], [0.1, 0.68], [0.05, 0.8], [0.02, 1.0]]), 10))();
  const bellGeo = (() => new THREE.LatheGeometry(V2([[0.02, 0.4], [0.14, 0.38], [0.2, 0.2], [0.3, -0.05], [0.4, -0.3], [0.42, -0.36], [0.36, -0.36], [0.3, -0.3], [0.2, -0.05], [0.12, 0.2], [0.02, 0.3]]), 18))();

  function hipGeometry(W, Dp, h) {
    const hw = W / 2;
    const hd = Dp / 2;
    const rx = Math.max(0.05, hw - hd);
    const T = [
      [[-hw, 0, hd], [hw, 0, hd], [rx, h, 0]], [[-hw, 0, hd], [rx, h, 0], [-rx, h, 0]],
      [[hw, 0, -hd], [-hw, 0, -hd], [-rx, h, 0]], [[hw, 0, -hd], [-rx, h, 0], [rx, h, 0]],
      [[hw, 0, hd], [hw, 0, -hd], [rx, h, 0]],
      [[-hw, 0, -hd], [-hw, 0, hd], [-rx, h, 0]],
    ];
    const pos = [];
    const uv = [];
    T.forEach((tri) => tri.forEach(([x, y, z]) => { pos.push(x, y, z); uv.push(x / 2.2, (z + y * 1.6) / 2.2); }));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  function Inst({ items, m }) {
    const ref = useRef();
    useEffect(() => {
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.rotation.set(0, 0, 0);
        o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return <instancedMesh ref={ref} args={[unitBox, m, items.length]} frustumCulled={false} receiveShadow />;
  }

  function useStone(M) {
    return {
      stone: M.plain('#7e7565', { roughness: 0.97 }),
      stoneL: M.plain('#8c8373', { roughness: 0.97 }),
      stoneD: M.plain('#5a5246', { roughness: 0.97 }),
      cornice: M.plain('#5a4a32', { roughness: 0.95 }),
      wall: M.plain('#645b4c', { roughness: 0.98 }),
      void_: M.plain('#231c14', { roughness: 1 }),
    };
  }

  /* a kiosk turret: slab, four mini pillars, slab, bulbous ribbed roof, amalaka and tip */
  function Kiosk({ p, s = 1, S }) {
    return (
      <group position={p} scale={s}>
        <Box s={[0.8, 0.1, 0.8]} p={[0, 0.05, 0]} m={S.stoneL} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Cyl key={`${x}${z}`} rt={0.05} rb={0.065} h={0.75} p={[x * 0.3, 0.475, z * 0.3]} m={S.stone} seg={8} />)}
        <Box s={[0.3, 0.6, 0.3]} p={[0, 0.4, 0]} m={S.void_} />
        <Box s={[0.82, 0.1, 0.82]} p={[0, 0.9, 0]} m={S.stoneD} />
        <mesh geometry={kioskRoofGeo} material={S.stone} position={[0, 0.95, 0]} castShadow />
        <Ball rad={0.06} p={[0, 2.1, 0]} m={S.stoneL} />
        <Cyl rt={0.012} rb={0.03} h={0.25} p={[0, 2.22, 0]} m={S.stoneD} seg={6} />
      </group>
    );
  }
  function MiniSpire({ p, s = 1, S }) {
    return <mesh geometry={miniSpireGeo} material={S.stone} position={p} scale={s} castShadow />;
  }

  /* one stacked projecting niche band (3 stages) with two flanking mini-spires */
  function NicheBand({ S, sc }) {
    return (
      <group scale={sc}>
        <Box s={[1.5, 0.12, 0.55]} p={[0, -0.5, 0.05]} m={S.stoneD} />
        <Box s={[0.95, 0.85, 0.5]} p={[0, -0.02, 0.05]} m={S.stoneL} />
        <Box s={[0.46, 0.6, 0.12]} p={[0, -0.04, 0.34]} m={S.void_} />
        <mesh position={[0, 0.26, 0.34]} material={S.void_}><cylinderGeometry args={[0.23, 0.23, 0.12, 10, 1, false, 0, Math.PI]} /></mesh>
        <Box s={[0.18, 0.36, 0.1]} p={[0, -0.16, 0.36]} m={S.stone} />
        <Box s={[1.1, 0.1, 0.58]} p={[0, 0.45, 0.05]} m={S.stoneD} />
        <Box s={[0.7, 0.14, 0.44]} p={[0, 0.57, 0.05]} m={S.stone} />
        <MiniSpire p={[0, 0.63, 0.05]} s={0.55} S={S} />
        {[-1, 1].map((x) => (
          <group key={x}>
            <Box s={[0.4, 0.1, 0.4]} p={[x * 0.72, -0.5, 0.0]} m={S.stoneD} />
            <MiniSpire p={[x * 0.72, -0.45, 0.0]} s={0.95} S={S} />
          </group>
        ))}
      </group>
    );
  }

  /* ------------------------------------------------------------------ the temple */
  function Temple() {
    const M = useM();
    const S = useStone(M);
    const tg = useMemo(() => towerGeometry(), []);
    const towerM = useMemo(() => {
      const m = M.plain('#847b6b', { roughness: 0.97 }).clone();
      m.side = THREE.DoubleSide;
      return m;
    }, [M]);
    const colX = [-2.15, -1.85, -0.65, 0.65, 1.85, 2.15];
    const CZ = 2.1;
    const ptop = 3.5;
    const A = TY0 + TH;

    const ribs = useMemo(() => {
      const out = [];
      for (let k = 0; k < 4; k += 1) {
        for (let sg = 0; sg < 9; sg += 1) {
          const tm = (sg + 0.5) / 9;
          const w = tw(tm) * 0.95;
          [-0.3, -0.15, 0, 0.15, 0.3].forEach((fx) => out.push(R(k, fx * w * 1.0, TY0 + TH * tm, BH * w + 0.02, 0.09, (TH / 9) * 1.02, 0.09)));
        }
      }
      return out;
    }, []);
    const dentils = useMemo(() => {
      const out = [];
      for (let k = 0; k < 4; k += 1) {
        for (let i = 0; i < 17; i += 1) out.push(R(k, -2.2 + i * 0.275, 3.78, 2.38, 0.14, 0.15, 0.08));
        for (let i = 0; i < 11; i += 1) out.push(R(k, -2.5 + i * 0.5, 3.78, 2.5, 0.2, 0.3, 0.38));
        for (let i = 0; i < 20; i += 1) out.push(R(k, -2.85 + i * 0.3, 4.22, 3.0, 0.14, 0.1, 0.06));
      }
      return out;
    }, []);

    return (
      <group>
        {/* three-step plinth */}
        <Box s={[6.4, 0.3, 6.4]} p={[0, 0.15, 0]} m={S.stoneL} />
        <Box s={[5.6, 0.3, 5.6]} p={[0, 0.45, 0]} m={S.stone} />
        <Box s={[4.8, 0.3, 4.8]} p={[0, 0.75, 0]} m={S.stoneL} />

        {/* recessed, darker sanctum core with arched doors */}
        <Box s={[2.3, ptop - 0.9, 2.3]} p={[0, (ptop + 0.9) / 2, 0]} m={S.wall} />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            <Box s={[1.1, 1.6, 0.06]} p={[0, 1.8, 1.17]} m={S.void_} />
            <mesh position={[0, 2.6, 1.17]} material={S.void_}><cylinderGeometry args={[0.55, 0.55, 0.06, 14, 1, false, 0, Math.PI]} /></mesh>
            <Box s={[1.0, 0.1, 0.14]} p={[0, 0.98, 1.22]} m={S.stoneD} />
            {colX.map((x) => (
              <group key={x}>
                <Box s={[0.3, 0.14, 0.3]} p={[x, 0.97, CZ]} m={S.stoneD} />
                <Cyl rt={0.08} rb={0.11} h={2.3} p={[x, 2.1, CZ]} m={S.stone} seg={10} />
                <Box s={[0.34, 0.14, 0.34]} p={[x, 3.22, CZ]} m={S.stoneD} />
                <Box s={[0.6, 0.14, 0.22]} p={[x, 3.38, CZ]} m={S.stoneD} />
              </group>
            ))}
            {/* cusped trefoil spandrel panels between the columns */}
            {[[-1.85, -0.65], [-0.65, 0.65], [0.65, 1.85]].map(([x0, x1], i) => {
              const cx = (x0 + x1) / 2;
              const wd = x1 - x0 - 0.25;
              return (
                <group key={i} position={[cx, 0, CZ]}>
                  <Box s={[wd, 0.72, 0.1]} p={[0, 2.92, 0]} m={S.stoneD} />
                  {[-1, 0, 1].map((j) => <Ball key={j} rad={0.2} sc={[0.9, 1, 0.5]} p={[j * Math.min(0.42, wd / 3.0), 2.75 - (j === 0 ? 0.12 : 0), 0.04]} m={S.void_} />)}
                </group>
              );
            })}
            <Box s={[4.7, 0.26, 0.24]} p={[0, 3.46, CZ]} m={S.stoneD} />
            {range(16, (i) => <Box key={`n${i}`} s={[0.18, 0.14, 0.06]} p={[-2.1 + i * 0.28, 3.46, CZ + 0.13]} m={S.void_} />)}
          </group>
        ))}

        {/* heavy, deeply overhanging dark carved cornice (about 0.9 m) */}
        <Box s={[4.6, 0.1, 4.6]} p={[0, 3.55, 0]} m={S.stoneD} />
        <Box s={[4.9, 0.4, 4.9]} p={[0, 3.8, 0]} m={S.cornice} />
        <Box s={[5.4, 0.12, 5.4]} p={[0, 3.99, 0]} m={S.stone} />
        <Box s={[6.0, 0.14, 6.0]} p={[0, 4.12, 0]} m={S.stoneL} />
        <Box s={[5.7, 0.16, 5.7]} p={[0, 4.27, 0]} m={S.cornice} />
        <Inst items={dentils} m={S.stoneL} />
        <Cyl rt={3.25} rb={4.24} h={0.2} p={[0, 4.45, 0]} r={[0, Math.PI / 4, 0]} m={S.stone} seg={4} />
        <Box s={[4.6, 0.12, 4.6]} p={[0, 4.58, 0]} m={S.stoneD} />

        {/* turret level 1: chunky corner kiosks */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Kiosk key={`a${x}${z}`} p={[x * 2.45, 4.64, z * 2.45]} s={1.0} S={S} />)}
        {/* slab and turret level 2, tucked against the tower */}
        <Box s={[3.5, 0.14, 3.5]} p={[0, 4.72, 0]} m={S.stoneD} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Kiosk key={`b${x}${z}`} p={[x * 1.7, 4.79, z * 1.7]} s={0.75} S={S} />)}

        {/* stout curved shikhara with vertical ribs on the bhadra bands */}
        <mesh geometry={tg} material={towerM} castShadow receiveShadow />
        <Inst items={ribs} m={S.stoneD} />
        {/* sub-turrets stepping up the corners */}
        {[0.2, 0.42, 0.62].map((t, i) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
          <MiniSpire key={`${i}${x}${z}`} p={[x * tw(t) * 0.95, TY0 + TH * t - 0.12, z * tw(t) * 0.95]} s={0.95 - i * 0.18} S={S} />
        )))}
        {/* three stacked projecting niche bands on every face */}
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
            {[[0.2, 1.0], [0.42, 0.82], [0.64, 0.62]].map(([t, sc]) => (
              <group key={t} position={[0, TY0 + TH * t, tw(t) * BH * 0.95 + 0.02]}>
                <NicheBand S={S} sc={sc} />
              </group>
            ))}
          </group>
        ))}

        {/* amalaka, kalasa and the slim gilded pinnacle */}
        <Box s={[0.9, 0.12, 0.9]} p={[0, A + 0.02, 0]} m={S.stoneD} />
        <Ball rad={0.52} sc={[1, 0.55, 1]} p={[0, A + 0.28, 0]} m={S.stoneL} />
        <Cyl rt={0.22} rb={0.32} h={0.14} p={[0, A + 0.6, 0]} m={S.stone} seg={14} />
        <Ball rad={0.22} p={[0, A + 0.86, 0]} m={M.gold} />
        <Cyl rt={0.07} rb={0.1} h={0.18} p={[0, A + 1.08, 0]} m={M.gold} seg={10} />
        <Ball rad={0.1} p={[0, A + 1.26, 0]} m={M.gold} />
        <mesh position={[0, A + 1.9, 0]} material={M.plain('#3a342e', { metalness: 0.6, roughness: 0.4 })}><coneGeometry args={[0.04, 1.3, 6]} /></mesh>

        {/* the stone beasts at the plinth corners (few and small) */}
        {[-1, 1].map((x) => (
          <group key={x} position={[x * 3.0, 0.3, 3.0]}>
            <Box s={[0.6, 0.4, 0.6]} p={[0, 0.2, 0]} m={S.stone} />
            <group position={[0, 0.4, 0]} scale={1.25}><Lion m={S.stoneL} /></group>
          </group>
        ))}

        {/* the barking bell: stone posts and beam on a pedestal on the plinth */}
        <group position={[1.95, 0.6, 2.62]}>
          <Box s={[1.2, 0.2, 0.5]} p={[0, 0.1, 0]} m={S.stoneD} />
          {[-0.45, 0.45].map((x) => <Box key={x} s={[0.2, 1.3, 0.2]} p={[x, 0.85, 0]} m={S.stone} />)}
          <Box s={[1.2, 0.16, 0.26]} p={[0, 1.58, 0]} m={S.stoneD} />
          <mesh geometry={bellGeo} position={[0, 1.2, 0]} scale={0.55} material={M.plain('#6a5528', { metalness: 0.75, roughness: 0.4 })} castShadow />
        </group>

        <Diyo p={[-1.2, 0.9, 2.2]} light />
        <Diyo p={[1.2, 0.9, 2.2]} />
        <pointLight position={[0, 2.2, 2.6]} intensity={1.4} distance={7} color="#ffb060" />
      </group>
    );
  }

  /* Taleju Bell: chunky stone pillars and beam on a pedestal, joined to the plinth by a continuous step (front-left) */
  function BellPlatform() {
    const M = useM();
    const S = useStone(M);
    const bellHip = useMemo(() => hipGeometry(4.0, 1.9, 0.7), []);
    const bellTile = M.mat('roof', 3, 2, { color: '#9a8678' });
    return (
      <group position={[-5.0, 0, 1.8]}>
        <Box s={[3.6, 0.45, 3.2]} p={[0, 0.225, 0]} m={S.stoneL} />
        <Box s={[1.3, 0.3, 3.0]} p={[2.5, 0.15, 0]} m={S.stoneL} />
        <Box s={[0.9, 0.3, 2.6]} p={[2.4, 0.45, 0]} m={S.stone} />
        <Box s={[3.3, 0.35, 2.9]} p={[0, 0.62, 0]} m={S.stone} />
        {[-1, 1].map((x) => (
          <group key={x}>
            <Box s={[0.6, 0.2, 0.6]} p={[x * 1.15, 0.89, 0]} m={S.stoneD} />
            <Box s={[0.4, 2.4, 0.4]} p={[x * 1.15, 2.2, 0]} m={S.stone} />
            <Box s={[0.56, 0.16, 0.56]} p={[x * 1.15, 3.45, 0]} m={S.stoneD} />
          </group>
        ))}
        <Box s={[2.9, 0.3, 0.46]} p={[0, 3.64, 0]} m={S.cornice} />
        <Box s={[3.2, 0.12, 0.7]} p={[0, 3.85, 0]} m={S.stone} />
        <mesh geometry={bellHip} material={bellTile} position={[0, 3.9, 0]} castShadow />
        {[-1.3, -0.65, 0, 0.65, 1.3].map((x) => <Box key={x} s={[0.1, 0.4, 0.5]} p={[x, 3.55, 0.35]} r={[0.6, 0, 0]} m={S.cornice} cast={false} />)}
        <Box s={[0.12, 0.14, 0.14]} p={[0, 3.42, 0]} m={M.dark} />
        <mesh geometry={bellGeo} position={[0, 2.9, 0]} scale={1.15} material={M.plain('#7a5f2a', { metalness: 0.8, roughness: 0.35 })} castShadow />
      </group>
    );
  }

  /* Bhupatindra Malla column with the kneeling gilded king under a hood and a bird finial */
  function KingColumn() {
    const M = useM();
    const S = useStone(M);
    return (
      <group position={[-7.0, 0, 4.2]}>
        <Box s={[1.1, 0.3, 1.1]} p={[0, 0.15, 0]} m={S.stoneL} />
        <Box s={[0.8, 0.4, 0.8]} p={[0, 0.5, 0]} m={S.stone} />
        <Cyl rt={0.2} rb={0.26} h={3.2} p={[0, 2.3, 0]} m={S.stoneL} seg={12} />
        <Cyl rt={0.3} rb={0.2} h={0.2} p={[0, 4.0, 0]} m={S.stoneD} seg={12} />
        <Box s={[0.6, 0.16, 0.6]} p={[0, 4.18, 0]} m={S.stone} />
        <group position={[0, 4.26, 0]}>
          <Box s={[0.42, 0.14, 0.34]} p={[0, 0.07, 0]} m={M.gold} />
          <Box s={[0.24, 0.34, 0.16]} p={[0, 0.3, 0]} m={M.gold} />
          <Ball rad={0.1} p={[0, 0.56, 0]} m={M.gold} />
          <mesh position={[0, 0.78, -0.02]} material={M.gold}><sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Cyl rt={0.02} h={0.28} p={[0, 1.06, 0]} m={M.gold} seg={6} />
          <Ball rad={0.07} sc={[1, 1, 1.5]} p={[0, 1.24, 0]} m={M.plain('#3a342e')} />
          <mesh position={[0, 1.24, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={M.plain('#3a342e')}><coneGeometry args={[0.03, 0.12, 6]} /></mesh>
        </group>
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Temple />
        <BellPlatform />
        <KingColumn />
        <Frame s={[11, 13.6, 8]} p={[-2.4, 6.8, 1.0]} />
      </group>
    );
  }

  /* ------------------------------------------------------------------ surroundings */
  function Palace() {
    const M = useM();
    const brick = M.mat('brick', 12, 3, { color: '#d2baa9' });
    const dark = M.plain('#2e2016', { roughness: 0.85 });
    const wood = M.plain('#5a3a22', { roughness: 0.8 });
    const glow = M.plain('#c99a6a', { emissive: '#a8743a', emissiveIntensity: 0.15, roughness: 0.7 });
    const tile = M.mat('roof', 12, 4, { color: '#9a8678' });
    const L = 30;
    const D = 5;
    const hip = useMemo(() => hipGeometry(L + 2.4, D + 2.6, 1.5), []);
    const doors = useMemo(() => range(8, (k) => [(k - 3.5) * 3.2, 1.3, D / 2 + 0.03, k % 3 === 0 ? 1.6 : 1.1, 2.0, 0.08]), []);
    const wins = useMemo(() => range(27, (k) => [(k - 13) * 1.08, 4.45 + (k % 5 === 2 ? 0.08 : 0), D / 2 + 0.06, k % 4 === 0 ? 0.8 : 0.62, k % 4 === 0 ? 1.0 : 0.85, 0.12]), []);
    const winGlow = useMemo(() => range(27, (k) => (k % 6 === 3 ? [0, -10, 0, 0.01, 0.01, 0.01] : [(k - 13) * 1.08, 4.45, D / 2 + 0.09, 0.4, 0.62, 0.1])), []);
    const lowWins = useMemo(() => range(26, (k) => [(k - 12.5) * 1.15, 2.95, D / 2 + 0.05, 0.5, 0.55, 0.1]), []);
    return (
      <group position={[-11.5, 0, -10]}>
        <Box s={[L, 5.6, D]} p={[0, 2.8, 0]} m={brick} />
        <Box s={[L + 0.3, 0.25, D + 0.3]} p={[0, 0.12, 0]} m={M.stone} />
        <Inst items={doors} m={dark} />
        <Inst items={lowWins} m={wood} />
        <Inst items={wins} m={wood} />
        <Inst items={winGlow} m={glow} />
        <Box s={[L + 0.2, 0.28, D + 0.3]} p={[0, 3.55, 0]} m={wood} />
        <Box s={[L + 0.4, 0.3, D + 0.6]} p={[0, 5.45, 0]} m={wood} />
        <mesh geometry={hip} material={tile} position={[0, 5.6, 0]} castShadow receiveShadow />
        {range(31, (i) => <Box key={i} s={[0.12, 0.6, 0.9]} p={[-L / 2 + 0.6 + i * 0.97, 5.1, D / 2 + 0.7]} r={[0.5, 0, 0]} m={wood} cast={false} />)}
      </group>
    );
  }
  function SideBuilding({ p, w, d, h, r = 0 }) {
    const M = useM();
    const brick = M.mat('brick', 4, 2, { color: '#d2baa9' });
    const wood = M.plain('#5a3a22');
    const tile = M.mat('roof', 4, 3, { color: '#9a8678' });
    const hip = useMemo(() => hipGeometry(w + 2, d + 2, 1.3), [w, d]);
    const levels = Math.max(1, Math.round(h / 2.2));
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={brick} />
        {range(levels, (i) => (
          <group key={i}>
            <Box s={[w + 0.3, 0.16, d + 0.3]} p={[0, 1 + i * 2.2, 0]} m={wood} />
            {range(Math.max(2, Math.round(w / 1.4)), (k) => <Box key={k} s={[0.6, 0.8, 0.1]} p={[-w / 2 + 0.9 + k * 1.4, 1.6 + i * 2.2, d / 2 + 0.05]} m={wood} cast={false} />)}
          </group>
        ))}
        <Box s={[w + 2, 0.18, d + 2]} p={[0, h, 0]} m={wood} />
        <mesh geometry={hip} material={tile} position={[0, h + 0.05, 0]} castShadow />
      </group>
    );
  }
  /* a distant small stone shikhara in the manner of Siddhi Lakshmi, seen down the square */
  function FarShikhara({ p }) {
    const M = useM();
    const st = M.plain('#a89a82', { roughness: 0.97 });
    const stD = M.plain('#6f6250', { roughness: 0.97 });
    return (
      <group position={p}>
        <Box s={[5.2, 0.5, 5.2]} p={[0, 0.25, 0]} m={st} />
        <Box s={[4.4, 0.5, 4.4]} p={[0, 0.75, 0]} m={st} />
        <Box s={[3.2, 2.2, 3.2]} p={[0, 2.1, 0]} m={stD} />
        <Box s={[4.0, 0.4, 4.0]} p={[0, 3.4, 0]} m={st} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <mesh key={`${x}${z}`} geometry={miniSpireGeo} material={st} position={[x * 1.6, 3.6, z * 1.6]} scale={[1.2, 1.6, 1.2]} />)}
        <mesh geometry={miniSpireGeo} material={st} position={[0, 3.6, 0]} scale={[4.0, 5.6, 4.0]} castShadow />
        <Ball rad={0.35} p={[0, 9.4, 0]} m={M.gold} />
      </group>
    );
  }
  function Env() {
    const M = useM();
    const paving = M.mat('herring', 26, 26, { color: '#b0937c' });
    const far = M.mat('brick', 3, 2, { color: '#d2baa9' });
    const tile = M.mat('roof', 3, 3, { color: '#b79a88' });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow material={paving}><planeGeometry args={[110, 110]} /></mesh>
        <GroundDisc r={90} y={-0.06} m={M.mat('stone', 40, 40, { color: '#c9b49a' })} />
        <Palace />
        {/* low brick houses with tile eaves closing the square left and right */}
        <SideBuilding p={[15.5, 0, -3]} w={6} d={7} h={6.6} />
        <SideBuilding p={[-21, 0, 3]} w={6} d={7} h={5.6} />
        <SideBuilding p={[-17, 0, 12]} w={5} d={4.5} h={4.4} />
        <FarShikhara p={[25, 0, 6]} />
        {/* low shrines on the plaza and a hazy horizon of valley hills behind the old town */}
        {[[-14, 0, 17], [20, 0, 15], [3, 0, 24]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <Box s={[1.4, 0.4, 1.4]} p={[0, 0.2, 0]} m={M.stone} />
            <Box s={[0.8, 0.9, 0.8]} p={[0, 0.85, 0]} m={M.plain('#8d8575')} />
            <mesh position={[0, 1.7, 0]} material={M.plain('#8a8272')}><coneGeometry args={[0.5, 1.0, 6]} /></mesh>
          </group>
        ))}
        {range(7, (i) => (
          <mesh key={`h${i}`} position={[-60 + i * 20, 0, -75]} scale={[1, 0.32, 0.5]} material={M.plain(i % 2 ? '#a3a994' : '#97a08a', { roughness: 1 })}><coneGeometry args={[22, 30, 10]} /></mesh>
        ))}
        {/* the far roofs of the old town behind the palace, all lower than the shikhara */}
        {range(11, (i) => {
          const x = -42 + i * 8.6;
          const h = 5.5 + (i % 3);
          return (
            <group key={i} position={[x, 0, -30 - (i % 2) * 3]}>
              <Box s={[7, h, 6]} p={[0, h / 2, 0]} m={far} />
              <mesh position={[0, h, 0]} material={tile} castShadow><coneGeometry args={[5.4, 1.8, 4]} /></mesh>
            </group>
          );
        })}
        {/* small shrine plinths on the plaza, kept low */}
        <Box s={[1.6, 0.45, 1.6]} p={[8, 0.22, 9]} m={M.stone} />
        <Box s={[1.1, 0.8, 1.1]} p={[8, 0.85, 9]} m={M.plain('#d8d0c0')} />
        <mesh position={[8, 1.65, 9]} material={M.plain('#a89a82')}><coneGeometry args={[0.55, 0.9, 8]} /></mesh>
      </group>
    );
  }

  return { 'vatsala-durga-temple': { Main, Env } };
}
