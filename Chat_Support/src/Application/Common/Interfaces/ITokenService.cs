using System.Security.Claims;
using LawyerProject.Application.Common.Results;
using LawyerProject.Domain.Entities;

namespace LawyerProject.Application.Common.Interfaces;

public interface ITokenService
{
    Task<string> GenerateTokenAsync(User user, int? regionId = null);
    Task<string> GenerateRefreshTokenAsync();
    Task<TokenValidationResult> ValidateTokenAsync(string token);
    Task<ClaimsPrincipal?> GetPrincipalFromTokenAsync(string token);
    string? ValidateToken(string token);
    Task RevokeTokenAsync(string userId);
    Task<(string refreshToken, DateTime expiryTime)> GenerateRefreshTokenAsync(User user);
    string? GetClaimFromToken(string token, string claimType);
}
