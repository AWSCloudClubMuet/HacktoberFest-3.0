using Microsoft.EntityFrameworkCore;
using ReliefHub.Models;

namespace ReliefHub.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Camp> Camps => Set<Camp>();
        public DbSet<InventoryItem> Inventory => Set<InventoryItem>();
        public DbSet<Need> Needs => Set<Need>();
        public DbSet<Dispatch> Dispatches => Set<Dispatch>();
        public DbSet<Donation> Donations => Set<Donation>();
        public DbSet<Volunteer> Volunteers => Set<Volunteer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Need>()
                .HasOne(n => n.Camp)
                .WithMany(c => c.Needs)
                .HasForeignKey(n => n.CampId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Need>()
                .HasOne(n => n.InventoryItem)
                .WithMany(i => i.Needs)
                .HasForeignKey(n => n.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Dispatch>()
                .HasOne(d => d.Camp)
                .WithMany(c => c.Dispatches)
                .HasForeignKey(d => d.CampId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Dispatch>()
                .HasOne(d => d.Need)
                .WithMany(n => n.Dispatches)
                .HasForeignKey(d => d.NeedId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Volunteer>()
                .HasOne(v => v.Camp)
                .WithMany(c => c.Volunteers)
                .HasForeignKey(v => v.CampId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}