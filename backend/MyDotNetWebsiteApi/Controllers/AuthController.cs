
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[ApiController] // This part of the controller controls routing
[Route("api/[controller]")] // [controller]: placeholder that gets automatically replaced by the controller class's name
public class AuthController : ControllerBase
{
    // Private fields to store the injected dependencies
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly IConfiguration _configuration;

    // Constructor. This receives the injected depencies and stores them
    public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }
}

