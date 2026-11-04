// Patan Museum (Keshav Narayan Chowk), Lalitpur. A restored Malla palace court: a wide brick-paved courtyard closed on all four
// sides by continuous 3-storey red-brick wings (plain brick bays between discrete carved-timber windows, thin dark tie bands,
// deep tiled eaves on carved struts). The big gilt Golden Door (with torana and guardians) and the three-part gilt Golden Window
// sit centred on the entrance wing (+z, toward Durbar Square). In the court stands the small white Keshav Narayan shrine
// (8 columns, three stepped umbrella tiers, a slim spire) on a stepped plinth with two stone lions. The Taleju pagoda rises
// tall behind the rear roof; a little 2-roof lantern turret ends the entrance wing. Outside: a paved square, the Mangal Hiti
// sunken brick tank, Krishna Mandir and plain 3-storey brick houses.
export default function make(K) {
  const { useM, Box, Cyl, Ball, Roof, Lion, Gajur, Spire, Frame, EaveStruts, NewarHouse, Diyo, LatticeWindow, THREE, useMemo, useRef, useEffect } = K;

  const O = 7.8;      // outer half-width of the palace block
  const I = 5.5;      // courtyard half-width
  const H = 4.5;      // eave height of the wings: ground 1.6, two upper floors 1.45 each
  const DX = 0;       // lateral position of the golden door on the entrance wing
  const BRICK = '#8b3a2b';
  const WOOD = '#3e2410';
  const TILE = '#a07c5e';
  const F1 = 2.4;     // first-floor window centre
  const F2 = 3.85;    // second-floor window centre

  /* ---------- instanced boxes / planes ---------- */
  function Inst({ items, m, kind = 'box', cast = false }) {
    const ref = useRef();
    useEffect(() => {
      if (!ref.current) return;
      const o = new THREE.Object3D();
      o.rotation.order = 'YXZ';
      items.forEach((it, i) => {
        o.position.set(it[0], it[1], it[2]);
        o.scale.set(it[3], it[4], it[5]);
        o.rotation.set(it[7] || 0, it[6] || 0, 0);
        o.updateMatrix();
        ref.current.setMatrixAt(i, o.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    }, [items]);
    return (
      <instancedMesh ref={ref} args={[null, null, Math.max(1, items.length)]} material={m} castShadow={cast} receiveShadow frustumCulled={false}>
        {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : <planeGeometry args={[1, 1]} />}
      </instancedMesh>
    );
  }

  /* dark carved lattice texture */
  function latticeTex(rx, ry) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#1a0e07'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#6a4626'; g.lineWidth = 3;
    g.beginPath();
    for (let k = -64; k <= 128; k += 16) { g.moveTo(k, 0); g.lineTo(k + 64, 64); g.moveTo(k, 64); g.lineTo(k + 64, 0); }
    g.stroke();
    g.strokeStyle = '#5d3a1b'; g.lineWidth = 6; g.strokeRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  /* warm red-orange palace brick, drawn once and cached per repeat */
  const brickCache = {};
  function brickTex() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#5a2a20'; g.fillRect(0, 0, 128, 128);
    const cols = ['#8b3a2b', '#9a4130', '#a8472f', '#84362a', '#93402e'];
    for (let r = 0; r < 8; r += 1) {
      for (let b = 0; b < 4; b += 1) {
        g.fillStyle = cols[(r * 3 + b * 2 + (r % 2)) % cols.length];
        g.fillRect(b * 32 + (r % 2 ? 16 : 0) - 16 + 1, r * 16 + 1, 30, 14);
        g.fillRect(b * 32 + (r % 2 ? 16 : 0) + 1 + 32, r * 16 + 1, 30, 14);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const brickMatC = (rx, ry) => {
    const key = rx + '_' + ry;
    if (!brickCache[key]) {
      const t = brickTex(); t.repeat.set(rx, ry);
      brickCache[key] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    }
    return brickCache[key];
  };
  const latMat = (rx, ry) => new THREE.MeshStandardMaterial({ map: latticeTex(rx, ry), roughness: 0.8 });

  /* world placement on side k (0 = +z front, 1 = +x, 2 = -z, 3 = -x). out = outer face, else courtyard face */
  const face = (k, lx, y, lz, out) => {
    const a = (k * Math.PI) / 2;
    const nz = Math.cos(a); const nx = Math.sin(a); const tx = Math.cos(a); const tz = -Math.sin(a);
    return [lx * tx + lz * nx, y, lx * tz + lz * nz, out ? a : a + Math.PI];
  };

  /* facade units: ground-storey shuttered windows, posts and projecting carved oriels of varied width over the continuous lattice bands */
  function facadeUnits(P, L, n, upper2, skip, acc) {
    const step = L / n;
    for (let i = 0; i < n; i += 1) {
      const lx = -L / 2 + (i + 0.5) * step;
      if (!skip(lx, false)) {
        const w = 1.0 + ((i * 7) % 4) * 0.1;
        // projecting carved oriel at the first floor (frame + cornice + sill) over the band
        let q = P(lx, F1, 0.16); acc.frames.push([q[0], q[1], q[2], w, 0.96, 0.22, q[3]]);
        q = P(lx, F1, 0.275); acc.lats.push([q[0], q[1], q[2], w - 0.24, 0.72, 1, q[3]]);
        q = P(lx, F1 + 0.55, 0.2); acc.frames.push([q[0], q[1], q[2], w + 0.3, 0.1, 0.34, q[3]]);
        q = P(lx, F1 - 0.55, 0.18); acc.frames.push([q[0], q[1], q[2], w + 0.14, 0.08, 0.3, q[3]]);
        if (upper2 && i % 2 === 1) {
          const w2 = 0.9 + ((i * 5) % 3) * 0.1;
          q = P(lx + step * 0.1, F2, 0.12); acc.frames.push([q[0], q[1], q[2], w2, 0.84, 0.16, q[3]]);
          q = P(lx + step * 0.1, F2, 0.205); acc.lats.push([q[0], q[1], q[2], w2 - 0.2, 0.6, 1, q[3]]);
          q = P(lx + step * 0.1, F2 + 0.47, 0.16); acc.frames.push([q[0], q[1], q[2], w2 + 0.24, 0.08, 0.26, q[3]]);
        }
      }
      if (i < n - 1) {
        const lm = lx + step / 2;
        if (!skip(lm, true)) {
          const w = 0.5 + ((i * 3) % 3) * 0.12;
          let q = P(lm, 0.95, 0.03); acc.frames.push([q[0], q[1], q[2], w, 0.72, 0.08, q[3]]);
          q = P(lm, 0.95, 0.075); acc.lats.push([q[0], q[1], q[2], w - 0.18, 0.54, 1, q[3]]);
        }
      }
    }
  }

  /* ring roof over the four wings: one mesh, deep eaves, gentle pitch */
  function ringRoofGeo() {
    const yE = H + 0.15; const yR = H + 0.95;
    const A = O + 0.9; const R = (O + I) / 2 + 0.2; const C = I - 0.15;
    const loop = (r, y) => [[-r, y, r], [r, y, r], [r, y, -r], [-r, y, -r]];
    const La = loop(A, yE); const Lb = loop(R, yR); const Lc = loop(C, yE + 0.05);
    const pos = []; const uv = [];
    const tri = (a, b, c) => {
      const ux = b[0] - a[0]; const uy = b[1] - a[1]; const uz = b[2] - a[2];
      const vx = c[0] - a[0]; const vy = c[1] - a[1]; const vz = c[2] - a[2];
      const ny = uz * vx - ux * vz;
      const t = ny >= 0 ? [a, b, c] : [a, c, b];
      t.forEach((p) => { pos.push(p[0], p[1], p[2]); uv.push(p[0] / 3, p[2] / 3); });
    };
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4;
      tri(La[i], La[j], Lb[j]); tri(La[i], Lb[j], Lb[i]);
      tri(Lb[i], Lb[j], Lc[j]); tri(Lb[i], Lc[j], Lc[i]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }

  /* ---------- the Golden Door: big gilt gate with stepped surround, torana and guardians ---------- */
  function GoldDoor({ p }) {
    const M = useM();
    const wood = M.plain(WOOD, { roughness: 0.8 });
    const dk = M.plain('#7a5a0e', { metalness: 0.7, roughness: 0.4 });
    const tym = M.plain('#3a1d10', { roughness: 0.8 });
    const flames = Array.from({ length: 9 }, (_, i) => i);
    return (
      <group position={p} scale={[1, 0.85, 1]}>
        {/* recess and doors */}
        <Box s={[2.6, 2.65, 0.16]} p={[0, 1.33, 0.02]} m={wood} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[1.04, 2.45, 0.1]} p={[s * 0.53, 1.3, 0.13]} m={wood} />
            {[0.5, 1.28, 2.05].map((y) => <Box key={y} s={[0.78, 0.56, 0.04]} p={[s * 0.53, y, 0.2]} m={tym} cast={false} />)}
            {[0.5, 1.28, 2.05].map((y) => <Ball key={`g${y}`} rad={0.07} p={[s * 0.53, y, 0.23]} m={M.gold} />)}
            <Box s={[0.06, 2.4, 0.04]} p={[s * 0.1, 1.3, 0.2]} m={M.gold} cast={false} />
            <Box s={[0.06, 2.4, 0.04]} p={[s * 0.96, 1.3, 0.2]} m={M.gold} cast={false} />
          </group>
        ))}
        <Box s={[0.05, 2.45, 0.06]} p={[0, 1.3, 0.2]} m={dk} cast={false} />
        {/* stepped gilt surround */}
        {[-1, 1].map((s) => (
          <group key={`j${s}`}>
            <Box s={[0.24, 2.7, 0.26]} p={[s * 1.28, 1.36, 0.1]} m={M.gold} />
            <Box s={[0.12, 2.7, 0.4]} p={[s * 1.44, 1.36, 0.12]} m={dk} />
            <Box s={[0.1, 2.5, 0.34]} p={[s * 1.12, 1.3, 0.18]} m={M.gold} cast={false} />
          </group>
        ))}
        <Box s={[2.9, 0.2, 0.28]} p={[0, 2.68, 0.1]} m={M.gold} />
        <Box s={[3.2, 0.1, 0.42]} p={[0, 2.82, 0.14]} m={dk} />
        {/* deep arch torana over the lintel */}
        <group position={[0, 2.84, 0.2]} scale={[1, 0.3, 1]}>
          <mesh material={tym} position={[0, 0, -0.02]}><circleGeometry args={[1.35, 28, 0, Math.PI]} /></mesh>
          <mesh material={M.gold} position={[0, 0, 0.04]}><torusGeometry args={[1.35, 0.1, 8, 28, Math.PI]} /></mesh>
          <mesh material={M.gold} position={[0, 0, 0.06]}><torusGeometry args={[1.0, 0.08, 8, 28, Math.PI]} /></mesh>
          <mesh material={M.gold} position={[0, 0, 0.05]}><circleGeometry args={[0.55, 20, 0, Math.PI]} /></mesh>
        </group>
        {flames.map((i) => {
          const a = (i / 8) * Math.PI;
          return <mesh key={i} material={M.gold} position={[Math.cos(a) * 1.5, 2.84 + Math.sin(a) * 0.45, 0.2]} rotation={[0, 0, a - Math.PI / 2]}><coneGeometry args={[0.06, 0.2, 5]} /></mesh>;
        })}
        <Ball rad={0.17} p={[0, 3.3, 0.22]} m={M.gold} />
        {/* guardians on plinths flanking the gate */}
        {[-1, 1].map((s) => (
          <group key={`gd${s}`} position={[s * 1.95, 0, 0.3]}>
            <Box s={[0.5, 0.4, 0.4]} p={[0, 0.2, 0]} m={M.stone} />
            <Box s={[0.34, 0.9, 0.22]} p={[0, 0.85, 0]} m={M.gold} />
            <Ball rad={0.17} p={[0, 1.45, 0]} m={M.gold} />
            <Cyl rt={0.03} rb={0.03} h={1.2} p={[s * 0.24, 0.95, 0.05]} m={dk} seg={6} />
          </group>
        ))}
        {/* stone steps */}
        <Box s={[3.2, 0.12, 0.5]} p={[0, 0.06, 0.4]} m={M.stone} />
        <Box s={[3.7, 0.12, 0.5]} p={[0, 0.02, 0.8]} m={M.stone} cast={false} />
      </group>
    );
  }

  /* ---------- the Golden Window: a three-part gilt oriel with stepped canopy ---------- */
  function GoldWindow({ p }) {
    const M = useM();
    const dk = M.plain('#17100a');
    const bars = M.plain('#8a6a12', { metalness: 0.7, roughness: 0.4 });
    return (
      <group position={[p[0], 2.88 - 3.34 * 1.22, p[2]]} scale={[1.45, 1.22, 1.4]}>
        <Box s={[3.3, 0.14, 0.55]} p={[0, 3.34, 0.16]} m={M.gold} />
        <Box s={[3.3, 1.0, 0.3]} p={[0, 3.82, 0.0]} m={M.plain('#3a2010', { roughness: 0.8 })} />
        <Box s={[3.36, 0.1, 0.5]} p={[0, 4.36, 0.1]} m={M.gold} />
        {/* tall centre panel */}
        <Box s={[1.2, 1.05, 0.46]} p={[0, 3.86, 0.1]} m={M.gold} />
        <Box s={[0.92, 0.8, 0.05]} p={[0, 3.84, 0.35]} m={dk} cast={false} />
        {[-0.3, -0.15, 0, 0.15, 0.3].map((x) => <Box key={x} s={[0.025, 0.78, 0.03]} p={[x, 3.84, 0.38]} m={bars} cast={false} />)}
        {/* side panels */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box s={[0.95, 0.82, 0.4]} p={[s * 1.1, 3.76, 0.07]} m={M.gold} />
            <Box s={[0.7, 0.58, 0.05]} p={[s * 1.1, 3.76, 0.29]} m={dk} cast={false} />
            {[-0.2, -0.1, 0, 0.1, 0.2].map((x) => <Box key={x} s={[0.022, 0.56, 0.03]} p={[s * 1.1 + x, 3.76, 0.32]} m={bars} cast={false} />)}
            <Box s={[1.05, 0.07, 0.5]} p={[s * 1.1, 4.21, 0.1]} m={M.gold} />
            <Box s={[0.8, 0.07, 0.4]} p={[s * 1.1, 4.29, 0.08]} m={M.gold} />
          </group>
        ))}
        {/* stepped canopy over the centre and its 3-tier finial */}
        <Box s={[1.5, 0.08, 0.66]} p={[0, 4.44, 0.12]} m={M.gold} />
        <Box s={[1.2, 0.08, 0.54]} p={[0, 4.53, 0.1]} m={M.gold} />
        <Box s={[0.86, 0.08, 0.42]} p={[0, 4.62, 0.08]} m={M.gold} />
        <Cyl rt={0.03} rb={0.05} h={0.16} p={[0, 4.73, 0.08]} m={M.gold} seg={8} />
        <Cyl rt={0.14} rb={0.14} h={0.05} p={[0, 4.8, 0.08]} m={M.gold} seg={10} />
        <Cyl rt={0.1} rb={0.1} h={0.05} p={[0, 4.86, 0.08]} m={M.gold} seg={10} />
        <Cyl rt={0.01} rb={0.06} h={0.14} p={[0, 4.95, 0.08]} m={M.gold} seg={8} />
      </group>
    );
  }

  /* ---------- the Keshav Narayan shrine: 8 columns, three stepped umbrella tiers, thin spire ---------- */
  function Shrine() {
    const M = useM();
    const wh = M.plain('#f6f2ea', { roughness: 0.8 });
    const wh2 = M.plain('#e9e3d6', { roughness: 0.85 });
    const stone = M.mat('granite', 2, 1, { color: '#cdbfa9' });
    const pil = M.plain('#e0d9cb', { roughness: 0.8 });
    const cols = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + Math.PI / 8);
    return (
      <group position={[0, 0.05, 1.2]} scale={1.65}>
        <Box s={[2.5, 0.1, 2.5]} p={[0, 0.05, 0]} m={stone} />
        <Box s={[2.2, 0.1, 2.2]} p={[0, 0.15, 0]} m={stone} />
        <Box s={[1.9, 0.1, 1.9]} p={[0, 0.25, 0]} m={stone} />
        <Box s={[1.6, 0.07, 1.6]} p={[0, 0.335, 0]} m={wh2} />
        {/* steps toward +z */}
        <Box s={[0.9, 0.08, 0.3]} p={[0, 0.04, 1.4]} m={stone} cast={false} />
        <Box s={[0.7, 0.08, 0.25]} p={[0, 0.12, 1.28]} m={stone} cast={false} />
        {cols.map((a, i) => <Cyl key={i} rt={0.045} rb={0.055} h={0.78} p={[Math.cos(a) * 0.68, 0.76, Math.sin(a) * 0.68]} m={pil} seg={8} />)}
        <Cyl rt={0.2} rb={0.22} h={0.7} p={[0, 0.75, 0]} m={wh2} seg={12} />
        {/* white cornice rings and a single hemispherical dome */}
        <Cyl rt={0.9} rb={0.9} h={0.1} p={[0, 1.2, 0]} m={wh} seg={24} />
        <Cyl rt={1.0} rb={1.0} h={0.07} p={[0, 1.28, 0]} m={wh} seg={24} />
        <Cyl rt={0.96} rb={0.96} h={0.05} p={[0, 1.34, 0]} m={wh2} seg={24} />
        <Ball rad={1.0} p={[0, 1.35, 0]} sc={[1, 0.8, 1]} m={wh} />
        <Cyl rt={0.2} rb={0.24} h={0.18} p={[0, 2.2, 0]} m={wh2} seg={12} />
        <Cyl rt={0.03} rb={0.1} h={0.32} p={[0, 2.43, 0]} m={M.gold} seg={8} />
        <Ball rad={0.07} p={[0, 2.64, 0]} m={M.gold} />
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.75, 0.3, 1.18]} scale={1.2}>
            <Box s={[0.34, 0.1, 0.4]} p={[0, -0.02, 0]} m={stone} cast={false} />
            <group position={[0, 0.03, 0]}><Lion m={M.mat('granite', 1, 1, { color: '#b5a791' })} /></group>
          </group>
        ))}
        {[-0.5, 0.5].map((x) => <Diyo key={x} p={[x, 0.36, 0.95]} />)}
      </group>
    );
  }

  /* ---------- Taleju (multi-roofed pagoda) rising tall behind the rear roof ---------- */
  function Taleju() {
    const M = useM();
    const rm = M.mat('roof', 3, 3, { color: TILE });
    const wd = M.plain('#3e2410', { roughness: 0.8 });
    const out = [];
    const y0 = 4.0; // dark timber storey starts inside the rear roof and rises above its ridge
    let y = y0;
    let ww = 3.4;
    const walls = [2.3, 1.15, 1.0, 0.9];
    walls.forEach((h, i) => {
      const nw = ww;
      out.push(<Box key={`w${i}`} s={[nw, h, nw]} p={[0, y + h / 2, 0]} m={wd} />);
      [0, 1, 2, 3].forEach((k) => {
        const a = k * Math.PI / 2;
        out.push(<LatticeWindow key={`lw${i}${k}`} p={[Math.sin(a) * (nw / 2), y + h / 2, Math.cos(a) * (nw / 2)]} r={a} w={nw * 0.7} h={h * 0.62} bars={5} />);
      });
      out.push(<EaveStruts key={`st${i}`} w={nw} d={nw} y={y + h - 0.02} n={3} h={0.55} />);
      out.push(<Roof key={`r${i}`} w={nw + 1.5} d={nw + 1.5} h={0.7} y={y + h - 0.1} m={rm} />);
      y += h + 0.15;
      ww = nw * 0.8;
    });
    out.push(<Box key="top" s={[ww, 0.5, ww]} p={[0, y + 0.25, 0]} m={wd} />);
    out.push(<Roof key="rtop" w={ww + 1.1} d={ww + 1.1} h={0.55} y={y + 0.45} m={M.gold} />);
    out.push(<Gajur key="gj" y={y + 0.95} s={0.9} />);
    return (
      <group position={[0, 0, -8]}>
        {out}
      </group>
    );
  }

  /* lantern turret at the north end of the entrance wing: 1.8 square, 2-tier roof */
  function Turret() {
    const M = useM();
    const rm = M.mat('roof', 2, 2, { color: TILE });
    const bm = brickMatC(1.5, 1.5);
    const y0 = H + 0.2;
    return (
      <group position={[5.6, 0, 7.2]}>
        <Box s={[1.8, 1.7, 1.8]} p={[0, y0 + 0.85, 0]} m={bm} />
        {[0, 1, 2, 3].map((k) => <LatticeWindow key={k} p={[Math.sin(k * Math.PI / 2) * 0.91, y0 + 0.9, Math.cos(k * Math.PI / 2) * 0.91]} r={k * Math.PI / 2} w={0.8} h={0.8} bars={5} />)}
        <EaveStruts w={1.8} d={1.8} y={y0 + 1.68} n={3} h={0.5} />
        <Roof w={2.9} d={2.9} h={0.65} y={y0 + 1.62} m={rm} />
        <Box s={[1.1, 0.5, 1.1]} p={[0, y0 + 2.5, 0]} m={M.plain('#4a2c18', { roughness: 0.8 })} />
        {[0, 1, 2, 3].map((k) => <LatticeWindow key={`t${k}`} p={[Math.sin(k * Math.PI / 2) * 0.56, y0 + 2.5, Math.cos(k * Math.PI / 2) * 0.56]} r={k * Math.PI / 2} w={0.4} h={0.3} bars={3} detail={false} />)}
        <Roof w={1.95} d={1.95} h={0.5} y={y0 + 2.72} m={rm} />
        <Cyl rt={0.012} rb={0.05} h={0.5} p={[0, y0 + 3.5, 0]} m={M.gold} seg={8} />
      </group>
    );
  }

  /* ---------- MAIN ---------- */
  function PatanMuseumMain() {
    const M = useM();
    const geo = useMemo(ringRoofGeo, []);
    const lat9 = useMemo(() => latMat(2 * O / 0.55, 1), []);
    const lat6 = useMemo(() => latMat(2 * I / 0.55, 1), []);
    const latS = useMemo(() => latMat(1, 1), []);
    const data = useMemo(() => {
      const acc = { frames: [], lats: [] };
      const struts = []; const beams = []; const bands = []; const grid = [];
      for (let k = 0; k < 4; k += 1) {
        [true, false].forEach((out) => {
          const L = out ? 2 * O : 2 * I;
          const zf = out ? O : I;
          const s = out ? 1 : -1;
          const P = (lx, y, dz) => face(k, lx, y, zf + s * dz, out);
          const n = out ? 7 : 5;
          const skip = (lx, small) => k === 0 && out && Math.abs(lx - DX) < (small ? 2.45 : 1.75);
          facadeUnits(P, L, n, out, skip, acc);
          // continuous dark carved-lattice bands at both upper floors, with posts
          [F1, F2].forEach((yb) => {
            const np = Math.round(L / 1.45);
            for (let i = 0; i <= np; i += 1) {
              const lx = -L / 2 + 0.3 + (i * (L - 0.6)) / np;
              if (k === 0 && out && Math.abs(lx - DX) < 2.4) continue;
              const q = P(lx, yb, 0.08);
              acc.frames.push([q[0], q[1], q[2], 0.1, 1.0, 0.16, q[3]]);
            }
            const b = P(0, yb, 0.05);
            bands.push({ p: b, L, a: b[3] });
          });
          // 2-3 rows of angled carved struts under the deep eaves
          const ns = Math.floor(L / 0.75);
          const stp = L / ns;
          for (let i = 0; i < ns; i += 1) {
            const lx = -L / 2 + (i + 0.5) * stp;
            if (k === 0 && out && Math.abs(lx - DX) < 2.4) continue;
            let q = P(lx, H - 0.5, 0.4);
            struts.push([q[0], q[1], q[2], 0.1, 0.9, 0.1, q[3], 0.7]);
            q = P(lx + stp / 2, H - 0.78, 0.26);
            struts.push([q[0], q[1], q[2], 0.08, 0.55, 0.08, q[3], 0.6]);
            if (i % 2 === 0) { q = P(lx, H - 0.95, 0.14); struts.push([q[0], q[1], q[2], 0.07, 0.35, 0.07, q[3], 0.5]); }
          }
          // dark tie bands between storeys and a deep dark fascia
          [[1.62, 0.14, 0.12], [3.12, 0.3, 0.14], [H - 0.18, 0.42, 0.26], [H - 0.55, 0.12, 0.2]].forEach(([y, h, d]) => {
            const q = P(0, y, d / 2 - 0.02);
            beams.push([q, [L, h, d], q[3]]);
          });
        });
      }
      // court paving joints
      for (let i = -5; i <= 5; i += 1) {
        grid.push([i * 1.1, 0.055, 0, 0.03, 0.01, 2 * I - 0.8]);
        grid.push([0, 0.055, i * 1.1, 2 * I - 0.8, 0.01, 0.03]);
      }
      return { ...acc, struts, beams, bands, grid };
    }, []);

    const wood = M.plain(WOOD, { roughness: 0.8 });
    const brickW = (rx) => brickMatC(rx, 3.4);
    const wingL = 2 * O;
    const stoneB = M.plain('#8d8274', { roughness: 0.95 });
    return (
      <group>
        {/* wide open brick court with a stone border */}
        <Box s={[2 * I, 0.05, 2 * I]} p={[0, 0.025, 0]} m={M.plain('#664a3a', { roughness: 0.95 })} cast={false} />
        <Box s={[2 * I - 0.8, 0.04, 2 * I - 0.8]} p={[0, 0.045, 0]} m={M.plain('#6e5242', { roughness: 0.95 })} cast={false} />
        <Inst items={data.grid} m={M.plain('#4f392d', { roughness: 0.95 })} />
        {/* four brick wings on a stone base course */}
        <Box s={[wingL + 0.2, 0.28, O - I + 0.1]} p={[0, 0.14, (O + I) / 2 + 0.05]} m={stoneB} />
        <Box s={[wingL + 0.2, 0.28, O - I + 0.1]} p={[0, 0.14, -(O + I) / 2 - 0.05]} m={stoneB} />
        <Box s={[O - I + 0.1, 0.28, 2 * I]} p={[(O + I) / 2 + 0.05, 0.14, 0]} m={stoneB} />
        <Box s={[O - I + 0.1, 0.28, 2 * I]} p={[-(O + I) / 2 - 0.05, 0.14, 0]} m={stoneB} />
        <Box s={[wingL, H, O - I]} p={[0, H / 2, (O + I) / 2]} m={brickW(8)} />
        <Box s={[wingL, H, O - I]} p={[0, H / 2, -(O + I) / 2]} m={brickW(8)} />
        <Box s={[O - I, H, 2 * I]} p={[(O + I) / 2, H / 2, 0]} m={brickW(6)} />
        <Box s={[O - I, H, 2 * I]} p={[-(O + I) / 2, H / 2, 0]} m={brickW(6)} />
        {/* tiled roof ring with deep eave fascia and ridge cap */}
        <mesh geometry={geo} material={M.mat('roof', 4, 4, { color: TILE })} castShadow receiveShadow />
        {[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([sx, sz], i) => {
          const A = O + 0.9; const C = I - 0.15; const R = (O + I) / 2 + 0.2;
          return (
            <group key={`rf${i}`}>
              <Box s={sx ? [0.1, 0.3, 2 * A] : [2 * A, 0.3, 0.1]} p={[sx * A, H + 0.03, sz * A]} m={wood} cast={false} />
              <Box s={sx ? [0.1, 0.3, 2 * C] : [2 * C, 0.3, 0.1]} p={[sx * C, H + 0.2, sz * C]} m={wood} cast={false} />
              <Box s={sx ? [0.18, 0.14, 2 * R + 0.2] : [2 * R + 0.2, 0.14, 0.18]} p={[sx * R, H + 1.0, sz * R]} m={M.plain('#a85a3a', { roughness: 0.9 })} cast={false} />
            </group>
          );
        })}
        {data.bands.map((b, i) => (
          <group key={`bd${i}`} position={[b.p[0], b.p[1], b.p[2]]} rotation={[0, b.a, 0]}>
            <Box s={[b.L - 0.2, 0.96, 0.1]} p={[0, 0, 0]} m={wood} cast={false} />
            <mesh position={[0, 0, 0.055]} material={b.L > 14 ? lat9 : lat6}><planeGeometry args={[b.L - 0.5, 0.82]} /></mesh>
          </group>
        ))}
        {data.beams.map(([p, s, a], i) => <Box key={`bm${i}`} s={s} p={[p[0], p[1], p[2]]} r={[0, a, 0]} m={wood} cast={false} />)}
        <Inst items={data.frames} m={wood} />
        <Inst items={data.lats} m={latS} kind="plane" />
        <Inst items={data.struts} m={wood} />
        {/* entrance */}
        <GoldDoor p={[DX, 0, O + 0.02]} />
        <GoldWindow p={[DX, 0, O + 0.04]} />
        <Turret />
        <Taleju />
        <Shrine />
        <pointLight position={[DX, 2.2, O + 2]} intensity={0.45} distance={7} color="#ffd9a0" />
        <Frame s={[2 * O + 2.6, 7.6, 2 * O + 3.4]} p={[0, 3.8, -1.6]} />
      </group>
    );
  }

  /* ---------- ENV ---------- */
  function Krishna({ p, r = 0 }) {
    const M = useM();
    const st = M.plain('#b3aa9a', { roughness: 0.9 });
    const dk = M.plain('#1d1712');
    return (
      <group position={p} rotation={[0, r, 0]}>
        <Box s={[3.6, 0.14, 3.6]} p={[0, 0.07, 0]} m={st} />
        <Box s={[3.2, 0.14, 3.2]} p={[0, 0.21, 0]} m={st} />
        <Box s={[2.6, 1.05, 2.6]} p={[0, 0.88, 0]} m={st} />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, k * Math.PI / 2, 0]}>
            {[-0.8, 0, 0.8].map((x) => <Box key={x} s={[0.55, 0.75, 0.05]} p={[x, 0.82, 1.31]} m={dk} cast={false} />)}
          </group>
        ))}
        <Box s={[2.9, 0.12, 2.9]} p={[0, 1.47, 0]} m={st} />
        <Box s={[1.9, 0.9, 1.9]} p={[0, 1.98, 0]} m={st} />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, k * Math.PI / 2, 0]}>
            {[-0.45, 0.45].map((x) => <Box key={x} s={[0.4, 0.5, 0.05]} p={[x, 1.98, 0.96]} m={dk} cast={false} />)}
          </group>
        ))}
        <Box s={[2.2, 0.1, 2.2]} p={[0, 2.48, 0]} m={st} />
        <Box s={[1.1, 0.7, 1.1]} p={[0, 2.88, 0]} m={st} />
        <Spire r0={0.55} h={1.6} y={3.23} m={st} />
        {[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z], i) => <Cyl key={i} rt={0.05} rb={0.14} h={0.5} p={[x * 0.95, 2.78, z * 0.95]} m={st} seg={8} />)}
        <Cyl rt={0.1} rb={0.13} h={1.8} p={[0, 0.9, 3.4]} m={st} seg={10} />
        <Ball rad={0.17} p={[0, 1.9, 3.4]} m={st} />
      </group>
    );
  }

  /* Mangal Hiti: stepped sunken brick tank in the paved square (hole in the platform, floor at -1.19) */
  const HX0 = -10.5; const HX1 = -3; const HZ0 = 10.5; const HZ1 = 15.5;
  function MangalHiti() {
    const M = useM();
    const br = M.plain('#8b3a2b', { roughness: 0.95 });
    const br2 = M.plain('#8a4632', { roughness: 0.95 });
    const stn = M.plain('#8a8174', { roughness: 0.95 });
    const cx = (HX0 + HX1) / 2; const cz = (HZ0 + HZ1) / 2;
    const w = HX1 - HX0; const d = HZ1 - HZ0;
    return (
      <group>
        <Box s={[w - 0.1, 0.06, d - 0.1]} p={[cx, -1.17, cz]} m={br2} cast={false} />
        {/* brick lining of the pit walls */}
        <Box s={[w, 1.2, 0.1]} p={[cx, -0.6, HZ0 + 0.05]} m={br} />
        <Box s={[w, 1.2, 0.1]} p={[cx, -0.6, HZ1 - 0.05]} m={br} />
        <Box s={[0.1, 1.2, d]} p={[HX0 + 0.05, -0.6, cz]} m={br} />
        <Box s={[0.1, 1.2, d]} p={[HX1 - 0.05, -0.6, cz]} m={br} />
        {/* descending steps on three sides */}
        {[1, 2].map((k) => (
          <group key={k}>
            <Box s={[1.0, 0.4 * (3 - k) + 0.01, d - 0.2 - (k - 1) * 2.0]} p={[HX0 + 0.5 + (k - 1) * 1.0, -1.19 + (0.4 * (3 - k) + 0.01) / 2 + 0.4 * (k - 1) * 0 , cz]} m={br2} />
            <Box s={[1.0, 0.4 * (3 - k) + 0.01, d - 0.2 - (k - 1) * 2.0]} p={[HX1 - 0.5 - (k - 1) * 1.0, -1.19 + (0.4 * (3 - k) + 0.01) / 2, cz]} m={br2} />
          </group>
        ))}
        <Box s={[w - 2.0, 0.5, 1.0]} p={[cx, -0.94, HZ0 + 0.55]} m={br2} />
        <Box s={[w - 0.4, 0.8, 0.9]} p={[cx, -0.79, HZ0 + 0.5 - 0.0]} m={br} cast={false} />
        {/* stone coping */}
        <Box s={[w + 0.8, 0.1, 0.4]} p={[cx, 0.03, HZ0 - 0.2]} m={stn} cast={false} />
        <Box s={[w + 0.8, 0.1, 0.4]} p={[cx, 0.03, HZ1 + 0.2]} m={stn} cast={false} />
        <Box s={[0.4, 0.1, d]} p={[HX0 - 0.2, 0.03, cz]} m={stn} cast={false} />
        <Box s={[0.4, 0.1, d]} p={[HX1 + 0.2, 0.03, cz]} m={stn} cast={false} />
      </group>
    );
  }

  function PatanMuseumEnv() {
    const M = useM();
    const plat = M.plain('#645b52', { roughness: 0.95 });
    const paver = M.plain('#6c5d4f', { roughness: 0.95 });
    const joint = M.plain('#54463a', { roughness: 0.95 });
    const strip = M.plain('#6e3427', { roughness: 0.95 });
    const slab = (x0, x1, z0, z1, m) => <Box s={[x1 - x0, 1.19, z1 - z0]} p={[(x0 + x1) / 2, -0.605, (z0 + z1) / 2]} m={m} cast={false} />;
    const pav = (x0, x1, z0, z1) => <Box s={[x1 - x0, 0.03, z1 - z0]} p={[(x0 + x1) / 2, 0.015, (z0 + z1) / 2]} m={paver} cast={false} />;
    const lines = useMemo(() => {
      const a = [];
      for (let x = -26; x <= 26; x += 1.6) if (x < HX0 - 0.2 || x > HX1 + 0.2) a.push([x, 0.032, 19.2, 0.04, 0.008, 21.6]);
      for (let z = 8.6; z <= 29.8; z += 1.6) {
        if (z > HZ0 - 0.5 && z < HZ1 + 0.5) { a.push([(-26 + HX0) / 2, 0.032, z, HX0 + 26, 0.008, 0.04]); a.push([(HX1 + 26) / 2, 0.032, z, 26 - HX1, 0.008, 0.04]); } else a.push([0, 0.032, z, 52, 0.008, 0.04]);
      }
      return a;
    }, []);
    const strips = useMemo(() => {
      const a = [];
      for (let z = 10; z <= 29; z += 3.2) a.push([0, 0.036, z, 52, 0.01, 0.34]);
      for (let x = -24; x <= 24; x += 6.4) a.push([x, 0.036, 19.5, 0.34, 0.01, 21]);
      return a;
    }, []);
    const skyM = useMemo(() => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, '#5f7088'); gr.addColorStop(0.5, '#8794a4'); gr.addColorStop(0.85, '#aeb0ae'); gr.addColorStop(1, '#9b9488');
      g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ map: t, side: THREE.BackSide, roughness: 1, fog: false, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.55 });
    }, []);
    const kr = [-21, 0, 21];
    const hs = useMemo(() => {
      // continuous ring of 3-4 storey brick houses, instanced
      const walls = [[], [], []]; const roofs = []; const wins = []; const bands = [];
      let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      [[30, 4.2], [37, 4.8], [44, 5.4]].forEach(([r, wd], ri) => {
        const n = Math.floor((2 * Math.PI * r) / wd);
        for (let i = 0; i < n; i += 1) {
          const ang = (i / n) * Math.PI * 2 + ri * 0.3;
          const x = Math.cos(ang) * r; const z = Math.sin(ang) * r;
          if (Math.abs(x) < 29 && z > 6) continue;
          const yaw = Math.atan2(-x, -z);
          const w = wd * (0.92 + rnd() * 0.08); const st = 3 + Math.floor(rnd() * 2); const h = st * 1.55 + 0.4; const d = 3.6;
          walls[Math.floor(rnd() * 3)].push([x, h / 2 - 0.0, z, w, h, d, yaw]);
          const sl = 0.5;
          [-1, 1].forEach((sg) => {
            const ox = Math.sin(yaw) * 0 + Math.cos(yaw) * 0; // slab centred over the house, tilted around local x
            roofs.push([x + Math.sin(yaw) * sg * d * 0.22, h + 0.45, z + Math.cos(yaw) * sg * d * 0.22, w + 0.8, 0.14, d * 0.62, yaw, -sg * sl * 0.6]);
          });
          for (let f = 0; f < st; f += 1) {
            const fy = 0.5 + f * 1.55 + 0.6;
            [-0.28, 0.28].forEach((u) => {
              const lx = u * w; const lz = d / 2 + 0.03;
              wins.push([x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, fy + 0.2, z - Math.sin(yaw) * lx + Math.cos(yaw) * lz, 0.7, 0.75, 0.06, yaw]);
            });
            if (f > 0) { const lz = d / 2 + 0.04; bands.push([x + Math.sin(yaw) * lz, f * 1.55 + 0.45, z + Math.cos(yaw) * lz, w * 0.96, 0.22, 0.1, yaw]); }
          }
        }
      });
      return { walls, roofs, wins, bands };
    }, []);
    const ring = (n, r0, ph, tints, base) => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + ph;
      const x = Math.cos(a) * r0; const z = Math.sin(a) * r0;
      if (Math.hypot(x - kr[0], z - kr[2]) < 8 || (x > HX0 - 3 && x < HX1 + 3 && z > HZ0 - 3 && z < HZ1 + 3)) return null;
      if (Math.abs(x) < 28 && z > 9 && z < 31) return null;
      return (
        <NewarHouse key={`${base}${i}`} p={[x / 1.5, 0, z / 1.5]} r={Math.atan2(-Math.cos(a), -Math.sin(a))} w={1.9 + (i % 3) * 0.4} d={1.6} storeys={i % 5 === 2 ? 2 : 3}
          tint={tints[i % tints.length]} plaster={i % 7 === 3} detail={i % 2 === 0} shop={false} />
      );
    });
    // palace frontage continuing the entrance wing to both sides, same height, brick and tile
    const ext = useMemo(() => {
      const acc = { frames: [], lats: [] };
      [1, -1].forEach((sg) => {
        const cx = sg * (O + 4.9);
        const P = (lx, y, dz) => [cx + lx, y, O + dz, 0];
        facadeUnits(P, 8.6, 4, true, () => false, acc);
      });
      return acc;
    }, []);
    const wood = M.plain(WOOD, { roughness: 0.8 });
    const latE = useMemo(() => latMat(1, 1), []);
    const latE2 = useMemo(() => latMat(8.2 / 0.55, 1), []);
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow material={M.plain('#8f8577', { roughness: 1 })}><circleGeometry args={[110, 48]} /></mesh>
        {/* raised stone square with the Mangal Hiti cut into it */}
        {slab(-60, HX0, -60, 60, plat)}
        {slab(HX1, 60, -60, 60, plat)}
        {slab(HX0, HX1, HZ1, 60, plat)}
        {slab(HX0, HX1, -60, HZ0, plat)}
        {/* brick-paved plaza in front of the Golden Door */}
        {pav(-26, HX0, 8.6, 30)}{pav(HX1, 26, 8.6, 30)}{pav(HX0, HX1, HZ1, 30)}{pav(HX0, HX1, 8.6, HZ0)}
        <Inst items={lines} m={joint} />
        <Inst items={strips} m={strip} />
        {/* dim blue-grey sky dome */}
        <mesh material={skyM}><sphereGeometry args={[95, 24, 16]} /></mesh>
        <Box s={[52, 0.06, 0.5]} p={[0, 0.03, 30.2]} m={plat} cast={false} />
        <Box s={[0.5, 0.06, 21.6]} p={[-26.2, 0.03, 19.4]} m={plat} cast={false} />
        <Box s={[0.5, 0.06, 21.6]} p={[26.2, 0.03, 19.4]} m={plat} cast={false} />
        <MangalHiti />
        {/* rest of the palace frontage, level with the museum wing */}
        {[1, -1].map((sg) => {
          const cx = sg * (O + 4.9); const zc = (O + I) / 2;
          return (
            <group key={sg}>
              <Box s={[8.6, 0.28, O - I + 0.1]} p={[cx, 0.14, zc + 0.05]} m={M.plain('#8d8274', { roughness: 0.95 })} />
              <Box s={[8.6, H, O - I]} p={[cx, H / 2, zc]} m={brickMatC(4.4, 3.4)} />
              <group position={[cx, 0, zc]}><Roof w={9.6} d={O - I + 1.8} h={0.95} y={H + 0.15} m={M.mat("roof", 3, 3, { color: TILE })} sag={1.1} lift={0.08} fascia={false} /></group>
              <Box s={[8.6, 0.1, 0.1]} p={[cx, 1.62, O + 0.04]} m={wood} cast={false} />
              <Box s={[8.6, 0.1, 0.1]} p={[cx, 2.95, O + 0.04]} m={wood} cast={false} />
              <Box s={[8.6, 0.22, 0.2]} p={[cx, H - 0.12, O + 0.08]} m={wood} cast={false} />
            </group>
          );
        })}
        {[1, -1].map((sg) => [F1, F2].map((yb) => (
          <group key={`eb${sg}${yb}`} position={[sg * (O + 4.9), yb, O + 0.05]}>
            <Box s={[8.4, 0.96, 0.1]} m={wood} cast={false} />
            <mesh position={[0, 0, 0.055]} material={latE2}><planeGeometry args={[8.2, 0.82]} /></mesh>
          </group>
        )))}
        <Inst items={ext.frames} m={wood} />
        <Inst items={ext.lats} m={latE} kind="plane" />
        {/* Krishna Mandir across the square, facing the palace, visible at the left edge */}
        <group position={kr} scale={1.5}><Krishna p={[0, 0, 0]} r={Math.PI} /></group>
        <Inst items={hs.walls[0]} m={M.plain('#6e3a2e', { roughness: 0.95 })} />
        <Inst items={hs.walls[1]} m={M.plain('#7d5240', { roughness: 0.95 })} />
        <Inst items={hs.walls[2]} m={M.plain('#8a7c68', { roughness: 0.95 })} />
        <Inst items={hs.roofs} m={M.plain('#7a5a44', { roughness: 0.9 })} />
        <Inst items={hs.wins} m={M.plain('#2a180d', { roughness: 0.9 })} />
        <Inst items={hs.bands} m={M.plain('#3a2312', { roughness: 0.9 })} />
      </group>
    );
  }

  return { 'patan-museum': { Main: PatanMuseumMain, Env: PatanMuseumEnv } };
}
