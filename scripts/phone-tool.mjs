import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidRoot = path.join(projectRoot, 'android');
const mode = process.argv[2] ?? 'doctor';
const isWindows = platform() === 'win32';
const executable = (name) => (isWindows ? `${name}.exe` : name);

function heading(message) {
  console.log(`\n🌿 ${message}`);
}

function fail(message, details = []) {
  console.error(`\n✖ ${message}`);
  details.forEach((detail) => console.error(`  ${detail}`));
  process.exit(1);
}

function commandWorks(command, args = [], env = process.env) {
  const result = spawnSync(command, args, {
    env,
    stdio: 'ignore',
    shell: isWindows && /\.(?:cmd|bat)$/i.test(command),
  });
  return result.status === 0;
}

function run(command, args, options = {}) {
  const shown = [command, ...args].join(' ');
  console.log(`  $ ${shown}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    env: options.env ?? process.env,
    stdio: 'inherit',
    shell: isWindows && /\.(?:cmd|bat)$/i.test(command),
  });
  if (result.error || result.status !== 0) {
    fail(`Command failed: ${shown}`);
  }
}

function javaHomeCandidates() {
  const candidates = [process.env.JAVA_HOME];
  if (platform() === 'darwin') {
    candidates.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home');
  } else if (isWindows) {
    candidates.push('C:\\Program Files\\Android\\Android Studio\\jbr');
  } else {
    candidates.push('/opt/android-studio/jbr', path.join(homedir(), 'android-studio', 'jbr'));
  }
  return candidates.filter(Boolean);
}

function resolveJavaEnv() {
  for (const candidate of javaHomeCandidates()) {
    const javaPath = path.join(candidate, 'bin', executable('java'));
    if (existsSync(javaPath) && commandWorks(javaPath, ['-version'])) {
      return {
        ...process.env,
        JAVA_HOME: candidate,
        PATH: `${path.join(candidate, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`,
      };
    }
  }

  if (commandWorks(executable('java'), ['-version'])) return process.env;
  fail('Java was not found.', [
    'Install Android Studio, then reopen your terminal.',
    'Or set JAVA_HOME to Android Studio’s bundled jbr directory.',
  ]);
}

function sdkCandidates() {
  const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT];
  if (platform() === 'darwin') {
    candidates.push(path.join(homedir(), 'Library', 'Android', 'sdk'));
  } else if (isWindows && process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
  } else {
    candidates.push(path.join(homedir(), 'Android', 'Sdk'));
  }
  return candidates.filter(Boolean);
}

function findAdb() {
  for (const sdkRoot of sdkCandidates()) {
    const adbPath = path.join(sdkRoot, 'platform-tools', executable('adb'));
    if (existsSync(adbPath)) return { adbPath, sdkRoot };
  }
  if (commandWorks(executable('adb'), ['version'])) {
    return { adbPath: executable('adb'), sdkRoot: null };
  }
  return { adbPath: null, sdkRoot: null };
}

function connectedDevices(adbPath) {
  const result = spawnSync(adbPath, ['devices'], { encoding: 'utf8', shell: false });
  if (result.status !== 0) return [];
  return result.stdout
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length >= 2)
    .map(([serial, state]) => ({ serial, state }));
}

function diagnostics({ requireDevice }) {
  heading('Checking your Android setup');
  if (!commandWorks(executable('node'), ['--version'])) fail('Node.js was not found. Install Node.js 22 or newer.');
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 22) fail(`Node.js ${process.versions.node} is too old. Install Node.js 22 or newer.`);
  console.log(`  ✓ Node.js ${process.versions.node} is ready`);

  if (!commandWorks(isWindows ? 'npm.cmd' : 'npm', ['--version'])) fail('npm was not found.');
  console.log('  ✓ npm is ready');

  const javaEnv = resolveJavaEnv();
  console.log(`  ✓ Java is ready${javaEnv.JAVA_HOME ? ` (${javaEnv.JAVA_HOME})` : ''}`);

  const { adbPath, sdkRoot } = findAdb();
  if (!adbPath) {
    fail('Android platform tools were not found.', [
      'Open Android Studio → SDK Manager → SDK Tools.',
      'Install Android SDK Platform-Tools, then reopen this terminal.',
    ]);
  }
  console.log(`  ✓ Android platform tools are ready${sdkRoot ? ` (${sdkRoot})` : ''}`);

  if (sdkRoot && !existsSync(path.join(sdkRoot, 'platforms', 'android-36', 'android.jar'))) {
    fail('Android SDK Platform 36 is not installed.', [
      'Open Android Studio → SDK Manager → SDK Platforms.',
      'Install Android API 36, accept the licenses, and rerun this command.',
    ]);
  }

  const devices = connectedDevices(adbPath);
  const readyDevices = devices.filter(({ state }) => state === 'device');
  const unauthorized = devices.filter(({ state }) => state === 'unauthorized');

  if (readyDevices.length > 0) {
    console.log(`  ✓ Phone connected (${readyDevices.map(({ serial }) => serial).join(', ')})`);
    if (requireDevice && readyDevices.length > 1 && !process.env.ANDROID_SERIAL) {
      fail('More than one Android device is connected.', [
        'Disconnect the extras, or set ANDROID_SERIAL to the device you intend to use.',
      ]);
    }
  } else if (unauthorized.length > 0) {
    fail('Your phone is connected but has not authorized this computer.', [
      'Unlock the phone and accept the USB debugging prompt.',
      'Then run npm run phone:doctor again.',
    ]);
  } else if (requireDevice) {
    fail('No Android phone is connected.', [
      'Enable Developer options and USB debugging on the phone.',
      'Connect it with a data-capable USB cable and accept the prompt.',
    ]);
  } else {
    console.log('  • No phone connected (fine for building an APK)');
  }

  const buildEnv = sdkRoot
    ? { ...javaEnv, ANDROID_HOME: sdkRoot, ANDROID_SDK_ROOT: sdkRoot }
    : javaEnv;
  return { adbPath, javaEnv: buildEnv };
}

function buildApk(javaEnv) {
  heading('Building Second Thought: Spending');
  run(isWindows ? 'npm.cmd' : 'npm', ['run', 'android:sync'], { env: javaEnv });

  const gradleWrapper = path.join(androidRoot, isWindows ? 'gradlew.bat' : 'gradlew');
  if (!isWindows) run('chmod', ['+x', gradleWrapper]);
  run(gradleWrapper, ['assembleDebug', '--no-daemon'], { cwd: androidRoot, env: javaEnv });

  const sourceApk = path.join(androidRoot, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!existsSync(sourceApk)) fail('Gradle finished, but the APK could not be found.');

  const artifactDirectory = path.join(projectRoot, 'artifacts');
  const friendlyApk = path.join(artifactDirectory, 'Second-Thought-Spending-debug.apk');
  mkdirSync(artifactDirectory, { recursive: true });
  copyFileSync(sourceApk, friendlyApk);
  console.log(`  ✓ APK ready: ${path.relative(projectRoot, friendlyApk)}`);
  return friendlyApk;
}

if (!['doctor', 'apk', 'install'].includes(mode)) {
  fail(`Unknown mode “${mode}”. Use doctor, apk, or install.`);
}

const tools = diagnostics({ requireDevice: mode === 'install' || mode === 'doctor' });
if (mode === 'doctor') {
  console.log('\n✨ Everything needed for the next step is ready.');
  process.exit(0);
}

const apkPath = buildApk(tools.javaEnv);
if (mode === 'apk') {
  console.log('\n✓ Debug build complete. Install this APK on your phone to test it.');
  process.exit(0);
}

heading('Installing Second Thought: Spending on your phone');
const installResult = spawnSync(tools.adbPath, ['install', '-r', apkPath], {
  encoding: 'utf8',
  shell: false,
});
if (installResult.status !== 0) {
  const output = `${installResult.stdout ?? ''}\n${installResult.stderr ?? ''}`;
  if (output.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
    fail('Android found an older copy signed by a different developer key.', [
      'Uninstalling would erase that copy’s local purchase information.',
      'Export any data you want to keep in the app’s Settings before uninstalling.',
      'Then uninstall the older build manually and rerun this command.',
    ]);
  }
  console.error(output.trim());
  fail('Android could not install the APK.');
}
console.log('  ✓ Installed without clearing existing app data');
run(tools.adbPath, ['shell', 'monkey', '-p', 'com.secondthought.spending', '-c', 'android.intent.category.LAUNCHER', '1']);
console.log('\n✓ Second Thought: Spending should now be open on your phone.');
