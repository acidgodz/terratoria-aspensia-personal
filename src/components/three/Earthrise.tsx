"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { disposeScene, isLite, loadTexture, makeRenderer, prefersReducedMotion, starfield } from "./space";

// EDGERUNNERS theme, home page only: standing on the Moon, low over grey regolith, with Earth hanging
// huge above the horizon. Earth is enlarged for drama (from the real Moon it spans about 2 degrees), framed and
// lit like a film still: sunlight from below, an ocean glint and golden dusk across the top.
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

const NOISE = `
float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < OCT; i++){ s += a*n3(p); p *= 2.07; a *= 0.5; } return s; }`;

/**
 * Earth in one shader: the NASA Blue Marble surface, a swirled procedural cloud deck, golden light near the
 * day-night line, a sun glint off the oceans and blue scattering at the limb. Cloud detail follows Lite / Base Mode.
 */
function earthMaterial(octaves: number, sun: THREE.Vector3) {
  return new THREE.ShaderMaterial({
    defines: { OCT: octaves },
    uniforms: { day: { value: loadTexture("earth") }, sun: { value: sun }, t: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      void main(){ vUv = uv; vP = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D day; uniform vec3 sun; uniform float t; varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vW;
      ${NOISE}
      void main(){
        vec3 N = normalize(vN), L = normalize(sun), V = normalize(cameraPosition - vW), H = normalize(L + V);
        float ndl = dot(N, L), lit = max(ndl, 0.0), dayside = smoothstep(-0.08, 0.25, ndl);
        vec3 albedo = texture2D(day, vUv).rgb;
        float water = smoothstep(0.02, 0.1, albedo.b - albedo.r);
        // Clouds: large swirling systems (domain-warped noise) broken into fine cells.
        vec3 sp = normalize(vP) * 3.2;
        vec3 q = vec3(fbm(sp + vec3(0.0, 0.0, t * 0.004)), fbm(sp + vec3(5.2, 1.3, 2.8)), fbm(sp + vec3(2.1, 7.7, 3.3)));
        float c = fbm(sp * 1.3 + 3.2 * q);
        float cloud = smoothstep(0.37, 0.52, c) * smoothstep(0.25, 0.6, fbm(sp * 16.0 + 3.0 * q));
        // Sunlight turns golden near the day-night line, white where the Sun is high.
        vec3 sunCol = mix(vec3(1.0, 0.62, 0.26), vec3(1.0, 0.95, 0.86), smoothstep(0.05, 0.6, ndl));
        vec3 col = albedo * mix(1.0, 0.32, water) * sunCol * lit * 1.5;
        float nh = max(dot(N, H), 0.0);
        col += water * (1.0 - cloud) * (pow(nh, 80.0) * 4.0 + pow(nh, 10.0) * 0.35) * vec3(1.0, 0.88, 0.7) * dayside;
        vec3 cc = sunCol * (0.015 + 1.45 * pow(lit, 0.75)) + pow(nh, 16.0) * 0.45 * dayside;
        col = mix(col, cc, cloud * (0.3 + 0.7 * dayside));
        // Blue scattering at the limb, strongest on the sunlit edge.
        float fr = pow(1.0 - max(dot(N, V), 0.0), 2.6);
        col += vec3(0.22, 0.58, 1.0) * fr * smoothstep(-0.3, 0.5, ndl) * 1.1;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

/** Atmosphere halo outside the limb: bright cyan on the lit edge, fading to nothing on the night side and outwards. */
function haloMaterial(sun: THREE.Vector3, k: number) {
  return new THREE.ShaderMaterial({
    uniforms: { sun: { value: sun }, edge: { value: Math.sqrt(1 - 1 / (k * k)) } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 sun; uniform float edge; varying vec3 vN; varying vec3 vV;
      void main(){
        float d = clamp(-vV.z / edge, 0.0, 1.0);
        float i = pow(d, 2.2) * smoothstep(-0.35, 0.6, dot(normalize(vN), normalize(sun)));
        gl_FragColor = vec4(vec3(0.25, 0.62, 1.0) * i * 1.8, 1.0);
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
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
    camera.rotation.x = 0.18; // looking up a little, so the horizon sits low in the frame

    scene.add(starfield());
    // Low sunlight from behind the viewer rakes across the ground and lights the near faces of the rocks.
    const groundSun = new THREE.DirectionalLight(0xfff6ea, 3.4);
    groundSun.position.set(-35, 30, 100);
    scene.add(groundSun, new THREE.AmbientLight(0x9fb4d8, 0.05));
    scene.add(ground(lite));

    // The camera and Earth ride one rig: Earth (very far away in reality) holds its place in the frame while the
    // ground drifts past. Earth fills the top of the frame, centred, its lower limb just above the horizon.
    const rig = new THREE.Group();
    rig.add(camera);
    scene.add(rig);
    const ER = 31.5, EL = THREE.MathUtils.degToRad(19.5), ED = 72;
    const sun = new THREE.Vector3(0, -1, 0);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(ER, lite ? 128 : 224, lite ? 64 : 112), earthMaterial(lite ? 4 : 7, sun));
    earth.position.set(0, Math.sin(EL) * ED, -Math.cos(EL) * ED);
    earth.rotation.set(0.41, 3.4, 0);
    const k = 1.06;
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(ER * k, 96, 48), haloMaterial(sun, k)));
    camera.add(earth);

    const composer = lite ? null : new EffectComposer(renderer);
    if (composer) {
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.5, 0.85));
      composer.addPass(new OutputPass());
    }
    const draw = () => (composer ? composer.render() : renderer.render(scene, camera));

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      composer?.setPixelRatio(renderer.getPixelRatio());
      composer?.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w < h ? 58 : 40; // a wider lens on portrait phones keeps Earth's shape readable
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const still = prefersReducedMotion();
    const timer = new THREE.Timer();
    const ew = new THREE.Vector3(), cw = new THREE.Vector3(), up = new THREE.Vector3();
    let frame = 0;
    const render = () => {
      timer.update();
      const t = still ? 20 : timer.getElapsed() + 20;
      rig.position.set(Math.sin(t * 0.03) * 0.6, 0.6 + Math.sin(t * 0.05) * 0.05, 14 - Math.sin(t * 0.02) * 1.2);
      earth.rotation.y = 3.4 + t * 0.01;
      (earth.material as THREE.ShaderMaterial).uniforms.t.value = t;
      // Earth's sunlight comes from below and slightly towards the viewer, like the reference shot: the lower half
      // bright with an ocean glint, the top falling into golden dusk.
      rig.updateMatrixWorld();
      earth.getWorldPosition(ew);
      camera.getWorldPosition(cw);
      const v = cw.sub(ew).normalize();
      up.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
      up.addScaledVector(v, -up.dot(v)).normalize();
      sun.copy(up).multiplyScalar(-0.97).addScaledVector(v, -0.25).normalize();
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
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,9,11,0.7) 0%, rgba(8,9,11,0.25) 38%, rgba(8,9,11,0) 62%)" }} />
    </div>,
    document.body,
  );
}
