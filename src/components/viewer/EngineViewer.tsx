import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { torqueById } from '../../data/torque';
import { procedures } from '../../data/procedures';

export interface PartMeta {
  label: string;
  desc: string;
  torqueId?: string;
}

export const PART_META: Record<string, PartMeta> = {
  engineBlock: { label: 'Engine Block', desc: 'Cast block with four bores. Deck surface must be flat and clean before the new MLS gasket goes on.' },
  oilPan: { label: 'Oil Pan', desc: 'Stamped steel sump. 5.0 L fill with filter on EC1/EC3.', torqueId: 'tq-oil-drain' },
  headGasket: { label: 'Head Gasket (MLS)', desc: 'Multi-layer steel gasket. One-time use — never reuse. Verify grade for EC1 vs EC3.', torqueId: 'tq-head-bolts' },
  cylinderHead: { label: 'Cylinder Head', desc: 'DOHC aluminum head with VVT phasers. Lift straight off the dowels; check flatness before refit.', torqueId: 'tq-head-bolts' },
  headBolts: { label: 'Head Bolts (TTY)', desc: 'Torque-to-yield bolts. New set every time, 3-step torque-plus-angle in sequence.', torqueId: 'tq-head-bolts' },
  valveCover: { label: 'Cylinder Head Cover', desc: 'Composite cover with integrated PCV. Always fit a new gasket.', torqueId: 'tq-valve-cover' },
  valveCoverBolts: { label: 'Cover Bolts', desc: 'Perimeter fasteners — snug in sequence, do not overtighten the composite cover.', torqueId: 'tq-valve-cover' },
  camIntake: { label: 'Intake Camshaft + Phaser', desc: 'Intake cam with VVT phaser. Lock at TDC before chain removal.', torqueId: 'tq-cam-caps' },
  camExhaust: { label: 'Exhaust Camshaft + Phaser', desc: 'Exhaust cam with VVT phaser. Verify timing marks on refit.', torqueId: 'tq-cam-caps' },
  timingCover: { label: 'Timing Cover', desc: 'Front cover sealed with RTV. Replace the front crank seal while it is off.', torqueId: 'tq-timing-cover' },
  timingChain: { label: 'Timing Chain + Guides', desc: 'Chain, tensioner arm and guides. Replace as a set on high-mileage engines.' },
  crankPulley: { label: 'Crankshaft Pulley', desc: 'Harmonic balancer. New bolt, torque plus angle, crank held — never rotated freely.', torqueId: 'tq-crank-pulley' },
  driveBelt: { label: 'Accessory / eTorque Belt', desc: 'Serpentine belt. Note routing before removal; seat every rib.' },
  idlerPulley: { label: 'Idler Pulley', desc: 'Belt idler. Spin-check for play and noise with the belt off.' },
  mgu: { label: 'eTorque MGU', desc: 'Belt-starter Motor Generator Unit (EC3). 48 V — observe high-voltage precautions.', torqueId: 'tq-mgu' },
  vacuumPump: { label: 'Electric Vacuum Pump', desc: 'Brake booster vacuum pump on the timing cover bracket.', torqueId: 'tq-vac-bracket' },
  turbo: { label: 'Turbocharger', desc: 'Twin-scroll turbo. Prime the oil feed and use new lines/gaskets.', torqueId: 'tq-turbo-nuts' },
  exhaustManifold: { label: 'Exhaust Manifold', desc: 'Manifold to turbo. Tighten center-out with new nuts.', torqueId: 'tq-exhaust-man' },
  intakeManifold: { label: 'Intake Manifold', desc: 'Composite intake with charge-air plumbing. New gaskets on refit.', torqueId: 'tq-intake' },
  fuelRail: { label: 'Fuel Rail + Injectors', desc: 'Direct-injection rail. Depressurize the system before opening any fitting.' },
  acCompressor: { label: 'A/C Compressor', desc: 'Recover refrigerant with an approved station before disconnecting lines.' },
  camSensor: { label: 'Cam Position Sensor', desc: 'Intake/exhaust cam sensors. Disconnect before head removal.' },
  tmap: { label: 'TMAP Sensor', desc: 'Temperature + manifold pressure sensor on the intake tract.' },
  egrSensor: { label: 'EGR Temp Sensor', desc: 'EGR temperature sensor connector on the exhaust side.' },
};

interface BuiltPart {
  group: THREE.Group;
  base: THREE.Vector3;
  dir: THREE.Vector3;
}

function mat(color: number, roughness = 0.55, metalness = 0.65) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(w: number, h: number, d: number, m: THREE.Material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
}
function cyl(rt: number, rb: number, h: number, m: THREE.Material, seg = 24) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
}
function tube(points: THREE.Vector3[], radius: number, m: THREE.Material, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.15);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 10, closed), m);
}

/** Builds the procedural 2.0L turbo engine. Front of engine faces +X. */
function buildEngine(): Map<string, BuiltPart> {
  const parts = new Map<string, BuiltPart>();
  const add = (id: string, group: THREE.Group, dir: THREE.Vector3) => {
    group.userData.partId = id;
    group.position.copy(new THREE.Vector3(0, 0, 0));
    parts.set(id, { group, base: group.position.clone(), dir });
    return group;
  };

  // ---- block ----
  {
    const g = new THREE.Group();
    const block = box(3.2, 1.5, 1.8, mat(0x3d434c, 0.7, 0.55));
    block.position.y = 1.25;
    g.add(block);
    // bore tops
    const boreMat = mat(0x14161a, 0.4, 0.8);
    for (let i = 0; i < 4; i++) {
      const bore = cyl(0.3, 0.3, 0.1, boreMat);
      bore.position.set(-1.125 + i * 0.75, 2.0, 0);
      g.add(bore);
    }
    // side ribs
    for (let i = 0; i < 5; i++) {
      const rib = box(0.12, 1.1, 1.86, mat(0x333942, 0.75, 0.5));
      rib.position.set(-1.4 + i * 0.7, 1.2, 0);
      g.add(rib);
    }
    add('engineBlock', g, new THREE.Vector3(0, 0, 0));
  }
  // ---- oil pan ----
  {
    const g = new THREE.Group();
    const pan = box(2.8, 0.5, 1.5, mat(0x1c1f24, 0.6, 0.6));
    pan.position.y = 0.28;
    g.add(pan);
    const plug = cyl(0.07, 0.07, 0.14, mat(0x8a8f98, 0.35, 0.95));
    plug.rotation.z = Math.PI / 2;
    plug.position.set(0.6, 0.24, 0.78);
    g.add(plug);
    add('oilPan', g, new THREE.Vector3(0, -1, 0));
  }
  // ---- head gasket ----
  {
    const g = new THREE.Group();
    const gk = box(3.0, 0.07, 1.7, mat(0xb0703a, 0.35, 0.95));
    gk.position.y = 2.04;
    g.add(gk);
    add('headGasket', g, new THREE.Vector3(0, 0.45, 0));
  }
  // ---- cylinder head ----
  {
    const g = new THREE.Group();
    const head = box(3.0, 0.62, 1.7, mat(0x9aa3ad, 0.38, 0.9));
    head.position.y = 2.4;
    g.add(head);
    // exhaust + intake flanges
    const ex = box(2.7, 0.3, 0.12, mat(0x7c828b, 0.5, 0.85));
    ex.position.set(0, 2.32, 0.9);
    g.add(ex);
    const ik = ex.clone();
    ik.position.z = -0.9;
    g.add(ik);
    add('cylinderHead', g, new THREE.Vector3(0, 1, 0));
  }
  // ---- head bolts ----
  {
    const g = new THREE.Group();
    const bm = mat(0xc7ccd4, 0.25, 1);
    [-0.72, 0.72].forEach((z) => {
      for (let i = 0; i < 5; i++) {
        const b = cyl(0.055, 0.055, 0.5, bm, 6);
        b.position.set(-1.3 + i * 0.65, 2.7, z);
        g.add(b);
      }
    });
    add('headBolts', g, new THREE.Vector3(0, 1.9, 0));
  }
  // ---- cams ----
  const camGeo = (z: number, id: string) => {
    const g = new THREE.Group();
    const shaft = cyl(0.09, 0.09, 2.9, mat(0xd4d9e0, 0.25, 1));
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(0, 2.78, z);
    shaft.userData.spinner = true;
    g.add(shaft);
    for (let i = 0; i < 4; i++) {
      const lobe = box(0.12, 0.2, 0.14, mat(0xb9bfc7, 0.3, 1));
      lobe.position.set(-1.125 + i * 0.75, 2.78, z);
      g.add(lobe);
    }
    const phaser = cyl(0.24, 0.24, 0.18, mat(0x6b7280, 0.4, 0.9));
    phaser.rotation.z = Math.PI / 2;
    phaser.position.set(1.5, 2.78, z);
    phaser.userData.spinner = true;
    g.add(phaser);
    add(id, g, new THREE.Vector3(0, 1.5, z > 0 ? 0.35 : -0.35));
  };
  camGeo(-0.35, 'camIntake');
  camGeo(0.35, 'camExhaust');
  // ---- valve cover ----
  {
    const g = new THREE.Group();
    const cover = box(2.9, 0.34, 1.6, mat(0x17191d, 0.55, 0.25));
    cover.position.y = 3.05;
    g.add(cover);
    for (let i = 0; i < 4; i++) {
      const coil = box(0.3, 0.12, 0.3, mat(0x23262c, 0.5, 0.3));
      coil.position.set(-1.125 + i * 0.75, 3.27, 0);
      g.add(coil);
    }
    const cap = cyl(0.11, 0.11, 0.1, mat(0xff6a00, 0.5, 0.3));
    cap.position.set(1.1, 3.26, 0.45);
    g.add(cap);
    add('valveCover', g, new THREE.Vector3(0, 2.2, 0));
  }
  // ---- cover bolts ----
  {
    const g = new THREE.Group();
    const bm = mat(0x9aa0a8, 0.35, 0.95);
    for (let i = 0; i < 6; i++) {
      [-0.72, 0.72].forEach((z) => {
        const b = cyl(0.04, 0.04, 0.16, bm, 6);
        b.position.set(-1.3 + i * 0.52, 2.95, z);
        g.add(b);
      });
    }
    add('valveCoverBolts', g, new THREE.Vector3(0, 2.7, 0));
  }
  // ---- timing cover (front, +X) ----
  {
    const g = new THREE.Group();
    const cover = box(0.34, 2.3, 1.9, mat(0x848b94, 0.45, 0.85));
    cover.position.set(1.78, 1.85, 0);
    g.add(cover);
    [1.3, 2.35].forEach((y) => {
      const rib = box(0.1, 0.12, 1.7, mat(0x6e747d, 0.5, 0.8));
      rib.position.set(1.98, y, 0);
      g.add(rib);
    });
    add('timingCover', g, new THREE.Vector3(1.6, 0.25, 0));
  }
  // ---- timing chain ----
  {
    const g = new THREE.Group();
    const x = 1.58;
    const crank = new THREE.Vector3(x, 1.1, 0);
    const camA = new THREE.Vector3(x, 2.78, -0.35);
    const camB = new THREE.Vector3(x, 2.78, 0.35);
    const loop = tube(
      [
        new THREE.Vector3(x, 1.1, -0.36),
        new THREE.Vector3(x, 1.95, -0.5),
        new THREE.Vector3(x, 2.78, -0.62),
        new THREE.Vector3(x, 3.02, 0),
        new THREE.Vector3(x, 2.78, 0.62),
        new THREE.Vector3(x, 1.95, 0.5),
        new THREE.Vector3(x, 1.1, 0.36),
        new THREE.Vector3(x, 0.76, 0),
      ],
      0.05,
      mat(0x565c66, 0.35, 1),
      true
    );
    g.add(loop);
    const sprocket = (p: THREE.Vector3, r: number) => {
      const s = cyl(r, r, 0.09, mat(0x3a3f47, 0.4, 0.95));
      s.rotation.z = Math.PI / 2;
      s.position.copy(p);
      s.userData.spinner = true;
      g.add(s);
    };
    sprocket(crank, 0.34);
    sprocket(camA, 0.26);
    sprocket(camB, 0.26);
    // guide rails
    [-0.52, 0.52].forEach((z) => {
      const guide = box(0.08, 1.5, 0.1, mat(0xc7a24a, 0.6, 0.2));
      guide.position.set(x, 1.95, z);
      g.add(guide);
    });
    add('timingChain', g, new THREE.Vector3(2.5, 0.35, 0));
  }
  // ---- crank pulley ----
  {
    const g = new THREE.Group();
    const p = cyl(0.42, 0.42, 0.16, mat(0x2b3038, 0.45, 0.9));
    p.rotation.z = Math.PI / 2;
    p.position.set(2.06, 1.1, 0);
    p.userData.spinner = true;
    g.add(p);
    const bolt = cyl(0.09, 0.09, 0.22, mat(0xc7ccd4, 0.25, 1), 6);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(2.1, 1.1, 0);
    bolt.userData.spinner = true;
    g.add(bolt);
    add('crankPulley', g, new THREE.Vector3(3.1, -0.1, 0));
  }
  // ---- drive belt + idler ----
  {
    const g = new THREE.Group();
    const x = 2.06;
    g.add(
      tube(
        [
          new THREE.Vector3(x, 1.1, -0.44),
          new THREE.Vector3(x, 2.0, -0.75),
          new THREE.Vector3(x, 2.95, -0.75),
          new THREE.Vector3(x, 3.0, 0.1),
          new THREE.Vector3(x, 1.9, 0.5),
          new THREE.Vector3(x, 1.1, 0.44),
          new THREE.Vector3(x, 0.68, 0),
        ],
        0.05,
        mat(0x101114, 0.8, 0.1),
        true
      )
    );
    add('driveBelt', g, new THREE.Vector3(3.4, 0.5, 0));
  }
  {
    const g = new THREE.Group();
    const p = cyl(0.16, 0.16, 0.12, mat(0x2b3038, 0.45, 0.9));
    p.rotation.z = Math.PI / 2;
    p.position.set(2.06, 1.95, 0.48);
    p.userData.spinner = true;
    g.add(p);
    add('idlerPulley', g, new THREE.Vector3(3.2, 0.9, 0.5));
  }
  // ---- MGU ----
  {
    const g = new THREE.Group();
    const body = cyl(0.42, 0.42, 0.72, mat(0x4a5261, 0.4, 0.9));
    body.rotation.z = Math.PI / 2;
    body.position.set(1.75, 2.95, -1.15);
    g.add(body);
    const cap = cyl(0.2, 0.2, 0.78, mat(0x23262c, 0.5, 0.6));
    cap.rotation.z = Math.PI / 2;
    cap.position.set(1.75, 2.95, -1.15);
    cap.userData.spinner = true;
    g.add(cap);
    const bracket = box(0.5, 0.5, 0.3, mat(0x333942, 0.6, 0.7));
    bracket.position.set(1.5, 2.55, -0.85);
    g.add(bracket);
    add('mgu', g, new THREE.Vector3(0.7, 1.1, -1.4));
  }
  // ---- vacuum pump ----
  {
    const g = new THREE.Group();
    const body = box(0.4, 0.5, 0.5, mat(0x23262c, 0.5, 0.5));
    body.position.set(2.05, 2.3, 0.62);
    g.add(body);
    const neck = cyl(0.09, 0.09, 0.35, mat(0x9aa0a8, 0.4, 0.9));
    neck.rotation.x = Math.PI / 2;
    neck.position.set(2.05, 2.42, 0.95);
    g.add(neck);
    add('vacuumPump', g, new THREE.Vector3(2.2, 1.0, 1.0));
  }
  // ---- turbo ----
  {
    const g = new THREE.Group();
    const turbine = cyl(0.34, 0.34, 0.5, mat(0x7a4a2a, 0.65, 0.8));
    turbine.rotation.x = Math.PI / 2;
    turbine.position.set(-1.1, 1.85, 1.25);
    g.add(turbine);
    const comp = cyl(0.28, 0.28, 0.42, mat(0x9aa3ad, 0.35, 0.95));
    comp.rotation.x = Math.PI / 2;
    comp.position.set(-1.1, 1.85, 1.65);
    g.add(comp);
    g.add(
      tube(
        [new THREE.Vector3(-1.1, 1.6, 1.25), new THREE.Vector3(-1.1, 1.0, 1.35), new THREE.Vector3(-1.15, 0.5, 1.1)],
        0.13,
        mat(0x5a3b28, 0.7, 0.7)
      )
    );
    add('turbo', g, new THREE.Vector3(-0.4, 0.6, 1.8));
  }
  // ---- exhaust manifold ----
  {
    const g = new THREE.Group();
    const m = mat(0x5a3b28, 0.7, 0.7);
    for (let i = 0; i < 4; i++) {
      const x = -1.125 + i * 0.75;
      g.add(
        tube(
          [new THREE.Vector3(x, 2.3, 0.9), new THREE.Vector3(x * 0.9, 2.05, 1.1), new THREE.Vector3(-1.1, 1.85, 1.15)],
          0.08,
          m
        )
      );
    }
    add('exhaustManifold', g, new THREE.Vector3(0, 0.7, 1.2));
  }
  // ---- intake manifold ----
  {
    const g = new THREE.Group();
    const plenum = box(2.4, 0.4, 0.5, mat(0x1d2126, 0.55, 0.3));
    plenum.position.set(-0.2, 2.5, -1.15);
    g.add(plenum);
    const m = mat(0x2a2f36, 0.55, 0.4);
    for (let i = 0; i < 4; i++) {
      const x = -1.125 + i * 0.75;
      g.add(
        tube([new THREE.Vector3(x, 2.32, -0.9), new THREE.Vector3(x * 0.8 - 0.2, 2.42, -1.05), new THREE.Vector3(x * 0.7 - 0.2, 2.5, -1.15)], 0.09, m)
      );
    }
    add('intakeManifold', g, new THREE.Vector3(0, 0.8, -1.5));
  }
  // ---- fuel rail ----
  {
    const g = new THREE.Group();
    const rail = cyl(0.06, 0.06, 2.6, mat(0xc7ccd4, 0.3, 1));
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.62, -0.62);
    g.add(rail);
    for (let i = 0; i < 4; i++) {
      const inj = cyl(0.035, 0.035, 0.22, mat(0x3a7d4f, 0.5, 0.5));
      inj.position.set(-1.125 + i * 0.75, 2.48, -0.62);
      g.add(inj);
    }
    add('fuelRail', g, new THREE.Vector3(0, 1.6, -0.8));
  }
  // ---- A/C compressor ----
  {
    const g = new THREE.Group();
    const body = cyl(0.3, 0.3, 0.55, mat(0x3a3f47, 0.5, 0.8));
    body.rotation.z = Math.PI / 2;
    body.position.set(1.0, 0.62, 1.05);
    g.add(body);
    add('acCompressor', g, new THREE.Vector3(0.4, -0.5, 1.3));
  }
  // ---- small sensors ----
  {
    const g = new THREE.Group();
    const s = box(0.22, 0.14, 0.22, mat(0xd43d3d, 0.5, 0.4));
    s.position.set(1.35, 2.95, 0.35);
    g.add(s);
    add('camSensor', g, new THREE.Vector3(1.2, 1.9, 0.6));
  }
  {
    const g = new THREE.Group();
    const s = box(0.2, 0.2, 0.14, mat(0x3d6fd4, 0.5, 0.4));
    s.position.set(-0.2, 2.75, -1.12);
    g.add(s);
    add('tmap', g, new THREE.Vector3(0, 1.6, -1.9));
  }
  {
    const g = new THREE.Group();
    const s = cyl(0.06, 0.06, 0.25, mat(0x3dd47a, 0.5, 0.4));
    s.position.set(-0.6, 2.2, 1.0);
    g.add(s);
    add('egrSensor', g, new THREE.Vector3(-0.3, 1.2, 1.9));
  }

  return parts;
}

interface Props {
  focusPart?: string;
}

export function EngineViewer({ focusPart }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<Map<string, BuiltPart>>(new Map());
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [explode, setExplode] = useState(0.25);
  const [spin, setSpin] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [vrSupported, setVrSupported] = useState(false);
  const [vrActive, setVrActive] = useState(false);
  const spinRef = useRef(spin);
  spinRef.current = spin;

  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  // Apply explode offsets
  useEffect(() => {
    partsRef.current.forEach((p) => {
      p.group.position.copy(p.base).addScaledVector(p.dir, explode * 1.1);
    });
  }, [explode]);

  // External focus (e.g. from a procedure step)
  useEffect(() => {
    if (focusPart && PART_META[focusPart]) {
      setSelected(focusPart);
      setExplode((e) => Math.max(e, 0.55));
    }
  }, [focusPart]);

  // Highlight selection
  useEffect(() => {
    partsRef.current.forEach((p, id) => {
      p.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        const m = mesh.material as THREE.MeshStandardMaterial | undefined;
        if (m && 'emissive' in m) {
          if (id === selected) {
            m.emissive = new THREE.Color(0xff6a00);
            m.emissiveIntensity = 0.55;
          } else {
            m.emissive = new THREE.Color(0x000000);
            m.emissiveIntensity = 0;
          }
        }
      });
    });
  }, [selected]);

  // Scene setup (once)
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070b);
    scene.fog = new THREE.Fog(0x05070b, 18, 34);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(6.4, 4.6, 7.2);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.4, 1.8, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI * 0.55;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // lights
    scene.add(new THREE.HemisphereLight(0x9db4d4, 0x1a1206, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 10, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8a2a, 1.1);
    rim.position.set(-7, 4, -6);
    scene.add(rim);

    // floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(11, 64),
      new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.9, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(22, 44, 0x2a3342, 0x1a2230);
    grid.position.y = 0.01;
    scene.add(grid);

    // engine
    const built = buildEngine();
    partsRef.current = built;
    const spinners: THREE.Object3D[] = [];
    built.forEach((p) => {
      p.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
        if (o.userData.spinner) spinners.push(o);
      });
      scene.add(p.group);
    });
    // initial explode
    built.forEach((p) => {
      p.group.position.copy(p.base).addScaledVector(p.dir, 0.25 * 1.1);
    });

    // picking (click without drag)
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hits = ray.intersectObjects(scene.children, true);
      let id: string | null = null;
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if (o.userData.partId) {
            id = o.userData.partId as string;
            break;
          }
          o = o.parent;
        }
        if (id) break;
      }
      setSelected(id);
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);

    // resize
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // loop
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = clock.getDelta();
      if (spinRef.current) {
        for (const s of spinners) s.rotation.x += dt * 2.2;
      }
      controls.update();
      renderer.render(scene, camera);
    });

    // XR support probe
    const nav = navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } };
    if (nav.xr?.isSessionSupported) {
      nav.xr.isSessionSupported('immersive-vr').then(setVrSupported).catch(() => {});
    }

    return () => {
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.setAnimationLoop(null);
      controls.dispose();
      pmrem.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const m = mesh.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose());
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      partsRef.current = new Map();
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate && !vrActive;
  }, [autoRotate, vrActive]);

  const resetView = () => {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls) return;
    cam.position.set(6.4, 4.6, 7.2);
    controls.target.set(0.4, 1.8, 0);
    controls.update();
  };

  const enterVr = async () => {
    try {
      const nav = navigator as Navigator & { xr?: { requestSession: (m: string, o?: object) => Promise<unknown> } };
      const renderer = rendererRef.current;
      if (!nav.xr || !renderer) return;
      const session = (await nav.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor'],
      })) as unknown as object;
      setVrActive(true);
      (renderer.xr as unknown as { setSession: (s: object) => void }).setSession(session);
      (session as unknown as { addEventListener: (t: string, f: () => void) => void }).addEventListener('end', () => setVrActive(false));
    } catch {
      /* user declined or no headset */
    }
  };

  const meta = selected ? PART_META[selected] : null;
  const torque = meta?.torqueId ? torqueById(meta.torqueId) : undefined;
  const related = useMemo(() => {
    if (!selected) return [];
    return procedures
      .map((p) => ({
        proc: p,
        steps: [...p.removal, ...p.installation].filter((s) => s.parts3d?.includes(selected)),
      }))
      .filter((r) => r.steps.length > 0)
      .slice(0, 3);
  }, [selected]);

  return (
    <div className="viewer-layout">
      <div>
        <div className="viewer-canvas-wrap" ref={mountRef} style={{ height: 560 }}>
          <div className="viewer-overlay">
            <span className="badge orange">2.0L Hurricane EC1/EC3</span>
            {selected && <span className="badge blue">{PART_META[selected]?.label}</span>}
            {vrSupported && <span className="badge green">VR capable</span>}
          </div>
          <div className="viewer-hint">Drag to orbit · Scroll to zoom · Click a part to inspect</div>
        </div>
      </div>

      <div className="viewer-controls">
        <div className="card">
          <h3>Assembly controls</h3>
          <div className="slider-row">
            <span className="muted">Explode</span>
            <input type="range" min={0} max={1.4} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} />
            <span className="mono">{Math.round((explode / 1.4) * 100)}%</span>
          </div>
          <div className="toggle-row">
            <span>Turntable</span>
            <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
          </div>
          <div className="toggle-row">
            <span>Running gear animation</span>
            <input type="checkbox" checked={spin} onChange={(e) => setSpin(e.target.checked)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn ghost small" onClick={resetView}>Reset view</button>
            <button className="btn ghost small" onClick={() => setExplode(0)}>Assemble</button>
            {vrSupported && (
              <button className="btn small" onClick={enterVr} disabled={vrActive}>
                {vrActive ? 'In VR…' : 'Enter VR'}
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h3>{meta ? meta.label : 'No part selected'}</h3>
          {meta ? (
            <>
              <p className="muted" style={{ marginTop: 0 }}>{meta.desc}</p>
              {torque && (
                <div className="callout">
                  <strong>Torque: {torque.nm} N·m ({torque.ftLb} ft-lb)</strong>
                  <div className="muted">{torque.steps.join(' → ')}</div>
                </div>
              )}
              {related.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Used in procedures:</div>
                  {related.map((r) => (
                    <div key={r.proc.id} style={{ fontSize: 13, marginBottom: 6 }}>
                      <span className="mono" style={{ color: 'var(--accent-2)' }}>{r.proc.id}</span>{' '}
                      {r.proc.title}
                      <div className="muted">Steps {r.steps.map((s) => s.n).join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setSelected(null)}>Clear selection</button>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>Click any component in the 3D view — or pick one below — to see service notes, torque and related procedure steps.</p>
          )}
        </div>

        <div className="card">
          <h3>Components</h3>
          <div className="part-list">
            {Object.entries(PART_META).map(([id, m]) => (
              <button key={id} className={`part-item${selected === id ? ' active' : ''}`} onClick={() => setSelected(id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
