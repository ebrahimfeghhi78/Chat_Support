using Chat_Support.Application;
using Chat_Support.Infrastructure;
using Chat_Support.Infrastructure.Data;
using Chat_Support.ServiceDefaults;
using Chat_Support.Web;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.AddServiceDefaults();
builder.AddKeyVaultIfConfigured();
builder.AddApplicationServices();
builder.AddInfrastructureServices();
builder.AddWebServices();
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    await app.InitialiseDatabaseAsync();
}
else
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseSwaggerUi(settings =>
{
    settings.Path = "/api";
    settings.DocumentPath = "/api/specification.json";
});

app.MapRazorPages();


app.MapFallbackToFile("index.html");


app.UseExceptionHandler(options => { });


app.MapDefaultEndpoints();
app.MapEndpoints();

app.Run();

namespace Chat_Support.Web
{
    public partial class Program { }
}
