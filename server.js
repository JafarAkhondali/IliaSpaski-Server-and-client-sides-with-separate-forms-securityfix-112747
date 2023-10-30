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

            // Проверка, существует ли пользователь с таким же логином
            const existingUser = usersData.users.find(user => user.username === data.username);

            if (existingUser) {
                // Если пользователь с таким логином уже существует, вернуть сообщение как подсказку
                const registrationHintPage = `
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <link rel="stylesheet" href="/style.css">
                        <title>Регистрация</title>
                    </head>
                    <body>
                        <div class="container">
                            <h1 class="error">Error</h1>
                            <p>Пользователь с логином '${data.username}' уже существует. Вы можете выбрать другой логин.</p>
                            <img src="/png/hiro.gif" alt="Гифка регистрации">
                        </div>
                    </body>
                    </html>
                `;
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(registrationHintPage);
                return;
            }

            if (data.password !== data.passwordRepeat) {
                // Если пароли не совпадают, вернуть ошибку
                const registrationHintPage = `
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <link rel="stylesheet" href="/style.css">
                        <title>Регистрация</title>
                    </head>
                    <body>
                        <div class="container">
                            <h1 class="error">Error</h1>
                            <p>Пароли не совпадают.</p>
                            <img src="/png/hiro.gif" alt="Гифка регистрации">
                        </div>
                    </body>
                    </html>
                `;
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end(registrationHintPage);
                return;
            }

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

            const registrationSuccessPage = `
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="refresh" content="5;url=index.html">
                        <title>Регистрация успешна</title>
                        <link rel="stylesheet" href="style.css">
                    </head>
                    <body>
                        <div class="container">
                            <h1>Регистрация успешна</h1>
                            <img src="/png/Register.gif" alt="Гифка регистрации">
                            <p>Вы успешно зарегистрировались. Подождите, сейчас вы будете перенаправлены на главную страницу.</p>
                        </div>
                    </body>
                    </html>
                `;
            response.writeHead(202, { "Content-Type": "text/html" });
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
                    // Если пользователь заблокирован
                    const blockedUserPage = `
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <title>Авторизация</title>
                        <link rel="stylesheet" href="style.css">
                    </head>
                    <body>
                        <div class="container">
                            <h1 class="error">Ошибка авторизации</h1>
                            <p>Ваш аккаунт заблокирован. Пожалуйста, свяжитесь с администратором для дополнительной информации.</p>
                            <img src="/png/hiro.gif" alt="Гифка регистрации">
                            <p>Через 5 секунд вы будете перенаправлены на главную страницу.</p>
                            <script>
                                setTimeout(function() {
                                    window.location.href = "/AuthorizationForm.html";
                                }, 5000);
                            </script>
                        </div>
                    </body>
                    </html>
                    `;

                    response.writeHead(401, { "Content-Type": "text/html" });
                    response.end(blockedUserPage);
                } else {
                    const AuthorizationOk = `
                        <!DOCTYPE html>
                        <html lang="ru">
                        <head>
                            <meta charset="UTF-8">
                            <title>Авторизация</title>
                            <link rel="stylesheet" href="style.css">
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="ok">Login successful</h1>
                                <img src="/png/Register.gif" alt="Гифка регистрации">
                                <p>Через 5 секунд вы будете перенаправлены на главную страницу.</p>
                                <script>
                                    setTimeout(function() {
                                        window.location.href = "/main.html";
                                    }, 5000);
                                </script>
                            </div>
                        </body>
                        </html>
                    `;

                    response.writeHead(200, { "Content-Type": "text/html" });
                    response.end(AuthorizationOk);
                }
            } else {
                const AuthorizationHintPage = `
                        <!DOCTYPE html>
                        <html lang="ru">
                        <head>
                            <meta charset="UTF-8">
                            <title>Авторизация</title>
                            <link rel="stylesheet" href="style.css">
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="error">Ошибка авторизации</h1>
                                <p>Логин или пароль неверны. Пожалуйста, проверьте введенные данные и попробуйте снова.</p>
                                <img src="/png/hiro.gif" alt="Гифка регистрации">
                                <p>Через 5 секунд вы будете перенаправлены на страницу авторизации.</p>
                                <script>
                                    setTimeout(function() {
                                        window.location.href = "/AuthorizationForm.html";
                                    }, 5000);
                                </script>
                            </div>
                        </body>
                        </html>
                    `;

                response.writeHead(401, { "Content-Type": "text/html" });
                response.end(AuthorizationHintPage);

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

const port = 3000;
server.listen(port, function () {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});

//node server.js 