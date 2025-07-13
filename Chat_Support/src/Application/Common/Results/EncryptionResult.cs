using System;
using LawyerProject.Application.Common.Models;

namespace LawyerProject.Application.Common.Results;

public class EncryptionResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public EncryptedData? EncryptedData { get; set; }
    public string? FilePath { get; set; }
}
