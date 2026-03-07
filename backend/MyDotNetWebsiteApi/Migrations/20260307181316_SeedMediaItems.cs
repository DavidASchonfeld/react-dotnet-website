using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class SeedMediaItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "MediaItems",
                columns: new[] { "Id", "DateSubmitted", "Description", "IsApproved", "MediaTypeId", "Name", "PublishedDateTime", "SubmittedById" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Disney Pixar movie about a father clownfish and his son getting separated and attempting to bring the son home.", true, 1, "Finding Nemo", null, null },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Disney Animated 1990s Musical about a lion growing up in the wild.", true, 1, "The Lion King", null, null },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "2012 Superhero Ensemble Movie Based on Marvel Comics Superheroes", true, 1, "The Avengers", null, null },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "1st 3d Platformer for Nintendo's Super Mario Franchise.", true, 4, "Super Mario 64", null, null },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "1966 Sci-Fi TV Show about a crew from the US Federation exploring space.", true, 2, "Star Trek", null, null },
                    { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "1st Sherlock Holmes book (unless my research is incorrect). Published 1887", true, 3, "A Study in Scarlet", null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MediaItems",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "MediaItems",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "MediaItems",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "MediaItems",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "MediaItems",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "MediaItems",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
