using System.Text.Json;
using MioDesk.API.Exceptions;

namespace MioDesk.API.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "İstek işlenirken hata oluştu.");
            var status = ex is AppException appException ? appException.StatusCode : StatusCodes.Status500InternalServerError;
            var message = ex is AppException ? ex.Message : "Beklenmeyen bir hata oluştu.";
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { message }));
        }
    }
}
