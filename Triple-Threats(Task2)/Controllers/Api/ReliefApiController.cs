using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReliefHub.Data;
using ReliefHub.Models;
using ReliefHub.Models.DTOs;

namespace ReliefHub.Controllers.Api
{
    [ApiController]
    [Route("api")]
    public class ReliefApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReliefApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/camps
        [HttpGet("camps")]
        public async Task<IActionResult> GetCamps() => Ok(await _context.Camps.ToListAsync());

        // POST /api/camps
        [HttpPost("camps")]
        public async Task<IActionResult> CreateCamp([FromBody] CreateCampDto dto)
        {
            var camp = new Camp
            {
                Name = dto.Name,
                District = dto.District,
                Capacity = dto.Capacity,
                CurrentFamilies = dto.CurrentFamilies,
                Status = dto.CurrentFamilies >= dto.Capacity ? "Full" : dto.Status
            };
            _context.Camps.Add(camp);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCamps), new { id = camp.Id }, camp);
        }

        // GET /api/inventory
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory() => Ok(await _context.Inventory.ToListAsync());

        // GET /api/needs
        [HttpGet("needs")]
        public async Task<IActionResult> GetNeeds() => Ok(await _context.Needs.Include(n => n.Camp).Include(n => n.InventoryItem).ToListAsync());

        // POST /api/needs
        [HttpPost("needs")]
        public async Task<IActionResult> CreateNeed([FromBody] CreateNeedDto dto)
        {
            var need = new Need
            {
                CampId = dto.CampId,
                InventoryItemId = dto.InventoryItemId,
                RequiredQuantity = dto.RequiredQuantity,
                Priority = dto.Priority,
                FulfilledQuantity = 0
            };
            _context.Needs.Add(need);
            await _context.SaveChangesAsync();
            return Ok(need);
        }

        // GET /api/dispatches
        [HttpGet("dispatches")]
        public async Task<IActionResult> GetDispatches() => Ok(await _context.Dispatches.ToListAsync());

        // POST /api/dispatches
        [HttpPost("dispatches")]
        public async Task<IActionResult> CreateDispatch([FromBody] CreateDispatchDto dto)
        {
            var need = await _context.Needs.Include(n => n.InventoryItem).Include(n => n.Dispatches).FirstOrDefaultAsync(n => n.Id == dto.NeedId);
            if (need?.InventoryItem == null || dto.Quantity > need.InventoryItem.Stock || dto.Quantity > need.RemainingUnreservedQuantity)
            {
                return BadRequest(new { message = "Invalid dispatch quantity or insufficient stock." });
            }

            need.InventoryItem.Stock -= dto.Quantity;
            var dispatch = new Dispatch { CampId = dto.CampId, NeedId = dto.NeedId, Quantity = dto.Quantity, Status = "Pending" };
            _context.Dispatches.Add(dispatch);
            await _context.SaveChangesAsync();
            return Ok(dispatch);
        }

        // GET /api/donations
        [HttpGet("donations")]
        public async Task<IActionResult> GetDonations() => Ok(await _context.Donations.ToListAsync());

        // GET /api/volunteers
        [HttpGet("volunteers")]
        public async Task<IActionResult> GetVolunteers() => Ok(await _context.Volunteers.ToListAsync());
    }
}