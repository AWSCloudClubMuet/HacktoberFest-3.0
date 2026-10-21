using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models;
using CampusGigPortal.Models.ViewModels;
using CampusGigPortal.Services;

namespace CampusGigPortal.Controllers
{
    public class GigsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserSessionService _userSession;

        public GigsController(ApplicationDbContext context, IUserSessionService userSession)
        {
            _context = context;
            _userSession = userSession;
        }

        // GET: /Gigs (Discovery & Filtering)
        public async Task<IActionResult> Index(
            string? category,
            string? type,
            string? paymentType,
            string? q,
            decimal? minBudget,
            decimal? maxBudget,
            string? status)
        {
            var query = _context.Gigs
                .Include(g => g.User)
                .Include(g => g.Applications)
                .AsQueryable();

            var now = DateTime.Now;

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
                query = query.Where(g => g.Category == category);

            if (!string.IsNullOrWhiteSpace(type) && type != "All")
                query = query.Where(g => g.Type == type);

            if (!string.IsNullOrWhiteSpace(paymentType) && paymentType != "All")
                query = query.Where(g => g.PaymentType == paymentType);

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(g => g.Title.ToLower().Contains(term) || g.Description.ToLower().Contains(term));
            }

            if (minBudget.HasValue) query = query.Where(g => g.Budget >= minBudget.Value);
            if (maxBudget.HasValue) query = query.Where(g => g.Budget <= maxBudget.Value);

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                if (status == "Expired")
                    query = query.Where(g => g.Status == "Expired" || (g.Status == "Open" && g.Deadline < now));
                else if (status == "Open")
                    query = query.Where(g => g.Status == "Open" && g.Deadline >= now);
                else
                    query = query.Where(g => g.Status == status);
            }

            var results = await query.OrderByDescending(g => g.CreatedAt).ToListAsync();

            var vm = new GigIndexViewModel
            {
                Category = category,
                Type = type,
                PaymentType = paymentType,
                Q = q,
                MinBudget = minBudget,
                MaxBudget = maxBudget,
                Status = status,
                Gigs = results
            };

            return View(vm);
        }

        // GET: /Gigs/Details/5
        public async Task<IActionResult> Details(int id)
        {
            var gig = await _context.Gigs
                .Include(g => g.User).ThenInclude(u => u!.ReviewsReceived)
                .Include(g => g.AcceptedApplicant).ThenInclude(u => u!.ReviewsReceived)
                .Include(g => g.Applications).ThenInclude(a => a.Applicant).ThenInclude(u => u!.ReviewsReceived)
                .Include(g => g.Reviews).ThenInclude(r => r.Reviewer)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (gig == null) return NotFound();

            var currentUserId = _userSession.GetCurrentUserId();
            var currentUser = await _userSession.GetCurrentUserAsync();

            var userApplication = gig.Applications.FirstOrDefault(a => a.ApplicantId == currentUserId);
            var hasApplied = userApplication != null;

            var userReview = gig.Reviews.FirstOrDefault(r => r.ReviewerId == currentUserId);
            var peerReview = gig.Reviews.FirstOrDefault(r => r.ReviewerId != currentUserId);

            bool isPartyToGig = gig.UserId == currentUserId || gig.AcceptedApplicantId == currentUserId;
            bool canReview = gig.Status == "Completed" && isPartyToGig && userReview == null;

            var vm = new GigDetailViewModel
            {
                Gig = gig,
                CurrentUser = currentUser,
                HasApplied = hasApplied,
                UserApplication = userApplication,
                CanReview = canReview,
                UserReview = userReview,
                PeerReview = peerReview,
                Applications = gig.Applications.OrderByDescending(a => a.CreatedAt).ToList(),
                Reviews = gig.Reviews.ToList()
            };

            return View(vm);
        }

        // GET: /Gigs/Create
        public IActionResult Create()
        {
            return View(new GigCreateViewModel { Deadline = DateTime.Today.AddDays(7) });
        }

        //// POST: /Gigs/Create
        //[HttpPost]
        //[ValidateAntiForgeryToken]
        //public async Task<IActionResult> Create(GigCreateViewModel model)
        //{
        //    if (model.PaymentType == "Paid" && (!model.Budget.HasValue || model.Budget <= 0))
        //    {
        //        ModelState.AddModelError(nameof(model.Budget), "A valid budget amount is required for Paid gigs.");
        //    }

        //    if (model.Deadline <= DateTime.Today)
        //    {
        //        ModelState.AddModelError(nameof(model.Deadline), "Deadline must be a future date.");
        //    }

        //    if (!ModelState.IsValid) return View(model);

        //    var currentUserId = _userSession.GetCurrentUserId();

        //    var gig = new Gig
        //    {
        //        UserId = currentUserId,
        //        Title = model.Title.Trim(),
        //        Description = model.Description.Trim(),
        //        Type = model.Type,
        //        Category = model.Category,
        //        PaymentType = model.PaymentType,
        //        Budget = model.PaymentType == "Paid" ? model.Budget : null,
        //        Deadline = model.Deadline,
        //        Status = "Open",
        //        CreatedAt = DateTime.Now
        //    };

        //    _context.Gigs.Add(gig);
        //    await _context.SaveChangesAsync();

        //    TempData["Success"] = "Your gig has been posted successfully!";
        //    return RedirectToAction(nameof(Details), new { id = gig.Id });
        //}

        // POST: /Gigs/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(GigCreateViewModel model)
        {
            if (model.PaymentType == "Paid" && (!model.Budget.HasValue || model.Budget <= 0))
            {
                ModelState.AddModelError(nameof(model.Budget), "A valid budget amount is required for Paid gigs.");
            }

            if (model.Deadline <= DateTime.Today)
            {
                ModelState.AddModelError(nameof(model.Deadline), "Deadline must be a future date.");
            }

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            // 1. Get or create a guaranteed valid User in DB to satisfy FK_Gigs_Users_UserId
            var currentUserId = _userSession.GetCurrentUserId();
            var userExists = await _context.Users.AnyAsync(u => u.Id == currentUserId);

            if (!userExists)
            {
                var existingAnyUser = await _context.Users.FirstOrDefaultAsync();
                if (existingAnyUser != null)
                {
                    currentUserId = existingAnyUser.Id;
                    _userSession.SetCurrentUserId(currentUserId);
                }
                else
                {
                    // If table has zero users, create user 1 on the fly
                    var defaultUser = new User
                    {
                        Name = "Sarah Chen",
                        Major = "Computer Science",
                        Semester = "Semester 7",
                        Bio = "Full-stack developer skilled in React, C# .NET, and Python.",
                        SkillsRaw = "C#, .NET, React, TypeScript, SQL Server, Python"
                    };
                    _context.Users.Add(defaultUser);
                    await _context.SaveChangesAsync();
                    currentUserId = defaultUser.Id;
                    _userSession.SetCurrentUserId(currentUserId);
                }
            }

            // 2. Insert the gig
            var gig = new Gig
            {
                UserId = currentUserId,
                Title = model.Title.Trim(),
                Description = model.Description.Trim(),
                Type = model.Type,
                Category = model.Category,
                PaymentType = model.PaymentType,
                Budget = model.PaymentType == "Paid" ? model.Budget : null,
                Deadline = model.Deadline,
                Status = "Open",
                CreatedAt = DateTime.Now
            };

            _context.Gigs.Add(gig);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Your gig has been posted successfully!";
            return RedirectToAction(nameof(Details), new { id = gig.Id });
        }

        // POST: /Gigs/Apply
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Apply(int gigId, string message)
        {
            var gig = await _context.Gigs.FindAsync(gigId);
            if (gig == null) return NotFound();

            var currentUserId = _userSession.GetCurrentUserId();

            if (gig.UserId == currentUserId)
            {
                TempData["Error"] = "You cannot apply to your own gig.";
                return RedirectToAction(nameof(Details), new { id = gigId });
            }

            if (gig.EffectiveStatus != "Open")
            {
                TempData["Error"] = $"Cannot apply to a gig with status '{gig.EffectiveStatus}'.";
                return RedirectToAction(nameof(Details), new { id = gigId });
            }

            var alreadyApplied = await _context.Applications
                .AnyAsync(a => a.GigId == gigId && a.ApplicantId == currentUserId);

            if (alreadyApplied)
            {
                TempData["Error"] = "You have already applied to this gig.";
                return RedirectToAction(nameof(Details), new { id = gigId });
            }

            if (string.IsNullOrWhiteSpace(message))
            {
                TempData["Error"] = "Please write a brief pitch message.";
                return RedirectToAction(nameof(Details), new { id = gigId });
            }

            var application = new Application
            {
                GigId = gigId,
                ApplicantId = currentUserId,
                Message = message.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.Applications.Add(application);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Your application has been submitted successfully!";
            return RedirectToAction(nameof(Details), new { id = gigId });
        }

        // POST: /Gigs/AcceptApplicant (Milestone 3 Workflow)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AcceptApplicant(int gigId, int applicationId)
        {
            var gig = await _context.Gigs
                .Include(g => g.Applications)
                .FirstOrDefaultAsync(g => g.Id == gigId);

            if (gig == null) return NotFound();

            var currentUserId = _userSession.GetCurrentUserId();
            if (gig.UserId != currentUserId)
            {
                TempData["Error"] = "Only the gig owner can accept applicants.";
                return RedirectToAction(nameof(Details), new { id = gigId });
            }

            var application = gig.Applications.FirstOrDefault(a => a.Id == applicationId);
            if (application == null)
            {
                TempData["Error"] = "Application not found.";
                return RedirectToAction(nameof(Details), new { id = gigId });
            }

            // Sets In Progress, assigns applicant, rejects other pending apps
            gig.Status = "In Progress";
            gig.AcceptedApplicantId = application.ApplicantId;
            application.Status = "Accepted";

            foreach (var otherApp in gig.Applications.Where(a => a.Id != applicationId && a.Status == "Pending"))
            {
                otherApp.Status = "Rejected";
            }

            await _context.SaveChangesAsync();
            TempData["Success"] = "Applicant accepted! The gig is now In Progress.";
            return RedirectToAction(nameof(Details), new { id = gigId });
        }

        // POST: /Gigs/CompleteGig
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CompleteGig(int id)
        {
            var gig = await _context.Gigs.FindAsync(id);
            if (gig == null) return NotFound();

            var currentUserId = _userSession.GetCurrentUserId();
            if (gig.UserId != currentUserId)
            {
                TempData["Error"] = "Only the gig owner can mark this gig as completed.";
                return RedirectToAction(nameof(Details), new { id });
            }

            if (gig.Status != "In Progress")
            {
                TempData["Error"] = "A gig can only be marked as Completed from 'In Progress'.";
                return RedirectToAction(nameof(Details), new { id });
            }

            gig.Status = "Completed";
            await _context.SaveChangesAsync();

            TempData["Success"] = "Gig marked as Completed! You can now leave a mutual review.";
            return RedirectToAction(nameof(Details), new { id });
        }

        // POST: /Gigs/CancelGig
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CancelGig(int id)
        {
            var gig = await _context.Gigs.FindAsync(id);
            if (gig == null) return NotFound();

            var currentUserId = _userSession.GetCurrentUserId();
            if (gig.UserId != currentUserId)
            {
                TempData["Error"] = "Only the gig owner can cancel this gig.";
                return RedirectToAction(nameof(Details), new { id });
            }

            if (gig.Status == "Completed")
            {
                TempData["Error"] = "Cannot cancel an already completed gig.";
                return RedirectToAction(nameof(Details), new { id });
            }

            gig.Status = "Cancelled";
            await _context.SaveChangesAsync();

            TempData["Success"] = "Gig has been cancelled.";
            return RedirectToAction(nameof(Details), new { id });
        }

        // GET: /Gigs/MyGigs
        public async Task<IActionResult> MyGigs()
        {
            var currentUserId = _userSession.GetCurrentUserId();
            var currentUser = await _userSession.GetCurrentUserAsync();

            var postedGigs = await _context.Gigs
                .Include(g => g.Applications)
                .Include(g => g.AcceptedApplicant)
                .Where(g => g.UserId == currentUserId)
                .OrderByDescending(g => g.CreatedAt)
                .ToListAsync();

            var myApplications = await _context.Applications
                .Include(a => a.Gig).ThenInclude(g => g!.User)
                .Where(a => a.ApplicantId == currentUserId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var vm = new MyGigsViewModel
            {
                CurrentUser = currentUser,
                PostedGigs = postedGigs,
                MyApplications = myApplications
            };

            return View(vm);
        }
    }
}