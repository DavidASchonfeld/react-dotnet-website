public class LinkSeriesItemToFranchise
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public int SeriesItemId {get; set;}
    
    
    public int FranchiseId {get; set;}
    


    ///// C# Only - They do not exist in the SQL Database
    
    /// We already have SeriesItemId and FranchiseId in the Real SQL Columns section above
    public SeriesItem SeriesItem {get; set;} = null!;
    public Franchise Franchise {get; set;} = null!;
}