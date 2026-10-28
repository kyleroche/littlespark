export const BOARD_DETAILS = {
  usbPort: {
    title: "The USB port",
    description:
      "The square socket brings power and your program from the computer to the Uno. The square end of your USB cable goes here.",
  },
  microcontroller: {
    title: "Microcontroller",
    description:
      "This long black chip is the ATmega328P. It runs the instructions in your program.",
  },
  digitalPins: {
    title: "The digital pins",
    description:
      "These numbered sockets can send signals. In our circuit, pin 13 tells the light when to turn on and off.",
  },
  powerPins: {
    title: "Power and ground",
    description:
      "These sockets share power with your circuit. GND is the way home for the electricity in our LED loop.",
  },
  analogPins: {
    title: "The analog pins",
    description:
      "A0 to A5 can read changing signals, like how far a knob has turned. We’ll use these in future lessons.",
  },
  powerJack: {
    title: "The round power socket",
    description:
      "This socket is for an external power supply. For this lesson, leave it empty and use the USB cable.",
  },
  resetButton: {
    title: "The reset button",
    description:
      "Pressing this button starts the program over from the beginning.",
  },
};
export const R4_BOARD_DETAILS = {
 ...BOARD_DETAILS,
 usbPort:{title:'USB-C port',description:'The small oval socket powers your Uno R4 WiFi and receives your program. Use a USB data cable.'},
 microcontroller:{title:'Renesas RA4M1',description:'This square chip runs your program. It uses different instructions from the Uno R3.'},
 wifiModule:{title:'Wi-Fi and Bluetooth module',description:'The metal-covered ESP32-S3 handles wireless features and the USB connection. These lessons use USB.'},
 ledMatrix:{title:'12 × 8 LED matrix',description:'These 96 little lights are built into the R4 WiFi. Our first lessons use the separate breadboard LEDs.'},
 qwiic:{title:'Qwiic connector',description:'This small connector is for compatible sensors. Leave it empty for this lesson.'},
};
