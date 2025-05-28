import React, { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { PointerLockControls, Sky } from "@react-three/drei";
import * as THREE from "three";

/**
 * Basic FPS Camera Controller (WASD + Mouse)
 * Handles WASD movement and mouse look,
 * using react-three-fiber and PointerLockControls for pointer capture.
 */
function FPSController({ movementSpeed = 4 }) {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const move = useRef({ forward: false, backward: false, left: false, right: false });
  const prevTime = useRef(performance.now());

  // PUBLIC_INTERFACE
  const onKeyDown = useCallback((event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        move.current.forward = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        move.current.left = true;
        break;
      case "ArrowDown":
      case "KeyS":
        move.current.backward = true;
        break;
      case "ArrowRight":
      case "KeyD":
        move.current.right = true;
        break;
      default:
        break;
    }
  }, []);
  // PUBLIC_INTERFACE
  const onKeyUp = useCallback((event) => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        move.current.forward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        move.current.left = false;
        break;
      case "ArrowDown":
      case "KeyS":
        move.current.backward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        move.current.right = false;
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  useFrame(() => {
    const time = performance.now();
    const delta = (time - prevTime.current) / 1000;

    velocity.current.x -= velocity.current.x * 8.0 * delta;
    velocity.current.z -= velocity.current.z * 8.0 * delta;

    direction.current.z = Number(move.current.forward) - Number(move.current.backward);
    direction.current.x = (Number(move.current.right) - Number(move.current.left)) * -1;
    direction.current.normalize();

    if (move.current.forward || move.current.backward) {
      velocity.current.z -= direction.current.z * movementSpeed * delta;
    }
    if (move.current.left || move.current.right) {
      velocity.current.x -= direction.current.x * movementSpeed * delta;
    }

    camera.position.x += velocity.current.x;
    camera.position.z += velocity.current.z;
    camera.position.y = 1.75;

    prevTime.current = time;
  });

  return <PointerLockControls selector="#fps-canvas-root" />;
}

/*
 * BulletProjectile renders a fast-moving bullet object from given start position and direction.
 * Handles forward animation, and now does hit detection against targets.
 * onHit: callback(targetId) called when a hit occurs; targetId is the target hit, or null otherwise.
 */
function BulletProjectile({
  start,
  direction,
  speed = 21,
  life = 1.4,
  onExpire,
  color = "#ffd700",
  targets = [],
  onHit
}) {
  const meshRef = useRef();
  const [alive, setAlive] = useState(true);
  const spawnTime = useRef(performance.now());
  const pos = useRef(new THREE.Vector3(...start));
  const dir = useRef(direction.clone());
  const [alreadyHit, setAlreadyHit] = useState(false);

  useFrame(() => {
    if (!alive) return;
    const now = performance.now();
    const delta = (now - spawnTime.current) / 1000.0;
    const move = dir.current.clone().normalize().multiplyScalar(speed * (1 / 60));
    pos.current.add(move);

    // Move mesh position
    if (meshRef.current) {
      meshRef.current.position.copy(pos.current);
    }

    // Bullet-target hit detection (simple bounding sphere vs box)
    if (!alreadyHit && Array.isArray(targets) && targets.length > 0) {
      for (let t of targets) {
        if (!t.active) continue;
        // t.position: THREE.Vector3, t.size: THREE.Vector3
        // Treat bullet as sphere, target as box.
        const bulletRadius = 0.12;
        const min = t.position.clone().sub(t.size.clone().multiplyScalar(0.5));
        const max = t.position.clone().add(t.size.clone().multiplyScalar(0.5));
        const p = pos.current;
        // Clamp sphere center to box, then dist <= bulletRadius == hit
        const clamped = new THREE.Vector3(
          Math.max(min.x, Math.min(p.x, max.x)),
          Math.max(min.y, Math.min(p.y, max.y)),
          Math.max(min.z, Math.min(p.z, max.z))
        );
        const dist = clamped.distanceTo(p);
        if (dist <= bulletRadius) {
          setAlreadyHit(true);
          setAlive(false);
          if (onHit) onHit(t.id);
          if (onExpire) onExpire();
          return;
        }
      }
    }

    if (delta > life) {
      setAlive(false);
      if (onExpire) onExpire();
    }
  });

  if (!alive) return null;
  return (
    <mesh ref={meshRef} position={pos.current.toArray()} castShadow>
      <sphereGeometry args={[0.09, 11, 11]} />
      <meshStandardMaterial emissive={color} color={color} metalness={0.7} roughness={0.10} />
    </mesh>
  );
}

/**
 * MuzzleFlash briefly renders a bright effect at the weapon/center for firing feedback.
 */
function MuzzleFlash({ show, position, direction }) {
  if (!show) return null;
  const forwardOffset = direction.clone().setLength(0.38);
  const flashPos = position.clone().add(forwardOffset);

  return (
    <mesh position={flashPos.toArray()} rotation={[0, 0, 0]}>
      <planeGeometry args={[0.34, 0.16]} />
      <meshBasicMaterial color="#FFFACD" transparent opacity={0.73} />
    </mesh>
  );
}

/**
 * Target objects for the FPS range, hit-detectable and provide visual feedback.
 */
function FpsTarget({ id, position, size = [1, 2, 1], color = "#e7cf41", onHit, state }) {
  // state: { hit: boolean, vanished: boolean }
  let meshColor = color;
  if (state?.vanished) return null;
  else if (state?.hit) meshColor = "#62fb40";

  return (
    <mesh position={position} castShadow={true}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={meshColor} emissive={state?.hit ? "#7fff70" : color} opacity={state?.hit ? 0.96 : 1}/>
    </mesh>
  );
}

/**
 * FPSWeapon handles weapon logic: firing projectiles, muzzle flash, and input controls,
 * and emits projectiles with knowledge of possible targets for hit detection.
 * 
 * Now supports ammo management and reload.
 */
function FPSWeapon({
  getCamera,
  targets,
  onTargetHit,
  ammo,
  maxAmmo,
  reserveAmmo,
  onAmmoChange,
  isReloading,
  setIsReloading,
  reloadTimeMs = 950, // ms for reload animation
}) {
  const [projectiles, setProjectiles] = useState([]);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const lastShotRef = useRef(0);

  // PUBLIC_INTERFACE
  const tryFireWeapon = useCallback(() => {
    // Don't fire if reloading or no ammo available
    if (isReloading) return;
    if (ammo <= 0) return;
    if (!getCamera) return;
    const now = performance.now();
    // Prevent ultra-fast autofire spam
    if (now - lastShotRef.current < 110) return;
    lastShotRef.current = now;
    // Decrement ammo
    if (onAmmoChange) onAmmoChange(ammo - 1, reserveAmmo);
    const camera = getCamera();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    const start = [camera.position.x, camera.position.y, camera.position.z];
    setProjectiles(arr => [
      ...arr,
      {
        key: Math.random().toString(32).slice(2) + Date.now(),
        start,
        direction: dir.clone(),
      },
    ]);
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), 65);
  }, [ammo, getCamera, isReloading, onAmmoChange, reserveAmmo]);

  // PUBLIC_INTERFACE
  const tryReloadWeapon = useCallback(() => {
    // Already full or no reserves or already reloading
    if (isReloading) return;
    if (ammo === maxAmmo) return;
    if (reserveAmmo === 0) return;
    setIsReloading(true);
    setTimeout(() => {
      // Compute how much can be loaded
      const needed = maxAmmo - ammo;
      const toLoad = Math.min(needed, reserveAmmo);
      if (onAmmoChange) onAmmoChange(ammo + toLoad, reserveAmmo - toLoad);
      setIsReloading(false);
    }, reloadTimeMs);
  }, [ammo, maxAmmo, reserveAmmo, isReloading, setIsReloading, onAmmoChange, reloadTimeMs]);

  // Input: LMB or F/Space fires, R reloads (block input if reloading)
  useEffect(() => {
    function handleInput(e) {
      if (isReloading) return;
      if (
        (e.type === "mousedown" && e.button === 0) ||
        (e.type === "keydown" && (e.code === "Space" || e.code === "KeyF"))
      ) {
        tryFireWeapon();
      }
      if (e.type === "keydown" && e.code === "KeyR") {
        tryReloadWeapon();
      }
    }
    window.addEventListener("mousedown", handleInput);
    window.addEventListener("keydown", handleInput);
    return () => {
      window.removeEventListener("mousedown", handleInput);
      window.removeEventListener("keydown", handleInput);
    };
  }, [tryFireWeapon, tryReloadWeapon, isReloading]);

  const onProjectileExpire = (k) => {
    setProjectiles(arr => arr.filter(p => p.key !== k));
  };

  const handleProjectileHit = (targetId) => {
    if (targetId != null && typeof onTargetHit === "function") onTargetHit(targetId);
  };

  const { camera } = useThree();

  return (
    <>
      {projectiles.map(proj =>
        <BulletProjectile
          key={proj.key}
          start={proj.start}
          direction={proj.direction}
          onExpire={() => onProjectileExpire(proj.key)}
          targets={targets}
          onHit={handleProjectileHit}
        />
      )}
      <MuzzleFlash
        show={muzzleFlash}
        position={camera.position}
        direction={(() => {
          const d = new THREE.Vector3();
          camera.getWorldDirection(d);
          return d;
        })()}
      />
    </>
  );
}

/**
 * FPSCanvas renders the 3D environment and FPS controls, weapon/projectile system, 
 * targets for hit detection training, and minimal interactive scene.
 */
export default function FPSCanvas() {
  // Camera rig
  const cameraRef = useRef();
  const getCamera = useCallback(() => cameraRef.current, []);
  const CameraRig = () => {
    const { camera } = useThree();
    useEffect(() => { cameraRef.current = camera; }, [camera]);
    return null;
  };

  // --- Target state for hit detection ---
  // We'll have a few simple targets: each has id, position, size, hit state
  const initialTargets = [
    {
      id: "targ1",
      position: [0, 1.45, -8.5],
      size: [1.1, 2.1, 0.42],
      color: "#e7cf41"
    },
    {
      id: "targ2",
      position: [-4.5, 1.2, -7.4],
      size: [1.6, 1.8, 0.5],
      color: "#3fb7e6"
    },
    {
      id: "targ3",
      position: [3.9, 1.65, -6.2],
      size: [1.2, 2.1, 0.5],
      color: "#e85b7c"
    },
  ];
  const [targets, setTargets] = useState(
    () => initialTargets.map((t) => ({ ...t, hit: false, vanished: false }))
  );

  // FPSWeapon needs structured targets as objects with position(size) and hit callback.
  const visibleTargets = targets
    .filter(t => !t.vanished)
    .map(t => ({
      id: t.id,
      position: new THREE.Vector3(...t.position),
      size: new THREE.Vector3(...t.size),
      color: t.color,
      active: !t.hit && !t.vanished
    }));

  // On projectile hit, update target state (color changes green then vanishes after delay)
  const handleTargetHit = (targetId) => {
    setTargets(tgts =>
      tgts.map(t =>
        t.id === targetId && !t.hit
          ? { ...t, hit: true }
          : t
      )
    );
    // After delay, vanish target
    setTimeout(() => {
      setTargets(tgts =>
        tgts.map(t =>
          t.id === targetId ? { ...t, vanished: true } : t
        )
      );
    }, 650); // Show green for ~0.65s
  };

  return (
    <div id="fps-canvas-root" style={{width: "100vw", height: "100vh", position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{ fov: 77, position: [0, 1.75, 8] }}
        style={{ width: "100vw", height: "100vh", outline: "none", background: "#1a1a1a" }}
        gl={{ antialias: true }}
        shadows
      >
        <CameraRig />
        {/* Skybox */}
        <Sky sunPosition={[100, 40, 100]} turbidity={8} rayleigh={6} mieCoefficient={0.015} />
        {/* FPS controller: WASD + mouse look */}
        <FPSController />
        {/* Targets */}
        {targets.map(t =>
          <FpsTarget
            key={t.id}
            id={t.id}
            position={t.position}
            size={t.size}
            color={t.color}
            onHit={handleTargetHit}
            state={{ hit: t.hit, vanished: t.vanished }}
          />
        )}
        {/* Gun/projectile logic, pass in visible targets for hit check */}
        <FPSWeapon
          getCamera={getCamera}
          targets={visibleTargets}
          onTargetHit={handleTargetHit}
        />
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[64, 64]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.83} metalness={0.11} />
        </mesh>
        {/* Simple scene objects: obstacles/walls */}
        <mesh position={[0, 1, -5]} castShadow>
          <boxGeometry args={[2.5, 2, 2.5]} />
          <meshStandardMaterial color="#e63946" />
        </mesh>
        <mesh position={[-3, 1, 3]} castShadow>
          <boxGeometry args={[1,2,1]} />
          <meshStandardMaterial color="#2d2d2d" />
        </mesh>
        <mesh position={[4, 1, 2]} castShadow>
          <boxGeometry args={[1.7,1.2,1.7]} />
          <meshStandardMaterial color="#49a33e" />
        </mesh>
        {/* Lighting */}
        <hemisphereLight args={["#ffffff", "#444444", 0.5]} position={[0, 20, 0]} />
        <directionalLight
          castShadow
          position={[12, 40, 14]}
          intensity={0.7}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Environment: subtle HDR or extra ambient */}
        {/* <Environment preset="city" background={false} /> */}
      </Canvas>
      {/* Subtle HUD crosshair */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 18, height: 18,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 10
      }}>
        <svg viewBox="0 0 18 18" width="18" height="18" style={{display:"block", opacity: 0.42}}>
          <circle cx="9" cy="9" r="2" fill="#e63946" />
          <line x1="9" y1="2" x2="9" y2="7" stroke="#e63946" strokeWidth="1.3"/>
          <line x1="9" y1="16" x2="9" y2="11" stroke="#e63946" strokeWidth="1.3"/>
          <line x1="2" y1="9" x2="7" y2="9" stroke="#e63946" strokeWidth="1.3"/>
          <line x1="16" y1="9" x2="11" y2="9" stroke="#e63946" strokeWidth="1.3"/>
        </svg>
      </div>
      {/* Prompt to click for pointer lock */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "52%",
        minWidth: 160,
        color: "#fff",
        background: "rgba(24,24,26,0.88)",
        padding: "14px 22px",
        borderRadius: 12,
        textAlign: "center",
        fontWeight: 500,
        fontSize: "1.08rem",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        opacity: 0.32,
        userSelect: "none"
      }}
      >
        Click to Enable Mouse Look (Pointer Lock)
      </div>
    </div>
  );
}
