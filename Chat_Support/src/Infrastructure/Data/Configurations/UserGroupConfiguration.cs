using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class UserGroupConfiguration : IEntityTypeConfiguration<UserGroup>
{
    public void Configure(EntityTypeBuilder<UserGroup> builder)
    {
        builder.ToTable("KCI_AssignedUsers");

        builder.HasKey(e => e.Id)
            .HasName("PK_KCI_AssignedUsers");

        builder.Property(e => e.UserId)
            .HasColumnName("UserId");

        builder.Property(e => e.GroupId)
            .HasColumnName("GroupId");

        builder.HasOne(e => e.User)
            .WithMany(u => u.UserGroups)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Group)
            .WithMany(g => g.UserGroups)
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.GroupId);
    }
}
