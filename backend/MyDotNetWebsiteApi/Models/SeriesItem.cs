public class SeriesItem
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    
    // If there was only 1 Franchise per Series, this is how we would do it.
    // public int? FranchiseId {get; set;}
    // public Franchise? Franchise {get; set;}
    // 
    // Since we could have crossovers aka multiple franchises in a series,
    // and also multiple series in Franchise, we use Link tables, which we created 
    // the LinkSeriesItemToFranchise.cs link/join table for.
    // For SQL, we don't need to reference that join table now that we created it.
    // For C#, we reference that table in this file below, in the C# Section.


    // Submission Variables
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;
    public string SubmittedByUserId {get; set;} = string.Empty;
    

    // isApproved = false means only display to creator and the admins to approve/deny
    // and isApproved = True means its an option to choose/view for everyone
    public bool IsApproved {get; set; }


    ///// C# Only - They do not exist in the SQL Database
     
    // We already have SubmittedById in the Real SQL Columns section above
    public AppUser SubmittedBy {get; set;} = null!;

    // Many-to-Many Relationships
    //   Meaning, there can be multiple of object As related to many object Bs

    public ICollection<LinkSeriesItemToFranchise> FranchiseEntries {get; set; } = new List<LinkSeriesItemToFranchise>();

    public ICollection<LinkMediaItemToSeriesItem> SeriesEntries {get; set; } = new List<LinkMediaItemToSeriesItem>();

}