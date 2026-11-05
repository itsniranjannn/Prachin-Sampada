// Rani Pokhari (Queen's Pond), Kathmandu. A big rectangular brick-walled tank (modelled at 1 unit = 3 m, so the pond is 60 x 46.7 units
// for about 180 x 140 m). A slender white shikhara temple on a red-brick sanctum and a 2-step plinth stands in the water, joined to the east
// bank by a red-brick causeway of ten arches that runs diagonally so its arched flank faces the viewer. Compass in this scene: east = -z
// (causeway, Ghantaghar, city), west = +z (Durbar High School), south = +x (Tundikhel park, the stone elephant with Pratap Malla and his
// two sons), north = -x (Ratna Park, Shivapuri ridge). The default camera looks from the south-west across the water.
// Water level y = 0, street level y = YT.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Elephant, THREE, useMemo, useRef, useEffect, useState } = K;

  const PW = 60, PD = 46.7, HX = PW / 2, HZ = PD / 2, YT = 1.8, INS = 0.4;
  const ISL = 2.4;                       // local distance where the causeway arches begin (island edge)
  const TZ = -10;                        // the temple island lies 5 units toward the east bank
  const ANG = 0;                         // causeway runs straight and perpendicular to the east bank; the default camera looks obliquely (about 35 degrees off its axis)
  const GHX = -20, GHZ = -(HZ + 6), GHS = 1.2;     // Ghantaghar position and scale
  const BANKZ = HZ - INS;                // z where the sloping bank meets the water
  const CH = 1.9;                        // causeway deck height above the water (about 6 m)
  const PLINTH_TOP = CH;

  const mkRng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  /* ---------- instanced boxes / cylinders / spheres with per-instance colour ---------- */
  function Inst({ items, m, kind = 'box', cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D(); const c = new THREE.Color();
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]); o.rotation.set(0, it[6] || 0, 0); o.scale.set(it[3], it[4], it[5]);
        o.updateMatrix(); ref.current.setMatrixAt(i, o.matrix);
        if (it[7]) { c.set(it[7]); ref.current.setColorAt(i, c); }
      });
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, items.length]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : kind === 'cyl' ? <cylinderGeometry args={[0.5, 0.5, 1, 8]} /> : <sphereGeometry args={[0.5, 9, 7]} />}
      </instancedMesh>
    );
  }

  /* ---------- geometry helpers ---------- */
  const ringGeo = (ox, oz, ix, iz, depth) => {
    const s = new THREE.Shape();
    s.moveTo(-ox, -oz); s.lineTo(ox, -oz); s.lineTo(ox, oz); s.lineTo(-ox, oz); s.closePath();
    const h = new THREE.Path();
    h.moveTo(-ix, -iz); h.lineTo(-ix, iz); h.lineTo(ix, iz); h.lineTo(ix, -iz); h.closePath();
    s.holes.push(h);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  };

  /** Curvilinear (Nagara) shikhara: squarish plan, bullet profile, scaled bands like stacked amalakas. */
  const spireGeometry = (W0, H, Wtop, bands = 9, amp = 0.06) => {
    const NR = 54, NS = 48, pos = [], idx = [];
    for (let i = 0; i <= NR; i += 1) {
      const t = i / NR;
      let w = Wtop + (W0 - Wtop) * Math.pow(Math.max(0, 1 - Math.pow(t, 1.45)), 0.85);
      const f = (t * bands) % 1;
      w *= 1 + amp * Math.pow(1 - f, 3) * (1 - t * 0.6);
      for (let j = 0; j < NS; j += 1) {
        const a = (j / NS) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), k = 0.4;
        const rib = 1 + 0.16 * Math.cos(4 * a);
        pos.push(Math.sign(c) * Math.pow(Math.abs(c), k) * w * rib, t * H, Math.sign(s) * Math.pow(Math.abs(s), k) * w * rib);
      }
    }
    for (let i = 0; i < NR; i += 1) for (let j = 0; j < NS; j += 1) {
      const a = i * NS + j, b = i * NS + ((j + 1) % NS), c = (i + 1) * NS + j, d = (i + 1) * NS + ((j + 1) % NS);
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  };

  const archShape = (w, hStraight) => {
    const r = w / 2, s = new THREE.Shape();
    s.moveTo(-r, 0); s.lineTo(-r, hStraight); s.absarc(0, hStraight, r, Math.PI, 0, true); s.lineTo(r, 0); s.closePath();
    return s;
  };

  /* ================================================================ TEMPLE ================================================================ */
  function Spire({ W0, H, Wtop, m, bands, amp }) {
    const geo = useMemo(() => spireGeometry(W0, H, Wtop, bands, amp), [W0, H, Wtop, bands, amp]);
    return <mesh geometry={geo} material={m} castShadow receiveShadow />;
  }

  function Temple({ glow = false }) {
    const M = useM();
    const [dusk, ref] = useDusk();
    const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.72, emissive: '#ffe6b0', emissiveIntensity: dusk ? 0.55 : 0 }), [dusk]);
    const cream = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e9dec7', roughness: 0.85, emissive: '#ffb860', emissiveIntensity: dusk ? 0.28 : 0 }), [dusk]);
    const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1e3d2', roughness: 0.9, emissive: '#ff8a40', emissiveIntensity: dusk ? 0.45 : 0 }), [dusk]);
    const door = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1810', roughness: 0.9, emissive: '#ff8a2a', emissiveIntensity: dusk ? 1.4 : 0 }), [dusk]);
    const gold = M.gold;
    const arch = useMemo(() => new THREE.ShapeGeometry(archShape(0.9, 0.75)), []);
    const frame = useMemo(() => new THREE.ShapeGeometry(archShape(1.2, 0.8)), []);
    const SY = PLINTH_TOP;                    // sanctum base
    const SH = 1.8;                           // sanctum height (brick base under the white spire)
    const CY = SY + SH;                       // cornice level
    const bandY = CY + 0.16;                  // spire base
    const HW = 1.1;                           // sanctum half width
    const SPH = 6.5;                          // main spire height
    return (
      <group ref={ref}>
        {/* two plinth steps, pale plaster over brick */}
        <Box s={[4.0, 0.95, 4.0]} p={[0, 0.475, 0]} m={cream} />
        <Box s={[3.6, 0.95, 3.6]} p={[0, 1.425, 0]} m={cream} />
        <Box s={[3.65, 0.05, 3.65]} p={[0, CH, 0]} m={white} />
        {/* sanctum cube: red brick walls, white plinth band, pilasters and cornice */}
        <Box s={[2.2, SH, 2.2]} p={[0, SY + SH / 2, 0]} m={wall} />
        <Box s={[2.3, 0.45, 2.3]} p={[0, SY + 0.225, 0]} m={M.mat('brick', 1, 0.5, { color: '#c4664d' })} />
        <Box s={[2.35, 0.22, 2.35]} p={[0, SY + 0.11, 0]} m={white} />
        {[-1, 1].map((a) => [-1, 1].map((b) => <Box key={`p${a}${b}`} s={[0.22, SH - 0.2, 0.22]} p={[a * HW, SY + SH / 2 + 0.1, b * HW]} m={white} />))}
        <Box s={[2.55, 0.14, 2.55]} p={[0, CY - 0.07, 0]} m={white} />
        <Box s={[3.4, 0.22, 3.4]} p={[0, CY + 0.07, 0]} m={white} />
        {/* four arched doorways, one per face */}
        {[0, 1, 2, 3].map((i) => (
          <group key={`d${i}`} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh geometry={frame} material={white} position={[0, SY + 0.26, HW + 0.005]} />
            <mesh geometry={arch} material={door} position={[0, SY + 0.26, HW + 0.015]} />
            <Box s={[1.4, 0.12, 0.2]} p={[0, SY + 1.4, HW + 0.05]} m={white} />
          </group>
        ))}
        {/* main curvilinear spire, ribbed, with banded tiers (about 1:2 base to spire) */}
        <group position={[0, bandY, 0]}>
          <Spire W0={0.85} H={SPH} Wtop={0.26} m={white} bands={14} amp={0.2} />
          <Box s={[1.62, 0.16, 1.62]} p={[0, SPH * 0.55, 0]} m={white} />
          <Box s={[1.5, 0.08, 1.5]} p={[0, SPH * 0.55 - 0.14, 0]} m={cream} />
        </group>
        {/* four corner spirelets round the central rise */}
        {[-1, 1].map((a) => [-1, 1].map((b) => (
          <group key={`c${a}${b}`} position={[a * 1.28, bandY, b * 1.28]}><Spire W0={0.38} H={2.2} Wtop={0.07} m={white} bands={6} amp={0.15} /><Ball rad={0.07} p={[0, 2.27, 0]} m={gold} /></group>
        )))}
        {/* amalaka (ribbed disc), kalasha and finial */}
        <Cyl rt={0.5} rb={0.5} h={0.16} p={[0, bandY + SPH + 0.07, 0]} m={white} seg={20} />
        <Cyl rt={0.3} rb={0.46} h={0.1} p={[0, bandY + SPH + 0.2, 0]} m={white} seg={20} />
        <Cyl rt={0.14} rb={0.2} h={0.18} p={[0, bandY + SPH + 0.34, 0]} m={white} seg={12} />
        <Ball rad={0.17} p={[0, bandY + SPH + 0.56, 0]} m={white} sc={[1, 1.15, 1]} />
        <Cyl rt={0.02} rb={0.05} h={0.55} p={[0, bandY + SPH + 0.95, 0]} m={gold} seg={8} />
        <Ball rad={0.07} p={[0, bandY + SPH + 1.24, 0]} m={gold} />
        {dusk && glow && <pointLight position={[0, 3.6, 4.0]} intensity={9} distance={14} color="#ffe9c4" />}
        {dusk && glow && <pointLight position={[0, 7.6, 1.5]} intensity={5} distance={9} color="#fff4dc" />}
      </group>
    );
  }

  /* ================================================================ CAUSEWAY ================================================================ */
  const N_ARCH = 9;
  const CW_T = (BANKZ + TZ) / Math.cos(ANG);        // local distance from the temple centre to the bank
  const CW_L = CW_T - ISL;
  const CW_W = 2.4;                                 // deck width
  function Causeway() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const brick = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cf6e56', roughness: 0.95, emissive: '#7a301e', emissiveIntensity: 0.45 }), []);
    const coping = M.plain('#e2d3b8', { roughness: 0.9 });
    const recess = M.plain('#2a120c', { roughness: 1 });
    const pitch = CW_L / N_ARCH, r = pitch * 0.4, SH0 = 0.6;
    const geo = useMemo(() => {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.lineTo(CW_L, 0); sh.lineTo(CW_L, CH); sh.lineTo(0, CH); sh.closePath();
      for (let i = 0; i < N_ARCH; i += 1) {
        const cx = (i + 0.5) * pitch, p = new THREE.Path();
        p.moveTo(cx - r, 0.03); p.lineTo(cx - r, SH0); p.absarc(cx, SH0, r, Math.PI, 0, true); p.lineTo(cx + r, 0.03); p.closePath();
        sh.holes.push(p);
      }
      const g = new THREE.ExtrudeGeometry(sh, { depth: CW_W, bevelEnabled: false });
      g.translate(0, 0, -CW_W / 2);
      return g;
    }, [pitch, r]);
    const glowGeo = useMemo(() => new THREE.ShapeGeometry(archShape(r * 2 * 0.96, SH0)), [r]);
    const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff9a3a', side: THREE.DoubleSide, toneMapped: false }), []);
    const mid = ISL + CW_L / 2;
    return (
      <group ref={ref}>
        <mesh geometry={geo} material={brick} position={[0, 0, -ISL]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow />
        {/* dark recessed back wall so the openings read in daylight */}
        <Box s={[0.12, CH - 0.15, CW_L - 0.1]} p={[0, (CH - 0.15) / 2 + 0.03, -mid]} m={recess} cast={false} />
        {/* solid abutments at both ends */}
        <Box s={[CW_W, CH, ISL - 1.0]} p={[0, CH / 2, -(1.0 + ISL) / 2]} m={brick} />
        <Box s={[CW_W, CH, 2.6]} p={[0, CH / 2, -(CW_T + 0.8)]} m={brick} />
        {/* pale string course above the arches on both faces, and a footing course */}
        {[-1, 1].map((s) => <Box key={`sc${s}`} s={[0.12, 0.1, CW_L + 0.1]} p={[s * (CW_W / 2 + 0.03), SH0 + r + 0.1, -mid]} m={coping} cast={false} />)}
        {[-1, 1].map((s) => <Box key={`sb${s}`} s={[0.12, 0.06, CW_L + 0.1]} p={[s * (CW_W / 2 + 0.03), 0.08, -mid]} m={coping} cast={false} />)}
        {/* roadway and brick parapets with coping */}
        <Box s={[CW_W, 0.03, CW_L + 2.4]} p={[0, CH + 0.015, -mid - 0.6]} m={M.plain('#b7a58d', { roughness: 1 })} cast={false} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[0.22, 0.3, CW_L + 2.4]} p={[s * (CW_W / 2 - 0.11), CH + 0.15, -mid - 0.6]} m={brick} />
            <Box s={[0.32, 0.07, CW_L + 2.4]} p={[s * (CW_W / 2 - 0.11), CH + 0.33, -mid - 0.6]} m={coping} />
          </group>
        ))}
        {/* lamp glow in every arch at dusk */}
        {dusk && Array.from({ length: N_ARCH }, (_, i) => (
          <group key={i}>{[-0.95, 0, 0.95].map((x) => <mesh key={x} geometry={glowGeo} material={glowMat} position={[x, 0.03, -(ISL + (i + 0.5) * pitch)]} rotation={[0, Math.PI / 2, 0]} />)}</group>
        ))}
        {dusk && <pointLight position={[2.5, 0.9, -mid]} intensity={7} distance={13} color="#ff9a3c" />}
      </group>
    );
  }

  /* the temple island with its causeway, shared by the real and the mirrored copy */
  function Island({ glow }) {
    return (
      <group position={[0, 0, TZ]}>
        <Temple glow={glow} />
        <Causeway />
      </group>
    );
  }

  /* ================================================================ GHANTAGHAR ================================================================ */
  function Ghantaghar() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 0.8, emissive: '#ffe2a8', emissiveIntensity: dusk ? 0.3 : 0 }), [dusk]);
    const grey = M.plain('#b9b2a6', { roughness: 0.9 });
    const face = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbf8ee', roughness: 0.5, emissive: '#ffe9a8', emissiveIntensity: dusk ? 1.4 : 0 }), [dusk]);
    const dark = M.plain('#2b2a2e', { roughness: 0.7 });
    const roofm = M.plain('#d4cfc2', { roughness: 0.8 });
    const arch = useMemo(() => new THREE.ShapeGeometry(archShape(0.7, 0.9)), []);
    const archM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#34343a', roughness: 0.9, emissive: '#ffb060', emissiveIntensity: dusk ? 0.8 : 0 }), [dusk]);
    return (
      <group ref={ref}>
        <Box s={[2.7, 0.3, 2.7]} p={[0, 0.15, 0]} m={grey} />
        <Box s={[2.1, 2.5, 2.1]} p={[0, 1.55, 0]} m={white} />
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <mesh geometry={arch} material={archM} position={[0, 0.3, 1.056]} />
            <Box s={[0.12, 2.5, 0.08]} p={[0.95, 1.55, 1.06]} m={grey} />
            <Box s={[0.12, 2.5, 0.08]} p={[-0.95, 1.55, 1.06]} m={grey} />
          </group>
        ))}
        <Box s={[2.35, 0.18, 2.35]} p={[0, 2.89, 0]} m={grey} />
        {/* slim shaft */}
        <Box s={[1.5, 3.2, 1.5]} p={[0, 4.5, 0]} m={white} />
        {[0, 1, 2].map((k) => <Box key={k} s={[1.64, 0.08, 1.64]} p={[0, 3.6 + k * 1.0, 0]} m={grey} />)}
        {[0, 1, 2, 3].map((i) => (
          <group key={`w${i}`} rotation={[0, (i * Math.PI) / 2, 0]}>
            <Box s={[0.3, 0.7, 0.04]} p={[0, 4.15, 0.76]} m={archM} />
            <Box s={[0.3, 0.7, 0.04]} p={[0, 5.15, 0.76]} m={archM} />
          </group>
        ))}
        <Box s={[1.9, 0.16, 1.9]} p={[0, 6.18, 0]} m={grey} />
        {/* clock stage, a clock face on every side */}
        <Box s={[1.65, 1.3, 1.65]} p={[0, 6.9, 0]} m={white} />
        {[0, 1, 2, 3].map((i) => (
          <group key={`f${i}`} rotation={[0, (i * Math.PI) / 2, 0]}>
            <Cyl rt={0.58} h={0.06} p={[0, 6.9, 0.84]} r={[Math.PI / 2, 0, 0]} m={dark} seg={28} />
            <Cyl rt={0.5} h={0.07} p={[0, 6.9, 0.85]} r={[Math.PI / 2, 0, 0]} m={face} seg={28} />
            <Box s={[0.05, 0.36, 0.03]} p={[0, 7.0, 0.89]} m={dark} cast={false} />
            <Box s={[0.26, 0.05, 0.03]} p={[0.1, 6.9, 0.89]} m={dark} cast={false} />
          </group>
        ))}
        <Box s={[1.95, 0.16, 1.95]} p={[0, 7.62, 0]} m={grey} />
        {/* small open cupola on four pillars, bell inside, then a tall pointed roof */}
        {[-1, 1].map((a) => [-1, 1].map((b) => <Box key={`b${a}${b}`} s={[0.14, 1.0, 0.14]} p={[a * 0.62, 8.2, b * 0.62]} m={white} />))}
        <Ball rad={0.2} p={[0, 8.15, 0]} m={M.copper} sc={[1, 1.2, 1]} />
        <Box s={[1.7, 0.14, 1.7]} p={[0, 8.77, 0]} m={grey} />
        <mesh position={[0, 9.9, 0]} rotation={[0, Math.PI / 4, 0]} material={roofm} castShadow><coneGeometry args={[1.0, 2.2, 4]} /></mesh>
        <Cyl rt={0.02} rb={0.05} h={0.9} p={[0, 11.3, 0]} m={M.copper} seg={8} />
        <Ball rad={0.09} p={[0, 11.78, 0]} m={M.copper} />
      </group>
    );
  }

  /* ================================================================ SMALL SHRINE ================================================================ */
  function Shrine({ p, rot = 0 }) {
    const M = useM();
    const cream = M.plain('#efe4cb', { roughness: 0.85 });
    const brick = M.mat('brick', 1, 1, { color: '#dba086' });
    const spire = M.plain('#f2ede2', { roughness: 0.8 });
    const arch = useMemo(() => new THREE.ShapeGeometry(archShape(0.32, 0.18)), []);
    return (
      <group position={[p[0], YT, p[1]]} rotation={[0, rot, 0]}>
        <Box s={[1.25, 0.2, 1.25]} p={[0, 0.1, 0]} m={cream} />
        <Box s={[0.85, 0.7, 0.85]} p={[0, 0.55, 0]} m={brick} />
        <Box s={[0.98, 0.1, 0.98]} p={[0, 0.95, 0]} m={cream} />
        <mesh geometry={arch} material={M.dark} position={[0, 0.25, 0.435]} />
        <group position={[0, 1.0, 0]}><Spire W0={0.4} H={1.0} Wtop={0.1} m={spire} bands={5} amp={0.07} /></group>
        <Cyl rt={0.11} rb={0.14} h={0.07} p={[0, 2.03, 0]} m={spire} seg={12} />
        <Ball rad={0.07} p={[0, 2.12, 0]} m={M.gold} />
      </group>
    );
  }

  /* ================================================================ ELEPHANT AND KING ================================================================ */
  function ElephantMonument({ p }) {
    const M = useM();
    const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c877f', roughness: 0.95 }), []);
    const plat = M.mat('brick', 0.6, 0.6, { color: '#d9a28a' });
    const gold = M.gold;
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-1.35, 0); s.lineTo(1.35, 0); s.lineTo(1.35, 1.65); s.lineTo(-1.35, 1.65); s.closePath();
      const h = new THREE.Path();
      h.moveTo(-0.7, 0.03); h.lineTo(-0.7, 0.75); h.absarc(0, 0.75, 0.7, Math.PI, 0, true); h.lineTo(0.7, 0.03); h.closePath();
      s.holes.push(h);
      const g = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false });
      g.translate(0, 0, -0.75);
      return g;
    }, []);
    return (
      <group position={[p[0], YT, p[1]]} scale={1.5}>
        <Box s={[3.6, 0.3, 3.2]} p={[0, 0.15, 0]} m={plat} />
        <mesh geometry={geo} material={stone} position={[0, 0.3, 0]} castShadow receiveShadow />
        <Box s={[2.9, 0.12, 1.7]} p={[0, 1.99, 0]} m={stone} />
        <group position={[0, 2.05, 0]} rotation={[0, -Math.PI / 2, 0]} scale={2.5}>
          <Elephant m={stone} />
          {/* the king and his two sons: three seated figures on the elephant's back */}
          {[[-0.14, 1], [0.02, 1.25], [0.17, 1]].map(([z, k], i) => (
            <group key={i} position={[0, 0.5, z]} scale={k}>
              <Box s={[0.1, 0.11, 0.09]} p={[0, 0.055, 0]} m={stone} />
              <Box s={[0.07, 0.06, 0.1]} p={[0, 0.02, 0.05]} m={stone} />
              <Ball rad={0.045} p={[0, 0.16, 0]} m={stone} />
              <Cyl rt={0.02} rb={0.045} h={0.05} p={[0, 0.215, 0]} m={i === 1 ? gold : stone} seg={8} />
            </group>
          ))}
        </group>
      </group>
    );
  }

  /* ================================================================ POND ================================================================ */
  function Pond() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const slopeLen = Math.hypot(INS, YT), slopeAng = Math.atan2(YT, INS);
    const brickX = M.mat('brick', YT / 2.2, PD / 2.2, { color: '#a84a36' });
    const brickZ = M.mat('brick', PW / 2.2, YT / 2.2, { color: '#a84a36' });
    const coping = M.plain('#c8a68c', { roughness: 0.9 });
    const stone = M.plain('#a8a094', { roughness: 0.95 });
    const water = useMemo(() => new THREE.MeshStandardMaterial({ color: dusk ? '#233556' : '#3f6470', transparent: true, opacity: dusk ? 0.82 : 0.85, roughness: 0.02, metalness: 0.3, envMapIntensity: dusk ? 1.0 : 1.2 }), [dusk]);
    const bed = useMemo(() => new THREE.MeshBasicMaterial({ color: dusk ? '#16203a' : '#2b4a50' }), [dusk]);
    const rail = M.plain('#2e2f33', { roughness: 0.6, metalness: 0.4 });
    const posts = useMemo(() => {
      const o = [];
      for (let x = -HX + 0.5; x <= HX - 0.4; x += 1.25) for (const sg of [-1, 1]) { if (sg < 0 && Math.abs(x) < 1.8) continue; o.push([x, YT + 0.27, sg * (HZ + 0.1), 0.04, 0.5, 0.04]); }
      for (let z = -HZ + 0.5; z <= HZ - 0.4; z += 1.25) for (const sg of [-1, 1]) o.push([sg * (HX + 0.1), YT + 0.27, z, 0.04, 0.5, 0.04]);
      return o;
    }, []);
    const spoutPos = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    return (
      <group ref={ref}>
        {/* water and the deep, dark bed that the mirror image sits above */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={water} receiveShadow renderOrder={2}><planeGeometry args={[PW - 0.1, PD - 0.1]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -13, 0]} material={bed}><planeGeometry args={[PW + 60, PD + 60]} /></mesh>
        {/* tall red-brick retaining wall with a slight batter, all round */}
        {[-1, 1].map((s) => (
          <Box key={`sx${s}`} s={[slopeLen, 0.12, PD]} p={[s * (HX - INS / 2), YT / 2, 0]} r={[0, 0, s * slopeAng]} m={brickX} cast={false} />
        ))}
        {[-1, 1].map((s) => (
          <Box key={`sz${s}`} s={[PW - 2 * INS, 0.12, slopeLen]} p={[0, YT / 2, s * (HZ - INS / 2)]} r={[-s * slopeAng, 0, 0]} m={brickZ} cast={false} />
        ))}
        {/* coping along the top of the wall */}
        {[-1, 1].map((s) => <Box key={`cx${s}`} s={[0.35, 0.12, PD + 0.3]} p={[s * (HX + 0.1), YT - 0.05, 0]} m={coping} />)}
        {[-1, 1].map((s) => <Box key={`cz${s}`} s={[PW + 0.3, 0.12, 0.35]} p={[0, YT - 0.05, s * (HZ + 0.1)]} m={coping} />)}
        {/* white balustrade on the coping: top rail and posts */}
        {[-1, 1].map((sg) => <Box key={`rx${sg}`} s={[0.05, 0.05, PD + 0.3]} p={[sg * (HX + 0.1), YT + 0.5, 0]} m={rail} cast={false} />)}
        {[-1, 1].map((sg) => <Box key={`rz${sg}`} s={[PW + 0.3, 0.05, 0.05]} p={[0, YT + 0.5, sg * (HZ + 0.1)]} m={rail} cast={false} />)}
        <Inst items={posts} m={rail} />
        {/* stone water spouts (dhunge dhara) near the four corners */}
        {spoutPos.map(([sx, sz], i) => (
          <group key={`sp${i}`} position={[sx * (HX - 0.28), 0.55 * YT, sz * (HZ - 2.2)]} rotation={[0, sx > 0 ? 0 : Math.PI, 0]}>
            <Box s={[0.34, 0.3, 0.5]} p={[0, 0, 0]} m={stone} />
            <Cyl rt={0.05} h={0.3} p={[-0.3, -0.04, 0]} r={[0, 0, Math.PI / 2]} m={stone} seg={8} />
          </group>
        ))}
      </group>
    );
  }

  /* ================================================================ MAIN ================================================================ */
  function Reflected() {
    return (
      <group scale={[1, -1, 1]}>
        <Island />
        <group position={[GHX, YT, GHZ]} scale={GHS}><Ghantaghar /></group>
      </group>
    );
  }

  function RaniMain() {
    return (
      <group>
                <Pond />
        <Reflected />
        <Island glow />
        {/* the four small corner shrines (Bhairava, Mahalaxmi, Ganesh) */}
        <Shrine p={[-(HX + 0.85), -(HZ + 0.85)]} rot={Math.PI * 0.25} />
        <Shrine p={[HX + 0.85, -(HZ + 0.85)]} rot={-Math.PI * 0.25} />
        <Shrine p={[HX + 0.85, HZ + 0.85]} rot={-Math.PI * 0.75} />
        <Shrine p={[-(HX + 0.85), HZ + 0.85]} rot={Math.PI * 0.75} />
        {/* the stone elephant carrying Pratap Malla and his sons, on the south bank near the camera corner */}
        <ElephantMonument p={[HX + 2.8, -17]} />
      </group>
    );
  }

  /* ================================================================ ENV ================================================================ */
  // brick red, cream, sand, white plaster, deep brick, buff
  const PAL = ['#e8dcc0', '#c0644c', '#d9bd98', '#f2ede0', '#b25a42', '#e2cfa8'];
  const ROOFC = ['#a4543c', '#8e4a38', '#7d7468'];

  function makeFacades(dusk) {
    return PAL.map((wall, n) => {
      const rnd = mkRng(100 + n * 7);
      const col = document.createElement('canvas'); col.width = col.height = 256;
      const em = document.createElement('canvas'); em.width = em.height = 256;
      const g = col.getContext('2d'), e = em.getContext('2d');
      g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
      e.fillStyle = '#000'; e.fillRect(0, 0, 256, 256);
      for (let r = 0; r < 4; r += 1) for (let c = 0; c < 2; c += 1) {
        const x = c * 128 + 40, y = r * 64 + 12;
        g.fillStyle = 'rgba(255,245,225,0.55)'; g.fillRect(x - 4, y - 4, 52, 52);
        g.fillStyle = '#4a3a30'; g.fillRect(x, y, 44, 44);
        g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, y, 44, 8);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(c * 128, r * 64 + 60, 128, 4);
        if (rnd() < 0.5) { e.fillStyle = rnd() < 0.5 ? '#ffd27a' : '#ffb458'; e.fillRect(x, y, 44, 44); }
      }
      const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
      const map = mk(col, true), emap = mk(em, true);
      const side = new THREE.MeshStandardMaterial({ map, roughness: 0.9, emissive: '#ffffff', emissiveMap: emap, emissiveIntensity: dusk ? 1.6 : 0 });
      const roof = new THREE.MeshStandardMaterial({ color: '#8e8a84', roughness: 1 });
      return [side, side, roof, roof, side, side];
    });
  }

  /** A low city building: flat parapet roof or pitched clay-tile hip roof. */
  function Block({ p, w, h, d, mats, k, roof = 0 }) {
    const geo = useMemo(() => {
      const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
      const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f += 1) for (let v = 0; v < 4; v += 1) { const i = f * 4 + v; uv.setXY(i, (uv.getX(i) * dims[f][0]) / 4, (uv.getY(i) * dims[f][1]) / 4); }
      return g;
    }, [w, h, d]);
    const rm = useMemo(() => new THREE.MeshStandardMaterial({ color: ROOFC[roof % ROOFC.length], roughness: 0.95 }), [roof]);
    return (
      <group>
        <mesh position={[p[0], YT + h / 2, p[1]]} geometry={geo} material={mats[k % mats.length]} castShadow receiveShadow />
        {roof === 2
          ? <mesh position={[p[0], YT + h + 0.12, p[1]]} material={rm} castShadow><boxGeometry args={[w + 0.25, 0.24, d + 0.25]} /></mesh>
          : <mesh position={[p[0], YT + h + 0.55, p[1]]} rotation={[0, Math.PI / 4, 0]} scale={[w * 1.05, 1.1, d * 1.05]} material={rm} castShadow><coneGeometry args={[0.7071, 1, 4]} /></mesh>}
      </group>
    );
  }

  /** Durbar High School: long, symmetrical white Rana-style facade with a pedimented portico and a plain cupola, facing the pond. */
  function School() {
    const M = useM();
    const white = M.plain('#f6f3ea', { roughness: 0.85 });
    const roofm = M.plain('#8c8379', { roughness: 0.9 });
    const winM = M.plain('#46505a', { roughness: 0.6 });
    const cz = HZ + 46;
    const ped = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-3.6, 0); s.lineTo(3.6, 0); s.lineTo(0, 1.4); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: false }); }, []);
    const wins = useMemo(() => {
      const o = [];
      for (let i = 0; i < 9; i += 1) for (const s of [-1, 1]) {
        const x = s * (7 + i * 1.9);
        for (const y of [YT + 0.9, YT + 2.0]) o.push([x, y, cz - 3.52, 0.8, 0.8, 0.06, 0, '#46505a']);
      }
      return o;
    }, [cz]);
    return (
      <group>
        <Box s={[40, 3.2, 7]} p={[0, YT + 1.6, cz]} m={white} />
        <Box s={[10, 4.6, 8]} p={[0, YT + 2.3, cz]} m={white} />
        <Box s={[40.4, 0.28, 7.4]} p={[0, YT + 3.3, cz]} m={roofm} />
        <Box s={[10.4, 0.3, 8.4]} p={[0, YT + 4.75, cz]} m={roofm} />
        {/* plain octagonal cupola, no clock */}
        <Cyl rt={1.0} rb={1.2} h={1.1} p={[0, YT + 5.45, cz]} m={white} seg={8} />
        <mesh position={[0, YT + 6.5, cz]} material={roofm} castShadow><coneGeometry args={[1.3, 0.9, 8]} /></mesh>
        <Ball rad={0.12} p={[0, YT + 7.05, cz]} m={white} />
        {/* portico: four columns, entablature, pediment */}
        <Box s={[7.6, 0.3, 2.4]} p={[0, YT + 0.15, cz - 5.2]} m={white} />
        {[-2.7, -0.9, 0.9, 2.7].map((x) => <Cyl key={x} rt={0.28} rb={0.3} h={3.4} p={[x, YT + 2.0, cz - 5.9]} m={white} seg={12} />)}
        <Box s={[7.6, 0.4, 1.4]} p={[0, YT + 3.9, cz - 5.6]} m={white} />
        <mesh geometry={ped} material={white} position={[0, YT + 4.1, cz - 6.3]} castShadow />
        <Inst items={wins} m={winM} />
      </group>
    );
  }

  function SkyDome() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(185, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      const pos = g.attributes.position, col = [], top = new THREE.Color('#5d93cf'), hor = new THREE.Color('#cfe3f2'), c = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) { const t = Math.pow(Math.min(1, Math.max(0, pos.getY(i) / 120)), 0.7); c.copy(hor).lerp(top, t); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, -6, 0]}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>;
  }

  function RaniEnv() {
    const M = useM();
    const [dusk, ref] = useDusk();
    const mats = useMemo(() => makeFacades(dusk), [dusk]);
    const gnd = useMemo(() => ringGeo(135, 135, HX, HZ, YT), []);
    const pave = useMemo(() => ringGeo(HX + 1.5, HZ + 1.5, HX, HZ, YT + 0.03), []);
    const road = useMemo(() => ringGeo(HX + 5.2, HZ + 5.2, HX + 1.5, HZ + 1.5, YT + 0.02), []);
    const EBX = CW_T * Math.sin(ANG);          // x where the causeway meets the east bank

    /* low city blocks: sparse east and west, open park north and south */
    const blocks = useMemo(() => {
      const r = mkRng(7), out = [];
      for (let gx = -72; gx <= 72; gx += 8) for (let gz = -72; gz <= 72; gz += 8) {
        const x = gx + (r() - 0.5) * 2, z = gz + (r() - 0.5) * 2;
        const rr = r(), hh = r(), ww = r(), dd = r(), kk = Math.floor(r() * 6), rf = Math.floor(r() * 3);
        if (Math.abs(x) < HX + 9 && Math.abs(z) < HZ + 9) continue;            // pond, ring road
        if (x > HX + 6 && x < 78 && Math.abs(z) < 62) continue;                // Tundikhel, open ground to the south
        if (x < -(HX + 6) && x > -52 && Math.abs(z) < 40) continue;            // Ratna Park to the north
        if (z > HZ + 8 && z < HZ + 48 && Math.abs(x) < 26) continue;           // school and its grounds (west)
        if (z < -(HZ + 6) && z > -(HZ + 20) && x > -26 && x < 6) continue;      // Ghantaghar and Tri-Chandra campus
        let prob = 0.4;
        if (z < -HZ) prob = 0.32; if (z > HZ + 26) prob = 0.3; if (x > 78) prob = 0.3;
        if (rr > prob) continue;
        const east = z < -HZ;
        const near = Math.max(Math.abs(x) - HX, Math.abs(z) - HZ) < 26;
        out.push({ p: [x, z], w: Math.round(5 + ww * 3), h: hh > 0.72 ? 3 : 2, d: Math.round(5 + dd * 3), k: near ? [3, 3, 5, 0][kk % 4] : (east ? (kk % 2 === 0 ? 0 : 3) : kk), roof: near ? 2 : rf % 2 });
      }
      return out;
    }, []);

    /* trees: instanced */
    const { trunks, crowns } = useMemo(() => {
      const r = mkRng(21), pts = [];
      const near = (x, z) => (Math.abs(x - EBX) < 4 && z < -HZ + 4) || (x > HX - 2 && x < HX + 6) || (z > HZ - 1 && z < HZ + 7 && Math.abs(x) < HX + 4) || (x > HX + 4 && x < HX + 20 && z > 0);
      const cols = ['#4f7a3a', '#5d8a40', '#3f6a34', '#6a8f45', '#557f3c'];
      // along the banks: the east bank gets a double row of shade trees
      for (let x = -HX + 3; x <= HX - 3; x += 3.9) {
        pts.push([x + (r() - 0.5) * 1.6, -HZ - 1.1 - r() * 0.8, 1.1 + r() * 0.8]);
        if (r() < 0.12) pts.push([x, HZ + 1.1, 1.0]);                            // west bank, sparse
      }
      for (let z = -HZ + 3; z <= HZ - 3; z += 3.6) {
        if (r() < 0.8) pts.push([-HX - 1.1, z, 1.5]);                            // north
        if (r() < 0.3) pts.push([HX + 1.1, z, 1.1]);                             // south, sparse
      }
      // parks and grounds
      for (let i = 0; i < 30; i += 1) pts.push([-(HX + 8 + r() * 14), (r() - 0.5) * 56, 1.3 + r() * 0.5]);   // Ratna Park
      for (let i = 0; i < 24; i += 1) pts.push([HX + 8 + r() * 36, (r() - 0.5) * 70, 1.2 + r() * 0.5]);      // Tundikhel
      for (let i = 0; i < 12; i += 1) pts.push([(r() < 0.5 ? -1 : 1) * (26 + r() * 14), HZ + 12 + r() * 20, 1.2 + r() * 0.5]);     // school grounds
      for (let i = 0; i < 10; i += 1) pts.push([-24 + r() * 32, -(HZ + 9 + r() * 6), 1.2 + r() * 0.5]);      // college grounds
      const trunks = [], crowns = [];
      pts.filter(([x, z]) => !near(x, z) && !(Math.abs(x - GHX) < 7.5 && z < -HZ + 1 && z > -HZ - 14)).forEach(([x, z, s]) => {
        trunks.push([x, YT + 0.6 * s, z, 0.3 * s, 1.2 * s, 0.3 * s, 0, '#5a4030']);
        const c = cols[Math.floor(r() * cols.length)];
        crowns.push([x, YT + 2.0 * s, z, (2.2 + r() * 0.8) * s, (1.7 + r() * 0.7) * s, (2.2 + r() * 0.8) * s, 0, c]);
        crowns.push([x + 0.8 * s, YT + 1.6 * s, z + 0.4 * s, 1.8 * s, 1.5 * s, 1.8 * s, 0, cols[(Math.floor(r() * 5))]]);
        crowns.push([x - 0.6 * s, YT + 1.7 * s, z - 0.5 * s, 1.7 * s, 1.5 * s, 1.7 * s, 0, cols[(Math.floor(r() * 5))]]);
      });
      return { trunks, crowns };
    }, [EBX]);

    /* lamp posts around the pond */
    const lamps = useMemo(() => {
      const o = [];
      for (let x = -HX + 4; x <= HX - 4; x += 8) { o.push([x, -HZ - 1.3]); o.push([x, HZ + 1.3]); }
      for (let z = -HZ + 4; z <= HZ - 4; z += 8) { o.push([-HX - 1.3, z]); o.push([HX + 1.3, z]); }
      return o.filter(([x, z]) => !(Math.abs(x - EBX) < 3 && z < 0) && !(Math.abs(x - GHX) < 6 && z < 0));
    }, [EBX]);
    const lampPoles = useMemo(() => lamps.map(([x, z]) => [x, YT + 0.9, z, 0.08, 1.8, 0.08]), [lamps]);
    const lampBulbs = useMemo(() => lamps.map(([x, z]) => [x, YT + 1.9, z, 0.26, 0.26, 0.26]), [lamps]);
    const bulbM = useMemo(() => new THREE.MeshBasicMaterial({ color: dusk ? '#ffd890' : '#e8e4d8', toneMapped: false }), [dusk]);

    /* hills: smooth valley rim, one dark Shivapuri ridge high to the north */
    const hills = useMemo(() => {
      const r = mkRng(5), out = [];
      for (let i = 0; i < 22; i += 1) {
        const a = (i / 22) * Math.PI * 2 + r() * 0.1;
        const d = 112 + r() * 14;
        const x = -Math.cos(a) * d, z = Math.sin(a) * d;           // a = 0 is north (-x)
        const north = Math.max(0, Math.cos(a));
        const hgt = 12 + north * 16 + r() * 3;
        const rad = 34 + r() * 14;
        out.push({ p: [x, z], rad, hgt, a, col: north > 0.4 ? '#3f6a4c' : '#5f8a66' });
      }
      return out;
    }, []);

    const paving = M.plain('#e2dac9', { roughness: 1 });
    const asphalt = M.plain('#58585c', { roughness: 1 });
    const dust = M.plain('#c4baa4', { roughness: 1 });
    const lawn = M.plain('#7da150', { roughness: 1 });
    const poleM = M.plain('#3a3a3c');
    const trunkM = M.plain('#ffffff', { roughness: 1 });
    const leafM = M.plain('#ffffff', { roughness: 1 });
    const ridgeM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a6a55', roughness: 1, fog: false }), []);
    const hillN = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f6454', roughness: 1, fog: false }), []);
    const hillS = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8aa9a6', roughness: 1, fog: false }), []);

    return (
      <group ref={ref}>
        {/* ground: dusty city ground with the pond cut out, the paved rim path, the ring road */}
        <mesh geometry={gnd} material={dust} receiveShadow />
        <mesh geometry={pave} material={paving} receiveShadow />
        <mesh geometry={road} material={asphalt} receiveShadow />
        {/* lawns: Tundikhel (south), Ratna Park (north), school and college grounds */}
        <Box s={[40, 0.05, 66]} p={[HX + 6 + 20, YT + 0.02, 0]} m={lawn} cast={false} />
        <Box s={[16, 0.05, 56]} p={[-(HX + 6 + 8), YT + 0.02, 0]} m={lawn} cast={false} />
        <Box s={[44, 0.05, 40]} p={[0, YT + 0.02, HZ + 6 + 20]} m={lawn} cast={false} />
        <Box s={[32, 0.05, 12]} p={[-10, YT + 0.02, -(HZ + 6 + 6)]} m={lawn} cast={false} />
        {/* Tundikhel: a worn parade-ground oval and a crossing path */}
        <Box s={[22, 0.06, 10]} p={[HX + 28, YT + 0.04, -14]} m={M.plain('#b7ab86', { roughness: 1 })} cast={false} />
        <Box s={[1.6, 0.06, 66]} p={[HX + 14, YT + 0.04, 0]} m={M.plain('#c8bfa8', { roughness: 1 })} cast={false} />
        <Box s={[1.4, 0.06, 56]} p={[-(HX + 14), YT + 0.04, 0]} m={M.plain('#d3c9b0', { roughness: 1 })} cast={false} />
        <Box s={[1.4, 0.06, 38]} p={[0, YT + 0.04, HZ + 26]} m={M.plain('#d3c9b0', { roughness: 1 })} cast={false} />
        {/* school grounds: boundary wall on the road side */}
        <Box s={[44, 0.9, 0.3]} p={[0, YT + 0.45, HZ + 8]} m={M.plain('#efe9dc')} />

        {!dusk && <SkyDome />}
        <School />

        {/* Ghantaghar (white four-storey clock tower, scaled up) and the Tri-Chandra College buildings behind it */}
        <group position={[GHX, YT, GHZ]} scale={GHS}><Ghantaghar /></group>
        <Block p={[GHX - 2, -(HZ + 20)]} w={24} h={2} d={8} mats={mats} k={3} roof={2} />
        <Block p={[-23, -(HZ + 14)]} w={6} h={2} d={6} mats={mats} k={0} roof={0} />

        {/* low city blocks */}
        {blocks.map((b, i) => <Block key={i} p={b.p} w={b.w} h={b.h} d={b.d} mats={mats} k={b.k} roof={b.roof} />)}

        {/* trees (instanced) */}
        <Inst items={trunks} m={trunkM} kind="cyl" />
        <Inst items={crowns} m={leafM} kind="sphere" cast />

        {/* lamp posts */}
        <Inst items={lampPoles} m={poleM} kind="cyl" />
        <Inst items={lampBulbs} m={bulbM} kind="sphere" />

        {/* valley rim */}
        {hills.map((h, i) => (
          <mesh key={i} position={[h.p[0], YT - h.hgt * 0.25, h.p[1]]} rotation={[0, h.a - Math.PI / 2, 0]} scale={[h.rad * 1.7, h.hgt, h.rad * 0.55]} material={h.col === '#3f6a4c' ? hillN : hillS}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        ))}
        {/* Shivapuri: one long dark forested ridge behind the north (Ratna Park) side, rising above the haze */}
        <mesh position={[-150, YT - 8, -35]} scale={[34, 46, 70]} material={ridgeM}><sphereGeometry args={[1, 18, 12]} /></mesh>
        <mesh position={[-158, YT - 10, 25]} scale={[34, 54, 52]} material={ridgeM}><sphereGeometry args={[1, 18, 12]} /></mesh>
      </group>
    );
  }

  // the whole scene is turned about 29 degrees so that the default camera (south-west) looks across the causeway obliquely; the causeway stays perpendicular to the east bank
  const TURN = -0.55;
  // Frame sits at the world origin so the camera direction stays exactly (+x,+y,+z); the pond is shifted so the temple and arcade are centred there
  const OFF = [-9.545, 0, 11.742];
  const RaniMainT = () => (
    <group>
      <Frame s={[27, 13, 16]} p={[2, 5.8, 0]} />
      <group position={OFF} rotation={[0, TURN, 0]}><RaniMain /></group>
    </group>
  );
  const RaniEnvT = () => <group position={OFF} rotation={[0, TURN, 0]}><RaniEnv /></group>;
  return { 'rani-pokhari': { Main: RaniMainT, Env: RaniEnvT } };
}
