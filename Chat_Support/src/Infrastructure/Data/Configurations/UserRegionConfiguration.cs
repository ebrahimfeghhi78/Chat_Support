using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class UserRegionConfiguration : IEntityTypeConfiguration<UserRegion>
{
    public void Configure(EntityTypeBuilder<UserRegion> builder)
    {
        builder.ToTable("CMS_UserRegions");

        builder.HasKey(e => e.Id)
            .HasName("PK_CMS_UserRegions");

        builder.Property(e => e.Id)
            .HasColumnName("Id")
            .UseIdentityColumn();

        builder.Property(e => e.UserId)
            .HasColumnName("UserId");

        builder.Property(e => e.RegionId)
            .HasColumnName("RegionId");

        builder.HasOne(e => e.User)
            .WithMany(u => u.UserRegions)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Region)
            .WithMany(r => r.UserRegions)
            .HasForeignKey(e => e.RegionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ایندکس یونیک برای جلوگیری از تکرار
        builder.HasIndex(e => new { e.UserId, e.RegionId })
            .IsUnique();
    }
}
