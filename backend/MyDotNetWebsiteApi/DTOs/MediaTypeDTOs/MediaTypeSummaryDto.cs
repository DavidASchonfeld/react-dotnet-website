public class MediaTypeSummaryDto
{
    ///// Real SQL Columns
    public int Id {get; set; }
    public string Name {get; set;} = string.Empty;

    // string because, right now, the Icon will be an emoji.
    public string Icon {get; set; } = string.Empty;
    
    public string? Description {get; set;}

    // isApproved = false means only display to creator and the admins to approve/deny
    // and isApproved = True means its an option to choose/view for everyone
    public bool IsApproved {get; set; }

}