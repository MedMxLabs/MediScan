import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apkDir = join(root, '..', 'mobile', 'build', 'app', 'outputs', 'flutter-apk');
const destDir = join(root, 'public', 'downloads');
const arm64 = join(apkDir, 'app-arm64-v8a-release.apk');
const armv7 = join(apkDir, 'app-armeabi-v7a-release.apk');

if (!existsSync(arm64)) {
  console.error(
    'Release APK not found. Build it first:\n' +
      '  cd ../mobile\n' +
      '  flutter build apk --release --split-per-abi --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net\n' +
      'Then run: npm run copy:apk',
  );
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
const dest = join(destDir, 'medmx-android.apk');
copyFileSync(arm64, dest);
console.log(`Copied APK to ${dest}`);

if (existsSync(armv7)) {
  const destV7 = join(destDir, 'medmx-android-armv7.apk');
  copyFileSync(armv7, destV7);
  console.log(`Copied APK to ${destV7}`);
}
