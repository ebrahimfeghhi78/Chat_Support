namespace Chat_Support.Application.Auth.Queries.GetUser;

public class RegionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = null!;
    public string? DomainUrl { get; init; }
    public string HomePage { get; init; } = "\\home";
}
