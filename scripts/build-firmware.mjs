import { buildR4Firmware } from './build-r4-firmware.mjs';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { trafficSource, buttonSource, blinkSource } from "../src/arduino-lessons.js";
const root = resolve(import.meta.dirname, "..");
const temp = mkdtempSync(join(tmpdir(), "little-sparks-"));
mkdirSync(join(root, "public/firmware"), { recursive: true });
const manifest = {
  board: "arduino:avr:uno",
  core: "arduino:avr@1.8.8",
  clockHz: 16000000,
  variants: {},
  traffic: {},
  button: {},
};
try {
  for (const speed of [250, 500, 1000]) {
    const sketch = join(temp, `blink${speed}`);
    mkdirSync(sketch);
    const source = blinkSource(speed);
    writeFileSync(join(sketch, `blink${speed}.ino`), source);
    const output = join(sketch, "build");
    execFileSync(
      "arduino-cli",
      ["compile", "--fqbn", "arduino:avr:uno", "--output-dir", output, sketch],
      { stdio: "inherit" },
    );
    let dest = join(root, "public/firmware", `blink-${speed}.hex`);
    copyFileSync(join(output, `blink${speed}.ino.hex`), dest);
    writeFileSync(join(root, "public/firmware", `blink-${speed}.ino`), source);
    manifest.variants[speed] = {
      path: `/firmware/blink-${speed}.hex`,
      sha256: createHash("sha256").update(readFileSync(dest)).digest("hex"),
    };
  }
  for (const speed of [250,500,1000]) {
    const name=`traffic${speed}`,sketch=join(temp,name);mkdirSync(sketch);
    const source=trafficSource(speed);writeFileSync(join(sketch,`${name}.ino`),source);
    const output=join(sketch,"build");
    execFileSync("arduino-cli",["compile","--fqbn","arduino:avr:uno","--output-dir",output,sketch],{stdio:"inherit"});
    const dest=join(root,"public/firmware",`traffic-${speed}.hex`);
    copyFileSync(join(output,`${name}.ino.hex`),dest);
    writeFileSync(join(root,"public/firmware",`traffic-${speed}.ino`),source);
    manifest.traffic[speed]={path:`/firmware/traffic-${speed}.hex`,sha256:createHash("sha256").update(readFileSync(dest)).digest("hex")};
  }
  for(const speed of [250,500]){
    const name=`button${speed}`,sketch=join(temp,name);mkdirSync(sketch);
    const source=buttonSource(speed);writeFileSync(join(sketch,`${name}.ino`),source);
    const output=join(sketch,"build");execFileSync("arduino-cli",["compile","--fqbn","arduino:avr:uno","--output-dir",output,sketch],{stdio:"inherit"});
    const dest=join(root,"public/firmware",`button-${speed}.hex`);copyFileSync(join(output,`${name}.ino.hex`),dest);writeFileSync(join(root,"public/firmware",`button-${speed}.ino`),source);
    manifest.button[speed]={path:`/firmware/button-${speed}.hex`,sha256:createHash("sha256").update(readFileSync(dest)).digest("hex")};
  }
  manifest.r4 = buildR4Firmware(root,temp);
  writeFileSync(
    join(root, "public/firmware/manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
