using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSubtypeToMediaApiRef : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Subtype",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Subtype",
                table: "MediaApiRefs");
        }
    }
}
