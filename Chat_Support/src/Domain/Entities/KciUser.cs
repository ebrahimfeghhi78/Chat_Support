﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Chat_Support.Domain.Entities;

[Table("KCI_Users")]
[Index("UserName", Name = "IX_KCI_UserName", IsUnique = true)]
public partial class KciUser
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [StringLength(50)]
    public string FirstName { get; set; }

    [StringLength(50)]
    public string LastName { get; set; }

    [StringLength(50)]
    public string UserName { get; set; }

    [StringLength(255)]
    public string Description { get; set; }

    [StringLength(255)]
    public string Password { get; set; }

    [StringLength(50)]
    [Unicode(false)]
    public string Email { get; set; }

    public bool? Enable { get; set; }

    public int? StafId { get; set; }

    public long? DateEnter { get; set; }

    [StringLength(1)]
    [Unicode(false)]
    public string Sex { get; set; }

    [StringLength(50)]
    public string FatherName { get; set; }

    [StringLength(30)]
    public string Number { get; set; }

    [StringLength(22)]
    public string BirthDate { get; set; }

    [StringLength(50)]
    public string Degree { get; set; }

    [StringLength(30)]
    public string Tel { get; set; }

    [StringLength(200)]
    public string Address { get; set; }

    [StringLength(50)]
    public string ImageName { get; set; }

    public int? RegionId { get; set; }

    public int? Post { get; set; }

    public bool? ShowPublic { get; set; }

    [StringLength(50)]
    public string Mobile { get; set; }

    [StringLength(15)]
    public string CodeMeli { get; set; }

    public int? WorkPlace { get; set; }

    [StringLength(15)]
    public string CodePosti { get; set; }

    [StringLength(50)]
    public string SecurityQuestion { get; set; }

    [StringLength(50)]
    public string SecurityAnswer { get; set; }

    public int? OrgId { get; set; }

    public bool AccessFlag { get; set; }

    [Required]
    [StringLength(50)]
    public string ActiveDirectoryUserName { get; set; }

    public int? EndSessionTime { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? LastPasswordChangeDate { get; set; }

    public int? LoginAttemptCount { get; set; }

    public bool? HasLoggedIn { get; set; }





    // Navigation Properties
    public virtual Region Region { get; set; }

    // رابطه Many-to-Many با Groups
    public virtual ICollection<KciAssignedUser> KciAssignedUsers { get; set; } = new List<KciAssignedUser>();

    // دسترسی‌های شخصی
    public virtual ICollection<UserFacility> UserFacilities { get; set; } = new List<UserFacility>();

    // نواحی اضافی کاربر
    public virtual ICollection<CmsUserRegion> UserRegions { get; set; } = new List<CmsUserRegion>();

    // برای سیستم چت
    public virtual ICollection<ChatRoomMember> ChatRoomMemberships { get; set; } = new List<ChatRoomMember>();
    public virtual ICollection<ChatMessage> SentMessages { get; set; } = new List<ChatMessage>();
    public virtual ICollection<UserConnection> Connections { get; set; } = new List<UserConnection>();
    public virtual ICollection<MessageStatus> MessageStatuses { get; set; } = new List<MessageStatus>();
    public virtual ICollection<MessageReaction> MessageReactions { get; set; } = new List<MessageReaction>();

    // برای سیستم پشتیبانی
    public virtual ICollection<SupportTicket> SupportTicketsAsRequester { get; set; } = new List<SupportTicket>();
    public virtual ICollection<TicketReply> TicketReplies { get; set; } = new List<TicketReply>();

    // اگر کاربر Agent باشد
    public virtual SupportAgent SupportAgent { get; set; }

    // فایل‌های آپلود شده
    public virtual ICollection<ChatFileMetadata> UploadedFiles { get; set; } = new List<ChatFileMetadata>();

    // ChatRooms ایجاد شده توسط کاربر
    public virtual ICollection<ChatRoom> CreatedChatRooms { get; set; } = new List<ChatRoom>();

    //فیلد های جدید حذف شدند و به SupportAgent منتقل می‌شوند
}
