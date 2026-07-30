using MioDesk.API.Entities;

namespace MioDesk.API.Repositories;

public interface INoteRepository
{
    Task<List<CourseNote>> GetAllAsync(Guid userId);
    Task<CourseNote?> GetAsync(Guid userId, Guid id);
    Task SaveAsync(CourseNote note);
    Task DeleteAsync(CourseNote note);
}
