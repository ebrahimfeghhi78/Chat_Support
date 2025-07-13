namespace Chat_Support.Domain.Entities;

public partial class TicketReply : BaseAuditableEntity
{

    public int TicketId { get; set; }

    public required string UserId { get; set; }

    public string Message { get; set; } = null!;

    public virtual SupportTicket Ticket { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
