namespace Chat_Support.Domain.Entities;

public class Group : BaseEntity
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? ParentId { get; set; }

    public virtual ICollection<UserGroup>? UserGroups { get; set; }
    public virtual ICollection<GroupFacility>? GroupFacilities { get; set; }
}
