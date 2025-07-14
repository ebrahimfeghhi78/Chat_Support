namespace Chat_Support.Domain.Entities;

public class UserGroup : BaseEntity
{
    public int UserId { get; set; }
    public int GroupId { get; set; }

    public virtual User? User { get; set; }
    public virtual Group? Group { get; set; }
}
