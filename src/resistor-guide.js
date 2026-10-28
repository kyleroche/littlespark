export const RESISTOR_EXAMPLES = {
  4: {body:'#dfc59b', colors:['red','red','brown','gold'], digits:[2,2], multiplier:10, tolerance:5},
  5: {body:'#a8c7d6', colors:['red','red','black','black','brown'], digits:[2,2,0], multiplier:1, tolerance:1},
};
const inks={red:'#b52932',brown:'#78452a',black:'#242c29',gold:'#bd9133'};
export function resistorExample(bands=4) {
  const e=RESISTOR_EXAMPLES[bands]||RESISTOR_EXAMPLES[4],n=e.colors.length;
  const positions=n===4?[78,112,146,224]:[70,102,134,166,230];
  const names=e.colors.map(c=>c[0].toUpperCase()+c.slice(1));
  const value=Number(e.digits.join(''))*e.multiplier;
  return `<figure class="resistor-example"><svg viewBox="0 0 320 88" role="img" aria-label="${n}-band ${value} ohm resistor: ${names.join(', ')}. Read from left to right; the last band is tolerance."><path d="M10 38H48m224 0h38" stroke="#8b938d" stroke-width="4" stroke-linecap="round"/><defs><clipPath id="resistor-shape-${n}"><rect x="48" y="20" width="224" height="36" rx="18"/></clipPath></defs><rect x="48" y="20" width="224" height="36" rx="18" fill="${e.body}" stroke="#3b5148" stroke-width="2"/><g clip-path="url(#resistor-shape-${n})">${e.colors.map((c,i)=>`<rect x="${positions[i]}" y="20" width="12" height="36" fill="${inks[c]}"/>`).join('')}</g>${positions.map((x,i)=>`<text x="${x+6}" y="75" text-anchor="middle" fill="#263f39" font-size="12" font-family="sans-serif">${i+1}</text>`).join('')}</svg><figcaption>Read this way → <strong>${value} Ω</strong></figcaption></figure><ol class="resistor-bands" style="--band-count:${n}">${names.map((name,i)=>`<li${i===n-1?' class="tolerance-band"':''}><i style="background:${inks[e.colors[i]]}" aria-hidden="true"></i><strong>${name}</strong><small>${i<e.digits.length?e.digits[i]:i===n-1?'±'+e.tolerance+'%':'×'+e.multiplier}</small></li>`).join('')}</ol><p class="resistor-math"><strong>${e.digits.join('')} × ${e.multiplier} = ${value} Ω</strong><br>${n===4?'The first two bands say 22. Brown means multiply by 10.':'The first three bands say 220. The next black band means multiply by 1.'}</p><p class="resistor-tolerance">The separated last band tells us how close the real value should be: ${names[n-1].toLowerCase()} is ±${e.tolerance}%. Other tolerance colors are possible; they don’t change the marked 220 Ω value.</p>`;
}
export function mountResistorGuide(host,{open=false}={}) {
  host.innerHTML=`<details class="resistor-guide"${open?' open':''}><summary>Find the 220 Ω resistor</summary><div class="resistor-guide-body"><p>Match the <strong>bands</strong>, not the body color. A real resistor may be tan, blue, or a different size from our 3D picture.</p><div class="resistor-band-choice" role="group" aria-label="Example band count"><button type="button" data-band-count="4" aria-pressed="true">4 bands</button><button type="button" data-band-count="5" aria-pressed="false">5 bands</button></div><div class="resistor-example-view"></div><p>Turn the resistor so the separated last band is on the right, like the example. It can face either way when you put it in the circuit.</p><details class="resistor-grownup"><summary>Not sure which one?</summary><p>Ask a grown-up to check the kit label or measure a loose, unpowered resistor with a multimeter. Don’t guess from the body color or its place on the paper strip. If a part has only one stripe, check its label—it may be a different component.</p></details><a class="resistor-source" href="https://www.digikey.com/en/resources/conversion-calculators/conversion-calculator-resistor-color-code" target="_blank" rel="noopener noreferrer">Grown-up reference: resistor color codes ↗</a></div></details>`;
  const details=host.querySelector('.resistor-guide'),view=host.querySelector('.resistor-example-view');
  view.innerHTML=resistorExample(4);
  host.querySelectorAll('[data-band-count]').forEach(button=>button.onclick=()=>{
    const selected=Number(button.dataset.bandCount);view.innerHTML=resistorExample(selected);
    host.querySelectorAll('[data-band-count]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  });
  return {
    show(visible,expand){host.hidden=!visible;if(expand!==undefined)details.open=expand;},
    reveal(){host.hidden=false;details.open=true;host.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});},
  };
}
