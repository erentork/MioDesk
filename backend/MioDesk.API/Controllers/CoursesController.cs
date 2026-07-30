using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public sealed class CoursesController(ICourseService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CourseResponse>>> GetAll() => Ok(await service.GetAllAsync(User.GetUserId()));

    [HttpPost]
    public async Task<ActionResult<CourseResponse>> Create(CourseRequest request)
    {
        var result = await service.CreateAsync(User.GetUserId(), request);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourseResponse>> Update(Guid id, CourseRequest request) => Ok(await service.UpdateAsync(User.GetUserId(), id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteAsync(User.GetUserId(), id);
        return NoContent();
    }
}
