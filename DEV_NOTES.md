# Dev Notes


## Seeding the Initial Admin Account

If no administrator user exists yet, the backend seeds 1 admin user.
Once the admin is created, this seeding step will be skipped permanently on all future startups (as long as as an admin user exists. Otherwise, it will try to create another admin user)
This created admin user lives in the database indefinitely like any other user
Removing the environment variables does not delete the admin user


### Development - use "dotnet user-secrets"

'dotnet user-secrets' stores secrets in a JSON file on your local machine only (and is never committed to git). .NET/C# loads them automatically when the setting 'ASPNETCORE_ENVIRONMENT=Development', which is the default when you run 'dotnet run' locally.

Run these commands once from 'backend/MyDotNetWebsiteApi/':

    dotnet user-secrets set "SeedAdmin:UserName" "admin"
    dotnet user-secrets set "SeedAdmin:Password" "Admin1234!"
    dotnet user-secrets set "SeedAdmin:Email"    "admin@devWebsite.com"

Then start the backend. (The admin account is created on the first run).

The JWT (Json Web Token) secret is also stored this way. If you have not set it yet:

    dotnet user-secrets set "JwtSettings:Secret" "YourSecretKeyWhichMustBe32PlusCharactersLong"

After these are set, 'dotnet user-secrets list' shows everything currently stored.


### Production - use environment variables

'dotnet user-secrets' is a development-only tool and is never loaded in production. Instead, in production, .NET reads the same config keys from the environment variables instead.
.NET maps '__' (double underscore) to ':' (colon), so 'SeedAdmin:UserName' becomes 'SeedAdmin__UserName'.

Set these on the server before the first deployment

    SeedAdmin__UserName=YourAdminName
    SeedAdmin__Password=AStrongPassword
    SeedAdmin__Email=admin@pwebsite.com
    JwtSettings__Secret=YourSecretKeyWhichMustBe32PlusCharactersLong

After starting the app once, the admin user is created.
Once the admin is created, this seeding step will be skipped permanently on all future startups (as long as as an admin user exists. Otherwise, it will try to create another admin user)
This created admin user lives in the database indefinitely like any other user
Removing the environment variables does not delete the admin user

**Keep 'JwtSettings__Secret' permanently. This is needed for every HTTPRequest to validate JWT tokens.**

Never reuse dev credentials (username/password) in production