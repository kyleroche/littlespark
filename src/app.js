import "./style.css";
import { Workbench } from "./scene.js";
import { parseHex } from "./firmware.js";
import { UnoConnection } from "./uploader.js";
import { BOARD_DETAILS } from "./component-details.js";
import { TOUR_STEPS } from "./app-tour.js";
const $ = (s) => document.querySelector(s);
const unboxing = {
  short: "Unbox your kit",
  sub: "Find six little essentials",
  title: "Find these six things.",
  description:
    "Take these parts out of your official Arduino Starter Kit. Tap a name for a close-up, then tick it off when you find it.",
  tip: "Just a few parts today.",
  detail:
    "Leave the other treasures in the box. Keep the USB cable unplugged while we build.",
  caption: "SIX LITTLE FINDS · ONE BRIGHT IDEA",
  next: "My parts are ready!",
};
const kitItems = [
  {
    key: "board",
    name: "Arduino Uno",
    qty: "1 board",
    hint: "The teal board with a big square USB port. Look for UNO printed on it.",
    glyph: "▤",
  },
  {
    key: "usb",
    name: "USB cable",
    qty: "1 cable",
    hint: "One flat USB-A end for your computer; one square USB-B end for the Uno. Keep it unplugged for now.",
    glyph: "⌁",
  },
  {
    key: "breadboard",
    name: "Breadboard",
    qty: "1 · 400 points",
    hint: "The white rectangle full of little holes, with a long gap down the middle and red/blue rails at the sides.",
    glyph: "⠿",
  },
  {
    key: "led",
    name: "Red LED",
    qty: "1 · two legs",
    hint: "A tiny red light with two metal legs. Pick the one with TWO legs, not the four-legged RGB LED.",
    glyph: "♟",
  },
  {
    key: "resistor",
    name: "220 Ω resistor",
    qty: "1 · red, red, brown",
    hint: "Look for red–red–brown–gold bands on a four-band resistor. A five-band 220 Ω resistor is red–red–black–black–brown. Ask a grown-up to check.",
    glyph: "▰",
  },
  {
    key: "wires",
    name: "Jumper wires",
    qty: "2 · solid core",
    hint: "Two wires with bare metal tips at both ends. The kit’s wire colors may differ from our golden and green ones.",
    glyph: "∿",
  },
];
let selectedKit = null;
let tourIndex = -1,
  tourSnapshot = null,
  lastTourStep = -1,
  simulationEpoch = 0;
const originalIntro = document.querySelector(".intro").innerHTML;
function isTour() {
  return tourIndex >= 0;
}
const steps = [
  {
    short: "Meet your board",
    sub: "Say hello to the brain",
    title: "Meet your new little brain.",
    description:
      "This is an Arduino. It follows your instructions to make things happen. Try dragging the board to explore it!",
    tip: "Think of it like a tiny helper.",
    detail: "You give it a plan. It does the same little job, over and over.",
    caption: "THE LITTLE BRAIN OF YOUR CIRCUIT",
    next: "Hello, Arduino!",
  },
  {
    short: "Make some room",
    sub: "Bring in the breadboard",
    title: "A playground for your parts.",
    description:
      "Watch the breadboard slide into place. Its tiny holes let us connect parts without glue or solder.",
    tip: "Some holes are secret friends.",
    detail:
      "Each group of five holes is connected underneath. The middle gap keeps the two sides apart.",
    caption: "A LITTLE PLAYGROUND FOR ELECTRICITY",
    next: "Let’s add a light",
  },
  {
    short: "Add your light",
    sub: "Meet the mighty little LED",
    title: "A tiny light with two legs.",
    description:
      "The LED lands across the breadboard’s middle gap. Its long leg goes in E11. Its short leg goes in F11.",
    tip: "Legs matter!",
    detail:
      "The long leg is the way in (+). The short leg is the way out (−). Electricity needs to go the right way.",
    caption: "LONG LEG IN · SHORT LEG OUT",
    next: "Keep our LED happy",
  },
  {
    short: "Slow things down",
    sub: "A resistor to the rescue",
    title: "Every little light needs a friend.",
    description:
      "The 220 Ω resistor connects C11 to C17. It slows the electricity down so our LED gets just enough.",
    tip: "Like a gentle squeeze on a hose.",
    detail:
      "The resistor limits the flow. Our LED’s long leg shares a connected group with one end of the resistor.",
    caption: "A SMALL RESISTOR WITH A BIG JOB",
    next: "Let’s connect it",
  },
  {
    short: "Join the dots",
    sub: "Make a complete path",
    title: "Give electricity a way home.",
    description:
      "The golden wire joins D13 to A17. The green wire joins GND to J11. Watch the path come together!",
    tip: "A circuit is a round trip.",
    detail:
      "D13 → resistor → LED → GND. The path has to go all the way around for the light to shine.",
    caption: "OUT THROUGH D13 · HOME THROUGH GND",
    next: "Time for a little magic",
  },
  {
    short: "Make it blink!",
    sub: "Your first bright idea",
    title: "Ready, set… little light!",
    description:
      "Choose a speed, then test your program. We’ll run the real Arduino instructions in a tiny virtual brain.",
    tip: "You’re the one making it happen.",
    detail:
      "Changing the wait changes the rhythm. Try a slow blink, then a fast one. What do you notice?",
    caption: "YOUR FIRST CIRCUIT, ALIVE",
    next: "Test my circuit",
  },
];
let state = {
  step: -1,
  speed: 500,
  color: "#d25f4d",
  completed: [],
  found: [],
};
try {
  let saved = JSON.parse(localStorage.getItem("little-sparks-v2"));
  if (saved)
    state = {
      ...state,
      step: Math.max(
        -1,
        Math.min(5, Number.isInteger(saved.step) ? saved.step : -1),
      ),
      speed: [250, 500, 1000].includes(saved.speed) ? saved.speed : 500,
      color: ["#d25f4d", "#6b9b70", "#d5b549"].includes(saved.color)
        ? saved.color
        : "#d25f4d",
      completed: Array.isArray(saved.completed)
        ? saved.completed.filter(
            (n) => Number.isInteger(n) && n >= -1 && n <= 5,
          )
        : [],
      found: Array.isArray(saved.found)
        ? saved.found.filter((k) => kitItems.some((item) => item.key === k))
        : [],
    };
} catch {}
let workbench,
  worker = null,
  verified = null,
  running = false,
  busy = false,
  connection = null,
  manifest = null,
  inspectKey = "board",
  hardwareBusy = false;
function save() {
  try {
    localStorage.setItem("little-sparks-v2", JSON.stringify(state));
  } catch {}
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
const parts = {
  usb: {
    title: "Power and ideas, in one cable",
    description:
      "Find the USB cable with one flat USB-A end and one square USB-B end. It will bring power and our program to the Uno. Leave it unplugged until our circuit is ready.",
    specs: [
      ["COMPUTER END", "USB-A"],
      ["UNO END", "USB-B"],
      ["RIGHT NOW", "Keep unplugged"],
    ],
  },
  board: {
    title: "Arduino Uno R3",
    description:
      "Your circuit’s tiny brain. The USB port brings it power and new instructions. Pin D13 can turn our light on and off.",
    specs: [
      ["BRAIN", "ATmega328P"],
      ["POWER", "5 V from USB"],
      ["OUR OUTPUT", "Digital pin 13"],
    ],
  },
  breadboard: {
    title: "A home for your circuit",
    description:
      "Build, change, and try again! The five holes in each short group are connected underneath. The middle gap separates the two sides.",
    specs: [
      ["LONG LED LEG", "E11"],
      ["SHORT LED LEG", "F11"],
      ["NO SOLDER", "Just push parts in"],
    ],
  },
  led: {
    title: "A mighty little LED",
    description:
      "LED means light-emitting diode. That’s a fancy way of saying: a tiny part that lights up when electricity flows the right way.",
    specs: [
      ["LONG LEG (+)", "E11 · to resistor"],
      ["SHORT LEG (−)", "F11 · to ground"],
      ["SIZE", "5 mm"],
    ],
  },
  resistor: {
    title: "Slow and steady",
    description:
      "Our resistor limits current so the LED stays happy. Connect it from C11 to C17. Either direction works.",
    specs: [
      ["RESISTANCE", "220 Ω"],
      ["COLOR BANDS", "Red · red · brown"],
      ["CONNECTED TO", "C11 and C17"],
    ],
  },
  wires: {
    title: "Little roads for electricity",
    description:
      "Jumper wires join the board to the breadboard. Together they complete the trip from D13 through the resistor and LED, then back to GND.",
    specs: [
      ["GOLDEN WIRE", "D13 → A17"],
      ["GREEN WIRE", "GND → J11"],
      ["BUILD FIRST", "Unplug USB while wiring"],
    ],
  },
};
function showInspection(info) {
  clearTimeout(showInspection.closeTimer);
  $("#back-to-step").hidden = !info;
  $("#inspection-annotation").toggleAttribute("hidden", !info);
  const panel = $("#inspection-panel");
  panel.classList.toggle("is-closing", !info);
  if (info) panel.hidden = false;
  else
    showInspection.closeTimer = setTimeout(() => {
      panel.hidden = true;
    }, 140);
  if (!info) {
    selectedKit = null;
    if (state.step === -1 && !isTour()) render();
    return;
  }
  const content =
    (info.detail && BOARD_DETAILS[info.detail]) || parts[info.key];
  $("#inspection-title").textContent = content.title;
  $("#inspection-description").textContent = content.description;
}
function openPart(key, detail = null) {
  if (!parts[key]) return;
  if (!workbench?.popout(key, detail)) {
    toast("This part arrives in a later step.");
    return;
  }
  if (state.step === -1 && !isTour()) {
    selectedKit = key;
    render();
  }
}
try {
  workbench = new Workbench({
    onPart: openPart,
    onInspectChange: showInspection,
    onReady: () => $("#scene-loading").remove(),
  });
} catch (e) {
  $("#scene-loading").textContent =
    "This browser couldn’t open the 3D workbench. Try an updated Chrome or Edge browser.";
  console.error(e);
}
function codeText() {
  return `// Our first little light\nvoid setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(${state.speed});\n  digitalWrite(13, LOW);\n  delay(${state.speed});\n}`;
}
function renderCode() {
  $("#code-delay").value = String(state.speed);
  const escape = (s) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  $("#code").innerHTML = codeText()
    .split("\n")
    .map((line, i) => {
      let text = escape(line);
      if (line.startsWith("//")) text = `<span class="comment">${text}</span>`;
      else
        text = text
          .replace(/\b(void)\b/g, '<span class="keyword">$1</span>')
          .replace(
            /\b(setup|loop|digitalWrite|pinMode|delay)\b/g,
            '<span class="fn">$1</span>',
          )
          .replace(
            /\b(13|250|500|1000|HIGH|LOW|OUTPUT)\b/g,
            '<span class="value">$1</span>',
          );
      return `<span class="line-no">${i + 1}</span>${text}`;
    })
    .join("\n");
}
function simStatus(text, status = "") {
  $("#sim-status").textContent = text;
  $(".simulation-status").className = "simulation-status " + status;
}
function invalidate() {
  simulationEpoch++;
  worker?.terminate();
  worker = null;
  verified = null;
  running = false;
  busy = false;
  workbench?.setLed(false, state.color);
  updateUpload();
}
function render() {
  if (isTour()) {
    renderTour();
    return;
  }
  const step = state.step === -1 ? unboxing : steps[state.step];
  $("#step-list").innerHTML = [unboxing, ...steps]
    .map((s, navIndex) => {
      let i = navIndex - 1;
      return `<button class="step-link ${i === state.step ? "active" : ""} ${state.completed.includes(i) ? "completed" : ""}" data-step="${i}" aria-label="Step ${i + 2}: ${s.short}" ${i === state.step ? 'aria-current="step"' : ""}><span class="step-no">${state.completed.includes(i) ? "✓" : String(i + 2).padStart(2, "0")}</span><div><strong>${s.short}</strong><small>${s.sub}</small></div></button>`;
    })
    .join("");
  document
    .querySelectorAll("[data-step]")
    .forEach((b) => (b.onclick = () => go(Number(b.dataset.step))));
  $("#step-count").textContent =
    `STEP ${String(state.step + 2).padStart(2, "0")} / 07`;
  $("#step-art").innerHTML =
    `${String(state.step + 2).padStart(2, "0")}<span>✦</span>`;
  $("#step-title").textContent = step.title;
  $("#step-description").textContent = step.description;
  $("#tip-title").textContent = step.tip;
  $("#tip-text").textContent = step.detail;
  $("#scene-number").textContent =
    `FIG. ${String(state.step + 2).padStart(2, "0")}`;
  $("#scene-title").textContent =
    state.step === -1 && selectedKit
      ? kitItems.find((item) => item.key === selectedKit).name.toUpperCase() +
        " · FIND THIS IN YOUR KIT"
      : step.caption;
  $("#previous-step").disabled = state.step === -1;
  $("#next-step").innerHTML =
    state.step === 5
      ? busy
        ? "Testing the tiny brain…"
        : running
          ? "Pause the light <span>Ⅱ</span>"
          : verified
            ? "Blink again <span>▷</span>"
            : `${step.next} <span>▷</span>`
      : `${step.next} <span>→</span>`;
  $("#next-step").disabled =
    busy || (state.step === -1 && state.found.length < kitItems.length);
  $("#step-time").textContent =
    state.step === 5 ? "PLAY TIME" : state.step === -1 ? "~2 MIN" : "~1 MIN";
  let completed = state.completed.length;
  $("#progress-label").textContent = `${completed} of 7 steps explored`;
  $("#progress-percent").textContent = `${Math.round((completed / 7) * 100)}%`;
  $("#progress-fill").style.width = `${(completed / 7) * 100}%`;
  $("#step-extra").innerHTML =
    state.step === 5
      ? `<div class="speed-choices" aria-label="Blink speed">${[
          [1000, "Slow"],
          [500, "Steady"],
          [250, "Fast"],
        ]
          .map(
            ([ms, title]) =>
              `<button data-speed="${ms}" class="${state.speed === ms ? "selected" : ""}" aria-pressed="${state.speed === ms}">${title}</button>`,
          )
          .join(
            "",
          )}</div><div class="color-choices" aria-label="Virtual LED color">${[
          ["#d25f4d", "Red"],
          ["#6b9b70", "Green"],
          ["#d5b549", "Yellow"],
        ]
          .map(
            ([color, title]) =>
              `<button data-color="${color}" aria-label="${title} LED" aria-pressed="${state.color === color}" class="${state.color === color ? "selected" : ""}" style="background:${color}"></button>`,
          )
          .join(
            "",
          )}</div>${verified ? '<div class="success-note">✓ Your code passed the virtual test!<br>Try it on a real Uno with a grown-up.</div>' : ""}`
      : "";
  if (state.step === -1) {
    $("#step-extra").innerHTML =
      `<div class="kit-checklist"><div class="kit-count"><span>YOUR FIRST-CIRCUIT CHECKLIST</span><b>${state.found.length} / 6</b></div>${kitItems.map((item) => `<div class="kit-row ${state.found.includes(item.key) ? "found" : ""} ${selectedKit === item.key ? "selected" : ""}"><button class="kit-look" data-kit="${item.key}" aria-label="Look closely at ${item.name}"><span class="kit-glyph ${item.key}-glyph">${item.glyph}</span><span><strong>${item.name}</strong><small>${item.qty}</small></span><i>⌕</i></button><button class="kit-check" data-found="${item.key}" aria-label="${state.found.includes(item.key) ? "Unmark" : "Found"} ${item.name}" aria-pressed="${state.found.includes(item.key)}">${state.found.includes(item.key) ? "✓" : "+"}</button></div>`).join("")}</div>${selectedKit ? `<div class="kit-detail"><strong>${kitItems.find((i) => i.key === selectedKit).name}</strong><p>${kitItems.find((i) => i.key === selectedKit).hint}</p><button id="back-to-kit">↶ See all six parts</button></div>` : '<p class="kit-hint">Tap + when you find a part. No kit yet? Find them on screen!</p>'}<a class="kit-source" href="https://store-usa.arduino.cc/products/arduino-starter-kit-multi-language" target="_blank" rel="noopener noreferrer">Based on the official Uno R3 Starter Kit ↗</a>`;
    document.querySelectorAll("[data-kit]").forEach(
      (b) =>
        (b.onclick = () => {
          selectedKit = b.dataset.kit;
          workbench?.popout(selectedKit);
          render();
        }),
    );
    document.querySelectorAll("[data-found]").forEach(
      (b) =>
        (b.onclick = () => {
          const k = b.dataset.found;
          if (state.found.includes(k))
            state.found = state.found.filter((v) => v !== k);
          else {
            state.found.push(k);
            selectedKit = k;
            workbench?.popout(k);
          }
          render();
        }),
    );
    if ($("#back-to-kit"))
      $("#back-to-kit").onclick = () => {
        selectedKit = null;
        workbench?.retreat();
        render();
      };
  }
  document.querySelectorAll("[data-speed]").forEach((button) => {
    button.onclick = () => changeSpeed(Number(button.dataset.speed));
  });
  document.querySelectorAll("[data-color]").forEach(
    (b) =>
      (b.onclick = () => {
        state.color = b.dataset.color;
        workbench?.setLed(false, state.color);
        save();
        render();
      }),
  );
  renderCode();
  save();
}
function go(step) {
  if (isTour()) exitTour(false);
  if (step !== state.step) {
    invalidate();
    simStatus(
      step === 5
        ? "Ready to test the same program we can send to your Uno."
        : "Ready when you are. We’ll test your circuit in step 7.",
    );
  }
  state.step = step;
  workbench?.setStep(step);
  render();
}
$("#next-step").onclick = () => {
  if (isTour()) {
    advanceTour(1);
    return;
  }
  if (state.step < 5) {
    if (state.step === -1 && state.found.length < 6) return;
    if (!state.completed.includes(state.step)) state.completed.push(state.step);
    go(state.step + 1);
  } else if (running) {
    worker?.terminate();
    worker = null;
    running = false;
    workbench?.setLed(false, state.color);
    simStatus("Paused. Your tested program is ready for a real Uno.", "passed");
    render();
  } else runTest();
};
$("#previous-step").onclick = () =>
  isTour() ? advanceTour(-1) : go(Math.max(-1, state.step - 1));
$("#replay").onclick = () => {
  if (isTour()) {
    demoTour();
    return;
  }
  workbench?.replay();
  if (state.step === 5 && !running) runTest();
};
$("#restart").onclick = () => {
  if (isTour()) exitTour(false);
  state.completed = [];
  state.found = [];
  selectedKit = null;
  invalidate();
  go(-1);
  toast("A fresh little adventure. Let’s begin!");
};
async function runTest() {
  invalidate();
  const epoch = simulationEpoch;
  const chosenSpeed = state.speed;
  busy = true;
  render();
  simStatus(
    "Running actual AVR instructions and checking the LED timing…",
    "running",
  );
  try {
    manifest ??= await fetch("/firmware/manifest.json").then((r) => {
      if (!r.ok) throw Error("Firmware library is unavailable.");
      return r.json();
    });
    const record = manifest.variants[String(chosenSpeed)];
    if (!record) throw Error("This speed is not available.");
    let response = await fetch(record.path);
    if (!response.ok) throw Error("Could not load the Arduino program.");
    let text = await response.text();
    let digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    if (digest !== record.sha256)
      throw Error("Firmware integrity check failed.");
    if (epoch !== simulationEpoch) return;
    let image = parseHex(text);
    worker = new Worker(new URL("./emulator.worker.js", import.meta.url), {
      type: "module",
    });
    let currentWorker = worker;
    let timeout = setTimeout(() => {
      if (worker === currentWorker) {
        invalidate();
        simStatus("That test took too long. Try again.");
        render();
      }
    }, 30000);
    worker.onmessage = ({ data }) => {
      if (worker !== currentWorker) return;
      if (data.type === "verified") {
        clearTimeout(timeout);
        verified = { image, halfPeriod: chosenSpeed, digest };
        running = true;
        busy = false;
        if (!isTour() && !state.completed.includes(5)) state.completed.push(5);
        simStatus(
          `Test passed · ${data.edges} LED changes checked · ${Math.round(data.measuredMs)} ms on / off`,
          "passed",
        );
        updateUpload();
        render();
        toast("You did it! You made a little light. ✦");
      } else if (data.type === "pin") workbench?.setLed(data.high, state.color);
      else if (data.type === "error") {
        clearTimeout(timeout);
        invalidate();
        simStatus(data.message);
        render();
      }
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      invalidate();
      simStatus("The virtual brain couldn’t start. Please try again.");
      render();
    };
    worker.postMessage({ type: "run", image, halfPeriod: chosenSpeed });
  } catch (e) {
    if (epoch !== simulationEpoch) return;
    invalidate();
    simStatus(e.message);
    toast(e.message);
    render();
  }
}
$("#copy-code").onclick = async () => {
  try {
    await navigator.clipboard.writeText(codeText());
    toast("Code copied. Ready for your Arduino IDE, too.");
  } catch {
    toast("Select the code to copy it in this browser.");
  }
};
document
  .querySelectorAll("[data-part]")
  .forEach((b) => (b.onclick = () => openPart(b.dataset.part)));
$("#back-to-step").onclick = () => workbench?.retreat();
$("#inspection-close").onclick = () => workbench?.retreat();
$("#code-delay").onchange = (e) => changeSpeed(Number(e.target.value));
document
  .querySelectorAll(".dialog-close")
  .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      let r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
$("#parent-notes").onclick = () => $("#notes-dialog").show();
$(".close-notes").onclick = () => $("#notes-dialog").close();
function updateUpload() {
  let supported = "serial" in navigator;
  $("#connect-usb").disabled = !supported || hardwareBusy;
  $("#upload-usb").disabled =
    !connection || !verified || !$("#adult-check").checked || hardwareBusy;
  if (!supported)
    $("#hardware-status").textContent =
      "USB connection isn’t available in this browser. Open this site in desktop Chrome or Edge. Your virtual adventure still works here.";
  else if (!verified && !hardwareBusy)
    $("#hardware-status").textContent =
      "Finish step 7 and pass the virtual test to unlock upload.";
  else if (!hardwareBusy)
    $("#hardware-status").textContent = connection
      ? "Uno connected. Check the grown-up box to send the tested program."
      : "Virtual test passed. Ready to connect your Uno R3.";
}
$("#board-button").onclick = () => {
  updateUpload();
  $("#board-dialog").show();
};
$("#adult-check").onchange = updateUpload;
$("#connect-usb").onclick = async () => {
  if (connection) {
    await connection.close();
    connection = null;
  }
  try {
    let port = await navigator.serial.requestPort();
    let candidate = new UnoConnection(port);
    try {
      await candidate.open();
    } catch (e) {
      await candidate.close();
      throw e;
    }
    connection = candidate;
    $("#board-button").innerHTML =
      '<span>⌁</span> Uno connected <span class="status-dot" style="background:#70a878"></span>';
    $("#connect-usb").textContent = "Reconnect Uno";
    updateUpload();
  } catch (e) {
    $("#hardware-status").textContent =
      e.name === "NotFoundError"
        ? "No board selected. You can choose one when you’re ready."
        : `Couldn’t connect: ${e.message}`;
  }
};
$("#upload-usb").onclick = async () => {
  if (!verified || !connection || !$("#adult-check").checked || hardwareBusy)
    return;
  hardwareBusy = true;
  let firmware = verified.image.slice();
  updateUpload();
  try {
    await connection.upload(
      firmware,
      (p) =>
        ($("#hardware-status").textContent =
          `Sending and checking your program… ${p}%`),
    );
    $("#hardware-status").textContent =
      "✓ Program uploaded and read back successfully. Look at your real LED!";
    toast("From your screen to your desk. Your program is on the Uno!");
  } catch (e) {
    $("#hardware-status").textContent = e.message;
  } finally {
    hardwareBusy = false;
    $("#connect-usb").disabled = false;
    $("#upload-usb").disabled =
      !connection || !verified || !$("#adult-check").checked;
  }
};
navigator.serial?.addEventListener("disconnect", async () => {
  await connection?.close();
  connection = null;
  $("#board-button").innerHTML =
    '<span>⌁</span> Connect a board <span class="status-dot"></span>';
  updateUpload();
});
function changeSpeed(speed) {
  if (![250, 500, 1000].includes(speed)) return;
  state.speed = speed;
  invalidate();
  simStatus("New rhythm! Test this version before sending it to a board.");
  if (!isTour()) save();
  render();
}
function startTour() {
  if (isTour()) return;
  tourSnapshot = { speed: state.speed, color: state.color };
  invalidate();
  tourIndex = 0;
  lastTourStep = -1;
  simStatus("Practice workbench. Your circuit lesson is saved.");
  document.body.classList.add("in-tour");
  $("#tour-lesson").classList.add("active");
  $("#tour-nav").hidden = false;
  workbench?.setStep(5, false);
  workbench?.setMode("rotate");
  renderTour();
}
function exitTour(restoreScene = true) {
  if (!isTour()) return;
  const finished = tourIndex === TOUR_STEPS.length - 1;
  tourIndex = -1;
  lastTourStep = -1;
  invalidate();
  simStatus("Back to your adventure. Test your current program in step 7.");
  state.speed = tourSnapshot.speed;
  state.color = tourSnapshot.color;
  tourSnapshot = null;
  selectedKit = null;
  document.body.classList.remove("in-tour");
  $("#tour-lesson").classList.remove("active");
  $("#tour-nav").hidden = true;
  document
    .querySelectorAll(".tour-target")
    .forEach((el) => el.classList.remove("tour-target"));
  document.querySelector(".intro").innerHTML = originalIntro;
  try {
    localStorage.setItem(
      "little-sparks-tour-v1",
      JSON.stringify({ completed: finished }),
    );
  } catch {}
  $("#replay").textContent = "↻ Watch that again";
  if (restoreScene) {
    workbench?.setStep(state.step, false);
    render();
    document
      .querySelector(".intro")
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function advanceTour(direction) {
  if (!isTour() || busy) return;
  if (direction > 0 && tourIndex === TOUR_STEPS.length - 1) {
    exitTour();
    return;
  }
  invalidate();
  tourIndex = Math.max(
    0,
    Math.min(TOUR_STEPS.length - 1, tourIndex + direction),
  );
  workbench?.home();
  renderTour();
}
function renderTour() {
  const step = TOUR_STEPS[tourIndex];
  document.querySelector(".intro h1").innerHTML =
    "A little tour. A lot to explore<span>.</span>";
  document.querySelector(".intro>div>p").textContent =
    "Learn the controls, then make something wonderful.";
  $("#step-count").textContent =
    `APP TOUR · ${tourIndex + 1} / ${TOUR_STEPS.length}`;
  $("#step-time").textContent = "TRY IT OUT";
  $("#step-art").innerHTML =
    String(tourIndex + 1).padStart(2, "0") + "<span>✧</span>";
  $("#step-title").textContent = step.title;
  $("#step-description").textContent = step.description;
  $("#tip-title").textContent = step.tip;
  $("#tip-text").textContent = step.detail;
  $("#scene-number").textContent = "PRACTICE WORKBENCH";
  $("#scene-title").textContent = "YOUR CIRCUIT LESSON IS SAVED";
  $("#step-extra").innerHTML =
    `<div class="tour-dots">${TOUR_STEPS.map((s, i) => `<i class="${i === tourIndex ? "active" : ""}"></i>`).join("")}</div><div class="tour-practice"><strong>Have a little go.</strong>Try the real controls, or use the practice button below.</div><button id="tour-demo" class="button secondary" ${busy ? "disabled" : ""}>${busy ? "Testing…" : step.action}</button><button id="exit-tour" class="tour-exit">← Back to my adventure</button>`;
  $("#tour-demo").onclick = demoTour;
  $("#exit-tour").onclick = () => exitTour();
  $("#next-step").innerHTML =
    tourIndex === TOUR_STEPS.length - 1
      ? "Back to my adventure <span>→</span>"
      : "Next discovery <span>→</span>";
  $("#next-step").disabled = busy;
  $("#previous-step").disabled = tourIndex === 0;
  $("#replay").textContent = "↻ Show me again";
  $("#tour-nav-label").textContent =
    `${tourIndex + 1}/${TOUR_STEPS.length} · ${step.title}`;
  $("#tour-back").disabled = tourIndex === 0 || busy;
  $("#tour-forward").disabled = busy;
  $("#tour-forward").textContent =
    tourIndex === TOUR_STEPS.length - 1 ? "Finish ✓" : "Next →";
  renderCode();
  if (lastTourStep !== tourIndex) {
    document
      .querySelectorAll(".tour-target")
      .forEach((el) => el.classList.remove("tour-target"));
    document.querySelector(step.target)?.classList.add("tour-target");
    lastTourStep = tourIndex;
  }
}
function demoTour() {
  if (!isTour() || busy) return;
  switch (TOUR_STEPS[tourIndex].demo) {
    case "lessons":
      $("#tour-lesson").scrollIntoView({ behavior: "smooth", block: "center" });
      break;
    case "rotate":
      workbench?.setMode("rotate");
      if (workbench) {
        workbench.goal.azimuth += Math.PI / 3;
        workbench.goal.elevation = 0.95;
      }
      break;
    case "pan":
      workbench?.retreat();
      workbench?.setMode("pan");
      workbench?.zoom(0.8);
      toast("Move mode is on. Drag the workbench to slide it.");
      break;
    case "inspect":
      openPart("board", "microcontroller");
      break;
    case "code":
      changeSpeed(250);
      $("#code-notebook").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      $("#code-delay").focus({ preventScroll: true });
      break;
    case "test":
      runTest();
      break;
    case "hardware":
      updateUpload();
      $("#board-dialog").show();
      break;
  }
}
$("#app-tour-button").onclick = () => (isTour() ? exitTour() : startTour());
$("#tour-lesson").onclick = () => (isTour() ? exitTour() : startTour());
$("#tour-back").onclick = () => advanceTour(-1);
$("#tour-forward").onclick = () => advanceTour(1);
$("#tour-quit").onclick = () => exitTour();
document.addEventListener("pointerdown", (event) => {
  for (const panel of document.querySelectorAll("dialog[open]"))
    if (!panel.contains(event.target)) panel.close();
});
go(state.step);
