// Stub adapter for Open Library — used for Books (MediaTypeId = 3).
// TODO: Replace the stub body with real HTTP calls to https://openlibrary.org/search.json
//       Open Library is free and does not require an API key.
public class OpenLibraryApiAdapter : IExternalMediaApiAdapter
{
    public Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit)
    {
        // Stub: returns empty list until real implementation is added
        return Task.FromResult(new List<ExternalApiSearchResult>());
    }
}
