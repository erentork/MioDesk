using MioDesk.API.Data;
using MioDesk.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace MioDesk.API.Repositories;

public sealed class UserRepository(AppDbContext context) : IUserRepository
{
    public Task<User?> GetByEmailAsync(string email) => context.Users.FirstOrDefaultAsync(x => x.Email == email);
    public Task<User?> GetByIdAsync(Guid id) => context.Users.FirstOrDefaultAsync(x => x.Id == id);

    public async Task AddAsync(User user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();
    }
}
