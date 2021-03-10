using Microsoft.AspNetCore.Mvc;
// ReSharper disable once IdentifierTypo
namespace Faho1.Controllers {

    public class HomeController : Controller {

        public IActionResult Index() {
            return View();
        }

    }
}