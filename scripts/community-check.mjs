import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(projectRoot, file), 'utf8');
const packageJson = JSON.parse(read('package.json'));
const gradle = read('android/app/build.gradle');
const config = read('src/config/communityConfig.js');
const problems = [];
const notes = [];

if (!gradle.includes(`versionName "${packageJson.version}"`)) {
  problems.push('package.json and Android versionName do not match.');
}
if (!config.includes(`version: '${packageJson.version}'`)) {
  problems.push('package.json and communityConfig.js versions do not match.');
}
if (config.includes("supportEmail: ''")) {
  notes.push('Support email is empty; the app will show the community-support placeholder.');
}
if (config.includes("projectUrl: ''")) {
  notes.push('Project URL is empty; the in-app project link will stay hidden.');
}
if (config.includes("privacyNoticeUrl: ''")) {
  notes.push('Hosted privacy notice URL is empty; the app will show its bundled privacy summary.');
}
if (config.includes("donationUrl: ''")) {
  notes.push('Donation URL is empty; the in-app support page will show its setup note.');
}

const donationUrlMatch = config.match(/donationUrl:\s*'([^']*)'/);
if (donationUrlMatch?.[1] && !donationUrlMatch[1].startsWith('https://')) {
  problems.push('Donation URL must use https://.');
}

const supportEmailMatch = config.match(/supportEmail:\s*'([^']*)'/);
if (supportEmailMatch?.[1] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmailMatch[1])) {
  problems.push('Support email is not formatted like an email address.');
}

if (problems.length > 0) {
  console.error('Community build check failed:\n');
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log('Community build check passed.');
notes.forEach((note) => console.log(`• ${note}`));
