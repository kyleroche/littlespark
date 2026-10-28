# Community lessons: proposed extension format

The current app contains six reviewed, built-in lessons: Arduino Blink, Traffic Lights and Push-button Light; Makey Makey Fruit Piano, Conductivity Detective and Game Controller. The Arduino lessons share a 3D model/firmware shell. The Makey Makey lessons use animated connection diagrams and keyboard input. Adding a JSON file alone does not yet add a working lesson. The next extension step should separate lesson content, circuit scenes, animation cues, and tests from the app shell.

## Recommended approach

Accept declarative lesson packages through pull requests. A package should contain:

- `lesson.json`: title, kit/board requirements, short steps, and camera cues.
- `circuit.json`: instances of approved component types and connections between named pins/holes.
- `sketch.ino`: the Arduino program with documented editable parameters.
- `checks.json`: supported simulation assertions, such as D13 transition count and timing.
- Preview image and any original assets, with attribution and compatible licenses.

Example shape (proposal, not a currently implemented loader):

```json
{
  "id": "button-led",
  "title": "Control an LED with a button",
  "board": "uno-r3",
  "parts": [
    {"id": "board", "type": "uno-r3"},
    {"id": "button", "type": "pushbutton"},
    {"id": "led", "type": "led", "color": "red"}
  ],
  "steps": [
    {
      "id": "place-button",
      "instruction": "Place the button across the breadboard gap.",
      "camera": {"focus": "button"},
      "animations": [{"type": "place-part", "part": "button"}]
    }
  ],
  "checks": [{"type": "digital-pin", "pin": "D13", "expected": "follows-button"}]
}
```

## Validation and trust

Use allowlisted component builders, named connection points, and a small animation vocabulary: `place-part`, `connect-wire`, `highlight`, `focus`, and `wait-for-action`. Text should render as text, not raw HTML. Avoid third-party script URLs and arbitrary executable expressions.

CI should validate IDs and connections, compile the sketch in an isolated job, run the emulator checks, and build a preview without production credentials. Maintain a reviewed component library rather than letting lessons register code at runtime. Firmware uploads must use exactly the artifact that passed the emulator checks.

New lessons should explain their parts, demonstrate each connection, and retain the app's camera controls, layouts, account saving, and parent view. Changes to app features must also update the relevant App tour, public How-to, and home page for major features under `AGENTS.md`. Keep lesson progress under an allowlisted lesson ID; resets must not affect another lesson. Fruit Piano is a built-in implementation, not a drop-in lesson loader. Keyboard input is distinct from AVR emulation and cannot verify physical wiring.

## Suggested rollout

1. Extract the existing Blink lesson as the first reference package and add a schema/validator.
2. Add a local preview command for contributors.
3. Accept reviewed pull requests for new lessons.
4. Add an in-app authoring tool only after the package format and validation rules are stable.

The three Arduino lessons now share `src/arduino-lessons.js`, the workbench and the app shell. New built-in lessons still need reviewed geometry, firmware verification and a server-allowlisted progress ID; adding JSON alone does not create them.

The shared catalog in `src/lesson-catalog.js` also supplies the server lesson allowlist and Family navigation. Conductivity Detective and Game Controller share a Makey activity shell; Push-button Light adds an actual emulated input and compiled-rule verification to the Arduino shell. Keep lesson-specific notebook/game fields bounded in server normalization and independent under resets.
