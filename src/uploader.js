// STK500v1, classic ATmega328P Uno Optiboot only. No board autodetection.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export class UnoConnection {
  constructor(port) {
    this.port = port;
    this.buffer = [];
    this.waiter = null;
    this.readFailure = null;
    this.closed = false;
  }
  async open() {
    await this.port.open({ baudRate: 115200, bufferSize: 4096 });
    this.reader = this.port.readable.getReader();
    this.writer = this.port.writable.getWriter();
    this.readLoop();
  }
  async readLoop() {
    try {
      while (!this.closed) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) this.buffer.push(...value);
        this.waiter?.();
      }
    } catch (e) {
      this.readFailure = e;
      this.waiter?.();
    } finally {
      if (!this.closed) {
        this.readFailure ??= Error("The board disconnected.");
        this.waiter?.();
      }
    }
  }
  async bytes(count, timeout = 1800) {
    const end = Date.now() + timeout;
    while (this.buffer.length < count) {
      if (this.readFailure) throw this.readFailure;
      if (Date.now() >= end)
        throw Error(
          "The Uno did not answer. Check the board and USB cable, then reconnect.",
        );
      await new Promise((resolve) => {
        let timer = setTimeout(
          () => {
            this.waiter = null;
            resolve();
          },
          Math.min(30, end - Date.now()),
        );
        this.waiter = () => {
          clearTimeout(timer);
          this.waiter = null;
          resolve();
        };
      });
    }
    return this.buffer.splice(0, count);
  }
  async command(data, responseLength = 0) {
    await this.writer.write(Uint8Array.from([...data, 0x20]));
    const response = await this.bytes(responseLength + 2);
    if (response[0] !== 0x14 || response.at(-1) !== 0x10)
      throw Error("Unexpected Uno bootloader response. Please reconnect.");
    return response.slice(1, -1);
  }
  async upload(image, onProgress = () => {}) {
    if (
      !(image instanceof Uint8Array) ||
      image.length === 0 ||
      image.length > 32256 ||
      image.length % 128
    )
      throw Error("Invalid Uno firmware.");
    this.buffer = [];
    await this.port.setSignals({
      dataTerminalReady: false,
      requestToSend: false,
    });
    await sleep(80);
    await this.port.setSignals({
      dataTerminalReady: true,
      requestToSend: true,
    });
    await sleep(120);
    let synced = false;
    for (let i = 0; i < 5; i++) {
      this.buffer = [];
      try {
        await this.command([0x30]);
        synced = true;
        break;
      } catch {
        await sleep(70);
      }
    }
    if (!synced)
      throw Error(
        "Could not find a classic Uno R3 bootloader. Reconnect the board.",
      );
    const signature = await this.command([0x75], 3);
    if (signature.join(",") !== "30,149,15")
      throw Error("This board is not an ATmega328P Uno. Nothing was written.");
    await this.command([
      0x42, 0x86, 0, 0, 1, 1, 1, 1, 3, 255, 255, 255, 255, 0, 128, 4, 0, 0, 0,
      128, 0,
    ]);
    await this.command([0x50]);
    for (let address = 0; address < image.length; address += 128) {
      let word = address / 2;
      await this.command([0x55, word & 255, (word >> 8) & 255]);
      await this.command([
        0x64,
        0,
        128,
        0x46,
        ...image.slice(address, address + 128),
      ]);
      onProgress(Math.round(((address + 128) / image.length) * 85));
    }
    for (let address = 0; address < image.length; address += 128) {
      let word = address / 2;
      await this.command([0x55, word & 255, (word >> 8) & 255]);
      const page = await this.command([0x74, 0, 128, 0x46], 128);
      if (page.some((v, i) => v !== image[address + i]))
        throw Error(
          "Read-back verification failed. Reconnect and upload again.",
        );
      onProgress(85 + Math.round(((address + 128) / image.length) * 15));
    }
    await this.command([0x51]);
  }
  async close() {
    this.closed = true;
    try {
      await this.reader?.cancel();
    } catch {}
    try {
      this.reader?.releaseLock();
      this.writer?.releaseLock();
      await this.port.close();
    } catch {}
  }
}
