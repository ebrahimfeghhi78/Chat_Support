using Chat_Support.Application.Chats.DTOs;
using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Chat_Support.Infrastructure.Service;

public class ChatHubService : IChatHubService
{
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatHubService(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendMessageToRoom(string roomId, ChatMessageDto message)
    {
        await _hubContext.Clients.Group(roomId)
            .SendAsync("ReceiveMessage", message);
    }

    public async Task SendTypingIndicator(string roomId, TypingIndicatorDto indicator)
    {
        await _hubContext.Clients.Group(roomId)
            .SendAsync("UserTyping", indicator);
    }

    public async Task NotifyUserOnline(Guid userId, bool isOnline)
    {
        await _hubContext.Clients.All
            .SendAsync("UserOnlineStatus", new { UserId = userId, IsOnline = isOnline });
    }

    public async Task SendChatRoomUpdateToUser(int userId, ChatRoomDto roomDetails)
    {
        await _hubContext.Clients.User(userId.ToString())
            .SendAsync("ReceiveChatRoomUpdate", roomDetails);
    }

    public async Task SendMessageUpdateToRoom(string roomId, object payload, string eventName = "MessageUpdated")
    {
        await _hubContext.Clients.Group(roomId).SendAsync(eventName, payload);
    }

    public async Task NotifyAgentOfNewChat(int agentId, int chatRoomId)
    {
        await _hubContext.Clients.User(agentId.ToString())
            .SendAsync("NewSupportChat", new { ChatRoomId = chatRoomId });
    }

    public async Task NotifyChatTransferred(int oldAgentId, int chatRoomId)
    {
        await _hubContext.Clients.User(oldAgentId.ToString())
            .SendAsync("ChatTransferred", new { ChatRoomId = chatRoomId });
    }

    public async Task SendSupportChatUpdate(string connectionId, object update)
    {
        await _hubContext.Clients.Client(connectionId)
            .SendAsync("SupportChatUpdate", update);
    }
}
