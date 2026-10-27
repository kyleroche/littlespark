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

- Source: https://github.com/kyleroche/littlespark (private).
- Brand: **Little Spark** (singular). Canonical domain: `littlespark.tech`.
- Hosting: Vercel project `little-sparks`; preserve the existing project and fallback production alias.
- Existing `little-sparks-*` local-storage keys intentionally preserve returning learners’ progress.
- `/` is the explanatory home page; `/learn/` is the lab. Magic login routes load the dedicated sign-in page and enter the lab after redemption. The lab requires a server-validated parent or child session; never restore guest access. Gear Store links to `https://littlespark.vtc.store` in a new tab. Keep reduced-motion and narrow-screen fallbacks for home-page animation.
- Keep the exact tested firmware image as the only upload source. A program change invalidates prior verification. State clearly when physical-board validation is still outstanding.
- Keep original procedural models and the illustrated workbench style. Avoid placing a modal over a component close-up.

## Tone and workspace

Keep copy playful but direct. Use clear component names, short instructions, and observable results. Avoid motivational filler, repeated taglines, and phrases such as “tiny brain,” “little adventure,” or “big ideas start small.”

Support Build + Code, Build only, Code only, and Guided layouts. Keep instructions and lesson navigation available in every layout, including narrow screens.

## Accounts and public contributions

- Keep the repository private until the owner explicitly authorizes a visibility change.
- Never commit `.env` files, credentials, user data, or child login links.
- Parent and child authorization must be enforced in the API, never by client-provided roles or IDs. Kid links expire after five minutes, are hashed in storage, and are consumed atomically once.
- Do not expose production database or email credentials to preview builds or community PRs.
- Community lesson proposals should be declarative data with validated part IDs, connection points, animation cues, and checks. Do not execute contributor-supplied JavaScript or raw HTML as lesson content.
