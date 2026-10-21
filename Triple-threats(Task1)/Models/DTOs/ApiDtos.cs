using System.ComponentModel.DataAnnotations;

namespace CampusGigPortal.Models.DTOs
{
    public class CreateGigDto
    {
        [Required]
        public int UserId { get; set; }

        [Required, MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(3000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = "Requesting";

        [Required]
        public string Category { get; set; } = "Programming";

        [Required]
        public string PaymentType { get; set; } = "Paid";

        public decimal? Budget { get; set; }

        [Required]
        public DateTime Deadline { get; set; }
    }

    public class UpdateGigStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
        public int? AcceptedApplicantId { get; set; }
    }

    public class CreateApplicationDto
    {
        [Required]
        public int GigId { get; set; }

        [Required]
        public int ApplicantId { get; set; }

        [Required, MaxLength(1000)]
        public string Message { get; set; } = string.Empty;
    }

    public class UpdateApplicationStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class CreateReviewDto
    {
        [Required]
        public int GigId { get; set; }

        [Required]
        public int ReviewerId { get; set; }

        [Required]
        public int RevieweeId { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [Required, MaxLength(1000)]
        public string Comment { get; set; } = string.Empty;
    }

    public class GigResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string PosterName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string PaymentType { get; set; } = string.Empty;
        public decimal? Budget { get; set; }
        public DateTime Deadline { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? AcceptedApplicantId { get; set; }
        public string? AcceptedApplicantName { get; set; }
        public int ApplicationCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}