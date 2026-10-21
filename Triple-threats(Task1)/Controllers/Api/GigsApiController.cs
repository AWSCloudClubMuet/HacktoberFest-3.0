using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models;
using CampusGigPortal.Models.DTOs;

namespace CampusGigPortal.Controllers.Api
{
    [ApiController]
    [Route("api/gigs")]
    public class GigsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GigsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/gigs?category=...&type=...&q=...&payment_type=...&status=...
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GigResponseDto>>> GetGigs(
            [FromQuery] string? category,
            [FromQuery] string? type,
            [FromQuery] string? q,
            [FromQuery] string? payment_type,
            [FromQuery] string? status)
        {
            var query = _context.Gigs
                .Include(g => g.User)
                .Include(g => g.AcceptedApplicant)
                .Include(g => g.Applications)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
                query = query.Where(g => g.Category.ToLower() == category.ToLower());

            if (!string.IsNullOrWhiteSpace(type) && type != "All")
                query = query.Where(g => g.Type.ToLower() == type.ToLower());

            if (!string.IsNullOrWhiteSpace(payment_type) && payment_type != "All")
                query = query.Where(g => g.PaymentType.ToLower() == payment_type.ToLower());

            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.ToLower();
                query = query.Where(g => g.Title.ToLower().Contains(term) || g.Description.ToLower().Contains(term));
            }

            var now = DateTime.Now;
            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                if (status.Equals("Expired", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(g => g.Status == "Expired" || (g.Status == "Open" && g.Deadline < now));
                else if (status.Equals("Open", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(g => g.Status == "Open" && g.Deadline >= now);
                else
                    query = query.Where(g => g.Status.ToLower() == status.ToLower());
            }

            var list = await query
                .OrderByDescending(g => g.CreatedAt)
                .Select(g => new GigResponseDto
                {
                    Id = g.Id,
                    UserId = g.UserId,
                    PosterName = g.User != null ? g.User.Name : "Unknown",
                    Title = g.Title,
                    Description = g.Description,
                    Type = g.Type,
                    Category = g.Category,
                    PaymentType = g.PaymentType,
                    Budget = g.Budget,
                    Deadline = g.Deadline,
                    Status = (g.Status == "Open" && g.Deadline < now) ? "Expired" : g.Status,
                    AcceptedApplicantId = g.AcceptedApplicantId,
                    AcceptedApplicantName = g.AcceptedApplicant != null ? g.AcceptedApplicant.Name : null,
                    ApplicationCount = g.Applications.Count,
                    CreatedAt = g.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/gigs/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GigResponseDto>> GetGig(int id)
        {
            var g = await _context.Gigs
                .Include(g => g.User)
                .Include(g => g.AcceptedApplicant)
                .Include(g => g.Applications)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (g == null) return NotFound(new { message = $"Gig with ID {id} not found." });

            var now = DateTime.Now;
            return Ok(new GigResponseDto
            {
                Id = g.Id,
                UserId = g.UserId,
                PosterName = g.User != null ? g.User.Name : "Unknown",
                Title = g.Title,
                Description = g.Description,
                Type = g.Type,
                Category = g.Category,
                PaymentType = g.PaymentType,
                Budget = g.Budget,
                Deadline = g.Deadline,
                Status = (g.Status == "Open" && g.Deadline < now) ? "Expired" : g.Status,
                AcceptedApplicantId = g.AcceptedApplicantId,
                AcceptedApplicantName = g.AcceptedApplicant != null ? g.AcceptedApplicant.Name : null,
                ApplicationCount = g.Applications.Count,
                CreatedAt = g.CreatedAt
            });
        }

        // POST: /api/gigs
        [HttpPost]
        public async Task<ActionResult<GigResponseDto>> CreateGig([FromBody] CreateGigDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
            if (!userExists) return BadRequest(new { message = $"User with ID {dto.UserId} does not exist." });

            var gig = new Gig
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Description = dto.Description,
                Type = dto.Type,
                Category = dto.Category,
                PaymentType = dto.PaymentType,
                Budget = dto.PaymentType == "Paid" ? dto.Budget : null,
                Deadline = dto.Deadline,
                Status = "Open",
                CreatedAt = DateTime.Now
            };

            _context.Gigs.Add(gig);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGig), new { id = gig.Id }, gig);
        }

        // PATCH: /api/gigs/{id}
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateGigStatus(int id, [FromBody] UpdateGigStatusDto dto)
        {
            var gig = await _context.Gigs.FindAsync(id);
            if (gig == null) return NotFound(new { message = $"Gig with ID {id} not found." });

            if (dto.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase) && gig.Status != "In Progress")
            {
                return BadRequest(new { message = "Gig can only be transitioned to Completed from 'In Progress'." });
            }

            gig.Status = dto.Status;
            if (dto.AcceptedApplicantId.HasValue) gig.AcceptedApplicantId = dto.AcceptedApplicantId.Value;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Gig status updated to {gig.Status}.", gigId = gig.Id });
        }
    }
}