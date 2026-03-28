public class MediaList
{
    ///// Real SQL Columns
    public int Id {get; set; }
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;

    public string? SubmittedById {get; set;}
    

    public VisibilityStatus VisibilityStatus {get; set;}
    public MediaListCategory Category {get; set;} = MediaListCategory.Standard; // Determines behavior: Standard, VisitingStatus, Library, or Featured
    


    ///// C# Only - They do not exist in the SQL Database
    
    // We already have SubmittedById in the Real SQL Columns section above
    public AppUser SubmittedBy {get; set;} = null!;


    // Many-to-Many Relationships
    public ICollection<LinkMediaApiRefToMediaList> ItemLinks {get; set; } = new List<LinkMediaApiRefToMediaList>();
    public ICollection<LinkPermissionsForMediaListToAppUser> SharedWith {get; set; } = new List<LinkPermissionsForMediaListToAppUser>();


}