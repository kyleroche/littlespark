import {createR4,verifyR4} from './r4-simulator.js';
let active;
self.onmessage=({data})=>{
 if(data.type==='button'){active?.cpu.setButton(Boolean(data.pressed));return;}
 if(data.type!=='run')return;
 try{
  const image=new Uint8Array(data.image),result=verifyR4(image,data.symbols,data.halfPeriod,data);
  self.postMessage({type:'verified',...result});
  const events=[];const cpu=createR4(image,data.symbols,(high,time)=>{if(!data.traffic)events.push({type:'pin',high,time});},(mask,time)=>{if(data.traffic)events.push({type:'traffic-pin',mask,time});});
  const run={cpu,start:performance.now()};active=run;
  function frame(){
   if(active!==run)return;
   const target=performance.now()-run.start;
   let budget=0;while(cpu.time<=target&&budget++<10)cpu.loop();
   while(events.length&&events[0].time<=target)self.postMessage(events.shift());
   setTimeout(frame,8);
  }frame();
 }catch(e){self.postMessage({type:'error',message:e.message});}
};
