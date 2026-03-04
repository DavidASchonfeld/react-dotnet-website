
const BACKEND_BASE_URL: string = "http://localhost:5198"

// export: So other files in our frontend can use this function
// async: Because this function uses "await" to run an asynchronous function
export async function registerUser(userName: string, email: string, password: string) {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            // This variable names (on the left) need to match perfectly
            // with the matching DTO (Data Transfer Object) (simple object container file)
            // in my backend: "backened/MyDotNetWebsiteApi/DTOs/RegisterUserDto.cs"
            // Here, it uses camelCase (even though it uses UpperCase in the DTO file)
            // since the .NET JSON Serializer converts between each programming language's standard
            // capitalization for variable names each programmming lagnuage
            // TypeScript Standard for Variable Names: camelCase
            // C#/.NET Standard for Variable Names: PascalCase
            userName: userName,
            email: email,
            password: password
        })
    });

    if (!response.ok)
        throw new Error("Registration failed")

    const data = await response.json();
    
    return data;
}


// export: So other files in our frontend can use this function
// async: Because this function uses "await" to run an asynchronous function
export async function loginUser(userName: string, password: string) {

    // fetch makes HTTP requests
    // await: Async call. Waits for response before continuing
    const response = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userName: userName,
            password: password
        })
    });

    if (!response.ok)
        throw new Error("Login failed")

    const data = await response.json();
    
    return data;
}