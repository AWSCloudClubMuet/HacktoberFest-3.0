using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReliefHub.Models
{
    public class Donation
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(20)]
        public string Type { get; set; } = "Cash"; // "Cash" or "In-Kind"

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountOrQuantity { get; set; }

        [ForeignKey(nameof(InventoryItem))]
        public int? ItemId { get; set; }
        public InventoryItem? Item { get; set; }

        [Required, MaxLength(60)]
        public string Category { get; set; } = "General Relief"; // Food, Water, Medicine, Shelter, Cash Fund

        public DateTime DonatedAt { get; set; } = DateTime.UtcNow;
    }
}