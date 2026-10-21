# Three-minute judging walkthrough

1. Start the mock API and the Flutter app using the README. First launch collects name, phone, district and Farmer/Buyer. Choose **Explore as a demo farmer → Mehran Demo** for the seeded walkthrough.
2. **Prices:** switch Hyderabad → Sukkur, search Wheat and filter Grains. Pull to refresh. Every crop row shows amount and percentage change from yesterday.
3. Tap **Wheat:** inspect the 14-day chart and minimum/average/maximum. The comparison ranks all three markets by highest price and highlights the best place to sell.
4. Tap **Set a price alert:** choose At or above and set the target exactly equal to the displayed latest rate. Save. The Alerts tab badge increments. Edit it to an unreachable target and refresh; it stops matching. Test Below at equality, pause, reactivate and delete.
5. **Marketplace:** filter crop, district and grade, then sort by lowest price. Open a listing to inspect the market label. Call and WhatsApp open external contact handlers with a fictional number; cancel before attempting a real call or message.
6. **My listings:** add a listing with tomorrow’s availability and positive quantity/price. First try quantity 0 to show validation. Edit the listing, mark it Sold (it disappears from the public Active feed but remains in My listings), then delete it.
7. Open another farmer’s listing. Management controls are absent. The API tests additionally prove that a forged request using another farmer’s valid session returns 403.
8. **Prices → calculator:** enter quantity and production cost per maund, then drag the what-if slider to −20% and +20%. Revenue, total cost, profit/loss and revenue-based margin update together.
9. Avatar → **Change profile**. Select Buyer and **Explore as a demo buyer**. Only Prices and Marketplace remain. Posting and listing management controls are absent; the server also rejects buyer mutations.

## Expected seed

| Collection | Count |
|---|---:|
| users | 6 (4 farmers, 2 buyers) |
| crops | 8, spanning 4 categories |
| markets | 3, in different Sindh districts |
| prices | 336 = 8 × 3 × 14 |
| listings | 12 |
| alerts | 5, distributed across farmer owners |

Reset the API database to return to these counts after a demonstration. The API uses fictional names, non-working `+92000000000…` contact numbers and deterministic prices. New records are persisted over HTTP.
