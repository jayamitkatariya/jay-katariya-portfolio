import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, extend, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  interactionGroups,
  type RapierRigidBody,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import { CARD_H, CARD_W, SEAL, drawHolo, drawSealInk } from './cardFace';
import {
  ANCHOR_X,
  ANCHOR_Y,
  ATTACH_X,
  CAMERA,
  CARD,
  CLAMP,
  CLIP_Y,
  CRIMP,
  RING,
  SEG_LEN,
  restCardY,
  strapPoints,
} from './badgeRig';

// Phones / tablets: cheaper GPU settings (no MSAA, lower dpr, less anisotropy, no iridescence)
const LOW_POWER =
  typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);

// Real-time 3D lanyard badge: rapier rope joints + meshline straps + a
// rounded, clearcoated card with a live holographic seal.

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}

type Body = RapierRigidBody & { lerped?: THREE.Vector3 };
type BodyRef = RefObject<Body | null>;

const SEGMENT = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 3, linearDamping: 3 } as const;
// Strap joints only need mass, not contact: their balls overlap at the clip (and along the V),
// and letting them collide fights the joints every step — that was the jitter at the joint.
const GHOST = interactionGroups(1, []);
const MAX_DT = 1 / 30; // resuming from a paused frameloop must not feed a huge step into the smoothing
const FACE_PULL = 14; // how strongly the card turns back toward the viewer
const MAX_THROW = 14; // cap release speed so a hard fling can't launch the card off the stage
const Z = new THREE.Vector3(0, 0, 1);

// canvas px → card-local units
const toCardX = (px: number) => (px / CARD_W) * CARD.w - CARD.w / 2;
const toCardY = (py: number) => CARD.h / 2 - (py / CARD_H) * CARD.h;

export type Entrance = 'drop' | 'rest';

interface Textures {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  strap: HTMLCanvasElement;
}

interface Strap {
  fixed: BodyRef;
  joints: [BodyRef, BodyRef, BodyRef];
  band: RefObject<THREE.Mesh | null>;
  curve: THREE.CatmullRomCurve3;
  side: -1 | 1;
}

function useStrap(card: BodyRef, side: -1 | 1): Strap {
  const fixed = useRef<Body>(null);
  const j1 = useRef<Body>(null);
  const j2 = useRef<Body>(null);
  const j3 = useRef<Body>(null);
  const band = useRef<THREE.Mesh>(null);
  const [curve] = useState(() => {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    c.curveType = 'chordal';
    return c;
  });
  useRopeJoint(fixed as any, j1 as any, [[0, 0, 0], [0, 0, 0], SEG_LEN]);
  useRopeJoint(j1 as any, j2 as any, [[0, 0, 0], [0, 0, 0], SEG_LEN]);
  useRopeJoint(j2 as any, j3 as any, [[0, 0, 0], [0, 0, 0], SEG_LEN]);
  useSphericalJoint(j3 as any, card as any, [[0, 0, 0], [side * ATTACH_X, CLIP_Y, 0]]);
  return { fixed, joints: [j1, j2, j3], band, curve, side };
}

// Strap width along the ribbon (0 = crimp end): it gathers to a narrow tuck so both ends fit
// inside the crimp, instead of full-width flat cuts poking out its sides and bottom.
const TUCK = 0.36;
const strapWidth = (p: number) => {
  const t = Math.min(1, p / 0.09);
  return TUCK + (1 - TUCK) * t * t * (3 - 2 * t);
};

function updateStrap(s: Strap, dt: number, cardObj: THREE.Object3D) {
  const [j1, j2, j3] = s.joints;
  if (!s.fixed.current || !j1.current || !j2.current || !j3.current || !s.band.current) return;
  // smooth the middle joints so an over-pulled strap doesn't jitter
  for (const b of [j1.current, j2.current]) {
    const t = b.translation() as THREE.Vector3;
    if (!b.lerped) b.lerped = new THREE.Vector3().copy(t);
    const d = Math.max(0.1, Math.min(1, b.lerped.distanceTo(t)));
    b.lerped.lerp(t, Math.min(1, dt * (10 + d * 40)));
  }
  // Pin the end to the card as it's *drawn* (rapier interpolates the mesh between steps), not to
  // j3's raw step position — otherwise the strap slides around the crimp whenever the card moves.
  cardObj.updateWorldMatrix(true, false);
  s.curve.points[0].set(s.side * ATTACH_X, CLIP_Y, 0).applyMatrix4(cardObj.matrixWorld);
  s.curve.points[1].copy(j2.current.lerped!);
  s.curve.points[2].copy(j1.current.lerped!);
  s.curve.points[3].copy(s.fixed.current.translation() as THREE.Vector3);
  (s.band.current.geometry as any).setPoints(s.curve.getPoints(40), strapWidth);
}

function StrapBodies({ strap, cardX, cardY }: { strap: Strap; cardX: number; cardY: number }) {
  // joints start on the straight line to the card, so no constraint is violated on frame one
  const pts = strapPoints(strap.side, cardX, cardY);
  return (
    <>
      <RigidBody ref={strap.fixed as any} {...SEGMENT} type="fixed" position={[strap.side * ANCHOR_X, 0, 0]} />
      {strap.joints.map((j, i) => (
        <RigidBody key={i} ref={j as any} {...SEGMENT} position={[pts[i][0], pts[i][1], 0]}>
          <BallCollider args={[0.1]} collisionGroups={GHOST} />
        </RigidBody>
      ))}
    </>
  );
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function useCardGeometry() {
  return useMemo(() => {
    const shape = roundedRect(CARD.w, CARD.h, CARD.r);
    const face = new THREE.ShapeGeometry(shape, 16);
    // ShapeGeometry's UVs are raw positions; remap to 0..1 over the card so the artwork fills it
    const pos = face.attributes.position;
    const uv = face.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / CARD.w + 0.5, pos.getY(i) / CARD.h + 0.5);
    const back = face.clone().rotateY(Math.PI);
    const eps = 0.0008;
    face.translate(0, 0, CARD.d / 2 + eps);
    back.translate(0, 0, -CARD.d / 2 - eps);
    // only the extrusion's side walls are drawn (its caps are hidden under the printed faces)
    const edge = new THREE.ExtrudeGeometry(shape, { depth: CARD.d, bevelEnabled: false, curveSegments: 16 }).translate(0, 0, -CARD.d / 2);
    const clamp = new RoundedBoxGeometry(CLAMP.w, CLAMP.h, CARD.d + 0.034, 3, 0.012);
    const crimp = new RoundedBoxGeometry(CRIMP.w, CRIMP.h, CRIMP.d, 3, 0.02);
    return { face, back, edge, clamp, crimp };
  }, []);
}

function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 320;
    const g = c.getContext('2d')!;
    // opaque base: an alphaMap reads color, and WebGL un-premultiplies a transparent canvas into a hard edge
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    // shadowBlur is supported everywhere (canvas filters aren't): draw the shape offscreen, keep its blur
    g.shadowColor = '#fff'; // alphaMap samples the green channel
    g.shadowBlur = 26;
    g.shadowOffsetX = 1000;
    g.fillStyle = '#fff';
    g.beginPath();
    g.roundRect(56 - 1000, 60, 144, 200, 12);
    g.fill();
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
}

interface BadgeProps {
  textures: Textures;
  entrance: Entrance;
  running: boolean;
  onReady: () => void;
  onSettle: () => void;
  onGrab: () => void;
}

function Badge({ textures, entrance, running, onReady, onSettle, onGrab }: BadgeProps) {
  const card = useRef<Body>(null);
  const cardObj = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const left = useStrap(card, -1);
  const right = useStrap(card, 1);
  const [dragged, setDragged] = useState<THREE.Vector3 | null>(null);
  const [hovered, setHovered] = useState(false);
  const { width, height } = useThree(s => s.size);
  const calm = useRef(0);
  // only start watching for rest once the card has actually moved; before rapier's
  // wasm steps, velocity reads 0 and would look "settled" mid-air
  const armed = useRef(false);
  const shown = useRef(false);
  const thrown = useRef(0);

  // Spawn pose, decided once. 'drop' falls in from above the fold with a twist;
  // 'rest' starts exactly where the static placeholder was drawn, with a nudge.
  const [spawn] = useState(() =>
    entrance === 'drop'
      ? { x: 0.45, y: 0.4, lin: [0, -2, 0] as [number, number, number], ang: [0, 7, 0.6] as [number, number, number] }
      : { x: 0, y: restCardY(), lin: [1.6, 0, 0] as [number, number, number], ang: [0, 1.2, 0] as [number, number, number] },
  );

  const v = useMemo(
    () => ({ vec: new THREE.Vector3(), dir: new THREE.Vector3(), ang: new THREE.Vector3(), n: new THREE.Vector3(), q: new THREE.Quaternion(), axis: new THREE.Vector3() }),
    [],
  );
  const geo = useCardGeometry();
  const shadowTex = useShadowTexture();

  const tex = useMemo(() => {
    const make = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = LOW_POWER ? 4 : 16;
      return t;
    };
    const strap = make(textures.strap);
    strap.wrapS = strap.wrapT = THREE.RepeatWrapping;
    const holo = make(drawHolo(512));
    holo.center.set(0.5, 0.5);
    return { front: make(textures.front), back: make(textures.back), strap, holo, sealInk: make(drawSealInk(512)) };
  }, [textures]);

  // a fresh wake (pointer back over the stage, scrolled back into view) re-arms the rest detector
  useEffect(() => {
    if (running) calm.current = 0;
  }, [running]);

  useEffect(() => {
    document.body.style.cursor = dragged ? 'grabbing' : hovered ? 'grab' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_DT);
    const { vec, dir, ang, n, q, axis } = v;
    const c = card.current;
    if (!c) return;
    if (!shown.current) {
      // first frame with a live body: only now may the static placeholder hand off
      shown.current = true;
      onReady();
    }
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      for (const s of [left, right]) [s.fixed, ...s.joints].forEach(r => r.current?.wakeUp());
      c.wakeUp();
      c.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (cardObj.current) {
      updateStrap(left, dt, cardObj.current);
      updateStrap(right, dt, cardObj.current);
    }

    const r = c.rotation();
    q.set(r.x, r.y, r.z, r.w);
    n.copy(Z).applyQuaternion(q); // card's front normal in world space

    // Turn back toward the viewer: torque along n × +z. Unlike an Euler-angle pull this has
    // no flip at 90°, and it eases off near 180° so a flipped card lingers on its back a beat.
    if (!dragged && thrown.current > 0) {
      thrown.current--;
      const lv = c.linvel();
      const speed = Math.hypot(lv.x, lv.y, lv.z);
      if (speed > MAX_THROW) c.setLinvel({ x: (lv.x / speed) * MAX_THROW, y: (lv.y / speed) * MAX_THROW, z: (lv.z / speed) * MAX_THROW }, true);
    }

    ang.copy(c.angvel() as THREE.Vector3);
    if (!dragged) {
      axis.crossVectors(n, Z).multiplyScalar(FACE_PULL * dt);
      c.setAngvel({ x: ang.x + axis.x, y: ang.y + axis.y, z: ang.z }, true);
    }

    // foil: spin the rainbow with the viewing angle
    tex.holo.rotation = n.x * 3.2 - n.y * 2.2 + r.z * 2;

    // soft shadow on an imaginary wall behind, foreshortened as the card turns
    const p = c.translation();
    if (shadow.current) {
      shadow.current.position.set(p.x + 0.16, p.y - 0.24, -1.4);
      shadow.current.rotation.z = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
      shadow.current.scale.set(Math.max(0.12, Math.abs(n.z)), 1, 1);
    }

    // report when everything has come to rest so the parent can stop rendering
    const lv = c.linvel();
    const energy = lv.x * lv.x + lv.y * lv.y + lv.z * lv.z + ang.lengthSq();
    if (energy > 0.05) armed.current = true;
    if (!armed.current) return;
    calm.current = !dragged && energy < 0.0006 ? calm.current + dt : 0;
    if (calm.current > 1.2) {
      calm.current = -Infinity; // fire once until woken again
      onSettle();
    }
  });

  const grab = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    calm.current = 0;
    onGrab();
    setDragged(new THREE.Vector3().copy(e.point).sub(v.vec.copy(card.current!.translation() as THREE.Vector3)));
  };
  const release = () => {
    calm.current = 0;
    thrown.current = 3; // body turns dynamic on the next render; cap its throw for a few frames
    setDragged(null);
  };

  const seal = { x: toCardX(SEAL.x), y: toCardY(SEAL.y), r: (SEAL.r / CARD_W) * CARD.w };
  const paper = { roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.22 };
  // matte black hardware (ties to the strap and the ink panel) with a gunmetal ring
  const hardware = { color: '#1c1c1c', metalness: 0.2, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 };
  const ring = { color: '#6b6b68', metalness: 1, roughness: 0.28, envMapIntensity: 2.5 };

  return (
    <>
      <mesh ref={shadow} position={[0, -10, -1.4]} renderOrder={-1}>
        <planeGeometry args={[CARD.w * 1.75, CARD.h * 1.55]} />
        <meshBasicMaterial color="#000" alphaMap={shadowTex} transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {/* drawn after the card and hardware in a fixed order, depth-tested but not depth-writing,
          so the two ribbons never z-fight where they overlap and still tuck under the crimp */}
      {[left, right].map(strap => (
        <mesh key={strap.side} ref={strap.band as any} renderOrder={strap.side === -1 ? 1 : 2}>
          <meshLineGeometry />
          <meshLineMaterial
            depthWrite={false}
            color="white"
            resolution={[width, height]}
            useMap
            map={tex.strap}
            repeat={[-3, 1]}
            lineWidth={0.9}
          />
        </mesh>
      ))}

      <group position={[0, ANCHOR_Y, 0]}>
        <StrapBodies strap={left} cardX={spawn.x} cardY={spawn.y} />
        <StrapBodies strap={right} cardX={spawn.x} cardY={spawn.y} />
        <RigidBody
          ref={card as any}
          {...SEGMENT}
          position={[spawn.x, spawn.y, 0]}
          linearVelocity={spawn.lin}
          angularVelocity={spawn.ang}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[CARD.w / 2, CARD.h / 2, CARD.d / 2]} />
          <group
            ref={cardObj}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerDown={grab}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
          >
            <mesh geometry={geo.face}>
              <meshPhysicalMaterial map={tex.front} {...paper} />
            </mesh>
            <mesh geometry={geo.back}>
              <meshPhysicalMaterial map={tex.back} {...paper} />
            </mesh>
            <mesh geometry={geo.edge}>
              <meshBasicMaterial attach="material-0" visible={false} />
              <meshStandardMaterial attach="material-1" color="#cfcac0" roughness={0.6} />
            </mesh>

            {/* holographic seal: foil disc + printed ink layer */}
            <mesh position={[seal.x, seal.y, CARD.d / 2 + 0.002]}>
              <circleGeometry args={[seal.r, 48]} />
              <meshPhysicalMaterial map={tex.holo} metalness={0.35} roughness={0.22} clearcoat={1} iridescence={LOW_POWER ? 0 : 1} iridescenceIOR={1.5} envMapIntensity={2} />
            </mesh>
            <mesh position={[seal.x, seal.y, CARD.d / 2 + 0.003]}>
              <circleGeometry args={[seal.r, 48]} />
              <meshBasicMaterial map={tex.sealInk} transparent depthWrite={false} />
            </mesh>

            {/* clamp clip gripping the card's top edge, a swivel, and the ring the straps hook into */}
            <mesh geometry={geo.clamp} position={[0, CLAMP.y, 0]}>
              <meshPhysicalMaterial {...hardware} />
            </mesh>
            <mesh position={[0, CLAMP.y + CLAMP.h / 2 + 0.02, 0]}>
              <cylinderGeometry args={[0.025, 0.032, 0.05, 20]} />
              <meshStandardMaterial {...ring} />
            </mesh>
            <mesh position={[0, RING.y, 0]}>
              <torusGeometry args={[RING.r, RING.tube, 16, 48]} />
              <meshStandardMaterial {...ring} />
            </mesh>
            <mesh geometry={geo.crimp} position={[0, CRIMP.y, 0]}>
              <meshPhysicalMaterial {...hardware} />
            </mesh>
          </group>
        </RigidBody>
      </group>
    </>
  );
}

export default function IdBadge3D({
  textures,
  entrance,
  active,
  onReady,
  onGrab,
  onLost,
}: {
  textures: Textures;
  entrance: Entrance;
  active: boolean; // in view + tab visible
  onReady: () => void;
  onGrab: () => void;
  onLost: () => void;
}) {
  const [awake, setAwake] = useState(true);
  const running = active && awake;
  const wrap = useRef<HTMLDivElement>(null);
  const holding = useRef(false);

  // The stage lets the page scroll vertically on touch (pan-y), except when a touch lands on
  // the card: R3F's pointerdown runs first and flags it, then we cancel the touch's scroll.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const block = (e: TouchEvent) => holding.current && e.cancelable && e.preventDefault();
    const end = () => (holding.current = false);
    el.addEventListener('touchstart', block, { passive: false });
    el.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      el.removeEventListener('touchstart', block);
      el.removeEventListener('touchmove', block);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);

  return (
    <div
      ref={wrap}
      // pinch-zoom stays allowed; vertical pans scroll the page unless the touch grabbed the card
      className="absolute inset-0 touch-pan-y touch-pinch-zoom"
      data-cursor-hover
      role="img"
      aria-label="jay katariya's id badge, hanging from a lanyard. drag it to swing it around."
      onPointerDown={() => setAwake(true)}
      onPointerMove={() => !awake && setAwake(true)}
    >
      <Canvas
        camera={{ position: [0, CAMERA.y, CAMERA.z], rotation: [0, 0, 0], fov: CAMERA.fov }} // explicit rotation: R3F would otherwise lookAt(0,0,0) and tilt the view
        dpr={LOW_POWER ? [1, 1.5] : [1, 2]}
        flat // no tone mapping: the printed card keeps its true ink/paper values
        gl={{ alpha: true, antialias: !LOW_POWER }}
        frameloop={running ? 'always' : 'demand'}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onLost, { once: true })}
      >
        {/* calibrated so the paper renders at its printed tone; the env adds sheen, not exposure */}
        <ambientLight intensity={Math.PI * 0.5} />
        <directionalLight position={[-3, 4, 6]} intensity={Math.PI * 0.2} />
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60} paused={!running}>
          <Badge
            textures={textures}
            entrance={entrance}
            running={running}
            onReady={onReady}
            onSettle={() => setAwake(false)}
            onGrab={() => {
              holding.current = true;
              onGrab();
            }}
          />
        </Physics>
        <Environment resolution={LOW_POWER ? 128 : 256} environmentIntensity={0.45}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={4} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}
