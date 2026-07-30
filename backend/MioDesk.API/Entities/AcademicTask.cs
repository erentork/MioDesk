namespace MioDesk.API.Entities;

public sealed class AcademicTask : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AcademicTaskType Type { get; set; }
    public AcademicTaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public int Progress { get; set; }
    public string Notes { get; set; } = string.Empty;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? CourseId { get; set; }
    public Course? Course { get; set; }
}
