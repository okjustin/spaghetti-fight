using Microsoft.AspNetCore.Mvc;

namespace SpaghettiFight.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController :
  ControllerBase
{
  [HttpGet("ping")]
  public IActionResult Ping()
  {
    return Ok("pong");
  }
}