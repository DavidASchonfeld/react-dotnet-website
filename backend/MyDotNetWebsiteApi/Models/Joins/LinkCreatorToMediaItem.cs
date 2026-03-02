public class LinkCreatorToMediaItem
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public int CreatorId {get; set;}

    public int MediaItemId {get; set;}
    
    public string Role {get; set;} = string.Empty;



    ///// C# Only - They do not exist in the SQL Database
    
    // We already have CreatorId and MediaItemId in the Real SQL Columns section above
    public Creator Creator {get; set;} = null!;
    public MediaItem MediaItem {get; set;} = null!;
}