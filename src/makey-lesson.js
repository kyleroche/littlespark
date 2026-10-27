export const MAKEY_PARTS = [
  { id: "board", name: "Makey Makey Classic", quantity: "1 · from the kit", detail: "The board with arrow pads, SPACE, CLICK and a metal EARTH strip. This activity uses the front pads." },
  { id: "usb", name: "USB data cable", quantity: "1 · from the kit", detail: "Use the cable supplied with your board. You may need an adapter for your computer’s USB port. No code upload is needed." },
  { id: "clips", name: "Alligator leads", quantity: "4 · from the kit", detail: "One lead connects EARTH to your hand. Three more join SPACE, LEFT and UP to three separate fruits. Colors can be different from this diagram." },
  { id: "fruit", name: "Bananas or foil pads", quantity: "3 · bring from home", detail: "Three separate bananas make three keys. Three pieces of kitchen foil also work. Fruit is not included in the kit." },
  { id: "computer", name: "Computer with USB", quantity: "1 · bring from home", detail: "Keep the piano tab active. A Makey Makey acts like a USB keyboard. This lesson uses Space, Left arrow and Up arrow." },
  { id: "mat", name: "Dry work surface", quantity: "1 · prepare at home", detail: "Leave space between the fruits and keep clips from touching. Keep food and moisture away from the computer." },
];
export const MAKEY_STEPS = [
  { title: "Find these six things.", short: "Unbox your kit", description: "Take the board, USB cable and four alligator leads out of your Makey Makey Classic kit. Gather the other things from home. Tap a part in the picture to inspect it, then tick the list.", tip: "No fruit? Three separate pieces of foil can be your keys.", caption: "KIT PARTS + THINGS FROM HOME" },
  { title: "Plug in the board.", short: "Add USB", description: "With a grown-up, plug the small end of the supplied USB cable into the Makey Makey and the other end into your computer. The board sends keyboard presses; there is no program to upload.", tip: "In the diagram, the cable joins the board to a computer. On your desk, check the board has power.", caption: "COMPUTER → USB → BOARD" },
  { title: "Make the EARTH connection.", short: "Connect EARTH", description: "Clip one lead to the metal EARTH strip along the bottom of the board. Hold the bare metal at the other end. Leave one hand free to touch a key.", tip: "EARTH is the return connection. Your body will help close the loop when you touch a key.", caption: "EARTH → CLIP → YOUR HAND" },
  { title: "Try one key first.", short: "Touch SPACE", description: "Keep holding the EARTH clip, then touch the board’s SPACE pad with your other hand. In the diagram, switch virtual EARTH on and tap Try SPACE to see the closed path.", tip: "Release virtual EARTH and try again. An open loop cannot trigger our virtual key.", caption: "A CLOSED PATH MAKES A KEY PRESS" },
  { title: "Give SPACE a banana.", short: "Clip the first fruit", description: "With USB unplugged while you move clips, attach another lead to SPACE and its other end to a banana or foil pad. Watch the orange lead arrive. Reconnect USB when your clips are in place.", tip: "The banana becomes a bigger SPACE key. Clip it firmly so the metal makes contact.", caption: "SPACE → LEAD → FIRST FRUIT" },
  { title: "Add two more fruit keys.", short: "Add LEFT and UP", description: "Unplug USB while changing clips. Connect LEFT to a second fruit and UP to a third. Keep fruits and metal clips apart. Reconnect USB when ready.", tip: "Four leads total: EARTH, SPACE, LEFT and UP. Match the pad names, not just our wire colors.", caption: "THREE SEPARATE INPUTS" },
  { title: "Play your fruit piano.", short: "Play three notes", description: "Choose Virtual practice below, connect virtual EARTH, and tap each fruit key. With a real board, choose Real board / keyboard, turn sound on, and Focus piano. Hold EARTH and touch your fruits to play.", tip: "Play C, D and E to finish. The same keys also work from an ordinary keyboard; that does not verify real wiring.", caption: "TOUCH → KEY PRESS → NOTE" },
];
export const NOTES = [
  { key: " ", label: "SPACE", name: "C", frequency: 261.63, color: "#c47735" },
  { key: "ArrowLeft", label: "LEFT", name: "D", frequency: 293.66, color: "#537f75" },
  { key: "ArrowUp", label: "UP", name: "E", frequency: 329.63, color: "#a67185" },
];
export function canPlay({ step, mode, earth }) { return step === 5 && (mode === "real" || earth); }
