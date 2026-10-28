import test from 'node:test';import assert from 'node:assert/strict';
import {holePosition,placementSteps,placementSVG} from '../src/placement-guide.js';
import {TRAFFIC_CONNECTIONS} from '../src/arduino-lessons.js';
test('placement labels map to the actual breadboard pitch and middle gap',()=>{
 assert.deepEqual(holePosition('E11'),{row:4,column:11,x:43.57,z:-4,y:3.65});
 assert.equal(holePosition('F11').z,4);assert.equal(holePosition('A17').z,-14.16);assert.equal(holePosition('J11').z,14.16);
 for(const p of TRAFFIC_CONNECTIONS)assert.ok(Math.abs(holePosition('E'+p.column).x-p.x)<1e-8);
 for(const label of ['A0','K11','A31','board:D13'])assert.throws(()=>holePosition(label),/Invalid/);
});
test('all Arduino build steps expose placements and final review contains every assembly endpoint',()=>{
 for(const lesson of ['first-circuit','traffic-lights','button-light']){
  for(let step=0;step<=5;step++)assert.ok(placementSteps(lesson,step).length);
  const build=[2,3,4].flatMap(step=>placementSteps(lesson,step));assert.deepEqual(placementSteps(lesson,5),build);
  for(const p of build)for(const endpoint of [p.from,p.to])assert.ok(endpoint.startsWith('board:')||holePosition(endpoint));
 }
 const wires=placementSteps('first-circuit',4);assert.deepEqual(wires.map(p=>[p.from,p.to]),[['board:D13','A17'],['board:GND','J11']]);
});
test('board D13 stays distinct from a breadboard hole named D13 in the enlarged guide',()=>{
 const svg=placementSVG(placementSteps('first-circuit',4)[0]);assert.match(svg,/DIGITAL SOCKETS/);assert.match(svg,/Uno D13 and A17/);assert.match(svg,/MIDDLE GAP/);
 assert.match(placementSVG(placementSteps('first-circuit',2)[0]),/E11 and F11/);
});
