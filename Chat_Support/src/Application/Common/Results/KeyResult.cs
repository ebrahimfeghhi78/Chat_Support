using System;
using System.Collections.Generic;
using LawyerProject.Application.Keys.Queries;

namespace LawyerProject.Application.Common.Results;

public class KeyResult
{
    public bool Succeeded { get; set; }

    public string? Error { get; set; }

    public KeyDto? Key { get; set; }

    public List<KeyDto>? Keys { get; set; }
}
