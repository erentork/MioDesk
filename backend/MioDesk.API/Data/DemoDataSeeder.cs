using MioDesk.API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Data;

public sealed class DemoDataSeeder(AppDbContext context, IPasswordHasher<User> passwordHasher, IConfiguration configuration)
{
    public async Task SeedAsync()
    {
        if (!configuration.GetValue<bool>("SeedDemoData") || await context.Users.AnyAsync()) return;

        var user = new User
        {
            FullName = "Ayşe Yılmaz",
            Email = "demo@miodesk.local",
            Major = "Bilgisayar Mühendisliği",
            AvatarSeed = "ayse"
        };
        user.PasswordHash = passwordHasher.HashPassword(user, "Demo123!");

        var courses = new[]
        {
            new Course { User = user, Name = "Veritabanı Sistemleri", Code = "CENG301", Instructor = "Dr. Deniz Kaya", Room = "D-201", Color = "#BDEBD6" },
            new Course { User = user, Name = "Yazılım Mühendisliği", Code = "CENG315", Instructor = "Dr. Selin Acar", Room = "D-203", Color = "#F7B1C2" },
            new Course { User = user, Name = "Mobil Programlama", Code = "CENG327", Instructor = "Dr. Bora Işık", Room = "D-204", Color = "#FFD2A4" },
            new Course { User = user, Name = "Ayrık Matematik", Code = "MATH221", Instructor = "Dr. Ece Yalın", Room = "D-105", Color = "#DCC8F2" },
            new Course { User = user, Name = "Bilgisayar Ağları", Code = "CENG309", Instructor = "Dr. Can Tuna", Room = "D-202", Color = "#BFDDF5" }
        };

        context.Users.Add(user);
        context.Courses.AddRange(courses);
        await context.SaveChangesAsync();

        var baseDate = DateTime.UtcNow.Date;
        context.ScheduleEntries.AddRange(
            Entry(user, courses[0], DayOfWeek.Monday, 9, 0, 10, 0),
            Entry(user, courses[3], DayOfWeek.Monday, 11, 0, 12, 0),
            Entry(user, courses[1], DayOfWeek.Monday, 14, 0, 15, 0),
            Entry(user, courses[4], DayOfWeek.Monday, 16, 0, 17, 0),
            Entry(user, courses[2], DayOfWeek.Tuesday, 10, 0, 11, 0),
            Entry(user, courses[0], DayOfWeek.Tuesday, 13, 0, 14, 0),
            Entry(user, courses[3], DayOfWeek.Tuesday, 15, 0, 16, 0),
            Entry(user, courses[1], DayOfWeek.Wednesday, 9, 0, 10, 0),
            Entry(user, courses[4], DayOfWeek.Wednesday, 11, 0, 12, 0),
            Entry(user, courses[2], DayOfWeek.Wednesday, 14, 0, 15, 0),
            Entry(user, courses[0], DayOfWeek.Thursday, 10, 0, 11, 0),
            Entry(user, courses[1], DayOfWeek.Thursday, 13, 0, 14, 0),
            Entry(user, courses[3], DayOfWeek.Thursday, 16, 0, 17, 0),
            Entry(user, courses[2], DayOfWeek.Friday, 9, 0, 10, 0),
            Entry(user, courses[4], DayOfWeek.Friday, 11, 0, 12, 0));

        context.AcademicTasks.AddRange(
            BuildTask(user, courses[0], "Veritabanı - Proje Ödevi", "ER diyagramı ve raporu tamamla.", 2, TaskPriority.High, 35),
            BuildTask(user, courses[1], "Yazılım Mühendisliği - Ödev 2", "UML diyagramlarını hazırla.", 5, TaskPriority.Medium, 60),
            BuildTask(user, courses[2], "Mobil Programlama - Proje", "Uygulama geliştirme sprintini tamamla.", 8, TaskPriority.High, 45),
            BuildTask(user, courses[3], "Ayrık Matematik - Ödev 3", "Mantık ve ispatlar bölümünü çöz.", 11, TaskPriority.Low, 20));

        context.CourseNotes.AddRange(
            new CourseNote { User = user, Course = courses[0], Title = "Stored procedure", Content = "Final projesinde stored procedure kullanılacak.", Color = "#FFF1A8", IsPinned = true },
            new CourseNote { User = user, Course = courses[1], Title = "Sunum taslağı", Content = "Sunum taslağını tamamla ve ekip ile paylaş.", Color = "#FFD1DC", IsPinned = true },
            new CourseNote { User = user, Title = "Hocaya mail", Content = "Proje kapsamı için hocaya mail at.", Color = "#CDEAF6" });

        context.Notifications.AddRange(
            new Notification { User = user, Title = "Yarın sınav var", Message = "Veritabanı dersi için yarın kısa sınavın var.", Kind = NotificationKind.Reminder, ActionUrl = "/tasks" },
            new Notification { User = user, Title = "Teslim yaklaşıyor", Message = "Mobil Programlama projesinin teslimine 3 gün kaldı.", Kind = NotificationKind.Warning, ActionUrl = "/tasks" },
            new Notification { User = user, Title = "Haftalık hedef", Message = "Harika gidiyorsun; haftalık hedefinin çoğunu tamamladın.", Kind = NotificationKind.Success, ActionUrl = "/statistics" });

        context.FocusSessions.AddRange(
            new FocusSession { User = user, StartedAt = baseDate.AddDays(-2).AddHours(12), EndedAt = baseDate.AddDays(-2).AddHours(12.75), DurationMinutes = 45 },
            new FocusSession { User = user, StartedAt = baseDate.AddDays(-1).AddHours(15), EndedAt = baseDate.AddDays(-1).AddHours(16), DurationMinutes = 60 });

        await context.SaveChangesAsync();
    }

    private static ScheduleEntry Entry(User user, Course course, DayOfWeek day, int sh, int sm, int eh, int em) =>
        new() { User = user, Course = course, DayOfWeek = day, StartTime = new TimeOnly(sh, sm), EndTime = new TimeOnly(eh, em) };

    private static AcademicTask BuildTask(User user, Course course, string title, string description, int dueDays, TaskPriority priority, int progress) =>
        new() { User = user, Course = course, Title = title, Description = description, Type = AcademicTaskType.Assignment, Status = AcademicTaskStatus.InProgress, Priority = priority, StartDate = DateTime.UtcNow.Date, DueDate = DateTime.UtcNow.Date.AddDays(dueDays).AddHours(17), Progress = progress };
}
