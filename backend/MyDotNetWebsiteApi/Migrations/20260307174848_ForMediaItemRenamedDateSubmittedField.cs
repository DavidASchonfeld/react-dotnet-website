using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class ForMediaItemRenamedDateSubmittedField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SubmittedDateTime",
                table: "MediaItems",
                newName: "DateSubmitted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DateSubmitted",
                table: "MediaItems",
                newName: "SubmittedDateTime");
        }
    }
}
