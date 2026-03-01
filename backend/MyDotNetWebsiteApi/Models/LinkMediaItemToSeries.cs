public class LinkMediaItemToSeries
{
    public int Id {get; set; }

    public int MediaItemId {get; set;}
    public MediaItem MediaItem {get; set;} = null!;
    
    public int SeriesId {get; set;}
    public SeriesItem SeriesItem {get; set;} = null!;

    public int Position {get; set;}


}
