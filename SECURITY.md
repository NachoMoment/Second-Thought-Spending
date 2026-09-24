# Security notes

Second Thought stores sensitive recovery information locally. Android builds
encrypt that information at rest with AES-GCM and a key protected by Android
Keystore. The project has no account system, analytics, advertising, cloud
database, or remote recovery-data service.

This privacy boundary does not change if the project accepts donations or uses
a proprietary license. Donation payments are handled by the linked external
provider; the app does not receive or store card, bank, or payout information.

## Reporting a security issue

Do not open a public issue containing an exploit, private recovery data, or a
real phone number. Email
[secondthoughtproject.support@gmail.com](mailto:secondthoughtproject.support@gmail.com)
with `SECURITY` in the subject.

## APK trust model

Local debug APKs are signed by the developer machine that built them. GitHub
Actions debug artifacts are intended for testing, not as a permanent trusted
release channel. Android will reject an update signed by a different key; it
will not silently replace the installed app.

Never uninstall an existing copy merely to fix a signature mismatch until any
local information you care about has been safely recorded elsewhere.
