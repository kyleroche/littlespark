# Security

This repository is private pending an explicit release decision by its owner. Do not publish credentials, learner data, or active login links in issues or pull requests. Report vulnerabilities privately to the repository owner; enable GitHub private vulnerability reporting when the repository is made public.

## Trust boundaries

The lab requires a server-validated parent or child session. Vercel Node routing middleware protects `/learn/` and its HTML entry point; Vite mirrors the check locally. The client verifies the session before loading the workbench module. Home, sign-in, login-link landing pages, and the external gear store remain public. Public JS/firmware assets are not a DRM boundary.

- The browser is untrusted. Family ownership and learner identity are checked in the server API.
- Parent email links and child login links expire after five minutes and are consumed with an atomic database update. Only hashes are stored.
- Session cookies are HTTP-only, host-only, SameSite=Lax, and Secure in production. State-changing API requests require an approved Origin.
- Database-backed rate limits protect email requests, token redemption, and profile/link operations.
- Authenticated edits bind the displayed profile to the cookie session, preventing old tabs from writing to a newly selected account.
- Child accounts have no access to sibling profiles or parent account operations. Parents can revoke child sessions and links. Revocation increments a profile authorization generation; sessions and links from an older generation are rejected, including overlapping redemptions.
- Production secrets must not be present in community PR or preview builds.
- Emulator success validates the program's behavior, not the physical wiring of a real board. Physical USB uploads remain unverified until tested on hardware.

## Before public release

- Preserve the MIT code/lesson-text license and reserved brand/artwork scope in `BRAND.md`. Third-party materials retain their own licenses.
- Parent email delivery and child login/progress have been confirmed by the owner; repeat relevant checks after authentication or email changes.
- Review authentication and database authorization, including expiry, replay, race conditions, rate limits, and recovery/revocation.
- Run secret scans over all history and the working tree, dependency audits, tests, and a production build.
- Keep preview deployments separated from production data and credentials.

A clean automated scan reduces risk; it is not a guarantee that the application has no vulnerabilities.

See [the current release review](docs/PUBLIC-RELEASE-REVIEW.md) for audit evidence, author-email exposure and outstanding privacy/data-lifecycle work. Source publication is separate from service privacy readiness.
