using CampusGigPortal.Models;
using CampusGigPortal.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusGigPortal.Services
{
    public interface IUserSessionService
    {
        int GetCurrentUserId();
        void SetCurrentUserId(int userId);
        Task<User> GetCurrentUserAsync();
        Task<List<User>> GetAllUsersAsync();
    }

    public class UserSessionService : IUserSessionService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApplicationDbContext _context;
        private const string SessionKey = "CURRENT_USER_ID";
        private const int DefaultUserId = 1;

        public UserSessionService(IHttpContextAccessor httpContextAccessor, ApplicationDbContext context)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
        }

        public int GetCurrentUserId()
        {
            var session = _httpContextAccessor.HttpContext?.Session;
            var storedId = session?.GetInt32(SessionKey);
            if (storedId.HasValue && storedId.Value > 0)
            {
                return storedId.Value;
            }

            var cookie = _httpContextAccessor.HttpContext?.Request.Cookies["CampusUserSession"];
            if (!string.IsNullOrEmpty(cookie) && int.TryParse(cookie, out var cookieId))
            {
                session?.SetInt32(SessionKey, cookieId);
                return cookieId;
            }

            return DefaultUserId;
        }

        public void SetCurrentUserId(int userId)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            httpContext?.Session.SetInt32(SessionKey, userId);
            httpContext?.Response.Cookies.Append("CampusUserSession", userId.ToString(), new CookieOptions
            {
                Expires = DateTimeOffset.UtcNow.AddDays(7),
                IsEssential = true
            });
        }

        public async Task<User> GetCurrentUserAsync()
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users
                .Include(u => u.GigsPosted)
                .Include(u => u.GigsAccepted)
                .Include(u => u.ReviewsReceived)
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user ?? await _context.Users.FirstAsync();
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users.OrderBy(u => u.Name).ToListAsync();
        }
    }
}