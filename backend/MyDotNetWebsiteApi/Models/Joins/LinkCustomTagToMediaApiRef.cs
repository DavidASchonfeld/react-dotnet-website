public class LinkCustomTagToMediaApiRef
{
    ///// Real SQL Columns
    public int Id {get; set;}

    public int CustomTagId {get; set;}
    public int MediaApiRefId {get; set;}

    public string? Note {get; set;}
    public string? AddedById {get; set;}
    public DateTime DateAdded {get; set;} = DateTime.UtcNow;



    ///// C# Only - They do not exist in the SQL Database

    // We already have CustomTagId and MediaApiRefId in the Real SQL Columns section above
    public CustomTag CustomTag {get; set;} = null!;
    public MediaApiRef MediaApiRef {get; set;} = null!;
    public AppUser AddedBy {get; set;} = null!;


}
