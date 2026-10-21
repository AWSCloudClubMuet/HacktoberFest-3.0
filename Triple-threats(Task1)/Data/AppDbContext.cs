using CampusGigPortal.Models;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace CampusGigPortal.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Gig> Gigs => Set<Gig>();
        public DbSet<Application> Applications => Set<Application>();
        public DbSet<Review> Reviews => Set<Review>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Gigs FKs
            modelBuilder.Entity<Gig>()
                .HasOne(g => g.User)
                .WithMany(u => u.GigsPosted)
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Gig>()
                .HasOne(g => g.AcceptedApplicant)
                .WithMany(u => u.GigsAccepted)
                .HasForeignKey(g => g.AcceptedApplicantId)
                .OnDelete(DeleteBehavior.Restrict);

            // Applications FKs & Unique Rule
            modelBuilder.Entity<Application>()
                .HasOne(a => a.Gig)
                .WithMany(g => g.Applications)
                .HasForeignKey(a => a.GigId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Application>()
                .HasOne(a => a.Applicant)
                .WithMany(u => u.Applications)
                .HasForeignKey(a => a.ApplicantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Application>()
                .HasIndex(a => new { a.GigId, a.ApplicantId })
                .IsUnique();

            // Reviews FKs & Unique Rule
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Gig)
                .WithMany(g => g.Reviews)
                .HasForeignKey(r => r.GigId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Reviewer)
                .WithMany(u => u.ReviewsGiven)
                .HasForeignKey(r => r.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Reviewee)
                .WithMany(u => u.ReviewsReceived)
                .HasForeignKey(r => r.RevieweeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasIndex(r => new { r.GigId, r.ReviewerId })
                .IsUnique();
        }
    }
}