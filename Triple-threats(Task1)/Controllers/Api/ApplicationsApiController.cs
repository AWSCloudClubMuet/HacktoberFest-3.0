using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
using CampusGigPortal.Models;
using CampusGigPortal.Models.DTOs;

namespace CampusGigPortal.Controllers.Api
{
    [ApiController]
    [Route("api/applications")]
    public class ApplicationsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ApplicationsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/applications?gigId=...&applicantId=...
        [HttpGet]
        public async Task<IActionResult> GetApplications([FromQuery] int? gigId, [FromQuery] int? applicantId)
        {
            var query = _context.Applications.Include(a => a.Applicant).Include(a => a.Gig).AsQueryable();

            if (gigId.HasValue) query = query.Where(a => a.GigId == gigId.Value);
            if (applicantId.HasValue) query = query.Where(a => a.ApplicantId == applicantId.Value);

            var list = await query
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.Id,
                    a.GigId,
                    GigTitle = a.Gig != null ? a.Gig.Title : "",
                    a.ApplicantId,
                    ApplicantName = a.Applicant != null ? a.Applicant.Name : "",
                    a.Message,
                    a.Status,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST: /api/applications
        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] CreateApplicationDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var gig = await _context.Gigs.FindAsync(dto.GigId);
            if (gig == null) return NotFound(new { message = $"Gig with ID {dto.GigId} not found." });

            if (gig.UserId == dto.ApplicantId)
                return BadRequest(new { message = "User cannot apply to their own gig." });

            if (gig.EffectiveStatus != "Open")
                return BadRequest(new { message = $"Cannot apply to gig with status '{gig.EffectiveStatus}'." });

            var exists = await _context.Applications.AnyAsync(a => a.GigId == dto.GigId && a.ApplicantId == dto.ApplicantId);
            if (exists) return BadRequest(new { message = "Applicant has already applied to this gig." });

            var application = new Application
            {
                GigId = dto.GigId,
                ApplicantId = dto.ApplicantId,
                Message = dto.Message,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.Applications.Add(application);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetApplications), new { gigId = application.GigId }, application);
        }

        // PATCH: /api/applications/{id}
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusDto dto)
        {
            var application = await _context.Applications.Include(a => a.Gig).FirstOrDefaultAsync(a => a.Id == id);
            if (application == null) return NotFound(new { message = $"Application {id} not found." });

            application.Status = dto.Status;

            if (dto.Status.Equals("Accepted", StringComparison.OrdinalIgnoreCase) && application.Gig != null)
            {
                application.Gig.Status = "In Progress";
                application.Gig.AcceptedApplicantId = application.ApplicantId;

                var otherPending = await _context.Applications
                    .Where(a => a.GigId == application.GigId && a.Id != application.Id && a.Status == "Pending")
                    .ToListAsync();

                foreach (var other in otherPending) other.Status = "Rejected";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Application status updated to {application.Status}." });
        }
    }
}