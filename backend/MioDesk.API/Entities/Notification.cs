namespace MioDesk.API.Entities;

public sealed class Notification : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationKind Kind { get; set; }
    public bool IsRead { get; set; }
    public string? ActionUrl { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
