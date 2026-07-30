using MioDesk.API.DTOs;
using MioDesk.API.Entities;

namespace MioDesk.API.Extensions;

public static class MappingExtensions
{
    public static UserResponse ToResponse(this User user) => new(user.Id, user.FullName, user.Email, user.Major, user.AvatarSeed);

    public static CourseResponse ToResponse(this Course course) => new(course.Id, course.Name, VisibleCourseCode(course.Code), course.Instructor, course.Room, course.Color, course.IsArchived);

    public static ScheduleResponse ToResponse(this ScheduleEntry entry) => new(
        entry.Id, entry.CourseId, entry.Course.Name, VisibleCourseCode(entry.Course.Code), entry.Course.Color, entry.DayOfWeek,
        entry.StartTime.ToString("HH:mm"), entry.EndTime.ToString("HH:mm"), entry.CustomRoom ?? entry.Course.Room);

    public static AcademicTaskResponse ToResponse(this AcademicTask task) => new(
        task.Id, task.Title, task.Description, task.Type, task.Status, task.Priority, task.StartDate, task.DueDate,
        task.Progress, task.Notes, task.CourseId, task.Course?.Name, task.Course?.Color,
        task.Status != AcademicTaskStatus.Completed && task.DueDate < DateTime.UtcNow);

    public static NoteResponse ToResponse(this CourseNote note) => new(
        note.Id, note.Title, note.Content, note.Color, note.IsPinned, note.IsImportant, note.SortOrder,
        note.CourseId, note.Course?.Name, note.UpdatedAt);

    public static NotificationResponse ToResponse(this Notification notification) => new(
        notification.Id, notification.Title, notification.Message, notification.Kind, notification.IsRead,
        notification.ActionUrl, notification.CreatedAt);

    private const string OptionalCourseCodePrefix = "~M";

    private static string VisibleCourseCode(string code)
    {
        return code.StartsWith(
            OptionalCourseCodePrefix,
            StringComparison.Ordinal
        )
            ? string.Empty
            : code;
    }
}
