using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request) => Ok(await authService.RegisterAsync(request));

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request) => Ok(await authService.LoginAsync(request));

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> Me() => Ok(await authService.GetMeAsync(User.GetUserId()));
}
