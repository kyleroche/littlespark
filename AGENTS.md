# Little Spark project rules

## Keep the app tour current

Every addition, removal, or change to a user-facing feature MUST update the in-app “Learn your way around” lesson in the same change. The tour is maintained in `src/app-tour.js`.

- Cover how to find and use the feature, what feedback to expect, and how to get back or undo a reversible action.
- Keep explanations understandable to an eight-year-old. Describe only behavior that actually works; distinguish the guided code editor from unrestricted text programming.
- Add `data-tour-feature="stable-feature-id"` to the feature's UI region. Ensure at least one tour step covers it. Keep referenced element IDs and camera help accurate.
- Update relevant README instructions alongside control or workflow changes.
- Run `npm test` and `npm run build`, then check the changed feature and its tutorial in the browser before publishing. Tutorial coverage tests must pass.
- The app tour must preserve circuit-lesson progress. Practice actions must never automatically request USB access or upload to a physical board.

## Development and release

- Source: https://github.com/kyleroche/little-sparks (private).
- Brand: **Little Spark** (singular). Canonical domain: `littlespark.tech`.
- Hosting: Vercel project `little-sparks`; preserve the existing project and fallback production alias.
- Existing `little-sparks-*` local-storage keys intentionally preserve returning learners’ progress.
- Keep the exact tested firmware image as the only upload source. A program change invalidates prior verification. State clearly when physical-board validation is still outstanding.
- Keep original procedural models and the illustrated workbench style. Avoid placing a modal over a component close-up.
