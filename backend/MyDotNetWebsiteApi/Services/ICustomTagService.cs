public interface ICustomTagService
{
    // Returns the requester's own tags plus all public tags (paginated)
    Task<ServiceResult<PaginatedResultDto<CustomTagSummaryDto>>> GetMyTagsAsync(string requesterUserId, int page, int pageSize);
    Task<ServiceResult<CustomTagSummaryDto>> CreateTagAsync(CreateCustomTagDto dto, string requesterUserId);
    Task<ServiceResult<CustomTagSummaryDto>> UpdateTagAsync(int tagId, UpdateCustomTagDto dto, string requesterUserId);
    Task<ServiceResult<bool>> DeleteTagAsync(int tagId, string requesterUserId);
    // mineOnly = true → return only the requester's own tags (skip public tags from other users)
    Task<ServiceResult<List<CustomTagSummaryDto>>> SearchTagsAsync(string query, int limit, string requesterUserId, bool mineOnly = false);
    Task<ServiceResult<bool>> AddTagToMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId);
    Task<ServiceResult<bool>> RemoveTagFromMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId);

    // Returns all MediaApiRef items that have the given tag (respects visibility, paginated)
    Task<ServiceResult<PaginatedResultDto<MediaApiRefSummaryDto>>> GetItemsByTagAsync(int tagId, string requesterUserId, int page, int pageSize);
}
