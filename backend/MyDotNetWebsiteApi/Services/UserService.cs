using Microsoft.EntityFrameworkCore;  // This import is needed for the lookups into the Database.  For example: _context.MediaItems.Where(i => is.IsApproved).ToListAsync();

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
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
        var userToUpdate = await _context.Users.FindAsync(targetUserId);

        if (userToUpdate == null)
            return ServiceResult<UserSummaryDto>.NotFound();

        // Change it
        userToUpdate.RoleLevel = dto.NewRoleLevel;

        await _context.SaveChangesAsync();  // Flush changes

        // Return UserSummaryDto
        return ServiceResult<UserSummaryDto>.Ok(new UserSummaryDto
        {
            Id = userToUpdate.Id,
            UserName = userToUpdate.UserName!,
            Email = userToUpdate.Email,
            RoleLevel = userToUpdate.RoleLevel

        });

    }


}