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
            // Using DescriptionRaw instead of Description — Description contains HTML tags/entities from RAWG,
            // and blindly processing HTML from external sources is a security risk. DescriptionRaw is supposed to be
            // plain text, but some RAWG entries (especially older games) still contain HTML tags/entities, so I strip them.
            Plot = StripHtml(response.DescriptionRaw),
            Country = null, // RAWG doesn't provide country info for games
            Genres = genres,
            Rated = null, // RAWG doesn't provide ESRB rating in the detail endpoint
            // GetByExternalIdAsync only fetches from /api/games/{id}
            Subtype = "game"
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
                CreatorName   = item.Developers?.Count > 0 ? string.Join(", ", item.Developers.Select(d => d.Name)) : null,
                Subtype       = "game"
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
                Subtype    = "publisher"
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
                Subtype    = "developer"
            })
            .ToList();
    }

    // RAWG's description_raw is supposed to be plain text, but some entries still contain HTML tags/entities.
    private static string? StripHtml(string? html)
    {
        if (string.IsNullOrEmpty(html)) return html; // skip processing if the input is null or empty
        // Regex "<[^>]+>" matches any HTML tag:
        //   <      literal "<" — marks the start of an HTML tag
        //   [^>]   character class "not >" — matches any single character except ">"
        //   +      quantifier — requires one or more of the preceding [^>] (i.e. the tag can't be empty)
        //   >      literal ">" — marks the end of an HTML tag
        // Regex.Replace scans the whole string and replaces every match with string.Empty, leaving only the text content.
        var noTags = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", string.Empty);
        return System.Net.WebUtility.HtmlDecode(noTags).Trim(); // decode HTML entities (e.g. &#39; → ') and strip surrounding whitespace
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
