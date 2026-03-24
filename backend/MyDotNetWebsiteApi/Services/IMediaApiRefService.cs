public interface IMediaApiRefService
{
    Task<ServiceResult<MediaApiRefDetailDto>> GetMediaApiRefDetailAsync(int mediaApiRefId, string requesterUserId);

    // Proxies the search query to the active external API for the given media type.
    // Returns ExternalApiSearchResult (not MediaApiRef) since these may not be in our DB yet.
    Task<ServiceResult<List<ExternalApiSearchResult>>> SearchExternalApiAsync(string query, int limit, int mediaTypeId, string requesterUserId, int page = 1, string? subtype = null);

    // Fetches a single item from an external API by its native ID, with non-search caching.
    // Caching is skipped when either the global or per-API UseNonSearchQueryCache flag is false.
    Task<ServiceResult<ExternalApiSearchResult>> GetExternalApiItemAsync(string externalItemId, int externalApiSourceId, string requesterUserId);

    // Idempotent upsert: returns existing record if ExternalApiSourceId + ExternalId already exists, otherwise creates it.
    Task<ServiceResult<MediaApiRefDetailDto>> FindOrCreateAsync(FindOrCreateMediaApiRefDto dto, string requesterUserId);

    Task<ServiceResult<List<MediaListSummaryDto>>> GetListsContainingRefAsync(int mediaApiRefId, string requesterUserId);

    Task<ServiceResult<List<CustomTagSummaryDto>>> GetTagsForRefAsync(int mediaApiRefId, string requesterUserId);
}
