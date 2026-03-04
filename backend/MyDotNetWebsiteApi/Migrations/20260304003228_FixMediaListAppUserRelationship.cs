using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class FixMediaListAppUserRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MediaLists_AspNetUsers_AppUserId",
                table: "MediaLists");

            migrationBuilder.DropIndex(
                name: "IX_MediaLists_AppUserId",
                table: "MediaLists");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "MediaLists");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppUserId",
                table: "MediaLists",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MediaLists_AppUserId",
                table: "MediaLists",
                column: "AppUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_MediaLists_AspNetUsers_AppUserId",
                table: "MediaLists",
                column: "AppUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
