using MioDesk.API.DTOs;
using MioDesk.API.Exceptions;
using MioDesk.API.Extensions;
using MioDesk.API.Repositories;

namespace MioDesk.API.Services;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationResponse>> GetAllAsync(Guid userId);
    Task MarkReadAsync(Guid userId, Guid id);
}

public sealed class NotificationService(INotificationRepository notifications) : INotificationService
{
    public async Task<IReadOnlyList<NotificationResponse>> GetAllAsync(Guid userId) =>
        (await notifications.GetAllAsync(userId)).Select(x => x.ToResponse()).ToList();

    public async Task MarkReadAsync(Guid userId, Guid id)
    {
        var notification = await notifications.GetAsync(userId, id) ?? throw new AppException(404, "Bildirim bulunamadı.");
        notification.IsRead = true;
        await notifications.SaveChangesAsync();
    }
}
