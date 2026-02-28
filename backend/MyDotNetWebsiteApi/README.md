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
# For SQLite, a very basic version of SQL

dotnet add package Microsoft.EntityFrameworkCore.Tools
# For migrations (for pushing/pulling changes to/from the database), like using Github to track/implement changes

dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore
# For taking care of users/passwords
