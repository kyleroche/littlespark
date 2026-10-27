// Development-only export page (.artwork-export/index.html), not a Vite build entry.
import * as T from "three";
import {
  createBoard,
  createBreadboard,
  createLed,
  createResistor,
  createWire,
} from "./scene.js";
const width = 3600,
  height = 2800;
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(width, height);
renderer.setPixelRatio(1);
renderer.setClearColor(0, 0);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = false;
const scene = new T.Scene();
scene.add(new T.HemisphereLight("#fff9df", "#a6b79b", 2.2));
const sun = new T.DirectionalLight("#fff7e3", 2.5);
sun.position.set(-70, 130, 65);
scene.add(sun);
const camera = new T.OrthographicCamera(-100, 100, 80, -80, 1, 700);
const group = new T.Group();
scene.add(group);
function part(object, x, y, z) {
  object.position.set(x, y, z);
  group.add(object);
  return object;
}
function wire(a, b, color, h = 26) {
  return part(createWire(a, b, color, h), 0, 0, 0);
}
function board() {
  return part(createBoard(), -52, 0, 0);
}
function base() {
  board();
  part(createBreadboard(), 60, 0, 0);
}
function led(x, color) {
  const p = part(createLed(), x, 0, 0);
  p.userData.lens.color.set(color);
  return p;
}
function resistor(x) {
  return part(createResistor(), x, 0, 0);
}
function button() {
  let g = new T.Group();
  for (const x of [-2.54, 2.54])
    for (const z of [-4, 4]) {
      let p = new T.Mesh(
        new T.BoxGeometry(0.5, 2, 0.5),
        new T.MeshStandardMaterial({ color: "#b8b9a5" }),
      );
      p.position.set(x, 3.8, z);
      g.add(p);
    }
  let body = new T.Mesh(
    new T.BoxGeometry(7, 3.5, 7),
    new T.MeshStandardMaterial({ color: "#34433e" }),
  );
  body.position.y = 5.2;
  g.add(body);
  let cap = new T.Mesh(
    new T.CylinderGeometry(2.3, 2.3, 1.8, 24),
    new T.MeshStandardMaterial({ color: "#ce6e51" }),
  );
  cap.position.y = 7.8;
  g.add(cap);
  return part(g, 73.97, 0, 0);
}
function blink() {
  base();
  led(48.57, "#bd443d");
  resistor(48.57);
  wire([-58.84, 10.6, -23], [63.81, 3.6, -14.16], "#d5a34d", 35);
  wire([-61.38, 10.6, -23], [48.57, 3.6, 14.16], "#476d5d", 26);
}
function groundRail() {
  wire([-61.38, 10.6, -23], [30, 3.6, 22.54], "#476d5d", 24);
}
const artworks = [
  {
    name: "arduino-uno",
    label: "Arduino Uno illustration",
    build() {
      board();
    },
  },
  {
    name: "completed-blink-circuit",
    label: "Completed Blink circuit",
    build: blink,
  },
  {
    name: "completed-traffic-light-circuit",
    label: "Completed traffic light circuit",
    build() {
      base();
      groundRail();
      for (const [i, color] of ["#bd443d", "#d1aa48", "#63946c"].entries()) {
        const x = 48.57 + i * 12.7;
        led(x, color);
        resistor(x);
        wire(
          [-58.84 + i * 2.54, 10.6, -23],
          [x + 15.24, 3.6, -14.16],
          ["#bf6653", "#d5a34d", "#7c9f68"][i],
          38 + i * 4,
        );
        wire([x, 3.6, 14.16], [x, 3.6, 22.54], "#476d5d", 7);
      }
    },
  },
  {
    name: "completed-button-led-circuit",
    label: "Completed button and LED circuit",
    build() {
      blink();
      button();
      wire([-30.9, 10.6, -23], [71.43, 3.6, 14.16], "#6d91a1", 42);
      wire([76.51, 3.6, 14.16], [48.57, 3.6, 14.16], "#476d5d", 11);
    },
  },
];
for (const art of artworks) {
  group.clear();
  art.build();
  scene.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(group),
    center = box.getCenter(new T.Vector3()),
    size = box.getSize(new T.Vector3());
  const range = Math.max(size.x / (width / height), size.z, size.y) * 1.7;
  camera.left = (-range * width) / height / 2;
  camera.right = -camera.left;
  camera.top = range / 2;
  camera.bottom = -camera.top;
  camera.position.set(center.x + 120, center.y + 170, center.z + 165);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  group.traverse((o) => {
    if (o.material?.uniforms?.resolution)
      o.material.uniforms.resolution.value.set(width, height);
    if (o.material?.uniforms?.thickness)
      o.material.uniforms.thickness.value = 3.5;
  });
  renderer.render(scene, camera);
  const data = renderer.domElement.toDataURL("image/png");
  let figure = document.createElement("figure");
  let img = document.createElement("img");
  img.src = data;
  img.alt = art.label;
  let a = document.createElement("a");
  a.href = data;
  a.download = `little-spark-${art.name}.png`;
  a.textContent = `Download ${art.label}`;
  figure.append(img, a);
  document.querySelector("#preview").append(figure);
}
document.querySelector("#status").textContent = "4 illustrations ready.";
