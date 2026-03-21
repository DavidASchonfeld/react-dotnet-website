# Dockerfile for my Backend
# Note: Dockerfile only prepares/deploys my code,
#   but not related things like Databases.

# Dockerfiles are initialization scripts for container objects
#   So, unlike certain code that needs to be referenced live for some projects to work, once the dockerfile runs, no need to use it again unless
#  you want to finetune the environment/container(s) and/or 
# if it is helpful for solving container-related errors

# Stage 1: Build
# Pull from .NET 10's official SDK image from .NET's creator Microsoft
# The SDK includes the compiler and build tools
# Import from Microsoft into a something new I create that I will give that variable name "build"
# Microsoft's servers host a pre-configured Linux computer image
# that already has .NET 10 SDK.
# Here, I am using that .NET 10 SDK as a starting point.
# This object that I name "build" will be a "stage".

# Difference Between "Image", "Container" and "Stage"
# -- Image:     read-only snapshot/template (Similar to a .zip file of a filesystem)
# -- Container: a running instance of an image (like a live process started from that .zip)
# -- Stage: a temporary image created mid-build, used only during docker build - never deployed

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
# Here in Docker, as soon as you create an image (like in the line above),
# So all commands from now on (until the next time I create another image)
# will be run from inside that image (aka think of it like a virtual computer)
# So now, we are in this "build" object, and it directs us to the "root" aka to full location "/"


# Move working directory 
# As described in more detail above.
# [build image]/src
# NOTE: WORKDIR always needs absolute path from root. Unlike "cd LocalFolder", WORKDIR must always have the full path of wherever it is navigating you to.
# So the line below is the absolute path /src so there is only 1 parent folder to /src which is "/" and there is no higher folder.
WORKDIR /src

# Copy only the .csproj first into "build", specifically into "." (which means current address), so specifically into "/src" (which we navigated to in the previous command.)
# COPY has two syntaxes:
#   Shell form: COPY source dest         Example: COPY MyDotNetWebsiteApi.csproj .
#   Exec form:  COPY ["source", "dest"]  Example: COPY ["MyDotNetWebsiteApi.csproj", "."]
# Both are functionally equivalent for simple paths.
# The exec form is necessary when filenames contain SPACES,
# because shell form would split on the space and misinterpret the arguments.
# Here, neither has spaces, so either syntax works.
# Exec form is used here purely as a style convention.
COPY ["MyDotNetWebsiteApi.csproj", "."]

# Pull external packages that my project uses (listed in MyDotNetWebsiteApi.csproj under <PackageReference entries).
# This command "dotnet restore" downloads the package
# from NuGet.
RUN dotnet restore


# Now copy all source files, and publish (compile + optimize for release)
## COPY . .      means
# COPY [source-current folder on your machine] [destination-current working] directory in the Docker Image
COPY . .

# Prepare (more details below) app and bundle everything you need to run it.
# -c Release: Use the "Release configuration" (optimized, no debug symbols, smaller and faster than "Debug" configuration )
# -o /app/publish: Output the compiled files to /app/publish (inside the Docker Image)
# --no-restore: Skip running restore, since I already ran it in an earlier line.
# This command "Publish" means this:
# -- Compiles the code (.cs -> .dll)
# -- Collects all runtime dependencies (NuGet packages (like 3rd-party packages need to be downloaded), native libraries)
# -- Bundles everything into a single self-contained output folder ready to deploy
# Result of this Command: In my Docker Image, there is a folder /app/publish which contains the files to run.
RUN dotnet publish -c Release -o /app/publish --no-restore





# -- Stage 2: Runtime --
    # Use a smaller image: just the ASP.NET runtime, not the SDK.
    # This keeps the final image smaller so it has faster deploys.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
# As I said above,
# Here in Docker, as soon as you create an image (like in the line above),
# So all commands from now on (until the next time I create another image)
# will be run from inside that image (aka think of it like a virtual computer)
# So now, until I create another image, all commands will be run
# from inside the "final" image.
# The "build" stage created before this is NOT accessible as a named image after
# "docker build" completes — Docker does not expose intermediate stages as runnable images.
# However, Docker internally caches its layers, so if you re-run "docker build",
# Docker can reuse the cached layers from "build" (e.g. skipping re-downloading NuGet packages)
# as long as the relevant source files haven't changed.




# Move working directory into folder /app
# So since we are now in "final", we are navigating to [final image]/app
WORKDIR /app


# Copy the compiled output from Stage 1 into this new image

# --from=build  : Instead of copying from my local machine,
#                   copy from the "build" object I created
#                   called "build"
# Now 1st parameter (--from=build is the option tag I just explained above)
#    is the source address.
# So remember COPY (without the tag): # COPY [source-current folder on your machine] [destination-current working] 
# So the 1st parameter is the source address.
# So the tag (--from=build) and the 1st parameter input (/app/publish)
# together means, COPY from the "build" object, specifically at address "/app/publish".
# 2nd parameter is "." aka the destination ,which is the destination location's current working directory.
# So in summary, we created this 2nd image "final"
# because unlike "build", which includes all of my non-prepared files,
# "final" only contains the compiled output: .NET DLL assemblies and their runtime dependencies,
# ready to be executed by the ASP.NET runtime that the aspnet:10.0 base image provides.
# It is efficient that this does not contain my files, though the main
# reason why "final" is smaller than "build" is because
# final does not have the SDK compiler that build does.
COPY --from=build /app/publish .

# EXPOSE documents which port this container listens on.
# Docker platforms (including Railway) read this to configure routing automatically.
# Why port 8080?  ASP.NET Core defaults to port 5198 locally (from `launchSettings.json`), but on Railway the standard is 8080. Railway injects `ASPNETCORE_URLS=http://+:8080` automatically when it sees `EXPOSE 8080`, so no extra config needed.

EXPOSE 8080

# Docker's command to start up my webapp when the container starts.
# NOTE When the Dockerfile runs (this is when "docker build" is called),
#  The "build" stage completes fully (all its RUN/COPY steps execute),
#    but it is an intermediate stage and is not exposed as a named output image.
#  The "final" image is created as the output of "docker build".
#  This ENTRYPOINT command executes during "docker run" or when Railway starts the container.
# Because our current working directory is "/app"
# (I navigated there in the previous command (set earlier in this file at the "WORKDIR /app" command)
# dotnet is the command to run dotnet
# My project's name in .csproj
# (and root folder under my "backend" folder is named)
# MyDotNetWebsiteApi
ENTRYPOINT ["dotnet", "MyDotNetWebsiteApi.dll"]



