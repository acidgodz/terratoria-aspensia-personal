"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { atmosphere, disposeScene, isLite, loadTexture, makeRenderer, planet, prefersReducedMotion, starfield } from "./space";

// EDGERUNNERS theme, home page only: standing on the Moon, low over grey regolith, with Earth hanging
// huge above the horizon. Earth is enlarged for drama (from the real Moon it spans about 2 degrees).
// The ground is our own procedural cratered surface; Earth and the Moon's fine detail use the site's NASA textures.

/** Deterministic value noise for the ground, so the surface is the same on every visit. */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x: number, y: number, oct: number) => {
  let s = 0, amp = 0.5;
  for (let i = 0; i < oct; i++) (s += amp * noise(x, y)), (x *= 2.03), (y *= 2.03), (amp *= 0.5);
  return s;
};

/** Cratered lunar ground: rolling fbm hills, bowl craters with raised rims, bent down by the Moon's curvature. */
function ground(lite: boolean) {
  const size = 90, seg = lite ? 160 : 360;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647);
  const craters = Array.from({ length: lite ? 70 : 160 }, () => {
    const r = 0.15 + Math.pow(rnd(), 3) * 3.2;
    return { x: (rnd() - 0.5) * size, z: (rnd() - 0.5) * size * 0.9 - 8, r, d: r * (0.18 + rnd() * 0.1) };
  });
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    let h = (fbm(x * 0.08, z * 0.08, lite ? 4 : 6) - 0.5) * 1.6 + (fbm(x * 0.6, z * 0.6, 3) - 0.5) * 0.12;
    for (const c of craters) {
      const q = Math.hypot(x - c.x, z - c.z) / c.r;
      if (q < 1) h -= c.d * (1 - q * q); // bowl
      if (q > 0.8 && q < 1.5) h += c.d * 0.35 * Math.cos(((q - 1.15) / 0.35) * (Math.PI / 2)); // raised rim
    }
    h -= (x * x + z * z) / (2 * 260); // curvature: the near horizon of a small world
    pos.setY(i, h);
    const g = 0.42 + (fbm(x * 0.15 + 40, z * 0.15, 3) - 0.5) * 0.3; // brighter highlands, darker patches
    col.set([g, g * 0.98, g * 0.95], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const normal = loadTexture("moon-normal");
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal.repeat.set(14, 14);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, normalMap: normal, normalScale: new THREE.Vector2(1.6, 1.6) });
  return new THREE.Mesh(geo, mat);
}

/** Procedural cloud deck over Earth: swirled fbm, lit by the Sun so the night side stays dark. */
function cloudMaterial(octaves: number, sun: THREE.Vector3) {
  return new THREE.ShaderMaterial({
    defines: { OCT: octaves },
    uniforms: { t: { value: 0 }, sun: { value: sun } },
    vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float t; uniform vec3 sun; varying vec3 vP; varying vec3 vN;
      float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
                   mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
      float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < OCT; i++){ s += a*n3(p); p *= 2.07; a *= 0.5; } return s; }
      void main(){
        vec3 p = normalize(vP) * 4.2;
        vec3 q = vec3(fbm(p + vec3(0.0, t * 0.01, 0.0)), fbm(p + vec3(4.1, 1.7, 9.2)), fbm(p + vec3(7.3, 2.2, 5.5)));
        float c = fbm(p * 1.4 + 3.0 * q);
        float a = smoothstep(0.5, 0.74, c) * 0.85;
        float lit = max(dot(normalize(vN), normalize(sun)), 0.0);
        gl_FragColor = vec4(vec3(1.0) * (0.04 + 1.05 * lit), a * (0.25 + 0.75 * smoothstep(-0.1, 0.3, lit)));
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
  });
}

/** Home page backdrop for the EDGERUNNERS theme song. Detail, bloom and polygon counts follow Lite / Base Mode. */
export function Earthrise() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = makeRenderer(canvas);
    if (!renderer) return;
    const lite = isLite() || window.innerWidth < 700 || window.matchMedia("(hover: none)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 900);

    scene.add(starfield());
    // Sunlight from behind the viewer, low over the ground: long crater shadows, Earth nearly full.
    const sunDir = new THREE.Vector3(-0.35, 0.32, 1).normalize();
    const sun = new THREE.DirectionalLight(0xfff6ea, 3.1);
    sun.position.copy(sunDir).multiplyScalar(100);
    scene.add(sun, new THREE.AmbientLight(0x9fb4d8, 0.06));

    const moon = ground(lite);
    scene.add(moon);

    const EARTH = new THREE.Vector3(5, 12.5, -72), ER = 14;
    const earth = planet("earth", ER, lite ? 96 : 160);
    (earth.material as THREE.MeshStandardMaterial).roughness = 0.85;
    earth.position.copy(EARTH);
    earth.rotation.set(0.41, -1.2, 0); // axial tilt
    const cloudMat = cloudMaterial(lite ? 4 : 6, sunDir);
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.012, lite ? 96 : 160, lite ? 48 : 80), cloudMat);
    earth.add(clouds, atmosphere(ER * 1.03, "#6fb6ff", 4.5));
    scene.add(earth);

    const composer = lite ? null : new EffectComposer(renderer);
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.6, 0.78));
      composer.addPass(new OutputPass());
    }
    const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setPixelRatio(renderer.getPixelRatio());
      composer?.setSize(w, h);
      camera.aspect = w / h;
      // Shift the picture right on wide screens so the hero text keeps the left side.
      if (w > 900) camera.setViewOffset(w, h, -w * 0.14, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const still = prefersReducedMotion();
    const timer = new THREE.Timer();
    const look = new THREE.Vector3();
    let frame = 0;
    const render = () => {
      timer.update();
      const t = still ? 20 : timer.getElapsed() + 20;
      earth.rotation.y = -1.2 + t * 0.012;
      clouds.rotation.y = t * 0.004;
      cloudMat.uniforms.t.value = t;
      // A slow drift low over the ground, as if walking a rover across the plain.
      camera.position.set(Math.sin(t * 0.03) * 1.5, 0.55 + Math.sin(t * 0.05) * 0.08, 14 - Math.sin(t * 0.02) * 2);
      look.set(EARTH.x * 0.35, 3.6, -40);
      camera.lookAt(look);
      draw();
      if (!still) frame = requestAnimationFrame(render);
    };
    render();
    const onVis = () => {
      cancelAnimationFrame(frame);
      if (document.visibilityState === "visible" && !still) frame = requestAnimationFrame(render);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      disposeScene(scene);
      composer?.dispose();
      renderer.dispose();
    };
  }, []);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-black">
      <canvas ref={ref} className="h-full w-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.88) 0%, rgba(8,9,11,0.45) 42%, rgba(8,9,11,0.02) 100%)" }} />
    </div>,
    document.body,
  );
}
