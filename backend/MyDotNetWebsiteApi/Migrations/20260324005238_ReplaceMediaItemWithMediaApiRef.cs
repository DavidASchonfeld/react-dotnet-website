using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceMediaItemWithMediaApiRef : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LinkCreatorToMediaItemTable");

            migrationBuilder.DropTable(
                name: "LinkMediaItemToFranchiseTable");

            migrationBuilder.DropTable(
                name: "LinkMediaItemToGenreTable");

            migrationBuilder.DropTable(
                name: "LinkMediaItemToMediaListTable");

            migrationBuilder.DropTable(
                name: "LinkMediaItemToSeriesItemTable");

            migrationBuilder.DropTable(
                name: "LinkSeriesItemToFranchiseTable");

            migrationBuilder.DropTable(
                name: "Creators");

            migrationBuilder.DropTable(
                name: "Genres");

            migrationBuilder.DropTable(
                name: "MediaItems");

            migrationBuilder.DropTable(
                name: "Franchises");

            migrationBuilder.DropTable(
                name: "SeriesItems");

            migrationBuilder.CreateTable(
                name: "CustomTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    VisibilityStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateCreated = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomTags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomTags_AspNetUsers_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ExternalApiSources",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ApiName = table.Column<string>(type: "TEXT", nullable: false),
                    MediaTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalApiSources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExternalApiSources_MediaTypes_MediaTypeId",
                        column: x => x.MediaTypeId,
                        principalTable: "MediaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MediaApiRefs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    MediaTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatorName = table.Column<string>(type: "TEXT", nullable: true),
                    PublishedDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ExternalApiSourceId = table.Column<int>(type: "INTEGER", nullable: false),
                    ExternalId = table.Column<string>(type: "TEXT", nullable: false),
                    DateAdded = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaApiRefs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MediaApiRefs_ExternalApiSources_ExternalApiSourceId",
                        column: x => x.ExternalApiSourceId,
                        principalTable: "ExternalApiSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MediaApiRefs_MediaTypes_MediaTypeId",
                        column: x => x.MediaTypeId,
                        principalTable: "MediaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LinkCustomTagToMediaApiRefTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CustomTagId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaApiRefId = table.Column<int>(type: "INTEGER", nullable: false),
                    AddedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateAdded = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkCustomTagToMediaApiRefTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkCustomTagToMediaApiRefTable_AspNetUsers_AddedById",
                        column: x => x.AddedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LinkCustomTagToMediaApiRefTable_CustomTags_CustomTagId",
                        column: x => x.CustomTagId,
                        principalTable: "CustomTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkCustomTagToMediaApiRefTable_MediaApiRefs_MediaApiRefId",
                        column: x => x.MediaApiRefId,
                        principalTable: "MediaApiRefs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkMediaApiRefToMediaListTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HostListId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaApiRefId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkMediaApiRefToMediaListTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkMediaApiRefToMediaListTable_MediaApiRefs_MediaApiRefId",
                        column: x => x.MediaApiRefId,
                        principalTable: "MediaApiRefs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkMediaApiRefToMediaListTable_MediaLists_HostListId",
                        column: x => x.HostListId,
                        principalTable: "MediaLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "ExternalApiSources",
                columns: new[] { "Id", "ApiName", "IsActive", "MediaTypeId" },
                values: new object[,]
                {
                    { 1, "OMDB", true, 1 },
                    { 2, "TVMaze", true, 2 },
                    { 3, "OpenLibrary", true, 3 },
                    { 4, "RAWG", true, 4 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomTags_CreatedById",
                table: "CustomTags",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalApiSources_MediaTypeId",
                table: "ExternalApiSources",
                column: "MediaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkCustomTagToMediaApiRefTable_AddedById",
                table: "LinkCustomTagToMediaApiRefTable",
                column: "AddedById");

            migrationBuilder.CreateIndex(
                name: "IX_LinkCustomTagToMediaApiRefTable_CustomTagId",
                table: "LinkCustomTagToMediaApiRefTable",
                column: "CustomTagId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkCustomTagToMediaApiRefTable_MediaApiRefId",
                table: "LinkCustomTagToMediaApiRefTable",
                column: "MediaApiRefId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaApiRefToMediaListTable_HostListId",
                table: "LinkMediaApiRefToMediaListTable",
                column: "HostListId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaApiRefToMediaListTable_MediaApiRefId",
                table: "LinkMediaApiRefToMediaListTable",
                column: "MediaApiRefId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaApiRefs_ExternalApiSourceId_ExternalId",
                table: "MediaApiRefs",
                columns: new[] { "ExternalApiSourceId", "ExternalId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MediaApiRefs_MediaTypeId",
                table: "MediaApiRefs",
                column: "MediaTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LinkCustomTagToMediaApiRefTable");

            migrationBuilder.DropTable(
                name: "LinkMediaApiRefToMediaListTable");

            migrationBuilder.DropTable(
                name: "CustomTags");

            migrationBuilder.DropTable(
                name: "MediaApiRefs");

            migrationBuilder.DropTable(
                name: "ExternalApiSources");

            migrationBuilder.CreateTable(
                name: "Creators",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SubmittedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateSubmitted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsGroup = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Creators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Creators_AspNetUsers_SubmittedById",
                        column: x => x.SubmittedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Franchises",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SubmittedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateSubmitted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Franchises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Franchises_AspNetUsers_SubmittedById",
                        column: x => x.SubmittedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SubmittedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateSubmitted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Genres_AspNetUsers_SubmittedById",
                        column: x => x.SubmittedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MediaItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MediaTypeId = table.Column<int>(type: "INTEGER", nullable: false),
                    SubmittedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateSubmitted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    PublishedDateTime = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MediaItems_AspNetUsers_SubmittedById",
                        column: x => x.SubmittedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MediaItems_MediaTypes_MediaTypeId",
                        column: x => x.MediaTypeId,
                        principalTable: "MediaTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeriesItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SubmittedById = table.Column<string>(type: "TEXT", nullable: true),
                    DateSubmitted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeriesItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeriesItems_AspNetUsers_SubmittedById",
                        column: x => x.SubmittedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LinkCreatorToMediaItemTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CreatorId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkCreatorToMediaItemTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkCreatorToMediaItemTable_Creators_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "Creators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkCreatorToMediaItemTable_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkMediaItemToFranchiseTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FranchiseId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaItemId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkMediaItemToFranchiseTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToFranchiseTable_Franchises_FranchiseId",
                        column: x => x.FranchiseId,
                        principalTable: "Franchises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToFranchiseTable_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkMediaItemToGenreTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GenreId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaItemId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkMediaItemToGenreTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToGenreTable_Genres_GenreId",
                        column: x => x.GenreId,
                        principalTable: "Genres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToGenreTable_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkMediaItemToMediaListTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HostListId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkMediaItemToMediaListTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToMediaListTable_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToMediaListTable_MediaLists_HostListId",
                        column: x => x.HostListId,
                        principalTable: "MediaLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkMediaItemToSeriesItemTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MediaItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    SeriesItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    Position = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkMediaItemToSeriesItemTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToSeriesItemTable_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkMediaItemToSeriesItemTable_SeriesItems_SeriesItemId",
                        column: x => x.SeriesItemId,
                        principalTable: "SeriesItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LinkSeriesItemToFranchiseTable",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FranchiseId = table.Column<int>(type: "INTEGER", nullable: false),
                    SeriesItemId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LinkSeriesItemToFranchiseTable", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LinkSeriesItemToFranchiseTable_Franchises_FranchiseId",
                        column: x => x.FranchiseId,
                        principalTable: "Franchises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LinkSeriesItemToFranchiseTable_SeriesItems_SeriesItemId",
                        column: x => x.SeriesItemId,
                        principalTable: "SeriesItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Genres",
                columns: new[] { "Id", "DateSubmitted", "Description", "IsApproved", "Name", "SubmittedById" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Comedy", null },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Sitcom", null },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Action", null },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Sci-Fi", null },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, "Fantasy", null }
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Creators_SubmittedById",
                table: "Creators",
                column: "SubmittedById");

            migrationBuilder.CreateIndex(
                name: "IX_Franchises_SubmittedById",
                table: "Franchises",
                column: "SubmittedById");

            migrationBuilder.CreateIndex(
                name: "IX_Genres_SubmittedById",
                table: "Genres",
                column: "SubmittedById");

            migrationBuilder.CreateIndex(
                name: "IX_LinkCreatorToMediaItemTable_CreatorId",
                table: "LinkCreatorToMediaItemTable",
                column: "CreatorId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkCreatorToMediaItemTable_MediaItemId",
                table: "LinkCreatorToMediaItemTable",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToFranchiseTable_FranchiseId",
                table: "LinkMediaItemToFranchiseTable",
                column: "FranchiseId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToFranchiseTable_MediaItemId",
                table: "LinkMediaItemToFranchiseTable",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToGenreTable_GenreId",
                table: "LinkMediaItemToGenreTable",
                column: "GenreId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToGenreTable_MediaItemId",
                table: "LinkMediaItemToGenreTable",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToMediaListTable_HostListId",
                table: "LinkMediaItemToMediaListTable",
                column: "HostListId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToMediaListTable_MediaItemId",
                table: "LinkMediaItemToMediaListTable",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToSeriesItemTable_MediaItemId",
                table: "LinkMediaItemToSeriesItemTable",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkMediaItemToSeriesItemTable_SeriesItemId",
                table: "LinkMediaItemToSeriesItemTable",
                column: "SeriesItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkSeriesItemToFranchiseTable_FranchiseId",
                table: "LinkSeriesItemToFranchiseTable",
                column: "FranchiseId");

            migrationBuilder.CreateIndex(
                name: "IX_LinkSeriesItemToFranchiseTable_SeriesItemId",
                table: "LinkSeriesItemToFranchiseTable",
                column: "SeriesItemId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaItems_MediaTypeId",
                table: "MediaItems",
                column: "MediaTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaItems_SubmittedById",
                table: "MediaItems",
                column: "SubmittedById");

            migrationBuilder.CreateIndex(
                name: "IX_SeriesItems_SubmittedById",
                table: "SeriesItems",
                column: "SubmittedById");
        }
    }
}
