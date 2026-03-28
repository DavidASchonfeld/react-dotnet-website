using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;  // This import is needed for the lookups into the Database.  For example: _context.MediaItems.Where(i => is.IsApproved).ToListAsync();

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly UserManager<AppUser> _userManager;

    // Right now, only adding logger to this service, UserService,
    // since this is the most important/impactful service
    // since maintianing users is very important for security/access
    // Reminder: Logger is a built-in C#/.NET program for logging.
    private readonly ILogger<UserService> _logger;

    public UserService(AppDbContext context, UserManager<AppUser> userManager, ILogger<UserService> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }


    // Functions

    public async Task<ServiceResult<PaginatedResultDto<UserSummaryDto>>> GetAllUsersAsync(string requesterUserId, int page, int pageSize)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<PaginatedResultDto<UserSummaryDto>>.Unauthorized();


        // Permissions
        if(!PermissionHelper.CanSeeAllUsers(requesterUser))
            return ServiceResult<PaginatedResultDto<UserSummaryDto>>.Forbidden();


        var query = _context.Users.OrderBy(u => u.UserName);

        var totalCount = await query.CountAsync();

        var users = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new UserSummaryDto
                    {
                        Id = u.Id,
                        UserName = u.UserName!,
                        Email = u.Email,
                        RoleLevel = u.RoleLevel
                    })
                    .ToListAsync();

        return ServiceResult<PaginatedResultDto<UserSummaryDto>>.Ok(new PaginatedResultDto<UserSummaryDto>
        {
            Items = users,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }


    public async Task<ServiceResult<UserSummaryDto>> UpdateUserRoleAsync(string targetUserId, UpdateUserRoleDto dto, string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<UserSummaryDto>.Unauthorized();

        // Admins have no restrictions, so I'll start with that
        if(!PermissionHelper.CanChangeUserRole(requesterUser))
            return ServiceResult<UserSummaryDto>.Forbidden();

        // [Check if target user == currentUser]
        if (targetUserId == requesterUserId)
        {
            return ServiceResult<UserSummaryDto>.BadRequest("You cannot change your own role");
        }

        // Find User
        var targetUser = await _context.Users.FindAsync(targetUserId);

        if (targetUser == null)
            return ServiceResult<UserSummaryDto>.NotFound();

        // Change it
        targetUser.RoleLevel = dto.NewRoleLevel;

        await _context.SaveChangesAsync();  // Flush changes
        
        // Log the change:
        _logger.LogInformation(
            "User '{RequesterUserName}' (id: {RequesterUserId}) changed role of '{TargetedUserName}' (id: {TargetUserId}) to {NewRole}",
            requesterUser.UserName, requesterUserId, targetUser.UserName, targetUserId, dto.NewRoleLevel
        );


        // Return UserSummaryDto
        return ServiceResult<UserSummaryDto>.Ok(new UserSummaryDto
        {
            Id = targetUser.Id,
            UserName = targetUser.UserName!,
            Email = targetUser.Email,
            RoleLevel = targetUser.RoleLevel

        });

    }


    public async Task<ServiceResult<string?>> UpdateUserThemeAsync(string userId, string? theme)
    {
        // Find the user who owns this preference
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return ServiceResult<string?>.NotFound();

        user.PreferredTheme = theme;
        await _context.SaveChangesAsync();

        return ServiceResult<string?>.Ok(user.PreferredTheme);
    }


    public async Task<ServiceResult<string>> UpdateUsernameAsync(string userId, UpdateUsernameDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return ServiceResult<string>.NotFound();

        // Reject if the new name is already taken by a different user
        var existing = await _userManager.FindByNameAsync(dto.NewUserName);
        if (existing != null && existing.Id != userId)
            return ServiceResult<string>.BadRequest("That username is already taken.");

        // SetUserNameAsync handles normalization and uniqueness enforcement
        var result = await _userManager.SetUserNameAsync(user, dto.NewUserName);
        if (!result.Succeeded)
            return ServiceResult<string>.BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Failed to update username.");

        _logger.LogInformation("User '{UserId}' changed username to '{NewUserName}'", userId, dto.NewUserName);

        return ServiceResult<string>.Ok(user.UserName!);
    }


    public async Task<ServiceResult<bool>> UpdatePasswordAsync(string userId, UpdatePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return ServiceResult<bool>.NotFound();

        // ChangePasswordAsync verifies the current password and re-hashes the new one
        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return ServiceResult<bool>.BadRequest(result.Errors.FirstOrDefault()?.Description ?? "Failed to change password.");

        _logger.LogInformation("User '{UserId}' changed their password", userId);

        return ServiceResult<bool>.Ok(true);
    }


}