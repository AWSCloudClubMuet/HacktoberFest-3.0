using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models;
using CampusGigPortal.Models.ViewModels;
using CampusGigPortal.Services;

namespace CampusGigPortal.Controllers
{
    public class ReviewsController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserSessionService _userSession;

        public ReviewsController(ApplicationDbContext context, IUserSessionService userSession)
        {
            _context = context;
            _userSession = userSession;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ReviewCreateViewModel model)
        {
            var gig = await _context.Gigs.Include(g => g.Reviews).FirstOrDefaultAsync(g => g.Id == model.GigId);
            if (gig == null) return NotFound();

            var currentUserId = _userSession.GetCurrentUserId();

            if (gig.Status != "Completed")
            {
                TempData["Error"] = "Reviews can only be submitted for completed gigs.";
                return RedirectToAction("Details", "Gigs", new { id = model.GigId });
            }

            bool isOwner = gig.UserId == currentUserId;
            bool isAcceptedApplicant = gig.AcceptedApplicantId == currentUserId;

            if (!isOwner && !isAcceptedApplicant)
            {
                TempData["Error"] = "Only the gig owner and the accepted applicant can review each other.";
                return RedirectToAction("Details", "Gigs", new { id = model.GigId });
            }

            int expectedRevieweeId = isOwner ? (gig.AcceptedApplicantId ?? 0) : gig.UserId;
            if (expectedRevieweeId == 0 || model.RevieweeId != expectedRevieweeId)
            {
                TempData["Error"] = "Invalid review recipient.";
                return RedirectToAction("Details", "Gigs", new { id = model.GigId });
            }

            var existingReview = await _context.Reviews.AnyAsync(r => r.GigId == model.GigId && r.ReviewerId == currentUserId);
            if (existingReview)
            {
                TempData["Error"] = "You have already submitted a review for this gig.";
                return RedirectToAction("Details", "Gigs", new { id = model.GigId });
            }

            var review = new Review
            {
                GigId = model.GigId,
                ReviewerId = currentUserId,
                RevieweeId = model.RevieweeId,
                Rating = model.Rating,
                Comment = model.Comment.Trim(),
                CreatedAt = DateTime.Now
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            TempData["Success"] = "Review submitted! Thank you for building campus reputation.";
            return RedirectToAction("Details", "Gigs", new { id = model.GigId });
        }
    }
}