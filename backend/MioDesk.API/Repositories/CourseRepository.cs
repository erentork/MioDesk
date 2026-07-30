using MioDesk.API.Data;
using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Repositories;

public sealed class CourseRepository(AppDbContext context) : ICourseRepository
{
    public Task<List<Course>> GetAllAsync(Guid userId) => context.Courses.AsNoTracking().Where(x => x.UserId == userId && !x.IsArchived).OrderBy(x => x.Name).ToListAsync();
    public Task<Course?> GetAsync(Guid userId, Guid id) => context.Courses.FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id);
    public Task<bool> CodeExistsAsync(Guid userId, string code, Guid? exceptId = null) => context.Courses.AnyAsync(x => x.UserId == userId && x.Code == code && (!exceptId.HasValue || x.Id != exceptId));

    public async Task SaveAsync(Course course)
    {
        if (context.Entry(course).State == EntityState.Detached) context.Courses.Add(course);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Course course)
    {
        context.Courses.Remove(course);
        await context.SaveChangesAsync();
    }
}
