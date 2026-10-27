export const BOARD_DETAILS = {
  usbPort: {
    title: "The USB port",
    description:
      "The square socket brings power and your program from the computer to the Uno. The square end of your USB cable goes here.",
  },
  microcontroller: {
    title: "The tiny brain",
    description:
      "This long black chip is the ATmega328P. It follows your code, one little instruction at a time.",
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
      "A0 to A5 can read changing signals, like how far a knob has turned. We’ll use these in future adventures.",
  },
  powerJack: {
    title: "The round power socket",
    description:
      "This socket is for an external power supply. For this adventure, leave it empty and use the USB cable.",
  },
  resetButton: {
    title: "The reset button",
    description:
      "Pressing this little button starts the program over from the beginning.",
  },
};
