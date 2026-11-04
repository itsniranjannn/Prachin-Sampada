// Indreshwar Mahadev (Panauti): a three-roofed square Newar pagoda of red brick and dark carved timber, with an
// enormous, deep-eaved lowest roof that tapers sharply to a small top roof, dense diagonal carved struts, a three-bay
// carved door with stone lions and Nandi, on a low stone plinth in a flat paved courtyard; the smaller two-roofed
// Unmatta Bhairav temple stands front-left. Roshi / Punyamati confluence and the ghats lie outside the courtyard (east).
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Lion, Nandi, Lingam, Tree, Diyo, LatticeWindow, Frame, THREE, useMemo } = K;
  const P = Math.PI;
  const TILE = '#a0623c';
  const BRICK = '#9C5B3B';
  const DK = '#3e2619';
  const DK2 = '#5a3626';
  const LEAF = '#6f4030';

  const tileM = (M, rx = 5, ry = 5) => M.mat('roof', Math.max(3, rx), Math.max(3, ry), { color: '#a98462' });
  const htileM = (M) => M.mat('roof', 4, 3, { color: '#9a7e68' });
  const brickM = (M, rx, ry) => M.mat('brick', rx, ry, { color: K.lighten(BRICK, 0.62) });
  const stoneM = (M, rx = 2, ry = 1, c = '#cfc6b6') => M.plain(K.lighten(c, 0.0), { roughness: 0.95 });

  /* instanced boxes: items = [{p:[x,y,z], r:[rx,ry,rz], s:[w,h,d]}] */
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  function Inst({ items, m, cast = true }) {
    const setRef = (mesh) => {
      if (!mesh) return;
      const o = new THREE.Object3D();
      items.forEach((it, i) => {
        o.position.set(...it.p); o.rotation.set(...(it.r || [0, 0, 0])); o.scale.set(...it.s);
        o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    return <instancedMesh key={items.length} ref={setRef} args={[unitBox, m, items.length]} castShadow={cast} receiveShadow frustumCulled={false} />;
  }

  /* half-disc / arch panel (flat, facing +z) */
  function ArchPanel({ p, w, h, m }) {
    const g = useMemo(() => {
      const s = new THREE.Shape();
      const r = w / 2;
      s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r);
      s.absarc(0, h - r, r, 0, P, false);
      s.lineTo(-r, 0);
      return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false });
    }, [w, h]);
    return <mesh position={p} geometry={g} material={m} castShadow />;
  }

  /* one row of raked carved struts on the local +z side */
  function sideStruts(half, rad, o, yb, yt, n, skipMid, tk = 1) {
    const L = Math.hypot(yt - yb, o);
    const th = Math.atan2(o, yt - yb);
    const a = []; const b = []; const c = [];
    for (let i = 0; i < n; i += 1) {
      const x = ((i + 0.5) / n - 0.5) * 2 * half * 0.94;
      if (skipMid && Math.abs(x) < skipMid) continue;
      a.push({ p: [x, (yb + yt) / 2, rad + o / 2], r: [th, 0, 0], s: [0.085 * tk, L, 0.13 * tk] });
      b.push({ p: [x, yb + 0.1, rad + 0.07], s: [0.2 * tk, 0.24, 0.14] });
      c.push({ p: [x, yt - 0.06, rad + o + 0.02], s: [0.14, 0.14, 0.14], r: [0, 0, P / 4] });
    }
    return { a, b, c };
  }
  function Struts({ hw, hd = hw, o, yb, yt, n, skipMid = 0, color = DK2, tk = 1 }) {
    const M = useM();
    const wood = M.plain(color, { roughness: 0.8 });
    const dark = M.plain(DK, { roughness: 0.8 });
    const f = sideStruts(hw, hd, o, yb, yt, n, skipMid, tk);
    const sn = Math.max(2, Math.round((n * hd) / hw));
    const s = sideStruts(hd, hw, o, yb, yt, sn, 0, tk);
    const k = sideStruts(0, hw * 0.7071 + hd * 0.7071 - 0.5 * (hw + hd) * 0.0 + 0.0, o * 1.3, yb, yt, 1, 0);
    const parts = [
      [f, 0], [f, P], [s, P / 2], [s, -P / 2],
    ];
    return (
      <group>
        {parts.map(([d, ang], i) => (
          <group key={i} rotation={[0, ang, 0]}>
            <Inst items={d.a} m={wood} /><Inst items={d.b} m={dark} /><Inst items={d.c} m={dark} />
          </group>
        ))}
        {[1, 3, 5, 7].map((q) => (
          <group key={q} rotation={[0, (q * P) / 4, 0]}>
            <Inst items={k.a.map((it) => ({ ...it, p: [it.p[0], it.p[1], (hw + hd) * 0.5 * 1.3 + o * 0.5 - 0.0], s: [0.1, it.s[1], 0.15] }))} m={wood} />
          </group>
        ))}
      </group>
    );
  }

  /* roof with soffit, red/pink fringe trim (optional) */
  function PRoof({ w, d, h, y, fringe, trim, sag = 1.5 }) {
    const M = useM();
    return (
      <group>
        <Roof w={w} d={d} h={h} y={y} m={tileM(M, Math.max(3, w * 0.9), Math.max(3, d * 0.9))} sag={sag} lift={0.16} fascia={false} />
        <Box s={[w, 0.07, d]} p={[0, y - 0.05, 0]} m={M.plain('#1f120a', { roughness: 0.95 })} cast={false} />
        {[[w, 0.06, 0, d / 2], [w, 0.06, 0, -d / 2]].map(([ww, , , z], i) => <Box key={`f${i}`} s={[ww, 0.1, 0.06]} p={[0, y - 0.01, z]} m={M.plain(trim || DK)} cast={false} />)}
        {[1, -1].map((k) => <Box key={`g${k}`} s={[0.06, 0.1, d]} p={[k * (w / 2), y - 0.01, 0]} m={M.plain(trim || DK)} cast={false} />)}
        {fringe && [[0, d / 2, w, 0.05], [0, -d / 2, w, 0.05]].map(([x, z, ww], i) => <Box key={`r${i}`} s={[ww, 0.16, 0.025]} p={[x, y - 0.14, z]} m={M.plain('#b85560', { roughness: 0.9 })} cast={false} />)}
        {fringe && [1, -1].map((k) => <Box key={`q${k}`} s={[0.025, 0.16, d]} p={[k * (w / 2), y - 0.14, 0]} m={M.plain('#b85560', { roughness: 0.9 })} cast={false} />)}
      </group>
    );
  }

  /* timber frame: corner posts + top and bottom beams around a storey */
  function Frame4({ hw, hd = hw, y0, y1, m }) {
    const h = y1 - y0;
    return (
      <group>
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b], i) => <Box key={i} s={[0.17, h, 0.17]} p={[a * hw, y0 + h / 2, b * hd]} m={m} />)}
        <Box s={[hw * 2 + 0.2, 0.15, hd * 2 + 0.2]} p={[0, y1 - 0.07, 0]} m={m} />
        <Box s={[hw * 2 + 0.1, 0.12, hd * 2 + 0.1]} p={[0, y0 + 0.06, 0]} m={m} />
      </group>
    );
  }

  /* carved timber door with a leaf */
  function DoorBay({ p, w = 0.8, h = 1.3, arch = false }) {
    const M = useM();
    const leaf = M.plain(LEAF, { roughness: 0.85 });
    const dk = M.plain(DK, { roughness: 0.8 });
    return (
      <group position={p}>
        <Box s={[w + 0.3, h + 0.12, 0.1]} p={[0, h / 2 + 0.05, 0]} m={dk} cast={false} />
        {arch
          ? <ArchPanel p={[-w / 2, 0, 0.04]} w={w} h={h} m={leaf} />
          : <Box s={[w, h, 0.06]} p={[0, h / 2, 0.06]} m={leaf} cast={false} />}
        {!arch && <Box s={[0.025, h, 0.03]} p={[0, h / 2, 0.1]} m={dk} cast={false} />}
        {arch && <Box s={[0.025, h * 0.7, 0.03]} p={[0, h * 0.35, 0.1]} m={dk} cast={false} />}
        {[-1, 1].map((k) => <Box key={k} s={[0.1, h + 0.1, 0.14]} p={[k * (w / 2 + 0.17), h / 2 + 0.05, 0.03]} m={M.plain(DK2)} cast={false} />)}
        {[-1, 1].map((k) => [0.25, 0.55, 0.85, 1.15].map((y) => <Box key={`${k}${y}`} s={[0.14, 0.05, 0.16]} p={[k * (w / 2 + 0.17), y, 0.03]} m={dk} cast={false} />))}
      </group>
    );
  }

  /* three-bay carved front of the ground storey, on the local +z face (z = hw) */
  function GroundFront({ hw, y0 }) {
    const M = useM();
    const dk = M.plain(DK, { roughness: 0.8 });
    const wood = M.plain(DK2, { roughness: 0.8 });
    const gold = M.plain('#4a2c1e');
    return (
      <group position={[0, 0, hw]}>
        <DoorBay p={[0, y0 + 0.02, 0.0]} w={0.72} h={1.3} />
        <DoorBay p={[-1.05, y0 + 0.02, 0]} w={0.6} h={1.2} arch />
        <DoorBay p={[1.05, y0 + 0.02, 0]} w={0.6} h={1.2} arch />
        {/* carved lintel band, with small teeth */}
        <Box s={[3.5, 0.16, 0.14]} p={[0, y0 + 1.62, 0.03]} m={wood} cast={false} />
        <Inst items={Array.from({ length: 22 }, (_, i) => ({ p: [-1.65 + i * 0.157, y0 + 1.5, 0.09], s: [0.07, 0.07, 0.07] }))} m={dk} cast={false} />
        {/* torana over the central door, with hanging bell */}
        <Box s={[1.1, 0.12, 0.14]} p={[0, y0 + 1.78, 0.06]} m={dk} cast={false} />
        <mesh position={[0, y0 + 1.78, 0.08]} material={wood}><torusGeometry args={[0.5, 0.06, 6, 20, P]} /></mesh>
        <mesh position={[0, y0 + 2.36, 0.08]} material={dk}><coneGeometry args={[0.1, 0.25, 6]} /></mesh>
        <Ball rad={0.1} p={[0, y0 + 2.18, 0.1]} sc={[1.4, 0.8, 0.8]} m={wood} />
        <Cyl rt={0.02} rb={0.06} h={0.14} p={[0, y0 + 1.48, 0.12]} m={M.plain('#6b5a3a', { metalness: 0.6 })} seg={8} />
        {/* frieze of carved posts above */}
        <Box s={[3.6, 0.3, 0.1]} p={[0, y0 + 2.08, -0.02]} m={dk} cast={false} />
        <Inst items={Array.from({ length: 16 }, (_, i) => ({ p: [-1.72 + i * 0.229, y0 + 2.08, 0.04], s: [0.08, 0.26, 0.08] }))} m={wood} cast={false} />
        <Inst items={Array.from({ length: 4 }, (_, i) => ({ p: [-1.65 + i * 1.1, y0 + 1.2, 0.0], s: [0.001, 0.001, 0.001] }))} m={dk} cast={false} />
        
      </group>
    );
  }

  /* plain carved blind door / window on the side faces of the ground storey */
  function GroundSide({ hw, y0 }) {
    const M = useM();
    return (
      <group position={[0, 0, hw]}>
        <Box s={[1.4, 1.25, 0.1]} p={[0, y0 + 0.9, 0]} m={M.plain(DK)} cast={false} />
        <Box s={[1.15, 1.0, 0.05]} p={[0, y0 + 0.9, 0.06]} m={M.plain(LEAF)} cast={false} />
        {[-0.38, -0.19, 0, 0.19, 0.38].map((x) => <Box key={x} s={[0.025, 1.0, 0.03]} p={[x, y0 + 0.9, 0.1]} m={M.plain(DK)} cast={false} />)}
        <Box s={[3.5, 0.3, 0.08]} p={[0, y0 + 2.1, 0]} m={M.plain(DK)} cast={false} />
        <Inst items={Array.from({ length: 12 }, (_, i) => ({ p: [-1.6 + i * 0.29, y0 + 2.1, 0.06], s: [0.08, 0.26, 0.08] }))} m={M.plain(DK2)} cast={false} />
      </group>
    );
  }

  /* upper storey face: row of timber lattice windows; local +z at z = hw */
  function UpperFace({ hw, y, n, ww, wh, detail }) {
    const M = useM();
    const step = (hw * 1.7) / n;
    return (
      <group position={[0, 0, hw]}>
        <Box s={[hw * 2 - 0.1, wh + 0.2, 0.06]} p={[0, y, 0.0]} m={M.plain('#6a4630')} cast={false} />
        {Array.from({ length: n }, (_, i) => (
          <LatticeWindow key={i} p={[-hw * 0.85 + step * (i + 0.5), y, 0.0]} w={ww} h={wh} bars={4} detail={detail} />
        ))}
        {Array.from({ length: n + 1 }, (_, i) => <Box key={i} s={[0.1, wh + 0.3, 0.12]} p={[-hw * 0.85 + step * i, y, 0.03]} m={M.plain(DK2)} cast={false} />)}
      </group>
    );
  }

  /* hanging pots and pans (offerings) */
  function Pots({ items }) {
    const M = useM();
    const cu = M.plain('#a86a3a', { metalness: 0.2, roughness: 0.7 });
    const br = M.plain('#b08a2a', { metalness: 0.2, roughness: 0.7 });
    return (
      <group>
        {items.map(([x, y, z, k], i) => (
          <group key={i} position={[x, y, z]}>
            <Cyl rt={0.004} h={0.2} p={[0, 0.1, 0]} m={M.dark} seg={4} />
            {k ? <Cyl rt={0.07} rb={0.05} h={0.1} p={[0, -0.02, 0]} m={cu} seg={10} /> : <Ball rad={0.065} p={[0, -0.02, 0]} sc={[1, 0.9, 1]} m={br} />}
          </group>
        ))}
      </group>
    );
  }

  function PaleNandi() {
    const M = useM();
    const w = M.plain('#8c867a', { roughness: 0.95 });
    return (
      <group>
        <Box s={[1.0, 0.14, 1.1]} p={[0, 0.07, 0]} m={M.plain('#8f887a')} />
        <Ball rad={0.55} sc={[0.95, 0.85, 1.15]} p={[0, 0.5, -0.05]} m={w} />
        <Ball rad={0.3} sc={[0.9, 0.9, 1]} p={[0, 0.9, 0.5]} m={w} />
        <Ball rad={0.17} sc={[0.9, 0.8, 1.1]} p={[0, 0.78, 0.8]} m={w} />
        <Ball rad={0.2} sc={[0.8, 0.9, 0.8]} p={[0, 0.95, 0.22]} m={w} />
        {[-1, 1].map((k) => <Ball key={k} rad={0.06} p={[k * 0.28, 1.12, 0.5]} sc={[0.6, 0.6, 1.3]} m={w} />)}
      </group>
    );
  }

  /* upright seated stone guardian lion on a pedestal, with mane and face */
  function GuardLion({ x }) {
    const M = useM();
    const g = M.plain('#847e72', { roughness: 0.95 });
    const dk = M.plain('#5e574b');
    return (
      <group position={[x, 0, 0]}>
        <Box s={[0.7, 0.5, 0.7]} p={[0, 0.25, 0]} m={M.plain('#a29a8b', { roughness: 0.95 })} />
        <Box s={[0.45, 0.9, 0.4]} p={[0, 0.95, 0]} m={g} />
        <Ball rad={0.42} sc={[1.05, 1.0, 0.55]} p={[0, 1.55, -0.02]} m={g} />
        <Ball rad={0.28} sc={[1, 0.9, 0.8]} p={[0, 1.52, 0.1]} m={g} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (i / 6) * P - P / 2 + P / 2; return <Ball key={i} rad={0.1} p={[Math.cos(a) * 0.36, 1.55 + Math.sin(a) * 0.36 - 0.1, 0.03]} m={g} />; })}
        {[-1, 1].map((k) => <Ball key={`e${k}`} rad={0.035} p={[k * 0.1, 1.6, 0.34]} m={dk} />)}
        <Box s={[0.2, 0.07, 0.06]} p={[0, 1.42, 0.36]} m={dk} cast={false} />
        <Box s={[0.1, 0.07, 0.06]} p={[0, 1.5, 0.36]} m={g} cast={false} />
        {[-1, 1].map((k) => <Ball key={k} rad={0.1} p={[k * 0.2, 0.7, 0.2]} sc={[0.8, 1.6, 0.8]} m={g} />)}
      </group>
    );
  }

  function Plinth() {
    const M = useM();
    const cs = [[7.6, 0.18, '#8a8274'], [7.0, 0.18, '#948b7b']];
    const joint = M.plain('#4e473c');
    let y = 0;
    return (
      <group>
        {cs.map(([w, h, c], ci) => {
          const yy = y; y += h;
          const items = []; let x = -w / 2;
          let k = ci * 3 + 1;
          while (x < w / 2 - 0.2) { const bw = 0.5 + ((k * 37) % 7) * 0.13; x += bw; k += 1; if (x < w / 2 - 0.1) items.push({ p: [x, yy + h / 2, w / 2 + 0.005], s: [0.02 + ((k * 13) % 3) * 0.015, h * 0.95, 0.02] }); }
          const its = items.map((it) => ({ ...it, p: [it.p[0], it.p[1], it.p[2]] }));
          return (
            <group key={ci}>
              <Box s={[w, h, w]} p={[0, yy + h / 2, 0]} m={M.plain(c === '#8a8274' ? '#7a7264' : '#877f6f', { roughness: 0.95 })} />
              {[0, P / 2, P, -P / 2].map((a) => <group key={a} rotation={[0, a, 0]}><Inst items={its} m={joint} cast={false} /></group>)}
            </group>
          );
        })}
      </group>
    );
  }

  /* ================= the great temple ================= */
  function Temple() {
    const M = useM();
    const brick = (rx, ry) => brickM(M, rx, ry);
    const timber = M.plain(DK2, { roughness: 0.85 });
    const pl = 0.7;
    const hw1 = 1.95; const y1a = pl; const y1b = 2.9;
    const hw2 = 1.35; const y2a = 3.1; const y2b = 5.5;
    const hw3 = 0.85; const y3a = 5.7; const y3b = 7.3;
    return (
      <group>
        <Plinth />
        <group position={[0, -0.34, 0]}>
        {/* storey 1 */}
        <Box s={[hw1 * 2, y1b - y1a, hw1 * 2]} p={[0, (y1a + y1b) / 2, 0]} m={brick(4, 3)} />
        <Frame4 hw={hw1} y0={y1a} y1={y1b} m={timber} />
        <GroundFront hw={hw1} y0={y1a} />
        {[P / 2, P, -P / 2].map((a) => <group key={a} rotation={[0, a, 0]}><GroundSide hw={hw1} y0={y1a} /></group>)}
        <Struts hw={hw1} o={1.3} yb={2.0} yt={2.88} n={14} tk={1.4} />
        {[1, 3, 5, 7].map((q) => (
          <group key={`cs${q}`} rotation={[0, (q * P) / 4, 0]}>
            <Box s={[0.16, 1.5, 0.2]} p={[0, 2.42, 3.4]} r={[0.97, 0, 0]} m={timber} />
            <Box s={[0.24, 0.24, 0.24]} p={[0, 1.8, 2.85]} m={M.plain(DK)} cast={false} />
          </group>
        ))}
        <PRoof w={6.8} d={6.8} h={0.9} y={2.92} fringe trim={DK} />
        {/* storey 2 */}
        <Box s={[hw2 * 2, y2b - y2a, hw2 * 2]} p={[0, (y2a + y2b) / 2, 0]} m={brick(3, 2)} />
        <Frame4 hw={hw2} y0={y2a} y1={y2b} m={timber} />
        {[0, P / 2, P, -P / 2].map((a, i) => <group key={a} rotation={[0, a, 0]}><UpperFace hw={hw2} y={4.3} n={3} ww={0.6} wh={1.5} detail={i === 0} /></group>)}
        <Struts hw={hw2} o={0.8} yb={4.3} yt={5.48} n={10} tk={1.3} />
        <PRoof w={4.3} d={4.3} h={0.75} y={5.52} trim={DK} />
        {/* storey 3 */}
        <Box s={[hw3 * 2, y3b - y3a, hw3 * 2]} p={[0, (y3a + y3b) / 2, 0]} m={brick(2, 1.5)} />
        <Frame4 hw={hw3} y0={y3a} y1={y3b} m={timber} />
        {[0, P / 2, P, -P / 2].map((a, i) => <group key={a} rotation={[0, a, 0]}><UpperFace hw={hw3} y={6.5} n={3} ww={0.36} wh={1.0} detail={i === 0} /></group>)}
        <Struts hw={hw3} o={0.6} yb={6.3} yt={7.28} n={6} tk={1.2} />
        <PRoof w={2.8} d={2.8} h={0.8} y={7.32} trim="#c9a227" sag={1.45} />
        <Gajur y={8.1} s={1.08} />
        {/* pots and pans hung from roof2 and roof3 eaves (front) */}
        <Pots items={[[-1.2, 5.25, 2.14, 1], [-0.6, 5.18, 2.14, 0], [0.5, 5.23, 2.14, 1], [1.1, 5.18, 2.14, 0], [1.75, 5.27, 2.0, 1], [-1.75, 5.27, 2.0, 0], [-0.55, 6.95, 1.28, 1], [0.1, 6.99, 1.28, 0], [0.65, 6.95, 1.28, 1]]} />
        {/* guardian lions flank the door, Nandi faces it */}
        <group position={[0, 0.7, 2.3]} scale={1.05}><GuardLion x={-0.8} /><GuardLion x={0.8} /></group>
        <group position={[0, 0.7, 3.1]} rotation={[0, P, 0]} scale={1.0}><PaleNandi /></group>
        </group>
        <Frame s={[14, 9.4, 9]} p={[-0.5, 4.7, 2.2]} />
      </group>
    );
  }

  /* ================= Unmatta Bhairav: smaller two-roofed temple ================= */
  function TwoRoof({ p, r = 0, s = 1, windows = true }) {
    const M = useM();
    const timber = M.plain(DK2, { roughness: 0.85 });
    const hw = 0.95; const hd = 0.8;
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[hw * 2 + 0.9, 0.3, hd * 2 + 0.9]} p={[0, 0.15, 0]} m={stoneM(M, 4, 2, '#8a8274')} />
        <Box s={[hw * 2, 1.15, hd * 2]} p={[0, 0.875, 0]} m={brickM(M, 3, 2)} />
        <Frame4 hw={hw} hd={hd} y0={0.3} y1={1.45} m={timber} />
        <group position={[0, 0, hd]}>
          <DoorBay p={[0, 0.32, 0]} w={0.5} h={0.85} />
          <DoorBay p={[-0.62, 0.32, 0]} w={0.3} h={0.7} arch />
          <DoorBay p={[0.62, 0.32, 0]} w={0.3} h={0.7} arch />
          <Box s={[1.9, 0.14, 0.08]} p={[0, 1.3, 0.02]} m={M.plain(DK)} cast={false} />
        </group>
        <Struts hw={hw} hd={hd} o={0.75} yb={1.0} yt={1.6} n={5} />
        <PRoof w={3.4} d={3.1} h={0.8} y={1.62} trim={DK} />
        <Box s={[1.4, 0.95, 1.2]} p={[0, 2.2, 0]} m={brickM(M, 2, 1.5)} />
        <Frame4 hw={0.7} hd={0.6} y0={1.75} y1={2.7} m={timber} />
        {windows && [-0.42, 0, 0.42].map((x) => <LatticeWindow key={x} p={[x, 2.25, 0.62]} w={0.28} h={0.42} bars={3} detail={false} />)}
        {windows && [-0.42, 0, 0.42].map((x) => (
          <group key={`bf${x}`} position={[x, 2.26, 0.7]}>
            <Ball rad={0.1} sc={[1, 1.1, 0.5]} m={M.plain('#3b2a22')} />
            {[-1, 1].map((k) => <Ball key={k} rad={0.02} p={[k * 0.04, 0.03, 0.05]} m={M.plain('#e8e0d0')} />)}
            <Box s={[0.07, 0.015, 0.02]} p={[0, -0.05, 0.05]} m={M.plain('#b03030')} cast={false} />
          </group>
        ))}
        {windows && [0, 1, 2].map((i) => <LatticeWindow key={`s${i}`} p={[0.72, 2.25, (i - 1) * 0.35]} r={P / 2} w={0.22} h={0.4} bars={3} detail={false} />)}
        <Struts hw={0.7} hd={0.6} o={0.5} yb={2.3} yt={2.75} n={4} />
        <PRoof w={2.4} d={2.2} h={0.75} y={2.77} trim={DK} />
        <Gajur y={3.5} s={0.4} />
      </group>
    );
  }

  function Main() {
    return (
      <group>
        <Temple />
        <TwoRoof p={[-8, 0, 4.5]} r={0.1} s={1.1} />
      </group>
    );
  }

  /* ================= environment ================= */
  function Hse({ p, r = 0, w = 3.6, d = 3, st = 3, ridge = false, bay = 0 }) {
    const M = useM();
    const sh = 1.15;
    const h = sh * st;
    const wallM = M.mat('brick', w / 1.4, st * 1.0, { color: '#d98a6c' });
    const wood = M.plain('#4a2c1c', { roughness: 0.85 });
    const dark = M.plain('#1d110a', { roughness: 0.9 });
    const nW = Math.max(2, Math.round(w / 1.3));
    const wx = (i) => ((i + 0.5) / nW - 0.5) * (w - 0.5);
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={wallM} />
        <Box s={[w + 0.06, 0.2, d + 0.06]} p={[0, 0.1, 0]} m={stoneM(M, 2, 1, '#9a9286')} cast={false} />
        {Array.from({ length: st }, (_, i) => (
          <group key={i}>
            <Box s={[w + 0.08, 0.1, d + 0.08]} p={[0, (i + 1) * sh - 0.05, 0]} m={wood} cast={false} />
            {i > 0 && Array.from({ length: nW }, (_, j) => (
              <group key={j} position={[wx(j), i * sh + 0.62, d / 2 + 0.02]}>
                <Box s={[0.82, 0.78, 0.07]} p={[0, 0, 0]} m={wood} cast={false} />
                <Box s={[0.66, 0.62, 0.08]} p={[0, 0, 0.01]} m={dark} cast={false} />
                {[-0.2, 0, 0.2].map((x) => <Box key={x} s={[0.035, 0.62, 0.09]} p={[x, 0, 0.02]} m={M.plain('#7a4a2a')} cast={false} />)}
                {[-0.15, 0.15].map((y) => <Box key={y} s={[0.66, 0.03, 0.09]} p={[0, y, 0.02]} m={M.plain('#7a4a2a')} cast={false} />)}
              </group>
            ))}
            {i > 0 && <Box s={[w - 0.2, 0.06, 0.1]} p={[0, i * sh + 0.14, d / 2 + 0.04]} m={wood} cast={false} />}
          </group>
        ))}
        <Box s={[w * 0.4, sh * 0.78, 0.08]} p={[(bay % 2 ? -1 : 1) * w * 0.18, sh * 0.42, d / 2 + 0.02]} m={wood} cast={false} />
        <Box s={[w * 0.3, sh * 0.68, 0.09]} p={[(bay % 2 ? -1 : 1) * w * 0.18, sh * 0.38, d / 2 + 0.03]} m={dark} cast={false} />
        {ridge
          ? <group rotation={[0, P / 2, 0]}><Roof w={d + 1.5} d={w + 1.5} h={0.95} y={h} m={htileM(M)} sag={1.15} lift={0.1} /></group>
          : <Roof w={w + 1.5} d={d + 1.5} h={0.95} y={h} m={htileM(M)} sag={1.15} lift={0.1} />}
      </group>
    );
  }

  function ShrineBox({ p, r = 0, s = 1 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]} scale={s}>
        <Box s={[0.9, 0.18, 0.9]} p={[0, 0.09, 0]} m={stoneM(M, 1, 1, '#8a8274')} />
        <Box s={[0.6, 0.55, 0.6]} p={[0, 0.45, 0]} m={stoneM(M, 1, 1, '#9d9585')} />
        <Box s={[0.22, 0.28, 0.04]} p={[0, 0.4, 0.31]} m={M.plain('#1d110a')} cast={false} />
        <Roof w={0.95} d={0.95} h={0.32} y={0.72} m={tileM(M, 1, 1)} sag={1.2} lift={0.1} fascia={false} />
        <Ball rad={0.05} p={[0, 1.07, 0]} m={M.gold} />
      </group>
    );
  }

  function LampPost({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.07} rb={0.1} h={2.1} p={[0, 1.05, 0]} m={M.plain('#2f2a26', { metalness: 0.5 })} seg={6} />
        <Box s={[0.3, 0.34, 0.3]} p={[0, 2.25, 0]} m={M.plain('#e8c987', { roughness: 0.4 })} cast={false} />
        <Box s={[0.4, 0.06, 0.4]} p={[0, 2.46, 0]} m={M.plain('#2f2a26')} cast={false} />
      </group>
    );
  }

  /* trees along a ridge of an ellipsoid hill */
  function RidgeTrees({ cx, cy, cz, rx, ry, n, seed = 0 }) {
    const M = useM();
    const m = M.plain('#4a6140', { roughness: 1 });
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const t = ((i + 0.5) / n - 0.5) * 1.5 + (((i * 7 + seed) % 5) - 2) * 0.01;
          const x = cx + t * rx;
          const y = cy + ry * Math.sqrt(Math.max(0, 1 - t * t)) - 0.4;
          const z = cz + 2 + (i % 3);
          const sc = 0.5 + ((i * 5 + seed) % 4) * 0.15;
          return (
            <group key={i} position={[x, y, z]} scale={sc}>
              <Ball rad={1.1} sc={[0.8, 1.7, 0.8]} p={[0, 1.2, 0]} m={m} />
              <Ball rad={0.8} sc={[1, 0.9, 1]} p={[0.6, 0.7, 0]} m={m} />
            </group>
          );
        })}
      </group>
    );
  }

  function SkyDome() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(100, 24, 16);
      const pos = g.attributes.position; const col = [];
      const top = new THREE.Color('#7fa9d4'); const mid = new THREE.Color('#b9d1e6'); const hor = new THREE.Color('#e6e2d4');
      for (let i = 0; i < pos.count; i += 1) {
        const t = Math.max(0, pos.getY(i) / 100);
        const c = hor.clone().lerp(mid, Math.min(1, t * 3)).lerp(top, Math.max(0, t * 1.6 - 0.2));
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      return g;
    }, []);
    return <mesh geometry={geo} position={[0, -2, 0]}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
  }

  function Env() {
    const M = useM();
    const water = M.plain('#6d949a', { roughness: 0.2, metalness: 0.15 });
    const hill = (c) => M.plain(c, { roughness: 1 });
    const stone = stoneM(M, 1, 1, '#8a8274');
    const pave = M.mat('brick', 11, 11, { color: '#c4ab94' });
    const wallB = M.mat('brick', 6, 1, { color: '#cf8a68' });
    const H = 11; // half-size of the paved square
    return (
      <group>
        <SkyDome />
        {/* lower ground around the raised courtyard platform */}
        <mesh position={[0, -0.62, 0]} rotation={[-P / 2, 0, 0]} material={M.mat('grass', 30, 30, { color: '#c4d09a' })} receiveShadow>
          <circleGeometry args={[78, 40]} />
        </mesh>
        {/* paved courtyard, about 22 x 22, brick-grey */}
        <Box s={[H * 2, 0.7, H * 2]} p={[0, -0.35, 0]} m={pave} cast={false} />
        <Box s={[9, 0.7, 7]} p={[15.5, -0.35, -2]} m={pave} cast={false} />
        {/* stone flag path from the plinth */}
        <Box s={[2.2, 0.03, 7]} p={[0, 0.02, 7.2]} m={M.plain('#a89e8a', { roughness: 0.95 })} cast={false} />
        {Array.from({ length: 7 }, (_, i) => <Box key={`fl${i}`} s={[2.2, 0.035, 0.03]} p={[0, 0.025, 4.2 + i]} m={M.plain('#6e675b')} cast={false} />)}

        {/* low brick wall along the courtyard edges, with gaps for lanes */}
        <Box s={[H * 2, 0.55, 0.35]} p={[0, 0.27, -H]} m={wallB} />
        <Box s={[0.35, 0.55, 9]} p={[-H, 0.27, -6.5]} m={wallB} />
        <Box s={[0.35, 0.55, 7]} p={[-H, 0.27, 7.5]} m={wallB} />
        <Box s={[8, 0.55, 0.35]} p={[-7, 0.27, H]} m={wallB} />
        <Box s={[7, 0.55, 0.35]} p={[7.5, 0.27, H]} m={wallB} />
        <Box s={[0.35, 0.55, 8]} p={[H, 0.27, -7]} m={wallB} />
        <Box s={[0.35, 0.55, 6]} p={[H, 0.27, 8]} m={wallB} />
        {[[-H, -H], [H, -H], [-H, H], [H, H]].map(([x, z], i) => <Box key={i} s={[0.5, 0.8, 0.5]} p={[x, 0.4, z]} m={stone} />)}

        {/* Newar brick houses around the square: gaps, offsets, 2-3 storeys */}
        {[[-17, -16.2, 4.4, 3, 3, 0], [-11.6, -15.4, 3.4, 3.2, 2, 1], [-3.4, -16.4, 4.6, 3, 3, 0], [2.4, -15.6, 3.6, 3, 2, 1], [11.2, -16.2, 4.2, 3.2, 3, 0], [17.4, -14.4, 3.8, 3, 2, 1]].map(([x, z, w, d, st, rg], i) => (
          <Hse key={`n${i}`} p={[x, 0, z]} r={(i % 2) * 0.04} w={w} d={d} st={st} bay={i} ridge={!!rg} />
        ))}
        {[[-15.6, -12, 3.6, 3, 3, 1], [-16.4, -4, 4.4, 3.2, 2, 0], [-15.4, 3.6, 3.8, 3, 3, 0], [-16.6, 12.2, 4.4, 3, 2, 1], [-15.6, 18, 3.8, 3, 3, 0]].map(([x, z, w, d, st, rg], i) => (
          <Hse key={`w${i}`} p={[x, 0, z]} r={P / 2 + (i % 2 ? 0.05 : -0.03)} w={w} d={d} st={st} bay={i + 1} ridge={!!rg} />
        ))}
        {[[-12.6, 16.6, 4.2, 3, 2, 0], [-6, 18, 3.8, 3, 2, 1], [13.5, 16.4, 4.0, 3, 2, 1]].map(([x, z, w, d, st, rg], i) => (
          <Hse key={`s${i}`} p={[x, 0, z]} r={P} w={w} d={d} st={st} bay={i} ridge={!!rg} />
        ))}
        {[[14.8, -13, 4, 3, 3, 0], [15.4, 8.4, 3.8, 3, 2, 1]].map(([x, z, w, d, st, rg], i) => (
          <Hse key={`e${i}`} p={[x, 0, z]} r={-P / 2} w={w} d={d} st={st} bay={i + 1} ridge={!!rg} />
        ))}

        {/* second two-roofed Shiva temple in the north-west corner */}
        <TwoRoof p={[-8.5, 0, -8.6]} r={0.05} s={0.9} windows />

        {/* stone bell on a chain between two plain monolithic posts (outside the sightline) */}
        <group position={[10, 0, 3]} rotation={[0, -0.6, 0]} scale={0.6}>
          <Box s={[3.2, 0.45, 1.8]} p={[0, 0.22, 0]} m={stoneM(M, 3, 1, '#b3ab9d')} />
          <Box s={[3.0, 1.8, 0.3]} p={[0, 1.35, -0.7]} m={brickM(M, 3, 1.5)} />
          {[-1, 1].map((k) => <Box key={k} s={[0.26, 2.3, 0.26]} p={[k * 1.05, 1.6, 0.1]} m={stoneM(M, 1, 3, '#7a746a')} />)}
          <Box s={[2.3, 0.07, 0.07]} p={[0, 2.52, 0.1]} m={M.plain('#3a3a3a', { metalness: 0.7 })} cast={false} />
          <mesh position={[0, 1.55, 0.1]} material={M.plain('#3a3a36', { metalness: 0.7, roughness: 0.45 })} castShadow>
            <latheGeometry args={[[new THREE.Vector2(0.03, 0.9), new THREE.Vector2(0.14, 0.86), new THREE.Vector2(0.24, 0.4), new THREE.Vector2(0.38, 0), new THREE.Vector2(0.4, -0.05)], 20]} />
          </mesh>
        </group>

        {/* small shrines, lingas and lamp posts filling the square */}
        {[[8.4, -6.6], [-5.6, -9.2], [-5.4, 8.8], [6.6, 8.6], [9.2, -9.4], [-9.4, 0.4], [3.6, -9.4], [-10, 9]].map(([x, z], i) => <ShrineBox key={i} p={[x, 0, z]} r={i * 0.5} s={0.85 + (i % 3) * 0.1} />)}
        {[[-3.2, 7.4], [4.6, 7.2], [-9.8, -3.4], [9.6, -1.6], [6, -9], [-1, 9.6], [8.6, 5.8]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]} scale={0.7}>
            <Box s={[0.9, 0.16, 0.9]} p={[0, 0.08, 0]} m={stone} />
            <Lingam p={[0, 0.16, 0]} />
          </group>
        ))}
        {[[-4.6, 5.6], [4.8, 4.6], [-6.6, -5.6], [7.4, -3.4], [-1.8, -10.2]].map(([x, z], i) => <LampPost key={i} p={[x, 0, z]} />)}
        <Diyo p={[-1.0, 0.36, 4.0]} light />
        <Diyo p={[1.0, 0.36, 4.0]} />
        <pointLight position={[0, 1.6, 4.0]} intensity={0.5} distance={5} color="#ffb35a" />

        {/* ghat steps, Tribeni sattal and the Roshi / Punyamati confluence to the east (outside the courtyard) */}
        {[0, 1, 2].map((i) => <Box key={i} s={[1.0, 0.2, 7]} p={[20.3 + i * 0.9, -0.1 - i * 0.2, -2]} m={stoneM(M, 2, 1, '#a89f90')} cast={false} />)}
        <group position={[20.5, 0, 5.5]} rotation={[0, -P / 2, 0]}>
          <Box s={[3.2, 0.3, 2]} p={[0, 0.15, 0]} m={stoneM(M, 2, 1, '#8a8274')} />
          {[-1.3, -0.45, 0.45, 1.3].map((x) => <Cyl key={x} rt={0.08} rb={0.1} h={1.1} p={[x, 0.85, 0.8]} m={M.plain(DK2)} seg={8} />)}
          <Box s={[3.4, 0.7, 2]} p={[0, 1.7, 0]} m={brickM(M, 2, 1)} />
          <Roof w={4} d={3} h={0.8} y={2.05} m={tileM(M, 3, 3)} sag={1.15} lift={0.1} />
        </group>
        <mesh position={[41, -0.5, -10]} rotation={[-P / 2, 0, 0.0]} material={water}><planeGeometry args={[44, 8]} /></mesh>
        <mesh position={[25.5, -0.48, -26]} rotation={[-P / 2, 0, 0.5]} material={water}><planeGeometry args={[5, 34]} /></mesh>
        <mesh position={[25.5, -0.48, 14]} rotation={[-P / 2, 0, -0.55]} material={water}><planeGeometry args={[5, 30]} /></mesh>
        <mesh position={[28.5, -0.5, -4]} rotation={[-P / 2, 0, 0]} material={water}><planeGeometry args={[8, 11]} /></mesh>
        {[[38, -20], [34, 8], [46, -22], [50, 6], [30, -32]].map(([x, z], i) => <Box key={i} s={[1.4, 0.3, 0.9]} p={[x, -0.45, z]} r={[0, i, 0]} m={stone} cast={false} />)}

        {/* trees at the edges (none between the camera and the temple) */}
        {[[-14, -23], [-4, -24], [6.4, -22.4], [-24, -6], [-23.6, 7], [18, 3], [-22, 24], [-2, -27], [19, -19], [24, -21], [-26, -18], [12.5, -24.8]].map(([x, z], i) => (
          <Tree key={i} p={[x, i % 3 ? 0 : -0.6, z]} s={1.5 + (i % 4) * 0.3} />
        ))}

        {/* low hazy ridges with tree silhouettes */}
        <Ball rad={26} sc={[2.2, 0.5, 1]} p={[-22, -4, -64]} m={hill('#7f9166')} />
        <Ball rad={22} sc={[2.0, 0.45, 1]} p={[22, -4, -68]} m={hill('#869a74')} />
        <Ball rad={24} sc={[1, 0.5, 2.0]} p={[-66, -4, -10]} m={hill('#7a8c63')} />
        <Ball rad={36} sc={[2.4, 0.4, 1]} p={[-30, -8, -76]} m={hill('#8aa0b4')} />
        <Ball rad={30} sc={[1, 0.4, 2.2]} p={[-76, -6, 22]} m={hill('#8aa0b4')} />
        <Ball rad={20} sc={[1.6, 0.35, 1]} p={[62, -5, -52]} m={hill('#8ea4b2')} />
        <RidgeTrees cx={-22} cy={-4} cz={-64} rx={57} ry={13} n={16} seed={1} />
        <RidgeTrees cx={22} cy={-4} cz={-68} rx={44} ry={9.9} n={12} seed={3} />
      </group>
    );
  }

  return { 'indreshwar-mahadev-panauti': { Main, Env } };
}
