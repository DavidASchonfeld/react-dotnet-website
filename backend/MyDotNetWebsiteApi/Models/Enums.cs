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

public enum Visibility
{
    Private,
    Public,
    Shared
}

public enum ItemAccessStatus
{
    Private,
    PendingApproval,
    Public
}

public enum PermissionLevel
{
    Viewer,
    Editor,
    Manager
}

public enum CreatorType
{
    Person,
    Band,
    Company,
    GameStudio
}

public enum CreatorRole
{
    Author,
    Director,
    Developer,
    Publisher,
    TBD
}