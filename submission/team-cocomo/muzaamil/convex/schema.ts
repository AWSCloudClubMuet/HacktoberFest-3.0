import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const role = v.union(v.literal("coordinator"), v.literal("volunteer"));
export const campStatus = v.union(
  v.literal("Open"),
  v.literal("Full"),
  v.literal("Closed"),
);
export const category = v.union(
  v.literal("Food"),
  v.literal("Water"),
  v.literal("Medical"),
  v.literal("Shelter"),
  v.literal("Hygiene"),
);
export const priority = v.union(
  v.literal("High"),
  v.literal("Medium"),
  v.literal("Low"),
);
export const dispatchStatus = v.union(
  v.literal("Pending"),
  v.literal("In Transit"),
  v.literal("Delivered"),
  v.literal("Cancelled"),
);
export const donationType = v.union(v.literal("Cash"), v.literal("In-Kind"));
export const skill = v.union(
  v.literal("Medical"),
  v.literal("Logistics"),
  v.literal("Cooking"),
  v.literal("Driving"),
  v.literal("Counselling"),
);

export default defineSchema({
  ...authTables,

  // Convex Auth users table, extended with the ReliefHub role.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(role),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  camps: defineTable({
    name: v.string(),
    district: v.string(),
    capacity: v.number(),
    current_families: v.number(),
    status: campStatus,
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_district", ["district"]),

  inventory: defineTable({
    name: v.string(),
    category,
    unit: v.string(),
    stock: v.number(),
    reorder_level: v.number(),
  }).index("by_category", ["category"]),

  needs: defineTable({
    camp_id: v.id("camps"),
    inventory_item_id: v.id("inventory"),
    required_quantity: v.number(),
    priority,
    fulfilled_quantity: v.number(),
  })
    .index("by_camp", ["camp_id"])
    .index("by_item", ["inventory_item_id"]),

  dispatches: defineTable({
    camp_id: v.id("camps"),
    need_id: v.id("needs"),
    quantity: v.number(),
    status: dispatchStatus,
    created_at: v.number(),
  })
    .index("by_need", ["need_id"])
    .index("by_camp", ["camp_id"])
    .index("by_status", ["status"]),

  donations: defineTable({
    type: donationType,
    amount_or_quantity: v.number(),
    item_id: v.optional(v.id("inventory")),
    category: v.string(),
    donor: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_type", ["type"]),

  volunteers: defineTable({
    name: v.string(),
    skill,
    camp_id: v.optional(v.id("camps")),
    // Set when the volunteer has their own sign-in; seeded roster entries have none.
    user_id: v.optional(v.id("users")),
    phone: v.optional(v.string()),
  })
    .index("by_camp", ["camp_id"])
    .index("by_user", ["user_id"])
    .index("by_skill", ["skill"]),
});
