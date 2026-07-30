using MioDesk.API.Data;
using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Repositories;

public sealed class ScheduleRepository(AppDbContext context) : IScheduleRepository
{
    public Task<List<ScheduleEntry>> GetAllAsync(Guid userId) => context.ScheduleEntries.AsNoTracking().Include(x => x.Course).Where(x => x.UserId == userId).OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).ToListAsync();
    public Task<ScheduleEntry?> GetAsync(Guid userId, Guid id) => context.ScheduleEntries.Include(x => x.Course).FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id);

    public async Task SaveAsync(ScheduleEntry entry)
    {
        if (context.Entry(entry).State == EntityState.Detached) context.ScheduleEntries.Add(entry);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(ScheduleEntry entry)
    {
        context.ScheduleEntries.Remove(entry);
        await context.SaveChangesAsync();
    }
}
