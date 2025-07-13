using Chat_Support.Application.Chats.DTOs;
using Chat_Support.Application.Common.Interfaces;

// <<< این using برای ProjectTo ضروری است

namespace Chat_Support.Application.Chats.Queries;

public record GetChatMessagesQuery(
    int ChatRoomId,
    int Page = 1,
    int PageSize = 50
) : IRequest<List<ChatMessageDto>>;

public class GetChatMessagesQueryHandler : IRequestHandler<GetChatMessagesQuery, List<ChatMessageDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IUser _user;

    public GetChatMessagesQueryHandler(IApplicationDbContext context, IMapper mapper, IUser user)
    {
        _context = context;
        _mapper = mapper;
        _user = user;
    }

    public async Task<List<ChatMessageDto>> Handle(GetChatMessagesQuery request, CancellationToken cancellationToken)
    {
        var userId = _user.Id; // دریافت شناسه کاربر فعلی

        var messages = await _context.ChatMessages
            .Where(m => m.ChatRoomId == request.ChatRoomId && !m.IsDeleted)
            .OrderByDescending(m => m.Created)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            // به جای Select دستی، از ProjectTo استفاده می‌کنیم
            // این متد به صورت هوشمند کوئری SQL بهینه تولید می‌کند
            .ProjectTo<ChatMessageDto>(_mapper.ConfigurationProvider, new { currentUserId = userId })
            .ToListAsync(cancellationToken);

        // مرتب‌سازی نهایی در حافظه برای نمایش صحیح در کلاینت
        return messages.OrderBy(m => m.Timestamp).ToList();
    }
}
