# Put a public APK download on GitHub

**You do not need this guide to install the app on your own phone.** From the project folder, run `npm ci`, `npm run phone:doctor`, and `npm run phone:install`, just as you did for the original Second Thought. That builds and installs a test APK with no extra signing setup.

This guide is only for giving visitors a simple APK download without asking them to build it. A *GitHub Release* is a GitHub page with that APK attached. It is unrelated to publishing in an app store. A consistent private signing key lets people install future updates over their first download without losing locally stored entries.

If you are copying this ZIP into an existing Git checkout, keep that checkout's `.git` folder and replace its project files with the extracted contents. This ZIP includes the hidden `.gitignore` and `.github` folder. If the older checkout tracked generated files, untrack them before committing with `git rm -r --cached --ignore-unmatch node_modules dist .vite`; remove any old file named `gitignore` (without the leading dot). Then commit and push the updated source.

## Once: create a private signing key

An APK must be signed, and future versions need **the same key** to install over existing versions. Generate it on your own computer with a Java JDK:

```bash
keytool -genkeypair -v -keystore spending-release.jks -alias spending-release -keyalg RSA -keysize 3072 -validity 10000
```

Back up `spending-release.jks`, its passwords, and its alias somewhere private. Never add the keystore or passwords to GitHub files, issues, or releases. If you lose the key, Android users cannot install future versions over the existing app without uninstalling it and losing locally stored data.

In your repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
| --- | --- |
| `ST_SPENDING_KEYSTORE_B64` | One-line output of `base64 < spending-release.jks | tr -d '\n'` on your Mac. Treat this output as secret. |
| `ST_SPENDING_STORE_PASSWORD` | The keystore password. |
| `ST_SPENDING_KEY_ALIAS` | `spending-release`, or the alias you chose. |
| `ST_SPENDING_KEY_PASSWORD` | The key password. |

The `Build signed APK` workflow only reads these GitHub secrets inside the release job. It produces **one installable Android APK** and a SHA-256 checksum; it does not build a store bundle. The key stays out of the repository. Anyone who can change workflows or run code on your release branch can potentially misuse Actions secrets, so review changes before merging.

## Test before sharing

1. Push the updated source to `main`; **Test Android build** should run automatically under **Actions**. This checks that Android can compile.
2. In **Actions → Build signed APK → Run workflow**, select `main` and run it. Download the `signed-apk-for-testing` artifact from the completed run and unzip it.
3. Install `Second-Thought-Spending.apk` on an Android phone. Try entering a purchase, using a short custom cooldown, skipping and buying items, and exporting data. To test the optional shopping-app pause, select an app, read and accept the disclosure, enable Accessibility in Android settings, and verify temporary access and the off switch.

Actions artifacts are for **your tests**. Public visitors should download the APK from **Releases**, where downloads do not require opening a build log or unpacking an artifact.

## Publish a new version

1. Increase both `versionCode` and `versionName` in `android/app/build.gradle`. Keep `versionName` aligned with `package.json`'s version. For example, `versionCode 2` and `versionName "1.0.1"`.
2. Commit and push that change to `main`. Run the signed test workflow and try installing it **over the previous signed APK** to confirm the update keeps local data.
3. From the new commit on `main`, push a matching version tag. For example:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

   For the first release, the included project starts at `versionCode 1` / `versionName "1.0.0"`; after testing you can tag `v1.0.0` without changing those values.

4. Watch **Actions → Build signed APK**. On success it publishes a GitHub Release automatically with `Second-Thought-Spending.apk` and its checksum. The README's **Download the latest APK** link points at this release. If the job fails, no new public release is created; inspect the failed step before retrying.

Only push a release tag after you approve that version for public download. Android updates are **manual**: visitors install the latest APK over their current signed release. Do not use a debug APK as a public release.

## Make the repository public

Once the release is ready, open **Settings → General → Danger Zone → Change repository visibility → Public**. Check that the published README download link works without signing in. A public repository makes the source visible; its [license](../LICENSE.md) still controls reuse and redistribution. If you intend to grant open-source rights, choose and apply a suitable license separately.

Before publishing the first public APK, check the [current Android developer verification guidance](https://developer.android.com/developer-verification/) for distribution outside an app store. Requirements and installation prompts can change by country and Android version.
