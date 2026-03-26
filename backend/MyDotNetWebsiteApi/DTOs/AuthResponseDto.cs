// Returned by login, register, and refresh endpoints.
// accessToken goes to Redux/localStorage (short-lived, 15 min).
// The refresh token travels exclusively as an HttpOnly cookie — never in this DTO.
public class AuthResponseDto
{
    public string AccessToken { get; init; } = string.Empty;
    public string RoleLevel { get; init; } = string.Empty;
    public string UserName { get; init; } = string.Empty;
}
