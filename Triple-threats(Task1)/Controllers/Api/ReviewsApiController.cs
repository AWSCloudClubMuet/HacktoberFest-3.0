using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models;
using CampusGigPortal.Models.DTOs;

namespace CampusGigPortal.Controllers.Api
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/reviews?gigId=...&userId=...
        [HttpGet]
        public async Task<IActionResult> GetReviews([FromQuery] int? gigId, [FromQuery] int? userId)
        {
            var query = _context.Reviews.Include(r => r.Reviewer).Include(r => r.Reviewee).Include(r => r.Gig).AsQueryable();

            if (gigId.HasValue) query = query.Where(r => r.GigId == gigId.Value);
            if (userId.HasValue) query = query.Where(r => r.RevieweeId == userId.Value || r.ReviewerId == userId.Value);

            var list = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.GigId,
                    GigTitle = r.Gig != null ? r.Gig.Title : "",
                    r.ReviewerId,
                    ReviewerName = r.Reviewer != null ? r.Reviewer.Name : "",
                    r.RevieweeId,
                    RevieweeName = r.Reviewee != null ? r.Reviewee.Name : "",
                    r.Rating,
                    r.Comment,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST: /api/reviews
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var gig = await _context.Gigs.FindAsync(dto.GigId);
            if (gig == null) return NotFound(new { message = $"Gig {dto.GigId} not found." });

            if (gig.Status != "Completed")
                return BadRequest(new { message = "Reviews can only be posted for Completed gigs." });

            bool validPair = (gig.UserId == dto.ReviewerId && gig.AcceptedApplicantId == dto.RevieweeId) ||
                             (gig.AcceptedApplicantId == dto.ReviewerId && gig.UserId == dto.RevieweeId);

            if (!validPair)
                return BadRequest(new { message = "Reviewer and Reviewee must be the gig owner and accepted applicant." });

            var alreadyReviewed = await _context.Reviews.AnyAsync(r => r.GigId == dto.GigId && r.ReviewerId == dto.ReviewerId);
            if (alreadyReviewed)
                return BadRequest(new { message = "Reviewer has already reviewed this gig." });

            var review = new Review
            {
                GigId = dto.GigId,
                ReviewerId = dto.ReviewerId,
                RevieweeId = dto.RevieweeId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.Now
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetReviews), new { gigId = review.GigId }, review);
        }
    }
}