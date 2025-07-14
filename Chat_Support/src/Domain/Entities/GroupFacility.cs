using Chat_Support.Domain.Common;

namespace Chat_Support.Domain.Entities;

public class GroupFacility : BaseEntity
{
    public int? GroupId { get; set; }
    public string? TableName { get; set; }
    public int? FacilityId { get; set; }
    public string? AccessType { get; set; }
    public int? LinkId { get; set; }
    public int? DLinkId { get; set; }

    // Navigation Properties
    public virtual Group? Group { get; set; }
}
