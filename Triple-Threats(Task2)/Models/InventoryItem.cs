using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReliefHub.Models
{
    public class InventoryItem
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(60)]
        public string Category { get; set; } = "Food"; // Food, Water & Sanitation, Medicine, Shelter

        [Required, MaxLength(30)]
        public string Unit { get; set; } = "Bags"; // Bags, Litres, Kits, Boxes, Tents

        [Range(0, 1000000)]
        public int Stock { get; set; }

        [Range(0, 1000000)]
        public int ReorderLevel { get; set; }

        public ICollection<Need> Needs { get; set; } = new List<Need>();

        [NotMapped]
        public bool IsLowStock => Stock <= ReorderLevel;
    }
}