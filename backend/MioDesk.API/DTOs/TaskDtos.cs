using MioDesk.API.Entities;

namespace MioDesk.API.DTOs;

public sealed record AcademicTaskRequest(
    string Title,
    string Description,
    AcademicTaskType Type,
    AcademicTaskStatus Status,
    TaskPriority Priority,
    DateTime? StartDate,
    DateTime DueDate,
    int Progress,
    string Notes,
    Guid? CourseId);

public sealed record AcademicTaskResponse(
    Guid Id, string Title, string Description, AcademicTaskType Type, AcademicTaskStatus Status,
    TaskPriority Priority, DateTime? StartDate, DateTime DueDate, int Progress, string Notes,
    Guid? CourseId, string? CourseName, string? CourseColor, bool IsOverdue);
