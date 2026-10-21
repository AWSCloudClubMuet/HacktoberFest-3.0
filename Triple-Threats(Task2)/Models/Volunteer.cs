using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReliefHub.Models
{
    public class Volunteer
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Skill { get; set; } = "Logistics"; // Medical, Logistics, Cooking, Driving, Counselling

        [ForeignKey(nameof(Camp))]
        public int? CampId { get; set; }
        public Camp? Camp { get; set; }

        [NotMapped]
        public bool IsAssigned => CampId.HasValue && CampId.Value > 0;
    }
}