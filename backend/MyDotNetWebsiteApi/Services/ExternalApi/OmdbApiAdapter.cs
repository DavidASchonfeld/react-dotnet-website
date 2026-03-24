// Stub adapter for OMDB (Open Movie Database) — used for Movies (MediaTypeId = 1).
// TODO: Replace the stub body with real HTTP calls to https://www.omdbapi.com/
//       once an API key is obtained and configured.
public class OmdbApiAdapter : IExternalMediaApiAdapter
{
    public Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit)
    {
        // Stub: returns empty list until real implementation is added
        return Task.FromResult(new List<ExternalApiSearchResult>());
    }
}
