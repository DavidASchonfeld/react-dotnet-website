public interface IMediaListService
{
    Task<ServiceResult<PaginatedResultDto<MediaListSummaryDto>>> GetMyListsAsync(string requesterUserId, int page, int pageSize);
    Task<ServiceResult<MediaListDetailDto>> GetMediaListDetailAsync(int mediaListId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> CreateListAsync(CreateMediaListDto dto, string requesterUserId);
    Task<ServiceResult<bool>> DeleteListAsync(int mediaListId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> PatchListBasicInfoAsync(int mediaListId, UpdateMediaListNotListContentDto dto, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> AddMediaApiRefToListAsync(int mediaListId, int mediaApiRefId, AddMediaApiRefToMediaListDto dto, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> RemoveMediaApiRefFromListAsync(int mediaListId, int mediaApiRefId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> MoveMediaApiRefWithinMediaListAsync(int mediaListId, int mediaApiRefId, MoveMediaApiRefWithinMediaListDto dto, string requesterUserId);
    Task<ServiceResult<bool>> ReorderItemsAsync(int mediaListId, List<int> orderedItemIds, string requesterUserId);
    // ownedByUserId = null              → all visible (owner || admin || public)
    // ownedByUserId = requesterUserId   → own lists only
    // ownedByUserId = someOtherUserId   → that user's public lists (or all if admin)
    Task<ServiceResult<List<MediaListSummaryDto>>> SearchListsAsync(string query, int limit, string? ownedByUserId, string requesterUserId);
    Task<ServiceResult<List<MediaListDetailDto>>> GetFeaturedListsAsync();
    Task<ServiceResult<MediaListSummaryDto>> CreateFeaturedListAsync(CreateMediaListDto dto, string requesterUserId);
}
