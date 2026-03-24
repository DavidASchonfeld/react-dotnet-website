using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchQueryCache : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SearchQueryCaches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NormalizedQuery = table.Column<string>(type: "TEXT", nullable: false),
                    ExternalApiSourceId = table.Column<int>(type: "INTEGER", nullable: false),
                    Page = table.Column<int>(type: "INTEGER", nullable: false),
                    Subtype = table.Column<string>(type: "TEXT", nullable: true),
                    ResultsJson = table.Column<string>(type: "TEXT", nullable: false),
                    CachedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SearchQueryCaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SearchQueryCaches_ExternalApiSources_ExternalApiSourceId",
                        column: x => x.ExternalApiSourceId,
                        principalTable: "ExternalApiSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SearchQueryCaches_ExternalApiSourceId",
                table: "SearchQueryCaches",
                column: "ExternalApiSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_SearchQueryCaches_NormalizedQuery_ExternalApiSourceId_Page_Subtype",
                table: "SearchQueryCaches",
                columns: new[] { "NormalizedQuery", "ExternalApiSourceId", "Page", "Subtype" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SearchQueryCaches");
        }
    }
}
