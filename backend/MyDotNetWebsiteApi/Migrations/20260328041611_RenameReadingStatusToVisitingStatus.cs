using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyDotNetWebsiteApi.Migrations
{
    /// <inheritdoc />
    public partial class RenameReadingStatusToVisitingStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename the seeded VisitingStatus list names for all existing users
            migrationBuilder.Sql("UPDATE MediaLists SET Name = 'Want to Visit' WHERE Name = 'Want to Read' AND Category = 1");
            migrationBuilder.Sql("UPDATE MediaLists SET Name = 'Currently Visiting' WHERE Name = 'Currently Reading' AND Category = 1");
            migrationBuilder.Sql("UPDATE MediaLists SET Name = 'Visited' WHERE Name = 'Read' AND Category = 1");
            // "Did Not Finish" stays unchanged
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert list name renames
            migrationBuilder.Sql("UPDATE MediaLists SET Name = 'Want to Read' WHERE Name = 'Want to Visit' AND Category = 1");
            migrationBuilder.Sql("UPDATE MediaLists SET Name = 'Currently Reading' WHERE Name = 'Currently Visiting' AND Category = 1");
            migrationBuilder.Sql("UPDATE MediaLists SET Name = 'Read' WHERE Name = 'Visited' AND Category = 1");
        }
    }
}
