
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

[ApiController] // This part of the controller controls routing
[Route("api/[controller]")] // [controller]: placeholder that gets automatically replaced by the controller class's name
public class AuthController : ControllerBase
{
    // Private fields to store the injected dependencies
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly ITokenService _tokenService;  // Old version has IConfiguration, but now the ITokenService has the IConfiguration instead.
    private readonly AppDbContext _context;

    // Constructor. This receives the injected depencies and stores them
    public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, ITokenService tokenService, AppDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _context = context;
    }



    // [FromBody]: Tells .NET read JSON from the request body and automatically convert it into a RegisterUserDto object
    ///// Tells .NET to specifically look in the body, not the url/headers/ etc.
    // Responds with a IActionResult object
    //// Wrapped in a Task<> wrapper because the result will be given asynchronously
    /// await _userManager.CreateAsync() <-start this operation and while we are
    /// waiting for the result, free up server to handle other requests
    /// And without this specification, the server would freeze while waiting for the result
    [HttpPost("register")]  // Occurs with route /register (with POST request)
    public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
    {
        var user = new AppUser
        {
            UserName = dto.UserName,
            Email = dto.Email
        };

        // Send an async task to use the passed-in-to-Auth-Controller userManager variable to register the user
        var result = await _userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Create the 4 default non-deleteable lists for the new user
        await DefaultMediaListSeederService.SeedDefaultListsForUserAsync(_context, user);
        await _context.SaveChangesAsync();

        // Now, log in the user that was just created, by providing a login token to the user

        // Generate JWT Token
        var token = _tokenService.GenerateJwtToken(user);

        // This is about letting the front-end know which RoleLevel the user has
        // for the UI (the actual permissions and double-checking that the user
        // actually has those permissions will still be in the backend)
        return Ok(new {token = token, roleLevel = user.RoleLevel.ToString()});
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
    {
        AppUser? userToCheck = await _userManager.FindByNameAsync(dto.UserName);
        if (userToCheck == null)
            return Unauthorized("Invalid username or password");

        // Last Parameter = false: means not locking the user out because of failed login attempts
        var resultPasswordCheck = await _signInManager.CheckPasswordSignInAsync(userToCheck, dto.Password, false);
        if (!resultPasswordCheck.Succeeded)
            return Unauthorized("Invalid username or password");
        
        // Generate JWT Token
        var token = _tokenService.GenerateJwtToken(userToCheck);

        // Return Token
        // The Ok method: Returns a 200 Website Code to show that it worked.
        // new {token = token}   Anonymous object which gets converted to JSON. {"token": "fhw98h2....."}
        // This is about letting the front-end know which RoleLevel the user has
        // for the UI (the actual permissions and double-checking that the user
        // actually has those permissions will still be in the backend)
        return Ok(new {token = token, roleLevel = userToCheck.RoleLevel.ToString()});
        
    }


}

