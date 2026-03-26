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

    public async Task<ExternalApiSearchResult?> GetByExternalIdAsync(string externalId)
    {
        // Fetch game details from RAWG API
        var url = $"https://api.rawg.io/api/games/{Uri.EscapeDataString(externalId)}?key={_apiKey}";
        var httpResponse = await FetchAsync(url);
        if (httpResponse is null) return null;

        RawgGameDetail? response;
        try { response = await httpResponse.Content.ReadFromJsonAsync<RawgGameDetail>(); }
        catch { return null; }

        if (response is null) return null;

        // Build genres string from the API response
        var genres = response.Genres?.Count > 0
            ? string.Join(", ", response.Genres.Select(g => g.Name))
            : null;

        // Build platforms string from the API response
        var platforms = response.Platforms?.Count > 0
            ? string.Join(", ", response.Platforms.Select(p => p.Platform?.Name).Where(n => n != null))
            : null;

        return new ExternalApiSearchResult
        {
            ExternalId = externalId,
            Name = response.Name,
            PublishedDate = DateTime.TryParse(response.Released, out var d) ? d : null,
            ThumbnailUrl = response.BackgroundImage,
            CreatorName = response.Developers?.Count > 0 ? string.Join(", ", response.Developers.Select(d => d.Name)) : null,
            Poster = response.BackgroundImage,
            Plot = response.Description != null && response.Description != "N/A" ? response.Description : response.DescriptionRaw,
            Country = null, // RAWG doesn't provide country info for games
            Genres = genres,
            Rated = null // RAWG doesn't provide ESRB rating in the detail endpoint
        };
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
                CreatorName   = item.Developers?.Count > 0 ? string.Join(", ", item.Developers.Select(d => d.Name)) : null
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

// Game detail response from RAWG detail endpoint.
file class RawgGameDetail
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Released { get; set; }
    [JsonPropertyName("background_image")]
    public string? BackgroundImage { get; set; }
    public string? Description { get; set; }
    [JsonPropertyName("description_raw")]
    public string? DescriptionRaw { get; set; }
    public List<RawgDeveloper>? Developers { get; set; }
    public List<RawgGenre>? Genres { get; set; }
    public List<RawgPlatformWrapper>? Platforms { get; set; }
}

file class RawgGenre
{
    public string Name { get; set; } = string.Empty;
}

file class RawgPlatformWrapper
{
    [JsonPropertyName("platform")]
    public RawgPlatform? Platform { get; set; }
}

file class RawgPlatform
{
    public string Name { get; set; } = string.Empty;
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
