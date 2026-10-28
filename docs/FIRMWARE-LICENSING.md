# Firmware source and library licenses

The sketch sources are original Little Spark code under MIT. The compiled `.hex` files also contain Arduino AVR core code under LGPL-2.1-or-later and toolchain runtime code under its upstream licenses/exceptions. The MIT grant does not replace those library licenses.

The unmodified Arduino AVR 1.8.8 core and Uno standard variant used by the supplied images are included in `public/firmware/licenses/ArduinoCore-avr-1.8.8-source.tar.gz`, with an adjacent SHA-256 file. The LGPL text is at `public/firmware/licenses/LGPL-2.1.txt`. The archive also contains the platform/board definitions and upstream README. Other board variants, drivers, bootloaders and optional libraries are not needed for these sketches and are not included. Full upstream source: https://github.com/arduino/ArduinoCore-avr/tree/1.8.8

## Rebuild or relink with modified core source

1. Install Arduino CLI and `arduino:avr@1.8.8`: `arduino-cli core install arduino:avr@1.8.8`.
2. Locate the CLI data directory with `arduino-cli config dump`. Its installed core is under `packages/arduino/hardware/avr/1.8.8`.
3. To modify the library, unpack the supplied source archive in a separate directory, edit the core/standard variant, and place the modified files in that installed core directory. Keep the original library notices and document your changes.
4. Run `node scripts/build-firmware.mjs` to compile/link all eight sketches and regenerate the `.hex` files and manifest digests. The exact `.ino` sources are also available under `public/firmware/`.
5. Run `npm test` and `npm run build`. Emulator checks validate program behavior; a modified image still needs physical-board testing. The uploader reads firmware back to check the flashed bytes.

The complete original sketch sources permit rebuilding the application against a modified library; no proprietary application object is required. The browser does not flash a bootloader. Do not represent the combined firmware as MIT-only.

The Arduino toolchain includes AVR libc and GCC runtime components. Their upstream license information is available at https://www.nongnu.org/avr-libc/user-manual/overview.html and https://www.gnu.org/licenses/gcc-exception-3.1.html. The CLI installs the matching toolchain for the pinned board package.
