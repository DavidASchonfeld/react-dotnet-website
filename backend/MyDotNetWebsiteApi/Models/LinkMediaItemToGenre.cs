public class LinkMediaItemToGenre
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public int MediaItemId {get; set;}
    
    public int GenreId {get; set;}
    
    

    ///// C# Only - They do not exist in the SQL Database
    
    /// We already have MediaItemId and GenreId in the Real SQL Columns section above
    public MediaItem MediaItem {get; set;} = null!;
    public Genre Genre {get; set;} = null!;
}
