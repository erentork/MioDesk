using MioDesk.API.DTOs;
using MioDesk.API.Extensions;
using MioDesk.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MioDesk.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController(IDashboardService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get() => Ok(await service.GetAsync(User.GetUserId()));

    [HttpGet("statistics")]
    public async Task<ActionResult<StatisticsResponse>> GetStatistics() => Ok(await service.GetStatisticsAsync(User.GetUserId()));
}
