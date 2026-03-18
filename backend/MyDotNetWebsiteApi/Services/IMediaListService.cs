public interface IMediaListService
{
    Task<ServiceResult<List<MediaListSummaryDto>>> GetMyListsAsync(string requesterUserId);
    Task<ServiceResult<MediaListDetailDto>> GetMediaListDetailAsync(int mediaListId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> CreateListAsync(CreateMediaListDto dto, string requesterUserId);
    Task<ServiceResult<bool>> DeleteListAsync(int mediaListId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> PatchListBasicInfoAsync(int mediaListId, UpdateMediaListNotListContentDto dto, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> AddMediaItemToListAsync(int mediaListId, int mediaItemId, AddMediaItemToMediaList dto, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> RemoveMediaItemFromListAsync(int mediaListId, int mediaItemId, string requesterUserId);
    Task<ServiceResult<MediaListSummaryDto>> MoveMediaItemWithinMediaListAsync(int mediaListId, int mediaItemId, MoveMediaItemWithinMediaList dto, string requesterUserId);
}