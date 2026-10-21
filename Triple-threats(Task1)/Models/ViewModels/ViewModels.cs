using CampusGigPortal.Models;
using System.ComponentModel.DataAnnotations;

namespace CampusGigPortal.Models.ViewModels
{
    public class DashboardViewModel
    {
        public User CurrentUser { get; set; } = null!;
        public int TotalGigs { get; set; }
        public int ActiveGigs { get; set; }
        public int CompletedGigs { get; set; }
        public int TotalStudents { get; set; }
        public List<Gig> RecentGigs { get; set; } = new();
        public Dictionary<string, int> CategoryCounts { get; set; } = new();
    }

    public class GigIndexViewModel
    {
        public string? Category { get; set; }
        public string? Type { get; set; }
        public string? PaymentType { get; set; }
        public string? Q { get; set; }
        public decimal? MinBudget { get; set; }
        public decimal? MaxBudget { get; set; }
        public string? Status { get; set; }

        public List<Gig> Gigs { get; set; } = new();
        public int TotalResults => Gigs.Count;
    }

    public class GigCreateViewModel
    {
        [Required(ErrorMessage = "Title is required"), MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Description is required"), MaxLength(3000)]
        public string Description { get; set; } = string.Empty;

        [Required(ErrorMessage = "Gig type is required")]
        public string Type { get; set; } = "Requesting"; // "Offering" or "Requesting"

        [Required(ErrorMessage = "Category is required")]
        public string Category { get; set; } = "Programming";

        [Required(ErrorMessage = "Payment type is required")]
        public string PaymentType { get; set; } = "Paid"; // "Paid", "SkillSwap", "Free"

        [Range(0, 10000, ErrorMessage = "Budget must be greater than or equal to 0")]
        public decimal? Budget { get; set; }

        [Required(ErrorMessage = "Deadline is required")]
        [DataType(DataType.Date)]
        public DateTime Deadline { get; set; } = DateTime.Today.AddDays(7);
    }

    public class GigDetailViewModel
    {
        public Gig Gig { get; set; } = null!;
        public User CurrentUser { get; set; } = null!;
        public bool IsOwner => Gig.UserId == CurrentUser.Id;
        public bool HasApplied { get; set; }
        public Application? UserApplication { get; set; }
        public bool CanReview { get; set; }
        public Review? UserReview { get; set; }
        public Review? PeerReview { get; set; }
        public List<Application> Applications { get; set; } = new();
        public List<Review> Reviews { get; set; } = new();
    }

    public class ProfileViewModel
    {
        public User ProfileUser { get; set; } = null!;
        public User CurrentUser { get; set; } = null!;
        public bool IsCurrentUser => ProfileUser.Id == CurrentUser.Id;
        public List<Gig> PostedGigs { get; set; } = new();
        public List<Gig> CompletedGigs { get; set; } = new();
        public List<Review> ReviewsReceived { get; set; } = new();
        public double AverageRating { get; set; }
    }

    public class MyGigsViewModel
    {
        public User CurrentUser { get; set; } = null!;
        public List<Gig> PostedGigs { get; set; } = new();
        public List<Application> MyApplications { get; set; } = new();
    }

    public class ReviewCreateViewModel
    {
        [Required]
        public int GigId { get; set; }

        [Required]
        public int RevieweeId { get; set; }

        [Required, Range(1, 5, ErrorMessage = "Please select a rating between 1 and 5")]
        public int Rating { get; set; } = 5;

        [Required(ErrorMessage = "Please leave a constructive comment"), MaxLength(1000)]
        public string Comment { get; set; } = string.Empty;
    }
}