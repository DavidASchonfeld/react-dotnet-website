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

    // When true, an admin has temporarily blocked all searches through this API for all users.
    // Independent of IsActive (which controls routing, not availability).
    public bool IsDisabledByAdmin {get; set;} = false;

    // When true, fresh detail fetches also call the API's high-res poster endpoint (requires SupportsPosterApi in plan config).
    public bool UsePosterApi {get; set;} = false;



    ///// C# Only - They do not exist in the SQL Database

    // We already have MediaTypeId in the Real SQL Columns section above
    public MediaType MediaType {get; set;} = null!;

    public ICollection<MediaApiRef> MediaApiRefs {get; set;} = new List<MediaApiRef>();


}
