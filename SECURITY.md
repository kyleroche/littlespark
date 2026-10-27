# Security

This repository is private pending an explicit release decision by its owner. Do not publish credentials, learner data, or active login links in issues or pull requests. Report vulnerabilities privately to the repository owner; enable GitHub private vulnerability reporting when the repository is made public.

## Trust boundaries

- The browser is untrusted. Family ownership and learner identity are checked in the server API.
- Parent email links and child login links expire after five minutes and are consumed with an atomic database update. Only hashes are stored.
- Session cookies are HTTP-only, host-only, SameSite=Lax, and Secure in production. State-changing API requests require an approved Origin.
- Database-backed rate limits protect email requests, token redemption, and profile/link operations.
- Authenticated edits bind the displayed profile to the cookie session, preventing old tabs from writing to a newly selected account.
- Child accounts have no access to sibling profiles or parent account operations. Parents can revoke child sessions and links.
- Production secrets must not be present in community PR or preview builds.
- Emulator success validates the program's behavior, not the physical wiring of a real board. Physical USB uploads remain unverified until tested on hardware.

## Before public release

- Choose a license for the original source and document contributor licensing.
- Complete sender DNS verification and test parent email sign-in end to end.
- Review authentication and database authorization, including expiry, replay, race conditions, rate limits, and recovery/revocation.
- Run secret scans over all history and the working tree, dependency audits, tests, and a production build.
- Keep preview deployments separated from production data and credentials.

A clean automated scan reduces risk; it is not a guarantee that the application has no vulnerabilities.
