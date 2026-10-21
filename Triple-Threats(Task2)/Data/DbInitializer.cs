using ReliefHub.Models;

namespace ReliefHub.Data
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Camps.Any()) return;

            // 1. Seed 8 Camps across 4 Districts (Dadu, Sukkur, Larkana, Khairpur)
            var camps = new List<Camp>
            {
                new Camp { Id = 1, Name = "Dadu High School Relief Camp", District = "Dadu", Capacity = 500, CurrentFamilies = 340, Status = "Active" },
                new Camp { Id = 2, Name = "Mehar Stadium Camp", District = "Dadu", Capacity = 400, CurrentFamilies = 400, Status = "Full" }, // FULL
                new Camp { Id = 3, Name = "Sukkur Barrage Tent Village", District = "Sukkur", Capacity = 800, CurrentFamilies = 520, Status = "Active" },
                new Camp { Id = 4, Name = "Rohri Community Shelter", District = "Sukkur", Capacity = 300, CurrentFamilies = 290, Status = "Active" },
                new Camp { Id = 5, Name = "Larkana Degree College Camp", District = "Larkana", Capacity = 600, CurrentFamilies = 410, Status = "Active" },
                new Camp { Id = 6, Name = "Ratodero Rural Centre", District = "Larkana", Capacity = 250, CurrentFamilies = 0, Status = "Closed" }, // CLOSED
                new Camp { Id = 7, Name = "Khairpur Sports Complex Camp", District = "Khairpur", Capacity = 700, CurrentFamilies = 480, Status = "Active" },
                new Camp { Id = 8, Name = "Kot Diji Emergency Camp", District = "Khairpur", Capacity = 350, CurrentFamilies = 180, Status = "Active" }
            };
            context.Camps.AddRange(camps);
            context.SaveChanges();

            // 2. Seed 12 Inventory Items (2 Low Stock)
            var inventory = new List<InventoryItem>
            {
                new InventoryItem { Id = 1, Name = "Rice Bags (20kg)", Category = "Food", Unit = "Bags", Stock = 1200, ReorderLevel = 300 },
                new InventoryItem { Id = 2, Name = "Flour Bags (10kg)", Category = "Food", Unit = "Bags", Stock = 800, ReorderLevel = 250 },
                new InventoryItem { Id = 3, Name = "Cooking Oil (5L)", Category = "Food", Unit = "Cans", Stock = 50, ReorderLevel = 100 }, // LOW STOCK
                new InventoryItem { Id = 4, Name = "Mineral Water (19L)", Category = "Water & Sanitation", Unit = "Bottles", Stock = 1500, ReorderLevel = 400 },
                new InventoryItem { Id = 5, Name = "Water Purification Tablets", Category = "Water & Sanitation", Unit = "Strips", Stock = 80, ReorderLevel = 200 }, // LOW STOCK
                new InventoryItem { Id = 6, Name = "Hygiene & Soap Kits", Category = "Water & Sanitation", Unit = "Kits", Stock = 650, ReorderLevel = 150 },
                new InventoryItem { Id = 7, Name = "Emergency First Aid Kits", Category = "Medicine", Unit = "Kits", Stock = 300, ReorderLevel = 80 },
                new InventoryItem { Id = 8, Name = "ORS Sachets Box", Category = "Medicine", Unit = "Boxes", Stock = 450, ReorderLevel = 100 },
                new InventoryItem { Id = 9, Name = "Anti-Malarial & Fever Meds", Category = "Medicine", Unit = "Boxes", Stock = 210, ReorderLevel = 75 },
                new InventoryItem { Id = 10, Name = "Family Waterproof Tents", Category = "Shelter", Unit = "Tents", Stock = 400, ReorderLevel = 100 },
                new InventoryItem { Id = 11, Name = "Thermal Blankets", Category = "Shelter", Unit = "Blankets", Stock = 900, ReorderLevel = 200 },
                new InventoryItem { Id = 12, Name = "Mosquito Nets", Category = "Shelter", Unit = "Nets", Stock = 750, ReorderLevel = 150 }
            };
            context.Inventory.AddRange(inventory);
            context.SaveChanges();

            // 3. Seed 20 Needs (at least 3 Critical Gaps: High Priority & < 40% fulfilled)
            var needs = new List<Need>
            {
                // Critical Gaps
                new Need { Id = 1, CampId = 1, InventoryItemId = 5, RequiredQuantity = 500, Priority = "High", FulfilledQuantity = 50 }, // 10% (Critical)
                new Need { Id = 2, CampId = 3, InventoryItemId = 7, RequiredQuantity = 300, Priority = "High", FulfilledQuantity = 60 }, // 20% (Critical)
                new Need { Id = 3, CampId = 5, InventoryItemId = 3, RequiredQuantity = 400, Priority = "High", FulfilledQuantity = 80 }, // 20% (Critical)

                // Other Needs
                new Need { Id = 4, CampId = 1, InventoryItemId = 1, RequiredQuantity = 600, Priority = "High", FulfilledQuantity = 450 },
                new Need { Id = 5, CampId = 1, InventoryItemId = 4, RequiredQuantity = 800, Priority = "Medium", FulfilledQuantity = 600 },
                new Need { Id = 6, CampId = 2, InventoryItemId = 2, RequiredQuantity = 400, Priority = "High", FulfilledQuantity = 400 },
                new Need { Id = 7, CampId = 2, InventoryItemId = 8, RequiredQuantity = 200, Priority = "Medium", FulfilledQuantity = 120 },
                new Need { Id = 8, CampId = 3, InventoryItemId = 10, RequiredQuantity = 300, Priority = "High", FulfilledQuantity = 250 },
                new Need { Id = 9, CampId = 3, InventoryItemId = 12, RequiredQuantity = 600, Priority = "Medium", FulfilledQuantity = 300 },
                new Need { Id = 10, CampId = 4, InventoryItemId = 1, RequiredQuantity = 300, Priority = "Low", FulfilledQuantity = 150 },
                new Need { Id = 11, CampId = 4, InventoryItemId = 6, RequiredQuantity = 250, Priority = "Medium", FulfilledQuantity = 200 },
                new Need { Id = 12, CampId = 5, InventoryItemId = 9, RequiredQuantity = 150, Priority = "High", FulfilledQuantity = 120 },
                new Need { Id = 13, CampId = 5, InventoryItemId = 11, RequiredQuantity = 500, Priority = "Low", FulfilledQuantity = 350 },
                new Need { Id = 14, CampId = 7, InventoryItemId = 4, RequiredQuantity = 900, Priority = "High", FulfilledQuantity = 750 },
                new Need { Id = 15, CampId = 7, InventoryItemId = 7, RequiredQuantity = 100, Priority = "Medium", FulfilledQuantity = 70 },
                new Need { Id = 16, CampId = 7, InventoryItemId = 1, RequiredQuantity = 500, Priority = "High", FulfilledQuantity = 400 },
                new Need { Id = 17, CampId = 8, InventoryItemId = 2, RequiredQuantity = 200, Priority = "Medium", FulfilledQuantity = 160 },
                new Need { Id = 18, CampId = 8, InventoryItemId = 6, RequiredQuantity = 150, Priority = "Low", FulfilledQuantity = 100 },
                new Need { Id = 19, CampId = 8, InventoryItemId = 10, RequiredQuantity = 100, Priority = "High", FulfilledQuantity = 90 },
                new Need { Id = 20, CampId = 4, InventoryItemId = 8, RequiredQuantity = 120, Priority = "Low", FulfilledQuantity = 120 }
            };
            context.Needs.AddRange(needs);
            context.SaveChanges();

            // 4. Seed 10 Dispatches
            var now = DateTime.UtcNow;
            var dispatches = new List<Dispatch>
            {
                new Dispatch { Id = 1, CampId = 1, NeedId = 4, Quantity = 100, Status = "Delivered", CreatedAt = now.AddDays(-3) },
                new Dispatch { Id = 2, CampId = 1, NeedId = 5, Quantity = 200, Status = "Delivered", CreatedAt = now.AddDays(-2) },
                new Dispatch { Id = 3, CampId = 2, NeedId = 6, Quantity = 150, Status = "Delivered", CreatedAt = now.AddDays(-4) },
                new Dispatch { Id = 4, CampId = 3, NeedId = 8, Quantity = 50, Status = "In Transit", CreatedAt = now.AddHours(-6) },
                new Dispatch { Id = 5, CampId = 3, NeedId = 9, Quantity = 100, Status = "Pending", CreatedAt = now.AddHours(-2) },
                new Dispatch { Id = 6, CampId = 4, NeedId = 11, Quantity = 80, Status = "In Transit", CreatedAt = now.AddHours(-12) },
                new Dispatch { Id = 7, CampId = 5, NeedId = 12, Quantity = 40, Status = "Delivered", CreatedAt = now.AddDays(-1) },
                new Dispatch { Id = 8, CampId = 7, NeedId = 14, Quantity = 200, Status = "Delivered", CreatedAt = now.AddDays(-2) },
                new Dispatch { Id = 9, CampId = 8, NeedId = 19, Quantity = 30, Status = "Pending", CreatedAt = now.AddHours(-1) },
                new Dispatch { Id = 10, CampId = 1, NeedId = 1, Quantity = 50, Status = "Cancelled", CreatedAt = now.AddDays(-5) }
            };
            context.Dispatches.AddRange(dispatches);
            context.SaveChanges();

            // 5. Seed 10 Donations (Cash + In-Kind)
            var donations = new List<Donation>
            {
                new Donation { Id = 1, Type = "Cash", AmountOrQuantity = 250000m, ItemId = null, Category = "General Relief", DonatedAt = now.AddDays(-7) },
                new Donation { Id = 2, Type = "Cash", AmountOrQuantity = 500000m, ItemId = null, Category = "Emergency Medicine", DonatedAt = now.AddDays(-5) },
                new Donation { Id = 3, Type = "Cash", AmountOrQuantity = 150000m, ItemId = null, Category = "Clean Water Project", DonatedAt = now.AddDays(-4) },
                new Donation { Id = 4, Type = "In-Kind", AmountOrQuantity = 200m, ItemId = 1, Category = "Food", DonatedAt = now.AddDays(-6) },
                new Donation { Id = 5, Type = "In-Kind", AmountOrQuantity = 300m, ItemId = 4, Category = "Water & Sanitation", DonatedAt = now.AddDays(-5) },
                new Donation { Id = 6, Type = "Cash", AmountOrQuantity = 100000m, ItemId = null, Category = "General Relief", DonatedAt = now.AddDays(-3) },
                new Donation { Id = 7, Type = "In-Kind", AmountOrQuantity = 100m, ItemId = 7, Category = "Medicine", DonatedAt = now.AddDays(-3) },
                new Donation { Id = 8, Type = "In-Kind", AmountOrQuantity = 50m, ItemId = 10, Category = "Shelter", DonatedAt = now.AddDays(-2) },
                new Donation { Id = 9, Type = "Cash", AmountOrQuantity = 75000m, ItemId = null, Category = "Food Supplies", DonatedAt = now.AddDays(-1) },
                new Donation { Id = 10, Type = "In-Kind", AmountOrQuantity = 150m, ItemId = 11, Category = "Shelter", DonatedAt = now.AddHours(-10) }
            };
            context.Donations.AddRange(donations);
            context.SaveChanges();

            // 6. Seed 15 Volunteers (Skills: Medical, Logistics, Cooking, Driving, Counselling)
            var volunteers = new List<Volunteer>
            {
                new Volunteer { Id = 1, Name = "Dr. Tariq Memon", Skill = "Medical", CampId = 1 },
                new Volunteer { Id = 2, Name = "Nurse Fatima Shah", Skill = "Medical", CampId = 1 },
                new Volunteer { Id = 3, Name = "Bilal Junejo", Skill = "Logistics", CampId = 2 },
                new Volunteer { Id = 4, Name = "Rashid Ali", Skill = "Driving", CampId = 3 },
                new Volunteer { Id = 5, Name = "Zainab Soomro", Skill = "Cooking", CampId = 3 },
                new Volunteer { Id = 6, Name = "Dr. Asma Abbasi", Skill = "Medical", CampId = 4 },
                new Volunteer { Id = 7, Name = "Farhan Chandio", Skill = "Logistics", CampId = 5 },
                new Volunteer { Id = 8, Name = "Saima Kalhoro", Skill = "Counselling", CampId = 5 },
                new Volunteer { Id = 9, Name = "Ghulam Mustafa", Skill = "Driving", CampId = 7 },
                new Volunteer { Id = 10, Name = "Khadija Bhutto", Skill = "Cooking", CampId = 7 },
                new Volunteer { Id = 11, Name = "Naveed Solangi", Skill = "Logistics", CampId = 8 },
                new Volunteer { Id = 12, Name = "Dr. Zulfiqar Leghari", Skill = "Medical", CampId = null }, // Unassigned
                new Volunteer { Id = 13, Name = "Aijaz Buriro", Skill = "Driving", CampId = null }, // Unassigned
                new Volunteer { Id = 14, Name = "Mehwish Rind", Skill = "Counselling", CampId = null }, // Unassigned
                new Volunteer { Id = 15, Name = "Hassan Mallah", Skill = "Cooking", CampId = null } // Unassigned
            };
            context.Volunteers.AddRange(volunteers);
            context.SaveChanges();
        }
    }
}