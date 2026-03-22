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




##
Deploying
-- I created an account in Render (by using my Github account),
Step 1: Choose Service -> I choose "New Web Service"
-- In Tab "Git Provider", click the Git icon to give Github permission to give Render 
---- I have Render access only to the Git repo to my react-dotnet project (aka this project)
---- Set the "Root Directory" to "backend/MyDotNetWebsiteApi" so it knows to only look at backend
---- Setting Environment Variables:
------ JwtSettings__Secret: a long random string (generate one, keep it private)
------ CorsSettings__AllowedOrigin: My Render frontend URL (set this after deploying frontend)
------- 1st Admin Account
----------- SeedAdmin__UserName
----------- SeedAdmin__Password
----------- SeedAdmin__Email
------- ASPNETCORE_ENVIRONMENT: Production
------- ASPNETCORE_URLS http://+:8080  <- I need to add that since the end of the Dockerfile automaticlaly exposes that port, so I need to expose that in Render

For "Dockerfile Path", I need to set the path to my Dockerfile, which is just "/" (aka it is at the root" (since I set my root to "backend/MyDotNetWebsiteApi")
For "Docker Build Context Directory": backend/MyDotNetWebsiteApi
I am paying for the $7/month for my backend on Render.

Now, I will deploy Frontend

Click "New Static Site"
-- Choose a unique name: react-dotnet-website-frontend
-- Root Directory: frontend
-- Build Command npm run build
-- Publish Directory: dist
Add one environment variable:
VITE_API_URL: https://react-dotnet-website.onrender.com

Now, both my backend and frontend are both deployed succesfully.

Note: Since I gave Render permission to look at 1 of my Github repositories, Render has the ability to just pull from my Github.
So yes, every time I push my commits to Github, Render automatically re-deploys both my frontend and my backend.
It makes it really easy to publish and publish changes too.