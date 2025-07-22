// Web/Endpoints/AuthEndpoints.cs

using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Chat_Support.Web.Endpoints;

public class AuthEndpoints : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        var group = app.MapGroup(this);
        group.MapGet("verify-token", VerifyToken);
        group.MapGet("profile", GetProfile).RequireAuthorization();
    }

    // این اندپوینت توکن را از فرانت‌اند دریافت کرده و در صورت اعتبار، اطلاعات کاربر را برمی‌گرداند
    // فرانت‌اند پس از دریافت توکن از روبیک، این اندپوینت را فراخوانی می‌کند
    public IResult VerifyToken([FromQuery] string token, HttpContext httpContext)
    {
        // در این سناریو، middleware احراز هویت قبلاً توکن را از هدر خوانده و کاربر را احراز کرده.
        // اما اگر توکن از query string بیاید، باید به صورت دستی آن را بخوانیم.
        // با توجه به تنظیمات ما، فرانت‌اند باید پس از دریافت توکن، آن را در هدر Authorization قرار دهد و این اندپوینت را صدا بزند.
        // بنابراین، اینجا فقط کافیست اطلاعات کاربر احراز هویت شده را برگردانیم.

        var user = httpContext.User;
        if (user.Identity is { IsAuthenticated: false })
        {
            return Results.Unauthorized();
        }

        var profile = new UserProfileDto
        {
            Id = user.FindFirstValue(ClaimTypes.NameIdentifier)!,
            Username = user.FindFirstValue(ClaimTypes.Name)!,
            FirstName = user.FindFirstValue("firstname")!,
            LastName = user.FindFirstValue("lastname")!,
            RegionId = user.FindFirstValue("regionId")!
        };

        // توکن معتبر است. همان توکن را به همراه اطلاعات پروفایل به فرانت برمی‌گردانیم تا ذخیره کند.
        return Results.Ok(new { Token = token, Profile = profile });
    }

    // این اندپوینت اطلاعات کاربر لاگین شده فعلی را برمی‌گرداند
    public IResult GetProfile(ClaimsPrincipal user)
    {
        var profile = new UserProfileDto
        {
            Id = user.FindFirstValue(ClaimTypes.NameIdentifier)!,
            Username = user.FindFirstValue(ClaimTypes.Name)!,
            FirstName = user.FindFirstValue("firstname")!,
            LastName = user.FindFirstValue("lastname")!,
            RegionId = user.FindFirstValue("regionId")!
        };

        return Results.Ok(profile);
    }
}

// یک DTO برای اطلاعات پروفایل کاربر تعریف کنید.
// می‌توانید این کلاس را در یک فایل جداگانه در پروژه Application قرار دهید.
// مثلا: Application/Users/DTOs/UserProfileDto.cs
public class UserProfileDto
{
    public string? Id { get; set; }
    public string? Username { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? RegionId { get; set; }
}
