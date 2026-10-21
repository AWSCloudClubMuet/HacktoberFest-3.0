using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models;
using ReliefHub.Models.ViewModels;

namespace ReliefHub.Controllers
{
    public class CampsController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CampsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(string? q, string? status)
        {
            var query = _context.Camps.Include(c => c.Volunteers).Include(c => c.Needs).AsQueryable();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.ToLower().Trim();
                query = query.Where(c => c.Name.ToLower().Contains(term) || c.District.ToLower().Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(c => c.Status == status);
            }

            var camps = await query.ToListAsync();

            return View(new CampIndexViewModel { SearchTerm = q, StatusFilter = status, Camps = camps });
        }

        public async Task<IActionResult> Details(int id)
        {
            var camp = await _context.Camps
                .Include(c => c.Needs).ThenInclude(n => n.InventoryItem)
                .Include(c => c.Needs).ThenInclude(n => n.Dispatches)
                .Include(c => c.Volunteers)
                .Include(c => c.Dispatches).ThenInclude(d => d.Need)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (camp == null) return NotFound();

            ViewBag.InventoryItems = await _context.Inventory.ToListAsync();
            return View(camp);
        }

        public IActionResult Create() => View(new Camp { Capacity = 500, Status = "Active" });

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Camp camp)
        {
            if (camp.CurrentFamilies >= camp.Capacity)
                camp.Status = "Full";

            if (ModelState.IsValid)
            {
                _context.Camps.Add(camp);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Camp created successfully!";
                return RedirectToAction(nameof(Index));
            }
            return View(camp);
        }

        public async Task<IActionResult> Edit(int id)
        {
            var camp = await _context.Camps.FindAsync(id);
            if (camp == null) return NotFound();
            return View(camp);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(Camp camp)
        {
            if (camp.CurrentFamilies >= camp.Capacity && camp.Status != "Closed")
                camp.Status = "Full";

            if (ModelState.IsValid)
            {
                _context.Update(camp);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Camp details updated.";
                return RedirectToAction(nameof(Index));
            }
            return View(camp);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            var camp = await _context.Camps.FindAsync(id);
            if (camp != null)
            {
                _context.Camps.Remove(camp);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Camp deleted.";
            }
            return RedirectToAction(nameof(Index));
        }

        // Add Need to Camp
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddNeed(int campId, int inventoryItemId, int requiredQuantity, string priority)
        {
            var camp = await _context.Camps.FindAsync(campId);
            if (camp == null) return NotFound();

            var need = new Need
            {
                CampId = campId,
                InventoryItemId = inventoryItemId,
                RequiredQuantity = requiredQuantity,
                Priority = priority,
                FulfilledQuantity = 0
            };

            _context.Needs.Add(need);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Camp need added!";
            return RedirectToAction(nameof(Details), new { id = campId });
        }
    }
}