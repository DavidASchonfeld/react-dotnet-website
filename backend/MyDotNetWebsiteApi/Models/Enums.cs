// Enums

// Note: C# Projects don't need a "using" statement referencing this
// file since this project will find this project automatically 
// because this file is inside the C# project
// and they share a namespace

// TODO: Add these into potential entries for MediaTypes:
// public enum MediaType
// {
//     Book,
//     Movie,
//     TVShow,
//     VideoGame,
//     Comic,
//     Webcomic,
//     Website,
//     Article,
//     Image,
//     RadioShow,
//     Podcast,
//     TBD
// }

public enum VisibilityStatus
{
    Private,
    Public,
    Shared
}

// Site-Wide Permissions Levels for each User Account
public enum UserRoleLevel
{
    Basic,  // Basic access
    Moderator,  // Can approve, edit, delete any content
    Administrator  // Full Access
}

// Specific Roles for Specific MediaList etc.
public enum PermissionLevel
{
    Viewer,
    Editor,
    Manager
}

public enum CreatorRole
{
    Author,
    Director,
    Developer,
    Publisher,
    TBD
}

// Determines a MediaList's special behavior: protection from deletion, mutual exclusivity, and site-wide visibility
public enum MediaListCategory
{
    Standard = 0,       // Regular user list — can be freely created and deleted
    VisitingStatus = 1, // One of the per-user mutually exclusive status lists (e.g. "Want to Visit", "Currently Visiting")
    Library = 2,        // Per-user protected singleton — remembers items without implying visit intent (like Spotify's "Liked Songs")
    Featured = 3,       // Admin-owned, site-wide, always Public — contents may be surfaced in special site sections
}