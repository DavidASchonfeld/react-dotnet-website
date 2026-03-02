public class Genre
{
    ///// Real SQL Columns

    public int Id {get; set; }
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;

    public string SubmittedByUserId {get; set;} = string.Empty;
    

    // TODO: In the future, adding a more complicated version of approval status would be ideal.
    // Right now, isApproved = false means only display to creator and the admins to approve/deny
    // and isApproved = True means its an option to choose/view for everyone
    public bool IsApproved {get; set; }



    ///// C# Only - They do not exist in the SQL Database
    
    // We have SubmittedById up above in the SQL section
    public AppUser SubmittedBy {get; set;} = null!;

}