using Chat_Support.Application.Chats.DTOs;
using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Domain.Entities;
using Chat_Support.Domain.Enums;
// <<< اضافه کنید

// <<< اضافه کنید


namespace Chat_Support.Application.Chats.Commands;

public record SendMessageCommand(
    int ChatRoomId,
    string Content,
    MessageType Type = MessageType.Text,
    string? AttachmentUrl = null,
    int? ReplyToMessageId = null
) : IRequest<ChatMessageDto>;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, ChatMessageDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IChatHubService _chatHubService;
    private readonly IUser _user;
    private readonly IMapper _mapper; // <<< ۱. تزریق IMapper

    public SendMessageCommandHandler(
        IApplicationDbContext context,
        IChatHubService chatHubService,
        IUser user,
        IMapper mapper) // <<< ۲. اضافه کردن به کانستراکتور
    {
        _context = context;
        _chatHubService = chatHubService;
        _user = user;
        _mapper = mapper; // <<< ۳. مقداردهی اولیه
    }

    public async Task<ChatMessageDto> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        var senderUserId = _user.Id ?? throw new UnauthorizedAccessException("User is not authenticated.");

        // --- بخش ۱: اعتبار‌سنجی و ذخیره پیام ---
        var chatRoom = await _context.ChatRooms
            .AsNoTracking()
            .Include(cr => cr.Members).ThenInclude(m => m.User) // Include کامل برای مپینگ
            .FirstOrDefaultAsync(cr => cr.Id == request.ChatRoomId, cancellationToken)
            ?? throw new KeyNotFoundException($"Chat room with Id {request.ChatRoomId} not found.");

        if (!chatRoom.Members.Any(m => m.UserId == senderUserId))
            throw new UnauthorizedAccessException("User is not a member of this chat room.");

        var message = new ChatMessage
        {
            Content = request.Content,
            SenderId = senderUserId,
            ChatRoomId = request.ChatRoomId,
            Type = request.Type,
            AttachmentUrl = request.AttachmentUrl,
            ReplyToMessageId = request.ReplyToMessageId
        };

        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync(cancellationToken);

        // --- بخش ۲: ساخت DTO پیام و ارسال به هاب ---
        var messageToMap = await _context.ChatMessages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ReplyToMessage).ThenInclude(rpm => rpm!.Sender) // Include کامل برای مپینگ ریپلای
            .FirstAsync(m => m.Id == message.Id, cancellationToken);

        var messageDto = _mapper.Map<ChatMessageDto>(messageToMap);
        await _chatHubService.SendMessageToRoom(request.ChatRoomId.ToString(), messageDto);

        // --- بخش ۳: آپدیت و ارسال وضعیت جدید چت‌روم ---
        var senderUser = chatRoom.Members.First(m => m.UserId == senderUserId).User;

        foreach (var member in chatRoom.Members)
        {
            // برای خود فرستنده، آپدیت لیست چت لازم نیست
            if (member.UserId == senderUserId) continue;

            // ۱. ساخت DTO پایه با AutoMapper
            var roomUpdateDto = _mapper.Map<ChatRoomDto>(chatRoom);

            // ۲. سفارشی‌سازی DTO برای هر کاربر
            roomUpdateDto.UnreadCount = await _context.ChatMessages
                .CountAsync(m => m.ChatRoomId == request.ChatRoomId &&
                                 m.SenderId != member.UserId &&
                                 m.Id > (member.LastReadMessageId ?? 0), cancellationToken);

            // آپدیت آخرین پیام
            roomUpdateDto.LastMessageContent = message.Content;
            roomUpdateDto.LastMessageTime = message.Created;
            roomUpdateDto.LastMessageSenderName = $"{senderUser.FirstName} {senderUser.LastName}";

            // سفارشی‌سازی نام و آواتار برای چت‌های خصوصی
            if (!chatRoom.IsGroup)
            {
                // برای هر عضو، "طرف مقابل" همان فرستنده پیام است
                roomUpdateDto.Name = $"{senderUser.FirstName} {senderUser.LastName}";
                roomUpdateDto.Avatar = senderUser.Avatar;
            }

            // ۳. ارسال DTO نهایی
            await _chatHubService.SendChatRoomUpdateToUser(member.UserId!, roomUpdateDto);
        }

        return messageDto;
    }
}
