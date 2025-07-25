﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Chat_Support.Domain.Entities;

[Index("Id", Name = "IX_UserFacilities")]
[Index("UserId", Name = "IX_UserFacilities_1")]
[Index("TableName", Name = "IX_UserFacilities_2")]
[Index("FacilityId", Name = "IX_UserFacilities_3")]
public partial class UserFacility
{
    /// <summary>
    /// کلید
    /// </summary>
    [Key]
    [Column("id")]
    public int Id { get; set; }

    public int? Regionid { get; set; }

    /// <summary>
    /// کد کاربر مربوطه - کلید به kci_users
    /// </summary>
    [Column("UserID")]
    public int? UserId { get; set; }

    /// <summary>
    /// نام جدول مربوطه - کلید به databases
    /// </summary>
    [StringLength(50)]
    [Unicode(false)]
    public string TableName { get; set; }

    /// <summary>
    /// ماژول مربوطه - کلید به جدول facilities
    /// </summary>
    public int? FacilityId { get; set; }

    /// <summary>
    /// نوع دسترسی y/n
    /// </summary>
    [StringLength(1)]
    [Unicode(false)]
    public string AccessType { get; set; }

    /// <summary>
    /// کد لینک مربوطه - کلید به جدول CMS_Links
    /// </summary>
    public int? LinkId { get; set; }

    /// <summary>
    /// کد لینک مربوطه - کلید به جدول CMSDirectLinks
    /// </summary>
    [Column("DLinkId")]
    public int? DlinkId { get; set; }


    // Navigation Properties
    public virtual KciUser User { get; set; }
    public virtual Region Region { get; set; }
}
