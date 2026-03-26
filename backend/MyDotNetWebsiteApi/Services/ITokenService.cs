public interface ITokenService
{
    // Generates a short-lived JWT (15 min). Used on login, register, and refresh.
    // Short lifetime limits the damage window if an access token is intercepted.
    string GenerateAccessToken(AppUser user);

    // Generates a cryptographically random refresh token string (not a JWT).
    // Stored in the DB and delivered via HttpOnly cookie — never in the response body.
    string GenerateRefreshToken();
}
