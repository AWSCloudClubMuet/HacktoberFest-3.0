using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models;

namespace ReliefHub.Controllers
{
    public class DispatchesController : Controller
    {
        private readonly ApplicationDbContext _context;

        public DispatchesController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var dispatches = await _context.Dispatches
                .Include(d => d.Camp)
                .Include(d => d.Need).ThenInclude(n => n!.InventoryItem)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            ViewBag.Camps = await _context.Camps.Where(c => c.Status != "Closed").ToListAsync();
            ViewBag.Needs = await _context.Needs
                .Include(n => n.Camp)
                .Include(n => n.InventoryItem)
                .Include(n => n.Dispatches)
                .Where(n => n.Camp!.Status != "Closed" && n.FulfilledQuantity < n.RequiredQuantity)
                .ToListAsync();

            return View(dispatches);
        }

        // POST: Dispatches/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(int campId, int needId, int quantity)
        {
            var need = await _context.Needs
                .Include(n => n.InventoryItem)
                .Include(n => n.Dispatches)
                .FirstOrDefaultAsync(n => n.Id == needId);

            if (need == null || need.InventoryItem == null)
            {
                TempData["Error"] = "Selected need or inventory item not found.";
                return RedirectToAction(nameof(Index));
            }

            // Rule 1: Never dispatch more than available stock
            if (quantity > need.InventoryItem.Stock)
            {
                TempData["Error"] = $"Cannot dispatch {quantity} units! Warehouse stock is only {need.InventoryItem.Stock}.";
                return RedirectToAction(nameof(Index));
            }

            // Rule 2: Never exceed a need's remaining unreserved quantity
            if (quantity > need.RemainingUnreservedQuantity)
            {
                TempData["Error"] = $"Cannot dispatch {quantity}! Maximum unreserved requirement is {need.RemainingUnreservedQuantity}.";
                return RedirectToAction(nameof(Index));
            }

            // Reserve stock immediately on creation
            need.InventoryItem.Stock -= quantity;

            var dispatch = new Dispatch
            {
                CampId = campId,
                NeedId = needId,
                Quantity = quantity,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Dispatches.Add(dispatch);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Dispatch created and stock reserved successfully!";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkInTransit(int id)
        {
            var dispatch = await _context.Dispatches.FindAsync(id);
            if (dispatch != null && dispatch.Status == "Pending")
            {
                dispatch.Status = "In Transit";
                await _context.SaveChangesAsync();
                TempData["Success"] = "Dispatch marked In Transit.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MarkDelivered(int id)
        {
            var dispatch = await _context.Dispatches.Include(d => d.Need).FirstOrDefaultAsync(d => d.Id == id);
            if (dispatch != null && (dispatch.Status == "In Transit" || dispatch.Status == "Pending"))
            {
                dispatch.Status = "Delivered";
                // Delivered dispatches increase fulfilment
                if (dispatch.Need != null)
                {
                    dispatch.Need.FulfilledQuantity += dispatch.Quantity;
                }
                await _context.SaveChangesAsync();
                TempData["Success"] = "Dispatch Delivered! Need fulfilment updated.";
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Cancel(int id)
        {
            var dispatch = await _context.Dispatches
                .Include(d => d.Need).ThenInclude(n => n!.InventoryItem)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (dispatch != null && dispatch.Status != "Delivered" && dispatch.Status != "Cancelled")
            {
                dispatch.Status = "Cancelled";
                // Cancelling restores reserved warehouse stock
                if (dispatch.Need?.InventoryItem != null)
                {
                    dispatch.Need.InventoryItem.Stock += dispatch.Quantity;
                }
                await _context.SaveChangesAsync();
                TempData["Success"] = "Dispatch cancelled and stock restored to warehouse.";
            }
            return RedirectToAction(nameof(Index));
        }
    }
}