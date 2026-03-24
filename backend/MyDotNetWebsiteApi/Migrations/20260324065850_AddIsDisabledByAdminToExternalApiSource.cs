using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDisabledByAdminToExternalApiSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDisabledByAdmin",
                table: "ExternalApiSources",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 1,
                column: "IsDisabledByAdmin",
                value: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 2,
                column: "IsDisabledByAdmin",
                value: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 3,
                column: "IsDisabledByAdmin",
                value: false);

            migrationBuilder.UpdateData(
                table: "ExternalApiSources",
                keyColumn: "Id",
                keyValue: 4,
                column: "IsDisabledByAdmin",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDisabledByAdmin",
                table: "ExternalApiSources");
        }
    }
}
