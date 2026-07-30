using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Exceptions;
using MioDesk.API.Extensions;
using MioDesk.API.Repositories;

namespace MioDesk.API.Services;

public interface IAcademicTaskService
{
    Task<IReadOnlyList<AcademicTaskResponse>> GetAllAsync(Guid userId, AcademicTaskStatus? status, TaskPriority? priority, Guid? courseId);
    Task<AcademicTaskResponse> CreateAsync(Guid userId, AcademicTaskRequest request);
    Task<AcademicTaskResponse> UpdateAsync(Guid userId, Guid id, AcademicTaskRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}

public sealed class AcademicTaskService(IAcademicTaskRepository tasks, ICourseRepository courses) : IAcademicTaskService
{
    public async Task<IReadOnlyList<AcademicTaskResponse>> GetAllAsync(Guid userId, AcademicTaskStatus? status, TaskPriority? priority, Guid? courseId) =>
        (await tasks.GetAllAsync(userId, status, priority, courseId)).Select(x => x.ToResponse()).ToList();

    public async Task<AcademicTaskResponse> CreateAsync(Guid userId, AcademicTaskRequest request)
    {
        await ValidateCourseAsync(userId, request.CourseId);
        Validate(request);
        var task = new AcademicTask { UserId = userId };
        Apply(task, request);
        await tasks.SaveAsync(task);
        task = await tasks.GetAsync(userId, task.Id) ?? task;
        return task.ToResponse();
    }

    public async Task<AcademicTaskResponse> UpdateAsync(Guid userId, Guid id, AcademicTaskRequest request)
    {
        var task = await tasks.GetAsync(userId, id) ?? throw new AppException(404, "Görev bulunamadı.");
        await ValidateCourseAsync(userId, request.CourseId);
        Validate(request);
        Apply(task, request);
        await tasks.SaveAsync(task);
        task = await tasks.GetAsync(userId, task.Id) ?? task;
        return task.ToResponse();
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var task = await tasks.GetAsync(userId, id) ?? throw new AppException(404, "Görev bulunamadı.");
        await tasks.DeleteAsync(task);
    }

    private async Task ValidateCourseAsync(Guid userId, Guid? courseId)
    {
        if (courseId.HasValue && await courses.GetAsync(userId, courseId.Value) is null)
            throw new AppException(404, "Ders bulunamadı.");
    }

    private static void Validate(AcademicTaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) throw new AppException(400, "Görev başlığı zorunludur.");
        if (request.DueDate == default) throw new AppException(400, "Teslim tarihi zorunludur.");
        if (request.StartDate.HasValue && request.DueDate < request.StartDate.Value)
            throw new AppException(400, "Teslim tarihi başlangıç tarihinden önce olamaz.");
        if (request.Progress is < 0 or > 100) throw new AppException(400, "İlerleme 0 ile 100 arasında olmalıdır.");
    }

    private static void Apply(AcademicTask task, AcademicTaskRequest request)
    {
        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim() ?? string.Empty;
        task.Type = request.Type;
        task.Status = request.Status;
        task.Priority = request.Priority;
        task.StartDate = request.StartDate?.ToUniversalTime();
        task.DueDate = request.DueDate.ToUniversalTime();
        task.Progress = request.Status == AcademicTaskStatus.Completed ? 100 : request.Progress;
        task.Notes = request.Notes?.Trim() ?? string.Empty;
        task.CourseId = request.CourseId;
    }
}
