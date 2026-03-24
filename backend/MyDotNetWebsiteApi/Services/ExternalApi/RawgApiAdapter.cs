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

    public Task<ExternalApiSearchResult?> GetByExternalIdAsync(string externalId)
    {
        // TODO: implement using GET https://api.rawg.io/api/games/{id}?key={_apiKey}
        return Task.FromResult<ExternalApiSearchResult?>(null);
    }

    public async Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit, int page = 1, string? subtype = null)
    {
        // subtype routes to different RAWG endpoints: "game" (default), "publisher", or "developer".
        return subtype switch
        {
            "publisher" => await SearchPublishersAsync(query, limit, page),
            "developer" => await SearchDevelopersAsync(query, limit, page),
            _           => await SearchGamesAsync(query, limit, page),
        };
    }

    private async Task<List<ExternalApiSearchResult>> SearchGamesAsync(string query, int limit, int page)
    {
        var url = $"https://api.rawg.io/api/games?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size={limit}&page={page}";
        var httpResponse = await FetchAsync(url);
        if (httpResponse is null) return [];

        RawgGameResponse? response;
        try { response = await httpResponse.Content.ReadFromJsonAsync<RawgGameResponse>(); }
        catch { return []; }

        if (response is null) return [];

        return response.Results
            .Select(item => new ExternalApiSearchResult
            {
                ExternalId    = item.Id.ToString(),
                Name          = item.Name,
                PublishedDate = DateTime.TryParse(item.Released, out var d) ? d : null,
                ThumbnailUrl  = item.BackgroundImage,
                CreatorName   = item.Developers?.FirstOrDefault()?.Name
            })
            .ToList();
    }

    private async Task<List<ExternalApiSearchResult>> SearchPublishersAsync(string query, int limit, int page)
    {
        var url = $"https://api.rawg.io/api/publishers?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size={limit}&page={page}";
        var httpResponse = await FetchAsync(url);
        if (httpResponse is null) return [];

        RawgEntityResponse? response;
        try { response = await httpResponse.Content.ReadFromJsonAsync<RawgEntityResponse>(); }
        catch { return []; }

        if (response is null) return [];

        return response.Results
            .Select(item => new ExternalApiSearchResult
            {
                ExternalId = $"publisher-{item.Id}",
                Name       = item.Name,
            })
            .ToList();
    }

    private async Task<List<ExternalApiSearchResult>> SearchDevelopersAsync(string query, int limit, int page)
    {
        var url = $"https://api.rawg.io/api/developers?key={_apiKey}&search={Uri.EscapeDataString(query)}&page_size={limit}&page={page}";
        var httpResponse = await FetchAsync(url);
        if (httpResponse is null) return [];

        RawgEntityResponse? response;
        try { response = await httpResponse.Content.ReadFromJsonAsync<RawgEntityResponse>(); }
        catch { return []; }

        if (response is null) return [];

        return response.Results
            .Select(item => new ExternalApiSearchResult
            {
                ExternalId = $"developer-{item.Id}",
                Name       = item.Name,
            })
            .ToList();
    }

    // Shared HTTP fetch with rate-limit and error handling.
    private async Task<HttpResponseMessage?> FetchAsync(string url)
    {
        HttpResponseMessage httpResponse;
        try { httpResponse = await _httpClient.GetAsync(url); }
        catch { return null; }

        if (httpResponse.StatusCode == HttpStatusCode.TooManyRequests) return null;
        if (!httpResponse.IsSuccessStatusCode) return null;
        return httpResponse;
    }
}

// Games search response.
file class RawgGameResponse
{
    public List<RawgGame> Results { get; set; } = [];
}

file class RawgGame
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Released { get; set; }
    [JsonPropertyName("background_image")]
    public string? BackgroundImage { get; set; }
    public List<RawgDeveloper>? Developers { get; set; }
}

file class RawgDeveloper
{
    public string Name { get; set; } = string.Empty;
}

// Shared response shape for publishers and developers (both return { id, name }).
file class RawgEntityResponse
{
    public List<RawgEntity> Results { get; set; } = [];
}

file class RawgEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
