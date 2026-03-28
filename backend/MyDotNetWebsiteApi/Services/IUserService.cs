public interface IUserService
{
    Task<ServiceResult<PaginatedResultDto<UserSummaryDto>>> GetAllUsersAsync(string requesterUserId, int page, int pageSize);
    Task<ServiceResult<UserSummaryDto>> UpdateUserRoleAsync(string targetUserId, UpdateUserRoleDto dto, string requesterUserId);
    // Saves the caller's theme preference; null clears it (revert to app default).
    Task<ServiceResult<string?>> UpdateUserThemeAsync(string userId, string? theme);
    // Changes the caller's username; fails if the new name is already taken.
    Task<ServiceResult<string>> UpdateUsernameAsync(string userId, UpdateUsernameDto dto);
    // Changes the caller's password; requires the current password for verification.
    Task<ServiceResult<bool>> UpdatePasswordAsync(string userId, UpdatePasswordDto dto);
}