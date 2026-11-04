/* Dhanusha Dham (Dhanush Mandir), Dhanushadham, Madhesh: a modest modern Terai village shrine. A long low yellow/red/blue compound wall with big blue
   Devanagari Sita-Ram panels and a small central gate with a tiny pale-yellow dome; behind it a long open-sided hall (grey low roof, white walls, row of
   small ventilator windows) sheltering a sunken strip of dark fossil "bow" rock edged by red kerbs; one giant peepal behind. Flat dry Terai setting.
   Layout and dimensions are estimates from six photographs (1 unit ~ 5 m). Front = +z. */
export default function make(K) {
  const { useM, Box, Cyl, Ball, Frame, THREE, useMemo } = K;

  const rn = (i) => { const v = Math.sin(i * 12.9898 + 7.3) * 43758.5453; return v - Math.floor(v); };

  /* ---------- helpers ---------- */
  const dummy = new THREE.Object3D();
  function Inst({ geo = 'box', mat, items, cast = false, seg }) {
    const setRef = (im) => {
      if (!im) return;
      items.forEach((it, i) => {
        dummy.position.set(...it.p);
        dummy.rotation.set(...(it.r || [0, 0, 0]));
        dummy.scale.set(...(it.s || [1, 1, 1]));
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
    };
    return (
      <instancedMesh ref={setRef} args={[undefined, undefined, items.length]} material={mat} frustumCulled={false} castShadow={cast} receiveShadow>
        {geo === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {geo === 'sphere' && <sphereGeometry args={[1, seg || 10, 8]} />}
        {geo === 'rock' && <dodecahedronGeometry args={[1, 0]} />}
        {geo === 'cyl' && <cylinderGeometry args={[1, 1, 1, seg || 8]} />}
      </instancedMesh>
    );
  }
  function Limb({ a, b, r0, r1, m }) {
    const { pos, q, len } = useMemo(() => {
      const A = new THREE.Vector3(...a); const B = new THREE.Vector3(...b);
      const d = B.clone().sub(A); const l = d.length();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      return { pos: A.clone().add(B).multiplyScalar(0.5).toArray(), q: qq, len: l };
    }, [a.join(), b.join()]);
    return <mesh position={pos} quaternion={q} material={m} castShadow><cylinderGeometry args={[r1, r0, len, 8]} /></mesh>;
  }
  function useTex(w, h, draw) {
    return useMemo(() => {
      if (typeof document === 'undefined') return null;
      try {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        draw(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        return t;
      } catch (e) { return null; }
    }, []);
  }
  const DEVA = '"Nirmala UI","Mangal","Noto Sans Devanagari","Kokila",sans-serif';

  const YEL = '#f2c230', RED = '#c0392b', MAROON = '#8e2a2a', BLUE = '#2d6fb5', NAVY = '#3f4f6e';

  /* ================================================================ MAIN */
  function DhanushaMain() {
    const M = useM();
    const yel = M.plain(YEL, { roughness: 0.85 });
    const yelLt = M.plain('#f6d255', { roughness: 0.85 });
    const red = M.plain(RED, { roughness: 0.8 });
    const maroon = M.plain(MAROON, { roughness: 0.85 });
    const blue = M.plain(BLUE, { roughness: 0.8 });
    const navy = M.plain(NAVY, { roughness: 0.85 });
    const white = M.plain('#f3f1ea', { roughness: 0.9 });
    const roofG = M.plain('#4b4d52', { roughness: 0.9 });
    const dark = M.plain('#15110f', { roughness: 1 });
    const tile = M.plain('#d9d2bd', { roughness: 0.6 });
    const earth = M.plain('#6a6155', { roughness: 1 });
    const strip = M.plain('#8a7e6a', { roughness: 1 });
    const moss = M.plain('#4f5a3c', { roughness: 1 });
    const sand = M.plain('#b8a98a', { roughness: 1 });
    const silver = M.plain('#b8bcc2', { metalness: 0.7, roughness: 0.35 });
    const green = M.plain('#2e8b57', { roughness: 0.7 });
    const concrete = M.plain('#a9a79f', { roughness: 0.95 });
    const domeM = M.plain('#f0d37a', { roughness: 0.6 });
    const orange = M.plain('#e8861a', { roughness: 0.6 });
    const arch1 = M.plain('#d9a455', { roughness: 0.8 });
    const arch2 = M.plain('#4a2e18', { roughness: 1 });
    const bark = M.plain('#6b5a4a', { roughness: 1 });
    const leafA = M.plain('#2f5a2a', { roughness: 1 });
    const leafB = M.plain('#4a7e3c', { roughness: 1 });
    const leafC = M.plain('#274a24', { roughness: 1 });
    const leafD = M.plain('#3a6a30', { roughness: 1 });
    const bulb = <meshBasicMaterial color="#ffd27a" toneMapped={false} />;
    const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd592', toneMapped: false }), []);

    /* sita ram panel texture */
    const panelTex = useTex(1100, 400, (g, w, h) => {
      g.fillStyle = YEL; g.fillRect(0, 0, w, h);
      g.strokeStyle = RED; g.lineWidth = 14; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = BLUE; g.strokeStyle = BLUE; g.lineWidth = 7; g.font = `bold 270px ${DEVA}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('सीताराम', w / 2, h / 2 + 10); g.strokeText('सीताराम', w / 2, h / 2 + 10);
    });
    const welcomeTex = useTex(140, 500, (g, w, h) => {
      g.fillStyle = YEL; g.fillRect(0, 0, w, h);
      g.strokeStyle = RED; g.lineWidth = 7; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = '#2e8b57'; g.font = 'bold 74px Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      'WELCOME'.split('').forEach((ch, i) => g.fillText(ch, w / 2, 40 + i * 66));
    });
    const devaSignTex = useTex(140, 500, (g, w, h) => {
      g.fillStyle = YEL; g.fillRect(0, 0, w, h);
      g.strokeStyle = RED; g.lineWidth = 7; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = BLUE; g.font = `bold 100px ${DEVA}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['सी', 'ता', 'रा', 'म'].forEach((ch, i) => g.fillText(ch, w / 2, 66 + i * 122));
    });
    const hallSignTex = useTex(256, 96, (g, w, h) => {
      g.fillStyle = '#e8731f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff3d0'; g.font = `bold 62px ${DEVA}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('सीताराम', w / 2, h / 2 + 4);
    });
    const pm = panelTex ? new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.85 }) : yel;
    const wm = welcomeTex ? new THREE.MeshStandardMaterial({ map: welcomeTex, roughness: 0.8 }) : yel;
    const dm = devaSignTex ? new THREE.MeshStandardMaterial({ map: devaSignTex, roughness: 0.8 }) : yel;
    const hm = hallSignTex ? new THREE.MeshStandardMaterial({ map: hallSignTex, roughness: 0.8 }) : orange;

    /* ---- geometry data ---- */
    const WZ = 1.0;            // front wall centre z
    const WL = 3.8;            // wall half length
    const HL = 3.5;            // hall half length
    const HF = 0.4, HB = -0.88; // hall front / back z (pulled behind the wall)
    const SZ = -0.1;           // strip centre z
    const TX = -3.2;           // tree trunk x
    const WH = 0.73;           // front wall top
    const HH = 0.9;            // hall wall top
    const WY = 0.78;           // ventilator row height

    const winX = (i) => -3.2 + i * (6.4 / 14);
    const windowsDark = useMemo(() => {
      const a = [];
      for (let i = 0; i < 15; i += 1) { const x = winX(i); a.push({ p: [x, WY, HB - 0.003], s: [0.22, 0.085, 0.012] }); a.push({ p: [x, WY, HF + 0.003], s: [0.22, 0.085, 0.012] }); }
      for (let i = 0; i < 3; i += 1) { const z = -0.55 + i * 0.45; [-1, 1].forEach((sx) => a.push({ p: [sx * (HL + 0.003), WY, z], s: [0.012, 0.085, 0.22] })); }
      return a;
    }, []);
    const windowsWhite = useMemo(() => {
      const a = [];
      for (let i = 0; i < 15; i += 1) { const x = winX(i); a.push({ p: [x, WY, HB - 0.01], s: [0.19, 0.055, 0.01] }); if (![2, 6, 10, 13].includes(i)) a.push({ p: [x, WY, HF + 0.01], s: [0.19, 0.055, 0.01] }); }
      for (let i = 0; i < 3; i += 1) { const z = -0.55 + i * 0.45; [-1, 1].forEach((sx) => a.push({ p: [sx * (HL + 0.01), WY, z], s: [0.01, 0.055, 0.19] })); }
      return a;
    }, []);
    const windowsGlow = useMemo(() => [2, 6, 10, 13].map((i) => ({ p: [winX(i), WY, HF + 0.012], s: [0.19, 0.055, 0.01] })), []);

    const rocks = useMemo(() => {
      const a = []; const b = [];
      for (let i = 0; i < 70; i += 1) {
        const x = -3.0 + rn(i) * 6.0;
        const cl = rn(i * 3 + 1);
        if (cl < 0.2) continue;
        const z = SZ + (rn(i * 7 + 2) - 0.5) * 0.3;
        const it = { p: [x, 0.03, z], s: [0.1 + rn(i + 5) * 0.14, 0.035 + rn(i + 9) * 0.035, 0.06 + rn(i + 3) * 0.07], r: [0, rn(i) * 3, 0] };
        (rn(i + 40) < 0.3 ? b : a).push(it);
      }
      return { a, b };
    }, []);
    const posts = useMemo(() => {
      const a = [];
      for (let i = 0; i < 10; i += 1) { const x = -2.9 + i * 0.66; a.push([x, 0.17], [x, -0.37]); }
      return a;
    }, []);
    const shrubs = useMemo(() => {
      const a = [[], [], []];
      for (let i = 0; i < 14; i += 1) a[i % 3].push({ p: [1.2 + i * 0.185 + (rn(i) - 0.5) * 0.06, 0.1 + rn(i + 2) * 0.07, 1.36 + (rn(i + 4) - 0.5) * 0.1], s: [0.17 + rn(i + 6) * 0.08, 0.12 + rn(i + 8) * 0.07, 0.15] });
      return a;
    }, []);

    /* peepal crown: 5 irregular lobes of small leaf clusters with sky gaps between them */
    const lobes = useMemo(() => [
      { c: [-3.3, 3.55, -1.0], r: 1.2 }, { c: [-1.4, 3.75, -1.6], r: 1.05 }, { c: [-5.0, 3.35, -1.7], r: 1.0 },
      { c: [-2.7, 4.2, -2.5], r: 0.95 }, { c: [-0.1, 3.25, -0.9], r: 0.9 },
    ], []);
    const leaves = useMemo(() => {
      const a = []; const b = []; const c = []; const d = [];
      lobes.forEach((lb, li) => {
        for (let i = 0; i < 60; i += 1) {
          const k = li * 60 + i;
          const u = rn(k * 3 + 1) * 2 - 1; const th = rn(k * 3 + 2) * Math.PI * 2; const rr = Math.cbrt(rn(k * 3 + 3));
          const sq = Math.sqrt(1 - u * u);
          const dx = sq * Math.cos(th) * rr; const dy = u * rr; const dz = sq * Math.sin(th) * rr;
          const y = Math.max(2.65, lb.c[1] + dy * lb.r * 0.65);
          const sz = 0.4 + rn(k + 50) * 0.3;
          const it = { p: [lb.c[0] + dx * lb.r * 1.25, y, lb.c[2] + dz * lb.r], s: [sz * 1.15, sz * 0.8, sz] };
          const t = rn(k + 90);
          if (dy < -0.4) d.push(it); else (t < 0.35 ? a : t < 0.7 ? b : c).push(it);
        }
      });
      return { a, b, c, d };
    }, []);

    return (
      <group scale={1.8}>
        <Frame s={[7.9, 2.0, 3.0]} p={[0, 1.0, -0.2]} />

        {/* ---------- front compound wall: red base, yellow field, blue trim, cornice ---------- */}
        <Box s={[WL * 2, 0.18, 0.1]} p={[0, 0.09, WZ]} m={red} />
        <Box s={[WL * 2, 0.46, 0.1]} p={[0, 0.41, WZ]} m={yel} />
        <Box s={[WL * 2, 0.04, 0.1]} p={[0, 0.66, WZ]} m={blue} />
        <Box s={[WL * 2 + 0.06, 0.05, 0.16]} p={[0, 0.705, WZ + 0.015]} m={yelLt} />
        <Box s={[WL * 2 + 0.06, 0.025, 0.17]} p={[0, 0.015, WZ + 0.015]} m={maroon} />
        {/* short wall return at each end, so the hall end walls stay visible */}
        {[-1, 1].map((sx) => <Box key={sx} s={[0.1, 0.7, 0.35]} p={[sx * WL, 0.35, WZ - 0.175]} m={yel} />)}
        {/* two big Sita Ram panels each side, framed by red pilasters */}
        {[-1, 1].map((sx) => [1.85, 3.05].map((x, i) => (
          <mesh key={sx + '-p' + i} position={[sx * x, 0.41, WZ + 0.052]} material={pm}><planeGeometry args={[1.1, 0.4]} /></mesh>
        )))}
        {[-1, 1].map((sx) => [0.62, 1.25, 2.45, 3.65].map((x, i) => (
          <group key={sx + '-' + i} position={[sx * x, 0, WZ + 0.06]}>
            <Box s={[0.12, 0.68, 0.05]} p={[0, 0.34, 0]} m={red} />
            <Box s={[0.07, 0.62, 0.06]} p={[0, 0.34, 0.005]} m={yelLt} />
            <Box s={[0.16, 0.04, 0.08]} p={[0, 0.7, 0]} m={red} />
          </group>
        )))}

        {/* ---------- gate shrine: yellow porch, round arch, small dome ---------- */}
        <group position={[0, 0, WZ + 0.12]}>
          <Box s={[1.04, 0.16, 0.54]} p={[0, 0.08, 0.08]} m={red} />
          <Box s={[1.0, 0.58, 0.5]} p={[0, 0.45, 0.08]} m={yel} />
          <Box s={[1.02, 0.04, 0.52]} p={[0, 0.74, 0.08]} m={blue} />
          {/* upper storey */}
          <Box s={[0.84, 0.2, 0.42]} p={[0, 0.86, 0.08]} m={yel} />
          <Box s={[0.2, 0.12, 0.02]} p={[0, 0.87, 0.295]} m={red} />
          <Box s={[0.15, 0.08, 0.02]} p={[0, 0.87, 0.3]} m={arch2} />
          <Box s={[1.1, 0.05, 0.58]} p={[0, 0.985, 0.08]} m={yelLt} />
          <Box s={[1.08, 0.025, 0.56]} p={[0, 1.02, 0.08]} m={blue} />
          {/* arch: red frame, light cream interior, darker deeper recess */}
          <Box s={[0.54, 0.4, 0.02]} p={[0, 0.2, 0.335]} m={red} />
          <mesh position={[0, 0.4, 0.335]} rotation={[Math.PI / 2, 0, 0]} material={red}><cylinderGeometry args={[0.27, 0.27, 0.02, 24]} /></mesh>
          <Box s={[0.46, 0.4, 0.02]} p={[0, 0.2, 0.347]} m={arch1} />
          <mesh position={[0, 0.4, 0.347]} rotation={[Math.PI / 2, 0, 0]} material={arch1}><cylinderGeometry args={[0.23, 0.23, 0.02, 24]} /></mesh>
          <Box s={[0.32, 0.36, 0.02]} p={[0, 0.18, 0.358]} m={arch2} />
          <mesh position={[0, 0.36, 0.358]} rotation={[Math.PI / 2, 0, 0]} material={arch2}><cylinderGeometry args={[0.16, 0.16, 0.02, 20]} /></mesh>
          {/* vertical signs on the piers */}
          <mesh position={[0.395, 0.34, 0.337]} material={wm}><planeGeometry args={[0.14, 0.5]} /></mesh>
          <mesh position={[-0.395, 0.34, 0.337]} material={dm}><planeGeometry args={[0.14, 0.5]} /></mesh>
          {/* drum, orange ring, dome, kalash, finial */}
          <Cyl rt={0.3} rb={0.3} h={0.05} p={[0, 1.07, 0.08]} m={orange} seg={20} />
          <Cyl rt={0.25} rb={0.27} h={0.1} p={[0, 1.145, 0.08]} m={yel} seg={16} />
          <mesh position={[0, 1.19, 0.08]} material={domeM} castShadow><sphereGeometry args={[0.26, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <Cyl rt={0.04} rb={0.06} h={0.08} p={[0, 1.49, 0.08]} m={orange} seg={8} />
          <Ball rad={0.05} p={[0, 1.56, 0.08]} m={M.gold} />
          <mesh position={[0, 1.7, 0.08]} material={M.gold}><coneGeometry args={[0.03, 0.24, 8]} /></mesh>
          {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.25, 0.68, 0.34]}><sphereGeometry args={[0.022, 8, 6]} />{bulb}</mesh>)}
          <pointLight position={[0, 0.5, 0.6]} intensity={1.6} distance={3.5} color="#ffb35a" />
        </group>

        {/* little orange-roofed mini shrine, right of the gate, between wall and hall */}
        <group position={[1.9, 0, 0.7]}>
          <Box s={[0.4, 0.62, 0.3]} p={[0, 0.31, 0]} m={white} />
          <mesh position={[0, 0.76, 0]} rotation={[0, Math.PI / 4, 0]} material={orange} castShadow><coneGeometry args={[0.36, 0.24, 4]} /></mesh>
          <Cyl rt={0.012} rb={0.012} h={0.12} p={[0, 0.94, 0]} m={M.gold} seg={6} />
        </group>

        {/* ---------- hall: maroon / navy / white bands, ventilator row ---------- */}
        {[[0, 0.1], [0.1, 0.26], [0.26, HH]].map(([y0, y1], i) => {
          const mm = [maroon, navy, white][i]; const h = y1 - y0; const yc = (y0 + y1) / 2;
          return (
            <group key={i}>
              <Box s={[HL * 2 + 0.06, h, 0.06]} p={[0, yc, HB]} m={mm} />
              {[-1, 1].map((sx) => <Box key={sx} s={[0.06, h, HF - HB + 0.06]} p={[sx * HL, yc, (HF + HB) / 2]} m={mm} />)}
              <Box s={[HL - 0.25, h, 0.06]} p={[-(HL + 0.25) / 2, yc, HF]} m={mm} />
              <Box s={[HL - 0.25, h, 0.06]} p={[(HL + 0.25) / 2, yc, HF]} m={mm} />
            </group>
          );
        })}
        <Inst mat={navy} items={windowsDark} />
        <Inst mat={white} items={windowsWhite} />
        <Inst mat={glow} items={windowsGlow} />
        {/* end door with grille and orange sign (east end) */}
        <Box s={[0.02, 0.4, 0.36]} p={[HL + 0.04, 0.22, -0.4]} m={dark} />
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[0.015, 0.4, 0.012]} p={[HL + 0.05, 0.22, -0.55 + i * 0.075]} m={silver} />)}
        <mesh position={[HL + 0.04, 0.58, 0.12]} rotation={[0, Math.PI / 2, 0]} material={hm}><planeGeometry args={[0.36, 0.14]} /></mesh>
        {/* roof: mid grey, low, set back behind the wall; opening around the trunk */}
        <Box s={[6.5, 0.025, HF + 0.1 - HB + 0.05]} p={[0.35, HH + 0.012, (HF + 0.1 + HB - 0.05) / 2]} m={roofG} />
        <Box s={[0.7, 0.025, HF + 0.1 - (SZ + 0.36)]} p={[-3.25, HH + 0.012, (HF + 0.1 + SZ + 0.36) / 2]} m={roofG} />
        <Box s={[0.7, 0.025, (SZ - 0.36) - (HB - 0.05)]} p={[-3.25, HH + 0.012, ((SZ - 0.36) + (HB - 0.05)) / 2]} m={roofG} />
        <Box s={[HL * 2 + 0.2, 0.04, 0.03]} p={[0, HH + 0.03, HF + 0.1]} m={white} />

        {/* floor: tiled walkways either side of the sunken strip */}
        <Box s={[HL * 2, 0.05, 0.31]} p={[0, 0.025, 0.245]} m={tile} />
        <Box s={[HL * 2, 0.05, 0.55]} p={[0, 0.025, -0.6]} m={tile} />
        <Box s={[WL * 2 - 0.1, 0.05, WZ - HF]} p={[0, 0.02, (WZ + HF) / 2]} m={tile} />
        {/* red kerbs */}
        {[0.08, -0.28].map((z, i) => <Box key={i} s={[6.2, 0.07, 0.035]} p={[0, 0.045, z]} m={red} />)}
        {[-1, 1].map((sx) => <Box key={sx} s={[0.035, 0.07, 0.36]} p={[sx * 3.1, 0.045, SZ]} m={red} />)}
        {/* strip ground, sand channel, dark fossil rocks */}
        <Box s={[6.2, 0.02, 0.36]} p={[0, 0.012, SZ]} m={strip} />
        <Box s={[5.2, 0.012, 0.07]} p={[-0.3, 0.026, SZ + 0.01]} m={sand} />
        <Inst geo="rock" mat={earth} items={rocks.a} />
        <Inst geo="rock" mat={moss} items={rocks.b} />
        {/* steps at the east end of the strip */}
        {[0, 1, 2].map((i) => <Box key={i} s={[0.12, 0.035 * (i + 1) + 0.04, 0.3]} p={[2.95 + i * 0.12, 0.02 + (0.035 * (i + 1)) / 2, 0.24]} m={tile} />)}
        {/* red posts on green bases + steel rails */}
        {posts.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl rt={0.03} rb={0.03} h={0.1} p={[0, 0.1, 0]} m={green} seg={10} />
            <Cyl rt={0.016} rb={0.016} h={0.78} p={[0, 0.49, 0]} m={maroon} seg={6} />
          </group>
        ))}
        {[0.17, -0.37].map((z) => [0.2, 0.12].map((y) => <Cyl key={z + '-' + y} rt={0.008} rb={0.008} h={6.0} p={[0, y, z]} r={[0, 0, Math.PI / 2]} m={silver} seg={6} />))}

        {/* ---------- the giant peepal: tall trunk, thick limbs, airy lobed crown ---------- */}
        <group>
          <Cyl rt={0.2} rb={0.36} h={2.4} p={[TX, 1.2, SZ]} m={bark} seg={14} />
          <Cyl rt={0.385} rb={0.41} h={0.7} p={[TX, 0.4, SZ]} m={red} seg={14} />
          {[0, 1, 2, 3, 4].map((k) => { const a = k * 1.26 + 0.4; return <Limb key={'rt' + k} a={[TX + Math.cos(a) * 0.12, 0.35, SZ + Math.sin(a) * 0.12]} b={[TX + Math.cos(a) * 0.6, 0.0, SZ + Math.sin(a) * 0.6]} r0={0.1} r1={0.04} m={bark} />; })}
          <Box s={[0.16, 0.1, 0.12]} p={[TX + 0.55, 0.1, SZ + 0.18]} m={white} />
          <mesh position={[TX + 0.55, 0.2, SZ + 0.18]} material={orange}><coneGeometry args={[0.11, 0.1, 4]} /></mesh>
          {lobes.map((lb, i) => (
            <group key={'lb' + i}>
              <Limb a={[TX, 1.9 + (i % 2) * 0.35, SZ]} b={[TX + (lb.c[0] - TX) * 0.55, 2.6, SZ + (lb.c[2] - SZ) * 0.55]} r0={0.17 - i * 0.012} r1={0.1} m={bark} />
              <Limb a={[TX + (lb.c[0] - TX) * 0.55, 2.6, SZ + (lb.c[2] - SZ) * 0.55]} b={[lb.c[0], lb.c[1] - 0.45, lb.c[2]]} r0={0.1} r1={0.05} m={bark} />
            </group>
          ))}
          <Limb a={[TX, 2.2, SZ]} b={[TX - 0.3, 3.4, SZ - 0.4]} r0={0.16} r1={0.08} m={bark} />
          <Inst geo="sphere" mat={leafA} items={leaves.a} cast />
          <Inst geo="sphere" mat={leafB} items={leaves.b} cast />
          <Inst geo="sphere" mat={leafD} items={leaves.c} cast />
          <Inst geo="sphere" mat={leafC} items={leaves.d} cast />
        </group>

        {/* ---------- forecourt details ---------- */}
        <Cyl rt={0.055} rb={0.05} h={0.14} p={[-0.52, 0.07, WZ + 0.45]} m={green} seg={12} />
        <Cyl rt={0.058} rb={0.058} h={0.02} p={[-0.52, 0.15, WZ + 0.45]} m={green} seg={12} />
        <Box s={[2.6, 0.06, 0.34]} p={[2.4, 0.03, 1.36]} m={concrete} />
        <Inst geo="sphere" mat={leafB} items={shrubs[0]} cast />
        <Inst geo="sphere" mat={leafA} items={shrubs[1]} cast />
        <Inst geo="sphere" mat={M.plain('#5f8f3c', { roughness: 1 })} items={shrubs[2]} cast />
      </group>
    );
  }

  /* ================================================================ ENV */
  function Field({ p, w, d, ry = 0, color, crop, rows = 10, Mx }) {
    const items = useMemo(() => Array.from({ length: rows }, (_, i) => ({ p: [0, 0.07, -d / 2 + (i + 0.5) * (d / rows)], s: [w * 0.96, 0.14, d / rows * 0.4] })), [w, d, rows]);
    return (
      <group position={p} rotation={[0, ry, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={color}><planeGeometry args={[w, d]} /></mesh>
        <Inst mat={crop} items={items} />
      </group>
    );
  }

  function DhanushaEnv() {
    const M = useM();
    const earth = M.plain('#879a56', { roughness: 1 });
    const grass = M.plain('#7f9a4a', { roughness: 1 });
    const concrete = M.plain('#b0aea6', { roughness: 0.95 });
    const pole = M.plain('#8a8a86', { roughness: 0.7 });
    const wire = M.plain('#222222');
    const trunk = M.plain('#5a4838', { roughness: 1 });
    const leaf = [M.plain('#4a7a38', { roughness: 1 }), M.plain('#5b8a42', { roughness: 1 }), M.plain('#3b6a30', { roughness: 1 })];
    const far = M.plain('#5f7a50', { roughness: 1 });
    const roofM = M.plain('#8a8d8f', { roughness: 0.9 });
    const win = M.plain('#2a3340', { roughness: 0.6 });
    const frameW = M.plain('#f1efe6', { roughness: 0.9 });
    const tank = M.plain('#2b4f86', { roughness: 0.7 });
    const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffcf86', toneMapped: false }), []);
    const fieldG = M.plain('#6f9a3a', { roughness: 1 });
    const fieldCrop = M.plain('#4f8a2e', { roughness: 1 });
    const fieldM = M.plain('#b9ad3a', { roughness: 1 });
    const fieldMc = M.plain('#d4c534', { roughness: 1 });
    const fieldB = M.plain('#8a7a4a', { roughness: 1 });
    const fieldBc = M.plain('#6f9a3a', { roughness: 1 });
    const wood = M.plain('#7a5a3a', { roughness: 0.9 });
    const shrubM = [M.plain('#4f8a3a', { roughness: 1 }), M.plain('#3f7430', { roughness: 1 })];
    const hazeTex = useTex(4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(214,218,212,0)'); gr.addColorStop(0.7, 'rgba(214,218,212,0.55)'); gr.addColorStop(1, 'rgba(214,218,212,0.9)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const hazeMat = hazeTex ? new THREE.MeshBasicMaterial({ map: hazeTex, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }) : null;

    const houses = useMemo(() => ([
      { p: [-16, -17], w: 2.2, d: 1.5, st: 1, c: '#bfe0e8', lit: 1 },
      { p: [-7, -26], w: 2.6, d: 1.6, st: 2, c: '#f3c9c9', lit: 0, tk: 1 },
      { p: [11, -19], w: 2.0, d: 1.5, st: 1, c: '#d4ecc4', lit: 1 },
      { p: [19, -8], w: 2.2, d: 1.6, st: 2, c: '#c8d6f2', lit: 1 },
      { p: [27, 3], w: 1.8, d: 1.4, st: 1, c: '#f5dc9a', lit: 0 },
      { p: [-24, -4], w: 2.0, d: 1.5, st: 1, c: '#e8bfd6', lit: 1 },
      { p: [3, -34], w: 2.4, d: 1.6, st: 1, c: '#b9dfc9', lit: 0 },
      { p: [-26, 12], w: 2.0, d: 1.4, st: 1, c: '#f1e2b8', lit: 1 },
      { p: [26, 15], w: 2.3, d: 1.5, st: 2, c: '#e6c3b3', lit: 1, tk: 1 },
      { p: [-14, -9], w: 1.7, d: 1.3, st: 1, c: '#cfe3f0', lit: 0 },
      { p: [15, -11], w: 1.8, d: 1.3, st: 1, c: '#f2d6e2', lit: 1 },
      { p: [-31, -16], w: 2.2, d: 1.5, st: 2, c: '#d8e8c0', lit: 0 },
      { p: [33, -10], w: 2.0, d: 1.5, st: 1, c: '#bcd0e6', lit: 1 },
    ]), []);
    const trees = useMemo(() => Array.from({ length: 24 }, (_, i) => {
      const a = rn(i * 5 + 1) * Math.PI * 2; const r = 15 + rn(i * 3 + 2) * 22;
      return { x: Math.cos(a) * r * 1.2, z: Math.sin(a) * r - 4, s: 1 + rn(i + 6) * 0.7, k: i % 3 };
    }).filter((t) => !(t.z > -2 && Math.abs(t.x) < 13)), []);
    const treeline = useMemo(() => Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2; const r = 60 + rn(i) * 6;
      return { p: [Math.cos(a) * r, 0.5, Math.sin(a) * r], s: [2.5 + rn(i + 3) * 2, 0.9 + rn(i + 9) * 0.6, 2.5 + rn(i + 5) * 2] };
    }), []);
    const bushes = useMemo(() => [[-9.5, 4.8], [-11, 5.6], [10, 5.2], [11.4, 4.4], [-18, 2], [20, 1.5], [-8, -6], [9, -7]].map(([x, z], i) => ({ p: [x, 0.35, z], s: [0.8 + rn(i) * 0.5, 0.5 + rn(i + 2) * 0.3, 0.7 + rn(i + 4) * 0.4] })), []);

    return (
      <group>
        <fog attach="fog" args={['#d6dad4', 45, 130]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={earth}><circleGeometry args={[62, 48]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} material={M.plain('#6f8f48', { roughness: 1 })}><ringGeometry args={[60, 130, 48]} /></mesh>
        {hazeMat && <mesh position={[0, 9, 0]} material={hazeMat}><cylinderGeometry args={[100, 100, 22, 40, 1, true]} /></mesh>}
        {/* modest concrete forecourt in front of the wall */}
        <Box s={[15, 0.03, 3.6]} p={[0, 0.005, 4.1]} m={concrete} cast={false} />
        {/* grass patches beside the forecourt */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-13, 0.0, 5]} material={grass}><circleGeometry args={[4.5, 24]} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0.0, 6]} material={grass}><circleGeometry args={[3.8, 24]} /></mesh>
        {/* crop fields: green wheat, yellow mustard, ploughed brown */}
        <Field p={[-21, 0, 15]} w={18} d={11} ry={0.1} color={fieldG} crop={fieldCrop} rows={12} />
        <Field p={[21, 0, 17]} w={17} d={10} ry={-0.12} color={fieldM} crop={fieldMc} rows={11} />
        <Field p={[-30, 0, -2]} w={11} d={12} ry={0.3} color={fieldB} crop={fieldBc} rows={10} />
        <Field p={[30, 0, -4]} w={10} d={13} ry={-0.2} color={fieldG} crop={fieldCrop} rows={10} />
        <Field p={[-6, 0, -20]} w={16} d={8} ry={0.05} color={fieldM} crop={fieldMc} rows={12} />
        <Field p={[12, 0, -28]} w={14} d={8} ry={-0.1} color={fieldG} crop={fieldCrop} rows={11} />
        {/* low shrubs */}
        <Inst geo="sphere" mat={shrubM[0]} items={bushes} cast />
        {/* a simple bench on the forecourt */}
        <group position={[-5.6, 0, 3.9]}>
          <Box s={[0.95, 0.06, 0.28]} p={[0, 0.27, 0]} m={wood} />
          <Box s={[0.95, 0.2, 0.04]} p={[0, 0.42, -0.13]} m={wood} />
          {[-0.4, 0.4].map((x) => <Box key={x} s={[0.06, 0.26, 0.24]} p={[x, 0.13, 0]} m={concrete} />)}
        </group>

        {/* slim pole at front-left; two crossarm poles and wires behind, parallel to the wall */}
        <Cyl rt={0.03} rb={0.045} h={3.0} p={[-8.0, 1.5, 3.6]} m={pole} seg={8} />
        <Box s={[0.5, 0.03, 0.03]} p={[-8.0, 2.8, 3.6]} m={pole} />
        {[-17, 2, 21].map((x, k) => (
          <group key={k}>
            <Cyl rt={0.04} rb={0.06} h={3.4} p={[x, 1.7, -9]} m={pole} seg={8} />
            <Box s={[0.05, 0.04, 0.7]} p={[x, 3.2, -9]} m={pole} />
            <Box s={[0.05, 0.04, 0.5]} p={[x, 2.85, -9]} m={pole} />
          </group>
        ))}
        {[-0.3, 0.3].map((dz, k) => <Limb key={k} a={[-17, 3.2, -9 + dz]} b={[21, 3.2, -9 + dz]} r0={0.006} r1={0.006} m={wire} />)}
        {[-0.2, 0.2].map((dz, k) => <Limb key={'b' + k} a={[-17, 2.85, -9 + dz]} b={[21, 2.85, -9 + dz]} r0={0.006} r1={0.006} m={wire} />)}

        {/* sparse plain village houses */}
        {houses.map((h, i) => {
          const H = 0.62 * h.st;
          return (
            <group key={i} scale={1.5} position={[h.p[0], 0, h.p[1]]} rotation={[0, Math.atan2(-h.p[0], 30 - h.p[1]) * 0.8, 0]}>
              <Box s={[h.w + 0.06, 0.1, h.d + 0.06]} p={[0, 0.05, 0]} m={concrete} />
              <Box s={[h.w, H, h.d]} p={[0, H / 2, 0]} m={M.plain(h.c, { roughness: 0.9 })} />
              <Box s={[h.w + 0.1, 0.05, h.d + 0.1]} p={[0, H + 0.025, 0]} m={roofM} />
              <Box s={[h.w + 0.04, 0.1, h.d + 0.04]} p={[0, H + 0.1, 0]} m={M.plain(h.c, { roughness: 0.9 })} />
              {h.tk && <Cyl rt={0.2} rb={0.2} h={0.32} p={[h.w * 0.25, H + 0.31, 0]} m={tank} seg={10} />}
              {Array.from({ length: h.st }).map((_, s) => [-0.5, 0.2].map((fx, k) => (
                <group key={s + '-' + k} position={[fx * h.w * 0.8, 0.38 + s * 0.62, h.d / 2 + 0.005]}>
                  <Box s={[0.28, 0.32, 0.015]} p={[0, 0, 0]} m={frameW} cast={false} />
                  <Box s={[0.22, 0.26, 0.02]} p={[0, 0, 0.004]} m={h.lit && (s + k) % 2 === 0 ? glow : win} cast={false} />
                </group>
              )))}
              <Box s={[0.28, 0.45, 0.02]} p={[h.w * 0.32, 0.23, h.d / 2 + 0.005]} m={win} cast={false} />
            </group>
          );
        })}
        {/* leafy field-edge trees */}
        {trees.map((t, i) => (
          <group key={i} position={[t.x, 0, t.z]} scale={t.s * 1.3}>
            <Cyl rt={0.07} rb={0.12} h={1.0} p={[0, 0.5, 0]} m={trunk} seg={6} />
            <Ball rad={0.9} p={[0, 1.7, 0]} sc={[1, 0.8, 1]} m={leaf[t.k]} />
            <Ball rad={0.65} p={[0.6, 1.4, 0.2]} m={leaf[(t.k + 1) % 3]} />
            <Ball rad={0.6} p={[-0.55, 1.5, -0.2]} m={leaf[(t.k + 2) % 3]} />
          </group>
        ))}
        {/* hazy treeline on the flat horizon */}
        <Inst geo="sphere" mat={far} items={treeline} seg={8} />
      </group>
    );
  }

  return { 'dhanusha-dham': { Main: DhanushaMain, Env: DhanushaEnv } };
}
