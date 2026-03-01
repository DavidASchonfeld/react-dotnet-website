public class LinkMediaItemToFranchise
{
    public int Id {get; set; }

    public int MediaItemId {get; set;}
    public MediaItem MediaItem {get; set;} = null!;
    
    public int FranchiseId {get; set;}
    public Franchise Franchise {get; set;} = null!;

}
