// Every data-tour-feature in the UI must be covered here. See AGENTS.md.
export const TOUR_STEPS = [
  {
    id: "lesson-picker", feature: "lesson-picker", target: "#lesson-picker",
    title: "Choose a lesson", description: "Choose any Arduino or Makey Makey build in the field guide. Each lesson has its own steps and saved work.",
    tip: "Each lesson has its own checklist and progress.",
    detail: "Fruit Piano starts with unboxing and animated connections, then a playable piano. It has its own tour. Child profiles save both lessons separately; parents see every lesson in Family. Switching lessons keeps your saved steps.",
    action: "Show the lesson picker", demo: "lesson-picker",
  },
  {
    id: "home-store",
    feature: "home-store",
    target: "#how-to-link",
    title: "Home, How-to, and gear",
    description:
      "Home explains the project and lists every lesson. Its footer links third-party licenses; its GitHub link appears when the source repository is public. How-to walks through the steps. Gear store opens the apparel store.",
    tip: "Your workbench stays here.",
    detail:
      "How-to and Gear store open in new tabs from the lab, so switch back here to keep building. Home also links to the guide. Your lesson progress stays separate from the store.",
    action: "Show the help links",
    demo: "home-store",
  },
  {
    id: "accounts",
    feature: "accounts",
    target: "#account-button",
    title: "Sign in to save across devices",
    description:
      "Parents sign in with an email link. Kids use a short login link made by a parent. Sign-in is required to open the lab.",
    tip: "No passwords to remember.",
    detail:
      "Sign-in links expire after five minutes and work once. Parent practice stays in this browser; child profiles sync progress to their account.",
    action: "Open sign-in",
    demo: "accounts",
  },
  {
    id: "family",
    feature: "family",
    target: "#account-button",
    title: "Parent dashboard",
    description:
      "After signing in as a parent, create child profiles, see lesson progress, and generate a temporary login link or QR code for each child.",
    tip: "Use the link on the child’s device.",
    detail:
      "Each child has their own progress. Links work once and expire after five minutes; that does not limit lesson time. Use the child’s device. Parents can edit profiles or sign out a child’s devices.",
    action: "Open family accounts",
    demo: "accounts",
  },
  {
    id: "layout",
    feature: "layout",
    target: "#layout-controls",
    title: "Choose your workspace",
    description:
      "Build + Code puts the 3D workbench beside the editor on a wide screen. Build only and Code only give either pane more room.",
    tip: "Keep the instructions nearby.",
    detail:
      "The lesson and Next button stay below the workspace. Guided restores the lesson panel beside the workbench. Your choice is saved in this browser. The tour shows both panes and restores your layout when you leave.",
    action: "Try Build + Code",
    demo: "layout",
  },
  {
    id: "welcome",
    feature: "lessons",
    target: "#step-list",
    title: "Welcome to Little Spark.",
    description:
      "This is a practice lesson for using the app. Your circuit lesson and checklist are kept separately.",
    tip: "Your field guide is on the left.",
    detail:
      "On a small screen, the numbered steps sit across the top. Choose a step or use the bottom bar to move through the lesson. Back and Next stay visible in every workspace layout.",
    action: "Show me the lesson steps",
    demo: "lessons",
  },
  {
    id: "turn",
    feature: "camera",
    target: "#scene",
    title: "Rotate and tilt",
    description:
      "Drag with one finger or your mouse to turn the board. Drag up and down to see it from higher or lower. Try the arrow buttons, too.",
    tip: "You are moving your view.",
    detail:
      "The circuit stays connected. You can look around it without moving any wires.",
    action: "Show me a turn",
    demo: "rotate",
  },
  {
    id: "move",
    feature: "camera",
    target: "#scene",
    title: "Move and zoom",
    description:
      "Scroll or pinch to zoom. The view glides closer, then stops. Choose Move, then drag to slide the picture. On a touch screen, use two fingers to move and pinch.",
    tip: "Lost your board? Tap the target button.",
    detail:
      "Reset view brings the whole diagram back. Q/E turn, WASD move, +/− zoom, and the up/down arrows tilt.",
    action: "Let me try Move mode",
    demo: "pan",
  },
  {
    id: "inspect",
    feature: "inspection",
    target: "#scene",
    title: "Inspect a component",
    description:
      "Click a component to fly in for a closer look. You can even click the chip, USB port, or pins on the Arduino itself.",
    tip: "There is always a way back.",
    detail:
      "A small field-note card stays beside your component. Tap “Back to this step”, close the card, or press Escape to return to the diagram.",
    action: "Inspect the microcontroller",
    demo: "inspect",
  },
  {
    id: "code",
    feature: "code",
    target: "#code-notebook",
    title: "Edit the blink timing",
    description:
      "The code is the plan your Arduino follows. Change Blink delay to edit both wait instructions. Slow, steady, or fast: you choose the rhythm.",
    tip: "The loop has two wait instructions.",
    detail:
      "This editor uses timing controls rather than free typing. Copy code saves the sketch to your clipboard so you can also use it in the Arduino IDE.",
    action: "Try a faster blink",
    demo: "code",
  },
  {
    id: "sparky",
    feature: "sparky",
    target: "#sparky",
    title: "Ask Sparky for help",
    description: "Stuck? Ask Sparky sits beside the code. Give me a hint lights up the two wait lines and explains what they do.",
    tip: "You choose what changes.",
    detail: "Show a faster blink or Show a slower blink previews both wait changes. Try it applies them; Undo Sparky’s change restores the previous rhythm. Run a fresh test in step 7 after changing code. Close × hides his help. These are prepared hints for this lesson, not a chat or free typing.",
    action: "Meet Sparky",
    demo: "sparky",
  },
  {
    id: "test",
    feature: "simulation",
    target: "#simulation-status",
    title: "Try it on the virtual board.",
    description:
      "In the final circuit step, Test my circuit runs the actual program in a virtual Arduino. The status underneath the code tells you what happened.",
    tip: "A changed program needs a fresh test.",
    detail:
      "Changing Blink delay clears the old result. Pause stops the light. Color choices change the virtual LED’s color.",
    action: "Run a practice test",
    demo: "test",
  },
  {
    id: "hardware",
    feature: "hardware",
    target: "#board-button",
    title: "From the screen to your desk.",
    description:
      "With a grown-up, Connect a board can send a tested program to a classic Uno R3 using its USB cable.",
    tip: "Build unplugged. Check together.",
    detail:
      "The connection guide is a floating panel. Close its × or click the workbench to return. Pass the virtual test, have a grown-up check the real wiring, then connect and send in desktop Chrome or Edge. The test cannot see your physical wires. Safari users can download the sketch and upload it through the Arduino IDE.",
    action: "See the connection guide",
    demo: "hardware",
  },
  {
    id: "saved",
    feature: "progress",
    target: "#tour-lesson",
    title: "Save your progress",
    description:
      "Parent practice is saved in this browser. Child profiles save progress to their account. The tour does not complete circuit steps. If a profile changes in another tab, use Reload in the message before continuing.",
    tip: "You can come back to this tour anytime.",
    detail:
      "Use App tour at the top or Learn your way around in the field guide. Reset lesson progress resets the circuit lesson’s checklist and progress.",
    action: "Show my field guide",
    demo: "lessons",
  },
];
export function assertTourCoverage(features) {
  const covered = new Set(TOUR_STEPS.map((step) => step.feature));
  const missing = [...features].filter((feature) => !covered.has(feature));
  if (missing.length)
    throw new Error("App tour needs coverage for: " + missing.join(", "));
}

export const MAKEY_TOUR_STEPS = [
  { id: "makey-lessons", feature: "makey-lessons", target: "#makey-lessons", title: "Choose your lesson", description: "Choose any Arduino or Makey Makey lesson here. Each saves its own steps. This tour leaves your progress alone." },
  { id: "makey-parts", feature: "makey-parts", target: "#makey-kit", title: "Find the parts", description: "Check off the kit parts and things from home. Tap a part in the picture for details. Unboxing is a checklist, with no box to open on screen." },
  { id: "makey-diagram", feature: "makey-diagram", target: "#makey-diagram", title: "Watch the connections", description: "Next adds one connection at a time. Replay shows it again. Zoom + and − change the view; arrow buttons move it; Reset view brings everything back. Tap a part for a note, then Back to diagram." },
  { id: "makey-piano", feature: "makey-piano", target: "#makey-piano", title: "Try your fruit keys", description: "In the last step choose Virtual practice, connect virtual EARTH, then tap all three fruit keys. Release EARTH to see why the loop matters. Sound on enables the notes; Mute keeps the visual flashes." },
  { id: "makey-real", feature: "makey-real", target: "#makey-play-mode", title: "Play a real board", description: "Choose Real board / keyboard and click Focus piano. While holding the metal EARTH clip, touch your fruit. SPACE, LEFT and UP play notes. Your ordinary keyboard works too. No upload or special connection permission is needed; keyboard input cannot prove your real wiring is correct." },
  { id: "makey-progress", feature: "makey-progress", target: "#makey-progress", title: "Pick up where you left off", description: "Parent practice stays on this device. Child progress syncs to their profile and appears beside the Arduino lessons in Family. Wait for Progress synced before changing devices. Reset lesson resets only Fruit Piano." },
  { id: "makey-family", feature: "makey-family", target: "#account-button", title: "Family and help", description: "Family opens the parent dashboard or your learner profile. The How-to link opens a new tab. Close this tour to return to your current fruit-piano step." },
];

export function arduinoTour(traffic=false,button=false) {
  if (button) return TOUR_STEPS.map(step=>({...step,...({
    code:{title:"Read an input, choose an output",description:"D2 uses INPUT_PULLUP. Released is HIGH; pressed is LOW. Button rule chooses whether a press lights the LED or turns it off.",detail:"Choose Press = on or Press = off. This changes the output rule, not the wiring. Any change needs a fresh Test my button before upload.",action:"Try Press = off"},
    sparky:{description:"Sparky explains INPUT_PULLUP, digitalRead and the output rule.",detail:"Show press = on/off previews the digitalWrite line. Try it applies the rule, Undo restores it. Test again before uploading."},
    test:{title:"Test the button",description:"Test my button runs the real Uno program with released, pressed, and released inputs. After a pass, Press virtual button and Release virtual button control the emulator’s D2 input.",detail:"This checks program behavior. A grown-up must still check the LED resistor, button orientation and real wiring."},
    hardware:{detail:"Check LED E11/F11, resistor C11–C17, switch E22/F22/E24/F24 and all four wires with USB unplugged. Pass the current rule’s test before sending that exact image. The button uses internal pull-up. Physical uploads still need a hands-on check."}
  })[step.id]}));
  if (!traffic) return TOUR_STEPS;
  const replacements = {
    code: { title:"Edit the sequence pace",description:"The program turns on red, then green, then yellow. Sequence pace changes all three waits. Red and green each last twice as long as yellow.",detail:"This is a guided editor, not free typing. Changing pace clears the old test result. Copy code and Download sketch export this lesson’s matching program.",tip:"Three waits, one repeating sequence.",action:"Try a faster sequence" },
    sparky: { description:"Ask Sparky highlights the three wait lines and explains HIGH, LOW, and red → green → yellow.",detail:"Show a faster sequence or Show a slower sequence previews the three waits. Try it applies them; Undo restores the old pace. Test my sequence in step 7 checks the new program. Close × hides his help." },
    test: { title:"Test all three outputs",description:"In step 7, Test my sequence runs the compiled Uno program. It checks the order, timing and that two lights are never on together.",detail:"The diagram follows the program’s actual D13, D12 and D11 outputs. A changed pace needs a new test. Pause stops all three lights. This does not check physical wiring." },
    hardware: { detail:"With USB unplugged, have a grown-up check all three LED directions, three 220 Ω resistors and six jumper wires. Pass Test my sequence, then connect and send that exact tested program to a classic Uno R3 in Chrome or Edge. Safari can download the sketch for Arduino IDE. Close × returns to the workbench." },
  };
  return TOUR_STEPS.map(step=>({...step,...replacements[step.id]}));
}
export function activityTour(game=false){return [
 {feature:'activity-lessons',target:'#activity-lessons',title:'Choose a lesson',description:'Each lesson keeps its own checklist and progress. The lesson picker links all Arduino and Makey Makey builds.'},
 {feature:'activity-kit',target:'#activity-kit',title:'Find and inspect the parts',description:'Tick each group in the unboxing list. The small arrow opens a part note. Back to diagram returns to the whole view.'},
 {feature:'activity-diagram',target:'#activity-diagram',title:'Follow the connection',description:'Each step adds a connection. Replay shows it again. Use +/−, move arrows and Reset view. The diagram is a teaching picture, not a physical wiring test.'},
 {feature:'activity-hint',target:'#activity-hint',title:'Ask Sparky',description:'Ask Sparky opens a prepared explanation of EARTH, contact and keyboard input. Tap it again to hide the help.'},
 {feature:'activity-mode',target:'#activity-mode',title:'Virtual or real',description:'Virtual practice needs virtual EARTH. Real board / keyboard needs Focus activity and a USB keyboard connection. It also accepts your ordinary keyboard. It cannot identify a board or check real wiring.'},
 {feature:'activity-play',target:'#activity-play',title:game?'Collect three sparks':'Predict, test and record',description:game?'From step 6, use the arrows to move one square at a time. Collect three sparks to finish step 7. New round restarts the game while keeping completed lesson progress.': 'From step 5, select a sample and predict yes or no. Test sample runs the virtual example. In real mode, Focus activity then SPACE records a key; Record no key records your observation. All four samples complete step 7. Predictions need not be right.'},
 {feature:'activity-progress',target:'#activity-progress',title:'Save your work',description:'Child profiles sync steps and the experiment notebook. Parent practice stays on this device. Wait for Progress synced. Reset this lesson preserves every other lesson.'},
 {feature:'activity-family',target:'#account-button',title:'Family and help',description:'Family shows per-lesson progress. How-to opens another tab. Close tour returns to the same step without completing anything.'},
];}
