using System.ComponentModel.DataAnnotations;

public class MoveMediaItemWithinMediaListDto
{
    // These are NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // public int mediaListId {get; set;}  // For MediaList
    // public int mediaItemId {get; set;}  // For MediaItem

    [Required]
    [Range(0, int.MaxValue)]
    public int NewPosition {get; set;}
}
