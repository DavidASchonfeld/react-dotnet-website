// Contract that every external media API adapter must implement.
// To add support for a new API:
//   1. Create a class that implements this interface (e.g. NewApiAdapter.cs)
//   2. Register it in ExternalMediaApiAdapterFactory keyed to the right ApiName
//   3. Add an ExternalApiSource seed row in AppDbContext
public interface IExternalMediaApiAdapter
{
    // Search the external API and return up to `limit` results matching `query`.
    // `page` is 1-based; defaults to 1 for the first page of results.
    // Returns an empty list if the API is unavailable or returns no results.
    Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit, int page = 1, string? subtype = null);

    // Fetch a single item by its native external ID (e.g. IMDB ID "tt0111161").
    // Returns null if the item is not found or the API is unavailable.
    Task<ExternalApiSearchResult?> GetByExternalIdAsync(string externalId);
}
