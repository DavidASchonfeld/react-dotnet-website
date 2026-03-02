public class Creator
{
    ///// Real SQL Columns
    public int Id {get; set; }
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}

    public bool IsGroup {get; set;}


    // Submission Variables
    public string SubmittedByUserId {get; set;} = string.Empty;
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;
    public bool IsApproved {get; set;}

    
    ///// C# Only - They do not exist in the SQL Database
    
    // We have SubmittedById up above in the SQL section
    public AppUser SubmittedBy {get; set;} = null!;

    // Many-to-Many Relationships
    //   Meaning, there can be multiple of object As related to many object Bs
    
    public ICollection<LinkCreatorToMediaItem> CreatedWorks {get; set; } = new List<LinkCreatorToMediaItem>();

}