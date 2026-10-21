# Assumptions

1. **Listings Extra Helper Field (`created_at`)**:
   - As specified in SPEC.md section 3, produce listings include an extra `created_at` field (ISO 8601 UTC datetime string) to enable sorting by newest on the Marketplace screen.

2. **Standardized Unit of Measure**:
   - To keep pricing and math consistent, all crop prices and produce asking prices are in PKR per 40 kg (1 maund). All quantities are in maunds. The UI displays the unit label as `Rs X,XXX / maund`.

3. **Deterministic Seed Generation**:
   - `server/seed.js` uses a seeded pseudo-random number generator (`mulberry32`) to produce consistent, reproducible data across runs.
   - Price generation runs for 14 consecutive days ending on the date of execution, guaranteeing no gaps and active price changes between yesterday and today.

4. **Listing Edit Availability Date Validation**:
   - As specified in SPEC.md section 8.1, the "not in past" date rule applies to newly created listings and only when the availability date is changed during an edit. If an existing listing originally had a past date, editing other fields (e.g. quantity or price) is not blocked.
