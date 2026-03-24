// Selects the correct IExternalMediaApiAdapter based on the ApiName stored in ExternalApiSource.
// To support a new API: add a case here and create the corresponding adapter class.
public class ExternalMediaApiAdapterFactory
{
    // Returns null if no adapter is registered for the given apiName.
    public IExternalMediaApiAdapter? GetAdapter(string apiName) => apiName switch
    {
        "OMDB"        => new OmdbApiAdapter(),
        "TVMaze"      => new TvMazeApiAdapter(),
        "OpenLibrary" => new OpenLibraryApiAdapter(),
        "RAWG"        => new RawgApiAdapter(),
        _             => null
    };
}
