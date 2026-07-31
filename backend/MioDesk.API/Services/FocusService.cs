using MioDesk.API.Data;
using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Services;

public interface IFocusService
{
    Task<FocusSessionResponse> CreateAsync(Guid userId, FocusSessionRequest request);
    Task<IReadOnlyList<FocusSessionResponse>> GetRecentAsync(Guid userId);
}

public sealed class FocusService(AppDbContext context) : IFocusService
{
    public async Task<FocusSessionResponse> CreateAsync(Guid userId, FocusSessionRequest request)
    {
        var started = request.StartedAt.ToUniversalTime();
        var ended = request.EndedAt.ToUniversalTime();
        if (ended <= started) throw new AppException(400, "Bitiş zamanı başlangıçtan sonra olmalıdır.");
        var duration = (int)Math.Round((ended - started).TotalMinutes);
        if (duration is < 1 or > 480) throw new AppException(400, "Odak oturumu 1 ile 480 dakika arasında olmalıdır.");
        var session = new FocusSession { UserId = userId, StartedAt = started, EndedAt = ended, DurationMinutes = duration };
        context.FocusSessions.Add(session);
        await context.SaveChangesAsync();
        return new FocusSessionResponse(session.Id, session.StartedAt, session.EndedAt, session.DurationMinutes);
    }

    public async Task<IReadOnlyList<FocusSessionResponse>> GetRecentAsync(Guid userId) =>
        await context.FocusSessions.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.StartedAt).Take(20)
            .Select(x => new FocusSessionResponse(x.Id, x.StartedAt, x.EndedAt, x.DurationMinutes)).ToListAsync();
}
