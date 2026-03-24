public interface IMediaApiRefService
{
    Task<ServiceResult<MediaApiRefDetailDto>> GetMediaApiRefDetailAsync(int mediaApiRefId, string requesterUserId);

    // Proxies the search query to the active external API for the given media type.
    // Returns ExternalApiSearchResult (not MediaApiRef) since these may not be in our DB yet.
    Task<ServiceResult<List<ExternalApiSearchResult>>> SearchExternalApiAsync(string query, int limit, int mediaTypeId, string requesterUserId);

    // Idempotent upsert: returns existing record if ExternalApiSourceId + ExternalId already exists, otherwise creates it.
    Task<ServiceResult<MediaApiRefDetailDto>> FindOrCreateAsync(FindOrCreateMediaApiRefDto dto, string requesterUserId);

    Task<ServiceResult<List<MediaListSummaryDto>>> GetListsContainingRefAsync(int mediaApiRefId, string requesterUserId);

    Task<ServiceResult<List<CustomTagSummaryDto>>> GetTagsForRefAsync(int mediaApiRefId, string requesterUserId);
}
