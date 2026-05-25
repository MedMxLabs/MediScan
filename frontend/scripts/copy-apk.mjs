import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, '..', 'mobile', 'build', 'app', 'outputs', 'flutter-apk', 'app-release.apk');
const destDir = join(root, 'public', 'downloads');
const dest = join(destDir, 'medmx-android.apk');

if (!existsSync(source)) {
  console.error(
    'Release APK not found. Build it first:\n' +
      '  cd ../mobile\n' +
      '  flutter build apk --release --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net\n' +
      'Then run: npm run copy:apk',
  );
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);
console.log(`Copied APK to ${dest}`);
