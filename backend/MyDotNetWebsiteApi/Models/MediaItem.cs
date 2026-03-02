public class MediaItem
{

    ///// Real SQL Columns
    public int Id {get; set;}
    public string Name {get; set; } = string.Empty;
    public int MediaTypeId {get; set;}
    // Actual MediaType object, listed below, not part of SQL rows

    public string? Description {get; set; }
    // The ? means it can be Null (aka empty) if needed

    public ItemAccessStatus AccessStatus {get; set;}
    public DateTime? PublishedDateTime {get; set; }
    public string SubmittedById {get; set;} = string.Empty;
    
    public DateTime SubmittedDateTime {get; set; } = DateTime.UtcNow;







    ///// C# Only - They do not exist in the SQL Database

    /////// Single object references
    public MediaType Type {get; set;} = null!;
    // We already have MediaTypeId in the SQL part above

    public AppUser SubmittedBy {get; set;} = null!;
    // We already have SubmittedByID in the SQL part above

    //  Many-to-Many Relationships
    //  We are explicitly referencing these SQL tables here becuase C# uses them to navigate through Join queries.
    public ICollection<LinkCreatorToMediaItem> Creators {get; set;} = new List<LinkCreatorToMediaItem>();
    public ICollection<LinkMediaItemToGenre> Genres {get; set; } = new List<LinkMediaItemToGenre>();

    public ICollection<LinkMediaItemToSeriesItem> SeriesEntries {get; set; } = new List<LinkMediaItemToSeriesItem>();
    public ICollection<LinkMediaItemToFranchise> FranchiseEntries {get; set; } = new List<LinkMediaItemToFranchise>();

    // When I pull ListApperaances, I will incorporate it into the script that it only shows the current user the lists that he/she has access to.
    // Access Rules: Public Lists, Shared Lists that user has access to, lists that the user created
    public ICollection<LinkMediaItemToMediaList> ListAppearances {get; set; } = new List<LinkMediaItemToMediaList>();
    


}