using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUseNonSearchQueryCacheFromExternalApiSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UseNonSearchQueryCache",
                table: "ExternalApiSources");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "UseNonSearchQueryCache",
                table: "ExternalApiSources",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

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
        }
    }
}
