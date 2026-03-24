public class ExternalApiSource
{
    ///// Real SQL Columns
    public int Id {get; set;}

    // Human-readable name of the API, e.g. "OMDB", "RAWG", "OpenLibrary", "TVMaze"
    public string ApiName {get; set;} = string.Empty;

    public int MediaTypeId {get; set;}

    // When true, this is the API currently used when searching for this MediaType.
    // Only one ExternalApiSource per MediaType should be active at a time.
    // To swap APIs: add a new ExternalApiSource with IsActive = true and set the old one to false.
    public bool IsActive {get; set;}



    ///// C# Only - They do not exist in the SQL Database

    // We already have MediaTypeId in the Real SQL Columns section above
    public MediaType MediaType {get; set;} = null!;

    public ICollection<MediaApiRef> MediaApiRefs {get; set;} = new List<MediaApiRef>();


}
