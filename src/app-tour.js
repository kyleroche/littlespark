// Every data-tour-feature in the UI must be covered here. See AGENTS.md.
export const TOUR_STEPS = [
  {
    id: "accounts",
    feature: "accounts",
    target: "#account-button",
    title: "Sign in to save across devices",
    description:
      "Parents sign in with an email link. Kids use a short login link made by a parent. You can also try the lessons without an account.",
    tip: "No passwords to remember.",
    detail:
      "Sign-in links expire after five minutes and work once. Without an account, progress stays in this browser.",
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
      "Parents can rename profiles and sign out a child’s devices. Child profiles only access their own progress.",
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
      "Guest progress is saved in this browser. Signed-in child profiles save progress to their account. The tour does not complete circuit steps.",
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
