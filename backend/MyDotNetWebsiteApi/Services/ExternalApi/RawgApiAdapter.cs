// Stub adapter for RAWG — used for Video Games (MediaTypeId = 4).
// TODO: Replace the stub body with real HTTP calls to https://api.rawg.io/api/games
//       once an API key is obtained and configured at https://rawg.io/apidocs
public class RawgApiAdapter : IExternalMediaApiAdapter
{
    public Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit)
    {
        // Stub: returns empty list until real implementation is added
        return Task.FromResult(new List<ExternalApiSearchResult>());
    }
}
