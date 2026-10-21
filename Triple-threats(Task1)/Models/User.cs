using Microsoft.AspNetCore.Mvc.ViewEngines;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static System.Net.Mime.MediaTypeNames;

namespace CampusGigPortal.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Major { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Semester { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Bio { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string SkillsRaw { get; set; } = string.Empty;

        [NotMapped]
        public List<string> Skills
        {
            get => string.IsNullOrWhiteSpace(SkillsRaw)
                ? new List<string>()
                : SkillsRaw.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries).ToList();
            set => SkillsRaw = string.Join(", ", value);
        }

        // Navigation Properties
        public ICollection<Gig> GigsPosted { get; set; } = new List<Gig>();
        public ICollection<Gig> GigsAccepted { get; set; } = new List<Gig>();
        public ICollection<Application> Applications { get; set; } = new List<Application>();
        public ICollection<Review> ReviewsGiven { get; set; } = new List<Review>();
        public ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();

        // Dynamically computed average rating from stored reviews (Milestone 4)
        [NotMapped]
        public double AverageRating => ReviewsReceived.Any()
            ? Math.Round(ReviewsReceived.Average(r => r.Rating), 1)
            : 5.0;

        [NotMapped]
        public int CompletedGigsCount => GigsPosted.Count(g => g.Status == "Completed") +
                                         GigsAccepted.Count(g => g.Status == "Completed");
    }
}