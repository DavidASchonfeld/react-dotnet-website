# Dev Notes


## Seeding the Initial Admin Account

If no administrator user exists yet, the backend seeds 1 admin user.
Once the admin is created, this seeding step will be skipped permanently on all future startups (as long as as an admin user exists. Otherwise, it will try to create another admin user)
This created admin user lives in the database indefinitely like any other user
Removing the environment variables does not delete the admin user

Note: To check for existing admin account, in the /backend/MyDotNetWebsiteApi folder in Terminal,
type "dotnet user-secrets list" to see it
If it is not there, or you forgot etc., set them with this:

    dotnet user-secrets set "SeedAdmin:UserName" "admin"
    dotnet user-secrets set "SeedAdmin:Password" "Admin1234!"
    dotnet user-secrets set "SeedAdmin:Email"    "admin@devWebsite.com"
Then, restart the backend to implement these changes.

## Development - use "dotnet user-secrets"

'dotnet user-secrets' stores secrets in a JSON file on your local machine only (and is never committed to git). .NET/C# loads them automatically when the setting 'ASPNETCORE_ENVIRONMENT=Development', which is the default when you run 'dotnet run' locally.

Run these commands once from 'backend/MyDotNetWebsiteApi/':

    dotnet user-secrets set "SeedAdmin:UserName" "admin"
    dotnet user-secrets set "SeedAdmin:Password" "Admin1234!"
    dotnet user-secrets set "SeedAdmin:Email"    "admin@devWebsite.com"

Then start the backend. (The admin account is created on the first run).

The JWT (Json Web Token) secret is also stored this way. If you have not set it yet:

    dotnet user-secrets set "JwtSettings:Secret" "YourSecretKeyWhichMustBe32PlusCharactersLong"

After these are set, 'dotnet user-secrets list' shows everything currently stored.


## Production - use environment variables

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


## Deploying

- I created an account in Render (by using my Github account)

Step 1: Choose Service -> I choose "New Web Service"
- In Tab "Git Provider", click the Git icon to give Github permission to give Render
  - I have Render access only to the Git repo to my react-dotnet project (aka this project)
  - Set the "Root Directory" to "backend/MyDotNetWebsiteApi" so it knows to only look at backend
  - Setting Environment Variables:
    - JwtSettings__Secret: a long random string (generate one, keep it private)
    - CorsSettings__AllowedOrigin: My Render frontend URL (set this after deploying frontend)
    - 1st Admin Account
      - SeedAdmin__UserName
      - SeedAdmin__Password
      - SeedAdmin__Email
    - ASPNETCORE_ENVIRONMENT: Production
    - ASPNETCORE_URLS http://+:8080  <- I need to add that since the end of the Dockerfile automatically exposes that port, so I need to expose that in Render

For "Dockerfile Path", I need to set the path to my Dockerfile, which is just "/" (aka it is at the root) (since I set my root to "backend/MyDotNetWebsiteApi")
For "Docker Build Context Directory": backend/MyDotNetWebsiteApi
I am paying for the $7/month for my backend on Render.

Now, I will deploy Frontend

Click "New Static Site"
- Choose a unique name: react-dotnet-website-frontend
- Root Directory: frontend
- Build Command npm run build
- Publish Directory: dist

Add one environment variable:
- VITE_API_URL: https://react-dotnet-website.onrender.com

In backend/appsettings.Production.json, make sure to include this:
(I put in the frontend URL) so my backened knows to recognize/know/accept requests from the frontend side of the website
{
    "CorsSettings": {
        "AllowedOrigin": "https://react-dotnet-website-frontend.onrender.com"
    }
}

Now, both my backend and frontend are both deployed successfully.

Note: Since I gave Render permission to look at 1 of my Github repositories, Render has the ability to just pull from my Github.
So yes, every time I push my commits to Github, Render automatically re-deploys both my frontend and my backend.
It makes it really easy to publish and publish changes too.


## Render Pricing

All costs are paid to Render directly.

| Service | Plan | Cost |
|---------|------|------|
| Frontend (Static Site) | Free | $0/month |
| Backend (Web Service) | Starter ($7/month) | $7/month |
| PostgreSQL Database | Starter ($7/month) | $7/month |
| **Total** | | **$14/month** |

The backend is on a paid plan so it stays always-on — free-tier web services spin down after inactivity and take ~60 seconds to wake up on the next request, which makes the site feel broken to visitors. The paid plan eliminates that.


## Connecting the Render PostgreSQL Database

The backend uses SQLite locally but switches to PostgreSQL in production (when `ASPNETCORE_ENVIRONMENT=Production`).

Step 1: Create a PostgreSQL database on Render (if you haven't already):
- Render Dashboard → New → PostgreSQL
- Choose any name and region (pick the same region as your backend Web Service)

Step 2: Get the internal connection string:
- Open your Render PostgreSQL service → click "Connect"
- Copy the **Internal Database URL** field (starts with `postgresql://...`)
- Use Internal (not External) to keep traffic on Render's private network — faster and no SSL overhead

Step 3: Add to your backend Web Service environment variables:
- Go to your Render Dashboard
- Click on your **backend Web Service** (not the PostgreSQL database, not the frontend)
- In the left sidebar, click **Environment**
- You'll see a table of existing env vars (like `JwtSettings__Secret`, etc.)
- Click **Add Environment Variable** and fill in:
  - Key: `ConnectionStrings__DefaultConnection`
  - Value: *(paste the Internal Database URL you copied)*
- Click **Save Changes** — Render will prompt you that a redeploy is needed

Step 4: Redeploy the backend.
- Pushing your code commit to GitHub triggers a redeploy automatically (same as always).
- Alternatively, Render may have already queued a redeploy after you saved the env var — check the **Deploys** tab on your backend Web Service.
- Or trigger it manually: backend Web Service → **Deploys** tab → **Deploy latest commit**.
- On first startup, EF Core automatically runs all 31 migrations to create the schema in PostgreSQL.
- The admin user is also re-seeded (since the new database is empty).


## Password Requirements for Registration

ASP.NET Identity enforces these password rules by default:
- At least 6 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit (0–9)
- At least 1 special character (e.g. `!`, `@`, `#`, `$`, `%`)

Example of a valid password: `MyPass1!`

If a user's password doesn't meet these requirements, the registration form now shows the specific error message returned by Identity (e.g. "Passwords must have at least one non alphanumeric character.") instead of a generic failure message.


## Frontend: API Response Wrapping (CachedResponse)

### The Pattern

All 3rd-party API search results (from OMDB, RAWR, etc.) are wrapped in a `CachedResponse<T>` object by the backend.

Why? The backend caches search results to avoid hitting external APIs repeatedly. We need to know whether results are fresh or cached.
More details in cacheMetadata.ts
### The Structure

Whether cached or fresh, all responses have this structure:

{
  data: ExternalApiSearchResult[],           // The actual results
  cacheMetadata: {
    isFromCache: boolean,                    // Was this from our cache?
    cachedAt: "2026-03-24T10:30:00Z"        // When cached?
  }
}

## API Notes:
- Creator info is not available in OMDB search results