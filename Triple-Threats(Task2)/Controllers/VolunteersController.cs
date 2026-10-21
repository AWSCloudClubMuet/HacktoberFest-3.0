using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models;

namespace ReliefHub.Controllers
{
    public class VolunteersController : Controller
    {
        private readonly ApplicationDbContext _context;

        public VolunteersController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(string? skill)
        {
            var query = _context.Volunteers.Include(v => v.Camp).AsQueryable();

            if (!string.IsNullOrWhiteSpace(skill) && skill != "All")
            {
                query = query.Where(v => v.Skill == skill);
            }

            var volunteers = await query.ToListAsync();
            ViewBag.Camps = await _context.Camps.Where(c => c.Status != "Closed").ToListAsync();
            ViewBag.SelectedSkill = skill;
            return View(volunteers);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(Volunteer volunteer)
        {
            _context.Volunteers.Add(volunteer);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Volunteer registered!";
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Assign(int volunteerId, int? campId)
        {
            var volunteer = await _context.Volunteers.FindAsync(volunteerId);
            if (volunteer == null) return NotFound();

            if (campId.HasValue)
            {
                var camp = await _context.Camps.FindAsync(campId.Value);
                // Rule: Cannot assign to closed camp
                if (camp == null || camp.Status == "Closed")
                {
                    TempData["Error"] = "Cannot assign volunteers to a Closed camp!";
                    return RedirectToAction(nameof(Index));
                }
            }

            volunteer.CampId = campId;
            await _context.SaveChangesAsync();
            TempData["Success"] = "Volunteer assignment updated.";
            return RedirectToAction(nameof(Index));
        }
    }
}