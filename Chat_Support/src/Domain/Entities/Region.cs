namespace Chat_Support.Domain.Entities;

public class Region : BaseEntity
{
    public string? Name { get; set; }
    public string? Title { get; set; }
    public int? ParentId { get; set; }

    // ویژگی‌های تکمیلی مطابق با RegionConfiguration
    public string? RelatedURI { get; set; }
    public string? KeywordsMetaTag { get; set; }
    public string? DescriptionMetaTag { get; set; }
    public int? StoregeLimit { get; set; } // توجه به اشتباه تایپی
    public int? UsersLimit { get; set; }
    public int? DatabaseLimit { get; set; }

    public virtual ICollection<User>? Users { get; set; }
    public virtual ICollection<UserRegion>? UserRegions { get; set; }
    public virtual ICollection<ChatRoom>? ChatRooms { get; set; }
}
