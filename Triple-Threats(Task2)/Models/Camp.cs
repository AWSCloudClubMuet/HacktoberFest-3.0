using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ReliefHub.Models
{
    public class Camp
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(80)]
        public string District { get; set; } = string.Empty;

        [Range(1, 100000)]
        public int Capacity { get; set; }

        [Range(0, 100000)]
        public int CurrentFamilies { get; set; }

        [Required, MaxLength(30)]
        public string Status { get; set; } = "Active"; // "Active", "Full", "Closed"

        public ICollection<Need> Needs { get; set; } = new List<Need>();
        public ICollection<Dispatch> Dispatches { get; set; } = new List<Dispatch>();
        public ICollection<Volunteer> Volunteers { get; set; } = new List<Volunteer>();

        [NotMapped]
        public string EffectiveStatus
        {
            get
            {
                if (Status == "Closed") return "Closed";
                if (CurrentFamilies >= Capacity) return "Full";
                return Status;
            }
        }
    }
}