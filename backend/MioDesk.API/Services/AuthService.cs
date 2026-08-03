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
    Task<AuthResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<AuthResponse> ChangeEmailAsync(Guid userId, ChangeEmailRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
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
        var major = string.IsNullOrWhiteSpace(request.Major) ? "Bilgisayar Mühendisliği" : request.Major.Trim();
        ValidateProfile(fullName, major);
        ValidateEmail(email);
        ValidatePassword(request.Password);

        if (await users.GetByEmailAsync(email) is not null)
            throw new AppException(StatusCodes.Status409Conflict, "Bu e-posta adresi zaten kullanılıyor.");

        var user = new User
        {
            FullName = fullName,
            Email = email,
            Major = major,
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
        var user = await GetUserAsync(userId);
        return user.ToResponse();
    }

    public async Task<AuthResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await GetUserAsync(userId);
        var fullName = request.FullName.Trim();
        var major = request.Major.Trim();

        ValidateProfile(fullName, major);

        user.FullName = fullName;
        user.Major = major;
        await users.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> ChangeEmailAsync(Guid userId, ChangeEmailRequest request)
    {
        var user = await GetUserAsync(userId);
        VerifyCurrentPassword(user, request.CurrentPassword);

        var email = request.Email.Trim().ToLowerInvariant();
        ValidateEmail(email);

        var existingUser = await users.GetByEmailAsync(email);
        if (existingUser is not null && existingUser.Id != user.Id)
            throw new AppException(StatusCodes.Status409Conflict, "Bu e-posta adresi zaten kullanılıyor.");

        user.Email = email;
        await users.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await GetUserAsync(userId);
        VerifyCurrentPassword(user, request.CurrentPassword);
        ValidatePassword(request.NewPassword);

        var reuseResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.NewPassword);
        if (reuseResult != PasswordVerificationResult.Failed)
            throw new AppException(StatusCodes.Status400BadRequest, "Yeni şifren mevcut şifrenden farklı olmalıdır.");

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        await users.SaveChangesAsync();
    }

    private async Task<User> GetUserAsync(Guid userId) =>
        await users.GetByIdAsync(userId)
        ?? throw new AppException(StatusCodes.Status404NotFound, "Kullanıcı bulunamadı.");

    private void VerifyCurrentPassword(User user, string currentPassword)
    {
        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword);
        if (result == PasswordVerificationResult.Failed)
            throw new AppException(StatusCodes.Status400BadRequest, "Mevcut şifre hatalı.");
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var token = tokenService.Create(user);
        return new AuthResponse(token.Token, token.ExpiresAt, user.ToResponse());
    }

    private static void ValidateProfile(string fullName, string major)
    {
        if (fullName.Length < 2 || fullName.Length > 120)
            throw new AppException(400, "Ad soyad 2 ile 120 karakter arasında olmalıdır.");
        if (major.Length < 2 || major.Length > 160)
            throw new AppException(400, "Bölüm 2 ile 160 karakter arasında olmalıdır.");
    }

    private static void ValidateEmail(string email)
    {
        if (!email.Contains('@') || email.Length < 5 || email.Length > 180)
            throw new AppException(400, "Geçerli bir e-posta adresi girin.");
    }

    private static void ValidatePassword(string password)
    {
        if (password.Length < 8) throw new AppException(400, "Şifre en az 8 karakter olmalıdır.");
        if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            throw new AppException(400, "Şifre en az bir harf ve bir rakam içermelidir.");
    }
}
