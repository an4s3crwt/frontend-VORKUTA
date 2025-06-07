import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
    const mountRef = useRef(null);
    const cursorRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        const cursor = cursorRef.current;

        // Scene, Camera, Renderer setup
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mount.appendChild(renderer.domElement);

        // Mouse tracking
        const mouse = new THREE.Vector2(0, 0);
        const smoothedMouse = new THREE.Vector2(0, 0);
        let mouseDown = false;

        // Shader material (acorta aquí o pon tu shader completo)
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                iTime: { value: 0 },
                smoothedMouse: { value: new THREE.Vector2(0, 0) },
                mouseDown: { value: 0 },
                primaryColor: { value: new THREE.Color(1, 1, 1) },
                secondaryColor: { value: new THREE.Color(1, 1, 1) },
                accentColor: { value: new THREE.Color(0, 0, 0) },
                fractalScale: { value: 0.3 },
                fractalOffset: { value: new THREE.Vector2(0, 0) },
                lightCount: { value: 1 },
                lightIntensity: { value: 1.0 },
                lightSpeed: { value: 1.0 },
                grainStrength: { value: 0.15 },
                grainSize: { value: 3.5 },
                animationSpeed: { value: 0.02 },
                autoRotate: { value: 1.0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform vec2 iResolution;
                uniform float iTime;
                uniform vec3 primaryColor;
                uniform vec3 secondaryColor;
                uniform vec3 accentColor;
                uniform vec2 smoothedMouse;
                uniform float mouseDown;
                uniform float fractalScale;
                uniform vec2 fractalOffset;
                uniform int lightCount;
                uniform float lightIntensity;
                uniform float lightSpeed;
                uniform float grainStrength;
                uniform float grainSize;
                uniform float animationSpeed;
                uniform float autoRotate;

                #define PI 3.14159265359

                // Improved noise function
                float hash(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }
                
                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }
                
                // Rotation matrix
                mat2 rot(float a) {
                    float s = sin(a);
                    float c = cos(a);
                    return mat2(c, -s, s, c);
                }

                // Orb shape function
                float orbShape(vec2 uv, float time) {
                    // Adjust UV to be from -1 to 1 with aspect ratio correction
                    uv = (uv * 2.0 - 1.0);
                    uv.x *= iResolution.x / iResolution.y;
                    
                    // Apply scale and offset
                    uv *= fractalScale;
                    uv += fractalOffset;
                    
                    // Create a pulsating orb
                    float d = length(uv);
                    float pulse = 0.5 + 0.1 * sin(time * animationSpeed * 2.0);
                    
                    // Base orb shape
                    float shape = smoothstep(pulse, pulse - 0.1, d);
                    
                    // Add internal glow and structure
                    float innerGlow = smoothstep(pulse * 0.8, 0.0, d) * 0.5;
                    
                    // Add some swirls
                    float angle = atan(uv.y, uv.x);
                    float swirl = 0.15 * sin(angle * 8.0 + time * 3.0 * animationSpeed) * smoothstep(pulse, 0.0, d);
                    
                    return shape + innerGlow + swirl;
                }

                // Get light positions
                vec3 getLightPosition(int index, float time) {
                    float angle = float(index) * (2.0 * PI / float(lightCount)) + time * lightSpeed;
                    float radius = 1.5;
                    float height = sin(time * lightSpeed * 0.5 + float(index)) * 0.5;
                    
                    return vec3(radius * cos(angle), height, radius * sin(angle));
                }

                // Calculate light influence
                float calculateLight(vec2 uv, float time) {
                    // Convert 2D position to 3D for light calculation
                    vec3 pos = vec3(uv.x, uv.y, 0.0);
                    float totalLight = 0.0;
                    
                    // Add contribution from each light
                    for (int i = 0; i < 10; i++) {
                        if (i >= lightCount) break;
                        
                        vec3 lightPos = getLightPosition(i, time);
                        float dist = length(pos - lightPos);
                        totalLight += lightIntensity / (1.0 + dist * dist * 2.0);
                    }
                    
                    // Add mouse light
                    vec2 mousePos = smoothedMouse / iResolution.xy;
                    mousePos = (mousePos * 2.0 - 1.0);
                    mousePos.x *= iResolution.x / iResolution.y;
                    
                    float mouseDist = length(uv - mousePos);
                    totalLight += lightIntensity * 2.0 / (1.0 + mouseDist * mouseDist * 4.0);
                    
                    return totalLight;
                }

                void main() {
                    // Normalize UV coordinates
                    vec2 uv = gl_FragCoord.xy / iResolution.xy;
                    vec2 centeredUV = (uv * 2.0 - 1.0);
                    centeredUV.x *= iResolution.x / iResolution.y;
                    
                    // Get shape value from orb function
                    float shape = orbShape(uv, iTime);
                    
                    // Calculate light influence
                    float light = calculateLight(centeredUV, iTime);
                    
                    // Create a more complex color mix using all three colors
                    vec3 baseColor = mix(primaryColor, secondaryColor, shape);
                    
                    // Add accent color to highlights
                    float highlight = pow(shape, 3.0);
                    baseColor = mix(baseColor, accentColor, highlight * 0.5);
                    
                    // Apply light effect
                    baseColor *= light * (shape + 0.2);
                    
                    // Apply grain effect
                    vec2 uvRandom = vUv;
                    uvRandom.y *= hash(vec2(uvRandom.y, iTime * 0.01));
                    float noise = hash(uvRandom * grainSize + iTime * 0.1) * grainStrength;
                    baseColor += noise - grainStrength * 0.5; // Center the noise around zero
                    
                    // Set the final color
                    gl_FragColor = vec4(baseColor, 1.0);
                }
            `,
        });

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
        scene.add(plane);

        // Mouse events
        const onMouseMove = (event) => {
            mouse.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
            // Custom cursor position
            if (cursor) {
                cursor.style.left = `${event.clientX}px`;
                cursor.style.top = `${event.clientY}px`;
            }
        };
        const onMouseDown = () => {
            mouseDown = true;
            shaderMaterial.uniforms.mouseDown.value = 1.0;
        };
        const onMouseUp = () => {
            mouseDown = false;
            shaderMaterial.uniforms.mouseDown.value = 0.0;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);

        // Resize handler
        const onResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            shaderMaterial.uniforms.iResolution.value.set(width, height);
        };
        window.addEventListener("resize", onResize);

        // Animation loop
        const animate = () => {
            const time = performance.now() * 0.001;
            shaderMaterial.uniforms.iTime.value = time;

            smoothedMouse.lerp(mouse, 0.1);
            shaderMaterial.uniforms.smoothedMouse.value.set(smoothedMouse.x * window.innerWidth, smoothedMouse.y * window.innerHeight);

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        // Cleanup
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("resize", onResize);
            mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <>
            <div
                ref={mountRef}
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100",
                    height: "100",

                }}
            />
            {/* Custom cursor */}
            <div
                ref={cursorRef}
                className="custom-cursor"
                style={{
                    position: "fixed",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.5)",
                    pointerEvents: "none",
                    mixBlendMode: "difference",
                    transform: "translate(-50%, -50%)",
                    zIndex: 9999,
                    transition: "width 0.2s, height 0.2s",
                    willChange: "transform",
                }}
            />
        </>
    );
}
