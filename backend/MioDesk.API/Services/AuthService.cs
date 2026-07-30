using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Exceptions;
using MioDesk.API.Extensions;
using MioDesk.API.Repositories;
using Microsoft.AspNetCore.Identity;

namespace MioDesk.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<UserResponse> GetMeAsync(Guid userId);
}

public sealed class AuthService(
    IUserRepository users,
    IPasswordHasher<User> passwordHasher,
    ITokenService tokenService) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var fullName = request.FullName.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        Validate(fullName, email, request.Password);

        if (await users.GetByEmailAsync(email) is not null)
            throw new AppException(StatusCodes.Status409Conflict, "Bu e-posta adresi zaten kullanılıyor.");

        var user = new User
        {
            FullName = fullName,
            Email = email,
            Major = string.IsNullOrWhiteSpace(request.Major) ? "Bilgisayar Mühendisliği" : request.Major.Trim(),
            AvatarSeed = fullName[..1].ToLowerInvariant()
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        await users.AddAsync(user);

        var token = tokenService.Create(user);
        return new AuthResponse(token.Token, token.ExpiresAt, user.ToResponse());
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await users.GetByEmailAsync(email)
            ?? throw new AppException(StatusCodes.Status401Unauthorized, "E-posta veya şifre hatalı.");

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new AppException(StatusCodes.Status401Unauthorized, "E-posta veya şifre hatalı.");

        var token = tokenService.Create(user);
        return new AuthResponse(token.Token, token.ExpiresAt, user.ToResponse());
    }

    public async Task<UserResponse> GetMeAsync(Guid userId)
    {
        var user = await users.GetByIdAsync(userId)
            ?? throw new AppException(StatusCodes.Status404NotFound, "Kullanıcı bulunamadı.");
        return user.ToResponse();
    }

    private static void Validate(string fullName, string email, string password)
    {
        if (fullName.Length < 2) throw new AppException(400, "Ad soyad en az 2 karakter olmalıdır.");
        if (!email.Contains('@') || email.Length < 5) throw new AppException(400, "Geçerli bir e-posta adresi girin.");
        if (password.Length < 8) throw new AppException(400, "Şifre en az 8 karakter olmalıdır.");
        if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            throw new AppException(400, "Şifre en az bir harf ve bir rakam içermelidir.");
    }
}
