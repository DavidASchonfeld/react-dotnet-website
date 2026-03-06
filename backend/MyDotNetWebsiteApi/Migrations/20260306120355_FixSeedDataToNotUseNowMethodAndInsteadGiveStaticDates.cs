using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class FixSeedDataToNotUseNowMethodAndInsteadGiveStaticDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 1,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 2,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 3,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 4,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 5,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 4,
                column: "DateSubmitted",
                value: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 1,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(310));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 2,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 3,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 4,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670));

            migrationBuilder.UpdateData(
                table: "Genres",
                keyColumn: "Id",
                keyValue: 5,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 561, DateTimeKind.Utc).AddTicks(670));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(730));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 2,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(1120));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 3,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(1120));

            migrationBuilder.UpdateData(
                table: "MediaTypes",
                keyColumn: "Id",
                keyValue: 4,
                column: "DateSubmitted",
                value: new DateTime(2026, 3, 6, 11, 57, 39, 560, DateTimeKind.Utc).AddTicks(1120));
        }
    }
}
