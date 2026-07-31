namespace MioDesk.API.DTOs;

public sealed record NoteRequest(string Title, string Content, string Color, bool IsPinned, bool IsImportant, int SortOrder, Guid? CourseId);
public sealed record NoteResponse(Guid Id, string Title, string Content, string Color, bool IsPinned, bool IsImportant, int SortOrder, Guid? CourseId, string? CourseName, DateTime UpdatedAt);
