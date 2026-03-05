
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
    private readonly IConfiguration _configuration;

    // Constructor. This receives the injected depencies and stores them
    public AuthController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
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


        // Now, log in the user that was just created, by providing a login token to the user

        // Generate JWT Token
        var token = GenerateJwtToken(user);

        return Ok(new {token = token});
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
    {
        AppUser? userToCheck = await _userManager.FindByNameAsync(dto.UserName);
        if (userToCheck == null)
            return Unauthorized("Invalid username or password");

        // Last Parameter = false: means not locking the user out because of failed login attempts
        var resultPasswodCheck = await _signInManager.CheckPasswordSignInAsync(userToCheck, dto.Password, false);
        if (!resultPasswodCheck.Succeeded)
            return Unauthorized("Invalid username or password");
        
        // Generate JWT Token
        var token = GenerateJwtToken(userToCheck);

        // Return Token
        // The Ok method: Returns a 200 Website Code to show that it worked.
        // new {token = token}   Anonymous object which gets converted to JSON. {"token": "fhw98h2....."}
        return Ok(new {token = token});
        
    }

    // JWT stands for Json Web Token
    private string GenerateJwtToken(AppUser user)
    {

        // Get Secret from the saved settings on JwtSettings object
        // Yes, it gets from my "appsettings.json" file and from "dotnet user-secrets command line (more info in the backend's README.md)"
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secret = jwtSettings["Secret"];

        // Generate Key and Credentials for the Key:
        // Credentials: Use this key with this Security Algorithm to Sign the Token
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            // Claim: Additional Information I want to attach to the token
            // Claim type names: (For example: JwtRegisteredClaimNames.Sub) are automatically built, but
            // -- You can create custom Claim type names by creating a new Claim("stringIChoose", "valueIChoose")
            // -- Unlike other JwtSecurityToken parameters, claim information is not enforced
            //    by the built-in system to make the JwtSecurityToken and security work.
            //    Informaiton we store in Claims are just us manually passing in/storing
            //    information for our app to use for logic we build in/use
            new Claim(JwtRegisteredClaimNames.Sub, user.Id), // Set Subject to UserId
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName!), //Set UniqueName to Username as the Claim

            // user.Email! tells C# to ignore that user.Email could be null, since Claim must have non-null
            // So ! means: Trust me, C#. This value will never be null.
            new Claim(JwtRegisteredClaimNames.Email, user.Email!)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["ExpiryDays"])),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }


}

