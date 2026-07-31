using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public sealed class TasksController(IAcademicTaskService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AcademicTaskResponse>>> GetAll(
        [FromQuery] AcademicTaskStatus? status,
        [FromQuery] TaskPriority? priority,
        [FromQuery] Guid? courseId) => Ok(await service.GetAllAsync(User.GetUserId(), status, priority, courseId));

    [HttpPost]
    public async Task<ActionResult<AcademicTaskResponse>> Create(AcademicTaskRequest request) => Ok(await service.CreateAsync(User.GetUserId(), request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AcademicTaskResponse>> Update(Guid id, AcademicTaskRequest request) => Ok(await service.UpdateAsync(User.GetUserId(), id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteAsync(User.GetUserId(), id);
        return NoContent();
    }
}
