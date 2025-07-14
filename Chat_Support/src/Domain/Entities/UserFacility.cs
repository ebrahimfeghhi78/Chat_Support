using Chat_Support.Domain.Common;

namespace Chat_Support.Domain.Entities;

public class UserFacility : BaseEntity
{
    public int? RegionId { get; set; }
    public int? UserId { get; set; }
    public string? TableName { get; set; }
    public int? FacilityId { get; set; }
    public string? AccessType { get; set; }
    public int? LinkId { get; set; }
    public int? DLinkId { get; set; }

    // Navigation Properties
    public virtual User? User { get; set; }
    public virtual Region? Region { get; set; }
}
