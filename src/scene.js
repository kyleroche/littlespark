import * as T from "three";
import {
  CAMERA_HELP,
  orbitView,
  panView,
  zoomView,
  advanceCamera,
} from "./view-controls.js";
const INK = 0x263d37;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mat = (color, roughness = 0.76, metalness = 0) =>
  new T.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
const edgeMat = new T.LineBasicMaterial({
  color: INK,
  depthWrite: false,
});
const outlineMat = new T.ShaderMaterial({
  uniforms: {
    resolution: { value: new T.Vector2(800, 500) },
    thickness: { value: 1.35 },
  },
  vertexShader: `uniform vec2 resolution; uniform float thickness; void main(){vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);vec3 n=normalize(normalMatrix*normal);vec2 direction=(projectionMatrix*vec4(n,0.0)).xy;float magnitude=length(direction);if(magnitude>0.001)clip.xy+=direction/magnitude*thickness*2.0/resolution*clip.w;gl_Position=clip;}`,
  fragmentShader: `void main(){gl_FragColor=vec4(0.11,0.18,0.15,1.0);}`,
  side: T.BackSide,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: 2,
  polygonOffsetUnits: 2,
});
const dark = mat("#34433e"),
  metal = mat("#b8b9a5", 0.45, 0.45),
  gold = mat("#c2a35d", 0.5, 0.35),
  cream = mat("#ddd9c4");
function mesh(geometry, material, parent, pos = [0, 0, 0], edges = true) {
  let m = new T.Mesh(geometry, material);
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  if (edges) {
    const hull = new T.Mesh(geometry, outlineMat);
    hull.renderOrder = -1;
    m.add(hull);
    const line = new T.LineSegments(new T.EdgesGeometry(geometry, 30), edgeMat);
    line.renderOrder = 2;
    m.add(line);
  }
  return m;
}
function box(w, h, d, material, parent, x = 0, y = 0, z = 0, edges = true) {
  return mesh(new T.BoxGeometry(w, h, d), material, parent, [x, y, z], edges);
}
function cyl(rt, rb, h, material, parent, x = 0, y = 0, z = 0, segments = 24) {
  return mesh(new T.CylinderGeometry(rt, rb, h, segments), material, parent, [
    x,
    y,
    z,
  ]);
}
function textPlane(parent, w, h, draw, x = 0, y = 0, z = 0) {
  let c = document.createElement("canvas");
  c.width = Math.round(w * 28);
  c.height = Math.round(h * 28);
  let ctx = c.getContext("2d");
  ctx.scale(28, 28);
  draw(ctx, w, h);
  let tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  let p = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  p.rotation.x = -Math.PI / 2;
  p.position.set(x, y, z);
  parent.add(p);
  return p;
}
function board() {
  let g = new T.Group();
  let shape = new T.Shape();
  shape.moveTo(-34, -26.5);
  shape.lineTo(28, -26.5);
  shape.lineTo(34, -20.5);
  shape.lineTo(34, 22);
  shape.lineTo(29.5, 26.5);
  shape.lineTo(-34, 26.5);
  shape.closePath();
  for (let [x, z] of [
    [-30, -22],
    [-30, 22],
    [27, 22],
    [27, -22],
  ]) {
    let hole = new T.Path();
    hole.absarc(x, z, 1.65, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  let geo = new T.ExtrudeGeometry(shape, {
    depth: 1.6,
    bevelEnabled: true,
    bevelSize: 0.22,
    bevelThickness: 0.22,
    bevelSegments: 1,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  mesh(geo, mat("#438b7b"), g, [0, 2, 0]);
  textPlane(
    g,
    65,
    50,
    (ctx, w, h) => {
      ctx.strokeStyle = "#71a592";
      ctx.lineWidth = 0.13;
      for (let j = 0; j < 27; j++) {
        let x = 5 + j * 2;
        ctx.beginPath();
        ctx.moveTo(x, 5);
        ctx.lineTo(x, 12 + (j % 5) * 3);
        ctx.lineTo(x + 4, 16 + (j % 5) * 3);
        ctx.lineTo(x + 4, 43);
        ctx.stroke();
      }
      ctx.strokeStyle = "#dedec1";
      ctx.lineWidth = 0.35;
      for (let [x, z] of [
        [3, 3],
        [3, 47],
        [60, 3],
        [60, 47],
      ]) {
        ctx.beginPath();
        ctx.arc(x, z, 2, 0, 7);
        ctx.stroke();
      }
      ctx.fillStyle = "#f1edd1";
      ctx.textAlign = "center";
      ctx.font = "bold 5px sans-serif";
      ctx.fillText("∞", 36, 23);
      ctx.font = "bold 2.8px sans-serif";
      ctx.fillText("ARDUINO", 36, 27);
      ctx.font = "1.7px monospace";
      ctx.fillText("UNO R3", 37, 30.4);
      ctx.font = "1.25px monospace";
      ctx.fillText("DIGITAL  ~ PWM", 44, 7);
      ctx.fillText("POWER", 22, 40);
      ctx.fillText("ANALOG IN", 49, 40);
      ctx.font = "1px monospace";
      for (let [i, label] of [
        "SCL",
        "SDA",
        "REF",
        "GND",
        "13",
        "12",
        "11",
        "10",
        "9",
        "8",
        "7",
        "6",
        "5",
        "4",
        "3",
        "2",
        "1",
        "0",
      ].entries()) {
        ctx.save();
        ctx.translate(i < 10 ? 15.5 + i * 2.54 : 40.9 + (i - 10) * 2.54, 5.3);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
      ctx.font = "1.1px monospace";
      ctx.fillText("ON", 57, 33);
      ctx.fillText("RESET", 8, 11);
    },
    0,
    3.87,
    0,
  );
  for (let [x, z] of [
    [-30, -22],
    [-30, 22],
    [27, 22],
    [27, -22],
  ]) {
    let ring = new T.Mesh(
      new T.RingGeometry(1.65, 2.5, 24),
      new T.MeshStandardMaterial({
        color: "#c2bd8a",
        side: T.DoubleSide,
        metalness: 0.3,
        roughness: 0.65,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 3.88, z);
    g.add(ring);
  }
  const header = (n, x, z) => {
    let group = new T.Group();
    g.add(group);
    box(n * 2.54 + 0.7, 7, 3.2, dark, group, x, 7, z);
    for (let i = 0; i < n; i++) {
      box(
        1.5,
        0.18,
        1.5,
        mat("#152c27"),
        group,
        x + (i - (n - 1) / 2) * 2.54,
        10.59,
        z,
        false,
      );
      box(0.5, 2, 0.5, gold, group, x + (i - (n - 1) / 2) * 2.54, 2, z, false);
    }
    return group;
  };
  header(10, -5.57, -23).userData.detail = "digitalPins";
  header(8, 17.29, -23).userData.detail = "digitalPins";
  header(8, -1, 23).userData.detail = "powerPins";
  header(6, 21, 23).userData.detail = "analogPins";
  let usb = new T.Group();
  g.add(usb);
  usb.userData.detail = "usbPort";
  box(13, 10, 12, metal, usb, -29, 8, -8);
  box(0.4, 7, 9, mat("#5e6d60"), usb, -35.6, 7.8, -8);
  box(0.45, 5.3, 6.8, cream, usb, -35.9, 7.7, -8);
  box(10, 0.4, 10, mat("#cbccb7"), usb, -29, 13.2, -8);
  for (let z of [-12, -4]) box(5, 0.2, 0.4, dark, usb, -29, 13.5, z);
  const jackBody = box(11, 9, 9, dark, g, -29, 7.5, 13);
  jackBody.userData.detail = "powerJack";
  let jack = cyl(3.7, 3.7, 6, dark, g, -34.5, 8, 13);
  jack.rotation.z = Math.PI / 2;
  jack.userData.detail = "powerJack";
  let jackHole = cyl(2.4, 2.4, 0.1, mat("#182c25"), g, -37.6, 8, 13);
  jackHole.rotation.z = Math.PI / 2;
  jackHole.userData.detail = "powerJack";
  let dip = box(32, 4.5, 8, dark, g, 9, 6.5, 11);
  dip.userData.detail = "microcontroller";
  const chipLabel = textPlane(
    g,
    28,
    6,
    (c) => {
      c.fillStyle = "#718173";
      c.font = "1.7px monospace";
      c.fillText("ATMEL", 3, 2.6);
      c.font = "1.3px monospace";
      c.fillText("ATMEGA328P", 3, 4.5);
    },
    9,
    8.8,
    11,
  );
  chipLabel.userData.detail = "microcontroller";
  for (let i = 0; i < 14; i++)
    for (let s of [-1, 1])
      box(0.65, 2, 1.6, metal, g, -6.3 + i * 2.35, 5.2, 11 + s * 4.7);
  for (let [x, z] of [
    [-18, 16],
    [-18, 7],
  ]) {
    cyl(3, 3, 5, metal, g, x, 6.5, z);
    textPlane(
      g,
      5,
      5,
      (c) => {
        c.fillStyle = "#556254";
        c.font = "1px monospace";
        c.textAlign = "center";
        c.fillText("47", 2.5, 2);
        c.fillText("16V", 2.5, 3.5);
      },
      x,
      9.05,
      z,
    );
  }
  box(5, 1.8, 8, metal, g, -8, 5, -7);
  box(6, 1, 6, dark, g, 7, 4.8, -7);
  for (let i = 0; i < 5; i++)
    for (let s of [-1, 1])
      box(0.4, 0.4, 1.2, metal, g, 5 + i, 4.5, -7 + s * 3.5, false);
  box(5, 1.2, 5, metal, g, -20, 4.7, -19);
  cyl(1.9, 1.9, 1.5, mat("#cc7453"), g, -20, 6, -19).userData.detail =
    "resetButton";
  for (let [x, z] of [
    [23, 14],
    [26, 14],
    [23, 17],
    [26, 17],
    [23, 20],
    [26, 20],
    [-11, -17],
    [-8, -17],
    [-11, -20],
    [-8, -20],
    [-11, -23],
    [-8, -23],
  ])
    box(0.6, 6, 0.6, gold, g, x, 6.5, z);
  for (let i = 0; i < 26; i++) {
    let x = -16 + (i % 9) * 5,
      z = -13 + Math.floor(i / 9) * 5;
    box(2.6, 0.7, 1.1, i % 3 === 0 ? cream : dark, g, x, 4.25, z);
    for (let s of [-1, 1])
      box(0.5, 0.72, 1.1, metal, g, x + s * 1.2, 4.28, z, false);
  }
  let on = box(1.6, 0.5, 1, mat("#bfd577"), g, 25, 4.1, 6);
  on.material.emissive = new T.Color("#a4b855");
  on.material.emissiveIntensity = 0.4;
  g.position.set(-38, 0, 0);
  g.userData.part = "board";
  return g;
}
function breadboard() {
  let g = new T.Group();
  box(84, 3, 55, cream, g, 0, 1.8, 0);
  box(83, 0.4, 1, mat("#aea991"), g, 0, 3.52, 0);
  let geo = new T.BoxGeometry(0.85, 0.16, 0.85),
    holes = new T.InstancedMesh(geo, mat("#5f6958"), 400);
  let o = new T.Object3D(),
    i = 0;
  for (let x = 0; x < 30; x++)
    for (let side of [-1, 1])
      for (let row = 0; row < 5; row++) {
        o.position.set((x - 14.5) * 2.54, 3.38, side * (4 + row * 2.54));
        o.updateMatrix();
        holes.setMatrixAt(i++, o.matrix);
      }
  for (let side of [-1, 1])
    for (let row = 0; row < 2; row++)
      for (let x = 0; x < 25; x++) {
        o.position.set(
          (x - 12) * 2.54 + Math.floor(x / 5) * 2.54 - 5.08,
          3.38,
          side * (20 + row * 2.54),
        );
        o.updateMatrix();
        holes.setMatrixAt(i++, o.matrix);
      }
  g.add(holes);
  textPlane(
    g,
    83,
    54,
    (c, w, h) => {
      c.fillStyle = "#949b80";
      c.font = "1.1px monospace";
      c.textAlign = "center";
      for (let i = 0; i < 30; i++)
        if (i === 0 || (i + 1) % 5 === 0) {
          c.fillText(String(i + 1), 4.67 + i * 2.54, 9);
          c.fillText(String(i + 1), 4.67 + i * 2.54, 45.5);
        }
      for (let i = 0; i < 5; i++) {
        c.fillText("ABCDE"[i], 1.8, 13.3 + i * 2.54);
        c.fillText("FGHIJ"[i], 81.2, 31.5 + i * 2.54);
      }
      for (let side of [-1, 1])
        for (let row = 0; row < 2; row++) {
          c.strokeStyle = row ? "#8eabb4" : "#c58d78";
          c.lineWidth = 0.28;
          c.beginPath();
          c.moveTo(3, 27 + side * (21.7 + row * 2.54));
          c.lineTo(80, 27 + side * (21.7 + row * 2.54));
          c.stroke();
          c.fillStyle = c.strokeStyle;
          c.fillText(row ? "−" : "+", 1, 27 + side * (20 + row * 2.54));
        }
    },
    0,
    3.51,
    0,
  );
  g.position.set(55, 0, 0);
  g.userData.part = "breadboard";
  return g;
}
function usbCable() {
  let g = new T.Group();
  mesh(new T.TorusGeometry(7, 0.62, 8, 48), dark, g, [0, 1, 0]).rotation.x =
    Math.PI / 2;
  box(5, 2.3, 2.7, dark, g, -9, 1.5, 0);
  box(4, 1.6, 2.4, metal, g, -13, 1.5, 0);
  box(3, 3, 3, dark, g, 9, 1.5, 0);
  box(2.6, 2.6, 3, metal, g, 11.5, 1.5, 0);
  g.userData.part = "usb";
  return g;
}
function led() {
  let g = new T.Group(),
    m = mat("#d25f4d", 0.3);
  m.emissive = new T.Color("#ee7f36");
  m.emissiveIntensity = 0;
  const lens = new T.Group();
  g.add(lens);
  cyl(2.7, 2.7, 0.8, m, lens, 0, 8.3, 0);
  cyl(2.35, 2.35, 4, m, lens, 0, 10.5, 0);
  let cap = mesh(
    new T.SphereGeometry(2.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    m,
    lens,
    [0, 12.5, 0],
    false,
  );
  for (let z of [-4, 4]) {
    let points = [
      new T.Vector3(0, 8, z / 3),
      new T.Vector3(0, 6, z),
      new T.Vector3(0, 3, z),
    ];
    mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 12, 0.28, 8, false),
      metal,
      g,
      [0, 0, 0],
      false,
    );
  }
  let glow = new T.PointLight("#ffaa55", 0, 25);
  glow.position.set(0, 13, 0);
  g.add(glow);
  let shine = mesh(
    new T.SphereGeometry(0.45, 12, 8),
    mat("#f7d1a2", 0.2),
    g,
    [-1, 13.3, 1.5],
    false,
  );
  g.position.set(43.57, 0, 0);
  g.userData.part = "led";
  g.userData.lens = m;
  g.userData.glow = glow;
  return g;
}
function resistor() {
  let g = new T.Group();
  let body = cyl(1.35, 1.35, 8, mat("#d5b98b"), g, 7.62, 6, -9.08);
  body.rotation.z = Math.PI / 2;
  for (let [x, color] of [
    [5, "#9a2025"],
    [6, "#9a2025"],
    [8, "#765d3d"],
    [10, "#b69c52"],
  ]) {
    let band = cyl(1.39, 1.39, 0.65, mat(color), g, x, 6, -9.08);
    band.rotation.z = Math.PI / 2;
  }
  for (let side of [0, 15.24]) {
    let points = [
      new T.Vector3(side < 5 ? 3.6 : 11.6, 6, -9.08),
      new T.Vector3(side, 6, -9.08),
      new T.Vector3(side, 3, -9.08),
    ];
    mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 16, 0.25, 8, false),
      metal,
      g,
      [0, 0, 0],
      false,
    );
  }
  g.position.set(43.57, 0, 0);
  g.userData.part = "resistor";
  return g;
}
function wire(start, end, color, height) {
  let g = new T.Group();
  let c = new T.CatmullRomCurve3([
    new T.Vector3(...start),
    new T.Vector3(start[0] + 10, height, start[2]),
    new T.Vector3(end[0] - 15, height, end[2]),
    new T.Vector3(...end),
  ]);
  let geo = new T.TubeGeometry(c, 64, 0.65, 8, false);
  g.userData.curve = c;
  g.userData.tube = mesh(geo, mat(color), g, [0, 0, 0], true);
  for (let p of [start, end]) {
    box(1.8, 3, 1.8, dark, g, p[0], p[1] - 1, p[2]);
    box(0.45, 2, 0.45, metal, g, p[0], p[1] - 3, p[2], false);
  }
  g.userData.part = "wires";
  return g;
}
export class Workbench {
  constructor({ onPart, onReady, onInspectChange = () => {} }) {
    this.canvas = document.querySelector("#workbench");
    this.host = document.querySelector("#scene");
    this.onPart = onPart;
    this.onInspectChange = onInspectChange;
    this.mode = "rotate";
    this.inspection = null;
    this.step = 0;
    this.parts = {};
    this.animations = [];
    this.pointers = new Map();
    this.needsRender = true;
    this.lastFrameTime = performance.now();
    this.renderer = new T.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-80, 80, 65, -65, 1, 700);
    this.view = {
      x: -35,
      z: 0,
      scale: 100,
      azimuth: 0.63,
      elevation: Math.PI / 4,
      y: 0,
    };
    this.goal = { ...this.view };
    this.scene.add(new T.HemisphereLight("#fff9dd", "#94a18c", 2.3));
    let sun = new T.DirectionalLight("#fff9e3", 3);
    sun.position.set(-70, 130, 65);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -150,
      right: 150,
      top: 140,
      bottom: -140,
      near: 1,
      far: 400,
    });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.25;
    sun.shadow.radius = 4;
    this.scene.add(sun);
    let ground = new T.Mesh(
      new T.PlaneGeometry(1600, 1600),
      new T.ShadowMaterial({ opacity: 0.18, color: "#4b5138" }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = -0.2;
    this.scene.add(ground);
    let grid = new T.GridHelper(1200, 150, "#cdd1bb", "#d8dbc5");
    grid.position.y = -0.15;
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    this.scene.add(grid);
    this.parts.board = board();
    this.parts.breadboard = breadboard();
    this.parts.led = led();
    this.parts.resistor = resistor();
    this.parts.usb = usbCable();
    this.parts.wires = new T.Group();
    this.parts.wires.add(
      wire([-44.84, 10.6, -23], [58.81, 3.6, -14.16], "#d2a054", 35),
      wire([-47.38, 10.6, -23], [43.57, 3.6, 14.16], "#4e6860", 26),
    );
    this.parts.wires.userData.part = "wires";
    for (let [k, p] of Object.entries(this.parts)) {
      this.scene.add(p);
      p.userData.home = p.position.clone();
      p.visible = k === "board";
    }
    this.kitHomes = {
      board: new T.Vector3(-40, 0, -12),
      breadboard: new T.Vector3(48, 0, -12),
      led: new T.Vector3(20, 0, 32),
      resistor: new T.Vector3(50, 0, 42),
      wires: new T.Vector3(-35, 0, 35),
      usb: new T.Vector3(-5, 0, 33),
    };
    this.raycaster = new T.Raycaster();
    this.mouse = new T.Vector2();
    this.labelItems = [];
    for (let [key, label, pos] of [
      ["board", "ARDUINO UNO", [-12, 12, 24]],
      ["usb", "USB PORT", [-72, 16, -8]],
      ["microcontroller", "THE TINY BRAIN", [-29, 16, 11]],
      ["digitalPins", "DIGITAL PINS", [-30, 20, -23]],
      ["powerJack", "POWER SOCKET", [-72, 16, 13]],
      ["breadboard", "A PLACE TO CONNECT", [78, 7, 18]],
      ["led", "YOUR LITTLE LIGHT", [35, 38, 0]],
      ["resistor", "220 Ω · SLOWS THE FLOW", [75, 18, -9]],
      ["d13", "D13", [-44.84, 18, -23]],
      ["gnd", "GND", [-50.38, 11, -23]],
    ]) {
      let el = document.createElement("button");
      el.className = "label";
      el.textContent = label;
      el.onclick = () => {
        const detail = {
          usb: "usbPort",
          microcontroller: "microcontroller",
          digitalPins: "digitalPins",
          powerJack: "powerJack",
          d13: "digitalPins",
          gnd: "powerPins",
        }[key];
        onPart(detail ? "board" : key, detail);
      };
      document.querySelector("#labels").append(el);
      this.labelItems.push({ key, el, pos: new T.Vector3(...pos) });
    }
    new ResizeObserver(() => this.resize()).observe(this.host);
    this.resize();
    this.bind();
    this.loop();
    onReady?.();
  }
  resize() {
    this.needsRender = true;
    let w = this.host.clientWidth,
      h = this.host.clientHeight;
    this.renderer.setSize(w, h, false);
    outlineMat.uniforms.resolution.value.set(w, h);
    this.aspect = w / h;
  }
  setStep(step, animate = true) {
    this.needsRender = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.inspection = null;
    this.onInspectChange(null);
    let wasKit = this.step === -1;
    this.step = step;
    this.animations = [];
    this.popAnimation = null;
    if (step === -1) {
      for (let [k, p] of Object.entries(this.parts)) {
        p.visible = true;
        p.position.copy(this.kitHomes[k]);
        p.scale.setScalar(k === "wires" ? 0.35 : 1);
      }
      this.resetKit();
      return;
    }
    for (let [k, p] of Object.entries(this.parts)) {
      if (wasKit) {
        p.position.copy(p.userData.home);
        p.scale.setScalar(1);
      }
      let visibility = {
        board: true,
        breadboard: step >= 1,
        led: step >= 2,
        resistor: step >= 3,
        wires: step >= 4,
        usb: false,
      };
      let next = visibility[k];
      if (next && !p.visible && k === "wires" && animate && !reduced) {
        this.wireAnimation = performance.now();
      } else if (next && !p.visible && animate && !reduced) {
        p.position.copy(p.userData.home);
        p.position.y = 42;
        this.animations.push({
          p,
          from: performance.now(),
          duration: 1100,
          home: p.userData.home.clone(),
        });
      }
      p.visible = next;
      if (!next) p.position.copy(p.userData.home);
    }
    this.home();
  }
  resetKit() {
    this.needsRender = true;
    this.renderer.shadowMap.needsUpdate = true;
    this.inspection = null;
    this.returnView = null;
    this.onInspectChange(null);
    for (const part of Object.values(this.parts)) part.visible = true;
    this.selectedKit = null;
    this.popAnimation = {
      from: performance.now(),
      duration: reduced ? 1 : 700,
      items: Object.entries(this.parts).map(([k, p]) => ({
        p,
        start: p.position.clone(),
        end: this.kitHomes[k].clone(),
        startScale: p.scale.x,
        endScale: k === "wires" ? 0.35 : 1,
      })),
    };
    Object.assign(this.goal, {
      x: 5,
      y: 3,
      z: 4,
      scale: 170,
      azimuth: 0.35,
      elevation: Math.PI / 4,
    });
  }
  popout(key, detail = null) {
    this.needsRender = true;
    this.renderer.shadowMap.needsUpdate = true;
    const part = this.parts[key];
    if (!part) return false;
    if (this.step !== -1 && !part.visible) return false;
    if (!this.inspection) this.returnView = { ...this.goal };
    this.animations = [];
    this.popAnimation = null;
    if (this.step === -1) {
      this.selectedKit = key;
      for (const [name, p] of Object.entries(this.parts)) {
        p.visible = name === key;
        p.position.copy(this.kitHomes[name]);
        p.scale.setScalar(name === "wires" ? 0.35 : 1);
      }
    } else {
      // Inspect in place so connections and breadboard positions remain truthful.
      for (const p of Object.values(this.parts))
        p.position.copy(p.userData.home);
    }
    let targets = [];
    if (detail)
      part.traverse((object) => {
        if (object.userData.detail === detail) targets.push(object);
      });
    if (!targets.length) targets = [part];
    this.scene.updateMatrixWorld(true);
    const bounds = new T.Box3();
    for (const target of targets)
      bounds.union(new T.Box3().setFromObject(target));
    const center = bounds.getCenter(new T.Vector3());
    const size = bounds.getSize(new T.Vector3());
    this.inspection = { key, detail, point: center.clone() };
    Object.assign(this.goal, {
      x: center.x,
      y: center.y,
      z: center.z,
      scale: Math.max(
        22,
        Math.max(size.x / this.aspect, size.z, size.y) * 1.75,
      ),
      elevation: 0.75,
      azimuth: 0.5,
    });
    // Leave a little breathing room for the floating field-note card.
    const offset = this.goal.scale * this.aspect * 0.1;
    this.goal.x -= Math.cos(this.goal.azimuth) * offset;
    this.goal.z += Math.sin(this.goal.azimuth) * offset;
    this.goal.y -= (this.goal.scale * 0.14) / Math.cos(this.goal.elevation);
    this.onInspectChange(this.inspection);
    return true;
  }
  retreat() {
    if (!this.inspection) {
      this.home();
      return;
    }
    if (this.step === -1) {
      this.resetKit();
    } else if (this.returnView) Object.assign(this.goal, this.returnView);
    this.inspection = null;
    this.returnView = null;
    this.onInspectChange(null);
  }
  setMode(mode) {
    this.mode = mode === "pan" ? "pan" : "rotate";
    for (const [id, value] of [
      ["rotate-mode", "rotate"],
      ["pan-mode", "pan"],
    ]) {
      const button = document.querySelector("#" + id);
      button.setAttribute("aria-pressed", String(this.mode === value));
    }
    document.querySelector("#drag-hint").textContent =
      this.mode === "rotate"
        ? "DRAG TO TURN · SCROLL TO ZOOM"
        : "DRAG TO MOVE · SCROLL TO ZOOM";
  }
  home() {
    this.needsRender = true;
    this.inspection = null;
    this.returnView = null;
    this.onInspectChange(null);
    if (this.step === -1) {
      this.resetKit();
      return;
    }
    Object.assign(
      this.goal,
      { y: 0, elevation: Math.PI / 4 },
      this.step === 0
        ? { x: -35, z: 0, scale: 99, azimuth: 0.63 }
        : this.step === 2 || this.step === 3
          ? { x: 48, z: 0, scale: 88, azimuth: 0.5 }
          : { x: 10, z: 0, scale: 181, azimuth: 0.58 },
    );
  }
  focus(key, detail = null) {
    return this.popout(key, detail);
  }
  replay() {
    if (this.step === -1) {
      if (this.selectedKit) this.popout(this.selectedKit);
      else this.resetKit();
      return;
    }
    let keys = ["board", "breadboard", "led", "resistor", "wires", "led"];
    let p = this.parts[keys[this.step]];
    if (this.step === 0) {
      this.goal.azimuth += Math.PI * 2;
      return;
    }
    if (this.step === 4) {
      this.home();
      this.wireAnimation = performance.now();
      return;
    }
    if (this.step === 5) {
      this.focus("led");
      return;
    }
    p.position.y = 45;
    this.animations.push({
      p,
      from: performance.now(),
      duration: 1500,
      home: p.userData.home.clone(),
    });
    this.focus(keys[this.step]);
  }
  setLed(on, color = "#df8255") {
    this.needsRender = true;
    let l = this.parts.led;
    l.userData.lens.color.set(color);
    l.userData.lens.emissive.set(color);
    l.userData.lens.emissiveIntensity = on ? 1.9 : 0;
    l.userData.glow.color.set(color);
    l.userData.glow.intensity = on ? 22 : 0;
  }
  zoom(factor, px, py) {
    const old = this.goal.scale;
    zoomView(this.goal, factor);
    if (px !== undefined) {
      const ratio = (old - this.goal.scale) / old;
      panView(
        this.goal,
        (-(px - this.host.clientWidth / 2) * ratio * old) / this.goal.scale,
        (-(py - this.host.clientHeight / 2) * ratio * old) / this.goal.scale,
        this.host.clientHeight,
      );
    }
  }
  pick(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    this.mouse.set(
      ((clientX - r.left) / r.width) * 2 - 1,
      (-(clientY - r.top) / r.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);
    for (const hit of this.raycaster.intersectObjects(
      Object.values(this.parts),
      true,
    )) {
      if (!hit.object.isMesh) continue;
      let p = hit.object,
        key = null,
        detail = null,
        visible = true;
      while (p) {
        if (!p.visible) visible = false;
        detail ??= p.userData.detail;
        key ??= p.userData.part;
        p = p.parent;
      }
      if (visible && key) return { key, detail };
    }
    return null;
  }
  bind() {
    const c = this.canvas;
    c.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const r = c.getBoundingClientRect();
        this.zoom(
          Math.exp(e.deltaY * 0.0015),
          e.clientX - r.left,
          e.clientY - r.top,
        );
      },
      { passive: false },
    );
    c.addEventListener("pointerdown", (e) => {
      if (![0, 1, 2].includes(e.button)) return;
      c.focus({ preventScroll: true });
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        button: e.button,
        moved: false,
      });
      if (this.pointers.size > 1)
        for (const p of this.pointers.values()) p.moved = true;
      c.style.cursor = "grabbing";
    });
    c.addEventListener("pointermove", (e) => {
      const pointer = this.pointers.get(e.pointerId);
      if (!pointer) {
        c.style.cursor = this.pick(e.clientX, e.clientY) ? "pointer" : "grab";
        return;
      }
      const previous = [...this.pointers.values()].map((p) => ({ ...p }));
      const dx = e.clientX - pointer.x,
        dy = e.clientY - pointer.y;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved ||=
        Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY) > 5;
      if (this.pointers.size === 2) {
        const now = [...this.pointers.values()];
        const oldDistance = Math.hypot(
          previous[0].x - previous[1].x,
          previous[0].y - previous[1].y,
        );
        const distance = Math.hypot(now[0].x - now[1].x, now[0].y - now[1].y);
        if (distance > 2 && oldDistance > 2) this.zoom(oldDistance / distance);
        panView(this.goal, dx / 2, dy / 2, this.host.clientHeight);
      } else if (this.mode === "pan" || e.shiftKey || pointer.button !== 0) {
        panView(this.goal, dx, dy, this.host.clientHeight);
      } else orbitView(this.goal, dx, dy);
    });
    const release = (e, cancelled = false) => {
      const pointer = this.pointers.get(e.pointerId);
      if (
        !cancelled &&
        pointer &&
        !pointer.moved &&
        pointer.button === 0 &&
        this.pointers.size === 1
      ) {
        const hit = this.pick(e.clientX, e.clientY);
        if (hit) this.onPart(hit.key, hit.detail);
      }
      this.pointers.delete(e.pointerId);
      if (c.hasPointerCapture(e.pointerId))
        c.releasePointerCapture(e.pointerId);
      c.style.cursor = "grab";
    };
    c.addEventListener("pointerup", (e) => release(e));
    c.addEventListener("pointercancel", (e) => release(e, true));
    c.addEventListener("lostpointercapture", (e) =>
      this.pointers.delete(e.pointerId),
    );
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", (e) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        document.querySelector("dialog[open]") ||
        e.target.closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "q",
          "e",
          "r",
          "+",
          "=",
          "-",
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "escape",
        ].includes(key)
      )
        e.preventDefault();
      if (key === "escape") {
        if (this.inspection) this.retreat();
        return;
      }
      if (key === "q") orbitView(this.goal, 50, 0);
      if (key === "e") orbitView(this.goal, -50, 0);
      if (key === "arrowup") orbitView(this.goal, 0, 20);
      if (key === "arrowdown") orbitView(this.goal, 0, -20);
      if (key === "r") this.home();
      if (key === "+" || key === "=") this.zoom(0.8);
      if (key === "-") this.zoom(1.25);
      if (key === "a") panView(this.goal, 25, 0, this.host.clientHeight);
      if (key === "d") panView(this.goal, -25, 0, this.host.clientHeight);
      if (key === "w") panView(this.goal, 0, 25, this.host.clientHeight);
      if (key === "s") panView(this.goal, 0, -25, this.host.clientHeight);
    });
    document.querySelector("#rotate-mode").onclick = () =>
      this.setMode("rotate");
    document.querySelector("#pan-mode").onclick = () => this.setMode("pan");
    document.querySelector("#zoom-in").onclick = () => this.zoom(0.8);
    document.querySelector("#zoom-out").onclick = () => this.zoom(1.25);
    document.querySelector("#rotate-left").onclick = () =>
      orbitView(this.goal, 50, 0);
    document.querySelector("#rotate-right").onclick = () =>
      orbitView(this.goal, -50, 0);
    document.querySelector("#tilt-up").onclick = () =>
      orbitView(this.goal, 0, 25);
    document.querySelector("#tilt-down").onclick = () =>
      orbitView(this.goal, 0, -25);
    document.querySelector("#reset-view").onclick = () => this.home();
    document.querySelector("#controls-help").innerHTML = Object.values(
      CAMERA_HELP,
    )
      .map((text) => "<p>" + text + "</p>")
      .join("");
  }
  loop() {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    const elapsedMs = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const cameraChanged = advanceCamera(
      this.view,
      this.goal,
      elapsedMs,
      reduced,
    );
    const modelsMoving = Boolean(
      this.popAnimation || this.animations.length || this.wireAnimation,
    );
    if (!cameraChanged && !modelsMoving && !this.needsRender) return;
    this.needsRender = false;
    if (modelsMoving) this.renderer.shadowMap.needsUpdate = true;
    let v = this.view;
    let w = (v.scale * this.aspect) / 2;
    this.camera.left = -w;
    this.camera.right = w;
    this.camera.top = v.scale / 2;
    this.camera.bottom = -v.scale / 2;
    this.camera.position.set(
      v.x + 225 * Math.cos(v.elevation) * Math.sin(v.azimuth),
      v.y + 225 * Math.sin(v.elevation),
      v.z + 225 * Math.cos(v.elevation) * Math.cos(v.azimuth),
    );
    this.camera.lookAt(v.x, v.y, v.z);
    this.camera.updateProjectionMatrix();
    if (this.popAnimation) {
      let a = this.popAnimation,
        f = Math.min(1, (now - a.from) / a.duration),
        ease = 1 - (1 - f) ** 3;
      for (let item of a.items) {
        item.p.position.lerpVectors(item.start, item.end, ease);
        item.p.scale.setScalar(
          item.startScale + (item.endScale - item.startScale) * ease,
        );
      }
      if (f === 1) this.popAnimation = null;
    }
    this.animations = this.animations.filter((a) => {
      let f = Math.min(1, (now - a.from) / a.duration);
      a.p.position.y = a.home.y + (1 - f) ** 3 * 42;
      return f < 1;
    });
    if (this.wireAnimation) {
      let elapsed = now - this.wireAnimation;
      this.parts.wires.children.forEach((w, i) => {
        let f = T.MathUtils.clamp((elapsed - i * 1100) / 1400, 0, 1);
        let tube = w.userData.tube;
        tube.geometry.setDrawRange(
          0,
          Math.floor((tube.geometry.index.count * f) / 6) * 6,
        );
        for (let child of w.children)
          if (child !== tube) child.visible = f === 1;
        for (let child of tube.children) child.visible = f === 1;
      });
      if (elapsed > 2500) this.wireAnimation = null;
    }
    for (let l of this.labelItems) {
      let visible =
        l.key === "board"
          ? this.step === 0
          : ["usb", "microcontroller", "digitalPins", "powerJack"].includes(
                l.key,
              )
            ? this.step === 0
            : l.key === "breadboard"
              ? this.step === 1
              : l.key === "led"
                ? this.step >= 2
                : l.key === "resistor"
                  ? this.step >= 3
                  : this.step >= 4;
      let p = l.pos.clone().project(this.camera);
      l.el.style.display =
        this.step !== -1 &&
        !this.inspection &&
        visible &&
        Math.abs(p.x) < 0.9 &&
        Math.abs(p.y) < 0.8
          ? "flex"
          : "none";
      l.el.style.left = ((p.x + 1) / 2) * 100 + "%";
      l.el.style.top = ((-p.y + 1) / 2) * 100 + "%";
    }
    if (this.inspection?.point) {
      const point = this.inspection.point.clone().project(this.camera);
      const width = this.host.clientWidth,
        height = this.host.clientHeight;
      const x = ((point.x + 1) / 2) * width,
        y = ((-point.y + 1) / 2) * height;
      const panel = document.querySelector("#inspection-panel");
      const anchorX = panel.offsetLeft + panel.offsetWidth * 0.78;
      const anchorY = panel.offsetTop;
      document
        .querySelector("#inspection-annotation")
        .setAttribute("viewBox", `0 0 ${width} ${height}`);
      document
        .querySelector("#inspection-leader")
        .setAttribute(
          "d",
          `M ${x} ${y} L ${x} ${anchorY - 10} L ${anchorX} ${anchorY}`,
        );
      document.querySelector("#inspection-marker").setAttribute("cx", x);
      document.querySelector("#inspection-marker").setAttribute("cy", y);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
