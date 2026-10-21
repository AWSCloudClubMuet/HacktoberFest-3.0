using ReliefHub.Models;

namespace ReliefHub.Models.ViewModels
{
    public class DashboardViewModel
    {
        public int ActiveCampsCount { get; set; }
        public int TotalFamiliesSheltered { get; set; }
        public double OverallFulfilmentPercentage { get; set; }
        public int LowStockItemsCount { get; set; }
        public int VolunteersDeployedCount { get; set; }
        public decimal TotalCashDonations { get; set; }
        public List<Need> CriticalGaps { get; set; } = new();
        public Dictionary<string, double> CategoryFulfilmentPercentages { get; set; } = new();
        public List<Camp> RecentCamps { get; set; } = new();
    }

    public class CampIndexViewModel
    {
        public string? SearchTerm { get; set; }
        public string? StatusFilter { get; set; }
        public List<Camp> Camps { get; set; } = new();
    }

    public class DispatchCreateViewModel
    {
        public int CampId { get; set; }
        public int NeedId { get; set; }
        public int Quantity { get; set; }
        public List<Camp> AvailableCamps { get; set; } = new();
        public List<Need> AvailableNeeds { get; set; } = new();
    }
}