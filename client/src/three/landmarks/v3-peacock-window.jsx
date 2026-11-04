// Peacock Window (Mhaykha Jhya), Pujari Math, Bhaktapur. A carved dark-wood window in a plain orange thin-brick wall of a
// priests' house on a narrow lane: square projecting frame, bead colonettes, dentil cornice, sill with corner lions, flared
// wing dressings, big circular lattice with ONE peacock and a leaf-tipped fan tail, two smaller flanking windows, deep timber
// eave band and an open souvenir shopfront with steps. Wall faces +z; a brick-paved lane runs along it.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, useMemo, THREE } = K;

  const WW = 12; // wall width
  const GH = 3.0; // ground storey height
  const TOP = 7.0; // eave height
  const WY = 5.0; // window centre height
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  function wingGeo(sign) {
    const s = new THREE.Shape();
    const P = [[0, -1.05], [0.9, -1.05], [0.62, -0.8], [0.34, -0.45], [0.24, 0.05], [0.28, 0.55], [0.46, 0.9], [0.1, 1.05], [0, 1.05]];
    P.forEach(([x, y], i) => (i ? s.lineTo(x * sign, y) : s.moveTo(x * sign, y)));
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
  }

  function wingEdge(sign) {
    const pts = [[0.9, -1.05], [0.62, -0.8], [0.34, -0.45], [0.24, 0.05], [0.28, 0.55], [0.46, 0.9], [0.1, 1.05]].map(([x, y]) => new THREE.Vector3(x * sign, y, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.022, 5, false);
  }

  /* ------------------------------------------------------------ the window */
  function PeacockWindow() {
    const M = useM();
    const wood = M.plain('#55392a', { roughness: 0.85 });
    const carve = M.plain('#6b4a33', { roughness: 0.8 });
    const deep = M.plain('#150d08', { roughness: 0.95 });
    const light = M.plain('#7d5a40', { roughness: 0.8 });
    const ring = M.plain('#a07850', { roughness: 0.8 });
    const black = M.plain('#0a0604', { roughness: 1 });
    const eL = useMemo(() => wingEdge(-1), []);
    const eR = useMemo(() => wingEdge(1), []);
    const wL = useMemo(() => wingGeo(-1), []);
    const wR = useMemo(() => wingGeo(1), []);
    const O = [0, -0.3]; // fan origin
    const feathers = useMemo(() => {
      const out = [];
      for (let a = -14; a <= 194; a += 10.4) {
        const t = (a * Math.PI) / 180;
        const dx = Math.cos(t), dy = Math.sin(t);
        const b = O[0] * dx + O[1] * dy;
        const L = -b + Math.sqrt(b * b + 0.55 * 0.55 - (O[0] ** 2 + O[1] ** 2));
        out.push({ a: t - Math.PI / 2, L });
      }
      return out;
    }, []);
    return (
      <group scale={1.35}>
        {/* flared wing dressings on the brick */}
        <mesh geometry={wL} position={[-1.0, 0, 0]} material={wood} />
        <mesh geometry={wR} position={[1.0, 0, 0]} material={wood} />
        <mesh geometry={wL} position={[-1.04, 0, 0.09]} scale={[0.72, 0.88, 0.5]} material={carve} />
        <mesh geometry={wR} position={[1.04, 0, 0.09]} scale={[0.72, 0.88, 0.5]} material={carve} />
        <mesh geometry={eL} position={[-1.0, 0, 0.07]} material={light} />
        <mesh geometry={eR} position={[1.0, 0, 0.07]} material={light} />
        {/* outer back frame + inner panel */}
        <Box s={[2.0, 2.0, 0.14]} p={[0, 0, 0.07]} m={wood} />
        <Box s={[1.62, 1.62, 0.1]} p={[0, 0.02, 0.17]} m={carve} />
        {/* scrolling border: rosettes on the inner panel */}
        {range(9, (i) => {
          const u = -0.72 + i * 0.18;
          return (
            <group key={i}>
              <Ball rad={0.045} p={[u, 0.76, 0.25]} sc={[1, 1, 0.5]} m={light} />
              <Ball rad={0.045} p={[u, -0.72, 0.25]} sc={[1, 1, 0.5]} m={light} />
              {i > 0 && i < 8 && (
                <>
                  <Ball rad={0.045} p={[-0.76, -0.72 + i * 0.18, 0.25]} sc={[1, 1, 0.5]} m={light} />
                  <Ball rad={0.045} p={[0.76, -0.72 + i * 0.18, 0.25]} sc={[1, 1, 0.5]} m={light} />
                </>
              )}
            </group>
          );
        })}
        {/* circular lattice: dark void, ring of foliage */}
        <Cyl rt={0.66} rb={0.66} h={0.04} p={[0, 0.02, 0.24]} r={[Math.PI / 2, 0, 0]} m={black} seg={40} />
        <mesh position={[0, 0.02, 0.255]} material={ring}><torusGeometry args={[0.77, 0.035, 6, 56]} /></mesh>
        <mesh position={[0, 0.02, 0.255]} material={light}><torusGeometry args={[0.6, 0.02, 5, 48]} /></mesh>
        <mesh position={[0, 0.02, 0.26]} material={ring}><torusGeometry args={[0.66, 0.05, 6, 48]} /></mesh>
        <mesh position={[0, 0.02, 0.25]} material={wood}><torusGeometry args={[0.72, 0.03, 6, 48]} /></mesh>
        {range(22, (i) => {
          const t = (i / 22) * Math.PI * 2;
          return <Ball key={i} rad={0.045} p={[Math.cos(t) * 0.69, 0.02 + Math.sin(t) * 0.69, 0.27]} sc={[1.5, 0.7, 0.5]} r={[0, 0, t + Math.PI / 2]} m={light} />;
        })}
        {/* radiating tail: leaf-tipped feathers */}
        <group position={[O[0], O[1] + 0.02, 0.3]}>
          {feathers.map((f, i) => (
            <group key={i} rotation={[0, 0, f.a]}>
              <Box s={[0.04, f.L, 0.035]} p={[0, f.L / 2, 0]} m={light} />
              <Ball rad={0.07} p={[0, f.L - 0.07, 0.005]} sc={[0.8, 1.8, 0.45]} m={ring} />
              <Ball rad={0.022} p={[0, f.L - 0.05, 0.03]} m={deep} />
              <Ball rad={0.04} p={[0, f.L * 0.62, 0]} sc={[0.8, 1.3, 0.4]} m={light} />
            </group>
          ))}
          {[0.2, 0.36, 0.52].map((r, i) => (
            <mesh key={i} material={light} rotation={[0, 0, 0]}><torusGeometry args={[r, 0.014, 4, 40, Math.PI]} /></mesh>
          ))}
        </group>
        {/* the single peacock, carved in the round, standing at lower centre */}
        <group position={[0, -0.14, 0.36]} scale={1.4}>
          <Ball rad={0.12} p={[0, 0, 0]} sc={[0.85, 1.45, 0.8]} m={light} />
          <Ball rad={0.1} p={[0, 0.1, 0.07]} sc={[1, 1.2, 0.7]} m={carve} />
          <Cyl rt={0.03} rb={0.05} h={0.16} p={[0, 0.25, 0.01]} m={light} seg={8} />
          <Ball rad={0.052} p={[0, 0.36, 0.02]} sc={[1, 1.05, 1.1]} m={light} />
          <Box s={[0.016, 0.03, 0.07]} p={[0, 0.355, 0.085]} m={wood} />
          <Box s={[0.01, 0.07, 0.01]} p={[0, 0.43, 0.0]} m={light} />
          <Ball rad={0.018} p={[0, 0.47, 0.0]} m={light} />
          <Box s={[0.035, 0.2, 0.04]} p={[-0.06, -0.3, 0]} m={carve} />
          <Box s={[0.035, 0.2, 0.04]} p={[0.06, -0.3, 0]} m={carve} />
          <Box s={[0.18, 0.04, 0.1]} p={[0, -0.41, 0.02]} m={carve} />
          {range(6, (i) => <Ball key={i} rad={0.012} p={[-0.06 + (i % 3) * 0.06, -0.05 + Math.floor(i / 3) * 0.1, 0.12]} m={deep} />)}
        </group>
        {/* bead-string colonettes */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.94, 0, 0.17]}>
            <Box s={[0.1, 2.0, 0.3]} p={[0, 0, 0.1]} m={wood} />
            {range(9, (i) => <Ball key={i} rad={0.075} p={[0, -0.88 + i * 0.22, 0.28]} sc={[1, 1.15, 1]} m={carve} />)}
            <Box s={[0.19, 0.08, 0.34]} p={[0, 1.03, 0.1]} m={carve} />
            <Box s={[0.19, 0.08, 0.34]} p={[0, -1.03, 0.1]} m={carve} />
          </group>
        ))}
        {/* cornice with dentil teeth */}
        <Box s={[2.45, 0.12, 0.5]} p={[0, 1.2, 0.25]} m={wood} />
        <Box s={[2.25, 0.07, 0.34]} p={[0, 1.3, 0.2]} m={carve} />
        <Box s={[2.1, 0.07, 0.26]} p={[0, 1.38, 0.17]} m={wood} />
        {range(15, (i) => <Box key={i} s={[0.085, 0.11, 0.1]} p={[-1.05 + i * 0.15, 1.09, 0.45]} m={carve} />)}
        {/* sill beam with two corner lions and a centre panel */}
        <Box s={[2.5, 0.2, 0.5]} p={[0, -1.1, 0.25]} m={wood} />
        <Box s={[1.6, 0.14, 0.06]} p={[0, -1.09, 0.52]} m={carve} />
        <Box s={[1.5, 0.03, 0.03]} p={[0, -1.02, 0.56]} m={light} />
        <Box s={[1.5, 0.03, 0.03]} p={[0, -1.16, 0.56]} m={light} />
        {[-0.45, 0, 0.45].map((x, i) => <Ball key={i} rad={0.065} p={[x, -1.09, 0.56]} sc={[1.2, 1, 0.7]} m={light} />)}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 1.12, -0.93, 0.35]} scale={1.45}>
            <Box s={[0.3, 0.22, 0.3]} p={[0, -0.03, 0]} m={carve} />
            <Ball rad={0.14} p={[0, 0.08, 0.1]} sc={[1.05, 1, 0.85]} m={carve} />
            <Ball rad={0.05} p={[-0.09, 0.2, 0.08]} m={light} />
            <Ball rad={0.05} p={[0.09, 0.2, 0.08]} m={light} />
            <Ball rad={0.03} p={[-0.05, 0.1, 0.22]} m={deep} />
            <Ball rad={0.03} p={[0.05, 0.1, 0.22]} m={deep} />
            <Box s={[0.12, 0.03, 0.03]} p={[0, -0.01, 0.23]} m={deep} />
          </group>
        ))}
      </group>
    );
  }

  /* smaller, plainer flanking lattice window with a mini hood */
  function SmallWindow({ p }) {
    const M = useM();
    const wood = M.plain('#55392a', { roughness: 0.85 });
    const carve = M.plain('#6b4a33', { roughness: 0.8 });
    const deep = M.plain('#150d08', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[1.0, 1.05, 0.1]} p={[0, 0, 0.05]} m={wood} />
        <Box s={[0.78, 0.82, 0.1]} p={[0, 0, 0.1]} m={deep} />
        {range(5, (i) => <Box key={i} s={[0.025, 0.8, 0.04]} p={[-0.3 + i * 0.15, 0, 0.17]} m={carve} />)}
        {range(5, (i) => <Box key={i} s={[0.78, 0.025, 0.04]} p={[0, -0.32 + i * 0.16, 0.17]} m={carve} />)}
        <Box s={[1.25, 0.1, 0.5]} p={[0, 0.65, 0.22]} m={wood} />
        <Box s={[1.1, 0.06, 0.4]} p={[0, 0.72, 0.2]} m={carve} />
        {range(7, (i) => <Box key={i} s={[0.07, 0.08, 0.07]} p={[-0.45 + i * 0.15, 0.56, 0.45]} m={carve} />)}
        <Box s={[1.2, 0.09, 0.3]} p={[0, -0.58, 0.15]} m={wood} />
      </group>
    );
  }

  /* open souvenir shopfront with red hangings, goods and two steps */
  function Shop() {
    const M = useM();
    const wood = M.plain('#4a3223', { roughness: 0.85 });
    const dark = M.plain('#2a1a10', { roughness: 0.95 });
    const red = M.plain('#a01820', { roughness: 0.9 });
    const red2 = M.plain('#861018', { roughness: 0.9 });
    const stone = M.plain('#b9b1a4', { roughness: 0.95 });
    const goods = ['#b08a2e', '#4a2f1c', '#7a1016', '#c9a23a', '#3a2416', '#8a1a20'].map((c) => M.plain(c, { roughness: 0.8 }));
    const mask = M.plain('#7a4a2a', { roughness: 0.8 });
    return (
      <group>
        <Box s={[10.4, 2.7, 1.2]} p={[0, 1.35, -1.3]} m={dark} />
        {/* steps */}
        <Box s={[10.4, 0.16, 1.8]} p={[0, 0.08, 0.9]} m={stone} />
        <Box s={[10.4, 0.3, 1.1]} p={[0, 0.15, 0.55]} m={stone} />
        {/* red cloth backdrops left and right of the dark doorway */}
        <Box s={[2.8, 1.5, 0.06]} p={[-3.9, 1.95, -0.68]} m={red} />
        <Box s={[3.6, 1.3, 0.06]} p={[3.3, 1.95, -0.68]} m={red2} />
        {range(14, (i) => <Box key={'a' + i} s={[0.24, 0.3, 0.05]} p={[-5.0 + (i % 7) * 0.4, 2.5 - Math.floor(i / 7) * 0.5 - (i % 2) * 0.12, -0.62]} m={i % 3 ? mask : dark} />)}
        {range(14, (i) => <Box key={'b' + i} s={[0.24, 0.3, 0.05]} p={[1.9 + (i % 7) * 0.5, 2.5 - Math.floor(i / 7) * 0.5 - (i % 2) * 0.12, -0.62]} m={i % 3 ? mask : dark} />)}
        {/* dark doorway, left of centre */}
        <Box s={[1.15, 2.2, 0.08]} p={[-1.2, 1.4, -0.6]} m={dark} />
        <Box s={[0.12, 2.3, 0.2]} p={[-1.85, 1.4, -0.5]} m={wood} />
        <Box s={[0.12, 2.3, 0.2]} p={[-0.55, 1.4, -0.5]} m={wood} />
        <Box s={[1.4, 0.12, 0.2]} p={[-1.2, 2.5, -0.5]} m={wood} />
        {/* hanging bulbs under the eave glow at dusk */}
        {[-4.2, -2.4, 0.4, 2.4, 4.2].map((x, i) => (
          <group key={i} position={[x, 2.55, 0.5]}>
            <Box s={[0.015, 0.25, 0.015]} p={[0, 0.2, 0]} m={dark} />
            <Cyl rt={0.07} rb={0.09} h={0.2} p={[0, 0, 0]} m={M.plain('#ffd27a', { emissive: '#ffb347', emissiveIntensity: 1.2 })} seg={8} />
            <Cyl rt={0.03} rb={0.07} h={0.05} p={[0, 0.12, 0]} m={wood} seg={8} />
          </group>
        ))}
        {/* posts and the stalls */}
        {[-5.0, -2.3, 0.8, 5.0].map((x, i) => <Box key={i} s={[0.22, 2.7, 0.3]} p={[x, 1.35, -0.1]} m={wood} />)}
        <Box s={[2.8, 0.8, 0.8]} p={[-3.9, 0.7, 0.25]} m={red} />
        <Box s={[3.4, 0.8, 0.8]} p={[3.3, 0.7, 0.25]} m={red2} />
        {range(3, (i) => (
          <group key={i} position={[-1.2, 0.2 + i * 0.22, 0.65]}>
            <Box s={[0.55 - i * 0.06, 0.2, 0.4]} p={[0, 0, 0]} m={i % 2 ? mask : goods[1]} />
            <Ball rad={0.035} p={[-0.08, 0.02, 0.21]} m={dark} />
            <Ball rad={0.035} p={[0.08, 0.02, 0.21]} m={dark} />
            <Box s={[0.08, 0.04, 0.04]} p={[0, -0.05, 0.21]} m={red} />
          </group>
        ))}
        {range(5, (i) => <Cyl key={'rc' + i} rt={0.1} rb={0.1} h={0.9} p={[0.9 + (i % 3) * 0.24, 0.9 + Math.floor(i / 3) * 0.2, 0.2]} r={[0, 0, Math.PI / 2]} m={i % 2 ? goods[5] : goods[0]} seg={10} />)}
        {range(14, (i) => (
          <Box key={i} s={[0.28, 0.16 + (i % 3) * 0.05, 0.26]} p={[-5.0 + (i % 7) * 0.38 + (i > 6 ? 0.15 : 0), 1.17 + (i % 3) * 0.02, 0.1 + (i > 6 ? 0.2 : 0)]} m={goods[i % 6]} />
        ))}
        {range(14, (i) => (
          <Box key={i} s={[0.28, 0.16 + (i % 3) * 0.05, 0.26]} p={[1.7 + (i % 7) * 0.45 + (i > 6 ? 0.2 : 0), 1.17 + (i % 3) * 0.02, 0.1 + (i > 6 ? 0.2 : 0)]} m={goods[(i + 2) % 6]} />
        ))}
      </group>
    );
  }

  function PujariMath() {
    const M = useM();
    const brick = M.mat('brick', 28, 18, { color: '#ffe0c8' });
    const brickPier = M.mat('brick', 2.4, 4, { color: '#ffe0c8' });
    const wood = M.plain('#43291a', { roughness: 0.85 });
    const wood2 = M.plain('#583a26', { roughness: 0.85 });
    const tile = M.mat('roof', 8, 3, { color: '#9a6a50' });
    const dark = M.plain('#1a1009', { roughness: 0.95 });
    return (
      <group>
        {/* upper walls: first floor and attic storey, plain thin brick */}
        <Box s={[WW, TOP - GH - 0.2, 0.6]} p={[0, (TOP + GH + 0.2) / 2, -0.3]} m={brick} />
        <Box s={[WW, TOP - GH - 0.2, 4]} p={[0, (TOP + GH + 0.2) / 2, -3]} m={brick} />
        {/* ground-floor end piers and lintel */}
        <Box s={[0.9, GH, 0.9]} p={[-5.55, GH / 2, -0.15]} m={brickPier} />
        <Box s={[0.9, GH, 0.9]} p={[5.55, GH / 2, -0.15]} m={brickPier} />
        <Box s={[WW, 0.3, 0.8]} p={[0, GH - 0.15, -0.1]} m={wood} />
        {/* deep dark carved eave band with struts, between ground and first floor */}
        <Box s={[WW + 0.3, 0.34, 0.95]} p={[0, GH + 0.17, 0.15]} m={wood} />
        <Box s={[WW + 0.2, 0.12, 1.1]} p={[0, GH + 0.4, 0.2]} m={wood2} />
        {range(25, (i) => <Box key={i} s={[0.09, 0.14, 0.12]} p={[-5.9 + i * 0.49, GH + 0.03, 0.62]} m={wood2} />)}
        {range(13, (i) => <Box key={i} s={[0.1, 0.5, 0.1]} p={[-5.7 + i * 0.95, GH - 0.3, 0.35]} r={[0, 0, 0]} m={wood} />)}
        {/* windows */}
        <group position={[0, WY, 0]}><PeacockWindow /></group>
        <SmallWindow p={[-3.7, WY + 0.1, 0]} />
        <SmallWindow p={[3.7, WY + 0.1, 0]} />
        {/* one thin eave and a shallow tile slope set back behind the wall */}
        <Box s={[WW + 0.5, 0.22, 0.9]} p={[0, TOP + 0.05, 0.15]} m={wood} />
        {range(25, (i) => <Box key={i} s={[0.09, 0.12, 0.1]} p={[-5.9 + i * 0.49, TOP - 0.12, 0.58]} m={wood2} />)}
        <group position={[0, TOP + 0.1, -0.5]} rotation={[0.2, 0, 0]}>
          <Box s={[WW + 0.8, 0.14, 3.6]} p={[0, 0.1, -1.4]} m={tile} />
        </group>
        <Frame s={[7.5, 6.6, 2.4]} p={[0, 4.5, 0.5]} />
        <Shop />
      </group>
    );
  }

  function PeacockMain() {
    return <PujariMath />;
  }

  /* ------------------------------------------------------------ the lane */
  function FacingHouse({ x, w, h, z = 6.6, tint = '#ffcaa6', shop = true }) {
    const M = useM();
    const brick = M.mat('brick', w / 0.8, h / 0.8, { color: tint });
    const wood = M.plain('#4a3223', { roughness: 0.85 });
    const tile = M.plain('#8e644e', { roughness: 0.95 });
    const dark = M.plain('#1a1009', { roughness: 0.95 });
    const red = M.plain('#8a1218', { roughness: 0.9 });
    const n = Math.max(1, Math.floor(w / 2.4));
    return (
      <group position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
        <Box s={[w, h, 5]} p={[0, h / 2, -2.5]} m={brick} />
        {shop && <Box s={[w - 0.8, 2.4, 0.1]} p={[0, 1.3, 0.04]} m={dark} />}
        {shop && <Box s={[w - 1.6, 0.9, 0.5]} p={[0, 0.5, 0.35]} m={red} />}
        <Box s={[w + 0.2, 0.3, 0.8]} p={[0, GH + 0.1, 0.25]} m={wood} />
        {range(n, (i) => {
          const px = -w / 2 + (w / n) * (i + 0.5);
          return (
            <group key={i}>
              <Box s={[1.0, 1.2, 0.12]} p={[px, GH + 1.6, 0.06]} m={wood} />
              <Box s={[0.75, 0.9, 0.14]} p={[px, GH + 1.6, 0.1]} m={dark} />
              {h > 7.5 && <Box s={[0.9, 1.0, 0.12]} p={[px, GH + 4.0, 0.06]} m={wood} />}
            </group>
          );
        })}
        <Box s={[w + 0.8, 0.28, 0.9]} p={[0, h, 0.1]} m={wood} />
        <group position={[0, h + 0.15, -2.2]} rotation={[-0.38, 0, 0]}>
          <Box s={[w + 1, 0.2, 4.4]} p={[0, 0.3, 0.2]} m={tile} />
        </group>
      </group>
    );
  }

  function NeighbourWall({ x, w, h, tint }) {
    const M = useM();
    const brick = M.mat('brick', w / 0.8, h / 0.8, { color: tint });
    const wood = M.plain('#4a3223', { roughness: 0.85 });
    const tile = M.plain('#8e644e', { roughness: 0.95 });
    const dark = M.plain('#1a1009', { roughness: 0.95 });
    const n = Math.max(1, Math.floor(w / 2.6));
    return (
      <group position={[x, 0, -0.9]}>
        <Box s={[w, h, 3.6]} p={[0, h / 2, -1.2]} m={brick} />
        <Box s={[w, 0.3, 0.9]} p={[0, GH + 0.15, 0.3]} m={wood} />
        {range(n, (i) => {
          const px = -w / 2 + (w / n) * (i + 0.5);
          return (
            <group key={i}>
              <Box s={[0.95, 1.1, 0.12]} p={[px, GH + 1.7, 0.66]} m={wood} />
              <Box s={[0.7, 0.85, 0.14]} p={[px, GH + 1.7, 0.7]} m={dark} />
            </group>
          );
        })}
        {range(n, (i) => {
          const px = -w / 2 + (w / n) * (i + 0.5);
          return <Box key={i} s={[w / n - 0.5, 2.3, 0.1]} p={[px, 1.2, 0.62]} m={dark} />;
        })}
        <Box s={[w + 0.4, 0.28, 0.9]} p={[0, h, 0.4]} m={wood} />
        <group position={[0, h + 0.1, -1.3]} rotation={[0.38, 0, 0]}>
          <Box s={[w + 0.6, 0.18, 3.8]} p={[0, 0.3, 0.2]} m={tile} />
        </group>
      </group>
    );
  }

  function PeacockEnv() {
    const M = useM();
    const paving = M.mat('brick', 26, 8, { color: '#a89888' });
    const dirt = M.plain('#a59680', { roughness: 1 });
    const signWood = M.plain('#3a2416', { roughness: 0.9 });
    const signRed = M.plain('#8a1218', { roughness: 0.9 });
    const signBrass = M.plain('#b08a2e', { roughness: 0.6 });
    const lowBrick = M.mat('brick', 20, 2, { color: '#ecbf9f' });
    const tmplBrick = M.mat('brick', 6, 5, { color: '#e6b595' });
    const tmplRoof = M.plain('#9a6a50', { roughness: 0.95 });
    const skyGeo = useMemo(() => {
      const g = new THREE.PlaneGeometry(220, 70, 1, 8);
      const pos = g.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const lo = new THREE.Color('#efe3d0'), hi = new THREE.Color('#8fb0d0');
      for (let i = 0; i < pos.count; i++) {
        const t = (pos.getY(i) + 35) / 70;
        const c = lo.clone().lerp(hi, Math.pow(t, 0.8));
        col.set([c.r, c.g, c.b], i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    }, []);
    const cloudMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false }), []);
    const skyMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }), []);
    
    return (
      <group>
        {/* wide ground then the brick-paved lane in front of the wall */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={dirt}><circleGeometry args={[70, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 3.5]} receiveShadow material={paving}><planeGeometry args={[110, 4.2]} /></mesh>
        {/* neighbouring houses continue the same wall line to both sides */}
        <NeighbourWall x={-11.6} w={11} h={7.6} tint="#e8b090" />
        <NeighbourWall x={-22} w={9.5} h={8.2} tint="#f0b898" />
        <NeighbourWall x={11.4} w={10.6} h={7.2} tint="#e8b090" />
        <NeighbourWall x={21.6} w={9.8} h={8.0} tint="#f0b898" />
        <NeighbourWall x={-31} w={9} h={7.4} tint="#e8b090" />
        <NeighbourWall x={30.5} w={9} h={7.8} tint="#e8b090" />
        {/* opposite side of the lane: a brick house on each flank, a gap straight across */}
        <Box s={[34, 0.7, 1.6]} p={[0, 0.35, 6.0]} m={lowBrick} />
        <Box s={[34.4, 0.1, 2.0]} p={[0, 0.74, 6.0]} m={tmplRoof} />
        {/* overhead cables and hanging signboards across the lane */}
        {[-9, -6.5, 6.2, 9.5, -13, 13].map((x, i) => (
          <group key={'cb' + i}>
            <Box s={[0.03, 0.03, 5.6]} p={[x, 7.3 - (i % 3) * 0.5, 3.2]} r={[0.04, 0, 0]} m={signWood} />
            <group position={[x, 5.6 - (i % 3) * 0.4, 2.6 + (i % 2)]}>
              <Box s={[0.02, 0.5, 0.02]} p={[0, 0.5, 0.35]} m={signWood} />
              <Box s={[0.06, 0.55, 0.9]} p={[0, 0, 0.35]} m={i % 2 ? signRed : signBrass} />
              <Box s={[0.07, 0.4, 0.7]} p={[0, 0, 0.35]} m={i % 3 ? signWood : signRed} />
            </group>
          </group>
        ))}
        {[7.6, 7.0].map((y, i) => <Box key={'cl' + i} s={[44, 0.03, 0.03]} p={[0, y, 3.2 + i * 0.4]} m={signWood} />)}
        {/* Dattatreya: three stepped, tapering roofs beyond the rooftops to the west */}
        <group position={[-27, 0, -12]}>
          <Box s={[6.4, 5, 6.4]} p={[0, 2.5, 0]} m={tmplBrick} />
          {[0, 1, 2].map((t) => (
            <group key={t}>
              <Box s={[10 - t * 2.4, 0.5, 10 - t * 2.4]} p={[0, 5.3 + t * 2.7, 0]} m={tmplRoof} />
              <Box s={[7.6 - t * 2.4, 2.2, 7.6 - t * 2.4]} p={[0, 6.6 + t * 2.7, 0]} m={tmplBrick} />
            </group>
          ))}
          <Box s={[2.2, 0.4, 2.2]} p={[0, 13.7, 0]} m={tmplRoof} />
          <Cyl rt={0.1} rb={0.5} h={2.2} p={[0, 15, 0]} m={M.gold} seg={8} />
        </group>
        <FacingHouse x={-34} w={10} h={7.0} z={5.6} />
        <FacingHouse x={-44} w={9} h={9.4} z={5.6} tint="#e8a888" />
        <FacingHouse x={35} w={9.4} h={7.2} z={5.6} tint="#e0a080" />
        <FacingHouse x={45} w={9.4} h={9.0} z={5.6} />
        {/* skyline far behind the lane in both directions */}
        <mesh position={[0, 30, -62]} geometry={skyGeo} material={skyMat} />
        {[[-40, 38, 0], [-5, 46, 1], [30, 40, 0], [60, 50, 1]].map(([x, y, k], i) => (
          <group key={'cd' + i} position={[x, y, -60]}>
            <Ball rad={7} sc={[2.4, 0.7, 0.3]} m={cloudMat} />
            <Ball rad={5} p={[8, 2, 0]} sc={[2.2, 0.7, 0.3]} m={cloudMat} />
          </group>
        ))}
      </group>
    );
  }

  return { 'peacock-window': { Main: PeacockMain, Env: PeacockEnv } };
}
