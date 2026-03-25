using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCacheItemAndImageCacheTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NonSearchQueryCaches");

            migrationBuilder.DropTable(
                name: "SearchQueryCaches");

            migrationBuilder.DropColumn(
                name: "Genres",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Plot",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Rated",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Runtime",
                table: "MediaApiRefs");

            migrationBuilder.CreateTable(
                name: "CacheItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ApiSource = table.Column<string>(type: "TEXT", nullable: false),
                    QueryType = table.Column<string>(type: "TEXT", nullable: false),
                    MediaType = table.Column<string>(type: "TEXT", nullable: false),
                    QueryParametersJson = table.Column<string>(type: "TEXT", nullable: false),
                    QueryParametersHash = table.Column<string>(type: "TEXT", nullable: false),
                    ResponseJson = table.Column<string>(type: "TEXT", nullable: false),
                    ResponseSchemaVersion = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastAccessedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    HitCount = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CacheItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ImageCaches",
                columns: table => new
                {
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: false),
                    ImageBlob = table.Column<byte[]>(type: "BLOB", nullable: true),
                    ContentType = table.Column<string>(type: "TEXT", nullable: false),
                    ImageSizeBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    CachedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AccessedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    HitCount = table.Column<int>(type: "INTEGER", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImageCaches", x => x.ImageUrl);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CacheItems_ApiSource_QueryType_MediaType_QueryParametersHash",
                table: "CacheItems",
                columns: new[] { "ApiSource", "QueryType", "MediaType", "QueryParametersHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CacheItems_ExpiresAt",
                table: "CacheItems",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_CacheItems_LastAccessedAt",
                table: "CacheItems",
                column: "LastAccessedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ImageCaches_AccessedAt",
                table: "ImageCaches",
                column: "AccessedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ImageCaches_ExpiresAt",
                table: "ImageCaches",
                column: "ExpiresAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CacheItems");

            migrationBuilder.DropTable(
                name: "ImageCaches");

            migrationBuilder.AddColumn<string>(
                name: "Genres",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Plot",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Rated",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Runtime",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "NonSearchQueryCaches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ExternalApiSourceId = table.Column<int>(type: "INTEGER", nullable: false),
                    CachedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExternalItemId = table.Column<string>(type: "TEXT", nullable: false),
                    ResultsJson = table.Column<string>(type: "TEXT", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "SearchQueryCaches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ExternalApiSourceId = table.Column<int>(type: "INTEGER", nullable: false),
                    CachedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NormalizedQuery = table.Column<string>(type: "TEXT", nullable: false),
                    Page = table.Column<int>(type: "INTEGER", nullable: false),
                    ResultsJson = table.Column<string>(type: "TEXT", nullable: false),
                    Subtype = table.Column<string>(type: "TEXT", nullable: true)
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
                name: "IX_NonSearchQueryCaches_ExternalApiSourceId_ExternalItemId",
                table: "NonSearchQueryCaches",
                columns: new[] { "ExternalApiSourceId", "ExternalItemId" },
                unique: true);

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
    }
}
