// Selects the correct IExternalMediaApiAdapter based on the ApiName stored in ExternalApiSource.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW TO ADD A NEW 3RD-PARTY API
// ─────────────────────────────────────────────────────────────────────────────
// 1. Create a new adapter class in Services/ExternalApi/ that implements
//    IExternalMediaApiAdapter (use OmdbApiAdapter.cs as a reference).
// 2. Register its metadata in ApiMetadataBases in ExternalApiRegistry.cs.
// 3. Add its plan config to appsettings.json under ApiPlanSettings (Plans + SelectedPlans).
// 4. Add a case in the GetAdapter() switch below; inject any HTTP clients or API keys as needed.
// 5. Seed an ExternalApiSource row in AppDbContext.cs HasData(), linking the API name to a
//    MediaTypeId, then run: dotnet ef migrations add <YourMigrationName>
// ─────────────────────────────────────────────────────────────────────────────
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
        "OMDB" => new OmdbApiAdapter(_httpClientFactory.CreateClient(), _omdbApiKey),
        "RAWG" => new RawgApiAdapter(_httpClientFactory.CreateClient(), _rawgApiKey),
        // Add new API cases here — see the HOW TO ADD A NEW 3RD-PARTY API guide above.
        _      => null
    };
}
