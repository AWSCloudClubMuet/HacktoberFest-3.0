using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models;
using CampusGigPortal.Models.ViewModels;
using CampusGigPortal.Services;

namespace CampusGigPortal.Controllers
{
    public class ProfilesController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserSessionService _userSession;

        public ProfilesController(ApplicationDbContext context, IUserSessionService userSession)
        {
            _context = context;
            _userSession = userSession;
        }

        // GET: /Profiles/Index/1 or /Profiles or /Profiles/Index
        [HttpGet]
        public async Task<IActionResult> Index(int? id)
        {
            var currentUserId = _userSession.GetCurrentUserId();
            var targetUserId = id ?? currentUserId;

            // Find target user, or fallback to first existing user
            var user = await _context.Users
                .Include(u => u.GigsPosted)
                .Include(u => u.GigsAccepted)
                .Include(u => u.ReviewsReceived).ThenInclude(r => r.Reviewer)
                .Include(u => u.ReviewsReceived).ThenInclude(r => r.Gig)
                .FirstOrDefaultAsync(u => u.Id == targetUserId);

            if (user == null)
            {
                user = await _context.Users
                    .Include(u => u.GigsPosted)
                    .Include(u => u.GigsAccepted)
                    .Include(u => u.ReviewsReceived).ThenInclude(r => r.Reviewer)
                    .Include(u => u.ReviewsReceived).ThenInclude(r => r.Gig)
                    .FirstOrDefaultAsync();
            }

            // If table has no users at all, create a demo user so page NEVER returns 404
            if (user == null)
            {
                user = new User
                {
                    Id = 1,
                    Name = "Sarah Chen",
                    Major = "Computer Science",
                    Semester = "Semester 7",
                    Bio = "Full-stack developer skilled in React, C# .NET, and Python.",
                    SkillsRaw = "C#, .NET, React, TypeScript, SQL Server, Python"
                };
            }

            var currentUser = await _userSession.GetCurrentUserAsync();

            double averageRating = user.ReviewsReceived.Any()
                ? Math.Round(user.ReviewsReceived.Average(r => r.Rating), 1)
                : 5.0;

            var postedGigs = await _context.Gigs
                .Where(g => g.UserId == user.Id)
                .OrderByDescending(g => g.CreatedAt)
                .ToListAsync();

            var completedGigs = await _context.Gigs
                .Where(g => (g.UserId == user.Id || g.AcceptedApplicantId == user.Id) && g.Status == "Completed")
                .OrderByDescending(g => g.CreatedAt)
                .ToListAsync();

            var vm = new ProfileViewModel
            {
                ProfileUser = user,
                CurrentUser = currentUser,
                PostedGigs = postedGigs,
                CompletedGigs = completedGigs,
                ReviewsReceived = user.ReviewsReceived.OrderByDescending(r => r.CreatedAt).ToList(),
                AverageRating = averageRating
            };

            return View(vm);
        }
    }
}