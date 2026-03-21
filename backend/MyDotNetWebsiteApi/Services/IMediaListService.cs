public interface IMediaListService
{
    Task<ServiceResult<List<MediaListSummaryDto>>> GetMyListsAsync(string requesterUserId);
    Task<ServiceResult<MediaListDetailDto>> GetMediaListDetailAsync(int mediaListId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> CreateListAsync(CreateMediaListDto dto, string requesterUserId);
    Task<ServiceResult<bool>> DeleteListAsync(int mediaListId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> PatchListBasicInfoAsync(int mediaListId, UpdateMediaListNotListContentDto dto, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> AddMediaItemToListAsync(int mediaListId, int mediaItemId, AddMediaItemToMediaListDto dto, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> RemoveMediaItemFromListAsync(int mediaListId, int mediaItemId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> MoveMediaItemWithinMediaListAsync(int mediaListId, int mediaItemId, MoveMediaItemWithinMediaListDto dto, string requesterUserId);
    Task<ServiceResult<bool>> ReorderItemsAsync(int mediaListId, List<int> orderedItemIds, string requesterUserId);
    Task<ServiceResult<List<MediaListSummaryDto>>> SearchMyListsAsync(string query, int limit, string requesterUserId);
    Task<ServiceResult<List<MediaListSummaryDto>>> SearchAllListsAsync(string query, int limit, string requesterUserId);
}