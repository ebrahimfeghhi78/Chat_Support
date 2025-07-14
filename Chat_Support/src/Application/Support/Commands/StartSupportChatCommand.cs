using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Domain.Entities;
using Chat_Support.Domain.Enums;

namespace Chat_Support.Application.Support.Commands;

public record StartSupportChatCommand(
    int UserId,
    string? GuestSessionId,
    string? GuestName,
    string? GuestEmail,
    string? GuestPhone,
    string IpAddress,
    string? UserAgent,
    string InitialMessage
) : IRequest<StartSupportChatResult>;

public record StartSupportChatResult(
    int ChatRoomId,
    int TicketId,
    int? AssignedAgentId,
    string? AssignedAgentName
);

public class StartSupportChatCommandHandler : IRequestHandler<StartSupportChatCommand, StartSupportChatResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IAgentAssignmentService _agentAssignment;
    private readonly IChatHubService _chatHubService;

    public StartSupportChatCommandHandler(
        IApplicationDbContext context,
        IAgentAssignmentService agentAssignment,
        IChatHubService chatHubService)
    {
        _context = context;
        _agentAssignment = agentAssignment;
        _chatHubService = chatHubService;
    }

    public async Task<StartSupportChatResult> Handle(StartSupportChatCommand request, CancellationToken cancellationToken)
    {
        // 1. مدیریت Guest User
        GuestUser? guestUser = null;
        if (string.IsNullOrEmpty(request.UserId.ToString()))
        {
            guestUser = await _context.GuestUsers
                .FirstOrDefaultAsync(g => g.SessionId == request.GuestSessionId, cancellationToken);

            if (guestUser == null)
            {
                guestUser = new GuestUser
                {
                    SessionId = request.GuestSessionId ?? Guid.NewGuid().ToString(),
                    Name = request.GuestName,
                    Email = request.GuestEmail,
                    Phone = request.GuestPhone,
                    IpAddress = request.IpAddress,
                    UserAgent = request.UserAgent,
                    LastActivityAt = DateTime.UtcNow
                };
                _context.GuestUsers.Add(guestUser);
                await _context.SaveChangesAsync(cancellationToken);
            }
            else
            {
                guestUser.LastActivityAt = DateTime.UtcNow;
            }
        }

        // 2. پیدا کردن بهترین Agent
        var assignedAgent = await _agentAssignment.GetBestAvailableAgentAsync(cancellationToken);

        // 3. ایجاد Chat Room
        var chatRoom = new ChatRoom
        {
            Name = !string.IsNullOrEmpty(request.UserId.ToString())
                ? "Support Chat - User"
                : $"Support Chat - {request.GuestName ?? "Guest"}",
            Description = "Live support chat",
            IsGroup = false,
            ChatRoomType = ChatRoomType.Support, // تنظیم نوع به پشتیبانی
            CreatedById = request.UserId ,
            GuestIdentifier = guestUser?.SessionId
        };
        _context.ChatRooms.Add(chatRoom);
        await _context.SaveChangesAsync(cancellationToken);

        // 4. اضافه کردن Members
        if (!string.IsNullOrEmpty(request.UserId.ToString()))
        {
            _context.ChatRoomMembers.Add(new ChatRoomMember
            {
                UserId = request.UserId,
                ChatRoomId = chatRoom.Id,
                Role = ChatRole.Member
            });
        }

        if (assignedAgent != null)
        {
            _context.ChatRoomMembers.Add(new ChatRoomMember
            {
                UserId = assignedAgent.Id,
                ChatRoomId = chatRoom.Id,
                Role = ChatRole.Admin
            });
        }

        // 5. ایجاد Support Ticket
        var ticket = new SupportTicket
        {
            RequesterUserId = request.UserId,
            RequesterGuestId = guestUser?.Id,
            AssignedAgentUserId = assignedAgent?.Id,
            ChatRoomId = chatRoom.Id,
            Status = SupportTicketStatus.Open
        };
        _context.SupportTickets.Add(ticket);

        // 6. ارسال پیام اولیه
        var initialMessage = new ChatMessage
        {
            Content = request.InitialMessage,
            SenderId = request.UserId,
            ChatRoomId = chatRoom.Id,
            Type = MessageType.Text
            //SenderFullName = request.UserId != null ? "کاربر" : (request.GuestName ?? "مهمان")
        };
        _context.ChatMessages.Add(initialMessage);

        await _context.SaveChangesAsync(cancellationToken);

        // 7. Notify via SignalR
        if (assignedAgent != null)
        {
            await _chatHubService.NotifyAgentOfNewChat(assignedAgent.Id, chatRoom.Id);
        }

        return new StartSupportChatResult(
            chatRoom.Id,
            ticket.Id,
            assignedAgent?.Id,
            assignedAgent != null ? $"{assignedAgent.FirstName} {assignedAgent.LastName}" : null
        );
    }

}
