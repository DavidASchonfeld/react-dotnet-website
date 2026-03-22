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
    // ownedByUserId = null              → all visible (owner || admin || public)
    // ownedByUserId = requesterUserId   → own lists only
    // ownedByUserId = someOtherUserId   → that user's public lists (or all if admin)
    Task<ServiceResult<List<MediaListSummaryDto>>> SearchListsAsync(string query, int limit, string? ownedByUserId, string requesterUserId);
}