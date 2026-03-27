

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

    //// Featured lists require admin; regular lists require ownership or mod/admin (used for deletion)
    public static bool CanModifyOrDeleteList(AppUser requester, MediaList listObject) =>
        listObject.Category == MediaListCategory.Featured
            ? IsAdministrator(requester)  // Only admins can edit or delete featured (site-wide) lists
            : listObject.SubmittedById == requester.Id || IsModeratorOrAdmin(requester);

    //// Owner can always edit; admin can also edit/delete any public list (admin-only for Featured)
    public static bool CanEditListMetadata(AppUser requester, MediaList listObject) =>
        listObject.Category == MediaListCategory.Featured
            ? IsAdministrator(requester)
            : listObject.SubmittedById == requester.Id
              || (IsAdministrator(requester) && listObject.VisibilityStatus == VisibilityStatus.Public);

    //// Owner can always manage content; admin can also manage content of any public list (admin-only for Featured)
    public static bool CanManageListContent(AppUser requester, MediaList listObject) =>
        listObject.Category == MediaListCategory.Featured
            ? IsAdministrator(requester)
            : listObject.SubmittedById == requester.Id
              || (IsAdministrator(requester) && listObject.VisibilityStatus == VisibilityStatus.Public);

    //// Mod/Admin can set visibility to Public; owner can revert to Private (admin-only for Featured)
    public static bool CanSetListVisibility(AppUser requester, MediaList listObject) =>
        listObject.Category == MediaListCategory.Featured
            ? IsAdministrator(requester)
            : listObject.SubmittedById == requester.Id || IsModeratorOrAdmin(requester);

    // CustomTag Permissions
    //// Owner can always edit; admin can also edit/delete any public tag
    public static bool CanEditTagMetadata(AppUser requester, CustomTag tag) =>
        tag.CreatedById == requester.Id
        || (IsAdministrator(requester) && tag.VisibilityStatus == VisibilityStatus.Public);

    //// Mod/Admin can set tag visibility to Public; owner can revert to Private
    public static bool CanSetTagVisibility(AppUser requester, CustomTag tag) =>
        tag.CreatedById == requester.Id || IsModeratorOrAdmin(requester);
    

    
    // MediaType Permissions
    //// Owner, mod/admin or anyone if the type is approved
    public static bool CanSeeMediaType(AppUser requester, MediaType type) =>
        type.SubmittedById == requester.Id
        || IsModeratorOrAdmin(requester)
        || type.IsApproved;
}