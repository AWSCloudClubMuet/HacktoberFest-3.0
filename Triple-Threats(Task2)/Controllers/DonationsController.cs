using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models;

namespace ReliefHub.Controllers
{
    public class DonationsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public DonationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var donations = await _context.Donations.Include(d => d.Item).OrderByDescending(d => d.DonatedAt).ToListAsync();
            ViewBag.Inventory = await _context.Inventory.ToListAsync();
            ViewBag.TotalCash = await _context.Donations.Where(d => d.Type == "Cash").SumAsync(d => d.AmountOrQuantity);
            return View(donations);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Donation donation)
        {
            if (donation.Type == "In-Kind" && donation.ItemId.HasValue)
            {
                // In-kind contributions increase item stock
                var item = await _context.Inventory.FindAsync(donation.ItemId.Value);
                if (item != null)
                {
                    item.Stock += (int)donation.AmountOrQuantity;
                    donation.Category = item.Category;
                }
            }

            _context.Donations.Add(donation);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Donation recorded successfully!";
            return RedirectToAction(nameof(Index));
        }
    }
}