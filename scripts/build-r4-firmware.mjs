import {mkdirSync,writeFileSync,readFileSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
import {homedir,platform} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {trafficSource,buttonSource,blinkSource} from '../src/arduino-lessons.js';
export function buildR4Firmware(root,temp) {
 const config=JSON.parse(execFileSync('arduino-cli',['config','dump','--format','json'],{encoding:'utf8'}));
 const tools=join((config.config?.directories?.data || join(homedir(),platform()==='darwin'?'Library/Arduino15':platform()==='win32'?'AppData/Local/Arduino15':'.arduino15')),'packages/arduino/tools/arm-none-eabi-gcc/7-2017q4/bin');
 const dest=join(root,'public/firmware/r4');mkdirSync(dest,{recursive:true});
 const manifest={board:'arduino:renesas_uno:unor4wifi',core:'arduino:renesas_uno@1.6.0',architecture:'arm-cortex-m4',loadAddress:0x4000,variants:{},traffic:{},button:{}};
 for(const [group,values,sourceFor] of [['variants',[250,500,1000],blinkSource],['traffic',[250,500,1000],trafficSource],['button',[250,500],buttonSource]]) {
  for(const speed of values) {
   const name=`r4_${group}_${speed}`,sketch=join(temp,name),build=join(sketch,'build');mkdirSync(sketch);
   const source=sourceFor(speed);
   copyFileSync(join(root,'scripts/r4-attestation.h'),join(sketch,'r4-attestation.h'));
   const compiledSource='#include "r4-attestation.h"\n'+source.replace('void loop() {','void loop() {\n  littleSparkVerifyFlash();');writeFileSync(join(sketch,name+'.ino'),compiledSource);
   execFileSync('arduino-cli',['compile','--fqbn',manifest.board,'--output-dir',build,sketch],{stdio:'inherit'});
   const prefix=(group==='variants'?'blink':group)+'-'+speed,path=join(dest,prefix+'.bin');copyFileSync(join(build,name+'.ino.bin'),path);
   writeFileSync(join(dest,prefix+'.ino'),source);
   const nm=execFileSync(join(tools,'arm-none-eabi-nm'),['-S','--defined-only',join(build,name+'.ino.elf')],{encoding:'utf8'});
   const symbols={};for(const line of nm.split('\n')) {const m=line.match(/^([a-f\d]+)\s+([a-f\d]+)\s+\w\s+(setup|loop|pinMode|digitalWrite|digitalRead|delay|littleSparkVerifyFlash|littleSparkImageLength)$/i);if(m)symbols[m[3]]={address:parseInt(m[1],16),size:parseInt(m[2],16)};}
   for(const key of ['setup','loop','pinMode','digitalWrite','delay'])if(!symbols[key])throw Error('Missing R4 symbol: '+key);
   const image=readFileSync(path);image.writeUInt32LE(image.length,symbols.littleSparkImageLength.address-0x4000);writeFileSync(path,image);const sha256=createHash('sha256').update(image).digest('hex');
   manifest[group][speed]={path:'/firmware/r4/'+prefix+'.bin',sha256,sourceSha256:createHash('sha256').update(source).digest('hex'),symbols};
   // Keep the build disassembly in ignored local audit artifacts, not the public bundle.
   if(process.env.R4_DISASSEMBLY_DIR){mkdirSync(process.env.R4_DISASSEMBLY_DIR,{recursive:true});writeFileSync(join(process.env.R4_DISASSEMBLY_DIR,prefix+'.asm'),execFileSync(join(tools,'arm-none-eabi-objdump'),['-d',join(build,name+'.ino.elf')],{encoding:'utf8'}));}
  }
 }
 return manifest;
}
