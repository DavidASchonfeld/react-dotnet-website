using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// Note: Permissions are not in this file.
// Instead, permissions are in the Services level, specifically in backend/MyDotNetWebsiteApi/Services/UserService.cs
// and specifically in the PermissionHelper file backend/MyDotNetWebsiteApi/Services/PermissionHelper.cs

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

    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = AppConstants.DefaultPageSize)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;  // I am adding a "!" here to tell C# that this will never return a null. I know this because this controller has a [Authorize] at the top, meaning that the user will always be logged in before he ever encounters this part of the code.
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, AppConstants.DefaultPageSize);
        var result = await _userService.GetAllUsersAsync(requesterUserId, page, pageSize);
        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }

    // Update a User's Role
    [HttpPatch("{targetUserId}/role")]
    public async Task<IActionResult> UpdateUserRole(string targetUserId, [FromBody] UpdateUserRoleDto dto)
    {
        var requesterUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;  // I am adding a "!" here to tell C# that this will never return a null. I know this because this controller has a [Authorize] at the top, meaning that the user will always be logged in before he ever encounters this part of the code.

        // Reminder: Permissions for whether a requesterUser is allowed to change a targetUser's Role is inside the Serivces layer, 
        // specifically in /backend/MyDotNetWebsiteApi/Services/UserService.cs
        // through the specific permissions check is in
        // specifically in /backend/MyDotNetWebsiteApi/Services/PermissionHelper.cs
        var result = await _userService.UpdateUserRoleAsync(targetUserId, dto, requesterUserId);

        return result.ToActionResult(this);  // This method is defined in backend/MyDotNetWebsiteApi/Services/ServiceResult.cs
    }



}