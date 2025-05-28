import React, { useRef, useEffect, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { PointerLockControls, Sky } from "@react-three/drei";
import * as THREE from "three";

/**
 * Basic FPS Camera Controller (WASD + Mouse)
 * Handles WASD movement and mouse look,
 * using react-three-fiber and PointerLockControls for pointer capture.
 */
function FPSController({ movementSpeed = 4 }) { // Lower speed to realistic 3-5 units/sec (default 4)
  const { camera, gl } = useThree();
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

  // Attach key listeners
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  // Animate FPS movement
  useFrame(() => {
    const time = performance.now();
    const delta = (time - prevTime.current) / 1000;

    velocity.current.x -= velocity.current.x * 8.0 * delta;
    velocity.current.z -= velocity.current.z * 8.0 * delta;

    direction.current.z = Number(move.current.forward) - Number(move.current.backward);

    // Invert strafe (x) direction logic so 'A' moves left, 'D' moves right (A = left = negative X)
    // If strafe felt reversed, multiply by -1 here
    direction.current.x = (Number(move.current.right) - Number(move.current.left)) * -1;
    direction.current.normalize(); // Ensure consistent movement

    if (move.current.forward || move.current.backward) {
      velocity.current.z -= direction.current.z * movementSpeed * delta;
    }
    if (move.current.left || move.current.right) {
      velocity.current.x -= direction.current.x * movementSpeed * delta;
    }

    // Move camera (locked to ground, y=1.75)
    camera.position.x += velocity.current.x;
    camera.position.z += velocity.current.z;
    camera.position.y = 1.75; // up/down is locked for this FPS demo (no jump/crouch)

    prevTime.current = time;
  });

  // Setup PointerLock controls - for mouse look
  // (handled automatically by drei's PointerLockControls)
  return <PointerLockControls selector="#fps-canvas-root" />;
}

// PUBLIC_INTERFACE
/**
 * FPSCanvas renders the 3D environment and FPS controls.
 */
export default function FPSCanvas() {
  // R3F Canvas takes full parent size. PointerLockControls handles mouse look.
  return (
    <div id="fps-canvas-root" style={{width: "100vw", height: "100vh", position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas
        camera={{ fov: 77, position: [0, 1.75, 8] }}
        style={{ width: "100vw", height: "100vh", outline: "none", background: "#1a1a1a" }}
        gl={{ antialias: true }}
        shadows
      >
        {/* Skybox */}
        <Sky sunPosition={[100, 40, 100]} turbidity={8} rayleigh={6} mieCoefficient={0.015} />
        {/* FPS controller: WASD + mouse look */}
        <FPSController />
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[64, 64]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.83} metalness={0.11} />
        </mesh>
        {/* Placeholder walls/boxes/objects */}
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
