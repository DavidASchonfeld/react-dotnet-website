
// Reserved for future list-sharing feature — schema exists but no service or controller reads/writes this table yet.
// When implementing, add a ListSharingService and corresponding controller endpoints.
public class LinkPermissionsForMediaListToAppUser
{
    ///// Real SQL Columns
    public int Id {get; set; }

    public int HostListId {get; set;}
    
    
    public string SharedWithUserId {get; set;} = string.Empty;
    
    // Permission Levels: Viewer, Editor, Manager
    // Manager can edit content and manage permissions for this list
    public PermissionLevel UserPermission {get; set;}


    ///// C# Only - They do not exist in the SQL Database
    
    /// We already have HostListId and SharedWithUserId in the Real SQL Columns section above
    public MediaList HostList {get; set;} = null!;
    public AppUser SharedWithUser {get; set;} = null!;
}