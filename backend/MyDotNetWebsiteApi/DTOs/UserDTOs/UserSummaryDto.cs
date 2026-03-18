public class UserSummaryDto
{
    public string Id {get; set; } = string.Empty;

    
    public string UserName {get; set;} = string.Empty;
    public string? Email {get; set; }
    public UserRoleLevel RoleLevel {get; set;}
}