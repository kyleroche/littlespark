# Community lessons: proposed extension format

The current app contains one circuit with a fixed model/firmware implementation. Adding a JSON file alone does not yet add a working lesson. The next extension step should separate lesson content, circuit scenes, animation cues, and tests from the app shell.

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

New lessons should explain their parts, demonstrate each connection, and retain the app's camera controls, layouts, account saving, and parent view. Changes to app features must also update the App tour under `AGENTS.md`.

## Suggested rollout

1. Extract the existing Blink lesson as the first reference package and add a schema/validator.
2. Add a local preview command for contributors.
3. Accept reviewed pull requests for new lessons.
4. Add an in-app authoring tool only after the package format and validation rules are stable.
