using Microsoft.AspNetCore.Mvc.ViewEngines;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static System.Net.Mime.MediaTypeNames;

namespace CampusGigPortal.Models
{
    public class Gig
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required, MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(3000)]
        public string Description { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Type { get; set; } = "Requesting"; // "Offering" or "Requesting"

        [Required, MaxLength(50)]
        public string Category { get; set; } = "Programming"; // "Programming", "Design", "Writing", "Tutoring"

        [Required, MaxLength(20)]
        public string PaymentType { get; set; } = "Paid"; // "Paid", "SkillSwap", "Free"

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Budget { get; set; }

        [Required]
        public DateTime Deadline { get; set; }

        [Required, MaxLength(20)]
        public string Status { get; set; } = "Open"; // "Open", "In Progress", "Completed", "Expired", "Cancelled"

        [ForeignKey(nameof(AcceptedApplicant))]
        public int? AcceptedApplicantId { get; set; }
        public User? AcceptedApplicant { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        [NotMapped]
        public string EffectiveStatus
        {
            get
            {
                if (Status == "Open" && Deadline < DateTime.Now)
                {
                    return "Expired";
                }
                return Status;
            }
        }
    }
}