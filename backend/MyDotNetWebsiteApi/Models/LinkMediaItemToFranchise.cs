public class LinkMediaItemToFranchise
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public int MediaItemId {get; set;}
    
    public int FranchiseId {get; set;}
    

    ///// C# Only - They do not exist in the SQL Database
    
    /// We already have MediaItemId and FranchiseId in the Real SQL Columns section above
    public MediaItem MediaItem {get; set;} = null!;
    public Franchise Franchise {get; set;} = null!;
}
