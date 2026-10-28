import test from 'node:test';
import assert from 'node:assert/strict';
import {RESISTOR_EXAMPLES} from '../src/resistor-guide.js';
test('both taught physical band sequences decode to 220 ohms',()=>{
 const digit={black:0,brown:1,red:2},tolerance={gold:5,brown:1};
 for(const [count,e] of Object.entries(RESISTOR_EXAMPLES)){
  const n=Number(count),digits=e.colors.slice(0,n-2).map(color=>digit[color]);
  const multiplier=10**digit[e.colors[n-2]];
  assert.equal(e.colors.length,n);assert.equal(Number(digits.join(''))*multiplier,220);
  assert.deepEqual(e.digits,digits);assert.equal(e.multiplier,multiplier);assert.equal(e.tolerance,tolerance[e.colors[n-1]]);
 }
});
