using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(INotificationService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationResponse>>> GetAll() => Ok(await service.GetAllAsync(User.GetUserId()));

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        await service.MarkReadAsync(User.GetUserId(), id);
        return NoContent();
    }
}
