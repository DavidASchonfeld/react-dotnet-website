# React and .NET Core Website

##
### Website URL (Front-End): https://react-dotnet-website-frontend.onrender.com

This is a React.js and .NET Core website.

**Front-End:**
- Vite
- React.js
- TypeScript
- React Router

**Back-End:**
- .NET / C#


CRUD - Basic Goal
- Create
- Read
- Update
- Delete


Data Flow Guide:

Frontend:
- Components
- Redux Store
- .ts files in the "src/types" folder
- Services (in the "services" folder, e.g. authService.ts) — each service calls one shared `apiClient.ts` file to handle all fetch calls and catch general HTTP errors from backend API endpoints

Backend:
- Controllers (in the "Controllers" folder)
- Services (in the "Services" folder)
- DTOs
- .cs files in the "Models" folder


Never Commit to Github:
- .env with important values (secrets, etc.)
- appsettings.Development.json and appsettings.Production.json (could contain user/passwords)
- Any file that contains passwords, API keys, JWT (Json Web Token) secrets, etc.
