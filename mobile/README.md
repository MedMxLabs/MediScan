# MedMx LABS — Flutter Mobile App

Cross-platform mobile client for the MedScan Flask API. Uses the same backend as the React web app — JWT auth, live pharmacy scraping, OCR uploads, reminders, adherence, lab reports, AI assistant, and nearby pharmacies.

## Prerequisites

- Flutter 3.11+ (`flutter doctor`)
- Running MedScan backend (local or Azure)

## Configure API URL

| Environment | Command |
|-------------|---------|
| **Android emulator** (backend on host) | Default `http://10.0.2.2:5000` — no config needed |
| **iOS simulator** (backend on host) | `flutter run --dart-define=API_BASE_URL=http://127.0.0.1:5000` |
| **Physical device** (same Wi‑Fi) | `flutter run --dart-define=API_BASE_URL=http://YOUR_PC_IP:5000` |

**Find YOUR_PC_IP (Windows):** `ipconfig` → use the **IPv4** on your Wi‑Fi adapter (e.g. `192.168.8.182`). Do **not** use an old Tailscale/VPN IP if it no longer responds.

**Verify backend from PC:** `curl http://127.0.0.1:5000/health` and `curl http://YOUR_PC_IP:5000/health` — both should return `{"status":"ok",...}` before testing on the phone.
| **Production (Azure)** | `flutter run --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net` |

Ensure backend `CORS_ORIGINS` allows mobile clients (or leave unset for `*`).

## Run

```bash
cd mobile
flutter pub get
flutter run
```

## Build release

```bash
# Android APK
flutter build apk --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net

# Android App Bundle
flutter build appbundle --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net

# iOS (macOS only)
flutter build ios --dart-define=API_BASE_URL=https://medscan-api.azurewebsites.net
```

## Features (same API as web)

| Screen | API |
|--------|-----|
| Login / Signup | `POST /api/auth/login`, `/register` |
| Dashboard | `GET /api/dashboard`, `/refill/alerts` |
| Search | `GET /api/search-medicine` |
| Compare | `GET /api/compare` |
| Upload prescription | `POST /api/upload-prescription` |
| History | `GET /api/history` |
| Reminders | `GET/POST/PATCH/DELETE /api/reminders/*` |
| Adherence | `GET /api/adherence`, `POST /api/adherence/mark-dose` |
| Lab reports | `POST /api/report-analysis` |
| AI assistant | `POST /api/chatbot` |
| Nearby pharmacies | `GET /api/pharmacies/nearby` |
| Profile | `GET/PATCH /api/profile/*` |

## Project structure

```
mobile/lib/
├── core/           # config, theme, API client, auth storage
├── providers/      # AuthProvider, AppServices
├── router/         # go_router navigation
├── features/       # screens by domain
└── widgets/        # shared UI
```

## Notes

- Medicine search/compare can take up to **2 minutes** (live Playwright scraping).
- Nearby pharmacies requires location permission.
- Prescription/lab upload uses file picker (images + PDF).
