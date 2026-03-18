using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    // Constructor
    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }


    // Functions

    public string GenerateJwtToken(AppUser user)
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
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),

            // Also going to tell the front-end if the current user is a special status user (Ex: Admin, Moderator)
            new Claim("RoleLevel", user.RoleLevel.ToString()) 
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