// Flash verification for boards whose factory bootloader advertises Z but does
// not answer it. The host patches the linked image length, then compares CRC32
// computed directly over the running sketch's flash. No network or identifiers.
#include <Arduino.h>
extern "C" {
extern const volatile uint32_t __attribute__((section(".rodata.spark"))) littleSparkImageLength = 0x53504B4C;
__attribute__((noinline)) void littleSparkVerifyFlash() {
  static bool ready = false;
  static uint8_t matched = 0;
  if (!ready) { Serial.begin(115200); ready = true; }
  const char query[] = "LS?\n";
  while (Serial.available()) {
    char c = Serial.read();
    if (c == query[matched]) matched++; else matched = c == 'L' ? 1 : 0;
    if (matched != 4) continue;
    matched = 0;
    uint32_t count = littleSparkImageLength;
    if (count < 8 || count > 0x3C000) return;
    const volatile uint8_t *flash = (const volatile uint8_t *)0x4000;
    uint32_t crc = 0xFFFFFFFF;
    for (uint32_t i = 0; i < count; i++) {
      crc ^= flash[i];
      for (uint8_t bit = 0; bit < 8; bit++) crc = (crc >> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
    Serial.print("LITTLESPARK:"); Serial.println(crc ^ 0xFFFFFFFF, HEX);
  }
}
}
