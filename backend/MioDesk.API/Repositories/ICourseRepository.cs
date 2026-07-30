using MioDesk.API.Entities;

namespace MioDesk.API.Repositories;

public interface ICourseRepository
{
    Task<List<Course>> GetAllAsync(Guid userId);
    Task<Course?> GetAsync(Guid userId, Guid id);
    Task<bool> CodeExistsAsync(Guid userId, string code, Guid? exceptId = null);
    Task SaveAsync(Course course);
    Task DeleteAsync(Course course);
}
