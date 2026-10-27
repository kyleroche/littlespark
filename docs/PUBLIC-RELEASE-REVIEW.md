# Public release review

Reviewed on October 27, 2026. The repository is still private; this document does not authorize a visibility change.

## Checks completed

- Scanned fetched Git history and staged source changes with Gitleaks. No committed secrets were found. Development credentials remain in ignored `.env.local`; the built client was checked for configured server secrets.
- Dependency audit reported no known vulnerabilities. Application tests, firmware simulation/protocol tests, and production builds passed.
- Verified server-side family ownership and child/parent role boundaries, five-minute expiry, atomic one-time redemption, rate limits, session revocation, and progress reset generations against the configured database.
- Checked that an old tab cannot save to another child after the browser switches accounts. Mutations bind the displayed profile to the authenticated session; mismatches require a reload.
- Verified production HTTPS, guest account API behavior, and rejection of foreign request origins.
- Production database and email credentials are excluded from preview environments. GitHub verification jobs have read-only repository permissions and receive no production credentials.
- Removed the temporary browser test families. Artwork exports and local development credentials are outside the tracked source.

## Decisions and verification still needed

1. Choose a license for original source and contributor submissions. Decide separately whether the Little Spark name, logo, and apparel illustrations are included in that permission. No source license has been added yet.
2. Add and verify the sender-domain DNS records, then test a real parent email sign-in and account recovery with the owner. Database-backed login tests do not prove email delivery.
3. Decide and document the account-data lifecycle: parent email, child nickname/icon, progress, session retention, and how families request deletion. Self-service family deletion and a public privacy notice are not implemented.
4. Test flashing and readback on a physical Uno R3. Browser-only emulator and uploader protocol tests cannot establish real-hardware compatibility. Firefox uploading has not been verified.
5. Review the final release diff and obtain the owner's explicit instruction before making the repository public.

## Community lessons

The proposed format is in [LESSON-CONTRIBUTIONS.md](LESSON-CONTRIBUTIONS.md). Start with reviewed pull requests containing lesson data, approved circuit components, step animations, the sketch, and simulation checks. Extract Blink into a reference package before promising drop-in community lessons. The loader and contributor preview command are not implemented yet.

These checks describe evidence gathered for this revision, not a guarantee that the app is vulnerability-free.
