# React and .NET Core Website

Website URL (Front-End): https://react-dotnet-website-frontend.onrender.com
WARNING: Backend Host (Render) takes 30-60s to turn on once it receives a HTTP Request.
So once you use do a backend request, it will take 30-60 seconds to start up and then it will work fine.
Then it will "spin out"/aka hibernate if it doesn't hear anything for next 15 minutes.


This is a React.js and .NET Core website.
Front-End: Vite, React.js, TypeScript, React Router, 
Back-End: .NET/C#


CRUD - Basic Goal
Create
Read
Update
Delete




Data Flow Guide:

Frontend:
-- Components
-- Redux Store
-- .ts files in the "src/types" folder
-- Service to Call Backend API Endpoints. Each file in the "services" folder. For example authService.ts

Backend:
-- Controllers (in the "Controllers" folder)
-- Services (in the Services folder)
-- DTOs
-- .cs Files in the "Models" folder



Never Commit to Github:
-- .env with important values (secrets, etc.)
-- appsettings.Development.json and appsettings.Production.json (could contain user/passwords)
-- any file that contains any passwords, API keys, JWT (Json Web Token) secrets etc