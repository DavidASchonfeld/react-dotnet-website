# React and .NET Core Website

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
-- any file that contains any passwords, API keys, JWT (Json Web Token) secrets etc.