namespace MioDesk.API.Entities;

public sealed class FocusSession : BaseEntity
{
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    public int DurationMinutes { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
