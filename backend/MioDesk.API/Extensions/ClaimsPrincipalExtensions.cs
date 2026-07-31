using System.Security.Claims;
using MioDesk.API.Exceptions;

namespace MioDesk.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id)
            ? id
            : throw new AppException(StatusCodes.Status401Unauthorized, "Oturum bilgisi geçersiz.");
    }
}
