using System.IdentityModel.Tokens.Jwt; // این using را اضافه کنید
using Chat_Support.Application;
using Chat_Support.Infrastructure;
using Chat_Support.Infrastructure.Hubs;
using Chat_Support.ServiceDefaults;
using Chat_Support.Web;

// این خط را برای جلوگیری از تغییر نام Claim های توکن اضافه کنید
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddServiceDefaults();
// builder.AddKeyVaultIfConfigured(); // این خط را اگر از KeyVault استفاده نمی‌کنید، می‌توانید کامنت کنید
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler(options => { });

if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("ChatSupportApp");
app.UseAuthentication();
app.UseAuthorization();
app.UseSwaggerUi(settings =>
{
    settings.Path = "/api";
    settings.DocumentPath = "/api/specification.json";
});

// ثبت مستقیم endpointها روی app
app.MapRazorPages();
app.MapControllers();
app.MapHub<ChatHub>("/chathub");
app.MapFallbackToFile("index.html");
app.MapDefaultEndpoints();
app.MapEndpoints();

app.Run();

namespace Chat_Support.Web
{
    public partial class Program { }
}
