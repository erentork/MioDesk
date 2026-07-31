using MioDesk.API.Entities;

namespace MioDesk.API.Repositories;

public interface INotificationRepository
{
    Task<List<Notification>> GetAllAsync(Guid userId);
    Task<Notification?> GetAsync(Guid userId, Guid id);
    Task SaveChangesAsync();
}
