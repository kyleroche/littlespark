import './makey.css';
import { initAccounts } from './accounts.js';
import { MAKEY_PARTS, MAKEY_STEPS, NOTES, canPlay } from './makey-lesson.js';
import { diagram, loopPath } from './makey-diagram.js';
import { MAKEY_TOUR_STEPS } from './app-tour.js';
const $ = (selector) => document.querySelector(selector);
const fresh = () => ({step:-1, speed:500, color:'#d25f4d', completed:[], found:[]});
let state = fresh(), storageKey = 'little-spark-fruit-piano', accounts;
let earth = false, mode = 'virtual', played = new Set(), tour = -1, audio = null, sound = false;
let zoom = 1, panX = 0, panY = 0;
try { state = clean(JSON.parse(localStorage.getItem(storageKey))); } catch {}
function clean(input) {
  return {...fresh(), step: Number.isInteger(input?.step) && input.step >= -1 && input.step <= 5 ? input.step : -1,
    completed: [...new Set((Array.isArray(input?.completed) ? input.completed : []).filter(n => Number.isInteger(n) && n >= -1 && n <= 5))],
    found: [...new Set((Array.isArray(input?.found) ? input.found : []).filter(id => MAKEY_PARTS.some(part => part.id === id)))]};
}
function notice(text) {
  $('#toast').textContent = text; $('#toast').classList.add('show');
  clearTimeout(notice.timer); notice.timer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
}
function save(reset = false) {
  try { localStorage.setItem(storageKey,JSON.stringify(state)); } catch {}
  if (reset) accounts?.resetProgress(state); else accounts?.saveProgress(state);
}
function applyView() {
  const view = $('#makey-diagram');
  view.style.setProperty('--mk-scale',zoom); view.style.setProperty('--mk-x',panX+'px'); view.style.setProperty('--mk-y',panY+'px');
}
function inspect(id) {
  const item = MAKEY_PARTS.find(part => part.id === id); if (!item) return;
  $('#makey-part-title').textContent = item.name; $('#makey-part-text').textContent = item.detail;
  $('#makey-part-note').hidden = false;
  zoom = 1.35;
  const points = {board:[425,195],fruit:[430,470],usb:state.step<0?[111,195]:[425,60],clips:state.step<0?[746,200]:[690,320],computer:[728,35],mat:[440,300]};
  const point=points[id]; panX=(440-point[0])*zoom;panY=(300-point[1])*zoom;
  if (id==='mat' || (id==='computer' && state.step<0)) {zoom=1;panX=panY=0;}
  applyView(); $('#makey-part-note').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function draw() {
  $('#makey-diagram').innerHTML = diagram(state.step); applyView();
  document.querySelectorAll('[data-inspect]').forEach(part => {
    part.addEventListener('click',() => inspect(part.dataset.inspect));
    part.addEventListener('keydown',event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(part.dataset.inspect); } });
  });
}
function drawPiano() {
  const unlocked = state.step === 5;
  $('#makey-earth').hidden = mode === 'real';
  $('#makey-earth').disabled = !unlocked;
  $('#makey-earth').setAttribute('aria-pressed',String(earth));
  $('#makey-earth').textContent = earth ? 'Release virtual EARTH' : 'Connect virtual EARTH';
  document.querySelectorAll('[data-play-mode]').forEach(button => {
    button.disabled = !unlocked;
    button.setAttribute('aria-pressed',String(button.dataset.playMode === mode));
  });
  document.querySelectorAll('[data-note]').forEach(button => button.disabled = !unlocked);
  $('#makey-focus').disabled = !unlocked;
  $('#makey-piano-instructions').textContent = !unlocked ? 'Follow the steps above to build the piano. It unlocks in step 7.' : mode === 'virtual' ? 'Connect virtual EARTH, then tap each fruit key. Release EARTH to open the loop.' : 'Turn sound on, then Focus piano. Hold the real EARTH clip and touch a fruit. Space, Left arrow and Up arrow on your keyboard work too.';
}
function render() {
  const step = MAKEY_STEPS[state.step+1];
  $('#makey-step-number').textContent = `STEP ${String(state.step+2).padStart(2,'0')} / 07`;
  $('#makey-step-title').textContent = step.title; $('#makey-step-description').textContent = step.description;
  $('#makey-tip').textContent = step.tip; $('#makey-caption').textContent = step.caption + ' · Tap a part for details.';
  $('#makey-kit').innerHTML = state.step === -1 ? MAKEY_PARTS.map(part => `<div class="makey-check"><label><input type="checkbox" data-kit="${part.id}" ${state.found.includes(part.id)?'checked':''}><span><strong>${part.name}</strong><small>${part.quantity}</small></span></label><button data-kit-inspect="${part.id}" aria-label="Inspect ${part.name}">↗</button></div>`).join('') : '';
  document.querySelectorAll('[data-kit-inspect]').forEach(button => button.onclick = () => inspect(button.dataset.kitInspect));
  document.querySelectorAll('[data-kit]').forEach(box => box.onchange = () => {
    state.found = state.found.filter(id => id !== box.dataset.kit);
    if (box.checked) state.found.push(box.dataset.kit);
    save(); updateNext();
  });
  $('#makey-step-action').innerHTML = state.step === 2 ? '<button id="makey-space-earth" aria-pressed="'+earth+'">'+(earth?'Release virtual EARTH':'Connect virtual EARTH')+'</button> <button id="makey-space-test">Try SPACE</button>' : '';
  if (state.step === 2) {
    $('#makey-space-earth').onclick = () => {
      earth = !earth;
      $('#makey-space-earth').setAttribute('aria-pressed',String(earth));
      $('#makey-space-earth').textContent = earth ? 'Release virtual EARTH' : 'Connect virtual EARTH';
      if (!earth) $('#makey-diagram').classList.remove('makey-loop-on');
    };
    $('#makey-space-test').onclick = () => {
      $('#makey-step-status').textContent = earth ? 'Loop closed! The board sends SPACE.' : 'No key yet. Connect virtual EARTH to close the loop.';
      $('#makey-diagram').classList.toggle('makey-loop-on',earth);
      if (earth) { if (!state.completed.includes(2)) state.completed.push(2); save(); updateProgress(); updateNext(); }
    };
  }
  $('#makey-back').disabled = state.step === -1;
  $('#makey-step-status').textContent = '';
  $('#makey-step-list').innerHTML = MAKEY_STEPS.map((item,index) => `<button data-step="${index-1}" ${state.step === index-1?'aria-current="step"':''}>${state.completed.includes(index-1)?'✓':String(index+1).padStart(2,'0')} · ${item.short}</button>`).join('');
  document.querySelectorAll('[data-step]').forEach(button => button.onclick = () => go(Number(button.dataset.step)));
  $('#makey-part-note').hidden = true;
  draw(); drawPiano(); updateProgress(); updateNext();
}
function updateProgress() {
  document.querySelectorAll('[data-step]').forEach(button => {
    const step=Number(button.dataset.step);button.textContent=`${state.completed.includes(step)?'✓':String(step+2).padStart(2,'0')} · ${MAKEY_STEPS[step+1].short}`;
  });
  $('#makey-progress-label').textContent = `${state.completed.length} of 7 steps complete`;
  $('#makey-progress-fill').style.width = state.completed.length/7*100+'%';
}
function updateNext() {
  $('#makey-next').disabled = state.step === -1 ? state.found.length !== MAKEY_PARTS.length : state.step === 2 ? !state.completed.includes(2) : state.step === 5;
  $('#makey-next').textContent = state.step === -1 ? 'My parts are ready! →' : state.step === 5 ? (state.completed.includes(5) ? 'Three notes played ✓' : 'Play all three keys below ↓') : 'Next →';
  $('#makey-nav-label').textContent = `${state.step+2}/7 · ${MAKEY_STEPS[state.step+1].short}`;
  $('#makey-nav-back').disabled = state.step === -1;
  $('#makey-nav-next').disabled = $('#makey-next').disabled;
  $('#makey-nav-next').textContent = state.step === 5 ? 'Play below ♫' : 'Next →';
}
function go(step) {
  state.step = Math.max(-1,Math.min(5,step));
  zoom=1;panX=panY=0; $('#makey-diagram').classList.remove('makey-loop-on');
  render(); save();
}
$('#makey-next').onclick = () => {
  if ($('#makey-next').disabled) return;
  if (!state.completed.includes(state.step)) state.completed.push(state.step);
  go(state.step+1);
};
$('#makey-back').onclick = () => go(state.step-1);
$('#makey-nav-back').onclick = () => $('#makey-back').click();
$('#makey-nav-next').onclick = () => $('#makey-next').click();
$('#makey-replay').onclick = draw;
$('#makey-part-close').onclick = () => { $('#makey-part-note').hidden = true; zoom=1;panX=panY=0;applyView(); };
$('#makey-reset').onclick = () => {
  state=fresh(); earth=false; played.clear(); $('#makey-diagram').classList.remove('makey-loop-on');
  $('#makey-piano-status').textContent='Play all three notes to finish the lesson.';
  render();save(true);notice('Fruit Piano progress reset. Blink progress is unchanged.');
};
document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => {
  switch(button.dataset.view) {
    case 'in': zoom=Math.min(2.2,zoom+.2); break;
    case 'out': zoom=Math.max(.7,zoom-.2); break;
    case 'left': panX=Math.max(-350,panX-60); break;
    case 'right': panX=Math.min(350,panX+60); break;
    case 'up': panY=Math.max(-240,panY-50); break;
    case 'down': panY=Math.min(240,panY+50); break;
    default: zoom=1;panX=panY=0;
  } applyView();
});
$('#makey-sound').onclick = async () => {
  try {
    if (!audio) audio = new AudioContext();
    await audio.resume(); sound = !sound;
    $('#makey-sound').textContent = sound ? 'Mute ♫' : 'Sound on ♫';
    $('#makey-piano-status').textContent = sound ? 'Sound is on. Play a key.' : 'Muted. The keys still flash.';
  } catch { sound=false;$('#makey-piano-status').textContent='Sound could not start. Visual keys still work. Try Sound on again.'; }
};
function tone(frequency) {
  if (!sound || !audio || audio.state !== 'running') return;
  const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
  oscillator.type='triangle'; oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.18,now+.015);gain.gain.exponentialRampToValueAtTime(.001,now+.4);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(now+.42);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
}
function play(index) {
  if (!canPlay({step:state.step,mode,earth})) {
    $('#makey-piano-status').textContent = state.step !== 5 ? 'The piano unlocks in step 7.' : 'Open loop. Connect virtual EARTH, then touch a fruit.'; return;
  }
  const note=NOTES[index]; tone(note.frequency);
  document.querySelector(`[data-note="${index}"]`).classList.add('lit');
  document.querySelector(`[data-light="${index}"]`)?.classList.add('lit');
  $('#makey-diagram .mk-loop')?.setAttribute('d',loopPath(index));
  $('#makey-diagram').classList.add('makey-loop-on');
  setTimeout(()=>{document.querySelector(`[data-note="${index}"]`).classList.remove('lit');document.querySelector(`[data-light="${index}"]`)?.classList.remove('lit');$('#makey-diagram').classList.remove('makey-loop-on');},350);
  played.add(index);
  $('#makey-piano-status').textContent = `${note.name} · ${note.label}. ${played.size} of 3 different notes played${sound?'': ' · sound is off'}.`;
  if (played.size === 3) {
    if (!state.completed.includes(5)) {state.completed.push(5);save();updateProgress();updateNext();}
    $('#makey-piano-status').textContent = `Three notes played! Keep making music. ${mode==='real'?'Keyboard input received; real wiring is not checked.':'Virtual practice complete.'}`;
  }
}
document.querySelectorAll('[data-note]').forEach(button => button.onclick = () => play(Number(button.dataset.note)));
document.querySelectorAll('[data-play-mode]').forEach(button => button.onclick = () => {mode=button.dataset.playMode;played.clear();drawPiano();$('#makey-piano-status').textContent='Play C, D and E in this mode.';});
$('#makey-earth').onclick = () => {earth=!earth;drawPiano();$('#makey-piano-status').textContent=earth?'Virtual EARTH connected. Touch a fruit.':'Virtual EARTH released. The loop is open.';};
$('#makey-focus').onclick = () => $('#makey-keyboard').focus();
$('#makey-keyboard').addEventListener('keydown',event => {
  if (event.target !== $('#makey-keyboard')) return;
  const index=NOTES.findIndex(note=>note.key===event.key);
  if (index<0 || mode!=='real' || state.step!==5) return;
  event.preventDefault();if(!event.repeat)play(index);
});
function showTour() {
  const item=MAKEY_TOUR_STEPS[tour];
  $('#makey-tour').hidden=false;$('#makey-tour-title').textContent=item.title;$('#makey-tour-text').textContent=item.description;
  $('#makey-tour-count').textContent=`${tour+1}/${MAKEY_TOUR_STEPS.length}`;
  $('#makey-tour-back').disabled=tour===0;
  $('#makey-tour-next').textContent=tour===MAKEY_TOUR_STEPS.length-1?'Finish ✓':'Next →';
  document.querySelectorAll('.makey-target').forEach(el=>el.classList.remove('makey-target'));
  $(item.target).classList.add('makey-target');$('#makey-tour').scrollIntoView({behavior:'smooth',block:'start'});
}
function closeTour() { tour=-1;$('#makey-tour').hidden=true;document.querySelectorAll('.makey-target').forEach(el=>el.classList.remove('makey-target'));$('#makey-tour-button').focus(); }
$('#makey-tour-button').onclick=()=>{tour=0;showTour();};
$('#makey-tour-back').onclick=()=>{tour--;showTour();};
$('#makey-tour-next').onclick=()=>{if(tour===MAKEY_TOUR_STEPS.length-1)closeTour();else{tour++;showTour();}};
$('#makey-tour-close').onclick=closeTour;
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(tour>=0)closeTour();$('#makey-part-close').click();}});
render();
accounts=initAccounts({lesson:'fruit-piano',onNotice:notice,onProfile(user,progress){
  if(user?.role==='kid'){storageKey=`little-spark-profile-${user.id}-fruit-piano`;state=clean(progress);earth=false;played.clear();render();}
}});
