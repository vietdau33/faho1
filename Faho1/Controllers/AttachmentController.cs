﻿using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
// ReSharper disable All

namespace Faho1.Controllers
{
    public class AttachmentController : Controller
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public AttachmentController(IHostingEnvironment hostingEnvironment) {
            this._hostingEnvironment = hostingEnvironment;
        }

        [HttpPost]
        public async Task<IActionResult> Upload(List<IFormFile> files) {
            if (!ModelState.IsValid) {
                return Ok(0);
            }

            var filesPath = $"{this._hostingEnvironment.WebRootPath}/uploads";
            var aryPath = new List<string>();
            CreateFolderIfNotExists(filesPath);

            foreach (var file in files) {
                var imageName = Path.GetFileName(file.FileName);
                imageName = buildNameFile(imageName);

                var fullFilePath = Path.Combine(filesPath, imageName);

                await using (var stream = new FileStream(fullFilePath, FileMode.Create)) {
                    await file.CopyToAsync(stream);
                }

                aryPath.Add("/uploads/" + imageName);
            }
            return Json(aryPath);
        }

        private static string buildNameFile(string fileName) {
            var currentDay = DateTime.Now.Month.ToString();
            var currentMonth = DateTime.Now.Month.ToString();
            var currentYear = DateTime.Now.Year.ToString();
            var milliseconds = DateTimeOffset.Now.ToUnixTimeMilliseconds();
            return currentYear + currentMonth + currentDay + "_" + milliseconds + "_" + fileName;
        }

        private static void CreateFolderIfNotExists(string path) {
            var exists = Directory.Exists(path);
            if (!exists) {
                Directory.CreateDirectory(path);
            }
        }

    }
}