# KisanMandi

**Know your mandi. Find your buyer.** A Flutter app for Sindh farmers and buyers, built by **CTRL + ALT + G3** for [HacktoberFest issue #11](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/11).

The app implements all six challenge milestones with an HTTP mock API. All crop prices, profiles and seed phone numbers are fictional. The interface pairs indigo, saffron and warm ivory with offline bundled Fraunces and Manrope fonts. An Ajrak-inspired rosette, vector crop illustrations, a live market pulse and history sparklines give it a consistent identity across all screens. There is no hosted price service or account setup to purchase.

## Interface

- **Indigo / saffron / ivory**, with rust actions and restrained teal for rising prices.
- **Fraunces** display typography and **Manrope** controls and tabular prices, all bundled locally.
- An Ajrak-inspired eight-point rosette, original vector field artwork and matching Android, iOS, Windows and web icons.
- A market pulse computed from the selected market’s actual mock prices; crop rows show real 14-day sparklines where space permits.
- The same simple navigation, role permissions, API flow and milestone features, with layouts checked at 320 px, 390 px, 900 px and larger system text.

[Prices](docs/screenshots/prices.png) · [Marketplace](docs/screenshots/marketplace.png) · [Alerts](docs/screenshots/alerts.png) · [Crop report](docs/screenshots/crop-detail.png) · [Profit](docs/screenshots/profit.png) · [Welcome](docs/screenshots/onboarding.png)

When updating an existing checkout, run `flutter pub get`, then stop and restart `flutter run` to pick up the new bundled fonts and launcher assets.

## Run in two terminals

Requirements: **Flutter 3.35.7 or later with Dart 3.9+**, Python **3.10+**, and an Android emulator/phone. Windows desktop and iOS runner sources are also included; iOS requires macOS and Xcode. The optional web runner is Flutter-rendered.

Open this project folder: `submission/ctrl-alt-g3/kisanmandi`.

**Terminal 1 — mock API:**

```bash
python mock_api/server.py --host 0.0.0.0 --port 8080
```

On Windows, use `py -3` instead of `python` if needed. The server uses Python’s standard library, generates its seed on first run and persists mutations automatically. Leave this terminal running.

**Terminal 2 — Flutter:**

```bash
flutter pub get
flutter run
```

Android emulator connects to `http://10.0.2.2:8080` by default. Windows desktop, iOS simulator and the optional web runner default to `http://127.0.0.1:8080`.

For a **physical Android phone or iPhone**, connect the phone and computer to the same Wi-Fi, allow Python through the computer’s local firewall, and use the computer’s LAN IP:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8080
```

Replace the example IP. You can also change the address with the connection icon on first launch or **avatar → API connection**. A saved address takes precedence over the default on later launches. Allow the local-network permission on iOS. HTTP allowances are included for this local mock server.

On first launch, enter a fictional name and phone, choose district and Farmer/Buyer, or choose **Explore as a demo farmer/buyer** and select a seeded profile. The selected profile survives restarts; **avatar → Change profile** returns to onboarding.

## Milestone coverage

| Milestone | Implemented behavior |
|---|---|
| 1. Roles & price discovery | First-launch profile, farmer’s four tabs/buyer’s two, market selector, crop search/category filter, daily amount and percentage changes, pull-to-refresh |
| 2. Trends & comparison | 14-day chart with dated axis, minimum/maximum/average, markets sorted highest first and best selling market highlighted |
| 3. Alerts | Crop/market/Above/Below/target create and edit, inclusive thresholds, active toggle, delete, refresh re-evaluation and matching-rule badge |
| 4. Marketplace | Validated positive quantity/price, district/grade/date/contact, crop/district/grade filters, newest/price sort, ±5% market labels, Call/WhatsApp, owner-only edit/Sold/delete enforced by API |
| 5. Profit | Crop/market selection, maund-based quantity and cost, revenue/total cost/profit or loss/revenue-based margin, −20%…+20% price slider |
| 6. Seeded API | Six required HTTP collections; 8 crops, 4 categories, 3 districts/markets, 336 prices, 6 users, 12 listings and 5 alerts |

All application records come from HTTP. Local preferences contain only connection/session settings. Prices and production costs use **PKR per 40 kg maund**, quantity uses **maunds**. Seeded contact numbers are deliberately non-working.

## Verify

```bash
python -m unittest discover -s mock_api -v
flutter analyze
flutter test
```

The Python tests exercise the real HTTP server, not a fake repository. Flutter tests cover role navigation, refresh/badge updates, search, chart rendering/comparison order, the calculator, form validation, ownership controls, and 320 px layouts. Pure Dart tests check ±5% boundaries and profit/loss calculations.

With the API running, also run the actual Dart HTTP-client walkthrough:

```bash
dart run tool/smoke_api.dart http://127.0.0.1:8080
```

To regenerate phone screenshots from Flutter widget tests:

```bash
flutter test --dart-define=SCREENSHOTS=true test/app_test.dart
```

See [the judging walkthrough](docs/DEMO.md), [API contract](docs/API.md), and [validation record](docs/VALIDATION.md).

## Project structure

- `lib/data` — HTTP client, session restoration and refresh coordinator.
- `lib/domain` — typed records, consistent units and financial calculations.
- `lib/ui` — theme, reusable Flutter widgets, vector art and feature screens.
- `mock_api` — seeded, persistent HTTP API and ownership/validation tests.
- `test` — Flutter widget and domain tests.
- `tool/smoke_api.dart` — real API walkthrough using the same Dart client as the app.
- `android`, `ios`, `windows`, `web` — Flutter platform runners.

## Demo scope

This is a local hackathon simulator. Demo profile selection is intentional; password/OTP authentication, real market feeds, push notifications, payment processing and trades are outside the issue’s scope. Alerts are evaluated in-app on refresh. The local API is not deployed publicly. Native installer builds and real-device contact handlers require the corresponding platform toolchain/device.

The seed date follows the API computer’s date; a later refresh rolls prices forward to retain 14 consecutive days. Existing price values carry forward until the simulator is reset. To reset, stop the server, delete `mock_api/data/db.json`, restart, then choose a profile again.

## Team

Muhammad Kahaf — 25SW043 · Muhammad Haseeb — 25SW079 · Muhammad Waris — 25SW141.

Packages: [http](https://pub.dev/packages/http), [shared_preferences](https://pub.dev/packages/shared_preferences), [url_launcher](https://pub.dev/packages/url_launcher). Networking follows the [Flutter networking cookbook](https://docs.flutter.dev/cookbook/networking). Fraunces and Manrope are distributed under the SIL Open Font License; both licenses are included in `assets/fonts`. Static font instances are generated from the Google Fonts variable sources (Fraunces optical size 72, softness 30).
