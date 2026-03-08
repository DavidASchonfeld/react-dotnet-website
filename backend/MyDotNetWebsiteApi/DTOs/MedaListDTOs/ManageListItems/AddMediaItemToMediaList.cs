public class AddMediaItemToMediaList
{
    // These are NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // public int mediaListId {get; set;}  // For MediaList
    // public int mediaItemId {get; set;}  // For MediaItem


    // Position is optional -> If they do NOT pass it, I will default to adding the MediaItem to the end of the list.
    public int? Position {get; set;}
}