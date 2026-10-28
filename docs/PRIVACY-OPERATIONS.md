# Family privacy operations

Operator: Valor Thread Company, 1007 Main Street, Sumner, WA 98390. Privacy mailbox: kyro+littlespark@mail.grokbot.com. Owner supplied October 27, 2026. Public notice: `/privacy/`.

## Shipped controls

- Original child records contain nickname/icon and bounded lesson progress, not birthday, school, child email or unrestricted submissions. Sparky sends no data to an AI model. No selling, advertising or model training with family data.
- A verified parent email session is required for the dashboard. Explicit parent/legal-guardian authorization records the notice version and time before new child profiles or links. A delayed transactional confirmation is queued at least 30 minutes afterward and sent by the daily job. Existing child access is not retrospectively described as verified consent.
- POST family export is parent-owned, tied to the displayed profile and requires a parent session created in the last 15 minutes. Export includes parent/profile/lesson data, not credentials or link/session hashes.
- Child deletion requires the exact nickname; family deletion requires the parent email plus DELETE. Both require fresh parent email sign-in, parent ownership and matching displayed identity. Database cascades delete sessions, child links and progress. Family deletion also deletes its parent login link. Minimal ID/type/time deletion receipts expire after 35 days.
- At the owner's explicit choice, family accounts and progress stay until the parent deletes them. There is **no inactivity expiry or automatic family deletion**. Review continuing necessity and the children’s-data retention policy at least annually; do not assume an open account justifies unlimited retention under every applicable law. Any necessary change to that policy requires owner approval and updated notices.
- The bearer-secret-protected daily `/api/retention` job purges expired sessions, expired rate-limit/link rows (one-day buffer), deletion receipts older than 35 days, and sends pending permission confirmations. It never deletes inactive families. Configure a random server-only Production `CRON_SECRET`. Vercel schedule: daily 08:00 UTC. Failures return 500 without personal details; check Vercel job status and retry after repair.
- Fonts are self-hosted with OFL licenses; no Google Fonts requests. Email open/click tracking should remain disabled. No marketing/analytics scripts are installed.

## Rights requests and restores

Monitor the privacy mailbox. Verify control of the relevant parent email proportionately, track the request/date and respond within one month where GDPR applies (document lawful extensions/refusals). Support access, correction, erasure, restriction, objection and portability. Use the dashboard for normal exports/deletions; do not email raw family exports or share them in GitHub. A request concerning a child must be handled according to their rights and applicable guardian rules, not automatically disclosed to an unverified claimant.

Before restoring a database, export the current `ls_deletions` ID/type/time receipts to a restricted operator location. After restoring, re-delete matching parent/child IDs (parent deletion cascades) and remove parent login links for the affected parent emails. Reapply all intervening privacy requests, revoke restored sessions/links, and verify before opening the restored service. Keep restored branches inaccessible and delete temporary recovery branches. If the current deletion ledger is unavailable, do not serve restored family data until deletion requests have been reconciled. Do not create unscheduled permanent database dumps. Limit the configured recovery window and ensure receipts outlive it; review this after provider/plan changes. Remove temporary receipt exports when reconciliation is complete and the recovery window has elapsed.

Local profile caches are cleared on the deleting browser. Other-device storage and parent-downloaded files require clearing on those devices; the app does not promise remote browser erasure. Provider delivery/security records and backups follow their own retention; coordinate applicable erasure/restriction requests with providers. Resend documents 30-day message/log retention and seven-day backups on standard plans. Confirm actual Neon/Vercel configuration rather than promising a guessed backup deadline.

## Remaining operator/legal work

These controls and a notice are not a legal compliance certification. Confirm the public operator phone number for the child-directed notice. Review the lawful basis, child consent verification (including whether email-plus is appropriate for the actual uses/providers), and the account-based retention choice with qualified privacy counsel. The FTC prohibits retaining children’s information indefinitely; a written policy must explain the business need, retention period and deletion procedure. Account persistence cannot substitute for that necessity review.

Maintain a processing inventory, processor terms/DPAs and international-transfer safeguards with Vercel, Neon, Resend and relevant subprocessors. Verify database location, configured backup/log windows and provider erasure assistance. Determine whether a DPIA, EU/UK representative or other jurisdiction-specific measures are required for the intended audience. Review the privacy mailbox, consent confirmation failures and cleanup job regularly. Have a breach response process, including timely regulator/data-subject notifications when required. Do not claim these operator decisions were completed by deploying code.

## Primary references

- [European Commission: individual rights and required notice information](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en)
- [FTC: COPPA FAQs, operator notice, parental consent and retention](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Resend: processing, retention and international safeguards](https://resend.com/security/gdpr)
- [Vercel: securing cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
