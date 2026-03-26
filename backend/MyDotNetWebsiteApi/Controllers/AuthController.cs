
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        ITokenService tokenService,
        AppDbContext context,
        IConfiguration configuration,
        IWebHostEnvironment env)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _context = context;
        _configuration = configuration;
        _env = env;
    }


    [HttpPost("register")]
    [EnableRateLimiting(RateLimiterExtensions.AuthPolicy)]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
    {
        var user = new AppUser
        {
            UserName = dto.UserName,
            Email = dto.Email
        };

        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Create the 4 default non-deleteable lists for the new user
        await DefaultMediaListSeederService.SeedDefaultListsForUserAsync(_context, user);
        await _context.SaveChangesAsync();

        var response = await IssueTokenPairAsync(user);
        return Ok(response);
    }


    [HttpPost("login")]
    [EnableRateLimiting(RateLimiterExtensions.AuthPolicy)]
    public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
    {
        AppUser? userToCheck = await _userManager.FindByNameAsync(dto.UserName);
        if (userToCheck == null)
            return Unauthorized("Invalid username or password");

        // Last parameter false = do not lock out on failed attempts
        var resultPasswordCheck = await _signInManager.CheckPasswordSignInAsync(userToCheck, dto.Password, false);
        if (!resultPasswordCheck.Succeeded)
            return Unauthorized("Invalid username or password");

        var response = await IssueTokenPairAsync(userToCheck);
        return Ok(response);
    }


    // Silently exchanges a valid refresh token cookie for a new access token + rotated refresh token.
    // The refresh token travels only via HttpOnly cookie — never in the request body.
    [HttpPost("refresh")]
    [EnableRateLimiting(RateLimiterExtensions.AuthPolicy)]
    public async Task<IActionResult> Refresh()
    {
        // Read the refresh token from the HttpOnly cookie.
        // It cannot arrive via JS (XSS-proof) and is scoped to this origin (CSRF-proof with SameSite=Strict).
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized("No refresh token provided.");

        var user = _userManager.Users.FirstOrDefault(u => u.RefreshToken == refreshToken);
        if (user == null)
            return Unauthorized("Invalid refresh token.");

        // Reject expired refresh sessions — user must log in again.
        if (user.RefreshTokenExpiry == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            return Unauthorized("Refresh token has expired.");

        // Rotate: issue a new token pair and replace the old refresh token in the DB.
        var response = await IssueTokenPairAsync(user);
        return Ok(response);
    }


    // Invalidates the server-side refresh token so a stolen cookie cannot be reused after logout.
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId != null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                // Null out the stored token — any refresh attempt with the old cookie now returns 401.
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _userManager.UpdateAsync(user);
            }
        }

        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }


    // Generates a new access + refresh token pair, persists the refresh token to the DB,
    // and writes it to an HttpOnly cookie on the response.
    private async Task<AuthResponseDto> IssueTokenPairAsync(AppUser user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var refreshExpiry = DateTime.UtcNow.AddDays(
            Convert.ToDouble(_configuration["JwtSettings:RefreshTokenExpiryDays"]));

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = refreshExpiry;
        await _userManager.UpdateAsync(user);

        SetRefreshTokenCookie(refreshToken, refreshExpiry);

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RoleLevel = user.RoleLevel.ToString(),
            UserName = user.UserName!,
            PreferredTheme = user.PreferredTheme  // return saved theme so client can restore it
        };
    }


    // Writes the refresh token as an HttpOnly cookie.
    // HttpOnly: JavaScript cannot read it — prevents XSS token theft.
    // Secure: sent over HTTPS only in production (false in dev so http://localhost works).
    // SameSite=Strict: never sent on cross-site requests — prevents CSRF attacks.
    private void SetRefreshTokenCookie(string refreshToken, DateTime expiry)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Expires = expiry
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
