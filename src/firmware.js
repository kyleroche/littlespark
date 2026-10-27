import {
  CPU,
  avrInstruction,
  AVRIOPort,
  portBConfig,
  AVRTimer,
  timer0Config,
  timer1Config,
  timer2Config,
} from "avr8js";
export function parseHex(text) {
  const image = new Uint8Array(32768).fill(255);
  let highest = 0,
    base = 0,
    eof = false;
  for (const raw of text.trim().split(/\r?\n/)) {
    let line = raw.trim();
    if (!/^:[0-9a-f]+$/i.test(line) || line.length % 2 !== 1)
      throw Error("Invalid firmware record.");
    const bytes = Uint8Array.from(line.slice(1).match(/../g), (x) =>
      parseInt(x, 16),
    );
    if (
      bytes.length !== bytes[0] + 5 ||
      bytes.reduce((a, b) => (a + b) & 255, 0) !== 0
    )
      throw Error("Firmware checksum did not match.");
    let count = bytes[0],
      address = bytes[1] * 256 + bytes[2],
      type = bytes[3];
    if (eof) throw Error("Unexpected data after firmware end.");
    if (type === 0) {
      if (base + address + count > 32256)
        throw Error("Firmware would overwrite the Uno bootloader.");
      image.set(bytes.slice(4, 4 + count), base + address);
      highest = Math.max(highest, base + address + count);
    } else if (type === 1) {
      if (count !== 0) throw Error("Invalid firmware end record.");
      eof = true;
    } else if (type === 4) {
      if (count !== 2) throw Error("Invalid firmware address.");
      base = (bytes[4] * 256 + bytes[5]) * 65536;
    } else if (type === 2) {
      if (count !== 2) throw Error("Invalid firmware address.");
      base = (bytes[4] * 256 + bytes[5]) * 16;
    } else if (type !== 3 && type !== 5)
      throw Error("Unsupported firmware record.");
  }
  if (!eof || highest === 0) throw Error("Incomplete firmware.");
  return image.slice(0, Math.ceil(highest / 128) * 128);
}
export function createUno(image, onPin = () => {}) {
  const flash = new Uint8Array(32768).fill(255);
  flash.set(image);
  const cpu = new CPU(new Uint16Array(flash.buffer));
  new AVRTimer(cpu, timer0Config);
  new AVRTimer(cpu, timer1Config);
  new AVRTimer(cpu, timer2Config);
  const port = new AVRIOPort(cpu, portBConfig);
  let last = false;
  port.addListener((value) => {
    let high = Boolean(value & 32);
    if (high !== last) {
      last = high;
      onPin(high, cpu.cycles);
    }
  });
  return {
    cpu,
    tick() {
      avrInstruction(cpu);
      cpu.tick();
    },
  };
}
export function verifyBlink(image, halfPeriod) {
  if (![250, 500, 1000].includes(halfPeriod))
    throw Error("Unsupported lesson speed.");
  let edges = [];
  const avr = createUno(image, (high, cycle) => edges.push({ high, cycle }));
  const limit = 16e6 * (halfPeriod / 1000) * 7 + 16e6;
  while (avr.cpu.cycles < limit && edges.length < 6) avr.tick();
  if (edges.length < 6) throw Error("The LED did not blink enough times.");
  const intervals = edges
    .slice(1)
    .map((e, i) => (e.cycle - edges[i].cycle) / 16000);
  if (
    intervals.some(
      (ms) => Math.abs(ms - halfPeriod) > Math.max(5, halfPeriod * 0.03),
    )
  )
    throw Error("The LED timing did not match this sketch.");
  return {
    passed: true,
    edges: edges.length,
    halfPeriod,
    measuredMs: intervals.reduce((a, b) => a + b, 0) / intervals.length,
    cycles: avr.cpu.cycles,
  };
}
