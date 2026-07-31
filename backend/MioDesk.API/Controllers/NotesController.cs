using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/notes")]
[Authorize]
public sealed class NotesController(INoteService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NoteResponse>>> GetAll() => Ok(await service.GetAllAsync(User.GetUserId()));

    [HttpPost]
    public async Task<ActionResult<NoteResponse>> Create(NoteRequest request) => Ok(await service.CreateAsync(User.GetUserId(), request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NoteResponse>> Update(Guid id, NoteRequest request) => Ok(await service.UpdateAsync(User.GetUserId(), id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await service.DeleteAsync(User.GetUserId(), id);
        return NoContent();
    }
}
