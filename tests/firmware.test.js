import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseHex, verifyBlink } from '../src/firmware.js';
const manifest=JSON.parse(readFileSync(new URL('../public/firmware/manifest.json',import.meta.url)));
for(const speed of[250,500,1000])test(`compiled ${speed}ms program produces the expected D13 edges`,()=>{const record=manifest.variants[speed];const text=readFileSync(new URL('../public'+record.path,import.meta.url),'utf8');assert.equal(createHash('sha256').update(text).digest('hex'),record.sha256);const image=parseHex(text);assert.equal(image.length%128,0);const result=verifyBlink(image,speed);assert.equal(result.passed,true);assert.equal(result.edges,6);assert.ok(Math.abs(result.measuredMs-speed)<5)});
test('a different delay does not pass the selected rhythm test',()=>{const text=readFileSync(new URL('../public/firmware/blink-250.hex',import.meta.url),'utf8');assert.throws(()=>verifyBlink(parseHex(text),500),/timing/)});
test('corrupted, truncated and bootloader-overwriting firmware is rejected',()=>{assert.throws(()=>parseHex(':0100000000FE\n:00000001FF'),/checksum/);assert.throws(()=>parseHex(':0100000000FF'),/Incomplete/);assert.throws(()=>parseHex(':017E00000081\n:00000001FF'),/bootloader/);assert.throws(()=>parseHex(':00000001FF'),/Incomplete/)});
