namespace MioDesk.API.DTOs;

public sealed record CourseRequest(string Name, string Code, string Instructor, string Room, string Color);
public sealed record CourseResponse(Guid Id, string Name, string Code, string Instructor, string Room, string Color, bool IsArchived);
