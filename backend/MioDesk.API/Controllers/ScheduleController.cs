using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/schedule")]
[Authorize]
public sealed class ScheduleController(IScheduleService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ScheduleResponse>>> GetAll() => Ok(await service.GetAllAsync(User.GetUserId()));

    [HttpPost]
    public async Task<ActionResult<ScheduleResponse>> Create(ScheduleRequest request) => Ok(await service.CreateAsync(User.GetUserId(), request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ScheduleResponse>> Update(Guid id, ScheduleRequest request) => Ok(await service.UpdateAsync(User.GetUserId(), id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteAsync(User.GetUserId(), id);
        return NoContent();
    }
}
