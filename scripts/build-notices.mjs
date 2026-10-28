import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url)));
const root=new URL('../',import.meta.url),seen=new Set();
let text='Little Spark third-party notices\n\nOriginal code: MIT, see /LICENSE in the repository. Brand/artwork are excluded; see BRAND.md.\n\nThis list includes installed runtime dependencies (some are server/CLI-only). Dependencies retain their own licenses.\n\nFirmware contains the Arduino AVR core, LGPL-2.1-or-later. The corresponding core/standard-variant source is supplied at /firmware/licenses/ArduinoCore-avr-1.8.8-source.tar.gz and the license at /firmware/licenses/LGPL-2.1.txt. All sketch sources and rebuild/relink instructions are included in the repository. The bootloader is not part of the distributed sketch images. AVR libc/GCC toolchain runtime components retain their upstream licenses and runtime exceptions.\n\nGoogle Fonts supplies DM Sans, Space Grotesk and IBM Plex Mono via external stylesheets; font files are not vendored here.\n';
for(const [path,record] of Object.entries(lock.packages).sort(([a],[b])=>a.localeCompare(b))){
 if(!path||record.dev||!existsSync(new URL(path+'/package.json',root)))continue;
 const pkg=JSON.parse(readFileSync(new URL(path+'/package.json',root)));
 const key=pkg.name+'@'+pkg.version;if(seen.has(key))continue;seen.add(key);
 const files=readdirSync(new URL(path+'/',root)).filter(f=>/^(licen[sc]e|copying|notice)([.-].*)?$/i.test(f));
 if(!files.length)throw Error('Missing license text for '+key);
 text+='\n\n--- '+key+' · '+pkg.license+' ---\n';
 for(const file of files)text+='\n'+readFileSync(new URL(path+'/'+file,root),'utf8')+'\n';
}
writeFileSync(new URL('../public/THIRD_PARTY_NOTICES.txt',import.meta.url),text.replace(/\r\n/g,"\n").trimEnd()+"\n");
console.log('Notices generated for '+seen.size+' runtime packages.');
