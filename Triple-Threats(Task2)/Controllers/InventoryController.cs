using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models;

namespace ReliefHub.Controllers
{
    public class InventoryController : Controller
    {
        private readonly ApplicationDbContext _context;

        public InventoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var items = await _context.Inventory.OrderBy(i => i.Category).ToListAsync();
            return View(items);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(InventoryItem item)
        {
            if (ModelState.IsValid)
            {
                _context.Inventory.Add(item);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Inventory item added.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(InventoryItem item)
        {
            if (ModelState.IsValid)
            {
                _context.Update(item);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Stock updated.";
            }
            return RedirectToAction(nameof(Index));
        }
    }
}