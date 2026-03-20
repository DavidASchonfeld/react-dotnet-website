using System.ComponentModel.DataAnnotations;

public class AddMediaItemToMediaListDto
{
    // These are NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // public int mediaListId {get; set;}  // For MediaList
    // public int mediaItemId {get; set;}  // For MediaItem


    // Position is optional -> If they do NOT pass it, I will default to adding the MediaItem to the end of the list.
    [Range(0, int.MaxValue, ErrorMessage = "Position must be a non-negative integer.")]
    public int? Position {get; set;}
}