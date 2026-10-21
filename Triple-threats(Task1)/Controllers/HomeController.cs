using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models.ViewModels;
using CampusGigPortal.Services;

namespace CampusGigPortal.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserSessionService _userSession;

        public HomeController(ApplicationDbContext context, IUserSessionService userSession)
        {
            _context = context;
            _userSession = userSession;
        }

        public async Task<IActionResult> Index()
        {
            var currentUser = await _userSession.GetCurrentUserAsync();
            var now = DateTime.Now;

            var totalGigs = await _context.Gigs.CountAsync();
            var activeGigs = await _context.Gigs.CountAsync(g => g.Status == "Open" && g.Deadline >= now);
            var completedGigs = await _context.Gigs.CountAsync(g => g.Status == "Completed");
            var totalStudents = await _context.Users.CountAsync();

            var recentGigs = await _context.Gigs
                .Include(g => g.User)
                .Include(g => g.Applications)
                .OrderByDescending(g => g.CreatedAt)
                .Take(6)
                .ToListAsync();

            var categories = new[] { "Programming", "Design", "Writing", "Tutoring" };
            var categoryCounts = new Dictionary<string, int>();
            foreach (var cat in categories)
            {
                categoryCounts[cat] = await _context.Gigs.CountAsync(g => g.Category == cat);
            }

            var vm = new DashboardViewModel
            {
                CurrentUser = currentUser,
                TotalGigs = totalGigs,
                ActiveGigs = activeGigs,
                CompletedGigs = completedGigs,
                TotalStudents = totalStudents,
                RecentGigs = recentGigs,
                CategoryCounts = categoryCounts
            };

            return View(vm);
        }

        [HttpPost]
        public IActionResult SwitchUser(int userId, string returnUrl = "/")
        {
            _userSession.SetCurrentUserId(userId);
            TempData["Success"] = "Active student profile switched successfully!";
            return LocalRedirect(string.IsNullOrEmpty(returnUrl) ? "/" : returnUrl);
        }
    }
}