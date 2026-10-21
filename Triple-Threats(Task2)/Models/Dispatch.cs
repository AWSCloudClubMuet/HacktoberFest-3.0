using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReliefHub.Models
{
    public class Dispatch
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(Camp))]
        public int CampId { get; set; }
        public Camp? Camp { get; set; }

        [Required]
        [ForeignKey(nameof(Need))]
        public int NeedId { get; set; }
        public Need? Need { get; set; }

        [Range(1, 1000000)]
        public int Quantity { get; set; }

        [Required, MaxLength(30)]
        public string Status { get; set; } = "Pending"; // Pending, In Transit, Delivered, Cancelled

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}