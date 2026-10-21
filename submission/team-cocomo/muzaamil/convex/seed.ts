import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";

const TABLES = ["dispatches", "needs", "donations", "volunteers", "inventory", "camps"] as const;

/**
 * Seeds the spec's demo dataset: 8 camps in 7 districts (one Full, one Closed),
 * 12 items (3 low stock), 20 needs (5 critical gaps), 10 dispatches,
 * 10 donations and 15 volunteers.
 *
 * Stock values are what's left after the seeded Pending / In Transit
 * dispatches reserved theirs; fulfilled quantities already include the
 * seeded Delivered dispatches.
 *
 *   npx convex run seed:run               # only seeds an empty database
 *   npx convex run seed:run '{"reset":true}'
 */
export const run = internalMutation({
  args: { reset: v.optional(v.boolean()) },
  handler: async (ctx, { reset }) => {
    const existing = await ctx.db.query("camps").first();
    if (existing && !reset) return "Database already has data. Pass {\"reset\":true} to reseed.";
    if (reset) {
      for (const table of TABLES) {
        for (const row of await ctx.db.query(table).collect()) await ctx.db.delete(row._id);
      }
    }

    const camp = async (
      name: string,
      district: string,
      capacity: number,
      families: number,
      status: "Open" | "Full" | "Closed",
      lat: number,
      lng: number,
    ) =>
      ctx.db.insert("camps", { name, district, capacity, current_families: families, status, lat, lng });

    const ratodero = await camp("Ratodero Govt. School", "Larkana", 400, 312, "Open", 27.8, 68.29);
    const johi = await camp("Johi Relief Camp", "Dadu", 350, 280, "Open", 26.69, 67.61);
    const mehar = await camp("Mehar Community Hall", "Dadu", 300, 190, "Open", 27.18, 67.82);
    const sukkur = await camp("Sukkur Stadium Camp", "Sukkur", 500, 420, "Open", 27.7, 68.86);
    const khairpur = await camp("Khairpur Sugar Mill Grounds", "Khairpur", 360, 360, "Full", 27.53, 68.76);
    const jacobabad = await camp("Jacobabad Railway Colony", "Jacobabad", 320, 210, "Open", 28.28, 68.44);
    const hyderabad = await camp("Hyderabad Expo Centre", "Hyderabad", 600, 412, "Open", 25.39, 68.37);
    await camp("Thatta Coastal Camp", "Thatta", 250, 0, "Closed", 24.75, 67.92);

    type Cat = "Food" | "Water" | "Medical" | "Shelter" | "Hygiene";
    const item = (name: string, category: Cat, unit: string, stock: number, reorder_level: number) =>
      ctx.db.insert("inventory", { name, category, unit, stock, reorder_level });

    const rice = await item("Rice", "Food", "kg", 4100, 1000);
    const water = await item("Drinking water", "Water", "L", 9200, 3000);
    const flour = await item("Wheat flour", "Food", "kg", 2600, 800);
    const ors = await item("ORS sachets", "Medical", "sachet", 180, 500);
    const insulin = await item("Insulin", "Medical", "vial", 20, 60);
    const paracetamol = await item("Paracetamol strips", "Medical", "strip", 1450, 300);
    const tablets = await item("Purification tablets", "Water", "tablet", 12000, 2000);
    const tents = await item("Family tents", "Shelter", "tent", 160, 50);
    const tarp = await item("Tarpaulin sheets", "Shelter", "sheet", 40, 100);
    const blankets = await item("Blankets", "Shelter", "piece", 900, 200);
    const hygiene = await item("Hygiene kits", "Hygiene", "kit", 620, 150);
    const oil = await item("Cooking oil", "Food", "L", 1300, 400);

    const need = (
      camp_id: Id<"camps">,
      inventory_item_id: Id<"inventory">,
      required_quantity: number,
      priority: "High" | "Medium" | "Low",
      fulfilled_quantity: number,
    ) => ctx.db.insert("needs", { camp_id, inventory_item_id, required_quantity, priority, fulfilled_quantity });

    const nRatOrs = await need(ratodero, ors, 1200, "High", 300);
    const nRatPara = await need(ratodero, paracetamol, 300, "High", 90);
    const nRatWater = await need(ratodero, water, 5000, "High", 1600);
    await need(ratodero, rice, 3000, "Medium", 1830);
    await need(ratodero, hygiene, 200, "Low", 140);
    const nJohiInsulin = await need(johi, insulin, 150, "High", 12);
    const nJohiRice = await need(johi, rice, 2000, "Medium", 1100);
    await need(johi, water, 4000, "High", 2400);
    await need(johi, tents, 60, "Medium", 40);
    const nMeharTarp = await need(mehar, tarp, 200, "High", 70);
    const nMeharRice = await need(mehar, rice, 1500, "Medium", 1200);
    await need(mehar, paracetamol, 200, "High", 140);
    await need(sukkur, water, 6000, "High", 4500);
    const nSukkurTents = await need(sukkur, tents, 80, "Medium", 70);
    await need(sukkur, blankets, 300, "Low", 210);
    await need(khairpur, flour, 1500, "Medium", 1150);
    await need(khairpur, hygiene, 250, "Low", 180);
    const nJacBlankets = await need(jacobabad, blankets, 400, "Medium", 330);
    await need(jacobabad, oil, 300, "Low", 160);
    const nHydWater = await need(hyderabad, water, 3000, "High", 2550);

    const hour = 60 * 60 * 1000;
    const now = Date.now();
    const dispatch = (
      camp_id: Id<"camps">,
      need_id: Id<"needs">,
      quantity: number,
      status: "Pending" | "In Transit" | "Delivered" | "Cancelled",
      hoursAgo: number,
    ) => ctx.db.insert("dispatches", { camp_id, need_id, quantity, status, created_at: now - hoursAgo * hour });

    await dispatch(ratodero, nRatPara, 100, "Pending", 1);
    await dispatch(mehar, nMeharTarp, 20, "Pending", 2);
    await dispatch(ratodero, nRatWater, 300, "Pending", 3);
    await dispatch(ratodero, nRatOrs, 400, "In Transit", 20);
    await dispatch(johi, nJohiRice, 420, "In Transit", 22);
    await dispatch(mehar, nMeharRice, 600, "Delivered", 53);
    await dispatch(hyderabad, nHydWater, 1000, "Delivered", 72);
    await dispatch(sukkur, nSukkurTents, 30, "Delivered", 100);
    await dispatch(jacobabad, nJacBlankets, 200, "Delivered", 125);
    await dispatch(johi, nJohiInsulin, 30, "Cancelled", 141);

    const day = 24 * hour;
    const cashGift = (donor: string, amount: number, daysAgo: number) =>
      ctx.db.insert("donations", { type: "Cash", amount_or_quantity: amount, category: "Cash", donor, created_at: now - daysAgo * day });
    const kindGift = (donor: string, item_id: Id<"inventory">, category: Cat, qty: number, daysAgo: number) =>
      ctx.db.insert("donations", { type: "In-Kind", amount_or_quantity: qty, item_id, category, donor, created_at: now - daysAgo * day });

    await cashGift("Edhi Foundation", 2_000_000, 9);
    await cashGift("Karachi Traders Association", 1_500_000, 8);
    await kindGift("World Food Programme", rice, "Food", 1500, 7);
    await cashGift("Anonymous", 820_000, 6);
    await kindGift("UNICEF Pakistan", tablets, "Water", 5000, 5);
    await kindGift("Getz Pharma", paracetamol, "Medical", 600, 4);
    await cashGift("Overseas Pakistanis Fund", 500_000, 3);
    await kindGift("Saylani Welfare Trust", oil, "Food", 400, 2);
    await kindGift("Pakistan Red Crescent", blankets, "Shelter", 300, 1);
    await kindGift("Rotary Club Hyderabad", hygiene, "Hygiene", 200, 0);

    type Skill = "Medical" | "Logistics" | "Cooking" | "Driving" | "Counselling";
    const vol = (name: string, skill: Skill, camp_id?: Id<"camps">) =>
      ctx.db.insert("volunteers", { name, skill, camp_id });

    await vol("Dr. Faraz Memon", "Medical", johi);
    await vol("Dr. Kamran Shaikh", "Medical", khairpur);
    await vol("Dr. Sana Baloch", "Medical", ratodero);
    await vol("Rukhsana Bhutto", "Cooking", khairpur);
    await vol("Shazia Khoso", "Cooking", johi);
    await vol("Sajid Magsi", "Cooking");
    await vol("Imran Mallah", "Logistics", ratodero);
    await vol("Bilal Chandio", "Logistics", sukkur);
    await vol("Ali Raza Jatoi", "Driving", mehar);
    await vol("Asif Lashari", "Driving", jacobabad);
    await vol("Nadia Soomro", "Counselling", sukkur);
    await vol("Hina Qureshi", "Counselling", hyderabad);
    await vol("Zubair Panhwar", "Logistics");
    await vol("Mehwish Abro", "Medical");
    await vol("Farhan Rind", "Logistics");

    return "Seeded 8 camps, 12 items, 20 needs, 10 dispatches, 10 donations, 15 volunteers.";
  },
});
