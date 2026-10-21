using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models.ViewModels;

namespace ReliefHub.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var activeCampsCount = await _context.Camps.CountAsync(c => c.Status != "Closed");
            var totalFamilies = await _context.Camps.Where(c => c.Status != "Closed").SumAsync(c => c.CurrentFamilies);

            var needs = await _context.Needs
                .Include(n => n.Camp)
                .Include(n => n.InventoryItem)
                .Include(n => n.Dispatches)
                .ToListAsync();

            var totalRequired = needs.Sum(n => n.RequiredQuantity);
            var totalFulfilled = needs.Sum(n => n.FulfilledQuantity);
            var overallFulfilment = totalRequired > 0 ? Math.Round((double)totalFulfilled / totalRequired * 100, 1) : 100.0;

            var lowStockCount = await _context.Inventory.CountAsync(i => i.Stock <= i.ReorderLevel);
            var deployedVolunteers = await _context.Volunteers.CountAsync(v => v.CampId != null);
            var totalCash = await _context.Donations.Where(d => d.Type == "Cash").SumAsync(d => d.AmountOrQuantity);

            // Critical Gaps: High Priority & Fulfilment < 40%, ordered by worst gap
            var criticalGaps = needs
                .Where(n => n.IsCriticalGap && n.Camp?.Status != "Closed")
                .OrderBy(n => n.FulfilmentPercentage)
                .ToList();

            // Bar chart data: Fulfilment % by item category
            var categories = new[] { "Food", "Water & Sanitation", "Medicine", "Shelter" };
            var categoryStats = new Dictionary<string, double>();
            foreach (var cat in categories)
            {
                var catNeeds = needs.Where(n => n.InventoryItem?.Category == cat).ToList();
                var req = catNeeds.Sum(n => n.RequiredQuantity);
                var ful = catNeeds.Sum(n => n.FulfilledQuantity);
                categoryStats[cat] = req > 0 ? Math.Round((double)ful / req * 100, 1) : 100.0;
            }

            var recentCamps = await _context.Camps.Take(5).ToListAsync();

            var vm = new DashboardViewModel
            {
                ActiveCampsCount = activeCampsCount,
                TotalFamiliesSheltered = totalFamilies,
                OverallFulfilmentPercentage = overallFulfilment,
                LowStockItemsCount = lowStockCount,
                VolunteersDeployedCount = deployedVolunteers,
                TotalCashDonations = totalCash,
                CriticalGaps = criticalGaps,
                CategoryFulfilmentPercentages = categoryStats,
                RecentCamps = recentCamps
            };

            return View(vm);
        }
    }
}