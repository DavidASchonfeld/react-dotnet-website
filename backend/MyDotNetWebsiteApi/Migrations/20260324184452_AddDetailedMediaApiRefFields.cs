using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddDetailedMediaApiRefFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DetailsFetchedAt",
                table: "MediaApiRefs",
                type: "TEXT",
                nullable: true);

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
                name: "Poster",
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Country",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "DetailsFetchedAt",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Genres",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Plot",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Poster",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Rated",
                table: "MediaApiRefs");

            migrationBuilder.DropColumn(
                name: "Runtime",
                table: "MediaApiRefs");
        }
    }
}
