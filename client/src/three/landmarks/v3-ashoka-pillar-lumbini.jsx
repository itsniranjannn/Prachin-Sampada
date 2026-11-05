// Ashoka Pillar, Lumbini (Sacred Garden). 1 unit = 1 m. A single plain, capital-less round sandstone monolith ~9.4 m
// high (shaft ~1.0-1.1 m across) inside a low gilt-spiked railing wrapped in yellow cloth; the big plain white Maya Devi
// Temple block stands behind (-z), the Puskarini pond lies ~15 m south (+z), brick monastery ruins to the east (+x),
// dense sal/peepal grove on a low flat Terai horizon under a blue sky.
export default function make(K) {
  const { useM, Box, Cyl, Ball, THREE, useMemo, Frame } = K;

  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
  const STONE = '#a8906f';
  const DARK = '#4a2c1a';
  const H = 9.4;
  const R0 = 0.55;
  const R1 = 0.5;
  const WALL_Z = -5; // front face of the white temple
  const WALL_H = 4.4;
  const TX0 = -15; const TX1 = 13; const TD = 22; // temple: 28 m wide, 22 m deep

  /* instanced unit boxes: items = [{p:[x,y,z], s:[w,h,d]}] */
  function Inst({ items, m }) {
    const mesh = useMemo(() => {
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m, items.length);
      const o = new THREE.Object3D();
      items.forEach((it, i) => { o.position.set(it.p[0], it.p[1], it.p[2]); o.scale.set(it.s[0], it.s[1], it.s[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.castShadow = false;
      return im;
    }, [items, m]);
    return <primitive object={mesh} />;
  }

  /* patch of script on the shaft: broken dark dashes in rows, facing +z */
  function Script({ y0, rows, rowH, gap, arc, big, seed }) {
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.85, side: THREE.DoubleSide, transparent: true, opacity: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }), []);
    const bands = useMemo(() => {
      const r = rng(seed);
      const out = [];
      for (let row = 0; row < rows; row += 1) {
        let a = -arc / 2 + r() * 0.05;
        while (a < arc / 2 - 0.08) {
          const len = (big ? 0.035 : 0.022) + r() * (big ? 0.05 : 0.03);
          const hh = rowH * (0.3 + r() * 0.4);
          if (r() > 0.4) out.push({ a, len: Math.min(len, arc / 2 - a), y: y0 - row * gap + (r() - 0.5) * rowH * 0.5, hh });
          a += len + (big ? 0.07 : 0.05) + r() * 0.12;
        }
      }
      return out;
    }, [rows, rowH, gap, arc, big, seed, y0]);
    const rAt = (y) => R0 + (R1 - R0) * (y / H) + 0.004;
    return (
      <group>
        {bands.map((b, i) => (
          <mesh key={i} position={[0, b.y, 0]} material={mat}>
            <cylinderGeometry args={[rAt(b.y), rAt(b.y), b.hh, 6, 1, true, b.a + Math.PI / 2 - arc / 2 + arc / 2 - Math.PI / 2, b.len]} />
          </mesh>
        ))}
      </group>
    );
  }

  function Railing() {
    const M = useM();
    const gilt = M.plain('#e3b829', { roughness: 0.4, metalness: 0.5 });
    const rail = M.plain('#d6a720', { roughness: 0.45, metalness: 0.5 });
    const S = 3.6; const h = S / 2; const RH = 1.1;
    const clothM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f2ab1c', roughness: 0.85, side: THREE.DoubleSide }), []);
    const posts = useMemo(() => {
      const out = []; const n = 14;
      for (let i = 0; i <= n; i += 1) {
        const t = -h + (S * i) / n;
        out.push([t, h], [t, -h]);
        if (i > 0 && i < n) out.push([h, t], [-h, t]);
      }
      return out;
    }, []);
    // continuous cloth band hugging the fence, wavy top
    const clothGeo = useMemo(() => {
      const c = h + 0.06; const pts = [];
      const N = 18;
      for (let i = 0; i < N; i += 1) pts.push([-c + (2 * c * i) / N, c]);
      for (let i = 0; i < N; i += 1) pts.push([c, c - (2 * c * i) / N]);
      for (let i = 0; i < N; i += 1) pts.push([c - (2 * c * i) / N, -c]);
      for (let i = 0; i < N; i += 1) pts.push([-c, -c + (2 * c * i) / N]);
      const pos = []; const idx = [];
      pts.forEach(([x, z], i) => {
        const top = 0.6 + 0.05 * Math.sin(i * 1.3) + 0.03 * Math.sin(i * 0.5 + 1);
        pos.push(x, 0.1, z, x, 0.1 + top, z);
      });
      const n = pts.length;
      for (let i = 0; i < n; i += 1) {
        const a = i * 2; const b = ((i + 1) % n) * 2;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }, []);
    return (
      <group>
        {/* low earth/brick bed inside the fence */}
        <Box s={[S + 0.5, 0.14, S + 0.5]} p={[0, 0.07, 0]} m={M.mat('brick', 3, 3, { color: '#e8b79c' })} />
        <Box s={[S - 0.4, 0.2, S - 0.4]} p={[0, 0.1, 0]} m={M.plain('#8a6a4a', { roughness: 1 })} />
        {posts.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.022} rb={0.022} h={RH} p={[0, RH / 2 + 0.1, 0]} m={gilt} seg={5} />
            <mesh position={[0, RH + 0.18, 0]} material={gilt}><coneGeometry args={[0.04, 0.2, 5]} /></mesh>
          </group>
        ))}
        {[[0, h, S, 0.05], [0, -h, S, 0.05], [h, 0, 0.05, S], [-h, 0, 0.05, S]].map(([x, z, w, d], i) => (
          <Box key={i} s={[w, 0.05, d]} p={[x, RH + 0.05, z]} m={rail} cast={false} />
        ))}
        <mesh geometry={clothGeo} material={clothM} />
      </group>
    );
  }

  function AshokaMain() {
    const M = useM();
    const geo = useMemo(() => {
      const g = new THREE.CylinderGeometry(R1, R0, H, 28, 12);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i += 1) {
        const x = p.getX(i); const z = p.getZ(i); const y = p.getY(i);
        const a = Math.atan2(z, x);
        const k = 1 + 0.006 * Math.sin(a * 3 + y * 2);
        p.setXYZ(i, x * k, y, z * k);
      }
      g.computeVertexNormals();
      return g;
    }, []);
    const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.65, metalness: 0.02 }), []);
    const patinaM = useMemo(() => [0.22, 0.3].map((o) => new THREE.MeshStandardMaterial({ color: '#7c4f32', roughness: 0.8, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })), []);
    const rAt = (y) => R0 + (R1 - R0) * (y / H);
    return (
      <group>
        <group position={[0, H / 2, 0]}><mesh geometry={geo} material={stone} castShadow receiveShadow /></group>
        {/* flat cut top, slightly paler section where it was sawn */}
        <mesh position={[0, H + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.plain('#bfa07e', { roughness: 0.85 })}><circleGeometry args={[R1, 28]} /></mesh>
        <mesh position={[0, H - 0.16, 0]} material={M.plain('#b99b79', { roughness: 0.7 })}><cylinderGeometry args={[R1 + 0.004, R1 + 0.008, 0.32, 28]} /></mesh>
        {/* two narrow, patchy rust areas (near y 2 and y 6) and thin vertical streaks below the lower inscription */}
        {[[2.0, 0.55, -0.7, 1.1], [1.9, 0.3, 0.1, 0.7], [6.0, 0.6, -0.6, 1.0], [5.95, 0.3, 0.2, 0.6]].map(([y, hh, a0, al], i) => (
          <mesh key={'pt' + i} position={[0, y, 0]} material={patinaM[i % 2]}><cylinderGeometry args={[rAt(y) + 0.002 + i * 0.0006, rAt(y) + 0.002 + i * 0.0006, hh, 20, 1, true, a0, al]} /></mesh>
        ))}
        {[[-0.55, 1.5], [-0.15, 1.1], [0.3, 1.7], [0.62, 0.9], [-0.85, 0.8]].map(([a0, l], i) => (
          <mesh key={'st' + i} position={[0, 1.6 - l / 2, 0]} material={patinaM[0]}><cylinderGeometry args={[rAt(1) + 0.003, rAt(1) + 0.003, l, 4, 1, true, a0 - 0.14, 0.28]} /></mesh>
        ))}
        {/* Ashoka's five lines of Brahmi (eye level) */}
        <Script y0={2.7} rows={5} rowH={0.1} gap={0.22} arc={1.5} seed={7} />
        {/* Ripu Malla's later, larger lettering */}
        <Script y0={6.4} rows={2} rowH={0.16} gap={0.4} arc={1.5} big seed={23} />
        {/* small metal bracket bolted on the shaft */}
        <Box s={[0.05, 0.22, 0.1]} p={[-R1 - 0.02, 7.6, 0.05]} m={M.plain('#3b3b3b', { metalness: 0.6, roughness: 0.5 })} />
        <Railing />
        <Frame s={[6.5, H + 0.6, 5.5]} p={[0, (H + 0.6) / 2, 0.4]} />
      </group>
    );
  }

  /* ---------------- environment ---------------- */
  function Temple() {
    const M = useM();
    const white = M.plain('#efe9df', { roughness: 0.9 });
    const white2 = M.plain('#f1ece2', { roughness: 0.95 });
    const maroon = M.plain('#6b2a2c', { roughness: 0.8 });
    const course = M.plain('#d8d3c8', { roughness: 1 });
    const roofM = M.plain('#9b968c', { roughness: 1 });
    const steel = M.plain('#9aa0a6', { metalness: 0.7, roughness: 0.4 });
    const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5f7a8d', roughness: 0.25, metalness: 0.25 }), []);
    const lampM = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fff2c0', emissive: '#ffd27a', emissiveIntensity: 0.9, roughness: 0.5 }), []);
    const darkM = M.plain('#2c2c2e', { roughness: 0.6, metalness: 0.4 });
    const len = TX1 - TX0; const cx = (TX0 + TX1) / 2;
    const PH = WALL_H + 0.85;
    const frontP = [TX0, -8, -1, 6, TX1]; // pylon / buttress x
    const sideP = [0, -7.3, -14.7, -TD]; // pylon / buttress z
    const frontWins = useMemo(() => {
      const o = [];
      for (let b = 0; b < frontP.length - 1; b += 1) {
        const c = (frontP[b] + frontP[b + 1]) / 2;
        [-1, 1].forEach((sd) => { for (let k = 0; k < 3; k += 1) [2.1, 3.0].forEach((y) => o.push({ p: [c + sd * 1.45 + (k - 1) * 0.5, y, 0.03], s: [0.4, 0.62, 0.07] })); });
      }
      return o;
    }, []);
    const sideWins = useMemo(() => {
      const o = [];
      [TX1, TX0].forEach((X) => {
        const dx = X === TX1 ? 0.03 : -0.03;
        for (let b = 0; b < sideP.length - 1; b += 1) {
          const c = (sideP[b] + sideP[b + 1]) / 2;
          for (let k = 0; k < 4; k += 1) [2.1, 3.0].forEach((y) => o.push({ p: [X + dx, y, c + (k - 1.5) * 0.5], s: [0.07, 0.62, 0.4] }));
        }
      });
      return o;
    }, []);
    const bars = useMemo(() => {
      const o = [];
      for (let x = TX0 + 0.5; x < TX1; x += 0.5) o.push({ p: [x, WALL_H + 0.35 + 0.3, -0.18], s: [0.025, 0.6, 0.025] });
      [TX0 + 0.18, TX1 - 0.18].forEach((X) => { for (let z = -0.5; z > -TD; z -= 0.5) o.push({ p: [X, WALL_H + 0.35 + 0.3, z], s: [0.025, 0.6, 0.025] }); });
      return o;
    }, []);
    const lamps = [[-11.5, 3.6], [-4.5, 3.6], [2.5, 3.6], [9.5, 3.6]];
    return (
      <group position={[0, 0, WALL_Z]}>
        {/* main block */}
        <Box s={[len, WALL_H, TD]} p={[cx, WALL_H / 2, -TD / 2]} m={white} />
        <Box s={[len + 0.3, 0.12, TD + 0.3]} p={[cx, 0.06, -TD / 2]} m={white2} />
        {Array.from({ length: 8 }, (_, i) => <Box key={'co' + i} s={[len, 0.03, 0.02]} p={[cx, 0.5 + i * 0.5, 0.012]} m={course} cast={false} />)}
        {/* parapet ring returning along the sides and back, and roof slab */}
        <Box s={[len + 0.2, 0.35, 0.3]} p={[cx, WALL_H + 0.175, -0.15]} m={white2} />
        <Box s={[len + 0.2, 0.35, 0.3]} p={[cx, WALL_H + 0.175, -TD + 0.15]} m={white2} />
        <Box s={[0.3, 0.35, TD - 0.4]} p={[TX0 + 0.05, WALL_H + 0.175, -TD / 2]} m={white2} />
        <Box s={[0.3, 0.35, TD - 0.4]} p={[TX1 - 0.05, WALL_H + 0.175, -TD / 2]} m={white2} />
        <Box s={[len - 0.5, 0.1, TD - 0.5]} p={[cx, WALL_H + 0.05, -TD / 2]} m={roofM} cast={false} />
        {/* steel safety railing on the front and both sides */}
        <Box s={[len, 0.05, 0.05]} p={[cx, WALL_H + 0.35 + 0.6, -0.18]} m={steel} cast={false} />
        <Box s={[len, 0.04, 0.04]} p={[cx, WALL_H + 0.35 + 0.28, -0.18]} m={steel} cast={false} />
        {[TX0 + 0.18, TX1 - 0.18].map((X) => (
          <group key={X}>
            <Box s={[0.05, 0.05, TD - 0.4]} p={[X, WALL_H + 0.35 + 0.6, -TD / 2]} m={steel} cast={false} />
            <Box s={[0.04, 0.04, TD - 0.4]} p={[X, WALL_H + 0.35 + 0.28, -TD / 2]} m={steel} cast={false} />
          </group>
        ))}
        <Inst items={bars} m={steel} />
        {/* windows (two rows of small horizontal panes) wrapped around front and both sides */}
        <Inst items={frontWins} m={glass} />
        <Inst items={sideWins} m={glass} />
        {/* corner pylons + small buttress pylons with maroon caps */}
        {frontP.map((x, i) => {
          const corner = i === 0 || i === frontP.length - 1;
          return (
            <group key={'fp' + x} position={[x, 0, 0]}>
              <Box s={[corner ? 1.0 : 0.8, PH, corner ? 1.0 : 0.8]} p={[0, PH / 2, corner ? 0.05 : 0.2]} m={white2} />
              <Box s={[corner ? 1.1 : 0.9, 0.22, corner ? 1.1 : 0.9]} p={[0, PH + 0.1, corner ? 0.05 : 0.2]} m={maroon} />
            </group>
          );
        })}
        {sideP.slice(1).map((z, i) => [TX0, TX1].map((X) => {
          const corner = i === sideP.length - 2;
          const px = X + (X === TX1 ? (corner ? -0.05 : 0.2) : (corner ? 0.05 : -0.2));
          return (
            <group key={'sp' + z + X} position={[px, 0, z]}>
              <Box s={[corner ? 1.0 : 0.8, PH, corner ? 1.0 : 0.8]} p={[0, PH / 2, 0]} m={white2} />
              <Box s={[corner ? 1.1 : 0.9, 0.22, corner ? 1.1 : 0.9]} p={[0, PH + 0.1, 0]} m={maroon} />
            </group>
          );
        }))}
        {/* wall-mounted lamps under the parapet */}
        {lamps.map(([x, y], i) => (
          <group key={'lp' + i} position={[x, y, 0.1]}>
            <Box s={[0.08, 0.08, 0.14]} p={[0, 0.2, 0]} m={darkM} cast={false} />
            <Box s={[0.22, 0.26, 0.2]} p={[0, 0, 0.1]} m={lampM} cast={false} />
          </group>
        ))}
        {[-4, -11].map((z) => (
          <group key={'ls' + z} position={[TX1 + 0.1, 3.6, z]}>
            <Box s={[0.14, 0.08, 0.08]} p={[0, 0.2, 0]} m={darkM} cast={false} />
            <Box s={[0.2, 0.26, 0.22]} p={[0.1, 0, 0]} m={lampM} cast={false} />
          </group>
        ))}
        {/* CCTV camera on the top of the left corner pylon (as in the photograph) */}
        <group position={[TX0, PH + 0.2, 0.05]}>
          <Cyl rt={0.03} rb={0.03} h={0.9} p={[0, 0.45, 0]} m={steel} seg={5} />
          <Box s={[0.2, 0.16, 0.34]} p={[0.05, 0.98, 0.12]} m={M.plain('#e8e8e8', { roughness: 0.5 })} cast={false} />
          <Box s={[0.12, 0.1, 0.05]} p={[0.05, 0.98, 0.31]} m={darkM} cast={false} />
        </group>
      </group>
    );
  }

  function Pond() {
    const M = useM();
    const brick = M.mat('brick', 2, 1, { color: '#f2c4aa' });
    const water = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5e7f78', roughness: 0.15, metalness: 0.2 }), []);
    const W = 14; const D = 8;
    return (
      <group position={[8, 0, 14]}>
        <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={water}><planeGeometry args={[W, D]} /></mesh>
        {[0, 1, 2].map((i) => {
          const o = i * 0.5; const hh = 0.1 + i * 0.1;
          const w = W + 2.2 - o * 2; const d = D + 2.2 - o * 2; const t = 0.5;
          return (
            <group key={i}>
              <Box s={[w, hh, t]} p={[0, hh / 2, d / 2 - t / 2]} m={brick} />
              <Box s={[w, hh, t]} p={[0, hh / 2, -d / 2 + t / 2]} m={brick} />
              <Box s={[t, hh, d - 2 * t]} p={[w / 2 - t / 2, hh / 2, 0]} m={brick} />
              <Box s={[t, hh, d - 2 * t]} p={[-w / 2 + t / 2, hh / 2, 0]} m={brick} />
            </group>
          );
        })}
      </group>
    );
  }

  function Ruins() {
    const M = useM();
    const brick = M.plain('#c4805c', { roughness: 0.95 });
    const walls = useMemo(() => {
      const o = [];
      const x0 = 16; const z0 = -4; const cw = 3.6; const cols = 5;
      for (let r = 0; r < 2; r += 1) {
        const zr = z0 + r * 9;
        for (let c = 0; c < cols; c += 1) o.push([x0 + c * cw, zr + 1.8, 0.35, 3.6]);
        o.push([x0 + (cols * cw) / 2 - cw / 2, zr, cols * cw, 0.35]);
        o.push([x0 + (cols * cw) / 2 - cw / 2, zr + 3.6, cols * cw, 0.35]);
        o.push([x0 + cols * cw - cw / 2, zr + 1.8, 0.35, 3.6]);
      }
      o.push([x0 + (cols * cw) / 2 - cw / 2, z0 + 9 + 3.6, cols * cw, 0.35]);
      return o;
    }, []);
    return (
      <group>
        {walls.map(([x, z, w, d], i) => <Box key={i} s={[w, 0.6 + (i % 3) * 0.1, d]} p={[x, 0.33, z]} m={brick} />)}
        <Box s={[22, 0.06, 24]} p={[25, 0.03, 6]} m={M.plain('#b59a7a', { roughness: 1 })} />
      </group>
    );
  }

  function Flags() {
    const cols = ['#1f5fbf', '#f4c21f', '#f4f4ef', '#1f5fbf', '#f4c21f'];
    const strings = [[[-7, 2.8, 6], [-2, 3.1, 11]], [[-2, 3.1, 11], [4, 2.7, 7]], [[6, 2.4, -2], [11, 2.9, 3]]];
    const mats = useMemo(() => cols.map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 1 })), []);
    return (
      <group>
        {[[-7, 6], [-2, 11], [4, 7], [6, -2], [11, 3]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.6, z]}><cylinderGeometry args={[0.04, 0.05, 3.3, 5]} /><meshStandardMaterial color="#6a4a2a" /></mesh>
        ))}
        {strings.map(([a, b], s) => {
          const n = 12;
          return Array.from({ length: n }, (_, i) => {
            const t = (i + 0.5) / n;
            const x = a[0] + (b[0] - a[0]) * t; const z = a[2] + (b[2] - a[2]) * t;
            const y = a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.35;
            const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
            return (
              <mesh key={s * 100 + i} position={[x, y - 0.14, z]} rotation={[0, ang + Math.PI / 2, 0]} material={mats[i % 5]}>
                <planeGeometry args={[0.22, 0.28]} />
              </mesh>
            );
          });
        })}
      </group>
    );
  }

  /* dense belt of sal (tall, narrow-crowned) and peepal/bodhi (broad, round) trees */
  function Grove() {
    const M = useM();
    const leaves = ['#3f6a34', '#4a7a3a', '#37602f', '#55823f', '#2f5a2c'].map((c) => M.plain(c, { roughness: 1 }));
    const trunk = M.plain('#5a4030', { roughness: 1 });
    const trees = useMemo(() => {
      const r = rng(11); const out = [];
      // dense belt 25-45 m behind and beside the temple (-z side, and left/right flanks), leaving the camera side open
      for (let i = 0; i < 20; i += 1) {
        const a = Math.PI * (1.0 + (i + r() * 0.7) / 20 * 1.0) + 0.0; // sweeps from +x flank through -z to -x flank
        const d = 34 + r() * 16;
        const x = Math.cos(a) * d + (r() - 0.5) * 6; const z = Math.sin(a) * d * 1.0 - 12;
        out.push({ x, z, s: 2.3 + r() * 1.6, c: i % 5, sal: i % 3 !== 0 });
      }
      // a thinner, further ring for depth
      for (let i = 0; i < 14; i += 1) {
        const a = r() * Math.PI * 2; const d = 64 + r() * 16;
        const x = Math.cos(a) * d; const z = Math.sin(a) * d;
        if (z > 14 && x > -6 && x < 40 && z < 40) continue;
        out.push({ x, z, s: 3.0 + r() * 1.0, c: i % 5, sal: i % 2 === 0 });
      }
      return out;
    }, []);
    return (
      <group>
        {trees.map((t, i) => (
          <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
            <Cyl rt={0.07} rb={0.13} h={t.sal ? 1.9 : 1.2} p={[0, t.sal ? 0.95 : 0.6, 0]} m={trunk} seg={6} />
            {t.sal ? (
              <>
                <mesh position={[0, 2.5, 0]} scale={[0.85, 1.25, 0.85]} material={leaves[t.c]}><sphereGeometry args={[0.8, 9, 7]} /></mesh>
                <mesh position={[0.35, 1.9, 0.15]} material={leaves[(t.c + 1) % 5]}><sphereGeometry args={[0.55, 8, 6]} /></mesh>
                <mesh position={[-0.3, 3.2, -0.1]} material={leaves[(t.c + 2) % 5]}><sphereGeometry args={[0.5, 8, 6]} /></mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 1.7, 0]} scale={[1.25, 0.85, 1.25]} material={leaves[t.c]}><sphereGeometry args={[0.95, 9, 7]} /></mesh>
                <mesh position={[0.8, 1.45, 0.2]} material={leaves[(t.c + 1) % 5]}><sphereGeometry args={[0.65, 8, 6]} /></mesh>
                <mesh position={[-0.75, 1.5, -0.2]} material={leaves[(t.c + 3) % 5]}><sphereGeometry args={[0.7, 8, 6]} /></mesh>
              </>
            )}
          </group>
        ))}
        {/* the old bodhi tree beside the pond, on a low brick platform */}
        <group position={[-5, 0, 17]}>
          <Box s={[3.6, 0.5, 3.6]} p={[0, 0.25, 0]} m={M.mat('brick', 2, 2, { color: '#f2c4aa' })} />
          <group position={[0, 0.5, 0]} scale={3}>
            <Cyl rt={0.1} rb={0.18} h={1.2} p={[0, 0.6, 0]} m={trunk} seg={7} />
            <Ball rad={0.9} p={[0, 1.7, 0]} m={leaves[1]} />
            <Ball rad={0.65} p={[0.6, 1.4, 0.2]} m={leaves[0]} />
            <Ball rad={0.65} p={[-0.55, 1.45, -0.1]} m={leaves[3]} />
          </group>
        </group>
      </group>
    );
  }

  /* blue sky dome with a hazy horizon, and a few clouds */
  function Sky() {
    const geo = useMemo(() => new THREE.SphereGeometry(98, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), []);
    const skyMat = useMemo(() => {
      const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128;
      const g = cv.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, '#2f78d8'); gr.addColorStop(0.6, '#6fa8e6'); gr.addColorStop(1, '#cfe2f0');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.14, side: THREE.BackSide, roughness: 1, fog: false });
    }, []);
    const cloud = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f6f8', roughness: 1 }), []);
    const clouds = [[-40, 38, -80, 14], [30, 46, -78, 18], [75, 40, -30, 15], [-78, 44, 10, 16], [10, 55, -60, 12], [70, 50, 30, 14]];
    return (
      <group>
        <mesh geometry={geo} position={[0, -0.05, 0]} material={skyMat} />
        {clouds.map(([x, y, z, s], i) => (
          <group key={i} position={[x, y, z]} scale={[s, s * 0.32, s * 0.5]}>
            <mesh material={cloud}><sphereGeometry args={[1, 8, 6]} /></mesh>
            <mesh position={[0.8, -0.1, 0.1]} scale={0.75} material={cloud}><sphereGeometry args={[1, 8, 6]} /></mesh>
            <mesh position={[-0.8, -0.15, 0]} scale={0.65} material={cloud}><sphereGeometry args={[1, 8, 6]} /></mesh>
          </group>
        ))}
      </group>
    );
  }

  function AshokaEnv() {
    const M = useM();
    const grass = M.plain('#6f9446', { roughness: 1 });
    const border = M.plain('#86a653', { roughness: 1 });
    const path = M.mat('brick', 18, 2, { color: '#e9bfa6' });
    const pathB = M.mat('brick', 2, 18, { color: '#e9bfa6' });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={grass}><circleGeometry args={[100, 48]} /></mesh>
        {/* soft grass borders so the brick paths do not end in hard edges */}
        <Box s={[48, 0.02, 4.6]} p={[-3, 0.012, -2.4]} m={border} cast={false} />
        <Box s={[4.6, 0.02, 31]} p={[0, 0.012, 7]} m={border} cast={false} />
        <Box s={[46, 0.04, 2.6]} p={[-3, 0.025, -2.4]} m={path} cast={false} />
        <Box s={[2.6, 0.04, 30]} p={[0, 0.025, 7]} m={pathB} cast={false} />
        <Box s={[7.6, 0.03, 7.6]} p={[0, 0.015, 0]} m={M.plain('#c9bda2', { roughness: 1 })} cast={false} />
        <Temple />
        <Pond />
        <Ruins />
        <Flags />
        <Grove />
        <Sky />
        {/* warm pool of light at the foot of the pillar for dusk */}
        <pointLight position={[0, 1.2, 3]} intensity={2.4} distance={11} color="#ffb35a" />
        <pointLight position={[0, 0.25, 1.2]} intensity={1.5} distance={7} color="#ff9a3c" />
      </group>
    );
  }

  return { 'ashoka-pillar-lumbini': { Main: AshokaMain, Env: AshokaEnv } };
}
