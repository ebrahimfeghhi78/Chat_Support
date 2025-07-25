﻿using Chat_Support.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace Chat_Support.Infrastructure.Service;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly string _baseUrl;
    private readonly string _uploadPath;

    public FileStorageService(
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _environment = environment;
        _configuration = configuration;
        _baseUrl = configuration["FileStorage:BaseUrl"] ?? "https://localhost:5001";
        _uploadPath = Path.Combine(_environment.WebRootPath, "uploads");

        // Ensure upload directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<string> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string folderPath,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Create folder structure
            var fullFolderPath = Path.Combine(_uploadPath, folderPath);
            if (!Directory.Exists(fullFolderPath))
            {
                Directory.CreateDirectory(fullFolderPath);
            }

            // Generate safe file name
            var safeFileName = GenerateSafeFileName(fileName);
            var filePath = Path.Combine(fullFolderPath, safeFileName);

            // Save file
            using (var fileOutputStream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(fileOutputStream, cancellationToken);
            }

            // Return relative URL
            var relativePath = Path.Combine("uploads", folderPath, safeFileName)
                .Replace("\\", "/");

            return $"/{relativePath}";
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload file: {ex.Message}", ex);
        }
    }

    public Task<(Stream Stream, string ContentType, string FileName)> DownloadFileAsync(
        string filePath,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Clean the path to prevent directory traversal
            var cleanPath = CleanPath(filePath);
            var fullPath = Path.Combine(_environment.WebRootPath, cleanPath);

            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException("File not found", filePath);
            }

            var fileName = Path.GetFileName(fullPath);
            var contentType = GetContentType(fileName);
            var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);

            return Task.FromResult<(Stream Stream, string ContentType, string FileName)>((stream, contentType, fileName));
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to download file: {ex.Message}", ex);
        }
    }

    public Task<bool> DeleteFileAsync(
        string filePath,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var cleanPath = CleanPath(filePath);
            var fullPath = Path.Combine(_environment.WebRootPath, cleanPath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to delete file: {ex.Message}", ex);
        }
    }

    public Task<bool> FileExistsAsync(
        string filePath,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var cleanPath = CleanPath(filePath);
            var fullPath = Path.Combine(_environment.WebRootPath, cleanPath);
            return Task.FromResult(File.Exists(fullPath));
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    private string GenerateSafeFileName(string fileName)
    {
        // Remove any path information
        fileName = Path.GetFileName(fileName);

        // Replace spaces and special characters
        var safeName = fileName.Replace(" ", "_");

        // Remove any remaining unsafe characters
        foreach (var c in Path.GetInvalidFileNameChars())
        {
            safeName = safeName.Replace(c.ToString(), "");
        }

        // Ensure unique filename
        var nameWithoutExtension = Path.GetFileNameWithoutExtension(safeName);
        var extension = Path.GetExtension(safeName);
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = Guid.NewGuid().ToString("N").Substring(0, 8);

        return $"{nameWithoutExtension}_{timestamp}_{random}{extension}";
    }

    private string CleanPath(string path)
    {
        // Remove any attempt at directory traversal
        path = path.Replace("..", "");
        path = path.Replace("~", "");

        // Normalize slashes
        path = path.Replace("\\", "/");

        // Remove multiple slashes
        while (path.Contains("//"))
        {
            path = path.Replace("//", "/");
        }

        // Remove leading slash
        if (path.StartsWith("/"))
        {
            path = path.Substring(1);
        }

        return path;
    }

    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        return extension switch
        {
            // Images
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            ".bmp" => "image/bmp",

            // Videos
            ".mp4" => "video/mp4",
            ".avi" => "video/x-msvideo",
            ".mov" => "video/quicktime",
            ".wmv" => "video/x-ms-wmv",
            ".flv" => "video/x-flv",
            ".webm" => "video/webm",
            ".mkv" => "video/x-matroska",

            // Audio
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            ".aac" => "audio/aac",
            ".flac" => "audio/flac",

            // Documents
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt" => "text/plain",
            ".rtf" => "application/rtf",
            ".csv" => "text/csv",

            // Archives
            ".zip" => "application/zip",
            ".rar" => "application/x-rar-compressed",
            ".7z" => "application/x-7z-compressed",
            ".tar" => "application/x-tar",
            ".gz" => "application/gzip",

            _ => "application/octet-stream"
        };
    }
}
