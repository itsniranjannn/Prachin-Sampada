// Barahachhetra (Barahakshetra, Sunsari): a compact huddle of whitewashed, tall ogee-domed shrines on a cramped, stepped, rubble-walled
// bluff directly above the wide braided Saptakoshi where it leaves the forested Churia gorge. Circular violet-ringed Varaha pool on a
// terracotta tiled plaza with a yellow-olive 12-sided railing and globe lamps, an octagonal shingled pavilion in front of the main porch,
// a white arched gate, blue rails and steps down to the pale sand bar.
export default function make(K) {
  const { THREE, useMemo, useRef, useEffect, useState, useM, Frame, Box, Cyl, Ball, Diyo, PrayerFlags } = K;

  const TAU = Math.PI * 2;
  const WHITE = '#f6f3ec';
  const GOLD = '#d4a21e';
  const OLIVE = '#b3a52c';
  const BLUE = '#2f5fbf';
  const STONE = '#cfc8b8';
  const V2 = (pts) => pts.map(([r, y]) => new THREE.Vector2(r, y));
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function useDusk() {
    const ref = useRef();
    const [dusk, setDusk] = useState(false);
    useEffect(() => {
      try { let o = ref.current; while (o && o.parent) o = o.parent; const c = o && o.background; if (c && c.isColor) setDusk(c.r + c.g + c.b < 0.7); } catch (e) { /* ignore */ }
    }, []);
    return [dusk, ref];
  }

  /* ---------------- plan: small plaza on a stepped bluff; the Saptakoshi wraps its back (-z) and left (-x) sides ---------------- */
  const PX0 = -6.5, PX1 = 7.5, PZ0 = -8, PZ1 = 8;      // plaza 14 x 16 m, top at y = 0
  const L1T = -0.855, L2T = -1.71;                      // two stepped sub-terraces
  const WATER_Y = -3.5;
  const SAND = -3.25;
  const LAND = -0.3;
  const TOP = -2.1;
  const noise = (x, z) => Math.sin(x * 0.13 + 1.3) * Math.cos(z * 0.11 + 0.4) * 0.5 + Math.sin(x * 0.31 + z * 0.27) * 0.3 + Math.sin(x * 0.7 - z * 0.6 + 2) * 0.15;
  /** distance from the plaza outline toward the river (back and left sides; the river swings away at the front and far right) */
  const rd = (x, z) => {
    const sh = 14 * sstep(8, 40, z), sh2 = 12 * sstep(8, 34, x);
    return Math.hypot(Math.max(0, PX0 - x - sh), Math.max(0, PZ0 - z - sh2));
  };
  const sandEndAt = (x, z) => 9 + 2.0 * Math.sin(x * 0.11 + z * 0.07) + 1.0 * Math.sin(x * 0.31 - z * 0.2);
  const FAR = 30;
  const heightAt = (x, z) => {
    const d = rd(x, z);
    const front = Math.max(0, z - 40);
    let land = LAND + noise(x * 0.8, z * 0.8) * 0.12 * sstep(14, 26, z) + 9 * (1 - Math.exp(-front / 26)) + noise(x * 0.9, z * 1.4) * Math.min(front, 12) * 0.22;
    land += 3 * sstep(12, 42, z) + 24 * (1 - Math.exp(-Math.max(0, x - 50) / 15));
    if (d < 0.001) return land;
    const top = TOP + (LAND - TOP) * Math.max(sstep(9, 13, z), sstep(8.2, 12.5, x));
    const sandEnd = sandEndAt(x, z);
    let h;
    if (d < 3.6) h = top;
    else if (d < 5.6) h = top + (SAND - top) * sstep(3.6, 5.6, d);
    else if (d < sandEnd) h = SAND + noise(x * 1.6, z * 1.6) * 0.07;
    else if (d < sandEnd + 2.5) h = SAND + (WATER_Y - 0.8 - SAND) * sstep(sandEnd, sandEnd + 2.5, d);
    else if (d < FAR) {
      const braid = Math.exp(-Math.pow((d - 22) / 1.4, 2)) * 1.5 * sstep(-0.2, 0.5, Math.sin(x * 0.09 + z * 0.05));
      h = WATER_Y - 0.8 + braid;
    } else {
      const u = d - FAR;
      h = WATER_Y - 0.8 + 34 * (1 - Math.exp(-u / 9)) + noise(x * 1.3, z * 1.7) * Math.min(u, 14) * 0.3 + Math.max(0, Math.sin(u * 0.08 + 1)) * 7 * sstep(8, 36, u);
    }
    return h;
  };
  const nearTerr = (x, z) => x > -10 && x < 13 && z > -13 && z < 15;

  function Terrain() {
    const geo = useMemo(() => {
      const S = 230, N = 200;
      const g = new THREE.PlaneGeometry(S, S, N, N);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color(), c2 = new THREE.Color();
      const haze = new THREE.Color('#bccdc2');
      const r = rng(7);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const h = heightAt(x, z);
        pos.setY(i, h);
        const nz = noise(x * 2.1, z * 2.1) * 0.5 + 0.5;
        const nb = noise(x * 0.6 + 9, z * 0.55 - 4) * 0.5 + 0.5;
        const dist = Math.hypot(x, z);
        const d = rd(x, z);
        if (d > 3.3 && d < FAR + 1 && h < WATER_Y + 0.9) {
          if (h > WATER_Y + 0.02) c.set(d < 5.8 ? '#bdb6a3' : (nz > 0.5 ? '#e8e2cc' : '#ddd6bb'));
          else c.set('#6f9a86');
        } else if (d > 0.01 && d <= 3.3) {
          c.set('#9a947f').lerp(c2.set('#7d8a55'), nz * 0.45);
        } else {
          const slope = Math.abs(heightAt(x + 1.5, z) - h) + Math.abs(heightAt(x, z + 1.5) - h);
          c.set('#46633a'); c2.set(nz > 0.55 ? '#5b7a40' : '#3a5832'); c.lerp(c2, 0.55);
          if (nb > 0.68) c.lerp(c2.set('#8f9060'), Math.min(0.5, (nb - 0.68) * 2));
          if (slope > 3.2 && nz > 0.45) c.lerp(c2.set('#8d8366'), 0.4);
          if (nearTerr(x, z) && h < 0.2) c.set('#6e8046').lerp(c2.set('#5a7440'), nz * 0.6);
        }
        c.lerp(haze, Math.min(0.7, sstep(45, 130, dist) * 0.5 + sstep(10, 40, h) * 0.18 * sstep(30, 80, dist)));
        c.offsetHSL(0, 0, (r() - 0.5) * 0.035);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
  }

  /** Dense canopy clusters of three greens (merged into one mesh). */
  function Forest() {
    const geo = useMemo(() => {
      const r = rng(21);
      const base = new THREE.IcosahedronGeometry(1, 0);
      const bp = base.attributes.position;
      const P = [], C = [];
      const cc = new THREE.Color();
      const greens = ['#3f6030', '#56783a', '#6c8a45'];
      const hazeC = new THREE.Color('#bccdc2');
      const put = (x, y, z, sx, sy, sz, col) => {
        cc.set(col);
        for (let i = 0; i < bp.count; i++) {
          P.push(bp.getX(i) * sx + x, bp.getY(i) * sy + y, bp.getZ(i) * sz + z);
          C.push(cc.r, cc.g, cc.b);
        }
      };
      let n = 0;
      for (let k = 0; k < 120000 && n < 6500; k++) {
        const x = (r() - 0.5) * 210, z = (r() - 0.5) * 210;
        if (nearTerr(x, z)) continue;
        const h = heightAt(x, z);
        const dist = Math.hypot(x, z);
        const d = rd(x, z);
        if (h < WATER_Y + 0.8) continue;
        if (d > 0.01 && d < 6.5 && z < 30) continue;
        if (d > 3 && d < FAR && h < WATER_Y + 2.2) continue;
        if (dist > 100) continue;
        if (!(d > FAR && d < FAR + 40) && r() > 0.25) continue;
        if (z > 14 && z < 34 && Math.abs(x) < 18) continue;
        if (x < -14 && z > 8 && d < 2 && r() > 0.35) continue;
        let sz = (0.8 + r() * 0.6) * (1 + sstep(20, 85, dist) * 1.2);
        if (d <= 0.01 && z > 17 && z < 50 && Math.abs(x) < 34) { if (r() > 0.5) continue; sz *= 0.6; }
        const base0 = greens[Math.floor(r() * 3)];
        const mix = (col, a) => '#' + new THREE.Color(col).lerp(hazeC, Math.min(0.7, sstep(35, 115, dist) * 0.65)).getHexString();
        put(x, h + sz * 0.7, z, sz, sz * 1.1, sz, mix(base0));
        put(x + sz * 0.55, h + sz * 0.5, z + sz * 0.25, sz * 0.75, sz * 0.9, sz * 0.75, mix(greens[(Math.floor(r() * 3))]));
        put(x - sz * 0.3, h + sz * 1.05, z - sz * 0.2, sz * 0.7, sz * 0.7, sz * 0.7, mix(greens[2]));
        n++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
      g.computeVertexNormals();
      return g;
    }, []);
    return <mesh geometry={geo} castShadow><meshStandardMaterial vertexColors roughness={1} flatShading /></mesh>;
  }

  /** Stone retaining block: square frustum (batter) from yBot to yTop, rubble texture. */
  function Bluff({ x0, x1, z0, z1, yTop, yBot, m, b = 0.06 }) {
    const w = x1 - x0, d = z1 - z0, h = yTop - yBot;
    return (
      <group position={[(x0 + x1) / 2, (yTop + yBot) / 2, (z0 + z1) / 2]} scale={[w, h, d]}>
        <mesh rotation={[0, Math.PI / 4, 0]} material={m} castShadow receiveShadow>
          <cylinderGeometry args={[0.70711, 0.70711 * (1 + b), 1, 4, 1]} />
        </mesh>
      </group>
    );
  }

  /** Blue steel railing between two points on the walking surface. */
  function Rail({ a, b, h = 0.95, m }) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const hor = Math.hypot(dx, dz), len = Math.hypot(hor, dy);
    const yaw = Math.atan2(dx, dz), pitch = -Math.atan2(dy, hor);
    const n = Math.max(2, Math.ceil(len / 1.5));
    return (
      <group position={a} rotation={[0, yaw, 0]}>
        <group rotation={[pitch, 0, 0]}>
          <Box s={[0.06, 0.06, len]} p={[0, h, len / 2]} m={m} cast={false} />
          <Box s={[0.05, 0.05, len]} p={[0, h * 0.5, len / 2]} m={m} cast={false} />
          {Array.from({ length: n + 1 }, (_, i) => <Box key={i} s={[0.06, h, 0.06]} p={[0, h / 2, (i / n) * len]} m={m} cast={false} />)}
        </group>
      </group>
    );
  }

  /** One continuous flight of steps toward -z (runs vary), blue rails both sides. */
  function Flight({ p, w, dr, runs, base, m, blue }) {
    let z = 0;
    const total = runs.reduce((a, b) => a + b, 0);
    return (
      <group position={p}>
        {runs.map((run, i) => {
          const top = -dr * (i + 1);
          const zc = -(z + run / 2);
          z += run;
          return <Box key={i} s={[w, top - base, run]} p={[0, (top + base) / 2, zc]} m={m} />;
        })}
        {[-1, 1].map((sx) => <Rail key={sx} a={[sx * (w / 2 + 0.04), 0, 0]} b={[sx * (w / 2 + 0.04), -dr * runs.length, -total]} m={blue} />)}
      </group>
    );
  }

  /* ---------------- white domed shrine pieces ---------------- */
  const domeGeoCache = new Map();
  function domeGeos(r) {
    const key = r.toFixed(3);
    if (!domeGeoCache.has(key)) {
      const dh = r * 0.9; // tall ribbed drum
      const prof = [[r * 1.08, 0], [r * 1.08, dh * 0.12], [r * 0.98, dh * 0.14], [r * 0.98, dh * 0.32], [r * 1.06, dh * 0.34], [r * 1.06, dh * 0.5], [r * 0.97, dh * 0.52], [r * 0.97, dh * 0.68], [r * 1.04, dh * 0.7], [r * 1.04, dh * 0.84], [r * 0.94, dh * 0.86], [r * 0.94, dh]];
      for (let i = 1; i <= 12; i++) {
        const a = (i / 12) * 1.15;
        prof.push([r * 0.94 * Math.cos(a), dh + r * 0.98 * Math.sin(a)]);
      }
      prof.push([r * 0.3, dh + r * 0.95], [r * 0.17, dh + r * 1.03], [r * 0.07, dh + r * 1.1], [0.012, dh + r * 1.15]);
      domeGeoCache.set(key, { geo: new THREE.LatheGeometry(V2(prof), 40), top: dh + r * 1.15 });
    }
    return domeGeoCache.get(key);
  }
  function DomeOnDrum({ r = 1, p = [0, 0, 0], m, gold }) {
    const { geo, top } = domeGeos(r);
    return (
      <group position={p}>
        <mesh geometry={geo} material={m} castShadow receiveShadow />
        <Cyl rt={r * 0.08} rb={r * 0.12} h={r * 0.12} p={[0, top + r * 0.03, 0]} m={m} seg={14} />
        <Ball rad={r * 0.1} p={[0, top + r * 0.16, 0]} m={gold} />
        <Cyl rt={0.004} rb={r * 0.04} h={r * 0.4} p={[0, top + r * 0.38, 0]} m={gold} seg={8} />
      </group>
    );
  }

  /** Small square white shrine under a tall ribbed dome (the secondary temples). */
  function Shrine({ p = [0, 0, 0], w = 2, h = 1.5, rot = 0, m, gold, dark, r }) {
    const dr = r || w * 0.44;
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[w + 0.5, 0.14, w + 0.5]} p={[0, 0.07, 0]} m={m} />
        <Box s={[w, h, w]} p={[0, 0.14 + h / 2, 0]} m={m} />
        <Box s={[w + 0.16, 0.1, w + 0.16]} p={[0, 0.14 + h + 0.05, 0]} m={m} />
        <Box s={[w * 0.32, h * 0.58, 0.05]} p={[0, 0.14 + h * 0.31, w / 2 + 0.02]} m={dark} />
        <Box s={[w * 0.4, h * 0.08, 0.1]} p={[0, 0.14 + h * 0.66, w / 2 + 0.04]} m={m} />
        <DomeOnDrum r={dr} p={[0, 0.14 + h + 0.1, 0]} m={m} gold={gold} />
      </group>
    );
  }

  /** The principal Varaha temple (scaled up): square cella 5.5 m, deep flat-roofed pillared porch with scalloped cornice, one big ribbed ogee dome r 2.1. */
  function MainTemple({ p, m, gold, dark }) {
    const CW = 5.5, CH = 2.9, PW = 6.2, PD = 2.3, PH = 2.4;
    const cz = -0.1, pz = CW / 2 + PD / 2 - 0.1;
    const scallops = useMemo(() => Array.from({ length: 11 }, (_, i) => -PW / 2 + 0.25 + i * ((PW - 0.5) / 10)), []);
    return (
      <group position={p}>
        <Box s={[PW + 1.5, 0.14, CW + PD + 1.3]} p={[0, 0.07, 0.5]} m={m} />
        <Box s={[PW + 0.8, 0.14, CW + PD + 0.6]} p={[0, 0.21, 0.5]} m={m} />
        <Box s={[CW, CH, CW]} p={[0, 0.28 + CH / 2, cz]} m={m} />
        <Box s={[CW + 0.2, 0.14, CW + 0.2]} p={[0, 0.28 + CH + 0.07, cz]} m={m} />
        <Box s={[PW, 0.2, PD]} p={[0, 0.28 + PH + 0.1, pz]} m={m} />
        <Box s={[PW + 0.14, 0.12, PD + 0.14]} p={[0, 0.28 + PH + 0.26, pz]} m={m} />
        <Box s={[PW + 0.1, 0.22, 0.1]} p={[0, 0.28 + PH - 0.11, pz + PD / 2 - 0.05]} m={m} />
        {scallops.map((x, i) => <Ball key={i} rad={0.26} p={[x, 0.28 + PH - 0.28, pz + PD / 2]} sc={[1, 1, 0.3]} m={m} />)}
        {[-PW / 2 + 0.25, -PW / 6, PW / 6, PW / 2 - 0.25].map((x, i) => (
          <group key={i}>
            <Box s={[0.34, PH, 0.34]} p={[x, 0.28 + PH / 2, pz + PD / 2 - 0.26]} m={m} />
            <Box s={[0.48, 0.12, 0.48]} p={[x, 0.28 + 0.06, pz + PD / 2 - 0.26]} m={m} />
          </group>
        ))}
        <Box s={[1.8, 1.85, 0.06]} p={[0, 0.28 + 0.93, CW / 2 + cz + 0.02]} m={dark} />
        <Box s={[2.1, 0.18, 0.12]} p={[0, 0.28 + 1.95, CW / 2 + cz + 0.04]} m={m} />
        <Box s={[0.7, 1.25, 0.05]} p={[-1.95, 0.28 + 1.4, CW / 2 + cz + 0.02]} m={dark} />
        <Box s={[0.7, 1.25, 0.05]} p={[1.95, 0.28 + 1.4, CW / 2 + cz + 0.02]} m={dark} />
        <DomeOnDrum r={2.1} p={[0, 0.28 + CH + 0.14, cz]} m={m} gold={gold} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
          <DomeOnDrum key={i} r={0.42} p={[sx * (CW / 2 - 0.42), 0.28 + CH + 0.14, cz + sz * (CW / 2 - 0.42)]} m={m} gold={gold} />
        ))}
        {[-1, 1].map((sx, i) => <DomeOnDrum key={'c' + i} r={0.55} p={[sx * (PW / 2 - 0.55), 0.28 + PH + 0.32, pz + PD / 2 - 0.55]} m={m} gold={gold} />)}
      </group>
    );
  }

  /** Open octagonal pavilion: blue rails round it, tan hip-roof ring, then a shingled octagonal pyramid roof with gold finial. */
  function Pavilion({ p, m, gold }) {
    const M = useM();
    const shingle = M.plain('#a9733f', { roughness: 0.8 });
    const tan = M.plain('#c9a46a', { roughness: 0.9 });
    const post = M.plain('#6a4a30');
    const blue = M.plain(BLUE, { roughness: 0.45, metalness: 0.3 });
    const geo = useMemo(() => {
      const n = 6, H = 1.1, R = 1.5, pts = [];
      for (let i = 0; i < n; i++) {
        const y0 = (i / n) * H, y1 = ((i + 1) / n) * H;
        pts.push([R * (1 - i / n) + 0.08, y0], [R * (1 - (i + 1) / n) + 0.01, y1]);
      }
      pts.push([0.001, H]);
      return new THREE.LatheGeometry(V2(pts), 8);
    }, []);
    const sideL = 2 * 1.15 * Math.sin(Math.PI / 8);
    return (
      <group position={p} rotation={[0, 0.25, 0]}>
        <Box s={[3.0, 0.2, 3.0]} p={[0, 0.1, 0]} m={m} />
        {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU + Math.PI / 8; return <Cyl key={i} rt={0.08} rb={0.09} h={1.1} p={[Math.sin(a) * 1.15, 0.75, Math.cos(a) * 1.15]} m={post} seg={6} />; })}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * TAU;
          return (
            <group key={i} position={[Math.sin(a + Math.PI / 8 + Math.PI / 8) * 1.06, 0, Math.cos(a + Math.PI / 4) * 1.06]} rotation={[0, a + Math.PI / 4, 0]}>
              <Box s={[sideL, 0.06, 0.06]} p={[0, 0.85, 0]} m={blue} cast={false} />
              <Box s={[sideL, 0.05, 0.05]} p={[0, 0.5, 0]} m={blue} cast={false} />
            </group>
          );
        })}
        <Cyl rt={1.7} rb={2.0} h={0.3} p={[0, 1.45, 0]} m={tan} seg={8} />
        <Cyl rt={0.74} rb={0.8} h={0.5} p={[0, 1.85, 0]} m={m} seg={8} />
        <Box s={[0.26, 0.3, 0.05]} p={[0, 1.88, 0.76]} m={M.dark} />
        <Box s={[0.26, 0.3, 0.05]} p={[0.62, 1.88, 0.38]} r={[0, Math.PI / 4, 0]} m={M.dark} />
        <Box s={[0.26, 0.3, 0.05]} p={[-0.62, 1.88, 0.38]} r={[0, -Math.PI / 4, 0]} m={M.dark} />
        <mesh geometry={geo} material={shingle} position={[0, 2.1, 0]} rotation={[0, Math.PI / 8, 0]} castShadow />
        <Cyl rt={0.03} rb={0.09} h={0.3} p={[0, 3.35, 0]} m={gold} seg={8} />
        <Ball rad={0.08} p={[0, 3.55, 0]} m={gold} />
      </group>
    );
  }

  /** White gate: two spired piers, a pointed-arch panel with a dark door recess (3 m body, tall pinnacles). */
  function Gate({ p, m, gold }) {
    const M = useM();
    const geo = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-1.9, 0); s.lineTo(-0.85, 0); s.lineTo(-0.85, 1.25);
      s.absarc(0, 1.25, 0.85, Math.PI, 0, true);
      s.lineTo(0.85, 0); s.lineTo(1.9, 0); s.lineTo(1.9, 2.4); s.lineTo(1.35, 2.4); s.lineTo(1.35, 2.0);
      s.lineTo(0.5, 2.0); s.lineTo(0.5, 2.3); s.lineTo(-0.5, 2.3); s.lineTo(-0.5, 2.0); s.lineTo(-1.35, 2.0);
      s.lineTo(-1.35, 2.4); s.lineTo(-1.9, 2.4); s.closePath();
      return new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: false, curveSegments: 14 });
    }, []);
    const recess = useMemo(() => {
      const s = new THREE.Shape();
      s.moveTo(-0.8, 0); s.lineTo(-0.8, 1.25); s.absarc(0, 1.25, 0.8, Math.PI, 0, true); s.lineTo(0.8, 0); s.closePath();
      return new THREE.ShapeGeometry(s, 12);
    }, []);
    const darkM = M.plain('#3d2b24', { roughness: 0.95 });
    const fin = (x, y, sc = 1) => (
      <group position={[x, y, 0.27]} scale={sc}>
        <Cyl rt={0.18} rb={0.24} h={0.12} p={[0, 0.06, 0]} m={m} seg={8} />
        <Ball rad={0.15} p={[0, 0.24, 0]} m={m} />
        <mesh position={[0, 0.62, 0]} material={m} castShadow><coneGeometry args={[0.11, 0.72, 8]} /></mesh>
        <Ball rad={0.05} p={[0, 1.02, 0]} m={gold} />
      </group>
    );
    return (
      <group position={p} scale={[1.05, 1.2, 1.05]}>
        <mesh geometry={geo} material={m} position={[0, 0, -0.27]} castShadow receiveShadow />
        <mesh geometry={recess} material={darkM} position={[0, 0, 0.1]} />
        <Box s={[1.8, 0.08, 0.6]} p={[0, 0.04, 0]} m={m} />
        <Box s={[0.12, 1.4, 0.62]} p={[-0.93, 0.7, 0]} m={m} />
        <Box s={[0.12, 1.4, 0.62]} p={[0.93, 0.7, 0]} m={m} />
        {fin(-1.62, 2.4)}{fin(1.62, 2.4)}{fin(0, 2.3, 0.75)}
      </group>
    );
  }

  /** The circular sunken Varaha pool: pale lip, tall violet ring wall (1.3 m), dark green water, four-armed boar-headed Varaha on a red lotus. */
  function Pool({ p }) {
    const M = useM();
    const geos = useMemo(() => ({
      lip: new THREE.LatheGeometry(V2([[3.3, 0], [3.3, 0.34], [1.95, 0.34], [1.95, 0.02]]), 56),
      wall: new THREE.LatheGeometry(V2([[2.45, 0.34], [2.45, 1.3], [1.95, 1.3], [1.95, 0.34]]), 56),
    }), []);
    const white = M.plain('#ece8f2', { roughness: 0.6 });
    const violet = M.plain('#8a5fc9', { roughness: 0.55 });
    const water = M.plain('#14452f', { roughness: 0.15, metalness: 0.2 });
    const petals = useMemo(() => { const r = rng(5); return Array.from({ length: 36 }, () => { const a = r() * TAU, d = 0.5 + r() * 1.4; return [Math.cos(a) * d, Math.sin(a) * d, r() > 0.4 ? '#e8742a' : '#d93a4a']; }); }, []);
    const blue = M.plain('#3b63d0'), yel = M.plain('#e8c24a'), red = M.plain('#d0475f'), skin = M.plain('#e9dfc8'), earth = M.plain('#3a7a50');
    const WY = 0.52, SS = 1.67;
    return (
      <group position={p}>
        <mesh geometry={geos.lip} material={white} castShadow receiveShadow />
        <mesh geometry={geos.wall} material={violet} castShadow receiveShadow />
        <Cyl rt={1.95} h={0.06} p={[0, WY, 0]} m={water} seg={48} />
        {petals.map(([x, z, c], i) => <mesh key={i} position={[x, WY + 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.08, 6]} /><meshStandardMaterial color={c} roughness={1} /></mesh>)}
        {/* statue group scaled 1.3x in the world about its lotus base */}
        <group position={[0, WY * (1 - SS), 0]} scale={SS}>
          {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU; return <Ball key={i} rad={0.3} p={[Math.sin(a) * 0.42, WY + 0.2, Math.cos(a) * 0.42]} sc={[0.6, 0.8, 1]} m={red} />; })}
          <Cyl rt={0.4} rb={0.5} h={0.22} p={[0, WY + 0.25, 0]} m={red} seg={14} />
          <Cyl rt={0.2} rb={0.24} h={0.75} p={[0, WY + 0.8, 0]} m={yel} seg={10} />
          <Box s={[0.62, 0.78, 0.34]} p={[0, WY + 1.52, 0]} m={blue} />
          <Box s={[0.66, 0.1, 0.38]} p={[0, WY + 1.18, 0]} m={yel} />
          {[[-1, 0], [1, 0]].map(([sx], i) => (
            <group key={i}>
              <Box s={[0.12, 0.62, 0.12]} p={[sx * 0.42, WY + 1.28, 0.16]} r={[-0.5, 0, sx * 0.15]} m={skin} />
              <Box s={[0.12, 0.7, 0.12]} p={[sx * 0.5, WY + 1.82, 0.04]} r={[0, 0, -sx * 0.5]} m={skin} />
            </group>
          ))}
          {/* large boar head: broad skull, long snout, tusks, ears */}
          <Ball rad={0.29} p={[0, WY + 2.04, 0.04]} sc={[1, 1.05, 1.05]} m={blue} />
          <mesh position={[0, WY + 1.98, 0.42]} rotation={[Math.PI / 2, 0, 0]} material={blue}><coneGeometry args={[0.15, 0.5, 8]} /></mesh>
          <Ball rad={0.06} p={[0, WY + 1.96, 0.68]} m={M.dark} />
          <Ball rad={0.09} p={[-0.27, WY + 2.2, 0.0]} sc={[0.8, 1.2, 0.7]} m={blue} />
          <Ball rad={0.09} p={[0.27, WY + 2.2, 0.0]} sc={[0.8, 1.2, 0.7]} m={blue} />
          <Cyl rt={0.18} rb={0.26} h={0.2} p={[0, WY + 2.38, 0]} m={yel} seg={10} />
          <Box s={[0.06, 0.05, 0.28]} p={[-0.14, WY + 1.88, 0.4]} r={[0, 0.3, 0]} m={skin} />
          <Box s={[0.06, 0.05, 0.28]} p={[0.14, WY + 1.88, 0.4]} r={[0, -0.3, 0]} m={skin} />
          <Ball rad={0.2} p={[0.9, WY + 2.28, 0.04]} m={earth} />
        </group>
      </group>
    );
  }

  /** Yellow-olive 12-sided railing round the pool with light-green globe lamps. */
  function PoolRail({ p, dusk }) {
    const M = useM();
    const R = 4.9, N = 12;
    const olive = M.plain(OLIVE, { roughness: 0.5, metalness: 0.3 });
    const globe = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c6f0a8', emissive: dusk ? '#9be070' : '#000000', emissiveIntensity: dusk ? 1.6 : 0, roughness: 0.3 }), [dusk]);
    const side = 2 * R * Math.tan(Math.PI / N);
    const items = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * TAU + Math.PI / N;
      return { a, x: Math.sin(a) * R, z: Math.cos(a) * R, i };
    });
    return (
      <group position={p}>
        {items.map(({ a, x, z, i }) => (
          <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}>
            <Box s={[side, 0.08, 0.08]} p={[0, 1.1, 0]} m={olive} cast={false} />
            <Box s={[side, 0.06, 0.06]} p={[0, 0.65, 0]} m={olive} cast={false} />
            <Box s={[side, 0.06, 0.06]} p={[0, 0.14, 0]} m={olive} cast={false} />
            {[-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].map((f, k) => <Box key={k} s={[0.05, 1.1, 0.05]} p={[side * f, 0.55, 0]} m={olive} cast={false} />)}
          </group>
        ))}
        {[0, 3, 6, 9].map((k) => {
          const a = (k / N) * TAU + Math.PI / N; const x = Math.sin(a) * (R + 0.08), z = Math.cos(a) * (R + 0.08);
          return (
            <group key={k} position={[x, 0, z]}>
              <Cyl rt={0.045} rb={0.07} h={2.2} p={[0, 1.1, 0]} m={olive} seg={8} />
              <mesh position={[0, 2.35, 0]} material={globe}><sphereGeometry args={[0.24, 14, 10]} /></mesh>
              {dusk && k % 6 === 0 && <pointLight position={[0, 2.35, 0]} intensity={1.4} distance={6} color="#bff0a0" />}
            </group>
          );
        })}
      </group>
    );
  }

  /** Purple-blue tin canopy hung off the tall gate-side wall (high edge on the wall, sloping away from it). */
  function Canopy({ p, m, rot = 0 }) {
    const M = useM();
    const tin = M.plain('#6a58c0', { roughness: 0.45, metalness: 0.35 });
    const post = M.plain('#7a7a82', { metalness: 0.4 });
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[3.6, 2.4, 0.3]} p={[0, 1.2, 0.15]} m={m} />
        <Box s={[3.8, 0.1, 0.4]} p={[0, 2.45, 0.15]} m={m} />
        {[-1.6, 1.6].map((x, i) => <Cyl key={i} rt={0.05} h={1.75} p={[x, 0.88, -2.9]} m={post} seg={8} />)}
        <Box s={[3.6, 0.07, 3.3]} p={[0, 2.0, -1.55]} r={[-0.15, 0, 0]} m={tin} />
        <Box s={[3.6, 0.1, 0.08]} p={[0, 1.78, -3.15]} r={[-0.15, 0, 0]} m={tin} />
      </group>
    );
  }

  /** Low white hospice (dharmashala) with a red-brown tin roof. */
  function RestHouse({ p, rot = 0, w = 4, d = 2.2, m }) {
    const M = useM();
    const tin = M.plain('#8a4a3a', { roughness: 0.6, metalness: 0.2 });
    return (
      <group position={p} rotation={[0, rot, 0]}>
        <Box s={[w, 1.2, d]} p={[0, 0.6, 0]} m={m} />
        <Box s={[w + 0.3, 0.07, d / 2 + 0.2]} p={[0, 1.42, d / 4]} r={[-0.38, 0, 0]} m={tin} />
        <Box s={[w + 0.3, 0.07, d / 2 + 0.2]} p={[0, 1.42, -d / 4]} r={[0.38, 0, 0]} m={tin} />
        {[-1, 0, 1].map((i) => <Box key={i} s={[0.55, 0.8, 0.05]} p={[i * w * 0.28, 0.55, d / 2 + 0.02]} m={M.dark} />)}
      </group>
    );
  }

  /** Small trunk-and-canopy tree of three greens. */
  function SmallTree({ p, s = 0.6, rot = 0 }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, rot, 0]} scale={s}>
        <Cyl rt={0.14} rb={0.24} h={2.8} p={[0, 1.4, 0]} m={M.plain('#5a4030')} seg={8} />
        {[[0, 3.4, 0, 1.6, '#3f6531'], [1.2, 3.0, 0.4, 1.2, '#4f7438'], [-1.2, 3.1, -0.3, 1.3, '#56783a'], [0.2, 4.0, -0.6, 1.1, '#6c8a45']].map(([a, b, c, r, col], k) => <Ball key={k} rad={r} p={[a, b, c]} sc={[1, 0.8, 1]} m={M.plain(col, { roughness: 1 })} />)}
      </group>
    );
  }

  /* ---------------- Main ---------------- */
  function BarahaMain() {
    const M = useM();
    const [dusk, dref] = useDusk();
    const white = useMemo(() => M.plain(WHITE, { roughness: 0.9 }), [M]);
    const gold = M.plain(GOLD, { metalness: 0.7, roughness: 0.3 });
    const dark = useMemo(() => M.plain('#2a1c16', { roughness: 0.9 }), [M]);
    const paveTemple = M.plain('#d9d4c6', { roughness: 0.95 });
    const ledgeTop = M.plain('#cfc9b9', { roughness: 0.95 });
    const blueM = M.plain(BLUE, { roughness: 0.45, metalness: 0.3 });
    const rubble = M.mat('rock', 6, 1.2, { color: '#f2ecdc' });
    const rubbleB = M.mat('rock', 5, 1.0, { color: '#f6f1e3' });
    const rubbleC = M.mat('rock', 4, 1.0, { color: '#faf6ea' });
    const stepM = M.plain('#cfc9bb', { roughness: 0.95 });
    const tileMat = useMemo(() => {
      let map = null;
      try {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d');
        const cols = ['#c8727b', '#d27f85', '#be6a72', '#d58a8b', '#c67078', '#cf7c82'];
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = cols[(i * 3 + j * 5 + (i ^ j)) % cols.length]; g.fillRect(i * 32, j * 32, 32, 32); }
        g.strokeStyle = '#9d5a62'; g.lineWidth = 2.5;
        for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 32, 0); g.lineTo(k * 32, 128); g.stroke(); g.beginPath(); g.moveTo(0, k * 32); g.lineTo(128, k * 32); g.stroke(); }
        map = new THREE.CanvasTexture(c);
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(7, 4);
        if (THREE.SRGBColorSpace) map.colorSpace = THREE.SRGBColorSpace;
      } catch (e) { map = null; }
      return new THREE.MeshStandardMaterial({ color: map ? '#ffffff' : '#c4727a', map: map || undefined, roughness: 0.85 });
    }, []);
    const rocks = useMemo(() => {
      const r = rng(11); const out = [];
      for (let i = 0; i < 34; i++) {
        const t = r();
        let x, z, y;
        if (i % 2 === 0) { x = PX0 - 3.7 + r() * 0.5 - 0.2; z = PZ0 - 3.7 + t * 18; y = -2.0; if (z > PZ1 + 1) continue; }
        else { z = PZ0 - 3.7 + r() * 0.5; x = PX0 - 3.5 + t * 17; y = -2.0; if (x > PX1 + 2) continue; }
        out.push({ x, z, s: 0.3 + r() * 0.4, y: y + r() * 0.2 });
      }
      return out;
    }, []);
    const ladderRuns = [0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.5, 0.5, 0.5, 0.5, 0.5];
    const CX = (PX0 + PX1) / 2;
    return (
      <group ref={dref}>
        <Frame s={[15, 7.5, 16]} p={[0.5, 3.4, 0]} />
        {dusk && <hemisphereLight args={['#e4e8fa', '#9a9a78', 1.15]} />}
        {/* ---- the cramped stepped bluff: plaza (0) -> sub-terrace 1 -> sub-terrace 2 -> sand bar, with rubble walls ---- */}
        <Bluff x0={PX0 - 0.15} x1={PX1 + 0.15} z0={PZ0 - 0.15} z1={PZ1 + 0.1} yTop={-0.3} yBot={-3.7} m={rubble} b={0.05} />
        <Box s={[PX1 - PX0 + 0.3, 0.3, PZ1 - PZ0 + 0.3]} p={[CX, -0.15, 0]} m={paveTemple} cast={false} />
        {/* sub-terrace 1 (back and left) */}
        <Bluff x0={PX0 - 1.95} x1={PX1 + 1.5} z0={PZ0 - 1.95} z1={PZ1 + 1.0} yTop={L1T - 0.1} yBot={-3.7} m={rubbleB} b={0.07} />
        <Box s={[PX1 - PX0 + 3.45 + 1.5, 0.12, PZ1 - PZ0 + 2.95]} p={[(PX0 - 1.95 + PX1 + 1.5) / 2, L1T - 0.04, (PZ0 - 1.95 + PZ1 + 1.0) / 2]} m={ledgeTop} cast={false} />
        {/* sub-terrace 2 */}
        <Bluff x0={PX0 - 3.6} x1={PX1 + 2.6} z0={PZ0 - 3.6} z1={PZ1 + 1.0} yTop={L2T - 0.1} yBot={-3.7} m={rubbleC} b={0.1} />
        <Box s={[PX1 - PX0 + 3.6 + 2.6 + 0.0, 0.12, PZ1 - PZ0 + 4.6]} p={[(PX0 - 3.6 + PX1 + 2.6) / 2, L2T - 0.04, (PZ0 - 3.6 + PZ1 + 1.0) / 2]} m={ledgeTop} cast={false} />
        {/* boulders at the foot of the walls */}
        {rocks.map((o, i) => <Ball key={i} rad={o.s} p={[o.x, o.y, o.z]} sc={[1.3, 0.8, 1]} m={rubbleC} />)}
        {/* terracotta tiled plaza in front (pool side) */}
        <Box s={[PX1 - PX0 - 0.2, 0.04, 8.2]} p={[CX, 0.02, 3.9]} m={tileMat} cast={false} />
        {/* the temple huddle, shrines clustered tight against the main temple */}
        <MainTemple p={[3.4, 0, -4.6]} m={white} gold={gold} dark={dark} />
        <Shrine p={[-2.2, 0, -2.9]} w={3.0} h={2.2} m={white} gold={gold} dark={dark} rot={0.1} />
        <Shrine p={[-2.4, 0, -6.5]} w={2.5} h={1.9} m={white} gold={gold} dark={dark} />
        <Shrine p={[-5.0, 0, -4.9]} w={2.1} h={1.6} m={white} gold={gold} dark={dark} rot={0.2} />
        <Pavilion p={[5.3, 0, 2.4]} m={white} gold={gold} />
        {/* pool, scaled to the cramped plaza */}
        <group position={[0.6, 0, 4.1]} scale={0.78}>
          <Pool p={[0, 0, 0]} />
          <PoolRail p={[0, 0, 0]} dusk={dusk} />
        </group>
        {/* blue seating along the plaza's right edge */}
        {[0, 1, 2].map((i) => (
          <group key={i} position={[7.0, 0, 4.4 + i * 1.5]}>
            <Box s={[0.5, 0.06, 1.2]} p={[0, 0.42, 0]} m={blueM} cast={false} />
            <Box s={[0.08, 0.4, 1.2]} p={[0.2, 0.7, 0]} m={blueM} cast={false} />
            <Box s={[0.5, 0.4, 0.06]} p={[0, 0.2, 0.55]} m={blueM} cast={false} />
            <Box s={[0.5, 0.4, 0.06]} p={[0, 0.2, -0.55]} m={blueM} cast={false} />
          </group>
        ))}
        {/* gate (front right), low boundary wall, and tall wall carrying the canopy (front left) */}
        <Gate p={[-3.1, 0, 8.0]} m={white} gold={gold} />
        <Box s={[8.6, 0.85, 0.4]} p={[3.2, 0.425, 8.0]} m={white} />
        <Box s={[8.6, 0.1, 0.5]} p={[3.2, 0.9, 8.0]} m={white} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <Ball key={i} rad={0.13} p={[-0.6 + i * 1.2, 1.05, 8.0]} m={white} />)}
        <Box s={[1.4, 0.85, 0.4]} p={[-5.8, 0.425, 8.0]} m={white} />
        <Canopy p={[-6.5, 0, 4.7]} m={white} rot={-Math.PI / 2} />
        {/* rest house on the left edge */}
        <RestHouse p={[-5.3, 0, 0.3]} rot={Math.PI / 2} w={4.0} d={2.0} m={white} />
        {/* right side wall */}
        <Box s={[0.3, 0.55, 16.3]} p={[7.65, 0.27, 0]} m={white} />
        {/* blue rail on the river-facing back and left edges, with a gap for the stair */}
        <Rail a={[PX0 - 0.1, 0, PZ0 - 0.1]} b={[-5.1, 0, PZ0 - 0.1]} m={blueM} />
        <Rail a={[-2.9, 0, PZ0 - 0.1]} b={[PX1 + 0.1, 0, PZ0 - 0.1]} m={blueM} />
        <Rail a={[PX0 - 0.1, 0, PZ0 - 0.1]} b={[PX0 - 0.1, 0, PZ1 - 0.2]} m={blueM} />
        {/* long stair from the plaza down both sub-terraces to the sand bar */}
        <Flight p={[-4.0, 0, PZ0 - 0.1]} w={1.9} dr={0.285} runs={ladderRuns} base={-3.5} m={stepM} blue={blueM} />
        <Box s={[3.4, 0.16, 1.2]} p={[-4.0, -3.2, PZ0 - 6.7]} m={stepM} />
        {/* prayer flags strung from the porch roof to a pole */}
        <Cyl rt={0.04} h={3.2} p={[-3.8, 1.6, 0.9]} m={M.plain('#6a4a30')} seg={6} />
        <PrayerFlags from={[0.5, 2.9, 0.1]} to={[-3.8, 3.1, 0.9]} n={14} />
        {/* diyos on the porch step */}
        {[-0.8, 0, 0.8].map((x, i) => <Diyo key={i} p={[3.4 + x, 0.3, 0.85]} light={dusk && i === 1} />)}
        {/* small trees behind the temples (sheltering, as in the photographs) */}
        <SmallTree p={[-5.2, L1T, -9.1]} s={0.6} rot={0.4} />
        <SmallTree p={[6.8, L1T, -9.3]} s={0.65} rot={1.2} />
        <SmallTree p={[-7.6, L1T, 2.5]} s={0.5} rot={2.0} />
      </group>
    );
  }

  /* ---------------- Env ---------------- */
  function BarahaEnv() {
    const M = useM();
    const wmat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6f9a86', roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.96 }), []);
    const { boulders, cliffs } = useMemo(() => {
      const r = rng(33); const b = [], cl = [];
      for (let i = 0; i < 400 && b.length < 40; i++) {
        const x = -40 + r() * 80, z = -40 + r() * 70;
        const d = rd(x, z);
        const y = heightAt(x, z);
        if (d < 5.6 || d > sandEndAt(x, z) || y < WATER_Y - 0.1) continue;
        b.push([x, y, z, 0.25 + r() * 0.5, '#' + (r() > 0.5 ? 'cfc9b8' : 'b4ad9a')]);
      }
      for (let i = 0; i < 0 && cl.length < 12; i++) {
        const x = -45 + r() * 90, z = -50 + r() * 60;
        const d = rd(x, z);
        if (d < FAR + 3 || d > FAR + 14) continue;
        cl.push([x, heightAt(x, z), z, 2 + r() * 2.5]);
      }
      return { boulders: b, cliffs: cl };
    }, []);
    return (
      <group>
        <Terrain />
        <Forest />
        <mesh position={[0, WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={wmat}><planeGeometry args={[230, 230]} /></mesh>
        {boulders.map(([x, y, z, s, c], i) => <Ball key={i} rad={s} p={[x, y + s * 0.3, z]} sc={[1.3, 0.7, 1]} m={M.plain(c, { roughness: 1 })} />)}
              </group>
    );
  }

  return { barahachhetra: { Main: BarahaMain, Env: BarahaEnv } };
}
