using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class RegionConfiguration : IEntityTypeConfiguration<Region>
{
    public void Configure(EntityTypeBuilder<Region> builder)
    {
        builder.ToTable("Regions");

        builder.HasKey(e => e.Id)
            .HasName("PK_Regions");

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .UseIdentityColumn();

        builder.Property(e => e.Name)
            .HasColumnName("name")
            .HasMaxLength(200);

        builder.Property(e => e.Title)
            .HasColumnName("title")
            .HasMaxLength(200);

        builder.Property(e => e.ParentId)
            .HasColumnName("ParentId");

        builder.Property(e => e.RelatedURI)
            .HasColumnName("RelatedURI")
            .HasMaxLength(200);

        builder.Property(e => e.KeywordsMetaTag)
            .HasColumnName("KeywordsMetaTag")
            .HasMaxLength(1000);

        builder.Property(e => e.DescriptionMetaTag)
            .HasColumnName("DescriptionMetaTag")
            .HasMaxLength(1000);

        builder.Property(e => e.StoregeLimit)
            .HasColumnName("StoregeLimit"); // توجه به اشتباه تایپی در دیتابیس

        builder.Property(e => e.UsersLimit)
            .HasColumnName("UsersLimit");

        builder.Property(e => e.DatabaseLimit)
            .HasColumnName("DatabaseLimit");

        // Self-referencing relationship
        builder.HasOne<Region>()
            .WithMany()
            .HasForeignKey(e => e.ParentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Navigation properties
        builder.HasMany(e => e.Users)
            .WithOne(u => u.Region)
            .HasForeignKey(u => u.RegionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.UserRegions)
            .WithOne(ur => ur.Region)
            .HasForeignKey(ur => ur.RegionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.ChatRooms)
            .WithOne(cr => cr.Region)
            .HasForeignKey(cr => cr.RegionId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
