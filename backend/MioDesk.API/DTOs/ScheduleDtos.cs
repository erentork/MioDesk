namespace MioDesk.API.DTOs;

public sealed record ScheduleRequest(Guid CourseId, DayOfWeek DayOfWeek, string StartTime, string EndTime, string? CustomRoom);
public sealed record ScheduleResponse(Guid Id, Guid CourseId, string CourseName, string CourseCode, string CourseColor, DayOfWeek DayOfWeek, string StartTime, string EndTime, string Room);
