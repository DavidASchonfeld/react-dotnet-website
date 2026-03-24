public interface IUserService
{
    Task<ServiceResult<PaginatedResultDto<UserSummaryDto>>> GetAllUsersAsync(string requesterUserId, int page, int pageSize);
    Task<ServiceResult<UserSummaryDto>> UpdateUserRoleAsync(string targetUserId, UpdateUserRoleDto dto, string requesterUserId);
}