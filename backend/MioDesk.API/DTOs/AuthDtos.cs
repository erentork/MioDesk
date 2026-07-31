namespace MioDesk.API.DTOs;

public sealed record RegisterRequest(string FullName, string Email, string Password, string? Major);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
public sealed record UserResponse(Guid Id, string FullName, string Email, string Major, string AvatarSeed);
