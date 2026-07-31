using MioDesk.API.Entities;

namespace MioDesk.API.Repositories;

public interface IScheduleRepository
{
    Task<List<ScheduleEntry>> GetAllAsync(Guid userId);
    Task<ScheduleEntry?> GetAsync(Guid userId, Guid id);
    Task SaveAsync(ScheduleEntry entry);
    Task DeleteAsync(ScheduleEntry entry);
}
