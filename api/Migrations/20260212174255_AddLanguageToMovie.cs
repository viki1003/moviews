using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace movie_tracker_api.Migrations
{
    /// <inheritdoc />
    public partial class AddLanguageToMovie : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Language",
                table: "Movies");
        }
    }
}
