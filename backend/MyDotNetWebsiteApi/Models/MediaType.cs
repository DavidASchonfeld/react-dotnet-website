public class MediaType
{
    ///// Real SQL Columns
    public int Id {get; set; }
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}


    // Submission Variables

    public string? SubmittedById {get; set;}
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;

    // isApproved = false means only display to creator and the admins to approve/deny
    // and isApproved = True means its an option to choose/view for everyone
    public bool IsApproved {get; set; }

    ///// C# Only - They do not exist in the SQL Database
     
    // We already have SubmittedById in the Real SQL Columns section above
    
    public AppUser SubmittedBy {get; set;} = null!;

    

}