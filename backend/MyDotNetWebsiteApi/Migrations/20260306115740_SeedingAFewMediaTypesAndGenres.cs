using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class SeedingAFewMediaTypesAndGenres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Genres",
                columns: new[] { "Id", "DateSubmitted", "Description", "IsApproved", "Name", "SubmittedById" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(310), null, true, "Comedy", null },
                    { 2, new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670), null, true, "Sitcom", null },
                    { 3, new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670), null, true, "Action", null },
                    { 4, new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670), null, true, "Sci-Fi", null },
                    { 5, new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670), null, true, "Fantasy", null }
                });

            migrationBuilder.InsertData(
                table: "MediaTypes",
                columns: new[] { "Id", "DateSubmitted", "Description", "IsApproved", "Name", "SubmittedById" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(730), null, true, "Movie", null },
                    { 2, new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(1120), null, true, "TV Show", null },
                    { 3, new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(1120), null, true, "Book", null },
                    { 4, new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(1120), null, true, "Video Game", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 4);
        }
    }
}
