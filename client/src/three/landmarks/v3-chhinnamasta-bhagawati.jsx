// Chhinnamasta Bhagawati, Sakhda (Saptari, Madhesh): a modern three-tier red-roofed pagoda with white fascia edges, yellow/red
// bands, a pink lotus + trident finial, standing on a flat Terai pond bank at the head of wide ghat steps. Front (+z) faces the
// water. Low red arcaded hall attached in front, smaller two-tier red pavilion at right, blue tin queue shelter on orange posts
// at left, striped pavilion at the water edge, pink-white shrine float in the pond. Layout inferred from six photographs.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, Diyo, THREE, useMemo } = K;

  const RED = '#c8402e', REDD = '#a8322a', WHITE = '#f2f0ea', YEL = '#e8b730', BROWN = '#4a2a1c', MAROON = '#6e2a22';

  /* ---------- shared textures / materials (lazy, built once) ---------- */
  let _roofTex = null;
  const roofTex = () => {
    if (_roofTex) return _roofTex;
    const c = document.createElement('canvas'); c.width = 32; c.height = 8;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 8);
    g.fillStyle = '#e8dede'; g.fillRect(0, 0, 6, 8);
    g.fillStyle = '#c8b8b8'; g.fillRect(6, 0, 2, 8);
    _roofTex = new THREE.CanvasTexture(c);
    _roofTex.wrapS = _roofTex.wrapT = THREE.RepeatWrapping; _roofTex.colorSpace = THREE.SRGBColorSpace;
    return _roofTex;
  };
  const roofMats = {};
  const roofMat = (color) => {
    if (!roofMats[color]) {
      roofMats[color] = new THREE.MeshStandardMaterial({ color, map: roofTex(), roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide });
    }
    return roofMats[color];
  };
  let _stripe = null;
  const stripeTex = () => {
    if (_stripe) return _stripe;
    const c = document.createElement('canvas'); c.width = 64; c.height = 8;
    const g = c.getContext('2d');
    for (let i = 0; i < 8; i += 1) { g.fillStyle = i % 2 ? '#f4f0e8' : '#c8402e'; g.fillRect(i * 8, 0, 8, 8); }
    _stripe = new THREE.CanvasTexture(c);
    _stripe.wrapS = _stripe.wrapT = THREE.RepeatWrapping; _stripe.colorSpace = THREE.SRGBColorSpace;
    return _stripe;
  };

  /* ---------- hipped roof with optional ridge, corrugation running down the slope ---------- */
  function hipGeometry(w, d, h) {
    const hw = w / 2, hd = d / 2;
    const rl = Math.max(0, (w - d) / 2), rz = Math.max(0, (d - w) / 2);
    const A = [-hw, 0, hd], B = [hw, 0, hd], C = [hw, 0, -hd], D = [-hw, 0, -hd];
    const R1 = [rl, h, rz], R2 = [-rl, h, rz], R3 = [-rl, h, -rz], R4 = [rl, h, -rz];
    const pos = [], uv = [];
    const tri = (a, b, c, ua, ub, uc) => { pos.push(...a, ...b, ...c); uv.push(...ua, ...ub, ...uc); };
    const k = 5;
    // front (+z): A,B,R1,R2
    tri(A, B, R1, [A[0] * k, 0], [B[0] * k, 0], [R1[0] * k, 1]); tri(A, R1, R2, [A[0] * k, 0], [R1[0] * k, 1], [R2[0] * k, 1]);
    // back: C,D,R3,R4
    tri(C, D, R3, [C[0] * k, 0], [D[0] * k, 0], [R3[0] * k, 1]); tri(C, R3, R4, [C[0] * k, 0], [R3[0] * k, 1], [R4[0] * k, 1]);
    // right: B,C,R4,R1
    tri(B, C, R4, [B[2] * k, 0], [C[2] * k, 0], [R4[2] * k, 1]); tri(B, R4, R1, [B[2] * k, 0], [R4[2] * k, 1], [R1[2] * k, 1]);
    // left: D,A,R2,R3
    tri(D, A, R2, [D[2] * k, 0], [A[2] * k, 0], [R2[2] * k, 1]); tri(D, R2, R3, [D[2] * k, 0], [R2[2] * k, 1], [R3[2] * k, 1]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function Hip({ w, d, h, y, p = [0, 0, 0], color = '#b83a2a', fascia = true, under = true, ft = 0.2 }) {
    const M = useM();
    const geo = useMemo(() => hipGeometry(w, d, h), [w, d, h]);
    return (
      <group position={[p[0], y + p[1], p[2]]}>
        <mesh geometry={geo} material={roofMat(color)} castShadow receiveShadow />
        {under && <Box s={[w, 0.04, d]} p={[0, -0.005, 0]} m={M.plain(BROWN, { roughness: 1 })} cast={false} />}
        {fascia && (
          <>
            <Box s={[w + 0.06, ft, 0.07]} p={[0, 0.03, d / 2]} m={M.plain(WHITE)} cast={false} />
            <Box s={[w + 0.06, ft, 0.07]} p={[0, 0.03, -d / 2]} m={M.plain(WHITE)} cast={false} />
            <Box s={[0.07, ft, d]} p={[w / 2, 0.03, 0]} m={M.plain(WHITE)} cast={false} />
            <Box s={[0.07, ft, d]} p={[-w / 2, 0.03, 0]} m={M.plain(WHITE)} cast={false} />
          </>
        )}
      </group>
    );
  }

  /* ---------- round-arched flat panels (white rim + dark opening) ---------- */
  function archShape(w, h, r = w / 2) {
    const P = new THREE.Shape();
    P.moveTo(-w / 2, 0); P.lineTo(w / 2, 0); P.lineTo(w / 2, h - r);
    P.absarc(0, h - r, r, 0, Math.PI, false);
    P.lineTo(-w / 2, 0);
    return P;
  }
  function Arch({ p, r = [0, 0, 0], w = 0.7, h = 0.95, fill = '#3a1c14', rim = WHITE }) {
    const M = useM();
    const [g1, g2] = useMemo(() => [new THREE.ShapeGeometry(archShape(w, h)), new THREE.ShapeGeometry(archShape(w - 0.14, h - 0.07))], [w, h]);
    return (
      <group position={p} rotation={r}>
        <mesh geometry={g1} material={M.plain(rim)} />
        <mesh geometry={g2} material={M.plain(fill, { roughness: 1 })} position={[0, 0.0, 0.004]} />
      </group>
    );
  }

  /* ---------- the main three-tier pagoda ---------- */
  function Pagoda() {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.85 });
    const dk = M.plain(BROWN, { roughness: 0.9 });
    const mar = M.plain('#8a2c24', { roughness: 0.9 });
    const yel = M.plain(YEL, { roughness: 0.7 });
    const grn = M.plain('#3f8a3a', { roughness: 0.7 });
    const white = M.plain(WHITE);
    const brass = M.plain('#c8962e', { roughness: 0.3, metalness: 0.7 });
    const metal = M.plain('#8a8d90', { metalness: 0.7, roughness: 0.4 });
    const faces = [[0, 0, 0], [0, Math.PI, 0], [0, Math.PI / 2, 0], [0, -Math.PI / 2, 0]];
    const G = 2.1; // ground storey height
    const t2 = { w: 3.0, y0: 2.2, y1: 3.3 }, t3 = { w: 1.9, y0: 3.3, y1: 4.15 };
    return (
      <group>
        {/* ground storey: red plastered wall with white-rimmed arches */}
        <Box s={[4.0, G, 4.0]} p={[0, G / 2, 0]} m={red} />
        <Box s={[4.12, 0.14, 4.12]} p={[0, 0.07, 0]} m={white} />
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2;
          return [-1.25, 0, 1.25].map((o) => {
            const px = Math.cos(a) * o + Math.sin(a) * 2.005, pz = -Math.sin(a) * o + Math.cos(a) * 2.005;
            return <Arch key={`${i}${o}`} p={[px, 0.3, pz]} r={[0, a, 0]} w={0.95} h={1.5} />;
          });
        })}
        {[[-2, -2], [2, -2], [-2, 2], [2, 2]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.26, G, 0.26]} p={[x, G / 2, z]} m={dk} />)}
        <Box s={[4.3, 0.16, 4.3]} p={[0, G - 0.08, 0]} m={dk} />
        {/* verandah posts under the wide lowest eave (front centre is the hall) */}
        {[-2.8, -1.4, 0, 1.4, 2.8].flatMap((o) => [[o, -2.8], [-2.8, o], [2.8, o], [o, 2.8]])
          .filter(([x, z], i, arr) => arr.findIndex(([a, b]) => a === x && b === z) === i)
          .filter(([x, z]) => !(z === 2.8 && Math.abs(x) < 2.5))
          .map(([x, z]) => <Box key={`${x}_${z}`} s={[0.15, G, 0.15]} p={[x, G / 2, z]} m={dk} />)}
        <Box s={[5.6, 0.05, 0.05]} p={[0, 0.8, -2.8]} m={white} cast={false} />
        {[-2.8, 2.8].map((x, i) => <Box key={`rs${i}`} s={[0.05, 0.05, 5.6]} p={[x, 0.8, 0]} m={white} cast={false} />)}
        {/* diagonal brackets under the wide eave */}
        {faces.map(([, a], i) => [-2.2, -1.1, 1.1, 2.2].map((o) => {
          const sx = Math.cos(a), sz = -Math.sin(a), fx = Math.sin(a), fz = Math.cos(a);
          return <Box key={`br${i}${o}`} s={[0.09, 0.7, 0.09]} p={[fx * 2.5 + sx * o, 1.8, fz * 2.5 + sz * o]} r={[fz * 0.8, 0, -fx * 0.8]} m={dk} cast={false} />;
        }))}
        <Box s={[6.2, 0.1, 6.2]} p={[0, G + 0.05, 0]} m={M.plain('#2a140e', { roughness: 1 })} cast={false} />
        {/* tier 1 roof (widest, shallow) */}
        <Hip w={6.4} d={6.4} h={0.5} y={2.2} ft={0.28} />
        {/* tier 2: maroon wall, white / yellow / red bands */}
        <Box s={[t2.w, t2.y1 - t2.y0, t2.w]} p={[0, (t2.y0 + t2.y1) / 2, 0]} m={mar} />
        <Box s={[t2.w + 0.04, 0.07, t2.w + 0.04]} p={[0, t2.y1 - 0.5, 0]} m={white} cast={false} />
        <Box s={[t2.w + 0.05, 0.14, t2.w + 0.05]} p={[0, t2.y1 - 0.34, 0]} m={yel} cast={false} />
        <Box s={[t2.w + 0.06, 0.12, t2.w + 0.06]} p={[0, t2.y1 - 0.14, 0]} m={red} cast={false} />
        <Hip w={4.0} d={4.0} h={0.45} y={t2.y1} ft={0.26} />
        {/* tier 3 */}
        <Box s={[t3.w, t3.y1 - t3.y0, t3.w]} p={[0, (t3.y0 + t3.y1) / 2, 0]} m={mar} />
        <Box s={[t3.w + 0.04, 0.06, t3.w + 0.04]} p={[0, t3.y1 - 0.42, 0]} m={white} cast={false} />
        <Box s={[t3.w + 0.05, 0.12, t3.w + 0.05]} p={[0, t3.y1 - 0.3, 0]} m={yel} cast={false} />
        <Box s={[t3.w + 0.06, 0.04, t3.w + 0.06]} p={[0, t3.y1 - 0.18, 0]} m={grn} cast={false} />
        <Box s={[t3.w + 0.06, 0.1, t3.w + 0.06]} p={[0, t3.y1 - 0.07, 0]} m={red} cast={false} />
        <Hip w={2.4} d={2.4} h={0.4} y={t3.y1} ft={0.22} />

        {/* finial x1.4: cream drum, wide flat pink lotus with green tips, trident and flag */}
        <group position={[0, 4.55, 0]} scale={1.4}>
          <Cyl rt={0.25} rb={0.29} h={0.3} p={[0, 0.15, 0]} m={M.plain('#efe4c8')} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <group key={i} position={[Math.sin(a) * 0.2, 0.34, Math.cos(a) * 0.2]} rotation={[Math.cos(a) * 0.95, 0, -Math.sin(a) * 0.95]}>
                <mesh position={[0, 0.17, 0]} material={M.plain('#e86a96', { roughness: 0.6 })} castShadow><coneGeometry args={[0.22, 0.35, 6]} /></mesh>
                <mesh position={[0, 0.38, 0]} material={M.plain('#5a9a3a')}><coneGeometry args={[0.07, 0.14, 5]} /></mesh>
              </group>
            );
          })}
          <Cyl rt={0.14} rb={0.2} h={0.2} p={[0, 0.5, 0]} m={M.plain('#d95a8a')} seg={10} />
          <Cyl rt={0.03} h={1.15} p={[0, 1.15, 0]} m={metal} seg={6} />
          {[-1, 0, 1].map((k) => <mesh key={k} position={[k * 0.13, 1.82, 0]} rotation={[0, 0, -k * 0.3]} material={metal}><coneGeometry args={[0.045, 0.36, 5]} /></mesh>)}
          <Box s={[0.43, 0.29, 0.015]} p={[0.24, 1.45, 0]} m={M.plain('#c01818')} cast={false} />
        </group>
        {/* hanging brass bells under the lowest eave: front corner and right side */}
        {[[2.95, 2.2, 2.95], [3.05, 2.2, 0.0]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <Box s={[0.04, 0.22, 0.04]} p={[0, -0.1, 0]} m={dk} cast={false} />
            <Cyl rt={0.08} rb={0.2} h={0.35} p={[0, -0.42, 0]} m={brass} seg={14} />
            <Ball rad={0.06} p={[0, -0.62, 0]} m={brass} />
          </group>
        ))}
      </group>
    );
  }

  /* ---------- tall red arcaded hall attached to the front ---------- */
  function Hall() {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.85 });
    const redD = M.plain(REDD, { roughness: 0.9 });
    const white = M.plain(WHITE);
    const dk = M.plain('#2a140e', { roughness: 1 });
    const z0 = 2.1, z1 = 4.3, W = 4.5, n = 6, span = 4.1;
    const xs = Array.from({ length: n }, (_, i) => -span / 2 + (i * span) / (n - 1));
    const zc = (z0 + z1) / 2;
    return (
      <group>
        <Box s={[W, 0.7, z1 - z0]} p={[0, 0.35, zc]} m={red} />
        <Box s={[W + 0.12, 0.07, z1 - z0 + 0.12]} p={[0, 0.7, zc]} m={white} cast={false} />
        <Box s={[W - 0.2, 0.65, 0.1]} p={[0, 1.03, z0 + 0.4]} m={dk} />
        <Box s={[W, 0.65, 0.12]} p={[0, 1.03, z1 - 0.12]} m={redD} />
        {xs.slice(0, -1).map((x, i) => {
          const cx = (x + xs[i + 1]) / 2;
          return <Arch key={i} p={[cx, 0.72, z1 - 0.055]} w={0.6} h={0.62} fill="#2a140e" rim={WHITE} />;
        })}
        {xs.map((x, i) => <Box key={`p${i}`} s={[0.15, 0.65, 0.15]} p={[x, 1.03, z1 - 0.1]} m={redD} />)}
        {xs.slice(0, -1).map((x, i) => {
          const cx = (x + xs[i + 1]) / 2;
          return [0.85, 1.12].map((y) => <Box key={`r${i}${y}`} s={[0.8, 0.04, 0.04]} p={[cx, y, z1 + 0.03]} m={white} cast={false} />);
        })}
        {[-1, 1].map((k) => [0.85, 1.12].map((y) => <Box key={`${k}${y}`} s={[0.04, 0.04, z1 - z0]} p={[k * (W / 2 + 0.02), y, zc]} m={white} cast={false} />))}
        <Box s={[W, 0.1, 0.16]} p={[0, 1.31, z1 - 0.1]} m={redD} />
        <Box s={[W + 0.4, 0.06, z1 - z0 + 0.2]} p={[0, 1.37, zc]} m={dk} cast={false} />
        <Hip w={5.0} d={2.4} h={0.5} y={1.39} p={[0, 0, zc]} ft={0.2} />
        <Diyo p={[-1.4, 0.75, z1 + 0.1]} light />
        <Diyo p={[1.4, 0.75, z1 + 0.1]} />
      </group>
    );
  }

  /* ---------- second smaller two-tier red pavilion on the ghat, right ---------- */
  function Pavilion({ p }) {
    const M = useM();
    const red = M.plain(RED, { roughness: 0.85 });
    const dk = M.plain(BROWN, { roughness: 0.9 });
    const white = M.plain(WHITE);
    return (
      <group position={p}>
        <Box s={[2.5, 0.35, 2.5]} p={[0, 0.175, 0]} m={M.plain('#d9ccb2')} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.14, 1.0, 0.14]} p={[x * 1.0, 0.85, z * 1.0]} m={red} />)}
        {[-1, 1].map((x) => <Box key={x} s={[0.05, 0.05, 2.0]} p={[x, 0.75, 0]} m={white} cast={false} />)}
        {[-1, 1].map((z) => <Box key={z} s={[2.0, 0.05, 0.05]} p={[0, 0.75, z]} m={white} cast={false} />)}
        {[-0.5, 0.5].map((o) => [<Arch key={`a${o}`} p={[o, 0.4, 1.02]} w={0.5} h={0.8} fill="#4a2018" />, <Arch key={`b${o}`} p={[o, 0.4, -1.02]} r={[0, Math.PI, 0]} w={0.5} h={0.8} fill="#4a2018" />])}
        <Hip w={3.0} d={3.0} h={0.58} y={1.35} />
        <Box s={[1.3, 0.38, 1.3]} p={[0, 1.78, 0]} m={M.plain(MAROON)} />
        <Box s={[1.34, 0.08, 1.34]} p={[0, 1.88, 0]} m={M.plain(YEL)} cast={false} />
        <Hip w={1.9} d={1.9} h={0.5} y={1.95} />
        <Cyl rt={0.1} rb={0.14} h={0.2} p={[0, 2.55, 0]} m={white} />
        <mesh position={[0, 2.78, 0]} material={M.plain('#e86a96')} castShadow><coneGeometry args={[0.1, 0.26, 8]} /></mesh>
        <Cyl rt={0.012} h={0.5} p={[0, 3.0, 0]} m={M.plain('#8a8d90')} seg={5} />
      </group>
    );
  }

  /* ---------- blue tin queue shelter on orange posts with zig-zag railings ---------- */
  function Shelter({ p }) {
    const M = useM();
    const orange = M.plain('#c8581e', { roughness: 0.7, metalness: 0.2 });
    const blue = M.plain('#1f62c8', { roughness: 0.5, metalness: 0.3 });
    const blueL = M.plain('#2a74e0', { metalness: 0.3 });
    const rail = M.plain('#3a2218', { roughness: 0.7, metalness: 0.2 });
    const W = 5.0, D = 3.0, ps = Array.from({ length: 6 }, (_, i) => -W / 2 + (i * W) / 5);
    const zz = Array.from({ length: 9 }, (_, i) => i);
    return (
      <group position={p}>
        {ps.map((x, i) => <Box key={`b${i}`} s={[0.08, 1.75, 0.08]} p={[x, 0.875, -D / 2]} m={orange} />)}
        {ps.map((x, i) => <Box key={`f${i}`} s={[0.08, 1.05, 0.08]} p={[x, 0.525, D / 2]} m={orange} />)}
        <Box s={[W + 0.1, 0.08, 0.08]} p={[0, 1.7, -D / 2]} m={orange} cast={false} />
        <Box s={[W + 0.1, 0.08, 0.08]} p={[0, 1.02, D / 2]} m={orange} cast={false} />
        {/* sloping tin roof, centre height about 1.4 */}
        <group position={[0, 1.4, 0]} rotation={[Math.atan2(0.7, D), 0, 0]}>
          <Box s={[W + 0.5, 0.05, Math.hypot(D, 0.7) + 0.4]} m={blue} />
          {Array.from({ length: 16 }).map((_, i) => <Box key={i} s={[0.03, 0.04, Math.hypot(D, 0.7) + 0.4]} p={[-W / 2 - 0.1 + (i * (W + 0.2)) / 15, 0.03, 0]} m={blueL} cast={false} />)}
        </group>
        {/* joined zig-zag queue railings in front */}
        {zz.map((i) => {
          const x0 = -W / 2 - 0.4 + i * 0.7, z0 = D / 2 + 0.3 + (i % 2) * 0.5, z1 = D / 2 + 0.3 + ((i + 1) % 2) * 0.5;
          const len = Math.hypot(0.7, z1 - z0), ang = Math.atan2(-(z1 - z0), 0.7);
          return (
            <group key={i}>
              <Box s={[0.05, 0.85, 0.05]} p={[x0, 0.425, z0]} m={rail} />
              {[0.8, 0.45].map((y) => <Box key={y} s={[len, 0.04, 0.04]} p={[x0 + 0.35, y, (z0 + z1) / 2]} r={[0, ang, 0]} m={rail} cast={false} />)}
            </group>
          );
        })}
      </group>
    );
  }

  /* ---------- striped red/white pavilion at the water edge ---------- */
  function StripedPavilion({ p }) {
    const M = useM();
    const tex = stripeTex();
    return (
      <group position={p}>
        <Cyl rt={1.05} rb={1.1} h={0.3} p={[0, 0.15, 0]} m={M.plain('#d9ccb2')} seg={8} />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <Cyl key={i} rt={0.05} h={1.0} p={[Math.sin(a) * 0.8, 0.8, Math.cos(a) * 0.8]} m={M.plain(i % 2 ? WHITE : RED)} seg={8} />;
        })}
        <mesh position={[0, 1.65, 0]} castShadow><coneGeometry args={[1.15, 0.8, 8]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
        <Cyl rt={0.14} rb={0.18} h={0.14} p={[0, 2.1, 0]} m={M.plain(WHITE)} seg={10} />
        <mesh position={[0, 2.35, 0]} material={M.plain('#e86a96')}><coneGeometry args={[0.09, 0.3, 8]} /></mesh>
      </group>
    );
  }

  function Main() {
    const M = useM();
    return (
      <group>
        <Box s={[19, 0.14, 10.5]} p={[0.2, 0.07, 1.25]} m={M.plain('#c9b48c', { roughness: 1 })} cast={false} />
        <Pagoda />
        <Hall />
        <Pavilion p={[7.4, 0.07, 0.6]} />
        <Shelter p={[-6, 0.07, 3.7]} />
        <Frame s={[13, 6.8, 9]} p={[-0.2, 3.1, 2.4]} />
      </group>
    );
  }

  /* ---------- environment ---------- */
  function Palm({ p, s = 1, lean = 0.08, seed = 0 }) {
    const M = useM();
    const green = M.plain('#3f7d2c', { roughness: 0.9 });
    const H = 6 * s;
    return (
      <group position={p} rotation={[0, seed, lean]}>
        <Cyl rt={0.12 * s} rb={0.2 * s} h={H} p={[0, H / 2, 0]} m={M.plain('#8a6e50')} seg={8} />
        <group position={[0, H, 0]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <group key={i} rotation={[0, (i / 9) * Math.PI * 2, 0]}>
              <group rotation={[0.55 + (i % 3) * 0.12, 0, 0]}>
                <Box s={[0.5 * s, 0.04, 2.0 * s]} p={[0, 0, 1.0 * s]} m={green} cast={false} />
              </group>
            </group>
          ))}
          <Ball rad={0.16 * s} p={[0.1 * s, -0.2 * s, 0.1 * s]} m={M.plain('#6a8a2a')} />
        </group>
      </group>
    );
  }
  function BigTree({ p, s = 1 }) {
    const M = useM();
    const leaf = M.plain('#3f6a2c', { roughness: 1 });
    const leaf2 = M.plain('#4f7a34', { roughness: 1 });
    return (
      <group position={p} scale={s}>
        <Cyl rt={0.35} rb={0.55} h={3.2} p={[0, 1.6, 0]} m={M.plain('#4a3426')} seg={8} />
        {[[0, 4.4, 0, 2.4], [2.2, 3.9, 0.6, 1.8], [-2.1, 4.0, -0.4, 1.9], [0.6, 5.2, -1.2, 1.7], [-0.8, 3.7, 1.8, 1.7], [1.2, 4.0, -2.0, 1.6]].map(([x, y, z, r], i) => (
          <Ball key={i} rad={r} p={[x, y, z]} sc={[1, 0.8, 1]} m={i % 2 ? leaf2 : leaf} />
        ))}
      </group>
    );
  }
  function LowHouse({ p, r = 0, w = 5, d = 3, h = 2.4, wall, roof }) {
    const M = useM();
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[w, h, d]} p={[0, h / 2, 0]} m={M.plain(wall, { roughness: 0.95 })} />
        <Box s={[w + 0.3, 0.14, d + 0.3]} p={[0, h + 0.07, 0]} m={M.plain(roof, { roughness: 0.7, metalness: 0.2 })} />
        <Box s={[w * 0.8, 0.5, 0.05]} p={[0, h * 0.6, d / 2 + 0.01]} m={M.plain('#2e3a40')} cast={false} />
      </group>
    );
  }
  function PondShrine({ p }) {
    const M = useM();
    const pink = M.plain('#e88ab0'), white = M.plain(WHITE);
    return (
      <group position={p}>
        <Box s={[1.5, 0.45, 1.5]} p={[0, 0.22, 0]} m={white} />
        <Box s={[1.1, 0.5, 1.1]} p={[0, 0.7, 0]} m={pink} />
        <Cyl rt={0.5} rb={1.0} h={0.45} p={[0, 1.2, 0]} m={pink} seg={8} />
        <Cyl rt={0.52} rb={0.52} h={0.1} p={[0, 1.0, 0]} m={white} seg={8} />
        <Cyl rt={0.45} rb={0.45} h={0.35} p={[0, 1.6, 0]} m={white} seg={8} />
        <Cyl rt={0.2} rb={0.62} h={0.4} p={[0, 1.98, 0]} m={pink} seg={8} />
        <Cyl rt={0.64} rb={0.64} h={0.07} p={[0, 1.8, 0]} m={white} seg={8} />
        <mesh position={[0, 2.4, 0]} material={white} castShadow><coneGeometry args={[0.18, 0.5, 8]} /></mesh>
        <Cyl rt={0.02} h={0.5} p={[0, 2.8, 0]} m={white} seg={5} />
      </group>
    );
  }

  function Env() {
    const M = useM();
    const land = M.plain('#8aa04a', { roughness: 1 });
    const conc = M.plain('#c9bc9f', { roughness: 1 });
    const stone = M.plain('#aaa699', { roughness: 0.95 });
    const stoneD = M.plain('#8a8374', { roughness: 1 });
    const haze = M.plain('#7d8f58', { roughness: 1 });
    const hazeD = M.plain('#5f7a44', { roughness: 1 });
    const field = M.plain('#a39a5a', { roughness: 1 });
    const WY = -0.9; // water level
    const zS = 6.5;  // bank edge
    const steps = Array.from({ length: 5 });
    return (
      <group>
        {/* land around a rectangular pond: x -24..24, z zS..46 */}
        <Box s={[160, 3, 70]} p={[0, -1.5 - 0.01, zS - 35]} m={land} cast={false} />
        <Box s={[56, 3, 60]} p={[-52, -1.51, zS + 30]} m={land} cast={false} />
        <Box s={[56, 3, 60]} p={[52, -1.51, zS + 30]} m={land} cast={false} />
        <Box s={[160, 3, 40]} p={[0, -1.51, 46 + 20]} m={land} cast={false} />
        {/* hazy field horizon about 40 m behind: fields, then a dark tree line */}
        <Box s={[170, 0.05, 10]} p={[0, 0.0, -34]} m={field} cast={false} />
        <Box s={[170, 0.9, 5]} p={[0, 0.45, -42]} m={haze} cast={false} />
        {Array.from({ length: 16 }).map((_, i) => <Ball key={`tl${i}`} rad={3.2 + (i % 3) * 0.6} p={[-70 + i * 9.5, 1.2, -44 - (i % 2) * 2]} sc={[1.3, 0.7, 1]} m={i % 2 ? hazeD : haze} />)}
        {/* stone-faced bank edge on the pond side */}
        <Box s={[48, 2.5, 0.3]} p={[0, -1.25, zS + 0.15]} m={stoneD} cast={false} />
        <Box s={[48, 0.12, 0.7]} p={[0, -0.03, zS - 0.1]} m={stone} cast={false} />
        {/* wider warm-tan apron behind the court */}
        <Box s={[30, 0.03, 18]} p={[0, 0.005, -2.5]} m={M.plain('#cdb98f', { roughness: 1 })} cast={false} />
        {/* pond water over a dark bed */}
        <Box s={[48, 0.1, 42]} p={[0, WY - 0.05, zS + 21]} m={M.plain('#4a9a80', { roughness: 0.1, metalness: 0.25 })} cast={false} />
        <Box s={[48, 0.1, 42]} p={[0, WY - 0.6, zS + 21]} m={M.plain('#2b3d2a')} cast={false} />
        {/* ghat: five broad steps of 0.25 rise, x -3..7 */}
        {steps.map((_, i) => {
          const top = -0.25 * (i + 1);
          return <Box key={i} s={[10, top + 2, 0.6]} p={[2, (top - 2) / 2, zS + 0.3 + i * 0.6]} m={i % 2 ? stone : conc} cast={false} />;
        })}
        {[-3.05, 7.05].map((x) => <Box key={x} s={[0.2, 2.2, 3.2]} p={[x, -1.1, zS + 1.5]} m={stoneD} cast={false} />)}
        {/* teal jetty to the left of the ghat */}
        <Box s={[1.4, 0.15, 3.0]} p={[-4.2, -0.6, zS + 1.6]} m={M.plain('#2aa09a')} cast={false} />
        <Box s={[0.05, 0.5, 3.0]} p={[-4.9, -0.3, zS + 1.6]} m={M.plain('#1f8a84')} cast={false} />
        <Box s={[0.05, 0.5, 3.0]} p={[-3.5, -0.3, zS + 1.6]} m={M.plain('#1f8a84')} cast={false} />
        {/* emissive diyo row on the ghat and floating lamps on the pond (dusk glow) */}
        {Array.from({ length: 8 }).map((_, i) => <Diyo key={`dg${i}`} p={[-2.2 + i * 1.3, -0.25, zS + 0.35]} light={i % 3 === 0} />)}
        {[[0.5, 9.2], [2.5, 10.4], [4.5, 9.0], [-1.5, 11], [6, 11.5], [1.5, 12.6], [3.8, 13.4], [-0.5, 8.6]].map(([x, z], i) => (
          <mesh key={`fl${i}`} position={[x, WY + 0.04, z]}>
            <cylinderGeometry args={[0.09, 0.12, 0.05, 8]} />
            <meshStandardMaterial color="#ffb347" emissive="#ff9a2e" emissiveIntensity={1.6} />
          </mesh>
        ))}
        {/* pavilions and shrine at the water */}
        <StripedPavilion p={[-9.4, 0.04, zS - 1.4]} />
        <PondShrine p={[-5, WY - 0.1, 15]} />
        {/* long shed beside the pond (left) */}
        {Array.from({ length: 8 }).map((_, i) => <Box key={i} s={[0.14, 2.4, 0.14]} p={[-27, 1.2, 8 + i * 3]} m={M.plain('#6a6a68')} />)}
        <Box s={[3.6, 0.1, 24]} p={[-27, 2.45, 18.5]} m={M.plain('#5c9a7a', { metalness: 0.3, roughness: 0.6 })} />
        <Box s={[3.4, 0.08, 24]} p={[-27, -0.02, 18.5]} m={conc} cast={false} />
        {/* low village buildings */}
        <LowHouse p={[-15, 0, 3]} w={6} d={3.5} h={2.6} wall="#7fc59a" roof="#2f8a4a" />
        <LowHouse p={[-15, 0, -7]} w={7} d={4} h={3} wall="#e8b4c0" roof="#3f9a5a" />
        <LowHouse p={[-24, 0, -13]} w={5} d={4} h={2.6} wall="#9ed0a8" roof="#a8503c" />
        <LowHouse p={[20, 0, -13]} w={6} d={4} h={2.8} wall="#e6d5a8" roof="#3f7fb0" />
        <LowHouse p={[26, 0, -3]} w={4} d={3.5} h={2.4} wall="#d9a8a8" roof="#3f9a5a" />
        <LowHouse p={[-14, 0, 52]} w={8} d={4} h={3} wall="#9ed0a8" roof="#3f9a5a" />
        <LowHouse p={[-2, 0, 54]} w={6} d={4} h={2.6} wall="#e8b4c0" roof="#c8402e" />
        <LowHouse p={[12, 0, 52]} w={7} d={4} h={3.2} wall="#e6d5a8" roof="#3f7fb0" />
        {/* tall palms clustered behind the pagoda, then scattered ones */}
        {[[-4.5, 0, -9, 1.3, 0.1, 0.4], [-1.4, 0, -11, 1.35, -0.07, 1.2], [2.6, 0, -9.5, 1.25, 0.06, 2.2], [5.6, 0, -12, 1.3, -0.1, 3.1], [-7.5, 0, -10, 1.1, 0.09, 4.0], [8.6, 0, -8.5, 1.0, 0.07, 5.0], [-18, 0, 2, 1.1, 0.06, 0.8], [20, 0, 4, 1.15, -0.06, 2.0], [-6, 0, 50, 1.2, 0.05, 1.0], [6, 0, 49, 1.1, -0.08, 2.0], [20, 0, 50, 1.2, 0.06, 3.0]].map(([x, y, z, s, l, sd], i) => (
          <Palm key={i} p={[x, y, z]} s={s} lean={l} seed={sd} />
        ))}
        {/* big spreading shade trees, kept well clear of the temple */}
        <BigTree p={[12, 0, -9.5]} s={1.3} />
        <BigTree p={[-11.5, 0, -11.5]} s={1.2} />
        <BigTree p={[27, 0, 12]} s={1.1} />
        <BigTree p={[-30, 0, -4]} s={1.3} />
        <BigTree p={[32, 0, -14]} s={1.2} />
        <BigTree p={[-26, 0, 40]} s={1.2} />
        <BigTree p={[28, 0, 40]} s={1.3} />
        <BigTree p={[0, 0, -26]} s={1.5} />
        <BigTree p={[-14, 0, -24]} s={1.3} />
        <BigTree p={[16, 0, -24]} s={1.4} />
      </group>
    );
  }

  return { 'chhinnamasta-bhagawati': { Main, Env } };
}
