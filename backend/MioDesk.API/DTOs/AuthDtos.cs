namespace MioDesk.API.DTOs;

public sealed record RegisterRequest(string FullName, string Email, string Password, string? Major);
public sealed record LoginRequest(string Email, string Password);
public sealed record UpdateProfileRequest(string FullName, string Major);
public sealed record ChangeEmailRequest(string Email, string CurrentPassword);
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public sealed record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
public sealed record UserResponse(Guid Id, string FullName, string Email, string Major, string AvatarSeed);
