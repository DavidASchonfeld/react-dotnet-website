public class LinkMediaApiRefToMediaList
{
    ///// Real SQL Columns
    public int Id {get; set;}

    public int HostListId {get; set;}
    public int MediaApiRefId {get; set;}

    // Gapless ordering: 0, 1, 2, ... (same approach as old LinkMediaItemToMediaList)
    public int Position {get; set;}



    ///// C# Only - They do not exist in the SQL Database

    // We already have MediaApiRefId and HostListId in the Real SQL Columns section above
    public MediaList HostList {get; set;} = null!;
    public MediaApiRef MediaApiRef {get; set;} = null!;


}
