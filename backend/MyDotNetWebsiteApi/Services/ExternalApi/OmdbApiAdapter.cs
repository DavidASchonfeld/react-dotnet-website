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

    public async Task<List<ExternalApiSearchResult>> SearchAsync(string query, int limit, int page = 1, string? subtype = null)
    {
        // subtype controls the OMDB &type= filter: "movie" (default), "series", or "episode".
        // &page is 1-based and supported natively by OMDB.
        var omdbType = subtype is "series" or "episode" ? subtype : "movie";
        var url = $"http://www.omdbapi.com/?s={Uri.EscapeDataString(query)}&apikey={_apiKey}&type={omdbType}&page={page}";

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
    public async Task<ExternalApiSearchResult?> GetByExternalIdAsync(string externalId)
    {
        // OMDB detail endpoint: ?i= fetches a single item by IMDB ID.
        var url = $"http://www.omdbapi.com/?i={Uri.EscapeDataString(externalId)}&apikey={_apiKey}&plot=full"; // plot=full returns a longer plot summary than the default short version

        OmdbDetailResponse? response;
        try
        {
            response = await _httpClient.GetFromJsonAsync<OmdbDetailResponse>(url);
        }
        catch (Exception)
        {
            // Network or parse failure — return null rather than propagating.
            return null;
        }

        // OMDB signals "not found" via Response == "False", not via HTTP status.
        if (response is null || response.Response == "False")
            return null;

        return new ExternalApiSearchResult
        {
            ExternalId    = response.ImdbID,
            Name          = response.Title,
            PublishedDate = DateTime.TryParse(response.Year, out var d) ? d : null,
            ThumbnailUrl  = response.Poster == "N/A" ? null : response.Poster,
            CreatorName   = response.Director == "N/A" ? null : response.Director,
            Poster        = response.Poster == "N/A" ? null : response.Poster,
            Plot          = response.Plot == "N/A" ? null : response.Plot,
            Runtime       = response.Runtime == "N/A" ? null : response.Runtime,
            Country       = response.Country == "N/A" ? null : response.Country,
            Genres        = response.Genre == "N/A" ? null : response.Genre,
            Rated         = response.Rated == "N/A" ? null : response.Rated
        };
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

// Single-item detail response from OMDB's ?i= endpoint.
file class OmdbDetailResponse
{
    public string Title    { get; set; } = string.Empty;
    public string Year     { get; set; } = string.Empty;
    public string ImdbID   { get; set; } = string.Empty;
    public string Poster   { get; set; } = string.Empty;
    public string Director { get; set; } = string.Empty;
    public string Plot     { get; set; } = string.Empty;
    public string Runtime  { get; set; } = string.Empty;
    public string Country  { get; set; } = string.Empty;
    public string Genre    { get; set; } = string.Empty;
    public string Rated    { get; set; } = string.Empty;
    // "True" or "False" — OMDB signals errors here instead of via HTTP status codes.
    public string Response { get; set; } = "False";
}
