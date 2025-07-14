using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class UserFacilityConfiguration : IEntityTypeConfiguration<UserFacility>
{
    public void Configure(EntityTypeBuilder<UserFacility> builder)
    {
        builder.ToTable("UserFacilities");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .UseIdentityColumn();

        builder.Property(e => e.RegionId)
            .HasColumnName("Regionid"); // توجه به case

        builder.Property(e => e.UserId)
            .HasColumnName("UserID"); // توجه به case

        builder.Property(e => e.TableName)
            .HasColumnName("TableName")
            .HasMaxLength(50)
            .IsUnicode(false); // varchar

        builder.Property(e => e.FacilityId)
            .HasColumnName("FacilityId");

        builder.Property(e => e.AccessType)
            .HasColumnName("AccessType")
            .HasMaxLength(1)
            .IsUnicode(false) // char
            .IsFixedLength();

        builder.Property(e => e.LinkId)
            .HasColumnName("LinkId");

        builder.Property(e => e.DLinkId)
            .HasColumnName("DLinkId");

        builder.HasOne(e => e.User)
            .WithMany(u => u.UserFacilities)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Region)
            .WithMany()
            .HasForeignKey(e => e.RegionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.FacilityId);
    }
}
