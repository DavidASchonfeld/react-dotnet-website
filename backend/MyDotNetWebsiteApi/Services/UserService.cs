using Microsoft.EntityFrameworkCore;  // This import is needed for the lookups into the Database.  For example: _context.MediaItems.Where(i => is.IsApproved).ToListAsync();

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    // Right now, only adding logger to this service, UserService,
    // since this is the most important/impactful service
    // since maintianing users is very important for security/access
    // Reminder: Logger is a built-in C#/.NET program for logging.
    private readonly ILogger<UserService> _logger;

    public UserService(AppDbContext context, ILogger<UserService> logger)
    {
        _context = context;
        _logger = logger;
    }


    // Functions

    public async Task<ServiceResult<List<UserSummaryDto>>> GetAllUsersAsync(string requesterUserId)
    {
        var requesterUser = await _context.Users.FindAsync(requesterUserId);
        if (requesterUser == null) return ServiceResult<List<UserSummaryDto>>.Unauthorized();


        // Permissions
        if(!PermissionHelper.CanSeeAllUsers(requesterUser))
            return ServiceResult<List<UserSummaryDto>>.Forbidden();


        // for each user, get the user from the 
        var users = await _context.Users
                    
                    .Select(u => new UserSummaryDto
                    {
                        Id = u.Id,
                        UserName = u.UserName!,
                        Email = u.Email,
                        RoleLevel = u.RoleLevel
                    })
                    .ToListAsync();



        return ServiceResult<List<UserSummaryDto>>.Ok(users);
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


}