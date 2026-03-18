public interface IUserService
{
    Task<ServiceResult<List<UserSummaryDto>>> GetAllUsersAsync(string requesterUserId);
    Task<ServiceResult<UserSummaryDto>> UpdateUserRoleAsync(string targetUserId, UpdateUserRoleDto dto, string requesterUserId);
}