using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.ToTable("KCI_Groups");

        builder.HasKey(e => e.Id)
            .HasName("PK_KCI_Groups");

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .UseIdentityColumn();

        builder.Property(e => e.Name)
            .HasColumnName("Name")
            .HasMaxLength(50);

        builder.Property(e => e.Description)
            .HasColumnName("Description")
            .HasMaxLength(255);

        builder.Property(e => e.ParentId)
            .HasColumnName("ParentId");

        // Self-referencing relationship
        builder.HasOne<Group>()
            .WithMany()
            .HasForeignKey(e => e.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relations
        builder.HasMany(e => e.UserGroups)
            .WithOne(ug => ug.Group)
            .HasForeignKey(ug => ug.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.GroupFacilities)
            .WithOne(gf => gf.Group)
            .HasForeignKey(gf => gf.GroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
