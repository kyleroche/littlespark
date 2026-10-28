import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createR4,verifyR4} from '../src/r4-simulator.js';
import {R4Connection,crc32,paddedR4Image,isR4Wifi} from '../src/r4-uploader.js';
const manifest=JSON.parse(readFileSync(new URL('../public/firmware/manifest.json',import.meta.url))).r4;
const imageFor=r=>new Uint8Array(readFileSync(new URL('../public'+r.path,import.meta.url)));
for(const group of ['variants','traffic','button'])for(const [speed,record]of Object.entries(manifest[group])){
 test(`R4 ${group} ${speed}: published binary integrity and actual sketch instructions`,()=>{
  const image=imageFor(record);assert.equal(createHash('sha256').update(image).digest('hex'),record.sha256);
  const field=record.symbols.littleSparkImageLength.address-0x4000;
  assert.equal(new DataView(image.buffer).getUint32(field,true),image.length);
  assert.equal(verifyR4(image,record.symbols,+speed,{traffic:group==='traffic',button:group==='button'}).passed,true);
 });
}
test('R4 rejects wrong timings, output overlap, wrong button rule and unsupported instructions',()=>{
 const r=manifest.variants[500],image=imageFor(r);
 assert.throws(()=>verifyR4(image,r.symbols,250),/timing/);
 const b=manifest.button[500];assert.throws(()=>verifyR4(imageFor(b),b.symbols,250,{button:true}),/button rule/);
 const broken=image.slice();broken[r.symbols.loop.address-0x4000]=0xff;broken[r.symbols.loop.address-0x4000+1]=0xde;
 assert.throws(()=>verifyR4(broken,r.symbols,500),/Unsupported/);
 const t=manifest.traffic[500],overlap=imageFor(t),view=new DataView(overlap.buffer);
 // Change every low digitalWrite argument to high in compiled setup/loop code.
 for(let a=t.symbols.loop.address-0x4000;a<t.symbols.loop.address+t.symbols.loop.size-0x4000;a+=2)if(view.getUint16(a,true)===0x2100)view.setUint16(a,0x2101,true);
 assert.throws(()=>verifyR4(overlap,t.symbols,500,{traffic:true}),/Two traffic/);
});
test('R4 board IDs and sketch vectors prevent incompatible writes',()=>{
 assert.ok(isR4Wifi({usbVendorId:0x2341,usbProductId:0x1002}));assert.ok(!isR4Wifi({usbVendorId:0x2341,usbProductId:0x69}));
 assert.throws(()=>paddedR4Image(new Uint8Array(64)),/vectors/);assert.throws(()=>paddedR4Image(new Uint8Array(0x3c001)),/Invalid/);
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
});
class MockR4Port {
 constructor({corrupt=false,version='Arduino Bootloader (SAM-BA extended) 2.0 [Arduino:IKXYZ]'}={}){this.corrupt=corrupt;this.version=version;this.flash=new Uint8Array(0x3c000).fill(255);this.commands=[];this.writes=0;}
 getInfo(){return {usbVendorId:0x2341,usbProductId:0x1002};}
 async setSignals(){}
 async close(){}
 async open(){this.readable=new ReadableStream({start:c=>{this.controller=c;}});this.writable=new WritableStream({write:bytes=>{
  if(this.staging){this.block=bytes.slice();this.staging=false;return;}
  const command=new TextDecoder().decode(bytes);this.commands.push(command);
  const send=s=>this.controller.enqueue(new TextEncoder().encode(s+'\n\r'));
  if(command==='N#')send('');else if(command==='V#')send(this.version);else if(command==='I#')send('nRF52840-QIAA');
  else if(command.startsWith('X'))send('X');else if(command.startsWith('S'))this.staging=true;
  else if(command.startsWith('Y')){const [offset,count]=command.slice(1,-1).split(',').map(v=>parseInt(v,16));if(count){this.flash.set(this.block,offset);this.writes++;}send('Y');}
  else if(command==='LS?\n'){if(this.corrupt)this.flash[300]^=1;const r=manifest.variants[500];send('LITTLESPARK:'+crc32(this.flash.slice(0,imageFor(r).length)).toString(16));}
 }});}
}
test('R4 protocol writes only sketch-relative blocks and confirms running-flash checksum',async()=>{
 const port=new MockR4Port(),connection=new R4Connection(port),image=imageFor(manifest.variants[500]);let progress=0;
 await connection.open();await connection.upload(image,p=>{progress=p;});
 assert.equal(progress,100);assert.deepEqual(port.flash.slice(0,image.length),image);assert.equal(port.writes,Math.ceil(image.length/4096));
 assert.ok(port.commands.includes('K#'));assert.ok(!port.commands.some(c=>c.startsWith('Z')));
});
test('R4 transfer corruption cannot report success',async()=>{
 const port=new MockR4Port({corrupt:true}),connection=new R4Connection(port);await connection.open();
 await assert.rejects(connection.upload(imageFor(manifest.variants[500])),/checksum mismatch/);
});
test('R4 unexpected bootloader cannot write sketch flash',async()=>{
 const port=new MockR4Port({version:'Unsupported device'}),connection=new R4Connection(port);await connection.open();
 await assert.rejects(connection.upload(imageFor(manifest.variants[500])),/Unsupported R4 bootloader/);assert.equal(port.writes,0);
});
test('R4 live button execution stays usable beyond the verification instruction budget',()=>{
 const record=manifest.button[500],cpu=createR4(imageFor(record),record.symbols);
 for(let i=0;i<5000;i++){cpu.setButton(Boolean(i%2));cpu.loop();assert.equal(cpu.high,Boolean(i%2));}
 assert.equal(cpu.time,25000);
});
