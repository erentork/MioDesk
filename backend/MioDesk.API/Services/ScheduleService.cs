using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Exceptions;
using MioDesk.API.Extensions;
using MioDesk.API.Repositories;

namespace MioDesk.API.Services;

public interface IScheduleService
{
    Task<IReadOnlyList<ScheduleResponse>> GetAllAsync(Guid userId);
    Task<ScheduleResponse> CreateAsync(Guid userId, ScheduleRequest request);
    Task<ScheduleResponse> UpdateAsync(Guid userId, Guid id, ScheduleRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}

public sealed class ScheduleService(IScheduleRepository schedules, ICourseRepository courses) : IScheduleService
{
    public async Task<IReadOnlyList<ScheduleResponse>> GetAllAsync(Guid userId) => (await schedules.GetAllAsync(userId)).Select(x => x.ToResponse()).ToList();

    public async Task<ScheduleResponse> CreateAsync(Guid userId, ScheduleRequest request)
    {
        var (course, start, end) = await ValidateAsync(userId, request);
        var entry = new ScheduleEntry
        {
            UserId = userId, CourseId = course.Id, Course = course, DayOfWeek = request.DayOfWeek,
            StartTime = start, EndTime = end, CustomRoom = request.CustomRoom?.Trim()
        };
        await schedules.SaveAsync(entry);
        return entry.ToResponse();
    }

    public async Task<ScheduleResponse> UpdateAsync(Guid userId, Guid id, ScheduleRequest request)
    {
        var entry = await schedules.GetAsync(userId, id) ?? throw new AppException(404, "Ders programı kaydı bulunamadı.");
        var (course, start, end) = await ValidateAsync(userId, request);
        entry.CourseId = course.Id; entry.Course = course; entry.DayOfWeek = request.DayOfWeek;
        entry.StartTime = start; entry.EndTime = end; entry.CustomRoom = request.CustomRoom?.Trim();
        await schedules.SaveAsync(entry);
        return entry.ToResponse();
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var entry = await schedules.GetAsync(userId, id) ?? throw new AppException(404, "Ders programı kaydı bulunamadı.");
        await schedules.DeleteAsync(entry);
    }

    private async Task<(Course Course, TimeOnly Start, TimeOnly End)> ValidateAsync(Guid userId, ScheduleRequest request)
    {
        var course = await courses.GetAsync(userId, request.CourseId) ?? throw new AppException(404, "Ders bulunamadı.");
        if (!TimeOnly.TryParse(request.StartTime, out var start) || !TimeOnly.TryParse(request.EndTime, out var end))
            throw new AppException(400, "Saat biçimi HH:mm olmalıdır.");
        if (end <= start) throw new AppException(400, "Bitiş saati başlangıç saatinden sonra olmalıdır.");
        return (course, start, end);
    }
}
