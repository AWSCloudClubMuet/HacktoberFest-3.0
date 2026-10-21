# KisanMandi — Crop Prices & Produce Marketplace

**Helping farmers in Sindh access market prices, connect with buyers, and make better selling decisions.**

KisanMandi is a cross-platform mobile and web application built with **Flutter and Firebase**. It helps farmers explore daily wholesale crop prices, view 14-day price trends, set price alerts, sell produce directly to buyers, and estimate profits using an interactive calculator.

## Features

- **Crop Prices:** View daily wholesale prices across markets in Sindh.
- **Price Trends:** Explore 14-day price history and compare markets.
- **Price Alerts:** Set target prices and monitor price changes.
- **Produce Marketplace:** Browse and post produce listings.
- **Direct Contact:** Contact buyers and sellers through phone or WhatsApp.
- **Profit Calculator:** Estimate profits using different price scenarios.
- **Role-Based Navigation:** Separate experiences for farmers and buyers.

## Tech Stack

- **Frontend:** Flutter and Dart
- **Backend & Database:** Firebase Cloud Firestore
- **State Management:** Provider
- **Charts:** `fl_chart`
- **Local Storage:** SharedPreferences
- **Contact Integration:** `url_launcher`
- **UI & Fonts:** Material 3 and `google_fonts`

## Project Structure

```text
lib/
├── models/
│   ├── app_user.dart
│   ├── crop.dart
│   ├── market.dart
│   ├── price.dart
│   ├── listing.dart
│   └── price_alert.dart
├── services/
│   ├── auth_service.dart
│   ├── firestore_service.dart
│   └── data_seeder_service.dart
├── providers/
│   └── app_state.dart
└── screens/
    ├── onboarding_screen.dart
    ├── main_navigation.dart
    ├── prices_screen.dart
    ├── crop_detail_screen.dart
    ├── alerts_screen.dart
    ├── marketplace_screen.dart
    ├── my_listings_screen.dart
    └── profit_calculator_screen.dart
```

## Database Structure

KisanMandi uses six Firestore collections:

| Collection | Purpose |
|---|---|
| `users` | User profiles, roles, and contact details |
| `crops` | Crop names and categories |
| `markets` | Wholesale markets and districts |
| `prices` | Daily crop prices and historical records |
| `listings` | Produce offered for sale |
| `alerts` | User-defined price alert rules |

Crop prices are recorded per 40 kg (one maund).

## Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [FlutterFire CLI](https://firebase.google.com/docs/flutter/setup)
- Android Studio, an Android emulator, or Chrome

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/kisan_mandi.git
cd kisan_mandi
```

Replace `your-username` with your GitHub username and adjust the repository name if needed.

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Configure Firebase

Log in to Firebase and configure your Flutter project:

```bash
firebase login
flutterfire configure
```

Make sure Firebase is configured for your target platforms and that Cloud Firestore is enabled in the Firebase Console.

**Security note:** Do not use open read/write Firestore rules in production. Configure rules to authenticate users and restrict access to authorized data.

### 4. Run the Application

Run on Chrome:

```bash
flutter run -d chrome
```

Run on a connected Android device or emulator:

```bash
flutter run
```

## Data Seeding

On first launch, the `DataSeederService` is designed to populate an empty database with sample data, including crops, markets, historical prices, users, marketplace listings, and price alerts.

The sample dataset is intended to help with development and testing.

## Testing

Run static analysis:

```bash
flutter analyze
```

Run tests:

```bash
flutter test
```

Build the web application for production:

```bash
flutter build web --release
```

## Screenshots

Add screenshots of your application below to help visitors understand its interface.

| Crop Prices & Trends | Produce Marketplace | Profit Calculator |
|---|---|---|
| Add screenshot | Add screenshot | Add screenshot |

## Project Goal

KisanMandi aims to improve market transparency for farmers in Sindh by making crop price information, direct buyer connections, and basic financial planning tools accessible through a single application.

## License

Add a license to this repository if you intend to distribute or reuse the project publicly.
