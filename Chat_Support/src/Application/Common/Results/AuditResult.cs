using System;
using System.Collections.Generic;
using LawyerProject.Application.Audit.Queries;

namespace LawyerProject.Application.Common.Results;

public class AuditResult
{
    public bool Succeeded { get; set; }

    public string? Error { get; set; }

    public List<FileAccessLogDto>? AccessLogs { get; set; }

    public List<SecurityAlertDto>? SecurityAlerts { get; set; }
}
