# Contributing to Second Thought

Thank you for wanting to make Second Thought steadier. This is a proprietary,
owner-moderated project that accepts outside pull requests. A pull request is a
proposal, not permission to merge, publish, or redistribute the app.

## The ground rules

1. Open an issue before beginning a large change.
2. Never use real recovery information, names, phone numbers, reasons, or
   check-in notes in code, tests, screenshots, logs, issues, or pull requests.
3. Keep changes focused. One clear purpose per pull request is ideal.
4. Preserve calm language, large touch targets, reversible actions, and
   explicit confirmation before destructive actions.
5. Do not add analytics, advertising, tracking, accounts, remote recovery-data
   storage, or third-party SDKs that collect user behavior.
6. Do not weaken encryption, screen protection, emergency-call handling, or
   Android’s application-backup protections.
7. The maintainer may accept, revise, postpone, or decline any proposal.

## Before opening a pull request

Run:

```bash
npm install
npm run community:check
npm run build
npm run android:sync
```

Native call, notification, privacy-screen, or system-inset changes must also be
tested on a physical Android phone. Describe the safe test setup in the pull
request without including private data.

## Contribution rights

By submitting a pull request, you confirm that you have the right to submit the
work and agree to the contribution terms in `LICENSE.md`. You retain copyright
in your original work and grant the repository owner the broad rights needed to
use, modify, license, sublicense, distribute, and commercialize the contribution
as part of Second Thought. No contribution transfers control of the project or
creates a promise that the change will be merged.

