namespace Chat_Support.Domain.Entities;

public class UserRegion : BaseEntity
{
    public int UserId { get; set; }
    public int RegionId { get; set; }

    public virtual User? User { get; set; }
    public virtual Region? Region { get; set; }
}
