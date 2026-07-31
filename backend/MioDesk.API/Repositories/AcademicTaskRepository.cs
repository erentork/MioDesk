using MioDesk.API.Data;
using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Repositories;

public sealed class AcademicTaskRepository(AppDbContext context) : IAcademicTaskRepository
{
    public Task<List<AcademicTask>> GetAllAsync(Guid userId, AcademicTaskStatus? status, TaskPriority? priority, Guid? courseId)
    {
        var query = context.AcademicTasks.AsNoTracking().Include(x => x.Course).Where(x => x.UserId == userId);
        if (status.HasValue) query = query.Where(x => x.Status == status);
        if (priority.HasValue) query = query.Where(x => x.Priority == priority);
        if (courseId.HasValue) query = query.Where(x => x.CourseId == courseId);
        return query.OrderBy(x => x.Status == AcademicTaskStatus.Completed).ThenBy(x => x.DueDate).ToListAsync();
    }

    public Task<AcademicTask?> GetAsync(Guid userId, Guid id) => context.AcademicTasks.Include(x => x.Course).FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id);

    public async Task SaveAsync(AcademicTask task)
    {
        if (context.Entry(task).State == EntityState.Detached) context.AcademicTasks.Add(task);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(AcademicTask task)
    {
        context.AcademicTasks.Remove(task);
        await context.SaveChangesAsync();
    }
}
