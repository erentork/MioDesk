using MioDesk.API.Entities;

namespace MioDesk.API.DTOs;

public sealed record NotificationResponse(Guid Id, string Title, string Message, NotificationKind Kind, bool IsRead, string? ActionUrl, DateTime CreatedAt);
