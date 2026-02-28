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
    public ICollection<LinkPermissionsForMediaListToAppUsers> SharedWith {get; set; } = new List<LinkPermissionsForMediaListToAppUsers>();

    // Gapless Ordering VS Sparse Ordering
    // When rearranging items in a list,  
    // Sparse Ordering: Use big numbers like 100, 200, etc.
    //    so if I rearrange or delete an item I don't have to renumber all items in the list
    // Gapless Ordering: Use regular numbering: 1, 2, 3, etc. (I could start with 0, or use -1 etc.)
    //    When reordering or deleting, I would have to update all numbers of all items behind it.
    // For this project, I am choosing "Gapless Ordering" because it is just satisfying to use right now.
    // If this project/website becomes widely-used/famous/etc. and speed matters more, I could implement sparse ordering instead.
}