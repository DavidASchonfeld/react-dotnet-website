public interface IMediaItemService
{
    Task<ServiceResult<MediaItemDetailDto>> GetMediaItemDetailAsync(int mediaItemId, string requesterUserId);
    Task<ServiceResult<List<MediaItemSummaryDto>>> GetAllApprovedMediaItemsForAdminAsync(string requesterUserId);
    Task<ServiceResult<List<MediaItemSummaryDto>>> GetRandomAsync(int amount, string requesterUserId);
    Task<ServiceResult<MediaItem>> CreateMediaItemAsync(CreateMediaItemDto dto, string requesterUserId);
    Task<ServiceResult<bool>> DeleteMediaItemAsync(int mediaItemId, string requesterUserId);
    Task<ServiceResult<MediaItemDetailDto>> PatchMediaItemBasicInfoAsync(int mediaItemId, UpdateMediaItemBasicInfoDto dto, string requesterUserId);
    Task<ServiceResult<List<MediaListSummaryDto>>> GetListsContainingItemAsync(int mediaItemId, string requesterUserId);

}