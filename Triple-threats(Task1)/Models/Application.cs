using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusGigPortal.Models
{
    public class Application
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(Gig))]
        public int GigId { get; set; }
        public Gig? Gig { get; set; }

        [Required]
        [ForeignKey(nameof(Applicant))]
        public int ApplicantId { get; set; }
        public User? Applicant { get; set; }

        [Required, MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Rejected"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}