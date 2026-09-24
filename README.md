# Second Thought: Spending

**One pause between impulse and purchase.** A free, private Android app for reflecting on purchases, cooling them off, and protecting money you choose not to spend. This is a separate copy of Second Thought for its own repository; the original recovery app remains unchanged.

## Features

- Manual purchase pause with five editable reflection questions, details, mood, category, and optional link.
- Cooling periods of 3 hours, 12 hours, 24 hours, 48 hours, or custom minutes; review, skip, purchase, extend, or note a cheaper alternative at any time.
- Locally stored savings goals, estimated money protected, streak, milestones, history, categories, and triggers.
- Optional Android shopping-app protection using an accessibility service that checks the opening app's package name. It never requests screen-content access. Its screen allows leaving, adding an item, or opening temporarily. Manual use needs no accessibility access.
- Optional cooldown notifications, JSON export, and full local reset. No account, bank connection, analytics, ads, trial, or paywall.

**Money protected is an estimate, not a transfer or account balance.** Purchases are recorded without erasing the number of pauses or earned milestones. The no-impulse-buy streak starts again only after an impulse purchase.

## Install the debug APK

1. In the spending repository, open **Actions → Spending Android debug APK → latest successful run**.
2. Download the `second-thought-spending-debug-apk` artifact and unzip it.
3. Copy `app-debug.apk` to the Android phone, open it, and permit installation from that source when Android asks. The package ID is `com.secondthought.spending`, so it can coexist with `com.secondthought.app`.
4. For app protection, select apps in **Settings → Protected apps**, turn protection on, read the explanation, and enable **Second Thought: Spending protection** in Android Accessibility settings. It is optional. Turn protection off in the app or Android settings at any time.

## Development

Requires Node 22, JDK 21, Android SDK API 36, and Android build tools. Run `npm ci`, `npm run android:sync`, and `cd android && ./gradlew assembleDebug`. The debug APK appears at `android/app/build/outputs/apk/debug/app-debug.apk`. Run `npm run dev` for manual web mode.

All purchase data is local to the device in Capacitor Preferences. Export with **Settings → Export local data**. There is no server.
