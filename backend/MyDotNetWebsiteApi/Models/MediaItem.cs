

public class MediaItem
{
    public int Id {get; set;}
    public string Name {get; set; } = string.Empty;
    
    // TODO: Replace with enumtype once I create it
    public int MediaType {get; set;}

    // Possibilities:
    // Book, Movie, TV Show, VideoGame, Comic, Webcomic, Website Thing, Article, Anything else I can't think of right now.

    public string? Description {get; set; }
    // The ? means it can be Null (aka empty) if needed

    public ItemAccessStatusEnum ItemAccessStatus {get; set;}

    // public SomeEnum Access (Public, Private or Shared) {get; set;}  // TODO: Need to fix
    
    public string[] Authors {get; set;} = null!;
    public DateTime PublishedDateTime {get; set; } = DateTime.UtcNow;
    public User SubmittedDateTime {get; set;} = null!;
    public DateTime SubmittedDateTime {get; set; } = DateTime.UtcNow;
    



    public Tag[] Tags;
    public Pill[] Pills; <-Like tags, but 2 pronged. For example: "Franchise: Jurassic Park"
    public Franchise
    public # in Series


}