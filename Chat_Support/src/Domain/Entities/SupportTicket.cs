namespace Chat_Support.Domain.Entities;

public class SupportTicket : BaseAuditableEntity
{
    public string? RequesterUserId { get; set; }
    public virtual User? RequesterUser { get; set; }

    public int? RequesterGuestId { get; set; }
    public virtual GuestUser? RequesterGuest { get; set; }

    public string? AssignedAgentUserId { get; set; }
    public virtual User? AssignedAgent { get; set; }

    public int ChatRoomId { get; set; }
    public virtual ChatRoom ChatRoom { get; set; } = null!;

    public SupportTicketStatus Status { get; set; }

    public DateTime? ClosedAt { get; set; }

    // RegionId را برای آینده در نظر می گیریم
    // public int? RegionId { get; set; }
    // public virtual Region? Region { get; set; }
}
