export const blinkUnboxing = {
  short: "Unbox your kit",
  sub: "Find the parts",
  title: "Find these six things.",
  description:
    "Take these parts out of your official Arduino Starter Kit. Tap a name for a close-up, then tick it off when you find it.",
  tip: "Just a few parts today.",
  detail: "Keep spare parts in the box. Leave USB unplugged while building.",
  caption: "PARTS CHECKLIST",
  next: "My parts are ready!",
};
export const blinkKit = [
  {
    key: "board",
    name: "Arduino Uno",
    qty: "1 board",
    hint: "The teal board with a big square USB port. Look for UNO printed on it.",
    glyph: "▤",
  },
  {
    key: "usb",
    name: "USB cable",
    qty: "1 cable",
    hint: "One flat USB-A end for your computer; one square USB-B end for the Uno. Keep it unplugged for now.",
    glyph: "⌁",
  },
  {
    key: "breadboard",
    name: "Breadboard",
    qty: "1 · 400 points",
    hint: "The white rectangle full of little holes, with a long gap down the middle and red/blue rails at the sides.",
    glyph: "⠿",
  },
  {
    key: "led",
    name: "Red LED",
    qty: "1 · two legs",
    hint: "A red light with two metal legs. Pick the one with TWO legs, not the four-legged RGB LED.",
    glyph: "♟",
  },
  {
    key: "resistor",
    name: "220 Ω resistor",
    qty: "1 · red, red, brown",
    hint: "Look for red–red–brown–gold bands on a four-band resistor. A five-band 220 Ω resistor is red–red–black–black–brown. Ask a grown-up to check.",
    glyph: "▰",
  },
  {
    key: "wires",
    name: "Jumper wires",
    qty: "2 · solid core",
    hint: "Two wires with bare metal tips at both ends. The kit’s wire colors may differ from our golden and green ones.",
    glyph: "∿",
  },
];
export const blinkSteps = [
  {
    short: "Meet your board",
    sub: "Explore the board",
    title: "Meet the Arduino Uno",
    description:
      "This is an Arduino. It follows your instructions to make things happen. Try dragging the board to explore it!",
    tip: "The board follows your code.",
    detail:
      "Your program runs on the board, even when it is disconnected from the computer.",
    caption: "ARDUINO UNO R3",
    next: "Add the breadboard",
  },
  {
    short: "Place the breadboard",
    sub: "Bring in the breadboard",
    title: "Set out the breadboard",
    description:
      "Watch the breadboard slide into place. Push parts into its holes to connect them without soldering.",
    tip: "Five holes share a connection.",
    detail:
      "Each group of five holes is connected underneath. The middle gap keeps the two sides apart.",
    caption: "BREADBOARD",
    next: "Let’s add a light",
  },
  {
    short: "Add your light",
    sub: "Check the two legs",
    title: "Place the LED",
    description:
      "The LED lands across the breadboard’s middle gap. Its long leg goes in E11. Its short leg goes in F11.",
    tip: "Legs matter!",
    detail:
      "The long leg is the way in (+). The short leg is the way out (−). Electricity needs to go the right way.",
    caption: "LONG LEG IN · SHORT LEG OUT",
    next: "Add the resistor",
  },
  {
    short: "Slow things down",
    sub: "Limit the LED current",
    title: "Add a 220 Ω resistor",
    description:
      "The 220 Ω resistor connects C11 to C17. It slows the electricity down so our LED gets just enough.",
    tip: "The resistor limits current.",
    detail:
      "The resistor limits the flow. Our LED’s long leg shares a connected group with one end of the resistor.",
    caption: "220 Ω RESISTOR",
    next: "Let’s connect it",
  },
  {
    short: "Join the dots",
    sub: "Make a complete path",
    title: "Give electricity a way home.",
    description:
      "The golden wire joins D13 to A17. The green wire joins GND to J11. Watch the path come together!",
    tip: "A circuit is a round trip.",
    detail:
      "D13 → resistor → LED → GND. The path has to go all the way around for the light to shine.",
    caption: "OUT THROUGH D13 · HOME THROUGH GND",
    next: "Test the circuit",
  },
  {
    short: "Make it blink!",
    sub: "Run your code",
    title: "Make it blink",
    description: "Choose a speed and test your code on the virtual Arduino.",
    tip: "Change the delay to change the rhythm.",
    detail:
      "Changing the wait changes the rhythm. Try a slow blink, then a fast one. What do you notice?",
    caption: "BLINK TEST",
    next: "Test my circuit",
  },
];
export const TRAFFIC_CONNECTIONS = [
  {color:'red',pin:13,column:4,end:10,x:25.79,boardX:-44.84,mask:32},
  {color:'yellow',pin:12,column:13,end:19,x:48.65,boardX:-42.3,mask:16},
  {color:'green',pin:11,column:22,end:28,x:71.51,boardX:-39.76,mask:8},
];
export function trafficSource(unit) {
  if (![250,500,1000].includes(unit)) throw Error('Unsupported lesson speed.');
  return `// Traffic lights: red, green, yellow\nvoid setup() {\n  pinMode(13, OUTPUT); // Red\n  pinMode(12, OUTPUT); // Yellow\n  pinMode(11, OUTPUT); // Green\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH); // Stop\n  delay(${unit*2});\n  digitalWrite(13, LOW);\n\n  digitalWrite(11, HIGH); // Go\n  delay(${unit*2});\n  digitalWrite(11, LOW);\n\n  digitalWrite(12, HIGH); // Get ready to stop\n  delay(${unit});\n  digitalWrite(12, LOW);\n}\n`;
}
export function arduinoLesson(traffic=false) {
  if (!traffic) return {unboxing:blinkUnboxing,kitItems:blinkKit,steps:blinkSteps};
  const kitItems=blinkKit.map(item => item.key==='led' ? {...item,name:'Red, yellow and green LEDs',qty:'3 · one of each color',hint:'Find three two-legged LEDs: red, yellow and green. Each long leg is positive. Use their positions to tell them apart in the diagram.'} : item.key==='resistor' ? {...item,qty:'3 · 220 Ω each',hint:'Each LED needs its own 220 Ω resistor. Ask a grown-up to check all three resistor values.'} : item.key==='wires' ? {...item,qty:'6 · solid core',hint:'Three leads go from D13, D12 and D11 to the resistors. Three more join the short LED legs to a common GND path.'} : item);
  return {unboxing:{...blinkUnboxing,title:'Find the traffic-light parts.',description:'From your Uno R3 Starter Kit, find the board, USB cable, breadboard, three LEDs, three 220 Ω resistors and six jumper wires. Tick each group when you find it.'},kitItems,steps:[
    {...blinkSteps[0],title:'Three outputs, one sequence',description:'D13 will control red, D12 yellow, and D11 green. Each output will turn on just one light. Drag to explore the Uno.',detail:'We are making a model traffic light, not a controller for a real road.'},
    {...blinkSteps[1],detail:'Each column number has two separate groups: A–E and F–J. The middle gap separates the LED’s two legs.'},
    {...blinkSteps[2],short:'Place three LEDs',title:'Red, yellow, green',description:'Red: long leg E4, short leg F4. Yellow: E13 and F13. Green: E22 and F22. Watch the three LEDs land across the middle gap.',detail:'The long legs are on the A–E side. The short legs are on the F–J side. Check each one before adding wires.',caption:'RED 4 · YELLOW 13 · GREEN 22',next:'Give each LED a resistor'},
    {...blinkSteps[3],short:'Add three resistors',title:'One resistor for each LED',description:'Use three 220 Ω resistors: C4 → C10, C13 → C19, and C22 → C28. Each one shares a column with its LED’s long leg.',detail:'A single shared resistor would not give each LED its own current limit. These are three separate signal branches.',caption:'3 × 220 Ω',next:'Join the signal and return paths'},
    {...blinkSteps[4],title:'Connect three signals and one return path',description:'D13 → A10 (red), D12 → A19 (yellow), D11 → A28 (green). Join GND → H4, J4 → J13, and I13 → J22. Follow the six wires as they arrive.',detail:'The short LED legs share a return path through the F–J groups at columns 4, 13 and 22. Keep USB unplugged while wiring. Match pin and hole names even if your wire colors differ.',caption:'D13 RED · D12 YELLOW · D11 GREEN'},
    {...blinkSteps[5],title:'Run your traffic lights',short:'Test the sequence',description:'Predict what comes after red. Then test your program: red → green → yellow, then repeat.',tip:'One light at a time.',detail:'Red and green each wait twice as long as yellow. Change the pace and test again. The virtual test checks the actual program’s order, timings, and exclusive outputs.',caption:'STOP → GO → GET READY TO STOP',next:'Test my sequence'},
  ]};
}
