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
