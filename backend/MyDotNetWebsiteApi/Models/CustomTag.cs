public class CustomTag
{
    ///// Real SQL Columns
    public int Id {get; set;}
    public string Name {get; set;} = string.Empty;

    // Private = only visible/usable by the creator
    // Public = visible and searchable by all users
    public VisibilityStatus VisibilityStatus {get; set;}

    public string? Description {get; set;}
    public string? CreatedById {get; set;}
    public DateTime DateCreated {get; set;} = DateTime.UtcNow;



    ///// C# Only - They do not exist in the SQL Database

    // We already have CreatedById in the Real SQL Columns section above
    public AppUser CreatedBy {get; set;} = null!;

    public ICollection<LinkCustomTagToMediaApiRef> TaggedItems {get; set;} = new List<LinkCustomTagToMediaApiRef>();


}
