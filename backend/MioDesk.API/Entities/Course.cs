namespace MioDesk.API.Entities;

public sealed class Course : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Instructor { get; set; } = string.Empty;
    public string Room { get; set; } = string.Empty;
    public string Color { get; set; } = "#F7A8BA";
    public bool IsArchived { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public ICollection<ScheduleEntry> ScheduleEntries { get; set; } = new List<ScheduleEntry>();
    public ICollection<AcademicTask> AcademicTasks { get; set; } = new List<AcademicTask>();
    public ICollection<CourseNote> CourseNotes { get; set; } = new List<CourseNote>();
}
