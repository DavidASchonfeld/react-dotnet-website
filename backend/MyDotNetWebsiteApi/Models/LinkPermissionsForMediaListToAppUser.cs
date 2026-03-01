
public class LinkPermissionsForMediaListToAppUser
{
    public int Id {get; set; }

    public int HostListId {get; set;}
    public MediaList HostList {get; set;} = null!;
    
    public string SharedWithUserId {get; set;} = string.Empty;
    public AppUser SharedWithUser {get; set;} = null!;
    
    // Permission Levels: Viewer, Editor, Manager
    // Manager can edit content and manage permissions for this list
    public PermissionLevel UserPermission {get; set;}
}