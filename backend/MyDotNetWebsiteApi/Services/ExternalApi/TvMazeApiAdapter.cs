// Stub adapter for TVMaze — used for TV Shows (MediaTypeId = 2).
// TODO: Replace the stub body with real HTTP calls to https://api.tvmaze.com/
//       TVMaze is free and does not require an API key.
public class TvMazeApiAdapter : IExternalMediaApiAdapter
{
    public Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit)
    {
        // Stub: returns empty list until real implementation is added
        return Task.FromResult(new List<ExternalApiSearchResult>());
    }
}
