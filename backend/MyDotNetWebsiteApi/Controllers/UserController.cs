using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

// Note: Permissions are not in this file.
// Instead, permissions are in the Services level, specifically in backend/MyDotNetWebsiteApi/Services/UserService.cs
// and specifically in the PermissionHelper file backend/MyDotNetWebsiteApi/Services/PermissionHelper.cs

// Note: Route resolves to "api/user" (singular) — this is intentional and consistent with the frontend.
// REST convention favors plural ("api/users") but changing it would require a coordinated frontend + backend update.
[ApiController]
[Route("api/[controller]")]
[Authorize]  // Means this using this controller needs a JwtToken aka needs to be logged in
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }



    // Routing and Endpoints

    // Returns app-wide default appearance values — public so the frontend can apply them on first visit.
    [HttpGet("appearance-defaults")]
    [AllowAnonymous]
    public IActionResult GetAppearanceDefaults()
    {
        return Ok(new { theme = AppearanceDefaults.Theme, modifier = AppearanceDefaults.Modifier });
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = AppConstants.DefaultPageSize)
    {
        var requesterUserId = User.RequireId();  // [Authorize] at the top guarantees the claim is present; RequireId() throws loudly if it ever isn't
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, AppConstants.DefaultPageSize);
        var result = await _userService.GetAllUsersAsync(requesterUserId, page, pageSize);
        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }

    // Saves the caller's theme preference — no permission check needed (own data only).
    [HttpPatch("me/theme")]
    public async Task<IActionResult> UpdateMyTheme([FromBody] UpdateUserThemeDto dto)
    {
        var userId = User.RequireId();
        var result = await _userService.UpdateUserThemeAsync(userId, dto.Theme);
        return result.ToActionResult(this);
    }

    // Saves the caller's style modifier preference (e.g. "glass"); null clears it.
    [HttpPatch("me/modifier")]
    public async Task<IActionResult> UpdateMyModifier([FromBody] UpdateUserModifierDto dto)
    {
        var userId = User.RequireId();
        var result = await _userService.UpdateUserModifierAsync(userId, dto.Modifier);
        return result.ToActionResult(this);
    }

    // Changes the caller's username.
    [HttpPatch("me/username")]
    public async Task<IActionResult> UpdateMyUsername([FromBody] UpdateUsernameDto dto)
    {
        var userId = User.RequireId();
        var result = await _userService.UpdateUsernameAsync(userId, dto);
        return result.ToActionResult(this);
    }

    // Changes the caller's password; requires current password for verification.
    [HttpPatch("me/password")]
    public async Task<IActionResult> UpdateMyPassword([FromBody] UpdatePasswordDto dto)
    {
        var userId = User.RequireId();
        var result = await _userService.UpdatePasswordAsync(userId, dto);
        return result.ToActionResult(this);
    }


    // Update a User's Role
    [HttpPatch("{targetUserId}/role")]
    public async Task<IActionResult> UpdateUserRole(string targetUserId, [FromBody] UpdateUserRoleDto dto)
    {
        var requesterUserId = User.RequireId();  // [Authorize] at the top guarantees the claim is present; RequireId() throws loudly if it ever isn't

        // Reminder: Permissions for whether a requesterUser is allowed to change a targetUser's Role is inside the Serivces layer, 
        // specifically in /backend/MyDotNetWebsiteApi/Services/UserService.cs
        // through the specific permissions check is in
        // specifically in /backend/MyDotNetWebsiteApi/Services/PermissionHelper.cs
        var result = await _userService.UpdateUserRoleAsync(targetUserId, dto, requesterUserId);

        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }



}