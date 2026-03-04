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


