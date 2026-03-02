public class LinkMediaItemToSeries
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public int MediaItemId {get; set;}
    
    
    public int SeriesItemId {get; set;}
    

    public int Position {get; set;}


    ///// C# Only - They do not exist in the SQL Database
    
    /// We already have MediaItemId and SeriesItemId in the Real SQL Columns section above
    public MediaItem MediaItem {get; set;} = null!;
    public SeriesItem SeriesItem {get; set;} = null!;

}
