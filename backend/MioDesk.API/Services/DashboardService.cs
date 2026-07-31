using MioDesk.API.Data;
using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Extensions;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Services;

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync(Guid userId);
    Task<StatisticsResponse> GetStatisticsAsync(Guid userId);
}

public sealed class DashboardService(AppDbContext context) : IDashboardService
{
    public async Task<DashboardResponse> GetAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var weekEnd = now.Date.AddDays(7);
        var weekStart = now.Date.AddDays(-((int)now.DayOfWeek + 6) % 7);

        var tasks = await context.AcademicTasks.AsNoTracking().Include(x => x.Course).Where(x => x.UserId == userId).ToListAsync();
        var schedule = await context.ScheduleEntries.AsNoTracking().Include(x => x.Course).Where(x => x.UserId == userId).OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).ToListAsync();
        var notifications = await context.Notifications.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).Take(5).ToListAsync();
        var notes = await context.CourseNotes
            .AsNoTracking()
            .Include(x => x.Course)
            .Where(x => x.UserId == userId && x.IsImportant)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.UpdatedAt)
            .Take(3)
            .ToListAsync();
        var focusMinutes = await context.FocusSessions.AsNoTracking().Where(x => x.UserId == userId && x.StartedAt >= weekStart).SumAsync(x => (int?)x.DurationMinutes) ?? 0;

        var stats = new DashboardStats(
            tasks.Count,
            tasks.Count(x => x.Status != AcademicTaskStatus.Completed && x.DueDate >= now && x.DueDate < weekEnd),
            tasks.Count(x => x.Status == AcademicTaskStatus.Completed),
            focusMinutes);

        return new DashboardResponse(
            stats,
            schedule.Select(x => x.ToResponse()).ToList(),
            tasks.Where(x => x.Status != AcademicTaskStatus.Completed).OrderBy(x => x.DueDate).Take(6).Select(x => x.ToResponse()).ToList(),
            schedule.Where(x => x.DayOfWeek == DateTime.Now.DayOfWeek).Select(x => x.ToResponse()).ToList(),
            notifications.Select(x => x.ToResponse()).ToList(),
            notes.Select(x => x.ToResponse()).ToList());
    }

    public async Task<StatisticsResponse> GetStatisticsAsync(Guid userId)
    {
        var tasks = await context.AcademicTasks.AsNoTracking().Include(x => x.Course).Where(x => x.UserId == userId).ToListAsync();
        var focus = await context.FocusSessions.AsNoTracking().Where(x => x.UserId == userId && x.StartedAt >= DateTime.UtcNow.Date.AddDays(-6)).ToListAsync();
        var completed = tasks.Count(x => x.Status == AcademicTaskStatus.Completed);
        var overdue = tasks.Count(x => x.Status != AcademicTaskStatus.Completed && x.DueDate < DateTime.UtcNow);
        var byCourse = tasks.GroupBy(x => x.Course?.Name ?? "Kişisel").ToDictionary(x => x.Key, x => x.Count());
        var byStatus = tasks.GroupBy(x => x.Status.ToString()).ToDictionary(x => x.Key, x => x.Count());
        var byDay = Enumerable.Range(0, 7)
            .Select(i => DateTime.UtcNow.Date.AddDays(-6 + i))
            .ToDictionary(d => d.ToString("yyyy-MM-dd"), d => focus.Where(x => x.StartedAt.Date == d).Sum(x => x.DurationMinutes));

        return new StatisticsResponse(tasks.Count, completed, overdue, tasks.Count == 0 ? 0 : Math.Round(completed * 100d / tasks.Count, 1), byCourse, byStatus, byDay);
    }
}
