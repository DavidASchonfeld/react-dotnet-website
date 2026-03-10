

// I created a file inside my frontend/ folder called ".env.local"
//  with the line VITE_API_URL=http://localhost:5198
//  which I'll change for the production code when I host this website oån a public server
//  Note: There cannot be spaces around the "=" inside the "".env.local" file
//  Note: Using the "export" keyword below so this variable is accessible to other files

// NOTE: Why not hardcode this into my code (and instead I'm putting it into a .env.local file)?
//  Because different environments/machines need different values without needing to change the code itself.
//  We do not want to hardcode machine/environment-specific code into our code.

export const BACKEND_BASE_URL = import.meta.env.VITE_API_URL as string;