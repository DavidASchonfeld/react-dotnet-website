public class MediaList
{
    public int Id {get; set; }
    public string Name {get; set;} = string.Empty;
    public string? Description {get; set;}
    public DateTime DateSubmitted {get; set;} = DateTime.UtcNow;

    public string SubmittedByUserId {get; set;} = string.Empty;
    public AppUser SubmittedBy {get; set;} = null!;

    public ItemAccessStatus AcesssStatus {get; set;}
    public ICollection<LinkMediaItemToMediaList> ItemLinks {get; set; } = new List<LinkMediaItemToMediaList>();
    public ICollection<LinkPermissionsForMediaListToAppUser> SharedWith {get; set; } = new List<LinkPermissionsForMediaListToAppUser>();

    
}