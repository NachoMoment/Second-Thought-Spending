# Security notes

Second Thought: Spending keeps purchase entries and settings in app-private local storage. This storage does not have app-level encryption. Android application backup is disabled. The optional Accessibility service observes foreground app package names, compares them to a local selected list, and does not request window-content retrieval. The app has no accounts, ads, analytics, or cloud database.

An exported JSON file is not encrypted. Store exports carefully, particularly if they include product links or reflection answers.

## Report a security issue

Email [secondthoughtproject.support@gmail.com](mailto:secondthoughtproject.support@gmail.com) with `SECURITY` in the subject. Avoid putting real purchase histories, reflection answers, or exploit details in a public issue.

## Signing and updates

A debug APK from GitHub Actions is for testing only. Each runner may sign it with a different debug key, so a later debug build may require uninstalling the old one, which deletes local data. Export any data you want to keep first. Public GitHub Release APKs use a stable signing key stored outside this repository.
