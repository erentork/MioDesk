using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<ScheduleEntry> ScheduleEntries => Set<ScheduleEntry>();
    public DbSet<AcademicTask> AcademicTasks => Set<AcademicTask>();
    public DbSet<CourseNote> CourseNotes => Set<CourseNote>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<FocusSession> FocusSessions => Set<FocusSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.FullName).HasMaxLength(120);
            entity.Property(x => x.Email).HasMaxLength(180);
            entity.Property(x => x.Major).HasMaxLength(160);
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.Code }).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(140);
            entity.Property(x => x.Code).HasMaxLength(40);
            entity.Property(x => x.Color).HasMaxLength(16);
            entity.HasOne(x => x.User).WithMany(x => x.Courses).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ScheduleEntry>()
            .HasOne(x => x.User).WithMany(x => x.ScheduleEntries).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ScheduleEntry>()
            .HasOne(x => x.Course).WithMany(x => x.ScheduleEntries).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AcademicTask>()
            .HasOne(x => x.User).WithMany(x => x.AcademicTasks).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<AcademicTask>()
            .HasOne(x => x.Course).WithMany(x => x.AcademicTasks).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CourseNote>()
            .HasOne(x => x.User).WithMany(x => x.CourseNotes).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<CourseNote>()
            .HasOne(x => x.Course).WithMany(x => x.CourseNotes).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notification>()
            .HasOne(x => x.User).WithMany(x => x.Notifications).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<FocusSession>()
            .HasOne(x => x.User).WithMany(x => x.FocusSessions).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
