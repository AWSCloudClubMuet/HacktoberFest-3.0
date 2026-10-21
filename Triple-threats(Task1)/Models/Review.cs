using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CampusGigPortal.Models
{
    public class Review
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(Gig))]
        public int GigId { get; set; }
        public Gig? Gig { get; set; }

        [Required]
        [ForeignKey(nameof(Reviewer))]
        public int ReviewerId { get; set; }
        public User? Reviewer { get; set; }

        [Required]
        [ForeignKey(nameof(Reviewee))]
        public int RevieweeId { get; set; }
        public User? Reviewee { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [Required, MaxLength(1000)]
        public string Comment { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}