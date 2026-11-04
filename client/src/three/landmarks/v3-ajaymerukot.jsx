/* Ajaymerukot, Dadeldhura (Sudurpashchim): ruined 13th-16th c. Doti hilltop palace-fort, all stone.
   Centre: open pillared mandap (4 front pillars, one slab lintel/roof beam, stepped concentric slab roof, finial) on a low plinth,
   between two tall ribbed shikhara stone shrines (left taller and rounder, right squarer and broken). Behind and uphill: roofless
   two-storey rough dry-stone palace walls (3 + 4 rooms round a central corridor), a tower stub, paved stair. Fallen carved blocks.
   Setting: dry khaki-gold ridge crest, steep drop-offs, one approach path (spur), river far below on three sides, forested hills.
   Layout and sizes are inferred from six photos (no published plan). 1 unit = 1 m. Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Tree, THREE, useMemo } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 7.3) * 43758.5453; return v - Math.floor(v); };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- terrain height field, shared by terrain, trees and path ---------- */
  const DEEP = -17;
  function wob(th) { return 1 + 0.08 * Math.sin(3 * th + 1) + 0.05 * Math.sin(5 * th + 2); }
  function baseH(x, z) {
    const d = Math.hypot(x / 18, (z + 3) / 24);
    const th = Math.atan2(x, z + 3);
    const dn = d / wob(th);
    let h = 0;
    if (dn > 0.62) {
      h = DEEP * sm(0.62, 1.25, dn);
      if (dn > 1.45) h = DEEP + 30 * sm(1.45, 2.6, dn) + 4 * sm(2.6, 3.3, dn);
      const nz = 0.5 * Math.sin(x * 0.31 + z * 0.17) + 0.4 * Math.sin(x * 0.13 - z * 0.27 + 1) + 0.3 * Math.sin(x * 0.7 + z * 0.55);
      h += nz * sm(0.62, 0.95, dn) * (dn > 1.45 ? 2.2 : 1);
      if (dn > 1.45) h += (0.9 * Math.sin(x * 0.42 + 1.5 * Math.sin(z * 0.2)) + 0.8 * Math.sin(z * 0.5 - x * 0.3) + 0.5 * Math.sin(x * 1.1 + z * 0.9)) * sm(1.6, 2.4, dn);
    }
    return { h, dn, th };
  }
  function H(x, z) {
    let { h } = baseH(x, z);
    if (z > 8) {
      const sx = x - 0.04 * z;
      const spur = -(z - 8) * 0.13 - 0.05 * sx * sx;
      if (spur > h) h = spur;
    }
    return h;
  }
  const pathX = (z) => 0.04 * z + 1.6 * Math.sin(z * 0.19);

  /* ---------- palace wall runs: rough dry-stone rubble, ragged broken tops, slit openings ---------- */
  function wallRun(M, ax, c, a, b, th, h, seed, o = {}) {
    const out = [];
    const doors = (o.doors || []).slice().sort((p, q) => p - q);
    const dw = 1.2;
    const cuts = [a];
    doors.forEach((d) => { cuts.push(d - dw / 2); cuts.push(d + dw / 2); });
    cuts.push(b);
    const dims = (len, hh, t = th) => (ax === 'x' ? [len, hh, t] : [t, hh, len]);
    const pos = (u, y) => (ax === 'x' ? [u, y, c] : [c, y, u]);
    const tints = ['#8e927f', '#818575', '#7a7f71', '#958d6e'];
    const slit = M.plain('#4a463c', { roughness: 1 });
    for (let k = 0; k < cuts.length; k += 2) {
      const s = cuts[k], e = cuts[k + 1];
      if (e - s < 0.05) continue;
      const n = Math.max(1, Math.round((e - s) / 1.6));
      const len = (e - s) / n;
      for (let i = 0; i < n; i += 1) {
        const id = seed * 100 + k * 10 + i;
        const u0 = s + len * i;
        const hmax = h * (0.5 + 0.4 * rn(id));
        // ragged top: 3 stepped columns of differing height
        const parts = 3;
        for (let j = 0; j < parts; j += 1) {
          const pl = len / parts;
          const u = u0 + pl * (j + 0.5);
          let hh = Math.max(0.8, hmax * (0.5 + 0.5 * rn(id * 3 + j + 2)));
          if (rn(id * 7 + j + 4) < 0.22) hh = 0.45 + 0.5 * rn(id + j);
          const m = M.plain(tints[Math.floor(rn(id + 3 + j) * 4)], { roughness: 1 });
          out.push(<Box key={`g${id}-${j}`} s={dims(pl + 0.02, hh)} p={pos(u, hh / 2)} m={m} />);
          if (j === 1 && o.up && rn(id + 5) < o.up) {
            const uh = 0.35 + rn(id + 7) * 0.7;
            const m2 = M.plain(tints[Math.floor(rn(id + 9) * 4)], { roughness: 1 });
            out.push(<Box key={`u${id}`} s={dims(pl * 0.9, uh, th * 0.9)} p={pos(u, hh + uh / 2)} m={m2} />);
          }
          if (j === 1 && o.win && rn(id + 11) < o.win * 0.45 && hh > 1.4) {
            out.push(<Box key={`w${id}`} s={ax === 'x' ? [0.25, 0.5, th + 0.04] : [th + 0.04, 0.5, 0.25]} p={pos(u, hh * 0.62)} m={slit} cast={false} />);
          }
        }
      }
    }
    doors.forEach((d, i) => {
      out.push(<Box key={`dl${seed}-${i}`} s={dims(dw + 0.5, 0.34, th)} p={pos(d, 2.2)} m={M.plain('#4a463c', { roughness: 1 })} />);
    });
    return out;
  }

  /* ---------- carved pillar of the mandap: base, 3 carved-panel tiers, flaring bracket capital (2.75 m) ---------- */
  function Pillar({ p, buff, dark, light, full = true }) {
    const tiers = [];
    let y0 = 0.3;
    for (let k = 0; k < 3; k += 1) {
      tiers.push(<Box key={`c${k}`} s={[0.54, 0.08, 0.54]} p={[0, y0 + 0.04, 0]} m={light} />);
      tiers.push(<Box key={`p${k}`} s={[0.46, 0.5, 0.46]} p={[0, y0 + 0.08 + 0.25, 0]} m={buff} />);
      if (full) {
        tiers.push(<Box key={`f${k}`} s={[0.3, 0.34, 0.5]} p={[0, y0 + 0.33, 0]} m={light} cast={false} />);
        tiers.push(<Box key={`s${k}`} s={[0.5, 0.34, 0.3]} p={[0, y0 + 0.33, 0]} m={light} cast={false} />);
      }
      y0 += 0.58;
    }
    return (
      <group position={p}>
        <Box s={[0.72, 0.3, 0.72]} p={[0, 0.15, 0]} m={buff} />
        {tiers}
        <Box s={[0.52, 0.2, 0.52]} p={[0, 2.14, 0]} m={buff} />
        <Box s={[0.86, 0.16, 0.56]} p={[0, 2.32, 0]} m={light} />
        <Box s={[1.0, 0.16, 0.62]} p={[0, 2.48, 0]} m={buff} />
        <Box s={[1.0, 0.19, 0.62]} p={[0, 2.655, 0]} m={light} />
        <Box s={[0.62, 0.3, 0.05]} p={[0, 2.45, 0.3]} m={dark} cast={false} />
        <Box s={[0.5, 0.2, 0.05]} p={[0, 2.64, 0.33]} m={dark} cast={false} />
      </group>
    );
  }

  /* ---------- shikhara shrine: banded carved cella + narrow recessed doorway, tall ribbed tower (L) or snapped tower with missing top-left block (R) ---------- */
  function Shrine({ p, kind, ochre, buff, light, dark }) {
    const left = kind === 'L';
    const cw = left ? 3.1 : 3.0, cd = left ? 3.1 : 3.3;
    const wallTop = 3.9;
    const n = left ? 19 : 13;
    const ch = 0.22;
    const w0 = left ? 1.3 : 1.38;
    const bands = [];
    for (let i = 0; i < 8; i += 1) {
      bands.push(<Box key={`b${i}`} s={[cw + (i % 2 ? 0.02 : 0.16), 0.13, cd + (i % 2 ? 0.02 : 0.16)]} p={[0, 0.85 + i * 0.4, 0]} m={i % 2 ? light : ochre} />);
    }
    const courses = [];
    const rx = left ? [-0.83, -0.5, -0.17, 0.17, 0.5, 0.83] : [-0.5, 0.5];
    for (let i = 0; i < n; i += 1) {
      const t = i / n;
      const w = left ? w0 * (1 - 0.82 * Math.pow(t, 0.8)) : w0 * (1 - 0.14 * t);
      const wz = left ? w : w * (cd / cw);
      const y = wallTop + ch * (i + 0.5);
      const jog = (rn(i + (left ? 3 : 40)) - 0.5) * 0.04;
      const gone = !left && i >= n - 3;      // missing top-left block on the right tower
      const sw = gone ? w * (i === n - 1 ? 0.7 : 1.15) : w * 2;
      const cx = gone ? w - sw / 2 : jog;
      courses.push(<Box key={`c${i}`} s={[sw, ch, wz * 2]} p={[cx, y, 0]} m={i % 3 === 0 ? light : buff} />);
      rx.forEach((o, k) => {
        if (gone && o < 0) return;
        courses.push(<Box key={`r${i}-${k}`} s={[w * (left ? 0.2 : 0.3), ch, wz * 2 + 0.14]} p={[o * w, y, 0]} m={light} />);
        courses.push(<Box key={`s${i}-${k}`} s={[w * 2 + 0.14, ch, wz * (left ? 0.2 : 0.3)]} p={[cx, y, o * wz]} m={light} />);
      });
    }
    const top = wallTop + ch * n;
    return (
      <group position={p}>
        <Box s={[cw + 0.9, 0.28, cd + 0.9]} p={[0, 0.14, 0]} m={buff} />
        <Box s={[cw + 0.5, 0.3, cd + 0.5]} p={[0, 0.43, 0]} m={light} />
        <Box s={[cw, wallTop - 0.58, cd]} p={[0, 0.58 + (wallTop - 0.58) / 2, 0]} m={ochre} />
        {bands}
        <Box s={[cw + 0.24, 0.22, cd + 0.24]} p={[0, wallTop - 0.1, 0]} m={light} />
        <Box s={[cw + 0.1, 0.16, cd + 0.1]} p={[0, wallTop - 0.34, 0]} m={ochre} />
        {/* narrow recessed doorway (0.9 x 1.6) facing +z: dark inner box, jambs, carved lintel */}
        <Box s={[0.9, 1.6, 0.2]} p={[0, 0.58 + 0.8, cd / 2 - 0.02]} m={dark} cast={false} />
        <Box s={[0.16, 1.7, 0.2]} p={[-0.53, 0.58 + 0.85, cd / 2 + 0.06]} m={light} />
        <Box s={[0.16, 1.7, 0.2]} p={[0.53, 0.58 + 0.85, cd / 2 + 0.06]} m={light} />
        <Box s={[1.4, 0.2, 0.22]} p={[0, 0.58 + 1.72, cd / 2 + 0.07]} m={light} />
        <Box s={[1.1, 0.14, 0.26]} p={[0, 0.58 + 1.92, cd / 2 + 0.08]} m={ochre} />
        <Box s={[0.5, 0.12, 0.28]} p={[0, 0.58 + 2.06, cd / 2 + 0.08]} m={dark} cast={false} />
        {courses}
        {left ? (
          <group>
            <Cyl rt={0.62} rb={0.62} h={0.16} p={[0, top + 0.08, 0]} seg={12} m={light} />
            <Cyl rt={0.5} rb={0.6} h={0.14} p={[0, top + 0.23, 0]} seg={12} m={buff} />
            <Cyl rt={0.14} rb={0.2} h={0.3} p={[0, top + 0.45, 0]} seg={8} m={buff} />
            <Ball rad={0.2} p={[0, top + 0.7, 0]} m={buff} />
            <Cyl rt={0.02} rb={0.07} h={0.45} p={[0, top + 1.05, 0]} seg={6} m={dark} />
          </group>
        ) : (
          <group>
            {/* snapped top: right half still stands, left block gone, broken cap block lying skewed, chipped corners */}
            <Box s={[0.9, 0.3, 1.5]} p={[0.55, top + 0.15, -0.1]} r={[0.0, 0.1, -0.2]} m={light} />
            <Box s={[0.8, 0.32, 1.0]} p={[-0.9, 0.12, 2.9]} r={[0.12, 0.4, -0.18]} m={buff} />
            {[[-1.4, 1.7, 0], [1.4, 1.7, 0.4], [-1.4, -1.7, 0.2], [1.4, -1.7, 0.1]].map(([cx, cz, a], i) => (
              <Box key={`ch${i}`} s={[0.4, 0.55, 0.4]} p={[cx, 3.3 - i * 0.55 + 0.9, cz]} r={[0, a + 0.7, 0]} m={dark} cast={false} />
            ))}
          </group>
        )}
      </group>
    );
  }

  /* ---------- Main ---------- */
  function AjaymerukotMain() {
    const M = useM();
    const ochre = M.plain('#9d9567', { roughness: 0.95 });
    const ochreR = M.plain('#878a70', { roughness: 0.95 });
    const pil = M.plain('#787f6c', { roughness: 0.95 });
    const pilL = M.plain('#8c9380', { roughness: 0.95 });
    const pilD = M.plain('#5f5d52', { roughness: 1 });
    const buff = M.plain('#818470', { roughness: 0.95 });
    const light = M.plain('#939782', { roughness: 0.95 });
    const grey = M.plain('#757a6c', { roughness: 1 });
    const dark = M.plain('#3a342a', { roughness: 1 });
    const rockT = M.plain('#7d8070', { roughness: 1 });
    const rockD = M.plain('#6b6f64', { roughness: 1 });

    // pillar positions: 4 across the front (dominant), 4 at the back
    const xs = [-2.4, -0.8, 0.8, 2.4];
    const pillars = [];
    xs.forEach((x, i) => { pillars.push(<Pillar key={`pf${i}`} p={[x, 0.5, 2.0]} buff={pil} dark={pilD} light={pilL} />); });
    xs.forEach((x, i) => { pillars.push(<Pillar key={`pb${i}`} p={[x, 0.5, -2.0]} buff={pil} dark={pilD} light={pilL} full={false} />); });
    // the low stepped roof of concentric slabs (stops well inside the slab and below the shrine cellas)
    const roof = [];
    const radii = [2.8, 2.4, 2.0, 1.6, 1.25, 0.9];
    radii.forEach((r, i) => {
      roof.push(<Cyl key={`rf${i}`} rt={r} rb={r + 0.03} h={0.14} p={[(rn(i + 70) - 0.5) * 0.04, 3.95 + 0.07 + i * 0.14, 0]} seg={20} m={i % 2 ? grey : buff} />);
    });
    const cy = 3.95 + radii.length * 0.14;

    // fallen blocks and fragments
    const blocks = useMemo(() => {
      const list = [];
      const place = [
        [-2.8, 4.6], [-1.6, 5.2], [-0.4, 4.7], [1.0, 5.4], [2.4, 4.6], [3.4, 5.6], [-3.6, 5.8], [0.2, 6.4], [-6.4, 3.6], [-7.2, 2.6], [-6.0, 4.8], [-7.8, 4.0],
        [8.6, 2.0], [-9.5, -2.5], [9.2, -1.5], [4.6, 6.4], [-5.2, 6.8], [5.6, -5.0], [-4.4, -5.2],
      ];
      place.forEach(([x, z], i) => {
        const w = 0.4 + rn(i + 100) * 1.0, h = 0.16 + rn(i + 120) * 0.3, d = 0.35 + rn(i + 140) * 0.7;
        list.push({ s: [w, h, d], p: [x, h * 0.35, z], r: [(rn(i + 160) - 0.5) * 0.3, rn(i + 180) * 3, (rn(i + 200) - 0.5) * 0.3], t: rn(i + 5) });
      });
      return list;
    }, []);

    // palace on a low terrace (0.5 m)
    const Y0 = 0.5, PZ = -11.5;
    const palace = [];
    const WT = 0.62;
    palace.push(...wallRun(M, 'x', 3.8, -9, 9, WT, 2.1, 1, { doors: [-6, 6], up: 0.55, win: 0.7 }));
    palace.push(...wallRun(M, 'x', -3.8, -9, 9, WT, 2.9, 2, { up: 0.5, win: 0.6 }));
    palace.push(...wallRun(M, 'z', -9, -3.8, 3.8, WT, 2.3, 3, { up: 0.5, win: 0.5, doors: [] }));
    palace.push(...wallRun(M, 'z', 9, -3.8, 3.8, WT, 2.2, 4, { up: 0.4, win: 0.5 }));
    // corridor walls (door per room): back row 4 rooms, front row 3 rooms
    palace.push(...wallRun(M, 'x', -0.9, -9, 9, 0.5, 2.0, 5, { doors: [-6.75, -2.25, 2.25, 6.75], up: 0.3 }));
    palace.push(...wallRun(M, 'x', 0.9, -9, 9, 0.5, 1.9, 6, { doors: [-6, 0, 6], up: 0.3 }));
    // room partitions: back 3, front 2
    [0].forEach((x, i) => palace.push(...wallRun(M, 'z', x, -3.8, -0.9, 0.62, 2.0, 7 + i, { up: 0.2 })));
    [0].forEach((x, i) => palace.push(...wallRun(M, 'z', x, 0.9, 3.8, 0.62, 1.9, 12 + i, { up: 0.2 })));

    return (
      <group>
        {/* low raised stone plinth of the mandap, merging with the shrine plinths + front steps */}
        <Box s={[7.4, 0.22, 6.6]} p={[0, 0.11, 0]} m={grey} />
        <Box s={[6.9, 0.28, 6.1]} p={[0, 0.36, 0]} m={buff} />
        <Box s={[3.0, 0.16, 0.8]} p={[0, 0.08, 3.9]} m={grey} />
        <Box s={[2.6, 0.2, 0.6]} p={[0, 0.1, 3.7]} m={buff} />
        <Box s={[2.2, 0.22, 0.45]} p={[0, 0.36, 3.55]} m={light} />
        {pillars}
        {/* long architraves on the pillar capitals */}
        <Box s={[6.0, 0.24, 0.55]} p={[0, 3.37, 2.0]} m={buff} />
        <Box s={[6.0, 0.24, 0.55]} p={[0, 3.37, -2.0]} m={buff} />
        <Box s={[0.55, 0.24, 4.5]} p={[-2.4, 3.37, 0]} m={buff} />
        <Box s={[0.55, 0.24, 4.5]} p={[2.4, 3.37, 0]} m={buff} />
        <Box s={[0.5, 0.22, 4.3]} p={[0, 3.37, 0]} m={grey} />
        {/* carved panel strip along the front architrave */}
        <Box s={[5.2, 0.12, 0.06]} p={[0, 3.37, 2.3]} m={dark} cast={false} />
        {/* heavy flat slab lintel / roof beam, stops at the shrine walls */}
        <Box s={[7.0, 0.45, 5.2]} p={[0, 3.72, 0]} m={grey} />
        <Box s={[7.2, 0.08, 5.4]} p={[0, 3.48, 0]} m={pil} />
        <Box s={[0.9, 0.3, 0.9]} p={[-2.9, 4.05, 1.9]} r={[0, 0.3, 0]} m={grey} />
        {/* inside ceiling: concentric rings around a lotus boss */}
        {[1.95, 1.6, 1.25, 0.9, 0.55].map((r, i) => (
          <Cyl key={`cr${i}`} rt={r} rb={r} h={0.1} p={[0, 3.46 - i * 0.07, 0]} seg={20} m={i % 2 ? buff : light} />
        ))}
        <Ball rad={0.22} p={[0, 3.0, 0]} sc={[1, 0.5, 1]} m={light} />
        {roof}
        <Cyl rt={0.5} rb={0.55} h={0.2} p={[0, cy + 0.1, 0]} seg={12} m={light} />
        <Cyl rt={0.14} rb={0.2} h={0.3} p={[0, cy + 0.35, 0]} seg={8} m={buff} />
        <Ball rad={0.16} p={[0, cy + 0.58, 0]} m={buff} />
        <Cyl rt={0.02} rb={0.06} h={0.35} p={[0, cy + 0.85, 0]} seg={6} m={dark} />

        {/* the two shrines abut the mandap plinth */}
        <Shrine p={[-4.6, 0, 0.1]} kind="L" ochre={ochre} buff={buff} light={light} dark={dark} />
        <Shrine p={[4.6, 0, 0.1]} kind="R" ochre={ochreR} buff={buff} light={light} dark={dark} />
        {/* diyas at the shrine doors */}
        {[-4.6, 4.6].map((x, i) => (
          <group key={`dy${i}`}>
            <Cyl rt={0.07} rb={0.05} h={0.04} p={[x, 0.6, 2.4]} seg={8} m={M.plain('#6b5a3c')} />
            <Ball rad={0.05} p={[x, 0.65, 2.4]} m={M.plain('#ffc060', { emissive: '#ff9a20', emissiveIntensity: 2.2 })} />
            <pointLight position={[x, 1.0, 2.7]} intensity={0.8} distance={5} color="#ffb050" />
          </group>
        ))}

        {/* fallen carved blocks, big slabs at the foot of the front pillars, a leaning shaft */}
        {blocks.map((b, i) => <Box key={`fb${i}`} s={b.s} p={b.p} r={b.r} m={b.t > 0.5 ? buff : grey} />)}
        <Box s={[1.5, 0.3, 0.9]} p={[-3.0, 0.15, 4.2]} r={[0.0, 0.5, 0.14]} m={grey} />
        <Box s={[1.5, 0.3, 0.9]} p={[3.0, 0.15, 4.3]} r={[0.05, -0.4, -0.12]} m={buff} />
        <Box s={[1.5, 0.3, 0.9]} p={[-1.8, 0.16, 5.0]} r={[0.1, -0.3, 0.18]} m={buff} />
        <Box s={[1.5, 0.3, 0.9]} p={[1.9, 0.14, 5.0]} r={[0.0, 0.7, 0.1]} m={grey} />
        <Box s={[1.5, 0.3, 0.9]} p={[4.4, 0.15, 3.8]} r={[0.1, 0.2, -0.2]} m={grey} />
        <Box s={[1.1, 0.26, 0.8]} p={[-0.2, 0.2, 5.6]} r={[0.1, -0.4, -0.12]} m={buff} />
        <group position={[-3.4, 0, 3.7]} rotation={[0, 0.2, 0]}>
          <group rotation={[0.42, 0, 0.04]} position={[0, 0.95, 0]}>
            <Box s={[0.44, 1.9, 0.44]} p={[0, 0, 0]} m={buff} />
            <Box s={[0.3, 0.4, 0.5]} p={[0, 0.2, 0]} m={light} cast={false} />
            <Box s={[0.54, 0.1, 0.54]} p={[0, -0.3, 0]} m={light} />
          </group>
        </group>
        {/* standing carved pillar fragment (broken, canted) */}
        <group position={[-6.8, 0, 6.2]} rotation={[0.05, 0.5, 0.08]}>
          <Box s={[0.6, 0.55, 0.6]} p={[0, 0.27, 0]} m={buff} />
          <Box s={[0.36, 0.3, 0.64]} p={[0, 0.3, 0]} m={light} cast={false} />
          <Box s={[0.4, 0.7, 0.4]} p={[0, 0.9, 0]} m={buff} />
          <Box s={[0.42, 0.18, 0.4]} p={[0.05, 1.32, 0]} r={[0, 0, 0.25]} m={grey} />
          <Box s={[0.3, 0.26, 0.05]} p={[0, 0.3, 0.33]} m={pilD} cast={false} />
        </group>
        <group position={[-8.6, 0, 3.4]} rotation={[0.3, 1.9, 0.1]}>
          <Box s={[0.5, 0.5, 0.5]} p={[0, 0.25, 0]} m={buff} />
          <Box s={[0.34, 0.3, 0.06]} p={[0, 0.3, 0.27]} m={pilD} cast={false} />
          <Box s={[0.4, 1.0, 0.4]} p={[0, 1.0, 0]} m={pil} />
        </group>

        {/* well */}
        <group position={[8.6, 0, 5.4]}>
          <Cyl rt={0.78} rb={0.85} h={0.5} p={[0, 0.25, 0]} seg={12} m={rockT} />
          <Cyl rt={0.5} rb={0.5} h={0.04} p={[0, 0.5, 0]} seg={12} m={dark} />
        </group>

        {/* palace: low terrace behind, paved stair, roofless rubble walls, tower stub */}
        <Box s={[20.4, 0.5, 9.6]} p={[0, 0.25, PZ]} m={rockD} />
        {[0, 1, 2, 3].map((i) => (
          <Box key={`ps${i}`} s={[3.4, 0.125 * (i + 1), 0.45]} p={[0, 0.0625 * (i + 1), -6.7 + 0.225 + 0.45 * (3 - i)]} m={grey} />
        ))}
        <group position={[0, Y0, PZ]}>
          <Box s={[18.4, 0.06, 7.6]} p={[0, 0.03, 0]} m={M.plain('#807d72', { roughness: 1 })} />
          {palace}
          {/* tower stub, left front corner */}
          <Box s={[2.8, 3.3, 2.8]} p={[-10.4, 1.65, 3.2]} m={rockT} />
          <Box s={[1.6, 0.9, 2.6]} p={[-10.9, 3.75, 3.2]} m={rockD} />
          <Box s={[0.25, 0.5, 2.9]} p={[-10.4, 2.4, 3.2]} m={dark} cast={false} />
        </group>
        <Frame s={[19, 9, 18]} p={[0, 4.5, -4]} />
      </group>
    );
  }

  /* ---------- Env ---------- */
  function terrainGeo() {
    const S = 170, N = 200;
    const g = new THREE.PlaneGeometry(S, S, N, N);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const cGold = new THREE.Color('#8a7c52'), cBrown = new THREE.Color('#6b5d3a'), cOlive = new THREE.Color('#5f6a3e');
    const cGreen = new THREE.Color('#8fa04a'), cDry = new THREE.Color('#92865a'), cFor = new THREE.Color('#6c7a42');
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i), z = pos.getZ(i);
      let h = H(x, z);
      const { dn, th } = baseH(x, z);
      let terr = 0, band = 0;
      if (dn > 0.95 && dn < 1.4 && h < -1 && z < 16) {
        const wgt = sm(0.95, 1.1, dn) * (1 - sm(1.3, 1.4, dn)) * (0.5 + 0.5 * Math.cos(th - 0.6) > 0.2 ? 1 : 0);
        if (wgt > 0) {
          const q = 2.4, f = Math.floor(h / q);
          h += (f * q + q * 0.5 - h) * 0.65 * wgt;
          terr = wgt; band = f;
        }
      }
      pos.setY(i, h);
      const nz = 0.5 + 0.5 * Math.sin(x * 0.9 + z * 0.4) * Math.sin(z * 0.8 - x * 0.2);
      if (h > -1.5) c.copy(cGold).lerp(cDry, nz * 0.6);
      else if (h > -9) c.copy(cBrown).lerp(cGold, 0.35 * nz + 0.3 * sm(-4, -1.5, h));
      else c.copy(cOlive).lerp(cFor, nz * 0.5);
      if (terr > 0.5) c.copy(band % 2 ? cGreen : cDry).lerp(cOlive, 0.2 * nz);
      if (dn > 1.8) c.lerp(cFor, 0.45).lerp(cBrown, 0.2 * nz);
      if (h < DEEP + 1.0) c.lerp(new THREE.Color('#8c8466'), 0.5);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }

  function pinesGeo() {
    const pos = [], col = [];
    const cc = new THREE.Color();
    let count = 0;
    const cone = (x, y, z, r, h, color) => {
      const n = 6;
      for (let k = 0; k < n; k += 1) {
        const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
        pos.push(x, y + h, z, x + Math.cos(a0) * r, y, z + Math.sin(a0) * r, x + Math.cos(a1) * r, y, z + Math.sin(a1) * r);
        for (let v = 0; v < 3; v += 1) col.push(color.r, color.g, color.b);
      }
    };
    for (let gx = -78; gx < 78; gx += 3.2) {
      for (let gz = -78; gz < 78; gz += 3.2) {
        const i = count;
        const x = gx + (rn(i * 3 + 1) - 0.5) * 3, z = gz + (rn(i * 3 + 2) - 0.5) * 3;
        count += 1;
        const { dn } = baseH(x, z);
        if (dn < 1.2 || dn > 3.0) continue;
        if (Math.sin(x * 0.13 + 1) * Math.sin(z * 0.11 + 2) < -0.05) continue;
        if (z > 6 && Math.abs(x - pathX(z)) < 7) continue;
        const h = H(x, z);
        if (h < DEEP + 1.5) continue;
        const dens = 0.06 + 0.7 * sm(1.05, 1.7, dn);
        if (rn(i * 7 + 5) > dens * (0.6 + 0.4 * Math.sin(x * 0.11 + z * 0.07)) * 0.55) continue;
        const s = 0.55 + rn(i * 11) * 0.45;
        cc.set(rn(i + 9) > 0.5 ? '#3f5a30' : '#47602f').offsetHSL(0, 0, (rn(i + 31) - 0.5) * 0.06);
        cone(x, h + 0.9 * s, z, 1.5 * s, 4.2 * s, cc);
        cone(x, h + 2.4 * s, z, 1.1 * s, 3.4 * s, cc);
        cc.set('#4a3a28');
        cone(x, h, z, 0.25 * s, 1.3 * s, cc);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    g.computeVertexNormals();
    return g;
  }

  function pathGeo() {
    const pts = [];
    for (let z = 5.2; z <= 52; z += 1.2) pts.push(z);
    const pos = [], idx = [];
    pts.forEach((z, i) => {
      const x = pathX(z) * (z > 8 ? 1 : 0) + (z <= 8 ? pathX(8) * sm(5, 8, z) : 0);
      const wdt = 0.85;
      [-1, 1].forEach((sg) => { const xx = x + sg * wdt; pos.push(xx, H(xx, z) + 0.07, z); });
      if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function AjaymerukotEnv() {
    const M = useM();
    const terr = useMemo(() => terrainGeo(), []);
    const terrMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }), []);
    const pines = useMemo(() => pinesGeo(), []);
    const pineMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide }), []);
    const path = useMemo(() => pathGeo(), []);
    const pathMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c2bba6', roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide }), []);
    const water = M.plain('#4f95ad', { roughness: 0.2, metalness: 0.1 });
    const scrub = [];
    for (let i = 0; i < 44; i += 1) {
      const a = rn(i + 300) * Math.PI * 2, r = 11 + rn(i + 320) * 12;
      const x = Math.sin(a) * r * 0.95, z = Math.cos(a) * r;
      if (z > 7 && Math.abs(x - pathX(z)) < 3) continue;
      const h = H(x, z);
      scrub.push(<Ball key={`sc${i}`} rad={0.35 + rn(i + 340) * 0.35} p={[x, h + 0.1, z]} sc={[1.4, 0.7, 1.2]} m={M.plain(rn(i) > 0.5 ? '#55612f' : '#6e7a3c', { roughness: 1 })} />);
    }
    const paving = [];
    for (let z = 6; z < 40; z += 1.7) {
      const x = pathX(z) * (z > 8 ? 1 : 0) + (z <= 8 ? pathX(8) * sm(5, 8, z) : 0);
      paving.push(<Box key={`pv${z}`} s={[1.2 + rn(z) * 0.5, 0.06, 0.8]} p={[x + (rn(z + 3) - 0.5) * 0.5, H(x, z) + 0.1, z]} r={[0, (rn(z + 5) - 0.5) * 0.4, 0]} m={M.plain(rn(z) > 0.5 ? '#a9a595' : '#8d8b84', { roughness: 1 })} cast={false} />);
    }
    const hills = [];
    const hcol = ['#8ea08a', '#a4b3aa', '#bcc8c6'];
    for (let L = 0; L < 3; L += 1) {
      const r = 105 + L * 28;
      const n = 9 + L * 2;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2 + L * 0.4;
        hills.push(<Ball key={`hh${L}-${i}`} rad={1} p={[Math.sin(a) * r, -10, Math.cos(a) * r]} sc={[34 + rn(i + L * 9) * 20, 34 + L * 8 + rn(i + L * 5 + 1) * 14, 30]} m={M.plain(hcol[L], { roughness: 1 })} />);
      }
    }
    return (
      <group>
        <mesh geometry={terr} material={terrMat} receiveShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DEEP + 4.6, 0]} material={water}><planeGeometry args={[170, 170]} /></mesh>
        <mesh geometry={path} material={pathMat} />
        <mesh geometry={pines} material={pineMat} castShadow />
        {scrub}
        {paving}
        <Tree p={[-3.5, 0, -6.4]} s={1.0} kind="broad" />
        <Tree p={[14, H(14, -9), -9]} s={0.9} kind="pine" />
        <Tree p={[-15, H(-15, 4), 4]} s={0.9} kind="pine" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -22, 0]}><circleGeometry args={[330, 32]} /><meshStandardMaterial color="#6c7a58" roughness={1} /></mesh>
        {hills}
      </group>
    );
  }

  return { ajaymerukot: { Main: AjaymerukotMain, Env: AjaymerukotEnv } };
}
