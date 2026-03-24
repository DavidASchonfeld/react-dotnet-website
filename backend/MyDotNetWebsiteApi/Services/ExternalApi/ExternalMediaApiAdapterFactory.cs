// Selects the correct IExternalMediaApiAdapter based on the ApiName stored in ExternalApiSource.
// To support a new API: add a case here and create the corresponding adapter class.
public class ExternalMediaApiAdapterFactory
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _omdbApiKey;
    private readonly string _rawgApiKey;

    // IHttpClientFactory and IConfiguration are injected by the DI container at startup.
    public ExternalMediaApiAdapterFactory(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        // Extract only the key strings — adapters receive plain strings, not IConfiguration.
        _omdbApiKey = configuration["ExternalApiSettings:OmdbApiKey"] ?? string.Empty;
        _rawgApiKey = configuration["ExternalApiSettings:RawgApiKey"] ?? string.Empty;
    }

    // Returns null if no adapter is registered for the given apiName.
    public IExternalMediaApiAdapter? GetAdapter(string apiName) => apiName switch
    {
        // OMDB and RAWG need a managed HttpClient and their API key.
        "OMDB"        => new OmdbApiAdapter(_httpClientFactory.CreateClient(), _omdbApiKey),
        "RAWG"        => new RawgApiAdapter(_httpClientFactory.CreateClient(), _rawgApiKey),
        // TVMaze and OpenLibrary are free with no API key required.
        "TVMaze"      => new TvMazeApiAdapter(),
        "OpenLibrary" => new OpenLibraryApiAdapter(),
        _             => null
    };
}
