using MioDesk.API.Data;
using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Repositories;

public sealed class NotificationRepository(AppDbContext context) : INotificationRepository
{
    public Task<List<Notification>> GetAllAsync(Guid userId) => context.Notifications.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).ToListAsync();
    public Task<Notification?> GetAsync(Guid userId, Guid id) => context.Notifications.FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id);
    public Task SaveChangesAsync() => context.SaveChangesAsync();
}
