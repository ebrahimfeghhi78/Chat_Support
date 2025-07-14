namespace Chat_Support.Domain.Entities;

public class SupportAgent : BaseAuditableEntity
{
    public int UserId { get; set; }
    public bool IsActive { get; set; }
    public int? MaxConcurrentChats { get; set; }
    public DateTime? LastActivityAt { get; set; }

    public virtual User? User { get; set; }
    public virtual ICollection<SupportTicket>? AssignedTickets { get; set; }
}
