namespace MioDesk.API.Entities;

public sealed class CourseNote : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Color { get; set; } = "#FFF1A8";
    public bool IsPinned { get; set; }
    public bool IsImportant { get; set; }
    public int SortOrder { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? CourseId { get; set; }
    public Course? Course { get; set; }
}
