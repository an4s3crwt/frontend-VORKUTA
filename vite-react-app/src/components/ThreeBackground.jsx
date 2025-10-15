import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const cursor = cursorRef.current;

    // Escena y cámara
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Plano oscuro
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.8,
      metalness: 0.1,
    });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Luz puntual que seguirá el cursor
    const cursorLight = new THREE.PointLight(0xffffff, 1.5, 10, 2);
    cursorLight.position.set(0, 0, 1);
    scene.add(cursorLight);

    // Luz ambiental tenue
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    // Variables para el cursor y luz
    const mouse = new THREE.Vector2(0, 0);
    const smoothedMouse = new THREE.Vector2(0, 0);

    let fadeOpacity = 1;
    let lastMoveTime = Date.now();
    const FADE_DELAY = 1000;
    const FADE_DURATION = 1500;

    // Manejar movimiento del mouse
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        cursor.style.backgroundColor = `rgba(255, 255, 255, ${fadeOpacity * 0.4})`;
        cursor.style.width = `${6 + 10 * fadeOpacity}px`;
        cursor.style.height = `${6 + 10 * fadeOpacity}px`;
        cursor.style.boxShadow = `0 0 8px rgba(255, 255, 255, ${fadeOpacity * 0.15})`;
      }

      lastMoveTime = Date.now();
      fadeOpacity = 1;
      cursorLight.intensity = 1.5 * fadeOpacity;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Ajustar tamaño al resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const raycaster = new THREE.Raycaster();

    // Animación
    const animate = () => {
      requestAnimationFrame(animate);

      // Suavizar movimiento
      smoothedMouse.lerp(mouse, 0.15);

      raycaster.setFromCamera(smoothedMouse, camera);

      // Intersectar con plano z=0 para posicionar la luz
      const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeZ, intersectPoint);

      // Mover luz encima del plano para que se note mejor
      cursorLight.position.copy(intersectPoint).add(new THREE.Vector3(0, 0, 1));

      // Controlar fade out
      const now = Date.now();
      const timeSinceMove = now - lastMoveTime;

      if (timeSinceMove > FADE_DELAY) {
        const fadeProgress = Math.min(1, (timeSinceMove - FADE_DELAY) / FADE_DURATION);
        fadeOpacity = 1 - fadeProgress;
        fadeOpacity = Math.max(fadeOpacity, 0);

        cursorLight.intensity = 1.5 * fadeOpacity;

        if (cursor) {
          cursor.style.backgroundColor = `rgba(255, 255, 255, ${fadeOpacity * 0.4})`;
          cursor.style.width = `${6 + 10 * fadeOpacity}px`;
          cursor.style.height = `${6 + 10 * fadeOpacity}px`;
          cursor.style.boxShadow = `0 0 8px rgba(255, 255, 255, ${fadeOpacity * 0.15})`;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        ref={cursorRef}
        style={{
          position: "fixed",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.4)",
          pointerEvents: "none",
          mixBlendMode: "difference",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          transition:
            "width 0.3s ease, height 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
          boxShadow: "0 0 8px rgba(255, 255, 255, 0.15)",
        }}
      />
    </>
  );
}
