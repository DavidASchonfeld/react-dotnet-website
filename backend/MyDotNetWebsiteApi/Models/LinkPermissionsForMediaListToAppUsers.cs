using Microsoft.AspNetCore.Identity;

public class LinkPermissionsForMediaListToAppUsers
{
    public int Id {get; set; }

    public int HostListId {get; set;}
    public MediaList HostList {get; set;} = null!;
    
    public int UserId {get; set;}
    public AppUser User {get; set;} = null!;
    
    // How do I describe permission status: Viewer VS Editor <-I can make things more complicated later.
}