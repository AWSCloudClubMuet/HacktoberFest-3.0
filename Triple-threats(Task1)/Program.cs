using Microsoft.EntityFrameworkCore;
using CampusGigPortal.Data;
// using CampusGigPortal.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// Database connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=(localdb)\\mssqllocaldb;Database=CampusGigPortalDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

// Keep DbContext registration enabled for EF Core migrations
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// MVC controllers and views
builder.Services.AddControllersWithViews();
//    .AddJsonOptions(options =>
//    {
//        options.JsonSerializerOptions.ReferenceHandler =
//            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
//    });

// Session-related services commented out
// builder.Services.AddHttpContextAccessor();
// builder.Services.AddDistributedMemoryCache();
// builder.Services.AddSession(options =>
// {
//     options.IdleTimeout = TimeSpan.FromHours(4);
//     options.Cookie.HttpOnly = true;
//     options.Cookie.IsEssential = true;
// });

// Custom user session service commented out
// builder.Services.AddScoped<IUserSessionService, UserSessionService>();

var app = builder.Build();

// Database seeding commented out
// using (var scope = app.Services.CreateScope())
// {
//     var services = scope.ServiceProvider;
//     try
//     {
//         var context = services.GetRequiredService<ApplicationDbContext>();
//         DbInitializer.Initialize(context);
//     }
//     catch (Exception ex)
//     {
//         var logger = services.GetRequiredService<ILogger<Program>>();
//         logger.LogError(ex, "An error occurred while seeding the database.");
//     }
// }

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Session middleware commented out
// app.UseSession();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Maps API endpoints
app.MapControllers();

app.Run();