//Перед прочтением или изменением кода ознакомьтесь с лицензированием кода!!!!!!!!!!
//CC Attribution — Noncommercial — No Derivative Works (сокращённо CC BY-NC-ND) АКТ CC BY-NC-ND 4.0
//https://creativecommons.org/licenses/by-nc-nd/4.0/
//Creator - Spasky Ilya


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

// Функция для обработки ошибок
function handleError(response, statusCode, message) {
    response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<h1>${statusCode} - ${message}</h1>`);
}

// Функция для создания HTML-страницы с сообщением
function createMessagePage(title, message, isSuccess, redirectUrl = "/main.html",) {
    const titleClass = isSuccess ? "ok" : "error";
    const imageSrc = isSuccess ? "/png/Register.gif" : "/png/hiro.gif";

    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <link rel="stylesheet" href="style.css">
            <style>
                .${titleClass} {
                    font-family: Arial, sans-serif;
                    text-decoration: none;
                    color: ${isSuccess ? "chartreuse" : "#ff0000"};
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="${titleClass}">${title}</h1>
                <p>${message}</p>
                <img src="${imageSrc}" alt="Гифка регистрации">
                <p>Через 5 секунд вы будете перенаправлены на страницу.</p>
                <script>
                    setTimeout(function() {
                        window.location.href = "${redirectUrl}";
                    }, 5000);
                </script>
            </div>
        </body>
        </html>
    `;
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
            const existingUser = usersData.users.find(user => user.username === data.username);
            const existingUserMail = usersData.users.find(user => user.email === data.email);

            if (existingUser) {
                const page = createMessagePage("Error", `Пользователь с логином '${data.username}' уже существует. Вы можете выбрать другой логин.`, false);
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(page);
                return;
            }

            if (existingUserMail) {
                const page = createMessagePage("Error", `Пользователь с почтой '${data.email}' уже существует.`, false);
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(page);
                return;
            }

            if (data.password !== data.passwordRepeat) {
                const page = createMessagePage("Error", "Пароли не совпадают.", false);
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(page);
                return;
            }

            const randomPassmoder = Math.random().toString(36).substring(2, 10);
            const newUser = {
                id: usersData.users.length + 1,
                username: data.username,
                password: data.password,
                email: data.email,
                avatar: data.avatar || "",
                blocked: false,
                moder: data.moder || false,
                passmoder: randomPassmoder,
            };

            usersData.users.push(newUser);
            fs.writeFileSync("./data/users.json", JSON.stringify(usersData, null, 4), "utf8");

            const successPage = createMessagePage("Регистрация успешна", "Вы успешно зарегистрировались.", true);
            response.writeHead(202, { "Content-Type": "text/html" });
            response.end(successPage);
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
                    const blockedPage = createMessagePage("Ошибка авторизации", "Ваш аккаунт заблокирован. Пожалуйста, свяжитесь с администратором для дополнительной информации.", false, "/AuthorizationForm.html");
                    response.writeHead(401, { "Content-Type": "text/html" });
                    response.end(blockedPage);
                } else {
                    const successPage = createMessagePage("Login successful", "Вы успешно авторизовались.", true);
                    response.writeHead(200, { "Content-Type": "text/html" });
                    response.end(successPage);
                }
            } else {
                const errorPage = createMessagePage("Ошибка авторизации", "Логин или пароль неверны. Пожалуйста, проверьте введенные данные и попробуйте снова.", false, "/AuthorizationForm.html");
                response.writeHead(401, { "Content-Type": "text/html" });
                response.end(errorPage);
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
            const moderator = usersData.users.find(
                (user) =>
                    user.username === data.moderatorUsername &&
                    user.passmoder === data.moderatorPassword &&
                    user.moder
            );

            if (moderator) {
                const userToModerate = usersData.users.find(
                    (user) =>
                        user.username === data.username || user.email === data.email
                );

                if (userToModerate) {
                    if (data.action === "delete") {
                        const index = usersData.users.indexOf(userToModerate);
                        if (index > -1) {
                            usersData.users.splice(index, 1);
                            fs.writeFileSync("./data/users.json", JSON.stringify(usersData, null, 4), "utf8");
                            const moderationOkPage = createMessagePage("Успешно", "Пользователь успешно удален.", true);
                            response.writeHead(200, { "Content-Type": "text/html" });
                            response.end(moderationOkPage);
                        } else {
                            const notFoundPage = createMessagePage("Пользователь не найден", "Пользователь не найден.", false);
                            response.writeHead(404, { "Content-Type": "text/html" });
                            response.end(notFoundPage);
                        }
                    } else if (data.action === "block") {
                        userToModerate.blocked = true;
                        fs.writeFileSync("./data/users.json", JSON.stringify(usersData, null, 4), "utf8");
                        const moderationOkPage = createMessagePage("Успешно", "Пользователь успешно заблокирован.", true);
                        response.writeHead(200, { "Content-Type": "text/html" });
                        response.end(moderationOkPage);
                    } else {
                        response.writeHead(400, { "Content-Type": "text/html" });
                        response.end("Bad Request");
                    }
                } else {
                    const notFoundPage = createMessagePage("Пользователь не найден", "Пользователь не найден.", false);
                    response.writeHead(404, { "Content-Type": "text/html" });
                    response.end(notFoundPage);
                }
            } else {
                const accessDeniedPage = createMessagePage("Нет прав", "У вас нет прав доступа.", false, "/main.html");
                response.writeHead(403, { "Content-Type": "text/html" });
                response.end(accessDeniedPage);
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
        case "/main.html":
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
                    handleError(response, 404, "Not Found");
                } else {
                    const extname = path.extname(filePath);
                    const contentType = contentTypes[extname] || "application/octet-stream";
                    response.writeHead(200, { "Content-Type": contentType });
                    sendFile(response, filePath, contentType);
                }
            });
    }
});

const port = 3000;
server.listen(port, function () {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});

//node server.js 

