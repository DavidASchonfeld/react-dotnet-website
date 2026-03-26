public interface IUserService
{
    Task<ServiceResult<PaginatedResultDto<UserSummaryDto>>> GetAllUsersAsync(string requesterUserId, int page, int pageSize);
    Task<ServiceResult<UserSummaryDto>> UpdateUserRoleAsync(string targetUserId, UpdateUserRoleDto dto, string requesterUserId);
    // Saves the caller's theme preference; null clears it (revert to app default).
    Task<ServiceResult<string?>> UpdateUserThemeAsync(string userId, string? theme);
}