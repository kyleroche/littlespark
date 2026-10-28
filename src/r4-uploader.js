// UNO R4 WiFi's Arduino SAM-BA extension. Sketch offsets are relative to 0x4000;
// the bootloader performs flash erasure on page writes. No ROM/ESP flashing.
import { UnoConnection } from './uploader.js';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const hex = n => n.toString(16).toUpperCase().padStart(8,'0');
export function isR4Wifi(info) {
  return info.usbVendorId === 0x2341 && [0x1002,0x006d].includes(info.usbProductId);
}
export function crc16(bytes) {
  let crc=0;
  for(const byte of bytes){crc ^= byte<<8;for(let i=0;i<8;i++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;}
  return crc;
}
export function crc32(bytes) {
 let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;
}
export function paddedR4Image(image) {
  if(!(image instanceof Uint8Array)||image.length<8||image.length>0x3c000)throw Error('Invalid R4 sketch image.');
  const vector=new DataView(image.buffer,image.byteOffset,image.byteLength);
  const sp=vector.getUint32(0,true),reset=vector.getUint32(4,true);
  if(sp<0x20000000||sp>0x20008000||!(reset&1)||reset<0x4000||reset>=0x4000+image.length)throw Error('Invalid R4 sketch vectors.');
  const padded=new Uint8Array(Math.ceil(image.length/4096)*4096).fill(255);padded.set(image);return padded;
}
export class R4Connection extends UnoConnection {
  async open(){
    if(!isR4Wifi(this.port.getInfo()))throw Error('Choose an Arduino UNO R4 WiFi USB port.');
    // Port ownership starts only when uploading, so the 1200-baud reset can reopen it.
  }
  async line(command){
    await sleep(20);
    await this.writer.write(new TextEncoder().encode(command));
    let result='';
    while(result.length<160){const b=(await this.bytes(1,4000))[0];result+=String.fromCharCode(b);if(b===13)return result.trim();}
    throw Error('Invalid R4 bootloader reply.');
  }
  async ack(command,expected){if(await this.line(command)!==expected)throw Error('Unexpected R4 bootloader reply. Reconnect and try again.');}
  async upload(image,onProgress=()=>{}){
    const padded=paddedR4Image(image);
    await this.port.open({baudRate:1200});await this.port.setSignals({dataTerminalReady:false});await this.port.close();
    await sleep(1200);
    this.closed=false;this.readFailure=null;this.buffer=[];
    await this.port.open({baudRate:230400,bufferSize:16384});
    this.reader=this.port.readable.getReader();this.writer=this.port.writable.getWriter();this.readLoop();
    try {
      await this.ack('N#','');
      const version=await this.line('V#');
      if(!/^Arduino Bootloader \(SAM-BA extended\) 2\./.test(version)||!version.includes('[Arduino:IKXYZ]'))throw Error('Unsupported R4 bootloader. Nothing was written.');
      // The official R4 bootloader intentionally reports this compatibility ID.
      await this.ack('I#','nRF52840-QIAA');await this.ack('X00000000#','X');
      for(let offset=0;offset<padded.length;offset+=4096){
        const block=padded.slice(offset,offset+4096);
        await this.writer.write(new TextEncoder().encode('S00000000,00001000#'));await sleep(10);
        await this.writer.write(block);
        await this.ack('Y00000000,0#','Y');
        await this.ack(`Y${hex(offset)},00001000#`,'Y');
        onProgress(Math.round((offset+4096)/padded.length*85));
      }
      await this.writer.write(new TextEncoder().encode('K#'));
      await sleep(150);
      await this.close();await sleep(1000);
      this.closed=false;this.readFailure=null;this.buffer=[];
      await this.port.open({baudRate:115200,bufferSize:4096});
      this.reader=this.port.readable.getReader();this.writer=this.port.writable.getWriter();this.readLoop();
      const expected=crc32(image);let matched=false;
      for(let attempt=0;attempt<10;attempt++){
        try{
          const reply=await this.line('LS?\n');
          const match=reply.match(/^LITTLESPARK:([0-9A-Fa-f]{1,8})$/);
          if(match){if(parseInt(match[1],16)!==expected)throw Error('R4 running sketch flash checksum mismatch.');matched=true;break;}
        }catch(error){if(error.message.includes('checksum mismatch'))throw error;if(this.readFailure)throw error;}
      }
      if(!matched)throw Error('R4 uploaded, but running-sketch verification did not answer. Reconnect and try again.');
      onProgress(100);
    } finally {await this.close();}
  }
}
