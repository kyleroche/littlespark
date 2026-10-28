import {TRAFFIC_CONNECTIONS} from './arduino-lessons.js';
export function holePosition(label){
 const m=/^([A-J])([1-9]|[12]\d|30)$/.exec(label);if(!m)throw Error('Invalid breadboard hole.');
 const row='ABCDEFGHIJ'.indexOf(m[1]),column=Number(m[2]);
 return {row,column,x:55+(column-15.5)*2.54,z:row<5?-14.16+row*2.54:4+(row-5)*2.54,y:3.65};
}
const label=p=>p?.replace('board:','Uno ');
const pair=(title,from,to,note)=>({title,from,to,note});
export function placementSteps(lesson,step){
 const traffic=lesson==='traffic-lights',button=lesson==='button-light';
 const leds=traffic?TRAFFIC_CONNECTIONS.map(p=>pair(`${p.color} LED`,`E${p.column}`,`F${p.column}`,'Long leg (+) in E; short leg (−) in F. Bridge the middle gap.')):[pair('Red LED','E11','F11','Long leg (+): E11. Short leg (−): F11. Bridge the middle gap.')];
 const resistors=traffic?TRAFFIC_CONNECTIONS.map(p=>pair(`${p.color} LED · 220 Ω`,`C${p.column}`,`C${p.end}`,'Use 220 Ω. Either end can go in either hole.')):[pair('220 Ω resistor','C11','C17','Either end can go in either hole. Check the color bands first.')];
 const wires=traffic?[...TRAFFIC_CONNECTIONS.map(p=>pair(`${p.color} signal`,`board:D${p.pin}`,`A${p.end}`,'Use the numbered DIGITAL socket on the Uno.')),pair('Ground wire','board:GND','H4','Use a GND socket, never 5V.'),pair('Join ground groups','J4','J13','Both ends go in the breadboard.'),pair('Finish ground path','I13','J22','Both ends go in the breadboard.')]:[pair('LED signal','board:D13','A17','D13 is the socket marked 13 in the DIGITAL row.'),pair('Ground wire','board:GND','J11','Use a GND socket, never 5V.'),...(button?[pair('Button input','board:D2','A22','D2 is the socket marked 2 in the DIGITAL row.'),pair('Button ground','J24','I11','This connects the other switch pair to ground.')]:[])];
 const switchPins=button?[pair('Button · first pair','E22','F22','These legs are always connected. Keep this pair in column 22.'),pair('Button · second pair','E24','F24','Keep this pair in column 24. Pressing joins the two pairs. Ask a grown-up to check switch orientation.')]:[];
 if(step===0)return [pair('Find the output socket','board:D13',null,'Find 13 in the DIGITAL row. Leave USB unplugged; no wire goes in yet.')];
 if(step===1)return [pair('Read a hole label','C11','E11','Letter C + number 11 means C11. A–E share each number. F–J form a separate group across the gap. These highlighted holes show the connection underneath; do not add a wire.')];
 if(step===2)return [...leds,...switchPins];if(step===3)return resistors;if(step===4)return wires;if(step===5)return [...leds,...switchPins,...resistors,...wires];return [];
}
export function placementSVG(item){
 const holes=[item.from,item.to].filter(p=>p&&/^[A-J]\d+$/.test(p)).map(holePosition);
 const boardEndpoint=[item.from,item.to].find(p=>p?.startsWith('board:'));
 const board=boardEndpoint?.slice(6);
 let svg='';const width=board?440:330;
 if(board){const labels=board==='D2'?['D5','D4','D3','D2','D1','D0']:['AREF','GND','D13','D12','D11','D10'];svg+=`<text x="${width/2}" y="16" text-anchor="middle">UNO · DIGITAL SOCKETS</text>`;labels.forEach((p,i)=>{const x=44+i*65;svg+=`<rect x="${x-18}" y="27" width="36" height="25" rx="3" fill="${p===board?'#d46b3e':'#294b42'}"/><text x="${x}" y="70" text-anchor="middle" font-weight="${p===board?'bold':'normal'}">${p}</text>`;});}
 if(holes.length){
 const min=Math.max(1,Math.min(...holes.map(h=>h.column))-2),max=Math.min(30,Math.max(...holes.map(h=>h.column))+2),pitch=Math.min(42,(width-85)/(max-min+1)),left=(width-(max-min)*pitch)/2,top=board?112:42;
 const yy=row=>top+row*20+(row>4?26:0);
 for(let col=min;col<=max;col++){
  const x=left+(col-min)*pitch;svg+=`<text x="${x}" y="${top-17}" text-anchor="middle">${col}</text>`;
  for(let row=0;row<10;row++){const label='ABCDEFGHIJ'[row]+col,active=[item.from,item.to].includes(label);svg+=`<circle cx="${x}" cy="${yy(row)}" r="${active?6:2.3}" fill="${active?'#d46b3e':'#a1ac96'}"/>`;if(active)svg+=`<circle cx="${x}" cy="${yy(row)}" r="9" fill="none" stroke="#294b42" stroke-width="1.5"/>`;}
 }
 for(let row=0;row<10;row++)svg+=`<text x="25" y="${yy(row)+4}" text-anchor="middle">${'ABCDEFGHIJ'[row]}</text>`;
 svg+=`<text x="${width/2}" y="${top+109}" text-anchor="middle" font-size="10">MIDDLE GAP · NO CONNECTION ACROSS</text>`;
 const height=yy(9)+25;
 return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Enlarged placement: ${label(item.from)}${item.to?' and '+label(item.to):''}. Orange rings mark the exact holes; row letters are on the left, column numbers above.">${svg}</svg>`;
 }
 return `<svg viewBox="0 0 440 87" role="img" aria-label="Uno DIGITAL sockets: highlighted ${board}">${svg}</svg>`;
}
export function mountPlacementGuide(host,{lesson,onZoom,onBack}){
 let context='',items=[],selected=0;
 function draw(){const item=items[selected];if(!item)return;host.innerHTML=`<div class="placement-heading"><span>PLACE IT HERE</span><strong>${item.title}</strong></div><p class="placement-safety">USB unplugged while placing parts.</p><div class="placement-choices" role="group" aria-label="Choose a placement">${items.map((p,i)=>`<button data-placement="${i}" aria-pressed="${i===selected}">${p.title} · ${label(p.from)}${p.to?' → '+label(p.to):''}</button>`).join('')}</div><div class="placement-drawing">${placementSVG(item)}</div><p class="placement-endpoints"><strong>${label(item.from)}</strong>${item.to?' <span>→</span> <strong>'+label(item.to)+'</strong>':''}</p><p>${item.note}</p><p class="placement-orientation">Match letters and numbers on your breadboard. If yours is turned around, rotate it to match first. Wire colors can differ.</p><div class="placement-actions"><button data-placement-zoom="holes">Zoom ${item.to?'breadboard holes':'board pin'} in 3D ↗</button>${item.from.startsWith('board:')&&item.to?'<button data-placement-zoom="board">Zoom board pin ↗</button>':''}<button data-placement-back>Back to step view ↶</button></div>`;
 host.querySelectorAll('[data-placement]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.placement);draw();});
 host.querySelectorAll('[data-placement-zoom]').forEach(b=>b.onclick=()=>onZoom(item,b.dataset.placementZoom));host.querySelector('[data-placement-back]').onclick=onBack;
 }
 return {show(step,tour=false){const next=lesson+':'+step+':'+tour;if(context===next)return;context=next;items=placementSteps(lesson,tour?2:step);selected=0;host.hidden=!items.length;if(items.length)draw();}};
}
