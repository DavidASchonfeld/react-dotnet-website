public interface IMediaApiRefService
{
    // Fetches full detail DTO for a MediaApiRef already stored in our DB, by internal database ID.
    // Cache-first; admins can pass bypassCache = true to force a fresh fetch from the external API.
    Task<ServiceResult<MediaApiRefDetailDto>> GetDetailByDbIdAsync(int mediaApiRefId, string requesterUserId, bool bypassCache = false);

    // Proxies a search query to the active 3rd-party API for the given media type.
    // Returns raw ExternalApiSearchResult items — these may not exist in our DB yet.
    Task<ServiceResult<List<ExternalApiSearchResult>>> SearchThirdPartyApiAsync(string query, int limit, int mediaTypeId, string requesterUserId, int page = 1, string? subtype = null, bool bypassCache = false);

    // Fetches a single raw item from the 3rd-party API by its external ID (not our DB id).
    // Returns ExternalApiSearchResult, not a DTO. Caching gated by global + per-source flags.
    Task<ServiceResult<ExternalApiSearchResult>> FetchRawItemFromExternalApiAsync(string externalItemId, int externalApiSourceId, string requesterUserId, bool bypassCache = false);

    // Resolves a full detail DTO by external key (apiName + externalId).
    // Checks DB first — if found, delegates to GetDetailByDbIdAsync; if not, falls back to FetchRawItemFromExternalApiAsync.
    // Returns Id = 0 in the DTO when the item is not yet stored in the DB.
    Task<ServiceResult<MediaApiRefDetailDto>> GetDetailByExternalKeyAsync(string apiName, string externalId, string requesterUserId);

    // Idempotent upsert: returns existing MediaApiRef if (ExternalApiSourceId + ExternalId) already exists, otherwise creates it.
    // Call this when a user links an item to a list or tag for the first time.
    Task<ServiceResult<MediaApiRefDetailDto>> GetOrCreateMediaApiRefAsync(FindOrCreateMediaApiRefDto dto, string requesterUserId);

    Task<ServiceResult<List<MediaListSummaryDto>>> GetListsContainingRefAsync(int mediaApiRefId, string requesterUserId);

    Task<ServiceResult<List<CustomTagSummaryDto>>> GetTagsForRefAsync(int mediaApiRefId, string requesterUserId);

    // Returns all tags applied to a MediaApiRef together with the per-link note from the join table.
    Task<ServiceResult<List<AppliedTagDto>>> GetAppliedTagsWithNotesAsync(int mediaApiRefId, string requesterUserId);
}
