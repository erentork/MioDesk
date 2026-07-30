using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/focus")]
[Authorize]
public sealed class FocusController(IFocusService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FocusSessionResponse>>> GetRecent() => Ok(await service.GetRecentAsync(User.GetUserId()));

    [HttpPost]
    public async Task<ActionResult<FocusSessionResponse>> Create(FocusSessionRequest request) => Ok(await service.CreateAsync(User.GetUserId(), request));
}
