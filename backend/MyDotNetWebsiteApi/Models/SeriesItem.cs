public class SeriesItem
{
    public int Id {get; set; }

    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    
    public int? FranchiseId {get; set;}
    public Franchise? Franchise {get; set;}
    public ICollection<LinkMediaItemToSeries> SeriesEntries {get; set; } = new List<LinkMediaItemToSeries>();


    // Submission Variables
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;
    public string SubmittedByUserId {get; set;} = string.Empty;
    public AppUser SubmittedBy {get; set;} = null!;

    // isApproved = false means only display to creator and the admins to approve/deny
    // and isApproved = True means its an option to choose/view for everyone
    public bool IsApproved {get; set; }
}