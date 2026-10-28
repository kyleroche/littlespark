import { verifyBlink, verifyTraffic, verifyButton, createUno } from "./firmware.js";
let active = null;
self.onmessage = ({ data }) => {
  if(data.type==="button"){active?.avr.setButton(Boolean(data.pressed));return;}
  if (data.type === "stop") {
    active = null;
    return;
  }
  if (data.type !== "run") return;
  try {
    const image = new Uint8Array(data.image);
    const result = data.button ? verifyButton(image,data.halfPeriod) : data.traffic ? verifyTraffic(image, data.halfPeriod) : verifyBlink(image, data.halfPeriod);
    self.postMessage({ type: "verified", ...result });
    const avr = createUno(image, (high) =>
      !data.traffic && self.postMessage({ type: "pin", high }),
      (mask) => data.traffic && self.postMessage({ type: "traffic-pin", mask }),
    );
    if(data.button) avr.setButton(false);
    const run = { avr, start: performance.now() };
    active = run;
    function frame() {
      if (active !== run) return;
      const target = (performance.now() - run.start) * 16000;
      const end = Math.min(target, avr.cpu.cycles + 320000);
      while (avr.cpu.cycles < end) avr.tick();
      setTimeout(frame, 4);
    }
    frame();
  } catch (e) {
    self.postMessage({ type: "error", message: e.message });
  }
};
