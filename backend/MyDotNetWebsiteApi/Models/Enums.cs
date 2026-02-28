// Enums

// Note: C# Projects don't need a "using" statement referencing this
// file since this project will find this project automatically 
// because this file is inside the C# project
// and they share a namespace


public enum MediaType
{
    Book,
    Movie,
    TVShow,
    VideoGame,
    Comic,
    Webcomic,
    Website,
    Article,
    Image,
    TBD
}

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
    Editor
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