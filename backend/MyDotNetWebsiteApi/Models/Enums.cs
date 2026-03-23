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