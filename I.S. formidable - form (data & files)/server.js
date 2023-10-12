//Перед прочтением или изменением кода ознакомьтесь с лицензированием кода!!!!!!!!!!
//CC Attribution — Noncommercial — No Derivative Works (сокращённо CC BY-NC-ND) АКТ CC BY-NC-ND 4.0
//https://creativecommons.org/licenses/by-nc-nd/4.0/
//Creator - Spasky Ilya


//Реализовать отображение любой HTML-страницы из ваших прошлых тасок из предмета HTML+CSS из прошлого года с сервера

// Подключаем необходимые модули Node.js
const http = require("http");
const fs = require("fs");
const path = require("path");

// MIME-типы файлов, используемые для отправки в HTTP-ответе
const contentTypes = {
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
};



// Создаем HTTP-сервер
const server = http.createServer(function (request, response) {
    console.log(`Url: ${request.url}`);

    switch (request.url) {
        case "/":
            // Если URL - "/", выполняется перенаправление на "/index.html"
            response.writeHead(301, {
                Location: "/index.html",
                "Content-Type": "text/html; charset=utf-8",
            });
            response.end();
            break;


        case "/index.html":
        case "/RegistrationForm.html":
        case "/AuthorizationForm.html":
        case "/ModerationForm.html":
            // Обрабатываем запросы к HTML-страницам
            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            const htmlContent = fs.readFileSync(`./public${request.url}`, "utf8");
            response.end(htmlContent);
            break;

        case "/styles.css":
            // Обрабатываем запрос к файлу стилей CSS
            response.writeHead(200, { "Content-Type": "text/css" });
            const cssContent = fs.readFileSync("./public/styles.css", "utf8");
            response.end(cssContent);
            break;

        default:
            // Если URL не соответствует вышеуказанным, пытаемся найти и отправить соответствующий файл
            const filePath = path.join("./public", request.url.substring(1));
            console.log(filePath);

            fs.access(filePath, fs.constants.R_OK, (err) => {
                if (err) {
                    // Если файл не найден, отправляем ошибку 404
                    response.writeHead(404, {
                        "Content-Type": "text/html; charset=utf-8",
                    });
                    response.end("<h1>Not found</h1>");
                } else {
                    // Если файл найден, определяем его MIME-тип и отправляем его содержимое
                    const extname = path.extname(filePath);
                    const contentType =
                        contentTypes[extname] || "application/octet-stream";

                    response.writeHead(200, {
                        "Content-Type": contentType,
                    });
                    fs.createReadStream(filePath).pipe(response);
                }
            });
    }
});

// Указываем порт, на котором будет работать сервер, и запускаем его
const port = 3000;
server.listen(port, function () {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});


//node server.js 