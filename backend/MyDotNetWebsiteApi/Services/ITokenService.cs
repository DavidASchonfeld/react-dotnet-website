public interface ITokenService
{
    string GenerateJwtToken(AppUser user);
}