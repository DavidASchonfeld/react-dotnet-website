using System.ComponentModel.DataAnnotations;

// Sent by the frontend when adding a search result (not yet in the local DB) to a MediaList.
// The backend uses ExternalApiSourceId + ExternalId as a unique key to find-or-create the
// MediaApiRef record, then links it to the list idempotently.
public class AddToListByExternalRefDto
{
    [Required] public int ExternalApiSourceId { get; set; }
    [Required] public string ExternalId { get; set; } = string.Empty;
    [Required] public string Name { get; set; } = string.Empty;
    [Required] public int MediaTypeId { get; set; }
    // API-specific subtype (e.g. "movie"/"series"/"episode" for OMDB, "game"/"publisher"/"developer" for RAWG)
    public string? Subtype { get; set; }
    public string? CreatorName { get; set; }
    public DateTime? PublishedDate { get; set; }
    public string? ThumbnailUrl { get; set; }
    // Optional: if null, the item is appended to the end of the list
    public int? Position { get; set; }
}
