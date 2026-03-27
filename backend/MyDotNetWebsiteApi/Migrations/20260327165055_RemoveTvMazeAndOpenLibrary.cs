using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTvMazeAndOpenLibrary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 3);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ExternalApiSources",
                columns: new[] { "Id", "ApiName", "IsActive", "IsDisabledByAdmin", "MediaTypeId", "UsePosterApi" },
                values: new object[,]
                {
                    { 2, "TVMaze", true, false, 2, false },
                    { 3, "OpenLibrary", true, false, 3, false }
                });
        }
    }
}
