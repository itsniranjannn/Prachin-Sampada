// Bajrayogini Temple, Sankhu: a compact three-roofed Newar pagoda of red brick and carved timber (lower roofs dark weathered
// copper, only the top roof, pinnacle and torana gilded) in a small paved courtyard on a forested hilltop, with the smaller
// two-roofed Jogeshvara temple beside it, white lions, a bronze bell, prayer flags, a four-Buddha chaitya, red-brick houses,
// a steep wooded ridge behind and a long stone stairway dropping to the valley and Sankhu far below.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Gajur, Chaitya, PrayerFlags, Diyo, Frame, THREE, useMemo } = K;
  const P = Math.PI;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rng = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const C = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };

  /* ---------- terrain height: courtyard shelf, steep ridge behind, spur with the stairway in front, valley far below ---------- */
  const VALLEY = -18.4;
  const SZ = 6.6; // z where the stairway leaves the courtyard
  function H(x, z) {
    const ax = Math.abs(x);
    const s = sm(5, 18, z);
    const back = z < -12.5 ? Math.min((-12.5 - z) * 0.95, 30) + Math.max(0, -z - 45) * 0.15 : 0;
    const dsx = Math.max(-14.7 - x, 0, x - 10.0); const dsz = Math.max(z - 7.1, 0);
    const dsk = Math.hypot(dsx, dsz) * (z > -7 ? 1 : 0);
    const skirt = (dsk > 0 ? 1.4 * sm(0, 1.0, dsk) * (1 - sm(9, 18, dsk)) : 0) * sm(-9.5, -6, z);
    const side = 0.17 * Math.max(0, ax - 11) * (1 - s);
    const base = Math.max(VALLEY, -Math.max(0, z - SZ) * 0.5);
    const drop = s * Math.max(0, ax - 3.6) * 0.42;
    const d = Math.hypot(Math.max(0, ax - 10), Math.max(0, -z - 12.5, z - 8));
    let w = sm(0, 14, d);
    if (z > 5) w *= sm(1.8, 6, ax);
    const n = (Math.sin(x * 0.21 + z * 0.13) * 0.7 + Math.sin(x * 0.07 - z * 0.19) * 1.0 + Math.sin(x * 0.43 + z * 0.37) * 0.35) * (1 + back * 0.12);
    return Math.max(VALLEY, base + back + side - drop + n * w - skirt);
  }

  /* ---------- merged vertex-coloured geometry for instanced forests ---------- */
  function mergeParts(parts) {
    const pos = []; const nor = []; const col = []; const idx = []; let off = 0;
    parts.forEach(({ geo, color }) => {
      const p = geo.attributes.position; const n = geo.attributes.normal;
      for (let i = 0; i < p.count; i += 1) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(...color); }
      if (geo.index) { for (let k = 0; k < geo.index.count; k += 1) idx.push(geo.index.getX(k) + off); } else { for (let i = 0; i < p.count; i += 1) idx.push(off + i); }
      off += p.count;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }
  const at = (g, x, y, z, sx = 1, sy = 1, sz = 1) => { g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz))); return g; };
  const pineGeo = () => {
    const parts = [{ geo: at(new THREE.CylinderGeometry(0.14, 0.24, 6.6, 6), 0, 3.3, 0), color: C('#5a4332') }];
    for (let i = 0; i < 5; i += 1) parts.push({ geo: at(new THREE.ConeGeometry(1.45 - i * 0.22, 0.95, 7), 0, 3.0 + i * 1.15, 0), color: C(i % 2 ? '#4a7a40' : '#3f6e3a') });
    parts.push({ geo: at(new THREE.ConeGeometry(0.22, 0.9, 6), 0, 8.9, 0), color: C('#3f6e3a') });
    return mergeParts(parts);
  };
  const broadGeo = () => mergeParts([
    { geo: at(new THREE.CylinderGeometry(0.2, 0.32, 2.8, 6), 0, 1.4, 0), color: C('#5a4332') },
    { geo: at(new THREE.IcosahedronGeometry(1.7, 0), 0, 3.6, 0, 1, 0.85, 1), color: C('#62923f') },
    { geo: at(new THREE.IcosahedronGeometry(1.3, 0), 1.1, 3.0, 0.5), color: C('#6f9c4a') },
    { geo: at(new THREE.IcosahedronGeometry(1.2, 0), -0.9, 3.2, -0.6), color: C('#558a3a') },
  ]);
  function Instanced({ geo, mat, items }) {
    const ref = (mesh) => {
      if (!mesh) return;
      const d = new THREE.Object3D(); const col = new THREE.Color();
      items.forEach((it, i) => {
        d.position.set(it.p[0], it.p[1], it.p[2]); d.scale.set(it.s[0], it.s[1], it.s[2]); d.rotation.set(0, it.r || 0, 0); d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix); col.setRGB(it.c[0], it.c[1], it.c[2]); mesh.setColorAt(i, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };
    return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} />;
  }

  /* ---------- shared textures / materials ---------- */
  let latticeTex = null;
  function lattice() {
    if (latticeTex) return latticeTex;
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#2a170d'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#a8703a'; g.lineWidth = 3;
    for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
    g.strokeStyle = '#5a3418'; g.lineWidth = 5; g.strokeRect(0, 0, 64, 64);
    latticeTex = new THREE.CanvasTexture(c); latticeTex.colorSpace = THREE.SRGBColorSpace; latticeTex.anisotropy = 4;
    return latticeTex;
  }
  let winTex = null;
  function windowTex() {
    if (winTex) return winTex;
    const c = document.createElement('canvas'); c.width = 64; c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = '#5a3418'; g.fillRect(0, 0, 64, 80);
    g.fillStyle = '#1d120b'; g.fillRect(6, 6, 52, 68);
    g.strokeStyle = '#8a5a30'; g.lineWidth = 3;
    for (let x = 14; x < 58; x += 12) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 74); g.stroke(); }
    g.beginPath(); g.moveTo(6, 40); g.lineTo(58, 40); g.stroke();
    winTex = new THREE.CanvasTexture(c); winTex.colorSpace = THREE.SRGBColorSpace; winTex.anisotropy = 4;
    return winTex;
  }
  const brickM = (M, w, h, c = '#e39a82') => M.mat('brick', Math.max(1, Math.round(w / 0.9)), Math.max(1, Math.round(h / 0.7)), { color: c });
  const stoneM = (M, rx = 2, ry = 2, c = '#a9a498') => M.mat('stone', rx, ry, { color: c });
  const copperDark = (M) => M.plain('#4e4a48', { metalness: 0.5, roughness: 0.5 });
  const WOOD = '#4a2e1f';
  const LAC = '#8a2a1a';

  /* gilded torana over a doorway, on the z=0 plane facing +z */
  function Torana({ p, s = 1 }) {
    const M = useM();
    return (
      <group position={p} scale={s}>
        <mesh material={M.gold} castShadow><torusGeometry args={[0.36, 0.05, 8, 24, P]} /></mesh>
        <mesh material={M.gold}><torusGeometry args={[0.25, 0.03, 8, 20, P]} /></mesh>
        <Box s={[0.5, 0.22, 0.02]} p={[0, 0.1, -0.01]} m={M.plain('#6b2a1c')} cast={false} />
        <Box s={[0.9, 0.06, 0.08]} p={[0, -0.02, 0.01]} m={M.gold} cast={false} />
        <Box s={[0.1, 0.15, 0.05]} p={[0, 0.08, 0.03]} m={M.gold} cast={false} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <Ball rad={0.07} p={[k * 0.38, 0.02, 0.03]} m={M.gold} />
            <Ball rad={0.045} p={[k * 0.26, 0.2, 0.03]} m={M.gold} />
            <Box s={[0.06, 0.2, 0.04]} p={[k * 0.15, 0.06, 0.03]} m={M.gold} cast={false} />
          </group>
        ))}
        <Ball rad={0.08} p={[0, 0.4, 0.03]} sc={[1, 0.85, 0.7]} m={M.gold} />
        <mesh position={[0, 0.52, 0.02]} material={M.gold}><coneGeometry args={[0.04, 0.16, 8]} /></mesh>
      </group>
    );
  }

  /* latticed timber window on the z=0 plane facing +z */
  function Win({ p, w = 0.5, h = 0.55 }) {
    const M = useM();
    return (
      <group position={p}>
        <Box s={[w + 0.1, h + 0.1, 0.06]} m={M.plain(LAC)} cast={false} />
        <mesh position={[0, 0, 0.034]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={lattice()} roughness={0.8} /></mesh>
        <Box s={[w + 0.2, 0.04, 0.14]} p={[0, h / 2 + 0.07, 0.04]} m={M.plain('#5a3418')} cast={false} />
      </group>
    );
  }

  /* raked carved struts under one eave on the +z face; hw = wall half width, out = eave projection */
  function Struts({ hw, y0, y1, out, n }) {
    const M = useM();
    const L = Math.hypot(y1 - y0, out);
    const th = Math.atan2(out, y1 - y0);
    const red = M.plain('#5e1e14'); const ochre = M.plain('#c4862c', { roughness: 0.6 });
    return (
      <group>
        {Array.from({ length: n }, (_, i) => {
          const x = -hw + 0.14 + (i * (2 * hw - 0.28)) / (n - 1);
          return (
            <group key={i} position={[x, (y0 + y1) / 2, hw + out / 2]} rotation={[th, 0, 0]}>
              <Box s={[0.12, L, 0.12]} m={red} cast={false} />
              <Box s={[0.2, L * 0.4, 0.04]} p={[0, L * 0.12, 0.08]} m={ochre} cast={false} />
            </group>
          );
        })}
      </group>
    );
  }
  function CornerStruts({ hw, y0, y1, out }) {
    const M = useM();
    const red = M.plain('#6e2418');
    const o = out * 1.4142;
    const L = Math.hypot(y1 - y0, o);
    const th = Math.atan2(o, y1 - y0);
    return (
      <group>
        {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => (
          <group key={`${sx}${sz}`} position={[sx * (hw + out / 2), (y0 + y1) / 2, sz * (hw + out / 2)]} rotation={[0, Math.atan2(sx, sz), 0]}>
            <group rotation={[th, 0, 0]}><Box s={[0.1, L, 0.1]} m={red} cast={false} /></group>
          </group>
        ))}
      </group>
    );
  }

  /* generic Newar pagoda: tiers = [{ww, wh, rw, rh}], front door on +z, one roof material per tier */
  function Pagoda({ tiers, roofs, goldTop, finial = 1.5, door = 0.8, name }) {
    const M = useM();
    const lay = useMemo(() => {
      const out = []; let base = 0.24;
      tiers.forEach((t, i) => {
        const eave = base + t.wh;
        out.push({ ...t, base, eave });
        const nx = tiers[i + 1];
        base = nx ? eave + t.rh * (1 - nx.ww / t.rw) ** 1.5 - 0.08 : eave + t.rh;
      });
      return out;
    }, [tiers]);
    const top = lay[lay.length - 1];
    const peak = top.eave + top.rh;
    const w0 = lay[0].ww;
    const dark = M.plain('#3a2214');
    const beam = M.plain('#5a2a1a');
    const fasc = M.plain('#3a2012');
    return (
      <group>
        {/* low plinth with only two steps at the door */}
        <Box s={[w0 + 0.8, 0.24, w0 + 0.8]} p={[0, 0.12, 0]} m={stoneM(M, 3, 3, '#9a958a')} />
        {[0, 1].map((i) => <Box key={i} s={[1.4 - i * 0.2, 0.16 - i * 0.07, 0.3]} p={[0, (0.16 - i * 0.07) / 2, w0 / 2 + 0.55 + i * 0.3]} m={stoneM(M, 1, 1, '#9a958a')} />)}
        {lay.map((t, i) => {
          const hw = t.ww / 2;
          const eaveOut = t.rw / 2 - 0.12;
          return (
            <group key={i}>
              <Box s={[t.ww, t.wh, t.ww]} p={[0, t.base + t.wh / 2, 0]} m={brickM(M, t.ww, t.wh, i === 0 ? '#e39a82' : '#cf7d65')} />
              <Box s={[t.ww + 0.1, 0.13, t.ww + 0.1]} p={[0, t.eave - 0.08, 0]} m={beam} cast={false} />
              <Box s={[t.rw - 0.24, 0.05, t.rw - 0.24]} p={[0, t.eave - 0.03, 0]} m={dark} cast={false} />
              <Roof w={t.rw} d={t.rw} h={t.rh} y={t.eave} m={roofs[i]} sag={1.5} fascia={false} />
              {[[0, 0, 1], [0, 0, -1], [1, P / 2, 0], [-1, P / 2, 0]].map(([a, ry, b], q) => (
                <group key={`f${q}`}>
                  <Box s={[t.rw - 0.1, 0.35, 0.1]} p={[a * (t.rw / 2 - 0.08), t.eave - 0.19, b * (t.rw / 2 - 0.08)]} r={[0, ry, 0]} m={fasc} cast={false} />
                  <Box s={[t.rw - 0.1, 0.05, 0.12]} p={[a * (t.rw / 2 - 0.08), t.eave + 0.0, b * (t.rw / 2 - 0.08)]} r={[0, ry, 0]} m={M.gold} cast={false} />
                </group>
              ))}
              {[0, 1, 2, 3].map((q) => (
                <Box key={`rg${q}`} s={[0.08, 0.07, t.rw * 0.62]} p={[Math.sin(q * P / 2 + P / 4) * t.rw * 0.2, t.eave + t.rh * 0.42 + 0.03, Math.cos(q * P / 2 + P / 4) * t.rw * 0.2]} r={[-Math.atan2(t.rh * 0.8, t.rw * 0.5) * 0.6, q * P / 2 + P / 4, 0]} m={M.plain('#2e261e', { metalness: 0.4 })} cast={false} />
              ))}
              {[0, 1, 2, 3].map((q) => (
                <group key={q} rotation={[0, (q * P) / 2, 0]}>
                  <Struts hw={hw} y0={t.eave - 0.8} y1={t.eave - 0.02} out={eaveOut - hw} n={6} />
                  {i > 0 && (
                    <group>
                      <mesh position={[0, t.eave - 0.5, hw + 0.03]}><planeGeometry args={[t.ww - 0.12, 0.5]} /><meshStandardMaterial map={lattice()} roughness={0.8} /></mesh>
                      <Box s={[t.ww - 0.06, 0.05, 0.05]} p={[0, t.eave - 0.76, hw + 0.04]} m={beam} cast={false} />
                    </group>
                  )}
                  {i === 0 && q > 0 && [-1, 0, 1].map((k) => <Win key={k} p={[k * t.ww * 0.3, t.base + t.wh * 0.42, hw + 0.02]} w={0.4} h={0.5} />)}
                  {i === 0 && q === 0 && [-1, 1].map((k) => <Win key={k} p={[k * t.ww * 0.36, t.base + t.wh * 0.4, hw + 0.02]} w={0.36} h={0.5} />)}
                </group>
              ))}
              <CornerStruts hw={hw} y0={t.eave - 0.8} y1={t.eave - 0.02} out={eaveOut - hw} />
              {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => (
                <mesh key={`${sx}${sz}`} position={[sx * (t.rw / 2 - 0.05), t.eave + t.rh * 0.2 - 0.18, sz * (t.rw / 2 - 0.05)]} rotation={[P, 0, 0]} material={M.copper}>
                  <coneGeometry args={[0.04, 0.3, 4]} />
                </mesh>
              ))}
            </group>
          );
        })}
        {/* ground-storey doorway: timber frame, gilded door leaves, gilded torana */}
        <group position={[0, 0.24, w0 / 2]}>
          <Box s={[door + 0.2, 1.22, 0.08]} p={[0, 0.61, 0.03]} m={M.plain(WOOD)} cast={false} />
          <Box s={[door * 0.5 - 0.02, 1.05, 0.05]} p={[-door * 0.25, 0.55, 0.07]} m={M.plain('#b8801f', { metalness: 0.5, roughness: 0.4 })} cast={false} />
          <Box s={[door * 0.5 - 0.02, 1.05, 0.05]} p={[door * 0.25, 0.55, 0.07]} m={M.plain('#b8801f', { metalness: 0.5, roughness: 0.4 })} cast={false} />
          <Box s={[0.02, 1.08, 0.07]} p={[0, 0.55, 0.09]} m={dark} cast={false} />
          <Box s={[door + 0.3, 0.09, 0.1]} p={[0, 1.27, 0.05]} m={M.gold} cast={false} />
          <Torana p={[0, 1.36 + (door > 0.7 ? 0.04 : 0), 0.05]} s={door > 0.7 ? 1 : 0.8} />
        </group>
        {/* top roof cap, pinnacle on a stepped base */}
        <Box s={[1.25, 0.1, 1.25]} p={[0, peak + 0.04, 0]} m={goldTop ? M.gold : copperDark(M)} />
        <Box s={[0.95, 0.1, 0.95]} p={[0, peak + 0.1, 0]} m={goldTop ? M.gold : copperDark(M)} />
        <Box s={[0.66, 0.12, 0.66]} p={[0, peak + 0.16, 0]} m={M.gold} />
        <Cyl rt={0.3} rb={0.4} h={0.2} p={[0, peak + 0.32, 0]} m={M.gold} seg={16} />
        <Gajur y={peak + 0.42} s={finial} />
      </group>
    );
  }

  const MAIN_TIERS = [
    { ww: 2.6, wh: 1.7, rw: 5.2, rh: 1.25 },
    { ww: 2.0, wh: 1.05, rw: 4.2, rh: 1.15 },
    { ww: 1.5, wh: 0.95, rw: 3.2, rh: 0.9 },
  ];
  const JOGE_TIERS = [
    { ww: 1.9, wh: 1.3, rw: 3.9, rh: 0.85 },
    { ww: 1.35, wh: 1.0, rw: 3.0, rh: 0.8 },
  ];

  /* ---------- sculpture and props ---------- */
  function LionStatue() {
    const M = useM();
    const w = M.plain('#ece6dc', { roughness: 0.7 });
    const red = M.plain('#d0281c', { roughness: 0.7 });
    const st = stoneM(M, 1, 1, '#8d8a82');
    return (
      <group>
        <Box s={[0.78, 0.26, 0.9]} p={[0, 0.13, 0]} m={st} />
        {/* seated haunch, rear body, chest and forelegs */}
        <Ball rad={0.3} p={[0, 0.52, -0.2]} sc={[1.05, 1.0, 1.15]} m={w} />
        <Ball rad={0.2} p={[0.0, 0.34, -0.38]} sc={[1.5, 0.8, 1]} m={w} />
        <Box s={[0.4, 0.62, 0.3]} p={[0, 0.7, 0.04]} m={w} />
        {[-0.12, 0.12].map((x) => <Box key={x} s={[0.12, 0.52, 0.13]} p={[x, 0.52, 0.24]} m={w} />)}
        {[-0.12, 0.12].map((x) => <Box key={`p${x}`} s={[0.15, 0.07, 0.2]} p={[x, 0.29, 0.3]} m={w} />)}
        {/* red mane ring behind the white face */}
        <Cyl rt={0.48} rb={0.48} h={0.14} p={[0, 1.08, -0.02]} r={[P / 2, 0, 0]} m={red} seg={18} />
        <Cyl rt={0.38} rb={0.4} h={0.16} p={[0, 1.08, 0.0]} r={[P / 2, 0, 0]} m={M.plain('#a81a12', { roughness: 0.8 })} seg={16} />
        <mesh position={[0, 1.08, -0.02]} material={M.gold}><torusGeometry args={[0.48, 0.025, 6, 22]} /></mesh>
        <Ball rad={0.22} p={[0, 1.06, 0.1]} sc={[1, 1, 0.9]} m={w} />
        <Box s={[0.24, 0.13, 0.16]} p={[0, 0.97, 0.26]} m={w} />
        <Box s={[0.2, 0.04, 0.04]} p={[0, 0.9, 0.34]} m={red} />
        {[-0.1, 0.1].map((x) => <Ball key={x} rad={0.035} p={[x, 1.12, 0.29]} m={M.dark} />)}
        {[-0.17, 0.17].map((x) => <Ball key={`e${x}`} rad={0.06} p={[x, 1.28, 0.06]} sc={[1, 1.2, 0.6]} m={w} />)}
        <Cyl rt={0.23} rb={0.26} h={0.05} p={[0, 0.82, 0.06]} m={M.gold} seg={14} />
        {/* red tail plume */}
        <Ball rad={0.1} p={[0, 0.5, -0.5]} sc={[0.7, 1.4, 0.7]} m={red} />
      </group>
    );
  }
  /* broad stepped stone platform (about 7 m) with five full-width steps, black railing, gilded timber shrine and white lions */
  function LionShrine() {
    const M = useM();
    const st = stoneM(M, 3, 1, '#9a958a');
    const wood = M.plain(WOOD);
    const iron = M.plain('#1c1a18', { metalness: 0.5, roughness: 0.5 });
    return (
      <group>
        <Box s={[5.8, 0.6, 1.9]} p={[0, 0.3, -0.05]} m={st} />
        {[0, 1, 2, 3, 4].map((j) => <Box key={j} s={[4.2, 0.6 - (j + 1) * 0.12, 0.35]} p={[0, (0.6 - (j + 1) * 0.12) / 2, 0.9 + 0.175 + j * 0.35]} m={st} />)}
        {/* black iron railing on the centre axis */}
        <Box s={[0.05, 0.05, 1.9]} p={[0, 0.85, 1.75]} r={[0.28, 0, 0]} m={iron} cast={false} />
        <Box s={[0.05, 0.05, 1.9]} p={[0, 0.62, 1.75]} r={[0.28, 0, 0]} m={iron} cast={false} />
        {[0.9, 1.5, 2.1, 2.6].map((z) => <Box key={z} s={[0.06, 0.8 - (z - 0.9) * 0.28, 0.06]} p={[0, (0.8 - (z - 0.9) * 0.28) / 2 + 0.12, z]} m={iron} cast={false} />)}
        {[-1, 1].map((k) => <group key={k} position={[k * 2.15, 0.6, 0.45]}><LionStatue /></group>)}
        {/* brick back wall and wings, timber posts, gilded doorway, low copper roof */}
        <Box s={[3.6, 2.2, 0.4]} p={[0, 0.6 + 1.1, -0.7]} m={brickM(M, 3.6, 2.2, '#d9917a')} />
        {[-1, 1].map((k) => <Box key={k} s={[0.9, 1.5, 0.4]} p={[k * 2.25, 0.6 + 0.75, -0.7]} m={brickM(M, 1.5, 1.5, '#cf8670')} />)}
        {[-1.75, 1.75].map((x) => <Cyl key={x} rt={0.09} h={2.2} p={[x, 1.7, 0.2]} m={wood} seg={8} />)}
        <Box s={[3.8, 0.16, 0.3]} p={[0, 2.78, 0.2]} m={M.plain(LAC)} cast={false} />
        <Box s={[1.15, 1.55, 0.1]} p={[0, 0.6 + 0.78, -0.47]} m={M.gold} cast={false} />
        <Box s={[0.85, 1.3, 0.08]} p={[0, 0.6 + 0.68, -0.43]} m={M.plain('#2a1608')} cast={false} />
        <mesh position={[0, 0.6 + 1.62, -0.46]} material={M.gold}><torusGeometry args={[0.55, 0.05, 8, 22, P]} /></mesh>
        <Ball rad={0.07} p={[0, 0.6 + 2.2, -0.45]} m={M.gold} />
        {[-1, 1].map((k) => <Box key={k} s={[0.3, 0.9, 0.06]} p={[k * 1.1, 1.4, -0.48]} m={M.plain('#7a3a22')} cast={false} />)}
        <Roof w={4.2} d={2.8} h={0.55} y={2.85} m={copperDark(M)} sag={1.2} lift={0.1} />
        {[-1.2, -0.4, 0.4, 1.2].map((x) => <Box key={x} s={[0.07, 0.4, 0.07]} p={[x, 2.62, 0.78]} m={M.plain('#c4862c')} cast={false} />)}
      </group>
    );
  }
  /* massive black stone bell-frame: square pillars, deep lintel, big dark bronze bell */
  function BellFrame() {
    const M = useM();
    const gr = M.plain('#2c2b29', { roughness: 0.9 });
    const bronze = M.plain('#2a2118', { metalness: 0.65, roughness: 0.4 });
    return (
      <group>
        <Box s={[2.9, 0.4, 1.7]} p={[0, 0.2, 0]} m={gr} />
        {[-1.0, 1.0].map((x) => <Box key={x} s={[0.5, 2.5, 0.5]} p={[x, 1.65, 0]} m={gr} />)}
        <Box s={[2.7, 0.4, 0.6]} p={[0, 3.1, 0]} m={gr} />
        <Box s={[2.9, 0.1, 0.7]} p={[0, 3.35, 0]} m={gr} />
        <Cyl rt={0.04} h={0.4} p={[0, 2.75, 0]} m={M.dark} seg={6} />
        <Cyl rt={0.22} rb={0.6} h={1.05} p={[0, 2.0, 0]} m={bronze} seg={20} />
        <Ball rad={0.22} p={[0, 2.52, 0]} m={bronze} />
        <Cyl rt={0.62} rb={0.62} h={0.06} p={[0, 1.48, 0]} m={bronze} seg={20} />
        <Ball rad={0.07} p={[0, 1.4, 0]} m={M.gold} />
      </group>
    );
  }
  /* four-Buddha chaitya on a yoni base */
  function FourBuddhaChaitya() {
    const M = useM();
    const st = stoneM(M, 1, 1, '#9a958a');
    const wh = M.plain('#e9e3d3', { roughness: 0.85 });
    return (
      <group>
        <Box s={[1.7, 0.22, 1.7]} p={[0, 0.11, 0]} m={st} />
        <Box s={[1.35, 0.2, 1.35]} p={[0, 0.32, 0]} m={st} />
        <Box s={[0.34, 0.1, 0.6]} p={[0, 0.2, 1.0]} m={st} />
        <Cyl rt={0.58} rb={0.62} h={0.6} p={[0, 0.72, 0]} m={wh} seg={20} />
        {[0, 1, 2, 3].map((q) => (
          <group key={q} rotation={[0, (q * P) / 2, 0]}>
            <Box s={[0.34, 0.38, 0.08]} p={[0, 0.74, 0.6]} m={M.plain('#3a2214')} cast={false} />
            <Ball rad={0.09} p={[0, 0.72, 0.65]} sc={[1, 1.1, 0.7]} m={M.gold} />
            <Box s={[0.16, 0.14, 0.06]} p={[0, 0.6, 0.65]} m={M.gold} cast={false} />
          </group>
        ))}
        <mesh position={[0, 1.02, 0]} material={wh} castShadow><sphereGeometry args={[0.6, 20, 10, 0, P * 2, 0, P / 2]} /></mesh>
        <Box s={[0.5, 0.4, 0.5]} p={[0, 1.78, 0]} m={M.gold} />
        {Array.from({ length: 7 }, (_, i) => <Cyl key={i} rt={0.26 - i * 0.03} rb={0.28 - i * 0.03} h={0.1} p={[0, 2.08 + i * 0.11, 0]} m={M.gold} seg={12} />)}
        <Ball rad={0.07} p={[0, 2.92, 0]} m={M.gold} />
        <mesh position={[0, 3.1, 0]} material={M.gold}><coneGeometry args={[0.05, 0.3, 8]} /></mesh>
      </group>
    );
  }
  function LampPillar({ p }) {
    const M = useM();
    const gr = M.plain('#55524d', { roughness: 0.9 });
    return (
      <group position={p}>
        <Box s={[0.5, 0.16, 0.5]} p={[0, 0.08, 0]} m={gr} />
        <Box s={[0.22, 1.5, 0.22]} p={[0, 0.9, 0]} m={gr} />
        <Box s={[0.4, 0.34, 0.4]} p={[0, 1.8, 0]} m={gr} />
        <Box s={[0.26, 0.2, 0.02]} p={[0, 1.8, 0.2]} m={M.plain('#ffb35a', { emissive: '#ff9a3a', emissiveIntensity: 0.7 })} cast={false} />
        <Box s={[0.5, 0.08, 0.5]} p={[0, 2.0, 0]} m={gr} />
        <Ball rad={0.1} p={[0, 2.1, 0]} m={gr} />
        <pointLight position={[0, 1.8, 0.4]} intensity={1.4} distance={4} color="#ffb35a" />
      </group>
    );
  }
  function Mandala({ p }) {
    const M = useM();
    const gr = M.plain('#7c7a74', { roughness: 0.95 });
    return (
      <group position={p}>
        <Box s={[0.9, 0.02, 0.9]} p={[0, 0.02, 0]} m={stoneM(M, 1, 1, '#8f8b80')} cast={false} />
        <Cyl rt={0.36} h={0.03} p={[0, 0.035, 0]} m={gr} seg={28} />
        {[0.3, 0.2, 0.1].map((r) => <mesh key={r} position={[0, 0.056, 0]} rotation={[-P / 2, 0, 0]} material={r === 0.2 ? M.plain('#54524d') : gr}><torusGeometry args={[r, 0.012, 5, 28]} /></mesh>)}
        {Array.from({ length: 12 }, (_, i) => <Ball key={i} rad={0.026} p={[Math.sin((i / 12) * P * 2) * 0.25, 0.06, Math.cos((i / 12) * P * 2) * 0.25]} m={gr} />)}
      </group>
    );
  }
  function Pole({ p, h = 4.8 }) {
    const M = useM();
    return <Cyl rt={0.04} rb={0.06} h={h} p={[p[0], h / 2, p[2]]} m={M.plain('#6a5a3a')} seg={6} />;
  }

  const MOSS = (() => {
    const out = []; const r = rng(5);
    [[-8.6, 5.9], [-4.6, 6.1], [3.8, 6.2], [8.0, 5.6], [-9.0, -2.0], [8.2, -1.0], [-6.0, -6.3], [0.9, -6.4], [6.8, -6.2], [-0.95, 1.4], [0.95, -2.5], [0.95, 5.5], [-0.95, -5.2]].forEach(([x, z]) => {
      for (let k = 0; k < 3; k += 1) out.push([x + (r() - 0.5) * 1.1, z + (r() - 0.5) * 0.7, 0.3 + r() * 0.3, 0.3 + r() * 0.25]);
    });
    return out;
  })();
  const FLAGS = [[-2.2, 2.0, 1.1, 0.8, 0.2, 1], [3.7, 3.7, 1.0, 0.7, -0.3, 1], [-6.0, 0.2, 1.4, 0.9, 0.1, 1], [5.8, 1.5, 0.9, 1.1, 0.4, 1], [-0.2, 1.7, 0.8, 0.6, 0, 1], [1.8, -4.4, 1.2, 0.9, -0.2, 1], [-4.6, 4.4, 1.0, 0.8, 0.3, 1], [-8.6, 2.0, 1.1, 0.7, 0.1, 0], [7.4, 4.4, 0.9, 0.8, 0.2, 0], [0.9, 5.2, 0.8, 0.8, 0.1, 0], [-3.0, -0.3, 0.9, 0.7, 0.5, 0]];

  /* ---------- Main ---------- */
  function Main() {
    const M = useM();
    const brown = M.plain('#6b5d4d', { metalness: 0.4, roughness: 0.55 });
    const roofs3 = useMemo(() => [brown, brown, M.plain('#d9ae2e', { metalness: 0.6, roughness: 0.3 })], [M, brown]);
    const roofs2 = useMemo(() => [brown, brown], [M, brown]);
    const pave = M.mat('granite', 16, 12, { color: '#e8e2d2' });
    const brickPave = brickM(M, 6, 1, '#d9735a');
    const wall = stoneM(M, 6, 1, '#d2cdbf');
    const water = M.plain('#4d7f86', { roughness: 0.15, metalness: 0.2 });
    const mossM = M.plain('#55623f', { roughness: 1 });
    const flagD = stoneM(M, 2, 2, '#dcd6c7');
    const flagM = stoneM(M, 2, 2, '#ffffff');
    const pole = M.plain('#8a6a3a', { roughness: 0.9 });
    const rubM = brickM(M, 0.4, 0.3, '#d58f78');
    return (
      <group>
        {/* paved courtyard, with a sunken fountain basin in the middle */}
        <Box s={[8.8, 0.1, 13.4]} p={[-5.1, -0.04, 0]} m={pave} />
        <Box s={[7.8, 0.1, 13.4]} p={[4.6, -0.04, 0]} m={pave} />
        <Box s={[1.4, 0.1, 5.5]} p={[0, -0.04, 3.85]} m={pave} />
        <Box s={[1.4, 0.1, 5.6]} p={[0, -0.04, -3.9]} m={pave} />
        <Box s={[1.4, 0.02, 3.2]} p={[0, 0.02, 4.0]} m={brickM(M, 1.4, 3.2, '#d9735a')} cast={false} />
        <Box s={[17.8, 0.025, 0.5]} p={[-0.6, 0.02, 1.5]} m={brickPave} cast={false} />
        <Box s={[0.12, 0.8, 1.9]} p={[-0.7, -0.4, 0]} m={wall} />
        <Box s={[0.12, 0.8, 1.9]} p={[0.7, -0.4, 0]} m={wall} />
        <Box s={[1.4, 0.8, 0.12]} p={[0, -0.4, -0.95]} m={wall} />
        <Box s={[1.4, 0.8, 0.12]} p={[0, -0.4, 0.95]} m={wall} />
        <Box s={[1.4, 0.05, 1.9]} p={[0, -0.78, 0]} m={wall} />
        <mesh position={[0, -0.42, 0]} rotation={[-P / 2, 0, 0]} material={water}><planeGeometry args={[1.3, 1.8]} /></mesh>
        <Box s={[0.5, 0.45, 0.2]} p={[0, -0.18, -0.85]} m={stoneM(M, 1, 1, '#7d7a72')} />
        <Cyl rt={0.03} h={0.3} p={[0, -0.2, -0.68]} r={[P / 2, 0, 0]} m={M.copper} seg={6} />
        {/* low parapet along the front edge, open where the stairway arrives */}
        <Box s={[7.0, 0.5, 0.3]} p={[-5.0, 0.25, 6.7]} m={wall} />
        <Box s={[6.6, 0.5, 0.3]} p={[4.9, 0.25, 6.7]} m={wall} />
        <Box s={[0.4, 0.8, 0.4]} p={[-1.5, 0.4, 6.7]} m={wall} />
        <Box s={[0.4, 0.8, 0.4]} p={[1.6, 0.4, 6.7]} m={wall} />
        <Box s={[3.4, 0.08, 1.2]} p={[0, 0.0, 6.3]} m={stoneM(M, 1, 1, '#a9a498')} cast={false} />
        {/* moss patches and darker irregular flagstones */}
        {MOSS.map((q, i) => <Ball key={`m${i}`} rad={1} p={[q[0], 0.035, q[1]]} sc={[q[2], 0.03, q[3]]} m={mossM} />)}
        {FLAGS.map((q, i) => <Box key={`g${i}`} s={[q[2], 0.02, q[3]]} p={[q[0], 0.03, q[1]]} r={[0, q[4], 0]} m={q[5] ? flagD : flagM} cast={false} />)}

        <group position={[2.6, 0, -1.6]}><Pagoda tiers={MAIN_TIERS} roofs={roofs3} goldTop door={0.8} /></group>
        <group position={[-2.1, 0, -2.2]}><Pagoda tiers={JOGE_TIERS} roofs={roofs2} goldTop={false} finial={1.0} door={0.64} /></group>

        <group position={[-6.9, 0, -4.2]} scale={1.2}><LionShrine /></group>
        <group position={[-12.2, 0, -4.4]}><BellFrame /></group>
        <Box s={[3.6, 0.1, 3.4]} p={[-12.2, -0.04, -3.9]} m={pave} />
        <group position={[5.9, 0, -5.3]}><FourBuddhaChaitya /></group>
        <LampPillar p={[-1.9, 0, 5.6]} />
        <Chaitya p={[4.9, 0, 2.5]} s={0.95} />
        <Chaitya p={[6.6, 0, 1.2]} s={0.8} />
        <Chaitya p={[-5.3, 0, 2.4]} s={0.9} />
        <Mandala p={[-1.6, 0, 3.4]} />
        {/* post-quake timber props at the main roof corners, brick rubble piles */}
        {[[1, 1], [-1, 1], [1, -1]].map(([sx, sz], i) => (
          <group key={`pr${i}`} position={[2.6 + sx * 2.05, 0, -1.6 + sz * 2.05]}>
            <Cyl rt={0.05} rb={0.06} h={2.1} p={[0, 1.05, 0]} m={pole} seg={6} />
            <Cyl rt={0.04} rb={0.04} h={1.5} p={[-sx * 0.35, 0.8, -sz * 0.35]} r={[sz * 0.45, 0, -sx * 0.45]} m={pole} seg={5} />
            <Box s={[0.5, 0.06, 0.06]} p={[0, 2.08, 0]} m={pole} cast={false} />
          </group>
        ))}
        {[[0.5, 4.7, 0.4], [-4.3, 1.2, 0.3], [6.4, -1.6, 0.35]].map(([x, z, k], i) => (
          <group key={`ru${i}`} position={[x, 0, z]}>
            {[[0, 0, 0, 0.5], [0.4, 0.2, 1.1, 0.35], [-0.3, 0.3, 0.4, 0.3], [0.1, -0.35, 2.0, 0.28]].map(([a, b, r, h], j) => <Box key={j} s={[0.5 * k * 2, h * 0.7, 0.35 * k * 2]} p={[a * 1.5, h * 0.35, b * 1.5]} r={[0, r, 0.1 * j]} m={rubM} />)}
          </group>
        ))}
        <Diyo p={[-0.9, 0.02, 2.6]} light />
        <Diyo p={[1.9, 0.02, 2.1]} />

        {/* multicoloured prayer flags across the courtyard */}
        <Pole p={[7.9, 0, 4.4]} h={5} />
        <Pole p={[-7.8, 0, 4.2]} h={5} />
        <PrayerFlags from={[-7.8, 5, 4.2]} to={[7.9, 5, 4.4]} n={34} />
        <PrayerFlags from={[2.6, 7.2, -1.6]} to={[7.9, 5, 4.4]} n={14} />
        <PrayerFlags from={[-2.1, 4.4, -2.2]} to={[-7.8, 5, 4.2]} n={12} />

        {/* retaining wall: the shelf grows out of the hillside */}
        <Box s={[13.2, 1.7, 0.45]} p={[-8.1, -0.8, 7.2]} m={wall} />
        <Box s={[8.6, 1.7, 0.45]} p={[5.8, -0.8, 7.2]} m={wall} />
        <Box s={[0.45, 1.7, 14.4]} p={[10.1, -0.8, 0.1]} m={wall} />
        <Box s={[0.45, 1.7, 14.4]} p={[-14.8, -0.8, 0.1]} m={wall} />
        <Frame s={[19.5, 7.6, 14]} p={[-4.2, 2.4, 0.6]} />
      </group>
    );
  }

  /* ---------- Env ---------- */
  function House({ p, r = 0, w = 4.5, d = 2.6, st = 3, plaster = true, bare = false, ruin = false }) {
    const M = useM();
    const sh = 1.05;
    const bays = Math.max(2, Math.floor(w / 1.15));
    const wallC = plaster ? '#d98a73' : '#d9917a';
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, 0.5, d]} p={[0, 0.25, 0]} m={stoneM(M, 3, 1, '#8f8b80')} />
        {Array.from({ length: st }, (_, i) => (
          <group key={i}>
            <Box s={[w, sh, d]} p={[0, 0.5 + sh * i + sh / 2, 0]} m={i === 0 || bare ? brickM(M, w, sh, '#d9917a') : M.mat('plaster', 2, 1, { color: wallC })} />
            <Box s={[w + 0.1, 0.09, d + 0.1]} p={[0, 0.5 + sh * (i + 1) - 0.04, 0]} m={M.plain('#4a2a1a')} cast={false} />
            {Array.from({ length: bays }, (_, k) => (
              <mesh key={k} position={[-w / 2 + (k + 0.5) * (w / bays), 0.5 + sh * i + sh * 0.55, d / 2 + 0.015]}>
                <planeGeometry args={[0.52, 0.62]} /><meshStandardMaterial map={windowTex()} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
        {!ruin && <Roof w={w + 0.7} d={d + 0.7} h={0.55} y={0.5 + sh * st} m={M.plain('#6b5d4d', { roughness: 0.6, metalness: 0.35 })} sag={1} lift={0} />}
        {ruin && <Box s={[w * 0.5, 0.6, d * 0.9]} p={[-w * 0.25, 0.5 + sh * st + 0.3, 0]} m={brickM(M, w * 0.5, 0.6, '#c98a74')} />}
        {ruin && <Box s={[w * 0.55, 0.06, d + 0.4]} p={[-w * 0.2, 0.5 + sh * st + 0.55, 0]} r={[0, 0, 0.5]} m={M.plain('#6b5d4d', { roughness: 0.6, metalness: 0.35 })} />}
        {ruin && [0, 1, 2].map((i) => <Box key={`r${i}`} s={[0.08, 1.0, 0.08]} p={[w * 0.2 + i * 0.35, 0.5 + sh * st + 0.5, d * 0.3 - i * 0.3]} r={[0.3 * i, 0, 0.5 - i * 0.4]} m={M.plain('#4a2e1f')} cast={false} />)}
        {ruin && [0, 1, 2].map((i) => <Box key={i} s={[0.5, 0.25, 0.4]} p={[w / 2 + 0.4 + i * 0.3, 0.12, 0.5 - i * 0.6]} r={[0, i, 0]} m={brickM(M, 0.5, 0.25, '#c98a74')} />)}
      </group>
    );
  }
  function Pine({ p, h = 10 }) {
    const M = useM();
    const leaf = M.plain('#46763c', { roughness: 1 });
    const leaf2 = M.plain('#3b6a38', { roughness: 1 });
    const n = 5;
    return (
      <group position={p}>
        <Cyl rt={0.14} rb={0.3} h={h * 0.95} p={[0, h * 0.475, 0]} m={M.plain('#5a4332')} seg={7} />
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[0, h * 0.36 + i * (h * 0.13), 0]} material={i % 2 ? leaf : leaf2} castShadow>
            <coneGeometry args={[h * 0.15 * (1 - i * 0.17), h * 0.1, 8]} />
          </mesh>
        ))}
        <mesh position={[0, h * 1.02, 0]} material={leaf}><coneGeometry args={[h * 0.025, h * 0.14, 6]} /></mesh>
      </group>
    );
  }
  const SHRUBS = [[-9.6, -9.4, 0.7], [-6, -9.6, 0.6], [-1.5, -9.7, 0.8], [3.8, -9.6, 0.7], [9, -9.4, 0.8], [10.2, -5, 0.6], [10.4, 0.5, 0.7], [-10.4, 5.5, 0.7], [-9.2, 6, 0.5], [9.8, 6, 0.6], [6.8, 7.4, 0.5], [-12.5, 0, 0.6], [-15.5, -3, 0.8]];
  function Env() {
    const M = useM();
    const terrain = useMemo(() => {
      const g = new THREE.PlaneGeometry(220, 200, 110, 100);
      g.rotateX(-P / 2);
      const pos = g.attributes.position;
      const cols = [];
      const a = new THREE.Color('#3f6f3a'); const b = new THREE.Color('#4b7f43'); const c2 = new THREE.Color('#8ab25a'); const c3 = new THREE.Color('#c8bd62'); const tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i); const z = pos.getZ(i);
        const y = H(x, z);
        pos.setY(i, y - 0.15);
        if (y <= VALLEY + 0.2) {
          const k = (Math.sin(x * 0.35 + Math.sin(z * 0.1) * 2) + Math.sin(z * 0.5)) * 0.25 + 0.5;
          tmp.copy(c2).lerp(c3, k);
        } else {
          const k = 0.5 + 0.5 * Math.sin(x * 0.3) * Math.cos(z * 0.27);
          tmp.copy(a).lerp(b, k * 0.8 + sm(-12, 0, y) * 0.0);
        }
        cols.push(tmp.r, tmp.g, tmp.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    const terrMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, color: '#d4d8d0' }), []);
    const forestMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), []);
    const pg = useMemo(pineGeo, []);
    const bg = useMemo(broadGeo, []);
    const trees = useMemo(() => {
      const r = rng(7);
      const pines = []; const broads = [];
      for (let i = 0; i < 3200 && pines.length + broads.length < 480; i += 1) {
        const dense = i % 4 === 0; const x = (r() - 0.5) * 150; const z = dense ? -45 + r() * 31 : -80 + r() * 135;
        if (Math.abs(x) < 20 && z > -15 && z < 26) continue; // eslint-disable-line no-continue
        const y = H(x, z);
        if (y < VALLEY + 0.6 && r() < 0.8) continue; // eslint-disable-line no-continue
        const s = (0.55 + r() * 0.5) * (1 + Math.max(0, -z - 15) * 0.012);
        const k = 0.85 + r() * 0.3;
        const isPine = r() < 0.55;
        const pk = isPine ? 1.3 : 1;
        const item = { p: [x, y - 0.2, z], s: [s * pk * (0.9 + r() * 0.3), s * pk * (0.9 + r() * 0.3), s * pk * (0.9 + r() * 0.3)], r: r() * 6, c: [k * 0.86, k * 0.9, k * 0.84] };
        (isPine ? pines : broads).push(item);
      }
      return { pines, broads };
    }, []);
    const town = useMemo(() => {
      const r = rng(21); const items = [];
      for (let i = 0; i < 170; i += 1) {
        const cx = (r() - 0.5) * 70 - 4; const cz = 52 + r() * 40;
        const w = 1.6 + r() * 2.2; const hh = 1.0 + r() * 1.6;
        const k = r();
        items.push({ p: [cx, VALLEY + hh / 2 + 0.05, cz], s: [w, hh, w * (0.7 + r() * 0.5)], r: 0, c: k < 0.4 ? C('#b8705a') : k < 0.7 ? C('#d8cdb8') : C('#9a9488') });
      }
      return items;
    }, []);
    const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
    const townMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), []);
    const NS = 54;
    const bendX = (i) => -2.3 * sm(14, 42, i);
    const steps = useMemo(() => Array.from({ length: NS }, (_, i) => ({ i, x: bendX(i), ry: Math.atan2(-2.3 * (sm(14, 42, i + 1) - sm(14, 42, i)), 0.6) })), []);
    const stairM = stoneM(M, 1, 1, '#b9b4a6');
    const stairM2 = stoneM(M, 1, 1, '#9a968a');
    const shrubA = M.plain('#4f8a3c', { roughness: 1 });
    const shrubB = M.plain('#6b9a48', { roughness: 1 });
    return (
      <group>
        <mesh geometry={terrain} material={terrMat} receiveShadow />
        <Instanced geo={pg} mat={forestMat} items={trees.pines} />
        <Instanced geo={bg} mat={forestMat} items={trees.broads} />
        <Instanced geo={boxGeo} mat={townMat} items={town} />

        {/* the long carved stone stairway, bending round the shoulder of the hill with a landing at the twelfth step */}
        {steps.map(({ i, x, ry }) => (
          <group key={i} position={[x, 0, SZ + 0.6 * (i + 0.5)]} rotation={[0, ry, 0]}>
            <Box s={[1.8, 0.9, 0.64]} p={[0, -0.3 * (i + 1) - 0.15, 0]} m={i % 9 === 8 ? stairM2 : stairM} cast={false} />
            {[-0.84, 0.84].map((k) => <Box key={k} s={[0.12, 0.5, 0.64]} p={[k, -0.3 * (i + 1) + 0.2, 0]} m={stairM2} cast={false} />)}
            {i % 6 === 0 && [-0.84, 0.84].map((k) => <Box key={`p${k}`} s={[0.22, 0.75, 0.22]} p={[k, -0.3 * (i + 1) + 0.33, 0]} m={stairM2} cast={false} />)}
          </group>
        ))}
        <Box s={[3.0, 0.3, 2.0]} p={[0, -0.3 * 13 - 0.1, SZ + 0.6 * 12.5 + 0.2]} m={stairM} cast={false} />
        <Box s={[2.9, 0.3, 1.5]} p={[0, -0.2, SZ - 0.1]} m={stairM} cast={false} />
        {[[-1, 21, 8], [1, 21, 9], [-1, 34, 8], [1, 34, 7.5]].map(([k, n, h], q) => <Pine key={`sp${q}`} p={[bendX(n) + k * 3.2, H(bendX(n) + k * 3.2, SZ + 0.6 * n) - 0.2, SZ + 0.6 * n]} h={h} />)}

        {/* red-brick and salmon-plaster Newar priest houses lining the far edge of the courtyard */}
        <House p={[-8.2, H(-8.2, -12.6) - 0.1, -12.6]} w={3.8} st={3} />
        <House p={[-3.2, H(-3.2, -12.8) - 0.1, -12.8]} w={3.6} st={2} bare />
        <House p={[2.6, H(2.6, -12.9) - 0.1, -12.9]} w={3.6} st={3} ruin />
        <House p={[7.6, H(7.6, -12.6) - 0.1, -12.6]} w={3.2} st={2} plaster={false} />
        <House p={[-15.5, H(-15.5, -9) - 0.1, -9]} r={0.3} w={3.6} st={2} bare />
        {/* ruined red-brick wall, front left */}
        <Box s={[3.2, 0.6, 0.35]} p={[-8.6, 0.3, 5.2]} m={brickM(M, 3.2, 0.6, '#c98a74')} />
        <Box s={[1.6, 0.9, 0.35]} p={[-9.7, 0.45, 5.2]} m={brickM(M, 1.6, 0.9, '#c98a74')} />
        <Box s={[1.4, 0.25, 0.35]} p={[-7.6, 0.72, 5.2]} r={[0, 0, 0.2]} m={brickM(M, 1.4, 0.25, '#c98a74')} />

        {/* tall pines overhanging the courtyard, two rising behind the temple like in the photographs */}
        <Pine p={[7.4, 0, -7.2]} h={12} />
        <Pine p={[-0.8, 0, -9.4]} h={13} />
        <Pine p={[11.8, 0, -3.5]} h={10} />
        <Pine p={[-17, 0, -8]} h={9} />
        <Pine p={[5.8, 0, -9.0]} h={14} />
        <Pine p={[1.6, 0, -8.2]} h={15} />
        <Pine p={[-4.6, 0, -9.6]} h={13} />
        <Pine p={[-9.2, 0, -8.6]} h={14} />
        <Pine p={[10.6, 0, -6.0]} h={12} />
        <Pine p={[-12.8, 0, -8.4]} h={12} />
        {SHRUBS.map((q, i) => <Ball key={`sh${i}`} rad={q[2]} p={[q[0], q[2] * 0.4, q[1]]} sc={[1.3, 0.75, 1.1]} m={i % 3 ? shrubA : shrubB} />)}

        {[[-30, 0, -78, 90, 34, '#7e9fb2', 0.5], [35, 2, -96, 100, 38, '#92b0c2', 0.45], [-10, 6, -118, 120, 44, '#a8c1cf', 0.45], [0, 14, -85, 150, 20, '#d3e1ea', 0.25]].map(([x, y, z, w, h, c, o], i) => (
          <mesh key={`mr${i}`} position={[x, y, z]} scale={[w, h, w * 0.3]}>
            <sphereGeometry args={[1, 16, 8]} /><meshBasicMaterial color={c} transparent opacity={o} depthWrite={false} />
          </mesh>
        ))}
        {/* mist, and the misty green hills beyond the valley */}
        {[[-24, 17, -30, 16], [20, 21, -40, 20], [34, 3, -14, 12]].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={[s, 0.9, s * 0.5]}>
            <sphereGeometry args={[1, 14, 8]} /><meshBasicMaterial color="#e6f0f6" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
        {[[-120, -8, 60, 60, 36], [-60, -6, 150, 70, 30], [70, -6, 150, 70, 38], [130, -8, 50, 60, 40], [-130, -8, -50, 70, 46], [0, 8, -125, 110, 75], [110, -8, -90, 70, 44]].map(([x, y, z, w, h], i) => (
          <Ball key={i} rad={1} p={[x, y, z]} sc={[w, h, w * 0.8]} m={M.plain(i % 2 ? '#6a8fa6' : '#7aa0b4', { roughness: 1 })} />
        ))}
      </group>
    );
  }

  return { 'bajrayogini-temple-sankhu': { Main, Env } };
}
