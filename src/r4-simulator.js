// Executes the compiled sketch's Thumb setup/loop instructions. Arduino digital
// I/O and delay are modeled at their API boundary; RA4 peripherals/core startup
// are not emulated. Unknown instructions/calls fail closed.
import { paddedR4Image } from './r4-uploader.js';
export function createR4(image,symbols,onPin=()=>{},onPort=()=>{}) {
 paddedR4Image(image);
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength),r=new Uint32Array(16),stack=new Map(),modes=new Map(),pins=new Map();
 let time=0,pressed=false,zero=false,skip=false,mask=0;
 const read16=a=>{if(a<0x4000||a+2>0x4000+image.length)throw Error('R4 instruction outside sketch.');return view.getUint16(a-0x4000,true);};
 const ranges=['setup','loop'].map(k=>{const s=symbols[k];if(!s||!Number.isInteger(s.address)||!Number.isInteger(s.size)||s.size<2)throw Error('Missing R4 sketch symbols.');return s;});
 for(const s of Object.values(symbols))if(s.address<0x4000||s.address+s.size>0x4000+image.length)throw Error('Invalid R4 symbol range.');
 function push(value){r[13]-=4;if(r[13]<0x20007000)throw Error('R4 stack overflow.');stack.set(r[13],value>>>0);}
 function pop(){if(!stack.has(r[13]))throw Error('Invalid R4 stack.');const value=stack.get(r[13]);stack.delete(r[13]);r[13]+=4;return value;}
 function call(address){
  const key=Object.keys(symbols).find(k=>symbols[k].address===address);
  const pin=r[0];
  if(key==='littleSparkVerifyFlash'){/* Host-only flash attestation, no circuit I/O. */}
  else if(key==='pinMode'){if(![2,11,12,13].includes(pin)||![1,2].includes(r[1]))throw Error('Unexpected R4 pin mode.');modes.set(pin,r[1]);}
  else if(key==='digitalWrite'){
   if(modes.get(pin)!==1||r[1]>1)throw Error('Invalid R4 digital output.');
   const high=Boolean(r[1]),previous=pins.get(pin)||false;pins.set(pin,high);
   const bit=1<<(pin-8);mask=high?mask|bit:mask&~bit;
   if(previous!==high){if(pin===13)onPin(high,time);onPort(mask,time);}
  }else if(key==='digitalRead'){if(pin!==2||modes.get(pin)!==2)throw Error('Unexpected R4 digital input.');r[0]=pressed?0:1;}
  else if(key==='delay'){if(r[0]>10000)throw Error('R4 delay exceeds lesson limit.');time+=r[0];}
  else throw Error('Unsupported R4 sketch call.');
  r[15]=r[14]&~1;
 }
 function run(name){
  r[13]=0x20007f00;r[14]=1;r[15]=symbols[name].address;let steps=0;
  while(r[15]){
   if(++steps>1000)throw Error('R4 sketch instruction limit exceeded.');
   const pc=r[15];
   if(!ranges.some(s=>pc>=s.address&&pc<s.address+s.size)){call(pc);continue;}
   const a=read16(pc),wide=(a&0xf800)>=0xe800,b=wide?read16(pc+2):0;r[15]+=wide?4:2;
   if(skip){skip=false;continue;}
   if((a&0xf800)===0x2000){const d=(a>>8)&7;r[d]=a&255;zero=r[d]===0;}
   else if((a&0xfe00)===0xb400){const regs=[];for(let i=0;i<8;i++)if(a&(1<<i))regs.push(i);if(a&256)regs.push(14);for(const i of regs.reverse())push(r[i]);}
   else if(a===0xe8bd){for(let i=0;i<16;i++)if(b&(1<<i))r[i]=pop();}
   else if((a&0xff00)===0x4600){const d=(a&7)|((a>>4)&8);if(d>12)throw Error('Unsupported R4 register move.');r[d]=r[(a>>3)&15];}
   else if((a&0xf800)===0x0800){const d=a&7;r[d]=((a>>6)&31)?r[(a>>3)&7]>>>((a>>6)&31):0;zero=r[d]===0;}
   else if((a&0xfe00)===0x1c00){const d=a&7;r[d]=(r[(a>>3)&7]+((a>>6)&7))>>>0;zero=r[d]===0;}
   else if(a===0xbf18){skip=zero;}
   else if((a&0xfff0)===0xfab0&&(b&0xf0f0)===0xf080){r[(b>>8)&15]=Math.clz32(r[a&15]);}
   else if((a&0xfbef)===0xf04f){
    const imm=((a>>10)&1)*2048+((b>>12)&7)*256+(b&255),byte=imm&255;let value;
    if((imm>>10)===0){const mode=(imm>>8)&3;value=[byte,(byte<<16)|byte,(byte<<24)|(byte<<8),byte*0x1010101][mode];}
    else{const unrot=128|(imm&127),rotate=imm>>7;value=(unrot>>>rotate)|(unrot<<(32-rotate));}
    r[(b>>8)&15]=value>>>0;
   }else if((a&0xf800)===0xf000&&((b&0xd000)===0xd000||(b&0xd000)===0x9000)){
    const s=(a>>10)&1,j1=(b>>13)&1,j2=(b>>11)&1;
    let off=(s<<24)|((1^(j1^s))<<23)|((1^(j2^s))<<22)|((a&1023)<<12)|((b&2047)<<1);if(s)off-=0x2000000;
    if(b&0x4000)r[14]=(pc+4)|1;r[15]=(pc+4+off)>>>0;
   }else throw Error(`Unsupported R4 sketch instruction at 0x${pc.toString(16)}.`);
  }
  if(r[13]!==0x20007f00||stack.size)throw Error('Unbalanced R4 sketch stack.');
 }
 run('setup');
 return {loop:()=>run('loop'),setButton(value){pressed=Boolean(value);},get time(){return time;},get high(){return Boolean(pins.get(13));}};
}
export function verifyR4(image,symbols,speed,{traffic=false,button=false}={}){
 if(!(button?[250,500]:[250,500,1000]).includes(speed))throw Error('Unsupported lesson speed.');
 const edges=[],phases=[];const cpu=createR4(image,symbols,(high,time)=>edges.push({high,time}),(mask,time)=>{if(traffic&&mask){if(mask&(mask-1))throw Error('Two traffic lights were on together.');phases.push({mask,time});}});
 if(button){for(const pressed of [false,true,false]){cpu.setButton(pressed);cpu.loop();if(cpu.high!==(speed===500?pressed:!pressed))throw Error('The LED did not follow the button rule.');}return {passed:true,checks:3};}
 for(let i=0;i<4;i++)cpu.loop();
 if(traffic){if(phases.length<7)throw Error('The traffic sequence did not repeat.');const order=[32,8,16];for(let i=0;i<phases.length;i++){if(phases[i].mask!==order[i%3])throw Error('Incorrect traffic light order.');if(i&&phases[i].time-phases[i-1].time!==((i-1)%3===2?1:2)*speed)throw Error('Incorrect traffic light timing.');}return {passed:true,phases:phases.length};}
 if(edges.length<6||edges.slice(1).some((e,i)=>e.time-edges[i].time!==speed))throw Error('The LED timing did not match this sketch.');
 return {passed:true,edges:edges.length,measuredMs:speed};
}
