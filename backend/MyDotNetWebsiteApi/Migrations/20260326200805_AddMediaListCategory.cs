using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaListCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add the new Category column (default 0 = Standard)
            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "MediaLists",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // Step 2: Migrate data — set Category from old IsFeatured and IsDefault values before dropping them

            // Featured lists (IsFeatured = 1) → Category = 3 (Featured)
            migrationBuilder.Sql("UPDATE MediaLists SET Category = 3 WHERE IsFeatured = 1;");

            // Reading status lists (IsDefault = 1 AND known name) → Category = 1 (ReadingStatus)
            migrationBuilder.Sql(
                "UPDATE MediaLists SET Category = 1 " +
                "WHERE IsDefault = 1 " +
                "AND Name IN ('Want to Read', 'Currently Reading', 'Read', 'Did Not Finish');");

            // Library list (IsDefault = 1 AND name is 'My Library') → Category = 2 (Library)
            migrationBuilder.Sql(
                "UPDATE MediaLists SET Category = 2 " +
                "WHERE IsDefault = 1 AND Name = 'My Library';");

            // Step 3: Drop the old columns now that data has been migrated
            migrationBuilder.DropColumn(
                name: "IsDefault",
                table: "MediaLists");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "MediaLists");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore the old boolean columns
            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                table: "MediaLists",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "MediaLists",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            // Restore data from Category back to the boolean columns
            migrationBuilder.Sql("UPDATE MediaLists SET IsFeatured = 1 WHERE Category = 3;");
            migrationBuilder.Sql(
                "UPDATE MediaLists SET IsDefault = 1 " +
                "WHERE Category IN (1, 2);"); // ReadingStatus and Library were both IsDefault

            // Drop the Category column
            migrationBuilder.DropColumn(
                name: "Category",
                table: "MediaLists");
        }
    }
}
