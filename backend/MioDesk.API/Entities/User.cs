namespace MioDesk.API.Entities;

public sealed class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Major { get; set; } = "Bilgisayar Mühendisliği";
    public string AvatarSeed { get; set; } = "sakura";

    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<ScheduleEntry> ScheduleEntries { get; set; } = new List<ScheduleEntry>();
    public ICollection<AcademicTask> AcademicTasks { get; set; } = new List<AcademicTask>();
    public ICollection<CourseNote> CourseNotes { get; set; } = new List<CourseNote>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<FocusSession> FocusSessions { get; set; } = new List<FocusSession>();
}
