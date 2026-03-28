public class MediaApiRefDetailDto
{
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;
    public int MediaTypeId {get; set;}
    // API-specific subtype (e.g. "movie"/"series"/"episode" for OMDB, "game"/"publisher"/"developer" for RAWG)
    public string? Subtype {get; set;}
    public string? CreatorName {get; set;}
    public DateTime? PublishedDate {get; set;}
    public int ExternalApiSourceId {get; set;}
    public string ApiSourceName {get; set;} = string.Empty;
    public string ExternalId {get; set;} = string.Empty;
    public string? ApiHomepageUrl {get; set;}

    // Admin-only: DB record metadata. Null for non-administrators.
    public MediaApiRefAdminInfoDto? AdminInfo {get; set;}

    // True when the external API source is temporarily disabled by an administrator.
    // The page will load with whatever data is in the cache or DB, but detail fields
    // (Plot, Runtime, etc.) may be missing if the cache is empty.
    public bool IsApiDisabled { get; set; }

    // Image URLs stored on MediaApiRef entity
    public string? ThumbnailUrl {get; set;}    // small image from search results
    // Detail fields sourced from CacheItem.ResponseJson, not MediaApiRef columns
    public string? Poster {get; set;}          // full-size CDN poster URL from detail fetch
    // "poster-api://{apiName}/{externalId}" when the high-res Poster API is enabled; null otherwise.
    // The frontend converts this pseudo-URL to /api/imagecache/poster-api/{apiName}/{externalId}.
    public string? BigPosterUrl {get; set;}
    public string? Plot {get; set;}
    public string? Runtime {get; set;}
    public string? Country {get; set;}
    public string? Genres {get; set;}
    public string? Rated {get; set;}
}
