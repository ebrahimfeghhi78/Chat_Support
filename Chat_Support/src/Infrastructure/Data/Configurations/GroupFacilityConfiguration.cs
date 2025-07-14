using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class GroupFacilityConfiguration : IEntityTypeConfiguration<GroupFacility>
{
    public void Configure(EntityTypeBuilder<GroupFacility> builder)
    {
        builder.ToTable("GroupFacilities");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .UseIdentityColumn();

        builder.Property(e => e.GroupId)
            .HasColumnName("GroupId");

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

        builder.HasOne(e => e.Group)
            .WithMany(g => g.GroupFacilities)
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.GroupId);
        builder.HasIndex(e => e.FacilityId);
    }
}
