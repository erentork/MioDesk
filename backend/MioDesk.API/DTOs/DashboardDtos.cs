namespace MioDesk.API.DTOs;

public sealed record DashboardStats(int TotalTasks, int DueThisWeek, int CompletedTasks, int FocusMinutesThisWeek);
public sealed record DashboardResponse(
    DashboardStats Stats,
    IReadOnlyList<ScheduleResponse> WeeklySchedule,
    IReadOnlyList<AcademicTaskResponse> UpcomingTasks,
    IReadOnlyList<ScheduleResponse> TodaySchedule,
    IReadOnlyList<NotificationResponse> Notifications,
    IReadOnlyList<NoteResponse> Notes);

public sealed record StatisticsResponse(
    int TotalTasks, int CompletedTasks, int OverdueTasks, double CompletionRate,
    IReadOnlyDictionary<string, int> TasksByCourse, IReadOnlyDictionary<string, int> TasksByStatus,
    IReadOnlyDictionary<string, int> FocusMinutesByDay);
