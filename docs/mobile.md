# Mobile (Flutter, Android)

Flutter 3.x (Dart ^3.11), Provider, go_router, dio, supabase_flutter, local notifications for reminder alarms. Android is the target. The other platform folders are kept but aren't tested.

The app talks to the same Flask API as the web app. For setup steps and screenshots see [mobile/README.md](../mobile/README.md).

## Layout

```
mobile/lib/
├── main.dart              Boot: Supabase init, notifications, providers, router
├── core/
│   ├── config.dart        dart-define values (API URL, API key, Supabase)
│   ├── api/api_client.dart  dio: base URL, API key, Bearer token, 401 → refresh → retry
│   ├── api/medscan_api.dart One method per endpoint + scrape-job polling (_getScraped)
│   ├── supabase_auth.dart Supabase sign-in → MedScan JWT exchange
│   ├── storage/           Token storage
│   ├── notifications/     Reminder alarms (scheduled notifications, vibration)
│   ├── theme.dart         Colours and type (Plus Jakarta Sans, bundled)
│   └── …                  errors, navigation helpers, local store
├── providers/             AuthProvider, SettingsProvider (language, theme)
├── router/app_router.dart Routes + auth redirect
├── features/<area>/       One folder per screen group (search, compare, prescription, reports,
│                          reminders, adherence, pharmacies, dashboard, history, profile, assistant…)
├── widgets/               Shared widgets
└── l10n/                  ARB files: en, hi, kn, mr, ta, te (+ generated Dart)
```

## Build config (`--dart-define`)

| Key | Default | What |
| --- | --- | --- |
| `API_BASE_URL` | `http://10.0.2.2:5000` | The emulator's address for your PC's localhost. Use your LAN IP on a real phone |
| `MEDSCAN_API_KEY` | empty | Client API key |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | empty | Optional. Fetched from `/api/auth/supabase/config` if blank |
| `SUPABASE_OAUTH_REDIRECT` | `com.medmxlabs.medscan://login-callback` | Must be in Supabase's redirect allow-list |

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000 --dart-define=MEDSCAN_API_KEY=<key>
flutter analyze
flutter test
flutter build apk --release --dart-define=API_BASE_URL=https://<api-host> --dart-define=MEDSCAN_API_KEY=<key>
```

## Release signing

`android/app/build.gradle.kts` reads `android/key.properties` (gitignored):

```properties
storePassword=…
keyPassword=…
keyAlias=upload
storeFile=C:/path/to/upload-keystore.jks
```

Without it, release builds fall back to the debug key. That's fine for sideloading, but you can't publish them to the Play Store.

## Notes

- **Translations.** Edit `lib/l10n/app_*.arb`, then run `flutter gen-l10n`. The generated files are committed, so CI doesn't need to run it.
- **Fonts** are bundled under `assets/google_fonts/` and runtime fetching is off, so the app works offline.
- **Background scrapes.** `MedScanApi._getScraped` does the same 202 polling as the web app. Screens don't change.
- **Reminders** are scheduled as local notifications on the device. The server also sends email/SMS if configured.
