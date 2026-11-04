// Kakrebihar (Birendranagar, Surkhet). One ~6.5 m reassembled honey-sandstone Nagara/shikhara temple standing alone on the
// Latikoili hilltop in sal and pine forest, carved blocks scattered around, flat Surkhet valley far below, a red-brick
// two-tier gate at the forest edge. 1 unit = about 1 m. Front (doorway) faces +z. Crown (amalaka disc + finial) is an inference.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, THREE, useMemo, Frame, PrayerFlags } = K;

  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const HONEY = '#c9aa7c';
  const SHADE = '#9a8060';
  const PALE = '#b9b3a3';

  /* ---------- the temple ---------- */
  function Temple() {
    const M = useM();
    const stone = M.plain(HONEY, { roughness: 0.95 });
    const stone2 = M.plain('#b99a6e', { roughness: 0.95 });
    const shade = M.plain(SHADE, { roughness: 1 });
    const pale = M.plain(PALE, { roughness: 1 });
    const moss = M.plain('#7c8266', { roughness: 1 });
    const dark = M.plain('#120d09', { roughness: 1 });
    const lintelM = M.plain('#d6b98c', { roughness: 0.9 });

    const plinth = [
      [3.5, 0.2, pale], [3.38, 0.1, moss], [3.3, 0.18, pale], [3.16, 0.08, shade], [3.06, 0.2, stone2], [2.96, 0.07, shade], [2.86, 0.16, stone],
    ];
    let y = 0;
    const plinthEls = plinth.map(([w, h, m], i) => { const el = <Box key={i} s={[w, h, w]} p={[0, y + h / 2, 0]} m={m} />; y += h; return el; });
    const yP = y;

    const BW = 2.4; const BH = 2.6; const yB = yP;
    const H = 3.6; const N = 28;
    const courses = useMemo(() => {
      const arr = []; const y0 = yB + BH;
      let yy = y0;
      for (let i = 0; i < N; i++) {
        const t = i / N;
        const h = (H / N) * (1.08 - t * 0.16);
        const w = 2.3 * (1 - 0.38 * t);
        arr.push({ y: yy, h, w, t, i });
        yy += h;
      }
      return { arr, top: yy };
    }, [yB]);
    const wallH = BH - 0.32;
    const wallC = yB + 0.32 + wallH / 2;

    return (
      <group>
        {plinthEls}
        <Box s={[2.1, 0.16, 0.5]} p={[0, 0.08, 2.0]} m={pale} />
        <Box s={[1.8, 0.16, 0.4]} p={[0, 0.24, 1.88]} m={stone2} />
        <Box s={[1.5, 0.14, 0.3]} p={[0, 0.39, 1.8]} m={stone} />

        <Box s={[2.7, 0.1, 2.7]} p={[0, yB + 0.05, 0]} m={shade} />
        <Box s={[2.58, 0.16, 2.58]} p={[0, yB + 0.18, 0]} m={stone2} />
        <Box s={[2.5, 0.06, 2.5]} p={[0, yB + 0.29, 0]} m={shade} />
        <Box s={[BW, wallH, BW]} p={[0, wallC, 0]} m={stone} />

        {[[1, 0], [-1, 0], [0, -1]].map(([sx, sz], k) => {
          const rotY = sx === 1 ? Math.PI / 2 : sx === -1 ? -Math.PI / 2 : Math.PI;
          return (
            <group key={k} rotation={[0, rotY, 0]}>
              <Box s={[0.62, wallH, 0.2]} p={[0, wallC, BW / 2 + 0.08]} m={stone2} />
              <Box s={[0.5, 0.5, 0.06]} p={[0, yB + 0.85, BW / 2 + 0.2]} m={shade} />
              <Box s={[0.26, 0.26, 0.07]} p={[0, yB + 0.85, BW / 2 + 0.24]} r={[0, 0, Math.PI / 4]} m={stone} />
              <Box s={[0.5, 0.5, 0.06]} p={[0, yB + 1.35, BW / 2 + 0.2]} m={shade} />
              {[-0.12, 0.12].map((x) => <Box key={x} s={[0.1, 0.34, 0.08]} p={[x, yB + 1.35, BW / 2 + 0.25]} m={stone} />)}
              {[-0.8, -0.45, 0.45, 0.8].map((x) => (
                <group key={x}>
                  <Box s={[0.28, 1.0, 0.05]} p={[x, yB + 0.98, BW / 2 + 0.02]} m={shade} />
                  <Box s={[0.1, 0.7, 0.07]} p={[x, yB + 1.0, BW / 2 + 0.06]} m={stone} />
                  <Ball rad={0.05} p={[x, yB + 1.42, BW / 2 + 0.08]} m={stone} />
                </group>
              ))}
              <Box s={[BW + 0.04, 0.12, 0.05]} p={[0, yB + 1.58, BW / 2 + 0.03]} m={shade} />
              {Array.from({ length: 9 }, (_, i) => <Box key={'l' + i} s={[0.16, 0.16, 0.07]} r={[0, 0, Math.PI / 4]} p={[-0.96 + i * 0.24, yB + 1.8, BW / 2 + 0.05]} m={i % 2 ? shade : stone} />)}
              <Box s={[BW + 0.05, 0.1, 0.07]} p={[0, yB + 2.02, BW / 2 + 0.04]} m={shade} />
              {Array.from({ length: 8 }, (_, i) => <Box key={'t' + i} s={[0.2, 0.08, 0.07]} p={[-0.84 + i * 0.24, yB + 2.2, BW / 2 + 0.05]} m={stone} />)}
              {Array.from({ length: 12 }, (_, i) => <Box key={'p' + i} s={[0.12, i % 2 ? 0.12 : 0.17, 0.08]} p={[-0.99 + i * 0.18, yB + 0.43 + (i % 2 ? 0 : 0.025), BW / 2 + 0.05]} m={i % 2 ? stone2 : stone} />)}
              <Box s={[BW + 0.06, 0.1, 0.1]} p={[0, yB + 0.32, BW / 2 + 0.03]} m={stone2} />
            </group>
          );
        })}
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([a, b], i) => (
          <Box key={i} s={[0.28, wallH, 0.28]} p={[a * (BW / 2 - 0.02), wallC, b * (BW / 2 - 0.02)]} m={stone2} />
        ))}

        {/* ---- portico / doorway (front, +z) ---- */}
        <group position={[0, 0, BW / 2]}>
          <Box s={[1.7, wallH, 0.75]} p={[0, wallC, 0.3]} m={stone2} />
          <Box s={[0.9, 1.5, 0.34]} p={[0, yB + 0.32 + 0.75, 0.56]} m={dark} />
          {[[1.5, 1.7, 0.76, lintelM], [1.26, 1.62, 0.72, stone], [1.02, 1.55, 0.68, lintelM]].map(([fw, fh, fz, fm], i) => {
            const jw = (fw - 0.9) / 2;
            return (
              <group key={i}>
                <Box s={[jw, fh, 0.08]} p={[-(0.45 + jw / 2), yB + 0.32 + fh / 2, fz]} m={fm} />
                <Box s={[jw, fh, 0.08]} p={[(0.45 + jw / 2), yB + 0.32 + fh / 2, fz]} m={fm} />
                <Box s={[fw, 0.12, 0.08]} p={[0, yB + 0.32 + fh + 0.04 - i * 0.02, fz]} m={fm} />
              </group>
            );
          })}
          {[-0.68, 0.68].map((x) => (
            <group key={x}>
              <Box s={[0.42, 0.14, 0.42]} p={[x, yB + 0.39, 0.74]} m={shade} />
              <Box s={[0.34, 1.5, 0.34]} p={[x, yB + 1.2, 0.74]} m={stone} />
              <Box s={[0.38, 0.1, 0.38]} p={[x, yB + 1.3, 0.74]} m={shade} />
              <Box s={[0.42, 0.12, 0.42]} p={[x, yB + 1.99, 0.74]} m={stone2} />
              <Box s={[0.6, 0.14, 0.5]} p={[x, yB + 2.1, 0.74]} m={lintelM} />
            </group>
          ))}
          <Box s={[1.9, 0.16, 0.6]} p={[0, yB + 2.24, 0.74]} m={lintelM} />
          <Box s={[1.75, 0.06, 0.62]} p={[0, yB + 2.35, 0.74]} m={shade} />
          {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.16, 0.08, 0.08]} p={[-0.75 + i * 0.3, yB + 2.24, 1.06]} m={stone} />)}
        </group>

        {/* ---- shikhara ---- */}
        {courses.arr.map(({ y: cy, h, w, t, i }) => (
          <group key={i}>
            <Box s={[w, h * 0.78, w]} p={[0, cy + h * 0.39, 0]} m={i % 2 ? stone : stone2} />
            <Box s={[w + 0.12, h * 0.22, w + 0.12]} p={[0, cy + h * 0.89, 0]} m={shade} />
            {[0, 1, 2, 3].map((k) => (
              <group key={k} rotation={[0, k * Math.PI / 2, 0]}>
                {/* central spine, projecting ~0.2 and widening toward the base */}
                <Box s={[w * (0.26 + 0.2 * (1 - t)), h * 0.95, 0.22]} p={[0, cy + h * 0.47, w / 2 + 0.1]} m={i % 2 ? stone2 : stone} />
              </group>
            ))}
          </group>
        ))}
        {/* turret rows on every face: every 3rd course (8 rows) */}
        {Array.from({ length: 8 }, (_, r) => {
          const c = courses.arr[1 + r * 3];
          const w = c.w; const s = 0.3 - r * 0.018;
          const out = [];
          [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b], k) => {
            out.push(
              <group key={'c' + k} position={[a * (w / 2), c.y + c.h, b * (w / 2)]}>
                <Box s={[s, s * 1.5, s]} p={[0, s * 0.75, 0]} m={stone} />
                <Box s={[s * 1.15, s * 0.18, s * 1.15]} p={[0, s * 1.5, 0]} m={shade} />
                <Box s={[s * 0.6, s * 0.45, s * 0.6]} p={[0, s * 1.8, 0]} m={stone2} />
                <Ball rad={s * 0.2} p={[0, s * 2.15, 0]} sc={[1, 1.3, 1]} m={stone} />
              </group>
            );
          });
          [0, 1, 2, 3].forEach((k) => {
            [-1, 1].forEach((a) => {
              out.push(
                <group key={'f' + k + a} rotation={[0, k * Math.PI / 2, 0]}>
                  <group position={[a * w * 0.32, c.y + c.h, w / 2 + 0.02]}>
                    <Box s={[s * 0.8, s * 1.3, s * 0.7]} p={[0, s * 0.65, 0]} m={stone} />
                    <Box s={[s * 0.95, s * 0.15, s * 0.85]} p={[0, s * 1.3, 0]} m={shade} />
                  </group>
                  {r < 7 && (
                    <group position={[a * w * 0.42, c.y + c.h * 2.1, w / 2 + 0.07]}>
                      <Box s={[0.08, 0.1, 0.05]} r={[0, 0, Math.PI / 4]} m={shade} />
                    </group>
                  )}
                </group>
              );
            });
          });
          return <group key={r}>{out}</group>;
        })}
        {/* two stacked openings on the central bay above the door */}
        {[[0.3, 0.3, 0.28], [0.06, 0.5, 0.42]].map(([t, hh, ww], i) => {
          const c = courses.arr[Math.floor(t * N)];
          return (
            <group key={i} position={[0, c.y + 0.1, c.w / 2 + 0.2]}>
              <Box s={[ww + 0.14, hh + 0.14, 0.08]} p={[0, hh / 2, 0]} m={lintelM} />
              <Box s={[ww, hh, 0.12]} p={[0, hh / 2, 0.03]} m={dark} />
            </group>
          );
        })}
        {/* crown: flat amalaka (~0.9 wide) and a small kalasa (inferred) */}
        <group position={[0, courses.top, 0]}>
          <Box s={[1.0, 0.1, 1.0]} p={[0, 0.05, 0]} m={shade} />
          <Cyl rt={0.46} rb={0.44} h={0.18} p={[0, 0.19, 0]} m={stone} seg={16} />
          <Cyl rt={0.4} rb={0.47} h={0.1} p={[0, 0.33, 0]} m={stone2} seg={16} />
          <Cyl rt={0.2} rb={0.26} h={0.12} p={[0, 0.44, 0]} m={stone} seg={12} />
          <Ball rad={0.15} p={[0, 0.58, 0]} sc={[1, 1.15, 1]} m={stone2} />
          <Cyl rt={0.02} rb={0.04} h={0.22} p={[0, 0.78, 0]} m={stone} seg={8} />
        </group>
      </group>
    );
  }

  /* ---------- scattered carved blocks, Buddha ---------- */
  function Blocks() {
    const M = useM();
    const items = useMemo(() => {
      const r = rng(77); const a = [];
      for (let i = 0; i < 18; i++) {
        const ang = r() * Math.PI * 2; const rad = 4.2 + r() * 8;
        const x = Math.cos(ang) * rad; const z = Math.sin(ang) * rad;
        if (z > 1.5 && Math.abs(x) < 2.4) continue;
        a.push({ x, z, w: 0.35 + r() * 0.7, h: 0.2 + r() * 0.3, d: 0.3 + r() * 0.6, ry: r() * 3, rz: (r() - 0.5) * 0.25, t: r() });
      }
      return a;
    }, []);
    const heaps = useMemo(() => {
      const out = [];
      [[-7.0, -3.2, 14, 3], [6.8, -3.6, 12, 7]].forEach(([cx, cz, n, sd]) => {
        const r = rng(sd * 11);
        for (let i = 0; i < n; i++) {
          const layer = i < n * 0.55 ? 0 : i < n * 0.85 ? 1 : 2;
          const rad = (layer === 0 ? 1.7 : layer === 1 ? 1.0 : 0.4) * Math.sqrt(r());
          const ang = r() * 6.28;
          out.push({ x: cx + Math.cos(ang) * rad * 1.1, z: cz + Math.sin(ang) * rad, y: layer * 0.34 + 0.1, w: 0.5 + r() * 0.6, h: 0.28 + r() * 0.16, d: 0.4 + r() * 0.5, ry: r() * 3, rz: (r() - 0.5) * 0.3, t: r() });
        }
      });
      return out;
    }, []);
    const ms = [M.plain('#c4a97e', { roughness: 1 }), M.plain('#a89a82', { roughness: 1 }), M.plain('#8d8472', { roughness: 1 })];
    return (
      <group>
        {items.map((b, i) => (
          <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.ry, b.rz]}>
            <Box s={[b.w, b.h, b.d]} p={[0, b.h / 2 - 0.03, 0]} m={ms[Math.floor(b.t * 3)]} />
            {b.t > 0.6 && <Box s={[b.w * 0.5, 0.05, b.d * 0.9]} p={[0, b.h + 0.01, 0]} m={ms[0]} />}
          </group>
        ))}
        {heaps.map((b, i) => (
          <Box key={'h' + i} s={[b.w, b.h, b.d]} p={[b.x, b.y, b.z]} r={[0, b.ry, b.rz]} m={ms[Math.floor(b.t * 3)]} />
        ))}
        {/* step-like slab stacks beside the heaps */}
        {[[-5.2, -1.2, 0.3], [-8.4, -5.0, 1.1], [4.4, -5.2, 2.0]].map(([x, z, ry], i) => (
          <group key={'sl' + i} position={[x, 0, z]} rotation={[0, ry, 0]}>
            {[0, 1, 2, 3].map((j) => <Box key={j} s={[1.6 - j * 0.3, 0.16, 0.9 - j * 0.12]} p={[j * 0.1, 0.08 + j * 0.17, 0]} m={ms[(i + j) % 3]} />)}
          </group>
        ))}
        {/* carved frieze fragments with lotus bands */}
        {[[-3.4, -2.6, 0.4], [-6.0, 0.2, 2.2], [3.6, -3.4, 1.0]].map(([x, z, ry], i) => (
          <group key={'fr' + i} position={[x, 0, z]} rotation={[0, ry, 0.05]}>
            <Box s={[0.9, 0.3, 0.4]} p={[0, 0.15, 0]} m={ms[0]} />
            <Box s={[0.9, 0.08, 0.06]} p={[0, 0.17, 0.2]} m={ms[2]} />
            {[-0.3, -0.1, 0.1, 0.3].map((q) => <Box key={q} s={[0.14, 0.1, 0.07]} p={[q, 0.17, 0.22]} m={ms[1]} />)}
          </group>
        ))}
      </group>
    );
  }

  function Buddha() {
    const M = useM();
    const st = M.plain('#c2a47a', { roughness: 0.95 });
    const st2 = M.plain('#b3956b', { roughness: 0.95 });
    const shade = M.plain('#8a7050', { roughness: 1 });
    const dk = M.plain('#2a1f16', { roughness: 1 });
    const white = M.plain('#f4f1e8', { roughness: 1 });
    return (
      <group position={[2.7, 0, 3.3]} rotation={[0, -0.5, 0]}>
        <Box s={[0.9, 0.2, 0.62]} p={[0, 0.1, 0]} m={st2} />
        <Box s={[0.8, 0.8, 0.54]} p={[0, 0.6, 0]} m={st} />
        <Box s={[0.84, 0.07, 0.58]} p={[0, 1.04, 0]} m={shade} />
        <Box s={[0.5, 0.58, 0.06]} p={[0, 0.62, 0.28]} m={dk} />
        {/* lotus frieze above and below the niche */}
        {[-0.28, -0.14, 0, 0.14, 0.28].map((x, i) => <Box key={'a' + x} s={[0.1, i % 2 ? 0.07 : 0.1, 0.05]} p={[x, 0.93, 0.29]} m={shade} />)}
        {[-0.28, -0.14, 0, 0.14, 0.28].map((x, i) => <Box key={'b' + x} s={[0.1, i % 2 ? 0.06 : 0.09, 0.05]} p={[x, 0.27, 0.29]} m={shade} />)}
        {/* seated Buddha, ~0.7 m with throne */}
        <Box s={[0.36, 0.06, 0.2]} p={[0, 0.36, 0.2]} m={st2} />
        <Cyl rt={0.07} rb={0.13} h={0.26} p={[0, 0.52, 0.2]} m={st} seg={10} />
        <Ball rad={0.075} p={[0, 0.74, 0.2]} m={st} />
        <Box s={[0.04, 0.06, 0.04]} p={[0, 0.84, 0.2]} m={st} />
        {/* white khata over the shoulders, ends hanging down the chest */}
        <Box s={[0.2, 0.05, 0.12]} p={[0, 0.66, 0.2]} m={white} />
        <Box s={[0.07, 0.26, 0.03]} p={[-0.05, 0.52, 0.31]} r={[0, 0, 0.12]} m={white} />
        <Box s={[0.07, 0.26, 0.03]} p={[0.05, 0.52, 0.31]} r={[0, 0, -0.12]} m={white} />
      </group>
    );
  }

  function Diya({ p }) {
    const M = useM();
    return (
      <group position={p}>
        <Cyl rt={0.06} rb={0.04} h={0.04} p={[0, 0.02, 0]} m={M.plain('#8b4a2a')} seg={8} />
        <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.025, 0.08, 6]} /><meshBasicMaterial color="#ffcf7a" toneMapped={false} /></mesh>
        <pointLight position={[0, 0.3, 0.1]} intensity={1.2} distance={3.2} color="#ffb35a" />
      </group>
    );
  }

  function KakreMain() {
    return (
      <group>
        <Temple />
        <Blocks />
        <Buddha />
        <Diya p={[-0.5, 0.42, 2.9]} />
        <Diya p={[2.6, 0.62, 3.9]} />
        <Frame s={[4.4, 8.2, 5.4]} p={[0, 4.1, 0.9]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function SalTree({ p, s = 1, kind, v = 0 }) {
    const M = useM();
    const pine = kind === 'pine';
    const bark = M.plain(pine ? '#6d4a35' : '#a39e90', { roughness: 1 });
    const leaf = M.plain(pine ? '#2c4a30' : '#4b7233', { roughness: 1 });
    const leaf2 = M.plain(pine ? '#355a38' : '#5b8a3c', { roughness: 1 });
    const th = 16 + v * 2;
    return (
      <group position={p} scale={s} rotation={[0, v * 6, 0]}>
        {pine ? (
          <>
            <Cyl rt={0.2} rb={0.34} h={11} p={[0, 5.5, 0]} m={bark} seg={7} />
            {[0, 1, 2].map((i) => <mesh key={i} position={[0, 8.6 + i * 1.5, 0]} material={i % 2 ? leaf : leaf2}><coneGeometry args={[1.7 - i * 0.4, 2.4, 8]} /></mesh>)}
          </>
        ) : (
          <>
            <Cyl rt={0.15} rb={0.38} h={th} p={[0, th / 2, 0]} m={bark} seg={7} />
            {[[0, th + 0.4, 0, 1.9], [1.5, th - 0.9, 0.4, 1.4], [-1.4, th - 1.3, -0.4, 1.5], [0.3, th + 1.2, -1.1, 1.2]].map(([x, y, z, r], i) => <Ball key={i} rad={r} p={[x, y, z]} sc={[1.2, 0.5, 1.2]} m={i % 2 ? leaf : leaf2} />)}
          </>
        )}
      </group>
    );
  }

  function Gate() {
    const M = useM();
    const brick = M.mat('brick', 2, 2, { color: '#e3a58a' });
    const tile = M.mat('roof', 4, 2, { color: '#b5503c' });
    const blk = M.plain('#0e0e10', { roughness: 0.6 });
    const white = M.plain('#f3efe6');
    return (
      <group>
        <Box s={[5.4, 0.5, 1.4]} p={[0, 0.25, 0]} m={brick} />
        {[-2.2, -0.75, 0.75, 2.2].map((x) => <Box key={x} s={[0.5, 3.2, 0.55]} p={[x, 2.1, 0]} m={brick} />)}
        <Box s={[5.4, 0.35, 0.8]} p={[0, 3.55, 0]} m={brick} />
        <Box s={[1.45, 2.5, 0.2]} p={[0, 1.75, 0]} m={blk} />
        {[-1.5, 1.5].map((x) => <Box key={x} s={[0.8, 2.2, 0.2]} p={[x * 1.0, 1.65, 0]} m={blk} />)}
        {[0, -1.5, 1.5].map((x) => <Box key={x} s={[0.25, 0.7, 0.24]} p={[x, 1.8, 0]} m={white} />)}
        <Box s={[2.6, 0.3, 0.1]} p={[0, 3.1, 0.35]} m={M.plain('#c7a85a')} />
        <Roof w={6.4} d={2.6} h={0.9} y={3.7} m={tile} sag={1.1} />
        <Roof w={4.2} d={2.2} h={0.8} y={4.5} m={tile} sag={1.1} />
        <Box s={[0.1, 0.1, 0.1]} p={[0, 5.4, 0]} m={tile} />
      </group>
    );
  }

  function Valley() {
    const M = useM();
    const r = rng(9);
    const houses = useMemo(() => {
      const a = []; const cols = ['#e8d9b8', '#d9a07c', '#9fc4b0', '#e6c85a', '#c9d3d8', '#b46d5e', '#f2efe6'];
      for (let i = 0; i < 90; i++) {
        const x = -70 + r() * 150; const z = 48 + r() * 70;
        a.push({ x, z, y: -22, w: 2 + r() * 2.5, d: 2 + r() * 2.5, h: 2.4 + r() * 3 * (r() > 0.7 ? 1.6 : 1), c: cols[Math.floor(r() * cols.length)], ry: (r() - 0.5) * 0.4 });
      }
      // nearer ring on a lower terrace of the hill, front-right, roofs peeking over the edge
      const q = rng(31);
      for (let i = 0; i < 9; i++) {
        const x = 17 + (q() - 0.5) * 11; const z = 17 + (q() - 0.5) * 11;
        a.push({ x, z, y: -8.2, w: 2.2 + q() * 1.6, d: 2.2 + q() * 1.6, h: 2.2 + q() * 1.6, c: cols[Math.floor(q() * cols.length)], ry: q() * 3 });
      }
      return a;
    }, []);
    const field = [['#9aa35a', -40, 60], ['#b7a55c', 10, 72], ['#7f9a4c', 55, 66], ['#c2b36d', -10, 100]];
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -22, 0]} receiveShadow material={M.plain('#8a9a54', { roughness: 1 })}><circleGeometry args={[240, 48]} /></mesh>
        {field.map(([c, x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -21.9, z]} material={M.plain(c, { roughness: 1 })}><planeGeometry args={[40, 22]} /></mesh>)}
        {houses.map((h, i) => (
          <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.ry, 0]}>
            <Box s={[h.w, h.h, h.d]} p={[0, h.h / 2, 0]} m={M.plain(h.c, { roughness: 0.9 })} cast={false} />
            <Box s={[h.w + 0.3, 0.25, h.d + 0.3]} p={[0, h.h + 0.12, 0]} m={M.plain('#8c5a48')} cast={false} />
          </group>
        ))}
        {[[-110, 150, 70, 42], [-40, 175, 85, 55], [60, 170, 90, 50], [130, 140, 70, 40], [-170, 60, 60, 38], [175, 40, 60, 36]].map(([x, z, r2, h], i) => (
          <mesh key={i} position={[x, -22 + h * 0.4, z]} scale={[1, 0.55, 1]} material={M.plain(i % 2 ? '#3f5f3a' : '#4b6c40', { roughness: 1 })}><coneGeometry args={[r2, h * 1.8, 10]} /></mesh>
        ))}
      </group>
    );
  }

  function HazeSky() {
    const geo = useMemo(() => {
      const g = new THREE.SphereGeometry(215, 24, 16);
      const pos = g.attributes.position; const cols = [];
      const top = new THREE.Color('#8fb5c4'); const hor = new THREE.Color('#c3dccf'); const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const t = Math.min(1, Math.max(0, pos.getY(i) / 120));
        c.copy(hor).lerp(top, Math.sqrt(t)); cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      return g;
    }, []);
    return <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.BackSide} roughness={1} fog={false} /></mesh>;
  }

  function KakreEnv() {
    const M = useM();
    const earth = M.plain('#766c4c', { roughness: 1 });
    const litter = useMemo(() => {
      const r = rng(5); const a = [];
      for (let i = 0; i < 20; i++) {
        const ang = r() * 6.28; const rad = 3 + r() * 12.5;
        a.push({ x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, rr: 0.35 + r() * 0.7, c: ['#5e5236', '#6c5f3c', '#4f4a30', '#75673f'][i % 4] });
      }
      const sh = [];
      for (let i = 0; i < 12; i++) {
        const ang = r() * 6.28; const rad = 5 + r() * 10;
        sh.push({ x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, s: 0.6 + r() * 0.4 });
      }
      return { a, sh };
    }, []);
    const trees = useMemo(() => {
      const r = rng(21); const a = [];
      for (let i = 0; i < 70; i++) {
        const ang = r() * Math.PI * 2;
        const rad = 14 + r() * 15;
        const x = Math.cos(ang) * rad; const z = Math.sin(ang) * rad;
        if (z > -1 && x > -6) { if (r() > 0.1) continue; }
        if (z > 2 && x > -9) continue;
        // keep clear of both 3/4 camera lines (x = z and x = -z on the front side) by >= 12 m
        if (z > 0 && Math.abs(Math.abs(x) - z) / 1.414 < 12 && rad < 20) continue;
        a.push({ x, z, s: 0.8 + r() * 0.5, kind: r() > 0.75 ? 'pine' : 'sal', v: r() });
      }
      return a;
    }, []);
    return (
      <group>
        <HazeSky />
        <Cyl rt={17} rb={30} h={22} p={[0, -11.06, 0]} m={M.plain('#6d7a45', { roughness: 1 })} seg={40} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} receiveShadow material={earth}><circleGeometry args={[16.6, 48]} /></mesh>
        {/* lower terrace ledge and retaining wall at the front-right hill edge */}
        <Cyl rt={4.6} rb={5.2} h={1.2} p={[13.6, -3.6, 13.6]} m={M.plain('#7b8a4c', { roughness: 1 })} seg={20} />
        <Box s={[5, 0.7, 0.4]} p={[11.6, -2.6, 15.4]} r={[0, 0.78, 0]} m={M.plain('#a89a82', { roughness: 1 })} />
        {/* lower village terrace with roofs just peeking over the edge */}
        <Cyl rt={10} rb={11} h={1.0} p={[17, -8.7, 17]} m={M.plain('#8d9a55', { roughness: 1 })} seg={24} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 8]} material={M.plain('#8c7452', { roughness: 1 })}><planeGeometry args={[2.4, 12]} /></mesh>
        {litter.a.map((d, i) => <mesh key={'lt' + i} rotation={[-Math.PI / 2, 0, 0]} position={[d.x, 0.012 + (i % 5) * 0.002, d.z]} material={M.plain(d.c, { roughness: 1 })}><circleGeometry args={[d.rr, 9]} /></mesh>)}
        {litter.sh.map((d, i) => (
          <group key={'sh' + i} position={[d.x, 0, d.z]}>
            <mesh position={[0, d.s * 0.45, 0]} scale={[1.2, 1.0, 1.1]} material={M.plain(i % 2 ? '#4f7a36' : '#628a3e', { roughness: 1 })}><sphereGeometry args={[d.s * 0.6, 8, 6]} /></mesh>
            <mesh position={[d.s * 0.3, d.s * 0.35, d.s * 0.2]} rotation={[0, 0.5, 0.3]} material={M.plain('#5f8c3c', { roughness: 1 })}><coneGeometry args={[d.s * 0.35, d.s * 0.7, 6]} /></mesh>
          </group>
        ))}
        {trees.map((t, i) => <SalTree key={i} p={[t.x, 0, t.z]} s={t.s} kind={t.kind} v={t.v} />)}
        {/* a few tall straight sal trunks flanking the clearing on the camera side */}
        {[[11.5, -1.5, 1.0], [-11.5, 1.5, 1.1], [8, -7, 0.95], [-8.5, -6, 1.05]].map(([x, z, s], i) => <SalTree key={'t' + i} p={[x, 0, z]} s={s} kind="tall" v={i * 0.2} />)}
        {/* forested Surkhet hills behind the temple (camera looks toward -z) */}
        {[[-90, -120, 80, 60], [-20, -150, 95, 75], [70, -135, 85, 62], [130, -90, 70, 50], [-140, -60, 65, 48], [10, -95, 55, 40]].map(([x, z, r2, h], i) => (
          <mesh key={'bh' + i} position={[x, -22 + h * 0.42, z]} scale={[1, 0.55, 1]} material={M.plain(['#3c5c3a', '#486a40', '#557a48'][i % 3], { roughness: 1 })}><coneGeometry args={[r2, h * 1.8, 10]} /></mesh>
        ))}
        <Valley />
        <group position={[-13, 0, 6]} rotation={[0, 0.9, 0]}>
          <Gate />
          <PrayerFlags from={[-2.8, 3.4, 0.1]} to={[2.8, 3.4, 0.1]} n={16} />
        </group>
      </group>
    );
  }

  return { kakrebihar: { Main: KakreMain, Env: KakreEnv } };
}
