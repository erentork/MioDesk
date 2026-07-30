using MioDesk.API.Entities;

namespace MioDesk.API.Repositories;

public interface IAcademicTaskRepository
{
    Task<List<AcademicTask>> GetAllAsync(Guid userId, AcademicTaskStatus? status, TaskPriority? priority, Guid? courseId);
    Task<AcademicTask?> GetAsync(Guid userId, Guid id);
    Task SaveAsync(AcademicTask task);
    Task DeleteAsync(AcademicTask task);
}
