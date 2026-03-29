using System.Security.Claims;

// Extension methods for ClaimsPrincipal to make claim access safer and more expressive.
public static class ClaimsPrincipalExtensions
{
    // Returns the authenticated user's ID, or throws if the claim is missing.
    // Use on [Authorize]-protected endpoints where the NameIdentifier claim is guaranteed.
    // A null here means auth is misconfigured — failing loudly is better than a silent null-dereference.
    public static string RequireId(this ClaimsPrincipal principal)
    {
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return id ?? throw new InvalidOperationException(
            "NameIdentifier claim is missing. Ensure this endpoint is protected by [Authorize] and the JWT includes the 'sub' claim.");
    }
}
