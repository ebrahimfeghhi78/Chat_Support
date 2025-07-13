using System;
using System.IO;

namespace LawyerProject.Application.Common.Results;

public class DecryptionResult
{
    public bool Succeeded { get; set; }

    public string? Error { get; set; }

    public byte[]? DecryptedData { get; set; }

    public Stream? DecryptedStream { get; set; }
    public string? FileName { get; set; }
    public string? ContentType { get; set; }
    public Stream? Stream { get; set; }
}
