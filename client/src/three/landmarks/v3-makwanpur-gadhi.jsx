/* Makwanpur Gadhi (Makwanpurgadhi), Hetauda, Bagmati. 1 unit = 1 m. Front / approach path = +z.
   A roofless ruined Sen-era stone fort on a Mahabharat ridge crest (~1,030 m): a roughly 42 x 30 m rectangle of thick (2.1 m) dark
   grey rubble/ashlar wall with jagged broken tops and one taller broken corner block (7.6 m), a stone-lined water ditch (~3 m deep)
   around the outside, an open grass interior with only low foundations of the vanished Jungey palace, a tiny plain Krishna temple,
   two water pits at opposite corners, the Kali Top iron cannon on spoked wheels in a red-post tin-roofed shed, a second iron cannon
   with a brass muzzle lying on a dressed-stone corner, and a long straight stepped walkway with blue railings and a chain-link
   fence through tall slender trees. The ridge falls away in terraced maize fields to layered green Mahabharat hills.
   Enclosure size and gate position are unsourced estimates. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo } = K;

  const rnd = (i) => { const v = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---- plan constants ---- */
  const T = 2.1;              // wall thickness
  const OX = 21, OZ = 15;     // wall outer half-extents (42 x 30 m)
  const DX = 24, DZ = 18;     // ditch outer half-extents
  const DEPTH = 3;            // ditch depth
  const GAPX = [4, 8.5];      // gap in the front wall where the approach crosses the ditch

  /* ---- ridge height field (shared by Env pieces) ---- */
  const crestW = (z) => (z < 22 ? 34 : Math.max(12, 34 - (z - 22) * 0.9));
  const crestY = (z) => -0.06 * Math.max(0, z - 18);
  function ridgeD(x, z) {
    const dx = Math.max(0, Math.abs(x) - crestW(z));
    const dz = Math.max(0, -26 - z);
    let d = Math.hypot(dx, dz);
    if (d > 0) d += 1.6 * Math.sin(x * 0.21 + z * 0.17) * sstep(0, 5, d);
    return d;
  }
  const STEP = 2.4;
  function H(x, z) {
    const d = Math.max(0, ridgeD(x, z));
    const t = (0.5 * d) / STEP; const f = Math.floor(t);
    return crestY(z) - (f + sstep(0.65, 1, t - f)) * STEP;
  }

  /* ---------------- small parts ---------------- */
  function Inst({ items, children }) {
    return (
      <instancedMesh frustumCulled={false} args={[null, null, items.length]}
        ref={(m) => {
          if (!m) return;
          const o = new THREE.Object3D();
          items.forEach((it, i) => {
            o.position.set(it.p[0], it.p[1], it.p[2]); o.rotation.set(0, it.ry || 0, 0);
            const s = it.s || [1, 1, 1]; o.scale.set(s[0], s[1], s[2]); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
          });
          m.instanceMatrix.needsUpdate = true;
        }}>
        {children}
      </instancedMesh>
    );
  }

  function Wheel({ p, M }) {
    const iron = M.plain('#26272a', { roughness: 0.6, metalness: 0.5 });
    return (
      <group position={p} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={iron} castShadow><torusGeometry args={[0.72, 0.08, 6, 22]} /></mesh>
        <mesh material={iron}><torusGeometry args={[0.6, 0.03, 4, 22]} /></mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} material={iron} rotation={[0, 0, (i * Math.PI) / 6]}><boxGeometry args={[0.07, 1.42, 0.05]} /></mesh>
        ))}
        <mesh material={iron} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.26, 10]} /></mesh>
      </group>
    );
  }

  function KaliTop({ p }) {
    const M = useM();
    const iron = M.plain('#2b2c2f', { roughness: 0.55, metalness: 0.5 });
    const red = M.plain('#b23a2e', { roughness: 0.7 });
    const tin = M.plain('#9aa0a0', { roughness: 0.45, metalness: 0.45 });
    const dirt = M.plain('#a08766', { roughness: 1 });
    const wood = M.plain('#8a5a3c');
    return (
      <group position={p}>
        <Box s={[5, 0.06, 3.4]} p={[0, 0.03, 0.2]} m={dirt} />
        {/* red timber posts, front higher than back; corrugated roof sloping to the rear wall */}
        {[[-2.3, 1.6, 2.75], [2.3, 1.6, 2.75], [-2.3, -1.3, 2.35], [2.3, -1.3, 2.35]].map(([x, z, h], i) => (
          <Box key={i} s={[0.16, h, 0.16]} p={[x, h / 2, z]} m={red} />
        ))}
        <Box s={[5.2, 0.07, 3.9]} p={[0, 2.62, 0.18]} r={[-0.1, 0, 0]} m={tin} />
        {[-2.4, -1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8, 2.4].map((x, i) => <Box key={'c' + i} s={[0.08, 0.1, 3.9]} p={[x, 2.66, 0.18]} r={[-0.1, 0, 0]} m={M.plain('#7f8686', { roughness: 0.5, metalness: 0.5 })} cast={false} />)}
        {[-2.3, 2.3].map((x, i) => <Box key={i} s={[0.1, 0.1, 3.1]} p={[x, 2.45, 0.15]} r={[-0.1, 0, 0]} m={red} />)}
        <Box s={[3.4, 0.1, 0.4]} p={[0, 0.48, -1.1]} m={wood} />
        {/* cannon: barrel muzzle toward +z, on two big spoked wheels */}
        <Cyl rt={0.3} rb={0.36} h={3.0} p={[0, 1.02, 0.1]} r={[Math.PI / 2, 0, 0]} m={iron} seg={14} />
        <Cyl rt={0.4} rb={0.3} h={0.28} p={[0, 1.02, 1.62]} r={[Math.PI / 2, 0, 0]} m={iron} seg={14} />
        <Cyl rt={0.14} rb={0.14} h={0.5} p={[0, 0.9, 0.55]} m={iron} seg={8} />
        <Box s={[1.5, 0.1, 0.1]} p={[0, 0.75, 0.5]} m={iron} />
        <Box s={[0.5, 0.5, 1.5]} p={[0, 0.65, -0.45]} m={iron} />
        <Wheel p={[-0.85, 0.74, 0.5]} M={M} />
        <Wheel p={[0.85, 0.74, 0.5]} M={M} />
        {[[0.8, 2.5], [1.3, 2.35], [-1.3, 2.25]].map(([x, z], i) => <Ball key={i} rad={0.2} p={[x, 0.2, z]} m={iron} />)}
      </group>
    );
  }

  function CornerCannon({ p, ry = 0.9, sc = 1 }) {
    const M = useM();
    const iron = M.plain('#3a3c3e', { roughness: 0.5, metalness: 0.55 });
    const brass = M.plain('#a97a2c', { roughness: 0.35, metalness: 0.85 });
    const rub = M.plain('#c9c6bd', { roughness: 0.95 });
    return (
      <group position={p} scale={sc}>
        {[[0.2, 0.2, 0.5], [-0.5, 0.18, 0.1], [0.7, 0.15, 0.9], [-0.2, 0.28, -0.4], [0.9, 0.2, 0.0]].map(([x, y, z], i) => (
          <Box key={i} s={[0.55 - i * 0.04, 0.4, 0.5]} p={[x, y, z]} r={[0.2 * i, i, 0.15]} m={rub} />
        ))}
        <group rotation={[0.18, ry, 0]} position={[0, 0.62, 0]}>
          <Cyl rt={0.2} rb={0.26} h={2.7} r={[Math.PI / 2, 0, 0]} m={iron} seg={12} />
          <Cyl rt={0.23} rb={0.23} h={0.3} p={[0, 0, 1.45]} r={[Math.PI / 2, 0, 0]} m={brass} seg={12} />
          <Ball rad={0.13} p={[0, 0, -1.45]} m={brass} />
          {[-0.7, 0.1, 0.8].map((z, i) => <Cyl key={i} rt={0.28} rb={0.28} h={0.07} p={[0, 0, z]} r={[Math.PI / 2, 0, 0]} m={iron} seg={12} />)}
        </group>
      </group>
    );
  }

  /* ================= MAIN ================= */
  function MakwanMain() {
    const M = useM();
    const water = M.plain('#2d4a48', { roughness: 0.1, metalness: 0.25 });
    const coping = M.mat('stone', 10, 1, { color: '#bdb7a6' });
    const lining = M.mat('stone', 8, 2, { color: '#8f8a7a' });
    const earth = M.plain('#6c6552', { roughness: 1 });
    const grass = M.plain('#6a8a3a', { roughness: 1 });
    const patchM = M.plain('#7b6a41', { roughness: 1 });
    const patchG = M.plain('#58762f', { roughness: 1 });
    const weed = M.plain('#587a30');
    const weed2 = M.plain('#7a8e3a');
    const dark = M.plain('#14120f');
    const ashlar = M.mat('granite', 4, 4, { color: '#e0d9c2' });
    const slopeM = M.plain('#6d8a3c', { roughness: 1 });
    const rubM = M.plain('#6f6a5f', { roughness: 1 });
    const rubM2 = M.plain('#85806f', { roughness: 1 });
    const neM = M.mat('granite', 6, 15, { color: '#bdb59f' });
    const neM2 = M.mat('granite', 6, 15, { color: '#cbc3ad' });
    const found = M.mat('stone', 3, 1, { color: '#bdb6a2' });
    const tints = ['#cfc7b0', '#bdb59f', '#d6cdb6'];

    /* wall segments: jagged, uneven, partly collapsed */
    const { segs, caps, guns, tufts, heaps } = useMemo(() => {
      const segs = []; const caps = []; const guns = []; const tufts = []; const heaps = [];
      let id = 0;
      const sides = [
        { k: 'back', fixed: -(OZ - T / 2), a: -OX, b: OX, ax: 'x', n: [0, -1], base: 4.2, gaps: [[-6, 4], [-17.5, -13.5], [14.5, 99]] },
        { k: 'front', fixed: OZ - T / 2, a: -OX, b: OX, ax: 'x', n: [0, 1], base: 1.9, gaps: [[3.9, 8.6], [-14, -4], [-2, 1.4], [15, 99], [-99, -17]] },
        { k: 'left', fixed: -(OX - T / 2), a: -(OZ - T), b: OZ - T, ax: 'z', n: [-1, 0], base: 2.6, gaps: [[-7, 1], [9, 99]] },
        { k: 'right', fixed: OX - T / 2, a: -(OZ - T), b: OZ - T, ax: 'z', n: [1, 0], base: 4.4, gaps: [[-99, -7.4], [0.5, 3], [9, 99]] },
      ];
      sides.forEach((sd, si) => {
        const horiz = sd.ax === 'x';
        let c = sd.a;
        while (c < sd.b - 0.05) {
          id++;
          const len = Math.min(2.6 + rnd(id * 3.1 + si) * 2.6, sd.b - c);
          const mid = c + len / 2; c += len;
          if (sd.gaps.some(([g0, g1]) => mid > g0 - 0.1 && mid < g1 + 0.1)) {
            const lim = horiz ? OX - 6.5 : OZ - 8;
            if (Math.abs(mid) < lim) {
              for (let k = 0; k < 2; k++) {
                const r1 = rnd(id * 5.3 + k * 2.1); const r2 = rnd(id * 8.1 + k);
                const off = (r1 - 0.5) * (len * 0.6); const dz = (r2 - 0.5) * 1.2;
                const sz = 0.7 + rnd(id + k * 9) * 0.9;
                heaps.push({ p: horiz ? [mid + off, sz * 0.2, sd.fixed + dz] : [sd.fixed + dz, sz * 0.2, mid + off], s: [sz, sz * 0.45, sz * 0.8], ry: r1 * 3, alt: (id + k) % 2 });
              }
            }
            continue;
          }
          const edge = Math.min(...sd.gaps.map(([g0, g1]) => Math.min(Math.abs(mid - g0), Math.abs(mid - g1))));
          const low = sd.base < 3;
          let h = low ? sd.base + (rnd(id * 7.7 + 1) - 0.5) * 1.6 : sd.base + 1.1 * Math.sin(mid * 0.45 + si * 2) + (rnd(id * 7.7) - 0.5) * 1.5;
          if (edge < 3) h -= 1.4 * (1 - edge / 3);
          if (sd.k === 'right' && mid > -2 && mid < 2.5) h -= 2.0;
          h = Math.max(1.0, Math.min(low ? 3.0 : 5.5, h));
          const horizP = (m, y) => (horiz ? [m, y, sd.fixed] : [sd.fixed, y, m]);
          const q = (r) => Math.round(r * 2) / 2;
          const tint = tints[Math.floor(rnd(id * 2.2) * 3)];
          // 2-3 stacked sub-blocks with offset, stepped tops
          const hA = h * (0.55 + rnd(id * 1.7) * 0.15);
          const side = rnd(id * 4.4) < 0.5 ? -1 : 1;
          const lB = len * (0.55 + rnd(id * 2.5) * 0.15); const hB = h * (0.8 + rnd(id * 3.3) * 0.1);
          const lC = len * 0.32; const hC = h;
          const blocks = [
            { l: len + 0.02, hh: hA, m: mid, t: T },
            { l: lB, hh: hB, m: mid + side * (len - lB) / 2, t: T - 0.07 },
            { l: lC, hh: hC, m: mid + side * (len - lC) / 2 - side * (len * 0.12), t: T - 0.14 },
          ];
          blocks.forEach((b, bi) => {
            if (bi === 2 && rnd(id * 9.1) < 0.35) return;
            const p = horizP(b.m, (b.hh - DEPTH) / 2);
            const s = horiz ? [b.l, b.hh + DEPTH, b.t] : [b.t, b.hh + DEPTH, b.l];
            segs.push({ p, s, rx: Math.max(1, q(b.l / 1.2)), ry: Math.max(2, q((b.hh + DEPTH) / 0.7)), tint });
          });
          if (rnd(id * 2.9) < 0.3) tufts.push({ p: horiz ? [mid, h + 0.12, sd.fixed + (rnd(id) - 0.5) * 1.2] : [sd.fixed + (rnd(id) - 0.5) * 1.2, h + 0.12, mid], k: id });
          if (h > 2.4 && rnd(id * 6.1) < 0.3) {
            const o = T / 2 + 0.02;
            [-1, 1].forEach((dir) => {
              const qq = horiz ? [mid, 1.2, sd.fixed + dir * sd.n[1] * o] : [sd.fixed + dir * sd.n[0] * o, 1.2, mid];
              guns.push({ p: qq, horiz });
            });
          }
        }
      });
      return { segs, caps, guns, tufts, heaps };
    }, []);

    /* low ruined palace foundations (Jungey Darbar) */
    const PX = 2, PZ = -3.5;
    const fnd = useMemo(() => {
      const f = []; let i = 0;
      const line = (x1, z1, x2, z2, hh = 0.5, th = 1.0) => {
        const horiz = Math.abs(z2 - z1) < 0.01; const L = Math.abs(horiz ? x2 - x1 : z2 - z1);
        let c = 0; const dir = horiz ? Math.sign(x2 - x1) : Math.sign(z2 - z1);
        while (c < L - 0.01) {
          i++; const l = Math.min(1.2 + rnd(i * 2.3) * 2.2, L - c); const m = c + l / 2; c += l;
          if (rnd(i * 3.7) < 0.22) continue;
          const hv = hh * (0.7 + rnd(i * 5.1) * 0.5);
          f.push(horiz ? { p: [x1 + dir * m, hv / 2, z1], s: [l, hv, th] } : { p: [x1, hv / 2, z1 + dir * m], s: [th, hv, l] });
        }
      };
      const room = (x0, z0, x1, z1) => { line(x0, z0, x1, z0); line(x0, z1, x1, z1); line(x0, z0, x0, z1); line(x1, z0, x1, z1); };
      room(PX - 6, PZ - 4, PX + 0.5, PZ + 1.5);
      room(PX + 0.5, PZ - 4, PX + 6.5, PZ - 0.5);
      room(PX - 6, PZ + 1.5, PX - 1.5, PZ + 5);
      return f;
    }, []);
    const rubble = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
      p: [PX + (rnd(i * 4.4) - 0.5) * 18, 0.12, PZ + (rnd(i * 6.4) - 0.5) * 12], s: [0.4 + rnd(i) * 0.5, 0.22 + rnd(i * 3) * 0.2, 0.4 + rnd(i * 2) * 0.4], ry: rnd(i * 8) * 3,
    })), []);

    const Pit = ({ p }) => (
      <group position={p}>
        <Box s={[3.2, 0.22, 0.4]} p={[0, 0.11, 1.4]} m={found} /><Box s={[3.2, 0.22, 0.4]} p={[0, 0.11, -1.4]} m={found} />
        <Box s={[0.4, 0.22, 2.4]} p={[1.4, 0.11, 0]} m={found} /><Box s={[0.4, 0.22, 2.4]} p={[-1.4, 0.11, 0]} m={found} />
        <Box s={[2.4, 0.04, 2.4]} p={[0, 0.07, 0]} m={water} cast={false} />
      </group>
    );

    return (
      <group>
        <Frame s={[46, 9, 34]} p={[0, 2.5, 0]} />
        {/* ditch: grassy earthen slope under the wall, dark water only in a narrow strip along the stone lining, stepped corner */}
        <Box s={[DX * 2, 0.2, DZ * 2]} p={[0, -DEPTH - 0.1, 0]} m={earth} cast={false} />
        <Box s={[DX * 2 + 0.6, 0.14, 0.6]} p={[0, 0.07, -DZ + 0.1]} m={coping} /><Box s={[DX * 2 + 0.6, 0.14, 0.6]} p={[0, 0.07, DZ - 0.1]} m={coping} />
        <Box s={[0.6, 0.14, DZ * 2]} p={[-DX + 0.1, 0.07, 0]} m={coping} /><Box s={[0.6, 0.14, DZ * 2]} p={[DX - 0.1, 0.07, 0]} m={coping} />
        <Box s={[DX * 2, DEPTH, 0.4]} p={[0, -DEPTH / 2, -DZ + 0.2]} m={lining} />
        <Box s={[DX * 2, DEPTH, 0.4]} p={[0, -DEPTH / 2, DZ - 0.2]} m={lining} />
        <Box s={[0.4, DEPTH, DZ * 2]} p={[-DX + 0.2, -DEPTH / 2, 0]} m={lining} />
        <Box s={[0.4, DEPTH, DZ * 2]} p={[DX - 0.2, -DEPTH / 2, 0]} m={lining} />
        {[
          { a: -OX, b: OX, z: -1, f: -OZ }, { a: -OX, b: GAPX[0] - 0.4, z: 1, f: OZ }, { a: GAPX[1] + 0.4, b: OX, z: 1, f: OZ },
        ].map((r, i) => {
          const len = r.b - r.a; const c = (r.a + r.b) / 2;
          return (
            <group key={i}>
              <Box s={[len, 0.12, 1.9]} p={[c, -1.0, r.f + r.z * 0.5]} r={[r.z * 1.01, 0, 0]} m={slopeM} cast={false} />
              <Box s={[len, 0.05, 1.6]} p={[c, -1.78, r.f + r.z * 1.8]} m={water} cast={false} />
            </group>
          );
        })}
        {[-1, 1].map((sx, i) => (
          <group key={i}>
            <Box s={[1.9, 0.12, OZ * 2]} p={[sx * (OX + 0.5), -1.0, 0]} r={[0, 0, -sx * 1.01]} m={slopeM} cast={false} />
            <Box s={[1.6, 0.05, OZ * 2]} p={[sx * (OX + 1.8), -1.78, 0]} m={water} cast={false} />
          </group>
        ))}
        {/* stone steps down into the ditch at the west side */}
        {[0, 1, 2, 3].map((i) => {
          const top = -0.45 * (i + 1); const hh = top + DEPTH;
          return <Box key={i} s={[0.6, hh, 2.4]} p={[-DX + 0.7 + i * 0.6, -DEPTH + hh / 2, 7]} m={coping} />;
        })}
        {/* causeway crossing the ditch at the gap in the front wall */}
        <Box s={[GAPX[1] - GAPX[0], DEPTH, DZ - OZ + T + 0.6]} p={[(GAPX[0] + GAPX[1]) / 2, -DEPTH / 2, OZ + (DZ - OZ) / 2 - 0.9]} m={lining} />
        {[0, 1, 2].map((i) => <Box key={i} s={[GAPX[1] - GAPX[0], 0.16, 0.9]} p={[(GAPX[0] + GAPX[1]) / 2, -0.4 + i * 0.16, 15.6 + i * 0.1]} m={found} />)}

        {[[-12, -5, 4, 3], [12, 3, 3.5, 4], [-3, 7, 5, 2.4], [8, -10, 3, 3], [-14, 8, 3.4, 3]].map(([x, z, w, d], i) => <Box key={i} s={[w, 0.03, d]} p={[x, 0.01, z]} r={[0, i, 0]} m={i % 2 ? patchM : patchG} cast={false} />)}
        {/* interior grass */}
        <Box s={[OX * 2 - 2 * T + 0.2, 0.1, OZ * 2 - 2 * T + 0.2]} p={[0, -0.05, 0]} m={grass} cast={false} />
        {/* dirt path from the gap into the fort */}
        {[[6.2, 11.2, 2.4, 3], [4.6, 8, 2.2, 3], [2.4, 5.3, 2, 3], [-0.2, 3, 2, 2.4]].map(([x, z, w, l], i) => (
          <Box key={i} s={[w * 0.6, 0.03, l]} p={[x, 0.03, z]} r={[0, 0.4 + i * 0.15, 0]} m={M.plain('#a98f69', { roughness: 1 })} cast={false} />
        ))}

        {/* wall segments */}
        {segs.map((g, i) => <Box key={i} s={g.s} p={g.p} m={M.mat('stone', g.rx, g.ry, { color: g.tint })} />)}
        {heaps.map((g, i) => <Box key={'h' + i} s={g.s} p={g.p} r={[0.1 * i, g.ry, 0.12]} m={g.alt ? rubM : rubM2} />)}
        {caps.map((g, i) => <Box key={i} s={g.s} p={g.p} m={M.mat('stone', 1, 1, { color: g.tint })} />)}
        {guns.map((g, i) => <Box key={i} s={g.horiz ? [0.5, 0.55, 0.1] : [0.1, 0.55, 0.5]} p={g.p} m={dark} cast={false} />)}
        {tufts.map((t, i) => <Box key={i} s={[0.5 + rnd(t.k) * 0.7, 0.22, 0.45]} p={t.p} r={[0, rnd(t.k * 3), 0]} m={i % 2 ? weed : weed2} cast={false} />)}

        {/* taller broken north-east corner block (7.6 m) with arched and square recesses on its inner (+z) face */}
        <Box s={[6.7, 7.6 + DEPTH, T]} p={[OX - 3.35, (7.6 - DEPTH) / 2, -(OZ - T / 2)]} m={neM} />
        <Box s={[T, 7.6 + DEPTH, 7.3]} p={[OX - T / 2, (7.6 - DEPTH) / 2, -(OZ - 3.65)]} m={neM2} />
        <Box s={[3.2, 0.9, 1.2]} p={[OX - 5.2, 7.6 + 0.45, -(OZ - 0.9)]} r={[0, 0.2, 0]} m={ashlar} />
        <Box s={[1.4, 0.5, 1.0]} p={[OX - 1.0, 7.6 + 0.25, -(OZ - 5)]} m={ashlar} />
        {[OX - 4.6, OX - 7.2].map((x, i) => (
          <group key={i} position={[x, 0, -(OZ - T) + 0.04]}>
            <Box s={[0.95, 1.5, 0.14]} p={[0, 4.1 + i * 0.4, 0]} m={dark} cast={false} />
            <Cyl rt={0.475} rb={0.475} h={0.14} p={[0, 4.85 + i * 0.4, 0]} r={[Math.PI / 2, 0, 0]} m={dark} seg={10} />
            <Box s={[1.25, 0.12, 0.2]} p={[0, 3.3 + i * 0.4, 0.02]} m={ashlar} cast={false} />
            <Box s={[0.7, 0.8, 0.14]} p={[0, 1.9, 0]} m={dark} cast={false} />
          </group>
        ))}
        <Box s={[0.8, 1.2, 0.14]} p={[OX - 2.6, 5.6, -(OZ - T) + 0.04]} m={dark} cast={false} />
        <Box s={[0.14, 1.0, 0.6]} p={[OX - T - 0.03, 3.3, -(OZ - 8.2)]} m={dark} cast={false} />
        <Box s={[0.6, 0.8, 0.14]} p={[OX - T / 2, 4.2, -(OZ - 7.3) + 0.04]} m={dark} cast={false} />
        <Box s={[0.5, 0.6, 0.1]} p={[OX - 3.0, 1.4, -OZ - 0.02]} m={dark} cast={false} />
        <Box s={[0.5, 0.6, 0.1]} p={[OX - 4.8, 1.4, -OZ - 0.02]} m={dark} cast={false} />

        {/* stepped bastion block at the south-east corner */}
        <Box s={[6, 3.2 + DEPTH, 6]} p={[OX - 3, (3.2 - DEPTH) / 2, OZ - 3]} m={M.mat('granite', 5, 5, { color: '#bdb59f' })} />
        <Box s={[3.6, 1.4, 6]} p={[OX - 4.8, 3.2 + 0.7, OZ - 3]} m={M.mat('granite', 4, 2, { color: '#cbc3ad' })} />
        {[[OX - 3, 1.3, OZ + 0.04]].map(([x, y, z], i) => <Box key={i} s={[0.55, 0.6, 0.1]} p={[x, y, z]} m={dark} cast={false} />)}

        {/* dressed-stone south-west corner with the second cannon */}
        <Box s={[4.5, 4.4 + DEPTH, 6]} p={[-OX + 2.25, (4.4 - DEPTH) / 2, OZ - 3]} m={M.mat('granite', 4, 10, { color: '#e0d9c2' })} />
        <Box s={[0.8, 0.5, 1.3]} p={[-OX + 0.6, 4.65, OZ - 0.8]} r={[0, 0.3, 0]} m={ashlar} />
        <CornerCannon p={[-OX + 3.1, 4.4, OZ - 2.4]} ry={0.55} sc={1.4} />

        {/* palace foundations, rubble, water pits, tiny Krishna temple */}
        {fnd.map((g, i) => <Box key={i} s={g.s} p={g.p} m={found} />)}
        {rubble.map((g, i) => <Box key={i} s={g.s} p={g.p} r={[0, g.ry, 0]} m={found} />)}
        <Pit p={[-16, 0, -9]} />
        <Pit p={[15.5, 0, 9.5]} />
        <group position={[13, 0, -3]}>
          <Box s={[2.6, 0.3, 2.6]} p={[0, 0.15, 0]} m={found} />
          <Box s={[1.7, 1.7, 1.7]} p={[0, 1.15, 0]} m={M.plain('#cbc3ae', { roughness: 0.9 })} />
          <Box s={[0.6, 1.1, 0.08]} p={[0, 0.85, 0.87]} m={dark} cast={false} />
          <Box s={[2.1, 0.18, 2.1]} p={[0, 2.09, 0]} m={M.plain('#9a9585', { roughness: 0.9 })} />
        </group>

        {/* Kali Top shed in front of the back wall */}
        <KaliTop p={[-11.5, 0, 6]} />
      </group>
    );
  }

  /* ================= ENV ================= */
  function MakwanEnv() {
    const M = useM();

    const ridge = useMemo(() => {
      const N = 60; const n = 2 * N / 2 + 1; // 61 vertices per side, 2 m cells
      const pos = []; const col = []; const idx = [];
      const c = new THREE.Color();
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const x = -N + i * 2; const z = -N + j * 2;
        pos.push(x, H(x, z), z);
        const d = Math.max(0, ridgeD(x, z));
        if (d <= 0) c.set((i + j) % 7 === 0 ? '#7b6a41' : '#6a8a3a').offsetHSL(0, 0, (rnd(i * 7 + j * 13) - 0.5) * 0.05);
        else {
          const t = (0.5 * d) / STEP; const f = Math.floor(t); const k = f % 2;
          const fr = t - f;
          if (fr > 0.78) c.set('#4f7430'); else c.set(k === 0 ? '#5a7f35' : '#6a8f3e');
          if (f === 0 && fr <= 0.78) c.set('#6a8a3a');
          c.offsetHSL(0, 0, (rnd(i * 5 + j * 11) - 0.5) * 0.06);
        }
        col.push(c.r, c.g, c.b);
      }
      for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
        const cx = -N + i * 2 + 1; const cz = -N + j * 2 + 1;
        if (Math.abs(cx) < DX && Math.abs(cz) < DZ) continue;
        const a = j * n + i; const b = a + 1; const d = a + n; const e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);

    /* maize plants on the terraces */
    const maize = useMemo(() => {
      const a = [];
      for (let x = -56; x <= 56; x += 1.9) for (let z = -56; z <= 56; z += 2.1) {
        const i = x * 3.1 + z * 7.7;
        const px = x + (rnd(i) - 0.5) * 1.2; const pz = z + (rnd(i * 2) - 0.5) * 1.2;
        const d = ridgeD(px, pz); if (d < 1.5 || d > 46) continue;
        if (Math.abs(px) < DX + 4 && Math.abs(pz) < DZ + 4) continue;
        const t = (0.5 * d) / STEP; const f = Math.floor(t); const fr = t - f;
        if (fr < 0.1 || fr > 0.6 || rnd(i * 5) < 0.15) continue; // maize only on the green treads
        a.push({ p: [px, H(px, pz) + 0.75, pz], s: [0.8 + rnd(i) * 0.5, 0.85 + rnd(i * 3) * 0.3, 0.8 + rnd(i * 5) * 0.5], ry: rnd(i * 7) * 3 });
      }
      return a;
    }, []);

    /* slender trees along the approach and around the crest */
    const trees = useMemo(() => {
      const t = [];
      for (let z = 46; z <= 66; z += 6) { t.push({ x: 6 - 19 - rnd(z) * 4, z: z + rnd(z * 2) * 2, h: 11 + rnd(z * 3) * 4 }); if (z > 40) t.push({ x: 6 + 19 + rnd(z * 5) * 4, z: z + 2 + rnd(z * 4) * 2, h: 11 + rnd(z * 6) * 4 }); }
      for (let i = 0; i < 20; i++) {
        const a = rnd(i * 3.3) * Math.PI * 2; const r = 31 + rnd(i * 5.1) * 8;
        const x = Math.cos(a) * r * 1.2; const z = Math.sin(a) * r * 0.95;
        if (z > 10 && Math.abs(x - 6) < 19) continue;
        if (z > -4 && Math.abs(x) > 14 && Math.hypot(x, z) < 44) continue;
        t.push({ x, z, h: 9 + rnd(i * 9) * 5 });
      }
      return t;
    }, []);
    const trunk = M.plain('#c9c3b0', { roughness: 0.9 });
    const crowns = [M.plain('#4f7342', { roughness: 0.95 }), M.plain('#5a7d48', { roughness: 0.95 }), M.plain('#476b3d', { roughness: 0.95 })];

    /* approach: stepped walkway, blue railings, chain-link fence */
    const PX = 6; const blue = M.plain('#2c7aa6', { roughness: 0.5, metalness: 0.4 });
    const LAND = 38;
    const treads = useMemo(() => Array.from({ length: 34 }, (_, i) => 18.6 + i * 1.2).filter((z) => Math.abs(z - LAND) > 1.9), []);
    const tr = Math.atan(0.06);
    const diamond = useMemo(() => {
      try {
        const c = document.createElement('canvas'); c.width = 64; c.height = 64;
        const g = c.getContext('2d'); g.strokeStyle = 'rgba(150,158,158,0.95)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, 32); g.lineTo(32, 0); g.lineTo(64, 32); g.lineTo(32, 64); g.closePath(); g.stroke();
        const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; return t;
      } catch (e) { return null; }
    }, []);
    const FencePanel = ({ p, len, ry = 0, h = 1.7 }) => {
      const tex = useMemo(() => { if (!diamond) return null; const t = diamond.clone(); t.needsUpdate = true; t.repeat.set(len / 0.9, h / 0.9); return t; }, [len, h]);
      return (
        <mesh position={p} rotation={[0, ry, 0]}>
          <planeGeometry args={[len, h]} />
          <meshStandardMaterial map={tex} color="#aab2b2" transparent opacity={0.85} alphaTest={0.05} side={THREE.DoubleSide} depthWrite={false} roughness={0.7} />
        </mesh>
      );
    };
    const fenceR = { x: 26, z: 20 };
    const posts = useMemo(() => {
      const a = [];
      for (let x = -fenceR.x; x <= fenceR.x; x += 3.5) { a.push({ p: [x, 1.1, -fenceR.z] }); if (x < 2 || x > 10) a.push({ p: [x, 1.0, fenceR.z] }); }
      for (let z = -fenceR.z + 3.5; z < fenceR.z; z += 3.5) { a.push({ p: [-fenceR.x, 1.1, z] }); a.push({ p: [fenceR.x, 1.1, z] }); }
      return a;
    }, []);
    const walkPosts = useMemo(() => {
      const a = [];
      for (let z = 19; z <= 59; z += 1.5) a.push({ p: [PX + 4.2, crestY(z) + 1.1, z] });
      return a;
    }, []);
    const railPosts = useMemo(() => {
      const a = [];
      for (let z = 19; z <= 59; z += 2.4) { a.push({ p: [PX - 1.75, crestY(z) + 0.55, z] }); a.push({ p: [PX + 1.75, crestY(z) + 0.55, z] }); }
      return a;
    }, []);
    const postM = M.plain('#8a8f90', { roughness: 0.6, metalness: 0.4 });

    /* distant village houses */
    const houses = [[-44, 26, 0.3], [41, 20, -0.5], [-36, -38, 0.9]];
    const Hs = ({ x, z, r }) => {
      const y = H(x, z);
      const tin = M.plain('#7a8284', { roughness: 0.6, metalness: 0.3 });
      return (
        <group position={[x, y, z]} rotation={[0, r, 0]} scale={0.7}>
          <Box s={[4.4, 1.4, 3.6]} p={[0, -0.2, 0]} m={M.plain('#6d6a52', { roughness: 1 })} />
          <Box s={[4, 2.5, 3.2]} p={[0, 1.65, 0]} m={M.plain('#d9d2bd', { roughness: 0.9 })} />
          <Box s={[2.5, 0.12, 4.4]} p={[-1.05, 3.35, 0]} r={[0, 0, 0.42]} m={tin} />
          <Box s={[2.5, 0.12, 4.4]} p={[1.05, 3.35, 0]} r={[0, 0, -0.42]} m={tin} />
          <Box s={[0.6, 0.7, 0.06]} p={[1, 1.9, 1.62]} m={M.plain('#3a3328')} cast={false} />
        </group>
      );
    };

    /* Sanno Gadhi: small outlying knoll fort to the north-west */
    const SG = [-50, -44];
    const sgy = H(SG[0], SG[1]);

    /* layered Mahabharat ridge silhouettes, fading with distance */
    const hills = useMemo(() => [
      { r: 90, base: 22, amp: 15, seed: 1, col: '#5f8560' },
      { r: 135, base: 32, amp: 20, seed: 2.3, col: '#86a692' },
      { r: 185, base: 44, amp: 22, seed: 4.1, col: '#b6c8c6' },
    ].map((L) => {
      const N = 128; const pos = []; const idx = [];
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2; const sy = Math.sin(a);
        let prof = L.base + L.amp * (0.5 * Math.sin(a * 2 + L.seed) + 0.3 * Math.sin(a * 5 + L.seed * 2) + 0.2 * Math.sin(a * 11 + L.seed * 3));
        prof *= 1 - 0.5 * sstep(0.1, 0.6, sy);
        prof = Math.max(prof, 6);
        const rt = L.r * (1 + 0.03 * Math.sin(a * 17 + L.seed)); const rb = rt + prof * 2.4;
        pos.push(Math.cos(a) * rb, -17, Math.sin(a) * rb, Math.cos(a) * rt, -17 + prof, Math.sin(a) * rt);
        if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return { g, col: L.col };
    }), []);

    return (
      <group>
        <mesh geometry={ridge} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -17, 0]}><circleGeometry args={[420, 40]} /><meshStandardMaterial color="#7a9358" roughness={1} /></mesh>
        {hills.map((h, i) => (
          <mesh key={i} geometry={h.g}><meshStandardMaterial color={h.col} roughness={1} side={THREE.DoubleSide} /></mesh>
        ))}

        {[[-9, 0.5], [-15, 0.4]].map(([y, o], i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}><ringGeometry args={[38 + i * 8, 200, 40]} /><meshBasicMaterial color="#e8eee8" transparent opacity={o * 0.7} depthWrite={false} /></mesh>
        ))}
        <Inst items={maize}>
          <coneGeometry args={[0.38, 1.5, 5]} /><meshStandardMaterial color="#6a8f3e" roughness={1} />
        </Inst>

        {/* stepped walkway: 3.2 m treads with 0.4 m gaps, mid-landing, continuous blue railings */}
        {treads.map((z, i) => <Box key={i} s={[3.2, 0.18, 0.8]} p={[PX, crestY(z) + 0.05, z]} m={M.plain('#a9a393', { roughness: 0.9 })} cast={false} />)}
        <Box s={[3.6, 0.22, 2.6]} p={[PX, crestY(LAND) + 0.05, LAND]} m={M.plain('#b0aa9a', { roughness: 0.9 })} cast={false} />
        {[-1.75, 1.75].map((dx, i) => (
          <group key={i}>
            <Box s={[0.12, 0.12, 40.5]} p={[PX + dx, crestY(39) + 1.0, 39]} r={[tr, 0, 0]} m={blue} cast={false} />
            <Box s={[0.08, 0.08, 40.5]} p={[PX + dx, crestY(39) + 0.55, 39]} r={[tr, 0, 0]} m={blue} cast={false} />
          </group>
        ))}
        <Inst items={railPosts}><boxGeometry args={[0.09, 1.1, 0.09]} /><primitive object={blue} attach="material" /></Inst>
        {/* chain-link fence on the right of the walkway: dense posts plus diamond mesh */}
        <Inst items={walkPosts}><boxGeometry args={[0.06, 2.2, 0.06]} /><primitive object={postM} attach="material" /></Inst>
        <FencePanel p={[PX + 4.2, crestY(39) + 1.1, 39]} len={40.5} ry={Math.PI / 2} />

        {/* fence around the site */}
        <Inst items={posts}><boxGeometry args={[0.1, 2.2, 0.1]} /><primitive object={postM} attach="material" /></Inst>
        <FencePanel p={[0, 1.1, -fenceR.z]} len={fenceR.x * 2} />
        <FencePanel p={[-fenceR.x, 1.1, 0]} len={fenceR.z * 2} ry={Math.PI / 2} />
        <FencePanel p={[fenceR.x, 1.1, 0]} len={fenceR.z * 2} ry={Math.PI / 2} />
        <FencePanel p={[-12, 0.85, fenceR.z]} len={28} h={1.7} />
        <FencePanel p={[18, 0.85, fenceR.z]} len={16} h={1.7} />

        {/* trees */}
        {trees.map((t, i) => {
          const y = H(t.x, t.z);
          const broad = i % 4 === 1; const w = 0.65 + rnd(i * 7.7) * 0.75;
          const th = broad ? t.h * 0.72 : t.h * (0.8 + rnd(i * 2.2) * 0.3);
          return (
            <group key={i} position={[t.x, y, t.z]} rotation={[(rnd(i * 4.1) - 0.5) * 0.14, 0, (rnd(i * 6.3) - 0.5) * 0.18]}>
              <Cyl rt={0.07} rb={broad ? 0.26 : 0.17} h={th} p={[0, th / 2, 0]} m={trunk} seg={5} />
              {broad ? (
                <>
                  <Ball rad={1} p={[0, th + 0.4, 0]} sc={[2.6, 1.7, 2.6]} m={crowns[i % 3]} />
                  <Ball rad={1} p={[1.6, th - 0.6, 0.6]} sc={[1.7, 1.2, 1.7]} m={crowns[(i + 1) % 3]} />
                </>
              ) : (
                <>
                  <Ball rad={1} p={[0.15, th - 0.8, 0]} sc={[w, 1.4 + rnd(i * 3.3) * 1.3, w]} m={crowns[i % 3]} />
                  <Ball rad={1} p={[-0.45, th - 4.4, 0.3]} sc={[w * 0.9, 1.1 + rnd(i * 5.5), w * 0.9]} m={crowns[(i + 1) % 3]} />
                </>
              )}
            </group>
          );
        })}

        {houses.map(([x, z, r], i) => <Hs key={i} x={x} z={z} r={r} />)}

        {/* Sanno Gadhi */}
        <group position={[SG[0], sgy, SG[1]]}>
          <Cyl rt={4} rb={6} h={1.6} p={[0, 0.2, 0]} m={M.plain('#6f9a3e', { roughness: 1 })} seg={10} />
          {[[0, -2.4, 6, 0.6, 0.8], [0, 2.4, 6, 0.6, 0.8], [-3, 0, 0.6, 4.8, 0.8], [3, 0, 0.6, 4.8, 0.8]].map(([x, z, w, d, hh], i) => (
            <Box key={i} s={[w, 1.4 + hh, d]} p={[x, 1.7 + hh / 2, z]} m={M.mat('rock', 1, 1, { color: '#a9a392' })} />
          ))}
        </group>
      </group>
    );
  }

  return { 'makwanpur-gadhi': { Main: MakwanMain, Env: MakwanEnv } };
}
