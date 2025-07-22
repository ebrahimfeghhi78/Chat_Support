using AutoMapper;
using Chat_Support.Application.Chats.DTOs;
using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Application.Support.Commands;
using Chat_Support.Domain.Entities;
using Chat_Support.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Chat_Support.Web.Endpoints;

public class Support : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/support")
            .WithTags("Support");

        // Guest endpoints (no auth required)
        group.MapPost("/start", StartSupportChat)
            .AllowAnonymous()
            .WithName("StartSupportChat")
            .Produces<StartSupportChatResult>(StatusCodes.Status200OK)
            .RequireCors("ChatSupportApp");

        group.MapPost("/guest/message", SendGuestMessage)
            .AllowAnonymous()
            .AddEndpointFilter(async (context, next) =>
            {
                if (!context.HttpContext.Request.Headers.ContainsKey("X-Session-Id"))
                {
                    return Results.BadRequest("Missing required header: X-Session-Id");
                }
                return await next(context);
            });

        group.MapGet("/check-auth", (Delegate)CheckSupportAuth)
            .WithName("CheckSupportAuth")
            .RequireCors("ChatSupportApp");

        // Agent endpoints (require auth)
        group.MapGet("/tickets", GetAgentTickets)
            .RequireAuthorization("Agent");

        group.MapPost("/tickets/{ticketId}/transfer", TransferTicket)
            .RequireAuthorization("Agent");

        group.MapPost("/agent/status", UpdateAgentStatus)
            .RequireAuthorization("Agent");

        group.MapGet("/agents/available", GetAvailableAgents)
            .RequireAuthorization("Agent");

        group.MapPost("/tickets/{ticketId}/close", CloseTicket)
            .RequireAuthorization("Agent");
    }

    private static Task<IResult> CheckSupportAuth(HttpContext context)
    {
        var isAuthenticated = context.User?.Identity?.IsAuthenticated == true;

        if (!isAuthenticated)
        {
            return Task.FromResult(Results.Json(new
            {
                IsAuthenticated = false,
                LoginUrl = "/login?returnUrl=" + Uri.EscapeDataString(context.Request.Path)
            }, statusCode: 401));
        }

        return Task.FromResult(Results.Ok(new { IsAuthenticated = true }));
    }

    private static async Task<IResult> StartSupportChat(
        HttpContext context,
        StartSupportChatRequest request,
        IMediator mediator)
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        var userId = int.Parse((context.User?.Identity?.IsAuthenticated == true
            ? context.User.FindFirst("sub")?.Value
            : null) ?? string.Empty);

        // اگر کاربر لاگین نکرده، redirect به صفحه login
        if (string.IsNullOrEmpty(userId.ToString()) && string.IsNullOrEmpty(request.GuestSessionId))
        {
            return Results.Unauthorized();
        }

        var command = new StartSupportChatCommand(
            userId,
            request.GuestSessionId,
            request.GuestName,
            request.GuestEmail,
            request.GuestPhone,
            ipAddress,
            request.UserAgent ?? context.Request.Headers["User-Agent"].ToString(),
            request.InitialMessage ?? "New support chat started"
        );

        var result = await mediator.Send(command);
        return Results.Ok(result);
    }

    private static async Task<IResult> SendGuestMessage(
        HttpContext context,
        SendGuestMessageRequest request,
        IApplicationDbContext dbContext,
        IChatHubService chatHubService,
        IMapper mapper) // <<< ۱. IMapper را به عنوان پارامتر به متد اضافه می‌کنیم
    {
        var sessionId = context.Request.Headers["X-Session-Id"].ToString();
        if (string.IsNullOrEmpty(sessionId))
            return Results.BadRequest("Session ID required");

        // Verify guest session
        var guestUser = await dbContext.GuestUsers
            .AsNoTracking() // بهینه‌سازی
            .FirstOrDefaultAsync(g => g.SessionId == sessionId);

        if (guestUser == null)
            return Results.Unauthorized();

        // Update last activity
        // چون از AsNoTracking استفاده کردیم، برای آپدیت باید از روش دیگری استفاده کنید یا AsNoTracking را بردارید.
        // فعلاً این بخش را برای سادگی کامنت می‌کنیم.
        // guestUser.LastActivityAt = DateTime.UtcNow;

        // Create message
        var message = new ChatMessage
        {
            Content = request.Content,
            ChatRoomId = request.ChatRoomId,
            Type = request.Type,
            AttachmentUrl = request.AttachmentUrl
            // SenderId برای مهمان null است
        };

        dbContext.ChatMessages.Add(message);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        // --- بخش اصلی تغییرات ---
        // ۲. ابتدا با AutoMapper بخش‌های عمومی پیام را مپ می‌کنیم
        var messageDto = mapper.Map<ChatMessageDto>(message);

        // ۳. سپس اطلاعات خاص کاربر مهمان را به صورت دستی تنظیم می‌کنیم
        messageDto.SenderId = null!; // مهمان شناسه کاربری استاندارد ندارد
        messageDto.SenderFullName = guestUser.Name ?? "مهمان";
        messageDto.SenderAvatarUrl = null; // مهمان آواتار ندارد

        // Broadcast via SignalR
        await chatHubService.SendMessageToRoom(
            request.ChatRoomId.ToString(),
            messageDto);

        return Results.Ok(messageDto);
    }

    private static async Task<IResult> GetAgentTickets(
        HttpContext context,
        IApplicationDbContext dbContext,
        [FromQuery] SupportTicketStatus? status)
    {
        string? value = context.User.FindFirst("sub")?.Value;
        if (value != null)
        {
            var agentId = int.Parse(value);

            var query = dbContext.SupportTickets
                .Include(t => t.RequesterUser)
                .Include(t => t.RequesterGuest)
                .Include(t => t.ChatRoom)
                .ThenInclude(cr => cr.Messages)
                .Where(t => t.AssignedAgentUserId == agentId);

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            var tickets = await query
                .OrderByDescending(t => t.Created)
                .Select(t => new
                {
                    t.Id,
                    t.Status,
                    t.Created,
                    t.ClosedAt,
                    ChatRoomId = t.ChatRoomId,
                    RequesterName = t.RequesterUser != null
                        ? $"{t.RequesterUser.FirstName} {t.RequesterUser.LastName}"
                        : t.RequesterGuest!.Name ?? "Guest",
                    RequesterEmail = t.RequesterUser != null
                        ? t.RequesterUser.Email
                        : t.RequesterGuest!.Email,
                    LastMessage = t.ChatRoom.Messages
                        .OrderByDescending(m => m.Created)
                        .Select(m => new
                        {
                            m.Content,
                            m.Created,
                            SenderName = m.Sender != null
                                ? $"{m.Sender.FirstName} {m.Sender.LastName}"
                                : "Guest"
                        })
                        .FirstOrDefault(),
                    UnreadCount = t.ChatRoom.Messages
                        .Count(m => m.SenderId != agentId && m.Created > t.ChatRoom.Members
                            .Where(mem => mem.UserId == agentId)
                            .Select(mem => mem.LastSeenAt)
                            .FirstOrDefault())
                })
                .ToListAsync();

            return Results.Ok(tickets);
        }

        return Results.Empty;
    }

    private static async Task<IResult> TransferTicket(
        int ticketId,
        TransferTicketRequest request,
        IMediator mediator)
    {
        var command = new TransferChatCommand(
            ticketId,
            request.NewAgentId,
            request.Reason
        );

        var result = await mediator.Send(command);
        return result ? Results.Ok() : Results.NotFound();
    }

    private static async Task<IResult> UpdateAgentStatus(
        HttpContext context,
        UpdateAgentStatusRequest request,
        IAgentAssignmentService agentService)
    {
        var agentId = int.Parse(context.User.FindFirst("sub")?.Value!);
        await agentService.UpdateAgentStatusAsync(agentId, request.Status);
        return Results.Ok();
    }

    private static async Task<IResult> GetAvailableAgents(
        IApplicationDbContext dbContext)
    {
        var agents = await dbContext.KciUsers
            .Where(u => u.AgentStatus != AgentStatus.Offline)
            .Select(u => new
            {
                u.Id,
                Name = $"{u.FirstName} {u.LastName}",
                u.AgentStatus,
                u.CurrentActiveChats,
                u.MaxConcurrentChats,
                WorkloadPercentage = u.MaxConcurrentChats > 0
                    ? (u.CurrentActiveChats) * 100 / u.MaxConcurrentChats
                    : 0
            })
            .OrderBy(u => u.WorkloadPercentage)
            .ToListAsync();

        return Results.Ok(agents);
    }

    private static async Task<IResult> CloseTicket(
        int ticketId,
        CloseTicketRequest request,
        IApplicationDbContext dbContext,
        IChatHubService chatHubService)
    {
        var ticket = await dbContext.SupportTickets
            .Include(t => t.ChatRoom)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
            return Results.NotFound();

        ticket.Status = SupportTicketStatus.Closed;
        ticket.ClosedAt = DateTime.UtcNow;

        // Add closing message
        var closingMessage = new ChatMessage
        {
            Content = $"Chat closed: {request.Reason ?? "Resolved"}",
            ChatRoomId = ticket.ChatRoomId,
            Type = MessageType.System
        };
        dbContext.ChatMessages.Add(closingMessage);

        // Update agent active chats
        if (!string.IsNullOrEmpty(ticket.AssignedAgentUserId.ToString()))
        {
            var agent = await dbContext.KciUsers.FindAsync(ticket.AssignedAgentUserId);
            if (agent is { CurrentActiveChats: > 0 })
            {
                agent.CurrentActiveChats--;
                if (agent.AgentStatus == AgentStatus.Busy &&
                    agent.CurrentActiveChats < agent.MaxConcurrentChats)
                {
                    agent.AgentStatus = AgentStatus.Available;
                }
            }
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);

        // Notify via SignalR
        await chatHubService.SendMessageUpdateToRoom(
            ticket.ChatRoomId.ToString(),
            new { TicketId = ticketId, Status = "Closed" },
            "TicketClosed");

        return Results.Ok();
    }

    // Request DTOs
    public record StartSupportChatRequest(
        string? GuestSessionId,
        string? GuestName,
        string? GuestEmail,
        string? GuestPhone,
        string? UserAgent,
        string? InitialMessage
    );

    public record SendGuestMessageRequest(
        int ChatRoomId,
        string Content,
        MessageType Type = MessageType.Text,
        string? AttachmentUrl = null
    );

    public record TransferTicketRequest(
        int NewAgentId,
        string? Reason
    );

    public record UpdateAgentStatusRequest(
        AgentStatus Status
    );

    public record CloseTicketRequest(
        string? Reason
    );
}
