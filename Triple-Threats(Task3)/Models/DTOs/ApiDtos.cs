namespace ReliefHub.Models.DTOs
{
    public class CreateCampDto
    {
        public string Name { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int CurrentFamilies { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class CreateNeedDto
    {
        public int CampId { get; set; }
        public int InventoryItemId { get; set; }
        public int RequiredQuantity { get; set; }
        public string Priority { get; set; } = "High";
    }

    public class CreateDispatchDto
    {
        public int CampId { get; set; }
        public int NeedId { get; set; }
        public int Quantity { get; set; }
    }

    public class CreateDonationDto
    {
        public string Type { get; set; } = "Cash";
        public decimal AmountOrQuantity { get; set; }
        public int? ItemId { get; set; }
        public string Category { get; set; } = "General Relief";
    }
}