// Adapter for OMDB (Open Movie Database) — searches movies via HTTP.
public class OmdbApiAdapter : IExternalMediaApiAdapter
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    // Receives a managed HttpClient (from IHttpClientFactory) and the API key string.
    public OmdbApiAdapter(HttpClient httpClient, string apiKey)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
    }

    public async Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit, int page = 1)
    {
        // &type=movie filters TV series out; limit is applied client-side (OMDB caps at 10 results/page).
        // &page is 1-based and supported natively by OMDB.
        var url = $"http://www.omdbapi.com/?s={Uri.EscapeDataString(query)}&apikey={_apiKey}&type=movie&page={page}";

        OmdbSearchResponse? response;
        try
        {
            response = await _httpClient.GetFromJsonAsync<OmdbSearchResponse>(url);
        }
        catch (Exception)
        {
            // Network or parse failure — return empty rather than propagating.
            return [];
        }

        // OMDB signals all errors (including rate-limit) via this flag; HTTP status is always 200.
        if (response is null || response.Response == "False")
            return [];

        return response.Search
            .Take(limit)
            .Select(item => new ExternalApiSearchResult
            {
                ExternalId    = item.ImdbID,
                Name          = item.Title,
                // OMDB search returns only a 4-digit Year string, not a full date.
                PublishedDate = DateTime.TryParse(item.Year, out var d) ? d : null,
                // OMDB returns the string "N/A" (not null) when no poster exists.
                ThumbnailUrl  = item.Poster == "N/A" ? null : item.Poster,
                CreatorName   = null  // not available from the search endpoint
            })
            .ToList();
    }
}

// Top-level OMDB search response envelope.
file class OmdbSearchResponse
{
    public List<OmdbSearchItem> Search { get; set; } = [];
    // "True" or "False" — OMDB signals errors here instead of via HTTP status codes.
    public string Response { get; set; } = "False";
}

// One result item from OMDB's Search array.
file class OmdbSearchItem
{
    public string Title  { get; set; } = string.Empty;
    public string Year   { get; set; } = string.Empty;
    public string ImdbID { get; set; } = string.Empty;
    public string Poster { get; set; } = string.Empty;
}
