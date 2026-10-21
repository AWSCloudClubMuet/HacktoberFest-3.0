# Validation record

Validated on 21 October 2026 with Flutter **3.35.7**, Dart **3.9.2** and Python **3.12.14** on Linux.

| Check | Result |
|---|---|
| Python real HTTP API suite | 8 tests passed |
| Flutter domain + widget suite | 13 tests passed |
| Actual Dart HTTP client against real Python server | Passed |
| Flutter static analysis | No issues |
| Flutter release web compilation | Passed; `build/web` generated locally |
| 390 px rendered Prices, Marketplace, Alerts, crop detail, calculator | Inspected |
| 320 px onboarding, Prices, marketplace, alerts, crop/listing detail, calculator and alert form | Widget checks passed without overflow |
| 900 px feature screens and 390 px with 130% system text | Widget checks passed without overflow |
| Market pulse after market selection and refresh | Counts update from actual prices |

HTTP tests cover the seed matrix and categories, session creation/restoration, filtered price history, listing validation including non-finite values, owner-only updates and deletes, immutable owner fields, buyer restrictions, inclusive Above/Below thresholds, alert toggle/edit/delete, re-evaluation after a price change, persistence and error responses.

The separate Dart walkthrough uses the **same `Api` class as the app** and the real HTTP server. It checks all collections, the session response header, restored role, 14-day history, alert equality and pause, fractional-quantity listing creation, foreign-owner and buyer denials, Sold and cleanup.

Flutter tests cover farmer/buyer navigation, alert badge updates through mocked HTTP, refresh sequencing, crop search, market sorting, chart rendering, calculator validation, market-label boundaries, loss and margin calculations, listing validation, hidden foreign-owner controls and narrow phone layouts.

The screenshot harness loads the bundled Fraunces, Manrope and Material icon fonts. The chart explicitly fills its available width. Updated interface checks cover 320 px and 900 px feature screens, 130% system text, the new market pulse after a market change and refresh, and the existing milestone flows.

Native Android APK, Windows executable and iOS builds were **not run** in this Linux environment: their platform SDKs were unavailable. Call/WhatsApp handoff requires a real device or a configured platform handler and was not executed. Android/iOS HTTP and local-network configuration and the Windows runner are included for local testing. The release web build is an additional compilation check, not evidence of a native installer build.

Screenshots in `docs/screenshots` are real Flutter widget renders of the indigo/saffron redesign using test fixture data (390 px feature screens; 320 px onboarding). They can be regenerated with the README command; no visual design mockup tool is involved.
