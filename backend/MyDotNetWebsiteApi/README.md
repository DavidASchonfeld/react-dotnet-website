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

dotnet new webapi -n MyDotNetWebsiteApi