I'm using .NET 10 for this project

##### For Setting up .NET HTTPS Certifications on My Laptop:

(Only need to run when setting up .NET on my laptop, if the HTTPS certificate expires (Takes 1 year to expire) or if I upgrade to a new .NET SDK Version)
dotnet dev-certs https --clean
dotnet dev-certs https
dotnet dev-certs https --trust


##### Running Instructions

dotnet restore <- Only needed for running it the first time
OR dotnet build
dotnet run

URL Example to see it work
https://localhost:7267/weatherforecast
Note: /weatherforecast is included in the template 



##### Setup Command

## For Creating the .NET Backend Template:
dotnet new webapi -n MyDotNetWebsiteApi

## For Adding New Packages
Note: Remember, you must enter the folder MyDotNetWebsiteApi before running these commands

dotnet add package Microsoft.EntityFrameworkCore.Sqlite
## For SQLite, a very basic version of SQL

dotnet add package Microsoft.EntityFrameworkCore.Tools
## For migrations (for pushing/pulling changes to/from the database), like using Github to track/implement changes

dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore


#### Instal the dotnet ef command onto your Mac:
dotnet tool install --global dotnet-ef

cat << \EOF >> ~/.zprofile (Writes text to file. Everything I type until I type EOF again is the text to write to the ~/.zprofile file)
# Add .NET Core SDK tools (Yes, we're adding this line as a comment to the ~/.zprofile file)
export PATH="$PATH:/Users/David/.dotnet/tools"
EOF

Then, open a new Terminal to run this instead or run the following command just to get the thing again.
export PATH="$PATH:/Users/David/.dotnet/tools"

Then, to verify that it worked:
dotnet ef --version

#### For Setting Up Link to DB (And Every Time I edit any Model C# Class):
Examples of When to Run This:
-- Adding an ew model class
-- adding a field to an existing model class
-- removing a field
-- changing a field type
-- adding or changing a relationship (For example, foreign key changes)
-- changing OnModelCreating configuration
## Step 1: Generate the migration file
dotnet ef migrations add DescribeWhatYouChanged

## Step 2: Apply it to the database
dotnet ef database update


# For JWT (Json Web Tokens), Setting up
I edited/added JWT information in the appsettings.json
For the JWT token, for development, I did the following command
Note: Remember to navigate into backend/MyDotNetWebsiteApi folder first.

dotnet user-secrets init
dotnet user-secrets set "JwtSettings:Secret" "MySecretKeyWhichMustBe32PlusCharactersLong"
Note: I am, of course, not going to publish my actual secret string onto github since then it wouldn't be a secret (and therefore it would be bad for security).


-- Issuer Validation: token was created by my website/server, (not someone else's, and not someone pretending to be my website)
-- Audience Validation: Checking that the token was made for this app/program, and not for another app/program.
-- Signature Validation: checking that the token wasn't tampered it

Import NuGet package:
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer


## Testing API Directly
# Creating a Test User

Using curl in Command Line/Terminal
Note: This user/pass/email etc. is a filler. I'm not putting on Github actual login information
curl -X POST http://localhost:5198/api/auth/register -H "Content-Type: application/json" -d '{"userName":"testuser","email":"test@bounce.com","password":"X!x!x1"}'

# Logging in with Test User

curl -X POST http://localhost:5198/api/auth/login -H "Content-Type: application/json" -d '{"userName":"testuser","password":"X!x!x1!"}'


#### Testing with CURL
## Testing GetMyLists
curl -X POST http://localhost:5198/api/auth/login -H "Content-Type: application/json" -d '{"userName":"testusername","password":"PasswordIamNotPushingOntoGithub"}'

curl -X GET http://localhost:5198/api/medialist/GetMyLists -H "Authorization: Bearer TheCopyPastedTokenFromWhatIGotFromThePreviousCommand

## Testing CreateList
curl -X POST http://localhost:5198/api/auth/login -H "Content-Type: application/json" -d '{"userName":"testusername","password":"PasswordIamNotPushingOntoGithub"}'

curl -X POST http://localhost:5198/api/medialist/CreateList -H "Content-Type: application/json" -H "Authorization: Bearer PUT_TOKEN_FROM_LOGIN_HERE" -d '{"Name":"List Number One", "description":"First list, created via CURL.","visibilityStatus":0}'
// 0 = Private, 1 = Shared, 1 = Public

curl -X GET http://localhost:5198/api/medialist/GetMyLists -H "Authorization: Bearer TheCopyPastedTokenFromWhatIGotFromThePreviousCommand







