# Public release review

Reviewed October 27, 2026, against baseline `d5a7032` and the release-preparation changes accompanying this document. The repository remains private. This review does not authorize a visibility change.

## Result

No committed credentials were found in the fetched history. The original code and lesson text are now MIT licensed; the brand and artwork are reserved under [BRAND.md](../BRAND.md). Publication still requires the owner's authorization and resolution of the retained pull-request history described below. This is a scoped audit, not a guarantee that the application has no vulnerabilities.

## Evidence

- Gitleaks scanned all fetched refs/tags: 20 commits, zero history findings. The directory scan found five credential findings, all in ignored `.env.local`, with none in tracked source. Those local credentials must stay ignored. Scan reports are ignored local audit artifacts, not public attachments.
- `npm audit` reported zero known vulnerabilities. All 44 application, emulator/protocol and tutorial tests passed, as did the production build. Configured server secrets were checked against the built client without printing their values.
- Database integration checks cover parent ownership, sibling isolation, stale-tab identity, atomic one-time redemption, five-minute expiry, rate limits, independent lesson saves and reset generations. Test families are removed afterward; no real login email is sent by these checks.
- A concurrent child-link redemption could previously survive a parent's revocation because a delete missed an uncommitted session. The race was reproduced. Child sessions and links now carry the profile's authorization generation; revocation increments that generation, so surviving old rows cannot authenticate. The overlapping-login regression, rejection of a stale link and successful use of a fresh link pass. The additive database migration preserves existing sessions at generation zero.
- Previous production checks confirmed HTTPS, secure cookies, guest API behavior and foreign-origin rejection. The owner subsequently confirmed real parent email sign-in, child creation, child login and saved progress. Sender DNS and email delivery are no longer pending.
- Vercel production database/email credentials are absent from Preview environments. GitHub verification uses read-only repository permissions, receives no production credentials and does not use `pull_request_target`.
- Runtime dependency license texts, the Arduino LGPL text and corresponding core/standard-variant source accompany the app. See [firmware licensing](FIRMWARE-LICENSING.md). Original procedural model code is MIT; reserved raster artwork is not.

## Publication details

At the owner's request, both branch histories were rewritten to replace the work email with the GitHub no-reply address. File trees were verified unchanged, and future local commits use the no-reply address. GitHub still retains the original merged pull request #1 head/merge references, which contain the previous metadata. Those references cannot be overwritten through a normal branch push. Keep the repository private until the owner chooses GitHub-assisted removal or a fresh repository containing only sanitized history. An ignored local backup preserves recovery; do not publish that backup.

The home navigation and footer have a prepared GitHub link controlled by the public build flag `VITE_PUBLIC_REPOSITORY=true`. Leave it false while the repository is private. After explicit publication authorization, change visibility, verify anonymous repository access, enable the flag for Production and redeploy. The public footer already links to dependency licenses.

## Existing service gaps, separate from source publication

- `/privacy/` now publishes the owner-provided operator/address/email, purposes, providers, rights and retention. Fresh-parent export/deletion, parent authorization records, delayed confirmation and daily expired-credential cleanup are implemented. The owner chose to keep family records until parent deletion; there is no inactivity purge. Operator phone, legal review of child verification/retention, processor terms and actual backup/log windows remain operator work under [PRIVACY-OPERATIONS.md](PRIVACY-OPERATIONS.md).
- Fonts are now self-hosted with OFL notices. No advertising or analytics scripts are installed. Provider processing and independently expiring delivery/security/backup records are described in the privacy notice.
- Physical Uno flashing/readback and hands-on Makey Makey circuits remain unvalidated. Simulation and browser keyboard checks cannot establish real wiring or hardware compatibility.

These are existing service-readiness limitations. Opening source does not establish privacy compliance or resolve them.

## Community lessons

[LESSON-CONTRIBUTIONS.md](LESSON-CONTRIBUTIONS.md) describes a proposed reviewed, declarative package format. A drop-in loader and contributor preview command are not implemented. Contributions to original code/lesson text use MIT; forks must replace reserved branding/artwork before separate publication. Never supply production credentials to contributor previews.
