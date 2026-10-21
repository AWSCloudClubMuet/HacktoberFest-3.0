using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReliefHub.Models
{
    public class Need
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(Camp))]
        public int CampId { get; set; }
        public Camp? Camp { get; set; }

        [Required]
        [ForeignKey(nameof(InventoryItem))]
        public int InventoryItemId { get; set; }
        public InventoryItem? InventoryItem { get; set; }

        [Range(1, 1000000)]
        public int RequiredQuantity { get; set; }

        [Required, MaxLength(20)]
        public string Priority { get; set; } = "High"; // High, Medium, Low

        [Range(0, 1000000)]
        public int FulfilledQuantity { get; set; }

        public ICollection<Dispatch> Dispatches { get; set; } = new List<Dispatch>();

        [NotMapped]
        public double FulfilmentPercentage => RequiredQuantity > 0
            ? Math.Min(100.0, Math.Round((double)FulfilledQuantity / RequiredQuantity * 100, 1))
            : 100.0;

        [NotMapped]
        public int ReservedQuantity => Dispatches
            .Where(d => d.Status == "Pending" || d.Status == "In Transit")
            .Sum(d => d.Quantity);

        [NotMapped]
        public int RemainingUnreservedQuantity => Math.Max(0, RequiredQuantity - FulfilledQuantity - ReservedQuantity);

        [NotMapped]
        public bool IsCriticalGap => Priority == "High" && FulfilmentPercentage < 40.0;
    }
}