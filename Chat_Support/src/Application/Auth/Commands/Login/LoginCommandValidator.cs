namespace Chat_Support.Application.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(v => v.UserName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(v => v.Password)
            .NotEmpty()
            .MinimumLength(6)
            .MaximumLength(100);
    }
}
