namespace MioDesk.API.DTOs;

public sealed record FocusSessionRequest(DateTime StartedAt, DateTime EndedAt);
public sealed record FocusSessionResponse(Guid Id, DateTime StartedAt, DateTime EndedAt, int DurationMinutes);
