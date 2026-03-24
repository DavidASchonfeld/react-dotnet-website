using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddNonSearchQueryCacheAndAppGlobalSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UseNonSearchQueryCache",
                table: "ExternalApiSources",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AppGlobalSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UseNonSearchQueryCache = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppGlobalSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NonSearchQueryCaches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ExternalItemId = table.Column<string>(type: "TEXT", nullable: false),
                    ExternalApiSourceId = table.Column<int>(type: "INTEGER", nullable: false),
                    ResultsJson = table.Column<string>(type: "TEXT", nullable: false),
                    CachedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NonSearchQueryCaches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NonSearchQueryCaches_ExternalApiSources_ExternalApiSourceId",
                        column: x => x.ExternalApiSourceId,
                        principalTable: "ExternalApiSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AppGlobalSettings",
                columns: new[] { "Id", "UseNonSearchQueryCache" },
                values: new object[] { 1, true });

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 1,
                column: "UseNonSearchQueryCache",
                value: true);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 2,
                column: "UseNonSearchQueryCache",
                value: true);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 3,
                column: "UseNonSearchQueryCache",
                value: true);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 4,
                column: "UseNonSearchQueryCache",
                value: true);

            migrationBuilder.CreateIndex(
                name: "IX_NonSearchQueryCaches_ExternalApiSourceId_ExternalItemId",
                table: "NonSearchQueryCaches",
                columns: new[] { "ExternalApiSourceId", "ExternalItemId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppGlobalSettings");

            migrationBuilder.DropTable(
                name: "NonSearchQueryCaches");

            migrationBuilder.DropColumn(
                name: "UseNonSearchQueryCache",
                table: "ExternalApiSources");
        }
    }
}
