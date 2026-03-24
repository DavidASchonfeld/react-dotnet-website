using System.Net;
using System.Text.Json.Serialization;

// Adapter for RAWG — searches video games via HTTP.
public class RawgApiAdapter : IExternalMediaApiAdapter
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    // Receives a managed HttpClient (from IHttpClientFactory) and the API key string.
    public RawgApiAdapter(HttpClient httpClient, string apiKey)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
    }

    public async Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit, int page = 1)
    {
        // page_size caps results at the requested limit; page is 1-based and supported natively by RAWG.
        var url = $"https://api.rawg.io/api/games?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size={limit}&page={page}";

        HttpResponseMessage httpResponse;
        try
        {
            httpResponse = await _httpClient.GetAsync(url);
        }
        catch (Exception)
        {
            // Network failure — return empty rather than propagating.
            return [];
        }

        // HTTP 429 means the monthly request limit has been reached.
        if (httpResponse.StatusCode == HttpStatusCode.TooManyRequests)
            return [];

        if (!httpResponse.IsSuccessStatusCode)
            return [];

        RawgSearchResponse? response;
        try
        {
            response = await httpResponse.Content.ReadFromJsonAsync<RawgSearchResponse>();
        }
        catch (Exception)
        {
            // Parse failure — return empty rather than propagating.
            return [];
        }

        if (response is null)
            return [];

        return response.Results
            .Select(item => new ExternalApiSearchResult
            {
                ExternalId    = item.Id.ToString(),  // RAWG Id is int; ExternalId is string.
                Name          = item.Name,
                PublishedDate = DateTime.TryParse(item.Released, out var d) ? d : null,
                ThumbnailUrl  = item.BackgroundImage,
                // First developer used as creator; null if the developers list is absent or empty.
                CreatorName   = item.Developers?.FirstOrDefault()?.Name
            })
            .ToList();
    }
}

// Top-level RAWG search response envelope.
file class RawgSearchResponse
{
    public List<RawgGame> Results { get; set; } = [];
}

// One result item from RAWG's results array.
file class RawgGame
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    // ISO date string e.g. "2019-09-26"; nullable since not all games have a release date.
    public string? Released { get; set; }
    [JsonPropertyName("background_image")]  // snake_case JSON key → PascalCase C# property
    public string? BackgroundImage { get; set; }
    public List<RawgDeveloper>? Developers { get; set; }
}

// Developer entry from RAWG (only Name is needed from the search endpoint).
file class RawgDeveloper
{
    public string Name { get; set; } = string.Empty;
}
