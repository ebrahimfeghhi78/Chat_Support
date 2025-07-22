using System.Security.Claims;

using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Domain.Entities;

namespace Chat_Support.Web.Services;
public class CurrentUser : IUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string? Id => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public int RegionId
    {
        get
        {
            var regionIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue("regionId");
            if (int.TryParse(regionIdClaim, out var regionId))
                return regionId;
            // مقدار جایگزین اگر claim معتبر نبود
            return -1;
        }
    }

    int IUser.Id
    {
        get
        {
            var idClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(idClaim, out var id))
                return id;
            // مقدار جایگزین اگر claim معتبر نبود
            return -1;
        }
    }
    int IUser.RegionId
    {
        get
        {
            var regionIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue("regionId");
            if (int.TryParse(regionIdClaim, out var regionId))
                return regionId;
            // مقدار جایگزین اگر claim معتبر نبود
            return -1;
        }
    }
}
