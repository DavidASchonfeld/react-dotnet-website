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



##### Setup Command

dotnet new webapi -n MyDotNetWebsiteApi