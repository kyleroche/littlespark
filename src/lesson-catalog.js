export const LESSONS = [
  {id:'first-circuit',name:'Blink an LED',platform:'Arduino',path:'/learn/'},
  {id:'fruit-piano',name:'Fruit Piano',platform:'Makey Makey',path:'/learn/makey-makey/'},
  {id:'traffic-lights',name:'Traffic Lights',platform:'Arduino',path:'/learn/traffic-lights/'},
  {id:'conductivity',name:'Conductivity Detective',platform:'Makey Makey',path:'/learn/conductivity/'},
  {id:'button-light',name:'Push-button Light',platform:'Arduino',path:'/learn/button-light/'},
  {id:'game-controller',name:'Game Controller',platform:'Makey Makey',path:'/learn/game-controller/'},
];
export function renderLessonNav(){
  for(const nav of document.querySelectorAll('.lesson-picker')) nav.innerHTML=LESSONS.map((lesson,i)=>`<a href="${lesson.path}" ${location.pathname===lesson.path?'aria-current="page"':'data-lesson-link'}>${String(i+1).padStart(2,'0')} · ${lesson.name}</a>`).join('');
}
