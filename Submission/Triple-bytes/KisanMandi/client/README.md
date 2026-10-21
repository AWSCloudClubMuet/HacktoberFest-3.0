# KisanMandi frontend

Complete React/Vite frontend. The implementation preserves the supplied prototype's typography, green/cream palette, imagery, cards, tables and responsive behavior while replacing its demo data with the Express API contract.

## Features

- English/Urdu interface with RTL layout and saved language
- Onboarding and phone-based profile creation/login
- Saved user role and role-aware navigation
- Latest prices, market selection, crop search and category filter
- Mobile pull-to-refresh and manual refresh
- 14-day crop chart, statistics and best-market comparison
- Public marketplace browsing, filtering and sorting
- Listing details with Call and WhatsApp links
- Farmer price-alert creation, editing, toggling and deletion
- Triggered-alert badge based on the latest price
- Farmer listing creation, editing, Sold status and deletion
- Profit calculator with a −20% to +20% price slider
- Loading, empty and API-error states

See `PHASES.md` for the delivery breakdown.

## Later setup

When testing begins, copy `.env.example` to `.env`, point `VITE_API_URL` at the Express backend, install dependencies and run the Vite development command. Runtime testing is intentionally deferred until the final testing stage.
