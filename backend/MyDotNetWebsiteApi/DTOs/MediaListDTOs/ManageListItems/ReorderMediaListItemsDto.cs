public class ReorderMediaListItemsDto
{
    
    // This is NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // public int mediaListId {get; set;}

    public List<int> OrderedItemIds { get; set; } = [];
}
