public interface ICustomTagService
{
    // Returns the requester's own tags plus all public tags
    Task<ServiceResult<List<CustomTagSummaryDto>>> GetMyTagsAsync(string requesterUserId);
    Task<ServiceResult<CustomTagSummaryDto>> CreateTagAsync(CreateCustomTagDto dto, string requesterUserId);
    Task<ServiceResult<CustomTagSummaryDto>> UpdateTagAsync(int tagId, UpdateCustomTagDto dto, string requesterUserId);
    Task<ServiceResult<bool>> DeleteTagAsync(int tagId, string requesterUserId);
    Task<ServiceResult<List<CustomTagSummaryDto>>> SearchTagsAsync(string query, int limit, string requesterUserId);
    Task<ServiceResult<bool>> AddTagToMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId);
    Task<ServiceResult<bool>> RemoveTagFromMediaApiRefAsync(int tagId, int mediaApiRefId, string requesterUserId);

    // Returns all MediaApiRef items that have the given tag (respects visibility)
    Task<ServiceResult<List<MediaApiRefSummaryDto>>> GetItemsByTagAsync(int tagId, string requesterUserId);
}
