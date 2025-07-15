using System.Collections.Concurrent;
using Chat_Support.Application.Chats.DTOs;
using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Domain.Entities;
using Chat_Support.Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Chat_Support.Infrastructure.Hubs;

public class ChatHub : Hub
{
    private readonly IApplicationDbContext _context;
    private readonly IUser _user;
    private static readonly ConcurrentDictionary<string, int> _typingUsers = new();

    public ChatHub(IApplicationDbContext context, IUser user)
    {
        _context = context;
        _user = user;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = _user.Id;

        if (string.IsNullOrEmpty(userId.ToString()))
        {
            Context.Abort();
            return;
        }

        // Save connection
        var connection = new UserConnection
        {
            UserId = userId,
            ConnectionId = Context.ConnectionId,
            ConnectedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.UserConnections.Add(connection);
        await _context.SaveChangesAsync(CancellationToken.None);

        // Join user's chat rooms
        var chatRoomIds = await GetUserChatRoomIds(userId);
        foreach (var roomId in chatRoomIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = _user.Id;

        // Remove connection
        var connection = _context.UserConnections
            .FirstOrDefault(c => c.ConnectionId == Context.ConnectionId);

        if (connection != null)
        {
            connection.IsActive = false;
            await _context.SaveChangesAsync(CancellationToken.None);
        }

        // Stop typing indicators for this connection
        if (_typingUsers.TryRemove(Context.ConnectionId, out int roomIdWhenDisconnected))
        {

            var user = await _context.KciUsers.FindAsync(userId);
            if (user != null)
            {
                var typingDto = new TypingIndicatorDto(
                    userId,
                    $" {user.FirstName} {user.LastName}",
                    roomIdWhenDisconnected,
                    false
                );
                await Clients.Group(roomIdWhenDisconnected.ToString()).SendAsync("UserTyping", typingDto);
            }

        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
    }

    public async Task StartTyping(string roomIdStr)
    {
        var userId = _user.Id;
        if (string.IsNullOrEmpty(userId.ToString()) || !int.TryParse(roomIdStr, out int roomId))
            return;

        var user = await _context.KciUsers.FindAsync(userId);
        if (user == null) return;

        if (_typingUsers.TryGetValue(Context.ConnectionId, out int previousRoomId))
        {
            if (previousRoomId != roomId)
            {
                var previousTypingDto = new TypingIndicatorDto(userId, $" {user.FirstName} {user.LastName}", previousRoomId, false);
                await Clients.Group(previousRoomId.ToString()).SendAsync("UserTyping", previousTypingDto);
            }
        }

        _typingUsers.AddOrUpdate(Context.ConnectionId, roomId, (connId, oldRoomId) => roomId);

        var typingDto = new TypingIndicatorDto(
            userId,
            $" {user.FirstName} {user.LastName}",
            roomId,
            true
        );

        await Clients.GroupExcept(roomId.ToString(), Context.ConnectionId)
            .SendAsync("UserTyping", typingDto);
    }

    public async Task StopTyping(string? roomIdStr = null)
    {
        var userId = _user.Id;
        if (string.IsNullOrEmpty(userId.ToString())) return;


        if (roomIdStr != null && int.TryParse(roomIdStr, out int roomIdFromParam))
        {
            if (_typingUsers.TryGetValue(Context.ConnectionId, out int currentTypingRoomId) && currentTypingRoomId == roomIdFromParam)
            {
                if (_typingUsers.TryRemove(Context.ConnectionId, out _))
                {
                    var user = await _context.KciUsers.FindAsync(userId);
                    if (user != null)
                    {
                        var typingDto = new TypingIndicatorDto(userId, $" {user.FirstName} {user.LastName}", roomIdFromParam, false);
                        await Clients.GroupExcept(roomIdFromParam.ToString(), Context.ConnectionId)
                            .SendAsync("UserTyping", typingDto);
                    }
                }
            }
        }
        else if (roomIdStr == null)
        {
            if (_typingUsers.TryRemove(Context.ConnectionId, out int currentTypingRoomId))
            {
                var user = await _context.KciUsers.FindAsync(userId);
                if (user != null)
                {
                    var typingDto = new TypingIndicatorDto(userId, $" {user.FirstName} {user.LastName}", currentTypingRoomId, false);

                    await Clients.Group(currentTypingRoomId.ToString()).SendAsync("UserTyping", typingDto);
                }
            }
        }
    }

    public async Task MarkMessageAsRead(string messageId, string roomId)
    {
        var userId = _user.Id;
        var msgId = int.Parse(messageId);
        var roomIdInt = int.Parse(roomId);

        var message = await _context.ChatMessages
            .FirstOrDefaultAsync(m => m.Id == msgId && m.ChatRoomId == roomIdInt);

        if (message == null || message.SenderId == userId) return;

        var existingStatus = await _context.MessageStatuses
            .FirstOrDefaultAsync(s => s.MessageId == msgId && s.UserId == userId);

        if (existingStatus != null)
        {
            if (existingStatus.Status != ReadStatus.Read)
            {
                existingStatus.Status = ReadStatus.Read;
                existingStatus.StatusAt = DateTime.UtcNow;
            }
        }
        else
        {
            var status = new MessageStatus
            {
                MessageId = msgId,
                UserId = userId,
                Status = ReadStatus.Read,
                StatusAt = DateTime.UtcNow
            };
            _context.MessageStatuses.Add(status);
        }

        // آپدیت LastReadMessageId
        var chatRoomMember = await _context.ChatRoomMembers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.ChatRoomId == roomIdInt);

        if (chatRoomMember != null)
        {
            if (chatRoomMember.LastReadMessageId == null || msgId > chatRoomMember.LastReadMessageId)
            {
                chatRoomMember.LastReadMessageId = msgId;
            }
        }

        await _context.SaveChangesAsync(CancellationToken.None);

        // اطلاع به فرستنده پیام
        if (message.SenderId != null && message.SenderId != userId)
        {
            await Clients.User(message.SenderId.ToString() ?? string.Empty)
                .SendAsync("MessageRead", new { MessageId = msgId, ReadBy = userId, ChatRoomId = roomIdInt });
        }

        // آپدیت unread count برای خود کاربر
        await UpdateUnreadCount(roomIdInt);
    }

    private async Task<List<int>> GetUserChatRoomIds(int? userId)
    {
        return await Task.Run(() =>
            _context.ChatRoomMembers
                .Where(m => m.UserId == userId && !m.IsDeleted)
                .Select(m => m.ChatRoomId)
                .ToList()
        );
    }

    public async Task UpdateUnreadCount(int roomId)
    {
        var userId = _user.Id;

        try
        {
            // محاسبه unread count برای این کاربر در این اتاق
            var lastReadMessage = await _context.ChatRoomMembers
                .Where(m => m.UserId == userId && m.ChatRoomId == roomId)
                .Select(m => m.LastReadMessageId)
                .FirstOrDefaultAsync();

            var unreadCount = await _context.ChatMessages
                .Where(m => m.ChatRoomId == roomId &&
                            m.SenderId != userId &&
                            !m.IsDeleted &&
                            (lastReadMessage == null || m.Id > lastReadMessage))
                .CountAsync();

            // ارسال آپدیت به کلاینت‌های کاربر
            await Clients.User(userId.ToString() ?? string.Empty)
                .SendAsync("UnreadCountUpdate", new { RoomId = roomId, UnreadCount = unreadCount });
        }
        catch (Exception ex)
        {
            // لاگ خطا
            Console.WriteLine($"Error updating unread count: {ex.Message}");
        }
    }

    public async Task DeleteMessage(int messageId)
    {
        var userId = _user.Id;
        var message = await _context.ChatMessages
            .Include(m => m.ChatRoom)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == userId);

        if (message != null)
        {
            message.IsDeleted = true;
            message.Content = "[پیام حذف شد]";
            message.AttachmentUrl = null; // حذف attachment در صورت وجود

            await _context.SaveChangesAsync(CancellationToken.None);

            // Real-time broadcast به همه اعضای اتاق
            await Clients.Group(message.ChatRoomId.ToString())
                .SendAsync("MessageDeleted", new
                {
                    MessageId = messageId,
                    ChatRoomId = message.ChatRoomId,
                    IsDeleted = true,
                    Content = "[پیام حذف شد]"
                });
        }
    }

}
