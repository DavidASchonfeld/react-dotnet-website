

public class MediaItem
{
    public int Id {get; set;}
    public string Name {get; set; } = string.Empty;
    
    public int MediaTypeId {get; set;}
    public MediaType Type {get; set;} = null!;

    public string? Description {get; set; }
    // The ? means it can be Null (aka empty) if needed

    public ItemAccessStatus AccessStatus {get; set;}

    //  Many-to-Many Relationships
    public ICollection<LinkCreatorToMediaItem> Creators {get; set;} = new List<LinkCreatorToMediaItem>();
    public ICollection<LinkMediaItemToGenre> Genres {get; set; } = new List<LinkMediaItemToGenre>();

    public ICollection<LinkMediaItemToSeries> SeriesEntries {get; set; } = new List<LinkMediaItemToSeries>();
    public ICollection<LinkMediaItemToFranchise> FranchiseEntries {get; set; } = new List<LinkMediaItemToFranchise>();

    public DateTime PublishedDateTime {get; set; }




    public string SubmittedById {get; set;} = string.Empty;
    public AppUser SubmittedBy {get; set;} = null!;
    public DateTime SubmittedDateTime {get; set; } = DateTime.UtcNow;


    public ICollection<LinkMediaItemToMediaList> ListAppearances {get; set; } = new List<LinkMediaItemToMediaList>();


}