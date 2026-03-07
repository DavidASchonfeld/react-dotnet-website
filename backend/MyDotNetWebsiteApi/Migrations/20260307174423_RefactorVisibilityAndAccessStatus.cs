using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class RefactorVisibilityAndAccessStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AccessStatus",
                table: "MediaLists",
                newName: "VisibilityStatus");

            migrationBuilder.RenameColumn(
                name: "AccessStatus",
                table: "MediaItems",
                newName: "IsApproved");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VisibilityStatus",
                table: "MediaLists",
                newName: "AccessStatus");

            migrationBuilder.RenameColumn(
                name: "IsApproved",
                table: "MediaItems",
                newName: "AccessStatus");
        }
    }
}
