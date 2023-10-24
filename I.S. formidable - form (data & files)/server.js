//Перед прочтением или изменением кода ознакомьтесь с лицензированием кода!!!!!!!!!!
//CC Attribution — Noncommercial — No Derivative Works (сокращённо CC BY-NC-ND) АКТ CC BY-NC-ND 4.0
//https://creativecommons.org/licenses/by-nc-nd/4.0/
//Creator - Spasky Ilya


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
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "text/javascript",
};

// Функция для отправки файлов
function sendFile(response, filePath, contentType) {
    fs.createReadStream(filePath).pipe(response);
}

// Функция для обработки регистрации
function handleRegistration(request, response) {
    if (request.method === "POST") {
        let body = "";
        request.on("data", (data) => {
            body += data;
        });
        request.on("end", () => {
            const data = {};
            body.split("&").forEach((pair) => {
                const [key, value] = pair.split("=");
                data[key] = decodeURIComponent(value);
            });

            const usersData = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
            const newUser = {
                id: usersData.users.length + 1,
                username: data.username,
                password: data.password,
                email: data.email,
                avatar: data.avatar || "",
                blocked: false,
            };
            usersData.users.push(newUser);
            fs.writeFileSync("./data/users.json", JSON.stringify(usersData, null, 4), "utf8");

            // Отправляем HTML-страницу с сообщением и JavaScript-кодом для перенаправления
            const registrationSuccessPage = `
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="refresh" content="5;url=index.html">
                    <title>Регистрация успешна</title>
                </head>
                <body>
                    <h1>Регистрация успешна</h1>
                    <p>Вы успешно зарегистрировались. Подождите, сейчас вы будете перенаправлены на главную страницу.</p>
                </body>
                </html>
            `;

            response.writeHead(200, { "Content-Type": "text/html" });
            response.end(registrationSuccessPage);
        });
    } else {
        response.writeHead(405, { "Content-Type": "text/plain" });
        response.end("Method Not Allowed");
    }
}


// Функция для обработки авторизации
function handleLogin(request, response) {
    if (request.method === "POST") {
        let body = "";
        request.on("data", (data) => {
            body += data;
        });
        request.on("end", () => {
            const formData = body.split("&").reduce((acc, item) => {
                const [key, value] = item.split("=");
                acc[key] = decodeURIComponent(value);
                return acc;
            }, {});

            const usersData = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
            const user = usersData.users.find((u) => u.username === formData.username && u.password === formData.password);

            if (user) {
                if (user.blocked) {
                    // Если пользователь заблокирован, возвращаем сообщение об этом
                    response.writeHead(401, { "Content-Type": "application/json" });
                    response.end(JSON.stringify({ message: "User is blocked" }));
                } else {
                    // В противном случае, возвращаем сообщение об успешной авторизации
                    // и выполняем перенаправление на index.html с всплывающим окном
                    response.writeHead(200, { "Content-Type": "text/html" });
                    response.end(`
                        <script>
                            alert("Login successful");
                            window.location.href = "/RegistrationForm.html";
                        </script>
                    `);
                }
            } else {
                // Если пользователь не найден, возвращаем сообщение об ошибке
                response.writeHead(401, { "Content-Type": "application/json" });
                response.end(JSON.stringify({ message: "Login failed" }));
            }
        });
    } else {
        response.writeHead(405, { "Content-Type": "text/plain" });
        response.end("Method Not Allowed");
    }
}


// Функция для обработки модерации
function handleModeration(request, response) {
    if (request.method === "POST") {
        let body = "";
        request.on("data", (data) => {
            body += data;
        });
        request.on("end", () => {
            const data = {};
            body.split("&").forEach((pair) => {
                const [key, value] = pair.split("=");
                data[key] = decodeURIComponent(value);
            });

            const usersData = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
            const userToModerate = usersData.users.find((u) => u.username === data.username || u.email === data.email);
            if (userToModerate) {
                if (data.action === "block") {
                    userToModerate.blocked = true;
                } else if (data.action === "delete") {
                    const index = usersData.users.indexOf(userToModerate);
                    if (index > -1) {
                        usersData.users.splice(index, 1);
                    }
                }

                fs.writeFileSync("./data/users.json", JSON.stringify(usersData, null, 4), "utf8");
                response.writeHead(200, { "Content-Type": "application/json" });
                response.end(JSON.stringify({ message: "Moderation successful" }));
            } else {
                response.writeHead(404, { "Content-Type": "application/json" });
                response.end(JSON.stringify({ message: "User not found" }));
            }
        });
    } else {
        response.writeHead(405, { "Content-Type": "text/plain" });
        response.end("Method Not Allowed");
    }
}

// Создаем HTTP-сервер
const server = http.createServer(function (request, response) {
    const url = request.url;

    switch (url) {
        case "/":
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
            sendFile(response, `./public${url}`, contentTypes[".html"]);
            break;

        case "/styles.css":
            sendFile(response, "./public/styles.css", contentTypes[".css"]);
            break;

        case "/register":
            handleRegistration(request, response);
            break;

        case "/login":
            handleLogin(request, response);
            break;

        case "/moderate":
            handleModeration(request, response);
            break;

        default:
            const filePath = path.join("./public", url.substring(1));
            fs.access(filePath, fs.constants.R_OK, (err) => {
                if (err) {
                    response.writeHead(404, {
                        "Content-Type": "text/html; charset=utf-8",
                    });
                    response.end("<h1>Not found</h1>");
                } else {
                    const extname = path.extname(filePath);
                    const contentType = contentTypes[extname] || "application/octet-stream";
                    response.writeHead(200, { "Content-Type": contentType });
                    sendFile(response, filePath, contentType);
                }
            });
    }
});

// Указываем порт и запускаем сервер
const port = 3000;
server.listen(port, function () {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});

    //node server.js 