using MioDesk.API.Data;
using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Repositories;

public sealed class NoteRepository(AppDbContext context) : INoteRepository
{
    public Task<List<CourseNote>> GetAllAsync(Guid userId) => context.CourseNotes.AsNoTracking().Include(x => x.Course).Where(x => x.UserId == userId).OrderByDescending(x => x.IsPinned).ThenBy(x => x.SortOrder).ThenByDescending(x => x.UpdatedAt).ToListAsync();
    public Task<CourseNote?> GetAsync(Guid userId, Guid id) => context.CourseNotes.Include(x => x.Course).FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id);

    public async Task SaveAsync(CourseNote note)
    {
        if (context.Entry(note).State == EntityState.Detached) context.CourseNotes.Add(note);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(CourseNote note)
    {
        context.CourseNotes.Remove(note);
        await context.SaveChangesAsync();
    }
}
