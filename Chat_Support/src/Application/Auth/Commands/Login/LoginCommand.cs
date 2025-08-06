using Chat_Support.Application.Common.Interfaces;
using Chat_Support.Application.Auth.Queries.GetUser;

namespace Chat_Support.Application.Auth.Commands.Login;

public record LoginCommand : IRequest<AuthResult>
{
    public string UserName { get; init; } = null!;
    public string Password { get; init; } = null!;
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IIdentityService _identityService;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IIdentityService identityService,
        ITokenService tokenService)
    {
        _context = context;
        _identityService = identityService;
        _tokenService = tokenService;
    }

    public async Task<AuthResult> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.KciUsers
            .Include(u => u.UserRegions)
            .ThenInclude(ru => ru.Region)
            .FirstOrDefaultAsync(u => u.UserName == request.UserName, cancellationToken);

        if (user == null)
            return new AuthResult { Succeeded = false, Error = "Invalid credentials" };

        var result = await _identityService.ValidateCredentialsAsync(user.UserName!, request.Password);
        if (!result.Succeeded)
            return new AuthResult { Succeeded = false, Error = "Invalid credentials" };

        var regions = user.UserRegions
            .Select(ru => new RegionDto
            {
                Id = ru.Region!.Id,
                Name = ru.Region.Name,
                DomainUrl = ru.Region.RelatedUri,
            })
            .ToList();


        int? selectedRegionId = regions.Count == 1 ? regions.First().Id : null;
        var token = await _tokenService.GenerateTokenAsync(user, selectedRegionId);
        var (refreshToken, refreshTokenExpiry) = await _tokenService.GenerateRefreshTokenAsync(user);

        return new AuthResult
        {
            Succeeded = true,
            Data = new AuthResponseDto
            {
                UserId = user.Id.ToString(),
                UserName = user.UserName!,
                AccessToken = token,
                RefreshToken = refreshToken,
                RefreshTokenExpiration = refreshTokenExpiry,
                AvailableRegions = regions.Count > 1 ? regions : null,
                SelectedRegion = regions.Count == 1 ? regions.First() : null
            }
        };
    }
}
