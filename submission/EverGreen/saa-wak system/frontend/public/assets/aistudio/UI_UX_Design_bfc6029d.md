# KisanMandi — UI/UX Design Specification

**Version:** 1.0  
**Design principle:** Clear, trustworthy, farmer-friendly, mobile-first  
**Primary audience:** Farmers and produce buyers in Sindh, Pakistan

## 1. Experience goals

- Make the current crop price understandable within a few seconds.
- Keep actions obvious and touch-friendly.
- Present demo data honestly; trust is more important than visual polish.
- Use plain English labels, with room to add Sindhi/Urdu localization later.
- Keep the interface lightweight for mobile devices and inconsistent connectivity.

## 2. Visual direction

### Palette

- **Primary green:** `#176B45` — primary actions and selected navigation.
- **Deep green:** `#104B33` — headings and high-emphasis elements.
- **Warm background:** `#F7F8F2` — page background.
- **Surface:** `#FFFFFF` — cards and forms.
- **Text:** `#1F2933` — primary text.
- **Muted text:** `#667085` — supporting information.
- **Border:** `#E4E7EC` — card and input borders.
- **Success:** `#1B7F4B`.
- **Warning:** `#A15C07`.
- **Danger:** `#B42318`.

Use color semantically, not decoratively. Every price movement must also have an arrow/icon and text or signed value; do not rely on color alone.

### Typography and spacing

- Use a highly legible sans-serif font such as Inter or system UI.
- Page title: 24–30 px desktop, 22–26 px mobile.
- Section title: 18–20 px.
- Body: 14–16 px; form labels at least 14 px.
- Use a consistent 4/8 px spacing rhythm.
- Card radius 12–16 px; input/button height about 44–48 px.
- Keep paragraphs short and use explicit labels for prices and units.

## 3. Information architecture

Primary navigation:
1. **Prices**
2. **Marketplace**
3. **Insights**
4. **Alerts** (Farmer only)
5. **My Listings** (Farmer only)

Desktop: left sidebar or compact top navigation plus top bar.  
Mobile: bottom navigation with 4–5 items; keep primary action reachable and avoid horizontal overflow.

Global elements:
- KisanMandi logo/wordmark.
- Current demo role/profile control.
- Persistent **“Sample demo prices — not live market data”** banner or label.
- Refresh action with last-refreshed time where practical.
- Consistent loading, empty, error, and retry patterns.

## 4. Screen specifications

### Screen A — Role onboarding

**Purpose:** Start the demo without implying secure login.

Components:
- Brand mark and short promise: “Compare crop prices. Plan your sale.”
- Two large selectable cards: Farmer and Buyer.
- Continue button.
- Small disclosure: “Demo experience using fictional sample data.”
- Optional seeded demo-profile selector after role selection.

Acceptance:
- Clear focus and selected states.
- Role determines available navigation/actions.
- Do not ask for a real password.

### Screen B — Prices dashboard

**Top section**
- Greeting or neutral page title: “Today’s crop prices”.
- Demo-data label.
- Market selector.
- Refresh button.

**Featured price card**
- Crop name and category.
- Large price in PKR with explicit unit.
- Daily change amount and percentage.
- Market and date.
- Up/down/unchanged indicator.

**Supporting content**
- Horizontal crop selector or searchable crop dropdown.
- Price cards/list rows for other crops.
- “Compare markets” entry point.
- Empty/error states when prices are unavailable.

Mobile layout:
- One-column cards.
- Keep price and daily movement visible without scrolling inside a card.
- Avoid wide data tables; use stacked rows/cards.

### Screen C — Crop insights

Components:
- Crop selector.
- Market multi-select or market comparison toggle.
- 14-day line chart.
- Legend with market names.
- Latest price, 14-day minimum, maximum, and period change.
- Best-price market label with caveat that transport and commission are excluded.
- “Create price alert” action for Farmers.

Chart UX:
- Responsive width.
- Date labels do not overlap.
- Tooltip displays date, market, price, and unit.
- Keep consistent y-axis units and currency.
- Missing records must be visibly missing, not silently interpolated as real data.

### Screen D — Marketplace

Components:
- Search field (“Search crops or listings”).
- Filters: crop, district/market, min/max asking price.
- Clear filters action and result count.
- Listing cards with crop, quantity/unit, grade, asking price, market/district, seller display name, posted date, availability.
- Market price badge: Below market / Near market / Above market / Comparison unavailable.
- Contact seller action using fictional demo contact data.

Farmer experience:
- Prominent “Add listing” button.
- Edit/delete actions only on the current farmer's own listing in the UI.
- Confirmation dialog before delete.
- Form validation and success/error feedback.

Buyer experience:
- Browse and filter listings.
- No edit/delete controls.
- Clear contact action; no in-app messaging is required.

### Screen E — Add/Edit listing form

Fields:
- Crop (required).
- Quantity (required, positive number).
- Unit (use crop's configured unit; avoid mismatches).
- Grade/quality (required or choose “Not specified”).
- Asking price per unit (required, non-negative).
- Market/district (required).
- Short description.
- Contact method (demo-safe only).
- Availability status.

UX:
- Inline validation near each field.
- Disable submit while saving.
- Preserve entered values on recoverable API error.
- Show a success toast or confirmation state.
- Explain that market-price badges are approximate comparisons.

### Screen F — Alerts

Components:
- Alert form: crop, market, condition Above/Below, target price, enabled toggle.
- Alert list showing target, condition, latest evaluated price, status, and last evaluated time if available.
- Delete action with confirmation.
- Empty state with “Create your first alert.”

Disclosure:
- Alerts are evaluated when data loads or refreshes in this demo; they are not guaranteed background notifications.

### Screen G — Profit calculator

Inputs:
- Crop (optional, for contextual display).
- Quantity.
- Expected selling price per unit.
- Cost per unit.
- Price scenario slider from -20% to +20%.

Outputs:
- Estimated revenue.
- Total cost.
- Profit or loss.
- Margin percentage.
- Scenario price and scenario profit.

UX:
- Keep inputs and results visible together on desktop; stack on mobile.
- Format PKR consistently.
- Do not show margin if revenue is zero; show “Not available”.
- Show a note that transport, commission, storage, and other unentered costs are excluded.

### Screen H — Loading, empty, and error states

- **Loading:** simple skeleton cards and “Loading prices…”.
- **Empty:** explain what is missing and offer a next action.
- **Error:** plain-language message, Retry button, and no fake success.
- **Mutation success:** confirmation message.
- **Delete:** confirmation dialog.
- **No market comparison:** neutral label, not an invented badge.

## 5. Responsive behaviour

- **Small mobile (360–390 px):** one column, bottom navigation, no wide tables, buttons at least 44 px tall.
- **Tablet:** two-column card layouts where useful.
- **Desktop:** sidebar + main content; charts can share a row with summary cards.
- Avoid nested scrolling panels for primary content.
- Test with long crop names, missing prices, and large PKR values.

## 6. Accessibility

- Use semantic headings and form labels.
- Ensure keyboard navigation and visible focus indicators.
- Buttons and icon-only actions require accessible names.
- Maintain readable contrast.
- Pair status colors with text/icons.
- Chart summaries must also be available as text.
- Do not use placeholder text as the only label.
- Confirm dialogs must have clear Cancel and Confirm actions.

## 7. Component inventory

- `AppShell`
- `RoleSwitcher`
- `DemoDataBanner`
- `MarketSelector`
- `CropSelector`
- `PriceCard`
- `DailyChangeIndicator`
- `PriceChart`
- `MarketComparisonPanel`
- `ListingCard`
- `ListingFilters`
- `ListingForm`
- `MarketPriceBadge`
- `AlertForm`
- `AlertCard`
- `ProfitCalculator`
- `LoadingSkeleton`
- `EmptyState`
- `ErrorState`
- `ConfirmDialog`
- `Toast`

## 8. UX acceptance checklist

- [ ] Main prices are visible quickly and have currency plus unit.
- [ ] Demo-data disclosure is visible.
- [ ] Farmer and Buyer experiences are visibly distinct.
- [ ] All forms have labels, validation, loading, and error feedback.
- [ ] Chart has legend, tooltip, date, unit, and text summary.
- [ ] Marketplace filters work together and can be cleared.
- [ ] Buyer cannot see listing management actions.
- [ ] Farmer sees management actions only for their demo-owned records.
- [ ] Alert timing limitations are disclosed.
- [ ] Calculator explains what costs are excluded.
- [ ] Layout works at 360 px width without horizontal overflow.
