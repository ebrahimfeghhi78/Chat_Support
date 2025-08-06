namespace Chat_Support.Application.Auth.Queries.GetUser;
public class AuthResponseDto
{
    public string UserId { get; init; } = null!;
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
    public int RegionId { get; set; }
    public string UserName { get; init; } = null!;
    public string AccessToken { get; init; } = null!; 
    public string RefreshToken { get; init; } = null!;
    public DateTime RefreshTokenExpiration { get; init; }
    public List<RegionDto>? AvailableRegions { get; init; }
    public RegionDto? SelectedRegion { get; init; }
    
}
