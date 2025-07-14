using Chat_Support.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat_Support.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Table configuration
        builder.ToTable("KCI_Users");

        builder.HasKey(e => e.Id)
            .HasName("PK_KCI_Users");

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .UseIdentityColumn();

        // Properties configuration
        builder.Property(e => e.FirstName)
            .HasColumnName("FirstName")
            .HasMaxLength(50);

        builder.Property(e => e.LastName)
            .HasColumnName("LastName")
            .HasMaxLength(50);

        builder.Property(e => e.UserName)
            .HasColumnName("UserName")
            .HasMaxLength(50);

        builder.Property(e => e.Description)
            .HasColumnName("Description")
            .HasMaxLength(255);

        builder.Property(e => e.Password)
            .HasColumnName("Password")
            .HasMaxLength(255);

        builder.Property(e => e.Email)
            .HasColumnName("Email")
            .HasMaxLength(50)
            .IsUnicode(false); // varchar

        builder.Property(e => e.Enable)
            .HasColumnName("Enable");

        builder.Property(e => e.StafId)
            .HasColumnName("StafId");

        builder.Property(e => e.DateEnter)
            .HasColumnName("DateEnter");

        builder.Property(e => e.Sex)
            .HasColumnName("Sex")
            .HasMaxLength(1)
            .IsUnicode(false) // char
            .IsFixedLength();

        builder.Property(e => e.FatherName)
            .HasColumnName("FatherName")
            .HasMaxLength(50);

        builder.Property(e => e.Number)
            .HasColumnName("Number")
            .HasMaxLength(30);

        builder.Property(e => e.BirthDate)
            .HasColumnName("BirthDate")
            .HasMaxLength(22);

        builder.Property(e => e.Degree)
            .HasColumnName("Degree")
            .HasMaxLength(50);

        builder.Property(e => e.Tel)
            .HasColumnName("Tel")
            .HasMaxLength(30);

        builder.Property(e => e.Address)
            .HasColumnName("Address")
            .HasMaxLength(200);

        builder.Property(e => e.ImageName)
            .HasColumnName("ImageName")
            .HasMaxLength(50);

        builder.Property(e => e.RegionId)
            .HasColumnName("RegionId");

        builder.Property(e => e.Post)
            .HasColumnName("Post");

        builder.Property(e => e.ShowPublic)
            .HasColumnName("ShowPublic");

        builder.Property(e => e.Mobile)
            .HasColumnName("Mobile")
            .HasMaxLength(50);

        builder.Property(e => e.CodeMeli)
            .HasColumnName("CodeMeli")
            .HasMaxLength(15);

        builder.Property(e => e.WorkPlace)
            .HasColumnName("WorkPlace");

        builder.Property(e => e.CodePosti)
            .HasColumnName("CodePosti")
            .HasMaxLength(15);

        builder.Property(e => e.SecurityQuestion)
            .HasColumnName("SecurityQuestion")
            .HasMaxLength(50);

        builder.Property(e => e.SecurityAnswer)
            .HasColumnName("SecurityAnswer")
            .HasMaxLength(50);

        builder.Property(e => e.OrgId)
            .HasColumnName("OrgId");

        builder.Property(e => e.AccessFlag)
            .HasColumnName("AccessFlag")
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(e => e.ActiveDirectoryUserName)
            .HasColumnName("ActiveDirectoryUserName")
            .HasMaxLength(50)
            .IsRequired()
            .HasDefaultValue("");

        builder.Property(e => e.EndSessionTime)
            .HasColumnName("EndSessionTime");

        builder.Property(e => e.LastPasswordChangeDate)
            .HasColumnName("LastPasswordChangeDate")
            .HasColumnType("datetime")
            .HasDefaultValueSql("getdate()");

        builder.Property(e => e.LoginAttemptCount)
            .HasColumnName("LoginAttemptCount")
            .HasDefaultValue(0);

        builder.Property(e => e.HasLoggedIn)
            .HasColumnName("HasLoggedIn")
            .HasDefaultValue(false);

        // Indexes
        builder.HasIndex(e => e.UserName)
            .HasDatabaseName("IX_KCI_UserName")
            .IsUnique();

        // Relationships
        builder.HasMany(e => e.SentMessages)
            .WithOne(m => m.Sender)
            .HasForeignKey(m => m.SenderId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.CreatedChatRooms)
            .WithOne()
            .HasForeignKey(cr => cr.CreatedById)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.ChatRoomMemberships)
            .WithOne(m => m.User)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.UserGroups)
            .WithOne(ug => ug.User)
            .HasForeignKey(ug => ug.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.UserFacilities)
            .WithOne(uf => uf.User)
            .HasForeignKey(uf => uf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.UserRegions)
            .WithOne(ur => ur.User)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Connections)
            .WithOne(c => c.User)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.MessageStatuses)
            .WithOne(ms => ms.User)
            .HasForeignKey(ms => ms.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.MessageReactions)
            .WithOne(mr => mr.User)
            .HasForeignKey(mr => mr.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.SupportTicketsAsRequester)
            .WithOne(st => st.RequesterUser)
            .HasForeignKey(st => st.RequesterUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.TicketReplies)
            .WithOne(tr => tr.User)
            .HasForeignKey(tr => tr.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.UploadedFiles)
            .WithOne(f => f.UploadedBy)
            .HasForeignKey(f => f.UploadedById)
            .OnDelete(DeleteBehavior.Restrict);

        // One-to-One relationship
        builder.HasOne(e => e.SupportAgent)
            .WithOne(sa => sa.User)
            .HasForeignKey<SupportAgent>(sa => sa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Region relationship
        builder.HasOne(e => e.Region)
            .WithMany()
            .HasForeignKey(e => e.RegionId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Ignore computed properties
        builder.Ignore(e => e.FullName);
        builder.Ignore(e => e.IsActive);
    }
}
