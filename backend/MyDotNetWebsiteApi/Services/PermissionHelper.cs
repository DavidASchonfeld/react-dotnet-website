

public static class PermissionHelper
{
    public static bool IsModeratorOrAdmin(AppUser user) =>
        user.RoleLevel == UserRoleLevel.Moderator
        || user.RoleLevel == UserRoleLevel.Administrator;
    
    public static bool IsAdministrator(AppUser user) =>
    user.RoleLevel == UserRoleLevel.Administrator;



    // Managing Users Permissions
    public static bool CanSeeAllUsers(AppUser requester) =>
        IsAdministrator(requester);
    
    public static bool CanChangeUserRole(AppUser requester) =>
        IsAdministrator(requester);

    // MediaList Permissions
    //// Owner or admin can see a private list, everyone can see public lists
    public static bool CanSeeList(AppUser requester, MediaList listObject) =>
        listObject.SubmittedById == requester.Id
        || IsAdministrator(requester)
        || listObject.VisibilityStatus == VisibilityStatus.Public;

    //// Owner and/or mod/admin can modify or delete a MediaList object
    public static bool CanModifyOrDeleteList(AppUser requester, MediaList listObject) =>
        listObject.SubmittedById == requester.Id
        || IsModeratorOrAdmin(requester);
    

    // MediaItem Permissions
    public static bool CanModifyOrDeleteItem(AppUser requester, MediaItem item) =>
        item.SubmittedById == requester.Id || IsModeratorOrAdmin(requester);

    public static bool CanSeeUnApprovedMediaItem(AppUser requester, MediaItem item) =>
        item.SubmittedById == requester.Id || IsModeratorOrAdmin(requester);
    
    // MediaType Permissions
    //// Owner, mod/admin or anyone if the type is approved
    public static bool CanSeeMediaType(AppUser requester, MediaType type) =>
        type.SubmittedById == requester.Id
        || IsModeratorOrAdmin(requester)
        || type.IsApproved;
}