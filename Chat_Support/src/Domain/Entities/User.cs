using Chat_Support.Domain.Common;

namespace Chat_Support.Domain.Entities;

public class User : BaseEntity
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? UserName { get; set; }
    public string? Description { get; set; }
    public string? Password { get; set; }
    public string? Email { get; set; }
    public bool? Enable { get; set; }
    public int? StafId { get; set; }
    public long? DateEnter { get; set; }
    public string? Sex { get; set; }
    public string? FatherName { get; set; }
    public string? Number { get; set; }
    public string? BirthDate { get; set; }
    public string? Degree { get; set; }
    public string? Tel { get; set; }
    public string? Address { get; set; }
    public string? ImageName { get; set; }
    public int? RegionId { get; set; }
    public int? Post { get; set; }
    public bool? ShowPublic { get; set; }
    public string? Mobile { get; set; }
    public string? CodeMeli { get; set; }
    public int? WorkPlace { get; set; }
    public string? CodePosti { get; set; }
    public string? SecurityQuestion { get; set; }
    public string? SecurityAnswer { get; set; }
    public int? OrgId { get; set; }
    public bool AccessFlag { get; set; } = true;
    public string ActiveDirectoryUserName { get; set; } = string.Empty;
    public int? EndSessionTime { get; set; }
    public DateTime? LastPasswordChangeDate { get; set; }
    public int? LoginAttemptCount { get; set; }
    public bool? HasLoggedIn { get; set; }

    // Computed Properties
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsActive => Enable ?? false;

    // Navigation Properties
    public virtual Region? Region { get; set; }

    // رابطه Many-to-Many با Groups
    public virtual ICollection<UserGroup> UserGroups { get; set; } = new List<UserGroup>();

    // دسترسی‌های شخصی
    public virtual ICollection<UserFacility> UserFacilities { get; set; } = new List<UserFacility>();

    // نواحی اضافی کاربر
    public virtual ICollection<UserRegion> UserRegions { get; set; } = new List<UserRegion>();

    // برای سیستم چت
    public virtual ICollection<ChatRoomMember> ChatRoomMemberships { get; set; } = new List<ChatRoomMember>();
    public virtual ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<UserConnection> Connections { get; set; } = new List<UserConnection>();
    public virtual ICollection<MessageStatus> MessageStatuses { get; set; } = new List<MessageStatus>();
    public virtual ICollection<MessageReaction> MessageReactions { get; set; } = new List<MessageReaction>();

    // برای سیستم پشتیبانی
    public virtual ICollection<SupportTicket> SupportTicketsAsRequester { get; set; } = new List<SupportTicket>();
    public virtual ICollection<TicketReply> TicketReplies { get; set; } = new List<TicketReply>();

    // اگر کاربر Agent باشد
    public virtual SupportAgent? SupportAgent { get; set; }

    // فایل‌های آپلود شده
    public virtual ICollection<ChatFileMetadata> UploadedFiles { get; set; } = new List<ChatFileMetadata>();

    // ChatRooms ایجاد شده توسط کاربر
    public virtual ICollection<ChatRoom> CreatedChatRooms { get; set; } = new List<ChatRoom>();
    public AgentStatus? AgentStatus { get; set; }
    public int? CurrentActiveChats { get; set; }
    public int MaxConcurrentChats { get; set; }
}
