using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUsePosterApiToExternalApiSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UsePosterApi",
                table: "ExternalApiSources",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 1,
                column: "UsePosterApi",
                value: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 2,
                column: "UsePosterApi",
                value: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 3,
                column: "UsePosterApi",
                value: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 4,
                column: "UsePosterApi",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsePosterApi",
                table: "ExternalApiSources");
        }
    }
}
