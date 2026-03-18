public class UpdateUserRoleDto
{
    // Id NOT included here (aka it is commented out) because it will be passed via the URL when I send over this DTO
    // public string Id {get; set;}

    [Required]
    public UserRoleLevel NewRoleLevel {get; set;}
}