public class LinkCreatorToMediaItem
{
     public int Id {get; set; }

    public int CreatorId {get; set;}
    public Creator Creator {get; set;} = null!;
    
    public int MediaItemId {get; set;}
    public MediaItem MediaItem {get; set;} = null!;
    
    public string Role {get; set;} = string.Empty;
}