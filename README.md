# Second Thought: Spending

**One pause between impulse and purchase.** A free Android app that gives you time to think before buying something.

**Installing your own build from Terminal?** Jump to [the same phone-install command used by Second Thought](#install-from-terminal). You do not need a GitHub Release for that.

## Download for Android

### [⬇ Download the latest APK](../../releases/latest/download/Second-Thought-Spending.apk)

No account, subscription, ads, or bank connection. **Android 7.0 or newer** is required. An iPhone version is not available.

1. Open the download link **on your Android phone** and download `Second-Thought-Spending.apk`.
2. Open the downloaded file. If Android asks, allow installs from the browser or file manager you used, then tap **Install**. The wording varies by phone because this download comes directly from GitHub.
3. Open **Second Thought: Spending**. Tap **I want to buy something** to try your first pause. No special permission is needed for that.

You can also [see the latest release and its notes](../../releases/latest). **Download the APK under Assets**; the automatic “Source code” downloads are for developers and cannot be installed as an app. The download link will work once the first release has been published.

## What you can do

- Write down a purchase, its price, and what prompted it; answer a few questions before deciding.
- Let it wait **3, 12, 24, or 48 hours**, or set a custom time in minutes.
- Skip it, buy it, wait longer, or note a cheaper alternative. Buying something does not erase the progress you already made.
- Grow your plant, track pauses and streaks, and put *estimated money protected* toward a goal. This number is **not money moved into a savings account**.
- Optionally put a pause in front of shopping apps you choose. You can open them temporarily or turn protection off whenever you want.

Your purchase notes stay on your device. The app has no login, tracking, or cloud sync. You can export or delete your information in **Settings**. [Read the privacy policy](docs/privacy-policy.html).

## Common questions

**Do I have to enable Accessibility?** No. The purchase pause, waiting list, goals, and history work without it. If you turn on protection for selected shopping apps, the app explains the optional permission before taking you to Android settings.

**Android says “Restricted setting” when I try to protect apps.** This can happen with apps installed from a downloaded APK. If you trust this download and still want that optional feature, open **Android Settings → Apps → Second Thought: Spending → ⋮ → Allow restricted settings**, then try enabling the service again. [Android's help page](https://support.google.com/android/answer/12623953) explains the steps. You can always use the manual pause without enabling it.

**How do I update?** Download the newest APK from this page and install it over the existing release. Updates are manual. As long as both APKs use the same signing key, Android keeps your app data. If you installed an earlier **test** APK from Actions, its signing key may differ. Export your data in Settings before uninstalling the test build; uninstalling erases local data.

**Where can I report a problem?** Check [installation and issue guidance](SUPPORT.md). Please use made-up purchase details in public issues.

## Install from Terminal

**Putting it on your own phone, like the original Second Thought?** With Node.js 22+, Android Studio and its SDK installed, connect your Android phone with USB debugging enabled. From this project folder, run:

```bash
npm ci
npm run phone:doctor
npm run phone:install
```

`phone:install` builds the debug APK, installs it on your connected phone, and opens the app. **No GitHub Release or signing-key setup is needed for this personal test.** To build an APK without a connected phone, run `npm run phone:apk`; find it in `artifacts/Second-Thought-Spending-debug.apk`.

For a browser preview, run `npm run dev`. Shopping-app protection only works in the Android app. Read [CONTRIBUTING.md](CONTRIBUTING.md) to work on the source and [the optional public-download guide](docs/RELEASING.md) when you are ready to share an APK that visitors can install without a computer. The [license](LICENSE.md) permits viewing and personal evaluation; making this repository public does not change its distribution terms.
